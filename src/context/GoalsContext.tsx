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

import { REWARDS_KEY, STORAGE_KEYS } from '@/src/constants/storage-keys';
import { Goal, GoalDirection, GoalSchedule, TimePeriod } from '@/src/types';
import { calculateGoalProgress, calculateProgress } from '@/src/utils/goal-calculations';
import { goalsStorage } from '@/src/utils/storage';
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
import { getTotalPointsEarned, processRecurringGoals, updateGoalStreaks } from '../utils/recurring-goals';

/**
 * How long to wait after the last mutation before writing to AsyncStorage.
 *
 * Long enough to coalesce a burst (tapping +1 repeatedly, dragging a slider),
 * short enough that a backgrounded app has almost certainly flushed. The
 * AppState listener below flushes early on background regardless.
 */
const SAVE_DEBOUNCE_MS = 400;

interface GoalsContextType {
  goals: Goal[];
  lifetimePointsEarned: number;
  isLoading: boolean;
  error: string | null;
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
    customPeriodDays?: number
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
    linkedRewardId?: number
  ) => Promise<void>;
  finishGoal: (id: number) => Promise<void>;
  removeGoal: (id: number) => Promise<void>;
  archiveGoal: (id: number) => Promise<void>;
  unarchiveGoal: (id: number) => Promise<void>;
  permanentlyDeleteGoal: (id: number) => Promise<void>;
  extendDeadline: (id: number, additionalDays: number) => Promise<void>;
  togglePause: (id: number) => Promise<void>;
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
 * True if any goal's streak or period fields differ between the two arrays.
 *
 * Replaces a pair of JSON.stringify calls over the whole collection that used
 * to run on every cold start.
 */
