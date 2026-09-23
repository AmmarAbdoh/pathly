/**
 * Storage service for persisting application data using AsyncStorage
 * Provides a type-safe interface for storing and retrieving goals
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants/storage-keys';
import { Goal, GoalTemplate } from '../types';

/**
 * Stored data that was read but cannot be used: not JSON, or not a list.
 *
 * Unlike a failed read, retrying will never fix it. Carries the raw value so
 * the caller can keep it aside (see setAsideUnreadable) before starting over.
 */
export class UnreadableDataError extends Error {
  constructor(
    message: string,
    readonly raw: string
  ) {
    super(message);
    this.name = 'UnreadableDataError';
  }
}

/** Parse a stored list, or throw UnreadableDataError. */
export function parseStoredList(raw: string, what: string): Record<string, unknown>[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new UnreadableDataError(`Stored ${what} are not valid JSON`, raw);
  }
  if (!Array.isArray(parsed)) {
    throw new UnreadableDataError(`Stored ${what} are not a list`, raw);
  }
  // An entry that is not an object (null, a number, a list) holds nothing to
  // keep, and would crash everything that reads a field from it. A list is an
  // object to typeof, and came out as a goal with no id or title.
  return parsed.filter(
    (entry): entry is Record<string, unknown> =>
      entry !== null && typeof entry === 'object' && !Array.isArray(entry)
  );
}

/**
 * Move an unreadable value out of `key`, keeping it under a timestamped key
 * beside it, so the app can start over without destroying anything.
 *
 * @throws if the copy cannot be written - then nothing has been moved.
 */
export async function setAsideUnreadable(key: string, raw: string): Promise<void> {
  await AsyncStorage.setItem(`${key}.unreadable.${Date.now()}`, raw);
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    // The copy is safe; the value is simply set aside again next time.
    console.error('Error removing unreadable data:', error);
  }
}

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
   * @returns Array of goals, or empty array if none are stored
   * @throws UnreadableDataError if what is stored is not a goals list, or an
   *   Error if storage cannot be read at all. This used to return [] instead,
   *   and the caller could not tell "unreadable" from "no goals": the next
   *   save wrote over everything.
   */
  async loadGoals(): Promise<Goal[]> {
    let jsonData: string | null;
    try {
      jsonData = await AsyncStorage.getItem(STORAGE_KEYS.GOALS);
    } catch (error) {
      console.error('Error loading goals:', error);
      throw new Error('Failed to load goals');
    }

    if (!jsonData) {
      return [];
    }

    const goals = parseStoredList(jsonData, 'goals') as unknown as Goal[];

    // Migrate old goals that don't have new fields
    return goals.map(goal => {
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

/**
 * Storage service for custom goal templates
 */
export const customTemplatesStorage = {
  /**
   * Save custom templates array to AsyncStorage
   * @param templates - Array of custom templates to persist
   */
  async saveCustomTemplates(templates: GoalTemplate[]): Promise<void> {
    try {
      const jsonData = JSON.stringify(templates);
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, jsonData);
    } catch (error) {
      console.error('Error saving custom templates:', error);
      throw new Error('Failed to save custom templates');
    }
  },

  /**
   * Load custom templates array from AsyncStorage
   * @returns Array of custom templates, or empty array if none exist
   */
  async loadCustomTemplates(): Promise<GoalTemplate[]> {
    try {
      const jsonData = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
      
      if (!jsonData) {
        return [];
      }

      const templates: GoalTemplate[] = JSON.parse(jsonData);
      
      // Validate that the data is an array
      if (!Array.isArray(templates)) {
        console.warn('Invalid custom templates data format, returning empty array');
        return [];
      }

      return templates;
    } catch (error) {
      console.error('Error loading custom templates:', error);
      return [];
    }
  },

  /**
   * Add a new custom template
   * @param template - Template to add
   */
  async addCustomTemplate(template: GoalTemplate): Promise<void> {
    try {
      const templates = await this.loadCustomTemplates();
      templates.push(template);
      await this.saveCustomTemplates(templates);
    } catch (error) {
      console.error('Error adding custom template:', error);
      throw new Error('Failed to add custom template');
    }
  },

  /**
   * Delete a custom template by ID
   * @param templateId - ID of template to delete
   */
  async deleteCustomTemplate(templateId: string): Promise<void> {
    try {
      const templates = await this.loadCustomTemplates();
      const filtered = templates.filter(t => t.id !== templateId);
      await this.saveCustomTemplates(filtered);
    } catch (error) {
      console.error('Error deleting custom template:', error);
      throw new Error('Failed to delete custom template');
    }
  },

  /**
   * Clear all custom templates
   */
  async clearCustomTemplates(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.CUSTOM_TEMPLATES);
    } catch (error) {
      console.error('Error clearing custom templates:', error);
      throw new Error('Failed to clear custom templates');
    }
  },
};

// Maintain backward compatibility
export const storage = goalsStorage;