/**
 * Home screen
 * Main screen displaying all goals, grouped into sections.
 *
 * Everything a row needs is precomputed once per goals/language change into
 * `rows`. renderItem then does nothing but read a prebuilt object and hand it
 * to a memoized card - no date math, no array scans, no closure allocation on
 * the scroll path.
 */

import GoalCard from '@/components/GoalCard';
import GoalListHeader, { type FilterStatus } from '@/components/GoalListHeader';
import { DURATION } from '@/src/constants/animation';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useDebouncedValue } from '@/src/hooks/use-debounced-value';
import { Goal, TimePeriod } from '@/src/types';
import {
  calculateTimeRemaining,
  formatEndDateTime,
  formatTimeRemaining,
} from '@/src/utils/goal-calculations';
import { isGoalActiveOnDate } from '@/src/utils/goal-scheduling';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Period sections render in this order. */
const PERIOD_ORDER: TimePeriod[] = [
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom',
  'ongoing',
];

/** Hours remaining below which the countdown turns amber, then red. */
const URGENCY_SOON_HOURS = 24;
const URGENCY_CRITICAL_HOURS = 6;
const MS_PER_HOUR = 60 * 60 * 1000;

type Urgency = 'none' | 'normal' | 'soon' | 'critical';

/** A fully-resolved row, ready to render with no further computation. */
interface GoalRow {
  kind: 'goal';
  key: string;
  goal: Goal;
  timeRemaining: string;
  urgency: Urgency;
  isExpired: boolean;
  completedSubgoalCount: number;
  isBlocked: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

interface HeaderRow {
  kind: 'header';
  key: string;
  title: string;
  isFirst: boolean;
}

type ListRow = GoalRow | HeaderRow;

/**
 * Sort by explicit sortOrder when present, newest-first otherwise.
 */
function compareGoals(a: Goal, b: Goal): number {
  if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
    return a.sortOrder - b.sortOrder;
  }
  if (a.sortOrder !== undefined) return -1;
  if (b.sortOrder !== undefined) return 1;
  return b.createdAt - a.createdAt;
}

