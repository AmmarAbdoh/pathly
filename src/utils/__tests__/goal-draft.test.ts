/**
 * The step-by-step form's goal: defaults, the checks each step makes, and the
 * goal it becomes.
 */

import { getGoalTemplates } from '../../constants/goal-templates';
import type { GoalTemplate } from '../../types';
import {
  addGoalArgs,
  canQuickAdd,
  canRepeat,
  draftFromTemplate,
  draftToGoal,
  emptyDraft,
  firstStepWithErrors,
  type GoalDraft,
  repeatsByDefault,
  stepErrors,
  suggestedPoints,
  withPeriod,
  withTrackBy,
} from '../goal-draft';

const template = (overrides: Partial<GoalTemplate> = {}): GoalTemplate => ({
  id: 'read',
  title: 'Read Books',
  category: 'learning',
  description: 'Read more',
  target: 12,
  unit: 'books',
  direction: 'increase',
  points: 150,
  period: 'yearly',
  icon: '📚',
  ...overrides,
});

const draft = (overrides: Partial<GoalDraft> = {}): GoalDraft => ({
  ...emptyDraft(),
  title: 'Read',
  target: '20',
  unit: 'pages',
  ...overrides,
});

describe('defaults', () => {
  it('suggests more points for a longer period', () => {
    expect(suggestedPoints('daily')).toBe(10);
    expect(suggestedPoints('weekly')).toBe(30);
    expect(suggestedPoints('monthly')).toBe(100);
    expect(suggestedPoints('yearly')).toBe(300);
    expect(suggestedPoints('ongoing')).toBe(50);
  });

  it('scales a custom period by its days, within bounds', () => {
    expect(suggestedPoints('custom', 3)).toBe(30);
    expect(suggestedPoints('custom', 0.5)).toBe(10); // not a period: the floor
    expect(suggestedPoints('custom', 400)).toBe(300);
  });

  it('repeats daily and weekly goals', () => {
    expect(repeatsByDefault('daily')).toBe(true);
    expect(repeatsByDefault('weekly')).toBe(true);
    expect(repeatsByDefault('monthly')).toBe(false);
    expect(repeatsByDefault('ongoing')).toBe(false);
  });

  it('starts as a daily, repeating goal worth the daily suggestion', () => {
    expect(emptyDraft()).toMatchObject({ period: 'daily', repeat: true, points: '10', current: '0' });
  });
});

describe('withPeriod', () => {
  it('follows the period with its defaults', () => {
    expect(withPeriod(emptyDraft(), 'monthly')).toMatchObject({ period: 'monthly', repeat: false, points: '100' });
  });

  it('keeps points and repeat chosen by hand', () => {
    const chosen = { ...emptyDraft(), points: '75', pointsEdited: true, repeat: false, repeatChosen: true };
    expect(withPeriod(chosen, 'weekly')).toMatchObject({ points: '75', repeat: false });
  });
});

describe('draftFromTemplate', () => {
  it('fills every step from the template, keeping its points', () => {
    expect(draftFromTemplate(template())).toMatchObject({
      title: 'Read Books',
      icon: '📚',
      target: '12',
      unit: 'books',
      current: '0',
      period: 'yearly',
      repeat: false,
      points: '150',
      pointsEdited: true,
    });
  });

  // Regression: every template started at 0, so "Lose Weight" (70 kg, going
  // down) began past its target.
  it("leaves a decreasing goal's start for the user", () => {
    expect(draftFromTemplate(template({ direction: 'decrease', target: 70 })).current).toBe('');
  });
});

