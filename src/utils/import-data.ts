/**
 * Turning a parsed backup into the app's next state.
 *
 * Import used to re-create each goal through `addGoal` and each reward through
 * `addReward`. That kept only a handful of fields: completion state, history,
 * streaks, notes, schedules and sort order were all lost, subgoal/dependency/
 * reward links pointed at ids that no longer existed, rewards came back
 * unredeemed, and lifetime points were never restored.
 *
 * `buildImport` keeps every record whole instead. It gives each imported record
 * a fresh id (so nothing collides with existing data, and duplicate ids in the
 * file itself are resolved), remaps every cross-reference through those new
 * ids, and repairs fields a hand-edited or old backup may be missing.
 *
 * Pure: no React, no storage. The contexts apply the result.
 */

import type { Goal, GoalNote, Reward, TimePeriod } from '../types';
import { calculateGoalProgress } from './goal-calculations';
import { nextId } from './ids';
import { getTotalPointsEarned } from './recurring-goals';

/**
 * - `merge`:   add the backup's goals and rewards alongside the current ones.
 * - `replace`: the backup becomes the whole of the user's data.
 */
export type ImportMode = 'merge' | 'replace';

export interface AppData {
  goals: Goal[];
  rewards: Reward[];
  lifetimePoints: number;
}

/** What parseJSONImport produces: records that passed its basic validation. */
export interface ImportedData {
  goals: Goal[];
  rewards: Reward[];
  /** Null when the file does not record them (e.g. older exports). */
  lifetimePoints: number | null;
}

