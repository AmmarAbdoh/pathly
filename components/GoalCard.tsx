/**
 * GoalCard component
 * Displays a single goal with its progress
 */

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { GoalSchedule } from '@/src/types';
import { getScheduleDescription } from '@/src/utils/goal-scheduling';
import { formatNumber } from '@/src/utils/number-formatting';
import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProgressBar from './ProgressBar';

interface GoalCardProps {
  title: string;
  progress: number;
  points: number;
  icon?: string;
  subgoalCount?: number;
  completedSubgoalCount?: number; // Number of completed subgoals
  isUltimate?: boolean;
  onPress?: () => void;
  timeRemaining?: string; // Formatted time remaining string
  isExpired?: boolean; // Whether the goal period has expired
  isRecurring?: boolean; // Whether the goal is recurring
  isComplete?: boolean; // Whether the goal is completed
  isPaused?: boolean; // Whether the goal is paused
  onMoveUp?: () => void; // Callback to move goal up in the list
  onMoveDown?: () => void; // Callback to move goal down in the list
  canMoveUp?: boolean; // Whether the goal can be moved up
  canMoveDown?: boolean; // Whether the goal can be moved down
  currentStreak?: number; // Current streak for recurring goals
  isBlocked?: boolean; // Whether the goal is blocked by dependencies
  schedule?: GoalSchedule; // Goal schedule configuration
}

/**
 * Goal card component with memoization for performance
 */
const GoalCard = memo<GoalCardProps>(({ title, progress, points, icon, subgoalCount = 0, completedSubgoalCount = 0, isUltimate = false, onPress, timeRemaining, isExpired = false, isRecurring = false, isComplete = false, isPaused = false, onMoveUp, onMoveDown, canMoveUp = false, canMoveDown = false, currentStreak = 0, isBlocked = false, schedule }) => {
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  // Memoize computed values
  const percent = useMemo(() => Math.round(progress), [progress]);
  const formattedPercent = useMemo(() => formatNumber(percent, language), [percent, language]);
  const formattedPoints = useMemo(() => formatNumber(points, language), [points, language]);
  const formattedSubgoalCount = useMemo(() => formatNumber(subgoalCount, language), [subgoalCount, language]);
  const formattedCompletedSubgoalCount = useMemo(() => formatNumber(completedSubgoalCount, language), [completedSubgoalCount, language]);
  const scheduleText = useMemo(() => schedule ? getScheduleDescription(schedule) : null, [schedule]);
  
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
      isPaused && {
        borderWidth: 2,
        borderColor: '#f59e0b',
        opacity: 0.75,
      },
      isBlocked && {
        borderWidth: 2,
        borderColor: '#fbbf24',
        opacity: 0.7,
      },
    ],
    [theme, isUltimate, isExpired, isRecurring, isComplete, isPaused, isBlocked]
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
      
      {/* Paused Badge */}
      {isPaused && !isComplete && (
        <View style={[styles.pausedBadge, { backgroundColor: '#f59e0b' }]}>
          <Text style={styles.pausedBadgeText}>⏸️ Paused</Text>
        </View>
      )}
      
      {/* Blocked Badge */}
      {isBlocked && !isComplete && (
        <View style={[styles.blockedBadge, { backgroundColor: '#fbbf24' }]}>
          <Text style={styles.blockedBadgeText}>🔒 Blocked</Text>
        </View>
      )}
      
      <View style={styles.headerRow}>
        {icon && (
          <Text style={styles.iconText}>{icon}</Text>
        )}
        <View style={styles.titleContainer}>
          <Text
            style={[styles.title, { color: theme.colors.text }, isUltimate && styles.ultimateTitle]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
          <Text
            style={[styles.points, { color: theme.colors.textSecondary }]}
            accessibilityLabel={points > 0 ? `${points} reward points` : undefined}
          >
            {points > 0 && `${formattedPoints} ${t.goalCard.points}`}
            {points > 0 && (subgoalCount > 0 || (subgoalCount > 0 && !isUltimate)) && ' • '}
            {subgoalCount > 0 && isUltimate && (
              <Text style={{ color: completedSubgoalCount === subgoalCount ? '#22c55e' : theme.colors.textSecondary }}>
                {`${formattedCompletedSubgoalCount}/${formattedSubgoalCount} ${t.goalCard.subgoals}`}
              </Text>
            )}
            {subgoalCount > 0 && !isUltimate && `${formattedSubgoalCount} ${t.goalCard.subgoals}`}
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
          {isRecurring && currentStreak > 0 && (
            <View style={[styles.streakContainer, { backgroundColor: '#fbbf24' + '20' }]}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={[styles.streakText, { color: '#f59e0b' }]}>
                {formatNumber(currentStreak, language)} {t.goalCard.weekStreak}
              </Text>
            </View>
          )}
          {scheduleText && scheduleText !== 'Every day' && (
            <View style={[styles.scheduleContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Text style={styles.scheduleIcon}>📅</Text>
              <Text style={[styles.scheduleText, { color: theme.colors.primary }]}>
                {scheduleText}
              </Text>
            </View>
          )}
        </View>
        
        {/* Reorder Buttons */}
        {(onMoveUp || onMoveDown) && (
          <View style={styles.reorderButtons}>
            {onMoveUp && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onMoveUp();
                }}
                style={[styles.reorderButton, !canMoveUp && styles.reorderButtonDisabled]}
                disabled={!canMoveUp}
                accessibilityLabel="Move goal up"
              >
                <Text style={[styles.reorderButtonText, !canMoveUp && styles.reorderButtonTextDisabled]}>
                  ▲
                </Text>
              </TouchableOpacity>
            )}
            {onMoveDown && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onMoveDown();
                }}
                style={[styles.reorderButton, !canMoveDown && styles.reorderButtonDisabled]}
                disabled={!canMoveDown}
                accessibilityLabel="Move goal down"
              >
                <Text style={[styles.reorderButtonText, !canMoveDown && styles.reorderButtonTextDisabled]}>
                  ▼
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <Text
          style={[styles.percent, { color: theme.colors.primary }]}
          accessibilityLabel={`${percent} percent complete`}
        >
          {formattedPercent}%
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
    marginBottom: 2,
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
  pausedBadge: {
    position: 'absolute',
    top: -6,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  pausedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  blockedBadge: {
    position: 'absolute',
    top: -6,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  blockedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350f',
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
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  streakIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '700',
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  scheduleIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  reorderButtons: {
    flexDirection: 'column',
    marginRight: 8,
    gap: 2,
  },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonDisabled: {
    backgroundColor: 'rgba(200, 200, 200, 0.1)',
  },
  reorderButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
  },
  reorderButtonTextDisabled: {
    color: '#999',
  },
});
