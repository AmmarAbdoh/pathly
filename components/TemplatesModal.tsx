/**
 * Goal Templates Modal
 * Quick selection of pre-defined goal templates
 */

import { getGoalTemplates } from '@/src/constants/goal-templates';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { GoalCategory, GoalTemplate } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface TemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: GoalTemplate) => void;
}

// Memoized template card component
const TemplateCard = memo(({ template, theme, t, onSelect }: any) => (
  <TouchableOpacity
    style={[
      styles.templateCard,
      {
        backgroundColor: theme.colors.card,
        ...theme.shadows.small,
      },
    ]}
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
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | 'all'>('all');

  const CATEGORIES: { key: GoalCategory; label: string; icon: string }[] = useMemo(() => [
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

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return GOAL_TEMPLATES;
    return GOAL_TEMPLATES.filter(t => t.category === selectedCategory);
  }, [selectedCategory, GOAL_TEMPLATES]);

  const handleSelectTemplate = useCallback((template: GoalTemplate) => {
    onSelectTemplate(template);
    onClose();
  }, [onSelectTemplate, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {t.templates.title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === 'all' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: selectedCategory === 'all' ? '#fff' : theme.colors.text },
                ]}
              >
                {t.templates.all}
              </Text>
            </TouchableOpacity>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.key && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    { color: selectedCategory === cat.key ? '#fff' : theme.colors.text },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Templates List */}
          <ScrollView style={styles.templatesScroll}>
            {filteredTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                theme={theme}
                t={t}
                onSelect={() => handleSelectTemplate(template)}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default memo(TemplatesModal);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: height * 0.85,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  categoriesScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  templatesScroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
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
});
