/**
 * Rewards storage utilities
 * Handles persistent storage for rewards
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { REWARDS_KEY } from '../constants/storage-keys';
import { Reward } from '../types';
import { parseStoredList } from './storage';

/**
 * Rewards storage operations
 */
export const rewardsStorage = {
  /**
   * Load rewards from storage
   * @returns Array of rewards, or empty array if none are stored
   * @throws UnreadableDataError if what is stored is not a rewards list, or an
   *   Error if storage cannot be read at all - never [], which the next save
   *   would write over the user's real rewards.
   */
  async loadRewards(): Promise<Reward[]> {
    let rewardsData: string | null;
    try {
      rewardsData = await AsyncStorage.getItem(REWARDS_KEY);
    } catch (error) {
      console.error('Error loading rewards:', error);
      throw new Error('Failed to load rewards');
    }
    if (!rewardsData) {
      return [];
    }
    return parseStoredList(rewardsData, 'rewards') as unknown as Reward[];
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