function hasGoalDataChanged(before: Goal[], after: Goal[]): boolean {
  if (before.length !== after.length) return true;

  for (let i = 0; i < before.length; i += 1) {
    const a = before[i];
    const b = after[i];
    if (a === b) continue;
    if (
      a.current !== b.current ||
      a.progress !== b.progress ||
      a.isComplete !== b.isComplete ||
      a.periodStartDate !== b.periodStartDate ||
      a.currentStreak !== b.currentStreak ||
      a.longestStreak !== b.longestStreak ||
      (a.completionHistory?.length ?? 0) !== (b.completionHistory?.length ?? 0)
    ) {
      return true;
    }
  }

  return false;
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

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<Goal[] | null>(null);

  /**
   * Write any pending goals to storage immediately.
   */
  const flushSave = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }

    const toSave = pendingSave.current;
    pendingSave.current = null;
    if (!toSave) return;

    try {
      await goalsStorage.saveGoals(toSave);
    } catch (err) {
      console.error('Error saving goals:', err);
      setError('Failed to save goals');
    }
  }, []);

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
   * second pass over state.
   */
  const commit = useCallback(
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

  /**
   * Load goals from storage and process recurring goals
   */
  const loadGoals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const savedGoals = await goalsStorage.loadGoals();

      // Reset any recurring goals whose period has ended, then refresh streaks.
      const processedGoals = processRecurringGoals(savedGoals);
      const goalsWithStreaks = processedGoals.map((goal) =>
        goal.isRecurring ? updateGoalStreaks(goal) : goal
      );

      if (hasGoalDataChanged(savedGoals, goalsWithStreaks)) {
        await goalsStorage.saveGoals(goalsWithStreaks);
      }

      const savedLifetimePoints = await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS);
      let lifetime = savedLifetimePoints ? parseInt(savedLifetimePoints, 10) : 0;

      // Migration: derive lifetime points from history the first time.
      if (!savedLifetimePoints) {
        lifetime = goalsWithStreaks.reduce((sum, goal) => {
          if (goal.parentId) return sum; // Subgoals roll up into their parent.

          return goal.isRecurring
            ? sum + getTotalPointsEarned(goal)
            : sum + (goal.isComplete ? goal.points : 0);
        }, 0);

        await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, lifetime.toString());
      }

      lifetimePointsRef.current = lifetime;
      setLifetimePointsEarned(lifetime);

      goalsRef.current = goalsWithStreaks;
      setGoals(goalsWithStreaks);
    } catch (err) {
      console.error('Error loading goals:', err);
      setError('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  // Flush pending writes when the app leaves the foreground, and on unmount,
  // so a debounced save can never be lost.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        void flushSave();
      }
    });

    return () => {
      subscription.remove();
      void flushSave();
    };
  }, [flushSave]);

  /**
   * Increment lifetime points earned (never decreases)
   */
  const incrementLifetimePoints = useCallback(async (points: number) => {
    if (points <= 0) return;

    try {
      const newTotal = lifetimePointsRef.current + points;
      lifetimePointsRef.current = newTotal;
      setLifetimePointsEarned(newTotal);
      await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, newTotal.toString());
    } catch (err) {
      console.error('Error incrementing lifetime points:', err);
    }
  }, []);

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

  const refreshGoals = useCallback(async () => {
    await loadGoals();
  }, [loadGoals]);

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
        const newGoal: Goal = {
          id: Date.now(),
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
          isRecurring,
          completionHistory: [],
          linkedRewardId,
          // Ultimate goals default to not awarding subgoal points.
          subgoalsAwardPoints: subgoalsAwardPoints ?? (isUltimate ? false : undefined),
          schedule,
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
      customPeriodDays?: number
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
        parentId
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
        const wasComplete = goalsRef.current.find((g) => g.id === id)?.isComplete ?? false;

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
        if (updatedGoal && !wasComplete && updatedGoal.isComplete) {
          await awardPointsForGoal(updatedGoal, next);
        }
      } catch (err) {
        console.error('Error updating goal:', err);
        setError('Failed to update goal');
        throw err;
      }
    },
    [commit, awardPointsForGoal]
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
      linkedRewardId?: number
    ) => {
      try {
        commit((prev) => {
          const goal = prev.find((g) => g.id === id);
          if (!goal) return prev;

          const progress = calculateProgress(current, target, direction, goal.initialValue);

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
                  progress,
                  isUltimate,
                  isRecurring,
                  linkedRewardId,
                }
              : g
          );

          return goal.parentId ? applyProgressRecalc(updated, goal.parentId) : updated;
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
   * Auto-redeem a reward linked to a just-completed goal.
   *
   * Reads rewards storage directly rather than going through RewardsContext,
   * which sits below this provider in the tree.
   */
  const autoRedeemLinkedReward = useCallback(async (goal: Goal) => {
    if (!goal.linkedRewardId) return;

    try {
      const rewardsData = await AsyncStorage.getItem(REWARDS_KEY);
      if (!rewardsData) return;

      const rewards = JSON.parse(rewardsData);
      if (!Array.isArray(rewards)) return;

      const linkedReward = rewards.find((r) => r.id === goal.linkedRewardId);
      if (!linkedReward || linkedReward.isRedeemed) return;

      const updatedRewards = rewards.map((r) =>
        r.id === goal.linkedRewardId ? { ...r, isRedeemed: true, redeemedAt: Date.now() } : r
      );

      await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(updatedRewards));
    } catch (rewardErr) {
      // A failed redemption must not fail the goal completion.
      console.error('Error auto-redeeming linked reward:', rewardErr);
    }
  }, []);

  /**
   * Mark goal as complete (set to 100%)
   */
  const finishGoal = useCallback(
    async (id: number) => {
      try {
        const goal = goalsRef.current.find((g) => g.id === id);
        if (!goal) return;

        const isFirstCompletion = !goal.isComplete;

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
          await autoRedeemLinkedReward(goal);
        }
      } catch (err) {
        console.error('Error finishing goal:', err);
        setError('Failed to finish goal');
        throw err;
      }
    },
    [commit, awardPointsForGoal, autoRedeemLinkedReward]
  );

  /**
   * Archive a goal and all its subgoals
   */
  const archiveGoal = useCallback(
    async (id: number) => {
      try {
        commit((prev) => {
          const goalToArchive = prev.find((g) => g.id === id);
          if (!goalToArchive) return prev;

          const now = Date.now();
          const idsToArchive = new Set([id, ...(goalToArchive.subGoals || [])]);

          let next = prev.map((goal) =>
            idsToArchive.has(goal.id) ? { ...goal, isArchived: true, archivedAt: now } : goal
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
                    { id: Date.now().toString(), text: text.trim(), createdAt: Date.now() },
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

  const updateNotificationSettings = useCallback(
    async (goalId: number, enabled: boolean, time?: number, days?: number[]) => {
      try {
        const { scheduleGoalNotification, cancelGoalNotifications } = await import(
          '../utils/notifications'
        );

        const goal = goalsRef.current.find((g) => g.id === goalId);
        if (!goal) return;

        const updatedGoal: Goal = {
          ...goal,
          notificationsEnabled: enabled,
          notificationTime: time,
          notificationDays: days,
        };

        // Talk to the OS before touching state, so a scheduling failure leaves
        // the stored settings untouched rather than half-applied.
        if (enabled && time !== undefined) {
          updatedGoal.notificationIds = await scheduleGoalNotification(updatedGoal);
        } else if (goal.notificationIds?.length) {
          await cancelGoalNotifications(goal.notificationIds);
          updatedGoal.notificationIds = [];
        }

        commit((prev) => prev.map((g) => (g.id === goalId ? updatedGoal : g)));
      } catch (err) {
        console.error('Error updating notification settings:', err);
        setError('Failed to update notification settings');
        throw err;
      }
    },
    [commit]
  );

  const value = useMemo(
    () => ({
      goals,
      lifetimePointsEarned,
      isLoading,
      error,
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
