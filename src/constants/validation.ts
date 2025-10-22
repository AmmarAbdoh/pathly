/**
 * Validation constants and rules for form inputs
 */

export const VALIDATION_RULES = {
  GOAL_TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
  },
  GOAL_TARGET: {
    MIN: 0.01,
    MAX: 1000000,
  },
  GOAL_CURRENT: {
    MIN: 0,
    MAX: 1000000,
  },
  GOAL_UNIT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 20,
  },
  GOAL_POINTS: {
    MIN: 0,
    MAX: 100000,
  },
} as const;

export const ERROR_MESSAGES = {
  INVALID_NUMBER: 'Please enter a valid number',
  REQUIRED_FIELD: 'This field is required',
  GOAL_NOT_FOUND: 'Goal not found',
  DELETE_CONFIRMATION: 'Are you sure you want to delete this goal?',
  UPDATE_SUCCESS: 'Progress updated successfully',
} as const;
