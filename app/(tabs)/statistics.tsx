/**
 * Statistics screen
 * Display user progress, achievements, and motivational content
 */

import ProgressBar from '@/components/ProgressBar';
import { getAchievements, getRandomQuote } from '@/src/constants/achievements';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useRewards } from '@/src/context/RewardsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { calculateStatistics, getAchievementProgress } from '@/src/utils/statistics';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Statistics screen component
 */
export default function StatisticsScreen() {
  const { goals } = useGoals();
  const { rewards } = useRewards();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(getRandomQuote(language));

  const stats = useMemo(() => calculateStatistics(goals, rewards), [goals, rewards]);
  const ACHIEVEMENTS = useMemo(() => getAchievements(language), [language]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setCurrentQuote(getRandomQuote(language));
    setTimeout(() => setRefreshing(false), 500);
  }, [language]);

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: theme.colors.background }],
    [theme]
  );

  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        backgroundColor: theme.colors.card,
        ...theme.shadows.small,
      },
    ],
    [theme]
  );

  const unlockedAchievements = ACHIEVEMENTS.filter(a =>
    stats.achievementsUnlocked.includes(a.id)
  );

  const lockedAchievements = ACHIEVEMENTS.filter(
    a => !stats.achievementsUnlocked.includes(a.id)
  );

  return (
    <SafeAreaView style={containerStyle} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t.statistics.yourProgress}
          </Text>
        </View>

        {/* Motivational Quote */}
        <View style={[cardStyle, styles.quoteCard]}>
          <Ionicons name="bulb-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.quote, { color: theme.colors.text }]}>
            {currentQuote}
          </Text>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[cardStyle, styles.statCard]}>
            <Text style={[styles.statNumber, { color: theme.colors.primary }]}>
              {stats.totalGoals}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t.statistics.totalGoals}
            </Text>
          </View>

          <View style={[cardStyle, styles.statCard]}>
            <Text style={[styles.statNumber, { color: '#22c55e' }]}>
              {stats.completedGoals}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t.statistics.completedGoals}
            </Text>
          </View>

          <View style={[cardStyle, styles.statCard]}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
              {stats.totalPoints}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t.statistics.totalPoints}
            </Text>
          </View>

          <View style={[cardStyle, styles.statCard]}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>
              🔥 {stats.currentStreak}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              {t.statistics.currentStreak}
            </Text>
          </View>
        </View>

        {/* Completion Rate */}
        <View style={cardStyle}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t.statistics.completionRate}
            </Text>
            <Text style={[styles.percentage, { color: theme.colors.primary }]}>
              {stats.completionRate.toFixed(1)}%
            </Text>
          </View>
          <ProgressBar progress={stats.completionRate} />
          <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>
            {stats.completedGoals} {t.messages.goalsCompleted.replace('{total}', stats.totalGoals.toString())}
          </Text>
        </View>

        {/* Streak Information */}
        <View style={cardStyle}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t.statistics.streakStats}
          </Text>
          <View style={styles.streakRow}>
            <View style={styles.streakItem}>
              <Text style={[styles.streakNumber, { color: theme.colors.text }]}>
                {stats.currentStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
                {t.statistics.current}
              </Text>
            </View>
            <View style={styles.streakDivider} />
            <View style={styles.streakItem}>
              <Text style={[styles.streakNumber, { color: theme.colors.text }]}>
                {stats.longestStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
                {t.statistics.best}
              </Text>
            </View>
          </View>
          {stats.currentStreak > 0 && (
            <Text style={[styles.encouragement, { color: theme.colors.primary }]}>
              {t.statistics.keepItUp}
            </Text>
          )}
        </View>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <View style={cardStyle}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t.statistics.achievements} ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </Text>
            <View style={styles.achievementsGrid}>
              {unlockedAchievements.map(achievement => (
                <View key={achievement.id} style={styles.achievementItem}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={[styles.achievementTitle, { color: theme.colors.text }]}>
                    {achievement.title}
                  </Text>
                  <Text style={[styles.achievementDesc, { color: theme.colors.textSecondary }]}>
                    {achievement.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <View style={cardStyle}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t.statistics.lockedAchievements}
            </Text>
            <View style={styles.achievementsGrid}>
              {lockedAchievements.slice(0, 6).map(achievement => {
                const progress = getAchievementProgress(achievement.id, stats);
                return (
                  <View key={achievement.id} style={[styles.achievementItem, styles.lockedAchievement]}>
                    <Text style={styles.achievementIconLocked}>
                      {achievement.icon}
                    </Text>
                    <Text style={[styles.achievementTitle, { color: theme.colors.textSecondary }]}>
                      {achievement.title}
                    </Text>
                    <Text style={[styles.achievementDesc, { color: theme.colors.textSecondary, fontSize: 10 }]}>
                      {achievement.description}
                    </Text>
                    <View style={styles.progressContainer}>
                      <ProgressBar progress={progress} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
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
    maxWidth: Platform.OS === 'web' ? 1200 : undefined,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  quoteCard: {
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  quote: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 150 : 160,
    maxWidth: Platform.OS === 'web' ? 200 : '48%',
    padding: 20,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  percentage: {
    fontSize: 24,
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  streakItem: {
    flex: 1,
    alignItems: 'center',
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
  },
  encouragement: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    flex: 1,
    minWidth: Platform.OS === 'web' ? 180 : 150,
    maxWidth: Platform.OS === 'web' ? 250 : '48%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    alignItems: 'center',
  },
  lockedAchievement: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  achievementIconLocked: {
    fontSize: 40,
    marginBottom: 8,
    opacity: 0.4,
  },
  achievementTitle: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  progressContainer: {
    width: '100%',
    marginTop: 8,
  },
});
