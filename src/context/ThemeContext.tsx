/**
 * Theme context provider
 * Manages theme state and provides theme utilities to the app
 */

import { darkTheme, lightTheme } from '@/constants/theme';
import { Theme, ThemeMode } from '@/src/types';
import { themeStorage } from '@/src/utils/storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme Provider Component
 * Wraps the app to provide theme context to all children
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference on mount
  useEffect(() => {
    loadThemeMode();
  }, []);

  /**
   * Load theme mode from storage
   */
  const loadThemeMode = async () => {
    try {
      const savedMode = await themeStorage.loadThemeMode();
      if (savedMode && isValidThemeMode(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update theme mode and persist to storage
   */
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      await themeStorage.saveThemeMode(mode);
      setThemeModeState(mode);
    } catch (error) {
      console.error('Error saving theme mode:', error);
      // Still update local state even if save fails
      setThemeModeState(mode);
    }
  }, []);

  /**
   * Compute active theme based on mode and system preference
   */
  const theme = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemColorScheme]);

  /**
   * Check if current theme is dark
   */
  const isDark = useMemo(() => {
    return theme === darkTheme;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      themeMode,
      setThemeMode,
      isDark,
    }),
    [theme, themeMode, setThemeMode, isDark]
  );

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

/**
 * Validate theme mode string
 */
function isValidThemeMode(mode: string): mode is ThemeMode {
  return mode === 'light' || mode === 'dark' || mode === 'system';
}