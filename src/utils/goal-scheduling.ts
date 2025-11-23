/**
 * Goal scheduling utilities
 * Handle scheduled goals that appear only on specific days/dates
 */

import { Goal, GoalSchedule } from '../types';

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
 * Get human-readable description of goal schedule
 */
export function getScheduleDescription(schedule?: GoalSchedule): string {
  if (!schedule) {
    return 'Every day';
  }

  // Days of week schedule
  if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = schedule.daysOfWeek.map(d => dayNames[d]).join(', ');
    return `Every ${days}`;
  }

  // Specific dates of month
  if (schedule.datesOfMonth && schedule.datesOfMonth.length > 0) {
    const dates = schedule.datesOfMonth.sort((a, b) => a - b).join(', ');
    return `Monthly on day ${dates}`;
  }

  // Date range
  if (schedule.dateRangeStart !== undefined && schedule.dateRangeEnd !== undefined) {
    return `Monthly from day ${schedule.dateRangeStart} to ${schedule.dateRangeEnd}`;
  }

  return 'Every day';
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

    // Find next date in current month
    const nextDateThisMonth = sortedDates.find(date => date > currentDate);
    if (nextDateThisMonth !== undefined) {
      const nextDate = new Date(today);
      nextDate.setDate(nextDateThisMonth);
      return nextDate;
    }

    // Otherwise, use first date of next month
    const nextDate = new Date(today);
    nextDate.setMonth(today.getMonth() + 1);
    nextDate.setDate(sortedDates[0]);
    return nextDate;
  }

  // For date range
  if (schedule.dateRangeStart !== undefined && schedule.dateRangeEnd !== undefined) {
    const currentDate = today.getDate();

    // If we're before the range in current month
    if (currentDate < schedule.dateRangeStart) {
      const nextDate = new Date(today);
      nextDate.setDate(schedule.dateRangeStart);
      return nextDate;
    }

    // Otherwise, go to next month
    const nextDate = new Date(today);
    nextDate.setMonth(today.getMonth() + 1);
    nextDate.setDate(schedule.dateRangeStart);
    return nextDate;
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
