/**
 * Root layout
 * App-wide providers and navigation configuration
 */

import { GoalsProvider } from '@/src/context/GoalsContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { RewardsProvider } from '@/src/context/RewardsContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { Stack } from 'expo-router';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Root layout component
 * Wraps entire app with necessary providers
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <GoalsProvider>
            <RewardsProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: 'transparent' },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen
                  name="goal/[id]"
                  options={{
                    headerShown: false,
                    presentation: 'card',
                  }}
                />
                <Stack.Screen
                  name="goal/add"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                  }}
                />
              </Stack>
            </RewardsProvider>
          </GoalsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