export default function HomeScreen() {
  const { goals, reorderGoals, refreshGoals, isLoading } = useGoals();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  // Keep the heavy grouping work off the keystroke path.
  const debouncedQuery = useDebouncedValue(searchQuery, 200);

  /**
   * Per-goal derived data that depends only on the goals array.
   *
   * Built in a single pass so renderItem never has to scan the collection.
   */
  const { completedSubgoalCountById, blockedById } = useMemo(() => {
    const completionById = new Map<number, boolean>();
    goals.forEach((goal) => completionById.set(goal.id, goal.isComplete === true));

    const completedCounts = new Map<number, number>();
    const blocked = new Set<number>();

    goals.forEach((goal) => {
      if (goal.subGoals?.length) {
        const completed = goal.subGoals.reduce(
          (count, subId) => count + (completionById.get(subId) ? 1 : 0),
          0
        );
        completedCounts.set(goal.id, completed);
      }

      if (goal.dependsOn?.length) {
        const isBlocked = goal.dependsOn.some((depId) => completionById.get(depId) !== true);
        if (isBlocked) blocked.add(goal.id);
      }
    });

    return { completedSubgoalCountById: completedCounts, blockedById: blocked };
  }, [goals]);

  const periodLabels = useMemo<Record<TimePeriod, string>>(
    () => ({
      daily: t.home.dailyGoals,
      weekly: t.home.weeklyGoals,
      monthly: t.home.monthlyGoals,
      yearly: t.home.yearlyGoals,
      custom: t.home.customGoals,
      ongoing: t.home.ongoingGoals,
    }),
    [t]
  );

  /**
   * The flat list of rows, fully resolved.
   */
  const rows = useMemo<ListRow[]>(() => {
    let parentGoals = goals.filter(
      (goal) => !goal.parentId && !goal.isArchived && isGoalActiveOnDate(goal)
    );

    // Time remaining is needed for both the status filter and the row itself,
    // so compute it once per goal here.
    const timeById = new Map<number, ReturnType<typeof calculateTimeRemaining>>();
    parentGoals.forEach((goal) => {
      timeById.set(
        goal.id,
        calculateTimeRemaining(
          goal.periodStartDate,
          goal.period,
          goal.customPeriodDays,
          goal.isRecurring
        )
      );
    });

    const query = debouncedQuery.trim().toLowerCase();
    if (query) {
      parentGoals = parentGoals.filter(
        (goal) =>
          goal.title.toLowerCase().includes(query) ||
          goal.description?.toLowerCase().includes(query) ||
          goal.unit.toLowerCase().includes(query)
      );
    }

    if (filterStatus !== 'all') {
      parentGoals = parentGoals.filter((goal) => {
        const time = timeById.get(goal.id);
        switch (filterStatus) {
          case 'active':
            return !goal.isComplete && !goal.isPaused && !time?.isExpired;
          case 'paused':
            return goal.isPaused === true;
          case 'completed':
            return goal.isComplete === true;
          case 'expired':
            return !goal.isComplete && !goal.isRecurring && time?.isExpired === true;
          default:
            return true;
        }
      });
    }

    const active = parentGoals.filter((g) => !g.isComplete);
    const completed = parentGoals.filter((g) => g.isComplete);

    // Assemble sections: ultimate goals, then one per period, then completed.
    const sections: { title: string; data: Goal[] }[] = [];

    const ultimate = active.filter((g) => g.isUltimate).sort(compareGoals);
    if (ultimate.length) {
      sections.push({ title: t.home.ultimateGoals, data: ultimate });
    }

    const byPeriod = new Map<TimePeriod, Goal[]>();
    active
      .filter((g) => !g.isUltimate)
      .forEach((goal) => {
        const bucket = byPeriod.get(goal.period);
        if (bucket) {
          bucket.push(goal);
        } else {
          byPeriod.set(goal.period, [goal]);
        }
      });

    PERIOD_ORDER.forEach((period) => {
      const bucket = byPeriod.get(period);
      if (bucket?.length) {
        sections.push({ title: periodLabels[period], data: bucket.sort(compareGoals) });
      }
    });

    if (completed.length) {
      sections.push({ title: t.home.completedGoals, data: completed.sort(compareGoals) });
    }

    // Flatten into rows, resolving everything each card needs.
    const result: ListRow[] = [];

    sections.forEach((section, sectionIndex) => {
      result.push({
        kind: 'header',
        key: `header-${sectionIndex}-${section.title}`,
        title: section.title,
        isFirst: sectionIndex === 0,
      });

      section.data.forEach((goal, indexInSection) => {
        const time = timeById.get(goal.id);
        const isExpired = time?.isExpired === true;

        const timeText = time ? formatTimeRemaining(time, t.time, goal.isRecurring) : '';
        const endDateTime = formatEndDateTime(
          goal.periodStartDate,
          goal.period,
          goal.customPeriodDays,
          language
        );

        const timeRemaining =
          !goal.isComplete && !isExpired && endDateTime
            ? `${timeText} (${t.time.endsAt}: ${endDateTime})`
            : timeText;

        // Derive urgency from the numbers rather than by substring-matching the
        // formatted string, which never worked correctly in Arabic.
        //
        // Only a goal with a live deadline can be urgent. totalMs is 0 both for
        // an expired goal and for one with no periodStartDate, and Infinity for
        // an 'ongoing' goal - none of which should read as running out of time.
        let urgency: Urgency = 'normal';
        if (goal.isComplete || goal.isRecurring || isExpired) {
          urgency = 'none';
        } else if (time && time.totalMs > 0 && Number.isFinite(time.totalMs)) {
          const hoursLeft = time.totalMs / MS_PER_HOUR;
          if (hoursLeft <= URGENCY_CRITICAL_HOURS) {
            urgency = 'critical';
          } else if (hoursLeft <= URGENCY_SOON_HOURS) {
            urgency = 'soon';
          }
        }

        result.push({
          kind: 'goal',
          key: `goal-${goal.id}`,
          goal,
          timeRemaining,
          urgency,
          isExpired,
          completedSubgoalCount: goal.isUltimate
            ? completedSubgoalCountById.get(goal.id) ?? 0
            : 0,
          isBlocked: blockedById.has(goal.id),
          canMoveUp: indexInSection > 0,
          canMoveDown: indexInSection < section.data.length - 1,
        });
      });
    });

    return result;
  }, [
    goals,
    debouncedQuery,
    filterStatus,
    t,
    language,
    periodLabels,
    completedSubgoalCountById,
    blockedById,
  ]);

  /**
   * Ordered goal ids per section, so a reorder is an O(1) lookup rather than a
   * findIndex inside renderItem.
   */
  const sectionOrderByGoalId = useMemo(() => {
    const map = new Map<number, { ids: number[]; index: number }>();
    let currentIds: number[] = [];

    rows.forEach((row) => {
      if (row.kind === 'header') {
        currentIds = [];
        return;
      }
      currentIds.push(row.goal.id);
      map.set(row.goal.id, { ids: currentIds, index: currentIds.length - 1 });
    });

    return map;
  }, [rows]);

  const handleGoalPress = useCallback(
    (id: number) => router.push(`/goal/${id}`),
    [router]
  );

  /**
   * Swap a goal with its neighbour and persist the new order.
   */
  const moveGoal = useCallback(
    (id: number, offset: -1 | 1) => {
      const entry = sectionOrderByGoalId.get(id);
      if (!entry) return;

      const target = entry.index + offset;
      if (target < 0 || target >= entry.ids.length) return;

      const reordered = [...entry.ids];
      [reordered[entry.index], reordered[target]] = [reordered[target], reordered[entry.index]];
      void reorderGoals(reordered);
    },
    [sectionOrderByGoalId, reorderGoals]
  );

  const handleMoveUp = useCallback((id: number) => moveGoal(id, -1), [moveGoal]);
  const handleMoveDown = useCallback((id: number) => moveGoal(id, 1), [moveGoal]);

  const renderItem = useCallback(
    ({ item }: { item: ListRow }) => {
      if (item.kind === 'header') {
        return (
          <View style={[styles.sectionHeader, item.isFirst && styles.firstSectionHeader]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>{item.title}</Text>
            <View style={[styles.separator, { backgroundColor: theme.colors.border }]} />
          </View>
        );
      }

      const { goal } = item;

      return (
        <GoalCard
          id={goal.id}
          title={goal.title}
          progress={goal.progress}
          points={goal.points}
          icon={goal.icon}
          subgoalCount={goal.subGoals?.length ?? 0}
          completedSubgoalCount={item.completedSubgoalCount}
          isUltimate={goal.isUltimate}
          onPress={handleGoalPress}
          timeRemaining={item.timeRemaining}
          urgency={item.urgency}
          isExpired={item.isExpired}
          isRecurring={goal.isRecurring}
          isComplete={goal.isComplete}
          isPaused={goal.isPaused}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          canMoveUp={item.canMoveUp}
          canMoveDown={item.canMoveDown}
          currentStreak={goal.currentStreak}
          isBlocked={item.isBlocked}
          schedule={goal.schedule}
        />
      );
    },
    [theme, handleGoalPress, handleMoveUp, handleMoveDown]
  );

  const keyExtractor = useCallback((item: ListRow) => item.key, []);

  /**
   * Pull to refresh re-runs the recurring-goal rollover, which is what resets
   * daily goals when the app has been left open across midnight.
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshGoals();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshGoals]);

  const listHeader = useMemo(
    () => (
      <GoalListHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterStatus={filterStatus}
        onFilterChange={setFilterStatus}
      />
    ),
    [searchQuery, filterStatus]
  );

  const listEmpty = useMemo(() => {
    // RefreshControl draws its own spinner during a pull-to-refresh, so only
    // show the inline one for the initial load.
    if (isLoading && !isRefreshing) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    return (
      <Animated.View entering={FadeIn.duration(DURATION.normal)} style={styles.stateContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          {searchQuery || filterStatus !== 'all' ? t.home.noResults : t.home.noGoals}
        </Text>
      </Animated.View>
    );
  }, [isLoading, isRefreshing, theme, t, searchQuery, filterStatus]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <FlatList
        data={rows}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={11}
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
  stateContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
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
