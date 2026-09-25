/**
 * AnimatedCounter: the number a stats counter shows while it counts up.
 */

import AnimatedCounter from '@/components/AnimatedCounter';
import { render, screen } from '@testing-library/react-native';
import React from 'react';

/** The text the animation writes - what is on screen once it has run. */
function animatedText() {
  const input = screen.UNSAFE_getByProps({ editable: false });
  return input.props.animatedProps.text as string;
}

describe('AnimatedCounter', () => {
  // Regression: the animation wrote Western digits over the formatted value,
  // so every Stats counter ended in them in Arabic.
  it('counts in Arabic-Indic digits in Arabic', () => {
    render(<AnimatedCounter value={405} language="ar" prefix="🔥 " />);

    expect(animatedText()).toBe('🔥 ٠');
  });

  it('counts in Western digits in English', () => {
    render(<AnimatedCounter value={405} language="en" suffix="%" />);

    expect(animatedText()).toBe('0%');
  });
});
