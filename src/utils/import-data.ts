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
 * A backup is untrusted input, and whatever this returns is saved and rendered
 * on every launch: an object where a string belongs crashes the screen that
 * shows it, every time. So records are rebuilt field by field, each checked
 * for its type, rather than spread from the file.
 *
 * Pure: no React, no storage. The contexts apply the result.
 */

import type { Goal, GoalCategory, GoalNote, GoalSchedule, Reward, TimePeriod } from '../types';
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

const CATEGORIES: readonly GoalCategory[] = [
  'health',
  'fitness',
  'learning',
  'work',
  'finance',
  'personal',
  'social',
  'hobby',
  'other',
];

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const text = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const number = (value: unknown): number | undefined => (isNumber(value) ? value : undefined);

const nonNegative = (value: unknown): number | undefined =>
  isNumber(value) && value >= 0 ? value : undefined;

const flag = (value: unknown): boolean | undefined =>
  typeof value === 'boolean' ? value : undefined;

/** The whole numbers in `value` between min and max, without duplicates. */
function integers(value: unknown, min: number, max: number): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const result: number[] = [];
  for (const item of value) {
    if (Number.isInteger(item) && item >= min && item <= max && !result.includes(item)) {
      result.push(item);
    }
  }
  return result;
}

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
    if (!isNumber(goal.points) || goal.points <= 0) return sum;
    if (goal.isRecurring) return sum + getTotalPointsEarned(goal);
    return sum + (goal.isComplete ? goal.points : 0);
  }, 0);
}

function normaliseNotes(notes: unknown, now: number): GoalNote[] | undefined {
  if (!Array.isArray(notes)) return undefined;
  const result: GoalNote[] = [];
  for (const note of notes) {
    if (
      note !== null &&
      typeof note === 'object' &&
      typeof note.id === 'string' &&
      typeof note.text === 'string'
    ) {
      result.push({ id: note.id, text: note.text, createdAt: number(note.createdAt) ?? now });
    }
  }
  return result;
}

function normaliseSchedule(value: unknown): GoalSchedule | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;
  const schedule: GoalSchedule = {};

  const daysOfWeek = integers(raw.daysOfWeek, 0, 6);
  if (daysOfWeek?.length) schedule.daysOfWeek = daysOfWeek;

  const datesOfMonth = integers(raw.datesOfMonth, 1, 31);
  if (datesOfMonth?.length) schedule.datesOfMonth = datesOfMonth;

  const start = raw.dateRangeStart;
  const end = raw.dateRangeEnd;
  if (
    typeof start === 'number' &&
    typeof end === 'number' &&
    Number.isInteger(start) &&
    Number.isInteger(end) &&
    start >= 1 &&
    start <= end &&
    end <= 31
  ) {
    schedule.dateRangeStart = start;
    schedule.dateRangeEnd = end;
  }

  // Nothing usable left means no schedule: active every day.
  return Object.keys(schedule).length > 0 ? schedule : undefined;
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
  // every field checked. Title, target and current were validated by the
  // parser; everything else is only kept if it has the right type.
  const goals: Goal[] = incoming.goals.map((raw, index) => {
    const createdAt = number(raw.createdAt) ?? now;

    return {
      id: goalIds.ids[index],
      parentId: isNumber(raw.parentId) ? goalIds.map.get(raw.parentId) : undefined,
      subGoals: remapIds(raw.subGoals, goalIds.map),
      dependsOn: remapIds(raw.dependsOn, goalIds.map),
      linkedRewardId: isNumber(raw.linkedRewardId)
        ? rewardIds.map.get(raw.linkedRewardId)
        : undefined,

      title: raw.title,
      description: text(raw.description),
      icon: text(raw.icon),
      category: CATEGORIES.find((category) => category === raw.category),

      target: raw.target,
      current: raw.current,
      initialValue: number(raw.initialValue) ?? raw.current,
      unit: text(raw.unit) ?? '',
      direction: raw.direction === 'decrease' ? 'decrease' : 'increase',
      points: nonNegative(raw.points) ?? 0,
      progress: 0, // recomputed below, once the links are repaired

      period: PERIODS.find((period) => period === raw.period) ?? 'ongoing',
      customPeriodDays: nonNegative(raw.customPeriodDays),
      periodStartDate: number(raw.periodStartDate) ?? createdAt,
      schedule: normaliseSchedule(raw.schedule),
      createdAt,

      isUltimate: flag(raw.isUltimate),
      subgoalsAwardPoints: flag(raw.subgoalsAwardPoints),
      isComplete: flag(raw.isComplete),
      completedAt: number(raw.completedAt),
      isRecurring: flag(raw.isRecurring),
      completionHistory: Array.isArray(raw.completionHistory)
        ? raw.completionHistory.filter(isNumber)
        : [],
      currentStreak: nonNegative(raw.currentStreak),
      longestStreak: nonNegative(raw.longestStreak),
      isPaused: flag(raw.isPaused),
      pausedAt: number(raw.pausedAt),
      isArchived: flag(raw.isArchived),
      archivedAt: number(raw.archivedAt),
      sortOrder: number(raw.sortOrder),
      notes: normaliseNotes(raw.notes, now),

      // Scheduled notification ids belong to the device and install that made
      // the backup. Reminders come in switched off rather than appearing
      // enabled while nothing is actually scheduled; the chosen time and days
      // are kept for when the user turns them back on.
      notificationsEnabled: false,
      notificationIds: [],
      notificationTime: integers([raw.notificationTime], 0, 24 * 60 - 1)?.[0],
      notificationDays: integers(raw.notificationDays, 0, 6),
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

  // Then a parent lists only children that point back at it, in the file's
  // order. A child the parent does not list stays unlisted: archiving a
  // subgoal detaches it from its parent's list on purpose, keeping its
  // parentId, so it stops counting toward the parent's progress.
  for (const goal of goals) {
    goal.subGoals = (goal.subGoals ?? []).filter((id) => byId.get(id)?.parentId === goal.id);
  }

  // Progress is derived data; recompute it from the repaired records rather
  // than trusting the file (a parent's progress depends on its children).
  const allGoals = [...base.goals, ...goals];
  for (const goal of goals) {
    goal.progress = calculateGoalProgress(goal, allGoals);
  }

  const rewards: Reward[] = incoming.rewards.map((raw, index) => ({
    id: rewardIds.ids[index],
    linkedToGoalId: isNumber(raw.linkedToGoalId) ? goalIds.map.get(raw.linkedToGoalId) : undefined,
    // Title and cost were validated by the parser.
    title: raw.title,
    pointsCost: raw.pointsCost,
    description: text(raw.description) ?? '',
    icon: text(raw.icon) ?? '🎁',
    isRedeemed: raw.isRedeemed === true,
    redeemedAt: number(raw.redeemedAt),
    createdAt: number(raw.createdAt) ?? now,
  }));

  // Merged redeemed rewards count as spending, so the backup's earned points
  // must come with them - otherwise the available balance drops, possibly
  // below zero. Lifetime points never decrease, so a negative total in the
  // file is not trusted; nor are the raw goals, whose points may not be
  // numbers (the total would be NaN, saved, and read back on every launch).
  const importedPoints =
    isNumber(incoming.lifetimePoints) && incoming.lifetimePoints >= 0
      ? incoming.lifetimePoints
      : deriveLifetimePoints(goals);

  return {
    goals: [...base.goals, ...goals],
    rewards: [...base.rewards, ...rewards],
    lifetimePoints: base.lifetimePoints + importedPoints,
  };
}
