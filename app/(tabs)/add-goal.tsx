/**
 * Add Goal screen
 * A new goal in four short steps, or several from templates at once.
 */

import GoalWizard from '@/components/GoalWizard';
import TemplatesModal from '@/components/TemplatesModal';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useAddTemplates } from '@/src/hooks/use-add-templates';
import {
  addGoalArgs,
  draftFromTemplate,
  firstStepWithErrors,
  type GoalDraft,
  type NewGoal,
  type TemplatePick,
  type WizardStep,
} from '@/src/utils/goal-draft';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** What the step-by-step form starts from. A new key remounts it. */
interface WizardStart {
  key: number;
  draft?: GoalDraft;
  step?: WizardStep;
}

export default function AddGoalScreen() {
  const { addGoal } = useGoals();
  const addTemplates = useAddTemplates();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [showTemplates, setShowTemplates] = useState(false);
  const [start, setStart] = useState<WizardStart>({ key: 0 });

  const handleCreate = useCallback(
    async (goal: NewGoal) => {
      try {
        await addGoal(...addGoalArgs(goal));
        // This tab stays mounted: the next goal starts from an empty form.
        setStart((previous) => ({ key: previous.key + 1 }));
        router.push('/home');
      } catch (err) {
        console.error('Failed to add goal:', err);
      }
    },
    [addGoal, router]
  );

  const handleAddTemplates = useCallback(
    async (picks: TemplatePick[]) => {
      try {
        if ((await addTemplates(picks)) > 0) router.push('/home');
      } catch (err) {
        console.error('Failed to add goals:', err);
      }
    },
    [addTemplates, router]
  );

  // Fill the steps from the template, and open the first with anything left
  // to fill in - for a decreasing one without a start, the tracking step.
  const handleCustomize = useCallback((pick: TemplatePick) => {
    const draft = draftFromTemplate(pick.template);
    if (pick.current !== undefined) draft.current = String(pick.current);
    setStart((previous) => ({ key: previous.key + 1, draft, step: firstStepWithErrors(draft) ?? 4 }));
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>{t.goalForm.title}</Text>
        </View>

        <GoalWizard
          key={start.key}
          initialDraft={start.draft}
          initialStep={start.step}
          onCreate={handleCreate}
          onUseTemplate={() => setShowTemplates(true)}
        />
      </ScrollView>

      <TemplatesModal
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onAdd={handleAddTemplates}
        onCustomize={handleCustomize}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
});
