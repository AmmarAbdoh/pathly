/**
 * Applying an import through the real providers, and the full
 * export -> parse -> import round trip.
 */

import { REWARDS_KEY, STORAGE_KEYS } from '@/src/constants/storage-keys';
import { GoalsProvider, useGoals } from '@/src/context/GoalsContext';
import { RewardsProvider, useRewards } from '@/src/context/RewardsContext';
import type { Goal, Reward } from '@/src/types';
import { generateJSONExport, parseJSONImport } from '@/src/utils/export-data';
import { buildImport, type ImportMode } from '@/src/utils/import-data';
import * as notifications from '@/src/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/src/utils/notifications', () => ({
  scheduleGoalNotification: jest.fn(async () => []),
  cancelGoalNotifications: jest.fn(async () => {}),
}));

const SAVE_DEBOUNCE_MS = 400;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const disk = new Error('disk full');
const setItem = AsyncStorage.setItem as jest.Mock;
const cancelled = notifications.cancelGoalNotifications as jest.Mock;

const goal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: 1,
    title: 'Goal',
    target: 10,
    current: 0,
    initialValue: 0,
    unit: 'x',
    progress: 0,
    points: 10,
    direction: 'increase',
    period: 'ongoing',
    periodStartDate: Date.now(),
    createdAt: Date.now(),
    subGoals: [],
    isComplete: false,
    completionHistory: [],
    ...overrides,
  }) as Goal;

const reward = (overrides: Partial<Reward> = {}): Reward => ({
  id: 1,
  title: 'Reward',
  description: '',
  pointsCost: 20,
  icon: '🎁',
  createdAt: 1,
  isRedeemed: false,
  ...overrides,
});

async function seed(goals: Goal[], rewards: Reward[] = [], lifetime = 0) {
  await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
  await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, String(lifetime));
}

async function renderApp() {
  const view = renderHook(() => ({ goals: useGoals(), rewards: useRewards() }), {
    wrapper: ({ children }) => (
      <GoalsProvider>
        <RewardsProvider>{children}</RewardsProvider>
      </GoalsProvider>
    ),
  });
  await waitFor(() => {
    expect(view.result.current.goals.isLoading).toBe(false);
    expect(view.result.current.rewards.isLoading).toBe(false);
  });
  return view;
}

/** What the settings screen does once the user picks Merge or Replace. */
async function importFile(
  app: Awaited<ReturnType<typeof renderApp>>['result'],
  json: string,
  mode: ImportMode
) {
  const parsed = parseJSONImport(json);
  expect(parsed.success).toBe(true);
  const { goals, rewards } = app.current;
  const next = buildImport(
    { goals: goals.goals, rewards: rewards.rewards, lifetimePoints: goals.lifetimePointsEarned },
    parsed.data!,
    mode
  );
  await act(async () => {
    await goals.replaceAllGoals(next.goals, next.lifetimePoints);
    await rewards.replaceAllRewards(next.rewards);
  });
}

let consoleError: jest.SpyInstance;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('replaceAllGoals', () => {
  it('writes the goals and lifetime points and reloads them', async () => {
    await seed([goal({ title: 'Old' })]);
    const { result } = await renderApp();

    await act(async () => {
      await result.current.goals.replaceAllGoals([goal({ id: 5, title: 'New' })], 120);
    });

    expect(result.current.goals.goals.map((g) => g.title)).toEqual(['New']);
    expect(result.current.goals.lifetimePointsEarned).toBe(120);
    expect(JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.GOALS))!)[0].title).toBe('New');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('120');
  });

  it('runs imported data through the normal load path', async () => {
    const { result } = await renderApp();
    // A daily recurring goal from a backup, completed two days ago.
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;

    await act(async () => {
      await result.current.goals.replaceAllGoals(
        [
          goal({
            period: 'daily',
            isRecurring: true,
            periodStartDate: twoDaysAgo,
            current: 10,
            isComplete: true,
            completedAt: twoDaysAgo,
          }),
        ],
        0
      );
    });

    // Its period has ended, so it is reset exactly as on a cold start.
    expect(result.current.goals.goals[0].isComplete).toBe(false);
    expect(result.current.goals.goals[0].completionHistory).toHaveLength(1);
  });

  it('cancels reminders for goals that are going away, and only those', async () => {
    await seed([
      goal({ id: 1, notificationIds: ['keep-me'] }),
      goal({ id: 2, notificationIds: ['gone-1', 'gone-2'] }),
    ]);
    const { result } = await renderApp();

    await act(async () => {
      await result.current.goals.replaceAllGoals([goal({ id: 1, notificationIds: ['keep-me'] })], 0);
    });

    expect(cancelled.mock.calls).toEqual([[['gone-1', 'gone-2']]]);
  });

  it('rejects and changes nothing when the goals cannot be written', async () => {
    await seed([goal({ title: 'Keep' })], [], 30);
    const { result } = await renderApp();
    setItem.mockRejectedValueOnce(disk);

    await act(async () => {
      await expect(
        result.current.goals.replaceAllGoals([goal({ title: 'New' })], 999)
      ).rejects.toThrow();
    });

    expect(result.current.goals.goals.map((g) => g.title)).toEqual(['Keep']);
    expect(result.current.goals.lifetimePointsEarned).toBe(30);
    expect(cancelled).not.toHaveBeenCalled();
  });

  it('keeps the goals and flags a retry when only the points write fails', async () => {
    const { result } = await renderApp();
    setItem
      .mockImplementationOnce(async () => {}) // goals write succeeds
      .mockRejectedValueOnce(disk); // lifetime points write fails

    await act(async () => {
      await result.current.goals.replaceAllGoals([goal({ title: 'New' })], 80);
    });

    expect(result.current.goals.storageError).toBe('save');
    expect(result.current.goals.lifetimePointsEarned).toBe(80);
  });

  it('discards a save that was queued against the data being replaced', async () => {
    await seed([goal({ id: 1, title: 'Old' })]);
    const { result } = await renderApp();

    await act(async () => {
      await result.current.goals.updateGoal(1, 5); // queued, not yet written
      await result.current.goals.replaceAllGoals([goal({ id: 7, title: 'Imported' })], 0);
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    const stored: Goal[] = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.GOALS))!);
    expect(stored.map((g) => g.title)).toEqual(['Imported']);
  });
});

