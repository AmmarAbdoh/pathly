/**
 * A goal being made in the step-by-step form: its defaults, what each step
 * checks, and the goal it becomes. Template quick-add builds goals the same
 * way, so the two cannot disagree.
 *
 * Pure: no React, no storage.
 */

import { DEFAULT_GOAL_ICON } from '../constants/icons';
import type { GoalDirection, GoalSchedule, GoalTemplate, TimePeriod } from '../types';
import { canRecur, isPeriodLength } from './recurring-goals';
import { validateGoalForm, type ValidationKey } from './validation';

/**
 * How a goal is measured:
 * - `number`: a target amount, counted up or down;
 * - `done`: done or not - a target of one;
 * - `subgoals`: an ultimate goal, whose progress is its subgoals'.
 */
export type TrackBy = 'number' | 'done' | 'subgoals';

export type WizardStep = 1 | 2 | 3 | 4;
export const WIZARD_STEPS: readonly WizardStep[] = [1, 2, 3, 4];

/** Text fields are held as typed, and checked on the way to the next step. */
export interface GoalDraft {
  title: string;
  icon: string;
  description: string;
  trackBy: TrackBy;
  target: string;
  unit: string;
  current: string;
  direction: GoalDirection;
  period: TimePeriod;
  customPeriodDays: string;
  repeat: boolean;
  /** Set once repeat is chosen by hand: the period's default stops applying. */
  repeatChosen: boolean;
  /** Set once a period is picked by hand (or comes from a template): how it is tracked stops choosing one. */
  periodChosen: boolean;
  schedule?: GoalSchedule;
  points: string;
  /** Set once points are typed by hand: the period's suggestion stops applying. */
  pointsEdited: boolean;
  linkedRewardId?: number;
  subgoalsAwardPoints: boolean;
}

/** Points to suggest for a goal of `period`: more for a longer one. */
export function suggestedPoints(period: TimePeriod, customPeriodDays?: number): number {
  switch (period) {
    case 'daily':
      return 10;
    case 'weekly':
      return 30;
    case 'monthly':
      return 100;
    case 'yearly':
      return 300;
    case 'custom':
      return isPeriodLength(customPeriodDays)
        ? Math.min(300, Math.max(10, Math.round(10 * customPeriodDays)))
        : 10;
    default:
      return 50;
  }
}

/** Whether a goal of `period` repeats unless told otherwise: habits do. */
export function repeatsByDefault(period: TimePeriod): boolean {
  return period === 'daily' || period === 'weekly';
}

export function emptyDraft(): GoalDraft {
  return {
    title: '',
    icon: DEFAULT_GOAL_ICON,
    description: '',
    trackBy: 'number',
    target: '',
    unit: '',
    current: '0',
    direction: 'increase',
    period: 'daily',
    customPeriodDays: '',
    repeat: repeatsByDefault('daily'),
    repeatChosen: false,
    periodChosen: false,
    points: String(suggestedPoints('daily')),
    pointsEdited: false,
    subgoalsAwardPoints: false,
  };
}

/**
 * A draft filled from a template. Its own points stay, whatever period is
 * chosen after. A decreasing goal's start is left empty: only the user knows
 * it - 0 put "Lose Weight" past its 70 kg target before it began.
 */
export function draftFromTemplate(template: GoalTemplate): GoalDraft {
  return {
    ...emptyDraft(),
    title: template.title,
    icon: template.icon || DEFAULT_GOAL_ICON,
    description: template.description ?? '',
    target: String(template.target),
    unit: template.unit,
    current: template.direction === 'decrease' ? '' : '0',
    direction: template.direction,
    period: template.period,
    periodChosen: true,
    repeat: repeatsByDefault(template.period),
    points: String(template.points),
    pointsEdited: true,
  };
}

/** The draft with another period, and its defaults for repeat and points unless chosen by hand. */
export function withPeriod(draft: GoalDraft, period: TimePeriod, customPeriodDays = draft.customPeriodDays): GoalDraft {
  return {
    ...draft,
    period,
    customPeriodDays,
    repeat: draft.repeatChosen ? draft.repeat : repeatsByDefault(period),
    points: draft.pointsEdited ? draft.points : String(suggestedPoints(period, Number(customPeriodDays))),
  };
}

/**
 * The draft tracked another way. Until a period is picked, a goal made of
 * smaller steps - a big goal - has no deadline, and any other is daily: a big
 * goal due by midnight made no sense.
 */
export function withTrackBy(draft: GoalDraft, trackBy: TrackBy): GoalDraft {
  const next = { ...draft, trackBy };
  return draft.periodChosen ? next : withPeriod(next, trackBy === 'subgoals' ? 'ongoing' : 'daily');
}

/** Whether the draft, as it stands, can repeat: the one rule, `canRecur`. */
export function canRepeat(draft: GoalDraft): boolean {
  return canRecur({
    period: draft.period,
    customPeriodDays: Number(draft.customPeriodDays),
    isUltimate: draft.trackBy === 'subgoals',
  });
}

/** What can be wrong with a field: a key of `t.validation`. */
export type DraftErrorKey =
  | ValidationKey
  | 'targetPositive'
  | 'currentValid'
  | 'customPeriodRequired'
  | 'customPeriodRange'
  | 'pointsRequired'
  | 'pointsValid';

export type DraftErrors = Partial<
  Record<'title' | 'target' | 'unit' | 'current' | 'customPeriodDays' | 'points', DraftErrorKey>
>;

const isNumber = (text: string) => text.trim() !== '' && Number.isFinite(Number(text));

/**
 * What stops `step` going on: only its own fields. Empty and unreadable fields
 * first; then the shared rules - lengths, ranges, and a start short of the
 * target - from `validateGoalForm`.
 */
