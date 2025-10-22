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
   */
  async loadRewards(): Promise<Reward[]> {
    try {
      const rewardsData = await AsyncStorage.getItem(REWARDS_KEY);
      if (!rewardsData) {
        return [];
      }
      return JSON.parse(rewardsData);
    } catch (error) {
      console.error('Error loading rewards:', error);
      return [];
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
