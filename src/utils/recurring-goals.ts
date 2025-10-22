/**
 * Recurring goals utilities
 * Handle automatic reset of recurring goals based on their period
 */

import { Goal, TimePeriod } from '../types';

/**
 * Check if a goal's period has ended and needs to be reset
 */
export function shouldResetGoal(goal: Goal): boolean {
  if (!goal.isRecurring || !goal.isComplete || !goal.completedAt || !goal.periodStartDate) {
    return false;
  }

  const now = Date.now();
  const periodStart = goal.periodStartDate;
  const periodEnd = getPeriodEndDate(periodStart, goal.period, goal.customPeriodDays);

  // If current time is past the period end, goal should reset
  return now >= periodEnd;
}

/**
 * Calculate the end date of a period given its start date
 */
export function getPeriodEndDate(
  startDate: number,
  period: TimePeriod,
  customPeriodDays?: number
): number {
  const start = new Date(startDate);
  
  switch (period) {
    case 'daily':
      // End of the day
      const endOfDay = new Date(start);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.getTime();
      
    case 'weekly':
      // 7 days from start
      return startDate + 7 * 24 * 60 * 60 * 1000;
      
    case 'monthly':
      // Same day next month
      const nextMonth = new Date(start);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth.getTime();
      
    case 'yearly':
      // Same day next year
      const nextYear = new Date(start);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      return nextYear.getTime();
      
    case 'custom':
      if (!customPeriodDays) return startDate;
      return startDate + customPeriodDays * 24 * 60 * 60 * 1000;
      
    default:
      return startDate;
  }
}

/**
 * Reset a recurring goal to its initial state
 */
export function resetGoal(goal: Goal): Goal {
  return {
    ...goal,
    current: goal.initialValue,
    progress: 0,
    isComplete: false,
    periodStartDate: Date.now(), // Start new period
    completedAt: undefined,
    // Keep completion history
    completionHistory: goal.completionHistory || [],
  };
}

/**
 * Record completion in history and prepare for reset
 */
export function recordCompletion(goal: Goal): Goal {
  const completionHistory = goal.completionHistory || [];
  
  return {
    ...goal,
    completionHistory: [...completionHistory, goal.completedAt || Date.now()],
  };
}

/**
 * Check all goals and reset any recurring goals that need it
 */
export function processRecurringGoals(goals: Goal[]): Goal[] {
  return goals.map(goal => {
    if (shouldResetGoal(goal)) {
      // Record this completion before resetting
      const goalWithHistory = recordCompletion(goal);
      return resetGoal(goalWithHistory);
    }
    return goal;
  });
}

/**
 * Get the number of times a recurring goal has been completed
 */
export function getCompletionCount(goal: Goal): number {
  if (!goal.isRecurring) return goal.isComplete ? 1 : 0;
  
  const historyCount = goal.completionHistory?.length || 0;
  const currentComplete = goal.isComplete ? 1 : 0;
  
  return historyCount + currentComplete;
}

/**
 * Get total points earned from a recurring goal (including all completions)
 */
export function getTotalPointsEarned(goal: Goal): number {
  return getCompletionCount(goal) * goal.points;
}

/**
 * Format time remaining until period ends
 */
export function getTimeRemaining(goal: Goal): string {
  if (!goal.periodStartDate) return '';
  
  const now = Date.now();
  const periodEnd = getPeriodEndDate(goal.periodStartDate, goal.period, goal.customPeriodDays);
  const remaining = periodEnd - now;
  
  if (remaining <= 0) return 'Period ended';
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) {
    return `${days}d ${hours}h remaining`;
  }
  
  if (hours > 0) {
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${minutes}m remaining`;
  }
  
  const minutes = Math.floor(remaining / (60 * 1000));
  return `${minutes}m remaining`;
}
