/**
 * Tests for goal reminder scheduling.
 *
 * The expo-notifications calls are mocked, but its enums are the real ones, and
 * every trigger we produce is run through the library's own `parseTrigger`. That
 * checks what expo-notifications actually does with our objects, rather than
 * what we assume it does - which is how an untyped weekly trigger shipped that
 * the library silently delivered once, immediately.
 */

import { Platform } from 'react-native';
import { parseTrigger } from 'expo-notifications/build/scheduleNotificationAsync';
import { translations } from '@/src/i18n/translations';
import type { Goal } from '@/src/types';
// jest.mock calls are hoisted above imports, so the mocks below apply to them.
import * as Notifications from 'expo-notifications';
import {
  cancelAllNotifications,
  cancelGoalNotifications,
  checkNotificationPermissions,
  formatNotificationTime,
  getAllScheduledNotifications,
  NotificationPermissionError,
  getDayName,
  renameReminderChannel,
  requestNotificationPermissions,
  scheduleGoalNotification,
  scheduleTestNotification,
  timeToMinutes,
} from '@/src/utils/notifications';

jest.mock('expo-notifications', () => ({
  ...jest.requireActual('expo-notifications/build/Notifications.types'),
  ...jest.requireActual('expo-notifications/build/NotificationChannelManager.types'),
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getAllScheduledNotificationsAsync: jest.fn(),
}));

const mocked = Notifications as jest.Mocked<typeof Notifications>;

// Captured now: the module registers this on load, before any test runs, and
// the beforeEach below clears every mock's call history.
const [registeredHandler] = mocked.setNotificationHandler.mock.calls[0];
const granted = { status: 'granted' } as Notifications.NotificationPermissionsStatus;
const denied = { status: 'denied' } as Notifications.NotificationPermissionsStatus;

const goal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: 7,
    title: 'Read',
    notificationsEnabled: true,
    notificationTime: 9 * 60 + 30, // 9:30
    ...overrides,
  }) as Goal;

const en = translations.en.notifications;
const ar = translations.ar.notifications;

let consoleError: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mocked.getPermissionsAsync.mockResolvedValue(granted);
  mocked.requestPermissionsAsync.mockResolvedValue(granted);
  let n = 0;
  mocked.scheduleNotificationAsync.mockImplementation(async () => `id-${n++}`);
  // Clears what a test queued and did not use, which clearAllMocks keeps.
  mocked.getNotificationChannelAsync.mockReset();
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
  // Platform.OS too, even if a test failed before putting it back.
  jest.restoreAllMocks();
});

describe('permissions', () => {
  it('does not prompt when permission is already granted', async () => {
    expect(await requestNotificationPermissions(en.channelName)).toBe(true);
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('prompts when not yet granted, and reports the answer', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(denied);

    mocked.requestPermissionsAsync.mockResolvedValueOnce(granted);
    expect(await requestNotificationPermissions(en.channelName)).toBe(true);

    mocked.requestPermissionsAsync.mockResolvedValueOnce(denied);
    expect(await requestNotificationPermissions(en.channelName)).toBe(false);
  });

  it('creates the Android channel only on Android', async () => {
    await requestNotificationPermissions(en.channelName);
    expect(mocked.setNotificationChannelAsync).not.toHaveBeenCalled();

    const os = jest.replaceProperty(Platform, 'OS', 'android');
    await requestNotificationPermissions(ar.channelName);
    os.restore();

    // Named in the user's language: Android shows it in the app's settings.
    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith(
      'goal-reminders',
      expect.objectContaining({ name: ar.channelName, importance: Notifications.AndroidImportance.HIGH })
    );
  });

  // Regression: the channel was named once, when permission was granted, and
  // kept that language whatever the app was switched to.
  it('renames the Android channel, if there is one', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    mocked.getNotificationChannelAsync.mockResolvedValueOnce(null);
    await renameReminderChannel(ar.channelName);
    expect(mocked.setNotificationChannelAsync).not.toHaveBeenCalled(); // none to rename

    mocked.getNotificationChannelAsync.mockResolvedValueOnce({ id: 'goal-reminders' } as never);
    await renameReminderChannel(ar.channelName);

    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith(
      'goal-reminders',
      expect.objectContaining({ name: ar.channelName })
    );
  });

  it('has no channel to rename off Android, and reports rather than throws', async () => {
    await renameReminderChannel(ar.channelName);
    expect(mocked.getNotificationChannelAsync).not.toHaveBeenCalled();

    jest.replaceProperty(Platform, 'OS', 'android');
    mocked.getNotificationChannelAsync.mockRejectedValueOnce(new Error('boom'));
    await expect(renameReminderChannel(ar.channelName)).resolves.toBeUndefined();
  });

  it('reports false instead of throwing when the platform call fails', async () => {
    mocked.getPermissionsAsync.mockRejectedValue(new Error('boom'));
    expect(await requestNotificationPermissions(en.channelName)).toBe(false);
    expect(await checkNotificationPermissions()).toBe(false);
  });

  it('checks the current permission state', async () => {
    expect(await checkNotificationPermissions()).toBe(true);
    mocked.getPermissionsAsync.mockResolvedValue(denied);
    expect(await checkNotificationPermissions()).toBe(false);
  });
});

