/**
 * Quick add goal screen
 *
 * A minimal alternative to the full AddGoalForm, reachable at /goal/add.
 * Captures only the essentials and fills the rest with defaults.
 */

import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { GoalDirection } from '@/src/types';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Defaults for the quick form; the full AddGoalForm asks for these. */
const DEFAULT_POINTS = 10;
const DEFAULT_PERIOD = 'ongoing' as const;

export default function QuickAddGoal() {
  const { addGoal } = useGoals();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [unit, setUnit] = useState('');
  const [direction, setDirection] = useState<GoalDirection>('increase');
  const [isSaving, setIsSaving] = useState(false);

  const canSave =
    title.trim().length > 0 &&
    targetValue.trim().length > 0 &&
    !Number.isNaN(parseFloat(targetValue));

  const handleSave = useCallback(async () => {
    if (!canSave || isSaving) return;

    setIsSaving(true);
    try {
      await addGoal(
        title,
        parseFloat(targetValue),
        parseFloat(currentValue) || 0,
        unit,
        direction,
        DEFAULT_POINTS,
        DEFAULT_PERIOD
      );
      // Deep-linking straight to /goal/add leaves nothing to go back to, and
      // router.back() would silently no-op and strand the user on the form.
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } catch {
      Alert.alert(t.common.error, t.goalForm.addError);
    } finally {
      setIsSaving(false);
    }
  }, [canSave, isSaving, addGoal, title, targetValue, currentValue, unit, direction, router, t]);

  const inputStyle = useMemo(
    () => [
      styles.input,
      {
        backgroundColor: theme.colors.card,
        color: theme.colors.text,
        borderColor: theme.colors.border,
      },
    ],
    [theme]
  );

  const labelStyle = useMemo(
    () => [styles.label, { color: theme.colors.textSecondary }],
    [theme]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Text style={[styles.heading, { color: theme.colors.primary }]}>
          {t.goalForm.title}
        </Text>

        <Text style={labelStyle}>{t.goalForm.titleLabel}</Text>
        <TextInput
          style={inputStyle}
          value={title}
          onChangeText={setTitle}
          placeholder={t.goalForm.titlePlaceholder}
          placeholderTextColor={theme.colors.textSecondary}
          accessibilityLabel={t.goalForm.titleLabel}
        />

        <Text style={labelStyle}>{t.goalForm.currentLabel}</Text>
        <TextInput
          style={inputStyle}
          value={currentValue}
          onChangeText={setCurrentValue}
          placeholder="0"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          accessibilityLabel={t.goalForm.currentLabel}
        />

        <Text style={labelStyle}>{t.labels.target}</Text>
        <TextInput
          style={inputStyle}
          value={targetValue}
          onChangeText={setTargetValue}
          placeholder="100"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="numeric"
          accessibilityLabel={t.labels.target}
        />

        <Text style={labelStyle}>{t.goalForm.unit}</Text>
        <TextInput
          style={inputStyle}
          value={unit}
          onChangeText={setUnit}
          placeholder={t.goalForm.unitPlaceholder}
          placeholderTextColor={theme.colors.textSecondary}
          accessibilityLabel={t.goalForm.unit}
        />

        <Text style={labelStyle}>{t.goalForm.direction}</Text>
        <View style={styles.segmented}>
          {(['increase', 'decrease'] as const).map((option) => {
            const isActive = direction === option;
            return (
              <Pressable
                key={option}
                onPress={() => setDirection(option)}
                style={[
                  styles.segment,
                  {
                    backgroundColor: isActive ? theme.colors.primary : theme.colors.card,
                    borderColor: theme.colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isActive ? '#FFF' : theme.colors.text },
                  ]}
                >
                  {option === 'increase'
                    ? t.goalForm.directionIncrease
                    : t.goalForm.directionDecrease}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.saveButton,
            { backgroundColor: canSave ? theme.colors.primary : theme.colors.border },
          ]}
          onPress={handleSave}
          disabled={!canSave || isSaving}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canSave || isSaving }}
        >
          <Text style={styles.saveButtonText}>{t.common.save}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 24,
    letterSpacing: -0.4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 18,
  },
  segmented: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
