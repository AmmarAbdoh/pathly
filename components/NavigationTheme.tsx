/**
 * Navigation theme
 * Hands the app's colors to the navigators. They paint what sits behind each
 * screen - a tab page before it has rendered, a stack card - from their own
 * theme, which is light unless told otherwise: in dark mode, swiping to a tab
 * not yet shown flashed a light page before it drew.
 */

import { useTheme } from '@/src/context/ThemeContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import React, { useMemo } from 'react';

export default function NavigationTheme({ children }: { children: React.ReactNode }) {
  const { theme, isDark } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: theme.colors.primary,
        background: theme.colors.background,
        card: theme.colors.card,
        text: theme.colors.text,
        border: theme.colors.border,
        notification: theme.colors.danger,
      },
    };
  }, [theme, isDark]);

  return <ThemeProvider value={navigationTheme}>{children}</ThemeProvider>;
}
