/**
 * Theme definitions for light and dark modes
 * Centralized theme configuration for consistent styling
 */

import type { Theme } from '@/src/types';
import { Platform } from 'react-native';

/**
 * Font families based on platform
 */
const platformFonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "Menlo, Monaco, Consolas, monospace",
  },
})!;

/**
 * Light theme configuration
 */
export const lightTheme: Theme = {
  colors: {
    background: '#F5F6FA',
    card: '#FFFFFF',
    text: '#1E1E1E',
    textSecondary: '#666666',
    primary: '#6C63FF',
    danger: '#FF4B4B',
    border: '#DDD',
    tabIconDefault: '#687076',
    tabIconSelected: '#6C63FF',
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
  },
  fonts: platformFonts,
};

/**
 * Dark theme configuration
 */
export const darkTheme: Theme = {
  colors: {
    background: '#1A1A1A',
    card: '#2D2D2D',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    primary: '#8B85FF',
    danger: '#FF6B6B',
    border: '#404040',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#8B85FF',
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 4,
    },
  },
  fonts: platformFonts,
};
