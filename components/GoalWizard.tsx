/**
 * GoalWizard
 * A new goal in four short steps - what, how it's tracked, how often, and what
 * it's worth - one question at a time, with defaults for everything that has
 * one. It replaced a single form of fourteen fields and a confirmation.
 *
 * The goal it makes is worked out in src/utils/goal-draft.ts. The full form
 * (AddGoalForm) still edits goals and adds subgoals.
 */

import { useLanguage } from '@/src/context/LanguageContext';
import { useRewards } from '@/src/context/RewardsContext';
import { useTheme } from '@/src/context/ThemeContext';
import type { GoalDirection, TimePeriod } from '@/src/types';
import {
  canRepeat,
  type DraftErrorKey,
  type DraftErrors,
  draftToGoal,
  emptyDraft,
  firstStepWithErrors,
  type GoalDraft,
  type NewGoal,
  stepErrors,
  type TrackBy,
  withPeriod,
  withTrackBy,
  WIZARD_STEPS,
  type WizardStep,
} from '@/src/utils/goal-draft';
import { formatNumber } from '@/src/utils/number-formatting';
import { MAX_PERIOD_DAYS } from '@/src/utils/recurring-goals';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import GoalSchedulePicker from './GoalSchedulePicker';
import IconPickerModal from './IconPickerModal';

interface GoalWizardProps {
  onCreate: (goal: NewGoal) => Promise<void> | void;
  /** A template's draft; the wizard starts empty without one. */
  initialDraft?: GoalDraft;
  initialStep?: WizardStep;
  /** Shows "Use a template" on the first step. */
  onUseTemplate?: () => void;
}

const PERIODS: TimePeriod[] = ['daily', 'weekly', 'monthly', 'yearly', 'custom', 'ongoing'];
const TRACK_BY: TrackBy[] = ['number', 'done', 'subgoals'];
const DIRECTIONS: GoalDirection[] = ['increase', 'decrease'];

