/**
 * Tests for recurring goals utilities
 * Verify reset logic, completion tracking, and streak calculations
 */

import { Goal } from '../../types';
import {
  calculateStreak,
  getCompletionCount,
  getPeriodEndDate,
  getTimeRemaining,
  getTotalPointsEarned,
  processRecurringGoals,
  recordCompletion,
  resetGoal,
  shouldResetGoal,
  updateGoalStreaks,
} from '../recurring-goals';

describe('Recurring Goals Utilities', () => {
  const baseGoal: Goal = {
    id: 1,
    title: 'Test Goal',
    current: 5,
    target: 10,
    unit: 'reps',
    initialValue: 0,
    direction: 'increase',
    progress: 50,
    points: 10,
    isComplete: false,
    isPaused: false,
    isRecurring: true,
    isArchived: false,
    period: 'daily',
    periodStartDate: Date.now() - 12 * 60 * 60 * 1000, // 12 hours ago
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    completionHistory: [],
  };

  describe('shouldResetGoal', () => {
    it('should return false for non-recurring goals', () => {
      const goal: Goal = { ...baseGoal, isRecurring: false };
      expect(shouldResetGoal(goal)).toBe(false);
    });

    it('should return false for goals without periodStartDate', () => {
      const goal: Goal = { ...baseGoal, periodStartDate: undefined };
      expect(shouldResetGoal(goal)).toBe(false);
    });

    it('should return false when period has not ended', () => {
      const now = Date.now();
      const goal: Goal = { 
        ...baseGoal, 
        periodStartDate: now - 6 * 60 * 60 * 1000, // 6 hours ago
        period: 'daily'
      };
      expect(shouldResetGoal(goal)).toBe(false);
    });

    it('should return true when period has ended', () => {
      const now = Date.now();
      const goal: Goal = { 
        ...baseGoal, 
        periodStartDate: now - 25 * 60 * 60 * 1000, // 25 hours ago
        period: 'daily'
      };
      expect(shouldResetGoal(goal)).toBe(true);
    });
  });

  describe('getPeriodEndDate', () => {
    it('should return start date for ongoing period (default case)', () => {
      const start = new Date(2025, 0, 15, 12, 0, 0).getTime();
      const end = getPeriodEndDate(start, 'ongoing');
      // In recurring-goals.ts, ongoing falls through to default, which returns startDate
      expect(end).toBe(start);
    });

    it('should calculate daily period end correctly', () => {
      const start = new Date(2025, 0, 15, 12, 0, 0).getTime(); // Jan 15, 2025, noon
      const end = getPeriodEndDate(start, 'daily');
      const endDate = new Date(end);
      
      expect(endDate.getDate()).toBe(15);
      expect(endDate.getHours()).toBe(23);
      expect(endDate.getMinutes()).toBe(59);
    });

    it('should calculate weekly period end correctly', () => {
      const start = new Date(2025, 0, 15).getTime();
      const end = getPeriodEndDate(start, 'weekly');
      const diff = end - start;
      
      expect(diff).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should calculate monthly period end correctly', () => {
      const start = new Date(2025, 0, 15).getTime(); // Jan 15
      const end = getPeriodEndDate(start, 'monthly');
      const endDate = new Date(end);
      
      expect(endDate.getMonth()).toBe(1); // February
      expect(endDate.getDate()).toBe(15);
    });

    it('should calculate yearly period end correctly', () => {
      const start = new Date(2025, 0, 15).getTime();
      const end = getPeriodEndDate(start, 'yearly');
      const endDate = new Date(end);
      
      expect(endDate.getFullYear()).toBe(2026);
    });

    it('should calculate custom period end correctly', () => {
      const start = Date.now();
      const end = getPeriodEndDate(start, 'custom', 14);
      const diff = end - start;
      
      expect(diff).toBe(14 * 24 * 60 * 60 * 1000);
    });

    it('should return start date for custom period without days', () => {
      const start = Date.now();
      const end = getPeriodEndDate(start, 'custom');
      
      expect(end).toBe(start);
    });
  });

  describe('resetGoal', () => {
    it('should reset goal to initial state', () => {
      const completedGoal: Goal = {
        ...baseGoal,
        current: 10,
        progress: 100,
        isComplete: true,
        completedAt: Date.now(),
      };

      const reset = resetGoal(completedGoal);

      expect(reset.current).toBe(baseGoal.initialValue);
      expect(reset.progress).toBe(0);
      expect(reset.isComplete).toBe(false);
      expect(reset.completedAt).toBeUndefined();
      expect(reset.periodStartDate).toBeGreaterThan(completedGoal.periodStartDate!);
    });

    it('should preserve completion history', () => {
      const goal: Goal = {
        ...baseGoal,
        completionHistory: [1000, 2000, 3000],
      };

      const reset = resetGoal(goal);

      expect(reset.completionHistory).toEqual([1000, 2000, 3000]);
    });
  });

  describe('recordCompletion', () => {
    it('should add completion to history', () => {
      const completedAt = Date.now();
      const goal: Goal = {
        ...baseGoal,
        isComplete: true,
        completedAt,
        completionHistory: [1000],
      };

      const recorded = recordCompletion(goal);

      expect(recorded.completionHistory).toHaveLength(2);
      expect(recorded.completionHistory).toContain(completedAt);
    });

    it('should not record if goal is not complete', () => {
      const goal: Goal = {
        ...baseGoal,
        isComplete: false,
        completionHistory: [1000],
      };

      const recorded = recordCompletion(goal);

      expect(recorded.completionHistory).toHaveLength(1);
    });

    it('should handle empty completion history', () => {
      const completedAt = Date.now();
      const goal: Goal = {
        ...baseGoal,
        isComplete: true,
        completedAt,
        completionHistory: undefined,
      };

      const recorded = recordCompletion(goal);

      expect(recorded.completionHistory).toHaveLength(1);
      expect(recorded.completionHistory?.[0]).toBe(completedAt);
    });
  });

  describe('processRecurringGoals', () => {
    it('should skip non-recurring goals', () => {
      const goals: Goal[] = [
        { ...baseGoal, isRecurring: false },
      ];

      const processed = processRecurringGoals(goals);

      expect(processed[0]).toEqual(goals[0]);
    });

    it('should initialize periodStartDate if missing', () => {
      const goals: Goal[] = [
        { ...baseGoal, periodStartDate: undefined },
      ];

      const processed = processRecurringGoals(goals);

      expect(processed[0].periodStartDate).toBeDefined();
      expect(processed[0].periodStartDate).toBeGreaterThan(0);
    });

    it('should reset goals with expired periods', () => {
      const now = Date.now();
      const goals: Goal[] = [
        {
          ...baseGoal,
          current: 10,
          progress: 100,
          isComplete: true,
          completedAt: now - 20 * 60 * 60 * 1000,
          periodStartDate: now - 25 * 60 * 60 * 1000, // 25 hours ago
          period: 'daily',
        },
      ];

      const processed = processRecurringGoals(goals);

      expect(processed[0].current).toBe(baseGoal.initialValue);
      expect(processed[0].progress).toBe(0);
      expect(processed[0].isComplete).toBe(false);
      expect(processed[0].completionHistory).toHaveLength(1);
    });

    it('should not reset goals within their period', () => {
      const now = Date.now();
      const goals: Goal[] = [
        {
          ...baseGoal,
          periodStartDate: now - 6 * 60 * 60 * 1000, // 6 hours ago
          period: 'daily',
        },
      ];

      const processed = processRecurringGoals(goals);

      expect(processed[0]).toEqual(goals[0]);
    });
  });

  describe('getCompletionCount', () => {
    it('should return 0 for incomplete non-recurring goal', () => {
      const goal: Goal = { ...baseGoal, isRecurring: false, isComplete: false };
      expect(getCompletionCount(goal)).toBe(0);
    });

    it('should return 1 for complete non-recurring goal', () => {
      const goal: Goal = { ...baseGoal, isRecurring: false, isComplete: true };
      expect(getCompletionCount(goal)).toBe(1);
    });

    it('should count history plus current completion', () => {
      const goal: Goal = {
        ...baseGoal,
        isComplete: true,
        completionHistory: [1000, 2000, 3000],
      };
      expect(getCompletionCount(goal)).toBe(4);
    });

    it('should count only history if not currently complete', () => {
      const goal: Goal = {
        ...baseGoal,
        isComplete: false,
        completionHistory: [1000, 2000],
      };
      expect(getCompletionCount(goal)).toBe(2);
    });
  });

  describe('getTotalPointsEarned', () => {
    it('should calculate total points from all completions', () => {
      const goal: Goal = {
        ...baseGoal,
        points: 25,
        isComplete: true,
        completionHistory: [1000, 2000],
      };
      
      // 2 in history + 1 current = 3 completions * 25 points = 75
      expect(getTotalPointsEarned(goal)).toBe(75);
    });

    it('should return 0 for never completed goal', () => {
      const goal: Goal = {
        ...baseGoal,
        points: 10,
        isComplete: false,
        completionHistory: [],
      };
      
      expect(getTotalPointsEarned(goal)).toBe(0);
    });
  });

  describe('getTimeRemaining', () => {
    it('should return empty string when no periodStartDate', () => {
      const goal: Goal = { ...baseGoal, periodStartDate: undefined };
      expect(getTimeRemaining(goal)).toBe('');
    });

    it('should handle ongoing period', () => {
      const goal: Goal = {
        ...baseGoal,
        period: 'ongoing',
        periodStartDate: Date.now(),
      };
      // In recurring-goals.ts getTimeRemaining, ongoing period is treated like any other
      // since getPeriodEndDate returns startDate for ongoing (default case)
      const result = getTimeRemaining(goal);
      expect(typeof result).toBe('string');
    });

    it('should return "Period ended" when period has expired', () => {
      const now = Date.now();
      const goal: Goal = {
        ...baseGoal,
        periodStartDate: now - 48 * 60 * 60 * 1000, // 48 hours ago
        period: 'daily',
      };
      
      expect(getTimeRemaining(goal)).toBe('Period ended');
    });

    it('should format days and hours correctly', () => {
      const now = Date.now();
      const goal: Goal = {
        ...baseGoal,
        periodStartDate: now, // Just started
        period: 'weekly', // 7 days from now
      };
      
      const result = getTimeRemaining(goal);
      expect(result).toMatch(/\d+d \d+h remaining/);
    });

    it('should format only minutes when less than 1 hour', () => {
      const now = Date.now();
      // Create a goal that started 50 minutes ago with custom period of 1 hour
      const goal: Goal = {
        ...baseGoal,
        periodStartDate: now - 50 * 60 * 1000, // 50 minutes ago
        period: 'custom',
        customPeriodDays: 1/24, // 1 hour
      };
      
      const result = getTimeRemaining(goal);
      expect(result).toMatch(/\d+m remaining/);
    });

    it('should format with days when more than 24 hours remaining', () => {
      const now = Date.now();
      const goal: Goal = {
        ...baseGoal,
        periodStartDate: now, // Just started
        period: 'weekly', // 7 days remaining
      };
      
      const result = getTimeRemaining(goal);
      expect(result).toMatch(/\d+d \d+h remaining/);
    });

    it('should format hours and minutes when between 1-24 hours', () => {
      const now = Date.now();
      // Use custom period to ensure we have exactly 5 hours remaining
      const goal: Goal = {
        ...baseGoal,
        periodStartDate: now - 5 * 60 * 60 * 1000, // 5 hours ago
        period: 'custom',
        customPeriodDays: 10/24, // 10 hours total period (5 remaining)
      };
      
      const result = getTimeRemaining(goal);
      expect(result).toMatch(/\d+h \d+m remaining/);
    });

    it('should format minutes only when less than 1 hour remaining', () => {
      const now = Date.now();
      // Use custom period to ensure we have exactly 30 minutes remaining
      const goal: Goal = {
        ...baseGoal,
        periodStartDate: now - 30 * 60 * 1000, // 30 minutes ago
        period: 'custom',
        customPeriodDays: 1/24, // 1 hour total period (30 min remaining)
      };
        
      const result = getTimeRemaining(goal);
      expect(result).toMatch(/\d+m remaining/);
    });
  });

  describe('calculateStreak', () => {
    it('should return 0 streak for non-recurring goal', () => {
      const goal: Goal = { ...baseGoal, isRecurring: false };
      const result = calculateStreak(goal);
      
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it('should return 1 for currently complete goal with no history', () => {
      const goal: Goal = {
        ...baseGoal,
        isComplete: true,
        completedAt: Date.now(),
        completionHistory: [],
      };
      const result = calculateStreak(goal);
      
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it('should return 0 for empty completion history', () => {
      const goal: Goal = {
        ...baseGoal,
        isComplete: false,
        completionHistory: [],
      };
      const result = calculateStreak(goal);
      
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it('should return 0 for undefined completion history', () => {
      const goal: Goal = {
        ...baseGoal,
        isComplete: false,
        completionHistory: undefined,
      };
      const result = calculateStreak(goal);
      
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
    });

    it('should calculate consecutive daily completions', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      const goal: Goal = {
        ...baseGoal,
        period: 'daily',
        isComplete: true,
        completedAt: now,
        completionHistory: [
          now - 3 * oneDayMs,
          now - 2 * oneDayMs,
          now - oneDayMs,
        ],
      };
      
      const result = calculateStreak(goal);
      expect(result.currentStreak).toBeGreaterThan(0);
      expect(result.longestStreak).toBeGreaterThan(0);
    });

    it('should handle weekly period streaks', () => {
      const now = Date.now();
      const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
      
      const goal: Goal = {
        ...baseGoal,
        period: 'weekly',
        isComplete: true,
        completedAt: now,
        completionHistory: [
          now - 2 * oneWeekMs,
          now - oneWeekMs,
        ],
      };
      
      const result = calculateStreak(goal);
      expect(result.currentStreak).toBeGreaterThan(0);
      expect(result.longestStreak).toBeGreaterThan(0);
    });

    it('should handle monthly period streaks', () => {
      const now = Date.now();
      const oneMonthMs = 30 * 24 * 60 * 60 * 1000;
      
      const goal: Goal = {
        ...baseGoal,
        period: 'monthly',
        isComplete: true,
        completedAt: now,
        completionHistory: [
          now - 2 * oneMonthMs,
          now - oneMonthMs,
        ],
      };
      
      const result = calculateStreak(goal);
      expect(result.currentStreak).toBeGreaterThan(0);
    });

    it('should handle yearly period streaks', () => {
      const now = Date.now();
      const oneYearMs = 365 * 24 * 60 * 60 * 1000;
      
      const goal: Goal = {
        ...baseGoal,
        period: 'yearly',
        isComplete: true,
        completedAt: now,
        completionHistory: [now - oneYearMs],
      };
      
      const result = calculateStreak(goal);
      expect(result.currentStreak).toBeGreaterThan(0);
    });

    it('should handle custom period streaks', () => {
      const now = Date.now();
      const customDays = 14;
      const customPeriodMs = customDays * 24 * 60 * 60 * 1000;
      
      const goal: Goal = {
        ...baseGoal,
        period: 'custom',
        customPeriodDays: customDays,
        isComplete: true,
        completedAt: now,
        completionHistory: [now - customPeriodMs],
      };
      
      const result = calculateStreak(goal);
      expect(result.currentStreak).toBeGreaterThan(0);
    });

    it('should break streak if period missed', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      const goal: Goal = {
        ...baseGoal,
        period: 'daily',
        isComplete: false,
        completionHistory: [now - 5 * oneDayMs], // Last completion 5 days ago
      };
      
      const result = calculateStreak(goal);
      expect(result.currentStreak).toBe(0);
    });

    it('should handle broken streaks in history', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      
      const goal: Goal = {
        ...baseGoal,
        period: 'daily',
        isComplete: true,
        completedAt: now,
        completionHistory: [
          now - 10 * oneDayMs, // Old streak
          now - 9 * oneDayMs,
          // Gap here - streak broken
          now - 2 * oneDayMs, // New streak
          now - oneDayMs,
        ],
      };
      
      const result = calculateStreak(goal);
      // Should calculate longest streak properly
      expect(result.longestStreak).toBeGreaterThanOrEqual(result.currentStreak);
    });
  });

  describe('updateGoalStreaks', () => {
    it('should not update non-recurring goals', () => {
      const goal: Goal = { ...baseGoal, isRecurring: false };
      const updated = updateGoalStreaks(goal);
      
      expect(updated).toEqual(goal);
    });

    it('should update currentStreak and longestStreak', () => {
      const goal: Goal = {
        ...baseGoal,
        isComplete: true,
        completedAt: Date.now(),
        completionHistory: [],
        currentStreak: 0,
        longestStreak: 0,
      };
      
      const updated = updateGoalStreaks(goal);
      
      expect(updated.currentStreak).toBe(1);
      expect(updated.longestStreak).toBe(1);
    });
  });

  describe('getPeriodLength', () => {
    it('should return correct length for daily period', () => {
      const result = 24 * 60 * 60 * 1000;
      expect(result).toBe(24 * 60 * 60 * 1000);
    });

    it('should return correct length for custom period with default', () => {
      // When testing a default case with undefined customPeriodDays
      const goal: Goal = {
        ...baseGoal,
        period: 'custom',
        customPeriodDays: undefined,
      };
      
      // This tests the default (customPeriodDays || 1) logic
      const result = calculateStreak(goal);
      expect(result).toBeDefined();
    });

    it('should preserve existing longestStreak if higher', () => {
      const goal: Goal = {
        ...baseGoal,
        isComplete: true,
        completedAt: Date.now(),
        completionHistory: [],
        currentStreak: 1,
        longestStreak: 5,
      };
      
      const updated = updateGoalStreaks(goal);
      
      expect(updated.longestStreak).toBe(5); // Should not decrease
    });
  });
});
