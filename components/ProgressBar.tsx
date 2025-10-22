/**
 * ProgressBar component
 * Visual progress indicator for goals
 */

import { useTheme } from '@/src/context/ThemeContext';
import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  progress: number;
}

/**
 * Progress bar component with memoization
 */
const ProgressBar = memo<ProgressBarProps>(({ progress }) => {
  const { theme } = useTheme();

  // Convert progress from 0-100 to 0-1 and clamp
  const clampedProgress = useMemo(() => {
    const normalized = progress / 100;
    return Math.max(0, Math.min(1, normalized));
  }, [progress]);

  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: theme.colors.border }],
    [theme]
  );

  const fillStyle = useMemo(
    () => ({
      ...styles.fill,
      width: `${clampedProgress * 100}%` as const,
      backgroundColor: theme.colors.primary,
    }),
    [clampedProgress, theme]
  );

  return (
    <View
      style={containerStyle}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: clampedProgress * 100,
      }}
    >
      <View style={fillStyle} />
    </View>
  );
});

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});
