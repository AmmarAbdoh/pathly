/**
 * Tab layout configuration
 * Swipeable tabs with bottom navigation
 */

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AddGoalScreen from './add-goal';
import HomeScreen from './home';
import RewardsScreen from './rewards';
import SettingsScreen from './settings';
import StatisticsScreen from './statistics';

const Tab = createMaterialTopTabNavigator();

/**
 * Custom tab bar component
 */
function CustomTabBar({ state, descriptors, navigation }: any) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Ionicons
              name={options.tabBarIcon}
              size={24}
              color={isFocused ? theme.colors.primary : theme.colors.tabIconDefault}
            />
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? theme.colors.primary : theme.colors.tabIconDefault,
                },
              ]}
            >
              {options.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/**
 * Tab layout component with swipe navigation
 */
export default function TabLayout() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        tabBarPosition="bottom"
        screenOptions={{
          swipeEnabled: true,
          animationEnabled: true,
          lazy: true,
        }}
      >
        <Tab.Screen
          name="home"
          component={HomeScreen}
          options={{
            title: t.tabs.home,
            tabBarIcon: 'home-outline' as any,
            tabBarAccessibilityLabel: t.tabs.home,
          }}
        />
        <Tab.Screen
          name="add-goal"
          component={AddGoalScreen}
          options={{
            title: t.tabs.addGoal,
            tabBarIcon: 'add-circle-outline' as any,
            tabBarAccessibilityLabel: t.tabs.addGoal,
          }}
        />
        <Tab.Screen
          name="statistics"
          component={StatisticsScreen}
          options={{
            title: t.tabs.statistics,
            tabBarIcon: 'analytics-outline' as any,
            tabBarAccessibilityLabel: t.tabs.statistics,
          }}
        />
        <Tab.Screen
          name="rewards"
          component={RewardsScreen}
          options={{
            title: t.tabs.rewards,
            tabBarIcon: 'gift-outline' as any,
            tabBarAccessibilityLabel: t.tabs.rewards,
          }}
        />
        <Tab.Screen
          name="settings"
          component={SettingsScreen}
          options={{
            title: t.tabs.settings,
            tabBarIcon: 'settings-outline' as any,
            tabBarAccessibilityLabel: t.tabs.settings,
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 8,
    height: 64,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
});
