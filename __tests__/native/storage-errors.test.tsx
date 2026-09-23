/**
 * Storage failures: surfaced to the user, retried, and never allowed to
 * overwrite real data.
 */

import StorageErrorBanner from '@/components/StorageErrorBanner';
import { REWARDS_KEY, STORAGE_KEYS } from '@/src/constants/storage-keys';
import { GoalsProvider, useGoals } from '@/src/context/GoalsContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { RewardsProvider } from '@/src/context/RewardsContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { translations } from '@/src/i18n/translations';
import type { Goal } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const SAVE_DEBOUNCE_MS = 400;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const disk = new Error('disk full');

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;

const makeGoal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: 1,
    title: 'Read',
    target: 10,
    current: 0,
    initialValue: 0,
    unit: 'x',
    progress: 0,
    points: 50,
    direction: 'increase',
    period: 'ongoing',
    periodStartDate: Date.now(),
    createdAt: Date.now(),
    subGoals: [],
    isComplete: false,
    completionHistory: [],
    ...overrides,
  }) as Goal;

async function seed(goals: Goal[], lifetime = 0) {
  await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, String(lifetime));
}

const storedGoals = async (): Promise<Goal[]> =>
  JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.GOALS)) ?? '[]');

async function renderGoals() {
  const view = renderHook(() => useGoals(), {
    wrapper: ({ children }) => <GoalsProvider>{children}</GoalsProvider>,
  });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

/** The storage mock's real behaviour, restored after every test. */
const realGetItem = getItem.getMockImplementation()!;
const realSetItem = setItem.getMockImplementation()!;

/**
 * Fail the next read of `key` - by default the goals list, which makes the
 * load fail.
 *
 * Keyed rather than a one-shot `mockRejectedValueOnce`: other providers
 * (language, theme) also read storage on mount, and would consume it first.
 */
function failNextLoad(key: string = STORAGE_KEYS.GOALS) {
  let armed = true;
  getItem.mockImplementation(async (readKey: string) => {
    if (armed && readKey === key) {
      armed = false;
      throw disk;
    }
    return realGetItem(readKey);
  });
}

/** Fail every write of `key` until `recover()` is called. */
function failWrites(key: string) {
  let failing = true;
  setItem.mockImplementation(async (writeKey: string, value: string) => {
    if (failing && writeKey === key) throw disk;
    return realSetItem(writeKey, value);
  });
  return {
    recover: () => {
      failing = false;
    },
  };
}

let consoleError: jest.SpyInstance;

beforeEach(async () => {
  await AsyncStorage.clear();
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  getItem.mockImplementation(realGetItem);
  setItem.mockImplementation(realSetItem);
});

/**
 * Hold the next storage call for `key` open until `release()`, keeping
 * AsyncStorage's order: calls made meanwhile run after it, as on a device.
 */
function holdNext(mock: jest.Mock, real: (...args: never[]) => Promise<unknown>, key: string) {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let chain: Promise<unknown> = Promise.resolve();
  let held = false;
  mock.mockImplementation((...args: [string, string?]) => {
    const hold = !held && args[0] === key;
    if (hold) held = true;
    const run = chain.then(async () => {
      if (hold) await gate;
      return (real as (...a: unknown[]) => Promise<unknown>)(...args);
    });
    chain = run.catch(() => undefined);
    return run;
  });
  return { release };
}

/** The handler GoalsProvider registers for app-state changes. */
function captureAppState() {
  let onChange!: (state: string) => void;
  (AppState.addEventListener as jest.Mock).mockImplementationOnce((_, handler) => {
    onChange = handler;
    return { remove: jest.fn() };
  });
  return (state: string) => onChange(state);
}

describe('refreshing', () => {
  // Regression: refresh re-read storage and put what it read over memory. A
  // change made while the read was in flight vanished - and a completion
  // reverted that way could pay out twice.
  it('keeps a change made while it runs', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    const read = holdNext(getItem, realGetItem, STORAGE_KEYS.GOALS);

    let refreshing!: Promise<void>;
    await act(async () => {
      refreshing = result.current.refreshGoals();
      await result.current.updateGoal(1, 4);
    });
    read.release();
    await act(async () => {
      await refreshing;
    });

    expect(result.current.goals[0].current).toBe(4);
  });

  it('still rolls over a period that ended while the app was open', async () => {
    const now = Date.now();
    await seed([
      makeGoal({ period: 'daily', isRecurring: true, periodStartDate: now, current: 10, isComplete: true, completedAt: now }),
    ]);
    const { result } = await renderGoals();
    const later = jest.spyOn(Date, 'now').mockReturnValue(now + 2 * 24 * 60 * 60 * 1000);

    try {
      await act(async () => {
        await result.current.refreshGoals();
      });
    } finally {
      later.mockRestore();
    }

    expect(result.current.goals[0]).toMatchObject({ isComplete: false, current: 0 });
    expect(result.current.goals[0].completionHistory).toHaveLength(1);
  });
});

