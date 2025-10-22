/**
 * Goal detail screen
 * View and edit individual goal
 */

import AddGoalForm from '@/components/AddGoalForm';
import ConfirmationModal from '@/components/ConfirmationModal';
import GoalCard from '@/components/GoalCard';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { GoalDirection, TimePeriod } from '@/src/types';
import { formatProgressText } from '@/src/utils/goal-calculations';
import { isValidNumber } from '@/src/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
// Use expo/slider for better cross-platform support
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Goal detail screen component
 */
export default function GoalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goals, updateGoal, removeGoal, finishGoal, getSubgoals, addGoal, editGoal, addSubgoal } = useGoals();
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  const router = useRouter();

  const goal = useMemo(
    () => goals.find((g) => g.id === Number(id)),
    [goals, id]
  );

  const subgoals = useMemo(
    () => goal ? getSubgoals(goal.id) : [],
    [goal, getSubgoals]
  );

  const [newProgress, setNewProgress] = useState(
    goal?.current.toString() || '0'
  );
  const [sliderValue, setSliderValue] = useState(goal?.current || 0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddSubgoal, setShowAddSubgoal] = useState(false);

  // Sync slider with goal current value when goal changes
  useEffect(() => {
    if (goal) {
      setSliderValue(goal.current);
      setNewProgress(goal.current.toString());
    }
  }, [goal]);

  /**
   * Handle progress update
   */
  const handleUpdateProgress = useCallback(async () => {
    if (!goal) return;

    if (!isValidNumber(newProgress)) {
      Alert.alert(t.common.error, t.validation.invalidNumber);
      return;
    }

    const progress = parseFloat(newProgress);

    try {
      await updateGoal(goal.id, progress);
      Alert.alert(t.common.success, t.goalDetail.updateSuccess);
    } catch (error) {
      console.error('Failed to update progress:', error);
      Alert.alert(t.common.error, t.goalDetail.updateError);
    }
  }, [goal, newProgress, updateGoal, t]);

  /**
   * Handle slider value change
   */
  const handleSliderChange = useCallback((value: number) => {
    setSliderValue(value);
    setNewProgress(value.toString());
  }, []);

  /**
   * Handle slider complete - update goal
   */
  const handleSliderComplete = useCallback(async (value: number) => {
    if (!goal) return;

    try {
      await updateGoal(goal.id, value);
    } catch (error) {
      console.error('Failed to update progress:', error);
      Alert.alert(t.common.error, t.goalDetail.updateError);
    }
  }, [goal, updateGoal, t]);

  /**
   * Handle finish goal
   */
  const handleFinishGoal = useCallback(() => {
    setShowFinishModal(true);
  }, []);

  /**
   * Confirm finish goal
   */
  const confirmFinishGoal = useCallback(async () => {
    if (!goal) return;
    
    setShowFinishModal(false);
    
    try {
      await finishGoal(goal.id);
      Alert.alert(t.common.success, t.goalDetail.finishSuccess || 'Goal completed!');
    } catch (error) {
      console.error('Failed to finish goal:', error);
      Alert.alert(t.common.error, t.goalDetail.finishError || 'Failed to finish goal');
    }
  }, [goal, finishGoal, t]);

  /**
   * Cancel finish goal
   */
  const cancelFinishGoal = useCallback(() => {
    setShowFinishModal(false);
  }, []);

  /**
   * Handle edit mode toggle
   */
  const handleEditGoal = useCallback(() => {
    setIsEditMode(true);
  }, []);

  /**
   * Handle edit complete
   */
  const handleEditComplete = useCallback(() => {
    setIsEditMode(false);
  }, []);

  /**
   * Handle edit goal submission from form
   */
  const handleEditGoalSubmit = useCallback(async (
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
    isRecurring?: boolean
  ) => {
    if (!goal) return;
    
    try {
      await editGoal(
        goal.id,
        title,
        target,
        current,
        unit,
        direction,
        points,
        period,
        customPeriodDays,
        isUltimate,
        isRecurring
      );
      setIsEditMode(false);
      Alert.alert(t.common.success, 'Goal updated successfully');
    } catch (error) {
      console.error('Failed to edit goal:', error);
      Alert.alert(t.common.error, 'Failed to update goal');
    }
  }, [goal, editGoal, t]);

  /**
   * Handle add subgoal
   */
  const handleAddSubgoal = useCallback(() => {
    setShowAddSubgoal(true);
  }, []);

  /**
   * Handle subgoal added - submission from form
   */
  const handleSubgoalSubmit = useCallback(async (
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
    isRecurring?: boolean
  ) => {
    if (!goal) return;
    
    try {
      await addSubgoal(
        goal.id,
        title,
        target,
        current,
        unit,
        direction,
        points,
        period,
        customPeriodDays
      );
      setShowAddSubgoal(false);
      Alert.alert(t.common.success, 'Subgoal added successfully');
    } catch (error) {
      console.error('Failed to add subgoal:', error);
      Alert.alert(t.common.error, 'Failed to add subgoal');
    }
  }, [goal, addSubgoal, t]);

  /**
   * Handle subgoal press
   */
  const handleSubgoalPress = useCallback((subgoalId: number) => {
    router.push(`/goal/${subgoalId}`);
  }, [router]);

  /**
   * Handle goal deletion - show confirmation modal
   */
  const handleDelete = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  /**
   * Confirm and execute goal deletion
   */
  const confirmDelete = useCallback(async () => {
    if (!goal) return;
    
    setShowDeleteModal(false);
    
    try {
      await removeGoal(goal.id);
      // Navigate back after successful deletion
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (error) {
      console.error('Failed to delete goal:', error);
      Alert.alert(t.common.error, t.goalDetail.deleteError);
    }
  }, [goal, removeGoal, router, t]);

  /**
   * Cancel deletion
   */
  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  /**
   * Navigate back
   */
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Memoized styles
  const containerStyle = useMemo(
    () => [styles.container, { backgroundColor: theme.colors.background }],
    [theme]
  );

  const cardStyle = useMemo(
    () => [
      styles.card,
      {
        backgroundColor: theme.colors.card,
        ...theme.shadows.small,
      },
    ],
    [theme]
  );

  const inputStyle = useMemo(
    () => [
      styles.input,
      {
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        textAlign: (isRTL ? 'right' : 'left') as 'left' | 'right',
      },
    ],
    [theme, isRTL]
  );

  // Render error state if goal not found
  if (!goal) {
    return (
      <SafeAreaView style={containerStyle}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
            {t.goalDetail.notFound}
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={handleBack}
          >
            <Text style={styles.buttonText}>{t.common.back}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressText = formatProgressText(goal.current, goal.target, goal.unit);
  const progressPercentage = Math.round(goal.progress);

  // Show edit form if in edit mode
  if (isEditMode) {
    return (
      <SafeAreaView style={containerStyle} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleEditComplete}
            accessibilityRole="button"
            accessibilityLabel="Cancel edit"
          >
            <Ionicons
              name="close"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              {t.common.cancel}
            </Text>
          </TouchableOpacity>

          <AddGoalForm
            editMode={true}
            initialValues={{
              ...goal,
              isRecurring: goal.isRecurring || false,
            }}
            onAddGoal={handleEditGoalSubmit}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show add subgoal form
  if (showAddSubgoal) {
    return (
      <SafeAreaView style={containerStyle} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowAddSubgoal(false)}
            accessibilityRole="button"
            accessibilityLabel="Cancel add subgoal"
          >
            <Ionicons
              name="close"
              size={24}
              color={theme.colors.primary}
            />
            <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
              {t.common.cancel}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme.colors.text, marginBottom: 20 }]}>
            {t.goalDetail.addSubgoal}
          </Text>

          <AddGoalForm
            parentId={goal.id}
            parentTitle={goal.title}
            onAddGoal={handleSubgoalSubmit}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.backButtonText, { color: theme.colors.primary }]}>
            {t.common.back}
          </Text>
        </TouchableOpacity>

        {/* Goal Header */}
        <View style={styles.header}>
          {goal.isUltimate && (
            <View style={styles.ultimateBadge}>
              <Text style={styles.ultimateBadgeText}>⭐ {t.goalCard.ultimate}</Text>
            </View>
          )}
          {goal.isRecurring && (
            <View style={[styles.ultimateBadge, { backgroundColor: '#10b981' }]}>
              <Text style={styles.ultimateBadgeText}>🔄 Recurring</Text>
            </View>
          )}
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {goal.title}
          </Text>
          {goal.description && (
            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              {goal.description}
            </Text>
          )}
          <Text style={[styles.progress, { color: theme.colors.textSecondary }]}>
            {progressText}
          </Text>
          <Text style={[styles.percentage, { color: theme.colors.primary }]}>
            {progressPercentage}% {t.goalDetail.complete}
          </Text>
          <Text style={[styles.points, { color: theme.colors.primary }]}>
            🎯 {goal.points} {t.goalCard.points}
            {goal.isRecurring && goal.completionHistory && goal.completionHistory.length > 0 && (
              <Text style={{ fontSize: 14 }}> × {goal.completionHistory.length + (goal.isComplete ? 1 : 0)} completions</Text>
            )}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleEditGoal}
            activeOpacity={0.8}
          >
            <Ionicons name="pencil-outline" size={20} color="#FFF" />
            <Text style={styles.buttonText}>{t.goalDetail.editGoal}</Text>
          </TouchableOpacity>

          {!goal.isComplete && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
              onPress={handleFinishGoal}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={styles.buttonText}>{t.goalDetail.finishGoal}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slider Progress Update - Hidden for ultimate goals (progress from subgoals) */}
        {!goal.isComplete && !goal.isUltimate && (
          <View style={cardStyle}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t.goalDetail.updateProgress}
            </Text>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t.goalDetail.useSlider}
            </Text>
            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderValue, { color: theme.colors.text }]}>
                {sliderValue.toFixed(1)} {goal.unit}
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={goal.direction === 'decrease' ? goal.target : (goal.initialValue || 0)}
                maximumValue={goal.direction === 'decrease' ? (goal.initialValue || goal.target * 2) : goal.target}
                value={sliderValue}
                onValueChange={handleSliderChange}
                onSlidingComplete={handleSliderComplete}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.border}
                thumbTintColor={theme.colors.primary}
                step={goal.target > 100 ? 1 : 0.1}
              />
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  {goal.direction === 'decrease' ? goal.target : (goal.initialValue || 0)}
                </Text>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  {goal.direction === 'decrease' ? (goal.initialValue || goal.target * 2) : goal.target}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Manual Input (Alternative) - Hidden for ultimate goals */}
        {!goal.isComplete && !goal.isUltimate && (
          <View style={cardStyle}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Or enter manually:
            </Text>
            <View style={styles.manualInputRow}>
              <TextInput
                style={[inputStyle, { flex: 1 }]}
                value={newProgress}
                onChangeText={setNewProgress}
                keyboardType="decimal-pad"
                placeholder={`Enter ${goal.unit}`}
                placeholderTextColor={theme.colors.textSecondary}
                accessibilityLabel="New progress value"
              />
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdateProgress}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Subgoals Section - Only for Ultimate Goals */}
        {goal.isUltimate && (
          <View style={cardStyle}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t.goalDetail.subgoalsTitle} ({subgoals.length})
              </Text>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddSubgoal}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            {subgoals.length === 0 ? (
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                {t.goalDetail.noSubgoals}
              </Text>
            ) : (
              <View style={styles.subgoalsList}>
                {subgoals.map((subgoal) => (
                  <GoalCard
                    key={subgoal.id}
                    title={subgoal.title}
                    progress={subgoal.progress}
                    points={subgoal.points}
                    subgoalCount={subgoal.subGoals?.length || 0}
                    isUltimate={subgoal.isUltimate}
                    onPress={() => handleSubgoalPress(subgoal.id)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.danger }]}
          onPress={handleDelete}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Delete goal"
          testID="delete-goal-button"
        >
          <Ionicons name="trash-outline" size={20} color="#FFF" />
          <Text style={styles.buttonText}>{t.goalDetail.deleteGoal}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title={t.goalDetail.deleteConfirmTitle}
        message={t.goalDetail.deleteConfirmMessage}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmStyle="destructive"
      />

      {/* Finish Confirmation Modal */}
      <ConfirmationModal
        visible={showFinishModal}
        title={t.goalDetail.finishConfirmTitle}
        message={t.goalDetail.finishConfirmMessage}
        confirmText={t.goalDetail.finishGoal}
        cancelText={t.common.cancel}
        onConfirm={confirmFinishGoal}
        onCancel={cancelFinishGoal}
        confirmStyle="default"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
  },
  ultimateBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  ultimateBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  progress: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '500',
  },
  percentage: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  points: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  sliderContainer: {
    marginTop: 8,
  },
  sliderValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  manualInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  updateButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  subgoalsList: {
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
});
