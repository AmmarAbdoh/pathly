/**
 * Tests for the points rules the Rewards screen and auto-redemption share.
 */

import type { Reward } from '../../types';
import { getAvailablePoints, getSpentPoints } from '../points';

const reward = (pointsCost: number, isRedeemed: boolean): Reward => ({
  id: pointsCost,
  title: 'Reward',
  description: '',
  pointsCost,
  icon: '🎁',
  createdAt: 0,
  isRedeemed,
});

describe('getSpentPoints', () => {
  it('adds up what redeemed rewards cost', () => {
    expect(getSpentPoints([reward(30, true), reward(50, false), reward(20, true)])).toBe(50);
  });

  it('is nothing with nothing redeemed', () => {
    expect(getSpentPoints([])).toBe(0);
    expect(getSpentPoints([reward(30, false)])).toBe(0);
  });
});

describe('getAvailablePoints', () => {
  it('is what was earned less what was spent', () => {
    expect(getAvailablePoints(100, [reward(30, true), reward(50, false)])).toBe(70);
  });
});
