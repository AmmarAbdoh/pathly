/**
 * RewardsContext, rendered for real - inside GoalsProvider, as in the app,
 * because it listens there for goals being finished.
 */

import { REWARDS_KEY, STORAGE_KEYS } from '@/src/constants/storage-keys';
import { GoalsProvider, useGoals } from '@/src/context/GoalsContext';
import { RewardsProvider, useRewards } from '@/src/context/RewardsContext';
import { Goal, Reward } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

const disk = new Error('disk full');
const getItem = AsyncStorage.getItem as jest.Mock;
const setItem = AsyncStorage.setItem as jest.Mock;

const makeReward = (overrides: Partial<Reward> = {}): Reward => ({
  id: 1,
  title: 'Movie night',
  description: 'Any film',
  pointsCost: 100,
  icon: '🎬',
  createdAt: Date.now(),
  isRedeemed: false,
  ...overrides,
});

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

async function storedRewards(): Promise<Reward[]> {
  return JSON.parse((await AsyncStorage.getItem(REWARDS_KEY)) ?? '[]');
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GoalsProvider>
    <RewardsProvider>{children}</RewardsProvider>
  </GoalsProvider>
);

async function renderRewards() {
  const view = renderHook(() => useRewards(), { wrapper });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

async function renderBoth() {
  const view = renderHook(() => ({ goals: useGoals(), rewards: useRewards() }), { wrapper });
  await waitFor(() => {
    expect(view.result.current.goals.isLoading).toBe(false);
    expect(view.result.current.rewards.isLoading).toBe(false);
  });
  return view;
}

const realGetItem = getItem.getMockImplementation()!;
const realSetItem = setItem.getMockImplementation()!;

/** Fail every read of the rewards key until restored. */
function failRewardsReads() {
  getItem.mockImplementation(async (key: string) => {
    if (key === REWARDS_KEY) throw disk;
    return realGetItem(key);
  });
}

let consoleError: jest.SpyInstance;

beforeEach(async () => {
  await AsyncStorage.clear();
  // Seeded so GoalsProvider's first load has nothing to write.
  await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, '0');
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  getItem.mockImplementation(realGetItem);
  setItem.mockImplementation(realSetItem);
  consoleError.mockRestore();
});

it('loads persisted rewards on mount', async () => {
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward()]));
  const { result } = await renderRewards();

  expect(result.current.rewards).toHaveLength(1);
  expect(result.current.rewards[0].title).toBe('Movie night');
});

it('adds a reward and persists it', async () => {
  const { result } = await renderRewards();

  await act(async () => {
    await result.current.addReward('Coffee', 'A nice one', 20, '☕');
  });

  expect(result.current.rewards).toHaveLength(1);
  expect((await storedRewards())[0]).toMatchObject({ title: 'Coffee', pointsCost: 20 });
});

it('moves a redeemed reward from available to redeemed', async () => {
  await AsyncStorage.setItem(
    REWARDS_KEY,
    JSON.stringify([makeReward({ id: 1 }), makeReward({ id: 2, title: 'Book' })])
  );
  const { result } = await renderRewards();

  await act(async () => {
    await result.current.redeemReward(1);
  });

  expect(result.current.getAvailableRewards().map((r) => r.id)).toEqual([2]);
  expect(result.current.getRedeemedRewards().map((r) => r.id)).toEqual([1]);
  expect((await storedRewards()).find((r) => r.id === 1)?.isRedeemed).toBe(true);
});

it('removes a reward', async () => {
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward()]));
  const { result } = await renderRewards();

  await act(async () => {
    await result.current.removeReward(1);
  });

  expect(result.current.rewards).toHaveLength(0);
  expect(await storedRewards()).toHaveLength(0);
});

it('re-reads storage when refreshed', async () => {
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward()]));
  const { result } = await renderRewards();
  expect(result.current.getAvailableRewards()).toHaveLength(1);

  await AsyncStorage.setItem(
    REWARDS_KEY,
    JSON.stringify([makeReward({ isRedeemed: true, redeemedAt: Date.now() })])
  );

  await act(async () => {
    await result.current.refreshRewards();
  });

  expect(result.current.getAvailableRewards()).toHaveLength(0);
  expect(result.current.getRedeemedRewards()).toHaveLength(1);
});

// Regression: the mutators closed over a stale `rewards` array, so rewards
// added before a re-render overwrote each other - importing five kept one.
it('keeps every reward added back to back, each with its own id', async () => {
  const { result } = await renderRewards();

  await act(async () => {
    for (let i = 0; i < 5; i += 1) {
      await result.current.addReward(`Reward ${i}`, '', 10, '🎁');
    }
  });

  expect(result.current.rewards).toHaveLength(5);
  expect(new Set(result.current.rewards.map((r) => r.id)).size).toBe(5);
  expect(await storedRewards()).toHaveLength(5);
});

it('applies back-to-back mutations to the latest state', async () => {
  await AsyncStorage.setItem(
    REWARDS_KEY,
    JSON.stringify([makeReward({ id: 1 }), makeReward({ id: 2 })])
  );
  const { result } = await renderRewards();

  await act(async () => {
    await result.current.redeemReward(1);
    await result.current.redeemReward(2);
  });

  expect(result.current.getRedeemedRewards()).toHaveLength(2);
});

it('edits a reward', async () => {
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward()]));
  const { result } = await renderRewards();

  await act(async () => {
    await result.current.editReward(1, '  Cinema  ', ' Any seat ', 150, '🍿');
  });

  expect(result.current.rewards[0]).toMatchObject({
    title: 'Cinema',
    description: 'Any seat',
    pointsCost: 150,
    icon: '🍿',
  });
  expect((await storedRewards())[0].title).toBe('Cinema');
});

