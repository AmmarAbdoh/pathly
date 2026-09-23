/**
 * Points: what has been spent, and what is left to spend.
 *
 * The Rewards screen and linked-reward redemption both use these, so a reward
 * is affordable by the same rule however it is redeemed.
 */

import type { Reward } from '../types';

/** The cost of every redeemed reward. */
export function getSpentPoints(rewards: readonly Reward[]): number {
  return rewards.reduce((sum, reward) => (reward.isRedeemed ? sum + reward.pointsCost : sum), 0);
}

/**
 * What the user can spend: lifetime points (which never decrease) less what
 * they have spent.
 */
export function getAvailablePoints(lifetimePoints: number, rewards: readonly Reward[]): number {
  return lifetimePoints - getSpentPoints(rewards);
}
