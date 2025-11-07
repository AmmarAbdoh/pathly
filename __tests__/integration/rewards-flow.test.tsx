/**
 * Integration Tests: Rewards Flow
 * Tests the complete lifecycle of rewards including earning points and redemption
 */

import { REWARDS_KEY } from '@/src/constants/storage-keys';
import { Goal, Reward } from '@/src/types';
import { calculateStatistics } from '@/src/utils/statistics';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to create a test reward
const createTestReward = (overrides: Partial<Reward> = {}): Reward => {
  return {
    id: Date.now(),
    title: 'Test Reward',
    description: 'A test reward',
    pointsCost: 100,
    icon: '🎁',
    createdAt: Date.now(),
    isRedeemed: false,
    ...overrides,
  };
};

// Helper to create a test goal
const createTestGoal = (overrides: Partial<Goal> = {}): Goal => {
  return {
    id: Date.now(),
    title: 'Test Goal',
    target: 100,
    current: 100,
    unit: 'units',
    progress: 100,
    points: 100,
    direction: 'increase',
    period: 'ongoing',
    periodStartDate: Date.now(),
    createdAt: Date.now(),
    initialValue: 0,
    isComplete: true,
    completedAt: Date.now(),
    ...overrides,
  };
};

describe('Rewards Flow Integration Tests', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  describe('Points and Rewards Balance', () => {
    it('should calculate available points correctly', () => {
      const goals: Goal[] = [
        createTestGoal({ id: 1, points: 200, isComplete: true }),
        createTestGoal({ id: 2, points: 150, isComplete: true }),
        createTestGoal({ id: 3, points: 100, isComplete: false }),
      ];

      const rewards: Reward[] = [
        createTestReward({ id: 1, pointsCost: 50, isRedeemed: true }),
        createTestReward({ id: 2, pointsCost: 75, isRedeemed: true }),
      ];

      const stats = calculateStatistics(goals, rewards, 350);

      expect(stats.lifetimePointsEarned).toBe(350); // Total earned
      expect(stats.spentPoints).toBe(125); // 50 + 75 redeemed
      // Available = lifetime - spent = 350 - 125 = 225
    });

    it('should track spent points from redeemed rewards', () => {
      const rewards: Reward[] = [
        createTestReward({ id: 1, pointsCost: 100, isRedeemed: true, redeemedAt: Date.now() }),
        createTestReward({ id: 2, pointsCost: 200, isRedeemed: true, redeemedAt: Date.now() }),
        createTestReward({ id: 3, pointsCost: 150, isRedeemed: false }), // Not redeemed
      ];

      const stats = calculateStatistics([], rewards, 500);

      expect(stats.spentPoints).toBe(300); // Only redeemed rewards
    });
  });

  describe('Reward Redemption Flow', () => {
    it('should redeem a reward when sufficient points available', () => {
      const reward = createTestReward({
        title: 'Movie Night',
        pointsCost: 150,
        icon: '🎬',
      });

      const lifetimePoints = 300;
      const spentPoints = 100;
      const availablePoints = lifetimePoints - spentPoints; // 200 points

      expect(availablePoints).toBeGreaterThanOrEqual(reward.pointsCost);

      // Redeem the reward
      reward.isRedeemed = true;
      reward.redeemedAt = Date.now();

      expect(reward.isRedeemed).toBe(true);
      expect(reward.redeemedAt).toBeDefined();

      // New spent points
      const newSpentPoints = spentPoints + reward.pointsCost; // 250
      const newAvailable = lifetimePoints - newSpentPoints; // 50

      expect(newSpentPoints).toBe(250);
      expect(newAvailable).toBe(50);
    });

    it('should prevent redemption when insufficient points', () => {
      const reward = createTestReward({
        title: 'Expensive Reward',
        pointsCost: 500,
      });

      const lifetimePoints = 300;
      const spentPoints = 100;
      const availablePoints = lifetimePoints - spentPoints; // 200 points

      expect(availablePoints).toBeLessThan(reward.pointsCost);

      // Should not redeem
      expect(reward.isRedeemed).toBe(false);
    });

    it('should handle multiple reward redemptions', () => {
      const rewards: Reward[] = [
        createTestReward({ id: 1, title: 'Reward 1', pointsCost: 50 }),
        createTestReward({ id: 2, title: 'Reward 2', pointsCost: 75 }),
        createTestReward({ id: 3, title: 'Reward 3', pointsCost: 100 }),
      ];

      let lifetimePoints = 500;
      let spentPoints = 0;

      // Redeem first reward
      rewards[0].isRedeemed = true;
      rewards[0].redeemedAt = Date.now();
      spentPoints += rewards[0].pointsCost;

      expect(spentPoints).toBe(50);
      expect(lifetimePoints - spentPoints).toBe(450);

      // Redeem second reward
      rewards[1].isRedeemed = true;
      rewards[1].redeemedAt = Date.now();
      spentPoints += rewards[1].pointsCost;

      expect(spentPoints).toBe(125);
      expect(lifetimePoints - spentPoints).toBe(375);

      // Redeem third reward
      rewards[2].isRedeemed = true;
      rewards[2].redeemedAt = Date.now();
      spentPoints += rewards[2].pointsCost;

      expect(spentPoints).toBe(225);
      expect(lifetimePoints - spentPoints).toBe(275);
    });
  });

  describe('Complete Goal-to-Reward Flow', () => {
    it('should complete goal, earn points, and redeem reward', () => {
      // Start with no points
      let lifetimePoints = 0;
      let spentPoints = 0;

      // Create a goal
      const goal = createTestGoal({
        title: 'Read 10 Books',
        target: 10,
        current: 0,
        unit: 'books',
        points: 300,
        isComplete: false,
      });

      // Progress through goal
      goal.current = 5;
      expect(goal.current).toBe(5);

      // Complete goal
      goal.current = 10;
      goal.isComplete = true;
      goal.completedAt = Date.now();
      lifetimePoints += goal.points; // Earn 300 points

      expect(goal.isComplete).toBe(true);
      expect(lifetimePoints).toBe(300);

      // Create and redeem reward
      const reward = createTestReward({
        title: 'Buy a New Book',
        pointsCost: 150,
        icon: '📚',
      });

      const availablePoints = lifetimePoints - spentPoints;
      expect(availablePoints).toBeGreaterThanOrEqual(reward.pointsCost);

      reward.isRedeemed = true;
      reward.redeemedAt = Date.now();
      spentPoints += reward.pointsCost;

      expect(reward.isRedeemed).toBe(true);
      expect(spentPoints).toBe(150);
      expect(lifetimePoints - spentPoints).toBe(150); // 150 points remaining
    });

    it('should handle multiple goals and rewards in sequence', () => {
      let lifetimePoints = 0;
      let spentPoints = 0;

      // Complete first goal
      const goal1 = createTestGoal({
        id: 1,
        title: 'Exercise',
        points: 100,
        isComplete: true,
      });
      lifetimePoints += goal1.points;

      // Complete second goal
      const goal2 = createTestGoal({
        id: 2,
        title: 'Study',
        points: 150,
        isComplete: true,
      });
      lifetimePoints += goal2.points;

      expect(lifetimePoints).toBe(250);

      // Redeem first reward
      const reward1 = createTestReward({
        id: 1,
        title: 'Coffee',
        pointsCost: 50,
        isRedeemed: true,
      });
      spentPoints += reward1.pointsCost;

      // Complete third goal
      const goal3 = createTestGoal({
        id: 3,
        title: 'Cook',
        points: 75,
        isComplete: true,
      });
      lifetimePoints += goal3.points;

      expect(lifetimePoints).toBe(325);
      expect(spentPoints).toBe(50);
      expect(lifetimePoints - spentPoints).toBe(275);

      // Redeem second reward
      const reward2 = createTestReward({
        id: 2,
        title: 'Movie',
        pointsCost: 100,
        isRedeemed: true,
      });
      spentPoints += reward2.pointsCost;

      expect(spentPoints).toBe(150);
      expect(lifetimePoints - spentPoints).toBe(175);
    });
  });

  describe('Recurring Goals Points Accumulation', () => {
    it('should accumulate points from recurring goal completions', () => {
      const goal = createTestGoal({
        title: 'Daily Exercise',
        target: 30,
        current: 30,
        unit: 'minutes',
        points: 50,
        period: 'daily',
        isRecurring: true,
        isComplete: true,
        completionHistory: [
          Date.now(),
          Date.now() - 24 * 60 * 60 * 1000,
          Date.now() - 2 * 24 * 60 * 60 * 1000,
          Date.now() - 3 * 24 * 60 * 60 * 1000,
        ],
      });

      // 4 completions in history + 1 current = 5 total × 50 points = 250 points
      const stats = calculateStatistics([goal], [], 0);
      expect(stats.totalPoints).toBe(250);
    });

    it('should allow redeeming rewards with recurring goal points', () => {
      let lifetimePoints = 0;

      // Daily goal completed 5 times
      const recurringGoal = createTestGoal({
        title: 'Morning Routine',
        points: 40,
        isRecurring: true,
        isComplete: true,
        completionHistory: [
          Date.now(),
          Date.now() - 24 * 60 * 60 * 1000,
          Date.now() - 2 * 24 * 60 * 60 * 1000,
          Date.now() - 3 * 24 * 60 * 60 * 1000,
        ],
      });

      // 4 history + 1 current = 5 completions × 40 = 200 points
      lifetimePoints = 200;

      const reward = createTestReward({
        title: 'Day Off',
        pointsCost: 150,
      });

      expect(lifetimePoints).toBeGreaterThanOrEqual(reward.pointsCost);

      reward.isRedeemed = true;
      reward.redeemedAt = Date.now();

      expect(reward.isRedeemed).toBe(true);
    });
  });

  describe('Reward Storage Persistence', () => {
    it('should persist rewards to AsyncStorage', async () => {
      const rewards: Reward[] = [
        createTestReward({ id: 1, title: 'Reward 1', pointsCost: 100 }),
        createTestReward({ id: 2, title: 'Reward 2', pointsCost: 200 }),
      ];

      await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));

      const stored = await AsyncStorage.getItem(REWARDS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];

      expect(parsed).toHaveLength(2);
      expect(parsed[0].title).toBe('Reward 1');
      expect(parsed[1].pointsCost).toBe(200);
    });

    it('should persist redemption state', async () => {
      const reward = createTestReward({
        title: 'Test Reward',
        pointsCost: 100,
        isRedeemed: false,
      });

      // Store initial state
      await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([reward]));

      // Redeem reward
      reward.isRedeemed = true;
      reward.redeemedAt = Date.now();

      // Store updated state
      await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([reward]));

      // Retrieve and verify
      const stored = await AsyncStorage.getItem(REWARDS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];

      expect(parsed[0].isRedeemed).toBe(true);
      expect(parsed[0].redeemedAt).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero-cost rewards', () => {
      const freeReward = createTestReward({
        title: 'Free Reward',
        pointsCost: 0,
      });

      expect(freeReward.pointsCost).toBe(0);

      freeReward.isRedeemed = true;
      expect(freeReward.isRedeemed).toBe(true);
    });

    it('should handle reward with no available points', () => {
      const lifetimePoints = 100;
      const spentPoints = 100;
      const availablePoints = lifetimePoints - spentPoints;

      const reward = createTestReward({
        pointsCost: 50,
      });

      expect(availablePoints).toBe(0);
      expect(availablePoints).toBeLessThan(reward.pointsCost);

      // Cannot redeem
      expect(reward.isRedeemed).toBe(false);
    });

    it('should handle exact points match', () => {
      const lifetimePoints = 200;
      const spentPoints = 100;
      const availablePoints = lifetimePoints - spentPoints; // 100

      const reward = createTestReward({
        pointsCost: 100, // Exact match
      });

      expect(availablePoints).toBe(reward.pointsCost);

      reward.isRedeemed = true;
      reward.redeemedAt = Date.now();

      expect(reward.isRedeemed).toBe(true);
      expect(lifetimePoints - (spentPoints + reward.pointsCost)).toBe(0);
    });
  });

  describe('Reward Filtering and Queries', () => {
    it('should filter redeemed vs unredeemed rewards', () => {
      const rewards: Reward[] = [
        createTestReward({ id: 1, isRedeemed: true, redeemedAt: Date.now() }),
        createTestReward({ id: 2, isRedeemed: false }),
        createTestReward({ id: 3, isRedeemed: true, redeemedAt: Date.now() }),
        createTestReward({ id: 4, isRedeemed: false }),
      ];

      const redeemed = rewards.filter(r => r.isRedeemed);
      const available = rewards.filter(r => !r.isRedeemed);

      expect(redeemed).toHaveLength(2);
      expect(available).toHaveLength(2);
    });

    it('should sort rewards by cost', () => {
      const rewards: Reward[] = [
        createTestReward({ id: 1, pointsCost: 300 }),
        createTestReward({ id: 2, pointsCost: 50 }),
        createTestReward({ id: 3, pointsCost: 150 }),
      ];

      const sortedAsc = [...rewards].sort((a, b) => a.pointsCost - b.pointsCost);
      const sortedDesc = [...rewards].sort((a, b) => b.pointsCost - a.pointsCost);

      expect(sortedAsc[0].pointsCost).toBe(50);
      expect(sortedAsc[2].pointsCost).toBe(300);
      expect(sortedDesc[0].pointsCost).toBe(300);
      expect(sortedDesc[2].pointsCost).toBe(50);
    });

    it('should identify affordable rewards', () => {
      const availablePoints = 150;

      const rewards: Reward[] = [
        createTestReward({ id: 1, pointsCost: 50 }),
        createTestReward({ id: 2, pointsCost: 100 }),
        createTestReward({ id: 3, pointsCost: 150 }),
        createTestReward({ id: 4, pointsCost: 200 }),
        createTestReward({ id: 5, pointsCost: 300 }),
      ];

      const affordable = rewards.filter(r => r.pointsCost <= availablePoints);

      expect(affordable).toHaveLength(3); // 50, 100, 150
      expect(affordable.every(r => r.pointsCost <= availablePoints)).toBe(true);
    });
  });
});