describe('stepErrors', () => {
  it('step 1: a title, of no more than 100 characters', () => {
    expect(stepErrors(draft({ title: '  ' }), 1)).toEqual({ title: 'titleRequired' });
    expect(stepErrors(draft({ title: 'x'.repeat(101) }), 1)).toEqual({ title: 'titleTooLong' });
    expect(stepErrors(draft(), 1)).toEqual({});
  });

  it('step 2: a number needs a target, a unit and a start', () => {
    expect(stepErrors(draft({ target: '', unit: '', current: '' }), 2)).toEqual({
      target: 'targetRequired',
      unit: 'unitRequired',
      current: 'currentRequired',
    });
    expect(stepErrors(draft({ target: 'lots', current: '-1' }), 2)).toMatchObject({
      target: 'targetPositive',
      current: 'currentMin',
    });
  });

  it('step 2: a start short of the target, in its direction', () => {
    expect(stepErrors(draft({ current: '20' }), 2)).toEqual({ current: 'currentBelowTarget' });
    expect(stepErrors(draft({ direction: 'decrease', target: '70', unit: 'kg', current: '60' }), 2)).toEqual({
      current: 'currentAboveTarget',
    });
    expect(stepErrors(draft({ direction: 'decrease', target: '70', unit: 'kg', current: '82' }), 2)).toEqual({});
  });

  it('step 2: a decreasing goal may aim for 0, not below', () => {
    const down = { direction: 'decrease' as const, unit: 'emails', current: '40' };
    expect(stepErrors(draft({ ...down, target: '0' }), 2)).toEqual({});
    expect(stepErrors(draft({ ...down, target: '-1' }), 2)).toEqual({ target: 'targetNotNegative' });
    expect(stepErrors(draft({ ...down, target: 'none' }), 2)).toEqual({ target: 'targetNotNegative' });
    expect(stepErrors(draft({ ...down, target: '0', current: '0' }), 2)).toEqual({ current: 'currentAboveTarget' });
    expect(stepErrors(draft({ target: '0' }), 2)).toEqual({ target: 'targetPositive' });
  });

  it('step 2: done-or-not and subgoal goals have nothing to fill in', () => {
    expect(stepErrors(draft({ trackBy: 'done', target: '', unit: '' }), 2)).toEqual({});
    expect(stepErrors(draft({ trackBy: 'subgoals', target: '', unit: '' }), 2)).toEqual({});
  });

  it('step 3: a custom period needs a length from 1 day', () => {
    expect(stepErrors(draft({ period: 'custom', customPeriodDays: '' }), 3)).toEqual({
      customPeriodDays: 'customPeriodRequired',
    });
    expect(stepErrors(draft({ period: 'custom', customPeriodDays: '0.5' }), 3)).toEqual({
      customPeriodDays: 'customPeriodRange',
    });
    expect(stepErrors(draft({ period: 'custom', customPeriodDays: '1.5' }), 3)).toEqual({});
  });

  it('step 4: points, from 0 up to the most allowed', () => {
    expect(stepErrors(draft({ points: '' }), 4)).toEqual({ points: 'pointsRequired' });
    expect(stepErrors(draft({ points: '-3' }), 4)).toEqual({ points: 'pointsValid' });
    expect(stepErrors(draft({ points: '1000000' }), 4)).toEqual({ points: 'pointsMax' });
    expect(stepErrors(draft({ points: '0' }), 4)).toEqual({});
  });

  it('finds the first step with something to fix', () => {
    expect(firstStepWithErrors(draft({ unit: '', points: '' }))).toBe(2);
    expect(firstStepWithErrors(draft())).toBeNull();
  });
});

describe('draftToGoal', () => {
  it('makes a counted goal', () => {
    expect(draftToGoal(draft({ description: '  ', current: '5' }), 'time')).toEqual({
      title: 'Read',
      target: 20,
      current: 5,
      unit: 'pages',
      direction: 'increase',
      points: 10,
      period: 'daily',
      customPeriodDays: undefined,
      isUltimate: false,
      isRecurring: true,
      description: undefined,
      icon: '🎯',
      linkedRewardId: undefined,
      subgoalsAwardPoints: undefined,
      schedule: undefined,
    });
  });

  it('makes a done-or-not goal a target of one', () => {
    expect(draftToGoal(draft({ trackBy: 'done' }), 'time')).toMatchObject({ target: 1, current: 0, unit: 'time' });
  });

  it('makes a subgoal goal an ultimate one, which cannot repeat', () => {
    const goal = draftToGoal(draft({ trackBy: 'subgoals', subgoalsAwardPoints: true }), 'time');

    expect(goal).toMatchObject({ isUltimate: true, isRecurring: false, subgoalsAwardPoints: true, unit: 'subgoals' });
    expect(canRepeat(draft({ trackBy: 'subgoals' }))).toBe(false);
  });

  it('repeats only where a goal can, and keeps a schedule only then', () => {
    const schedule = { daysOfWeek: [1, 3] };

    expect(draftToGoal(draft({ period: 'ongoing', repeat: true, schedule }), 'time')).toMatchObject({
      isRecurring: false,
      schedule: undefined,
    });
    expect(draftToGoal(draft({ repeat: true, schedule }), 'time')).toMatchObject({ isRecurring: true, schedule });
    expect(draftToGoal(draft({ repeat: false, schedule }), 'time').schedule).toBeUndefined();
  });

  it("gives a custom period its length", () => {
    expect(draftToGoal(draft({ period: 'custom', customPeriodDays: '3' }), 'time').customPeriodDays).toBe(3);
  });
});

