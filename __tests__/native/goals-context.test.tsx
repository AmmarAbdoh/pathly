/**
 * GoalsContext, rendered for real.
 *
 * These cover the behaviour that lives in the provider rather than in the pure
 * helpers it calls: the debounced persistence, the ref/state bookkeeping that
 * makes mutators stable, and the points rules that depend on both.
 */

import { STORAGE_KEYS } from '@/src/constants/storage-keys';
import { GoalsProvider, useGoals } from '@/src/context/GoalsContext';
import { Goal } from '@/src/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

/** Mirrors SAVE_DEBOUNCE_MS in GoalsContext. */
const SAVE_DEBOUNCE_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const makeGoal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: 1,
    title: 'Read books',
    target: 10,
    current: 0,
    initialValue: 0,
    unit: 'books',
    progress: 0,
    points: 50,
    direction: 'increase',
    period: 'ongoing',
    periodStartDate: Date.now(),
    createdAt: Date.now(),
    subGoals: [],
    isComplete: false,
    completionHistory: [],
    ...overrides,
  }) as Goal;

async function seed(goals: Goal[], lifetimePoints = 0) {
  await AsyncStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
  await AsyncStorage.setItem(STORAGE_KEYS.LIFETIME_POINTS, String(lifetimePoints));
}

async function storedGoals(): Promise<Goal[]> {
  return JSON.parse((await AsyncStorage.getItem(STORAGE_KEYS.GOALS)) ?? '[]');
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GoalsProvider>{children}</GoalsProvider>
);

async function renderGoals() {
  const view = renderHook(() => useGoals(), { wrapper });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('loading', () => {
  it('loads persisted goals and lifetime points on mount', async () => {
    await seed([makeGoal()], 120);
    const { result } = await renderGoals();

    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0].title).toBe('Read books');
    expect(result.current.lifetimePointsEarned).toBe(120);
  });

  it('derives lifetime points from completed goals when none are stored yet', async () => {
    // First run after upgrading from a version that did not track them.
    await AsyncStorage.setItem(
      STORAGE_KEYS.GOALS,
      JSON.stringify([
        makeGoal({ id: 1, isComplete: true, points: 30 }),
        makeGoal({ id: 2, isComplete: false, points: 99 }),
      ])
    );
    const { result } = await renderGoals();

    expect(result.current.lifetimePointsEarned).toBe(30);
    expect(await AsyncStorage.getItem(STORAGE_KEYS.LIFETIME_POINTS)).toBe('30');
  });
});

describe('goals saved as recurring that cannot recur', () => {
  // Regression: the form allowed recurring with 'Ongoing'. Such a period
  // "ends" where it starts, so the goal was reset - its progress lost - on
  // every load and refresh.
  it('stop recurring, and keep their progress', async () => {
    const monthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    await seed([
      makeGoal({
        isRecurring: true,
        period: 'ongoing',
        periodStartDate: monthAgo,
        current: 5,
        progress: 50,
        schedule: { daysOfWeek: [1] },
      }),
    ]);
    const { result } = await renderGoals();

    // Its schedule goes too: it hid the goal on the other days, and the form
    // offers a schedule only for a recurring goal.
    expect(result.current.goals[0]).toMatchObject({ isRecurring: false, current: 5, schedule: undefined });
    await act(async () => {
      await result.current.refreshGoals();
    });
    expect(result.current.goals[0].current).toBe(5);
    expect((await storedGoals())[0].isRecurring).toBe(false);
  });

  it('a goal that does not recur loses its schedule, on disk too', async () => {
    await seed([makeGoal({ isRecurring: false, schedule: { daysOfWeek: [1] } })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.refreshGoals();
    });

    expect(result.current.goals[0].schedule).toBeUndefined();
    expect((await storedGoals())[0].schedule).toBeUndefined();
  });
});

