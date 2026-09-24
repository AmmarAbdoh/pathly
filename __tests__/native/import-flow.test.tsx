/**
 * Applying an import through the real providers, and the full
 * export -> parse -> import round trip.
 */

import { REWARDS_KEY, STORAGE_KEYS } from '@/src/constants/storage-keys';
import { GoalsBusyError, GoalsProvider, useGoals } from '@/src/context/GoalsContext';
import { RewardsProvider, useRewards } from '@/src/context/RewardsContext';
import { PartialImportError, useImportBackup } from '@/src/hooks/use-import-backup';
import type { Goal, Reward } from '@/src/types';
import { generateJSONExport, parseJSONImport } from '@/src/utils/export-data';
import { type ImportMode } from '@/src/utils/import-data';
import * as notifications from '@/src/utils/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/src/utils/notifications', () => ({
  scheduleGoalNotification: jest.fn(async () => []),
  cancelGoalNotifications: jest.fn(async () => {}),
  NotificationPermissionError: class NotificationPermissionError extends Error {},
}));

const SAVE_DEBOUNCE_MS = 400;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const disk = new Error('disk full');
const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;
const realGetItem = getItem.getMockImplementation()!;
const realSetItem = setItem.getMockImplementation()!;
const cancelled= notifications.cancelGoalNotifications as jest.Mock;

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
  const view = renderHook(
    () => ({ goals: useGoals(), rewards: useRewards(), importBackup: useImportBackup() }),
    {
      wrapper: ({ children }) => (
        <GoalsProvider>
          <RewardsProvider>{children}</RewardsProvider>
        </GoalsProvider>
      ),
    }
  );
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
  await act(async () => {
    await app.current.importBackup(parsed.data!, mode);
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
  getItem.mockImplementation(realGetItem);
  setItem.mockImplementation(realSetItem);
});