describe('scheduleGoalNotification', () => {
  // Callers tell a refusal - nothing touched - from a failure part-way.
  it('is refused, with nothing cancelled, when notifications are not allowed', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(denied);

    await expect(scheduleGoalNotification(goal({ notificationIds: ['old'] }), en)).rejects.toBeInstanceOf(
      NotificationPermissionError
    );
    expect(mocked.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  // Regression: the title was passed to replace() as a string, where `$$` and
  // `$&` are patterns: "Make $$ online" became "Make $ online".
  it('puts the title in as written', async () => {
    await scheduleGoalNotification(goal({ title: 'Make $$ online $&', notificationDays: [1] }), en);
    const [[request]] = mocked.scheduleNotificationAsync.mock.calls;
    expect(request.content.body).toBe(en.reminderBody.replace('{goal}', () => 'Make $$ online $&'));
    expect(request.content.body).toContain('Make $$ online $&');
  });

  // Regression: the ones scheduled before the failure were never returned, so
  // nothing could cancel them - they fired weekly for good.
  it('cancels what it scheduled when a later one fails', async () => {
    mocked.scheduleNotificationAsync
      .mockResolvedValueOnce('first')
      .mockResolvedValueOnce('second')
      .mockRejectedValueOnce(new Error('too many pending'));

    await expect(scheduleGoalNotification(goal({ notificationDays: [1, 2, 3, 4] }), en)).rejects.toThrow(
      'too many pending'
    );

    expect(mocked.cancelScheduledNotificationAsync.mock.calls.map(([id]) => id)).toEqual(['first', 'second']);
  });

  const triggers = () =>
    mocked.scheduleNotificationAsync.mock.calls.map(([request]) => request.trigger);

  // Regression: the trigger had no `type`, so expo-notifications treated it as
  // "deliver now" - once, immediately - instead of weekly at the chosen time.
  it('produces triggers the library parses as weekly at the chosen time', async () => {
    await scheduleGoalNotification(goal({ notificationDays: [1] }), en); // Monday

    const [trigger] = triggers();
    expect(parseTrigger(trigger as never)).toEqual({
      type: 'weekly',
      weekday: 2, // expo counts Sunday as 1
      hour: 9,
      minute: 30,
      channelId: 'goal-reminders',
    });
  });

  it('schedules one reminder per selected day and returns their ids', async () => {
    const ids = await scheduleGoalNotification(goal({ notificationDays: [0, 3, 6] }), en);

    expect(ids).toEqual(['id-0', 'id-1', 'id-2']);
    expect(triggers().map((t) => (t as { weekday: number }).weekday)).toEqual([1, 4, 7]);
  });

  it('defaults to every day when no days are chosen', async () => {
    const ids = await scheduleGoalNotification(goal({ notificationDays: [] }), en);
    expect(ids).toHaveLength(7);
  });

  // Regression: the reminder was always in English.
  it('writes the reminder in the language it is given', async () => {
    await scheduleGoalNotification(goal({ title: 'قراءة', notificationDays: [2] }), ar);

    const [[request]] = mocked.scheduleNotificationAsync.mock.calls;
    expect(request.content.title).toBe(ar.reminderTitle);
    expect(request.content.body).toBe(ar.reminderBody.replace('{goal}', 'قراءة'));
  });

  it('names the goal in the reminder and links back to it', async () => {
    await scheduleGoalNotification(goal({ notificationDays: [2] }), en);

    const [[request]] = mocked.scheduleNotificationAsync.mock.calls;
    expect(request.content.body).toContain('Read');
    expect(request.content.data).toEqual({ goalId: 7 });
  });

  it('cancels a goal’s previous reminders before rescheduling', async () => {
    await scheduleGoalNotification(goal({ notificationIds: ['old-1', 'old-2'], notificationDays: [1] }), en);

    expect(mocked.cancelScheduledNotificationAsync.mock.calls).toEqual([['old-1'], ['old-2']]);
  });

  it('schedules nothing when reminders are disabled or have no time', async () => {
    expect(await scheduleGoalNotification(goal({ notificationsEnabled: false }), en)).toEqual([]);
    expect(await scheduleGoalNotification(goal({ notificationTime: undefined }), en)).toEqual([]);
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('refuses without permission', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(denied);
    await expect(scheduleGoalNotification(goal(), en)).rejects.toThrow('permissions not granted');
  });

  it('propagates a scheduling failure', async () => {
    mocked.scheduleNotificationAsync.mockRejectedValueOnce(new Error('os said no'));
    await expect(scheduleGoalNotification(goal({ notificationDays: [1] }), en)).rejects.toThrow('os said no');
  });
});

describe('scheduleTestNotification', () => {
  it('is written in the language it is given', async () => {
    await scheduleTestNotification(ar);

    const [[request]] = mocked.scheduleNotificationAsync.mock.calls;
    expect(request.content).toMatchObject({ title: ar.testTitle, body: ar.testBody });
  });

  it('fires once, a couple of seconds from now', async () => {
    await scheduleTestNotification(en);

    const [[request]] = mocked.scheduleNotificationAsync.mock.calls;
    expect(parseTrigger(request.trigger as never)).toMatchObject({
      type: 'timeInterval',
      seconds: 2,
      repeats: false,
    });
  });

  it('refuses without permission', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(denied);
    await expect(scheduleTestNotification(en)).rejects.toThrow('permissions not granted');
  });
});

describe('cancelling and listing', () => {
  it('cancels each given reminder', async () => {
    await cancelGoalNotifications(['a', 'b']);
    expect(mocked.cancelScheduledNotificationAsync.mock.calls).toEqual([['a'], ['b']]);
  });

  // One after another, an import over many goals held up every reward change
  // behind them; and the first failure stopped the rest.
  it('cancels them all at once, each on its own', async () => {
    mocked.cancelScheduledNotificationAsync
      .mockImplementationOnce(() => new Promise(() => {})) // never finishes
      .mockRejectedValueOnce(new Error('gone already'));

    void cancelGoalNotifications(['a', 'b', 'c']);
    await Promise.resolve();

    expect(mocked.cancelScheduledNotificationAsync.mock.calls).toEqual([['a'], ['b'], ['c']]);
  });

  it('cancels everything', async () => {
    await cancelAllNotifications();
    expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  });

  it('lists scheduled reminders', async () => {
    mocked.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
      { identifier: 'x' },
    ] as Notifications.NotificationRequest[]);
    expect(await getAllScheduledNotifications()).toEqual([{ identifier: 'x' }]);
  });

  it('never throws from cancel or list', async () => {
    const boom = new Error('boom');
    mocked.cancelScheduledNotificationAsync.mockRejectedValueOnce(boom);
    mocked.cancelAllScheduledNotificationsAsync.mockRejectedValueOnce(boom);
    mocked.getAllScheduledNotificationsAsync.mockRejectedValueOnce(boom);

    await expect(cancelGoalNotifications(['a'])).resolves.toBeUndefined();
    await expect(cancelAllNotifications()).resolves.toBeUndefined();
    await expect(getAllScheduledNotifications()).resolves.toEqual([]);
  });
});

describe('time and day helpers', () => {
  const times: [number, string][] = [
    [0, '12:00 AM'],
    [9 * 60 + 5, '9:05 AM'],
    [12 * 60, '12:00 PM'],
    [23 * 60 + 59, '11:59 PM'],
  ];

  for (const [minutes, label] of times) {
    it(`formats ${minutes} minutes past midnight as ${label}`, () => {
      expect(formatNotificationTime(minutes)).toBe(label);
    });
  }

  it('converts a time of day to minutes past midnight', () => {
    expect(timeToMinutes(9, 30)).toBe(570);
    expect(formatNotificationTime(timeToMinutes(18, 45))).toBe('6:45 PM');
  });

  it('names days, long or short', () => {
    expect(getDayName(0)).toBe('Sunday');
    expect(getDayName(6, true)).toBe('Sat');
  });
});

describe('foreground display', () => {
  // The handler registered when this module loads is what makes a reminder
  // appear while the app is open. GoalsContext imports the module at startup
  // so it is in place before the first reminder can arrive.
  it('shows reminders that arrive while the app is open', async () => {
    await expect(
      registeredHandler!.handleNotification({} as Notifications.Notification)
    ).resolves.toMatchObject({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
    });
  });
});

