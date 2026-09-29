/**
 * useAddTemplates
 * Adds picked templates as goals, one after another, each as the
 * step-by-step form would make it with nothing changed: the template's period,
 * points, icon and description, repeating if daily or weekly, starting at 0 -
 * or, going down, where the user said they start.
 */

import { GoalsBusyError, useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import {
  addGoalArgs,
  draftFromTemplate,
  draftToGoal,
  firstStepWithErrors,
  type TemplatePick,
} from '@/src/utils/goal-draft';
import { useCallback } from 'react';

/** Resolves to how many goals were added. */
export function useAddTemplates() {
  const { addGoal } = useGoals();
  const { t } = useLanguage();

  return useCallback(
    async (picks: TemplatePick[]): Promise<number> => {
      let added = 0;
      for (const { template, current } of picks) {
        const draft = draftFromTemplate(template);
        if (current !== undefined) draft.current = String(current);
        // The picker lets through only what can be added; this is the same
        // check, so nothing half-made is saved.
        if (firstStepWithErrors(draft)) continue;

        try {
          await addGoal(...addGoalArgs(draftToGoal(draft, t.goalWizard.doneUnit)));
          added++;
        } catch (error) {
          // An import is being applied: the rest would be refused too.
          if (error instanceof GoalsBusyError) break;
          throw error;
        }
      }
      return added;
    },
    [addGoal, t]
  );
}
