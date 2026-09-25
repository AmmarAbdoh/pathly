/**
 * Goals context provider
 * Manages global goal state and operations.
 *
 * Performance contract (see CLAUDE.md):
 *  - Every mutator goes through `commit`, which applies a pure updater to the
 *    latest goals, renders once, and schedules a debounced save. Mutators never
 *    close over `goals`, so their identity is stable for the life of the provider.
 *  - A mutation that cascades (subgoal -> parent -> grandparent) produces a
 *    single state update and a single write, not one per level.
 */

import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { Goal, GoalDirection, GoalSchedule, TimePeriod } from '@/src/types';
import { calculateGoalProgress, calculateProgress } from '@/src/utils/goal-calculations';
import { nextId } from '@/src/utils/ids';
import { deriveLifetimePoints } from '@/src/utils/import-data';
// Static on purpose. notifications.ts registers the foreground-display handler
// as a module side effect; loading it lazily meant a reminder arriving while
// the app was open went unshown until something else happened to import it
// (opening a goal's detail screen). This provider mounts at startup. Metro
// resolves a dynamic import() from the same bundle anyway, so laziness bought
// nothing on native.
import {
  cancelGoalNotifications,
  NotificationPermissionError,
  scheduleGoalNotification,
  type ReminderText,
} from '@/src/utils/notifications';
import { goalsStorage, setAsideUnreadable, UnreadableDataError } from '@/src/utils/storage';
import { useSerialQueue } from '@/src/hooks/use-serial-queue';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import {
  canRecur,
  hasBeenCompleted,
  processRecurringGoals,
  recordCompletion,
  resetGoal,
  updateGoalStreaks,
} from '../utils/recurring-goals';

/**
 * How long to wait after the last mutation before writing to AsyncStorage.
 *
 * Long enough to coalesce a burst (tapping +1 repeatedly, dragging a slider),
 * short enough that a backgrounded app has almost certainly flushed. The
 * AppState listener below flushes early on background regardless.
 */
const SAVE_DEBOUNCE_MS = 400;

/**
 * A persistence problem the user needs to know about.
 *
 *  - `save`: a write to storage failed. The data is still queued and in
 *    memory; it is retried on the next flush or via `retryStorage`.
 *  - `load`: reading storage failed. Saving is blocked until a reload succeeds,
 *    because the in-memory goals are not the user's real data and writing them
 *    would replace everything on disk.
 *
 * Stored data that could not be used at all is reported by `dataSetAside`.
 */
export type StorageError = 'save' | 'load';

/**
 * A goal change refused because an import is running: it would be built on
 * goals the import is about to replace (see withGoalsHeld).
 */
export class GoalsBusyError extends Error {
  constructor() {
    super('An import is in progress');
    this.name = 'GoalsBusyError';
  }
}

/** What rescheduleReminders could not do, for the screen to report. */
export interface RescheduleOutcome {
  /** Goals whose reminders failed part-way, and were turned off. */
  turnedOff: number;
  /** Goals left with their old reminders: notifications are not allowed. */
  notAllowed: number;
}

/**
 * Called when a goal is completed for the first time, however that happened,
 * with the lifetime total after its points were awarded.
 */
export type GoalCompletedListener = (goal: Goal, lifetimePoints: number) => void | Promise<void>;

/**
 * Whether goals storage has been read. Until it has ('pending'), and after a
 * failed read ('failed'), the goals in memory are not the user's, and writing
 * them would replace everything on disk: every write is held.
 */
type LoadState = 'pending' | 'loaded' | 'failed';

/**
 * Period rollovers and streaks: what a load applies to stored goals.
 *
 * Goal by goal, so one malformed record cannot stop the rest from loading.
 */
function rollOver(goals: Goal[]): Goal[] {
  return goals.map((goal) => {
    try {
      const [processed] = processRecurringGoals([goal]);
      return processed.isRecurring ? updateGoalStreaks(processed) : processed;
    } catch (err) {
      console.error('Error processing goal', goal.id, err);
      return goal;
    }
  });
}

