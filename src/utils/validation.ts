/**
 * Validation utilities for form inputs
 */

import { VALIDATION_RULES } from '../constants/validation';
import { GoalFormData } from '../types';

/**
 * What is wrong with a field, as a key of `t.validation`: the screen shows it
 * in the user's language. These were English sentences, which no screen could
 * show - so the goal form never called this, and missed its length and range
 * rules.
 */
export type ValidationKey =
  | 'titleRequired'
  | 'titleTooLong'
  | 'targetRequired'
  | 'targetMin'
  | 'targetMax'
  | 'currentRequired'
  | 'currentMin'
  | 'currentMax'
  | 'currentBelowTarget'
  | 'currentAboveTarget'
  | 'unitRequired'
  | 'unitTooLong'
  | 'pointsMin'
  | 'pointsMax';

export interface ValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof GoalFormData, ValidationKey>>;
}

/**
 * Validate goal form data
 * @param data - Form data to validate
 * @returns Validation result with errors if any
 */
export const validateGoalForm = (
  data: Partial<GoalFormData>
): ValidationResult => {
  const errors: ValidationResult['errors'] = {};

  // Title validation
  if (!data.title || data.title.trim().length < VALIDATION_RULES.GOAL_TITLE.MIN_LENGTH) {
    errors.title = 'titleRequired';
  } else if (data.title.length > VALIDATION_RULES.GOAL_TITLE.MAX_LENGTH) {
    errors.title = 'titleTooLong';
  }

  // Target validation
  if (data.target === undefined || data.target === null) {
    errors.target = 'targetRequired';
  } else if (data.target < VALIDATION_RULES.GOAL_TARGET.MIN) {
    errors.target = 'targetMin';
  } else if (data.target > VALIDATION_RULES.GOAL_TARGET.MAX) {
    errors.target = 'targetMax';
  }

  // Current validation
  if (data.current === undefined || data.current === null) {
    errors.current = 'currentRequired';
  } else if (data.current < VALIDATION_RULES.GOAL_CURRENT.MIN) {
    errors.current = 'currentMin';
  } else if (data.current > VALIDATION_RULES.GOAL_CURRENT.MAX) {
    errors.current = 'currentMax';
  }

  // Where the goal starts must be short of its target, in its direction. One
  // already there - a Decreasing goal from 0 to 70, as every template filled in
  // - was accepted, and its progress meant nothing.
  if (!errors.current && !errors.target && data.current !== undefined && data.target !== undefined) {
    if (data.direction === 'increase' && data.current >= data.target) {
      errors.current = 'currentBelowTarget';
    } else if (data.direction === 'decrease' && data.current <= data.target) {
      errors.current = 'currentAboveTarget';
    }
  }

  // Unit validation
  if (!data.unit || data.unit.trim().length < VALIDATION_RULES.GOAL_UNIT.MIN_LENGTH) {
    errors.unit = 'unitRequired';
  } else if (data.unit.length > VALIDATION_RULES.GOAL_UNIT.MAX_LENGTH) {
    errors.unit = 'unitTooLong';
  }

  // Points validation
  if (data.points !== undefined && data.points !== null) {
    if (data.points < VALIDATION_RULES.GOAL_POINTS.MIN) {
      errors.points = 'pointsMin';
    } else if (data.points > VALIDATION_RULES.GOAL_POINTS.MAX) {
      errors.points = 'pointsMax';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate numeric input
 * @param value - String value to validate
 * @returns True if valid number
 */
export const isValidNumber = (value: string): boolean => {
  // Check if the entire string is a valid number (no trailing characters)
  const trimmed = value.trim();
  if (trimmed === '') return false;
  
  const num = parseFloat(trimmed);
  if (isNaN(num) || !isFinite(num)) return false;
  
  // Ensure the string representation matches the parsed number
  // This prevents cases like "12abc" which parseFloat would accept
  return trimmed === num.toString() || trimmed === String(num);
};
