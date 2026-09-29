/**
 * Adding goals through the real providers: several templates at once from the
 * picker, and one through the Add tab's step-by-step form.
 */

import AddGoalScreen from '@/app/(tabs)/add-goal';
import TemplatesModal from '@/components/TemplatesModal';
import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { GoalsProvider, useGoals } from '@/src/context/GoalsContext';
import { LanguageProvider } from '@/src/context/LanguageContext';
import { RewardsProvider } from '@/src/context/RewardsContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { useAddTemplates } from '@/src/hooks/use-add-templates';
import { translations } from '@/src/i18n/translations';
import type { GoalTemplate } from '@/src/types';
import type { TemplatePick } from '@/src/utils/goal-draft';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('@/src/utils/notifications', () => ({
  scheduleGoalNotification: jest.fn(async () => []),
  cancelGoalNotifications: jest.fn(async () => {}),
  NotificationPermissionError: class NotificationPermissionError extends Error {},
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn(), canGoBack: () => true }),
}));

const t = translations.en;
const w = t.goalWizard;

const press = (label: string) => fireEvent.press(screen.getByLabelText(label));
const type = (label: string, text: string) => fireEvent.changeText(screen.getByLabelText(label), text);
const startLabel = (unit: string) => t.templates.currentValue.replace('{unit}', unit);
const isDisabled = (label: string) => screen.getByLabelText(label).props.accessibilityState?.disabled === true;

/** Renders the app's providers around `children`; resolves once goals have loaded. */
async function renderApp(children: React.ReactNode) {
  let goals!: ReturnType<typeof useGoals>;
  function Probe() {
    goals = useGoals();
    return null;
  }
  render(
    <SafeAreaProvider
      initialMetrics={{ frame: { x: 0, y: 0, width: 400, height: 800 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}
    >
      <LanguageProvider>
        <ThemeProvider>
          <GoalsProvider>
            <RewardsProvider>
              <Probe />
              {children}
            </RewardsProvider>
          </GoalsProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
  // The file's first render loads the whole Add tab cold: under a full parallel
  // run it can take more than waitFor's default second.
  await waitFor(() => expect(goals.isLoading).toBe(false), { timeout: 5000 });
  return () => goals;
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en');
  mockPush.mockClear();
});

describe('the template picker', () => {
  async function renderPicker(props: { onCustomize?: (pick: TemplatePick) => void } = {}) {
    const onAdd = jest.fn(async (_picks: TemplatePick[]) => {});
    const onClose = jest.fn();
    await renderApp(<TemplatesModal visible onClose={onClose} onAdd={onAdd} {...props} />);
    await screen.findByLabelText('Drink Water');
    return { onAdd, onClose };
  }

  it('adds every template picked, at once', async () => {
    const { onAdd, onClose } = await renderPicker();
    expect(screen.getByText(t.templates.pickHint)).toBeTruthy();

    press('Drink Water');
    press('Run Distance');
    press('Build Muscle');
    press('Run Distance'); // and unpicked again
    press('Run Distance');
    await act(async () => press('Add 3 goals'));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0].map((pick) => pick.template.title)).toEqual([
      'Drink Water',
      'Build Muscle',
      'Run Distance',
    ]);
    expect(onClose).toHaveBeenCalled();
  });

  // Only the user knows where a decreasing goal starts; 0 put "Lose Weight"
  // past its 70 kg target.
  it('asks where a decreasing goal starts before adding it', async () => {
    const { onAdd } = await renderPicker();

    press('Lose Weight');
    expect(isDisabled('Add 1 goal')).toBe(true);

    type(startLabel('kg'), '60');
    expect(screen.getByText(t.validation.currentAboveTarget)).toBeTruthy();
    expect(isDisabled('Add 1 goal')).toBe(true);

    type(startLabel('kg'), '82');
    expect(screen.queryByText(t.validation.currentAboveTarget)).toBeNull();
    expect(isDisabled('Add 1 goal')).toBe(false);
    await act(async () => press('Add 1 goal'));

    expect(onAdd).toHaveBeenCalledWith([expect.objectContaining({ current: 82 })]);
  });

  // On web the tap went on to the card, unticking it and taking the field away.
  it('keeps a card ticked when its start field is tapped', async () => {
    await renderPicker();

    press('Lose Weight');
    fireEvent.press(screen.getByLabelText(startLabel('kg')), { stopPropagation: () => {} });

    expect(screen.getByLabelText(startLabel('kg'))).toBeTruthy();
    expect(screen.getByLabelText('Add 1 goal')).toBeTruthy();
  });

  // A saved template keeps no length for a custom period.
  it("can't pick a saved template with a custom period", async () => {
    const template: GoalTemplate = {
      id: 'custom_1',
      title: 'Fortnight Plan',
      category: 'other',
      description: 'Mine',
      target: 5,
      unit: 'tasks',
      direction: 'increase',
      points: 20,
      period: 'custom',
      icon: '🗓️',
    };
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TEMPLATES, JSON.stringify([template]));
    await renderPicker();

    const card = await screen.findByLabelText('Fortnight Plan');
    expect(card.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    expect(screen.getByText(t.templates.needsSetup)).toBeTruthy();
    // Disabled, the press goes on to the modal, which stops it there.
    fireEvent.press(card, { stopPropagation: () => {} });
    expect(screen.getByText(t.templates.pickHint)).toBeTruthy();
  });

  it('offers Customize for exactly one', async () => {
    const onCustomize = jest.fn();
    await renderPicker({ onCustomize });

    press('Drink Water');
    expect(screen.getByLabelText(t.templates.customize)).toBeTruthy();
    press('Build Muscle');
    expect(screen.queryByLabelText(t.templates.customize)).toBeNull();
    press('Build Muscle');
    press(t.templates.customize);

    expect(onCustomize).toHaveBeenCalledWith({ template: expect.objectContaining({ title: 'Drink Water' }) });
  });
});

