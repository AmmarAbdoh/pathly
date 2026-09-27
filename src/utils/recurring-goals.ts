/**
 * Recurring goals utilities
 * Handle automatic reset of recurring goals based on their period
 */

import { Goal, TimePeriod } from '../types';

/**
 * Check if a goal's period has ended and needs to be reset
 */
export function shouldResetGoal(goal: Goal): boolean {
  // One that cannot recur has no period end to pass: an 'ongoing' goal's is
  // its start, so it would reset every time this is asked.
  if (!goal.isRecurring || !goal.periodStartDate || !canRecur(goal)) {
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
 * Whether a goal can be recurring: the one rule, which adding, editing,
 * importing and loading goals, and the goal form, all apply.
 *
 * Only a top-level goal that is not ultimate - no form offers recurring for a
 * subgoal, or for an ultimate goal, whose progress comes from subgoals a reset
 * leaves as they are. And only with a period that ends: `getPeriodEndDate`
 * puts the end of an 'ongoing' period at its start, so such a goal would reset
 * on every load, and likewise a 'custom' one without a length.
 */
export function canRecur(
  goal: Pick<Goal, 'period' | 'customPeriodDays' | 'parentId' | 'isUltimate'>
): boolean {
  if (goal.parentId || goal.isUltimate || goal.period === 'ongoing') return false;
  return goal.period !== 'custom' || isPeriodLength(goal.customPeriodDays);
}

/** The longest custom period: ten years. Past it, the deadline maths runs out of dates. */
export const MAX_PERIOD_DAYS = 3650;

/**
 * A custom period's length: a day or more. Fractions are fine -
 * getPeriodEndDate handles them, and the form once took "1.5" - but a period
 * of a moment ends as it starts, and resets its goal on every load.
 */
export function isPeriodLength(days: unknown): days is number {
  return typeof days === 'number' && Number.isFinite(days) && days >= 1 && days <= MAX_PERIOD_DAYS;
}

/**
 * Whether a goal has been completed - now, or earlier and set back since. Only
 * a first completion pays out its points and redeems its linked reward: -1
 * then +1 paid again. A recurring goal's new period clears completedAt. Tested
 * as a number, not by truthiness: 0 is a time too.
 */
export function hasBeenCompleted(goal: Pick<Goal, 'isComplete' | 'completedAt'>): boolean {
  return Boolean(goal.isComplete) || typeof goal.completedAt === 'number';
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

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Where the period after the one starting at `start` starts: where that one
 * ends - for a daily goal, at the next midnight.
 */
export function nextPeriodStart(start: number, period: TimePeriod, customPeriodDays?: number): number {
  const end = getPeriodEndDate(start, period, customPeriodDays);
  return period === 'daily' ? end + 1 : end;
}

/** Where the period before the one starting at `start` started. */
function previousPeriodStart(start: number, period: TimePeriod, customPeriodDays?: number): number {
  const date = new Date(start);
  switch (period) {
    case 'daily':
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - 1);
      return date.getTime();
    case 'weekly':
      return start - 7 * DAY_MS;
    case 'monthly':
      date.setMonth(date.getMonth() - 1);
      return date.getTime();
    case 'yearly':
      date.setFullYear(date.getFullYear() - 1);
      return date.getTime();
    default:
      // A custom period, or one that cannot recur: as a day when it has no length.
      return start - (customPeriodDays && customPeriodDays > 0 ? customPeriodDays : 1) * DAY_MS;
  }
}

/**
 * The start of the period `now` falls in, stepping on from the one starting at
 * `start` a whole period at a time.
 *
 * Periods keep their boundaries: a week that ends while the app is closed is
 * followed by the next week, not by one starting whenever the app is opened.
 * Starting it on opening made the periods drift, so a streak could not tell
 * back-to-back periods apart, and the early-bird bonus was measured from
 * whenever the app happened to be opened.
 */
export function currentPeriodStart(
  start: number,
  period: TimePeriod,
  customPeriodDays: number | undefined,
  now: number
): number {
  let current = start;
  // Bounded: a daily goal left for 270 years is still found.
  for (let i = 0; i < 100_000 && now >= getPeriodEndDate(current, period, customPeriodDays); i++) {
    const next = nextPeriodStart(current, period, customPeriodDays);
    if (!(next > current)) return now;
    current = next;
  }
  return current;
}

/**
 * Reset a recurring goal to its initial state, starting its new period at
 * `periodStartDate` - by default now, as Reset Now does.
 */
export function resetGoal(goal: Goal, periodStartDate: number = Date.now()): Goal {
  return {
    ...goal,
    current: goal.initialValue,
    progress: 0,
    isComplete: false,
    periodStartDate,
    completedAt: undefined,
    // A new period's timing has not been changed by hand (see bonuses.ts).
    timingChanged: undefined,
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
    // Saved before every way in checked canRecur - the form offered recurring
    // with 'Ongoing', and such a goal reset on every load - it stops
    // recurring. And only a recurring goal has a schedule: the form offers it
    // for no other, and on one the goal was hidden on the other days with no
    // way left to see why, or change it.
    if (!goal.isRecurring || !canRecur(goal)) {
      return goal.isRecurring || goal.schedule
        ? { ...goal, isRecurring: false, schedule: undefined }
        : goal;
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
      // Record this completion before resetting (only if it was completed).
      // The new period is the one now falls in, on the goal's own boundaries.
      const goalWithHistory = recordCompletion(goal);
      return resetGoal(
        goalWithHistory,
        currentPeriodStart(goal.periodStartDate, goal.period, goal.customPeriodDays, Date.now())
      );
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
 * A recurring goal's streaks: its runs of back-to-back periods with a
 * completion in each.
 *
 * Each completion is placed in its period, counting back from the one now
 * falls in (0), and runs are counted over those periods. The current streak
 * is the run ending in this period, or - until this one is completed - in
 * the one before. It used to count completions a set time apart (0.9 to 2.1
 * periods) as consecutive: a week completed on its last day and the next on
 * its first broke the streak, and one completed late and another early two
 * weeks on kept it with a week skipped.
 */
export function calculateStreak(
  goal: Goal,
  now: number = Date.now()
): { currentStreak: number; longestStreak: number } {
  const times = [...(goal.completionHistory ?? [])];
  if (goal.isComplete && typeof goal.completedAt === 'number') times.push(goal.completedAt);

  if (!goal.isRecurring || times.length === 0) {
    // A one-off goal has one period: complete or not.
    const current = goal.isComplete ? 1 : 0;
    return { currentStreak: current, longestStreak: current };
  }

  // Newest first, walked back a period at a time alongside them.
  times.sort((a, b) => b - a);
  const anchor = typeof goal.periodStartDate === 'number' ? goal.periodStartDate : now;
  let start = currentPeriodStart(anchor, goal.period, goal.customPeriodDays, now);
  let index = 0;
  const completed = new Set<number>();
  for (const time of times) {
    for (let i = 0; i < 100_000 && time < start; i++) {
      start = previousPeriodStart(start, goal.period, goal.customPeriodDays);
      index++;
    }
    completed.add(index);
  }

  const runFrom = (first: number) => {
    let length = 0;
    while (completed.has(first + length)) length++;
    return length;
  };
  const currentStreak = completed.has(0) ? runFrom(0) : runFrom(1);

  let longestStreak = 0;
  for (const period of completed) {
    if (!completed.has(period - 1)) longestStreak = Math.max(longestStreak, runFrom(period));
  }

  return { currentStreak, longestStreak };
}

/**
 * Update goal streaks based on completion history
 */
export function updateGoalStreaks(goal: Goal): Goal {
  if (!goal.isRecurring) {
    return goal;
  }

  const { currentStreak, longestStreak } = calculateStreak(goal);
  const longest = Math.max(longestStreak, goal.longestStreak || 0);

  // As it was when nothing changed: that is how a load tells it has nothing
  // to save.
  if (currentStreak === goal.currentStreak && longest === goal.longestStreak) {
    return goal;
  }

  return { ...goal, currentStreak, longestStreak: longest };
}
