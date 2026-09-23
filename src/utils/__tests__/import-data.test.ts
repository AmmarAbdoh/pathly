/**
 * Tests for building app state from a backup.
 */

import type { Goal, Reward } from '../../types';
import { buildImport, deriveLifetimePoints, type AppData, type ImportedData } from '../import-data';

const NOW = 2_000_000_000_000;

const goal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: 1,
    title: 'Goal',
    target: 10,
    current: 0,
    initialValue: 0,
    unit: 'x',
    progress: 0,
    points: 10,
    direction: 'increase',
    period: 'weekly',
    periodStartDate: 1_000,
    createdAt: 1_000,
    subGoals: [],
    isComplete: false,
    completionHistory: [],
    ...overrides,
  }) as Goal;

const reward = (overrides: Partial<Reward> = {}): Reward => ({
  id: 1,
  title: 'Reward',
  description: 'desc',
  pointsCost: 50,
  icon: '🎁',
  createdAt: 1_000,
  isRedeemed: false,
  ...overrides,
});

const empty: AppData = { goals: [], rewards: [], lifetimePoints: 0 };
const file = (data: Partial<ImportedData>): ImportedData => ({
  goals: [],
  rewards: [],
  lifetimePoints: null,
  ...data,
});

const byTitle = (goals: Goal[], title: string) => goals.find((g) => g.title === title)!;

describe('what a record keeps', () => {
  // Regression: import re-created goals through addGoal, which kept only a few
  // fields - everything below was lost.
  it('keeps completion state, history, streaks, notes, schedule, order and archive state', () => {
    const rich = goal({
      title: 'Rich',
      current: 10,
      isComplete: true,
      completedAt: 5_000,
      isRecurring: true,
      completionHistory: [3_000, 4_000],
      currentStreak: 3,
      longestStreak: 7,
      notes: [{ id: 'n1', text: 'hello', createdAt: 2_000 }],
      schedule: { daysOfWeek: [1, 3] },
      sortOrder: 4,
      isPaused: true,
      isArchived: true,
      archivedAt: 6_000,
      category: 'fitness',
      icon: '🏃',
      description: 'desc',
      customPeriodDays: 3,
      notificationTime: 540,
    });

    const [imported] = buildImport(empty, file({ goals: [rich] }), 'replace', NOW).goals;

    expect(imported).toMatchObject({
      title: 'Rich',
      current: 10,
      isComplete: true,
      completedAt: 5_000,
      isRecurring: true,
      completionHistory: [3_000, 4_000],
      currentStreak: 3,
      longestStreak: 7,
      notes: [{ id: 'n1', text: 'hello', createdAt: 2_000 }],
      schedule: { daysOfWeek: [1, 3] },
      sortOrder: 4,
      isPaused: true,
      isArchived: true,
      archivedAt: 6_000,
      category: 'fitness',
      icon: '🏃',
      description: 'desc',
      customPeriodDays: 3,
      notificationTime: 540,
    });
  });

  // Regression: rewards came back unredeemed.
  it('keeps redeemed rewards redeemed', () => {
    const [imported] = buildImport(
      empty,
      file({ rewards: [reward({ isRedeemed: true, redeemedAt: 7_000 })] }),
      'replace',
      NOW
    ).rewards;

    expect(imported).toMatchObject({ isRedeemed: true, redeemedAt: 7_000 });
  });

  it('switches reminders off, since their scheduled ids belong to another device', () => {
    const [imported] = buildImport(
      empty,
      file({ goals: [goal({ notificationsEnabled: true, notificationIds: ['elsewhere'] })] }),
      'replace',
      NOW
    ).goals;

    expect(imported.notificationsEnabled).toBe(false);
    expect(imported.notificationIds).toEqual([]);
  });
});

