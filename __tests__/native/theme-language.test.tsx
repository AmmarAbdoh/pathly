/**
 * ThemeContext and LanguageContext, rendered for real.
 *
 * Both restore a persisted preference asynchronously on mount and neither
 * exposes a loading flag, so the tests wait on the observable value.
 */

import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { LanguageProvider, useLanguage } from '@/src/context/LanguageContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

// Theme sits inside Language in the real tree (app/_layout.tsx).
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    <ThemeProvider>{children}</ThemeProvider>
  </LanguageProvider>
);

const renderBoth = () =>
  renderHook(() => ({ theme: useTheme(), language: useLanguage() }), { wrapper });

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('ThemeContext', () => {
  it('defaults to following the system', async () => {
    const { result } = renderBoth();
    await act(async () => {});

    expect(result.current.theme.themeMode).toBe('system');
  });

  it('restores a persisted theme mode', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark');
    const { result } = renderBoth();

    await waitFor(() => expect(result.current.theme.themeMode).toBe('dark'));
    expect(result.current.theme.isDark).toBe(true);
  });

  it('ignores an invalid persisted value', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, 'neon');
    const { result } = renderBoth();
    await act(async () => {});

    expect(result.current.theme.themeMode).toBe('system');
  });

  it('persists a new theme mode', async () => {
    const { result } = renderBoth();
    await act(async () => {});

    await act(async () => {
      await result.current.theme.setThemeMode('light');
    });

    expect(result.current.theme.themeMode).toBe('light');
    expect(result.current.theme.isDark).toBe(false);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE)).toBe('light');
  });
});

describe('LanguageContext', () => {
  it('defaults to English, left-to-right', async () => {
    const { result } = renderBoth();
    await act(async () => {});

    expect(result.current.language.language).toBe('en');
    expect(result.current.language.isRTL).toBe(false);
    expect(result.current.language.t.common.save).toBe('Save');
  });

  it('restores a persisted Arabic preference with Arabic strings and RTL', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, 'ar');
    const { result } = renderBoth();

    await waitFor(() => expect(result.current.language.language).toBe('ar'));
    expect(result.current.language.isRTL).toBe(true);
    expect(result.current.language.t.common.save).toBe('حفظ');
  });

  it('persists a language change', async () => {
    const { result } = renderBoth();
    await act(async () => {});

    await act(async () => {
      await result.current.language.setLanguage('ar');
    });

    expect(result.current.language.language).toBe('ar');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE)).toBe('ar');
  });
});
