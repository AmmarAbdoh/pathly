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
}

/**
 * Goal card component with memoization for performance
 */
const GoalCard = memo<GoalCardProps>(({ title, progress, points, icon, subgoalCount = 0, isUltimate = false, onPress }) => {
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
    ],
    [theme, isUltimate]
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
});
