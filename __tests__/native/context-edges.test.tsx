/**
 * Failure paths and lifecycle edges of the providers: disk errors, a failed
 * load, backgrounding, notification scheduling, malformed input, and misuse
 * outside a provider.
 */

import { REWARDS_KEY, STORAGE_KEYS } from '@/src/constants/storage-keys';
import { GoalsProvider, useGoals, type RescheduleOutcome } from '@/src/context/GoalsContext';
import { LanguageProvider, useLanguage } from '@/src/context/LanguageContext';
import { RewardsProvider, useRewards } from '@/src/context/RewardsContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import { translations } from '@/src/i18n/translations';
import type { Goal } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppState, I18nManager } from 'react-native';
import * as notifications from '@/src/utils/notifications';

jest.mock('@/src/utils/notifications', () => ({
  scheduleGoalNotification: jest.fn(async () => ['n1', 'n2']),
  cancelGoalNotifications: jest.fn(async () => {}),
  NotificationPermissionError: class NotificationPermissionError extends Error {},
}));

const SAVE_DEBOUNCE_MS = 400;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const disk = new Error('disk full');

const reminder = translations.en.notifications;
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

async function seed(goals: Goal[]) {
  await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, '0');
}

async function renderGoals() {
  const view = renderHook(() => useGoals(), {
    wrapper: ({ children }) => <GoalsProvider>{children}</GoalsProvider>,
  });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
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

describe('GoalsContext: loading', () => {
  it('writes back recurring goals that were reset on load', async () => {
    // A daily goal completed two days ago: its period has ended.
    const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
    await seed([
      makeGoal({
        period: 'daily',
        isRecurring: true,
        periodStartDate: twoDaysAgo,
        current: 10,
        progress: 100,
        isComplete: true,
        completedAt: twoDaysAgo,
      }),
    ]);

    const { result } = await renderGoals();

    expect(result.current.goals[0].isComplete).toBe(false);
    const stored: Goal[] = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.GOALS))!);
    expect(stored[0].isComplete).toBe(false);
    expect(stored[0].completionHistory).toHaveLength(1);
  });

  // A recurring goal is streak-checked on every load: handing back a copy even
  // when nothing changed would write the goals on every launch.
  it('does not rewrite storage on load when nothing changed', async () => {
    await seed([makeGoal(), makeGoal({ id: 2, period: 'weekly', isRecurring: true, currentStreak: 0, longestStreak: 0 })]);
    setItem.mockClear();

    await renderGoals();

    expect(setItem.mock.calls.filter(([key]) => key === STORAGE_KEYS.GOALS)).toHaveLength(0);
  });

  it('reports a load failure and stops loading', async () => {
    await seed([makeGoal()]);
    getItem.mockRejectedValueOnce(disk); // the goals read

    const { result } = await renderGoals();

    expect(result.current.error).toBe('Failed to load goals');
    expect(result.current.storageError).toBe('load');
  });

  it('refuses to be used outside its provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useGoals())).toThrow('useGoals must be used within a GoalsProvider');
  });
});

describe('GoalsContext: persistence', () => {
  it('reports a failed debounced write', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    setItem.mockRejectedValueOnce(disk);

    await act(async () => {
      await result.current.updateGoal(1, 3);
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect(result.current.error).toBe('Failed to save goals');
  });

  it('flushes pending writes when the app is backgrounded, not while active', async () => {
    // addEventListener is already a jest.fn under jest-expo. Replace only the
    // provider's single call - restoring a spy would wipe the mock for every
    // later test, whose cleanup then crashes on `subscription.remove()`.
    let onChange: (state: string) => void = () => {};
    (AppState.addEventListener as jest.Mock).mockImplementationOnce((_, handler) => {
      onChange = handler;
      return { remove: jest.fn() };
    });

    await seed([makeGoal()]);
    const { result } = await renderGoals();
    await act(async () => {
      await result.current.updateGoal(1, 8);
    });

    const stored = async () =>
      (JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.GOALS))!) as Goal[])[0].current;

    await act(async () => onChange('active'));
    expect(await stored()).toBe(0);

    await act(async () => onChange('background'));
    expect(await stored()).toBe(8);
  });

  it('skips the write entirely when a mutation changes nothing', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    setItem.mockClear();

    await act(async () => {
      await result.current.archiveGoal(999); // no such goal
      await result.current.recalculateProgress(1); // already correct
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect(setItem).not.toHaveBeenCalled();
  });

  it('keeps awarded points in memory even if persisting them fails', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    setItem.mockRejectedValueOnce(disk);

    await act(async () => {
      await result.current.updateGoal(1, 10);
    });

    expect(result.current.lifetimePointsEarned).toBe(50);
  });
});

