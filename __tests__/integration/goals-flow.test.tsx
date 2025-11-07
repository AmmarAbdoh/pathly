/**
 * Integration Tests: Goals Flow
 * Tests the complete lifecycle of goals including creation, updates, and completion
 * These tests focus on business logic integration without React components
 */

import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { Goal, GoalDirection, TimePeriod } from '@/src/types';
import { calculateProgress } from '@/src/utils/goal-calculations';
import { getTotalPointsEarned, processRecurringGoals, updateGoalStreaks } from '@/src/utils/recurring-goals';
import { calculateStatistics } from '@/src/utils/statistics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to create a test goal
const createTestGoal = (overrides: Partial<Goal> = {}): Goal => {
  return {
    id: Date.now(),
    title: 'Test Goal',
    target: 100,
    current: 0,
    unit: 'units',
    progress: 0,
    points: 100,
    direction: 'increase' as GoalDirection,
    period: 'ongoing' as TimePeriod,
    periodStartDate: Date.now(),
    createdAt: Date.now(),
    initialValue: 0,
    ...overrides,
  };
};

describe('Goals Flow Integration Tests', () => {
  beforeEach(async () => {
    // Clear AsyncStorage before each test
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('Goal Creation and Progress Tracking', () => {
    it('should create and track progress for a new goal', () => {
      const goal = createTestGoal({
        title: 'Read 30 Books',
        target: 30,
        current: 0,
        unit: 'books',
        points: 300,
        period: 'yearly',
      });

      // Calculate initial progress
      expect(goal.current).toBe(0);
      expect(calculateProgress(0, 30, 'increase')).toBe(0);

      // Simulate progress
      goal.current = 15;
      expect(calculateProgress(15, 30, 'increase')).toBe(50);

      // Complete the goal
      goal.current = 30;
      expect(calculateProgress(30, 30, 'increase')).toBe(100);
    });

    it('should handle decrease direction goals', () => {
      const goal = createTestGoal({
        title: 'Reduce Weight',
        target: 70,
        current: 80,
        unit: 'kg',
        direction: 'decrease',
        initialValue: 80,
      });

      // Initial progress
      expect(calculateProgress(80, 70, 'decrease', 80)).toBe(0);

      // Progress made
      goal.current = 75;
      expect(calculateProgress(75, 70, 'decrease', 80)).toBe(50);

      // Goal completed
      goal.current = 70;
      expect(calculateProgress(70, 70, 'decrease', 80)).toBe(100);
    });

    it('should handle recurring daily goals', () => {
      const goal = createTestGoal({
        title: 'Daily Exercise',
        target: 60,
        current: 0,
        unit: 'minutes',
        points: 50,
        period: 'daily',
        isRecurring: true,
        completionHistory: [],
      });

      expect(goal.isRecurring).toBe(true);
      expect(goal.period).toBe('daily');

      // Complete the goal
      goal.current = 60;
      goal.isComplete = true;
      goal.completedAt = Date.now();
      goal.completionHistory = [Date.now()];

      expect(goal.isComplete).toBe(true);
      expect(goal.completionHistory?.length).toBe(1);
    });
  });

  describe('Recurring Goals Processing', () => {
    it('should process recurring goals and reset when period ends', () => {
      const now = Date.now();
      const oneDayAgo = now - 25 * 60 * 60 * 1000; // 25 hours ago

      const goal = createTestGoal({
        title: 'Daily Steps',
        target: 10000,
        current: 10000,
        unit: 'steps',
        period: 'daily',
        periodStartDate: oneDayAgo,
        isRecurring: true,
        isComplete: true,
        completedAt: oneDayAgo,
        completionHistory: [oneDayAgo],
      });

      const processed = processRecurringGoals([goal]);
      const processedGoal = processed[0];

      // Should be reset since period ended
      expect(processedGoal.current).toBe(0);
      expect(processedGoal.isComplete).toBe(false);
      expect(processedGoal.completionHistory).toContain(oneDayAgo);
    });

    it('should calculate streaks for recurring goals', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const goal = createTestGoal({
        title: 'Daily Goal',
        target: 100,
        current: 100,
        unit: 'units',
        period: 'daily',
        isRecurring: true,
        isComplete: true,
        completedAt: now,
        completionHistory: [
          now,
          now - oneDayMs,
          now - 2 * oneDayMs,
        ],
      });

      const goalWithStreak = updateGoalStreaks(goal);

      expect(goalWithStreak.currentStreak).toBeGreaterThan(0);
      expect(goalWithStreak.longestStreak).toBeGreaterThanOrEqual(goalWithStreak.currentStreak!);
    });

    it('should calculate total points earned from recurring goals', () => {
      const goal = createTestGoal({
        title: 'Weekly Task',
        target: 50,
        current: 50,
        unit: 'tasks',
        points: 100,
        period: 'weekly',
        isRecurring: true,
        isComplete: true,
        completionHistory: [
          Date.now(),
          Date.now() - 7 * 24 * 60 * 60 * 1000,
          Date.now() - 14 * 24 * 60 * 60 * 1000,
        ],
      });

      const totalPoints = getTotalPointsEarned(goal);

      // 3 completions in history + 1 current completion = 4 × 100 points = 400 points
      expect(totalPoints).toBe(400);
    });
  });

  describe('Goal Hierarchy and Subgoals', () => {
    it('should handle parent-child goal relationships', () => {
      const parentGoal = createTestGoal({
        id: 1,
        title: 'Complete Project',
        target: 100,
        current: 0,
        unit: '%',
        points: 500,
      });

      const subgoal1 = createTestGoal({
        id: 2,
        parentId: 1,
        title: 'Research Phase',
        target: 100,
        current: 100,
        unit: '%',
        points: 100,
        isComplete: true,
      });

      const subgoal2 = createTestGoal({
        id: 3,
        parentId: 1,
        title: 'Development Phase',
        target: 100,
        current: 50,
        unit: '%',
        points: 200,
      });

      const goals = [parentGoal, subgoal1, subgoal2];

      // Calculate statistics - should skip subgoals in point counting
      const stats = calculateStatistics(goals, [], 0);

      // Only parent goal points should be counted (not subgoal points)
      expect(stats.totalGoals).toBe(1); // Only counts parent
      expect(stats.totalPoints).toBe(0); // Parent not complete yet
    });
  });

  describe('Statistics and Points', () => {
    it('should calculate statistics correctly for mixed goals', () => {
      const goals: Goal[] = [
        createTestGoal({
          id: 1,
          title: 'Completed Goal',
          target: 100,
          current: 100,
          points: 200,
          isComplete: true,
          completedAt: Date.now(),
        }),
        createTestGoal({
          id: 2,
          title: 'In Progress Goal',
          target: 100,
          current: 50,
          points: 150,
        }),
        createTestGoal({
          id: 3,
          title: 'Recurring Goal',
          target: 50,
          current: 50,
          points: 75,
          isRecurring: true,
          isComplete: true,
          completionHistory: [Date.now(), Date.now() - 24 * 60 * 60 * 1000],
        }),
      ];

      const stats = calculateStatistics(goals, [], 0);

      expect(stats.totalGoals).toBe(3);
      expect(stats.completedGoals).toBe(2); // Completed + Recurring
      expect(stats.completionRate).toBeCloseTo(66.67, 1);
      expect(stats.totalPoints).toBeGreaterThan(0);
    });

    it('should track lifetime points earned across sessions', async () => {
      // Simulate first session
      const initialPoints = 500;
      await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, initialPoints.toString());

      // Verify points persisted
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS);
      expect(stored).toBe('500');

      // Simulate adding more points
      const newPoints = initialPoints + 300;
      await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, newPoints.toString());

      const updatedStored = await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS);
      expect(updatedStored).toBe('800');
    });
  });

  describe('Goal Progress Validation', () => {
    it('should handle edge cases in progress calculations', () => {
      // Zero target (edge case) - returns 0 since there's nothing to achieve
      expect(calculateProgress(0, 0, 'increase')).toBe(0);

      // Negative current (should be clamped)
      expect(calculateProgress(-10, 100, 'increase')).toBe(0);

      // Current exceeds target
      expect(calculateProgress(150, 100, 'increase')).toBe(100);

      // Decrease with current below target
      expect(calculateProgress(50, 70, 'decrease', 100)).toBe(100);
    });

    it('should validate goal completion state', () => {
      const goal = createTestGoal({
        target: 100,
        current: 100,
        isComplete: false, // Not yet marked complete
      });

      // Progress is 100% but not marked complete yet
      expect(calculateProgress(goal.current, goal.target, goal.direction)).toBe(100);
      expect(goal.isComplete).toBe(false);

      // Mark as complete
      goal.isComplete = true;
      goal.completedAt = Date.now();

      expect(goal.isComplete).toBe(true);
      expect(goal.completedAt).toBeDefined();
    });
  });

  describe('Custom Period Goals', () => {
    it('should handle custom period goals correctly', () => {
      const goal = createTestGoal({
        title: '14-Day Challenge',
        target: 100,
        current: 0,
        unit: 'tasks',
        points: 200,
        period: 'custom',
        customPeriodDays: 14,
      });

      expect(goal.period).toBe('custom');
      expect(goal.customPeriodDays).toBe(14);

      // Simulate completion
      goal.current = 100;
      expect(calculateProgress(goal.current, goal.target, goal.direction)).toBe(100);
    });
  });

  describe('Goal Archival Flow', () => {
    it('should mark goals as archived', () => {
      const goal = createTestGoal({
        title: 'Old Goal',
        isArchived: false,
      });

      expect(goal.isArchived).toBe(false);

      // Archive the goal
      goal.isArchived = true;
      goal.archivedAt = Date.now();

      expect(goal.isArchived).toBe(true);
      expect(goal.archivedAt).toBeDefined();
    });

    it('should exclude archived goals from active statistics', () => {
      const goals: Goal[] = [
        createTestGoal({
          id: 1,
          title: 'Active Goal',
          isArchived: false,
        }),
        createTestGoal({
          id: 2,
          title: 'Archived Goal',
          isArchived: true,
        }),
      ];

      const activeGoals = goals.filter(g => !g.isArchived);
      expect(activeGoals.length).toBe(1);
      expect(activeGoals[0].title).toBe('Active Goal');
    });
  });
});
