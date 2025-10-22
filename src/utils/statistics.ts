/**
 * Statistics calculation utilities
 * Track user progress and achievements
 */

import { ACHIEVEMENTS, checkAchievement } from '../constants/achievements';
import { Goal, Reward, Statistics } from '../types';
import { getTotalPointsEarned } from './recurring-goals';

/**
 * Calculate statistics from goals and rewards
 */
export const calculateStatistics = (goals: Goal[], rewards: Reward[] = []): Statistics => {
  const totalGoals = goals.filter(g => !g.parentId).length; // Only count parent goals
  const completedGoals = goals.filter(g => g.isComplete && !g.parentId).length;
  
  // Calculate total points from completed goals (including recurring completions)
  const totalPoints = goals.reduce((sum, goal) => {
    if (goal.parentId) return sum; // Skip subgoals to avoid double counting
    
    if (goal.isRecurring) {
      // For recurring goals, count all completions
      return sum + getTotalPointsEarned(goal);
    } else {
      // For one-time goals, count if complete
      return sum + (goal.isComplete ? goal.points : 0);
    }
  }, 0);

  // Calculate spent points from redeemed rewards
  const spentPoints = rewards
    .filter(reward => reward.isRedeemed)
    .reduce((sum, reward) => sum + reward.pointsCost, 0);
  
  // Calculate streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTimestamp = today.getTime();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let checkDate = new Date(todayTimestamp);
  let lastActivityDate = 0;
  
  // Sort goals by completion date
  const completedGoalsByDate = goals
    .filter(g => g.completedAt)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
  
  if (completedGoalsByDate.length > 0) {
    lastActivityDate = completedGoalsByDate[0].completedAt || 0;
    
    // Calculate current streak (consecutive days with completed goals)
    for (let i = 0; i < 365; i++) {
      const dayStart = checkDate.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const hasActivityThisDay = completedGoalsByDate.some(
        g => g.completedAt && g.completedAt >= dayStart && g.completedAt < dayEnd
      );
      
      if (hasActivityThisDay) {
        currentStreak++;
        if (currentStreak > longestStreak) {
          longestStreak = currentStreak;
        }
      } else if (i > 0) {
        // Streak broken
        break;
      }
      
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }
  
  const completionRate = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;
  
  // Check which achievements should be unlocked
  const ultimateGoals = goals.filter(g => g.isUltimate && !g.parentId).length;
  const achievementsUnlocked = ACHIEVEMENTS
    .filter(achievement =>
      checkAchievement(achievement, {
        completedGoals,
        totalPoints,
        currentStreak,
        ultimateGoals,
        perfectWeek: false, // TODO: Implement perfect week logic
      })
    )
    .map(a => a.id);
  
  return {
    totalGoals,
    completedGoals,
    totalPoints,
    spentPoints,
    currentStreak,
    longestStreak,
    lastActivityDate,
    completionRate,
    achievementsUnlocked,
  };
};

/**
 * Get newly unlocked achievements
 */
export const getNewlyUnlockedAchievements = (
  oldStats: Statistics,
  newStats: Statistics
): string[] => {
  return newStats.achievementsUnlocked.filter(
    id => !oldStats.achievementsUnlocked.includes(id)
  );
};

/**
 * Format streak display
 */
export const formatStreak = (days: number): string => {
  if (days === 0) return 'No streak';
  if (days === 1) return '1 day streak';
  return `${days} days streak`;
};

/**
 * Get achievement progress
 */
export const getAchievementProgress = (
  achievementId: string,
  stats: Statistics
): number => {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!achievement) return 0;
  
  const { completedGoals, totalPoints, currentStreak } = stats;
  const { type, value } = achievement.requirement;
  
  let current = 0;
  switch (type) {
    case 'goals_completed':
      current = completedGoals;
      break;
    case 'points_earned':
      current = totalPoints;
      break;
    case 'streak_days':
      current = currentStreak;
      break;
    default:
      current = 0;
  }
  
  return Math.min(100, (current / value) * 100);
};
