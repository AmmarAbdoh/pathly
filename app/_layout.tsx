/**
 * Root layout
 * App-wide providers and navigation configuration
 */

import StorageErrorBanner from '@/components/StorageErrorBanner';
import { GoalsProvider } from '@/src/context/GoalsContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { RewardsProvider } from '@/src/context/RewardsContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Root layout component
 * Wraps entire app with necessary providers.
 *
 * Provider order matters: Theme reads the language for RTL, and both Goals and
 * Rewards read the theme, so they must nest inside it.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <ThemeProvider>
            <GoalsProvider>
              <RewardsProvider>
                <StatusBar style="auto" />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: 'transparent' },
                    animation: 'slide_from_right',
                    animationDuration: 220,
                    gestureEnabled: true,
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="goal/[id]" options={{ presentation: 'card' }} />
                  <Stack.Screen
                    name="analytics"
                    options={{ animation: 'slide_from_bottom' }}
                  />
                  <Stack.Screen
                    name="review"
                    options={{ animation: 'slide_from_bottom' }}
                  />
                </Stack>
                {/* Rendered after the Stack so it overlays every screen. */}
                <StorageErrorBanner />
              </RewardsProvider>
            </GoalsProvider>
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
