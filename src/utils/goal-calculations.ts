/**
 * Utility functions for goal progress calculations
 * Keeps business logic separate from UI components
 */

import { Goal, GoalDirection } from '../types';

/**
 * Calculate progress percentage for a goal with subgoals
 * If goal has subgoals, returns average of subgoal progress
 * Otherwise calculates based on current/target values
 * @param goal - The goal to calculate progress for
 * @param allGoals - All goals (needed to find subgoals)
 * @returns Progress as a percentage (0-100)
 */
export const calculateGoalProgress = (
  goal: Goal,
  allGoals: Goal[]
): number => {
  // If goal has subgoals, calculate average of subgoal progress
  if (goal.subGoals && goal.subGoals.length > 0) {
    const subgoalProgresses = goal.subGoals
      .map(subgoalId => allGoals.find(g => g.id === subgoalId))
      .filter((subgoal): subgoal is Goal => subgoal !== undefined)
      .map(subgoal => calculateGoalProgress(subgoal, allGoals));
    
    if (subgoalProgresses.length === 0) return 0;
    
    const sum = subgoalProgresses.reduce((acc, progress) => acc + progress, 0);
    return sum / subgoalProgresses.length;
  }
  
  // Otherwise calculate based on current/target
  return calculateProgress(
    goal.current,
    goal.target,
    goal.direction,
    goal.initialValue
  );
};

/**
 * Calculate progress percentage based on current value, target, and direction
 * @param current - Current progress value
 * @param target - Target value to reach  
 * @param direction - Whether goal is increasing or decreasing
 * @param initialValue - Starting value (required for decreasing goals)
 * @returns Progress as a percentage (0-100)
 */
export const calculateProgress = (
  current: number,
  target: number,
  direction: GoalDirection,
  initialValue?: number
): number => {
  if (target <= 0) return 0;

  let progress: number;
  
  if (direction === 'increase') {
    // For increasing goals: progress = (current / target) * 100
    // Example: Reading 5/20 books = 25%
    progress = (current / target) * 100;
  } else {
    // For decreasing goals: progress = ((initial - current) / (initial - target)) * 100
    // Example: Weight loss 80kg → 60kg, currently at 70kg
    // Progress = ((80 - 70) / (80 - 60)) * 100 = (10 / 20) * 100 = 50%
    const initial = initialValue ?? current;
    const totalDistance = initial - target;
    
    if (totalDistance <= 0) {
      // If initial <= target, goal is already complete or invalid
      return current <= target ? 100 : 0;
    }
    
    const progressDistance = initial - current;
    progress = (progressDistance / totalDistance) * 100;
  }

  return Math.max(0, Math.min(100, progress));
};

/**
 * Format progress display text
 * @param current - Current progress value
 * @param target - Target value
 * @param unit - Unit of measurement
 * @returns Formatted string like "5 / 20 kg"
 */
export const formatProgressText = (
  current: number,
  target: number,
  unit: string
): string => {
  return `${current} / ${target} ${unit}`;
};

/**
 * Check if a goal is completed
 * @param progress - Progress as percentage (0-100)
 * @returns True if goal is 100% or more complete
 */
export const isGoalCompleted = (progress: number): boolean => {
  return progress >= 100;
};

/**
 * Calculate the end date for a goal based on its period
 * @param periodStartDate - Start date timestamp
 * @param period - Time period type
 * @param customPeriodDays - Number of days for custom period
 * @returns End date timestamp
 */
export const calculatePeriodEndDate = (
  periodStartDate: number,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  customPeriodDays?: number
): number => {
  const startDate = new Date(periodStartDate);
  const endDate = new Date(startDate);

  switch (period) {
    case 'daily':
      endDate.setDate(endDate.getDate() + 1);
      break;
    case 'weekly':
      endDate.setDate(endDate.getDate() + 7);
      break;
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    case 'custom':
      endDate.setDate(endDate.getDate() + (customPeriodDays || 1));
      break;
  }

  return endDate.getTime();
};