describe('points', () => {
  it('awards a goal its points exactly once, however often it is set to complete', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(1, 10);
    });
    expect(result.current.goals[0].isComplete).toBe(true);
    expect(result.current.lifetimePointsEarned).toBe(50);

    await act(async () => {
      await result.current.updateGoal(1, 10);
    });
    await act(async () => {
      await result.current.finishGoal(1);
    });
    expect(result.current.lifetimePointsEarned).toBe(50);
  });

  // Regression: any return to complete counted as a first completion, so -1
  // then +1 paid the points again - and could redeem a linked reward.
  it('pays out once for a goal completed, set back and completed again', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    const completed = jest.fn();
    result.current.onGoalCompleted(completed);

    for (const value of [10, 9, 10, 9]) {
      await act(async () => {
        await result.current.updateGoal(1, value);
      });
    }
    await act(async () => {
      await result.current.finishGoal(1);
    });

    expect(result.current.lifetimePointsEarned).toBe(50);
    expect(completed).toHaveBeenCalledTimes(1);
  });

  // 0 is a time too: checked by truthiness, a goal completed then (an
  // import can say so) paid out again.
  it('counts a completion at time 0 as a completion', async () => {
    await seed([makeGoal({ id: 1, completedAt: 0 }), makeGoal({ id: 2, completedAt: 0 })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(1, 10);
    });
    await act(async () => {
      await result.current.finishGoal(2);
    });

    expect(result.current.lifetimePointsEarned).toBe(0);
  });

  it('pays out again for each new period of a recurring goal', async () => {
    await seed([makeGoal({ period: 'weekly', isRecurring: true })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(1, 10);
    });
    await act(async () => {
      await result.current.resetRecurringGoal(1);
    });
    await act(async () => {
      await result.current.updateGoal(1, 10);
    });

    expect(result.current.lifetimePointsEarned).toBe(100);
  });

  it('only lets a subgoal award points when its parent opts in', async () => {
    const parent = (optIn: boolean, id: number, subId: number) =>
      makeGoal({ id, isUltimate: true, subgoalsAwardPoints: optIn, subGoals: [subId], points: 0 });
    const sub = (id: number, parentId: number) => makeGoal({ id, parentId, points: 25 });

    await seed([parent(false, 1, 2), sub(2, 1), parent(true, 3, 4), sub(4, 3)]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(2, 10);
    });
    expect(result.current.lifetimePointsEarned).toBe(0);

    await act(async () => {
      await result.current.updateGoal(4, 10);
    });
    expect(result.current.lifetimePointsEarned).toBe(25);
  });
});

describe('subgoal roll-up', () => {
  it('recalculates the parent when a subgoal changes', async () => {
    await seed([
      makeGoal({ id: 1, isUltimate: true, subGoals: [2, 3] }),
      makeGoal({ id: 2, parentId: 1 }),
      makeGoal({ id: 3, parentId: 1 }),
    ]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(2, 10); // one of two subgoals done
    });

    const parent = result.current.goals.find((g) => g.id === 1);
    expect(parent?.progress).toBe(50);
  });

  it('detaches an archived subgoal from its parent and recalculates', async () => {
    await seed([
      makeGoal({ id: 1, isUltimate: true, subGoals: [2, 3], progress: 50 }),
      makeGoal({ id: 2, parentId: 1, current: 10, progress: 100, isComplete: true }),
      makeGoal({ id: 3, parentId: 1 }),
    ]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.archiveGoal(3); // the incomplete one
    });

    const parent = result.current.goals.find((g) => g.id === 1);
    expect(parent?.subGoals).toEqual([2]);
    expect(parent?.progress).toBe(100);
    expect(result.current.goals.find((g) => g.id === 3)?.isArchived).toBe(true);
  });
});

