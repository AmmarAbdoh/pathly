/**
 * Tests for record id generation.
 */

import { nextId } from '../ids';

describe('nextId', () => {
  it('uses the current time when nothing exists yet', () => {
    expect(nextId([], 1000)).toBe(1000);
  });

  it('uses the current time when it is already past every existing id', () => {
    expect(nextId([{ id: 5 }, { id: 9 }], 1000)).toBe(1000);
  });

  // Regression: plain Date.now() gave records created in the same millisecond
  // the same id.
  it('steps past an existing id created in the same millisecond', () => {
    expect(nextId([{ id: 1000 }], 1000)).toBe(1001);
  });

  it('stays unique across a burst of creations within one millisecond', () => {
    const records: { id: number }[] = [];
    for (let i = 0; i < 50; i += 1) {
      records.push({ id: nextId(records, 1000) });
    }
    expect(new Set(records.map((r) => r.id)).size).toBe(50);
  });

  it('defaults to Date.now()', () => {
    const before = Date.now();
    expect(nextId([])).toBeGreaterThanOrEqual(before);
  });
});
