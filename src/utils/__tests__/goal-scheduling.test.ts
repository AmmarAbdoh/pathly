/**
 * Tests for goal scheduling utilities
 */

import { translations } from '../../i18n/translations';
import type { Goal, GoalSchedule } from '../../types';
import {
  filterActiveGoals,
  getNextOccurrence,
  getScheduleDescription,
  isEveryDaySchedule,
  isGoalActiveOnDate,
  validateSchedule,
} from '../goal-scheduling';

const en = translations.en.schedule;
const ar = translations.ar.schedule;

/** 2024-01-03 is a Wednesday (getDay() === 3). */
const WEDNESDAY = new Date(2024, 0, 3);

function makeGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 1,
    title: 'Test goal',
    target: 10,
    current: 0,
    initialValue: 0,
    unit: 'units',
    progress: 0,
    createdAt: Date.now(),
    direction: 'increase',
    points: 10,
    period: 'daily',
    subGoals: [],
    periodStartDate: Date.now(),
    isComplete: false,
    completionHistory: [],
    ...overrides,
  } as Goal;
}

describe('isEveryDaySchedule', () => {
  it('treats a missing schedule as every day', () => {
    expect(isEveryDaySchedule(undefined)).toBe(true);
  });

  it('treats an empty schedule object as every day', () => {
    expect(isEveryDaySchedule({})).toBe(true);
  });

  it('treats empty arrays as every day', () => {
    expect(isEveryDaySchedule({ daysOfWeek: [], datesOfMonth: [] })).toBe(true);
  });

  it('is false when specific weekdays are chosen', () => {
    expect(isEveryDaySchedule({ daysOfWeek: [1, 3] })).toBe(false);
  });

  it('is false when specific dates are chosen', () => {
    expect(isEveryDaySchedule({ datesOfMonth: [5] })).toBe(false);
  });

  it('is false for a complete date range', () => {
    expect(isEveryDaySchedule({ dateRangeStart: 20, dateRangeEnd: 25 })).toBe(false);
  });

  it('is true for a half-specified date range', () => {
    expect(isEveryDaySchedule({ dateRangeStart: 20 })).toBe(true);
  });
});

describe('isGoalActiveOnDate', () => {
  it('is always active with no schedule', () => {
    expect(isGoalActiveOnDate(makeGoal(), WEDNESDAY)).toBe(true);
  });

  it('respects a weekday schedule', () => {
    const goal = makeGoal({ schedule: { daysOfWeek: [3] } });
    expect(isGoalActiveOnDate(goal, WEDNESDAY)).toBe(true);

    const thursday = new Date(2024, 0, 4);
    expect(isGoalActiveOnDate(goal, thursday)).toBe(false);
  });

  it('respects a dates-of-month schedule', () => {
    const goal = makeGoal({ schedule: { datesOfMonth: [3, 15] } });
    expect(isGoalActiveOnDate(goal, WEDNESDAY)).toBe(true);
    expect(isGoalActiveOnDate(goal, new Date(2024, 0, 4))).toBe(false);
  });

  it('respects a date range, inclusive of both ends', () => {
    const goal = makeGoal({ schedule: { dateRangeStart: 20, dateRangeEnd: 25 } });
    expect(isGoalActiveOnDate(goal, new Date(2024, 0, 20))).toBe(true);
    expect(isGoalActiveOnDate(goal, new Date(2024, 0, 25))).toBe(true);
    expect(isGoalActiveOnDate(goal, new Date(2024, 0, 19))).toBe(false);
    expect(isGoalActiveOnDate(goal, new Date(2024, 0, 26))).toBe(false);
  });
});

describe('filterActiveGoals', () => {
  it('keeps only goals scheduled for the given date', () => {
    const goals = [
      makeGoal({ id: 1 }),
      makeGoal({ id: 2, schedule: { daysOfWeek: [3] } }),
      makeGoal({ id: 3, schedule: { daysOfWeek: [0] } }),
    ];

    expect(filterActiveGoals(goals, WEDNESDAY).map((g) => g.id)).toEqual([1, 2]);
  });
});

describe('getScheduleDescription', () => {
  it('describes no schedule as every day', () => {
    expect(getScheduleDescription(undefined, en)).toBe('Every day');
  });

  it('lists chosen weekdays', () => {
    expect(getScheduleDescription({ daysOfWeek: [1, 3, 5] }, en)).toBe('Every Mon, Wed, Fri');
  });

  it('lists dates of the month in ascending order', () => {
    expect(getScheduleDescription({ datesOfMonth: [15, 1, 8] }, en)).toBe(
      'Monthly on day 1, 8, 15'
    );
  });

  it('does not mutate the caller\'s datesOfMonth array', () => {
    const schedule: GoalSchedule = { datesOfMonth: [15, 1, 8] };
    getScheduleDescription(schedule, en);
    expect(schedule.datesOfMonth).toEqual([15, 1, 8]);
  });

  it('describes a date range', () => {
    expect(getScheduleDescription({ dateRangeStart: 20, dateRangeEnd: 25 }, en)).toBe(
      'Monthly from day 20 to 25'
    );
  });

  it('localizes into Arabic', () => {
    expect(getScheduleDescription(undefined, ar)).toBe('كل يوم');
    expect(getScheduleDescription({ daysOfWeek: [1] }, ar)).toContain('إثنين');
    expect(getScheduleDescription({ dateRangeStart: 20, dateRangeEnd: 25 }, ar)).toContain('20');
  });

  it('falls back to every day for an empty schedule', () => {
    expect(getScheduleDescription({}, en)).toBe('Every day');
  });
});

