/**
 * Goal Templates Modal
 * Pick one or several ready-made goals, and add them all at once.
 *
 * A decreasing template asks for its start when picked - only the user knows
 * it. A saved template with a custom period cannot be added this way (a
 * template keeps no length for it): it says to set it up on the Add tab.
 */

import TemplateModal from '@/components/TemplateModal';
import { getGoalTemplates } from '@/src/constants/goal-templates';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import type { Translations } from '@/src/i18n/translations';
import { GoalCategory, GoalTemplate, Language } from '@/src/types';
import { canQuickAdd, draftFromTemplate, stepErrors, type TemplatePick } from '@/src/utils/goal-draft';
import { formatNumber } from '@/src/utils/number-formatting';
import { customTemplatesStorage } from '@/src/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface TemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  /** Add every template picked. */
  onAdd: (picks: TemplatePick[]) => void | Promise<void>;
  /** When given, one template picked can be opened in the step-by-step form. */
  onCustomize?: (pick: TemplatePick) => void;
  title?: string;
  subtitle?: string;
}

/** "Add 3 goals", by the count's own plural form (Arabic has four). */
function addLabel(count: number, t: Translations, language: Language): string {
  const forms = t.templates.addGoals;
  const form = count === 1 ? forms.one : count === 2 ? forms.two : count <= 10 ? forms.few : forms.many;
  return form.replace('{count}', () => formatNumber(count, language));
}

/** What is wrong with a decreasing template's start, if anything. */
function startError(template: GoalTemplate, current: string) {
  return stepErrors({ ...draftFromTemplate(template), current }, 2).current;
}

interface TemplateCardProps {
  template: GoalTemplate;
  selected: boolean;
  current: string;
  onToggle: (template: GoalTemplate) => void;
  onCurrentChange: (template: GoalTemplate, current: string) => void;
  onDelete?: (id: string) => void;
}

const TemplateCard = memo(({ template, selected, current, onToggle, onCurrentChange, onDelete }: TemplateCardProps) => {
  const { theme } = useTheme();
  const { t, language, isRTL } = useLanguage();
  const available = canQuickAdd(template);
  const needsStart = selected && template.direction === 'decrease';
  const unit = t.units[template.unit as keyof typeof t.units] || template.unit;
  const error = needsStart && current.trim() ? startError(template, current) : undefined;

  return (
    // Only the top of the card ticks it. The start field sits outside that:
    // inside, a tap in the field reached the card on web and unticked it,
    // taking the field away before anything could be typed.
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.card, borderColor: selected ? theme.colors.primary : 'transparent', ...theme.shadows.small },
        !available && styles.unavailable,
      ]}
    >
      <TouchableOpacity
        onPress={() => onToggle(template)}
        disabled={!available}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected, disabled: !available }}
        accessibilityLabel={template.title}
        accessibilityHint={available ? template.description : t.templates.needsSetup}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>{template.icon}</Text>
          <View style={styles.info}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{template.title}</Text>
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {available ? template.description : t.templates.needsSetup}
            </Text>
          </View>
          {onDelete ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete(template.id);
              }}
              style={styles.deleteButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t.common.delete}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
            </TouchableOpacity>
        ) : null}
        {available ? (
          <View
            style={[
              styles.check,
              { borderColor: selected ? theme.colors.primary : theme.colors.border },
              selected && { backgroundColor: theme.colors.primary },
            ]}
          >
            {selected ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
          </View>
        ) : null}
      </View>

      <View style={styles.details}>
        <View style={styles.detail}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.labels.target}</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            {formatNumber(template.target, language)} {unit}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.labels.points}</Text>
          <Text style={[styles.detailValue, { color: theme.colors.primary }]}>
            {formatNumber(template.points, language)}
          </Text>
        </View>
        <View style={styles.detail}>
          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>{t.goalForm.period}</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>{t.periods[template.period]}</Text>
        </View>
      </View>
    </TouchableOpacity>

      {needsStart ? (
        <View style={styles.startField}>
          <Text style={[styles.startLabel, { color: theme.colors.text, textAlign: isRTL ? 'right' : 'left' }]}>
            {t.templates.currentValue.replace('{unit}', () => unit)}
          </Text>
          <TextInput
            style={[
              styles.startInput,
              {
                borderColor: error ? theme.colors.danger : theme.colors.border,
                color: theme.colors.text,
                backgroundColor: theme.colors.background,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
            keyboardType="decimal-pad"
            value={current}
            onChangeText={(text) => onCurrentChange(template, text)}
            accessibilityLabel={t.templates.currentValue.replace('{unit}', () => unit)}
          />
          {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{t.validation[error]}</Text> : null}
        </View>
      ) : null}
    </View>
  );
});

TemplateCard.displayName = 'TemplateCard';

