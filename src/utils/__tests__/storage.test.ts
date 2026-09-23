/**
 * Tests for the AsyncStorage-backed storage services.
 *
 * Failure paths use `mockRejectedValueOnce`, which affects a single call. Never
 * `jest.spyOn(...).mockRestore()` an AsyncStorage method: they are already
 * jest.fns in the mock, and restoring one wipes its implementation for every
 * later test.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { REWARDS_KEY, STORAGE_KEYS } from '../../constants/storage-keys';
import type { Goal, GoalTemplate, Reward } from '../../types';
import { rewardsStorage } from '../rewards-storage';
import {
  customTemplatesStorage,
  goalsStorage,
  setAsideUnreadable,
  storage,
  themeStorage,
  UnreadableDataError,
} from '../storage';

const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;
const removeItem = AsyncStorage.removeItem as jest.Mock;

const disk = new Error('disk full');

let consoleError: jest.SpyInstance;
let consoleWarn: jest.SpyInstance;

beforeEach(async () => {
  await AsyncStorage.clear();
  // The services log before recovering; keep test output readable.
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  consoleWarn.mockRestore();
});

describe('goalsStorage', () => {
  it('round-trips goals', async () => {
    const goals = [{ id: 1, title: 'A' }] as Goal[];
    await goalsStorage.saveGoals(goals);
    const loaded = await goalsStorage.loadGoals();
    expect(loaded[0]).toMatchObject({ id: 1, title: 'A' });
  });

  it('returns an empty list when nothing is stored', async () => {
    expect(await goalsStorage.loadGoals()).toEqual([]);
  });

  // Regression: these used to return [], which the context could not tell
  // apart from "no goals" - so the next save wrote over the unreadable data.
  // Retrying cannot fix data like this, so it is told apart from a failed
  // read - and carries the raw value, so it can be kept aside.
  it('throws UnreadableDataError, with the raw value, for data that is not a list', async () => {
    const raw = JSON.stringify({ not: 'an array' });
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, raw);
    await expect(goalsStorage.loadGoals()).rejects.toEqual(expect.any(UnreadableDataError));
    await expect(goalsStorage.loadGoals()).rejects.toMatchObject({ raw });
  });

  it('throws UnreadableDataError for corrupt JSON', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, '{corrupt');
    await expect(goalsStorage.loadGoals()).rejects.toMatchObject({ raw: '{corrupt' });
  });

  // Regression: a null entry crashed the migration (`goal.current`), which
  // failed the load on every launch.
  // Regression: a list is an object to typeof, and came out as a goal with no
  // id or title.
  it('skips entries that are not objects', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.GOALS,
      JSON.stringify([null, 3, [1, 2], { id: 1, title: 'A', current: 0, target: 1 }])
    );
    expect((await goalsStorage.loadGoals()).map((g) => g.id)).toEqual([1]);
  });

  it('throws when the read itself fails', async () => {
    getItem.mockRejectedValueOnce(disk);
    await expect(goalsStorage.loadGoals()).rejects.toThrow('Failed to load goals');
  });

  it('migrates goals saved by older versions to the current shape', async () => {
    const created = 1_700_000_000_000;
    // Only the fields the very first version stored.
    await AsyncStorage.setItem(
      STORAGE_KEYS.GOALS,
      JSON.stringify([{ id: 1, title: 'Old', target: 10, current: 3, createdAt: created }])
    );

    const [goal] = await goalsStorage.loadGoals();

    expect(goal).toMatchObject({
      initialValue: 3, // starting point is where the goal stood when first saved
      period: 'custom',
      subGoals: [],
      periodStartDate: created,
      isUltimate: false,
      isComplete: false,
    });
  });

  it('does not overwrite fields that are already present', async () => {
    await AsyncStorage.setItem(
      STORAGE_KEYS.GOALS,
      JSON.stringify([
        {
          id: 1,
          current: 3,
          initialValue: 0,
          period: 'weekly',
          subGoals: [7],
          periodStartDate: 42,
          isUltimate: true,
          isComplete: true,
        },
      ])
    );

    const [goal] = await goalsStorage.loadGoals();

    expect(goal).toMatchObject({
      initialValue: 0,
      period: 'weekly',
      subGoals: [7],
      periodStartDate: 42,
      isUltimate: true,
      isComplete: true,
    });
  });

  it('falls back to now for periodStartDate when there is no createdAt either', async () => {
    const before = Date.now();
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([{ id: 1, current: 0 }]));
    const [goal] = await goalsStorage.loadGoals();
    expect(goal.periodStartDate).toBeGreaterThanOrEqual(before);
  });

  it('wraps a failed save in a readable error', async () => {
    setItem.mockRejectedValueOnce(disk);
    await expect(goalsStorage.saveGoals([])).rejects.toThrow('Failed to save goals');
  });

  it('clears goals', async () => {
    await goalsStorage.saveGoals([{ id: 1 } as Goal]);
    await goalsStorage.clearGoals();
    expect(await AsyncStorage.getItem(STORAGE_KEYS.GOALS)).toBeNull();
  });

  it('wraps a failed clear in a readable error', async () => {
    removeItem.mockRejectedValueOnce(disk);
    await expect(goalsStorage.clearGoals()).rejects.toThrow('Failed to clear goals');
  });

  it('keeps `storage` as a backwards-compatible alias', () => {
    expect(storage).toBe(goalsStorage);
  });
});

describe('setAsideUnreadable', () => {
  it('keeps the value under a key beside it, and empties the original', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, '{corrupt');

    await setAsideUnreadable(STORAGE_KEYS.GOALS, '{corrupt');

    const keys = await AsyncStorage.getAllKeys();
    const aside = keys.find((key) => key.startsWith(`${STORAGE_KEYS.GOALS}.unreadable.`))!;
    expect(await AsyncStorage.getItem(aside)).toBe('{corrupt');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.GOALS)).toBeNull();
  });

  it('moves nothing when the copy cannot be written', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, '{corrupt');
    setItem.mockRejectedValueOnce(disk);

    await expect(setAsideUnreadable(STORAGE_KEYS.GOALS, '{corrupt')).rejects.toBe(disk);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.GOALS)).toBe('{corrupt');
  });

  it('still succeeds when only removing the original fails', async () => {
    removeItem.mockRejectedValueOnce(disk);
    await expect(setAsideUnreadable(STORAGE_KEYS.GOALS, 'x')).resolves.toBeUndefined();
  });
});

describe('themeStorage', () => {
  it('round-trips theme mode and language', async () => {
    await themeStorage.saveThemeMode('dark');
    await themeStorage.saveLanguage('ar');
    expect(await themeStorage.loadThemeMode()).toBe('dark');
    expect(await themeStorage.loadLanguage()).toBe('ar');
  });

  it('returns null when nothing is stored', async () => {
    expect(await themeStorage.loadThemeMode()).toBeNull();
    expect(await themeStorage.loadLanguage()).toBeNull();
  });

  it('returns null when a read fails', async () => {
    getItem.mockRejectedValueOnce(disk).mockRejectedValueOnce(disk);
    expect(await themeStorage.loadThemeMode()).toBeNull();
    expect(await themeStorage.loadLanguage()).toBeNull();
  });

  it('wraps failed saves in readable errors', async () => {
    setItem.mockRejectedValueOnce(disk);
    await expect(themeStorage.saveThemeMode('dark')).rejects.toThrow('Failed to save theme mode');

    setItem.mockRejectedValueOnce(disk);
    await expect(themeStorage.saveLanguage('ar')).rejects.toThrow('Failed to save language');
  });
});

describe('customTemplatesStorage', () => {
  const template = (id: string) => ({ id, title: id }) as unknown as GoalTemplate;

  it('starts empty', async () => {
    expect(await customTemplatesStorage.loadCustomTemplates()).toEqual([]);
  });

  it('adds and deletes templates', async () => {
    await customTemplatesStorage.addCustomTemplate(template('a'));
    await customTemplatesStorage.addCustomTemplate(template('b'));
    expect((await customTemplatesStorage.loadCustomTemplates()).map((t) => t.id)).toEqual(['a', 'b']);

    await customTemplatesStorage.deleteCustomTemplate('a');
    expect((await customTemplatesStorage.loadCustomTemplates()).map((t) => t.id)).toEqual(['b']);
  });

  it('clears templates', async () => {
    await customTemplatesStorage.addCustomTemplate(template('a'));
    await customTemplatesStorage.clearCustomTemplates();
    expect(await customTemplatesStorage.loadCustomTemplates()).toEqual([]);
  });

  it('returns an empty list for data that is not an array', async () => {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify('nope'));
    expect(await customTemplatesStorage.loadCustomTemplates()).toEqual([]);
  });

  it('returns an empty list when the read fails', async () => {
    getItem.mockRejectedValueOnce(disk);
    expect(await customTemplatesStorage.loadCustomTemplates()).toEqual([]);
  });

  it('wraps failures in readable errors', async () => {
    setItem.mockRejectedValueOnce(disk);
    await expect(customTemplatesStorage.saveCustomTemplates([])).rejects.toThrow(
      'Failed to save custom templates'
    );

    setItem.mockRejectedValueOnce(disk);
    await expect(customTemplatesStorage.addCustomTemplate(template('a'))).rejects.toThrow(
      'Failed to add custom template'
    );

    setItem.mockRejectedValueOnce(disk);
    await expect(customTemplatesStorage.deleteCustomTemplate('a')).rejects.toThrow(
      'Failed to delete custom template'
    );

    removeItem.mockRejectedValueOnce(disk);
    await expect(customTemplatesStorage.clearCustomTemplates()).rejects.toThrow(
      'Failed to clear custom templates'
    );
  });
});

describe('rewardsStorage', () => {
  const reward = { id: 1, title: 'Coffee', isRedeemed: false } as Reward;

  it('round-trips rewards', async () => {
    await rewardsStorage.saveRewards([reward]);
    expect(await rewardsStorage.loadRewards()).toEqual([reward]);
  });

  it('returns an empty list when nothing is stored', async () => {
    expect(await rewardsStorage.loadRewards()).toEqual([]);
  });

  it('throws, rather than returning an empty list, when the read fails or the data is corrupt', async () => {
    getItem.mockRejectedValueOnce(disk);
    await expect(rewardsStorage.loadRewards()).rejects.toThrow('Failed to load rewards');

    await AsyncStorage.setItem(REWARDS_KEY, '{corrupt');
    await expect(rewardsStorage.loadRewards()).rejects.toEqual(expect.any(UnreadableDataError));

    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify({ not: 'an array' }));
    await expect(rewardsStorage.loadRewards()).rejects.toEqual(expect.any(UnreadableDataError));
  });

  it('clears rewards', async () => {
    await rewardsStorage.saveRewards([reward]);
    await rewardsStorage.clearRewards();
    expect(await AsyncStorage.getItem(REWARDS_KEY)).toBeNull();
  });

  it('propagates write failures unchanged', async () => {
    setItem.mockRejectedValueOnce(disk);
    await expect(rewardsStorage.saveRewards([])).rejects.toBe(disk);

    removeItem.mockRejectedValueOnce(disk);
    await expect(rewardsStorage.clearRewards()).rejects.toBe(disk);
  });
});
