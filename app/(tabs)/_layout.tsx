/**
 * Tab layout configuration
 * Bottom tab navigation setup
 */

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useMemo } from 'react';

/**
 * Tab layout component
 */
export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarStyle: {
        backgroundColor: theme.colors.card,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        paddingBottom: 4,
        paddingTop: 4,
        height: 60,
      },
      tabBarActiveTintColor: theme.colors.primary,
      tabBarInactiveTintColor: theme.colors.tabIconDefault,
      tabBarLabelStyle: {
        fontWeight: '600' as const,
        fontSize: 12,
      },
    }),
    [theme]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: t.tabs.home,
        }}
      />
      <Tabs.Screen
        name="add-goal"
        options={{
          title: t.tabs.addGoal,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: t.tabs.addGoal,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: t.tabs.statistics,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics-outline" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: t.tabs.statistics,
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: t.tabs.rewards,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="gift-outline" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: t.tabs.rewards,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabs.settings,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
          tabBarAccessibilityLabel: t.tabs.settings,
        }}
      />
    </Tabs>
  );
}
