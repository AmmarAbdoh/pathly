/**
 * Storage service for persisting application data using AsyncStorage
 * Provides a type-safe interface for storing and retrieving goals
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage-keys';
import { Goal } from '../types';

/**
 * Storage service for goals data
 */
export const goalsStorage = {
  /**
   * Save goals array to AsyncStorage
   * @param goals - Array of goals to persist
   * @throws Error if storage operation fails
   */
  async saveGoals(goals: Goal[]): Promise<void> {
    try {
      const jsonData = JSON.stringify(goals);
      await AsyncStorage.setItem(STORAGE_KEYS.GOALS, jsonData);
    } catch (error) {
      console.error('Error saving goals:', error);
      throw new Error('Failed to save goals');
    }
  },

  /**
   * Load goals array from AsyncStorage
   * @returns Array of goals, or empty array if none exist
   * @throws Error if storage operation fails critically
   */
  async loadGoals(): Promise<Goal[]> {
    try {
      const jsonData = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
      
      if (!jsonData) {
        return [];
      }

      const goals: Goal[] = JSON.parse(jsonData);
      
      // Validate that the data is an array
      if (!Array.isArray(goals)) {
        console.warn('Invalid goals data format, returning empty array');
        return [];
      }

      // Migrate old goals that don't have new fields
      const migratedGoals = goals.map(goal => {
        const migrated: Goal = { ...goal };
        
        // Migrate initialValue field
        if (migrated.initialValue === undefined) {
          migrated.initialValue = goal.current;
        }
        
        // Migrate period field (default to 'custom' for existing goals)
        if (!migrated.period) {
          migrated.period = 'custom';
        }
        
        // Ensure subGoals array exists
        if (!migrated.subGoals) {
          migrated.subGoals = [];
        }
        
        // Set periodStartDate if not present
        if (!migrated.periodStartDate) {
          migrated.periodStartDate = goal.createdAt || Date.now();
        }
        
        // Migrate isUltimate field (default to false)
        if (migrated.isUltimate === undefined) {
          migrated.isUltimate = false;
        }
        
        // Migrate isComplete field (default to false)
        if (migrated.isComplete === undefined) {
          migrated.isComplete = false;
        }
        
        return migrated;
      });

      return migratedGoals;
    } catch (error) {
      console.error('Error loading goals:', error);
      // Return empty array on error rather than crashing the app
      return [];
    }
  },

  /**
   * Clear all goals from storage
   */
  async clearGoals(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.GOALS);
    } catch (error) {
      console.error('Error clearing goals:', error);
      throw new Error('Failed to clear goals');
    }
  },
};

/**
 * Storage service for theme and language preferences
 */
export const themeStorage = {
  /**
   * Save theme mode preference
   * @param mode - Theme mode to save
   */
  async saveThemeMode(mode: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
      throw new Error('Failed to save theme mode');
    }
  },

  /**
   * Load theme mode preference
   * @returns Theme mode string or null if not set
   */
  async loadThemeMode(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
    } catch (error) {
      console.error('Error loading theme mode:', error);
      return null;
    }
  },

  /**
   * Save language preference
   * @param language - Language code to save
   */
  async saveLanguage(language: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Error saving language:', error);
      throw new Error('Failed to save language');
    }
  },

  /**
   * Load language preference
   * @returns Language code or null if not set
   */
  async loadLanguage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    } catch (error) {
      console.error('Error loading language:', error);
      return null;
    }
  },
};

// Maintain backward compatibility
export const storage = goalsStorage;