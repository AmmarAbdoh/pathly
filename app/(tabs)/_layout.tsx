/**
 * Tab layout configuration
 * Swipeable tabs with a bottom tab bar.
 *
 * Uses MaterialTopTabNavigator pinned to the bottom rather than a real bottom
 * tab navigator - that is what makes the tabs swipeable.
 */

import { DURATION, SPRING } from '@/src/constants/animation';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import {
  createMaterialTopTabNavigator,
  type MaterialTopTabBarProps,
} from '@react-navigation/material-top-tabs';
import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddGoalScreen from './add-goal';
import HomeScreen from './home';
import RewardsScreen from './rewards';
import SettingsScreen from './settings';
import StatisticsScreen from './statistics';

const Tab = createMaterialTopTabNavigator();

/** Icons per route, so the tab bar doesn't smuggle them through `options`. */
const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  'add-goal': 'add-circle-outline',
  statistics: 'analytics-outline',
  rewards: 'gift-outline',
  settings: 'settings-outline',
};

const TAB_ICONS_ACTIVE: Record<string, keyof typeof Ionicons.glyphMap> = {
  home: 'home',
  'add-goal': 'add-circle',
  statistics: 'analytics',
  rewards: 'gift',
  settings: 'settings',
};

interface TabButtonProps {
  routeName: string;
  label: string;
  isFocused: boolean;
  onPress: (routeName: string, isFocused: boolean) => void;
}

/**
 * One tab. Lifts and brightens when focused, driven on the UI thread so
 * switching tabs never costs a React render in the other four.
 */
const TabButton = memo<TabButtonProps>(({ routeName, label, isFocused, onPress }) => {
  const { theme } = useTheme();
  const isReducedMotion = useReducedMotion();

  const progress = useDerivedValue(() => {
    const target = isFocused ? 1 : 0;
    return isReducedMotion
      ? target
      : withSpring(target, SPRING.gentle);
  }, [isFocused, isReducedMotion]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: 1 + progress.value * 0.12 },
      { translateY: progress.value * -2 },
    ],
  }));

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.4 + progress.value * 0.6 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isFocused ? 1 : 0.75, { duration: DURATION.fast }),
  }));

  const handlePress = useCallback(
    () => onPress(routeName, isFocused),
    [onPress, routeName, isFocused]
  );

  const color = isFocused ? theme.colors.primary : theme.colors.tabIconDefault;

  return (
    <Pressable
      onPress={handlePress}
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={label}
      hitSlop={4}
    >
      <Animated.View
        style={[styles.indicator, { backgroundColor: theme.colors.primary }, indicatorStyle]}
      />
      <Animated.View style={iconStyle}>
        <Ionicons
          name={isFocused ? TAB_ICONS_ACTIVE[routeName] : TAB_ICONS[routeName]}
          size={24}
          color={color}
        />
      </Animated.View>
      <Animated.Text style={[styles.tabLabel, { color }, labelStyle]} numberOfLines={1}>
        {label}
      </Animated.Text>
    </Pressable>
  );
});

TabButton.displayName = 'TabButton';

/**
 * Custom tab bar.
 *
 * Adds the bottom safe-area inset so the bar clears the gesture pill on
 * edge-to-edge devices instead of sitting underneath it.
 */
function CustomTabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(
    (routeName: string, isFocused: boolean) => {
      const route = state.routes.find((r) => r.name === routeName);
      if (!route) return;

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    },
    [state.routes, navigation]
  );

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {state.routes.map((route, index) => (
        <TabButton
          key={route.key}
          routeName={route.name}
          label={descriptors[route.key].options.title ?? route.name}
          isFocused={state.index === index}
          onPress={handlePress}
        />
      ))}
    </View>
  );
}

export default function TabLayout() {
  const { t } = useLanguage();

  const renderTabBar = useCallback(
    (props: MaterialTopTabBarProps) => <CustomTabBar {...props} />,
    []
  );

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
      }}
    >
      <Tab.Screen name="home" component={HomeScreen} options={{ title: t.tabs.home }} />
      <Tab.Screen name="add-goal" component={AddGoalScreen} options={{ title: t.tabs.addGoal }} />
      <Tab.Screen
        name="statistics"
        component={StatisticsScreen}
        options={{ title: t.tabs.statistics }}
      />
      <Tab.Screen name="rewards" component={RewardsScreen} options={{ title: t.tabs.rewards }} />
      <Tab.Screen name="settings" component={SettingsScreen} options={{ title: t.tabs.settings }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  indicator: {
    position: 'absolute',
    top: -8,
    height: 3,
    width: 32,
    borderRadius: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
