/**
 * Goal scheduling utilities
 * Handle scheduled goals that appear only on specific days/dates
 */

import type { Translations } from '../i18n/translations';
import { Goal, GoalSchedule } from '../types';

/** The slice of translations the schedule formatters need. */
export type ScheduleTranslations = Translations['schedule'];

/**
 * Check if a goal should be active/visible on a given date
 */
export function isGoalActiveOnDate(goal: Goal, date: Date = new Date()): boolean {
  // If no schedule is set, goal is always active
  if (!goal.schedule) {
    return true;
  }

  const schedule = goal.schedule;
  
  // Check weekly schedule (specific days of week)
  if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return schedule.daysOfWeek.includes(dayOfWeek);
  }

  // Check monthly schedule (specific dates)
  if (schedule.datesOfMonth && schedule.datesOfMonth.length > 0) {
    const dateOfMonth = date.getDate(); // 1-31
    return schedule.datesOfMonth.includes(dateOfMonth);
  }

  // Check monthly date range (e.g., 20-25)
  if (schedule.dateRangeStart !== undefined && schedule.dateRangeEnd !== undefined) {
    const dateOfMonth = date.getDate();
    return dateOfMonth >= schedule.dateRangeStart && dateOfMonth <= schedule.dateRangeEnd;
  }

  // If schedule exists but no valid conditions, treat as always active
  return true;
}

/**
 * Filter goals to show only those active on current date
 */
export function filterActiveGoals(goals: Goal[], date: Date = new Date()): Goal[] {
  return goals.filter(goal => isGoalActiveOnDate(goal, date));
}

/**
 * True when a schedule places no restriction on which days the goal appears.
 *
 * Callers use this to decide whether a schedule is worth surfacing in the UI,
 * rather than string-comparing against a localized "Every day" label.
 */
export function isEveryDaySchedule(schedule?: GoalSchedule): boolean {
  if (!schedule) return true;

  return (
    !schedule.daysOfWeek?.length &&
    !schedule.datesOfMonth?.length &&
    (schedule.dateRangeStart === undefined || schedule.dateRangeEnd === undefined)
  );
}

/**
 * Get a human-readable, localized description of a goal schedule.
 *
 * Takes the translation slice rather than importing it, so this stays pure and
 * testable in both languages.
 */
export function getScheduleDescription(
  schedule: GoalSchedule | undefined,
  t: ScheduleTranslations
): string {
  if (!schedule) {
    return t.everyDay;
  }

  // Days of week schedule
  if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
    const days = schedule.daysOfWeek
      .map((d) => t.weekdayShort[d] ?? String(d))
      .join(', ');
    return t.everyDays.replace('{days}', days);
  }

  // Specific dates of month. Copy before sorting - the array belongs to the
  // stored goal and must not be mutated.
  if (schedule.datesOfMonth && schedule.datesOfMonth.length > 0) {
    const dates = [...schedule.datesOfMonth].sort((a, b) => a - b).join(', ');
    return t.monthlyOnDays.replace('{dates}', dates);
  }

  // Date range
  if (schedule.dateRangeStart !== undefined && schedule.dateRangeEnd !== undefined) {
    return t.monthlyFromTo
      .replace('{start}', String(schedule.dateRangeStart))
      .replace('{end}', String(schedule.dateRangeEnd));
  }

  return t.everyDay;
}

/**
 * `day` in the first month at or after (`year`, `month`) that actually has that
 * day, at midnight.
 *
 * `new Date(2026, 1, 31)` does not fail - it silently rolls over to March 3rd,
 * which is not a day the goal is active on. Months too short for `day` are
 * skipped instead. Month overflow past December is handled by Date itself.
 */
function nextDateWithDay(year: number, month: number, day: number): Date {
  for (let offset = 0; offset < 12; offset += 1) {
    const candidate = new Date(year, month + offset, day);
    if (candidate.getDate() === day) {
      return candidate;
    }
  }
  // Unreachable for 1-31: every such day exists within any 12-month window.
  return new Date(year, month, day);
}

