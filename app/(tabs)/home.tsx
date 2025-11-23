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
import { calculateTimeRemaining, formatEndDateTime, formatTimeRemaining } from '@/src/utils/goal-calculations';
import { isGoalActiveOnDate } from '@/src/utils/goal-scheduling';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Period order for sorting
const PERIOD_ORDER: Record<TimePeriod, number> = {
  'daily': 1,
  'weekly': 2,
  'monthly': 3,
  'yearly': 4,
  'custom': 5,
  'ongoing': 6,
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
  const { goals, reorderGoals, checkDependencies } = useGoals();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const router = useRouter();

  // Search and filter state
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'paused' | 'completed' | 'expired'>('all');
  const [showFilters, setShowFilters] = React.useState(false);

  // Period labels - use translations
  const PERIOD_LABELS: Record<TimePeriod, string> = useMemo(() => ({
    'daily': t.home.dailyGoals,
    'weekly': t.home.weeklyGoals,
    'monthly': t.home.monthlyGoals,
    'yearly': t.home.yearlyGoals,
    'custom': t.home.customGoals,
    'ongoing': t.home.ongoingGoals,
  }), [t]);

  // Filter to show only parent goals (not subgoals, not archived) and organize by sections
  const goalSections = useMemo(() => {
    let parentGoals = goals.filter(goal => !goal.parentId && !goal.isArchived);

    // Apply schedule filter - only show goals active today
    parentGoals = parentGoals.filter(goal => isGoalActiveOnDate(goal));

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      parentGoals = parentGoals.filter(goal =>
        goal.title.toLowerCase().includes(query) ||
        goal.description?.toLowerCase().includes(query) ||
        goal.unit.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      parentGoals = parentGoals.filter(goal => {
        const timeRemaining = calculateTimeRemaining(
          goal.periodStartDate,
          goal.period,
          goal.customPeriodDays,
          goal.isRecurring
        );
        
        switch (filterStatus) {
          case 'active':
            return !goal.isComplete && !goal.isPaused && !timeRemaining.isExpired;
          case 'paused':
            return goal.isPaused;
          case 'completed':
            return goal.isComplete;
          case 'expired':
            return !goal.isComplete && !goal.isRecurring && timeRemaining.isExpired;
          default:
            return true;
        }
      });
    }

    const sections: GoalSection[] = [];

    // Separate completed and active goals
    const activeGoals = parentGoals.filter(g => !g.isComplete);
    const completedGoals = parentGoals.filter(g => g.isComplete);

    // Sort function: by sortOrder if defined, then by creation date
    const sortGoals = (goalsToSort: Goal[]) => {
      return [...goalsToSort].sort((a, b) => {
        // If both have sortOrder, use it
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        // If only one has sortOrder, prioritize it
        if (a.sortOrder !== undefined) return -1;
        if (b.sortOrder !== undefined) return 1;
        // Otherwise, sort by creation date (newest first)
        return b.createdAt - a.createdAt;
      });
    };

    // 1. Ultimate Goals Section (active only)
    const ultimateGoals = activeGoals.filter(g => g.isUltimate);
    if (ultimateGoals.length > 0) {
      sections.push({
        title: t.home.ultimateGoals,
        data: sortGoals(ultimateGoals),
        isUltimate: true,
      });
    }

    // 2. Regular Goals by Period (active only)
    const regularGoals = activeGoals.filter(g => !g.isUltimate);
    
    // Group by period
    const groupedByPeriod: Record<TimePeriod, Goal[]> = {
      daily: [],
      weekly: [],
      monthly: [],
      yearly: [],
      custom: [],
      ongoing: [],
    };

    regularGoals.forEach(goal => {
      if (groupedByPeriod[goal.period]) {
        groupedByPeriod[goal.period].push(goal);
      }
    });

    // Add period sections in order
    (['daily', 'weekly', 'monthly', 'yearly', 'custom', 'ongoing'] as TimePeriod[]).forEach(period => {
      if (groupedByPeriod[period].length > 0) {
        sections.push({
          title: PERIOD_LABELS[period],
          data: sortGoals(groupedByPeriod[period]),
        });
      }
    });

    // 3. Completed Goals Section (at the end)
    if (completedGoals.length > 0) {
      sections.push({
        title: t.home.completedGoals || 'Completed Goals',
        data: sortGoals(completedGoals),
      });
    }

    return sections;
  }, [goals, t, PERIOD_LABELS, searchQuery, filterStatus]);

  // Flatten for FlatList with section headers
  const flattenedData = useMemo(() => {
    const items: Array<{ type: 'header' | 'goal'; data: any; section?: GoalSection; sectionIndex?: number }> = [];
    
    goalSections.forEach((section, sectionIndex) => {
      // Add section header
      items.push({
        type: 'header',
        data: { title: section.title, isFirst: sectionIndex === 0 },
      });
      
      // Add goals with section reference for reordering
      section.data.forEach(goal => {
        items.push({
          type: 'goal',
          data: goal,
          section: section,
          sectionIndex: sectionIndex,
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
   * Handle moving a goal up in its section
   */
  const handleMoveGoalUp = useCallback(
    (goalId: number, section: GoalSection) => {
      const goalIndex = section.data.findIndex(g => g.id === goalId);
      if (goalIndex <= 0) return; // Can't move up if first

      // Get IDs of all goals in this section in their new order
      const sectionGoalIds = [...section.data.map(g => g.id)];
      [sectionGoalIds[goalIndex - 1], sectionGoalIds[goalIndex]] = [sectionGoalIds[goalIndex], sectionGoalIds[goalIndex - 1]];
      
      reorderGoals(sectionGoalIds);
    },
    [reorderGoals]
  );

  /**
   * Handle moving a goal down in its section
   */
  const handleMoveGoalDown = useCallback(
    (goalId: number, section: GoalSection) => {
      const goalIndex = section.data.findIndex(g => g.id === goalId);
      if (goalIndex < 0 || goalIndex >= section.data.length - 1) return; // Can't move down if last

      // Get IDs of all goals in this section in their new order
      const sectionGoalIds = [...section.data.map(g => g.id)];
      [sectionGoalIds[goalIndex], sectionGoalIds[goalIndex + 1]] = [sectionGoalIds[goalIndex + 1], sectionGoalIds[goalIndex]];
      
      reorderGoals(sectionGoalIds);
    },
    [reorderGoals]
  );

  /**
   * Render individual item (goal or section header)
   */
  const renderItem = useCallback(
    ({ item, index }: { item: { type: 'header' | 'goal'; data: any; section?: GoalSection; sectionIndex?: number }; index: number }) => {
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
      const section = item.section;
      const sectionIndex = item.sectionIndex;

      const timeRemainingData = calculateTimeRemaining(
        goal.periodStartDate,
        goal.period,
        goal.customPeriodDays,
        goal.isRecurring
      );
      const timeRemainingText = formatTimeRemaining(
        timeRemainingData,
        t.time,
        goal.isRecurring
      );
      const endDateTime = formatEndDateTime(
        goal.periodStartDate,
        goal.period,
        goal.customPeriodDays,
        language
      );
      
      // Add end date to time remaining display (if not expired and not completed)
      const displayTimeRemaining = !goal.isComplete && !timeRemainingData.isExpired && endDateTime
        ? `${timeRemainingText} (${t.time.endsAt}: ${endDateTime})`
        : timeRemainingText;

      // Calculate completed subgoals count for ultimate goals
      const completedSubgoalCount = goal.isUltimate && goal.subGoals
        ? goal.subGoals.filter(subgoalId => {
            const subgoal = goals.find(g => g.id === subgoalId);
            return subgoal?.isComplete;
          }).length
        : 0;
      
      // Determine if goal can move up/down in its section
      const goalIndexInSection = section ? section.data.findIndex(g => g.id === goal.id) : -1;
      const canMoveUp = goalIndexInSection > 0;
      const canMoveDown = section ? goalIndexInSection < section.data.length - 1 : false;

      // Check if goal is blocked by dependencies
      const isBlocked = !checkDependencies(goal.id);

      return (
        <GoalCard
          title={goal.title}
          progress={goal.progress}
          points={goal.points}
          icon={goal.icon}
          subgoalCount={goal.subGoals?.length || 0}
          completedSubgoalCount={completedSubgoalCount}
          isUltimate={goal.isUltimate}
          onPress={() => handleGoalPress(goal.id)}
          timeRemaining={displayTimeRemaining}
          isExpired={timeRemainingData.isExpired}
          isRecurring={goal.isRecurring}
          isComplete={goal.isComplete}
          isPaused={goal.isPaused}
          onMoveUp={section ? () => handleMoveGoalUp(goal.id, section) : undefined}
          onMoveDown={section ? () => handleMoveGoalDown(goal.id, section) : undefined}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
          currentStreak={goal.currentStreak}
          isBlocked={isBlocked}
          schedule={goal.schedule}
        />
      );
    },
    [handleGoalPress, handleMoveGoalUp, handleMoveGoalDown, theme, t, goals, language, checkDependencies]
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
   * Render header with search and filters
   */
  const renderListHeader = useCallback(() => (
    <>
      <Header />
      
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.card, ...theme.shadows.small }]}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder={t.home.searchPlaceholder}
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: filterStatus === 'all' ? theme.colors.primary : theme.colors.card },
            theme.shadows.small
          ]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterButtonText, { color: filterStatus === 'all' ? '#FFF' : theme.colors.text }]}>
            {t.home.filterAll}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: filterStatus === 'active' ? theme.colors.primary : theme.colors.card },
            theme.shadows.small
          ]}
          onPress={() => setFilterStatus('active')}
        >
          <Text style={[styles.filterButtonText, { color: filterStatus === 'active' ? '#FFF' : theme.colors.text }]}>
            {t.home.filterActive}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: filterStatus === 'paused' ? theme.colors.primary : theme.colors.card },
            theme.shadows.small
          ]}
          onPress={() => setFilterStatus('paused')}
        >
          <Text style={[styles.filterButtonText, { color: filterStatus === 'paused' ? '#FFF' : theme.colors.text }]}>
            {t.home.filterPaused}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: filterStatus === 'completed' ? theme.colors.primary : theme.colors.card },
            theme.shadows.small
          ]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[styles.filterButtonText, { color: filterStatus === 'completed' ? '#FFF' : theme.colors.text }]}>
            {t.home.filterCompleted}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: filterStatus === 'expired' ? theme.colors.primary : theme.colors.card },
            theme.shadows.small
          ]}
          onPress={() => setFilterStatus('expired')}
        >
          <Text style={[styles.filterButtonText, { color: filterStatus === 'expired' ? '#FFF' : theme.colors.text }]}>
            {t.home.filterExpired}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  ), [theme, t, searchQuery, filterStatus]);

  /**
   * Render empty state
   */
  const renderEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {searchQuery || filterStatus !== 'all' ? t.home.noResults : t.home.noGoals}
        </Text>
      </View>
    ),
    [theme, t, searchQuery, filterStatus]
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
        ListHeaderComponent={renderListHeader}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