describe('failed saves', () => {
  // Regression: a failed write was logged and dropped - nothing told the user,
  // and the change never reached disk.
  it('reports the failure and keeps the data queued for a retry', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    setItem.mockRejectedValueOnce(disk);

    await act(async () => {
      await result.current.updateGoal(1, 6);
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect(result.current.storageError).toBe('save');
    expect((await storedGoals())[0].current).toBe(0);

    await act(async () => {
      await result.current.retryStorage();
    });

    expect((await storedGoals())[0].current).toBe(6);
    expect(result.current.storageError).toBeNull();
  });

  it('retries on its own with the next save', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    setItem.mockRejectedValueOnce(disk);

    await act(async () => {
      await result.current.updateGoal(1, 3);
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });
    expect(result.current.storageError).toBe('save');

    await act(async () => {
      await result.current.updateGoal(1, 4);
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect((await storedGoals())[0].current).toBe(4);
    expect(result.current.storageError).toBeNull();
  });

  it('reports and retries a failed lifetime-points write', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    // The goal save is debounced, so the first write here is lifetime points.
    setItem.mockRejectedValueOnce(disk);
    await act(async () => {
      await result.current.updateGoal(1, 10);
    });

    expect(result.current.storageError).toBe('save');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('0');

    await act(async () => {
      await result.current.retryStorage();
    });

    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('50');
    expect(result.current.storageError).toBeNull();
  });

  // Regression: refresh flushed, and when that flush failed it reloaded
  // anyway - putting the older goals from disk over the unsaved ones and
  // dropping them from the retry queue. With points written separately (and
  // never taken back), finishing the reverted goal again paid out twice.
  it('keeps unsaved changes when refreshed while saves are failing', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    const storage = failWrites(STORAGE_KEYS.GOALS);

    await act(async () => {
      await result.current.finishGoal(1); // +50, written now; the goal is queued
    });
    await act(async () => {
      await result.current.refreshGoals();
    });

    expect(result.current.goals[0].isComplete).toBe(true);
    expect(result.current.storageError).toBe('save');

    await act(async () => {
      await result.current.finishGoal(1);
    });
    expect(result.current.lifetimePointsEarned).toBe(50);

    storage.recover();
    await act(async () => {
      await result.current.retryStorage();
    });
    expect((await storedGoals())[0].isComplete).toBe(true);
    expect(result.current.storageError).toBeNull();
  });

  // Regression: the import cleared the queue before its own write, so when
  // that write failed the user's unsaved edits were no longer queued at all.
  it('keeps unsaved edits queued when an import cannot be written', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    const storage = failWrites(STORAGE_KEYS.GOALS);

    await act(async () => {
      await result.current.updateGoal(1, 6);
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });
    await act(async () => {
      await expect(
        result.current.replaceAllGoals([makeGoal({ id: 9, title: 'Imported' })], 0)
      ).rejects.toThrow();
    });

    storage.recover();
    await act(async () => {
      await result.current.retryStorage();
    });
    expect(await storedGoals()).toEqual([expect.objectContaining({ id: 1, current: 6 })]);
  });

  // Regression: the banner kept saying changes were unsaved after an import
  // had replaced them, with nothing left to retry.
  it('clears a failed-save report once an import replaces what was unsaved', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    const storage = failWrites(STORAGE_KEYS.GOALS);
    await act(async () => {
      await result.current.updateGoal(1, 6);
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });
    expect(result.current.storageError).toBe('save');

    storage.recover();
    await act(async () => {
      await result.current.replaceAllGoals([makeGoal({ id: 9, title: 'Imported' })], 0);
    });

    expect(result.current.storageError).toBeNull();
  });

  // Regression: unsaved edits stayed queued while the import was written, so
  // a flush meanwhile (the app going to the background) wrote them after it -
  // and the import silently vanished.
  it('does not let a save made during an import land on top of it', async () => {
    const background = captureAppState();
    await seed([makeGoal({ id: 1, title: 'Old' })]);
    const { result } = await renderGoals();
    await act(async () => {
      await result.current.updateGoal(1, 5); // queued, inside the debounce
    });
    const write = holdNext(setItem, realSetItem, STORAGE_KEYS.GOALS);

    let importing!: Promise<void>;
    await act(async () => {
      importing = result.current.replaceAllGoals([makeGoal({ id: 9, title: 'Imported' })], 0);
      background('background');
      // An edit while it is written is based on the goals being replaced.
      await result.current.updateGoal(1, 7);
    });
    write.release();
    await act(async () => {
      await importing;
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect((await storedGoals()).map((g) => g.title)).toEqual(['Imported']);
    expect(result.current.goals.map((g) => g.title)).toEqual(['Imported']);
  });

  // Regression: memory kept the old goals until the reload at the end of an
  // import. A change in that time was built on them, and a flush then wrote
  // them back over the import.
  it('does not let a change made while an import finishes bring back the old goals', async () => {
    const background = captureAppState();
    await seed([makeGoal({ id: 1, title: 'Old' })]);
    const { result } = await renderGoals();
    const lifetimeWrite = holdNext(setItem, realSetItem, STORAGE_KEYS.LIFETIME_POINTS);

    let importing!: Promise<void>;
    await act(async () => {
      importing = result.current.replaceAllGoals([makeGoal({ id: 1, title: 'Imported' })], 0);
      await sleep(50); // the goals are written; the total is held
      await result.current.updateGoal(1, 7);
      background('background');
    });
    lifetimeWrite.release();
    await act(async () => {
      await importing;
    });

    expect((await storedGoals()).map((g) => g.title)).toEqual(['Imported']);
    expect(result.current.goals.map((g) => g.title)).toEqual(['Imported']);
  });

  // Regression: after writing the import it was read back from storage, which
  // threw away any change made while the reminders were cancelled and the
  // total written.
  it('keeps a change made while an import finishes', async () => {
    await seed([makeGoal({ id: 1, title: 'Old' })]);
    const { result } = await renderGoals();
    const lifetimeWrite = holdNext(setItem, realSetItem, STORAGE_KEYS.LIFETIME_POINTS);

    let importing!: Promise<void>;
    await act(async () => {
      importing = result.current.replaceAllGoals([makeGoal({ id: 1, title: 'Imported' })], 0);
      await sleep(50); // the goals are written; the total is held
      await result.current.updateGoal(1, 7);
    });
    lifetimeWrite.release();
    await act(async () => {
      await importing;
    });

    expect(result.current.goals[0]).toMatchObject({ title: 'Imported', current: 7 });
  });

  // Regression: when the import could not be written, the queue got back what
  // it held - by then the older copy a failed save had put back - and the
  // retry wrote that over the edits made since.
  it('re-queues the newest goals when an import cannot be written', async () => {
    const background = captureAppState();
    await seed([makeGoal({ id: 1 })]);
    const { result } = await renderGoals();
    let failing = true;
    const write = holdNext(
      setItem,
      async (key: string, value: string) => {
        if (failing && key === STORAGE_KEYS.GOALS) throw disk;
        return realSetItem(key, value);
      },
      STORAGE_KEYS.GOALS
    );

    await act(async () => {
      await result.current.updateGoal(1, 1);
      background('background'); // that save starts, and is held
      await result.current.updateGoal(1, 2); // queued behind it
    });
    let importing!: Promise<void>;
    await act(async () => {
      importing = result.current.replaceAllGoals([makeGoal({ id: 9, title: 'Imported' })], 0);
    });
    write.release(); // the save fails, then the import
    await act(async () => {
      await expect(importing).rejects.toThrow();
    });

    failing = false;
    await act(async () => {
      await result.current.retryStorage();
    });
    expect((await storedGoals()).map((g) => g.current)).toEqual([2]);
  });

  // Regression: while storage keeps failing, a reload read the old total back
  // from disk over the unsaved in-memory one, and the next successful write
  // then persisted the stale value.
  it('does not roll back unsaved points when refreshed while storage is still failing', async () => {
    await seed([makeGoal()], 5);
    const { result } = await renderGoals();

    // Every lifetime-points write fails until the disk "recovers". Keyed on the
    // storage key: a one-shot rejection gets consumed by whichever write
    // happens to come first (here, the goals write during refresh's flush).
    let lifetimeWritesFail = true;
    setItem.mockImplementation(async (key: string, value: string) => {
      if (lifetimeWritesFail && key === STORAGE_KEYS.LIFETIME_POINTS) {
        throw disk;
      }
      return realSetItem(key, value);
    });

    await act(async () => {
      await result.current.updateGoal(1, 10); // +50
    });
    await act(async () => {
      await result.current.refreshGoals();
    });
    expect(result.current.lifetimePointsEarned).toBe(55);

    lifetimeWritesFail = false;
    await act(async () => {
      await result.current.retryStorage();
    });
    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('55');
  });

  it('can be dismissed', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    setItem.mockRejectedValueOnce(disk);
    await act(async () => {
      await result.current.updateGoal(1, 10);
    });

    act(() => result.current.dismissStorageError());

    expect(result.current.storageError).toBeNull();
  });
});

