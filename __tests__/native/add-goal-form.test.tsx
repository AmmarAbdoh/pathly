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
const CURRENT = 2;
const PERIOD = 6;
const CUSTOM_PERIOD_DAYS = 7;
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
    type(t.goalForm.targetPlaceholder, '5');
    type(t.goalForm.unit, 'km');
  }
  type(t.goalForm.pointsPlaceholder, '10');
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

  // Regression: its heading said "Add a new goal".
  it('is headed as an edit', async () => {
    await renderForm({ editMode: true, initialValues: goal });

    expect(screen.getByText(translations.en.goalDetail.editGoal)).toBeTruthy();
    expect(screen.queryByText(t.goalForm.title)).toBeNull();
  });
});

describe('adding one goal after another', () => {
  // Regression: the reset after adding missed this, so the next goal got the
  // last one's reward, linking one reward to two goals. (The schedule was
  // missed too; the next goal now starts with no deadline, which can't repeat.)
  it("starts without the last goal's reward, at 0 with no deadline", async () => {
    const onAddGoal = await renderForm({
      initialValues: { ...goal, isRecurring: true, schedule, linkedRewardId: 7 },
    });
    submit();
    expect(onAddGoal.mock.calls[0][LINKED_REWARD]).toBe(7);

    fillIn();
    submit();

    expect(onAddGoal).toHaveBeenCalledTimes(2);
    expect(onAddGoal.mock.calls[1][LINKED_REWARD]).toBeUndefined();
    expect(onAddGoal.mock.calls[1][CURRENT]).toBe(0);
    expect(onAddGoal.mock.calls[1][PERIOD]).toBe('ongoing');
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

describe('validation', () => {
  // Regression: the form never ran the shared rules, so only the input's
  // maxLength stopped a long title - and a title set any other way got through.
  it('rejects a title over 100 characters', async () => {
    const onAddGoal = await renderForm({ initialValues: goal });

    type(t.goalForm.titlePlaceholder, 'x'.repeat(101));
    fireEvent.press(screen.getByLabelText(t.goalForm.addButton));

    expect(screen.getByText(t.validation.titleTooLong)).toBeTruthy();
    expect(onAddGoal).not.toHaveBeenCalled();
  });

  // Regression: a decreasing goal from 0 to 70 kg - what the "Lose Weight"
  // template filled in - was accepted.
  it('rejects a decreasing goal that starts past its target', async () => {
    const onAddGoal = await renderForm({
      initialValues: { ...goal, direction: 'decrease', current: 60, target: 70 },
    });

    fireEvent.press(screen.getByLabelText(t.goalForm.addButton));

    expect(screen.getByText(t.validation.currentAboveTarget)).toBeTruthy();
    expect(onAddGoal).not.toHaveBeenCalled();
  });

  it('says a negative start must be at least 0', async () => {
    await renderForm({ initialValues: goal });

    type(t.goalForm.currentPlaceholder, '-1');
    fireEvent.press(screen.getByLabelText(t.goalForm.addButton));

    expect(screen.getByText(t.validation.currentMin)).toBeTruthy();
  });

  // A completed goal sits at its target; only its title and such can change.
  it('still saves a completed goal', async () => {
    const onAddGoal = await renderForm({
      editMode: true,
      isCompleted: true,
      initialValues: { ...goal, current: 10 },
    });

    submit(true);

    expect(onAddGoal).toHaveBeenCalledTimes(1);
  });
});

describe('subgoal points', () => {
  // Regression: the form asked for points under a parent that doesn't let
  // subgoals award them, and they were never paid.
  it("says a parent's subgoals don't award points, rather than asking for them", async () => {
    await renderForm({ parentId: 1 });

    expect(screen.getByText(t.goalForm.subgoalNoPoints)).toBeTruthy();
    expect(screen.queryByLabelText(t.goalForm.pointsLabel)).toBeNull();
  });

  it('asks for points when the parent lets subgoals award them', async () => {
    await renderForm({ parentId: 1, parentAwardsPoints: true });

    expect(screen.getByLabelText(t.goalForm.pointsLabel)).toBeTruthy();
  });

  // Regression: the form started at a Custom period with no days and no start,
  // so a title, target and unit weren't enough; and its summary listed points
  // the parent doesn't pay.
  it('adds one from a title, target and unit, without showing points', async () => {
    const onAddGoal = await renderForm({ parentId: 1 });

    type(t.goalForm.titlePlaceholder, 'Vocabulary');
    fireEvent.changeText(screen.getByLabelText(t.goalForm.targetLabel), '100');
    fireEvent.changeText(screen.getByLabelText(t.goalForm.unitLabel), 'words');
    fireEvent.press(screen.getByLabelText(translations.en.goalDetail.addSubgoal));

    expect(screen.queryByText(new RegExp(t.goalForm.points))).toBeNull();
    fireEvent.press(screen.getByLabelText(t.common.add));
    expect(onAddGoal).toHaveBeenCalledTimes(1);
    expect(onAddGoal.mock.calls[0].slice(0, 4)).toEqual(['Vocabulary', 100, 0, 'words']);
  });
});

describe('a target of 0', () => {
  // Inbox zero, a debt paid off: a goal going down may aim for 0. The form
  // refused it, and with it three templates.
  it('is taken for a goal going down', async () => {
    const onAddGoal = await renderForm({
      editMode: true,
      initialValues: { ...goal, direction: 'decrease', target: 0, current: 40 },
    });

    submit(true);

    expect(onAddGoal).toHaveBeenCalledTimes(1);
    expect(onAddGoal.mock.calls[0][1]).toBe(0);
  });

  it('is refused for a goal going up', async () => {
    const onAddGoal = await renderForm({ editMode: true, initialValues: { ...goal, target: 0, current: 0 } });

    fireEvent.press(screen.getByLabelText(t.goalForm.editButton));

    expect(screen.getByText(t.validation.targetPositive)).toBeTruthy();
    expect(onAddGoal).not.toHaveBeenCalled();
  });
});

describe('custom period', () => {
  it('must be a day or more', async () => {
    const onAddGoal = await renderForm({ initialValues: { ...goal, period: 'custom' } });

    type(t.goalForm.customPeriodPlaceholder, '0.5');
    fireEvent.press(screen.getByLabelText(t.goalForm.addButton));

    expect(screen.getByText(t.validation.customPeriodRange.replace('{max}', '3650'))).toBeTruthy();
    expect(onAddGoal).not.toHaveBeenCalled();
  });

  // Regression: the form asked for whole days, so a goal saved with "1.5"
  // could not be edited at all until its period was changed.
  it('takes a saved period of a day and a half', async () => {
    const onAddGoal = await renderForm({
      editMode: true,
      initialValues: { ...goal, period: 'custom', customPeriodDays: 1.5 },
    });

    submit(true);

    expect(onAddGoal.mock.calls[0][CUSTOM_PERIOD_DAYS]).toBe(1.5);
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
