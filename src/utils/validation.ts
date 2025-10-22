/**
 * Validation utilities for form inputs
 */

import { VALIDATION_RULES } from '../constants/validation';
import { GoalFormData } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validate goal form data
 * @param data - Form data to validate
 * @returns Validation result with errors if any
 */
export const validateGoalForm = (
  data: Partial<GoalFormData>
): ValidationResult => {
  const errors: Record<string, string> = {};

  // Title validation
  if (!data.title || data.title.trim().length < VALIDATION_RULES.GOAL_TITLE.MIN_LENGTH) {
    errors.title = 'Title is required';
  } else if (data.title.length > VALIDATION_RULES.GOAL_TITLE.MAX_LENGTH) {
    errors.title = `Title must be less than ${VALIDATION_RULES.GOAL_TITLE.MAX_LENGTH} characters`;
  }

  // Target validation
  if (data.target === undefined || data.target === null) {
    errors.target = 'Target is required';
  } else if (data.target < VALIDATION_RULES.GOAL_TARGET.MIN) {
    errors.target = `Target must be at least ${VALIDATION_RULES.GOAL_TARGET.MIN}`;
  } else if (data.target > VALIDATION_RULES.GOAL_TARGET.MAX) {
    errors.target = `Target must be less than ${VALIDATION_RULES.GOAL_TARGET.MAX}`;
  }

  // Current validation
  if (data.current === undefined || data.current === null) {
    errors.current = 'Current value is required';
  } else if (data.current < VALIDATION_RULES.GOAL_CURRENT.MIN) {
    errors.current = `Current value must be at least ${VALIDATION_RULES.GOAL_CURRENT.MIN}`;
  } else if (data.current > VALIDATION_RULES.GOAL_CURRENT.MAX) {
    errors.current = `Current value must be less than ${VALIDATION_RULES.GOAL_CURRENT.MAX}`;
  }

  // Unit validation
  if (!data.unit || data.unit.trim().length < VALIDATION_RULES.GOAL_UNIT.MIN_LENGTH) {
    errors.unit = 'Unit is required';
  } else if (data.unit.length > VALIDATION_RULES.GOAL_UNIT.MAX_LENGTH) {
    errors.unit = `Unit must be less than ${VALIDATION_RULES.GOAL_UNIT.MAX_LENGTH} characters`;
  }

  // Points validation
  if (data.points !== undefined && data.points !== null) {
    if (data.points < VALIDATION_RULES.GOAL_POINTS.MIN) {
      errors.points = `Points must be at least ${VALIDATION_RULES.GOAL_POINTS.MIN}`;
    } else if (data.points > VALIDATION_RULES.GOAL_POINTS.MAX) {
      errors.points = `Points must be less than ${VALIDATION_RULES.GOAL_POINTS.MAX}`;
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
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
};
