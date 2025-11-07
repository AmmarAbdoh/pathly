/**
 * Add Goal screen
 * Screen for creating new goals
 */

import AddGoalForm from '@/components/AddGoalForm';
import TemplatesModal from '@/components/TemplatesModal';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { GoalDirection, GoalTemplate, TimePeriod } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Add Goal screen component
 */
export default function AddGoalScreen() {
  const { addGoal } = useGoals();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const router = useRouter();
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);

  /**
   * Handle adding a new goal
   */
  const handleAddGoal = useCallback(
    async (
      title: string,
      target: number,
      current: number,
      unit: string,
      direction: GoalDirection,
      points: number,
      period: TimePeriod,
      customPeriodDays?: number,
      parentId?: number,
      isUltimate?: boolean,
      isRecurring?: boolean,
      description?: string,
      icon?: string,
      linkedRewardId?: number,
      subgoalsAwardPoints?: boolean
    ) => {
      try {
        await addGoal(title, target, current, unit, direction, points, period, customPeriodDays, parentId, isUltimate, isRecurring, description, icon, linkedRewardId, subgoalsAwardPoints);
        // Navigate back to home after successful creation
        router.push('/home');
      } catch (err) {
        console.error('Failed to add goal:', err);
      }
    },
    [addGoal, router]
  );

  /**
   * Handle template selection
   */
  const handleSelectTemplate = useCallback((template: GoalTemplate) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {t.goalForm.title}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            {t.home.addGoal}
          </Text>
        </View>

        {/* Templates Button */}
        <TouchableOpacity
          style={[styles.templatesButton, { backgroundColor: theme.colors.card, ...theme.shadows.small }]}
          onPress={() => setShowTemplates(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="albums-outline" size={24} color={theme.colors.primary} />
          <View style={styles.templatesButtonText}>
            <Text style={[styles.templatesButtonTitle, { color: theme.colors.text }]}>
              {t.templates.useTemplate}
            </Text>
            <Text style={[styles.templatesButtonSubtitle, { color: theme.colors.textSecondary }]}>
              {t.templates.quickStart}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Add Goal Form */}
        <AddGoalForm 
          key={selectedTemplate?.id || 'default'}
          onAddGoal={handleAddGoal}
          initialValues={selectedTemplate ? {
            title: selectedTemplate.title,
            description: selectedTemplate.description,
            target: selectedTemplate.target,
            current: 0,
            unit: selectedTemplate.unit,
            direction: selectedTemplate.direction,
            points: selectedTemplate.points,
            period: selectedTemplate.period,
            icon: selectedTemplate.icon,
          } : undefined}
        />
      </ScrollView>

      {/* Templates Modal */}
      <TemplatesModal
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  templatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  templatesButtonText: {
    flex: 1,
  },
  templatesButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  templatesButtonSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
