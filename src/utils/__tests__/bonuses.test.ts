/**
 * Bonus points: early-bird, streak and welcome back.
 */

import { translations } from '../../i18n/translations';
import type { Goal, PointsEntry } from '../../types';
import { BONUS_RULES, computeBonuses, describePayout, lastCompletionAt } from '../bonuses';

const NOW = 1_800_000_000_000;
const DAY = 86_400_000;

/** A weekly recurring goal worth 100, completed now, its period started at `start`. */
const goal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 1,
  title: 'Run',
  current: 5,
  target: 5,
  unit: 'km',
  initialValue: 0,
  direction: 'increase',
  progress: 100,
  points: 100,
  period: 'weekly',
  isRecurring: true,
  periodStartDate: NOW,
  createdAt: NOW - 60 * DAY,
  isComplete: true,
  completedAt: NOW,
  completionHistory: [],
  ...overrides,
});

const completedAt = (at: number): PointsEntry => ({ id: at, at, points: 10, reason: 'completion' });

const bonus = (g: Goal, kind: string, ledger: PointsEntry[] = [], now = NOW) =>
  computeBonuses(g, ledger, now).find((b) => b.kind === kind)?.points ?? 0;

describe('early-bird bonus', () => {
  it('is the most at the start of the period', () => {
    expect(bonus(goal(), 'early')).toBe(100 * BONUS_RULES.early.maxShare);
  });

  it('shrinks with the time left', () => {
    expect(bonus(goal({ periodStartDate: NOW - 3.5 * DAY }), 'early')).toBe(13); // 12.5, rounded
  });

  it('is none in the last quarter of the period', () => {
    expect(bonus(goal({ periodStartDate: NOW - 6 * DAY }), 'early')).toBe(0);
  });

  // A recurring goal's deadline is its reset: a daily goal ends at midnight.
  it("measures a recurring goal to its reset, a one-off to its last day's end", () => {
    const nineAm = new Date(2026, 0, 5, 9, 0).getTime();
    const sixPm = new Date(2026, 0, 5, 18, 0).getTime();
    const daily = (isRecurring: boolean) =>
      goal({ period: 'daily', isRecurring, periodStartDate: nineAm, completedAt: sixPm });

    // Recurring: 9am to midnight, 6 of 15 hours left. One-off: to the end of
    // tomorrow, 30 of 39 left.
    expect(bonus(daily(true), 'early', [], sixPm)).toBe(10);
    expect(bonus(daily(false), 'early', [], sixPm)).toBe(19);
  });

  it('is none for a goal with no deadline', () => {
    expect(bonus(goal({ period: 'ongoing', isRecurring: false }), 'early')).toBe(0);
  });

  // Extended, edited or restarted by hand, a late finish would count as early.
  it("is none when the period's timing was changed by hand", () => {
    expect(bonus(goal({ timingChanged: true }), 'early')).toBe(0);
  });

  it('is none without a period start', () => {
    expect(bonus(goal({ periodStartDate: undefined }), 'early')).toBe(0);
  });
});

describe('streak bonus', () => {
  const inARow = (periods: number) =>
    goal({ completionHistory: Array.from({ length: periods - 1 }, (_, i) => NOW - (periods - 1 - i) * 7 * DAY) });

  it('is none for the first period', () => {
    expect(bonus(inARow(1), 'streak')).toBe(0);
  });

  it('adds a share for each period in a row after the first', () => {
    expect(bonus(inARow(3), 'streak')).toBe(20);
  });

  it('stops growing at its cap', () => {
    expect(bonus(inARow(9), 'streak')).toBe(100 * BONUS_RULES.streak.maxShare);
  });

  // Regression: completions were counted as consecutive when 0.9 to 2.1
  // periods apart, not by the periods they fell in.
  it('counts back-to-back periods, however close the completions', () => {
    // The last one on the final day of the week before.
    const g = goal({ periodStartDate: NOW - DAY, completionHistory: [NOW - 1.1 * DAY] });
    expect(bonus(g, 'streak')).toBe(10);
  });

  it('is none when a period was skipped, however far apart the completions', () => {
    // The week before, from 8 days ago to 1 day ago, has no completion.
    const g = goal({ periodStartDate: NOW - DAY, completionHistory: [NOW - 14.5 * DAY] });
    expect(bonus(g, 'streak')).toBe(0);
  });

  it('is only for recurring goals', () => {
    expect(bonus(goal({ isRecurring: false, completionHistory: [NOW - 14 * DAY, NOW - 7 * DAY] }), 'streak')).toBe(0);
  });
});

describe('welcome-back bonus', () => {
  it('comes with the first completion after a break', () => {
    expect(bonus(goal(), 'welcomeBack', [completedAt(NOW - 4 * DAY)])).toBe(20);
  });

  it('is none after a shorter gap', () => {
    expect(bonus(goal(), 'welcomeBack', [completedAt(NOW - 4 * DAY), completedAt(NOW - 2 * DAY)])).toBe(0);
  });

  // Nothing to come back to: the first goal is its own reward.
  it('is none on the very first completion', () => {
    expect(bonus(goal(), 'welcomeBack', [])).toBe(0);
  });

  it('goes by completions only, not carried points or bonuses', () => {
    const ledger: PointsEntry[] = [
      { id: 1, at: 0, points: 300, reason: 'carried' },
      { id: 2, at: NOW - DAY, points: 5, reason: 'bonus', bonus: 'early' },
    ];

    expect(lastCompletionAt(ledger)).toBeNull();
    expect(bonus(goal(), 'welcomeBack', ledger)).toBe(0);
  });
});

describe('computeBonuses', () => {
  it('drops a bonus that rounds to nothing', () => {
    expect(computeBonuses(goal({ points: 1 }), [], NOW)).toEqual([]);
  });

  it('gives nothing for a goal without points', () => {
    expect(computeBonuses(goal({ points: 0 }), [completedAt(NOW - 9 * DAY)], NOW)).toEqual([]);
    expect(computeBonuses(goal({ points: NaN }), [], NOW)).toEqual([]);
  });

  it('can earn every bonus at once', () => {
    const g = goal({ completionHistory: [NOW - 14 * DAY, NOW - 7 * DAY] });

    expect(computeBonuses(g, [completedAt(NOW - 5 * DAY)], NOW)).toEqual([
      { kind: 'early', points: 25 },
      { kind: 'streak', points: 20 },
      { kind: 'welcomeBack', points: 20 },
    ]);
  });
});

describe('describePayout', () => {
  const payout: PointsEntry[] = [
    { id: 1, at: NOW, points: 50, reason: 'completion' },
    { id: 2, at: NOW, points: 13, reason: 'bonus', bonus: 'early' },
  ];
  const labels = (language: 'en' | 'ar') => ({
    points: translations[language].goalCard.points,
    bonus: translations[language].pointsHistory.bonus,
  });

  it('lists the points, then each bonus', () => {
    expect(describePayout(payout, labels('en'), 'en')).toEqual(['+50 points', '+13 Early-bird bonus']);
  });

  it('writes Arabic digits in Arabic', () => {
    const [points, early] = describePayout(payout, labels('ar'), 'ar');
    expect(points).toBe(`+٥٠ ${translations.ar.goalCard.points}`);
    expect(early).toBe(`+١٣ ${translations.ar.pointsHistory.bonus.early}`);
  });
});