describe('GoalsContext: malformed input', () => {
  // Import does not validate `unit`, so a hand-edited backup can omit it.
  it('rejects a goal with no unit and records the error', async () => {
    const { result } = await renderGoals();

    await act(async () => {
      await expect(
        result.current.addGoal('Read', 10, 0, undefined as unknown as string, 'increase', 1, 'daily')
      ).rejects.toThrow();
    });

    expect(result.current.error).toBe('Failed to add goal');
    expect(result.current.goals).toHaveLength(0);
  });

  it('rejects an edit with no title and records the error', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await expect(
        result.current.editGoal(1, undefined as unknown as string, 10, 0, 'x', 'increase', 1, 'daily')
      ).rejects.toThrow();
    });

    expect(result.current.error).toBe('Failed to edit goal');
    expect(result.current.goals[0].title).toBe('Read');
  });

  it('ignores an edit for a goal that does not exist', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.editGoal(999, 'Other', 10, 0, 'x', 'increase', 1, 'daily');
    });

    expect(result.current.goals.map((g) => g.title)).toEqual(['Read']);
  });
});

// Linked-reward redemption is RewardsContext's job; see rewards-context.test.
describe('GoalsContext: completion listeners', () => {
  it('tells listeners about a first completion only, and survives one that throws', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    const failing = jest.fn(async () => {
      throw disk;
    });
    const listener = jest.fn();

    act(() => {
      result.current.onGoalCompleted(failing);
      result.current.onGoalCompleted(listener);
    });
    await act(async () => {
      await result.current.finishGoal(1);
      await result.current.finishGoal(1);
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0]).toMatchObject({ id: 1 });
    expect(result.current.goals[0].isComplete).toBe(true);
  });

  it('archives rather than deletes on removeGoal', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.removeGoal(1);
    });

    expect(result.current.goals[0].isArchived).toBe(true);
  });
});

