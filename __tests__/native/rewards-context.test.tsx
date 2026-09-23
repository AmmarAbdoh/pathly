/**
 * RewardsContext, rendered for real.
 */

import { REWARDS_KEY } from '@/src/constants/storage-keys';
import { RewardsProvider, useRewards } from '@/src/context/RewardsContext';
import { Reward } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

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

async function storedRewards(): Promise<Reward[]> {
  return JSON.parse((await AsyncStorage.getItem(REWARDS_KEY)) ?? '[]');
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <RewardsProvider>{children}</RewardsProvider>
);

async function renderRewards() {
  const view = renderHook(() => useRewards(), { wrapper });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

beforeEach(async () => {
  await AsyncStorage.clear();
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

it('picks up a redemption written behind its back when refreshed', async () => {
  // GoalsContext auto-redeems a linked reward by writing storage directly, so
  // this provider only sees it after a refresh - which is what the Rewards
  // screen's pull-to-refresh is wired to.
  await AsyncStorage.setItem(REWARDS_KEY, JSON.stringify([makeReward()]));
  const { result } = await renderRewards();
  expect(result.current.getAvailableRewards()).toHaveLength(1);

  await AsyncStorage.setItem(
    REWARDS_KEY,
    JSON.stringify([makeReward({ isRedeemed: true, redeemedAt: Date.now() })])
  );
  expect(result.current.getAvailableRewards()).toHaveLength(1); // still stale

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

