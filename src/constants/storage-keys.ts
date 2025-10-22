/**
 * AsyncStorage keys used throughout the application
 * Centralized to prevent typos and make refactoring easier
 */

export const STORAGE_KEYS = {
  GOALS: '@pathly:goals',
  THEME_MODE: '@pathly:theme_mode',
  LANGUAGE: '@pathly:language',
} as const;

export const REWARDS_KEY = '@pathly_rewards';
