/**
 * Tests for review statistics utilities
 * Verify period calculations and statistics
 */

import { Goal, PointsEntry } from '../../types';
import {
    calculateReviewStatistics,
    getLastMonth,
    getLastWeek,
    getMotivationalMessage,
    getThisMonth,
    getThisWeek,
} from '../review-statistics';

describe('Review Statistics Utilities', () => {
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

  describe('Period Calculation Functions', () => {
    beforeEach(() => {
      // Mock current date to a specific Sunday for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-12T12:00:00.000Z')); // Sunday, Jan 12, 2025
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    describe('getThisWeek', () => {
      it('should return current week starting from Sunday', () => {
        const period = getThisWeek();
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);

        expect(startDate.getDay()).toBe(0); // Sunday
        expect(endDate.getDay()).toBe(6); // Saturday
        expect(period.label).toBe('This Week');
      });

      it('should span exactly 7 days', () => {
        const period = getThisWeek();
        const daysDiff = (period.endDate - period.startDate) / (1000 * 60 * 60 * 24);
        
        expect(daysDiff).toBeCloseTo(7, 1);
      });

      it('should start at midnight and end at 23:59:59.999', () => {
        const period = getThisWeek();
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);

        expect(startDate.getHours()).toBe(0);
        expect(startDate.getMinutes()).toBe(0);
        expect(startDate.getSeconds()).toBe(0);

        expect(endDate.getHours()).toBe(23);
        expect(endDate.getMinutes()).toBe(59);
        expect(endDate.getSeconds()).toBe(59);
      });
    });

    describe('getLastWeek', () => {
      it('should return previous week', () => {
        const thisWeek = getThisWeek();
        const lastWeek = getLastWeek();

        expect(lastWeek.endDate).toBeLessThan(thisWeek.startDate);
        expect(lastWeek.label).toBe('Last Week');
      });

      it('should span exactly 7 days', () => {
        const period = getLastWeek();
        const daysDiff = (period.endDate - period.startDate) / (1000 * 60 * 60 * 24);
        
        expect(daysDiff).toBeCloseTo(7, 1);
      });
    });

    describe('getThisMonth', () => {
      it('should return current month period', () => {
        const period = getThisMonth();
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);

        expect(startDate.getDate()).toBe(1); // First day of month
        expect(startDate.getMonth()).toBe(0); // January (0-indexed)
        expect(endDate.getMonth()).toBe(0); // Same month
        expect(period.label).toBe('This Month');
      });

      it('should start at midnight on first day', () => {
        const period = getThisMonth();
        const startDate = new Date(period.startDate);

        expect(startDate.getHours()).toBe(0);
        expect(startDate.getMinutes()).toBe(0);
        expect(startDate.getSeconds()).toBe(0);
      });

      it('should end at 23:59:59.999 on last day', () => {
        const period = getThisMonth();
        const endDate = new Date(period.endDate);

        expect(endDate.getHours()).toBe(23);
        expect(endDate.getMinutes()).toBe(59);
        expect(endDate.getSeconds()).toBe(59);
      });
    });

    describe('getLastMonth', () => {
      it('should return previous month period', () => {
        const period = getLastMonth();
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);

        expect(startDate.getMonth()).toBe(11); // December (previous month from January)
        expect(endDate.getMonth()).toBe(11);
        expect(period.label).toBe('Last Month');
      });
    });
  });

  describe('calculateReviewStatistics', () => {
    const periodStart = new Date('2025-01-01T00:00:00.000Z').getTime();
    const periodEnd = new Date('2025-01-31T23:59:59.999Z').getTime();
    const testPeriod = {
      startDate: periodStart,
      endDate: periodEnd,
      label: 'Test Period',
    };

    it('should calculate statistics for empty goals array', () => {
      const stats = calculateReviewStatistics([], testPeriod);

      expect(stats.goalsCompleted).toBe(0);
      expect(stats.totalGoals).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.pointsEarned).toBe(0);
      expect(stats.completedGoalsList).toHaveLength(0);
    });

    it('should count goals completed in period', () => {
      const goals: Goal[] = [
        createMockGoal({
          id: 1,
          isComplete: true,
          completedAt: periodStart + 1000, // Completed in period
          points: 50,
          createdAt: periodStart - 10000,
        }),
        createMockGoal({
          id: 2,
          isComplete: true,
          completedAt: periodStart + 2000, // Completed in period
          points: 30,
          createdAt: periodStart - 10000,
        }),
        createMockGoal({
          id: 3,
          isComplete: true,
          completedAt: periodEnd + 1000, // Completed AFTER period
          points: 20,
          createdAt: periodStart - 10000,
        }),
      ];

      const ledger: PointsEntry[] = [
        { id: 1, at: periodStart + 1000, points: 50, reason: 'completion', goalId: 1 },
        { id: 2, at: periodStart + 2000, points: 30, reason: 'completion', goalId: 2 },
        { id: 3, at: periodEnd + 1000, points: 20, reason: 'completion', goalId: 3 },
      ];
      const stats = calculateReviewStatistics(goals, testPeriod, ledger);

      expect(stats.goalsCompleted).toBe(2);
      expect(stats.pointsEarned).toBe(80); // 50 + 30
    });

    it('should calculate completion rate correctly', () => {
      const goals: Goal[] = [
        createMockGoal({
          id: 1,
          isComplete: true,
          completedAt: periodStart + 1000,
          points: 10,
          createdAt: periodStart - 10000,
        }),
        createMockGoal({
          id: 2,
          isComplete: false,
          createdAt: periodStart - 10000,
        }),
        createMockGoal({
          id: 3,
          isComplete: false,
          createdAt: periodStart - 10000,
        }),
        createMockGoal({
          id: 4,
          isComplete: false,
          createdAt: periodStart - 10000,
        }),
      ];

      const stats = calculateReviewStatistics(goals, testPeriod);

      // 1 completed out of 4 total = 25%
      expect(stats.completionRate).toBe(25);
    });

    it('should exclude archived goals from total count', () => {
      const goals: Goal[] = [
        createMockGoal({
          id: 1,
          isComplete: true,
          completedAt: periodStart + 1000,
          createdAt: periodStart - 10000,
        }),
        createMockGoal({
          id: 2,
          isComplete: false,
          isArchived: true,
          createdAt: periodStart - 10000,
        }),
      ];

      const stats = calculateReviewStatistics(goals, testPeriod);

      expect(stats.totalGoals).toBe(1); // Archived goal not counted
      expect(stats.completionRate).toBe(100); // 1/1 = 100%
    });

    it('should only count goals that existed during period', () => {
      const goals: Goal[] = [
        createMockGoal({
          id: 1,
          isComplete: false,
          createdAt: periodStart - 10000, // Created before period
        }),
        createMockGoal({
          id: 2,
          isComplete: false,
          createdAt: periodEnd + 10000, // Created AFTER period
        }),
      ];

      const stats = calculateReviewStatistics(goals, testPeriod);

      expect(stats.totalGoals).toBe(1); // Only first goal existed during period
    });

    it('should return list of completed goals', () => {
      const goals: Goal[] = [
        createMockGoal({
          id: 1,
          title: 'Completed Goal 1',
          isComplete: true,
          completedAt: periodStart + 1000,
          createdAt: periodStart - 10000,
        }),
        createMockGoal({
          id: 2,
          title: 'Completed Goal 2',
          isComplete: true,
          completedAt: periodStart + 2000,
          createdAt: periodStart - 10000,
        }),
        createMockGoal({
          id: 3,
          title: 'Incomplete Goal',
          isComplete: false,
          createdAt: periodStart - 10000,
        }),
      ];

      const stats = calculateReviewStatistics(goals, testPeriod);

      expect(stats.completedGoalsList).toHaveLength(2);
      expect(stats.completedGoalsList[0].title).toBe('Completed Goal 1');
      expect(stats.completedGoalsList[1].title).toBe('Completed Goal 2');
    });

    it('should handle goals with no points', () => {
      const goals: Goal[] = [
        createMockGoal({
          id: 1,
          isComplete: true,
          completedAt: periodStart + 1000,
          points: 0,
          createdAt: periodStart - 10000,
        }),
      ];

      const stats = calculateReviewStatistics(goals, testPeriod);

      expect(stats.pointsEarned).toBe(0);
    });

    // Regression: points were the sum over every goal completed in the period,
    // so subgoals that paid nothing counted, a recurring goal completed twice
    // counted once, and the total of goals included subgoals. The review said
    // 395 where 405 had been earned, and 11 goals where Stats said 8.
    describe('counts', () => {
      const before = periodStart - 10000;
      const done = (overrides: Partial<Goal>) =>
        createMockGoal({ isComplete: true, completedAt: periodStart + 1000, createdAt: before, ...overrides });

      // Regression: points were worked out from the goals there are now, so a
      // deleted goal's points were missing from the period it earned them in.
      it("the period's points from the ledger, a deleted goal's too", () => {
        const ledger: PointsEntry[] = [
          { id: 1, at: periodStart + 500, points: 50, reason: 'completion', goalId: 99, goalTitle: 'Deleted' },
          { id: 2, at: periodStart - 500, points: 10, reason: 'completion' },
          { id: 3, at: 0, points: 300, reason: 'carried' },
        ];

        const stats = calculateReviewStatistics([], testPeriod, ledger);

        expect(stats.pointsEarned).toBe(50);
      });

      it('a recurring goal completed twice in the period once', () => {
        const goals = [
          done({ id: 1, isRecurring: true, completionHistory: [periodStart + 500, periodStart - 500] }),
        ];

        const stats = calculateReviewStatistics(goals, testPeriod);

        expect(stats.goalsCompleted).toBe(1);
      });

      it('goals, not subgoals', () => {
        const goals = [
          createMockGoal({ id: 1, subGoals: [2, 3], createdAt: before }),
          done({ id: 2, parentId: 1 }),
          done({ id: 3, parentId: 1 }),
        ];

        const stats = calculateReviewStatistics(goals, testPeriod);

        expect(stats.totalGoals).toBe(1);
        expect(stats.goalsCompleted).toBe(0);
        expect(stats.completedGoalsList).toEqual([]);
      });

      it('a goal archived during the period, not one archived before it', () => {
        const goals = [
          done({ id: 1, points: 50, isArchived: true, archivedAt: periodStart + 5000 }),
          createMockGoal({ id: 2, isArchived: true, archivedAt: periodStart - 5000, createdAt: before }),
        ];

        const stats = calculateReviewStatistics(goals, testPeriod);

        expect(stats.totalGoals).toBe(1);
        expect(stats.goalsCompleted).toBe(1);
      });
    });
  });

  describe('getMotivationalMessage', () => {
    it('should return excellentWork for 100% completion', () => {
      expect(getMotivationalMessage(100)).toBe('excellentWork');
    });

    it('should return goodProgress for >= 50% completion', () => {
      expect(getMotivationalMessage(50)).toBe('goodProgress');
      expect(getMotivationalMessage(75)).toBe('goodProgress');
      expect(getMotivationalMessage(99)).toBe('goodProgress');
    });

    it('should return keepGoing for > 0% but < 50% completion', () => {
      expect(getMotivationalMessage(1)).toBe('keepGoing');
      expect(getMotivationalMessage(25)).toBe('keepGoing');
      expect(getMotivationalMessage(49)).toBe('keepGoing');
    });

    it('should return startWorking for 0% completion', () => {
      expect(getMotivationalMessage(0)).toBe('startWorking');
    });
  });
});
