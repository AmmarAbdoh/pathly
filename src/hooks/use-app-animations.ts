/**
 * Animation hooks
 * Small reusable building blocks so screens don't each reinvent press feedback.
 */

import { PRESS_SCALE, SPRING } from '@/src/constants/animation';
import { useCallback } from 'react';
import {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

/**
 * Scale-down-on-press feedback, driven entirely on the UI thread.
 *
 * No setState, so pressing a card never re-renders React - important on the
 * home list where a re-render would touch every visible row.
 */
export function usePressAnimation(scaleTo: number = PRESS_SCALE) {
  const scale = useSharedValue(1);
  const isReducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    if (isReducedMotion) return;
    scale.value = withSpring(scaleTo, SPRING.press);
  }, [scale, scaleTo, isReducedMotion]);

  const onPressOut = useCallback(() => {
    if (isReducedMotion) return;
    scale.value = withSpring(1, SPRING.press);
  }, [scale, isReducedMotion]);

  return { animatedStyle, onPressIn, onPressOut };
}