describe('GoalsContext: notification settings', () => {
  const scheduled = notifications.scheduleGoalNotification as jest.Mock;
  const cancelled = notifications.cancelGoalNotifications as jest.Mock;

  it('schedules reminders and stores their ids', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateNotificationSettings(1, true, reminder, 540, [1, 3]);
    });

    // With the wording it was given, in the user's language.
    expect(scheduled).toHaveBeenCalledWith(
      expect.objectContaining({ notificationTime: 540, notificationDays: [1, 3] }),
      reminder
    );
    expect(result.current.goals[0]).toMatchObject({
      notificationsEnabled: true,
      notificationIds: ['n1', 'n2'],
    });
  });

  it('cancels existing reminders when turned off', async () => {
    await seed([makeGoal({ notificationsEnabled: true, notificationIds: ['old'] })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateNotificationSettings(1, false, reminder);
    });

    expect(cancelled).toHaveBeenCalledWith(['old']);
    expect(result.current.goals[0]).toMatchObject({ notificationsEnabled: false, notificationIds: [] });
  });

  it('leaves settings untouched when scheduling fails', async () => {
    scheduled.mockRejectedValueOnce(new Error('permission denied'));
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await expect(result.current.updateNotificationSettings(1, true, reminder, 540)).rejects.toThrow(
        'permission denied'
      );
    });

    expect(result.current.goals[0].notificationsEnabled).toBeFalsy();
    expect(result.current.error).toBe('Failed to update notification settings');
  });

  // Regression: it returned quietly, and the screen said the reminders were set.
  it('says so for a goal that does not exist', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await expect(result.current.updateNotificationSettings(999, true, reminder, 540)).rejects.toThrow();
    });

    expect(scheduled).not.toHaveBeenCalled();
  });

  // Regression: a failure part-way had already cancelled the old reminders,
  // but the goal kept them on - shown as set, with nothing to fire.
  it('turns reminders off when saving them fails part-way', async () => {
    scheduled.mockRejectedValueOnce(new Error('too many pending'));
    await seed([makeGoal({ notificationsEnabled: true, notificationTime: 540, notificationIds: ['old'] })]);
    const { result } = await renderGoals();

    await act(async () => {
      await expect(result.current.updateNotificationSettings(1, true, reminder, 600, [1])).rejects.toThrow();
    });

    expect(result.current.goals[0]).toMatchObject({ notificationsEnabled: false, notificationIds: [] });
  });

  it('leaves reminders as they were when notifications are not allowed', async () => {
    scheduled.mockRejectedValueOnce(new notifications.NotificationPermissionError());
    const withReminders = { notificationsEnabled: true, notificationTime: 540, notificationIds: ['old'] };
    await seed([makeGoal(withReminders)]);
    const { result } = await renderGoals();

    await act(async () => {
      await expect(result.current.updateNotificationSettings(1, true, reminder, 600, [1])).rejects.toThrow();
    });

    expect(result.current.goals[0]).toMatchObject(withReminders);
  });

  // Regression: the goal was copied before the OS call and the copy written
  // back after it, undoing any change made in between.
  it('keeps a change made while the reminders were being scheduled', async () => {
    let release!: (ids: string[]) => void;
    scheduled.mockImplementationOnce(() => new Promise<string[]>((resolve) => (release = resolve)));
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    let saving!: Promise<void>;
    await act(async () => {
      saving = result.current.updateNotificationSettings(1, true, reminder, 540, [1]);
    });
    await act(async () => {
      await result.current.updateGoal(1, 4);
    });
    await act(async () => {
      release(['n9']);
      await saving;
    });

    expect(result.current.goals[0]).toMatchObject({ current: 4, notificationsEnabled: true, notificationIds: ['n9'] });
  });
});

describe('GoalsContext: reminders of goals that leave the list', () => {
  const cancelled = notifications.cancelGoalNotifications as jest.Mock;
  const withReminders = (ids: string[]) => ({ notificationsEnabled: true, notificationTime: 540, notificationIds: ids });

  // Regression: they live in the OS, and kept firing for goals that were gone.
  it('cancels those of an archived goal and its subgoals, and turns them off', async () => {
    await seed([
      makeGoal({ id: 1, subGoals: [2], ...withReminders(['a']) }),
      makeGoal({ id: 2, parentId: 1, ...withReminders(['b', 'c']) }),
      makeGoal({ id: 3, ...withReminders(['keep']) }),
    ]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.archiveGoal(1);
    });

    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(cancelled).toHaveBeenCalledWith(['a', 'b', 'c']);
    for (const id of [1, 2]) {
      expect(result.current.goals.find((g) => g.id === id)).toMatchObject({
        notificationsEnabled: false,
        notificationIds: [],
      });
    }
    expect(result.current.goals.find((g) => g.id === 3)).toMatchObject(withReminders(['keep']));
  });

  it('cancels those of a deleted goal', async () => {
    await seed([makeGoal({ ...withReminders(['a']) }), makeGoal({ id: 2 })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.permanentlyDeleteGoal(1);
    });

    expect(cancelled).toHaveBeenCalledWith(['a']);
  });

  // Regression: goals archived before archiving cancelled reminders kept
  // them, firing for a goal the user had put away, for good.
  it('turns off, on load, the reminders an archived goal still has', async () => {
    await seed([
      makeGoal({ id: 1, isArchived: true, ...withReminders(['x', 'y']) }),
      makeGoal({ id: 2, ...withReminders(['keep']) }),
    ]);
    const { result } = await renderGoals();

    await waitFor(() => expect(cancelled).toHaveBeenCalledWith(['x', 'y']));
    expect(result.current.goals[0]).toMatchObject({ notificationsEnabled: false, notificationIds: [] });
    expect(result.current.goals[1].notificationIds).toEqual(['keep']);
    await waitFor(async () => {
      const stored: Goal[] = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.GOALS))!);
      expect(stored[0].notificationIds).toEqual([]);
    });
  });

  // Regression: the stale reminders were cancelled before the load's own
  // write, while changes were already allowed - and that write then put the
  // loaded goals over a change made meanwhile, which was never saved.
  it('keeps a change made while an archived goal\'s reminders are cancelled on load', async () => {
    let release!: () => void;
    cancelled.mockImplementationOnce(() => new Promise<void>((resolve) => (release = resolve)));
    await seed([makeGoal({ id: 1, isArchived: true, ...withReminders(['x']) }), makeGoal({ id: 2 })]);
    const { result } = await renderGoals();
    await waitFor(() => expect(cancelled).toHaveBeenCalled());

    await act(async () => {
      await result.current.updateGoal(2, 4);
    });
    await act(async () => {
      release();
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    const stored: Goal[] = JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.GOALS))!);
    expect(stored.find((g) => g.id === 2)?.current).toBe(4);
  });

  it('has nothing to cancel for a goal without reminders', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.archiveGoal(1);
      await result.current.permanentlyDeleteGoal(1);
    });

    expect(cancelled).not.toHaveBeenCalled();
  });
});

