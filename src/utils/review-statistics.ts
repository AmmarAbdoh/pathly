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
 * Every time a goal was completed: a recurring goal's earlier periods, then
 * the latest. Once each - a goal set back and completed again pays nothing
 * again (see hasBeenCompleted), and its completedAt is still the first time.
 */
function completionTimes(goal: Goal): number[] {
  const times = [...(goal.completionHistory ?? [])];
  if (typeof goal.completedAt === 'number') times.push(goal.completedAt);
  return times;
}

/**
 * Calculate review statistics for a given period.
 *
 * Counts follow the Stats screen (goals, not subgoals), and points follow what
 * was paid: every completion of a recurring goal, and a subgoal's only when its
 * parent lets subgoals award points. Summing the points of every goal completed
 * in the period counted subgoals that paid nothing and each recurring goal
 * once, and its total of goals included subgoals.
 */
export function calculateReviewStatistics(
  goals: Goal[],
  period: ReviewPeriod
): ReviewStatistics {
  const inPeriod = (time: number) => time >= period.startDate && time <= period.endDate;
  const completionsInPeriod = (goal: Goal) => completionTimes(goal).filter(inPeriod).length;

  const byId = new Map(goals.map((goal) => [goal.id, goal]));
  const pays = (goal: Goal) =>
    !goal.parentId || byId.get(goal.parentId)?.subgoalsAwardPoints === true;

  // Created by the period's end, and not put away before it began.
  const existedInPeriod = (goal: Goal) =>
    goal.createdAt <= period.endDate &&
    (!goal.isArchived || (typeof goal.archivedAt === 'number' && goal.archivedAt >= period.startDate));

  const goalsInPeriod = goals.filter((goal) => !goal.parentId && existedInPeriod(goal));
  const completedInPeriod = goalsInPeriod.filter((goal) => completionsInPeriod(goal) > 0);

  const pointsEarned = goals.reduce(
    (sum, goal) => (pays(goal) ? sum + (goal.points || 0) * completionsInPeriod(goal) : sum),
    0
  );

  const totalGoals = goalsInPeriod.length;
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
