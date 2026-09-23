/**
 * Tests for backup export and import parsing.
 */

import { Platform, Share } from 'react-native';
import type { Goal, Reward } from '@/src/types';
import { isImportableGoal, isImportableReward } from '@/src/utils/import-data';
import {
  generateCSVExport,
  generateJSONExport,
  parseCSVImport,
  parseJSONImport,
  shareData,
} from '@/src/utils/export-data';

const goal = (overrides: Partial<Goal> = {}): Goal =>
  ({
    id: 1,
    title: 'Read',
    description: 'Books',
    target: 12,
    current: 3,
    unit: 'books',
    progress: 25,
    direction: 'increase',
    points: 10,
    period: 'monthly',
    isComplete: false,
    createdAt: Date.UTC(2026, 0, 1),
    ...overrides,
  }) as Goal;

const reward = (overrides: Partial<Reward> = {}): Reward => ({
  id: 5,
  title: 'Coffee',
  description: 'Nice one',
  pointsCost: 20,
  icon: '☕',
  createdAt: Date.UTC(2026, 0, 2),
  isRedeemed: false,
  ...overrides,
});

describe('JSON export and import', () => {
  // Regression: export writes `lifetimePointsEarned` but import only read
  // `lifetimePoints`, so the app's own backups always restored null points.
  it('round-trips goals, rewards and lifetime points', () => {
    const json = generateJSONExport([goal()], [reward()], 340);
    const parsed = parseJSONImport(json);

    expect(parsed.success).toBe(true);
    expect(parsed.data?.goals).toHaveLength(1);
    expect(parsed.data?.rewards).toHaveLength(1);
    expect(parsed.data?.lifetimePoints).toBe(340);
  });

  it('still reads lifetime points from files that used the old key', () => {
    const parsed = parseJSONImport(JSON.stringify({ goals: [], rewards: [], lifetimePoints: 12 }));
    expect(parsed.data?.lifetimePoints).toBe(12);
  });

  it('reports null lifetime points when the file has none', () => {
    const parsed = parseJSONImport(JSON.stringify({ goals: [], rewards: [] }));
    expect(parsed.data?.lifetimePoints).toBeNull();
  });

  it('stamps the export with when it was made', () => {
    const before = Date.now();
    const data = JSON.parse(generateJSONExport([], [], 0));
    expect(data.exportTimestamp).toBeGreaterThanOrEqual(before);
    expect(new Date(data.exportDate).getTime()).toBe(data.exportTimestamp);
  });

  it('rejects files without a goals or rewards array', () => {
    expect(parseJSONImport(JSON.stringify({ rewards: [] }))).toMatchObject({
      success: false,
      errors: ['goals array not found'],
    });
    expect(parseJSONImport(JSON.stringify({ goals: [] }))).toMatchObject({
      success: false,
      errors: ['rewards array not found'],
    });
  });

  it('rejects text that is not JSON', () => {
    const parsed = parseJSONImport('{not json');
    expect(parsed.success).toBe(false);
    expect(parsed.message).toBe('Failed to parse JSON file');
    expect(parsed.errors).toHaveLength(1);
  });

  it('keeps valid records and explains each invalid one', () => {
    const parsed = parseJSONImport(
      JSON.stringify({
        goals: [
          goal(),
          { ...goal(), title: '' },
          { ...goal(), target: 0 },
          { ...goal(), current: 'three' },
        ],
        rewards: [reward(), { ...reward(), title: 42 }, { ...reward(), pointsCost: -1 }],
      })
    );

    expect(parsed.success).toBe(true);
    expect(parsed.data?.goals).toHaveLength(1);
    expect(parsed.data?.rewards).toHaveLength(1);
    expect(parsed.errors).toEqual([
      'Goal 2: Missing or invalid title',
      'Goal 3: Invalid target value',
      'Goal 4: Invalid current value',
      'Reward 2: Missing or invalid title',
      'Reward 3: Invalid points cost',
    ]);
    expect(parsed.message).toBe('Successfully parsed 1 goals and 1 rewards');
  });

  // Regression: a title of spaces passed here and was dropped by buildImport,
  // so the numbers the user was told - to import, skipped, imported - were off.
  it('accepts exactly the records the import keeps', () => {
    const goals = [goal(), { ...goal(), title: '   ' }, { ...goal(), title: 7 }, null, { ...goal(), target: -1 }];
    const rewards = [reward(), { ...reward(), title: ' ' }, null, { ...reward(), pointsCost: 0 }];

    const parsed = parseJSONImport(JSON.stringify({ goals, rewards }));

    expect(parsed.data?.goals).toEqual([goal()]);
    expect(parsed.data?.rewards).toEqual([reward()]);
    expect(parsed.errors).toHaveLength(goals.length + rewards.length - 2);
    for (const accepted of parsed.data!.goals) expect(isImportableGoal(accepted)).toBe(true);
    for (const accepted of parsed.data!.rewards) expect(isImportableReward(accepted)).toBe(true);
  });

  // Regression: `typeof x === 'number'` let Infinity (JSON's 1e999) through.
  // Saved, it becomes null: a goal with no target, a reward anyone can afford.
  it('rejects numbers too large to store', () => {
    // JSON.stringify cannot write 1e999 itself, so put it in by hand.
    const json = JSON.stringify({
      goals: [{ ...goal(), target: 'HUGE' }],
      rewards: [{ ...reward(), pointsCost: 'HUGE' }],
    }).replace(/"HUGE"/g, '1e999');

    const parsed = parseJSONImport(json);

    expect(parsed.data?.goals).toHaveLength(0);
    expect(parsed.data?.rewards).toHaveLength(0);
  });
});