describe('merge and replace', () => {
  const current: AppData = {
    goals: [goal({ id: 100, title: 'Mine' })],
    rewards: [reward({ id: 200, title: 'My reward' })],
    lifetimePoints: 40,
  };

  it('replace makes the backup the whole of the data', () => {
    const next = buildImport(current, file({ goals: [goal({ title: 'Backup' })] }), 'replace', NOW);

    expect(next.goals.map((g) => g.title)).toEqual(['Backup']);
    expect(next.rewards).toEqual([]);
  });

  it('merge keeps current data untouched and adds the backup after it', () => {
    const next = buildImport(
      current,
      file({ goals: [goal({ title: 'Backup' })], rewards: [reward({ title: 'Theirs' })] }),
      'merge',
      NOW
    );

    expect(next.goals[0]).toBe(current.goals[0]);
    expect(next.rewards[0]).toBe(current.rewards[0]);
    expect(next.goals.map((g) => g.title)).toEqual(['Mine', 'Backup']);
    expect(next.rewards.map((r) => r.title)).toEqual(['My reward', 'Theirs']);
  });

  it('never gives an imported record an id that already exists', () => {
    // The backup reuses the ids the current data already has.
    const next = buildImport(
      current,
      file({ goals: [goal({ id: 100 })], rewards: [reward({ id: 200 })] }),
      'merge',
      NOW
    );

    expect(new Set(next.goals.map((g) => g.id)).size).toBe(2);
    expect(new Set(next.rewards.map((r) => r.id)).size).toBe(2);
  });

  // Backups made by the old import bug contain duplicate ids.
  it('keeps every record from a file with duplicate ids, each with its own id', () => {
    const next = buildImport(
      empty,
      file({ goals: [goal({ id: 5, title: 'A' }), goal({ id: 5, title: 'B' })] }),
      'replace',
      NOW
    );

    expect(next.goals.map((g) => g.title)).toEqual(['A', 'B']);
    expect(new Set(next.goals.map((g) => g.id)).size).toBe(2);
  });
});

