/**
 * The points ledger: payouts, a ledger rebuilt from history, and the history
 * screen's rows.
 */

import type { Goal, PointsEntry, Reward } from '../../types';
import {
  appendEntries,
  bonusEntry,
  buildPointsHistory,
  completionEntry,
  ledgerFromHistory,
  ledgerTotal,
  pointsEarnedBetween,
  readLedgerEntries,
} from '../points-ledger';

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

const goal = (overrides: Partial<Goal>): Goal => ({
  id: 1,
  title: 'Read',
  current: 0,
  target: 10,
  unit: 'books',
  initialValue: 0,
  direction: 'increase',
  progress: 0,
  points: 50,
  period: 'weekly',
  createdAt: NOW - 30 * DAY,
  isComplete: false,
  ...overrides,
});

const entry = (overrides: Partial<PointsEntry>): PointsEntry => ({
  id: 1,
  at: NOW,
  points: 10,
  reason: 'completion',
  ...overrides,
});

describe('ledgerTotal', () => {
  it('adds up every entry', () => {
    expect(ledgerTotal([entry({ points: 50 }), entry({ id: 2, points: 25, reason: 'carried' })])).toBe(75);
    expect(ledgerTotal([])).toBe(0);
  });
});

describe('completionEntry', () => {
  it("records the goal, its title and the time, after the ledger's ids", () => {
    const ledger = [entry({ id: NOW + 5 })];

    expect(completionEntry(ledger, { id: 7, title: 'Run' }, 30, NOW)).toEqual({
      id: NOW + 6,
      at: NOW,
      points: 30,
      reason: 'completion',
      goalId: 7,
      goalTitle: 'Run',
    });
  });
});

describe('ledgerFromHistory', () => {
  it('has an entry for each paid completion, oldest first', () => {
    const ledger = ledgerFromHistory(
      [
        goal({ id: 1, title: 'Read', points: 50, isComplete: true, completedAt: NOW - DAY }),
        goal({
          id: 2,
          title: 'Water',
          points: 10,
          isRecurring: true,
          completionHistory: [NOW - 3 * DAY, NOW - 2 * DAY],
        }),
      ],
      null,
      NOW
    );

    expect(ledger.map((e) => [e.goalTitle, e.at, e.points])).toEqual([
      ['Water', NOW - 3 * DAY, 10],
      ['Water', NOW - 2 * DAY, 10],
      ['Read', NOW - DAY, 50],
    ]);
    expect(new Set(ledger.map((e) => e.id)).size).toBe(3);
  });

  // The one rule for what paid, as awardPointsForGoal applies it.
  it("counts a subgoal only when its parent pays subgoals' points", () => {
    const done = { isComplete: true, completedAt: NOW - DAY };
    const ledger = ledgerFromHistory(
      [
        goal({ id: 1, subGoals: [2], subgoalsAwardPoints: false }),
        goal({ id: 2, parentId: 1, points: 20, ...done }),
        goal({ id: 3, subGoals: [4], subgoalsAwardPoints: true }),
        goal({ id: 4, parentId: 3, points: 25, ...done }),
      ],
      null,
      NOW
    );

    expect(ledger.map((e) => e.goalId)).toEqual([4]);
  });

  it('counts a goal complete with no time for it, undated', () => {
    const ledger = ledgerFromHistory([goal({ isComplete: true, completedAt: undefined })], null, NOW);

    expect(ledger).toEqual([expect.objectContaining({ at: 0, points: 50, reason: 'completion' })]);
  });

  it('counts a goal set back and completed again once', () => {
    const ledger = ledgerFromHistory([goal({ isComplete: false, completedAt: NOW - DAY })], null, NOW);

    expect(ledgerTotal(ledger)).toBe(50);
  });

  it('skips completion times and points that are not numbers', () => {
    const ledger = ledgerFromHistory(
      [
        goal({ id: 1, isRecurring: true, completionHistory: [Infinity, -1, NOW] as number[] }),
        goal({ id: 2, points: NaN, completedAt: NOW }),
      ],
      null,
      NOW
    );

    expect(ledger.map((e) => e.at)).toEqual([NOW]);
  });

  it('carries in what the history does not account for, undated', () => {
    const ledger = ledgerFromHistory([goal({ isComplete: true, completedAt: NOW })], 405, NOW);

    expect(ledger[0]).toMatchObject({ at: 0, points: 355, reason: 'carried' });
    expect(ledgerTotal(ledger)).toBe(405);
  });

  // Points edited up after they were paid: the history says more than was paid.
  it('carries the known total in whole when the history comes to more', () => {
    const ledger = ledgerFromHistory([goal({ points: 500, isComplete: true, completedAt: NOW })], 50, NOW);

    expect(ledger).toEqual([expect.objectContaining({ at: 0, points: 50, reason: 'carried' })]);
  });

  it('is empty for a total of nothing', () => {
    expect(ledgerFromHistory([goal({ isComplete: true, completedAt: NOW })], 0, NOW)).toEqual([]);
  });
});