export function stepErrors(draft: GoalDraft, step: WizardStep): DraftErrors {
  const errors: DraftErrors = {};

  if (step === 1) {
    const rules = validateGoalForm({ title: draft.title.trim() }).errors;
    if (rules.title) errors.title = rules.title;
  }

  if (step === 2 && draft.trackBy === 'number') {
    if (!draft.target.trim()) errors.target = 'targetRequired';
    else if (draft.direction === 'decrease') {
      // Going down, 0 is a target (see validateGoalForm).
      if (!isNumber(draft.target) || Number(draft.target) < 0) errors.target = 'targetNotNegative';
    } else if (!isNumber(draft.target) || Number(draft.target) <= 0) errors.target = 'targetPositive';

    if (!draft.current.trim()) errors.current = 'currentRequired';
    else if (!isNumber(draft.current)) errors.current = 'currentValid';
    else if (Number(draft.current) < 0) errors.current = 'currentMin';

    if (!draft.unit.trim()) errors.unit = 'unitRequired';

    const rules = validateGoalForm({
      title: 'x',
      target: isNumber(draft.target) ? Number(draft.target) : undefined,
      current: isNumber(draft.current) ? Number(draft.current) : undefined,
      unit: draft.unit.trim() || undefined,
      direction: draft.direction,
    }).errors;
    for (const field of ['target', 'current', 'unit'] as const) {
      const key = rules[field];
      if (key && !errors[field]) errors[field] = key;
    }
  }

  if (step === 3 && draft.period === 'custom') {
    if (!draft.customPeriodDays.trim()) errors.customPeriodDays = 'customPeriodRequired';
    else if (!isPeriodLength(Number(draft.customPeriodDays))) errors.customPeriodDays = 'customPeriodRange';
  }

  if (step === 4) {
    if (!draft.points.trim()) errors.points = 'pointsRequired';
    else if (!isNumber(draft.points) || Number(draft.points) < 0) errors.points = 'pointsValid';
    else {
      const key = validateGoalForm({ points: Number(draft.points) }).errors.points;
      if (key) errors.points = key;
    }
  }

  return errors;
}

/** The first step with something to fix, or null when the draft is ready. */
export function firstStepWithErrors(draft: GoalDraft): WizardStep | null {
  return WIZARD_STEPS.find((step) => Object.keys(stepErrors(draft, step)).length > 0) ?? null;
}

/** The arguments `addGoal` takes, in its order's names. */
export interface NewGoal {
  title: string;
  target: number;
  current: number;
  unit: string;
  direction: GoalDirection;
  points: number;
  period: TimePeriod;
  customPeriodDays?: number;
  isUltimate: boolean;
  isRecurring: boolean;
  description?: string;
  icon: string;
  linkedRewardId?: number;
  subgoalsAwardPoints?: boolean;
  schedule?: GoalSchedule;
}

/**
 * The goal a ready draft becomes. `doneUnit` names a done-or-not goal's one
 * step, in the user's language.
 */
export function draftToGoal(draft: GoalDraft, doneUnit: string): NewGoal {
  const isUltimate = draft.trackBy === 'subgoals';
  const customPeriodDays = draft.period === 'custom' ? Number(draft.customPeriodDays) : undefined;
  const isRecurring = draft.repeat && canRepeat(draft);

  const measure =
    draft.trackBy === 'number'
      ? {
          target: Number(draft.target),
          current: Number(draft.current),
          unit: draft.unit.trim(),
          direction: draft.direction,
        }
      : draft.trackBy === 'done'
        ? { target: 1, current: 0, unit: doneUnit, direction: 'increase' as const }
        : // As the goal form makes one: progress comes from its subgoals.
          { target: 100, current: 0, unit: 'subgoals', direction: 'increase' as const };

  return {
    title: draft.title.trim(),
    ...measure,
    points: Number(draft.points),
    period: draft.period,
    customPeriodDays,
    isUltimate,
    isRecurring,
    description: draft.description.trim() || undefined,
    icon: draft.icon,
    linkedRewardId: draft.linkedRewardId,
    subgoalsAwardPoints: isUltimate ? draft.subgoalsAwardPoints : undefined,
    // Only a recurring goal keeps a schedule (see processRecurringGoals).
    schedule: isRecurring ? draft.schedule : undefined,
  };
}

/** A template picked to add, and - for a decreasing one - where the user starts. */
export interface TemplatePick {
  template: GoalTemplate;
  current?: number;
}

/**
 * `addGoal`'s arguments, in its order, for a new top-level goal. One mapping,
 * for the step-by-step form and template quick-add alike.
 */
export function addGoalArgs(goal: NewGoal) {
  return [
    goal.title,
    goal.target,
    goal.current,
    goal.unit,
    goal.direction,
    goal.points,
    goal.period,
    goal.customPeriodDays,
    undefined, // parentId: never a subgoal
    goal.isUltimate,
    goal.isRecurring,
    goal.description,
    goal.icon,
    goal.linkedRewardId,
    goal.subgoalsAwardPoints,
    goal.schedule,
  ] as const;
}

/**
 * Whether a template can be added as it is, in a batch: whether the goal it
 * makes passes every step's checks. Not one whose period is custom, since a
 * template keeps no length for it, nor one with a target the form refuses -
 * ticked, it was skipped without a word. Only a decreasing one's start is left
 * for the user, who gives it in its card (see draftFromTemplate).
 */
export function canQuickAdd(template: GoalTemplate): boolean {
  const draft = draftFromTemplate(template);
  return WIZARD_STEPS.every((step) => {
    const errors = stepErrors(draft, step);
    if (template.direction === 'decrease') delete errors.current;
    return Object.keys(errors).length === 0;
  });
}