describe('CSV export', () => {
  const lines = (csv: string) => csv.split('\n');

  it('writes goals, rewards and summary statistics sections', () => {
    const csv = generateCSVExport(
      [goal(), goal({ id: 2, isComplete: true })],
      [reward(), reward({ id: 6, isRedeemed: true })],
      99
    );

    expect(csv).toContain('=== GOALS ===');
    expect(csv).toContain('=== REWARDS ===');
    expect(lines(csv)).toEqual(
      expect.arrayContaining([
        'Total Goals,2',
        'Completed Goals,1',
        'Total Rewards,2',
        'Redeemed Rewards,1',
        'Lifetime Points Earned,99',
      ])
    );
  });

  it('quotes free text and escapes embedded quotes, so commas cannot split a row', () => {
    const csv = generateCSVExport(
      [goal({ title: 'Read "war, and peace"', description: undefined, unit: '' })],
      [],
      0
    );
    const row = lines(csv)[2];

    expect(row).toContain('"Read ""war, and peace"""');
    expect(row).toContain(',"",'); // missing description becomes an empty quoted field
  });

  it('writes yes/no flags, ISO dates and blanks for missing values', () => {
    const completedAt = Date.UTC(2026, 1, 3);
    const csv = generateCSVExport(
      [goal({ isComplete: true, completedAt, isUltimate: true, isRecurring: true, isPaused: true, isArchived: true, category: 'health', icon: '📚' })],
      [reward({ isRedeemed: true, redeemedAt: completedAt, linkedToGoalId: 1, icon: '' })],
      0
    );

    const goalRow = lines(csv)[2];
    expect(goalRow).toContain(new Date(completedAt).toISOString());
    expect(goalRow.match(/Yes/g)).toHaveLength(5);
    expect(goalRow.endsWith('health,📚')).toBe(true);

    const rewardRow = lines(csv).find((l) => l.startsWith('5,'))!;
    expect(rewardRow.endsWith(`Yes,${new Date(completedAt).toISOString()},1`)).toBe(true);
  });

  it('leaves optional fields blank rather than writing "undefined"', () => {
    const csv = generateCSVExport([goal()], [reward()], 0);
    expect(csv).not.toContain('undefined');
  });
});

describe('CSV import', () => {
  it('is explicitly unsupported', () => {
    expect(parseCSVImport('anything')).toMatchObject({
      success: false,
      data: null,
      errors: ['CSV import not implemented'],
    });
  });
});

describe('shareData', () => {
  it('opens the native share sheet on mobile', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' });

    await shareData('payload', 'backup.json');

    expect(share).toHaveBeenCalledWith({ message: 'payload', title: 'backup.json' });
    share.mockRestore();
  });

  it('downloads a file on the web', async () => {
    const link = { href: '', download: '', click: jest.fn() };
    const body = { appendChild: jest.fn(), removeChild: jest.fn() };
    const g = globalThis as unknown as Record<string, unknown>;
    const previousDocument = g.document;
    g.document = { createElement: jest.fn(() => link), body };
    const createUrl = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup');
    const revokeUrl = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const os = jest.replaceProperty(Platform, 'OS', 'web');

    try {
      await shareData('payload', 'backup.json');

      expect(link.download).toBe('backup.json');
      expect(link.href).toBe('blob:backup');
      expect(link.click).toHaveBeenCalled();
      expect(body.removeChild).toHaveBeenCalledWith(link);
      expect(revokeUrl).toHaveBeenCalledWith('blob:backup');
    } finally {
      os.restore();
      createUrl.mockRestore();
      revokeUrl.mockRestore();
      g.document = previousDocument;
    }
  });
});

describe('CSV export of incomplete records', () => {
  // Records from old versions or hand-edited backups can lack text fields.
  it('writes empty quoted fields instead of crashing or writing "undefined"', () => {
    const csv = generateCSVExport(
      [goal({ title: undefined as unknown as string, unit: undefined as unknown as string })],
      [reward({ title: undefined as unknown as string, description: undefined as unknown as string })],
      0
    );

    expect(csv).not.toContain('undefined');
    const rows = csv.split('\n');
    expect(rows[2]).toMatch(/^1,"",/);
    expect(rows.some((row) => row.startsWith('5,"","",20,'))).toBe(true);
  });
});

