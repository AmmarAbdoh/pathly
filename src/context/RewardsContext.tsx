/**
 * Rewards context provider
 * Manages global rewards state and operations
 */

import { REWARDS_KEY } from '@/src/constants/storage-keys';
import { useGoals } from '@/src/context/GoalsContext';
import { Reward } from '@/src/types';
import { nextId } from '@/src/utils/ids';
import { getAvailablePoints } from '@/src/utils/points';
import { rewardsStorage } from '@/src/utils/rewards-storage';
import { setAsideUnreadable, UnreadableDataError } from '@/src/utils/storage';
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

/**
 * A persistence problem the user needs to know about; shown by
 * StorageErrorBanner.
 *
 *  - `load`: rewards could not be read. Every change is refused until a reload
 *    succeeds.
 *  - `save`: a goal's linked reward could not be redeemed. It is retried by
 *    `retryStorage`, and after the next successful load.
 *
 * Stored rewards that could not be used at all are reported by `dataSetAside`.
 *
 * Other failed changes are not reported here: they are undone, and the screen
 * that made them says so.
 */
export type RewardsStorageError = 'load' | 'save';

interface RewardsContextType {
  rewards: Reward[];
  isLoading: boolean;
  error: string | null;
  storageError: RewardsStorageError | null;
  /** Stored rewards could not be used and were kept aside (see GoalsContext). */
  dataSetAside: boolean;
  /** Retry whatever failed: reload after a failed load, or pending redemptions. */
  retryStorage: () => Promise<void>;
  dismissStorageError: () => void;
  addReward: (title: string, description: string, pointsCost: number, icon: string) => Promise<void>;
  editReward: (id: number, title: string, description: string, pointsCost: number, icon: string) => Promise<void>;
  redeemReward: (id: number) => Promise<void>;
  removeReward: (id: number) => Promise<void>;
  refreshRewards: () => Promise<void>;
  /**
   * Run a backup import's `task` with the rewards as they are once every
   * change already queued has run, holding the queue until it finishes: no
   * change can land between reading them and writing what was built from them.
   * Built from a copy read earlier, the import undid a linked reward redeemed
   * meanwhile. `write` saves rewards, rejecting - and leaving them as they
   * were - if the write fails. Rejects unless the rewards have loaded.
   *
   * Goals completed while it runs redeem nothing: the import puts in the goals
   * it read at the start, so those completions are gone. If it fails, they
   * stand, and are redeemed after all.
   */
  withRewardsHeld: <T>(
    task: (rewards: Reward[], write: (next: Reward[]) => Promise<void>) => Promise<T>
  ) => Promise<T>;
  getAvailableRewards: () => Reward[];
  getRedeemedRewards: () => Reward[];
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

interface RewardsProviderProps {
  children: ReactNode;
}

/**
 * Rewards Provider Component
 * Wraps the app to provide rewards context to all children
 */
export function RewardsProvider({ children }: RewardsProviderProps) {
  const { onGoalCompleted } = useGoals();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<RewardsStorageError | null>(null);
  /** Stored rewards could not be used and were kept aside (see GoalsContext). */
  const [dataSetAside, setDataSetAside] = useState(false);

  /**
   * Whether storage has been read. Until it has, the in-memory rewards are not
   * the user's (empty at startup, or after a failed read), and saving them
   * would replace the real ones on disk.
   */
  const loadStateRef = useRef<'pending' | 'loaded' | 'failed'>('pending');

  /**
   * Synchronous mirror of `rewards`, the same pattern as GoalsContext.
   *
   * The mutators used to close over `rewards`. Two calls before a re-render
   * (JSON import adds rewards in a loop) each started from the same stale
   * array, so every add overwrote the one before it: importing five rewards
   * kept one.
   */
  const rewardsRef = useRef<Reward[]>([]);

  /**
   * Linked rewards waiting to be redeemed, with the lifetime total when their
   * goal was completed: because rewards had not loaded yet, or the write
   * failed.
   */
  const pendingRedemptions = useRef(new Map<number, number>());

  /**
   * Linked rewards of goals completed while an import runs (see
   * withRewardsHeld), set aside rather than redeemed; null otherwise.
   */
  const heldRedemptions = useRef<Map<number, number> | null>(null);

  /**
   * Every read and write of rewards storage, one at a time.
   *
   * Overlapping changes could not be undone correctly: a change that failed
   * after another had built on it was left on screen, or brought back by the
   * later one's undo, although it never reached disk. A reload overlapping a
   * write could read the rewards from before it.
   */
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const enqueue = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = queue.current.then(task);
    queue.current = run.catch(() => undefined);
    return run;
  }, []);

  /** Throw - and say so, after a failed load - unless the rewards have loaded. */
  const assertLoaded = useCallback(() => {
    if (loadStateRef.current !== 'loaded') {
      if (loadStateRef.current === 'failed') setStorageError('load');
      throw new Error('Rewards have not loaded');
    }
  }, []);

  /** Show and save `next`, or put back what was there if the write fails. */
  const write = useCallback(async (next: Reward[]) => {
    const prev = rewardsRef.current;
    if (next === prev) return;

    rewardsRef.current = next;
    setRewards(next);
    try {
      await rewardsStorage.saveRewards(next);
    } catch (err) {
      // Changes run one at a time, so nothing has built on this one yet.
      rewardsRef.current = prev;
      setRewards(prev);
      throw err;
    }
  }, []);

  /**
   * Apply a pure updater to the latest rewards, render, and persist.
   *
   * Rejects - leaving the rewards as they were - if storage has not been read
   * or the write fails. The screen shows the change straight away and takes it
   * back if the write fails, so it never shows a reward that is not on disk.
   */
  const commit = useCallback(
    (updater: (prev: Reward[]) => Reward[]) =>
      enqueue(async () => {
        assertLoaded();
        await write(updater(rewardsRef.current));
      }),
    [enqueue, assertLoaded, write]
  );

  /**
   * Redeem the linked rewards that are waiting, where affordable. Returns
   * whether none is left waiting because of a failure.
   */
  const redeemPending = useCallback(async (): Promise<boolean> => {
    const waiting = [...pendingRedemptions.current];
    if (waiting.length === 0) return true;

    // Lifetime points never decrease, so the latest total is the best known.
    const lifetimePoints = Math.max(...waiting.map(([, points]) => points));

    try {
      await commit((prev) => {
        let next = prev;
        for (const [rewardId] of waiting) {
          const reward = next.find((r) => r.id === rewardId);
          // The Rewards screen's rule: never spend more than has been earned.
          // A reward the user cannot afford yet stays available to redeem by
          // hand.
          if (
            !reward ||
            reward.isRedeemed ||
            getAvailablePoints(lifetimePoints, next) < reward.pointsCost
          ) {
            continue;
          }
          next = next.map((r) =>
            r.id === rewardId ? { ...r, isRedeemed: true, redeemedAt: Date.now() } : r
          );
        }
        return next;
      });
    } catch (err) {
      console.error('Error redeeming linked rewards:', err);
      setStorageError(loadStateRef.current === 'failed' ? 'load' : 'save');
      return false;
    }

    for (const [rewardId, points] of waiting) {
      // Unless the same reward was queued again meanwhile.
      if (pendingRedemptions.current.get(rewardId) === points) {
        pendingRedemptions.current.delete(rewardId);
      }
    }
    setStorageError((prev) => (prev === 'save' ? null : prev));
    return true;
  }, [commit]);

  /**
   * Load rewards from storage
   */
  const loadRewards = useCallback(async () => {
    const loaded = await enqueue(async () => {
      let setAside = false;
      try {
        setIsLoading(true);
        setError(null);
        let savedRewards: Reward[];
        try {
          savedRewards = await rewardsStorage.loadRewards();
        } catch (err) {
          // Data that was read but cannot be used never will be: keep it aside
          // and start from no rewards, rather than block them for good.
          if (!(err instanceof UnreadableDataError)) throw err;
          console.error('Stored rewards are unreadable:', err);
          await setAsideUnreadable(REWARDS_KEY, err.raw);
          savedRewards = [];
          setAside = true;
        }
        rewardsRef.current = savedRewards;
        setRewards(savedRewards);
        loadStateRef.current = 'loaded';
        setStorageError(null);
        if (setAside) setDataSetAside(true);
        return true;
      } catch (err) {
        console.error('Error loading rewards:', err);
        setError('Failed to load rewards');
        // Keep whatever was loaded before on screen, but write nothing until a
        // reload succeeds.
        loadStateRef.current = 'failed';
        setStorageError('load');
        return false;
      } finally {
        setIsLoading(false);
      }
    });

    // Redemptions that arrived before the rewards could be read.
    if (loaded) {
      await redeemPending();
    }
  }, [enqueue, redeemPending]);

  // Load rewards on mount
  useEffect(() => {
    void loadRewards();
  }, [loadRewards]);

  /**
   * Refresh rewards from storage
   */
  const refreshRewards = useCallback(async () => {
    await loadRewards();
  }, [loadRewards]);

  const retryStorage = useCallback(async () => {
    if (loadStateRef.current === 'failed') {
      await loadRewards();
    } else {
      await redeemPending();
    }
  }, [loadRewards, redeemPending]);

  const dismissStorageError = useCallback(() => {
    setStorageError(null);
    setDataSetAside(false);
  }, []);

  const withRewardsHeld = useCallback(
    <T,>(task: (rewards: Reward[], write: (next: Reward[]) => Promise<void>) => Promise<T>) =>
      enqueue(async () => {
        assertLoaded();
        const held = new Map<number, number>();
        heldRedemptions.current = held;
        try {
          return await task(rewardsRef.current, write);
        } catch (err) {
          // Nothing was replaced, so those completions stand.
          for (const [rewardId, points] of held) pendingRedemptions.current.set(rewardId, points);
          if (held.size > 0) void redeemPending();
          throw err;
        } finally {
          heldRedemptions.current = null;
        }
      }),
    [enqueue, assertLoaded, write, redeemPending]
  );

  // Auto-redeem a goal's linked reward the first time the goal is completed.
  // Queued first, so a redemption that cannot happen now - rewards still
  // loading, or failed to load or save - happens on the next load or Retry
  // instead of being lost.
  useEffect(
    () =>
      onGoalCompleted(async (goal, lifetimePoints) => {
        if (goal.linkedRewardId === undefined) return;

        // An import is running: it is about to throw this completion away.
        if (heldRedemptions.current) {
          heldRedemptions.current.set(goal.linkedRewardId, lifetimePoints);
          return;
        }

        pendingRedemptions.current.set(goal.linkedRewardId, lifetimePoints);
        if (loadStateRef.current === 'loaded') {
          await redeemPending();
        } else if (loadStateRef.current === 'failed') {
          setStorageError('load');
        }
      }),
    [onGoalCompleted, redeemPending]
  );

  /**
   * Add a new reward
   */
  const addReward = useCallback(
    async (title: string, description: string, pointsCost: number, icon: string) => {
      try {
        await commit((prev) => [
          ...prev,
          {
            id: nextId(prev),
            title: title.trim(),
            description: description.trim(),
            pointsCost,
            icon,
            createdAt: Date.now(),
            isRedeemed: false,
          },
        ]);
      } catch (err) {
        console.error('Error adding reward:', err);
        setError('Failed to add reward');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Edit an existing reward
   */
  const editReward = useCallback(
    async (id: number, title: string, description: string, pointsCost: number, icon: string) => {
      try {
        await commit((prev) =>
          prev.map((reward) =>
            reward.id === id
              ? { ...reward, title: title.trim(), description: description.trim(), pointsCost, icon }
              : reward
          )
        );
      } catch (err) {
        console.error('Error editing reward:', err);
        setError('Failed to edit reward');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Redeem a reward
   */
  const redeemReward = useCallback(
    async (id: number) => {
      try {
        await commit((prev) =>
          prev.map((reward) =>
            reward.id === id ? { ...reward, isRedeemed: true, redeemedAt: Date.now() } : reward
          )
        );
      } catch (err) {
        console.error('Error redeeming reward:', err);
        setError('Failed to redeem reward');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Remove a reward
   */
  const removeReward = useCallback(
    async (id: number) => {
      try {
        await commit((prev) => prev.filter((reward) => reward.id !== id));
      } catch (err) {
        console.error('Error removing reward:', err);
        setError('Failed to remove reward');
        throw err;
      }
    },
    [commit]
  );

  /**
   * Get available (not redeemed) rewards
   */
  const getAvailableRewards = useCallback(() => {
    return rewards.filter((reward) => !reward.isRedeemed);
  }, [rewards]);

  /**
   * Get redeemed rewards
   */
  const getRedeemedRewards = useCallback(() => {
    return rewards.filter((reward) => reward.isRedeemed);
  }, [rewards]);

  const value = useMemo(
    () => ({
      rewards,
      isLoading,
      error,
      storageError,
      dataSetAside,
      retryStorage,
      dismissStorageError,
      addReward,
      editReward,
      redeemReward,
      removeReward,
      refreshRewards,
      withRewardsHeld,
      getAvailableRewards,
      getRedeemedRewards,
    }),
    [
      rewards,
      isLoading,
      error,
      storageError,
      dataSetAside,
      retryStorage,
      dismissStorageError,
      addReward,
      editReward,
      redeemReward,
      removeReward,
      refreshRewards,
      withRewardsHeld,
      getAvailableRewards,
      getRedeemedRewards,
    ]
  );

  return (
    <RewardsContext.Provider value={value}>
      {children}
    </RewardsContext.Provider>
  );
}

/**
 * Hook to access rewards context
 * @throws Error if used outside RewardsProvider
 */
export function useRewards(): RewardsContextType {
  const context = useContext(RewardsContext);
  if (!context) {
    throw new Error('useRewards must be used within a RewardsProvider');
  }
  return context;
}
