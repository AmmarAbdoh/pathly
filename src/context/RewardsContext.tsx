/**
 * Rewards context provider
 * Manages global rewards state and operations
 */

import { Reward } from '@/src/types';
import { rewardsStorage } from '@/src/utils/rewards-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface RewardsContextType {
  rewards: Reward[];
  isLoading: boolean;
  error: string | null;
  addReward: (title: string, description: string, pointsCost: number, icon: string) => Promise<void>;
  editReward: (id: number, title: string, description: string, pointsCost: number, icon: string) => Promise<void>;
  redeemReward: (id: number) => Promise<void>;
  removeReward: (id: number) => Promise<void>;
  refreshRewards: () => Promise<void>;
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

  // Load rewards on mount
  useEffect(() => {
    loadRewards();
  }, []);

  /**
   * Load rewards from storage
   */
  const loadRewards = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const savedRewards = await rewardsStorage.loadRewards();
      setRewards(savedRewards);
    } catch (err) {
      console.error('Error loading rewards:', err);
      setError('Failed to load rewards');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh rewards from storage
   */
  const refreshRewards = useCallback(async () => {
    await loadRewards();
  }, []);

  /**
   * Add a new reward
   */
  const addReward = useCallback(
    async (title: string, description: string, pointsCost: number, icon: string) => {
      try {
        const newReward: Reward = {
          id: Date.now(),
          title: title.trim(),
          description: description.trim(),
          pointsCost,
          icon,
          createdAt: Date.now(),
          isRedeemed: false,
        };

        const updatedRewards = [...rewards, newReward];
        setRewards(updatedRewards);
        await rewardsStorage.saveRewards(updatedRewards);
      } catch (err) {
        console.error('Error adding reward:', err);
        setError('Failed to add reward');
        throw err;
      }
    },
    [rewards]
  );

  /**
   * Edit an existing reward
   */
  const editReward = useCallback(
    async (id: number, title: string, description: string, pointsCost: number, icon: string) => {
      try {
        const updatedRewards = rewards.map((reward) => {
          if (reward.id === id) {
            return {
              ...reward,
              title: title.trim(),
              description: description.trim(),
              pointsCost,
              icon,
            };
          }
          return reward;
        });

        setRewards(updatedRewards);
        await rewardsStorage.saveRewards(updatedRewards);
      } catch (err) {
        console.error('Error editing reward:', err);
        setError('Failed to edit reward');
        throw err;
      }
    },
    [rewards]
  );

  /**
   * Redeem a reward
   */
  const redeemReward = useCallback(
    async (id: number) => {
      try {
        const updatedRewards = rewards.map((reward) => {
          if (reward.id === id) {
            return {
              ...reward,
              isRedeemed: true,
              redeemedAt: Date.now(),
            };
          }
          return reward;
        });

        setRewards(updatedRewards);
        await rewardsStorage.saveRewards(updatedRewards);
      } catch (err) {
        console.error('Error redeeming reward:', err);
        setError('Failed to redeem reward');
        throw err;
      }
    },
    [rewards]
  );

  /**
   * Remove a reward
   */
  const removeReward = useCallback(
    async (id: number) => {
      try {
        const updatedRewards = rewards.filter((reward) => reward.id !== id);
        setRewards(updatedRewards);
        await rewardsStorage.saveRewards(updatedRewards);
      } catch (err) {
        console.error('Error removing reward:', err);
        setError('Failed to remove reward');
        throw err;
      }
    },
    [rewards]
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
      getAvailableRewards,
      getRedeemedRewards,
    }),
    [rewards, isLoading, error, addReward, editReward, redeemReward, removeReward, refreshRewards, getAvailableRewards, getRedeemedRewards]
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
