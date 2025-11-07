/**
 * AsyncStorage keys used throughout the application
 * Centralized to prevent typos and make refactoring easier
 */

export const STORAGE_KEYS = {
  GOALS: '@pathly:goals',
  THEME_MODE: '@pathly:theme_mode',
  LANGUAGE: '@pathly:language',
  LIFETIME_POINTS: '@pathly:lifetime_points',
  CUSTOM_TEMPLATES: '@pathly:custom_templates',
} as const;

export const REWARDS_KEY = '@pathly_rewards';
