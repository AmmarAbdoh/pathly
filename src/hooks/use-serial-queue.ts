/**
 * useSerialQueue
 * Returns a function that runs async tasks one at a time, in the order given.
 *
 * A task that rejects rejects for its own caller only; the next still runs.
 * Both contexts need one: changes that overlapped each started from the same
 * data, and the first to finish was lost to - or undone by - the last.
 */

import { useCallback, useRef } from 'react';

export type SerialQueue = <T>(task: () => Promise<T>) => Promise<T>;

export function useSerialQueue(): SerialQueue {
  const tail = useRef<Promise<unknown>>(Promise.resolve());

  return useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = tail.current.then(task);
    tail.current = run.catch(() => undefined);
    return run;
  }, []);
}