describe('debounced persistence', () => {
  it('updates state immediately and storage only after the debounce', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(1, 4);
    });
    expect(result.current.goals[0].current).toBe(4);
    expect((await storedGoals())[0].current).toBe(0);

    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });
    expect((await storedGoals())[0].current).toBe(4);
  });

  it('coalesces a burst of mutations into a single write', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();
    // setItem is already a jest.fn in the async-storage mock. Spying on it would
    // return that same mock, and restoring the spy would wipe its implementation
    // and silently break every later test's writes - so only clear its calls.
    const setItem = AsyncStorage.setItem as jest.Mock;
    setItem.mockClear();

    await act(async () => {
      for (const value of [1, 2, 3, 4, 5]) {
        await result.current.updateGoal(1, value);
      }
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    const goalWrites = setItem.mock.calls.filter(([key]) => key === STORAGE_KEYS.GOALS);
    expect(goalWrites).toHaveLength(1);
    expect(JSON.parse(goalWrites[0][1])[0].current).toBe(5);
  });

  it('flushes a pending write when the provider unmounts', async () => {
    await seed([makeGoal()]);
    const { result, unmount } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(1, 6);
    });
    unmount();
    await act(async () => {
      await sleep(50); // well inside the debounce window
    });

    expect((await storedGoals())[0].current).toBe(6);
  });
});

describe('refreshGoals inside the debounce window', () => {
  /*
   * Regression: refreshGoals used to read storage without flushing, so a
   * refresh landing mid-debounce loaded pre-mutation data over newer in-memory
   * state. Because `wasComplete` is read from memory while lifetime points are
   * written immediately and never decrease, re-completing the reverted goal
   * paid out a second time.
   */

  it('keeps the in-flight update instead of reverting it', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(1, 10);
    });
    await act(async () => {
      await result.current.refreshGoals();
    });

    expect(result.current.goals[0].current).toBe(10);
    expect(result.current.goals[0].isComplete).toBe(true);
  });

  it('leaves storage and memory in agreement', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(1, 7);
    });
    await act(async () => {
      await result.current.refreshGoals();
    });
    await act(async () => {
      await sleep(SAVE_DEBOUNCE_MS + 100);
    });

    expect((await storedGoals())[0].current).toBe(result.current.goals[0].current);
  });

  it('does not award the same completion twice', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.updateGoal(1, 10);
    });
    await act(async () => {
      await result.current.refreshGoals();
    });
    await act(async () => {
      await result.current.updateGoal(1, 10);
    });

    expect(result.current.lifetimePointsEarned).toBe(50);
  });
});

// Linked-reward auto-redemption lives in RewardsContext: see rewards-context.test.

describe('resetRecurringGoal', () => {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const finishedToday = () =>
    makeGoal({
      period: 'weekly',
      isRecurring: true,
      periodStartDate: twoHoursAgo,
      current: 10,
      progress: 100,
      isComplete: true,
      completedAt: twoHoursAgo,
      completionHistory: [1_000],
      linkedRewardId: 7,
    });

  // Regression: the detail screen reset through editGoal, which only sets the
  // form's fields - the completion was never recorded, the period never
  // restarted, the goal stayed complete at 0%, and its reward was unlinked.
  it('records the completion and starts a new period', async () => {
    await seed([finishedToday()]);
    const { result } = await renderGoals();
    const before = Date.now();

    await act(async () => {
      await result.current.resetRecurringGoal(1);
    });

    const [goal] = result.current.goals;
    expect(goal).toMatchObject({ isComplete: false, current: 0, progress: 0, linkedRewardId: 7 });
    expect(goal.completedAt).toBeUndefined();
    expect(goal.completionHistory).toEqual([1_000, twoHoursAgo]);
    expect(goal.periodStartDate).toBeGreaterThanOrEqual(before);
  });

  it('keeps the history as it was when the goal was not completed', async () => {
    await seed([{ ...finishedToday(), isComplete: false, completedAt: undefined, current: 4, progress: 40 }]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.resetRecurringGoal(1);
    });

    expect(result.current.goals[0]).toMatchObject({ current: 0, completionHistory: [1_000] });
  });

  it('leaves a goal that is not recurring alone', async () => {
    await seed([makeGoal({ current: 4, progress: 40 })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.resetRecurringGoal(1);
    });

    expect(result.current.goals[0].current).toBe(4);
  });
});

