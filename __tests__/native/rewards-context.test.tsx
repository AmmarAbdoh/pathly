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

/** Fail every write of `key` until `recover()` is called. */
function failWrites(key: string) {
  let failing = true;
  setItem.mockImplementation(async (writeKey: string, value: string) => {
    if (failing && writeKey === key) throw disk;
    return realSetItem(writeKey, value);
  });
  return {
    recover: () => {
      failing = false;
    },
  };
}

async function seedLinkedGoal(rewardCost: number, lifetime = 0, goalPoints = 50) {
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 7, pointsCost: rewardCost })]));
  await AsyncStorage.setItem(
    STORAGE_KEYS.GOALS,
    JSON.stringify([makeGoal({ linkedRewardId: 7, points: goalPoints })])
  );
  await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, String(lifetime));
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

// Regression: changes overlapped. When the later one's write failed, its
// undo restored the state it had built on - including an earlier change whose
// own write had failed too, and which the user had been told failed.
it('never shows a change that failed, however changes overlap', async () => {
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward()]));
  const { result } = await renderRewards();
  const before = result.current.rewards;
  failWrites(REWARDS_KEY);

  await act(async () => {
    const redeem = result.current.redeemReward(1);
    const add = result.current.addReward('New', '', 10, '🎁');
    await expect(redeem).rejects.toBe(disk);
    await expect(add).rejects.toBe(disk);
  });

  expect(result.current.rewards).toEqual(before);
});

it('does not write when a change changes nothing', async () => {
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward()]));
  const { result } = await renderRewards();
  setItem.mockClear();

  await act(async () => {
    await result.current.withRewardsHeld((rewards, write) => write(rewards));
  });

  expect(setItem).not.toHaveBeenCalled();
});

describe('linked rewards', () => {
  it('redeems a goal-linked reward, in memory and on disk, when the goal is finished', async () => {
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 7, pointsCost: 30 })]));
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
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 7, pointsCost: 30 })]));
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

  // Regression: the detail screen's "Mark complete" sets the target (which
  // completes the goal) and then calls finishGoal - which saw the goal already
  // complete, so nothing was ever redeemed.
  it('redeems when the goal is completed by reaching its target', async () => {
    await seedLinkedGoal(30);
    const { result } = await renderBoth();

    await act(async () => {
      await result.current.goals.updateGoal(1, 10);
      await result.current.goals.finishGoal(1);
    });

    expect(result.current.rewards.getRedeemedRewards().map((r) => r.id)).toEqual([7]);
  });

  // Regression: auto-redeem skipped the check the Rewards screen makes, so
  // the available balance (earned - spent) could go negative.
  it('leaves a reward the user cannot afford yet to be redeemed by hand', async () => {
    await seedLinkedGoal(500, 40, 10);
    const { result } = await renderBoth();

    await act(async () => {
      await result.current.goals.finishGoal(1);
    });

    expect(result.current.rewards.getAvailableRewards().map((r) => r.id)).toEqual([7]);
    expect(result.current.rewards.storageError).toBeNull();
  });

  it('counts what has already been spent', async () => {
    // 100 earned + 20 from the goal, 80 already spent: 40 left, short of 50.
    await seedLinkedGoal(50, 100, 20);
    await AsyncStorage.setItem(
      REWARDS_KEY,
      JSON.stringify([
        makeReward({ id: 7, pointsCost: 50 }),
        makeReward({ id: 8, pointsCost: 80, isRedeemed: true, redeemedAt: 1 }),
      ])
    );
    const { result } = await renderBoth();

    await act(async () => {
      await result.current.goals.finishGoal(1);
    });

    expect(result.current.rewards.getAvailableRewards().map((r) => r.id)).toEqual([7]);
  });

  it('counts the points the goal itself just earned', async () => {
    await seedLinkedGoal(50, 0, 50);
    const { result } = await renderBoth();

    await act(async () => {
      await result.current.goals.finishGoal(1);
    });

    expect(result.current.rewards.getRedeemedRewards().map((r) => r.id)).toEqual([7]);
  });

  // Regression: the listener fired even when the completion itself could not
  // be saved, redeeming for good a reward whose completion the reload then
  // threw away.
  it('redeems nothing for a completion that cannot be saved', async () => {
    await seedLinkedGoal(30);
    let goalsReadFails = true;
    getItem.mockImplementation(async (key: string) => {
      if (goalsReadFails && key === STORAGE_KEYS.GOALS) throw disk;
      return realGetItem(key);
    });
    const { result } = await renderBoth();
    goalsReadFails = false;

    await act(async () => {
      // Worth more than the reward costs, so only the unsaved completion
      // stops the redemption.
      await result.current.goals.addGoal(
        'Linked', 10, 0, 'x', 'increase', 50, 'daily',
        undefined, undefined, false, false, undefined, undefined, 7 // linkedRewardId
      );
    });
    const [added] = result.current.goals.goals;
    await act(async () => {
      await result.current.goals.finishGoal(added.id);
    });

    expect((await storedRewards())[0].isRedeemed).toBe(false);
  });

  // Regression: a redemption that failed was only logged - never retried, and
  // never shown to the user.
  it('reports a redemption that could not be saved, and Retry makes it', async () => {
    await seedLinkedGoal(30);
    const { result } = await renderBoth();
    const storage = failWrites(REWARDS_KEY);

    await act(async () => {
      await result.current.goals.finishGoal(1);
    });
    expect(result.current.rewards.storageError).toBe('save');
    expect(result.current.goals.goals[0].isComplete).toBe(true);

    storage.recover();
    await act(async () => {
      await result.current.rewards.retryStorage();
    });

    expect(result.current.rewards.storageError).toBeNull();
    expect((await storedRewards())[0].isRedeemed).toBe(true);
  });

  it('makes a redemption once rewards that failed to load are loaded', async () => {
    await seedLinkedGoal(30);
    failRewardsReads();
    const { result } = await renderBoth();

    await act(async () => {
      await result.current.goals.finishGoal(1);
    });
    expect(result.current.rewards.storageError).toBe('load');

    getItem.mockImplementation(realGetItem);
    await act(async () => {
      await result.current.rewards.retryStorage();
    });

    expect(result.current.rewards.getRedeemedRewards().map((r) => r.id)).toEqual([7]);
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
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 7, pointsCost: 30 })]));
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
    await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward({ id: 7, pointsCost: 30 })]));
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

  // Regression: corrupt data failed every load, so nothing could ever be
  // changed again - with no way out but clearing the app's data.
  it('keeps unreadable data aside and starts over, rather than blocking for good', async () => {
    await AsyncStorage.setItem(REWARDS_KEY, '{corrupt');
    const { result } = await renderRewards();

    expect(result.current.storageError).toBeNull();
    expect(result.current.dataSetAside).toBe(true);
    await act(async () => {
      await result.current.addReward('New', '', 10, '🎁');
    });

    expect((await storedRewards()).map((r) => r.title)).toEqual(['New']);
    const keys = await AsyncStorage.getAllKeys();
    const aside = keys.find((key) => key.startsWith(`${REWARDS_KEY}.unreadable.`))!;
    expect(await AsyncStorage.getItem(aside)).toBe('{corrupt');
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
