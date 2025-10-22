/**
 * Reward Templates Modal
 * Quick selection of pre-defined reward templates
 */

import { getRewardTemplates, RewardTemplate } from '@/src/constants/reward-templates';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height } = Dimensions.get('window');

interface RewardTemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: RewardTemplate) => void;
}

export default function RewardTemplatesModal({ visible, onClose, onSelectTemplate }: RewardTemplatesModalProps) {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<RewardTemplate['category'] | 'all'>('all');

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

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return REWARD_TEMPLATES;
    return REWARD_TEMPLATES.filter(t => t.category === selectedCategory);
  }, [selectedCategory, REWARD_TEMPLATES]);

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
              {t.rewards.title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t.rewards.subtitle}
          </Text>

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
                {t.rewards.all}
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
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor: theme.colors.card,
                    ...theme.shadows.small,
                  },
                ]}
                onPress={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
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
                <View style={styles.templateFooter}>
                  <View style={[styles.pointsBadge, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="star" size={16} color="#fff" />
                    <Text style={styles.pointsText}>{template.pointsCost}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
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
