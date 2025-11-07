/**
 * Tests for icon constants and utilities
 */

import {
    DEFAULT_GOAL_ICON,
    DEFAULT_REWARD_ICON,
    getRandomIcon,
    GOAL_REWARD_ICONS,
    ICON_CATEGORIES,
    searchIcons,
} from '../icons';

describe('Icon Constants', () => {
  describe('ICON_CATEGORIES', () => {
    it('should have multiple categories', () => {
      expect(Object.keys(ICON_CATEGORIES).length).toBeGreaterThan(0);
    });

    it('should have valid emoji arrays', () => {
      Object.values(ICON_CATEGORIES).forEach((icons) => {
        expect(Array.isArray(icons)).toBe(true);
        expect(icons.length).toBeGreaterThan(0);
        icons.forEach((icon) => {
          expect(typeof icon).toBe('string');
          expect(icon.length).toBeGreaterThan(0);
        });
      });
    });

    it('should include expected categories', () => {
      expect(ICON_CATEGORIES.achievements).toBeDefined();
      expect(ICON_CATEGORIES.health).toBeDefined();
      expect(ICON_CATEGORIES.learning).toBeDefined();
      expect(ICON_CATEGORIES.work).toBeDefined();
      expect(ICON_CATEGORIES.finance).toBeDefined();
    });
  });

  describe('GOAL_REWARD_ICONS', () => {
    it('should be a flat array of all icons', () => {
      expect(Array.isArray(GOAL_REWARD_ICONS)).toBe(true);
      expect(GOAL_REWARD_ICONS.length).toBeGreaterThan(0);
    });

    it('should contain all icons from all categories', () => {
      const totalIcons = Object.values(ICON_CATEGORIES).flat().length;
      expect(GOAL_REWARD_ICONS.length).toBe(totalIcons);
    });
  });

  describe('DEFAULT_GOAL_ICON', () => {
    it('should be defined', () => {
      expect(DEFAULT_GOAL_ICON).toBeDefined();
      expect(typeof DEFAULT_GOAL_ICON).toBe('string');
    });
  });

  describe('DEFAULT_REWARD_ICON', () => {
    it('should be defined', () => {
      expect(DEFAULT_REWARD_ICON).toBeDefined();
      expect(typeof DEFAULT_REWARD_ICON).toBe('string');
    });
  });

  describe('getRandomIcon', () => {
    it('should return an icon from the list', () => {
      const icon = getRandomIcon();
      expect(GOAL_REWARD_ICONS).toContain(icon);
    });

    it('should return different icons when called multiple times', () => {
      const icons = new Set();
      for (let i = 0; i < 20; i++) {
        icons.add(getRandomIcon());
      }
      // Should get at least 2 different icons in 20 tries
      expect(icons.size).toBeGreaterThan(1);
    });
  });

  describe('searchIcons', () => {
    it('should return all icons for empty query', () => {
      expect(searchIcons('')).toEqual(GOAL_REWARD_ICONS);
      expect(searchIcons('   ')).toEqual(GOAL_REWARD_ICONS);
    });

    it('should search by category name', () => {
      const healthIcons = searchIcons('health');
      expect(healthIcons.length).toBeGreaterThan(0);
      expect(healthIcons).toEqual(ICON_CATEGORIES.health);
    });

    it('should search by partial category name', () => {
      const results = searchIcons('learn');
      expect(results.length).toBeGreaterThan(0);
      expect(results).toEqual(ICON_CATEGORIES.learning);
    });

    it('should be case insensitive', () => {
      const results1 = searchIcons('HEALTH');
      const results2 = searchIcons('health');
      expect(results1).toEqual(results2);
    });

    it('should filter by emoji character', () => {
      const results = searchIcons('🎯');
      expect(results).toContain('🎯');
    });

    it('should return all icons if no matches', () => {
      const results = searchIcons('xyz123nonexistent');
      expect(results).toEqual(GOAL_REWARD_ICONS);
    });

    it('should handle multiple categories matching', () => {
      const results = searchIcons('a'); // Many categories contain 'a'
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
