/**
 * Recurring goals utilities
 * Handle automatic reset of recurring goals based on their period
 */

import { Goal, TimePeriod } from '../types';

/**
 * Check if a goal's period has ended and needs to be reset
 */
export function shouldResetGoal(goal: Goal): boolean {
  if (!goal.isRecurring || !goal.periodStartDate) {
    return false;
  }

  const now = Date.now();
  const periodStart = goal.periodStartDate;
  const periodEnd = getPeriodEndDate(periodStart, goal.period, goal.customPeriodDays);

  // If current time is past the period end, goal should reset
  // This applies to both completed and incomplete goals
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
  // Only record completion if the goal was actually completed
  if (!goal.isComplete || !goal.completedAt) {
    return goal;
  }
  
  const completionHistory = goal.completionHistory || [];
  
  return {
    ...goal,
    completionHistory: [...completionHistory, goal.completedAt],
  };
}

/**
 * Check all goals and reset any recurring goals that need it
 */
export function processRecurringGoals(goals: Goal[]): Goal[] {
  return goals.map(goal => {
    // Skip non-recurring goals
    if (!goal.isRecurring) {
      return goal;
    }
    
    // If goal has no periodStartDate, initialize it now
    if (!goal.periodStartDate) {
      return {
        ...goal,
        periodStartDate: Date.now(),
      };
    }
    
    // Check if period has ended and goal needs reset
    if (shouldResetGoal(goal)) {
      // Record this completion before resetting (only if it was completed)
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

/**
 * Calculate streak for a recurring goal
 * A streak is consecutive periods where the goal was completed
 */
export function calculateStreak(goal: Goal): { currentStreak: number; longestStreak: number } {
  if (!goal.isRecurring || !goal.completionHistory || goal.completionHistory.length === 0) {
    // If currently complete but no history, streak is 1
    const current = goal.isComplete ? 1 : 0;
    return { currentStreak: current, longestStreak: current };
  }

  const completions = [...goal.completionHistory];
  
  // Add current completion if goal is complete
  if (goal.isComplete && goal.completedAt) {
    completions.push(goal.completedAt);
  }

  // Sort completions chronologically
  completions.sort((a, b) => a - b);

  if (completions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate period length in milliseconds
  const periodLength = getPeriodLength(goal.period, goal.customPeriodDays);
  
  let currentStreak = 1;
  let longestStreak = 1;
  let tempStreak = 1;

  // Work backwards from most recent completion to calculate current streak
  for (let i = completions.length - 1; i > 0; i--) {
    const timeDiff = completions[i] - completions[i - 1];
    
    // Check if completions are in consecutive periods (allow some tolerance)
    const tolerance = periodLength * 0.1; // 10% tolerance for timing
    if (timeDiff >= periodLength - tolerance && timeDiff <= periodLength * 2 + tolerance) {
      tempStreak++;
    } else {
      break; // Streak broken
    }
  }

  currentStreak = tempStreak;
  longestStreak = tempStreak;

  // Calculate longest streak by checking all consecutive pairs
  tempStreak = 1;
  for (let i = 1; i < completions.length; i++) {
    const timeDiff = completions[i] - completions[i - 1];
    const tolerance = periodLength * 0.1;
    
    if (timeDiff >= periodLength - tolerance && timeDiff <= periodLength * 2 + tolerance) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1; // Reset temp streak
    }
  }

  // Check if streak should be broken (missed the current period)
  if (completions.length > 0) {
    const lastCompletion = completions[completions.length - 1];
    const now = Date.now();
    const timeSinceLastCompletion = now - lastCompletion;
    
    // If more than one period has passed without completion, streak is broken
    if (timeSinceLastCompletion > periodLength * 1.5 && !goal.isComplete) {
      currentStreak = 0;
    }
  }

  return { currentStreak, longestStreak };
}

/**
 * Get period length in milliseconds
 */
function getPeriodLength(period: TimePeriod, customPeriodDays?: number): number {
  switch (period) {
    case 'daily':
      return 24 * 60 * 60 * 1000;
    case 'weekly':
      return 7 * 24 * 60 * 60 * 1000;
    case 'monthly':
      return 30 * 24 * 60 * 60 * 1000; // Approximate
    case 'yearly':
      return 365 * 24 * 60 * 60 * 1000; // Approximate
    case 'custom':
      return (customPeriodDays || 1) * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Update goal streaks based on completion history
 */
export function updateGoalStreaks(goal: Goal): Goal {
  if (!goal.isRecurring) {
    return goal;
  }

  const { currentStreak, longestStreak } = calculateStreak(goal);
  
  return {
    ...goal,
    currentStreak,
    longestStreak: Math.max(longestStreak, goal.longestStreak || 0),
  };
}
