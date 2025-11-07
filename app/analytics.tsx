/**
 * Analytics screen
 * Shows detailed insights and analytics about goal performance
 */

import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { generateAnalyticsInsights, getInsightsSummary } from '@/src/utils/analytics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AnalyticsScreen() {
  const { goals } = useGoals();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const router = useRouter();

  // Generate analytics insights
  const analytics = useMemo(() => generateAnalyticsInsights(goals), [goals]);
  const insights = useMemo(() => getInsightsSummary(analytics), [analytics]);

  // Get category names
  const getCategoryName = (category: string): string => {
    const categoryKey = category as keyof typeof t.templates.categories;
    return t.templates.categories[categoryKey] || category;
  };

  // Get period names
  const getPeriodName = (period: string): string => {
    const periodMap: { [key: string]: string } = {
      daily: t.goalForm.periodDaily,
      weekly: t.goalForm.periodWeekly,
      monthly: t.goalForm.periodMonthly,
      yearly: t.goalForm.periodYearly,
      custom: t.goalForm.periodCustom,
      ongoing: t.goalForm.periodOngoing,
    };
    return periodMap[period] || period;
  };

  const containerStyle = [styles.container, { backgroundColor: theme.colors.background }];
  const cardStyle = [
    styles.card,
    {
      backgroundColor: theme.colors.card,
      ...theme.shadows.small,
    },
  ];

  return (
    <SafeAreaView style={containerStyle} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t.common.back}
          >
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={28}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              📊 {t.analytics.title}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {t.analytics.subtitle}
            </Text>
          </View>
        </View>

        {/* Check if we have data */}
        {analytics.completedGoalsAnalyzed === 0 ? (
          <View style={cardStyle}>
            <Text style={[styles.emptyIcon, { color: theme.colors.textSecondary }]}>
              📈
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t.analytics.startCompletingGoals}
            </Text>
          </View>
        ) : (
          <>
            {/* Insights Summary */}
            <View style={cardStyle}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                💡 {t.analytics.insights}
              </Text>
              <View style={styles.insightsList}>
                {insights.map((insight, index) => (
                  <View key={index} style={[styles.insightItem, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.insightText, { color: theme.colors.text }]}>
                      {insight}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Overview Stats */}
            <View style={cardStyle}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                📈 {t.analytics.overview}
              </Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {analytics.totalGoalsAnalyzed}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    {t.analytics.goals}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: '#10b981' }]}>
                    {analytics.completedGoalsAnalyzed}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    {t.statistics.completedGoals}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                    {analytics.overallCompletionRate.toFixed(0)}%
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    {t.analytics.rate}
                  </Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                    {Math.round(analytics.averageCompletionTime)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                    {analytics.averageCompletionTime === 1 ? t.analytics.day : t.analytics.days}
                  </Text>
                </View>
              </View>
            </View>

            {/* Category Performance */}
            {analytics.categoryPerformance.length > 0 && (
              <View style={cardStyle}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  🎯 {t.analytics.categoryPerformance}
                </Text>
                <View style={styles.performanceList}>
                  {analytics.categoryPerformance.map((category) => (
                    <View
                      key={category.category}
                      style={[styles.performanceItem, { borderBottomColor: theme.colors.border }]}
                    >
                      <View style={styles.performanceHeader}>
                        <Text style={[styles.performanceName, { color: theme.colors.text }]}>
                          {getCategoryName(category.category)}
                        </Text>
                        <Text style={[styles.performanceRate, { color: theme.colors.primary }]}>
                          {category.completionRate.toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.performanceStats}>
                        <Text style={[styles.performanceDetail, { color: theme.colors.textSecondary }]}>
                          {category.completedGoals}/{category.totalGoals} {t.analytics.goals}
                        </Text>
                        <Text style={[styles.performanceDetail, { color: theme.colors.textSecondary }]}>
                          {category.totalPoints} {t.analytics.points}
                        </Text>
                      </View>
                      {/* Progress bar */}
                      <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${category.completionRate}%`,
                              backgroundColor: theme.colors.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Period Performance */}
            {analytics.periodPerformance.length > 0 && (
              <View style={cardStyle}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                  ⏰ {t.analytics.periodPerformance}
                </Text>
                <View style={styles.performanceList}>
                  {analytics.periodPerformance.map((period) => (
                    <View
                      key={period.period}
                      style={[styles.performanceItem, { borderBottomColor: theme.colors.border }]}
                    >
                      <View style={styles.performanceHeader}>
                        <Text style={[styles.performanceName, { color: theme.colors.text }]}>
                          {getPeriodName(period.period)}
                        </Text>
                        <Text style={[styles.performanceRate, { color: theme.colors.primary }]}>
                          {period.completionRate.toFixed(0)}%
                        </Text>
                      </View>
                      <View style={styles.performanceStats}>
                        <Text style={[styles.performanceDetail, { color: theme.colors.textSecondary }]}>
                          {period.completedGoals}/{period.totalGoals} {t.analytics.goals}
                        </Text>
                        {period.averageCompletionTime !== undefined && (
                          <Text style={[styles.performanceDetail, { color: theme.colors.textSecondary }]}>
                            ~{Math.round(period.averageCompletionTime)} {t.analytics.days}
                          </Text>
                        )}
                      </View>
                      {/* Progress bar */}
                      <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${period.completionRate}%`,
                              backgroundColor: theme.colors.primary,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Time of Day Analysis */}
            <View style={cardStyle}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                🕐 {t.analytics.timeOfDay}
              </Text>
              <View style={styles.timeOfDayGrid}>
                <View style={[styles.timeOfDayItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={styles.timeOfDayIcon}>🌅</Text>
                  <Text style={[styles.timeOfDayLabel, { color: theme.colors.text }]}>
                    {t.analytics.morning}
                  </Text>
                  <Text style={[styles.timeOfDayValue, { color: theme.colors.primary }]}>
                    {analytics.completionsByTimeOfDay.morning}
                  </Text>
                </View>
                <View style={[styles.timeOfDayItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={styles.timeOfDayIcon}>☀️</Text>
                  <Text style={[styles.timeOfDayLabel, { color: theme.colors.text }]}>
                    {t.analytics.afternoon}
                  </Text>
                  <Text style={[styles.timeOfDayValue, { color: theme.colors.primary }]}>
                    {analytics.completionsByTimeOfDay.afternoon}
                  </Text>
                </View>
                <View style={[styles.timeOfDayItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={styles.timeOfDayIcon}>🌆</Text>
                  <Text style={[styles.timeOfDayLabel, { color: theme.colors.text }]}>
                    {t.analytics.evening}
                  </Text>
                  <Text style={[styles.timeOfDayValue, { color: theme.colors.primary }]}>
                    {analytics.completionsByTimeOfDay.evening}
                  </Text>
                </View>
                <View style={[styles.timeOfDayItem, { backgroundColor: theme.colors.background }]}>
                  <Text style={styles.timeOfDayIcon}>🌙</Text>
                  <Text style={[styles.timeOfDayLabel, { color: theme.colors.text }]}>
                    {t.analytics.night}
                  </Text>
                  <Text style={[styles.timeOfDayValue, { color: theme.colors.primary }]}>
                    {analytics.completionsByTimeOfDay.night}
                  </Text>
                </View>
              </View>
            </View>

            {/* Key Insights */}
            <View style={cardStyle}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                🔑 {t.analytics.insights}
              </Text>
              <View style={styles.keyInsightsList}>
                {analytics.bestPerformingCategory && (
                  <View style={[styles.keyInsightItem, { backgroundColor: theme.colors.background }]}>
                    <Text style={styles.keyInsightIcon}>⭐</Text>
                    <View style={styles.keyInsightContent}>
                      <Text style={[styles.keyInsightLabel, { color: theme.colors.textSecondary }]}>
                        {t.analytics.bestCategory}
                      </Text>
                      <Text style={[styles.keyInsightValue, { color: theme.colors.text }]}>
                        {getCategoryName(analytics.bestPerformingCategory)}
                      </Text>
                    </View>
                  </View>
                )}
                {analytics.bestCompletionDay !== 'No data' && (
                  <View style={[styles.keyInsightItem, { backgroundColor: theme.colors.background }]}>
                    <Text style={styles.keyInsightIcon}>📅</Text>
                    <View style={styles.keyInsightContent}>
                      <Text style={[styles.keyInsightLabel, { color: theme.colors.textSecondary }]}>
                        {t.analytics.bestDay}
                      </Text>
                      <Text style={[styles.keyInsightValue, { color: theme.colors.text }]}>
                        {analytics.bestCompletionDay}
                      </Text>
                    </View>
                  </View>
                )}
                {analytics.mostProductiveHour !== 'No data' && (
                  <View style={[styles.keyInsightItem, { backgroundColor: theme.colors.background }]}>
                    <Text style={styles.keyInsightIcon}>⏰</Text>
                    <View style={styles.keyInsightContent}>
                      <Text style={[styles.keyInsightLabel, { color: theme.colors.textSecondary }]}>
                        {t.analytics.mostProductiveHour}
                      </Text>
                      <Text style={[styles.keyInsightValue, { color: theme.colors.text }]}>
                        {analytics.mostProductiveHour}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  emptyIcon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  insightText: {
    fontSize: 15,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  performanceList: {
    gap: 16,
  },
  performanceItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  performanceRate: {
    fontSize: 18,
    fontWeight: '700',
  },
  performanceStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  performanceDetail: {
    fontSize: 13,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeOfDayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeOfDayItem: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  timeOfDayIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  timeOfDayLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeOfDayValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  keyInsightsList: {
    gap: 12,
  },
  keyInsightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 14,
  },
  keyInsightIcon: {
    fontSize: 28,
  },
  keyInsightContent: {
    flex: 1,
  },
  keyInsightLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  keyInsightValue: {
    fontSize: 17,
    fontWeight: '700',
  },
});