interface GoalsContextType {
  goals: Goal[];
  lifetimePointsEarned: number;
  isLoading: boolean;
  error: string | null;
  /** Set when data could not be saved or loaded; shown by StorageErrorBanner. */
  storageError: StorageError | null;
  /**
   * Stored goals could not be used (not a goals list): they were kept aside
   * under another key and the app started without them. Nothing to retry -
   * retrying cannot repair it, and blocking on it left no way forward but
   * clearing the app's data. Its own flag, so that a save failing and then
   * working, or a Retry, cannot clear it unseen; dismissStorageError does.
   */
  dataSetAside: boolean;
  /** Retry whatever failed: re-save pending data, or reload after a failed load. */
  retryStorage: () => Promise<void>;
  dismissStorageError: () => void;
  /**
   * The goals and lifetime total as they are right now, for building an
   * import. Throws unless the goals have loaded.
   */
  getCurrentGoals: () => { goals: Goal[]; lifetimePoints: number };
  /**
   * Replace every goal and the lifetime total at once (backup import).
   * Rejects if the goals have not loaded or cannot be written, leaving the
   * current data untouched.
   */
  replaceAllGoals: (goals: Goal[], lifetimePoints: number) => Promise<void>;
  /**
   * Run a backup import's `task` with the goals to itself: goal changes are
   * refused (GoalsBusyError) until it is done, and reminder changes wait their
   * turn. Made during an import, a change was built on goals it was about to
   * replace: an edit was lost, a completion left its reward redeemed, and
   * reminders were scheduled that nothing kept.
   */
  withGoalsHeld: <T>(task: () => Promise<T>) => Promise<T>;
  /**
   * Subscribe to goals being completed for the first time. Returns the
   * unsubscribe function, so it can be returned straight from an effect.
   *
   * RewardsContext uses this to auto-redeem a goal's linked reward. It sits
   * below this provider, so this provider cannot call it directly - and
   * writing rewards storage from here left RewardsContext holding stale data
   * that its next save wrote back, un-redeeming the reward.
   */
  onGoalCompleted: (listener: GoalCompletedListener) => () => void;
  addGoal: (
    title: string,
    target: number,
    current: number,
    unit: string,
    direction: GoalDirection,
    points: number,
    period: TimePeriod,
    customPeriodDays?: number,
    parentId?: number,
    isUltimate?: boolean,
    isRecurring?: boolean,
    description?: string,
    icon?: string,
    linkedRewardId?: number,
    subgoalsAwardPoints?: boolean,
    schedule?: GoalSchedule
  ) => Promise<void>;
  addSubgoal: (
    parentId: number,
    title: string,
    target: number,
    current: number,
    unit: string,
    direction: GoalDirection,
    points: number,
    period: TimePeriod,
    customPeriodDays?: number,
    description?: string,
    icon?: string,
    linkedRewardId?: number
  ) => Promise<void>;
  updateGoal: (id: number, current: number) => Promise<void>;
  editGoal: (
    id: number,
    title: string,
    target: number,
    current: number,
    unit: string,
    direction: GoalDirection,
    points: number,
    period: TimePeriod,
    customPeriodDays?: number,
    isUltimate?: boolean,
    isRecurring?: boolean,
    description?: string,
    icon?: string,
    linkedRewardId?: number,
    subgoalsAwardPoints?: boolean,
    schedule?: GoalSchedule
  ) => Promise<void>;
  finishGoal: (id: number) => Promise<void>;
  removeGoal: (id: number) => Promise<void>;
  archiveGoal: (id: number) => Promise<void>;
  unarchiveGoal: (id: number) => Promise<void>;
  permanentlyDeleteGoal: (id: number) => Promise<void>;
  extendDeadline: (id: number, additionalDays: number) => Promise<void>;
  togglePause: (id: number) => Promise<void>;
  /**
   * Start a recurring goal's next period now - what happens on its own when a
   * period ends: a completion goes into its history, progress starts over.
   */
  resetRecurringGoal: (id: number) => Promise<void>;
  /**
   * Schedule enabled reminders again with `text` - their wording is fixed when
   * they are scheduled. After a language change (every goal), or a rename
   * (just that one, `goalId`). Resolves to what it could not do.
   */
  rescheduleReminders: (text: ReminderText, goalId?: number) => Promise<RescheduleOutcome>;
  refreshGoals: () => Promise<void>;
  getSubgoals: (parentId: number) => Goal[];
  recalculateProgress: (goalId: number) => Promise<void>;
  reorderGoals: (goalIds: number[]) => Promise<void>;
  addNote: (goalId: number, text: string) => Promise<void>;
  deleteNote: (goalId: number, noteId: string) => Promise<void>;
  addDependency: (goalId: number, dependsOnId: number) => Promise<void>;
  removeDependency: (goalId: number, dependsOnId: number) => Promise<void>;
  checkDependencies: (goalId: number) => boolean;
  updateNotificationSettings: (
    goalId: number,
    enabled: boolean,
    /** The reminder's wording, in the user's language. */
    text: ReminderText,
    time?: number,
    days?: number[]
  ) => Promise<void>;
}

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

/**
 * Recalculate `startId`'s progress and propagate it up the parent chain.
 *
 * Pure: returns a new array only if something actually changed, so an
 * unnecessary re-render is avoided when progress is already correct.
 */
function applyProgressRecalc(list: Goal[], startId: number): Goal[] {
  let next = list;
  let currentId: number | undefined = startId;
  const visited = new Set<number>();

  while (currentId !== undefined && !visited.has(currentId)) {
    visited.add(currentId);

    const goal = next.find((g) => g.id === currentId);
    if (!goal) break;

    const newProgress = calculateGoalProgress(goal, next);
    if (newProgress !== goal.progress) {
      const targetId = currentId;
      next = next.map((g) => (g.id === targetId ? { ...g, progress: newProgress } : g));
    }

    currentId = goal.parentId;
  }

  return next;
}

/**
 * Switch off the reminders of archived goals, and say which ids to cancel.
 * Archiving does this now; goals archived before it did kept theirs, firing
 * for a goal the user had put away - and nothing else would ever cancel them.
 */
function archivedRemindersOff(goals: Goal[]): { goals: Goal[]; cancel: string[] } {
  const cancel: string[] = [];
  const next = goals.map((goal) => {
    if (!goal.isArchived || (!goal.notificationsEnabled && !goal.notificationIds?.length)) return goal;
    cancel.push(...(goal.notificationIds ?? []));
    return { ...goal, notificationsEnabled: false, notificationIds: [] };
  });
  return { goals: next, cancel };
}

/**
 * The scheduled reminders of a goal and of the subgoals that archiving or
 * deleting it takes along.
 */
function reminderIdsOf(list: Goal[], id: number): string[] {
  const goal = list.find((g) => g.id === id);
  if (!goal) return [];
  const ids = new Set([id, ...(goal.subGoals || [])]);
  return list.flatMap((g) => (ids.has(g.id) ? g.notificationIds ?? [] : []));
}

/**
 * Whether what a load applies (rollOver, archivedRemindersOff) changed
 * anything. Each hands back a goal it left alone as it was, so identity tells,
 * for every field: a hand-kept list of fields missed each one added later, and
 * the change was never saved.
 */
function hasGoalDataChanged(before: Goal[], after: Goal[]): boolean {
  return before.length !== after.length || after.some((goal, i) => goal !== before[i]);
}

interface GoalsProviderProps {
  children: ReactNode;
}

/**
 * Goals Provider Component
 * Wraps the app to provide goals context to all children
 */
