/**
 * Bonus points: extra points a completion earns, each its own ledger entry.
 *
 * Three bonuses, each scaled to the goal's own points:
 * - early-bird: finishing with much of the period left - the more, the more;
 * - streak: a recurring goal completed period after period;
 * - welcome back: the first completion after a break of a few days.
 *
 * None rewards waiting. The welcome-back bonus is flat, not grown by the
 * break (waiting for it costs streaks and early-bird bonuses), and a period
 * whose timing was changed by hand earns no early-bird bonus - extended,
 * edited or restarted, it would count a late finish as an early one.
 *
 * Pure: no React, no storage.
 */

import type { BonusKind, Goal, Language, PointsEntry } from '../types';
import { calculatePeriodEndDate } from './goal-calculations';
import { formatNumber } from './number-formatting';
import { calculateStreak } from './recurring-goals';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The numbers, all in one place: shares are of the goal's own points. */
export const BONUS_RULES = {
  /** Up to maxShare when finished at once; none in the period's last minTimeLeft. */
  early: { maxShare: 0.25, minTimeLeft: 0.25 },
  /** perPeriod for each period in a row after the first, up to maxShare. */
  streak: { perPeriod: 0.1, maxShare: 0.5 },
  /** share on the first completion after afterDays or more with none. */
  welcomeBack: { share: 0.2, afterDays: 3 },
} as const;

export interface Bonus {
  kind: BonusKind;
  points: number;
}

const isTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/** The share of its points finishing `goal` now earns for being early. */
function earlyShare(goal: Goal, now: number): number {
  if (goal.period === 'ongoing' || goal.timingChanged || !isTime(goal.periodStartDate)) return 0;

  // The end the card counts down to: a recurring goal's reset, a one-off
  // goal's last day.
  const start = goal.periodStartDate;
  const end = calculatePeriodEndDate(start, goal.period, goal.customPeriodDays, goal.isRecurring);
  if (!(end > start)) return 0;

  const timeLeft = Math.min(1, Math.max(0, (end - now) / (end - start)));
  const { maxShare, minTimeLeft } = BONUS_RULES.early;
  return timeLeft >= minTimeLeft ? maxShare * timeLeft : 0;
}

/** The share for a recurring goal's run of periods, this completion included. */
function streakShare(goal: Goal, now: number): number {
  if (!goal.isRecurring) return 0;
  const streak = calculateStreak(goal, now).currentStreak;
  const { perPeriod, maxShare } = BONUS_RULES.streak;
  return streak > 1 ? Math.min(maxShare, perPeriod * (streak - 1)) : 0;
}

/** When the last goal was completed, from the ledger; null before the first. */
export function lastCompletionAt(ledger: readonly PointsEntry[]): number | null {
  let last: number | null = null;
  for (const entry of ledger) {
    if (entry.reason === 'completion' && entry.at > 0 && (last === null || entry.at > last)) {
      last = entry.at;
    }
  }
  return last;
}

/** The share for coming back after a break: none on the very first completion. */
function welcomeBackShare(ledger: readonly PointsEntry[], now: number): number {
  const last = lastCompletionAt(ledger);
  const { share, afterDays } = BONUS_RULES.welcomeBack;
  return last !== null && now - last >= afterDays * DAY_MS ? share : 0;
}

/**
 * The bonuses completing `goal` earns. `goal` is as just completed (its
 * completion and streak counted); `ledger` is from before this payout.
 */
export function computeBonuses(
  goal: Goal,
  ledger: readonly PointsEntry[],
  now: number = Date.now()
): Bonus[] {
  const points = goal.points;
  if (typeof points !== 'number' || !Number.isFinite(points) || points <= 0) return [];

  const bonuses: Bonus[] = [
    { kind: 'early', points: Math.round(points * earlyShare(goal, now)) },
    { kind: 'streak', points: Math.round(points * streakShare(goal, now)) },
    { kind: 'welcomeBack', points: Math.round(points * welcomeBackShare(ledger, now)) },
  ];
  return bonuses.filter((bonus) => bonus.points > 0);
}

export interface PayoutLabels {
  /** After a completion's own points: "points". */
  points: string;
  /** Each bonus's name. */
  bonus: Record<BonusKind, string>;
}

/**
 * A payout as lines for the completion message: "+50 points", then
 * "+12 Early-bird bonus", in the user's language.
 */
export function describePayout(
  entries: readonly PointsEntry[],
  labels: PayoutLabels,
  language: Language
): string[] {
  return entries.map((entry) => {
    const label = entry.reason === 'bonus' && entry.bonus ? labels.bonus[entry.bonus] : labels.points;
    return `+${formatNumber(entry.points, language)} ${label}`;
  });
}
