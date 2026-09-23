/**
 * Rewards context provider
 * Manages global rewards state and operations
 */

import { useGoals } from '@/src/context/GoalsContext';
import { Reward } from '@/src/types';
import { nextId } from '@/src/utils/ids';
import { rewardsStorage } from '@/src/utils/rewards-storage';
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

interface RewardsContextType {
  rewards: Reward[];
  isLoading: boolean;
  error: string | null;
  /**
   * 'load' when rewards could not be read. Every change is refused until a
   * reload (`refreshRewards`) succeeds; shown by StorageErrorBanner.
   */
  storageError: 'load' | null;
  dismissStorageError: () => void;
  addReward: (title: string, description: string, pointsCost: number, icon: string) => Promise<void>;
  editReward: (id: number, title: string, description: string, pointsCost: number, icon: string) => Promise<void>;
  redeemReward: (id: number) => Promise<void>;
  removeReward: (id: number) => Promise<void>;
  refreshRewards: () => Promise<void>;
  /** Replace every reward at once (backup import). */
  replaceAllRewards: (rewards: Reward[]) => Promise<void>;
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
  const [storageError, setStorageError] = useState<'load' | null>(null);

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
   * Apply a pure updater to the latest rewards, render, and persist.
   *
   * Rejects - leaving the rewards as they were - if storage has not been read
   * or the write fails. The screen shows it immediately (the ref chains
   * back-to-back changes), and takes it back if the write fails, so it never
   * shows a reward that is not on disk.
   */
  const commit = useCallback(async (updater: (prev: Reward[]) => Reward[]) => {
    if (loadStateRef.current !== 'loaded') {
      if (loadStateRef.current === 'failed') setStorageError('load');
      throw new Error('Rewards have not loaded');
    }

    const prev = rewardsRef.current;
    const next = updater(prev);
    if (next === prev) return;

    rewardsRef.current = next;
    setRewards(next);
    try {
      await rewardsStorage.saveRewards(next);
    } catch (err) {
      // Unless a later change has already built on this one (its own write
      // carries both).
      if (rewardsRef.current === next) {
        rewardsRef.current = prev;
        setRewards(prev);
      }
      throw err;
    }
  }, []);

  /**
   * Load rewards from storage
   */
  const loadRewards = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const savedRewards = await rewardsStorage.loadRewards();
      rewardsRef.current = savedRewards;
      setRewards(savedRewards);
      loadStateRef.current = 'loaded';
      setStorageError(null);
    } catch (err) {
      console.error('Error loading rewards:', err);
      setError('Failed to load rewards');
      // Keep whatever was loaded before on screen, but write nothing until a
      // reload succeeds.
      loadStateRef.current = 'failed';
      setStorageError('load');
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const dismissStorageError = useCallback(() => setStorageError(null), []);

  const replaceAllRewards = useCallback(
    async (next: Reward[]) => {
      await commit(() => next);
    },
    [commit]
  );

  // Auto-redeem a goal's linked reward the first time the goal is finished.
  useEffect(
    () =>
      onGoalCompleted(async (goal) => {
        const rewardId = goal.linkedRewardId;
        if (rewardId === undefined) return;

        await commit((prev) =>
          prev.some((reward) => reward.id === rewardId && !reward.isRedeemed)
            ? prev.map((reward) =>
                reward.id === rewardId
                  ? { ...reward, isRedeemed: true, redeemedAt: Date.now() }
                  : reward
              )
            : prev
        );
      }),
    [onGoalCompleted, commit]
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
      dismissStorageError,
      addReward,
      editReward,
      redeemReward,
      removeReward,
      refreshRewards,
      replaceAllRewards,
      getAvailableRewards,
      getRedeemedRewards,
    }),
    [rewards, isLoading, error, storageError, dismissStorageError, addReward,editReward, redeemReward, removeReward, refreshRewards, replaceAllRewards, getAvailableRewards, getRedeemedRewards]
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