describe('destructive and restorative mutations', () => {
  it('permanently deletes a goal together with its subgoals', async () => {
    await seed([
      makeGoal({ id: 1, isUltimate: true, subGoals: [2] }),
      makeGoal({ id: 2, parentId: 1 }),
      makeGoal({ id: 3 }),
    ]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.permanentlyDeleteGoal(1);
    });

    expect(result.current.goals.map((g) => g.id)).toEqual([3]);
  });

  it('detaches a permanently deleted subgoal from its parent', async () => {
    await seed([
      makeGoal({ id: 1, isUltimate: true, subGoals: [2, 3] }),
      makeGoal({ id: 2, parentId: 1, current: 10, progress: 100, isComplete: true }),
      makeGoal({ id: 3, parentId: 1 }),
    ]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.permanentlyDeleteGoal(3);
    });

    const parent = result.current.goals.find((g) => g.id === 1);
    expect(parent?.subGoals).toEqual([2]);
    expect(parent?.progress).toBe(100);
  });

  it('unarchives a goal and its subgoals', async () => {
    await seed([
      makeGoal({ id: 1, subGoals: [2], isArchived: true, archivedAt: 1 }),
      makeGoal({ id: 2, parentId: 1, isArchived: true, archivedAt: 1 }),
    ]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.unarchiveGoal(1);
    });

    for (const goal of result.current.goals) {
      expect(goal.isArchived).toBeUndefined();
      expect(goal.archivedAt).toBeUndefined();
    }
  });
});

describe('other mutations', () => {
  it('edits a goal and recalculates its progress', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.editGoal(1, '  Read more  ', 20, 5, 'books', 'increase', 50, 'ongoing');
    });

    expect(result.current.goals[0]).toMatchObject({ title: 'Read more', target: 20, progress: 25 });
  });

  // Regression: editGoal didn't take these, so the edit form couldn't save them.
  it('edits the schedule and whether subgoals award points', async () => {
    await seed([makeGoal({ period: 'weekly', isRecurring: true })]);
    const { result } = await renderGoals();
    const schedule = { daysOfWeek: [1, 3] };

    await act(async () => {
      await result.current.editGoal(
        1, 'Read books', 10, 0, 'books', 'increase', 50, 'weekly',
        undefined, false, true, undefined, undefined, undefined, true, schedule
      );
    });

    expect(result.current.goals[0]).toMatchObject({ isRecurring: true, subgoalsAwardPoints: true, schedule });
  });

  // Regression: progress was worked out from `current`, so an ultimate goal
  // showed 0% after any edit - even of its title - until a subgoal changed.
  it('keeps the progress a goal takes from its subgoals', async () => {
    await seed([
      makeGoal({ id: 1, isUltimate: true, subGoals: [2, 3], target: 100, unit: 'subgoals', progress: 50 }),
      makeGoal({ id: 2, parentId: 1, current: 10, progress: 100, isComplete: true }),
      makeGoal({ id: 3, parentId: 1 }),
    ]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.editGoal(1, 'Renamed', 100, 0, 'subgoals', 'increase', 50, 'ongoing', undefined, true);
    });

    expect(result.current.goals.find((g) => g.id === 1)).toMatchObject({ title: 'Renamed', progress: 50 });
  });

  it('assigns sort order from the given id sequence', async () => {
    await seed([makeGoal({ id: 1 }), makeGoal({ id: 2 }), makeGoal({ id: 3 })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.reorderGoals([3, 1, 2]);
    });

    const order = Object.fromEntries(result.current.goals.map((g) => [g.id, g.sortOrder]));
    expect(order).toEqual({ 1: 1, 2: 2, 3: 0 });
  });

  it('toggles pause and records when it was paused', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.togglePause(1);
    });
    expect(result.current.goals[0].isPaused).toBe(true);
    expect(result.current.goals[0].pausedAt).toEqual(expect.any(Number));

    await act(async () => {
      await result.current.togglePause(1);
    });
    expect(result.current.goals[0].isPaused).toBe(false);
    expect(result.current.goals[0].pausedAt).toBeUndefined();
  });

  it('adds and deletes notes', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addNote(1, '  first  ');
    });
    const note = result.current.goals[0].notes?.[0];
    expect(note?.text).toBe('first');

    await act(async () => {
      await result.current.deleteNote(1, note!.id);
    });
    expect(result.current.goals[0].notes).toEqual([]);
  });

  it('blocks a goal until every dependency is complete, and ignores duplicate dependencies', async () => {
    await seed([makeGoal({ id: 1 }), makeGoal({ id: 2 }), makeGoal({ id: 3 })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addDependency(1, 2);
      await result.current.addDependency(1, 2);
      await result.current.addDependency(1, 3);
    });
    expect(result.current.goals.find((g) => g.id === 1)?.dependsOn).toEqual([2, 3]);
    expect(result.current.checkDependencies(1)).toBe(false);

    await act(async () => {
      await result.current.finishGoal(2);
    });
    expect(result.current.checkDependencies(1)).toBe(false);

    await act(async () => {
      await result.current.removeDependency(1, 3);
    });
    expect(result.current.checkDependencies(1)).toBe(true);
  });

  it('extends a deadline by moving the period start', async () => {
    const start = Date.UTC(2026, 0, 1);
    await seed([makeGoal({ period: 'weekly', periodStartDate: start })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.extendDeadline(1, 3);
    });

    expect(result.current.goals[0].periodStartDate).toBe(start + 3 * 24 * 60 * 60 * 1000);
  });
});

