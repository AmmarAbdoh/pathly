/**
 * GoalCard component
 * Displays a single goal with its progress.
 *
 * Takes the goal's `id` and id-taking callbacks rather than pre-bound closures.
 * That keeps every prop referentially stable across parent renders, so the
 * memo() below actually holds and scrolling the home list stays at 60fps.
 */

import { DURATION } from '@/src/constants/animation';
import { useLanguage } from '@/src/context/LanguageContext';
import { usePressAnimation } from '@/src/hooks/use-app-animations';
import { GoalSchedule } from '@/src/types';
import { useTheme } from '@/src/context/ThemeContext';
import { getScheduleDescription, isEveryDaySchedule } from '@/src/utils/goal-scheduling';
import { formatNumber } from '@/src/utils/number-formatting';
import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import ProgressBar from './ProgressBar';

/** Status accent colors, shared between the card border and its badge. */
const STATUS_COLORS = {
  ultimate: '#FFD700',
  complete: '#22c55e',
  paused: '#f59e0b',
  blocked: '#fbbf24',
} as const;

interface GoalCardProps {
  id: number;
  title: string;
  progress: number;
  points: number;
  icon?: string;
  subgoalCount?: number;
  completedSubgoalCount?: number;
  isUltimate?: boolean;
  /** Receives the goal id, so the parent can pass one stable function. */
  onPress?: (id: number) => void;
  timeRemaining?: string;
  /** Drives the time-remaining color; computed by the parent, not parsed from text. */
  urgency?: 'none' | 'normal' | 'soon' | 'critical';
  isExpired?: boolean;
  isRecurring?: boolean;
  isComplete?: boolean;
  isPaused?: boolean;
  onMoveUp?: (id: number) => void;
  onMoveDown?: (id: number) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  currentStreak?: number;
  isBlocked?: boolean;
  schedule?: GoalSchedule;
}

