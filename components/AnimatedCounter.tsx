/**
 * AnimatedCounter component
 * A number that counts up to its value instead of snapping to it.
 *
 * Uses the Reanimated counter recipe: a non-editable TextInput, whose native
 * `text` prop can be driven from the UI thread. A plain <Text> has no such
 * prop, so animating one would require a setState per frame.
 */

import { DURATION, EASING } from '@/src/constants/animation';
import type { Language } from '@/src/i18n/translations';
import { formatNumber } from '@/src/utils/number-formatting';
import React, { memo, useEffect, useMemo } from 'react';
import {
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * TextInput's native `text` prop is settable from the UI thread but is absent
 * from React Native's public prop types, so widen them here.
 */
type CounterInputProps = TextInputProps & { text?: string };

const AnimatedTextInput = Animated.createAnimatedComponent(
  TextInput as unknown as React.ComponentType<CounterInputProps>
);

interface AnimatedCounterProps {
  value: number;
  style?: StyleProp<TextStyle>;
  language: Language;
  /** Decimal places to show. Defaults to 0. */
  decimals?: number;
  /** Text placed before the number, e.g. an emoji. */
  prefix?: string;
  /** Text placed after the number, e.g. '%'. */
  suffix?: string;
  duration?: number;
}

const AnimatedCounter = memo<AnimatedCounterProps>(
  ({
    value,
    style,
    language,
    decimals = 0,
    prefix = '',
    suffix = '',
    duration = DURATION.slow,
  }) => {
    const isReducedMotion = useReducedMotion();

    // Starts at zero so the first paint counts up. Initialising at `value`
    // would mean the tween only ever ran on a later change, which for a stats
    // screen is never.
    const animated = useSharedValue(0);

    useEffect(() => {
      animated.value = withTiming(value, {
        duration: isReducedMotion ? 0 : duration,
        easing: EASING.standard,
      });
    }, [value, duration, isReducedMotion, animated]);

    const animatedProps = useAnimatedProps<CounterInputProps>(() => {
      const shown =
        decimals > 0 ? animated.value.toFixed(decimals) : String(Math.round(animated.value));

      return { text: `${prefix}${shown}${suffix}` };
    });

    const finalText = useMemo(
      () => `${prefix}${formatNumber(Number(value.toFixed(decimals)), language)}${suffix}`,
      [prefix, value, decimals, language, suffix]
    );

    return (
      <AnimatedTextInput
        editable={false}
        // Silences the keyboard/selection affordances on a display-only field.
        pointerEvents="none"
        underlineColorAndroid="transparent"
        style={[styles.reset, style]}
        animatedProps={animatedProps}
        defaultValue={finalText}
        accessible
        accessibilityLabel={finalText}
      />
    );
  }
);

AnimatedCounter.displayName = 'AnimatedCounter';

export default AnimatedCounter;

const styles = StyleSheet.create({
  /**
   * Strip the platform TextInput chrome so it lays out like a <Text>.
   *
   * textAlign matters: a TextInput fills the width it is given rather than
   * shrink-wrapping, so it does not inherit a parent's `alignItems: center`
   * the way a Text does. Callers can override via the `style` prop.
   */
  reset: {
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
