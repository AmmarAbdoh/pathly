/**
 * Rewards storage utilities
 * Handles persistent storage for rewards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { REWARDS_KEY } from '../constants/storage-keys';
import { Reward } from '../types';

/**
 * Rewards storage operations
 */
export const rewardsStorage = {
  /**
   * Load rewards from storage
   * @returns Array of rewards, or empty array if none are stored
   * @throws Error if storage cannot be read, or holds something that is not a
   *   rewards array - never [], which the next save would write over the
   *   user's real rewards.
   */
  async loadRewards(): Promise<Reward[]> {
    try {
      const rewardsData = await AsyncStorage.getItem(REWARDS_KEY);
      if (!rewardsData) {
        return [];
      }
      const rewards: unknown = JSON.parse(rewardsData);
      if (!Array.isArray(rewards)) {
        throw new Error('Stored rewards are not an array');
      }
      return rewards as Reward[];
    } catch (error) {
      console.error('Error loading rewards:', error);
      throw new Error('Failed to load rewards');
    }
  },

  /**
   * Save rewards to storage
   */
  async saveRewards(rewards: Reward[]): Promise<void> {
    try {
      await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
    } catch (error) {
      console.error('Error saving rewards:', error);
      throw error;
    }
  },

  /**
   * Clear all rewards from storage
   */
  async clearRewards(): Promise<void> {
    try {
      await AsyncStorage.removeItem(REWARDS_KEY);
    } catch (error) {
      console.error('Error clearing rewards:', error);
      throw error;
    }
  },
};
