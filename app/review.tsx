/**
 * Review screen
 * Weekly/Monthly review of goals and achievements
 */

import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { formatNumber } from '@/src/utils/number-formatting';
import {
    calculateReviewStatistics,
    getLastMonth,
    getLastWeek,
    getMotivationalMessage,
    getThisMonth,
    getThisWeek,
    ReviewPeriod,
} from '@/src/utils/review-statistics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PeriodType = 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth';

/**
 * Review screen component
 */
export default function ReviewScreen() {
  const { goals } = useGoals();
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const router = useRouter();
  
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('thisWeek');
  
  // Get the period based on selection
  const period: ReviewPeriod = useMemo(() => {
    switch (selectedPeriod) {
      case 'thisWeek':
        return getThisWeek();
      case 'lastWeek':
        return getLastWeek();
      case 'thisMonth':
        return getThisMonth();
      case 'lastMonth':
        return getLastMonth();
      default:
        return getThisWeek();
    }
  }, [selectedPeriod]);
  
  // Calculate statistics for the selected period
  const statistics = useMemo(() => {
    return calculateReviewStatistics(goals, period);
  }, [goals, period]);
  
  // Get motivational message
  const motivationalMessageKey = useMemo(() => {
    return getMotivationalMessage(statistics.completionRate);
  }, [statistics.completionRate]);
  
  const containerStyle = {
    flex: 1,
    backgroundColor: theme.colors.background,
  };
  
  const cardStyle = {
    backgroundColor: theme.colors.card,
    ...theme.shadows.small,
  };

  return (
    <SafeAreaView style={containerStyle} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              {t.common.back}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t.review.title}
          </Text>
        </View>

        {/* Period Selector */}
        <View style={[styles.card, cardStyle]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t.review.period}
          </Text>
          <View style={styles.periodButtons}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'thisWeek' && { backgroundColor: theme.colors.primary },
                selectedPeriod !== 'thisWeek' && { backgroundColor: theme.colors.border },
              ]}
              onPress={() => setSelectedPeriod('thisWeek')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'thisWeek' && styles.periodButtonTextActive,
                  selectedPeriod !== 'thisWeek' && { color: theme.colors.text },
                ]}
              >
                {t.review.thisWeek}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'lastWeek' && { backgroundColor: theme.colors.primary },
                selectedPeriod !== 'lastWeek' && { backgroundColor: theme.colors.border },
              ]}
              onPress={() => setSelectedPeriod('lastWeek')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'lastWeek' && styles.periodButtonTextActive,
                  selectedPeriod !== 'lastWeek' && { color: theme.colors.text },
                ]}
              >
                {t.review.lastWeek}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.periodButtons}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'thisMonth' && { backgroundColor: theme.colors.primary },
                selectedPeriod !== 'thisMonth' && { backgroundColor: theme.colors.border },
              ]}
              onPress={() => setSelectedPeriod('thisMonth')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'thisMonth' && styles.periodButtonTextActive,
                  selectedPeriod !== 'thisMonth' && { color: theme.colors.text },
                ]}
              >
                {t.review.thisMonth}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'lastMonth' && { backgroundColor: theme.colors.primary },
                selectedPeriod !== 'lastMonth' && { backgroundColor: theme.colors.border },
              ]}
              onPress={() => setSelectedPeriod('lastMonth')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'lastMonth' && styles.periodButtonTextActive,
                  selectedPeriod !== 'lastMonth' && { color: theme.colors.text },
                ]}
              >
                {t.review.lastMonth}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Statistics Overview */}
        <View style={[styles.card, cardStyle]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t.review.overview}
          </Text>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {formatNumber(statistics.goalsCompleted, language)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {t.review.goalsCompleted}
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="list" size={32} color="#3b82f6" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {formatNumber(statistics.totalGoals, language)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {t.review.totalGoals}
              </Text>
            </View>
          </View>
          
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="trending-up" size={32} color="#8b5cf6" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {formatNumber(Math.round(statistics.completionRate), language)}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {t.review.completionRate}
              </Text>
            </View>
            
            <View style={[styles.statCard, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="star" size={32} color="#f59e0b" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>
                {formatNumber(statistics.pointsEarned, language)}
              </Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                {t.review.pointsEarned}
              </Text>
            </View>
          </View>
        </View>

        {/* Motivational Message */}
        <View style={[styles.motivationalCard, cardStyle]}>
          <Text style={[styles.motivationalText, { color: theme.colors.text }]}>
            {motivationalMessageKey === 'excellentWork' && t.review.excellentWork}
            {motivationalMessageKey === 'goodProgress' && t.review.goodProgress}
            {motivationalMessageKey === 'keepGoing' && t.review.keepGoing}
            {motivationalMessageKey === 'startWorking' && t.review.startWorking}
          </Text>
        </View>

        {/* Completed Goals List */}
        <View style={[styles.card, cardStyle]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t.review.completedGoals}
          </Text>
          
          {statistics.completedGoalsList.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t.review.noCompletedGoals}
            </Text>
          ) : (
            <View style={styles.goalsList}>
              {statistics.completedGoalsList.map((goal) => {
                const completedDate = new Date(goal.completedAt!);
                const formattedDate = completedDate.toLocaleDateString(
                  language === 'ar' ? 'ar-SA' : 'en-US',
                  { month: 'short', day: 'numeric' }
                );
                
                return (
                  <View
                    key={goal.id}
                    style={[styles.goalItem, { backgroundColor: theme.colors.background }]}
                  >
                    <View style={styles.goalHeader}>
                      <Text style={{ fontSize: 24, marginRight: 12 }}>
                        {goal.icon || '🎯'}
                      </Text>
                      <View style={styles.goalInfo}>
                        <Text style={[styles.goalTitle, { color: theme.colors.text }]}>
                          {goal.title}
                        </Text>
                        <Text style={[styles.goalDate, { color: theme.colors.textSecondary }]}>
                          {formattedDate} • {formatNumber(goal.points, language)} pts
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
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
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  periodButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  motivationalCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  motivationalText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 26,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  goalDate: {
    fontSize: 13,
  },
});
