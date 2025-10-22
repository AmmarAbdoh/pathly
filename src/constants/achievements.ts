/**
 * Achievement definitions and badges
 * Gamification system for user motivation
 */

import { translations } from '../i18n/translations';
import { Achievement } from '../types';

export const getAchievements = (language: 'en' | 'ar'): Achievement[] => {
  const t = translations[language].achievements;
  return [
  {
    id: 'first_goal',
    title: t.first_goal.title,
    description: t.first_goal.description,
    icon: '🎯',
    requirement: {
      type: 'goals_completed',
      value: 1,
    },
  },
  {
    id: 'goal_master',
    title: t.goal_master.title,
    description: t.goal_master.description,
    icon: '🏆',
    requirement: {
      type: 'goals_completed',
      value: 10,
    },
  },
  {
    id: 'century_club',
    title: t.century_club.title,
    description: t.century_club.description,
    icon: '💯',
    requirement: {
      type: 'goals_completed',
      value: 100,
    },
  },
  {
    id: 'point_collector',
    title: t.point_collector.title,
    description: t.point_collector.description,
    icon: '⭐',
    requirement: {
      type: 'points_earned',
      value: 1000,
    },
  },
  {
    id: 'point_legend',
    title: t.point_legend.title,
    description: t.point_legend.description,
    icon: '🌟',
    requirement: {
      type: 'points_earned',
      value: 10000,
    },
  },
  {
    id: 'week_warrior',
    title: t.week_warrior.title,
    description: t.week_warrior.description,
    icon: '🔥',
    requirement: {
      type: 'streak_days',
      value: 7,
    },
  },
  {
    id: 'month_champion',
    title: t.month_champion.title,
    description: t.month_champion.description,
    icon: '💪',
    requirement: {
      type: 'streak_days',
      value: 30,
    },
  },
  {
    id: 'unstoppable',
    title: t.unstoppable.title,
    description: t.unstoppable.description,
    icon: '🚀',
    requirement: {
      type: 'streak_days',
      value: 100,
    },
  },
  {
    id: 'ultimate_creator',
    title: t.ultimate_creator.title,
    description: t.ultimate_creator.description,
    icon: '⭐',
    requirement: {
      type: 'ultimate_goals',
      value: 5,
    },
  },
  {
    id: 'perfectionist',
    title: t.perfectionist.title,
    description: t.perfectionist.description,
    icon: '✨',
    requirement: {
      type: 'perfect_week',
      value: 1,
    },
  },
];
};

// For backward compatibility, export with default language
export const ACHIEVEMENTS = getAchievements('en');

export const getMotivationalQuotes = (language: 'en' | 'ar'): string[] => {
  return translations[language].quotes;
};

export const MOTIVATIONAL_QUOTES = getMotivationalQuotes('en');

/**
 * Get a random motivational quote
 */
export const getRandomQuote = (language: 'en' | 'ar' = 'en'): string => {
  const quotes = getMotivationalQuotes(language);
  return quotes[Math.floor(Math.random() * quotes.length)];
};

/**
 * Check if an achievement should be unlocked
 */
export const checkAchievement = (
  achievement: Achievement,
  stats: { completedGoals: number; totalPoints: number; currentStreak: number; ultimateGoals: number; perfectWeek: boolean }
): boolean => {
  switch (achievement.requirement.type) {
    case 'goals_completed':
      return stats.completedGoals >= achievement.requirement.value;
    case 'points_earned':
      return stats.totalPoints >= achievement.requirement.value;
    case 'streak_days':
      return stats.currentStreak >= achievement.requirement.value;
    case 'ultimate_goals':
      return stats.ultimateGoals >= achievement.requirement.value;
    case 'perfect_week':
      return stats.perfectWeek;
    default:
      return false;
  }
};