describe('readLedgerEntries', () => {
  it('keeps good entries as they are', () => {
    const good = entry({ id: 5, goalId: 3, goalTitle: 'Read' });

    expect(readLedgerEntries([good], undefined, NOW)).toEqual([good]);
  });

  it('drops only entries whose points are not a positive number', () => {
    const read = readLedgerEntries(
      [entry({ points: 0 }), entry({ points: -5 }), { points: '10' }, null, 'x', [], entry({ id: 9 })],
      undefined,
      NOW
    );

    expect(read.map((e) => e.id)).toEqual([9]);
  });

  // Dropping a whole entry takes its points away, and lifetime points never
  // go down: anything else wrong is repaired.
  it('repairs the rest: time, reason, goal, title and id', () => {
    const [read] = readLedgerEntries(
      [{ points: 20, at: 'soon', reason: 'magic', goalId: {}, goalTitle: 42 }],
      undefined,
      NOW
    );

    expect(read).toEqual({ id: NOW, at: 0, points: 20, reason: 'carried' });
  });

  it('gives repeated ids new ones', () => {
    const read = readLedgerEntries([entry({ id: 4 }), entry({ id: 4 }), entry({ id: 6 })], undefined, NOW);

    expect(new Set(read.map((e) => e.id)).size).toBe(3);
  });

  it("remaps goals, forgetting one it does not know but keeping the entry's title", () => {
    const read = readLedgerEntries(
      [entry({ goalId: 1, goalTitle: 'Read' }), entry({ id: 2, goalId: 99, goalTitle: 'Gone' })],
      new Map([[1, 101]]),
      NOW
    );

    expect(read.map((e) => [e.goalId, e.goalTitle])).toEqual([
      [101, 'Read'],
      [undefined, 'Gone'],
    ]);
  });
});

describe('appendEntries', () => {
  it('numbers the new entries after the ledger', () => {
    const ledger = appendEntries([entry({ id: NOW + 10 })], [entry({ id: 1 }), entry({ id: 1 })], NOW);

    expect(ledger.map((e) => e.id)).toEqual([NOW + 10, NOW + 11, NOW + 12]);
  });
});

describe('pointsEarnedBetween', () => {
  it('adds up the entries in the period, ends included', () => {
    const ledger = [
      entry({ at: NOW - DAY, points: 1 }),
      entry({ at: NOW, points: 10 }),
      entry({ at: NOW + DAY, points: 100 }),
      entry({ at: 0, points: 1000, reason: 'carried' }),
    ];

    expect(pointsEarnedBetween(ledger, NOW, NOW + DAY)).toBe(110);
  });
});

describe('buildPointsHistory', () => {
  const reward = (overrides: Partial<Reward>): Reward => ({
    id: 1,
    title: 'Coffee',
    description: '',
    pointsCost: 30,
    icon: '☕',
    createdAt: NOW - DAY,
    isRedeemed: true,
    redeemedAt: NOW - 1000,
    ...overrides,
  });

  it('lists points earned and spent, newest first, undated last', () => {
    const rows = buildPointsHistory(
      [
        entry({ id: 1, at: NOW - DAY, points: 50, goalTitle: 'Read' }),
        entry({ id: 2, at: NOW, points: 10, goalTitle: 'Water' }),
        entry({ id: 3, at: 0, points: 355, reason: 'carried' }),
      ],
      [reward({}), reward({ id: 2, isRedeemed: false }), reward({ id: 3, title: 'Old', redeemedAt: undefined })]
    );

    expect(rows.map((r) => [r.kind, r.title, r.points])).toEqual([
      ['earned', 'Water', 10],
      ['spent', 'Coffee', -30],
      ['earned', 'Read', 50],
      ['carried', undefined, 355],
      ['spent', 'Old', -30],
    ]);
  });
});

describe('bonus entries', () => {
  it('records the bonus, its goal and when', () => {
    expect(bonusEntry([entry({ id: NOW })], { id: 7, title: 'Run' }, 'streak', 20, NOW)).toEqual({
      id: NOW + 1,
      at: NOW,
      points: 20,
      reason: 'bonus',
      bonus: 'streak',
      goalId: 7,
      goalTitle: 'Run',
    });
  });

  it('are read back with their kind', () => {
    const early = entry({ reason: 'bonus', bonus: 'early' });
    expect(readLedgerEntries([early], undefined, NOW)).toEqual([early]);
  });

  // From a newer version, say: its points still count.
  it('keep their points, carried, when their kind is unknown', () => {
    const [read] = readLedgerEntries([{ ...entry({ points: 12 }), reason: 'bonus', bonus: 'lucky' }], undefined, NOW);
    expect(read).toMatchObject({ points: 12, reason: 'carried' });
    expect(read).not.toHaveProperty('bonus');
  });

  it('show as bonus rows in the history', () => {
    const [row] = buildPointsHistory([entry({ reason: 'bonus', bonus: 'welcomeBack', goalTitle: 'Run' })], []);
    expect(row).toMatchObject({ kind: 'bonus', bonus: 'welcomeBack', title: 'Run' });
  });
});
