/**
 * Tests for the shared animation tokens.
 */

import {
  DURATION,
  PRESS_SCALE,
  SPRING,
  STAGGER_MAX_ITEMS,
  STAGGER_STEP,
  staggerDelay,
} from '@/src/constants/animation';

describe('staggerDelay', () => {
  it('starts at zero for the first item', () => {
    expect(staggerDelay(0)).toBe(0);
  });

  it('steps by STAGGER_STEP per item', () => {
    expect(staggerDelay(3)).toBe(3 * STAGGER_STEP);
  });

  it('caps the delay so long lists do not cascade for seconds', () => {
    const cap = STAGGER_MAX_ITEMS * STAGGER_STEP;
    expect(staggerDelay(STAGGER_MAX_ITEMS)).toBe(cap);
    expect(staggerDelay(500)).toBe(cap);
  });
});

describe('animation tokens', () => {
  it('keeps durations ordered from fastest to slowest', () => {
    expect(DURATION.instant).toBeLessThan(DURATION.fast);
    expect(DURATION.fast).toBeLessThan(DURATION.normal);
    expect(DURATION.normal).toBeLessThan(DURATION.slow);
  });

  it('keeps every duration short enough to read as feedback, not lag', () => {
    for (const ms of Object.values(DURATION)) {
      expect(ms).toBeLessThanOrEqual(400);
    }
  });

  it('scales a pressed card down, but only slightly', () => {
    expect(PRESS_SCALE).toBeGreaterThan(0.9);
    expect(PRESS_SCALE).toBeLessThan(1);
  });

  it('makes press feedback stiffer than the gentle spring', () => {
    expect(SPRING.press.stiffness).toBeGreaterThan(SPRING.gentle.stiffness);
  });
});