describe('GoalsContext: rescheduleReminders', () => {
  const scheduled = notifications.scheduleGoalNotification as jest.Mock;
  const cancelled = notifications.cancelGoalNotifications as jest.Mock;
  const ar = translations.ar.notifications;
  const withReminders = { notificationsEnabled: true, notificationTime: 540, notificationIds: ['old'] };

  // Regression: reminders are worded when scheduled, so after a language
  // change they stayed in the old language, and after a rename kept the old
  // title.
  it('schedules the enabled reminders again in the wording it is given', async () => {
    await seed([
      makeGoal({ id: 1, ...withReminders }),
      makeGoal({ id: 2 }),
      makeGoal({ id: 3, ...withReminders, notificationsEnabled: false }),
      makeGoal({ id: 4, ...withReminders, isArchived: true }),
    ]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.rescheduleReminders(ar);
    });

    expect(scheduled).toHaveBeenCalledTimes(1);
    expect(scheduled).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), ar);
    expect(result.current.goals[0].notificationIds).toEqual(['n1', 'n2']);
  });

  it('can do just one goal', async () => {
    await seed([makeGoal({ id: 1, ...withReminders }), makeGoal({ id: 2, ...withReminders })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.rescheduleReminders(reminder, 2);
    });

    expect(scheduled).toHaveBeenCalledTimes(1);
    expect(scheduled).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }), reminder);
    expect(result.current.goals[0].notificationIds).toEqual(['old']);
  });

  // Regression: a refusal was treated as a failure part-way: reminders that
  // were intact, and would fire again once permission was back, were
  // cancelled and switched off on every goal.
  it('leaves reminders as they were when notifications are not allowed', async () => {
    scheduled.mockRejectedValueOnce(new notifications.NotificationPermissionError());
    await seed([makeGoal({ id: 1, ...withReminders })]);
    const { result } = await renderGoals();

    let outcome!: RescheduleOutcome;
    await act(async () => {
      outcome = await result.current.rescheduleReminders(ar);
    });

    // Counted, so the screen can say why the wording hasn't changed.
    expect(outcome).toEqual({ turnedOff: 0, notAllowed: 1 });
    expect(result.current.goals[0]).toMatchObject(withReminders);
    expect(cancelled).not.toHaveBeenCalled();
  });

  // Regression: a goal whose reminders could not be scheduled kept showing
  // them on, with ids already cancelled - nothing fired, and nobody was told.
  it('turns off the reminders of a goal it cannot schedule, says so, and carries on', async () => {
    scheduled.mockRejectedValueOnce(new Error('too many pending'));
    await seed([makeGoal({ id: 1, ...withReminders }), makeGoal({ id: 2, ...withReminders })]);
    const { result } = await renderGoals();

    let outcome!: RescheduleOutcome;
    await act(async () => {
      outcome = await result.current.rescheduleReminders(ar);
    });

    expect(outcome).toEqual({ turnedOff: 1, notAllowed: 0 });
    expect(result.current.goals[0]).toMatchObject({ notificationsEnabled: false, notificationIds: [] });
    expect(result.current.goals[1].notificationIds).toEqual(['n1', 'n2']);
    // Already cancelled by the failed scheduling: nothing to do twice.
    expect(cancelled).not.toHaveBeenCalled();
  });

  /** Hold the next scheduling open; resolve it with the ids to return. */
  function holdScheduling() {
    let release!: (ids: string[]) => void;
    scheduled.mockImplementationOnce(() => new Promise<string[]>((resolve) => (release = resolve)));
    return (ids: string[]) => release(ids);
  }

  // Regression: the new ids were written back whatever had happened
  // meanwhile, so an archived goal got live reminders nothing would cancel.
  it('cancels what it scheduled for a goal archived meanwhile', async () => {
    const release = holdScheduling();
    await seed([makeGoal({ id: 1, ...withReminders })]);
    const { result } = await renderGoals();

    let rescheduling!: Promise<RescheduleOutcome>;
    await act(async () => {
      rescheduling = result.current.rescheduleReminders(ar);
    });
    await act(async () => {
      await result.current.archiveGoal(1);
    });
    await act(async () => {
      release(['new']);
      await rescheduling;
    });

    expect(result.current.goals[0]).toMatchObject({ notificationsEnabled: false, notificationIds: [] });
    expect(cancelled).toHaveBeenCalledWith(['new']);
  });

  // Regression: two at once each started from the same stored ids, and the
  // first to finish won: switching language twice quickly could leave every
  // reminder in the one switched away from.
  it('lets the later of two overlapping calls win', async () => {
    const release = holdScheduling();
    scheduled.mockImplementationOnce(async () => ['en']);
    await seed([makeGoal({ id: 1, ...withReminders })]);
    const { result } = await renderGoals();

    let first!: Promise<RescheduleOutcome>;
    let second!: Promise<RescheduleOutcome>;
    await act(async () => {
      first = result.current.rescheduleReminders(ar);
      second = result.current.rescheduleReminders(reminder);
    });
    expect(scheduled).toHaveBeenCalledTimes(1); // the second waits its turn

    await act(async () => {
      release(['ar']);
      await first;
      await second;
    });
    expect(result.current.goals[0].notificationIds).toEqual(['en']);
    expect(cancelled).not.toHaveBeenCalledWith(['en']);
  });

  // Regression: saving reminder settings wrote them back whatever had happened
  // meanwhile, turning reminders on again for a goal archived in between -
  // and then, returning quietly instead, let the screen say they were set.
  it('does not turn reminders back on for a goal archived while saving them, and says so', async () => {
    const release = holdScheduling();
    await seed([makeGoal({ id: 1 })]);
    const { result } = await renderGoals();

    let saving!: Promise<void>;
    await act(async () => {
      saving = result.current.updateNotificationSettings(1, true, reminder, 540, [1]);
    });
    await act(async () => {
      await result.current.archiveGoal(1);
    });
    await act(async () => {
      release(['new']);
      await expect(saving).rejects.toThrow();
    });

    expect(result.current.goals[0]).toMatchObject({ isArchived: true, notificationsEnabled: false, notificationIds: [] });
    expect(cancelled).toHaveBeenCalledWith(['new']);
  });

  it('schedules every goal at once, not one after another', async () => {
    const release = holdScheduling();
    await seed([makeGoal({ id: 1, ...withReminders }), makeGoal({ id: 2, ...withReminders })]);
    const { result } = await renderGoals();

    let rescheduling!: Promise<RescheduleOutcome>;
    await act(async () => {
      rescheduling = result.current.rescheduleReminders(ar);
    });

    expect(scheduled).toHaveBeenCalledTimes(2); // the first is still being scheduled
    await act(async () => {
      release(['new']);
      await rescheduling;
    });
  });

  it('saves reminder settings only once a reschedule in progress is done', async () => {
    const release = holdScheduling();
    await seed([makeGoal({ id: 1, ...withReminders })]);
    const { result } = await renderGoals();

    let rescheduling!: Promise<RescheduleOutcome>;
    let saving!: Promise<void>;
    await act(async () => {
      rescheduling = result.current.rescheduleReminders(ar);
      saving = result.current.updateNotificationSettings(1, true, reminder, 600, [2]);
    });
    expect(scheduled).toHaveBeenCalledTimes(1); // the save waits its turn

    await act(async () => {
      release(['ar']);
      await rescheduling;
      await saving;
    });
    expect(result.current.goals[0]).toMatchObject({ notificationTime: 600, notificationIds: ['n1', 'n2'] });
  });
});