describe('ids', () => {
  // Regression: ids were Date.now(), so goals added within one millisecond -
  // which JSON import does in a loop - all shared a single id.
  it('gives goals added back to back distinct ids', async () => {
    const { result } = await renderGoals();

    await act(async () => {
      for (let i = 0; i < 5; i += 1) {
        await result.current.addGoal(`Goal ${i}`, 10, 0, 'x', 'increase', 1, 'daily');
      }
    });

    const ids = result.current.goals.map((g) => g.id);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });

  it('updates only the goal it was asked to after a burst of adds', async () => {
    const { result } = await renderGoals();
    await act(async () => {
      await result.current.addGoal('A', 10, 0, 'x', 'increase', 1, 'daily');
      await result.current.addGoal('B', 10, 0, 'x', 'increase', 1, 'daily');
    });

    const [a, b] = result.current.goals;
    await act(async () => {
      await result.current.updateGoal(a.id, 5);
    });

    expect(result.current.goals.find((g) => g.id === a.id)?.current).toBe(5);
    expect(result.current.goals.find((g) => g.id === b.id)?.current).toBe(0);
  });

  it('gives notes added back to back distinct ids, so deleting one leaves the other', async () => {
    await seed([makeGoal()]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addNote(1, 'first');
      await result.current.addNote(1, 'second');
    });
    const [first] = result.current.goals[0].notes!;

    await act(async () => {
      await result.current.deleteNote(1, first.id);
    });

    expect(result.current.goals[0].notes?.map((n) => n.text)).toEqual(['second']);
  });
});

