/**
 * AddGoalForm: what it hands back when it is submitted - editing a goal, and
 * adding one after another on the add screen, which stays mounted.
 */

import AddGoalForm from '@/components/AddGoalForm';
import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { LanguageProvider, useLanguage } from '@/src/context/LanguageContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { translations } from '@/src/i18n/translations';
import type { GoalSchedule } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';

jest.mock('@/src/context/RewardsContext', () => ({
  useRewards: () => ({ getAvailableRewards: () => [] }),
}));

const t = translations.en;

type FormProps = React.ComponentProps<typeof AddGoalForm>;
type Initial = NonNullable<FormProps['initialValues']>;

// The positions of onAddGoal's arguments this file checks.
const IS_RECURRING = 10;
const LINKED_REWARD = 13;
const SUBGOALS_AWARD_POINTS = 14;
const SCHEDULE = 15;

const goal: Initial = {
  title: 'Run',
  target: 10,
  current: 2,
  unit: 'km',
  direction: 'increase',
  points: 20,
  period: 'weekly',
};
const schedule: GoalSchedule = { daysOfWeek: [1, 3] };

/** Resolves once the language has loaded. Returns the submit callback. */
async function renderForm(props: Partial<FormProps> = {}) {
  await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en');
  let language = '';
  function Probe() {
    language = useLanguage().language;
    return null;
  }

  const onAddGoal = jest.fn();
  render(
    <LanguageProvider>
      <ThemeProvider>
        <Probe />
        <AddGoalForm onAddGoal={onAddGoal} {...props} />
      </ThemeProvider>
    </LanguageProvider>
  );
  await waitFor(() => expect(language).toBe('en'));
  return onAddGoal;
}

/** Press the form's button, then confirm. */
function submit(editMode = false) {
  fireEvent.press(screen.getByLabelText(editMode ? t.goalForm.editButton : t.goalForm.addButton));
  fireEvent.press(screen.getByLabelText(editMode ? t.common.save : t.common.add));
}

const type = (placeholder: string, text: string) =>
  fireEvent.changeText(screen.getByPlaceholderText(placeholder), text);

/** Fill in what a blank form needs before it can be submitted. */
function fillIn({ ultimate = false } = {}) {
  type(t.goalForm.titlePlaceholder, 'Next');
  if (!ultimate) {
    type(t.goalForm.currentPlaceholder, '0');
    type(t.goalForm.targetPlaceholder, '5');
    type(t.goalForm.unit, 'km');
  }
  type(t.goalForm.pointsPlaceholder, '10');
  type(t.goalForm.customPeriodPlaceholder, '3'); // the period starts as 'custom'
}

// react-native-dropdown-picker still uses React Native's own SafeAreaView,
// which warns that it is deprecated. Nothing this app can change.
const warn = console.warn;
let consoleWarn: jest.SpyInstance;

beforeEach(async () => {
  await AsyncStorage.clear();
  consoleWarn = jest.spyOn(console, 'warn').mockImplementation((message, ...rest) => {
    if (!String(message).includes('SafeAreaView has been deprecated')) warn(message, ...rest);
  });
});

afterEach(() => {
  consoleWarn.mockRestore();
});

describe('editing', () => {
  // Regression: the form started these at their defaults, so it showed the
  // wrong values and changing them did nothing. Now that an edit saves them,
  // starting at the defaults would clear them.
  it("keeps the goal's schedule", async () => {
    const onAddGoal = await renderForm({
      editMode: true,
      initialValues: { ...goal, isRecurring: true, schedule },
    });

    expect(screen.getByText(t.schedule.everyDays.replace('{days}', 'Mon, Wed'))).toBeTruthy();
    submit(true);

    expect(onAddGoal.mock.calls[0][SCHEDULE]).toEqual(schedule);
  });

  it('keeps whether its subgoals award points', async () => {
    const onAddGoal = await renderForm({
      editMode: true,
      initialValues: { ...goal, isUltimate: true, subgoalsAwardPoints: true },
    });

    submit(true);

    expect(onAddGoal.mock.calls[0][SUBGOALS_AWARD_POINTS]).toBe(true);
  });

  it('asks to save the changes rather than to add a goal', async () => {
    await renderForm({ editMode: true, initialValues: goal });

    fireEvent.press(screen.getByLabelText(t.goalForm.editButton));

    expect(screen.getByText(t.goalForm.confirmEditTitle)).toBeTruthy();
  });
});

