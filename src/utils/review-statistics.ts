/**
 * Review statistics utility
 * Calculate weekly/monthly review statistics
 */

import { Goal } from '../types';

export interface ReviewPeriod {
  startDate: number;
  endDate: number;
  label: string;
}

export interface ReviewStatistics {
  goalsCompleted: number;
  totalGoals: number;
  completionRate: number;
  pointsEarned: number;
  completedGoalsList: Goal[];
}

/**
 * Get the start and end dates for this week
 */
export function getThisWeek(): ReviewPeriod {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  endDate.setHours(23, 59, 59, 999);
  
  return {
    startDate: startDate.getTime(),
    endDate: endDate.getTime(),
    label: 'This Week',
  };
}

/**
 * Get the start and end dates for last week
 */
export function getLastWeek(): ReviewPeriod {
  const thisWeek = getThisWeek();
  const startDate = new Date(thisWeek.startDate);
  startDate.setDate(startDate.getDate() - 7);
  
  const endDate = new Date(thisWeek.startDate);
  endDate.setMilliseconds(-1);
  
  return {
    startDate: startDate.getTime(),
    endDate: endDate.getTime(),
    label: 'Last Week',
  };
}

/**
 * Get the start and end dates for this month
 */
export function getThisMonth(): ReviewPeriod {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  return {
    startDate: startDate.getTime(),
    endDate: endDate.getTime(),
    label: 'This Month',
  };
}

/**
 * Get the start and end dates for last month
 */
export function getLastMonth(): ReviewPeriod {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  
  return {
    startDate: startDate.getTime(),
    endDate: endDate.getTime(),
    label: 'Last Month',
  };
}

/**
 * Calculate review statistics for a given period
 */
export function calculateReviewStatistics(
  goals: Goal[],
  period: ReviewPeriod
): ReviewStatistics {
  // Filter goals that were completed in this period
  const completedInPeriod = goals.filter((goal) => {
    if (!goal.completedAt) return false;
    return goal.completedAt >= period.startDate && goal.completedAt <= period.endDate;
  });
  
  // Filter goals that existed during this period (created before period end)
  const activeInPeriod = goals.filter((goal) => {
    return goal.createdAt <= period.endDate && !goal.isArchived;
  });
  
  // Calculate points earned from goals completed in this period
  const pointsEarned = completedInPeriod.reduce((sum, goal) => sum + (goal.points || 0), 0);
  
  // Calculate completion rate
  const totalGoals = activeInPeriod.length;
  const completionRate = totalGoals > 0 ? (completedInPeriod.length / totalGoals) * 100 : 0;
  
  return {
    goalsCompleted: completedInPeriod.length,
    totalGoals,
    completionRate,
    pointsEarned,
    completedGoalsList: completedInPeriod,
  };
}

/**
 * Get motivational message based on completion rate
 */
export function getMotivationalMessage(completionRate: number): string {
  if (completionRate === 100) {
    return 'excellentWork';
  } else if (completionRate >= 50) {
    return 'goodProgress';
  } else if (completionRate > 0) {
    return 'keepGoing';
  } else {
    return 'startWorking';
  }
}
