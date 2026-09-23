/**
 * Storage failures: surfaced to the user, retried, and never allowed to
 * overwrite real data.
 */

import StorageErrorBanner from '@/components/StorageErrorBanner';
import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { GoalsProvider, useGoals } from '@/src/context/GoalsContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { translations } from '@/src/i18n/translations';
import type { Goal } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
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
 * Fail the provider's own lifetime-points read, which makes the load fail.
 *
 * Keyed rather than a one-shot `mockRejectedValueOnce`: other providers
 * (language, theme) also read storage on mount, and would consume it first.
 */
function failNextLoad() {
  let armed = true;
  getItem.mockImplementation(async (key: string) => {
    if (armed && key === STORAGE_KEYS.LIFETIME_POINTS) {
      armed = false;
      throw disk;
    }
    return realGetItem(key);
  });
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

  // Regression: while storage keeps failing, a reload read the old total back
  // from disk over the unsaved in-memory one, and the next successful write
  // then persisted the stale value. (A single failure recovers on its own:
  // refresh flushes first, which retries the write.)
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
  it('reports the failure', async () => {
    await seed([makeGoal()]);
    failNextLoad();

    const { result } = await renderGoals();

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
              <Probe />
              <StorageErrorBanner />
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
