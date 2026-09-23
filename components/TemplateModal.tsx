/**
 * Shared template modal
 * Reusable modal for goal/reward templates with category filtering
 */

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  InteractionManager,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

const { height } = Dimensions.get('window');

export interface TemplateModalCategory<TCategory extends string> {
  key: TCategory;
  label: string;
  icon?: string;
}

/**
 * The common subset of FlatList's and FlashList's row renderer.
 *
 * FlatList's own ListRenderItem requires a `separators` argument that FlashList
 * does not supply, so neither library's type is assignable to the other. This
 * narrower signature is accepted by both.
 */
export type TemplateRenderItem<TItem> = (info: {
  item: TItem;
  index: number;
}) => React.ReactElement | null;

export interface TemplateModalProps<TItem, TCategory extends string> {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  allLabel: string;
  categories: TemplateModalCategory<TCategory>[];
  getItemsForCategory: (category: TCategory | 'all') => TItem[];
  getSearchText?: (item: TItem) => string;
  renderItem: TemplateRenderItem<TItem>;
  keyExtractor: (item: TItem, index: number) => string;
  initialCategory?: TCategory | 'all';
  /** Row height hint for the FlatList fallback's getItemLayout. FlashList v2 measures rows itself. */
  estimatedItemSize?: number;
  searchPlaceholder?: string;
}

function TemplateModal<TItem, TCategory extends string>({
  visible,
  onClose,
  title,
  subtitle,
  allLabel,
  categories,
  getItemsForCategory,
  getSearchText,
  renderItem,
  keyExtractor,
  initialCategory = 'all',
  estimatedItemSize = 150,
  searchPlaceholder,
}: TemplateModalProps<TItem, TCategory>) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<TCategory | 'all'>(initialCategory);
  const [renderedCategory, setRenderedCategory] = useState<TCategory | 'all'>(initialCategory);
  const [isListReady, setIsListReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasAutoLayoutView = !!UIManager.getViewManagerConfig?.('AutoLayoutView');
  const itemSize = Math.max(estimatedItemSize, 1);

  const categoryItems = useMemo(
    () => getItemsForCategory(renderedCategory),
    [getItemsForCategory, renderedCategory]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    if (!normalizedQuery || !getSearchText) {
      return categoryItems;
    }

    return categoryItems.filter((item) => {
      const text = getSearchText(item);
      return text && text.toLowerCase().includes(normalizedQuery);
    });
  }, [categoryItems, getSearchText, normalizedQuery]);

  useEffect(() => {
    if (!visible) {
      setIsListReady(false);
      setSearchQuery('');
      return;
    }

    setIsListReady(false);
    const handle = InteractionManager.runAfterInteractions(() => {
      setRenderedCategory(selectedCategory);
      setIsListReady(true);
    });

    return () => handle.cancel?.();
  }, [visible, selectedCategory]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: theme.colors.background }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {subtitle ? (
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}

          {/* Search */}
          {searchPlaceholder ? (
            <View
              style={[
                styles.searchContainer,
                { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.colors.text }]}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchQuery ? (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery('')}
                  accessibilityLabel={t.common.clear}
                >
                  <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          {/* Category Filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
            keyboardShouldPersistTaps="handled"
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
                {allLabel}
              </Text>
            </TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryChip,
                  selectedCategory === category.key && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                {category.icon ? <Text style={styles.categoryIcon}>{category.icon}</Text> : null}
                <Text
                  style={[
                    styles.categoryText,
                    { color: selectedCategory === category.key ? '#fff' : theme.colors.text },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Templates List */}
          {!isListReady ? (
            <View style={styles.listLoading}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : null}
          {hasAutoLayoutView ? (
            <FlashList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.templatesContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          ) : (
            <FlatList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              style={styles.templatesScroll}
              contentContainerStyle={styles.templatesContent}
              initialNumToRender={6}
              maxToRenderPerBatch={6}
              updateCellsBatchingPeriod={50}
              windowSize={5}
              removeClippedSubviews={true}
              getItemLayout={(_, index) => ({
                length: itemSize,
                offset: itemSize * index,
                index,
              })}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default TemplateModal;

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
  },
  templatesContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  listLoading: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: 'flex-start',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
});
