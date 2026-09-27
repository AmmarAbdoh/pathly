/**
 * AsyncStorage keys used throughout the application
 * Centralized to prevent typos and make refactoring easier
 */

export const STORAGE_KEYS = {
  GOALS: '@pathly:goals',
  THEME_MODE: '@pathly:theme_mode',
  LANGUAGE: '@pathly:language',
  /**
   * Legacy: lifetime points as one number, before the ledger. Read once, to
   * start the ledger from; never written.
   */
  LIFETIME_POINTS: '@pathly:lifetime_points',
  /** Every payout of points (PointsEntry[]); lifetime points are its total. */
  POINTS_LEDGER: '@pathly:points_ledger',
  CUSTOM_TEMPLATES: '@pathly:custom_templates',
} as const;

export const REWARDS_KEY = '@pathly_rewards';
