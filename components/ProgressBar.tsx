/**
 * ProgressBar component
 * Visual progress indicator for goals.
 *
 * The fill animates on the UI thread via Reanimated, so a progress change
 * costs no React renders and stays smooth even while a list is scrolling.
 */

import { DURATION, EASING } from '@/src/constants/animation';
import { useTheme } from '@/src/context/ThemeContext';
import React, { memo, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ProgressBarProps {
  /** Progress as a percentage, 0-100. Values outside the range are clamped. */
  progress: number;
  /** Override the fill duration. Pass 0 to snap without animating. */
  animationDuration?: number;
  /** Bar thickness in points. */
  height?: number;
}

const ProgressBar = memo<ProgressBarProps>(
  ({ progress, animationDuration = DURATION.normal, height = 8 }) => {
    const { theme } = useTheme();
    const isReducedMotion = useReducedMotion();

    const clamped = Math.max(0, Math.min(100, progress));
    const width = useSharedValue(clamped);

    useEffect(() => {
      const duration = isReducedMotion ? 0 : animationDuration;
      width.value = withTiming(clamped, { duration, easing: EASING.standard });
    }, [clamped, animationDuration, isReducedMotion, width]);

    const fillStyle = useAnimatedStyle(() => ({
      width: `${width.value}%`,
    }));

    const containerStyle = useMemo(
      () => [styles.container, { backgroundColor: theme.colors.border, height }],
      [theme, height]
    );

    const fillColorStyle = useMemo(
      () => [styles.fill, { backgroundColor: theme.colors.primary }],
      [theme]
    );

    return (
      <View
        style={containerStyle}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
      >
        <Animated.View style={[fillColorStyle, fillStyle]} />
      </View>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 8,
  },
});
