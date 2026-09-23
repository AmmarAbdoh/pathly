/**
 * Rewards context provider
 * Manages global rewards state and operations
 */

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
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
   */
  const commit = useCallback(async (updater: (prev: Reward[]) => Reward[]) => {
    const next = updater(rewardsRef.current);
    rewardsRef.current = next;
    setRewards(next);
    await rewardsStorage.saveRewards(next);
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
    } catch (err) {
      console.error('Error loading rewards:', err);
      setError('Failed to load rewards');
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

  const replaceAllRewards = useCallback(
    async (next: Reward[]) => {
      await commit(() => next);
    },
    [commit]
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
      addReward,
      editReward,
      redeemReward,
      removeReward,
      refreshRewards,
      replaceAllRewards,
      getAvailableRewards,
      getRedeemedRewards,
    }),
    [rewards, isLoading, error, addReward, editReward, redeemReward, removeReward, refreshRewards, replaceAllRewards, getAvailableRewards, getRedeemedRewards]
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
