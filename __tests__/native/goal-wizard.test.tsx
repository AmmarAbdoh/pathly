/**
 * GoalWizard: a new goal in four short steps.
 */

import GoalWizard from '@/components/GoalWizard';
import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { LanguageProvider, useLanguage } from '@/src/context/LanguageContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { translations } from '@/src/i18n/translations';
import type { GoalTemplate } from '@/src/types';
import { draftFromTemplate, type GoalDraft, type WizardStep } from '@/src/utils/goal-draft';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/src/context/RewardsContext', () => ({
  useRewards: () => ({ getAvailableRewards: () => [] }),
}));

const t = translations.en;
const w = t.goalWizard;

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

/** Resolves once the language has loaded. Returns the create callback. */
async function renderWizard(props: { initialDraft?: GoalDraft; initialStep?: WizardStep } = {}) {
  await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en');
  let language = '';
  function Probe() {
    language = useLanguage().language;
    return null;
  }
  const onCreate = jest.fn();
  render(
    <LanguageProvider>
      <ThemeProvider>
        <Probe />
        <GoalWizard onCreate={onCreate} {...props} />
      </ThemeProvider>
    </LanguageProvider>
  );
  await waitFor(() => expect(language).toBe('en'));
  return onCreate;
}

const press = (label: string) => fireEvent.press(screen.getByLabelText(label));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);
/** Create finishes after `onCreate` resolves. */
const create = () => act(async () => press(w.create));

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('makes a goal in four steps, with the defaults it can', async () => {
  const onCreate = await renderWizard();

  type(t.goalForm.titleLabel, 'Read');
  press(w.next);
  type(t.goalForm.targetLabel, '20');
  type(t.goalForm.unitLabel, 'pages');
  press(w.next);
  press(w.next); // daily, and repeating: the defaults
  await create();

  expect(onCreate).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'Read',
      target: 20,
      current: 0,
      unit: 'pages',
      direction: 'increase',
      period: 'daily',
      isRecurring: true,
      points: 10,
      isUltimate: false,
    })
  );
});

it('stays on a step with something to fix, and says what', async () => {
  const onCreate = await renderWizard();

  press(w.next);

  expect(screen.getByText(t.validation.titleRequired)).toBeTruthy();
  expect(screen.getByText(w.whatTitle)).toBeTruthy();
  expect(onCreate).not.toHaveBeenCalled();
});

it('keeps what was entered when going back', async () => {
  await renderWizard();

  type(t.goalForm.titleLabel, 'Read');
  press(w.next);
  press(w.back);

  expect(screen.getByLabelText(t.goalForm.titleLabel).props.value).toBe('Read');
});

it('suggests points for the period, until they are typed', async () => {
  await renderWizard();
  type(t.goalForm.titleLabel, 'Read');
  press(w.next);
  press(w.trackDone);
  press(w.next);
  press(t.goalForm.periodWeekly);
  press(w.next);

  expect(screen.getByLabelText(t.goalForm.pointsLabel).props.value).toBe('30');
  expect(screen.getByText(w.suggestedFor.weekly)).toBeTruthy();

  type(t.goalForm.pointsLabel, '45');
  press(w.back);
  press(t.goalForm.periodMonthly);
  press(w.next);

  expect(screen.getByLabelText(t.goalForm.pointsLabel).props.value).toBe('45');
});

it('makes a done-or-not goal, with nothing to fill in', async () => {
  const onCreate = await renderWizard();
  type(t.goalForm.titleLabel, 'Meditate');
  press(w.next);
  press(w.trackDone);
  press(w.next);
  press(w.next);
  await create();

  expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ target: 1, current: 0, unit: w.doneUnit }));
});

// An ultimate goal cannot repeat: offered, the choice was dropped silently.
it('offers no repeat for a goal made of smaller steps', async () => {
  const onCreate = await renderWizard();
  type(t.goalForm.titleLabel, 'Learn Spanish');
  press(w.next);
  press(w.trackSubgoals);
  press(w.next);

  press(t.goalForm.periodDaily);
  expect(screen.queryByLabelText(w.repeatEvery.daily)).toBeNull();

  press(w.next);
  await create();
  expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ isUltimate: true, isRecurring: false }));
});

// A big goal due by midnight made no sense: it started at Daily.
it('gives a goal made of smaller steps no deadline, until one is picked', async () => {
  const onCreate = await renderWizard();
  type(t.goalForm.titleLabel, 'Learn Spanish');
  press(w.next);
  press(w.trackSubgoals);
  press(w.next);

  const checked = (label: string) => screen.getByLabelText(label).props.accessibilityState?.checked;
  expect(checked(w.noDeadline)).toBe(true);
  press(t.goalForm.periodWeekly);
  press(w.back);
  press(w.trackNumber);
  press(w.trackSubgoals);
  press(w.next);
  expect(checked(t.goalForm.periodWeekly)).toBe(true);

  press(t.goalForm.periodYearly);
  press(w.next);
  await create();
  expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ isUltimate: true, period: 'yearly' }));
});

it('lets repeat be turned off', async () => {
  const onCreate = await renderWizard();
  type(t.goalForm.titleLabel, 'Read');
  press(w.next);
  press(w.trackDone);
  press(w.next);
  press(w.repeatEvery.daily);
  press(w.next);
  await create();

  expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ isRecurring: false }));
});

it('opens a template at the last step, ready to create', async () => {
  const onCreate = await renderWizard({ initialDraft: draftFromTemplate(template()), initialStep: 4 });

  await create();

  expect(onCreate).toHaveBeenCalledWith(
    expect.objectContaining({ title: 'Read Books', target: 12, unit: 'books', points: 150, period: 'yearly' })
  );
});

// A decreasing template's start is the user's to give: create sends them to it.
it('sends you back to a step a template left unfilled', async () => {
  const draft = draftFromTemplate(template({ title: 'Lose Weight', direction: 'decrease', target: 70, unit: 'kg' }));
  const onCreate = await renderWizard({ initialDraft: draft, initialStep: 4 });

  await create();

  expect(onCreate).not.toHaveBeenCalled();
  expect(screen.getByText(w.trackTitle)).toBeTruthy();
  expect(screen.getByText(t.validation.currentRequired)).toBeTruthy();

  type(w.startAt, '82');
  press(w.next);
  press(w.next);
  await create();
  expect(onCreate).toHaveBeenCalledWith(expect.objectContaining({ current: 82, target: 70, direction: 'decrease' }));
});

it('checks a custom period is at least a day', async () => {
  await renderWizard();
  type(t.goalForm.titleLabel, 'Read');
  press(w.next);
  press(w.trackDone);
  press(w.next);
  press(t.goalForm.periodCustom);
  type(t.goalForm.customPeriodDays, '0.5');
  press(w.next);

  expect(screen.getByText(t.validation.customPeriodRange.replace('{max}', '3650'))).toBeTruthy();
});