describe('replaceAllRewards', () => {
  it('replaces every reward and persists them', async () => {
    await seed([], [reward({ title: 'Old' })]);
    const { result } = await renderApp();

    await act(async () => {
      await result.current.rewards.replaceAllRewards([reward({ id: 3, title: 'New', isRedeemed: true })]);
    });

    expect(result.current.rewards.getRedeemedRewards().map((r) => r.title)).toEqual(['New']);
    expect(JSON.parse((await AsyncStorage.getItem(REWARDS_KEY))!)[0].title).toBe('New');
  });
});

describe('export, then import', () => {
  /** A dataset with every kind of state and link the old import lost. */
  const rich = {
    goals: [
      goal({
        id: 1,
        title: 'Parent',
        isUltimate: true,
        subGoals: [2],
        subgoalsAwardPoints: true,
        sortOrder: 2,
      }),
      goal({ id: 2, title: 'Child', parentId: 1, current: 10, isComplete: true, completedAt: 5, points: 15 }),
      goal({
        id: 3,
        title: 'Journal',
        notes: [{ id: 'n1', text: 'day one', createdAt: 1 }],
        schedule: { daysOfWeek: [1, 5] },
        dependsOn: [2],
        linkedRewardId: 9,
        isPaused: true,
        category: 'personal',
      }),
      goal({ id: 4, title: 'Old one', isArchived: true, archivedAt: 3 }),
    ],
    rewards: [reward({ id: 9, title: 'Treat', isRedeemed: true, redeemedAt: 6, linkedToGoalId: 3 })],
    lifetime: 215,
  };

  // Regression: this round trip used to lose completion, notes, schedules,
  // links, redemptions and points, and five rewards came back as one.
  it('restores everything with Replace', async () => {
    await seed(rich.goals, rich.rewards, rich.lifetime);
    const source = await renderApp();
    const backup = generateJSONExport(
      source.result.current.goals.goals,
      source.result.current.rewards.rewards,
      source.result.current.goals.lifetimePointsEarned
    );
    source.unmount();

    await AsyncStorage.clear();
    await seed([goal({ id: 50, title: 'Different data' })], [reward({ id: 60 })], 5);
    const target = await renderApp();

    await importFile(target.result, backup, 'replace');

    const goals = target.result.current.goals.goals;
    const find = (title: string) => goals.find((g) => g.title === title)!;
    expect(goals.map((g) => g.title).sort()).toEqual(['Child', 'Journal', 'Old one', 'Parent']);

    expect(find('Child')).toMatchObject({ isComplete: true, current: 10, parentId: find('Parent').id });
    expect(find('Parent').subGoals).toEqual([find('Child').id]);
    expect(find('Parent')).toMatchObject({ sortOrder: 2, subgoalsAwardPoints: true, progress: 100 });
    expect(find('Journal')).toMatchObject({
      notes: [{ id: 'n1', text: 'day one', createdAt: 1 }],
      schedule: { daysOfWeek: [1, 5] },
      dependsOn: [find('Child').id],
      isPaused: true,
      category: 'personal',
    });
    expect(find('Old one')).toMatchObject({ isArchived: true, archivedAt: 3 });

    const [treat] = target.result.current.rewards.rewards;
    expect(target.result.current.rewards.rewards).toHaveLength(1);
    expect(treat).toMatchObject({ title: 'Treat', isRedeemed: true, linkedToGoalId: find('Journal').id });
    expect(find('Journal').linkedRewardId).toBe(treat.id);

    expect(target.result.current.goals.lifetimePointsEarned).toBe(215);
  });

  it('adds everything alongside existing data with Merge, keeping the balance additive', async () => {
    await seed(rich.goals, rich.rewards, rich.lifetime);
    const source = await renderApp();
    const backup = generateJSONExport(
      source.result.current.goals.goals,
      source.result.current.rewards.rewards,
      source.result.current.goals.lifetimePointsEarned
    );
    source.unmount();

    // Existing data deliberately reuses the backup's ids.
    await AsyncStorage.clear();
    await seed([goal({ id: 1, title: 'Mine' })], [reward({ id: 9, title: 'My treat', pointsCost: 30 })], 100);
    const target = await renderApp();

    await importFile(target.result, backup, 'merge');

    const goals = target.result.current.goals.goals;
    const rewards = target.result.current.rewards.rewards;
    expect(goals).toHaveLength(5);
    expect(rewards).toHaveLength(2);
    expect(new Set(goals.map((g) => g.id)).size).toBe(5);
    expect(new Set(rewards.map((r) => r.id)).size).toBe(2);

    // "Mine" still has no parent, even though the backup's parent had its old id.
    expect(goals.find((g) => g.title === 'Mine')?.parentId).toBeUndefined();

    // Earned 100 + 215, spent the imported 20: the balance is the two added up.
    expect(target.result.current.goals.lifetimePointsEarned).toBe(315);
  });
});
