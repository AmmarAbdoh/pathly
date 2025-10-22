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
