/**
 * GoalCard component
 * Displays a single goal with its progress
 */

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProgressBar from './ProgressBar';

interface GoalCardProps {
  title: string;
  progress: number;
  points: number;
  icon?: string;
  subgoalCount?: number;
  isUltimate?: boolean;
  onPress?: () => void;
  timeRemaining?: string; // Formatted time remaining string
  isExpired?: boolean; // Whether the goal period has expired
  isRecurring?: boolean; // Whether the goal is recurring
  isComplete?: boolean; // Whether the goal is completed
}

/**
 * Goal card component with memoization for performance
 */
const GoalCard = memo<GoalCardProps>(({ title, progress, points, icon, subgoalCount = 0, isUltimate = false, onPress, timeRemaining, isExpired = false, isRecurring = false, isComplete = false }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Memoize computed values
  const percent = useMemo(() => Math.round(progress), [progress]);
  
  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        backgroundColor: theme.colors.card,
        ...theme.shadows.small,
      },
      isUltimate && {
        borderWidth: 2,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      isExpired && !isRecurring && {
        borderWidth: 2,
        borderColor: theme.colors.danger,
        opacity: 0.85,
      },
      isComplete && {
        borderWidth: 2,
        borderColor: '#22c55e',
        opacity: 0.9,
      },
    ],
    [theme, isUltimate, isExpired, isRecurring, isComplete]
  );

  return (
    <TouchableOpacity
      style={cardStyle}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${title} goal, ${percent}% complete, ${points} points`}
      accessibilityHint="Tap to view and edit goal details"
    >
      {/* Ultimate Badge */}
      {isUltimate && (
        <View style={styles.ultimateBadge}>
          <Text style={styles.ultimateBadgeText}>{t.goalCard.ultimate}</Text>
        </View>
      )}
      
      {/* Completed Badge */}
      {isComplete && (
        <View style={[styles.completedBadge, { backgroundColor: '#22c55e' }]}>
          <Text style={styles.completedBadgeText}>✓ {t.goalCard.completed || 'Completed'}</Text>
        </View>
      )}
      
      {/* Expired Badge */}
      {isExpired && !isRecurring && !isComplete && (
        <View style={[styles.expiredBadge, { backgroundColor: theme.colors.danger }]}>
          <Text style={styles.expiredBadgeText}>⚠️ {t.time.expired}</Text>
        </View>
      )}
      
      <View style={styles.headerRow}>
        {icon && (
          <Text style={styles.iconText}>{icon}</Text>
        )}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: theme.colors.text }, isUltimate && styles.ultimateTitle]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <Text
            style={[styles.points, { color: theme.colors.textSecondary }]}
            accessibilityLabel={`${points} reward points`}
          >
            {points} {t.goalCard.points}
            {subgoalCount > 0 && ` • ${subgoalCount} ${t.goalCard.subgoals}`}
          </Text>
          {timeRemaining && (
            <View style={styles.timeRemainingContainer}>
              <Text style={styles.timeRemainingIcon}>
                {isRecurring ? '🔄' : '⏱️'}
              </Text>
              <Text
                style={[
                  styles.timeRemainingText,
                  {
                    color: isExpired && !isRecurring
                      ? theme.colors.danger
                      : timeRemaining.toLowerCase().includes('day') || timeRemaining.includes('يوم') || timeRemaining.includes('أيام')
                      ? theme.colors.textSecondary
                      : timeRemaining.toLowerCase().includes('hour') || timeRemaining.includes('ساعة') || timeRemaining.includes('ساعات')
                      ? '#f59e0b'
                      : '#ef4444',
                  },
                ]}
              >
                {timeRemaining}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.percent, { color: theme.colors.primary }]}
          accessibilityLabel={`${percent} percent complete`}
        >
          {percent}%
        </Text>
      </View>
      <ProgressBar progress={progress} />
    </TouchableOpacity>
  );
});

GoalCard.displayName = 'GoalCard';

export default GoalCard;

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  ultimateBadge: {
    position: 'absolute',
    top: -6,
    right: 12,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  ultimateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  completedBadge: {
    position: 'absolute',
    top: -6,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  completedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  ultimateTitle: {
    fontWeight: '700',
  },
  iconText: {
    fontSize: 32,
    marginRight: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  points: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  percent: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
  expiredBadge: {
    position: 'absolute',
    top: -6,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  expiredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  timeRemainingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
  },
  timeRemainingIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  timeRemainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
