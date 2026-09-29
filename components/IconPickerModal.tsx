/**
 * IconPickerModal
 * A goal's icon, chosen from the icon categories. Shared by the goal form and
 * the step-by-step form.
 */

import { ICON_CATEGORIES } from '@/src/constants/icons';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface IconPickerModalProps {
  visible: boolean;
  /** The icon chosen now, marked in the grid. */
  selected: string;
  onSelect: (icon: string) => void;
  onClose: () => void;
}

export default function IconPickerModal({ visible, selected, onSelect, onClose }: IconPickerModalProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [category, setCategory] = useState<string>('achievements');

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.content, { backgroundColor: theme.colors.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{t.rewards.icon}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel={t.common.close}>
              <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
            {Object.keys(ICON_CATEGORIES).map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.tab,
                  { backgroundColor: theme.colors.background },
                  category === key && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setCategory(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: category === key }}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: theme.colors.text },
                    category === key && { color: '#fff', fontWeight: '600' },
                  ]}
                >
                  {t.iconCategories[key as keyof typeof t.iconCategories]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.scroll} removeClippedSubviews>
            <View style={styles.grid}>
              {ICON_CATEGORIES[category]?.map((icon, index) => (
                <TouchableOpacity
                  key={`icon-${index}-${icon}`}
                  style={[
                    styles.option,
                    { backgroundColor: theme.colors.background },
                    selected === icon && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
                  ]}
                  onPress={() => onSelect(icon)}
                  accessibilityRole="button"
                  accessibilityLabel={icon}
                  accessibilityState={{ selected: selected === icon }}
                >
                  <Text style={styles.optionText}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  tabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  scroll: {
    maxHeight: 400,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'space-evenly',
  },
  option: {
    width: '18%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
  },
  optionText: {
    fontSize: 32,
  },
});