describe('links between records', () => {
  it('keeps parents and subgoals attached under their new ids', () => {
    const next = buildImport(
      { ...empty, goals: [goal({ id: 1, title: 'Existing' })] },
      file({
        goals: [
          goal({ id: 1, title: 'Parent', isUltimate: true, subGoals: [2, 3] }),
          goal({ id: 2, title: 'Child A', parentId: 1 }),
          goal({ id: 3, title: 'Child B', parentId: 1 }),
        ],
      }),
      'merge',
      NOW
    );

    const parent = byTitle(next.goals, 'Parent');
    const a = byTitle(next.goals, 'Child A');
    const b = byTitle(next.goals, 'Child B');
    expect(a.parentId).toBe(parent.id);
    expect(b.parentId).toBe(parent.id);
    expect(parent.subGoals).toEqual([a.id, b.id]);
    // The existing goal that shared the old id is not adopted.
    expect(byTitle(next.goals, 'Existing').parentId).toBeUndefined();
  });

  it('remaps dependencies and the goal-reward links in both directions', () => {
    const next = buildImport(
      empty,
      file({
        goals: [
          goal({ id: 1, title: 'First' }),
          goal({ id: 2, title: 'Second', dependsOn: [1], linkedRewardId: 9 }),
        ],
        rewards: [reward({ id: 9, linkedToGoalId: 2 })],
      }),
      'replace',
      NOW
    );

    const first = byTitle(next.goals, 'First');
    const second = byTitle(next.goals, 'Second');
    const [linked] = next.rewards;
    expect(second.dependsOn).toEqual([first.id]);
    expect(second.linkedRewardId).toBe(linked.id);
    expect(linked.linkedToGoalId).toBe(second.id);
  });

  it('drops links to records that are not in the file', () => {
    const next = buildImport(
      empty,
      file({
        goals: [goal({ id: 1, title: 'Orphan', parentId: 99, dependsOn: [98], linkedRewardId: 97 })],
        rewards: [reward({ linkedToGoalId: 96 })],
      }),
      'replace',
      NOW
    );

    const [orphan] = next.goals;
    expect(orphan.parentId).toBeUndefined(); // becomes a top-level goal
    expect(orphan.dependsOn).toEqual([]);
    expect(orphan.linkedRewardId).toBeUndefined();
    expect(next.rewards[0].linkedToGoalId).toBeUndefined();
  });

  it('drops a listed subgoal that points at a different parent', () => {
    const next = buildImport(
      empty,
      file({
        goals: [
          goal({ id: 1, title: 'Parent', subGoals: [2, 3] }),
          goal({ id: 2, title: 'Mine', parentId: 1 }),
          goal({ id: 3, title: 'Not mine', parentId: 5 }),
          goal({ id: 5, title: 'Other parent', subGoals: [3] }),
        ],
      }),
      'replace',
      NOW
    );

    expect(byTitle(next.goals, 'Parent').subGoals).toEqual([byTitle(next.goals, 'Mine').id]);
    expect(byTitle(next.goals, 'Other parent').subGoals).toEqual([byTitle(next.goals, 'Not mine').id]);
  });

  // Regression: import re-listed every child that pointed at a parent. But
  // archiving a subgoal takes it off its parent's list on purpose (keeping its
  // parentId), so a round trip re-attached it: the parent's progress dropped,
  // and archiving the parent swept the old subgoal up with it.
  it('keeps an archived subgoal detached from its parent', () => {
    const next = buildImport(
      empty,
      file({
        goals: [
          goal({ id: 1, title: 'Parent', isUltimate: true, subGoals: [2] }),
          goal({ id: 2, title: 'Done', parentId: 1, current: 10, isComplete: true }),
          goal({ id: 3, title: 'Archived', parentId: 1, isArchived: true, archivedAt: 5 }),
        ],
      }),
      'replace',
      NOW
    );

    const parent = byTitle(next.goals, 'Parent');
    expect(parent.subGoals).toEqual([byTitle(next.goals, 'Done').id]);
    expect(parent.progress).toBe(100);
    expect(byTitle(next.goals, 'Archived').parentId).toBe(parent.id);
  });

  // A malformed file with parent cycles made progress calculation recurse
  // forever; saved, it would have crashed the app on every launch.
  describe('parent cycles', () => {
    /** True if following parentId from any goal ever revisits a goal. */
    const hasCycle = (goals: Goal[]) => {
      const byId = new Map(goals.map((g) => [g.id, g]));
      return goals.some((start) => {
        const seen = new Set<number>();
        let at: Goal | undefined = start;
        while (at?.parentId !== undefined) {
          if (seen.has(at.id)) return true;
          seen.add(at.id);
          at = byId.get(at.parentId);
        }
        return false;
      });
    };

    const cases: [string, Goal[]][] = [
      ['a goal that is its own parent', [goal({ id: 1, title: 'Self', parentId: 1, subGoals: [1] })]],
      [
        "two goals that are each other's parent",
        [
          goal({ id: 1, title: 'A', parentId: 2, subGoals: [2] }),
          goal({ id: 2, title: 'B', parentId: 1, subGoals: [1] }),
        ],
      ],
      [
        'a longer loop',
        [
          goal({ id: 1, title: 'A', parentId: 3 }),
          goal({ id: 2, title: 'B', parentId: 1 }),
          goal({ id: 3, title: 'C', parentId: 2 }),
        ],
      ],
    ];

    for (const [name, goals] of cases) {
      it(`breaks ${name}, keeping every goal`, () => {
        const next = buildImport(empty, file({ goals }), 'replace', NOW);

        expect(next.goals).toHaveLength(goals.length);
        expect(hasCycle(next.goals)).toBe(false);
        expect(next.goals.every((g) => !g.subGoals?.includes(g.id))).toBe(true);
        expect(next.goals.every((g) => Number.isFinite(g.progress))).toBe(true);
      });
    }

    it('leaves a valid chain alone', () => {
      const next = buildImport(
        empty,
        file({
          goals: [
            goal({ id: 1, title: 'Top', subGoals: [2] }),
            goal({ id: 2, title: 'Middle', parentId: 1, subGoals: [3] }),
            goal({ id: 3, title: 'Leaf', parentId: 2 }),
          ],
        }),
        'replace',
        NOW
      );

      expect(byTitle(next.goals, 'Middle').parentId).toBe(byTitle(next.goals, 'Top').id);
      expect(byTitle(next.goals, 'Leaf').parentId).toBe(byTitle(next.goals, 'Middle').id);
    });
  });

  it('recomputes progress from the imported data, including parents', () => {
    const next = buildImport(
      empty,
      file({
        goals: [
          goal({ id: 1, title: 'Parent', subGoals: [2, 3], progress: 0 }),
          goal({ id: 2, title: 'Done', parentId: 1, current: 10, progress: 3 }),
          goal({ id: 3, title: 'Not started', parentId: 1, current: 0, progress: 77 }),
        ],
      }),
      'replace',
      NOW
    );

    expect(byTitle(next.goals, 'Done').progress).toBe(100);
    expect(byTitle(next.goals, 'Not started').progress).toBe(0);
    expect(byTitle(next.goals, 'Parent').progress).toBe(50);
  });
});

