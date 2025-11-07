/**
 * Tests for goal calculation functions
 * Verify time remaining calculations are accurate
 */

import { Goal } from '../../types';
import {
  calculateGoalProgress,
  calculatePeriodEndDate,
  calculateProgress,
  calculateTimeRemaining,
  formatEndDateTime,
  formatProgressText,
  formatTimeRemaining,
  isGoalCompleted,
} from '../goal-calculations';

describe('Goal Progress Calculations', () => {
  const createMockGoal = (overrides: Partial<Goal>): Goal => ({
    id: 1,
    title: 'Test Goal',
    current: 0,
    target: 10,
    unit: 'units',
    initialValue: 0,
    direction: 'increase',
    progress: 0,
    points: 10,
    isComplete: false,
    isPaused: false,
    isArchived: false,
    isRecurring: false,
    period: 'ongoing',
    createdAt: Date.now(),
    ...overrides,
  });

  describe('calculateGoalProgress', () => {
    it('should calculate progress for simple increasing goal', () => {
      const goal = createMockGoal({
        current: 5,
        target: 10,
        direction: 'increase',
      });

      const progress = calculateGoalProgress(goal, [goal]);
      expect(progress).toBe(50);
    });

    it('should calculate average progress for goal with subgoals', () => {
      const subgoal1 = createMockGoal({
        id: 2,
        current: 10,
        target: 10,
        direction: 'increase',
      });

      const subgoal2 = createMockGoal({
        id: 3,
        current: 5,
        target: 10,
        direction: 'increase',
      });

      const parentGoal = createMockGoal({
        id: 1,
        subGoals: [2, 3],
      });

      const allGoals = [parentGoal, subgoal1, subgoal2];
      const progress = calculateGoalProgress(parentGoal, allGoals);

      // (100 + 50) / 2 = 75
      expect(progress).toBe(75);
    });

    it('should return 0 if no subgoals found', () => {
      const parentGoal = createMockGoal({
        id: 1,
        subGoals: [999], // Non-existent subgoal
      });

      const progress = calculateGoalProgress(parentGoal, [parentGoal]);
      expect(progress).toBe(0);
    });

    it('should handle decreasing goals', () => {
      const goal = createMockGoal({
        current: 70,
        target: 60,
        initialValue: 80,
        direction: 'decrease',
      });

      const progress = calculateGoalProgress(goal, [goal]);
      // (80-70)/(80-60) = 10/20 = 50%
      expect(progress).toBe(50);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate increasing goal progress', () => {
      expect(calculateProgress(5, 10, 'increase')).toBe(50);
      expect(calculateProgress(10, 10, 'increase')).toBe(100);
      expect(calculateProgress(0, 10, 'increase')).toBe(0);
    });

    it('should calculate decreasing goal progress', () => {
      const progress = calculateProgress(70, 60, 'decrease', 80);
      expect(progress).toBe(50);
    });

    it('should cap progress at 100%', () => {
      const progress = calculateProgress(15, 10, 'increase');
      expect(progress).toBe(100);
    });

    it('should never return negative progress', () => {
      const progress = calculateProgress(-5, 10, 'increase');
      expect(progress).toBe(0);
    });

    it('should return 0 if target is 0 or negative', () => {
      expect(calculateProgress(5, 0, 'increase')).toBe(0);
      expect(calculateProgress(5, -10, 'increase')).toBe(0);
    });

    it('should handle decreasing goal with invalid initial value', () => {
      // Initial <= target
      const progress = calculateProgress(70, 60, 'decrease', 50);
      expect(progress).toBe(0);
    });

    it('should return 100% for decreasing goal already at target', () => {
      const progress = calculateProgress(60, 60, 'decrease', 50);
      expect(progress).toBe(100);
    });
  });

  describe('formatProgressText', () => {
    it('should format progress text correctly', () => {
      expect(formatProgressText(5, 10, 'kg')).toBe('5 / 10 kg');
      expect(formatProgressText(0, 100, 'pages')).toBe('0 / 100 pages');
      expect(formatProgressText(50, 50, 'reps')).toBe('50 / 50 reps');
    });
  });

  describe('isGoalCompleted', () => {
    it('should return true for 100% progress', () => {
      expect(isGoalCompleted(100)).toBe(true);
    });

    it('should return true for over 100% progress', () => {
      expect(isGoalCompleted(150)).toBe(true);
    });

    it('should return false for less than 100%', () => {
      expect(isGoalCompleted(99.9)).toBe(false);
      expect(isGoalCompleted(50)).toBe(false);
      expect(isGoalCompleted(0)).toBe(false);
    });
  });

  describe('formatTimeRemaining', () => {
    const translations = {
      days: 'days',
      hours: 'hours',
      minutes: 'minutes',
      day: 'day',
      hour: 'hour',
      minute: 'minute',
      left: 'left',
      expired: 'Expired',
      resetsIn: 'Resets in',
      and: 'and',
    };

    it('should format expired time', () => {
      const timeRemaining = { days: 0, hours: 0, minutes: 0, isExpired: true };
      expect(formatTimeRemaining(timeRemaining, translations)).toBe('Expired');
    });

    it('should format days and hours', () => {
      const timeRemaining = { days: 2, hours: 5, minutes: 30, isExpired: false };
      const result = formatTimeRemaining(timeRemaining, translations);
      expect(result).toContain('2');
      expect(result).toContain('5');
      expect(result).toContain('left');
    });

    it('should format hours and minutes when no days', () => {
      const timeRemaining = { days: 0, hours: 3, minutes: 45, isExpired: false };
      const result = formatTimeRemaining(timeRemaining, translations);
      expect(result).toContain('3');
      expect(result).toContain('45');
    });

    it('should format only minutes when no days or hours', () => {
      const timeRemaining = { days: 0, hours: 0, minutes: 15, isExpired: false };
      const result = formatTimeRemaining(timeRemaining, translations);
      expect(result).toContain('15');
      expect(result).toContain('minute');
    });

    it('should use "Resets in" for recurring goals', () => {
      const timeRemaining = { days: 1, hours: 0, minutes: 0, isExpired: false };
      const result = formatTimeRemaining(timeRemaining, translations, true);
      expect(result).toContain('Resets in');
    });

    it('should handle infinite time for ongoing goals', () => {
      const timeRemaining = { days: Infinity, hours: 0, minutes: 0, isExpired: false };
      const result = formatTimeRemaining(timeRemaining, translations);
      expect(result).toBe('');
    });

    it('should work without translations', () => {
      const timeRemaining = { days: 1, hours: 2, minutes: 30, isExpired: false };
      const result = formatTimeRemaining(timeRemaining);
      expect(result).toBeTruthy();
    });
  });
});