describe('RewardsContext: failures', () => {
  async function renderRewards() {
    const view = renderHook(() => useRewards(), {
      wrapper: ({ children }) => (
        <GoalsProvider>
          <RewardsProvider>{children}</RewardsProvider>
        </GoalsProvider>
      ),
    });
    await waitFor(() => expect(view.result.current.isLoading).toBe(false));
    return view;
  }

  const mutations: [string, (r: ReturnType<typeof useRewards>) => Promise<void>, string][] = [
    ['add', (r) => r.addReward('x', '', 1, '🎁'), 'Failed to add reward'],
    ['edit', (r) => r.editReward(1, 'x', '', 1, '🎁'), 'Failed to edit reward'],
    ['redeem', (r) => r.redeemReward(1), 'Failed to redeem reward'],
    ['remove', (r) => r.removeReward(1), 'Failed to remove reward'],
  ];

  for (const [name, run, message] of mutations) {
    it(`rejects and records the error when ${name} cannot be saved`, async () => {
      await AsyncStorage.setItem(
        REWARDS_KEY,
        JSON.stringify([{ id: 1, title: 'r', description: '', pointsCost: 1, icon: '🎁', createdAt: 1, isRedeemed: false }])
      );
      // So GoalsProvider's first load has nothing to write.
      await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, '0');
      const { result } = await renderRewards();
      const before = result.current.rewards;
      setItem.mockRejectedValueOnce(disk);

      await act(async () => {
        await expect(run(result.current)).rejects.toBe(disk);
      });

      expect(result.current.error).toBe(message);
      expect(result.current.rewards).toEqual(before);
    });
  }

  it('refuses to be used outside its provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useRewards())).toThrow(
      'useRewards must be used within a RewardsProvider'
    );
  });
});