export function GoalsProvider({ children }: GoalsProviderProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [lifetimePointsEarned, setLifetimePointsEarned] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<StorageError | null>(null);
  const [dataSetAside, setDataSetAside] = useState(false);

  const loadStateRef = useRef<LoadState>('pending');
  /**
   * True while an import is being written. Queued saves wait, so none can
   * land on top of it.
   */
  const importingRef = useRef(false);
  /** True when the last lifetime-points write failed and needs retrying. */
  const lifetimeDirtyRef = useRef(false);

  /**
   * Synchronous mirror of `goals`.
   *
   * State updates are async, but mutators need to read the current goals to
   * compute the next ones. Reading from a ref that `commit` updates
   * synchronously keeps back-to-back mutations correct without any mutator
   * having to depend on `goals`.
   */
  const goalsRef = useRef<Goal[]>([]);
  const lifetimePointsRef = useRef(0);

  /** True while an import runs (withGoalsHeld): goal changes are refused. */
  const heldRef = useRef(false);

  /**
   * Reminder changes, one at a time. Two at once each started from the same
   * stored ids, and whichever finished first won: switching language twice
   * quickly could leave every reminder in the one switched away from.
   */
  const reminderQueue = useSerialQueue();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<Goal[] | null>(null);

  /**
   * Write the current lifetime points. Returns whether it succeeded, and marks
   * them for a retry on the next flush if not.
   */
  const persistLifetime = useCallback(async (): Promise<boolean> => {
    // Before a successful load the in-memory total counts up from 0, not from
    // the user's real total. Writing it would replace that for good, so it is
    // held, and dropped by the reload along with the goals. Not marked dirty:
    // a dirty total is trusted over disk on reload.
    if (loadStateRef.current !== 'loaded') return false;

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.LIFETIME_POINTS,
        lifetimePointsRef.current.toString()
      );
      lifetimeDirtyRef.current = false;
      return true;
    } catch (err) {
      console.error('Error saving lifetime points:', err);
      lifetimeDirtyRef.current = true;
      return false;
    }
  }, []);

  /**
   * Write any pending goals (and unsaved lifetime points) to storage now.
   *
   * A failed write used to be logged and dropped: the data stayed in memory but
   * never reached disk, and nothing told the user. Now it stays queued for the
   * next flush and raises `storageError`, which the app shows with a Retry.
   *
   * Returns whether everything is on disk.
   */
  const flushSave = useCallback(async (): Promise<boolean> => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    // Until goals have loaded the in-memory goals are not the user's real
    // data. Writing them would replace everything on disk, so hold the write
    // (it stays queued) until a load succeeds. After a failed load, say so
    // again whenever something is being held: the banner may have been
    // dismissed, and edits must not go unsaved without the user knowing.
    //
    // Also hold while an import is being written, or this write could land
    // after it and undo it.
    if (loadStateRef.current !== 'loaded' || importingRef.current) {
      if (loadStateRef.current === 'failed' && pendingSave.current) setStorageError('load');
      return false;
    }

    let ok = true;

    const toSave = pendingSave.current;
    pendingSave.current = null;
    if (toSave) {
      try {
        await goalsStorage.saveGoals(toSave);
      } catch (err) {
        console.error('Error saving goals:', err);
        setError('Failed to save goals');
        // Keep it queued for the next flush, unless newer state arrived meanwhile.
        if (!pendingSave.current) {
          pendingSave.current = toSave;
        }
        ok = false;
      }
    }

    if (lifetimeDirtyRef.current && !(await persistLifetime())) {
      ok = false;
    }

    setStorageError((prev) => (ok ? (prev === 'save' ? null : prev) : 'save'));
    return ok;
  }, [persistLifetime]);

  /**
   * Queue a debounced write.
   */
  const scheduleSave = useCallback(
    (next: Goal[]) => {
      pendingSave.current = next;

      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
      }

      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        void flushSave();
      }, SAVE_DEBOUNCE_MS);
    },
    [flushSave]
  );

  /**
   * Apply a pure updater to the current goals, render once, persist once.
   *
   * Returns the resulting array so callers can inspect what changed without a
   * second pass over state. Refuses while an import holds the goals (use
   * `apply` for the import's own changes).
   */
  const apply = useCallback(
    (updater: (prev: Goal[]) => Goal[]): Goal[] => {
      const next = updater(goalsRef.current);

      if (next === goalsRef.current) {
        return next;
      }

      goalsRef.current = next;
      setGoals(next);
      scheduleSave(next);
      return next;
    },
    [scheduleSave]
  );

  const commit = useCallback(
    (updater: (prev: Goal[]) => Goal[]): Goal[] => {
      if (heldRef.current) throw new GoalsBusyError();
      return apply(updater);
    },
    [apply]
  );

  /**
   * Load goals from storage and process recurring goals
   */
  const loadGoals = useCallback(async () => {
    setError(null);

    let savedGoals: Goal[];
    let goalsWithStreaks: Goal[];
    let setAside = false;
    let lifetimeNeedsWrite = false;
    let staleReminders: string[] = [];
    try {
      // Only the reads count as a failed load. A write the load itself implies
      // (a period rollover, the first lifetime total) used to fail the whole
      // load too, hiding goals that had been read perfectly well.
      let unreadable: UnreadableDataError | null = null;
      try {
        savedGoals = await goalsStorage.loadGoals();
      } catch (err) {
        // A read that failed may work next time: a failed load, with Retry.
        // Data that was read but cannot be used never will, so keep it aside
        // (below) and start from no goals rather than block the app for good.
        if (!(err instanceof UnreadableDataError)) throw err;
        unreadable = err;
        savedGoals = [];
      }

      // An unsaved total in memory is newer than disk: its write failed and is
      // queued for retry. Reading disk here would roll it back, and the retry
      // would then persist the stale value - losing points for good.
      const savedLifetimePoints = lifetimeDirtyRef.current
        ? null
        : await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS);

      // Only once every read has worked. Keeping the goals aside removes them,
      // so a read failing after it made a failed load whose Retry found no
      // goals, and nothing to say they had been kept aside.
      if (unreadable) {
        console.error('Stored goals are unreadable:', unreadable);
        await setAsideUnreadable(STORAGE_KEYS.GOALS, unreadable.raw);
        setAside = true;
      }

      const loaded = archivedRemindersOff(rollOver(savedGoals));
      goalsWithStreaks = loaded.goals;
      staleReminders = loaded.cancel;

      let lifetime = lifetimePointsRef.current;
      if (!lifetimeDirtyRef.current) {
        const parsed = savedLifetimePoints === null ? NaN : parseInt(savedLifetimePoints, 10);
        if (Number.isFinite(parsed)) {
          lifetime = parsed;
        } else {
          // Migration (or an unreadable stored value): derive lifetime points
          // from history.
          lifetime = deriveLifetimePoints(goalsWithStreaks);
          lifetimeNeedsWrite = true;
        }
      }

      // Storage is now the source of truth again. Anything queued against the
      // previous in-memory state (e.g. during a failed load, or before an
      // import) is discarded rather than written over what was just read.
      loadStateRef.current = 'loaded';
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      pendingSave.current = null;

      lifetimePointsRef.current = lifetime;
      setLifetimePointsEarned(lifetime);
      goalsRef.current = goalsWithStreaks;
      setGoals(goalsWithStreaks);
      // With the queue gone, a failed-save report is out of date - unless the
      // lifetime total is still waiting to be written.
      setStorageError((prev) => (prev === 'save' && lifetimeDirtyRef.current ? 'save' : null));
      if (setAside) setDataSetAside(true);
    } catch (err) {
      // Never leave the screen loading, or writes unblocked, whatever failed.
      console.error('Error loading goals:', err);
      setError('Failed to load goals');
      loadStateRef.current = 'failed';
      setStorageError('load');
      return;
    } finally {
      setIsLoading(false);
    }

    // Now the writes. If they fail it is an ordinary failed save: queued,
    // reported, retried. Before anything is awaited: once loaded, changes are
    // allowed, and this would put the loaded goals over one queued meanwhile.
    const rolledOver = hasGoalDataChanged(savedGoals, goalsWithStreaks);
    if (rolledOver) {
      pendingSave.current = goalsWithStreaks;
    }
    if (lifetimeNeedsWrite) {
      lifetimeDirtyRef.current = true;
    }
    if (rolledOver || lifetimeNeedsWrite) {
      await flushSave();
    }

    if (staleReminders.length > 0) {
      await cancelGoalNotifications(staleReminders);
    }
  }, [flushSave]);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  /**
   * Increment lifetime points earned (never decreases)
   */
  const incrementLifetimePoints = useCallback(
    async (points: number) => {
      if (points <= 0) return;

      lifetimePointsRef.current += points;
      setLifetimePointsEarned(lifetimePointsRef.current);

      // Lifetime points never decrease, so losing this write loses points for
      // good. Report it; the next flush retries. (Before a successful load it
      // is held rather than written - see persistLifetime.)
      if (!(await persistLifetime())) {
        if (loadStateRef.current !== 'pending') {
          setStorageError(loadStateRef.current === 'failed' ? 'load' : 'save');
        }
      }
    },
    [persistLifetime]
  );

  /**
   * Award a goal's points if its ownership rules allow it.
   *
   * Top-level goals always award; subgoals only when the parent opts in.
   */
  const awardPointsForGoal = useCallback(
    async (goal: Goal, list: Goal[]) => {
      if (!goal.parentId) {
        await incrementLifetimePoints(goal.points);
        return;
      }

      const parentGoal = list.find((g) => g.id === goal.parentId);
      if (parentGoal?.subgoalsAwardPoints) {
        await incrementLifetimePoints(goal.points);
      }
    },
    [incrementLifetimePoints]
  );

  /**
   * Period rollovers and streaks, applied to the goals in memory - what a load
   * applies to what it reads.
   */
  const rollOverInMemory = useCallback(() => {
    apply((prev) => {
      const next = rollOver(prev);
      return hasGoalDataChanged(prev, next) ? next : prev;
    });
  }, [apply]);

  const refreshGoals = useCallback(async () => {
    // After a failed load, read storage again: that is how Retry recovers.
    // Changes made meanwhile were never saved, and are dropped.
    if (loadStateRef.current === 'failed') {
      setIsLoading(true);
      await loadGoals();
      return;
    }
    // Not while an import runs: it rolls its own goals over.
    if (loadStateRef.current !== 'loaded' || heldRef.current) return;

    // Once loaded, memory is the source of truth. Nothing else writes goals
    // storage, so re-reading it can only return what this provider wrote - or
    // something older, whenever a save is queued, in flight or failed.
    // Refreshing used to re-read, and each time it raced a save it put older
    // goals over newer ones: edits vanished, and a reverted completion could
    // pay out its points twice. Instead, apply what a reload was for - period
    // rollovers and streaks - to the goals in memory, and retry any failed save.
    rollOverInMemory();
    await flushSave();
  }, [rollOverInMemory, flushSave, loadGoals]);

  // Flush pending writes when the app leaves the foreground, and on unmount,
  // so a debounced save can never be lost. And roll periods over when it comes
  // back, as a launch does: left in the background overnight, a daily goal
  // kept yesterday's period until a pull to refresh - a completion made
  // meanwhile was put down to yesterday, and paid again once the goal reset.
  // Not while an import runs: goal changes wait, and it rolls its own over.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        void flushSave();
      } else if (!heldRef.current) {
        rollOverInMemory();
      }
    });

    return () => {
      subscription.remove();
      void flushSave();
    };
  }, [flushSave, rollOverInMemory]);

  const retryStorage = useCallback(async () => {
    if (loadStateRef.current === 'failed') {
      await refreshGoals();
    } else {
      await flushSave();
    }
  }, [flushSave, refreshGoals]);

  // Hiding the banner does not unblock anything. After a failed load, the next
  // change the user makes raises it again (see flushSave).
  const dismissStorageError = useCallback(() => {
    setStorageError(null);
    setDataSetAside(false);
  }, []);

  const completionListeners = useRef(new Set<GoalCompletedListener>());

  const onGoalCompleted = useCallback((listener: GoalCompletedListener) => {
    completionListeners.current.add(listener);
    return () => {
      completionListeners.current.delete(listener);
    };
  }, []);

  /**
   * Tell subscribers (RewardsContext's linked-reward redemption) that a goal
   * was completed for the first time.
   */
  const notifyGoalCompleted = useCallback(async (goal: Goal) => {
    // A completion that cannot be saved - the goals failed to load - is thrown
    // away by the reload. Nothing may be redeemed for it.
    if (loadStateRef.current !== 'loaded') return;

    for (const listener of completionListeners.current) {
      try {
        await listener(goal, lifetimePointsRef.current);
      } catch (listenerErr) {
        // A failed redemption must not fail the goal completion.
        console.error('Error in goal-completed listener:', listenerErr);
      }
    }
  }, []);

  const getCurrentGoals = useCallback(() => {
    if (loadStateRef.current !== 'loaded') {
      throw new Error('Goals have not loaded');
    }
    return { goals: goalsRef.current, lifetimePoints: lifetimePointsRef.current };
  }, []);

  const withGoalsHeld = useCallback(
    <T,>(task: () => Promise<T>) =>
      reminderQueue(async () => {
        heldRef.current = true;
        try {
          return await task();
        } finally {
          heldRef.current = false;
        }
      }),
    [reminderQueue]
  );

  const replaceAllGoals = useCallback(
    async (next: Goal[], lifetimePoints: number) => {
      // Until the goals have loaded the current goals are unknown: an import
      // built on them would write over the user's real data.
      if (loadStateRef.current !== 'loaded') {
        if (loadStateRef.current === 'failed') setStorageError('load');
        throw new Error('Goals have not loaded; refusing to replace them');
      }

      // Take the queue out of play while the import is written. A flush in
      // the meantime (the app going to the background, say) would otherwise
      // land the older goals on top of it.
      const queued = pendingSave.current;
      pendingSave.current = null;
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }

      // Written first: if this fails, nothing has changed and the caller can
      // say so. That includes unsaved edits, which go back in the queue.
      importingRef.current = true;
      try {
        await goalsStorage.saveGoals(next);
      } catch (err) {
        importingRef.current = false;
        // Unsaved edits go back in the queue - as memory has them, the newest.
        // The queue itself may hold an older copy by now: a save that failed
        // meanwhile puts its own back.
        if (pendingSave.current || queued) {
          scheduleSave(goalsRef.current);
        }
        throw err;
      }

      // Anything still queued was computed against the data just replaced.
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
      pendingSave.current = null;

      // Memory takes the import before anything else can run: a change (an
      // edit, a reminder rescheduled) built on the old goals was flushed back
      // over it. The unsaved changes a failed save was reporting are gone.
      const replaced = goalsRef.current;
      goalsRef.current = next;
      setGoals(next);
      lifetimePointsRef.current = lifetimePoints;
      setLifetimePointsEarned(lifetimePoints);
      importingRef.current = false;
      setStorageError((prev) => (prev === 'save' ? null : prev));

      // Reminders for goals that no longer exist would keep firing. Not
      // awaited: nothing refers to them now, and the import holds the rewards
      // queue until it is done.
      const kept = new Set(next.map((goal) => goal.id));
      const gone = replaced.flatMap((goal) => (kept.has(goal.id) ? [] : goal.notificationIds ?? []));
      if (gone.length > 0) {
        void cancelGoalNotifications(gone);
      }

      if (!(await persistLifetime())) {
        setStorageError('save'); // goals are in; the total is retried
      }

      // Rolled over in memory, not by reading the import back: that threw away
      // any change made while the reminders were cancelled and the total
      // written.
      rollOverInMemory();
    },
    [scheduleSave, persistLifetime, rollOverInMemory]
  );

  /**
   * Add a new goal
   */
  const addGoal = useCallback(
    async (
      title: string,
      target: number,
      current: number,
      unit: string,
      direction: GoalDirection,
      points: number,
      period: TimePeriod,
      customPeriodDays?: number,
      parentId?: number,
      isUltimate?: boolean,
      isRecurring?: boolean,
      description?: string,
      icon?: string,
      linkedRewardId?: number,
      subgoalsAwardPoints?: boolean,
      schedule?: GoalSchedule
    ) => {
      try {
        const recurring = isRecurring && canRecur({ period, customPeriodDays, parentId, isUltimate });
        const newGoal: Goal = {
          // Not Date.now(): goals added in the same millisecond (import does
          // this in a loop) would share an id. goalsRef is updated
          // synchronously by commit, so back-to-back adds see each other.
          id: nextId(goalsRef.current),
          title: title.trim(),
          description: description?.trim(),
          target,
          current,
          initialValue: current,
          unit: unit.trim(),
          progress: calculateProgress(current, target, direction, current),
          createdAt: Date.now(),
          direction,
          points,
          icon,
          period,
          customPeriodDays,
          parentId,
          subGoals: [],
          periodStartDate: Date.now(),
          isUltimate,
          isComplete: false,
          // Only where it can: see canRecur.
          isRecurring: recurring,
          completionHistory: [],
          linkedRewardId,
          // Ultimate goals default to not awarding subgoal points.
          subgoalsAwardPoints: subgoalsAwardPoints ?? (isUltimate ? false : undefined),
          // Only a recurring goal has one (see processRecurringGoals).
          schedule: recurring ? schedule : undefined,
        };

        commit((prev) => {
          let next = [...prev, newGoal];

          if (parentId) {
            next = next.map((goal) =>
              goal.id === parentId
                ? { ...goal, subGoals: [...(goal.subGoals || []), newGoal.id] }
                : goal
            );
            next = applyProgressRecalc(next, parentId);
          }

          return next;
        });
      } catch (err) {
        console.error('Error adding goal:', err);
        setError('Failed to add goal');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Add a subgoal to a parent goal
   */
  const addSubgoal = useCallback(
    async (
      parentId: number,
      title: string,
      target: number,
      current: number,
      unit: string,
      direction: GoalDirection,
      points: number,
      period: TimePeriod,
      customPeriodDays?: number,
      description?: string,
      icon?: string,
      linkedRewardId?: number
    ) => {
      await addGoal(
        title,
        target,
        current,
        unit,
        direction,
        points,
        period,
        customPeriodDays,
        parentId,
        undefined,
        undefined,
        description,
        icon,
        linkedRewardId
      );
    },
    [addGoal]
  );

  /**
   * Get all subgoals for a parent goal
   */
  const getSubgoals = useCallback(
    (parentId: number): Goal[] => goals.filter((goal) => goal.parentId === parentId),
    [goals]
  );

  /**
   * Recalculate progress for a goal and its parents
   */
  const recalculateProgress = useCallback(
    async (goalId: number) => {
      commit((prev) => applyProgressRecalc(prev, goalId));
    },
    [commit]
  );

  /**
   * Update goal progress
   */
  const updateGoal = useCallback(
    async (id: number, current: number) => {
      try {
        // Only a first completion pays out (see hasBeenCompleted).
        const before = goalsRef.current.find((g) => g.id === id);
        const completedBefore = before !== undefined && hasBeenCompleted(before);

        const next = commit((prev) => {
          const updated = prev.map((goal) => {
            if (goal.id !== id) return goal;

            const progress = calculateProgress(
              current,
              goal.target,
              goal.direction,
              goal.initialValue
            );
            const isNowComplete = progress >= 100;

            return {
              ...goal,
              current,
              progress,
              isComplete: isNowComplete,
              completedAt:
                isNowComplete && !goal.isComplete ? Date.now() : goal.completedAt,
            };
          });

          const target = updated.find((g) => g.id === id);
          return target?.parentId ? applyProgressRecalc(updated, target.parentId) : updated;
        });

        const updatedGoal = next.find((g) => g.id === id);
        if (updatedGoal?.isComplete && !completedBefore) {
          await awardPointsForGoal(updatedGoal, next);
          // Completing by progress counts too: the detail screen's "Mark
          // complete" sets the target through here before calling finishGoal,
          // which then sees the goal already complete.
          await notifyGoalCompleted(updatedGoal);
        }
      } catch (err) {
        console.error('Error updating goal:', err);
        setError('Failed to update goal');
        throw err;
      }
    },
    [commit, awardPointsForGoal, notifyGoalCompleted]
  );

  /**
   * Edit goal - update all properties
   */
  const editGoal = useCallback(
    async (
      id: number,
      title: string,
      target: number,
      current: number,
      unit: string,
      direction: GoalDirection,
      points: number,
      period: TimePeriod,
      customPeriodDays?: number,
      isUltimate?: boolean,
      isRecurring?: boolean,
      description?: string,
      icon?: string,
      linkedRewardId?: number,
      subgoalsAwardPoints?: boolean,
      schedule?: GoalSchedule
    ) => {
      try {
        commit((prev) => {
          const goal = prev.find((g) => g.id === id);
          if (!goal) return prev;

          const recurring =
            isRecurring && canRecur({ period, customPeriodDays, parentId: goal.parentId, isUltimate });
          const updated = prev.map((g) =>
            g.id === id
              ? {
                  ...g,
                  title: title.trim(),
                  description: description?.trim(),
                  target,
                  current,
                  unit: unit.trim(),
                  direction,
                  points,
                  icon,
                  period,
                  customPeriodDays,
                  isUltimate,
                  isRecurring: recurring,
                  linkedRewardId,
                  subgoalsAwardPoints,
                  schedule: recurring ? schedule : undefined,
                }
              : g
          );

          // From the goal itself up. A goal with subgoals takes its progress
          // from them: worked out from `current`, an ultimate goal dropped to 0%
          // on every edit.
          return applyProgressRecalc(updated, id);
        });
      } catch (err) {
        console.error('Error editing goal:', err);
        setError('Failed to edit goal');
        throw err;
      }
    },
    [commit]
  );

/**
   * Mark goal as complete (set to 100%)
   */
  const finishGoal = useCallback(
    async (id: number) => {
      try {
        const goal = goalsRef.current.find((g) => g.id === id);
        if (!goal) return;

        // Not while it waits on goals that must come first. The detail
        // screen hid only the progress slider, and Mark as Complete finished a
        // blocked goal, paying its points and redeeming its reward.
        const completeIds = new Set(
          goalsRef.current.filter((g) => g.isComplete).map((g) => g.id)
        );
        if (goal.dependsOn?.some((depId) => !completeIds.has(depId))) return;

        const isFirstCompletion = !hasBeenCompleted(goal);

        const next = commit((prev) => {
          const updated = prev.map((g) => {
            if (g.id !== id) return g;

            const completedGoal: Goal = {
              ...g,
              current: g.target,
              progress: 100,
              isComplete: true,
              completedAt: Date.now(),
            };

            return g.isRecurring ? updateGoalStreaks(completedGoal) : completedGoal;
          });

          return goal.parentId ? applyProgressRecalc(updated, goal.parentId) : updated;
        });

        if (isFirstCompletion) {
          await awardPointsForGoal(goal, next);
          await notifyGoalCompleted(goal);
        }
      } catch (err) {
        console.error('Error finishing goal:', err);
        setError('Failed to finish goal');
        throw err;
      }
    },
    [commit, awardPointsForGoal, notifyGoalCompleted]
  );

  /**
   * Archive a goal and all its subgoals
   */
  const archiveGoal = useCallback(
    async (id: number) => {
      try {
        const reminders = reminderIdsOf(goalsRef.current, id);
        commit((prev) => {
          const goalToArchive = prev.find((g) => g.id === id);
          if (!goalToArchive) return prev;

          const now = Date.now();
          const idsToArchive = new Set([id, ...(goalToArchive.subGoals || [])]);

          // Reminders are switched off rather than paused: nothing would
          // schedule them again on unarchive.
          let next = prev.map((goal) =>
            idsToArchive.has(goal.id)
              ? { ...goal, isArchived: true, archivedAt: now, notificationsEnabled: false, notificationIds: [] }
              : goal
          );

          // Detach from the parent so it stops counting toward parent progress.
          if (goalToArchive.parentId) {
            const parentId = goalToArchive.parentId;
            next = next.map((goal) =>
              goal.id === parentId
                ? { ...goal, subGoals: (goal.subGoals || []).filter((subId) => subId !== id) }
                : goal
            );
            next = applyProgressRecalc(next, parentId);
          }

          return next;
        });
        // They live in the OS, and would keep firing for a goal that is gone.
        if (reminders.length) await cancelGoalNotifications(reminders);
      } catch (err) {
        console.error('Error archiving goal:', err);
        setError('Failed to archive goal');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Remove a goal - archives rather than deleting, so it can be restored.
   */
  const removeGoal = useCallback(
    async (id: number) => {
      await archiveGoal(id);
    },
    [archiveGoal]
  );

  /**
   * Unarchive a goal and all its subgoals
   */
  const unarchiveGoal = useCallback(
    async (id: number) => {
      try {
        commit((prev) => {
          const goalToUnarchive = prev.find((g) => g.id === id);
          if (!goalToUnarchive) return prev;

          const idsToUnarchive = new Set([id, ...(goalToUnarchive.subGoals || [])]);

          return prev.map((goal) => {
            if (!idsToUnarchive.has(goal.id)) return goal;
            const { isArchived, archivedAt, ...rest } = goal;
            return rest as Goal;
          });
        });
      } catch (err) {
        console.error('Error unarchiving goal:', err);
        setError('Failed to unarchive goal');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Permanently delete a goal and all its subgoals
   */
  const permanentlyDeleteGoal = useCallback(
    async (id: number) => {
      try {
        const reminders = reminderIdsOf(goalsRef.current, id);
        commit((prev) => {
          const goalToRemove = prev.find((g) => g.id === id);
          if (!goalToRemove) return prev;

          const idsToRemove = new Set([id, ...(goalToRemove.subGoals || [])]);
          let next = prev.filter((goal) => !idsToRemove.has(goal.id));

          if (goalToRemove.parentId) {
            const parentId = goalToRemove.parentId;
            next = next.map((goal) =>
              goal.id === parentId
                ? { ...goal, subGoals: (goal.subGoals || []).filter((subId) => subId !== id) }
                : goal
            );
            next = applyProgressRecalc(next, parentId);
          }

          return next;
        });
        if (reminders.length) await cancelGoalNotifications(reminders);
      } catch (err) {
        console.error('Error permanently deleting goal:', err);
        setError('Failed to permanently delete goal');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Extend the deadline of an expired goal
   */
  const extendDeadline = useCallback(
    async (id: number, additionalDays: number) => {
      try {
        commit((prev) => {
          const goal = prev.find((g) => g.id === id);
          if (!goal?.periodStartDate) return prev;

          const millisecondsPerDay = 24 * 60 * 60 * 1000;
          const newStartDate = goal.periodStartDate + additionalDays * millisecondsPerDay;

          return prev.map((g) => (g.id === id ? { ...g, periodStartDate: newStartDate } : g));
        });
      } catch (err) {
        console.error('Error extending deadline:', err);
        setError('Failed to extend deadline');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Toggle pause state of a goal
   */
  const togglePause = useCallback(
    async (id: number) => {
      try {
        commit((prev) =>
          prev.map((g) =>
            g.id === id
              ? { ...g, isPaused: !g.isPaused, pausedAt: !g.isPaused ? Date.now() : undefined }
              : g
          )
        );
      } catch (err) {
        console.error('Error toggling pause:', err);
        setError('Failed to pause/resume goal');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Reorder goals by updating their sortOrder property
   * @param goalIds - Array of goal IDs in the new desired order
   */
  const reorderGoals = useCallback(
    async (goalIds: number[]) => {
      try {
        commit((prev) => {
          const sortOrderMap = new Map(goalIds.map((id, index) => [id, index]));

          return prev.map((goal) => {
            const newSortOrder = sortOrderMap.get(goal.id);
            return newSortOrder !== undefined ? { ...goal, sortOrder: newSortOrder } : goal;
          });
        });
      } catch (err) {
        console.error('Error reordering goals:', err);
        setError('Failed to reorder goals');
        throw err;
      }
    },
    [commit]
  );

  const addNote = useCallback(
    async (goalId: number, text: string) => {
      try {
        commit((prev) =>
          prev.map((goal) =>
            goal.id === goalId
              ? {
                  ...goal,
                  notes: [
                    ...(goal.notes || []),
                    {
                      // Unique within the goal even if two notes land in the
                      // same millisecond - deleteNote removes by id.
                      id: String(
                        nextId((goal.notes || []).map((note) => ({ id: Number(note.id) || 0 })))
                      ),
                      text: text.trim(),
                      createdAt: Date.now(),
                    },
                  ],
                }
              : goal
          )
        );
      } catch (err) {
        console.error('Error adding note:', err);
        setError('Failed to add note');
        throw err;
      }
    },
    [commit]
  );

  const deleteNote = useCallback(
    async (goalId: number, noteId: string) => {
      try {
        commit((prev) =>
          prev.map((goal) =>
            goal.id === goalId && goal.notes
              ? { ...goal, notes: goal.notes.filter((note) => note.id !== noteId) }
              : goal
          )
        );
      } catch (err) {
        console.error('Error deleting note:', err);
        setError('Failed to delete note');
        throw err;
      }
    },
    [commit]
  );

  const addDependency = useCallback(
    async (goalId: number, dependsOnId: number) => {
      try {
        commit((prev) =>
          prev.map((goal) => {
            if (goal.id !== goalId) return goal;

            const existingDeps = goal.dependsOn || [];
            if (existingDeps.includes(dependsOnId)) return goal;

            return { ...goal, dependsOn: [...existingDeps, dependsOnId] };
          })
        );
      } catch (err) {
        console.error('Error adding dependency:', err);
        setError('Failed to add dependency');
        throw err;
      }
    },
    [commit]
  );

  const removeDependency = useCallback(
    async (goalId: number, dependsOnId: number) => {
      try {
        commit((prev) =>
          prev.map((goal) =>
            goal.id === goalId && goal.dependsOn
              ? { ...goal, dependsOn: goal.dependsOn.filter((id) => id !== dependsOnId) }
              : goal
          )
        );
      } catch (err) {
        console.error('Error removing dependency:', err);
        setError('Failed to remove dependency');
        throw err;
      }
    },
    [commit]
  );

  /**
   * True when every goal this one depends on is complete.
   */
  const checkDependencies = useCallback(
    (goalId: number) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal?.dependsOn?.length) return true;

      const completionById = new Map(goals.map((g) => [g.id, g.isComplete === true]));
      return goal.dependsOn.every((depId) => completionById.get(depId) === true);
    },
    [goals]
  );

  /**
   * The detail screen used to do this through editGoal, which only sets the
   * form's fields: the completion was never recorded, the period never
   * restarted, a finished goal stayed complete at 0%, and - as the call left
   * out linkedRewardId - the goal lost its linked reward.
   */
  const resetRecurringGoal = useCallback(
    async (id: number) => {
      commit((prev) => {
        const goal = prev.find((g) => g.id === id);
        if (!goal?.isRecurring) return prev;

        // No parent's progress to update: only top-level goals recur (canRecur).
        const reset = updateGoalStreaks(resetGoal(recordCompletion(goal)));
        return prev.map((g) => (g.id === id ? reset : g));
      });
    },
    [commit]
  );

  const rescheduleReminders = useCallback(
    (text: ReminderText, goalId?: number) =>
      reminderQueue(async (): Promise<RescheduleOutcome> => {
        const due = goalsRef.current.filter(
          (g) =>
            g.notificationsEnabled &&
            g.notificationTime !== undefined &&
            !g.isArchived &&
            (goalId === undefined || g.id === goalId)
        );

        // All at once: one goal after another, a language change took as long
        // as every goal's reminders together.
        const results = await Promise.all(
          due.map(async (goal) => {
            try {
              return { goal, ids: await scheduleGoalNotification(goal, text), refused: false };
            } catch (err) {
              console.error('Error rescheduling reminders:', err);
              // Refused before anything was cancelled: its reminders are as
              // they were, and fire again once permission is back.
              return { goal, ids: null, refused: err instanceof NotificationPermissionError };
            }
          })
        );

        // A goal may have been archived, deleted or imported over while the OS
        // was busy (reminder settings wait their turn in the queue). It keeps
        // what it has now, and new reminders are cancelled - stored nowhere,
        // nothing could ever cancel them. Its reminder ids are the same array
        // only if nothing has touched them since: each of those replaces them.
        const latest = new Map(goalsRef.current.map((g) => [g.id, g]));
        const changes = new Map<number, Partial<Goal>>();
        const orphans: string[] = [];
        const outcome: RescheduleOutcome = { turnedOff: 0, notAllowed: 0 };
        for (const { goal, ids, refused } of results) {
          const now = latest.get(goal.id);
          const untouched = now !== undefined && now.notificationIds === goal.notificationIds;
          if (!untouched) {
            if (ids) orphans.push(...ids);
          } else if (ids) {
            changes.set(goal.id, { notificationIds: ids });
          } else if (refused) {
            outcome.notAllowed += 1;
          } else {
            // Failed part-way: scheduleGoalNotification had cancelled its old
            // reminders, then the new ones. Showing them on - with nothing to
            // fire - hid that from the user.
            changes.set(goal.id, { notificationsEnabled: false, notificationIds: [] });
            outcome.turnedOff += 1;
          }
        }

        if (changes.size > 0) {
          commit((prev) =>
            prev.map((g) => {
              const change = changes.get(g.id);
              return change ? { ...g, ...change } : g;
            })
          );
        }
        if (orphans.length > 0) await cancelGoalNotifications(orphans);
        return outcome;
      }),
    [commit, reminderQueue]
  );

  const updateNotificationSettings = useCallback(
    (goalId: number, enabled: boolean, text: ReminderText, time?: number, days?: number[]) =>
      reminderQueue(async () => {
        try {
          const goal = goalsRef.current.find((g) => g.id === goalId);
          // Deleted or imported over while this waited its turn. Returning
          // quietly let the screen say the reminders were set.
          if (!goal) throw new Error('The goal is gone');

          const settings = { notificationsEnabled: enabled, notificationTime: time, notificationDays: days };
          let notificationIds = goal.notificationIds;
          let scheduled: string[] = [];

          // Talk to the OS before touching state, so a scheduling failure leaves
          // the stored settings untouched rather than half-applied.
          if (enabled && time !== undefined) {
            try {
              notificationIds = scheduled = await scheduleGoalNotification({ ...goal, ...settings }, text);
            } catch (err) {
              // Failed part-way, its old reminders were cancelled too (as in
              // rescheduleReminders): left on, they showed as set with nothing
              // to fire. A refusal changed nothing.
              const latest = goalsRef.current.find((g) => g.id === goalId);
              if (!(err instanceof NotificationPermissionError) && latest?.notificationIds === goal.notificationIds) {
                commit((prev) =>
                  prev.map((g) => (g.id === goalId ? { ...g, notificationsEnabled: false, notificationIds: [] } : g))
                );
              }
              throw err;
            }
          } else if (goal.notificationIds?.length) {
            await cancelGoalNotifications(goal.notificationIds);
            notificationIds = [];
          }

          // Archived, deleted or imported over while the OS was busy - each
          // replaces the goal's reminder ids. It keeps what it has now: turning
          // reminders back on for an archived goal left them firing, and the
          // new ones are cancelled, stored nowhere else. The caller is told:
          // returning quietly let the screen say the reminders were set.
          const latest = goalsRef.current.find((g) => g.id === goalId);
          if (!latest || latest.notificationIds !== goal.notificationIds) {
            if (scheduled.length > 0) await cancelGoalNotifications(scheduled);
            throw new Error('The goal changed while its reminders were being saved');
          }

          // Only these fields. The goal may have changed while the OS was busy,
          // and writing back the copy taken before would undo that.
          commit((prev) =>
            prev.map((g) => (g.id === goalId ? { ...g, ...settings, notificationIds } : g))
          );
        } catch (err) {
          console.error('Error updating notification settings:', err);
          setError('Failed to update notification settings');
          throw err;
        }
      }),
    [commit, reminderQueue]
  );

  const value = useMemo(
    () => ({
      goals,
      lifetimePointsEarned,
      isLoading,
      error,
      storageError,
      dataSetAside,
      retryStorage,
      dismissStorageError,
      getCurrentGoals,
      replaceAllGoals,
      withGoalsHeld,
      onGoalCompleted,
      addGoal,
      addSubgoal,
      updateGoal,
      editGoal,
      finishGoal,
      removeGoal,
      archiveGoal,
      unarchiveGoal,
      permanentlyDeleteGoal,
      extendDeadline,
      togglePause,
      resetRecurringGoal,
      rescheduleReminders,
      refreshGoals,
      getSubgoals,
      recalculateProgress,
      reorderGoals,
      addNote,
      deleteNote,
      addDependency,
      removeDependency,
      checkDependencies,
      updateNotificationSettings,
    }),
    [
      goals,
      lifetimePointsEarned,
      isLoading,
      error,
      storageError,
      dataSetAside,
      retryStorage,
      dismissStorageError,
      getCurrentGoals,
      replaceAllGoals,
      withGoalsHeld,
      onGoalCompleted,
      addGoal,
      addSubgoal,
      updateGoal,
      editGoal,
      finishGoal,
      removeGoal,
      archiveGoal,
      unarchiveGoal,
      permanentlyDeleteGoal,
      extendDeadline,
      togglePause,
      resetRecurringGoal,
      rescheduleReminders,
      refreshGoals,
      getSubgoals,
      recalculateProgress,
      reorderGoals,
      addNote,
      deleteNote,
      addDependency,
      removeDependency,
      checkDependencies,
      updateNotificationSettings,
    ]
  );

  return <GoalsContext.Provider value={value}>{children}</GoalsContext.Provider>;
}

/**
 * Hook to access goals context
 * @throws Error if used outside GoalsProvider
 */
export function useGoals(): GoalsContextType {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals must be used within a GoalsProvider');
  }
  return context;
}