describe('withTrackBy', () => {
  it('gives a goal made of smaller steps no deadline until a period is picked', () => {
    const big = withTrackBy(emptyDraft(), 'subgoals');
    expect(big).toMatchObject({ trackBy: 'subgoals', period: 'ongoing', points: '50', repeat: false });
    expect(withTrackBy(big, 'number')).toMatchObject({ period: 'daily', points: '10', repeat: true });
  });

  it("keeps a period picked by hand, or a template's", () => {
    const picked = { ...withPeriod(emptyDraft(), 'weekly'), periodChosen: true };
    expect(withTrackBy(picked, 'subgoals').period).toBe('weekly');
    expect(withTrackBy(draftFromTemplate(template()), 'subgoals').period).toBe('yearly');
  });
});

describe('addGoalArgs', () => {
  // Three optional booleans sit among addGoal's arguments: the types can't
  // catch two swapped, so each gets a different value here.
  it("puts each field where addGoal takes it, as a top-level goal", () => {
    const schedule = { daysOfWeek: [1, 3] };
    const args = addGoalArgs({
      title: 'Run',
      target: 5,
      current: 1,
      unit: 'km',
      direction: 'increase',
      points: 30,
      period: 'weekly',
      customPeriodDays: undefined,
      isUltimate: true,
      isRecurring: false,
      description: 'Easy pace',
      icon: '🏃',
      linkedRewardId: 7,
      subgoalsAwardPoints: undefined,
      schedule,
    });

    const [title, target, current, unit, direction, points, period, customPeriodDays, parentId,
      isUltimate, isRecurring, description, icon, linkedRewardId, subgoalsAwardPoints, kept] = args;
    expect({ title, target, current, unit, direction, points, period, customPeriodDays, parentId })
      .toEqual({ title: 'Run', target: 5, current: 1, unit: 'km', direction: 'increase', points: 30,
        period: 'weekly', customPeriodDays: undefined, parentId: undefined });
    expect({ isUltimate, isRecurring, subgoalsAwardPoints }).toEqual({ isUltimate: true, isRecurring: false, subgoalsAwardPoints: undefined });
    expect({ description, icon, linkedRewardId, kept }).toEqual({ description: 'Easy pace', icon: '🏃', linkedRewardId: 7, kept: schedule });
  });
});

describe('canQuickAdd', () => {
  // A template keeps no length for a custom period.
  it('is not for a custom-period template', () => {
    expect(canQuickAdd(template({ period: 'custom' }))).toBe(false);
    expect(canQuickAdd(template())).toBe(true);
  });

  // Ticked, a template the form refuses was skipped without a word.
  it('is not for a template whose goal the form would refuse', () => {
    expect(canQuickAdd(template({ target: 0 }))).toBe(false);
    expect(canQuickAdd(template({ target: -1, direction: 'decrease' }))).toBe(false);
    expect(canQuickAdd(template({ unit: '' }))).toBe(false);
    expect(canQuickAdd(template({ points: -1 }))).toBe(false);
  });

  it("leaves a decreasing template's start to the user", () => {
    expect(canQuickAdd(template({ direction: 'decrease', target: 70 }))).toBe(true);
    expect(canQuickAdd(template({ direction: 'decrease', target: 0 }))).toBe(true);
  });

  it.each(['en', 'ar'] as const)('takes every built-in template (%s)', (language) => {
    const refused = getGoalTemplates(language).filter((each) => !canQuickAdd(each)).map((each) => each.id);
    expect(refused).toEqual([]);
  });
});