describe('Theme and Language: failures and RTL', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <LanguageProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </LanguageProvider>
  );

  it('applies a theme change in memory even if it cannot be saved', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    await act(async () => {});
    setItem.mockRejectedValueOnce(disk);

    await act(async () => {
      await result.current.setThemeMode('dark');
    });

    expect(result.current.themeMode).toBe('dark');
  });

  it('applies a language change in memory even if it cannot be saved', async () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => {});
    setItem.mockRejectedValueOnce(disk);

    await act(async () => {
      await result.current.setLanguage('ar');
    });

    expect(result.current.language).toBe('ar');
  });

  it('flips layout direction when switching to and from Arabic', async () => {
    const forceRTL = jest.spyOn(I18nManager, 'forceRTL').mockImplementation(() => {});
    const { result } = renderHook(() => useLanguage(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.setLanguage('ar');
    });
    expect(forceRTL).toHaveBeenLastCalledWith(true);

    const rtl = jest.replaceProperty(I18nManager, 'isRTL', true);
    await act(async () => {
      await result.current.setLanguage('en');
    });
    expect(forceRTL).toHaveBeenLastCalledWith(false);

    rtl.restore();
    forceRTL.mockRestore();
  });

  it('refuse to be used outside their providers', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within a ThemeProvider');
    expect(() => renderHook(() => useLanguage())).toThrow(
      'useLanguage must be used within a LanguageProvider'
    );
  });
});