describe('isGoalActiveOnDate edge cases', () => {
  it('treats a schedule with no usable conditions as always active', () => {
    const goal = makeGoal({ schedule: { daysOfWeek: [], datesOfMonth: [] } });
    expect(isGoalActiveOnDate(goal, WEDNESDAY)).toBe(true);
  });
});

describe('getNextOccurrence', () => {
  /** Local-time midnight, matching how the function normalises dates. */
  const day = (y: number, m: number, d: number) => new Date(y, m - 1, d);
  const next = (schedule: GoalSchedule | undefined, from: Date) =>
    getNextOccurrence(makeGoal({ schedule }), from)?.toDateString();

  it('returns null for an unscheduled goal', () => {
    expect(getNextOccurrence(makeGoal(), WEDNESDAY)).toBeNull();
  });

  it('returns null for a schedule with no usable conditions', () => {
    expect(next({}, WEDNESDAY)).toBeUndefined();
  });

  describe('weekly', () => {
    it('finds the next matching day later this week', () => {
      // Wednesday -> Friday
      expect(next({ daysOfWeek: [1, 5] }, WEDNESDAY)).toBe(day(2024, 1, 5).toDateString());
    });

    it('wraps to the first matching day of next week', () => {
      // Wednesday, only Mondays -> next Monday
      expect(next({ daysOfWeek: [1] }, WEDNESDAY)).toBe(day(2024, 1, 8).toDateString());
    });

    it('does not return today even when today matches', () => {
      expect(next({ daysOfWeek: [3] }, WEDNESDAY)).toBe(day(2024, 1, 10).toDateString());
    });

    it('ignores the time of day', () => {
      const lateWednesday = new Date(2024, 0, 3, 23, 59);
      expect(next({ daysOfWeek: [4] }, lateWednesday)).toBe(day(2024, 1, 4).toDateString());
    });
  });

  describe('dates of month', () => {
    it('finds a later date this month', () => {
      expect(next({ datesOfMonth: [20, 5] }, day(2026, 1, 10))).toBe(day(2026, 1, 20).toDateString());
    });

    it('moves to the earliest date of next month', () => {
      expect(next({ datesOfMonth: [20, 5] }, day(2026, 1, 25))).toBe(day(2026, 2, 5).toDateString());
    });

    it('wraps December into January of the next year', () => {
      expect(next({ datesOfMonth: [3] }, day(2026, 12, 15))).toBe(day(2027, 1, 3).toDateString());
    });

    // Regression: setMonth(+1) on the 31st rolled over into March.
    it('goes from Jan 31 to Feb 1, not March', () => {
      expect(next({ datesOfMonth: [1] }, day(2026, 1, 31))).toBe(day(2026, 2, 1).toDateString());
    });

    // Regression: setDate(30) in February rolled over to March 2nd.
    it('skips a month too short for the date', () => {
      expect(next({ datesOfMonth: [30] }, day(2026, 2, 20))).toBe(day(2026, 3, 30).toDateString());
    });

    it('lands on a day the goal is actually active on', () => {
      const schedule = { datesOfMonth: [31] };
      const result = getNextOccurrence(makeGoal({ schedule }), day(2026, 1, 31));
      expect(result?.toDateString()).toBe(day(2026, 3, 31).toDateString());
      expect(isGoalActiveOnDate(makeGoal({ schedule }), result!)).toBe(true);
    });
  });

  describe('date range', () => {
    it('returns the range start later this month', () => {
      expect(next({ dateRangeStart: 20, dateRangeEnd: 25 }, day(2026, 1, 10))).toBe(
        day(2026, 1, 20).toDateString()
      );
    });

    it('moves to next month once the range has started', () => {
      expect(next({ dateRangeStart: 20, dateRangeEnd: 25 }, day(2026, 1, 22))).toBe(
        day(2026, 2, 20).toDateString()
      );
    });

    it('skips a month too short for the range start', () => {
      expect(next({ dateRangeStart: 30, dateRangeEnd: 31 }, day(2026, 1, 31))).toBe(
        day(2026, 3, 30).toDateString()
      );
    });
  });
});

describe('validateSchedule', () => {
  it('accepts an empty schedule', () => {
    expect(validateSchedule({})).toEqual({ valid: true });
  });

  it('accepts valid weekdays, dates and ranges', () => {
    expect(validateSchedule({ daysOfWeek: [0, 6] }).valid).toBe(true);
    expect(validateSchedule({ datesOfMonth: [1, 31] }).valid).toBe(true);
    expect(validateSchedule({ dateRangeStart: 5, dateRangeEnd: 5 }).valid).toBe(true);
  });

  it.each([
    [{ daysOfWeek: [7] }, 'Days of week'],
    [{ daysOfWeek: [-1] }, 'Days of week'],
    [{ datesOfMonth: [0] }, 'Dates of month'],
    [{ datesOfMonth: [32] }, 'Dates of month'],
    [{ dateRangeStart: 5 }, 'Both start and end'],
    [{ dateRangeEnd: 5 }, 'Both start and end'],
    [{ dateRangeStart: 0, dateRangeEnd: 5 }, 'Start date must be between'],
    [{ dateRangeStart: 5, dateRangeEnd: 32 }, 'End date must be between'],
    [{ dateRangeStart: 20, dateRangeEnd: 10 }, 'before or equal'],
  ] as [GoalSchedule, string][])('rejects %j', (schedule, message) => {
    const result = validateSchedule(schedule);
    expect(result.valid).toBe(false);
    expect(result.error).toContain(message);
  });
});

