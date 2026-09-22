/**
 * GoalListHeader component
 * Search field and status filters for the home list.
 *
 * Lives in its own memoized component so FlatList can receive it as an element
 * rather than a render function. Passing `() => <Header />` remounts the whole
 * subtree - including this TextInput - on every parent state change, which made
 * typing in search drop frames and fight the keyboard.
 */

import Header from '@/components/Header';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export type FilterStatus = 'all' | 'active' | 'paused' | 'completed' | 'expired';

interface GoalListHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterStatus: FilterStatus;
  onFilterChange: (status: FilterStatus) => void;
}

interface FilterChipProps {
  status: FilterStatus;
  label: string;
  isActive: boolean;
  onPress: (status: FilterStatus) => void;
}

/**
 * A single filter pill. Split out so each one only re-renders when its own
 * active state flips.
 */
const FilterChip = memo<FilterChipProps>(({ status, label, isActive, onPress }) => {
  const { theme } = useTheme();

  const handlePress = useCallback(() => onPress(status), [onPress, status]);

  return (
    <TouchableOpacity
      style={[
        styles.filterButton,
        { backgroundColor: isActive ? theme.colors.primary : theme.colors.card },
        theme.shadows.small,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      activeOpacity={0.75}
    >
      <Text
        style={[styles.filterButtonText, { color: isActive ? '#FFF' : theme.colors.text }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
});

FilterChip.displayName = 'FilterChip';

const GoalListHeader = memo<GoalListHeaderProps>(
  ({ searchQuery, onSearchChange, filterStatus, onFilterChange }) => {
    const { theme } = useTheme();
    const { t } = useLanguage();

    const filters = useMemo(
      () => [
        { status: 'all' as const, label: t.home.filterAll },
        { status: 'active' as const, label: t.home.filterActive },
        { status: 'paused' as const, label: t.home.filterPaused },
        { status: 'completed' as const, label: t.home.filterCompleted },
        { status: 'expired' as const, label: t.home.filterExpired },
      ],
      [t]
    );

    const handleClearSearch = useCallback(() => onSearchChange(''), [onSearchChange]);

    return (
      <>
        <Header />

        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.colors.card, ...theme.shadows.small },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder={t.home.searchPlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            clearButtonMode="never"
            accessibilityLabel={t.home.searchPlaceholder}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
              accessibilityRole="button"
              accessibilityLabel={t.common.clear}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.filtersContainer}>
          {filters.map((filter) => (
            <FilterChip
              key={filter.status}
              status={filter.status}
              label={filter.label}
              isActive={filterStatus === filter.status}
              onPress={onFilterChange}
            />
          ))}
        </View>
      </>
    );
  }
);

GoalListHeader.displayName = 'GoalListHeader';

export default GoalListHeader;

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