describe('failed loads', () => {
  // Regression: the storage helper caught a failed read itself and returned
  // [], so the provider saw "no goals" - and the next save wrote a list with
  // only the new goal over every stored one.
  it('reports the failure', async () => {
    await seed([makeGoal()]);
    failNextLoad();

    const { result } = await renderGoals();

    expect(result.current.storageError).toBe('load');
  });

  it('treats a failed lifetime-points read as a failed load too', async () => {
    await seed([makeGoal()]);
    failNextLoad(STORAGE_KEYS.LIFETIME_POINTS);

    const { result } = await renderGoals();

    expect(result.current.storageError).toBe('load');
  });

  // Regression: corrupt goals failed every load - every launch, every Retry -
  // and every edit was held and lost, with no way out but clearing the app's
  // data. They are kept aside instead, and the app starts over.
  it('keeps unreadable goals aside and starts over, rather than blocking for good', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, '{corrupt');
    await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, '120');
    const { result } = await renderGoals();

    expect(result.current.storageError).toBeNull();
    expect(result.current.dataSetAside).toBe(true);
    expect(result.current.lifetimePointsEarned).toBe(120);

    await act(async () => {
      await result.current.addGoal('New', 10, 0, 'x', 'increase', 1, 'daily');
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect((await storedGoals()).map((g) => g.title)).toEqual(['New']);
    const keys = await AsyncStorage.getAllKeys();
    const aside = keys.find((key) => key.startsWith(`${STORAGE_KEYS.GOALS}.unreadable.`))!;
    expect(await AsyncStorage.getItem(aside)).toBe('{corrupt');
  });

  // Regression: they were kept aside - removed - before the lifetime total was
  // read. When that read failed, Retry found no goals, and nothing said why.
  it('says unreadable goals were kept aside, even when a later read failed first', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, '{corrupt');
    failNextLoad(STORAGE_KEYS.LIFETIME_POINTS);
    const { result } = await renderGoals();
    expect(result.current.storageError).toBe('load');

    await act(async () => {
      await result.current.retryStorage();
    });

    expect(result.current.storageError).toBeNull();
    expect(result.current.dataSetAside).toBe(true);
    const keys = await AsyncStorage.getAllKeys();
    expect(keys.filter((key) => key.startsWith(`${STORAGE_KEYS.GOALS}.unreadable.`))).toHaveLength(1);
  });

  it('stays blocked if unreadable goals cannot even be kept aside', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, '{corrupt');
    setItem.mockImplementation(async (key: string, value: string) => {
      if (key.includes('.unreadable.')) throw disk;
      return realSetItem(key, value);
    });

    const { result } = await renderGoals();

    expect(result.current.storageError).toBe('load');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.GOALS)).toBe('{corrupt');
  });

  // Regression: moving the rollover out of the load's try/catch meant one
  // malformed goal made the load reject: the screen spun forever, and writes
  // were not blocked.
  it('loads the other goals when one cannot be processed', async () => {
    await seed([
      makeGoal({ id: 1, title: 'Fine' }),
      makeGoal({
        id: 2,
        title: 'Malformed',
        isRecurring: true,
        period: 'daily',
        completionHistory: { not: 'a list' } as unknown as number[],
      }),
    ]);

    const { result } = await renderGoals();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.storageError).toBeNull();
    expect(result.current.goals.map((g) => g.title)).toEqual(['Fine', 'Malformed']);
  });

  // Regression: only a failed load was guarded. An import started before the
  // first load finished merged into the empty list and wrote over every goal.
  it('refuses to hand out goals, or replace them, before they have loaded', async () => {
    await seed([makeGoal({ title: 'Keep me' })]);
    const read = holdNext(getItem, realGetItem, STORAGE_KEYS.GOALS);
    const { result } = renderHook(() => useGoals(), {
      wrapper: ({ children }) => <GoalsProvider>{children}</GoalsProvider>,
    });

    expect(() => result.current.getCurrentGoals()).toThrow();
    await act(async () => {
      await expect(result.current.replaceAllGoals([makeGoal({ title: 'Imported' })], 0)).rejects.toThrow();
    });

    read.release();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect((await storedGoals()).map((g) => g.title)).toEqual(['Keep me']);
    expect(result.current.getCurrentGoals().goals.map((g) => g.title)).toEqual(['Keep me']);
  });

  // Regression: lifetime points were written straight through, counting up
  // from 0 rather than the user's real total - which was then gone for good.
  it('never writes lifetime points earned after a failed load', async () => {
    await seed([makeGoal()], 5000);
    failNextLoad();
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addGoal('New', 10, 0, 'x', 'increase', 10, 'daily');
    });
    const [added] = result.current.goals;
    await act(async () => {
      await result.current.finishGoal(added.id);
    });

    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('5000');
    expect(result.current.storageError).toBe('load');

    await act(async () => {
      await result.current.retryStorage();
    });
    expect(result.current.lifetimePointsEarned).toBe(5000);
  });

  // Regression: a Merge after a failed load merged into an empty list and
  // wrote the result over the user's real goals.
  it('refuses an import until the goals have loaded', async () => {
    await seed([makeGoal({ title: 'Keep me' })], 30);
    failNextLoad();
    const { result } = await renderGoals();

    await act(async () => {
      await expect(
        result.current.replaceAllGoals([makeGoal({ id: 9, title: 'Imported' })], 99)
      ).rejects.toThrow();
    });

    expect((await storedGoals()).map((g) => g.title)).toEqual(['Keep me']);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('30');
  });

  // Regression: closing the banner cleared the error, and nothing raised it
  // again - every later change was held in memory and silently lost.
  it('raises the error again when a change is made after it was dismissed', async () => {
    await seed([makeGoal()]);
    failNextLoad();
    const { result } = await renderGoals();

    act(() => result.current.dismissStorageError());
    expect(result.current.storageError).toBeNull();

    await act(async () => {
      await result.current.updateGoal(1, 3);
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect(result.current.storageError).toBe('load');
  });

  // The in-memory goals after a failed load are not the user's data. Saving
  // them would replace everything on disk with whatever was edited since.
  it('never writes over stored data until a reload succeeds', async () => {
    const stored = [makeGoal({ id: 1, title: 'Keep me' }), makeGoal({ id: 2, title: 'And me' })];
    await seed(stored);
    failNextLoad();
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addGoal('New', 10, 0, 'x', 'increase', 1, 'daily');
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect((await storedGoals()).map((g) => g.title)).toEqual(['Keep me', 'And me']);
  });

  it('drops edits made while loading had failed, even if Retry comes before they would save', async () => {
    await seed([makeGoal({ id: 1, title: 'Keep me' })]);
    failNextLoad();
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addGoal('Made blind', 10, 0, 'x', 'increase', 1, 'daily');
      await result.current.retryStorage(); // within the save debounce
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect(result.current.goals.map((g) => g.title)).toEqual(['Keep me']);
    expect((await storedGoals()).map((g) => g.title)).toEqual(['Keep me']);
  });

  // Regression: a failed period-rollover write inside the load was treated as
  // a failed load. Goals that had been read fine were hidden, and saving was
  // blocked.
  it('shows goals whose rollover could not be written, and saves it on retry', async () => {
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    await seed([
      makeGoal({
        period: 'daily',
        isRecurring: true,
        periodStartDate: twoDaysAgo,
        current: 10,
        isComplete: true,
        completedAt: twoDaysAgo,
      }),
    ]);
    const storage = failWrites(STORAGE_KEYS.GOALS);

    const { result } = await renderGoals();

    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0].isComplete).toBe(false);
    expect(result.current.storageError).toBe('save');

    storage.recover();
    await act(async () => {
      await result.current.retryStorage();
    });
    expect((await storedGoals())[0].isComplete).toBe(false);
    expect(result.current.storageError).toBeNull();
  });

  it('keeps a first-time lifetime total that could not be written, and saves it on retry', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.GOALS,
      JSON.stringify([makeGoal({ isComplete: true, current: 10, progress: 100 })])
    );
    const storage = failWrites(STORAGE_KEYS.LIFETIME_POINTS);

    const { result } = await renderGoals();

    expect(result.current.lifetimePointsEarned).toBe(50);
    expect(result.current.storageError).toBe('save');

    storage.recover();
    await act(async () => {
      await result.current.retryStorage();
    });
    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('50');
  });

  it('derives the total again when the stored one is unreadable', async () => {
    await seed([makeGoal({ isComplete: true, current: 10, progress: 100 })]);
    await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, 'NaN');

    const { result } = await renderGoals();

    expect(result.current.lifetimePointsEarned).toBe(50);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('50');
  });

  it('recovers on retry, restoring the stored goals', async () => {
    await seed([makeGoal({ title: 'Keep me' })]);
    failNextLoad();
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.retryStorage();
    });

    expect(result.current.storageError).toBeNull();
    expect(result.current.goals.map((g) => g.title)).toEqual(['Keep me']);
  });
});

