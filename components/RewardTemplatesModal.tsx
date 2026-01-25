/**
 * Reward Templates Modal
 * Quick selection of pre-defined reward templates
 */

import TemplateModal from '@/components/TemplateModal';
import { getRewardTemplates, RewardTemplate } from '@/src/constants/reward-templates';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RewardTemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: RewardTemplate) => void;
}

export default function RewardTemplatesModal({ visible, onClose, onSelectTemplate }: RewardTemplatesModalProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();

  const CATEGORIES: { key: RewardTemplate['category']; label: string; icon: string }[] = [
    { key: 'food', label: t.rewards.categories.food, icon: '🍕' },
    { key: 'entertainment', label: t.rewards.categories.entertainment, icon: '🎮' },
    { key: 'shopping', label: t.rewards.categories.shopping, icon: '🛍️' },
    { key: 'wellness', label: t.rewards.categories.wellness, icon: '💆' },
    { key: 'experience', label: t.rewards.categories.experience, icon: '🎢' },
    { key: 'hobby', label: t.rewards.categories.hobby, icon: '🎨' },
    { key: 'tech', label: t.rewards.categories.tech, icon: '🎧' },
    { key: 'other', label: t.rewards.categories.other, icon: '🎁' },
  ];

  const REWARD_TEMPLATES = useMemo(() => getRewardTemplates(language), [language]);

  const templatesByCategory = useMemo(() => {
    const map = { all: [] as RewardTemplate[] } as Record<RewardTemplate['category'] | 'all', RewardTemplate[]>;
    for (const template of REWARD_TEMPLATES) {
      if (!map[template.category]) {
        map[template.category] = [];
      }
      map.all.push(template);
      map[template.category].push(template);
    }
    return map;
  }, [REWARD_TEMPLATES]);

  const getItemsForCategory = useCallback(
    (category: RewardTemplate['category'] | 'all') => templatesByCategory[category] ?? [],
    [templatesByCategory]
  );

  const handleSelectTemplate = useCallback((template: RewardTemplate) => {
    onSelectTemplate(template);
    onClose();
  }, [onSelectTemplate, onClose]);

  const getSearchText = useCallback(
    (template: RewardTemplate) => `${template.title} ${template.description}`,
    []
  );

  const renderTemplateItem = useCallback(({ item }: { item: RewardTemplate }) => (
    <TouchableOpacity
      style={[
        styles.templateCard,
        {
          backgroundColor: theme.colors.card,
          ...theme.shadows.small,
        },
      ]}
      renderToHardwareTextureAndroid={Platform.OS === 'android'}
      onPress={() => handleSelectTemplate(item)}
      activeOpacity={0.7}
    >
      <View style={styles.templateHeader}>
        <Text style={styles.templateIcon}>{item.icon}</Text>
        <View style={styles.templateInfo}>
          <Text style={[styles.templateTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.templateDesc, { color: theme.colors.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
      <View style={styles.templateFooter}>
        <View style={[styles.pointsBadge, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="star" size={16} color="#fff" />
          <Text style={styles.pointsText}>{item.pointsCost}</Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [handleSelectTemplate, theme]);

  return (
    <TemplateModal<RewardTemplate, RewardTemplate['category']>
      visible={visible}
      onClose={onClose}
      title={t.rewards.title}
      subtitle={t.rewards.subtitle}
      allLabel={t.rewards.all}
      categories={CATEGORIES}
      getItemsForCategory={getItemsForCategory}
      getSearchText={getSearchText}
      renderItem={renderTemplateItem}
      keyExtractor={(item) => item.id}
      searchPlaceholder={`${t.common.search}...`}
      estimatedItemSize={140}
    />
  );
}

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
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
