/**
 * Tests for goal scheduling utilities
 */

import { translations } from '../../i18n/translations';
import type { Goal, GoalSchedule } from '../../types';
import {
  filterActiveGoals,
  getScheduleDescription,
  isEveryDaySchedule,
  isGoalActiveOnDate,
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