const PERIODS: readonly TimePeriod[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom', 'ongoing'];

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

/** Ids from `ids` that `map` knows about, translated, in order. */
function remapIds(ids: unknown, map: Map<number, number>): number[] {
  if (!Array.isArray(ids)) return [];
  const result: number[] = [];
  for (const id of ids) {
    const mapped = map.get(id);
    if (mapped !== undefined && !result.includes(mapped)) {
      result.push(mapped);
    }
  }
  return result;
}

/**
 * Assign fresh ids to `records`, never colliding with `taken` or each other.
 *
 * Returns the new ids in order, plus old -> new. A duplicate old id (which the
 * previous import bug produced, so older backups contain them) maps to its
 * first occurrence; later duplicates still get their own id, they just cannot
 * be referred to.
 */
function assignIds(
  records: readonly { id: unknown }[],
  taken: readonly { id: number }[],
  now: number
): { ids: number[]; map: Map<number, number> } {
  const used: { id: number }[] = [...taken];
  const ids: number[] = [];
  const map = new Map<number, number>();

  for (const record of records) {
    const id = nextId(used, now);
    used.push({ id });
    ids.push(id);
    if (isNumber(record.id) && !map.has(record.id)) {
      map.set(record.id, id);
    }
  }

  return { ids, map };
}

/**
 * Lifetime points a backup implies when it does not record them: the same
 * derivation GoalsContext uses when migrating from versions that predate them.
 */
export function deriveLifetimePoints(goals: readonly Goal[]): number {
  return goals.reduce((sum, goal) => {
    if (goal.parentId) return sum; // subgoals roll up into their parent
    if (goal.isRecurring) return sum + getTotalPointsEarned(goal);
    return sum + (goal.isComplete && isNumber(goal.points) ? goal.points : 0);
  }, 0);
}

function normaliseNotes(notes: unknown): GoalNote[] | undefined {
  if (!Array.isArray(notes)) return undefined;
  return notes.filter(
    (note): note is GoalNote =>
      note !== null &&
      typeof note === 'object' &&
      typeof note.id === 'string' &&
      typeof note.text === 'string'
  );
}

/**
 * Build the next app state from the current one and a parsed backup.
 */
export function buildImport(
  current: AppData,
  incoming: ImportedData,
  mode: ImportMode,
  now: number = Date.now()
): AppData {
  const base: AppData =
    mode === 'replace' ? { goals: [], rewards: [], lifetimePoints: 0 } : current;

  const goalIds = assignIds(incoming.goals, base.goals, now);
  const rewardIds = assignIds(incoming.rewards, base.rewards, now);

  // First pass: every goal keeps all its data, with ids and links remapped and
  // untrustworthy fields repaired.
  const goals: Goal[] = incoming.goals.map((raw, index) => {
    const parentId = isNumber(raw.parentId) ? goalIds.map.get(raw.parentId) : undefined;
    const linkedRewardId = isNumber(raw.linkedRewardId)
      ? rewardIds.map.get(raw.linkedRewardId)
      : undefined;

    return {
      ...raw,
      id: goalIds.ids[index],
      parentId,
      subGoals: remapIds(raw.subGoals, goalIds.map),
      dependsOn: remapIds(raw.dependsOn, goalIds.map),
      linkedRewardId,

      unit: typeof raw.unit === 'string' ? raw.unit : '',
      direction: raw.direction === 'decrease' ? 'decrease' : 'increase',
      points: isNumber(raw.points) && raw.points >= 0 ? raw.points : 0,
      period: PERIODS.includes(raw.period) ? raw.period : 'ongoing',
      createdAt: isNumber(raw.createdAt) ? raw.createdAt : now,
      completionHistory: Array.isArray(raw.completionHistory)
        ? raw.completionHistory.filter(isNumber)
        : [],
      notes: normaliseNotes(raw.notes),

      // Scheduled notification ids belong to the device and install that made
      // the backup. Reminders come in switched off rather than appearing
      // enabled while nothing is actually scheduled.
      notificationsEnabled: false,
      notificationIds: [],
    };
  });

  // Second pass: make parent/child links agree. (A child whose parent was not
  // in the file already became top-level: its parentId did not remap.)
  //
  // First break cycles. A goal that is its own parent, or two goals that are
  // each other's parent, make progress calculation recurse forever - and once
  // saved, the app would crash on every launch.
  const byId = new Map(goals.map((goal) => [goal.id, goal]));
  for (const goal of goals) {
    const seen = new Set<number>();
    let ancestor = goal.parentId;
    while (ancestor !== undefined && !seen.has(ancestor)) {
      if (ancestor === goal.id) {
        goal.parentId = undefined;
        break;
      }
      seen.add(ancestor);
      ancestor = byId.get(ancestor)?.parentId;
    }
  }

  // Then a parent lists exactly the children that point back at it, keeping
  // the file's order, then any it had missed.
  for (const goal of goals) {
    const children = goals.filter((g) => g.parentId === goal.id).map((g) => g.id);
    const ordered = (goal.subGoals ?? []).filter((id) => children.includes(id));
    goal.subGoals = [...ordered, ...children.filter((id) => !ordered.includes(id))];
  }

  // Progress is derived data; recompute it from the repaired records rather
  // than trusting the file (a parent's progress depends on its children).
  const allGoals = [...base.goals, ...goals];
  for (const goal of goals) {
    goal.progress = calculateGoalProgress(goal, allGoals);
  }

  const rewards: Reward[] = incoming.rewards.map((raw, index) => ({
    ...raw,
    id: rewardIds.ids[index],
    linkedToGoalId: isNumber(raw.linkedToGoalId) ? goalIds.map.get(raw.linkedToGoalId) : undefined,
    description: typeof raw.description === 'string' ? raw.description : '',
    icon: typeof raw.icon === 'string' ? raw.icon : '🎁',
    isRedeemed: raw.isRedeemed === true,
    createdAt: isNumber(raw.createdAt) ? raw.createdAt : now,
  }));

  // Merged redeemed rewards count as spending, so the backup's earned points
  // must come with them - otherwise the available balance drops, possibly
  // below zero.
  const importedPoints = isNumber(incoming.lifetimePoints)
    ? incoming.lifetimePoints
    : deriveLifetimePoints(incoming.goals);

  return {
    goals: [...base.goals, ...goals],
    rewards: [...base.rewards, ...rewards],
    lifetimePoints: base.lifetimePoints + importedPoints,
  };
}