describe('Time Remaining Calculations', () => {
  describe('calculatePeriodEndDate', () => {
    it('should calculate daily period end date correctly', () => {
      // Start: Oct 29, 2025, 00:00:00 (local time)
      const startDate = new Date(2025, 9, 29, 0, 0, 0, 0).getTime(); // Month is 0-indexed
      const endDate = calculatePeriodEndDate(startDate, 'daily');
      
      // Should end on Oct 30 at 23:59:59.999 (local time)
      const endDateObj = new Date(endDate);
      expect(endDateObj.getFullYear()).toBe(2025);
      expect(endDateObj.getMonth()).toBe(9); // October (0-indexed)
      expect(endDateObj.getDate()).toBe(30);
      expect(endDateObj.getHours()).toBe(23);
      expect(endDateObj.getMinutes()).toBe(59);
      expect(endDateObj.getSeconds()).toBe(59);
    });

    it('should calculate weekly period end date correctly', () => {
      // Start: Oct 29, 2025
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const endDate = calculatePeriodEndDate(startDate, 'weekly');
      // Should end on Nov 5, 2025 at 23:59:59.999
      const endDateObj = new Date(endDate);
      
      expect(endDateObj.getDate()).toBe(5); // Nov 5
      expect(endDateObj.getMonth()).toBe(10); // November (0-indexed)
      expect(endDateObj.getHours()).toBe(23);
      expect(endDateObj.getMinutes()).toBe(59);
      expect(endDateObj.getSeconds()).toBe(59);
    });

    it('should calculate custom period end date correctly', () => {
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const endDate = calculatePeriodEndDate(startDate, 'custom', 14);
      // Should end on Nov 12, 2025 at 23:59:59.999
      const endDateObj = new Date(endDate);
      
      expect(endDateObj.getDate()).toBe(12); // Nov 12
    });

    it('should set time to end of day (23:59:59.999)', () => {
      const startDate = new Date('2025-10-29T10:30:00.000Z').getTime();
      const endDate = calculatePeriodEndDate(startDate, 'daily');
      const endDateObj = new Date(endDate);
      
      expect(endDateObj.getHours()).toBe(23);
      expect(endDateObj.getMinutes()).toBe(59);
      expect(endDateObj.getSeconds()).toBe(59);
      expect(endDateObj.getMilliseconds()).toBe(999);
    });
  });

  describe('calculateTimeRemaining', () => {
    beforeEach(() => {
      // Mock current time to Oct 29, 2025, 12:00:00 PM (local time)
      jest.spyOn(Date, 'now').mockReturnValue(new Date(2025, 9, 29, 12, 0, 0, 0).getTime());
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should return infinite time for ongoing period', () => {
      const startDate = new Date(2025, 9, 29, 0, 0, 0, 0).getTime();
      const result = calculateTimeRemaining(startDate, 'ongoing');
      
      expect(result.days).toBe(Infinity);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.isExpired).toBe(false);
      expect(result.totalMs).toBe(Infinity);
    });

    it('should calculate time remaining correctly', () => {
      // Goal started Oct 29 at 00:00:00 (local), ends Oct 30 at 23:59:59.999
      const startDate = new Date(2025, 9, 29, 0, 0, 0, 0).getTime();
      const result = calculateTimeRemaining(startDate, 'daily');
      
      // From 12:00:00 PM Oct 29 to 23:59:59.999 Oct 30
      // = 35 hours 59 minutes 59 seconds = 1 day, 11 hours, 59 minutes
      expect(result.days).toBe(1);
      expect(result.hours).toBe(11);
      expect(result.isExpired).toBe(false);
    });

    it('should handle expired goals correctly', () => {
      // Goal ended yesterday (Oct 27)
      const startDate = new Date(2025, 9, 27, 0, 0, 0, 0).getTime();
      const result = calculateTimeRemaining(startDate, 'daily');
      
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.isExpired).toBe(true);
    });

    it('should not mark recurring goals as expired', () => {
      // Recurring goal that passed deadline
      const startDate = new Date('2025-10-27T00:00:00.000Z').getTime();
      const result = calculateTimeRemaining(startDate, 'daily', undefined, true);
      
      expect(result.isExpired).toBe(false);
    });

    it('should never return negative time values', () => {
      // Goal with time remaining
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const result = calculateTimeRemaining(startDate, 'weekly');
      
      expect(result.days).toBeGreaterThanOrEqual(0);
      expect(result.hours).toBeGreaterThanOrEqual(0);
      expect(result.minutes).toBeGreaterThanOrEqual(0);
    });

    it('should handle goals with no start date', () => {
      const result = calculateTimeRemaining(undefined, 'daily');
      
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.isExpired).toBe(false);
      expect(result.totalMs).toBe(0);
    });

    it('should calculate totalMs correctly', () => {
      const startDate = new Date(2025, 9, 29, 0, 0, 0, 0).getTime();
      const result = calculateTimeRemaining(startDate, 'weekly');
      
      expect(result.totalMs).toBeGreaterThan(0);
    });

    it('should handle monthly period', () => {
      const startDate = new Date(2025, 9, 1, 0, 0, 0, 0).getTime();
      const result = calculateTimeRemaining(startDate, 'monthly');
      
      expect(result.days).toBeGreaterThanOrEqual(0);
    });

    it('should handle custom period without customPeriodDays', () => {
      const startDate = new Date(2025, 9, 29, 0, 0, 0, 0).getTime();
      const result = calculateTimeRemaining(startDate, 'custom');
      
      expect(result.days).toBeGreaterThanOrEqual(0);
    });

    it('should handle yearly period', () => {
      const startDate = new Date(2024, 9, 29, 0, 0, 0, 0).getTime();
      const result = calculateTimeRemaining(startDate, 'yearly');
      
      // Started Oct 29, 2024, ends Oct 29, 2025
      // Current mock time is Oct 29, 2025 at noon, so still some time left
      expect(result.days).toBeGreaterThanOrEqual(0);
    });

    it('should handle custom period', () => {
      const startDate = new Date(2025, 9, 29, 0, 0, 0, 0).getTime();
      const result = calculateTimeRemaining(startDate, 'custom', 7);
      
      expect(result.days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatEndDateTime', () => {
    it('should return empty string for ongoing period', () => {
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const formatted = formatEndDateTime(startDate, 'ongoing', undefined, 'en');
      expect(formatted).toBe('');
    });

    it('should format end date correctly for English', () => {
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const formatted = formatEndDateTime(startDate, 'daily', undefined, 'en');
      
      // Should contain the date in readable format
      expect(formatted).toContain('Oct');
      expect(formatted).toContain('30');
    });

    it('should format end date correctly for Arabic', () => {
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const formatted = formatEndDateTime(startDate, 'daily', undefined, 'ar');
      
      // Should return Arabic-formatted date
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should include time in format', () => {
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const formatted = formatEndDateTime(startDate, 'daily', undefined, 'en');
      
      // Should contain time (11:59 PM or similar)
      expect(formatted).toMatch(/\d{1,2}:\d{2}/);
    });

    it('should handle undefined start date', () => {
      const formatted = formatEndDateTime(undefined, 'daily', undefined, 'en');
      expect(formatted).toBe('');
    });

    it('should handle weekly period', () => {
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const formatted = formatEndDateTime(startDate, 'weekly', undefined, 'en');
      expect(formatted).toBeTruthy();
    });

    it('should handle monthly period', () => {
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const formatted = formatEndDateTime(startDate, 'monthly', undefined, 'en');
      expect(formatted).toBeTruthy();
    });

    it('should handle yearly period', () => {
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const formatted = formatEndDateTime(startDate, 'yearly', undefined, 'en');
      expect(formatted).toBeTruthy();
    });

    it('should handle custom period', () => {
      const startDate = new Date('2025-10-29T00:00:00.000Z').getTime();
      const formatted = formatEndDateTime(startDate, 'custom', 14, 'en');
      expect(formatted).toBeTruthy();
    });
  });
});