describe('repairing untrustworthy fields', () => {
  // A hand-edited or old backup may be missing fields the screens rely on;
  // `unit` missing used to crash the home search.
  it('fills in safe defaults for missing or invalid fields', () => {
    const broken = {
      ...goal(),
      unit: undefined,
      direction: 'sideways',
      period: 'fortnightly',
      points: -5,
      createdAt: undefined,
      completionHistory: 'not a list',
      notes: [{ id: 'ok', text: 'kept', createdAt: 1 }, { nonsense: true }, null],
    } as unknown as Goal;

    const [repaired] = buildImport(empty, file({ goals: [broken] }), 'replace', NOW).goals;

    expect(repaired).toMatchObject({
      unit: '',
      direction: 'increase',
      period: 'ongoing',
      points: 0,
      createdAt: NOW,
      completionHistory: [],
      notes: [{ id: 'ok', text: 'kept', createdAt: 1 }],
    });
  });

  it('keeps a valid decreasing direction and period', () => {
    const [kept] = buildImport(
      empty,
      file({ goals: [goal({ direction: 'decrease', period: 'yearly', initialValue: 80, target: 60, current: 70 })] }),
      'replace',
      NOW
    ).goals;

    expect(kept).toMatchObject({ direction: 'decrease', period: 'yearly', progress: 50 });
  });

  // Regression: fields not explicitly repaired were spread from the file
  // unchecked. An object where a string belongs is saved, then crashes the
  // screen that renders it - on every launch.
  it('drops values of the wrong type instead of saving them', () => {
    const hostile = {
      ...goal(),
      icon: {},
      description: ['not', 'text'],
      category: 'nonsense',
      completedAt: 'last week',
      periodStartDate: 'soon',
      isPaused: 'yes',
      currentStreak: -3,
      sortOrder: '1',
      schedule: 'mondays',
      notificationTime: 'nine',
      notificationDays: [1, 9, 'x', 1],
      injected: { anything: true },
    } as unknown as Goal;

    const [repaired] = buildImport(empty, file({ goals: [hostile] }), 'replace', NOW).goals;

    expect(repaired.icon).toBeUndefined();
    expect(repaired.description).toBeUndefined();
    expect(repaired.category).toBeUndefined();
    expect(repaired.completedAt).toBeUndefined();
    expect(repaired.periodStartDate).toBe(repaired.createdAt);
    expect(repaired.isPaused).toBeUndefined();
    expect(repaired.currentStreak).toBeUndefined();
    expect(repaired.sortOrder).toBeUndefined();
    expect(repaired.schedule).toBeUndefined();
    expect(repaired.notificationTime).toBeUndefined();
    expect(repaired.notificationDays).toEqual([1]);
    expect(repaired).not.toHaveProperty('injected');
  });

  it('keeps the valid parts of a schedule and a reminder time', () => {
    const [kept] = buildImport(
      empty,
      file({
        goals: [
          {
            ...goal(),
            schedule: { daysOfWeek: [1, 7, 3, 1], datesOfMonth: [0, 15], dateRangeStart: 25, dateRangeEnd: 20 },
            notificationTime: 540,
            category: 'health',
          } as Goal,
        ],
      }),
      'replace',
      NOW
    ).goals;

    expect(kept.schedule).toEqual({ daysOfWeek: [1, 3], datesOfMonth: [15] });
    expect(kept.notificationTime).toBe(540);
    expect(kept.category).toBe('health');
  });

  it('keeps a valid date range', () => {
    const [kept] = buildImport(
      empty,
      file({ goals: [goal({ schedule: { dateRangeStart: 20, dateRangeEnd: 25 } })] }),
      'replace',
      NOW
    ).goals;

    expect(kept.schedule).toEqual({ dateRangeStart: 20, dateRangeEnd: 25 });
  });

  it('gives a note without a date the import time', () => {
    const [kept] = buildImport(
      empty,
      file({ goals: [{ ...goal(), notes: [{ id: 'n', text: 'hi' }] } as unknown as Goal] }),
      'replace',
      NOW
    ).goals;

    expect(kept.notes).toEqual([{ id: 'n', text: 'hi', createdAt: NOW }]);
  });

  it('fills in reward defaults', () => {
    const broken = { ...reward(), description: undefined, icon: 3, createdAt: 'yesterday' } as unknown as Reward;
    const [repaired] = buildImport(empty, file({ rewards: [broken] }), 'replace', NOW).rewards;

    expect(repaired).toMatchObject({ description: '', icon: '🎁', createdAt: NOW, isRedeemed: false });
  });

  it('drops a reward field of the wrong type', () => {
    const broken = { ...reward(), redeemedAt: 'today', extra: 1 } as unknown as Reward;
    const [repaired] = buildImport(empty, file({ rewards: [broken] }), 'replace', NOW).rewards;

    expect(repaired.redeemedAt).toBeUndefined();
    expect(repaired).not.toHaveProperty('extra');
  });
});