/**
 * Calculate time remaining for a goal
 * @param periodStartDate - Start date timestamp
 * @param period - Time period type
 * @param customPeriodDays - Number of days for custom period
 * @param isRecurring - Whether the goal is recurring (affects expiry behavior)
 * @returns Object with time remaining info
 */
export const calculateTimeRemaining = (
  periodStartDate: number | undefined,
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
  customPeriodDays?: number,
  isRecurring?: boolean
): {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
  totalMs: number;
} => {
  if (!periodStartDate) {
    return { days: 0, hours: 0, minutes: 0, isExpired: false, totalMs: 0 };
  }

  const endDate = calculatePeriodEndDate(periodStartDate, period, customPeriodDays);
  const now = Date.now();
  const diff = endDate - now;

  if (diff <= 0) {
    // For recurring goals, "expired" means "will reset", not failed
    return { days: 0, hours: 0, minutes: 0, isExpired: !isRecurring, totalMs: 0 };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isExpired: false, totalMs: diff };
};

/**
 * Format time remaining as a human-readable string
 * @param timeRemaining - Time remaining object from calculateTimeRemaining
 * @param translations - Translation object for localized strings
 * @param isRecurring - Whether the goal is recurring (affects wording)
 * @returns Formatted string like "3 days 5 hours left" or "Expired"
 */
export const formatTimeRemaining = (
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    isExpired: boolean;
  },
  translations?: { 
    days?: string; 
    hours?: string; 
    minutes?: string; 
    day?: string;
    hour?: string;
    minute?: string;
    dayDual?: string;      // For 2 (Arabic dual form)
    hourDual?: string;
    minuteDual?: string;
    left?: string;
    expired?: string;
    resetsIn?: string;
    and?: string;          // Separator between time units
  },
  isRecurring?: boolean
): string => {
  if (timeRemaining.isExpired) {
    return translations?.expired || 'Expired';
  }

  const { days, hours, minutes } = timeRemaining;
  const parts: string[] = [];

  // Helper function to get the correct form based on number (handles Arabic dual/plural)
  const getTimeLabel = (count: number, singular?: string, dual?: string, plural?: string): string => {
    if (count === 1) return singular || '';
    if (count === 2 && dual) return dual;
    if (count >= 11) return singular || '';  // Arabic: 11+ uses singular form
    return plural || singular || '';         // 3-10 uses plural
  };

  if (days > 0) {
    const dayLabel = getTimeLabel(days, translations?.day, translations?.dayDual, translations?.days);
    parts.push(`${days} ${dayLabel}`);
    if (hours > 0) {
      const hourLabel = getTimeLabel(hours, translations?.hour, translations?.hourDual, translations?.hours);
      parts.push(`${hours} ${hourLabel}`);
    }
    // Skip minutes when we have days (too much detail)
  } else if (hours > 0) {
    const hourLabel = getTimeLabel(hours, translations?.hour, translations?.hourDual, translations?.hours);
    parts.push(`${hours} ${hourLabel}`);
    if (minutes > 0) {
      const minuteLabel = getTimeLabel(minutes, translations?.minute, translations?.minuteDual, translations?.minutes);
      parts.push(`${minutes} ${minuteLabel}`);
    }
  } else {
    const minuteLabel = getTimeLabel(minutes, translations?.minute, translations?.minuteDual, translations?.minutes);
    parts.push(`${minutes} ${minuteLabel}`);
  }

  const separator = translations?.and || 'and';
  const timeString = parts.join(` ${separator} `);
  const suffix = translations?.left || 'left';
  
  // For recurring goals, use "Resets in" instead of "left"
  if (isRecurring && translations?.resetsIn) {
    return `${translations.resetsIn} ${timeString}`;
  }
  
  return `${timeString} ${suffix}`;
};
