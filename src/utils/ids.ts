/**
 * Record id generation.
 */

/**
 * A numeric id greater than every id in `existing`, and no smaller than `now`.
 *
 * `Date.now()` alone is not unique: records created within the same
 * millisecond collide. JSON import does exactly that - it adds goals and
 * rewards in a tight loop - and five imported goals came out sharing a single
 * id, so updating or deleting one hit all five.
 *
 * Ids stay timestamp-like (existing data and sorting assume that); they only
 * step past `now` when needed to stay unique.
 */
export function nextId(existing: readonly { id: number }[], now: number = Date.now()): number {
  let max = 0;
  for (const item of existing) {
    if (item.id > max) {
      max = item.id;
    }
  }
  return Math.max(now, max + 1);
}