export default function GoalWizard({ onCreate, initialDraft, initialStep = 1, onUseTemplate }: GoalWizardProps) {
  const { theme } = useTheme();
  const { t, language, isRTL } = useLanguage();
  const { getAvailableRewards } = useRewards();

  const [draft, setDraft] = useState<GoalDraft>(() => initialDraft ?? emptyDraft());
  const [step, setStep] = useState<WizardStep>(initialStep);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [rewardPickerOpen, setRewardPickerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const w = t.goalWizard;

  /** Change some fields, and forget the errors shown for them. */
  const update = useCallback((patch: Partial<GoalDraft>) => {
    setDraft((previous) => ({ ...previous, ...patch }));
    setErrors((previous) => {
      const next = { ...previous };
      for (const field of Object.keys(patch)) delete next[field as keyof DraftErrors];
      return next;
    });
  }, []);

  const setPeriod = useCallback((period: TimePeriod) => {
    setDraft((previous) => ({ ...withPeriod(previous, period), periodChosen: true }));
    setErrors({});
  }, []);

  const setCustomDays = useCallback((days: string) => {
    setDraft((previous) => ({ ...withPeriod(previous, 'custom', days), periodChosen: true }));
    setErrors({});
  }, []);

  const setTrackBy = useCallback((trackBy: TrackBy) => {
    setDraft((previous) => withTrackBy(previous, trackBy));
    setErrors({});
  }, []);

  const errorText = (key?: DraftErrorKey) =>
    key ? t.validation[key].replace('{max}', () => formatNumber(MAX_PERIOD_DAYS, language)) : null;

  const handleNext = useCallback(() => {
    const found = stepErrors(draft, step);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setErrors({});
    setStep((current) => Math.min(4, current + 1) as WizardStep);
  }, [draft, step]);

  const handleBack = useCallback(() => {
    setErrors({});
    setStep((current) => Math.max(1, current - 1) as WizardStep);
  }, []);

  const handleCreate = useCallback(async () => {
    // A template can skip to the last step: check every step, and go back to
    // the first with something to fix.
    const broken = firstStepWithErrors(draft);
    if (broken) {
      setStep(broken);
      setErrors(stepErrors(draft, broken));
      return;
    }
    setCreating(true);
    try {
      await onCreate(draftToGoal(draft, w.doneUnit));
    } finally {
      setCreating(false);
    }
  }, [draft, onCreate, w.doneUnit]);

  // Stable between renders: an inline list set the picker's own state again
  // after every keystroke (see CLAUDE.md).
  const rewardItems = useMemo(
    () => [
      { label: t.goalForm.noReward, value: 0 },
      ...getAvailableRewards().map((reward) => ({
        label: `${reward.icon} ${reward.title} - ${formatNumber(reward.pointsCost, language)} ${t.goalCard.points}`,
        value: reward.id,
      })),
    ],
    [getAvailableRewards, t, language]
  );
  const setRewardValue = useCallback(
    (callback: number | ((value: number) => number)) => {
      setDraft((previous) => {
        const next = typeof callback === 'function' ? callback(previous.linkedRewardId ?? 0) : callback;
        return { ...previous, linkedRewardId: next === 0 ? undefined : next };
      });
    },
    []
  );

  const textAlign = (isRTL ? 'right' : 'left') as 'left' | 'right';
  const inputStyle = (field?: keyof DraftErrors) => [
    styles.input,
    {
      borderColor: field && errors[field] ? theme.colors.danger : theme.colors.border,
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
      textAlign,
    },
  ];
  const labelStyle = [styles.label, { color: theme.colors.text, textAlign }];

  const renderError = (field: keyof DraftErrors) => {
    const text = errorText(errors[field]);
    return text ? <Text style={[styles.error, { color: theme.colors.danger }]}>{text}</Text> : null;
  };

  /** A choice among several, shown as a pill. */
  const chip = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={key}
      style={[
        styles.chip,
        { borderColor: theme.colors.border, backgroundColor: theme.colors.background },
        selected && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
      ]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.chipText, { color: selected ? '#fff' : theme.colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  /** A tick box with a label and a hint. */
  const checkbox = (label: string, hint: string | null, checked: boolean, onPress: () => void) => (
    <Pressable
      style={styles.checkboxRow}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor: theme.colors.border },
          checked && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
        ]}
      >
        {checked ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
      </View>
      <View style={styles.checkboxText}>
        <Text style={[styles.checkboxLabel, { color: theme.colors.text, textAlign }]}>{label}</Text>
        {hint ? (
          <Text style={[styles.hint, { color: theme.colors.textSecondary, textAlign }]}>{hint}</Text>
        ) : null}
      </View>
    </Pressable>
  );

  const periodLabels: Record<TimePeriod, string> = {
    daily: t.goalForm.periodDaily,
    weekly: t.goalForm.periodWeekly,
    monthly: t.goalForm.periodMonthly,
    yearly: t.goalForm.periodYearly,
    custom: t.goalForm.periodCustom,
    ongoing: w.noDeadline,
  };
  const trackLabels: Record<TrackBy, { title: string; hint: string }> = {
    number: { title: w.trackNumber, hint: w.trackNumberHint },
    done: { title: w.trackDone, hint: w.trackDoneHint },
    subgoals: { title: w.trackSubgoals, hint: w.trackSubgoalsHint },
  };

  const stepTitle = { 1: w.whatTitle, 2: w.trackTitle, 3: w.whenTitle, 4: w.worthTitle }[step];
  const stepOf = w.stepOf
    .replace('{step}', () => formatNumber(step, language))
    .replace('{total}', () => formatNumber(WIZARD_STEPS.length, language));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card, ...theme.shadows.small }]}>
      {/* Progress */}
      <View style={styles.progress} accessible accessibilityLabel={stepOf}>
        <View style={styles.progressBar}>
          {WIZARD_STEPS.map((each) => (
            <View
              key={each}
              style={[
                styles.progressSegment,
                { backgroundColor: each <= step ? theme.colors.primary : theme.colors.border },
              ]}
            />
          ))}
        </View>
        <Text style={[styles.progressText, { color: theme.colors.textSecondary, textAlign }]}>{stepOf}</Text>
      </View>

      <Text style={[styles.stepTitle, { color: theme.colors.text, textAlign }]}>{stepTitle}</Text>

      {step === 1 ? (
        <View>
          <Text style={[styles.hint, styles.stepHint, { color: theme.colors.textSecondary, textAlign }]}>
            {w.whatHint}
          </Text>
          <View style={styles.titleRow}>
            <TouchableOpacity
              style={[styles.iconButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.background }]}
              onPress={() => setShowIconPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={w.changeIcon}
            >
              <Text style={styles.icon}>{draft.icon}</Text>
            </TouchableOpacity>
            {/* The error sits under the field it is about, not the icon. */}
            <View style={styles.titleField}>
              <TextInput
                style={inputStyle('title')}
                placeholder={t.goalForm.titlePlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                value={draft.title}
                onChangeText={(title) => update({ title })}
                maxLength={100}
                accessibilityLabel={t.goalForm.titleLabel}
                returnKeyType="next"
                onSubmitEditing={handleNext}
              />
              {renderError('title')}
            </View>
          </View>
          {onUseTemplate ? (
            <TouchableOpacity
              style={[styles.templateLink, { borderColor: theme.colors.border }]}
              onPress={onUseTemplate}
              accessibilityRole="button"
              accessibilityLabel={t.templates.useTemplate}
              accessibilityHint={t.templates.quickStart}
            >
              <Ionicons name="albums-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.templateLinkText, { color: theme.colors.primary }]}>{t.templates.useTemplate}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {step === 2 ? (
        <View>
          {TRACK_BY.map((choice) => {
            const selected = draft.trackBy === choice;
            return (
              <TouchableOpacity
                key={choice}
                style={[
                  styles.choice,
                  { borderColor: selected ? theme.colors.primary : theme.colors.border },
                  selected && { backgroundColor: theme.colors.primary + '15' },
                ]}
                onPress={() => setTrackBy(choice)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={trackLabels[choice].title}
                accessibilityHint={trackLabels[choice].hint}
              >
                <Text style={[styles.choiceTitle, { color: theme.colors.text, textAlign }]}>{trackLabels[choice].title}</Text>
                <Text style={[styles.hint, { color: theme.colors.textSecondary, textAlign }]}>{trackLabels[choice].hint}</Text>
              </TouchableOpacity>
            );
          })}

          {draft.trackBy === 'number' ? (
            <View style={styles.numberFields}>
              <View style={styles.row}>
                <View style={styles.rowField}>
                  <Text style={labelStyle}>{t.goalForm.targetLabel}</Text>
                  <TextInput
                    style={inputStyle('target')}
                    placeholder={t.goalForm.targetPlaceholder}
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={draft.target}
                    onChangeText={(target) => update({ target })}
                    accessibilityLabel={t.goalForm.targetLabel}
                  />
                  {renderError('target')}
                </View>
                <View style={styles.rowField}>
                  <Text style={labelStyle}>{t.goalForm.unit}</Text>
                  <TextInput
                    style={inputStyle('unit')}
                    placeholder={t.goalForm.unitPlaceholder}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={draft.unit}
                    onChangeText={(unit) => update({ unit })}
                    maxLength={20}
                    accessibilityLabel={t.goalForm.unitLabel}
                  />
                  {renderError('unit')}
                </View>
              </View>
              <Text style={labelStyle}>{w.startAt}</Text>
              <TextInput
                style={inputStyle('current')}
                placeholder={t.goalForm.currentPlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="decimal-pad"
                value={draft.current}
                onChangeText={(current) => update({ current })}
                accessibilityLabel={w.startAt}
              />
              {renderError('current')}
              <View style={styles.chips}>
                {DIRECTIONS.map((direction) =>
                  chip(
                    direction,
                    direction === 'increase' ? w.goingUp : w.goingDown,
                    draft.direction === direction,
                    // The start is checked against the direction: its error goes with it.
                    () => update({ direction, current: draft.current })
                  )
                )}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 3 ? (
        <View>
          <View style={styles.chips}>
            {PERIODS.map((period) => chip(period, periodLabels[period], draft.period === period, () => setPeriod(period)))}
          </View>
          {draft.period === 'custom' ? (
            <>
              <Text style={labelStyle}>{t.goalForm.customPeriodDays}</Text>
              <TextInput
                style={inputStyle('customPeriodDays')}
                placeholder={t.goalForm.customPeriodPlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="decimal-pad"
                value={draft.customPeriodDays}
                onChangeText={setCustomDays}
                accessibilityLabel={t.goalForm.customPeriodDays}
              />
              {renderError('customPeriodDays')}
            </>
          ) : null}
          {canRepeat(draft) && draft.period !== 'ongoing' ? (
            <>
              {checkbox(
                w.repeatEvery[draft.period as keyof typeof w.repeatEvery],
                w.repeatHint,
                draft.repeat,
                () => update({ repeat: !draft.repeat, repeatChosen: true })
              )}
              {draft.repeat ? (
                <GoalSchedulePicker
                  schedule={draft.schedule}
                  onScheduleChange={(schedule) => update({ schedule })}
                  isRecurring
                />
              ) : null}
            </>
          ) : null}
        </View>
      ) : null}

      {step === 4 ? (
        <View>
          <Text style={labelStyle}>{t.goalForm.points}</Text>
          <TextInput
            style={inputStyle('points')}
            keyboardType="number-pad"
            value={draft.points}
            onChangeText={(points) => update({ points, pointsEdited: true })}
            accessibilityLabel={t.goalForm.pointsLabel}
          />
          {renderError('points')}
          {!draft.pointsEdited ? (
            <Text style={[styles.hint, styles.suggestion, { color: theme.colors.textSecondary, textAlign }]}>
              {w.suggestedFor[draft.period]}
            </Text>
          ) : null}

          {draft.trackBy === 'subgoals'
            ? checkbox(
                t.goalForm.subgoalsAwardPoints,
                t.goalForm.subgoalsAwardPointsHint,
                draft.subgoalsAwardPoints,
                () => update({ subgoalsAwardPoints: !draft.subgoalsAwardPoints })
              )
            : null}

          <Text style={labelStyle}>{t.goalForm.linkedReward}</Text>
          <View style={styles.dropdown}>
            <DropDownPicker
              open={rewardPickerOpen}
              value={draft.linkedRewardId ?? 0}
              items={rewardItems}
              setOpen={setRewardPickerOpen}
              setValue={setRewardValue}
              placeholder={t.goalForm.selectReward}
              style={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
              dropDownContainerStyle={{ backgroundColor: theme.colors.background, borderColor: theme.colors.border }}
              textStyle={{ color: theme.colors.text }}
              listMode="SCROLLVIEW"
              // Up, over the points: the step's buttons come after it, and a
              // zIndex only orders siblings, so a list opening down went under
              // them - and a tap on a reward there pressed Create instead.
              dropDownDirection="TOP"
              zIndex={5000}
              zIndexInverse={5000}
            />
          </View>

          <TouchableOpacity
            style={styles.moreToggle}
            onPress={() => setShowMore((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showMore }}
            accessibilityLabel={w.moreOptions}
          >
            <Ionicons name={showMore ? 'chevron-down' : isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={theme.colors.primary} />
            <Text style={[styles.moreToggleText, { color: theme.colors.primary }]}>{w.moreOptions}</Text>
          </TouchableOpacity>
          {showMore ? (
            <TextInput
              style={[inputStyle(), styles.multiline]}
              placeholder={t.goalForm.descriptionPlaceholder}
              placeholderTextColor={theme.colors.textSecondary}
              value={draft.description}
              onChangeText={(description) => update({ description })}
              multiline
              accessibilityLabel={t.goalForm.descriptionLabel}
            />
          ) : null}
        </View>
      ) : null}

      {/* Back / Next / Create */}
      <View style={styles.footer}>
        {step > 1 ? (
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel={w.back}
          >
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>{w.back}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, creating && styles.disabled]}
          onPress={step < 4 ? handleNext : handleCreate}
          disabled={creating}
          accessibilityRole="button"
          accessibilityLabel={step < 4 ? w.next : w.create}
        >
          <Text style={styles.primaryButtonText}>{step < 4 ? w.next : w.create}</Text>
        </TouchableOpacity>
      </View>

      <IconPickerModal
        visible={showIconPicker}
        selected={draft.icon}
        onSelect={(icon) => {
          update({ icon });
          setShowIconPicker(false);
        }}
        onClose={() => setShowIconPicker(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
  },
  progress: {
    marginBottom: 16,
    gap: 8,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepHint: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  titleField: {
    flex: 1,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 28,
  },
  templateLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  templateLinkText: {
    fontSize: 15,
    fontWeight: '600',
  },
  choice: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 2,
  },
  choiceTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  numberFields: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowField: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxText: {
    flex: 1,
    gap: 2,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestion: {
    marginTop: -6,
    marginBottom: 12,
  },
  dropdown: {
    zIndex: 10,
    marginBottom: 12,
  },
  moreToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  moreToggleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