const GoalCard = memo<GoalCardProps>(
  ({
    id,
    title,
    progress,
    points,
    icon,
    subgoalCount = 0,
    completedSubgoalCount = 0,
    isUltimate = false,
    onPress,
    timeRemaining,
    urgency = 'normal',
    isExpired = false,
    isRecurring = false,
    isComplete = false,
    isPaused = false,
    onMoveUp,
    onMoveDown,
    canMoveUp = false,
    canMoveDown = false,
    currentStreak = 0,
    isBlocked = false,
    schedule,
  }) => {
    const { theme } = useTheme();
    const { t, language } = useLanguage();
    const { animatedStyle, onPressIn, onPressOut } = usePressAnimation();

    const percent = Math.round(progress);

    const formatted = useMemo(
      () => ({
        percent: formatNumber(percent, language),
        points: formatNumber(points, language),
        subgoals: formatNumber(subgoalCount, language),
        completedSubgoals: formatNumber(completedSubgoalCount, language),
        streak: formatNumber(currentStreak, language),
      }),
      [percent, points, subgoalCount, completedSubgoalCount, currentStreak, language]
    );

    const scheduleText = useMemo(
      () => (isEveryDaySchedule(schedule) ? null : getScheduleDescription(schedule, t.schedule)),
      [schedule, t.schedule]
    );

    /**
     * Which status border the card wears. Only one applies, in priority order.
     */
    const statusBorder = useMemo(() => {
      if (isComplete) {
        return { borderWidth: 2, borderColor: STATUS_COLORS.complete, opacity: 0.9 };
      }
      if (isPaused) {
        return { borderWidth: 2, borderColor: STATUS_COLORS.paused, opacity: 0.75 };
      }
      if (isBlocked) {
        return { borderWidth: 2, borderColor: STATUS_COLORS.blocked, opacity: 0.7 };
      }
      if (isExpired && !isRecurring) {
        return { borderWidth: 2, borderColor: theme.colors.danger, opacity: 0.85 };
      }
      if (isUltimate) {
        return {
          borderWidth: 2,
          borderColor: STATUS_COLORS.ultimate,
          shadowColor: STATUS_COLORS.ultimate,
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        };
      }
      return null;
    }, [isComplete, isPaused, isBlocked, isExpired, isRecurring, isUltimate, theme]);

    const cardStyle = useMemo(
      () => [
        styles.card,
        { backgroundColor: theme.colors.card, ...theme.shadows.small },
        statusBorder,
      ],
      [theme, statusBorder]
    );

    const timeRemainingColor = useMemo(() => {
      if (isExpired && !isRecurring) return theme.colors.danger;
      if (urgency === 'critical') return '#ef4444';
      if (urgency === 'soon') return '#f59e0b';
      return theme.colors.textSecondary;
    }, [isExpired, isRecurring, urgency, theme]);

    const handlePress = useCallback(() => onPress?.(id), [onPress, id]);
    const handleMoveUp = useCallback(() => onMoveUp?.(id), [onMoveUp, id]);
    const handleMoveDown = useCallback(() => onMoveDown?.(id), [onMoveDown, id]);

    // No `entering` animation: this card lives in a virtualized list, so a row
    // scrolled out and back in would remount and replay it, which reads as
    // flicker rather than polish.
    return (
      <Animated.View style={animatedStyle}>
        <Pressable
            style={cardStyle}
            onPress={handlePress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            accessibilityRole="button"
            accessibilityLabel={`${title} goal, ${percent}% complete, ${points} points`}
            accessibilityHint={t.goalCard.openHint}
          >
            {isUltimate && !isComplete && (
              <View style={[styles.badge, styles.badgeRight, { backgroundColor: STATUS_COLORS.ultimate }]}>
                <Text style={[styles.badgeText, styles.badgeTextDark]}>{t.goalCard.ultimate}</Text>
              </View>
            )}

            {isComplete && (
              <View style={[styles.badge, styles.badgeRight, { backgroundColor: STATUS_COLORS.complete }]}>
                <Text style={styles.badgeText}>✓ {t.goalCard.completed}</Text>
              </View>
            )}

            {isExpired && !isRecurring && !isComplete && (
              <View style={[styles.badge, styles.badgeLeft, { backgroundColor: theme.colors.danger }]}>
                <Text style={styles.badgeText}>⚠️ {t.time.expired}</Text>
              </View>
            )}

            {isPaused && !isComplete && (
              <View style={[styles.badge, styles.badgeLeft, { backgroundColor: STATUS_COLORS.paused }]}>
                <Text style={styles.badgeText}>⏸️ {t.goalCard.paused}</Text>
              </View>
            )}

            {isBlocked && !isComplete && (
              <View style={[styles.badge, styles.badgeLeft, { backgroundColor: STATUS_COLORS.blocked }]}>
                <Text style={[styles.badgeText, styles.badgeTextAmber]}>🔒 {t.goalCard.blocked}</Text>
              </View>
            )}

            <View style={styles.headerRow}>
              {/* Ternary, not `&&`: an empty-string icon would otherwise render
                  the bare string '' into a View, which throws on native. */}
              {icon ? <Text style={styles.iconText}>{icon}</Text> : null}

              <View style={styles.titleContainer}>
                <Text
                  style={[
                    styles.title,
                    { color: theme.colors.text },
                    isUltimate && styles.ultimateTitle,
                  ]}
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {title}
                </Text>

                <Text style={[styles.points, { color: theme.colors.textSecondary }]}>
                  {points > 0 && `${formatted.points} ${t.goalCard.points}`}
                  {points > 0 && subgoalCount > 0 && ' • '}
                  {subgoalCount > 0 && isUltimate && (
                    <Text
                      style={{
                        color:
                          completedSubgoalCount === subgoalCount
                            ? STATUS_COLORS.complete
                            : theme.colors.textSecondary,
                      }}
                    >
                      {`${formatted.completedSubgoals}/${formatted.subgoals} ${t.goalCard.subgoals}`}
                    </Text>
                  )}
                  {subgoalCount > 0 && !isUltimate && `${formatted.subgoals} ${t.goalCard.subgoals}`}
                </Text>

                {timeRemaining ? (
                  <View style={styles.pillRow}>
                    <Text style={styles.pillIcon}>{isRecurring ? '🔄' : '⏱️'}</Text>
                    <Text style={[styles.pillText, { color: timeRemainingColor }]}>
                      {timeRemaining}
                    </Text>
                  </View>
                ) : null}

                {isRecurring && currentStreak > 0 && (
                  <View style={[styles.pill, { backgroundColor: `${STATUS_COLORS.blocked}20` }]}>
                    <Text style={styles.pillIcon}>🔥</Text>
                    <Text style={[styles.pillText, { color: STATUS_COLORS.paused }]}>
                      {formatted.streak} {t.goalCard.weekStreak}
                    </Text>
                  </View>
                )}

                {scheduleText ? (
                  <View style={[styles.pill, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Text style={styles.pillIcon}>📅</Text>
                    <Text style={[styles.pillText, { color: theme.colors.primary }]}>
                      {scheduleText}
                    </Text>
                  </View>
                ) : null}
              </View>

              {(onMoveUp || onMoveDown) && (
                <View style={styles.reorderButtons}>
                  {onMoveUp && (
                    <Pressable
                      onPress={handleMoveUp}
                      style={[styles.reorderButton, !canMoveUp && styles.reorderButtonDisabled]}
                      disabled={!canMoveUp}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={t.goalCard.moveUp}
                    >
                      <Text
                        style={[
                          styles.reorderButtonText,
                          !canMoveUp && styles.reorderButtonTextDisabled,
                        ]}
                      >
                        ▲
                      </Text>
                    </Pressable>
                  )}
                  {onMoveDown && (
                    <Pressable
                      onPress={handleMoveDown}
                      style={[styles.reorderButton, !canMoveDown && styles.reorderButtonDisabled]}
                      disabled={!canMoveDown}
                      hitSlop={6}
                      accessibilityRole="button"
                      accessibilityLabel={t.goalCard.moveDown}
                    >
                      <Text
                        style={[
                          styles.reorderButtonText,
                          !canMoveDown && styles.reorderButtonTextDisabled,
                        ]}
                      >
                        ▼
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}

              <Text
                style={[styles.percent, { color: theme.colors.primary }]}
                accessibilityLabel={`${percent} percent complete`}
              >
                {formatted.percent}%
              </Text>
            </View>

          <ProgressBar progress={progress} animationDuration={DURATION.normal} />
        </Pressable>
      </Animated.View>
    );
  }
);

GoalCard.displayName = 'GoalCard';

export default GoalCard;

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  badge: {
    position: 'absolute',
    top: -6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  badgeRight: {
    right: 12,
  },
  badgeLeft: {
    left: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  badgeTextDark: {
    color: '#1a1a1a',
  },
  badgeTextAmber: {
    color: '#78350f',
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
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  pillIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
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