describe('adding one goal after another', () => {
  // Regression: the reset after adding missed these, so the next goal got the
  // last one's reward (linking one reward to two goals) and schedule.
  it("starts without the last goal's reward or schedule", async () => {
    const onAddGoal = await renderForm({
      initialValues: { ...goal, isRecurring: true, schedule, linkedRewardId: 7 },
    });
    submit();
    expect(onAddGoal.mock.calls[0][LINKED_REWARD]).toBe(7);

    fillIn();
    fireEvent.press(screen.getByLabelText(t.goalForm.recurringGoal));
    submit();

    expect(onAddGoal).toHaveBeenCalledTimes(2);
    expect(onAddGoal.mock.calls[1][IS_RECURRING]).toBe(true);
    expect(onAddGoal.mock.calls[1][LINKED_REWARD]).toBeUndefined();
    expect(onAddGoal.mock.calls[1][SCHEDULE]).toBeUndefined();
  });

  it("starts without the last goal's subgoal points", async () => {
    const onAddGoal = await renderForm({
      initialValues: { ...goal, isUltimate: true, subgoalsAwardPoints: true },
    });
    submit();

    fillIn({ ultimate: true });
    fireEvent.press(screen.getByLabelText(t.goalForm.ultimateGoal));
    submit();

    expect(onAddGoal).toHaveBeenCalledTimes(2);
    expect(onAddGoal.mock.calls[1][SUBGOALS_AWARD_POINTS]).toBe(false);
  });
});

describe('custom period', () => {
  // Regression: "1.5" was accepted, and an import then took the period away.
  it('must be a whole number of days', async () => {
    const onAddGoal = await renderForm({ initialValues: { ...goal, period: 'custom' } });

    type(t.goalForm.customPeriodPlaceholder, '1.5');
    fireEvent.press(screen.getByLabelText(t.goalForm.addButton));

    expect(screen.getByText(t.validation.customPeriodWholeDays)).toBeTruthy();
    expect(onAddGoal).not.toHaveBeenCalled();
  });
});

describe('recurring', () => {
  // Regression: a goal with no deadline could be made recurring, and reset on
  // every load.
  it('is not offered for a goal with no deadline', async () => {
    const onAddGoal = await renderForm({
      initialValues: { ...goal, period: 'ongoing', isRecurring: true, schedule },
    });

    expect(screen.queryByLabelText(t.goalForm.recurringGoal)).toBeNull();
    submit();

    expect(onAddGoal.mock.calls[0][IS_RECURRING]).toBe(false);
    expect(onAddGoal.mock.calls[0][SCHEDULE]).toBeUndefined();
  });

  it('says when the goal resets, in words', async () => {
    await renderForm({ initialValues: { ...goal, period: 'monthly' } });

    expect(screen.getByText(t.goalForm.recurringResets.monthly)).toBeTruthy();
  });

  // Regression: the picker read the schedule only when it mounted, so choices
  // closed without Apply were still there next time - and Apply saved them.
  it('forgets schedule choices closed without Apply', async () => {
    const onAddGoal = await renderForm({ initialValues: { ...goal, isRecurring: true } });

    fireEvent.press(screen.getByText(t.schedule.everyDay));
    fireEvent.press(screen.getByText(t.schedule.specificDays));
    fireEvent.press(screen.getByLabelText(t.schedule.weekdayLong[1]));
    fireEvent.press(screen.getByLabelText(t.common.close));
    fireEvent.press(screen.getByText(t.schedule.everyDay));
    fireEvent.press(screen.getByText(t.common.apply));
    submit();

    expect(onAddGoal.mock.calls[0][SCHEDULE]).toBeUndefined();
  });

  it('drops the schedule when recurring is unticked', async () => {
    const onAddGoal = await renderForm({
      initialValues: { ...goal, isRecurring: true, schedule },
    });

    fireEvent.press(screen.getByLabelText(t.goalForm.recurringGoal));
    submit();

    expect(onAddGoal.mock.calls[0][SCHEDULE]).toBeUndefined();
  });
});
