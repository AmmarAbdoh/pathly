/**
 * Failure paths and lifecycle edges of the providers: disk errors, a failed
 * load, backgrounding, notification scheduling, malformed input, and misuse
 * outside a provider.
 */

import { REWARDS_KEY, STORAGE_KEYS } from '@/src/constants/storage-keys';
import { GoalsProvider, useGoals } from '@/src/context/GoalsContext';
import { LanguageProvider, useLanguage } from '@/src/context/LanguageContext';
import { RewardsProvider, useRewards } from '@/src/context/RewardsContext';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';
import type { Goal } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';
import { AppState, I18nManager } from 'react-native';
import * as notifications from '@/src/utils/notifications';

jest.mock('@/src/utils/notifications', () => ({
  scheduleGoalNotification: jest.fn(async () => ['n1', 'n2']),
  cancelGoalNotifications: jest.fn(async () => {}),
}));

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

  it('does not rewrite storage on load when nothing changed', async () => {
    await seed([makeGoal()]);
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
      await result.current.updateNotificationSettings(1, true, 540, [1, 3]);
    });

    expect(scheduled).toHaveBeenCalledWith(
      expect.objectContaining({ notificationTime: 540, notificationDays: [1, 3] })
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
      await result.current.updateNotificationSettings(1, false);
    });

    expect(cancelled).toHaveBeenCalledWith(['old']);
    expect(result.current.goals[0]).toMatchObject({ notificationsEnabled: false, notificationIds: [] });
  });

  it('leaves settings untouched when scheduling fails', async () => {
    scheduled.mockRejectedValueOnce(new Error('permission denied'));
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await expect(result.current.updateNotificationSettings(1, true, 540)).rejects.toThrow(
        'permission denied'
      );
    });

    expect(result.current.goals[0].notificationsEnabled).toBeFalsy();
    expect(result.current.error).toBe('Failed to update notification settings');
  });

  it('does nothing for a goal that does not exist', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateNotificationSettings(999, true, 540);
    });

    expect(scheduled).not.toHaveBeenCalled();
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
