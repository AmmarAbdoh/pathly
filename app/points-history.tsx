/**
 * Points history screen
 * Every point earned (the ledger) and spent (redeemed rewards), newest first.
 */

import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useRewards } from '@/src/context/RewardsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useBackOrHome } from '@/src/hooks/use-back-or-home';
import { formatNumber } from '@/src/utils/number-formatting';
import { buildPointsHistory, type PointsHistoryRow } from '@/src/utils/points-ledger';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICONS: Record<PointsHistoryRow['kind'], string> = {
  earned: '🎯',
  bonus: '✨',
  spent: '🎁',
  carried: '📦',
};

// The Rewards screen's colors for points earned and spent.
const EARNED_COLOR = '#10b981';

interface HistoryItem {
  key: string;
  kind: PointsHistoryRow['kind'];
  title: string;
  date: string;
  amount: string;
  label: string;
}

export default function PointsHistoryScreen() {
  const { pointsLedger } = useGoals();
  const { rewards } = useRewards();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const handleBack = useBackOrHome();

  // Everything a row shows, worked out once rather than on every scroll frame.
  const items = useMemo<HistoryItem[]>(() => {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    return buildPointsHistory(pointsLedger, rewards).map((row) => {
      const goalTitle = row.title || t.pointsHistory.completedGoal;
      const title =
        row.kind === 'carried'
          ? t.pointsHistory.carried
          : row.kind === 'bonus' && row.bonus
            ? `${t.pointsHistory.bonus[row.bonus]} · ${goalTitle}`
            : goalTitle;
      const date =
        row.at > 0
          ? new Date(row.at).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
          : '';
      const amount = `${row.points > 0 ? '+' : '−'}${formatNumber(Math.abs(row.points), language)}`;
      return {
        key: row.key,
        kind: row.kind,
        title,
        date,
        amount,
        label: [title, `${amount} ${t.goalCard.points}`, date]
          .filter(Boolean)
          .join(t.goalCard.a11ySeparator),
      };
    });
  }, [pointsLedger, rewards, t, language]);

  const renderItem = useCallback(
    ({ item }: { item: HistoryItem }) => (
      <View
        style={[styles.row, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        accessible
        accessibilityLabel={item.label}
      >
        <Text style={styles.icon}>{ICONS[item.kind]}</Text>
        <View style={styles.rowText}>
          <Text style={[styles.rowTitle, { color: theme.colors.text }]} numberOfLines={2}>
            {item.title}
          </Text>
          {item.date ? (
            <Text style={[styles.rowDate, { color: theme.colors.textSecondary }]}>{item.date}</Text>
          ) : null}
        </View>
        <Text
          style={[
            styles.amount,
            { color: item.kind === 'spent' ? theme.colors.danger : EARNED_COLOR },
          ]}
        >
          {item.amount}
        </Text>
      </View>
    ),
    [theme]
  );

  const keyExtractor = useCallback((item: HistoryItem) => item.key, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={t.common.back}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
              <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
                {t.common.back}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>{t.pointsHistory.title}</Text>
            <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
              {t.pointsHistory.bonusHint}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.empty, { color: theme.colors.textSecondary }]}>
            {t.pointsHistory.empty}
          </Text>
        }
        removeClippedSubviews
        initialNumToRender={15}
        maxToRenderPerBatch={15}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 10,
  },
  header: {
    marginBottom: 14,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  icon: {
    fontSize: 24,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowDate: {
    fontSize: 13,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  empty: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});
