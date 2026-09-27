/**
 * The points ledger: every payout of points, when it was made and what for.
 *
 * Lifetime points are the ledger's total - never kept apart from it, so the two
 * cannot disagree - and the ledger only grows. A single stored number said how
 * many points there were but not when or why: the review could only guess a
 * period's points from the goals left, and got deleted goals and edited point
 * values wrong.
 *
 * Spending is not here. A redeemed reward records its own cost and time, and
 * belongs to RewardsContext; the points history puts the two together.
 *
 * Pure: no React, no storage.
 */

import type { BonusKind, Goal, PointsEntry, Reward } from '../types';
import { nextId } from './ids';

const REASONS: readonly PointsEntry['reason'][] = ['completion', 'bonus', 'carried'];
const BONUS_KINDS: readonly BonusKind[] = ['early', 'streak', 'welcomeBack'];

export function ledgerTotal(ledger: readonly PointsEntry[]): number {
  return ledger.reduce((sum, entry) => sum + entry.points, 0);
}

/** The entry for `goal`'s completion paying `points`, next in `ledger`. */
export function completionEntry(
  ledger: readonly PointsEntry[],
  goal: Pick<Goal, 'id' | 'title'>,
  points: number,
  now: number = Date.now()
): PointsEntry {
  return {
    id: nextId(ledger, now),
    at: now,
    points,
    reason: 'completion',
    goalId: goal.id,
    goalTitle: goal.title,
  };
}

/** The entry for a bonus `goal`'s completion earned, next in `ledger`. */
export function bonusEntry(
  ledger: readonly PointsEntry[],
  goal: Pick<Goal, 'id' | 'title'>,
  bonus: BonusKind,
  points: number,
  now: number = Date.now()
): PointsEntry {
  return { ...completionEntry(ledger, goal, points, now), reason: 'bonus', bonus };
}

/** Whether a number from outside is a time: JSON's 1e999 is Infinity. */
const isTime = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

/**
 * Every time a goal was completed: a recurring goal's earlier periods, then the
 * latest. Once each - a goal set back and completed again pays nothing again
 * (see hasBeenCompleted), and its completedAt is still the first time. A goal
 * complete with no time for it (hand-made, or older data) still paid: undated.
 */
export function completionTimes(
  goal: Pick<Goal, 'completionHistory' | 'completedAt' | 'isComplete'>
): number[] {
  const times = (Array.isArray(goal.completionHistory) ? goal.completionHistory : []).filter(isTime);
  if (isTime(goal.completedAt)) times.push(goal.completedAt);
  else if (goal.isComplete === true) times.push(0);
  return times;
}

/**
 * Whether completing `goal` pays its points: always for a goal, and for a
 * subgoal only when its parent lets subgoals award them - as awardPointsForGoal
 * decides when it happens.
 */
export function paysPoints(goal: Goal, byId: ReadonlyMap<number, Goal>): boolean {
  return !goal.parentId || byId.get(goal.parentId)?.subgoalsAwardPoints === true;
}

/** Number `entries` in order, after every id in `after`. */
function numbered(entries: PointsEntry[], after: readonly PointsEntry[], now: number): PointsEntry[] {
  const first = nextId(after, now);
  return entries.map((entry, index) => ({ ...entry, id: first + index }));
}

/**
 * A ledger rebuilt from the goals' own history: how the ledger starts from
 * data saved before it existed, and from a backup made before it.
 *
 * One entry per paid completion. `knownTotal` is the total those points came
 * to, when it is known: what the history does not account for (deleted goals,
 * mostly) is carried in as one undated entry. History that comes to more than
 * the total cannot be trusted - points edited up after they were paid - so
 * then the total is carried in whole, and lifetime points stay as they were.
 */
export function ledgerFromHistory(
  goals: readonly Goal[],
  knownTotal: number | null,
  now: number = Date.now()
): PointsEntry[] {
  const byId = new Map(goals.map((goal) => [goal.id, goal]));
  let entries: PointsEntry[] = [];

  for (const goal of goals) {
    if (!paysPoints(goal, byId)) continue;
    if (typeof goal.points !== 'number' || !Number.isFinite(goal.points) || goal.points <= 0) continue;
    for (const at of completionTimes(goal)) {
      entries.push({
        id: 0,
        at,
        points: goal.points,
        reason: 'completion',
        goalId: goal.id,
        goalTitle: goal.title,
      });
    }
  }
  entries.sort((a, b) => a.at - b.at);

  if (knownTotal !== null) {
    if (ledgerTotal(entries) > knownTotal) entries = [];
    const unaccounted = knownTotal - ledgerTotal(entries);
    if (unaccounted > 0) {
      entries.unshift({ id: 0, at: 0, points: unaccounted, reason: 'carried' });
    }
  }

  return numbered(entries, [], now);
}

