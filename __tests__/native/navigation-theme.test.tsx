/**
 * NavigationTheme: the navigators paint behind each screen from their own
 * theme. Left light, a tab page not yet rendered flashed light in dark mode.
 */

import NavigationTheme from '@/components/NavigationTheme';
import { darkTheme, lightTheme } from '@/constants/theme';
import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, waitFor } from '@testing-library/react-native';
import { useTheme as useNavigationTheme } from 'expo-router';
import React from 'react';

// jest.setup.js mocks expo-router for the screens; this needs its real theme.
jest.mock('expo-router', () => jest.requireActual('expo-router'));

type NavigationColors = ReturnType<typeof useNavigationTheme>;

async function renderTheme() {
  let navigation!: NavigationColors;
  let app!: ReturnType<typeof useTheme>;
  function Probe() {
    navigation = useNavigationTheme();
    app = useTheme();
    return null;
  }
  render(
    <LanguageProvider>
      <ThemeProvider>
        <NavigationTheme>
          <Probe />
        </NavigationTheme>
      </ThemeProvider>
    </LanguageProvider>
  );
  return { navigation: () => navigation, app: () => app };
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

it("gives the navigators the app's dark colors", async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark');
  const { navigation } = await renderTheme();

  await waitFor(() => expect(navigation().dark).toBe(true));
  expect(navigation().colors).toEqual(
    expect.objectContaining({
      background: darkTheme.colors.background,
      card: darkTheme.colors.card,
      text: darkTheme.colors.text,
      border: darkTheme.colors.border,
      primary: darkTheme.colors.primary,
    })
  );
});

it('follows a switch of theme', async () => {
  await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, 'dark');
  const { navigation, app } = await renderTheme();
  await waitFor(() => expect(navigation().dark).toBe(true));

  await act(async () => {
    await app().setThemeMode('light');
  });

  expect(navigation().dark).toBe(false);
  expect(navigation().colors.background).toBe(lightTheme.colors.background);
});
