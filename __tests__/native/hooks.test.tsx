/**
 * Tests for the shared hooks in src/hooks.
 */

import { act, renderHook } from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { PRESS_SCALE, SPRING } from '@/src/constants/animation';
import { usePressAnimation } from '@/src/hooks/use-app-animations';
import { useBackOrHome } from '@/src/hooks/use-back-or-home';
import { useDebouncedValue } from '@/src/hooks/use-debounced-value';

const mockRouter = {
  back: jest.fn(),
  replace: jest.fn(),
  push: jest.fn(),
  canGoBack: jest.fn(() => true),
};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
}));

describe('useDebouncedValue', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 200));
    expect(result.current).toBe('a');
  });

  it('only updates once the value has been stable for the delay', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebouncedValue(value, 200), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => jest.advanceTimersByTime(150));
    expect(result.current).toBe('a');

    act(() => jest.advanceTimersByTime(60));
    expect(result.current).toBe('ab');
  });

  it('restarts the wait on every change, so a burst lands once, with the last value', () => {
    const { result, rerender } = renderHook(({ value }: { value: string }) => useDebouncedValue(value, 200), {
      initialProps: { value: 'r' },
    });

    for (const value of ['re', 'rea', 'read']) {
      rerender({ value });
      act(() => jest.advanceTimersByTime(150));
    }
    expect(result.current).toBe('r');

    act(() => jest.advanceTimersByTime(200));
    expect(result.current).toBe('read');
  });

  it('defaults to a 200ms delay', () => {
    const { result, rerender } = renderHook(({ value }: { value: number }) => useDebouncedValue(value), {
      initialProps: { value: 1 },
    });
    rerender({ value: 2 });
    act(() => jest.advanceTimersByTime(199));
    expect(result.current).toBe(1);
    act(() => jest.advanceTimersByTime(1));
    expect(result.current).toBe(2);
  });
});

describe('useBackOrHome', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pops the stack when there is somewhere to go back to', () => {
    mockRouter.canGoBack.mockReturnValue(true);
    const { result } = renderHook(() => useBackOrHome());

    result.current();

    expect(mockRouter.back).toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('goes home instead of stranding the user when opened by deep link', () => {
    mockRouter.canGoBack.mockReturnValue(false);
    const { result } = renderHook(() => useBackOrHome());

    result.current();

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)/home');
  });

  it('returns a stable callback across renders', () => {
    const { result, rerender } = renderHook(() => useBackOrHome());
    const first = result.current;
    rerender({});
    expect(result.current).toBe(first);
  });
});

describe('usePressAnimation', () => {
  /*
   * Reanimated's jest mock recreates shared values on every render and never
   * re-renders when one changes, so the resulting style cannot be observed.
   * Assert on what the hook asks Reanimated to animate to instead.
   */
  let spring: jest.SpyInstance;

  beforeEach(() => {
    spring = jest.spyOn(Reanimated, 'withSpring');
  });

  afterEach(() => {
    spring.mockRestore();
  });

  it('starts at full size', () => {
    const { result } = renderHook(() => usePressAnimation());
    expect(result.current.animatedStyle).toEqual({ transform: [{ scale: 1 }] });
  });

  it('springs down to the given scale on press-in and back to 1 on press-out', () => {
    const { result } = renderHook(() => usePressAnimation(0.9));

    act(() => result.current.onPressIn());
    act(() => result.current.onPressOut());

    expect(spring.mock.calls.map(([to, config]) => [to, config])).toEqual([
      [0.9, SPRING.press],
      [1, SPRING.press],
    ]);
  });

  it('defaults to the shared press scale', () => {
    const { result } = renderHook(() => usePressAnimation());
    act(() => result.current.onPressIn());
    expect(spring).toHaveBeenCalledWith(PRESS_SCALE, SPRING.press);
  });

  it('does not animate at all when the OS asks for reduced motion', () => {
    const reduced = jest.spyOn(Reanimated, 'useReducedMotion').mockReturnValue(true);
    const { result } = renderHook(() => usePressAnimation(0.9));

    act(() => result.current.onPressIn());
    act(() => result.current.onPressOut());

    expect(spring).not.toHaveBeenCalled();
    reduced.mockRestore();
  });
});
