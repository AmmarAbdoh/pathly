/**
 * Goal Templates Modal
 * Quick selection of pre-defined goal templates
 */

import TemplateModal from '@/components/TemplateModal';
import { getGoalTemplates } from '@/src/constants/goal-templates';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { GoalCategory, GoalTemplate } from '@/src/types';
import { customTemplatesStorage } from '@/src/utils/storage';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: GoalTemplate) => void;
}

// Memoized template card component
const TemplateCard = memo(({ template, theme, t, onSelect, isCustom, onDelete }: any) => (
  <TouchableOpacity
    style={[
      styles.templateCard,
      {
        backgroundColor: theme.colors.card,
        ...theme.shadows.small,
      },
    ]}
    renderToHardwareTextureAndroid={Platform.OS === 'android'}
    onPress={onSelect}
    activeOpacity={0.7}
  >
    <View style={styles.templateHeader}>
      <Text style={styles.templateIcon}>{template.icon}</Text>
      <View style={styles.templateInfo}>
        <Text style={[styles.templateTitle, { color: theme.colors.text }]}>
          {template.title}
        </Text>
        <Text style={[styles.templateDesc, { color: theme.colors.textSecondary }]}>
          {template.description}
        </Text>
      </View>
      {isCustom && onDelete && (
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={styles.deleteTemplateButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={theme.colors.danger} />
        </TouchableOpacity>
      )}
    </View>
    <View style={styles.templateDetails}>
      <View style={styles.templateDetail}>
        <Text style={[styles.templateDetailLabel, { color: theme.colors.textSecondary }]}>
          {t.labels.target}
        </Text>
        <Text style={[styles.templateDetailValue, { color: theme.colors.text }]}>
          {template.target} {t.units[template.unit as keyof typeof t.units] || template.unit}
        </Text>
      </View>
      <View style={styles.templateDetail}>
        <Text style={[styles.templateDetailLabel, { color: theme.colors.textSecondary }]}>
          {t.goalCard.points}
        </Text>
        <Text style={[styles.templateDetailValue, { color: theme.colors.primary }]}>
          {template.points}
        </Text>
      </View>
      <View style={styles.templateDetail}>
        <Text style={[styles.templateDetailLabel, { color: theme.colors.textSecondary }]}>
          {t.goalForm.period}
        </Text>
        <Text style={[styles.templateDetailValue, { color: theme.colors.text }]}>
          {t.periods[template.period]}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
));

function TemplatesModal({ visible, onClose, onSelectTemplate }: TemplatesModalProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const [customTemplates, setCustomTemplates] = useState<GoalTemplate[]>([]);

  const loadCustomTemplates = useCallback(async () => {
    try {
      const templates = await customTemplatesStorage.loadCustomTemplates();
      setCustomTemplates(templates);
    } catch (error) {
      console.error('Failed to load custom templates:', error);
    }
  }, []);

  // Load custom templates when modal opens
  useEffect(() => {
    if (visible) {
      loadCustomTemplates();
    }
  }, [visible, loadCustomTemplates]);

  useEffect(() => {
    loadCustomTemplates();
  }, [loadCustomTemplates]);

  const CATEGORIES: { key: GoalCategory | 'custom'; label: string; icon: string }[] = useMemo(() => [
    { key: 'custom' as const, label: 'My Templates', icon: '⭐' },
    { key: 'health', label: t.templates.categories.health, icon: '❤️' },
    { key: 'fitness', label: t.templates.categories.fitness, icon: '💪' },
    { key: 'learning', label: t.templates.categories.learning, icon: '📚' },
    { key: 'work', label: t.templates.categories.work, icon: '💼' },
    { key: 'finance', label: t.templates.categories.finance, icon: '💰' },
    { key: 'personal', label: t.templates.categories.personal, icon: '✨' },
    { key: 'social', label: t.templates.categories.social, icon: '👥' },
    { key: 'hobby', label: t.templates.categories.hobby, icon: '🎨' },
    { key: 'other', label: t.templates.categories.other, icon: '📋' },
  ], [t]);

  const GOAL_TEMPLATES = useMemo(() => getGoalTemplates(language), [language]);

  const templatesByCategory = useMemo(() => {
    const map = {
      all: [] as GoalTemplate[],
      custom: customTemplates,
    } as Record<GoalCategory | 'custom' | 'all', GoalTemplate[]>;

    for (const template of GOAL_TEMPLATES) {
      if (!map[template.category]) {
        map[template.category] = [];
      }
      map[template.category].push(template);
    }

    map.all = customTemplates.length > 0
      ? [...customTemplates, ...GOAL_TEMPLATES]
      : GOAL_TEMPLATES;

    return map;
  }, [customTemplates, GOAL_TEMPLATES]);

  const handleSelectTemplate = useCallback((template: GoalTemplate) => {
    onSelectTemplate(template);
    onClose();
  }, [onSelectTemplate, onClose]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      await customTemplatesStorage.deleteCustomTemplate(templateId);
      await loadCustomTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  }, [loadCustomTemplates]);

  const getSearchText = useCallback(
    (template: GoalTemplate) => `${template.title} ${template.description} ${template.unit}`,
    []
  );

  const getItemsForCategory = useCallback(
    (category: GoalCategory | 'custom' | 'all') => templatesByCategory[category] ?? [],
    [templatesByCategory]
  );

  const renderTemplateItem = useCallback(({ item }: { item: GoalTemplate }) => (
    <TemplateCard
      template={item}
      theme={theme}
      t={t}
      onSelect={() => handleSelectTemplate(item)}
      isCustom={item.id.startsWith('custom_')}
      onDelete={() => handleDeleteTemplate(item.id)}
    />
  ), [handleSelectTemplate, handleDeleteTemplate, theme, t]);

  return (
    <TemplateModal<GoalTemplate, GoalCategory | 'custom'>
      visible={visible}
      onClose={onClose}
      title={t.templates.title}
      allLabel={t.templates.all}
      categories={CATEGORIES}
      getItemsForCategory={getItemsForCategory}
      getSearchText={getSearchText}
      renderItem={renderTemplateItem}
      keyExtractor={(item) => item.id}
      searchPlaceholder={`${t.common.search}...`}
      estimatedItemSize={170}
    />
  );
}

export default memo(TemplatesModal);

const styles = StyleSheet.create({
  templateCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  templateIcon: {
    fontSize: 40,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  templateDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  templateDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  templateDetail: {
    flex: 1,
    alignItems: 'flex-start',
  },
  templateDetailLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  templateDetailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteTemplateButton: {
    padding: 8,
    marginLeft: 8,
  },
});