describe('replaceAllGoals', () => {
  it('writes the goals and lifetime points', async () => {
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

  it('rolls imported periods over, as a load would', async () => {
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

  // All in one go: the import holds the rewards queue meanwhile.
  it('cancels reminders for goals that are going away, and only those, at once', async () => {
    await seed([
      goal({ id: 1, notificationIds: ['keep-me'] }),
      goal({ id: 2, notificationIds: ['gone-1', 'gone-2'] }),
      goal({ id: 3, notificationIds: ['gone-3'] }),
    ]);
    const { result } = await renderApp();

    await act(async () => {
      await result.current.goals.replaceAllGoals([goal({ id: 1, notificationIds: ['keep-me'] })], 0);
    });

    expect(cancelled.mock.calls).toEqual([[['gone-1', 'gone-2', 'gone-3']]]);
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

describe('withRewardsHeld', () => {
  it('replaces every reward and persists them', async () => {
    await seed([], [reward({ title: 'Old' })]);
    const { result } = await renderApp();

    await act(async () => {
      await result.current.rewards.withRewardsHeld((_, write) =>
        write([reward({ id: 3, title: 'New', isRedeemed: true })])
      );
    });

    expect(result.current.rewards.getRedeemedRewards().map((r) => r.title)).toEqual(['New']);
    expect(JSON.parse((await AsyncStorage.getItem(REWARDS_KEY))!)[0].title).toBe('New');
  });

  it('puts the rewards back when the write fails', async () => {
    await seed([], [reward({ title: 'Old' })]);
    const { result } = await renderApp();
    setItem.mockImplementation(async (key: string, value: string) => {
      if (key === REWARDS_KEY) throw disk;
      return realSetItem(key, value);
    });

    await act(async () => {
      await expect(
        result.current.rewards.withRewardsHeld((_, write) => write([reward({ id: 3, title: 'New' })]))
      ).rejects.toBe(disk);
    });

    expect(result.current.rewards.rewards.map((r) => r.title)).toEqual(['Old']);
  });

  // It would write outside the queue, over changes it knows nothing of.
  it('lets the task write only while the hold lasts', async () => {
    await seed([], [reward({ title: 'Old' })]);
    const { result } = await renderApp();
    let kept!: (next: Reward[]) => Promise<void>;

    await act(async () => {
      await result.current.rewards.withRewardsHeld(async (_, write) => {
        kept = write;
      });
    });

    await expect(kept([reward({ id: 3, title: 'Late' })])).rejects.toThrow();
    expect(result.current.rewards.rewards.map((r) => r.title)).toEqual(['Old']);
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
        isRecurring: true, // only a recurring goal keeps a schedule
        period: 'weekly',
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

  // Regression: goals (with points) were applied, then rewards; if the
  // rewards write failed the user was told the import failed although half of
  // it had landed - and a retried Merge then imported the goals twice.
  it('applies all of a backup or none of it', async () => {
    await seed([goal({ id: 1, title: 'Mine' })], [reward({ id: 2, title: 'My treat' })], 40);
    const target = await renderApp();
    const backup = generateJSONExport(
      [goal({ id: 5, title: 'Backed up', isComplete: true })],
      [reward({ id: 6, title: 'Backed-up treat' })],
      100
    );
    setItem.mockImplementation(async (key: string, value: string) => {
      if (key === STORAGE_KEYS.GOALS) throw disk;
      return realSetItem(key, value);
    });

    await expect(importFile(target.result, backup, 'merge')).rejects.toThrow();

    const { goals, rewards } = target.result.current;
    expect(goals.goals.map((g) => g.title)).toEqual(['Mine']);
    expect(goals.lifetimePointsEarned).toBe(40);
    expect(rewards.rewards.map((r) => r.title)).toEqual(['My treat']);
    const storedRewards: Reward[] = JSON.parse((await AsyncStorage.getItem(REWARDS_KEY))!);
    expect(storedRewards.map((r) => r.title)).toEqual(['My treat']);
  });

  // Regression: if putting the rewards back failed too, that error replaced
  // the real one, and the half-applied import went unreported.
  it('says so when only part of a backup could be applied', async () => {
    await seed([goal({ id: 1, title: 'Mine' })], [reward({ id: 2, title: 'My treat' })], 40);
    const target = await renderApp();
    const backup = generateJSONExport([goal({ id: 5 })], [reward({ id: 6, title: 'Backed-up treat' })], 100);
    let rewardWrites = 0;
    setItem.mockImplementation(async (key: string, value: string) => {
      if (key === STORAGE_KEYS.GOALS) throw disk;
      if (key === REWARDS_KEY && ++rewardWrites > 1) throw disk; // the import lands; putting it back fails
      return realSetItem(key, value);
    });

    await expect(importFile(target.result, backup, 'merge')).rejects.toBeInstanceOf(PartialImportError);
  });

  // Regression: rewards were written before anything checked whether the
  // goals could be - after a failed load, they were imported on their own.
  it.each([
    ['goals', STORAGE_KEYS.GOALS],
    ['rewards', REWARDS_KEY],
  ])('writes nothing if the %s have not loaded', async (_, unreadableKey) => {
    await seed([goal({ id: 1, title: 'Mine' })], [reward({ id: 2, title: 'My treat' })], 40);
    getItem.mockImplementation(async (key: string) => {
      if (key === unreadableKey) throw disk;
      return realGetItem(key);
    });
    const target = await renderApp();
    setItem.mockClear();

    await expect(
      importFile(target.result, generateJSONExport([goal({ id: 5 })], [reward({ id: 6 })], 0), 'merge')
    ).rejects.toThrow();

    expect(setItem).not.toHaveBeenCalled();
  });

  // Regression: the import was built from the goals and rewards the screen
  // had rendered before the file picker opened, so anything changed since was
  // written over.
  it('builds on the data as it is when applied, not when the screen rendered', async () => {
    await seed([goal({ id: 1, title: 'Mine' })]);
    const target = await renderApp();
    const importBackup = target.result.current.importBackup; // captured, as the screen does
    await act(async () => {
      await target.result.current.goals.addGoal('Added meanwhile', 10, 0, 'x', 'increase', 1, 'daily');
    });

    const parsed = parseJSONImport(generateJSONExport([goal({ id: 5, title: 'Backed up' })], [], 0));
    await act(async () => {
      await importBackup(parsed.data!, 'merge');
    });

    expect(target.result.current.goals.goals.map((g) => g.title).sort()).toEqual([
      'Added meanwhile',
      'Backed up',
      'Mine',
    ]);
  });

  // Regression: the import was built from the rewards as they were when it
  // started. A linked reward redeemed while it waited to be written was
  // written over, unredeemed.
  it('does not undo a reward redeemed while the import waited its turn', async () => {
    await seed([goal({ id: 1, points: 50, linkedRewardId: 2 })], [reward({ id: 2, title: 'Treat', pointsCost: 20 })]);
    const target = await renderApp();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    setItem.mockImplementation(async (key: string, value: string) => {
      if (key === REWARDS_KEY) await gate;
      return realSetItem(key, value);
    });
    const parsed = parseJSONImport(generateJSONExport([goal({ id: 5, title: 'Backed up' })], [], 0));

    let adding!: Promise<void>;
    let finishing!: Promise<void>;
    let importing!: Promise<void>;
    await act(async () => {
      adding = target.result.current.rewards.addReward('Other', '', 5, '🎁'); // being written, held
      finishing = target.result.current.goals.finishGoal(1);
      await sleep(20); // the redemption now waits behind the new reward
      importing = target.result.current.importBackup(parsed.data!, 'merge');
    });
    release();
    await act(async () => {
      await adding;
      await finishing;
      await importing;
    });

    const treat = target.result.current.rewards.rewards.find((r) => r.title === 'Treat');
    expect(treat?.isRedeemed).toBe(true);
    const stored: Reward[] = JSON.parse((await AsyncStorage.getItem(REWARDS_KEY))!);
    expect(stored.find((r) => r.title === 'Treat')?.isRedeemed).toBe(true);
  });

  /** Hold the goals write - the import's - until the returned function is called. */
  function holdGoalsWrite() {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    setItem.mockImplementation(async (key: string, value: string) => {
      if (key === STORAGE_KEYS.GOALS) await gate;
      return realSetItem(key, value);
    });
    return release;
  }

  // Regression: a change made while an import ran was built on goals it was
  // about to replace. An edit was lost; a completion kept its points and its
  // redeemed reward though the goal came back incomplete.
  it('refuses goal changes while an import runs, and allows them after', async () => {
    await seed([goal({ id: 1, points: 50, linkedRewardId: 2 })], [reward({ id: 2, title: 'Treat', pointsCost: 20 })]);
    const target = await renderApp();
    const release = holdGoalsWrite();
    const parsed = parseJSONImport(generateJSONExport([goal({ id: 5, title: 'Backed up' })], [], 0));

    let importing!: Promise<void>;
    await act(async () => {
      importing = target.result.current.importBackup(parsed.data!, 'merge');
      await sleep(20); // the rewards are written; the goals are held
      await expect(target.result.current.goals.finishGoal(1)).rejects.toBeInstanceOf(GoalsBusyError);
      await expect(target.result.current.goals.updateGoal(1, 3)).rejects.toBeInstanceOf(GoalsBusyError);
    });
    release();
    await act(async () => {
      await importing;
    });

    expect(target.result.current.goals.lifetimePointsEarned).toBe(0);
    expect(target.result.current.rewards.rewards.find((r) => r.id === 2)?.isRedeemed).toBe(false);
    await act(async () => {
      await target.result.current.goals.updateGoal(1, 3);
    });
    expect(target.result.current.goals.goals.find((g) => g.id === 1)?.current).toBe(3);
  });

  // Regression: reminders saved while an import ran were scheduled, and their
  // ids stored on goals the import then replaced - firing, with nothing to
  // cancel them.
  it('holds a reminder save until the import is done', async () => {
    const scheduled = notifications.scheduleGoalNotification as jest.Mock;
    scheduled.mockImplementation(async () => ['n1']);
    await seed([goal({ id: 1 })]);
    const target = await renderApp();
    const release = holdGoalsWrite();
    const parsed = parseJSONImport(generateJSONExport([goal({ id: 5, title: 'Backed up' })], [], 0));
    const text = { reminderTitle: 'Reminder', reminderBody: '{goal}' };

    let importing!: Promise<void>;
    let saving!: Promise<void>;
    await act(async () => {
      importing = target.result.current.importBackup(parsed.data!, 'merge');
      await sleep(20);
      saving = target.result.current.goals.updateNotificationSettings(1, true, text, 540, [1]);
      await sleep(20);
    });
    expect(scheduled).not.toHaveBeenCalled();

    release();
    await act(async () => {
      await importing;
      await saving;
    });
    expect(target.result.current.goals.goals.find((g) => g.id === 1)).toMatchObject({
      notificationsEnabled: true,
      notificationIds: ['n1'],
    });
    scheduled.mockImplementation(async () => []);
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