describe('adding goals', () => {
  it('adds a top-level goal with its initial progress', async () => {
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addGoal('  Run  ', 100, 25, ' km ', 'increase', 20, 'weekly');
    });

    expect(result.current.goals[0]).toMatchObject({
      title: 'Run',
      unit: 'km',
      target: 100,
      current: 25,
      initialValue: 25,
      progress: 25,
      period: 'weekly',
      isComplete: false,
    });
  });

  it('defaults an ultimate goal to not awarding subgoal points', async () => {
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addGoal('Big', 100, 0, 'x', 'increase', 0, 'ongoing', undefined, undefined, true);
    });

    expect(result.current.goals[0].subgoalsAwardPoints).toBe(false);
  });

  // Regression: the form offered "recurring" with "Ongoing", and such a goal
  // reset on every load - its period ends where it starts.
  it('only makes a goal recurring if its period can end', async () => {
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addGoal('A', 10, 0, 'x', 'increase', 5, 'ongoing', undefined, undefined, false, true);
      await result.current.addGoal('B', 10, 0, 'x', 'increase', 5, 'weekly', undefined, undefined, false, true);
    });
    const [a, b] = result.current.goals;
    expect(a.isRecurring).toBe(false);
    expect(b.isRecurring).toBe(true);

    await act(async () => {
      await result.current.editGoal(b.id, 'B', 10, 0, 'x', 'increase', 5, 'custom', undefined, false, true);
    });
    expect(result.current.goals[1].isRecurring).toBe(false);
  });

  it('keeps a schedule only on a recurring goal', async () => {
    const { result } = await renderGoals();
    const schedule = { daysOfWeek: [1] };

    await act(async () => {
      await result.current.addGoal('A', 10, 0, 'x', 'increase', 5, 'ongoing', undefined, undefined, false, true, undefined, undefined, undefined, undefined, schedule);
      await result.current.addGoal('B', 10, 0, 'x', 'increase', 5, 'weekly', undefined, undefined, false, true, undefined, undefined, undefined, undefined, schedule);
    });

    expect(result.current.goals.map((g) => g.schedule)).toEqual([undefined, schedule]);

    const b = result.current.goals[1];
    await act(async () => {
      await result.current.editGoal(b.id, 'B', 10, 0, 'x', 'increase', 5, 'ongoing', undefined, false, true, undefined, undefined, undefined, undefined, schedule);
    });
    expect(result.current.goals[1].schedule).toBeUndefined();
  });

  it('does not make a subgoal recurring', async () => {
    await seed([makeGoal({ id: 1, isUltimate: true })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addGoal('Step', 10, 0, 'x', 'increase', 0, 'daily', undefined, 1, false, true);
    });

    expect(result.current.goals.find((g) => g.parentId === 1)?.isRecurring).toBe(false);
  });

  it('attaches a subgoal to its parent and recalculates the parent', async () => {
    await seed([makeGoal({ id: 1, isUltimate: true, subGoals: [] })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addSubgoal(1, 'Step', 10, 10, 'x', 'increase', 0, 'daily');
    });

    const parent = result.current.goals.find((g) => g.id === 1);
    const child = result.current.goals.find((g) => g.parentId === 1);
    expect(parent?.subGoals).toEqual([child?.id]);
    expect(result.current.getSubgoals(1).map((g) => g.id)).toEqual([child?.id]);
  });

  // Regression: the subgoal form asks for these, and they were dropped.
  it("keeps a subgoal's description, icon and reward", async () => {
    await seed([makeGoal({ id: 1, isUltimate: true })]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.addSubgoal(1, 'Step', 10, 0, 'x', 'increase', 0, 'daily', undefined, 'First step', '🏃', 7);
    });

    expect(result.current.goals.find((g) => g.parentId === 1)).toMatchObject({
      description: 'First step',
      icon: '🏃',
      linkedRewardId: 7,
    });
  });

  it('recalculates on demand', async () => {
    // Parent progress deliberately stale in storage.
    await seed([
      makeGoal({ id: 1, isUltimate: true, subGoals: [2], progress: 0 }),
      makeGoal({ id: 2, parentId: 1, current: 10, progress: 100, isComplete: true }),
    ]);
    const { result } = await renderGoals();

    await act(async () => {
      await result.current.recalculateProgress(1);
    });

    expect(result.current.goals.find((g) => g.id === 1)?.progress).toBe(100);
  });
});

