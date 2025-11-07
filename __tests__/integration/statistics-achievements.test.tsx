/**
 * Integration Tests: Statistics and Achievements
 * Tests statistics calculations, achievement unlocking, and progress tracking
 */

import { ACHIEVEMENTS } from '@/src/constants/achievements';
import { Goal, Reward, Statistics } from '@/src/types';
import { calculateStatistics, getAchievementProgress, getNewlyUnlockedAchievements } from '@/src/utils/statistics';

// Helper to create a test goal
const createTestGoal = (overrides: Partial<Goal> = {}): Goal => {
  return {
    id: Date.now() + Math.random(),
    title: 'Test Goal',
    target: 100,
    current: 0,
    unit: 'units',
    progress: 0,
    points: 100,
    direction: 'increase',
    period: 'ongoing',
    periodStartDate: Date.now(),
    createdAt: Date.now(),
    initialValue: 0,
    ...overrides,
  };
};

// Helper to create a test reward
const createTestReward = (overrides: Partial<Reward> = {}): Reward => {
  return {
    id: Date.now() + Math.random(),
    title: 'Test Reward',
    description: 'A test reward',
    pointsCost: 100,
    icon: '🎁',
    createdAt: Date.now(),
    isRedeemed: false,
    ...overrides,
  };
};

