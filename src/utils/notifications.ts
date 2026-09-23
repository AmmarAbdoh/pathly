/**
 * Notification utilities for managing goal reminders
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Translations } from '../i18n/translations';
import type { Goal } from '../types';

/** A reminder's wording, in the user's language. */
export type ReminderText = Pick<Translations['notifications'], 'reminderTitle' | 'reminderBody'>;

/** The test notification's wording, in the user's language. */
export type TestNotificationText = Pick<Translations['notifications'], 'testTitle' | 'testBody'>;

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 *
 * `channelName` is what Android lists the reminders as in the app's
 * notification settings, in the user's language.
 */
export async function requestNotificationPermissions(channelName: string): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // For Android, configure notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('goal-reminders', {
        name: channelName,
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Check if notification permissions are granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
}

/**
 * Schedule a notification for a goal
 *
 * The text is fixed when scheduled: after a language change or a rename,
 * GoalsContext's rescheduleReminders schedules them again.
 */
export async function scheduleGoalNotification(goal: Goal, text: ReminderText): Promise<string[]> {
  try {
    // Check permissions first
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    // Cancel existing notifications for this goal
    if (goal.notificationIds && goal.notificationIds.length > 0) {
      await cancelGoalNotifications(goal.notificationIds);
    }

    // If notifications are disabled for this goal, return empty array
    if (!goal.notificationsEnabled || goal.notificationTime === undefined) {
      return [];
    }

    const notificationIds: string[] = [];

    // Calculate hour and minute from notificationTime (minutes from midnight)
    const hour = Math.floor(goal.notificationTime / 60);
    const minute = goal.notificationTime % 60;

    // Get days to schedule (default to all days if not specified)
    const daysToSchedule = goal.notificationDays && goal.notificationDays.length > 0 
      ? goal.notificationDays 
      : [0, 1, 2, 3, 4, 5, 6];

    // Schedule a notification for each selected day. If one fails, cancel the
    // ones already scheduled: never returned, nothing could cancel them later.
    try {
      for (const weekday of daysToSchedule) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: text.reminderTitle,
            body: text.reminderBody.replace('{goal}', goal.title),
            data: { goalId: goal.id },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          // `type` is required. Without it expo-notifications cannot tell this is a
          // weekly trigger: the object still passes validation (it has a
          // channelId) but falls through every typed parser, and is delivered
          // IMMEDIATELY and only once - on iOS as a null trigger, on Android as a
          // bare channel trigger. Weekly triggers always repeat, so no `repeats`.
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            channelId: 'goal-reminders',
            weekday: weekday + 1, // expo-notifications uses 1-7 for Sunday-Saturday
            hour,
            minute,
          },
        });

        notificationIds.push(notificationId);
      }
    } catch (error) {
      await cancelGoalNotifications(notificationIds);
      throw error;
    }

    return notificationIds;
  } catch (error) {
    console.error('Error scheduling goal notification:', error);
    throw error;
  }
}

/**
 * Cancel notifications for a goal
 */
export async function cancelGoalNotifications(notificationIds: string[]): Promise<void> {
  try {
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
}

/**
 * Get all scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Convert minutes from midnight to a readable time string
 */
export function formatNotificationTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Convert time (hour, minute) to minutes from midnight
 */
export function timeToMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/**
 * Get day names for display
 */
export function getDayName(dayIndex: number, short: boolean = false): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const shortNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return short ? shortNames[dayIndex] : dayNames[dayIndex];
}

/**
 * Schedule an immediate test notification
 */
export async function scheduleTestNotification(text: TestNotificationText): Promise<void> {
  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: text.testTitle,
        body: text.testBody,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
  } catch (error) {
    console.error('Error scheduling test notification:', error);
    throw error;
  }
}