describe('lifetime points', () => {
  const current: AppData = { ...empty, lifetimePoints: 40 };

  it('replace restores the backup total', () => {
    expect(buildImport(current, file({ lifetimePoints: 300 }), 'replace', NOW).lifetimePoints).toBe(300);
  });

  // Merged redeemed rewards count as spending, so the backup's earned points
  // must come with them or the available balance drops, possibly below zero.
  it('merge adds the backup total to the current one', () => {
    expect(buildImport(current, file({ lifetimePoints: 300 }), 'merge', NOW).lifetimePoints).toBe(340);
  });

  it('derives the total when the file does not record it', () => {
    const next = buildImport(
      current,
      file({
        goals: [goal({ isComplete: true, points: 25 }), goal({ isComplete: false, points: 99 })],
        lifetimePoints: null,
      }),
      'merge',
      NOW
    );
    expect(next.lifetimePoints).toBe(65);
  });

  // Regression: a negative total was accepted - lowering a total that never
  // decreases, or making the balance negative.
  it('does not trust a negative total, deriving one instead', () => {
    const next = buildImport(
      current,
      file({ goals: [goal({ isComplete: true, points: 25 })], lifetimePoints: -500 }),
      'merge',
      NOW
    );
    expect(next.lifetimePoints).toBe(65);
  });

  // Regression: the total was derived from the raw goals, where a recurring
  // goal without points gave NaN - saved as "NaN" and read back every launch.
  it('derives from the repaired goals, never producing NaN', () => {
    const noPoints = { ...goal({ isRecurring: true, completionHistory: [1, 2] }), points: undefined } as unknown as Goal;
    const next = buildImport(current, file({ goals: [noPoints] }), 'merge', NOW);

    expect(next.lifetimePoints).toBe(40);
  });
});

describe('deriveLifetimePoints', () => {
  it('counts completed top-level goals and every recurring completion, not subgoals', () => {
    expect(
      deriveLifetimePoints([
        goal({ isComplete: true, points: 10 }),
        goal({ isComplete: false, points: 99 }),
        goal({ isComplete: true, points: 50, parentId: 1 }),
        goal({ isRecurring: true, points: 5, completionHistory: [1, 2], isComplete: true }),
      ])
    ).toBe(10 + 3 * 5);
  });

  it('ignores a non-numeric points value', () => {
    expect(deriveLifetimePoints([goal({ isComplete: true, points: 'lots' as unknown as number })])).toBe(0);
  });

  it('ignores a recurring goal with no usable points', () => {
    expect(
      deriveLifetimePoints([
        { ...goal({ isRecurring: true, completionHistory: [1] }), points: undefined } as unknown as Goal,
        goal({ isRecurring: true, completionHistory: [1], points: -5 }),
      ])
    ).toBe(0);
  });
});
