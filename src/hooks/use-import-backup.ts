/**
 * Applying a parsed backup to the app's data.
 */

import { useGoals } from '@/src/context/GoalsContext';
import { useRewards } from '@/src/context/RewardsContext';
import { buildImport, type ImportedData, type ImportMode } from '@/src/utils/import-data';
import { useCallback } from 'react';

/**
 * Returns a function that imports a backup by merging it with, or replacing,
 * the current goals and rewards (see buildImport for what each record keeps).
 *
 * All or nothing: it either applies the whole backup or rejects having
 * changed nothing. Goals and rewards live in separate stores, so rewards are
 * written first and put back if the goals then fail. (Goals go second because
 * replacing them has a side effect - cancelled reminders - that could not be
 * undone.) Reporting failure after half an import had landed invited a retry
 * that, with Merge, imported the half twice.
 */
export function useImportBackup() {
  const { goals, lifetimePointsEarned, replaceAllGoals } = useGoals();
  const { rewards, replaceAllRewards } = useRewards();

  return useCallback(
    async (incoming: ImportedData, mode: ImportMode) => {
      const next = buildImport(
        { goals, rewards, lifetimePoints: lifetimePointsEarned },
        incoming,
        mode
      );

      await replaceAllRewards(next.rewards);
      try {
        await replaceAllGoals(next.goals, next.lifetimePoints);
      } catch (goalsError) {
        await replaceAllRewards(rewards);
        throw goalsError;
      }
    },
    [goals, rewards, lifetimePointsEarned, replaceAllGoals, replaceAllRewards]
  );
}