function TemplatesModal({ visible, onClose, onAdd, onCustomize, title, subtitle }: TemplatesModalProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const [customTemplates, setCustomTemplates] = useState<GoalTemplate[]>([]);
  /** Picked templates by id, each with the start typed for it. */
  const [picked, setPicked] = useState<Map<string, { template: GoalTemplate; current: string }>>(new Map());
  const [adding, setAdding] = useState(false);

  const loadCustomTemplates = useCallback(async () => {
    try {
      const templates = await customTemplatesStorage.loadCustomTemplates();
      setCustomTemplates(templates);
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    }
  }, []);

  // Load custom templates when the modal opens. Deliberately gated on
  // `visible` - there is no reason to hit storage while it is closed.
  useEffect(() => {
    if (visible) {
      void loadCustomTemplates();
    }
  }, [visible, loadCustomTemplates]);

  // Closed however it closes, it opens next time with nothing picked.
  const close = useCallback(() => {
    setPicked(new Map());
    onClose();
  }, [onClose]);

  const categories = useMemo(() => [
    { key: 'custom' as const, label: t.templates.myTemplates, icon: '⭐' },
    { key: 'health' as const, label: t.templates.categories.health, icon: '❤️' },
    { key: 'fitness' as const, label: t.templates.categories.fitness, icon: '💪' },
    { key: 'learning' as const, label: t.templates.categories.learning, icon: '📚' },
    { key: 'work' as const, label: t.templates.categories.work, icon: '💼' },
    { key: 'finance' as const, label: t.templates.categories.finance, icon: '💰' },
    { key: 'personal' as const, label: t.templates.categories.personal, icon: '✨' },
    { key: 'social' as const, label: t.templates.categories.social, icon: '👥' },
    { key: 'hobby' as const, label: t.templates.categories.hobby, icon: '🎨' },
    { key: 'other' as const, label: t.templates.categories.other, icon: '📋' },
  ], [t]);

  const builtIn = useMemo(() => getGoalTemplates(language), [language]);

  const templatesByCategory = useMemo(() => {
    const map = { all: [] as GoalTemplate[], custom: customTemplates } as Record<
      GoalCategory | 'custom' | 'all',
      GoalTemplate[]
    >;
    for (const template of builtIn) {
      (map[template.category] ??= []).push(template);
    }
    map.all = customTemplates.length > 0 ? [...customTemplates, ...builtIn] : builtIn;
    return map;
  }, [customTemplates, builtIn]);

  const toggle = useCallback((template: GoalTemplate) => {
    setPicked((previous) => {
      const next = new Map(previous);
      if (next.has(template.id)) next.delete(template.id);
      else next.set(template.id, { template, current: '' });
      return next;
    });
  }, []);

  const setCurrent = useCallback((template: GoalTemplate, current: string) => {
    setPicked((previous) => new Map(previous).set(template.id, { template, current }));
  }, []);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      await customTemplatesStorage.deleteCustomTemplate(templateId);
      setPicked((previous) => {
        const next = new Map(previous);
        next.delete(templateId);
        return next;
      });
      await loadCustomTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  }, [loadCustomTemplates]);

  const picks = useMemo(() => [...picked.values()], [picked]);
  // A decreasing template needs a start it can begin from.
  const ready = picks.length > 0 && picks.every(
    ({ template, current }) => template.direction !== 'decrease' || (current.trim() !== '' && !startError(template, current))
  );

  const toPick = ({ template, current }: { template: GoalTemplate; current: string }): TemplatePick =>
    template.direction === 'decrease' && current.trim() !== '' ? { template, current: Number(current) } : { template };

  const handleAdd = useCallback(async () => {
    setAdding(true);
    try {
      await onAdd(picks.map(toPick));
      close();
    } finally {
      setAdding(false);
    }
  }, [onAdd, close, picks]);

  const handleCustomize = useCallback(() => {
    if (!onCustomize || picks.length !== 1) return;
    onCustomize(toPick(picks[0]));
    close();
  }, [onCustomize, close, picks]);

  const renderTemplateItem = useCallback(
    ({ item }: { item: GoalTemplate }) => {
      const pick = picked.get(item.id);
      return (
        <TemplateCard
          template={item}
          selected={pick !== undefined}
          current={pick?.current ?? ''}
          onToggle={toggle}
          onCurrentChange={setCurrent}
          onDelete={item.id.startsWith('custom_') ? handleDeleteTemplate : undefined}
        />
      );
    },
    [picked, toggle, setCurrent, handleDeleteTemplate]
  );

  const footer = (
    <View style={[styles.footer, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.background }]}>
      {picks.length === 0 ? (
        <Text style={[styles.footerHint, { color: theme.colors.textSecondary }]}>{t.templates.pickHint}</Text>
      ) : (
        <View style={styles.footerButtons}>
          {onCustomize && picks.length === 1 ? (
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
              onPress={handleCustomize}
              accessibilityRole="button"
              accessibilityLabel={t.templates.customize}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>{t.templates.customize}</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }, (!ready || adding) && styles.disabled]}
            onPress={handleAdd}
            disabled={!ready || adding}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready || adding }}
            accessibilityLabel={addLabel(picks.length, t, language)}
          >
            <Text style={styles.primaryButtonText}>{addLabel(picks.length, t, language)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <TemplateModal<GoalTemplate, GoalCategory | 'custom'>
      visible={visible}
      onClose={close}
      title={title ?? t.templates.title}
      subtitle={subtitle}
      allLabel={t.templates.all}
      categories={categories}
      getItemsForCategory={(category) => templatesByCategory[category] ?? []}
      getSearchText={(template) => `${template.title} ${template.description} ${template.unit}`}
      renderItem={renderTemplateItem}
      keyExtractor={(item) => item.id}
      searchPlaceholder={`${t.common.search}...`}
      estimatedItemSize={170}
      fixedItemHeight={false}
      footer={footer}
    />
  );
}

export default memo(TemplatesModal);

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  unavailable: {
    opacity: 0.55,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  icon: {
    fontSize: 40,
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  detail: {
    flex: 1,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 8,
  },
  startField: {
    marginTop: 12,
    gap: 6,
  },
  startLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  startInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  error: {
    fontSize: 12,
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  footerHint: {
    fontSize: 14,
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 10,
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
    opacity: 0.5,
  },
});
