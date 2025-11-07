/**
 * Tests for storage key constants
 */

import { REWARDS_KEY, STORAGE_KEYS } from '../storage-keys';

describe('Storage Keys Constants', () => {
  describe('STORAGE_KEYS', () => {
    it('should have all required keys', () => {
      expect(STORAGE_KEYS.GOALS).toBeDefined();
      expect(STORAGE_KEYS.THEME_MODE).toBeDefined();
      expect(STORAGE_KEYS.LANGUAGE).toBeDefined();
      expect(STORAGE_KEYS.LIFETIME_POINTS).toBeDefined();
      expect(STORAGE_KEYS.CUSTOM_TEMPLATES).toBeDefined();
    });

    it('should have correct key formats', () => {
      expect(STORAGE_KEYS.GOALS).toBe('@pathly:goals');
      expect(STORAGE_KEYS.THEME_MODE).toBe('@pathly:theme_mode');
      expect(STORAGE_KEYS.LANGUAGE).toBe('@pathly:language');
      expect(STORAGE_KEYS.LIFETIME_POINTS).toBe('@pathly:lifetime_points');
      expect(STORAGE_KEYS.CUSTOM_TEMPLATES).toBe('@pathly:custom_templates');
    });

    it('should have unique values', () => {
      const values = Object.values(STORAGE_KEYS);
      const uniqueValues = new Set(values);
      expect(uniqueValues.size).toBe(values.length);
    });

    it('should have @pathly prefix', () => {
      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(key).toMatch(/^@pathly:/);
      });
    });
  });

  describe('REWARDS_KEY', () => {
    it('should be defined', () => {
      expect(REWARDS_KEY).toBeDefined();
      expect(typeof REWARDS_KEY).toBe('string');
    });

    it('should have correct value', () => {
      expect(REWARDS_KEY).toBe('@pathly_rewards');
    });
  });
});