/**
 * Ledger entries from outside - storage, or a backup file - rebuilt field by
 * field. Only points that are not a positive number drop an entry: anything
 * else wrong with it (its time, its reason, its goal) is repaired, because
 * dropping it would take points away, and lifetime points never go down.
 *
 * `goalIds` remaps goal ids, as an import gives goals new ones; a goal it does
 * not know is forgotten, and the entry keeps its title. Ids that are missing
 * or repeated are given new ones.
 */
export function readLedgerEntries(
  raw: readonly unknown[],
  goalIds?: ReadonlyMap<number, number>,
  now: number = Date.now()
): PointsEntry[] {
  const entries: PointsEntry[] = [];
  const seen = new Set<number>();
  const renumber: number[] = [];

  for (const value of raw) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) continue;
    const item = value as Record<string, unknown>;
    const points = item.points;
    if (typeof points !== 'number' || !Number.isFinite(points) || points <= 0) continue;

    // A bonus of a kind this version does not know keeps its points, carried.
    const bonus = BONUS_KINDS.includes(item.bonus as BonusKind) ? (item.bonus as BonusKind) : undefined;
    const known = REASONS.includes(item.reason as PointsEntry['reason'])
      ? (item.reason as PointsEntry['reason'])
      : 'carried';
    const reason = known === 'bonus' && !bonus ? 'carried' : known;
    const storedGoalId = isTime(item.goalId) ? item.goalId : undefined;
    const goalId =
      storedGoalId === undefined ? undefined : goalIds ? goalIds.get(storedGoalId) : storedGoalId;

    const entry: PointsEntry = {
      id: isTime(item.id) ? item.id : 0,
      at: isTime(item.at) ? item.at : 0,
      points,
      reason,
    };
    if (reason === 'bonus') entry.bonus = bonus;
    if (goalId !== undefined) entry.goalId = goalId;
    if (typeof item.goalTitle === 'string') entry.goalTitle = item.goalTitle;

    if (entry.id === 0 || seen.has(entry.id)) renumber.push(entries.length);
    else seen.add(entry.id);
    entries.push(entry);
  }

  let next = nextId(entries, now);
  for (const index of renumber) entries[index] = { ...entries[index], id: next++ };
  return entries;
}

/** `entries` renumbered to follow every id in `after`: how an import adds them. */
export function appendEntries(
  after: readonly PointsEntry[],
  entries: readonly PointsEntry[],
  now: number = Date.now()
): PointsEntry[] {
  return [...after, ...numbered([...entries], after, now)];
}

/** Points earned from `start` to `end`, inclusive. */
export function pointsEarnedBetween(ledger: readonly PointsEntry[], start: number, end: number): number {
  return ledger.reduce((sum, entry) => (entry.at >= start && entry.at <= end ? sum + entry.points : sum), 0);
}

/** A line of the points history. */
export interface PointsHistoryRow {
  key: string;
  /** 0 when not known: carried points, a reward redeemed before times were kept. */
  at: number;
  /** Positive for points earned, negative for points spent. */
  points: number;
  kind: 'earned' | 'bonus' | 'carried' | 'spent';
  /** Which bonus, for a `bonus` row. */
  bonus?: BonusKind;
  /** The goal or reward, when there is one. */
  title?: string;
}

/**
 * Points earned and spent, newest first; those whose time is not known last.
 */
export function buildPointsHistory(
  ledger: readonly PointsEntry[],
  rewards: readonly Reward[]
): PointsHistoryRow[] {
  const rows: PointsHistoryRow[] = [
    ...ledger.map((entry) => ({
      key: `entry-${entry.id}`,
      at: entry.at,
      points: entry.points,
      kind:
        entry.reason === 'carried'
          ? ('carried' as const)
          : entry.reason === 'bonus'
            ? ('bonus' as const)
            : ('earned' as const),
      bonus: entry.bonus,
      title: entry.goalTitle,
    })),
    ...rewards
      .filter((reward) => reward.isRedeemed)
      .map((reward) => ({
        key: `reward-${reward.id}`,
        at: isTime(reward.redeemedAt) ? reward.redeemedAt : 0,
        points: -reward.pointsCost,
        kind: 'spent' as const,
        title: reward.title,
      })),
  ];
  return rows.sort((a, b) => b.at - a.at);
}