/**
 * Get next occurrence of a scheduled goal
 */
export function getNextOccurrence(goal: Goal, fromDate: Date = new Date()): Date | null {
  if (!goal.schedule) {
    return null; // Always active, no specific next occurrence
  }

  const schedule = goal.schedule;
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);

  // For weekly schedule
  if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
    const currentDay = today.getDay();
    const sortedDays = [...schedule.daysOfWeek].sort((a, b) => a - b);

    // Find next day in current week
    const nextDayThisWeek = sortedDays.find(day => day > currentDay);
    if (nextDayThisWeek !== undefined) {
      const daysUntil = nextDayThisWeek - currentDay;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntil);
      return nextDate;
    }

    // Otherwise, use first day of next week
    const daysUntilNextWeek = 7 - currentDay + sortedDays[0];
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNextWeek);
    return nextDate;
  }

  // For monthly schedule (specific dates)
  if (schedule.datesOfMonth && schedule.datesOfMonth.length > 0) {
    const currentDate = today.getDate();
    const sortedDates = [...schedule.datesOfMonth].sort((a, b) => a - b);

    // Find next date in current month - one this month actually has. On
    // Apr 20 with [10, 31], April has no 31st; taking it anyway meant "the next
    // month with a 31st", May 31, passing over May 10.
    const daysThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const nextDateThisMonth = sortedDates.find(date => date > currentDate && date <= daysThisMonth);
    if (nextDateThisMonth !== undefined) {
      return new Date(today.getFullYear(), today.getMonth(), nextDateThisMonth);
    }

    // Otherwise, the earliest date in the next month that has it. Mutating
    // `today` with setMonth(+1) would roll Jan 31 over to early March.
    return nextDateWithDay(today.getFullYear(), today.getMonth() + 1, sortedDates[0]);
  }

  // For date range
  if (schedule.dateRangeStart !== undefined && schedule.dateRangeEnd !== undefined) {
    const currentDate = today.getDate();

    // If we're before the range in current month
    if (currentDate < schedule.dateRangeStart) {
      return nextDateWithDay(today.getFullYear(), today.getMonth(), schedule.dateRangeStart);
    }

    // Otherwise, go to next month
    return nextDateWithDay(today.getFullYear(), today.getMonth() + 1, schedule.dateRangeStart);
  }

  return null;
}

/**
 * Validate schedule configuration
 */
export function validateSchedule(schedule: GoalSchedule): { valid: boolean; error?: string } {
  // Days of week validation
  if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
    const invalidDays = schedule.daysOfWeek.filter(day => day < 0 || day > 6);
    if (invalidDays.length > 0) {
      return { valid: false, error: 'Days of week must be between 0 (Sunday) and 6 (Saturday)' };
    }
  }

  // Dates of month validation
  if (schedule.datesOfMonth && schedule.datesOfMonth.length > 0) {
    const invalidDates = schedule.datesOfMonth.filter(date => date < 1 || date > 31);
    if (invalidDates.length > 0) {
      return { valid: false, error: 'Dates of month must be between 1 and 31' };
    }
  }

  // Date range validation
  if (schedule.dateRangeStart !== undefined || schedule.dateRangeEnd !== undefined) {
    if (schedule.dateRangeStart === undefined || schedule.dateRangeEnd === undefined) {
      return { valid: false, error: 'Both start and end dates must be specified for date range' };
    }
    if (schedule.dateRangeStart < 1 || schedule.dateRangeStart > 31) {
      return { valid: false, error: 'Start date must be between 1 and 31' };
    }
    if (schedule.dateRangeEnd < 1 || schedule.dateRangeEnd > 31) {
      return { valid: false, error: 'End date must be between 1 and 31' };
    }
    if (schedule.dateRangeStart > schedule.dateRangeEnd) {
      return { valid: false, error: 'Start date must be before or equal to end date' };
    }
  }

  return { valid: true };
}
