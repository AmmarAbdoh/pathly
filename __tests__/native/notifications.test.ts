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
import type { Goal } from '@/src/types';
// jest.mock calls are hoisted above imports, so the mocks below apply to them.
import * as Notifications from 'expo-notifications';
import {
  cancelAllNotifications,
  cancelGoalNotifications,
  checkNotificationPermissions,
  formatNotificationTime,
  getAllScheduledNotifications,
  getDayName,
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

let consoleError: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mocked.getPermissionsAsync.mockResolvedValue(granted);
  mocked.requestPermissionsAsync.mockResolvedValue(granted);
  let n = 0;
  mocked.scheduleNotificationAsync.mockImplementation(async () => `id-${n++}`);
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('permissions', () => {
  it('does not prompt when permission is already granted', async () => {
    expect(await requestNotificationPermissions()).toBe(true);
    expect(mocked.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('prompts when not yet granted, and reports the answer', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(denied);

    mocked.requestPermissionsAsync.mockResolvedValueOnce(granted);
    expect(await requestNotificationPermissions()).toBe(true);

    mocked.requestPermissionsAsync.mockResolvedValueOnce(denied);
    expect(await requestNotificationPermissions()).toBe(false);
  });

  it('creates the Android channel only on Android', async () => {
    await requestNotificationPermissions();
    expect(mocked.setNotificationChannelAsync).not.toHaveBeenCalled();

    const os = jest.replaceProperty(Platform, 'OS', 'android');
    await requestNotificationPermissions();
    os.restore();

    expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith(
      'goal-reminders',
      expect.objectContaining({ importance: Notifications.AndroidImportance.HIGH })
    );
  });

  it('reports false instead of throwing when the platform call fails', async () => {
    mocked.getPermissionsAsync.mockRejectedValue(new Error('boom'));
    expect(await requestNotificationPermissions()).toBe(false);
    expect(await checkNotificationPermissions()).toBe(false);
  });

  it('checks the current permission state', async () => {
    expect(await checkNotificationPermissions()).toBe(true);
    mocked.getPermissionsAsync.mockResolvedValue(denied);
    expect(await checkNotificationPermissions()).toBe(false);
  });
});

describe('scheduleGoalNotification', () => {
  const triggers = () =>
    mocked.scheduleNotificationAsync.mock.calls.map(([request]) => request.trigger);

  // Regression: the trigger had no `type`, so expo-notifications treated it as
  // "deliver now" - once, immediately - instead of weekly at the chosen time.
  it('produces triggers the library parses as weekly at the chosen time', async () => {
    await scheduleGoalNotification(goal({ notificationDays: [1] })); // Monday

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
    const ids = await scheduleGoalNotification(goal({ notificationDays: [0, 3, 6] }));

    expect(ids).toEqual(['id-0', 'id-1', 'id-2']);
    expect(triggers().map((t) => (t as { weekday: number }).weekday)).toEqual([1, 4, 7]);
  });

  it('defaults to every day when no days are chosen', async () => {
    const ids = await scheduleGoalNotification(goal({ notificationDays: [] }));
    expect(ids).toHaveLength(7);
  });

  it('names the goal in the reminder and links back to it', async () => {
    await scheduleGoalNotification(goal({ notificationDays: [2] }));

    const [[request]] = mocked.scheduleNotificationAsync.mock.calls;
    expect(request.content.body).toContain('Read');
    expect(request.content.data).toEqual({ goalId: 7 });
  });

  it('cancels a goal’s previous reminders before rescheduling', async () => {
    await scheduleGoalNotification(goal({ notificationIds: ['old-1', 'old-2'], notificationDays: [1] }));

    expect(mocked.cancelScheduledNotificationAsync.mock.calls).toEqual([['old-1'], ['old-2']]);
  });

  it('schedules nothing when reminders are disabled or have no time', async () => {
    expect(await scheduleGoalNotification(goal({ notificationsEnabled: false }))).toEqual([]);
    expect(await scheduleGoalNotification(goal({ notificationTime: undefined }))).toEqual([]);
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('refuses without permission', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(denied);
    await expect(scheduleGoalNotification(goal())).rejects.toThrow('permissions not granted');
  });

  it('propagates a scheduling failure', async () => {
    mocked.scheduleNotificationAsync.mockRejectedValueOnce(new Error('os said no'));
    await expect(scheduleGoalNotification(goal({ notificationDays: [1] }))).rejects.toThrow('os said no');
  });
});

describe('scheduleTestNotification', () => {
  it('fires once, a couple of seconds from now', async () => {
    await scheduleTestNotification();

    const [[request]] = mocked.scheduleNotificationAsync.mock.calls;
    expect(parseTrigger(request.trigger as never)).toMatchObject({
      type: 'timeInterval',
      seconds: 2,
      repeats: false,
    });
  });

  it('refuses without permission', async () => {
    mocked.getPermissionsAsync.mockResolvedValue(denied);
    await expect(scheduleTestNotification()).rejects.toThrow('permissions not granted');
  });
});

describe('cancelling and listing', () => {
  it('cancels each given reminder', async () => {
    await cancelGoalNotifications(['a', 'b']);
    expect(mocked.cancelScheduledNotificationAsync.mock.calls).toEqual([['a'], ['b']]);
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