describe('StorageErrorBanner', () => {
  const en = translations.en.storageErrors;

  /** Renders the banner beside a probe that exposes the goals context. */
  async function renderBanner() {
    let context!: ReturnType<typeof useGoals>;
    function Probe() {
      context = useGoals();
      return null;
    }

    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 400, height: 800 },
          insets: { top: 20, left: 0, right: 0, bottom: 0 },
        }}
      >
        <LanguageProvider>
          <ThemeProvider>
            <GoalsProvider>
              <RewardsProvider>
                <Probe />
                <StorageErrorBanner />
              </RewardsProvider>
            </GoalsProvider>
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    );
    await waitFor(() => expect(context.isLoading).toBe(false));
    return () => context;
  }

  it('is hidden while storage is healthy', async () => {
    await seed([makeGoal()]);
    await renderBanner();

    expect(screen.queryByText(en.saveFailed)).toBeNull();
  });

  it('appears when a save fails, and Retry clears it', async () => {
    await seed([makeGoal()]);
    const context = await renderBanner();
    setItem.mockRejectedValueOnce(disk);

    await act(async () => {
      await context().updateGoal(1, 10);
    });
    expect(screen.getByText(en.saveFailed)).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText(en.retry));
    });

    await waitFor(() => expect(screen.queryByText(en.saveFailed)).toBeNull());
    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('50');
  });

  it('explains a failed load differently', async () => {
    await seed([makeGoal()]);
    failNextLoad();
    await renderBanner();

    expect(screen.getByText(en.loadFailed)).toBeTruthy();
  });

  it('says when unreadable data was set aside, without offering a Retry', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, '{corrupt');
    await renderBanner();

    expect(screen.getByText(en.unreadable)).toBeTruthy();
    expect(screen.queryByLabelText(en.retry)).toBeNull();
  });

  // Regression: it came last, so any error hid it - and closing that error
  // closed it too, unseen - and a save failing and then working cleared it.
  it('says unreadable data was set aside alongside an error, until it is closed', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, '{corrupt');
    const context = await renderBanner();
    const writes = failWrites(STORAGE_KEYS.GOALS);

    await act(async () => {
      await context().addGoal('New', 10, 0, 'x', 'increase', 1, 'daily');
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });
    expect(screen.getByText(en.saveFailed, { exact: false })).toBeTruthy();
    expect(screen.getByText(en.unreadable, { exact: false })).toBeTruthy();

    writes.recover();
    await act(async () => {
      fireEvent.press(screen.getByLabelText(en.retry));
    });
    await waitFor(() => expect(screen.queryByText(en.saveFailed, { exact: false })).toBeNull());
    expect(screen.getByText(en.unreadable)).toBeTruthy();

    fireEvent.press(screen.getByLabelText(translations.en.common.close));
    await waitFor(() => expect(screen.queryByText(en.unreadable)).toBeNull());
  });

  it('reports rewards that could not be loaded, and Retry reloads them', async () => {
    await seed([makeGoal()]);
    await AsyncStorage.setItem(REWARDS_KEY, '[]');
    failNextLoad(REWARDS_KEY);
    await renderBanner();

    expect(screen.getByText(en.rewardsLoadFailed)).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText(en.retry));
    });

    await waitFor(() => expect(screen.queryByText(en.rewardsLoadFailed)).toBeNull());
  });

  it('can be closed', async () => {
    await seed([makeGoal()]);
    const context = await renderBanner();
    setItem.mockRejectedValueOnce(disk);
    await act(async () => {
      await context().updateGoal(1, 10);
    });

    fireEvent.press(screen.getByLabelText(translations.en.common.close));

    await waitFor(() => expect(screen.queryByText(en.saveFailed)).toBeNull());
  });
});
