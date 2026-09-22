/**
 * Animation constants
 * Shared timings, easings and spring configs so motion feels consistent app-wide.
 */

import { Easing } from 'react-native-reanimated';

/**
 * Durations in milliseconds.
 *
 * Kept deliberately short - this is a utility app, not a showreel. Anything
 * above ~300ms starts to feel like lag rather than polish.
 */
export const DURATION = {
  /** Micro-feedback: press states, icon swaps. */
  instant: 120,
  /** The default for most transitions. */
  fast: 180,
  /** Progress fills, expanding sections. */
  normal: 260,
  /** Screen-level or celebratory motion. */
  slow: 400,
} as const;

/**
 * Easing curves.
 */
export const EASING = {
  /** Material standard curve - decelerates into place. Good default. */
  standard: Easing.bezier(0.2, 0, 0, 1),
} as const;

/**
 * Spring configs for gesture-driven and press feedback.
 */
export const SPRING = {
  /** Snappy, minimal overshoot - press feedback. */
  press: {
    damping: 18,
    stiffness: 320,
    mass: 0.6,
  },
  /** Softer, slightly bouncy - entrances and value changes. */
  gentle: {
    damping: 15,
    stiffness: 180,
    mass: 0.8,
  },
} as const;

/**
 * Scale applied to a card while pressed.
 */
export const PRESS_SCALE = 0.97;

/**
 * Per-item delay for staggered list entrances, in ms.
 *
 * Capped by STAGGER_MAX_ITEMS so a long list does not end up with a visible
 * multi-second cascade.
 */
export const STAGGER_STEP = 40;
export const STAGGER_MAX_ITEMS = 8;

/**
 * Compute the entrance delay for a list item at `index`.
 */
export function staggerDelay(index: number): number {
  return Math.min(index, STAGGER_MAX_ITEMS) * STAGGER_STEP;
}
