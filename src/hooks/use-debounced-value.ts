/**
 * useDebouncedValue
 * Returns a copy of `value` that only updates after it has been stable for `delay` ms.
 *
 * Used to keep expensive derived work (filtering / sorting the goal list) off the
 * keystroke path, so typing stays at 60fps regardless of how many goals exist.
 */

import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (value === debounced) {
      return;
    }

    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
    // `debounced` is intentionally excluded: including it would restart the
    // timer every time the debounced value lands, causing an extra render loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);

  return debounced;
}