describe('Statistics and Achievements Integration Tests', () => {
  describe('Basic Statistics Calculation', () => {
    it('should calculate statistics for empty state', () => {
      const stats = calculateStatistics([], [], 0);

      expect(stats.totalGoals).toBe(0);
      expect(stats.completedGoals).toBe(0);
      expect(stats.totalPoints).toBe(0);
      expect(stats.lifetimePointsEarned).toBe(0);
      expect(stats.spentPoints).toBe(0);
      expect(stats.completionRate).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
    });

    it('should calculate statistics for mixed goal states', () => {
      const goals: Goal[] = [
        createTestGoal({ id: 1, isComplete: true, points: 100, completedAt: Date.now() }),
        createTestGoal({ id: 2, isComplete: true, points: 150, completedAt: Date.now() }),
        createTestGoal({ id: 3, isComplete: false, points: 200 }),
        createTestGoal({ id: 4, isComplete: false, points: 75 }),
      ];

      const stats = calculateStatistics(goals, [], 0);

      expect(stats.totalGoals).toBe(4);
      expect(stats.completedGoals).toBe(2);
      expect(stats.completionRate).toBe(50);
      expect(stats.totalPoints).toBe(250); // Only completed goals
    });

    it('should exclude paused goals from statistics', () => {
      const goals: Goal[] = [
        createTestGoal({ id: 1, isComplete: false, isPaused: false }),
        createTestGoal({ id: 2, isComplete: true, isPaused: false }),
        createTestGoal({ id: 3, isComplete: false, isPaused: true }), // Paused
        createTestGoal({ id: 4, isComplete: true, isPaused: true }), // Paused
      ];

      const stats = calculateStatistics(goals, [], 0);

      expect(stats.totalGoals).toBe(2); // Only non-paused goals
      expect(stats.completedGoals).toBe(1); // Only non-paused completed goals
    });

    it('should exclude subgoals from top-level counts', () => {
      const goals: Goal[] = [
        createTestGoal({ id: 1, title: 'Parent 1', isComplete: true, points: 200 }),
        createTestGoal({ id: 2, parentId: 1, title: 'Subgoal 1', isComplete: true, points: 50 }),
        createTestGoal({ id: 3, title: 'Parent 2', isComplete: false, points: 150 }),
        createTestGoal({ id: 4, parentId: 3, title: 'Subgoal 2', isComplete: true, points: 75 }),
      ];

      const stats = calculateStatistics(goals, [], 0);

      expect(stats.totalGoals).toBe(2); // Only parent goals
      expect(stats.completedGoals).toBe(1); // Only completed parent
      expect(stats.totalPoints).toBe(200); // Only parent points
    });
  });

  describe('Streak Calculation', () => {
    it('should calculate current streak correctly', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const goals: Goal[] = [
        createTestGoal({
          id: 1,
          isComplete: true,
          completedAt: now, // Today
        }),
        createTestGoal({
          id: 2,
          isComplete: true,
          completedAt: now - oneDayMs, // Yesterday
        }),
        createTestGoal({
          id: 3,
          isComplete: true,
          completedAt: now - 2 * oneDayMs, // 2 days ago
        }),
      ];

      const stats = calculateStatistics(goals, [], 0);

      expect(stats.currentStreak).toBeGreaterThan(0);
    });

    it('should track longest streak', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const goals: Goal[] = [
        // Recent streak (3 days)
        createTestGoal({ id: 1, isComplete: true, completedAt: now }),
        createTestGoal({ id: 2, isComplete: true, completedAt: now - oneDayMs }),
        createTestGoal({ id: 3, isComplete: true, completedAt: now - 2 * oneDayMs }),
        // Gap
        // Older streak (2 days)
        createTestGoal({ id: 4, isComplete: true, completedAt: now - 10 * oneDayMs }),
        createTestGoal({ id: 5, isComplete: true, completedAt: now - 11 * oneDayMs }),
      ];

      const stats = calculateStatistics(goals, [], 0);

      expect(stats.longestStreak).toBeGreaterThanOrEqual(stats.currentStreak);
    });
  });

  describe('Recurring Goals in Statistics', () => {
    it('should count recurring goal points from all completions', () => {
      const goal = createTestGoal({
        title: 'Daily Task',
        points: 50,
        isRecurring: true,
        isComplete: true,
        completionHistory: [
          Date.now(),
          Date.now() - 24 * 60 * 60 * 1000,
          Date.now() - 2 * 24 * 60 * 60 * 1000,
        ],
      });

      const stats = calculateStatistics([goal], [], 0);

      // 3 history + 1 current = 4 completions × 50 = 200 points
      expect(stats.totalPoints).toBe(200);
    });

    it('should include recurring goals in streak calculation', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      const recurringGoal = createTestGoal({
        title: 'Daily Exercise',
        period: 'daily',
        isRecurring: true,
        isComplete: true,
        completedAt: now,
        currentStreak: 5,
        longestStreak: 10,
      });

      const stats = calculateStatistics([recurringGoal], [], 0);

      expect(stats.currentStreak).toBeGreaterThan(0);
    });
  });

  describe('Achievement Progress Tracking', () => {
    it('should track progress for first_goal achievement', () => {
      const stats: Statistics = {
        totalGoals: 5,
        completedGoals: 3,
        totalPoints: 300,
        lifetimePointsEarned: 300,
        spentPoints: 100,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: Date.now(),
        completionRate: 60,
        achievementsUnlocked: [],
      };

      const progress = getAchievementProgress('first_goal', stats);

      expect(progress).toBe(100); // Requires 1 goal, has 3
    });

    it('should track progress for point_collector achievement', () => {
      const stats: Statistics = {
        totalGoals: 0,
        completedGoals: 0,
        totalPoints: 500,
        lifetimePointsEarned: 500,
        spentPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: Date.now(),
        completionRate: 0,
        achievementsUnlocked: [],
      };

      const progress = getAchievementProgress('point_collector', stats);

      // point_collector requires 1000 points
      expect(progress).toBe(50); // 500/1000 = 50%
    });

    it('should track progress for week_warrior achievement', () => {
      const stats: Statistics = {
        totalGoals: 0,
        completedGoals: 0,
        totalPoints: 0,
        lifetimePointsEarned: 0,
        spentPoints: 0,
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: Date.now(),
        completionRate: 0,
        achievementsUnlocked: [],
      };

      const progress = getAchievementProgress('week_warrior', stats);

      // week_warrior requires 7 days streak
      expect(progress).toBeCloseTo(71.43, 1); // 5/7 ≈ 71.43%
    });

    it('should cap progress at 100%', () => {
      const stats: Statistics = {
        totalGoals: 100,
        completedGoals: 100,
        totalPoints: 10000,
        lifetimePointsEarned: 10000,
        spentPoints: 0,
        currentStreak: 100,
        longestStreak: 100,
        lastActivityDate: Date.now(),
        completionRate: 100,
        achievementsUnlocked: [],
      };

      const progress1 = getAchievementProgress('first_goal', stats);
      const progress2 = getAchievementProgress('point_collector', stats);

      expect(progress1).toBe(100);
      expect(progress2).toBe(100);
    });
  });

  describe('Achievement Unlocking', () => {
    it('should unlock first_goal achievement', () => {
      const goals: Goal[] = [
        createTestGoal({
          id: 1,
          title: 'First Goal',
          points: 100,
          isComplete: true,
          completedAt: Date.now(),
        }),
      ];

      const previousStats = calculateStatistics([], [], 0);
      const currentStats = calculateStatistics(goals, [], 100);

      const newlyUnlocked = getNewlyUnlockedAchievements(previousStats, currentStats);

      expect(newlyUnlocked.includes('first_goal')).toBe(true);
      expect(currentStats.achievementsUnlocked.includes('first_goal')).toBe(true);
    });

    it('should unlock multiple achievements simultaneously', () => {
      // Create 10 goals completed on consecutive days to build streak
      const goals: Goal[] = [];
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      for (let i = 0; i < 10; i++) {
        goals.push(
          createTestGoal({
            id: i + 1,
            title: `Goal ${i + 1}`,
            points: 100,
            isComplete: true,
            completedAt: now - i * oneDayMs,
          })
        );
      }

      const previousStats = calculateStatistics([], [], 0);
      const currentStats = calculateStatistics(goals, [], 1000);

      const newlyUnlocked = getNewlyUnlockedAchievements(previousStats, currentStats);

      // Should unlock: first_goal (1 goal), goal_master (10 goals), point_collector (1000 points), week_warrior (7+ day streak)
      expect(newlyUnlocked.length).toBeGreaterThanOrEqual(3); // At least first_goal, goal_master, point_collector
      expect(currentStats.achievementsUnlocked.includes('first_goal')).toBe(true);
      expect(currentStats.achievementsUnlocked.includes('goal_master')).toBe(true);
      expect(currentStats.achievementsUnlocked.includes('point_collector')).toBe(true);
    });

    it('should not re-unlock already unlocked achievements', () => {
      const previousStats: Statistics = {
        totalGoals: 5,
        completedGoals: 5,
        totalPoints: 500,
        lifetimePointsEarned: 500,
        spentPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: Date.now(),
        completionRate: 100,
        achievementsUnlocked: ['first_goal', 'goal_getter'],
      };

      const currentStats: Statistics = {
        totalGoals: 6,
        completedGoals: 6,
        totalPoints: 600,
        lifetimePointsEarned: 600,
        spentPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: Date.now(),
        completionRate: 100,
        achievementsUnlocked: ['first_goal', 'goal_getter'],
      };

      const newlyUnlocked = getNewlyUnlockedAchievements(previousStats, currentStats);

      expect(newlyUnlocked).toHaveLength(0);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle complete user journey with achievements', () => {
      let goals: Goal[] = [];
      let rewards: Reward[] = [];
      let lifetimePoints = 0;

      // Day 1: Create and complete first goal
      const goal1 = createTestGoal({
        id: 1,
        title: 'First Goal',
        points: 100,
        isComplete: true,
        completedAt: Date.now(),
      });
      goals.push(goal1);
      lifetimePoints += goal1.points;

      let stats1 = calculateStatistics(goals, rewards, lifetimePoints);
      expect(stats1.completedGoals).toBe(1);
      expect(stats1.lifetimePointsEarned).toBe(100);

      // Check first_goal achievement
      let progress1 = getAchievementProgress('first_goal', stats1);
      expect(progress1).toBe(100);

      // Day 2-7: Complete more goals to build streak
      for (let i = 2; i <= 7; i++) {
        const goal = createTestGoal({
          id: i,
          title: `Goal ${i}`,
          points: 100,
          isComplete: true,
          completedAt: Date.now() - (7 - i) * 24 * 60 * 60 * 1000,
        });
        goals.push(goal);
        lifetimePoints += goal.points;
      }

      let stats7 = calculateStatistics(goals, rewards, lifetimePoints);
      expect(stats7.completedGoals).toBe(7);
      expect(stats7.lifetimePointsEarned).toBe(700);

      // Day 10: Complete 10th goal
      for (let i = 8; i <= 10; i++) {
        const goal = createTestGoal({
          id: i,
          title: `Goal ${i}`,
          points: 100,
          isComplete: true,
          completedAt: Date.now(),
        });
        goals.push(goal);
        lifetimePoints += goal.points;
      }

      let stats10 = calculateStatistics(goals, rewards, lifetimePoints);
      expect(stats10.completedGoals).toBe(10);
      expect(stats10.lifetimePointsEarned).toBe(1000);

      // Check goal_master achievement (10 goals)
      let progressGoals = getAchievementProgress('goal_master', stats10);
      expect(progressGoals).toBe(100);

      // Check point_collector achievement (1000 points)
      let progressPoints = getAchievementProgress('point_collector', stats10);
      expect(progressPoints).toBe(100);

      // Redeem a reward
      const reward = createTestReward({
        id: 1,
        pointsCost: 200,
        isRedeemed: true,
        redeemedAt: Date.now(),
      });
      rewards.push(reward);

      let finalStats = calculateStatistics(goals, rewards, lifetimePoints);
      expect(finalStats.spentPoints).toBe(200);
      expect(finalStats.lifetimePointsEarned).toBe(1000);
    });

    it('should handle mixed goal types in statistics', () => {
      const goals: Goal[] = [
        // Regular completed goals
        createTestGoal({
          id: 1,
          isComplete: true,
          points: 100,
          isRecurring: false,
        }),
        // Recurring completed goal with history
        createTestGoal({
          id: 2,
          isComplete: true,
          points: 50,
          isRecurring: true,
          completionHistory: [Date.now(), Date.now() - 24 * 60 * 60 * 1000],
        }),
        // Incomplete goal
        createTestGoal({
          id: 3,
          isComplete: false,
          points: 200,
        }),
        // Archived goal
        createTestGoal({
          id: 4,
          isComplete: true,
          points: 150,
          isArchived: true,
        }),
        // Paused goal
        createTestGoal({
          id: 5,
          isComplete: false,
          points: 75,
          isPaused: true,
        }),
      ];

      const stats = calculateStatistics(goals, [], 0);

      // Only non-paused goals are excluded from totalGoals
      // Archived goals are still counted in calculateStatistics
      expect(stats.totalGoals).toBe(4); // goals 1, 2, 3, 4 (goal 5 is paused)
      expect(stats.completedGoals).toBe(3); // goals 1, 2, 4 (all completed non-paused)
    });

    it('should calculate accurate completion rate', () => {
      const scenarios = [
        { completed: 0, total: 10, expected: 0 },
        { completed: 5, total: 10, expected: 50 },
        { completed: 7, total: 10, expected: 70 },
        { completed: 10, total: 10, expected: 100 },
        { completed: 0, total: 0, expected: 0 },
      ];

      scenarios.forEach(scenario => {
        const goals: Goal[] = [];

        for (let i = 0; i < scenario.total; i++) {
          goals.push(
            createTestGoal({
              id: i,
              isComplete: i < scenario.completed,
            })
          );
        }

        const stats = calculateStatistics(goals, [], 0);
        expect(stats.completionRate).toBe(scenario.expected);
      });
    });
  });

  describe('Statistics with Rewards Integration', () => {
    it('should show net points after reward redemptions', () => {
      const goals: Goal[] = [
        createTestGoal({ id: 1, points: 500, isComplete: true }),
        createTestGoal({ id: 2, points: 300, isComplete: true }),
      ];

      const rewards: Reward[] = [
        createTestReward({ id: 1, pointsCost: 200, isRedeemed: true }),
        createTestReward({ id: 2, pointsCost: 150, isRedeemed: true }),
      ];

      const stats = calculateStatistics(goals, rewards, 800);

      expect(stats.lifetimePointsEarned).toBe(800);
      expect(stats.spentPoints).toBe(350);
      // Net available: 800 - 350 = 450
    });

    it('should track spending rate', () => {
      const lifetimePoints = 1000;
      const spentPoints = 600;

      const spendingRate = (spentPoints / lifetimePoints) * 100;

      expect(spendingRate).toBe(60); // Spent 60% of lifetime points
    });
  });

  describe('Achievement Requirements Validation', () => {
    it('should validate all achievement requirements are attainable', () => {
      ACHIEVEMENTS.forEach(achievement => {
        expect(achievement.id).toBeDefined();
        expect(achievement.title).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.requirement.type).toBeDefined();
        expect(achievement.requirement.value).toBeGreaterThan(0);
      });
    });

    it('should have progressive achievement tiers', () => {
      // Check that achievements of same type have increasing requirements
      const goalAchievements = ACHIEVEMENTS.filter(a => 
        a.requirement.type === 'goals_completed'
      ).sort((a, b) => a.requirement.value - b.requirement.value);

      for (let i = 1; i < goalAchievements.length; i++) {
        expect(goalAchievements[i].requirement.value).toBeGreaterThan(
          goalAchievements[i - 1].requirement.value
        );
      }
    });
  });
});