describe('useAddTemplates', () => {
  let addTemplates!: ReturnType<typeof useAddTemplates>;
  function Adder() {
    addTemplates = useAddTemplates();
    return null;
  }

  const template = (overrides: Partial<GoalTemplate>): GoalTemplate => ({
    id: 't',
    title: 'Template',
    category: 'other',
    description: 'From a template',
    target: 10,
    unit: 'x',
    direction: 'increase',
    points: 25,
    period: 'daily',
    icon: '⭐',
    ...overrides,
  });

  it('adds each as the form would with nothing changed, and counts them', async () => {
    const goals = await renderApp(<Adder />);

    let added = 0;
    await act(async () => {
      added = await addTemplates([
        { template: template({ title: 'Water', period: 'daily' }) },
        { template: template({ title: 'Family', period: 'weekly' }) },
        { template: template({ title: 'Muscle', period: 'monthly' }) },
        { template: template({ title: 'Weight', direction: 'decrease', target: 70, period: 'monthly' }), current: 82 },
        // No start for a decreasing goal: skipped, not saved half-made.
        { template: template({ title: 'Debt', direction: 'decrease', target: 0, period: 'yearly' }) },
      ]);
    });

    expect(added).toBe(4);
    const byTitle = new Map(goals().goals.map((goal) => [goal.title, goal]));
    expect([...byTitle.keys()].sort()).toEqual(['Family', 'Muscle', 'Water', 'Weight']);
    expect(byTitle.get('Water')).toEqual(
      expect.objectContaining({ isRecurring: true, current: 0, points: 25, icon: '⭐', description: 'From a template' })
    );
    expect(byTitle.get('Family')?.isRecurring).toBe(true);
    expect(byTitle.get('Muscle')?.isRecurring).toBe(false);
    expect(byTitle.get('Weight')).toEqual(expect.objectContaining({ current: 82, target: 70, direction: 'decrease' }));
    expect(new Set(goals().goals.map((goal) => goal.id)).size).toBe(4);
  });

  // "Reduce Debt", "Process Emails": templates that go down to 0 were refused
  // everywhere; ticked, they were skipped without a word.
  it('adds a goal going down to 0, which completes when it gets there', async () => {
    const goals = await renderApp(<Adder />);

    await act(async () => {
      await addTemplates([{ template: template({ title: 'Inbox', direction: 'decrease', target: 0, period: 'ongoing' }), current: 40 }]);
    });
    const [inbox] = goals().goals;
    expect(inbox).toMatchObject({ target: 0, current: 40, direction: 'decrease', progress: 0 });

    await act(async () => {
      await goals().updateGoal(inbox.id, 10);
    });
    expect(goals().goals[0].progress).toBe(75);

    await act(async () => {
      await goals().updateGoal(inbox.id, 0);
    });
    expect(goals().goals[0]).toMatchObject({ isComplete: true, progress: 100 });
    expect(goals().lifetimePointsEarned).toBeGreaterThanOrEqual(25);
  });

  it('stops while an import is being applied', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const goals = await renderApp(<Adder />);

    let added = -1;
    await act(async () => {
      await goals().withGoalsHeld(async () => {
        added = await addTemplates([{ template: template({ title: 'Water' }) }, { template: template({ title: 'Walk' }) }]);
      });
    });

    expect(added).toBe(0);
    expect(goals().goals).toEqual([]);
    (console.error as jest.Mock).mockRestore();
  });
});

describe('the Add tab', () => {
  it('adds the goal, goes home and starts the next one empty', async () => {
    const goals = await renderApp(<AddGoalScreen />);

    type(t.goalForm.titleLabel, 'Meditate');
    press(w.next);
    press(w.trackDone);
    press(w.next);
    press(w.next);
    await act(async () => press(w.create));

    expect(goals().goals).toEqual([
      expect.objectContaining({ title: 'Meditate', target: 1, unit: w.doneUnit, isRecurring: true, points: 10 }),
    ]);
    expect(mockPush).toHaveBeenCalledWith('/home');
    // This tab stays mounted: the next goal starts at step 1, with nothing in it.
    expect(screen.getByText(w.whatTitle)).toBeTruthy();
    expect(screen.getByLabelText(t.goalForm.titleLabel).props.value).toBe('');
  });

  it('opens a customized template ready to create', async () => {
    const goals = await renderApp(<AddGoalScreen />);

    press(t.templates.useTemplate);
    fireEvent.press(await screen.findByLabelText('Drink Water'));
    press(t.templates.customize);

    expect(await screen.findByText(w.worthTitle)).toBeTruthy();
    await act(async () => press(w.create));

    expect(goals().goals).toEqual([
      expect.objectContaining({ title: 'Drink Water', target: 8, unit: 'glasses', period: 'daily', isRecurring: true }),
    ]);
  });

  it('adds several templates and goes home', async () => {
    const goals = await renderApp(<AddGoalScreen />);

    press(t.templates.useTemplate);
    fireEvent.press(await screen.findByLabelText('Drink Water'));
    press('Run Distance');
    await act(async () => press('Add 2 goals'));

    expect(goals().goals.map((goal) => goal.title).sort()).toEqual(['Drink Water', 'Run Distance']);
    expect(mockPush).toHaveBeenCalledWith('/home');
  });
});
