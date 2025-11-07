/**
 * Tests for achievements constants
 */

import { Achievement } from '../../types';
import {
    ACHIEVEMENTS,
    checkAchievement,
    getAchievements,
    getMotivationalQuotes,
    getRandomQuote,
    MOTIVATIONAL_QUOTES,
} from '../achievements';

describe('Achievements Constants', () => {
  describe('getAchievements', () => {
    it('should return achievements for English', () => {
      const achievements = getAchievements('en');
      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBeGreaterThan(0);
    });

    it('should return achievements for Arabic', () => {
      const achievements = getAchievements('ar');
      expect(Array.isArray(achievements)).toBe(true);
      expect(achievements.length).toBeGreaterThan(0);
    });

    it('should have all required properties', () => {
      const achievements = getAchievements('en');
      achievements.forEach((achievement) => {
        expect(achievement.id).toBeDefined();
        expect(achievement.title).toBeDefined();
        expect(achievement.description).toBeDefined();
        expect(achievement.icon).toBeDefined();
        expect(achievement.requirement).toBeDefined();
        expect(achievement.requirement.type).toBeDefined();
        expect(achievement.requirement.value).toBeDefined();
      });
    });

    it('should have unique IDs', () => {
      const achievements = getAchievements('en');
      const ids = achievements.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should include expected achievement types', () => {
      const achievements = getAchievements('en');
      const types = achievements.map((a) => a.requirement.type);
      
      expect(types).toContain('goals_completed');
      expect(types).toContain('points_earned');
    });

    it('should have valid requirement values', () => {
      const achievements = getAchievements('en');
      achievements.forEach((achievement) => {
        expect(achievement.requirement.value).toBeGreaterThan(0);
        expect(typeof achievement.requirement.value).toBe('number');
      });
    });

    it('should return same number of achievements for both languages', () => {
      const enAchievements = getAchievements('en');
      const arAchievements = getAchievements('ar');
      expect(enAchievements.length).toBe(arAchievements.length);
    });

    it('should have same IDs across languages', () => {
      const enAchievements = getAchievements('en');
      const arAchievements = getAchievements('ar');
      
      const enIds = enAchievements.map((a) => a.id).sort();
      const arIds = arAchievements.map((a) => a.id).sort();
      
      expect(enIds).toEqual(arIds);
    });

    it('should have localized titles and descriptions', () => {
      const enAchievements = getAchievements('en');
      const arAchievements = getAchievements('ar');
      
      // Titles should be different (localized)
      const enTitles = enAchievements.map((a) => a.title);
      const arTitles = arAchievements.map((a) => a.title);
      
      expect(enTitles).not.toEqual(arTitles);
    });
  });

  describe('ACHIEVEMENTS', () => {
    it('should be defined', () => {
      expect(ACHIEVEMENTS).toBeDefined();
      expect(Array.isArray(ACHIEVEMENTS)).toBe(true);
    });

    it('should have achievements', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0);
    });

    it('should be English by default', () => {
      const enAchievements = getAchievements('en');
      expect(ACHIEVEMENTS.length).toBe(enAchievements.length);
    });
  });
});

describe('Motivational Quotes', () => {
  describe('getMotivationalQuotes', () => {
    it('should return quotes for English', () => {
      const quotes = getMotivationalQuotes('en');
      expect(Array.isArray(quotes)).toBe(true);
      expect(quotes.length).toBeGreaterThan(0);
    });

    it('should return quotes for Arabic', () => {
      const quotes = getMotivationalQuotes('ar');
      expect(Array.isArray(quotes)).toBe(true);
      expect(quotes.length).toBeGreaterThan(0);
    });
  });

  describe('MOTIVATIONAL_QUOTES', () => {
    it('should be defined', () => {
      expect(MOTIVATIONAL_QUOTES).toBeDefined();
      expect(Array.isArray(MOTIVATIONAL_QUOTES)).toBe(true);
    });

    it('should have quotes', () => {
      expect(MOTIVATIONAL_QUOTES.length).toBeGreaterThan(0);
    });
  });

  describe('getRandomQuote', () => {
    it('should return a quote', () => {
      const quote = getRandomQuote('en');
      expect(typeof quote).toBe('string');
      expect(quote.length).toBeGreaterThan(0);
    });

    it('should return English quote by default', () => {
      const quote = getRandomQuote();
      expect(typeof quote).toBe('string');
      expect(MOTIVATIONAL_QUOTES).toContain(quote);
    });

    it('should return Arabic quote when specified', () => {
      const quote = getRandomQuote('ar');
      const arQuotes = getMotivationalQuotes('ar');
      expect(arQuotes).toContain(quote);
    });
  });
});

describe('Achievement Checking', () => {
  describe('checkAchievement', () => {
    it('should check goals_completed achievement', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: '🎯',
        requirement: { type: 'goals_completed', value: 10 },
      };

      const stats = {
        completedGoals: 15,
        totalPoints: 100,
        currentStreak: 5,
        ultimateGoals: 1,
        perfectWeek: false,
      };

      expect(checkAchievement(achievement, stats)).toBe(true);
    });

    it('should check points_earned achievement', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: '⭐',
        requirement: { type: 'points_earned', value: 1000 },
      };

      const stats = {
        completedGoals: 10,
        totalPoints: 1500,
        currentStreak: 5,
        ultimateGoals: 1,
        perfectWeek: false,
      };

      expect(checkAchievement(achievement, stats)).toBe(true);
    });

    it('should check streak_days achievement', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: '🔥',
        requirement: { type: 'streak_days', value: 7 },
      };

      const stats = {
        completedGoals: 10,
        totalPoints: 100,
        currentStreak: 10,
        ultimateGoals: 1,
        perfectWeek: false,
      };

      expect(checkAchievement(achievement, stats)).toBe(true);
    });

    it('should check ultimate_goals achievement', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: '🏆',
        requirement: { type: 'ultimate_goals', value: 1 },
      };

      const stats = {
        completedGoals: 10,
        totalPoints: 100,
        currentStreak: 5,
        ultimateGoals: 2,
        perfectWeek: false,
      };

      expect(checkAchievement(achievement, stats)).toBe(true);
    });

    it('should check perfect_week achievement', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: '🎉',
        requirement: { type: 'perfect_week', value: 1 },
      };

      const stats = {
        completedGoals: 10,
        totalPoints: 100,
        currentStreak: 5,
        ultimateGoals: 1,
        perfectWeek: true,
      };

      expect(checkAchievement(achievement, stats)).toBe(true);
    });

    it('should return false when requirement not met', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: '🎯',
        requirement: { type: 'goals_completed', value: 100 },
      };

      const stats = {
        completedGoals: 5,
        totalPoints: 100,
        currentStreak: 5,
        ultimateGoals: 1,
        perfectWeek: false,
      };

      expect(checkAchievement(achievement, stats)).toBe(false);
    });

    it('should handle unknown achievement type', () => {
      const achievement: Achievement = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        icon: '❓',
        requirement: { type: 'unknown_type' as any, value: 1 },
      };

      const stats = {
        completedGoals: 10,
        totalPoints: 100,
        currentStreak: 5,
        ultimateGoals: 1,
        perfectWeek: false,
      };

      expect(checkAchievement(achievement, stats)).toBe(false);
    });
  });
});
