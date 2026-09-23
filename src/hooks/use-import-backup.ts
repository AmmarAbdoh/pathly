/**
 * Applying a parsed backup to the app's data.
 */

import { useGoals } from '@/src/context/GoalsContext';
import { useRewards } from '@/src/context/RewardsContext';
import { buildImport, type ImportedData, type ImportMode } from '@/src/utils/import-data';
import { useCallback } from 'react';

/**
 * The backup's rewards were saved, but its goals could not be, and the
 * rewards could not be put back either. Rare - it takes a write succeeding,
 * then two failing - but the user must be told exactly that, or a retried
 * Merge adds the rewards a second time.
 */
export class PartialImportError extends Error {
  constructor(readonly goalsError: unknown) {
    super("The backup's rewards were saved, but its goals were not");
    this.name = 'PartialImportError';
  }
}

/**
 * Returns a function that imports a backup by merging it with, or replacing,
 * the current goals and rewards (see buildImport for what each record keeps).
 *
 * All or nothing: it either applies the whole backup or rejects having
 * changed nothing (short of a PartialImportError). Goals and rewards live in
 * separate stores, so rewards are written first and put back if the goals
 * then fail. (Goals go second because replacing them has a side effect -
 * cancelled reminders - that could not be undone.)
 */
export function useImportBackup() {
  const { getCurrentGoals, replaceAllGoals } = useGoals();
  const { getCurrentRewards, replaceAllRewards } = useRewards();

  return useCallback(
    async (incoming: ImportedData, mode: ImportMode) => {
      // The data as it is now, not when the screen last rendered: picking a
      // file and confirming take a while, and an import built on an older
      // copy - or on the empty lists from before loading finished - writes
      // over whatever it is missing. Both throw, before anything is written,
      // unless their data has loaded.
      const current = getCurrentGoals();
      const currentRewards = getCurrentRewards();

      const next = buildImport(
        { goals: current.goals, rewards: currentRewards, lifetimePoints: current.lifetimePoints },
        incoming,
        mode
      );

      await replaceAllRewards(next.rewards);
      try {
        await replaceAllGoals(next.goals, next.lifetimePoints);
      } catch (goalsError) {
        try {
          await replaceAllRewards(currentRewards);
        } catch {
          throw new PartialImportError(goalsError);
        }
        throw goalsError;
      }
    },
    [getCurrentGoals, getCurrentRewards, replaceAllGoals, replaceAllRewards]
  );
}
