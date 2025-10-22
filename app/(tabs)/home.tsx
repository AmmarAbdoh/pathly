/**
 * Home screen
 * Main screen displaying all goals and add goal form
 */

import GoalCard from '@/components/GoalCard';
import Header from '@/components/Header';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Goal, TimePeriod } from '@/src/types';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Period order for sorting
const PERIOD_ORDER: Record<TimePeriod, number> = {
  'daily': 1,
  'weekly': 2,
  'monthly': 3,
  'yearly': 4,
  'custom': 5,
};

interface GoalSection {
  title: string;
  data: Goal[];
  isUltimate?: boolean;
}

/**
 * Home screen component
 */
export default function HomeScreen() {
  const { goals } = useGoals();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  // Period labels - use translations
  const PERIOD_LABELS: Record<TimePeriod, string> = useMemo(() => ({
    'daily': t.home.dailyGoals,
    'weekly': t.home.weeklyGoals,
    'monthly': t.home.monthlyGoals,
    'yearly': t.home.yearlyGoals,
    'custom': t.home.customGoals,
  }), [t]);

  // Filter to show only parent goals (not subgoals) and organize by sections
  const goalSections = useMemo(() => {
    const parentGoals = goals.filter(goal => !goal.parentId);
    const sections: GoalSection[] = [];

    // 1. Ultimate Goals Section
    const ultimateGoals = parentGoals.filter(g => g.isUltimate);
    if (ultimateGoals.length > 0) {
      sections.push({
        title: t.home.ultimateGoals,
        data: ultimateGoals,
        isUltimate: true,
      });
    }

    // 2. Regular Goals by Period
    const regularGoals = parentGoals.filter(g => !g.isUltimate);
    
    // Group by period
    const groupedByPeriod: Record<TimePeriod, Goal[]> = {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
      custom: [],
    };

    regularGoals.forEach(goal => {
      if (groupedByPeriod[goal.period]) {
        groupedByPeriod[goal.period].push(goal);
      }
    });

    // Add period sections in order
    (['daily', 'weekly', 'monthly', 'yearly', 'custom'] as TimePeriod[]).forEach(period => {
      if (groupedByPeriod[period].length > 0) {
        sections.push({
          title: PERIOD_LABELS[period],
          data: groupedByPeriod[period],
        });
      }
    });

    return sections;
  }, [goals, t, PERIOD_LABELS]);

  // Flatten for FlatList with section headers
  const flattenedData = useMemo(() => {
    const items: Array<{ type: 'header' | 'goal'; data: any }> = [];
    
    goalSections.forEach((section, sectionIndex) => {
      // Add section header
      items.push({
        type: 'header',
        data: { title: section.title, isFirst: sectionIndex === 0 },
      });
      
      // Add goals
      section.data.forEach(goal => {
        items.push({
          type: 'goal',
          data: goal,
        });
      });
    });
    
    return items;
  }, [goalSections]);

  /**
   * Handle navigation to goal detail screen
   */
  const handleGoalPress = useCallback(
    (id: number) => {
      router.push(`/goal/${id}`);
    },
    [router]
  );



  /**
   * Render individual item (goal or section header)
   */
  const renderItem = useCallback(
    ({ item }: { item: { type: 'header' | 'goal'; data: any } }) => {
      if (item.type === 'header') {
        return (
          <View style={[styles.sectionHeader, item.data.isFirst && styles.firstSectionHeader]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {item.data.title}
            </Text>
            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          </View>
        );
      }
      
      // Goal item
      const goal = item.data as Goal;
      return (
        <GoalCard
          title={goal.title}
          progress={goal.progress}
          points={goal.points}
          icon={goal.icon}
          subgoalCount={goal.subGoals?.length || 0}
          isUltimate={goal.isUltimate}
          onPress={() => handleGoalPress(goal.id)}
        />
      );
    },
    [handleGoalPress, theme]
  );

  /**
   * Extract unique key for each item
   */
  const keyExtractor = useCallback(
    (item: { type: 'header' | 'goal'; data: any }, index: number) => {
      if (item.type === 'header') {
        return `header-${item.data.title}`;
      }
      return `goal-${item.data.id}`;
    },
    []
  );

  /**
   * Render empty state
   */
  const renderEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {t.home.noGoals}
        </Text>
      </View>
    ),
    [theme, t]
  );

  /**
   * Render loading state
   */
  const renderLoadingComponent = useMemo(
    () => (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    ),
    [theme]
  );



  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <FlatList
        data={flattenedData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={<Header />}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  firstSectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  separator: {
    height: 2,
    borderRadius: 1,
    opacity: 0.2,
  },
});