it('takes a change back off the screen when it cannot be saved', async () => {
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward()]));
  const { result } = await renderRewards();
  setItem.mockRejectedValueOnce(disk);

  await act(async () => {
    await expect(result.current.redeemReward(1)).rejects.toBe(disk);
  });

  // The screen reported the failure; it must not also show the redemption.
  expect(result.current.getAvailableRewards()).toHaveLength(1);
});

it('does not write when a change changes nothing', async () => {
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward()]));
  const { result } = await renderRewards();
  setItem.mockClear();

  await act(async () => {
    await result.current.replaceAllRewards(result.current.rewards);
  });

  expect(setItem).not.toHaveBeenCalled();
});

describe('linked rewards', () => {
  it('redeems a goal-linked reward, in memory and on disk, when the goal is finished', async () => {
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 7 })]));
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([makeGoal({ linkedRewardId: 7 })]));
    const { result } = await renderBoth();

    await act(async () => {
      await result.current.goals.finishGoal(1);
    });

    expect(result.current.rewards.getRedeemedRewards().map((r) => r.id)).toEqual([7]);
    expect((await storedRewards())[0].isRedeemed).toBe(true);
  });

  // Regression: GoalsContext redeemed by writing rewards storage directly, so
  // this provider still held the reward as unredeemed - and its next save
  // wrote that back, un-redeeming it and effectively refunding its cost.
  it('keeps the redemption through later reward changes', async () => {
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 7 })]));
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([makeGoal({ linkedRewardId: 7 })]));
    const { result } = await renderBoth();

    await act(async () => {
      await result.current.goals.finishGoal(1);
    });
    await act(async () => {
      await result.current.rewards.addReward('Another', '', 10, '🎁');
    });

    expect((await storedRewards()).find((r) => r.id === 7)?.isRedeemed).toBe(true);
  });

  it('leaves an already-redeemed or missing linked reward alone', async () => {
    const redeemed = makeReward({ id: 3, isRedeemed: true, redeemedAt: 1 });
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([redeemed]));
    await AsyncStorage.setItem(
      STORAGE_KEYS.GOALS,
      JSON.stringify([makeGoal({ id: 1, linkedRewardId: 3 }), makeGoal({ id: 2, linkedRewardId: 99 })])
    );
    const { result } = await renderBoth();

    await act(async () => {
      await result.current.goals.finishGoal(1);
      await result.current.goals.finishGoal(2);
    });

    expect(await storedRewards()).toEqual([redeemed]);
  });

  it('still completes the goal when the linked reward cannot be redeemed', async () => {
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 7 })]));
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([makeGoal({ linkedRewardId: 7 })]));
    const { result } = await renderBoth();
    setItem.mockImplementation(async (key: string, value: string) => {
      if (key === REWARDS_KEY) throw disk;
      return realSetItem(key, value);
    });

    await act(async () => {
      await result.current.goals.finishGoal(1);
    });

    expect(result.current.goals.goals[0].isComplete).toBe(true);
    expect(result.current.goals.lifetimePointsEarned).toBe(50);
    expect(result.current.rewards.getRedeemedRewards()).toHaveLength(0);
  });

  it('stops listening once unmounted', async () => {
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 7 })]));
    await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify([makeGoal({ linkedRewardId: 7 })]));
    const { result, unmount } = await renderBoth();
    const { finishGoal } = result.current.goals;
    unmount();
    setItem.mockClear();

    await act(async () => {
      await finishGoal(1);
    });

    expect(setItem).not.toHaveBeenCalledWith(REWARDS_KEY, expect.anything());
  });
});

describe('a failed load', () => {
  // Regression: a failed read returned [], so the next change saved a list
  // holding only that change over every stored reward.
  it('reports it and refuses changes rather than writing over stored rewards', async () => {
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 1, title: 'Keep me' })]));
    failRewardsReads();
    const { result } = await renderRewards();
    expect(result.current.storageError).toBe('load');

    await act(async () => {
      await expect(result.current.addReward('New', '', 10, '🎁')).rejects.toThrow();
    });

    getItem.mockImplementation(realGetItem);
    expect((await storedRewards()).map((r) => r.title)).toEqual(['Keep me']);
  });

  it('treats corrupt data as a failed load, not as no rewards', async () => {
    await AsyncStorage.setItem(REWARDS_KEY, '{corrupt');
    const { result } = await renderRewards();

    expect(result.current.storageError).toBe('load');
    await act(async () => {
      await expect(result.current.addReward('New', '', 10, '🎁')).rejects.toThrow();
    });
    expect(await AsyncStorage.getItem(REWARDS_KEY)).toBe('{corrupt');
  });

  it('raises the error again on the next change after it was dismissed', async () => {
    failRewardsReads();
    const { result } = await renderRewards();

    act(() => result.current.dismissStorageError());
    expect(result.current.storageError).toBeNull();

    await act(async () => {
      await expect(result.current.addReward('New', '', 10, '🎁')).rejects.toThrow();
    });
    expect(result.current.storageError).toBe('load');
  });

  it('recovers when a refresh can read storage again', async () => {
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 1, title: 'Keep me' })]));
    failRewardsReads();
    const { result } = await renderRewards();

    getItem.mockImplementation(realGetItem);
    await act(async () => {
      await result.current.refreshRewards();
    });
    await act(async () => {
      await result.current.addReward('New', '', 10, '🎁');
    });

    expect(result.current.storageError).toBeNull();
    expect((await storedRewards()).map((r) => r.title)).toEqual(['Keep me', 'New']);
  });
});
