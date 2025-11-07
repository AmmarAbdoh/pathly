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
import { calculateTimeRemaining, formatEndDateTime, formatProgressText, formatTimeRemaining } from '@/src/utils/goal-calculations';
import { formatNumber } from '@/src/utils/number-formatting';
import { customTemplatesStorage } from '@/src/utils/storage';
import { isValidNumber } from '@/src/utils/validation';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
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
  const { goals, updateGoal, archiveGoal, finishGoal, getSubgoals, addGoal, editGoal, addSubgoal, extendDeadline, togglePause, addNote, deleteNote, addDependency, removeDependency, checkDependencies } = useGoals();
  const { theme } = useTheme();
  const { t, isRTL, language } = useLanguage();
  const router = useRouter();

  const goal = useMemo(
    () => goals.find((g) => g.id === Number(id)),
    [goals, id]
  );

  const subgoals = useMemo(
    () => goal ? getSubgoals(goal.id) : [],
    [goal, getSubgoals]
  );

  // Check if goal is expired
  const isGoalExpired = useMemo(() => {
    if (!goal || goal.isRecurring) return false; // Recurring goals don't expire
    const timeRemaining = calculateTimeRemaining(
      goal.periodStartDate,
      goal.period,
      goal.customPeriodDays,
      goal.isRecurring
    );
    return timeRemaining.isExpired;
  }, [goal]);

  // Check if goal is blocked by dependencies
  const isBlocked = useMemo(() => {
    if (!goal) return false;
    return !checkDependencies(goal.id);
  }, [goal, checkDependencies]);

  // Get available goals for dependencies (exclude self, subgoals, parent, and archived)
  const availableGoalsForDependencies = useMemo(() => {
    if (!goal) return [];
    return goals.filter((g) => 
      g.id !== goal.id && // Not self
      g.parentId !== goal.id && // Not a subgoal of current goal
      g.id !== goal.parentId && // Not parent goal
      !g.isArchived && // Not archived
      !g.isComplete // Not complete
    );
  }, [goal, goals]);

  const [newProgress, setNewProgress] = useState(
    goal?.current.toString() || '0'
  );
  const [sliderValue, setSliderValue] = useState(goal?.current || 0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [show100PercentModal, setShow100PercentModal] = useState(false);
  const [pending100PercentValue, setPending100PercentValue] = useState<number | null>(null);
  const [notYetValue, setNotYetValue] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddSubgoal, setShowAddSubgoal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendDays, setExtendDays] = useState('7');
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(goal?.notificationsEnabled || false);
  const [notificationTime, setNotificationTime] = useState(goal?.notificationTime || 540); // Default: 9:00 AM
  const [selectedDays, setSelectedDays] = useState<number[]>(goal?.notificationDays || []);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showDependenciesModal, setShowDependenciesModal] = useState(false);
  const [selectedDependencies, setSelectedDependencies] = useState<number[]>([]);

  // Sync slider with goal current value when goal changes
  useEffect(() => {
    if (goal) {
      setSliderValue(goal.current);
      setNewProgress(goal.current.toString());
    }
  }, [goal]);

  /**
   * Check if a value would result in 100% progress
   */
  const wouldReach100Percent = useCallback((value: number) => {
    if (!goal) return false;
    
    let newProgress: number;
    if (goal.direction === 'increase') {
      newProgress = ((value - (goal.initialValue || 0)) / (goal.target - (goal.initialValue || 0))) * 100;
    } else {
      newProgress = (((goal.initialValue || goal.target * 2) - value) / ((goal.initialValue || goal.target * 2) - goal.target)) * 100;
    }
    
    return Math.round(newProgress) >= 100;
  }, [goal]);

  /**
   * Handle saving the value from 100% modal
   */
  const handle100PercentSave = useCallback(async () => {
    if (!goal || pending100PercentValue === null) return;
    
    // Use input value if provided, otherwise use the pending value
    let targetValue: number;
    
    if (notYetValue.trim() !== '') {
      const parsedValue = parseFloat(notYetValue);
      if (isNaN(parsedValue) || parsedValue < 0) {
        Alert.alert(t.common.error, t.validation.invalidNumber);
        return;
      }
      targetValue = parsedValue;
    } else {
      targetValue = pending100PercentValue;
    }
    
    // Check if the saved value still results in 100%
    if (wouldReach100Percent(targetValue)) {
      // Ask if they want to mark as complete
      Alert.alert(
        t.goalDetail.complete100Title,
        t.goalDetail.saveCompleteConfirm,
        [
          {
            text: t.common.cancel,
            style: 'cancel',
          },
          {
            text: t.goalDetail.markComplete,
            onPress: async () => {
              setShow100PercentModal(false);
              setNotYetValue('');
              try {
                await updateGoal(goal.id, targetValue);
                await finishGoal(goal.id);
                setPending100PercentValue(null);
                Alert.alert(t.common.success, t.goalDetail.finishSuccess);
              } catch (error) {
                console.error('Failed to complete goal:', error);
                Alert.alert(t.common.error, t.goalDetail.finishError);
              }
            },
          },
        ]
      );
    } else {
      // Value is less than 100%, just save it
      setShow100PercentModal(false);
      setNotYetValue('');
      setSliderValue(targetValue);
      setNewProgress(targetValue.toString());
      
      try {
        await updateGoal(goal.id, targetValue);
        setPending100PercentValue(null);
      } catch (error) {
        console.error('Failed to update progress:', error);
        Alert.alert(t.common.error, t.goalDetail.updateError);
      }
    }
  }, [goal, pending100PercentValue, notYetValue, updateGoal, finishGoal, wouldReach100Percent, t]);

  /**
   * Handle canceling the 100% modal
   */
  const handle100PercentCancel = useCallback(() => {
    // Check if user has entered a value
    if (notYetValue.trim() !== '') {
      Alert.alert(
        t.common.cancel,
        t.goalDetail.unsavedChangesMessage,
        [
          {
            text: t.common.back,
            style: 'cancel',
          },
          {
            text: t.goalDetail.discardChanges,
            style: 'destructive',
            onPress: () => {
              setShow100PercentModal(false);
              setNotYetValue('');
              setPending100PercentValue(null);
            },
          },
        ]
      );
    } else {
      // No changes, just close
      setShow100PercentModal(false);
      setNotYetValue('');
      setPending100PercentValue(null);
    }
  }, [notYetValue, t]);

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

    // Check if this would reach 100%
    if (wouldReach100Percent(progress) && !goal.isComplete) {
      setPending100PercentValue(progress);
      setShow100PercentModal(true);
      return;
    }

    try {
      await updateGoal(goal.id, progress);
      Alert.alert(t.common.success, t.goalDetail.updateSuccess);
    } catch (error) {
      console.error('Failed to update progress:', error);
      Alert.alert(t.common.error, t.goalDetail.updateError);
    }
  }, [goal, newProgress, updateGoal, t, wouldReach100Percent]);

  /**
   * Handle slider value change
   */
  const handleSliderChange = useCallback((value: number) => {
    const roundedValue = Math.round(value);
    setSliderValue(roundedValue);
    setNewProgress(roundedValue.toString());
  }, []);

  /**
   * Handle slider complete - update goal
   */
  const handleSliderComplete = useCallback(async (value: number) => {
    if (!goal) return;

    const roundedValue = Math.round(value);
    
    // Check if this would reach 100%
    if (wouldReach100Percent(roundedValue) && !goal.isComplete) {
      setPending100PercentValue(roundedValue);
      setShow100PercentModal(true);
      return;
    }
    
    try {
      await updateGoal(goal.id, roundedValue);
    } catch (error) {
      console.error('Failed to update progress:', error);
      Alert.alert(t.common.error, t.goalDetail.updateError);
    }
  }, [goal, updateGoal, t, wouldReach100Percent]);

  /**
   * Handle increment button (+1)
   */
  const handleIncrement = useCallback(async () => {
    if (!goal) return;
    
    const minValue = goal.direction === 'decrease' ? goal.target : (goal.initialValue || 0);
    const maxValue = goal.direction === 'decrease' ? (goal.initialValue || goal.target * 2) : goal.target;
    const newValue = Math.min(sliderValue + 1, maxValue);
    
    setSliderValue(newValue);
    setNewProgress(newValue.toString());
    
    // Check if this would reach 100%
    if (wouldReach100Percent(newValue) && !goal.isComplete) {
      setPending100PercentValue(newValue);
      setShow100PercentModal(true);
      return;
    }
    
    try {
      await updateGoal(goal.id, newValue);
    } catch (error) {
      console.error('Failed to update progress:', error);
      Alert.alert(t.common.error, t.goalDetail.updateError);
    }
  }, [goal, sliderValue, updateGoal, t, wouldReach100Percent]);

  /**
   * Handle decrement button (-1)
   */
  const handleDecrement = useCallback(async () => {
    if (!goal) return;
    
    const minValue = goal.direction === 'decrease' ? goal.target : (goal.initialValue || 0);
    const maxValue = goal.direction === 'decrease' ? (goal.initialValue || goal.target * 2) : goal.target;
    const newValue = Math.max(sliderValue - 1, minValue);
    
    setSliderValue(newValue);
    setNewProgress(newValue.toString());
    
    // Check if this would reach 100%
    if (wouldReach100Percent(newValue) && !goal.isComplete) {
      setPending100PercentValue(newValue);
      setShow100PercentModal(true);
      return;
    }
    
    try {
      await updateGoal(goal.id, newValue);
    } catch (error) {
      console.error('Failed to update progress:', error);
      Alert.alert(t.common.error, t.goalDetail.updateError);
    }
  }, [goal, sliderValue, updateGoal, t, wouldReach100Percent]);

  /**
   * Handle jump by amount (for quick adjust buttons)
   */
  const handleJump = useCallback(async (amount: number) => {
    if (!goal) return;
    
    const minValue = goal.direction === 'decrease' ? goal.target : (goal.initialValue || 0);
    const maxValue = goal.direction === 'decrease' ? (goal.initialValue || goal.target * 2) : goal.target;
    const newValue = Math.max(minValue, Math.min(sliderValue + amount, maxValue));
    
    setSliderValue(newValue);
    setNewProgress(newValue.toString());
    
    // Check if this would reach 100%
    if (wouldReach100Percent(newValue) && !goal.isComplete) {
      setPending100PercentValue(newValue);
      setShow100PercentModal(true);
      return;
    }
    
    try {
      await updateGoal(goal.id, newValue);
    } catch (error) {
      console.error('Failed to update progress:', error);
      Alert.alert(t.common.error, t.goalDetail.updateError);
    }
  }, [goal, sliderValue, updateGoal, t, wouldReach100Percent]);

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
   * Handle extend deadline
   */
  const handleExtendDeadline = useCallback(() => {
    setShowExtendModal(true);
  }, []);

  /**
   * Confirm extend deadline
   */
  const confirmExtendDeadline = useCallback(async () => {
    if (!goal) return;
    
    const days = parseInt(extendDays, 10);
    if (isNaN(days) || days < 1) {
      Alert.alert(t.common.error, 'Please enter a valid number of days');
      return;
    }
    
    setShowExtendModal(false);
    
    try {
      await extendDeadline(goal.id, days);
      Alert.alert(t.common.success, t.goalDetail.extendSuccess);
    } catch (error) {
      console.error('Failed to extend deadline:', error);
      Alert.alert(t.common.error, t.goalDetail.extendError);
    }
  }, [goal, extendDays, extendDeadline, t]);

  /**
   * Cancel extend deadline
   */
  const cancelExtendDeadline = useCallback(() => {
    setShowExtendModal(false);
    setExtendDays('7');
  }, []);

  /**
   * Handle save as template
   */
  const handleSaveAsTemplate = useCallback(() => {
    if (!goal) return;
    setTemplateName(goal.title);
    setShowSaveTemplateModal(true);
  }, [goal]);

  /**
   * Confirm save as template
   */
  const confirmSaveTemplate = useCallback(async () => {
    if (!goal) return;
    
    const name = templateName.trim();
    if (!name) {
      Alert.alert(t.common.error, t.validation.requiredField);
      return;
    }
    
    setShowSaveTemplateModal(false);
    
    try {
      const template = {
        id: `custom_${Date.now()}`,
        title: name,
        category: goal.category || 'other',
        description: goal.description || '',
        target: goal.target,
        unit: goal.unit,
        direction: goal.direction,
        points: goal.points,
        period: goal.period,
        icon: goal.icon || '🎯',
      };
      
      await customTemplatesStorage.addCustomTemplate(template);
      Alert.alert(t.common.success, t.goalDetail.templateSaveSuccess);
      setTemplateName('');
    } catch (error) {
      console.error('Failed to save template:', error);
      Alert.alert(t.common.error, t.goalDetail.templateSaveError);
    }
  }, [goal, templateName, t]);

  /**
   * Cancel save template
   */
  const cancelSaveTemplate = useCallback(() => {
    setShowSaveTemplateModal(false);
    setTemplateName('');
  }, []);

  /**
   * Handle add note
   */
  const handleAddNote = useCallback(() => {
    setNoteText('');
    setShowAddNoteModal(true);
  }, []);

  /**
   * Confirm add note
   */
  const confirmAddNote = useCallback(async () => {
    if (!goal) return;
    
    const text = noteText.trim();
    if (!text) {
      Alert.alert(t.common.error, t.validation.requiredField);
      return;
    }
    
    setShowAddNoteModal(false);
    
    try {
      await addNote(goal.id, text);
      Alert.alert(t.common.success, t.goalDetail.noteSaved);
      setNoteText('');
    } catch (error) {
      console.error('Failed to add note:', error);
      Alert.alert(t.common.error, 'Failed to save note');
    }
  }, [goal, noteText, addNote, t]);

  /**
   * Cancel add note
   */
  const cancelAddNote = useCallback(() => {
    setShowAddNoteModal(false);
    setNoteText('');
  }, []);

  /**
   * Handle delete note
   */
  const handleDeleteNote = useCallback((noteId: string) => {
    setNoteToDelete(noteId);
    setShowDeleteNoteModal(true);
  }, []);

  /**
   * Confirm delete note
   */
  const confirmDeleteNote = useCallback(async () => {
    if (!goal || !noteToDelete) return;
    
    setShowDeleteNoteModal(false);
    
    try {
      await deleteNote(goal.id, noteToDelete);
      setNoteToDelete(null);
    } catch (error) {
      console.error('Failed to delete note:', error);
      Alert.alert(t.common.error, 'Failed to delete note');
    }
  }, [goal, noteToDelete, deleteNote, t]);

  /**
   * Cancel delete note
   */
  const cancelDeleteNote = useCallback(() => {
    setShowDeleteNoteModal(false);
    setNoteToDelete(null);
  }, []);

  /**
   * Handle add dependencies
   */
  const handleAddDependencies = useCallback(() => {
    if (!goal) return;
    setSelectedDependencies(goal.dependsOn || []);
    setShowDependenciesModal(true);
  }, [goal]);

  /**
   * Toggle dependency selection
   */
  const toggleDependencySelection = useCallback((goalId: number) => {
    setSelectedDependencies((prev) => {
      if (prev.includes(goalId)) {
        return prev.filter((id) => id !== goalId);
      }
      return [...prev, goalId];
    });
  }, []);

  /**
   * Confirm dependencies selection
   */
  const confirmDependencies = useCallback(async () => {
    if (!goal) return;
    
    setShowDependenciesModal(false);
    
    try {
      // Remove dependencies that are no longer selected
      const currentDeps = goal.dependsOn || [];
      for (const depId of currentDeps) {
        if (!selectedDependencies.includes(depId)) {
          await removeDependency(goal.id, depId);
        }
      }
      
      // Add new dependencies
      for (const depId of selectedDependencies) {
        if (!currentDeps.includes(depId)) {
          await addDependency(goal.id, depId);
        }
      }
    } catch (error) {
      console.error('Failed to update dependencies:', error);
      Alert.alert(t.common.error, 'Failed to update dependencies');
    }
  }, [goal, selectedDependencies, addDependency, removeDependency, t]);

  /**
   * Cancel dependencies selection
   */
  const cancelDependencies = useCallback(() => {
    setShowDependenciesModal(false);
    setSelectedDependencies([]);
  }, []);

  /**
   * Remove single dependency
   */
  const handleRemoveDependency = useCallback(async (depId: number) => {
    if (!goal) return;
    
    try {
      await removeDependency(goal.id, depId);
    } catch (error) {
      console.error('Failed to remove dependency:', error);
      Alert.alert(t.common.error, 'Failed to remove dependency');
    }
  }, [goal, removeDependency, t]);

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
    isRecurring?: boolean,
    description?: string,
    icon?: string,
    linkedRewardId?: number,
    subgoalsAwardPoints?: boolean
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
        isRecurring,
        description,
        icon
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
    isRecurring?: boolean,
    description?: string,
    icon?: string,
    linkedRewardId?: number,
    subgoalsAwardPoints?: boolean
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
   * Confirm and execute goal archiving
   */
  const confirmDelete = useCallback(async () => {
    if (!goal) return;
    
    setShowDeleteModal(false);
    
    try {
      await archiveGoal(goal.id);
      // Navigate back after successful archiving
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)/home');
      }
      Alert.alert(t.common.success, t.goalDetail.archiveSuccess);
    } catch (error) {
      console.error('Failed to archive goal:', error);
      Alert.alert(t.common.error, t.goalDetail.archiveError);
    }
  }, [goal, archiveGoal, router, t]);

  /**
   * Cancel deletion
   */
  const cancelDelete = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  /**
   * Handle toggle pause
   */
  const handleTogglePause = useCallback(async () => {
    if (!goal) return;
    
    try {
      await togglePause(goal.id);
      Alert.alert(
        t.common.success, 
        goal.isPaused ? t.goalDetail.resumeSuccess : t.goalDetail.pauseSuccess
      );
    } catch (error) {
      console.error('Failed to toggle pause:', error);
      Alert.alert(t.common.error, t.goalDetail.pauseError);
    }
  }, [goal, togglePause, t]);

  /**
   * Handle reset recurring goal
   */
  const handleResetRecurringGoal = useCallback(async () => {
    if (!goal || !goal.isRecurring) return;
    
    Alert.alert(
      'Reset Recurring Goal',
      'Are you sure you want to reset this recurring goal? It will start a new period and your current progress will be recorded in history.',
      [
        {
          text: t.common.cancel,
          style: 'cancel',
        },
        {
          text: 'Reset Now',
          style: 'default',
          onPress: async () => {
            try {
              const { resetGoal, recordCompletion } = await import('@/src/utils/recurring-goals');
              const goalWithHistory = recordCompletion(goal);
              const resetGoalData = resetGoal(goalWithHistory);
              
              // Update the goal with reset data
              await editGoal(
                goal.id,
                resetGoalData.title,
                resetGoalData.target,
                resetGoalData.current,
                resetGoalData.unit,
                resetGoalData.direction,
                resetGoalData.points,
                resetGoalData.period,
                resetGoalData.customPeriodDays,
                resetGoalData.isUltimate,
                resetGoalData.isRecurring,
                resetGoalData.description,
                resetGoalData.icon
              );
              
              Alert.alert(t.common.success, 'Recurring goal has been reset to a new period!');
            } catch (error) {
              console.error('Failed to reset recurring goal:', error);
              Alert.alert(t.common.error, 'Failed to reset recurring goal');
            }
          },
        },
      ]
    );
  }, [goal, editGoal, t]);

  /**
   * Check notification permissions on mount
   */
  useEffect(() => {
    const checkPermissions = async () => {
      const { checkNotificationPermissions } = await import('@/src/utils/notifications');
      const hasPermission = await checkNotificationPermissions();
      setHasNotificationPermission(hasPermission);
    };
    checkPermissions();
  }, []);

  /**
   * Handle enable notifications toggle
   */
  const handleToggleNotifications = useCallback(async () => {
    if (!goal) return;

    if (!notificationsEnabled && !hasNotificationPermission) {
      // Request permissions first
      const { requestNotificationPermissions } = await import('@/src/utils/notifications');
      const granted = await requestNotificationPermissions();
      setHasNotificationPermission(granted);
      
      if (!granted) {
        Alert.alert(
          t.notifications.permissionsDenied,
          t.notifications.permissionsDescription
        );
        return;
      }
    }

    const newEnabled = !notificationsEnabled;
    setNotificationsEnabled(newEnabled);

    if (newEnabled) {
      // Set default values if none exist
      if (selectedDays.length === 0) {
        setSelectedDays([1, 2, 3, 4, 5]); // Weekdays by default
      }
    }
  }, [goal, notificationsEnabled, hasNotificationPermission, selectedDays, t]);

  /**
   * Handle notification time change
   */
  const handleTimeChange = useCallback((hours: number, minutes: number) => {
    const timeInMinutes = hours * 60 + minutes;
    setNotificationTime(timeInMinutes);
  }, []);

  /**
   * Handle day selection toggle
   */
  const handleDayToggle = useCallback((dayIndex: number) => {
    setSelectedDays(prev => {
      if (prev.includes(dayIndex)) {
        return prev.filter(d => d !== dayIndex);
      } else {
        return [...prev, dayIndex].sort();
      }
    });
  }, []);

  /**
   * Save notification settings
   */
  const handleSaveNotificationSettings = useCallback(async () => {
    if (!goal) return;

    try {
      const { updateNotificationSettings } = useGoals();
      await updateNotificationSettings(
        goal.id,
        notificationsEnabled,
        notificationTime,
        selectedDays
      );
      Alert.alert(t.common.success, t.notifications.scheduleSuccess);
      setShowNotificationSettings(false);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      Alert.alert(t.common.error, t.notifications.scheduleError);
    }
  }, [goal, notificationsEnabled, notificationTime, selectedDays, t]);

  /**
   * Test notification
   */
  const handleTestNotification = useCallback(async () => {
    try {
      const { scheduleTestNotification } = await import('@/src/utils/notifications');
      await scheduleTestNotification();
      Alert.alert(t.common.success, t.notifications.testNotificationSent);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      Alert.alert(t.common.error, t.notifications.testNotificationError);
    }
  }, [t]);

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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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
            isCompleted={goal.isComplete}
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
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
          {goal.isPaused && (
            <View style={[styles.ultimateBadge, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.ultimateBadgeText}>⏸️ Paused</Text>
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
          {goal.points > 0 && (
            <Text style={[styles.points, { color: theme.colors.primary }]}>
              🎯 {goal.points} {t.goalCard.points}
              {goal.isRecurring && goal.completionHistory && goal.completionHistory.length > 0 && (
                <Text style={{ fontSize: 14 }}> × {goal.completionHistory.length + (goal.isComplete ? 1 : 0)} completions</Text>
              )}
            </Text>
          )}
          
          {/* Time Remaining Display */}
          {!goal.isComplete && goal.periodStartDate && (() => {
            const timeRemainingData = calculateTimeRemaining(
              goal.periodStartDate,
              goal.period,
              goal.customPeriodDays,
              goal.isRecurring
            );
            const timeRemainingText = formatTimeRemaining(
              timeRemainingData,
              t.time,
              goal.isRecurring
            );
            const endDateTime = formatEndDateTime(
              goal.periodStartDate,
              goal.period,
              goal.customPeriodDays,
              language
            );
            
            return !timeRemainingData.isExpired && (
              <View style={styles.timeRemainingBadge}>
                <Text style={[styles.timeRemainingBadgeText, { color: theme.colors.text }]}>
                  ⏱️ {timeRemainingText}
                </Text>
                {endDateTime && (
                  <Text style={[styles.timeRemainingEndDate, { color: theme.colors.textSecondary }]}>
                    {t.time.endsAt}: {endDateTime}
                  </Text>
                )}
              </View>
            );
          })()}
        </View>

        {/* Expired Warning */}
        {isGoalExpired && !goal.isComplete && (
          <View style={[styles.expiredWarning, { backgroundColor: theme.colors.danger + '15', borderColor: theme.colors.danger }]}>
            <View style={styles.expiredWarningContent}>
              <Ionicons name="warning" size={20} color={theme.colors.danger} />
              <Text style={[styles.expiredWarningText, { color: theme.colors.danger }]}>
                {t.time.expired}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.extendButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleExtendDeadline}
              activeOpacity={0.8}
            >
              <Ionicons name="time-outline" size={18} color="#FFF" />
              <Text style={styles.extendButtonText}>{t.goalDetail.extendDeadline}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {!isGoalExpired && (
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
        )}

        {/* Pause/Resume Button */}
        {!goal.isComplete && !isGoalExpired && (
          <TouchableOpacity
            style={[styles.pauseButton, { 
              backgroundColor: goal.isPaused ? '#22c55e' : '#f59e0b',
              ...theme.shadows.small 
            }]}
            onPress={handleTogglePause}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={goal.isPaused ? "play" : "pause"} 
              size={20} 
              color="#FFF" 
            />
            <Text style={styles.buttonText}>
              {goal.isPaused ? t.goalDetail.resumeGoal : t.goalDetail.pauseGoal}
            </Text>
          </TouchableOpacity>
        )}

        {/* Reset Recurring Goal Button */}
        {!goal.isComplete && !isGoalExpired && goal.isRecurring && (
          <TouchableOpacity
            style={[styles.pauseButton, { 
              backgroundColor: '#8b5cf6',
              ...theme.shadows.small 
            }]}
            onPress={handleResetRecurringGoal}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color="#FFF" 
            />
            <Text style={styles.buttonText}>
              Reset Now
            </Text>
          </TouchableOpacity>
        )}

        {/* Slider Progress Update - Hidden for ultimate goals (progress from subgoals) and blocked goals */}
        {!goal.isComplete && !goal.isUltimate && !isGoalExpired && !isBlocked && (
          <View style={cardStyle}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t.goalDetail.updateProgress}
            </Text>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              {t.goalDetail.useSlider}
            </Text>
            
            {/* Quick Adjust Buttons */}
            <View style={styles.quickAdjustContainer}>
              <Text style={[styles.quickAdjustLabel, { color: theme.colors.textSecondary }]}>
                {t.goalDetail.quickAdjust}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jumpButtonsScrollContent}>
                <TouchableOpacity
                  style={[styles.jumpButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleJump(-50)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jumpButtonText}>-50</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.jumpButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleJump(-10)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jumpButtonText}>-10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.jumpButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleJump(-5)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jumpButtonText}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.jumpButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleJump(5)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jumpButtonText}>+5</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.jumpButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleJump(10)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jumpButtonText}>+10</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.jumpButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handleJump(50)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jumpButtonText}>+50</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.sliderContainer}>
              <Text style={[styles.sliderValue, { color: theme.colors.text }]}>
                {formatNumber(Math.round(sliderValue), language)} {goal.unit}
              </Text>
              <View style={styles.sliderWithButtons}>
                <TouchableOpacity
                  style={[styles.incrementButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleDecrement}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove" size={24} color="#FFF" />
                </TouchableOpacity>
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
                  step={1}
                />
                <TouchableOpacity
                  style={[styles.incrementButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleIncrement}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.sliderLabels}>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  {formatNumber(goal.direction === 'decrease' ? goal.target : (goal.initialValue || 0), language)}
                </Text>
                <Text style={[styles.sliderLabel, { color: theme.colors.textSecondary }]}>
                  {formatNumber(goal.direction === 'decrease' ? (goal.initialValue || goal.target * 2) : goal.target, language)}
                </Text>
              </View>
            </View>

            {/* Manual Input */}
            <View style={styles.manualInputContainer}>
              <Text style={[styles.quickAdjustLabel, { color: theme.colors.textSecondary }]}>
                {t.goalDetail.orEnterValue}
              </Text>
              <View style={styles.manualInputRow}>
                <TextInput
                  style={[inputStyle, { flex: 1 }]}
                  value={newProgress}
                  onChangeText={setNewProgress}
                  keyboardType="decimal-pad"
                  placeholder={goal.unit}
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
          </View>
        )}

        {/* Subgoals Section - Only for Ultimate Goals */}
        {goal.isUltimate && (
          <View style={cardStyle}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t.goalDetail.subgoalsTitle} ({subgoals.length})
              </Text>
              {!isGoalExpired && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleAddSubgoal}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
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

        {/* Notes & Journal Section */}
        <View style={cardStyle}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t.goalDetail.notesTitle}
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddNote}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          
          {!goal.notes || goal.notes.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t.goalDetail.noNotes}
            </Text>
          ) : (
            <View style={styles.notesList}>
              {goal.notes.map((note) => {
                const noteDate = new Date(note.createdAt);
                const formattedDate = noteDate.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                
                return (
                  <View key={note.id} style={[styles.noteItem, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.noteHeader}>
                      <Text style={[styles.noteDate, { color: theme.colors.textSecondary }]}>
                        {formattedDate}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNote(note.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.noteText, { color: theme.colors.text }]}>
                      {note.text}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Dependencies Section */}
        <View style={cardStyle}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {t.goalDetail.dependenciesTitle}
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleAddDependencies}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Show blocked warning if dependencies not met */}
          {isBlocked && (
            <View style={[styles.blockedBanner, { backgroundColor: '#fef3c7' }]}>
              <Text style={[styles.blockedText, { color: '#92400e' }]}>
                {t.goalDetail.blockedByDependencies}
              </Text>
            </View>
          )}
          
          {!goal.dependsOn || goal.dependsOn.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t.goalDetail.noDependencies}
            </Text>
          ) : (
            <View style={styles.dependenciesList}>
              {goal.dependsOn.map((depId) => {
                const depGoal = goals.find((g) => g.id === depId);
                if (!depGoal) return null;
                
                const isComplete = depGoal.isComplete === true;
                
                return (
                  <View key={depId} style={[styles.dependencyItem, { backgroundColor: theme.colors.background }]}>
                    <View style={styles.dependencyInfo}>
                      <Text style={[styles.dependencyIcon, { fontSize: 24 }]}>
                        {depGoal.icon || '🎯'}
                      </Text>
                      <View style={styles.dependencyDetails}>
                        <Text style={[styles.dependencyTitle, { color: theme.colors.text }]}>
                          {depGoal.title}
                        </Text>
                        <Text style={[styles.dependencyStatus, { 
                          color: isComplete ? '#10b981' : theme.colors.textSecondary 
                        }]}>
                          {isComplete ? t.goalDetail.dependencyCompleted : t.goalDetail.dependencyIncomplete}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveDependency(depId)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={24} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Notifications Section */}
        <View style={cardStyle}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🔔 {t.notifications.title}
            </Text>
            <TouchableOpacity
              onPress={handleToggleNotifications}
              style={{
                backgroundColor: notificationsEnabled ? theme.colors.primary : theme.colors.border,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
              }}
            >
              <Text style={{ color: notificationsEnabled ? '#FFF' : theme.colors.text, fontWeight: '600', fontSize: 12 }}>
                {notificationsEnabled ? t.notifications.enabled : t.notifications.disabled}
              </Text>
            </TouchableOpacity>
          </View>

          {!notificationsEnabled ? (
            <View>
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
                {t.notifications.permissionsDescription}
              </Text>
              <TouchableOpacity
                style={[styles.updateButton, { 
                  backgroundColor: theme.colors.primary,
                  flexDirection: 'row',
                  gap: 8,
                  padding: 14,
                  width: '100%',
                }]}
                onPress={async () => {
                  const { requestNotificationPermissions } = await import('@/src/utils/notifications');
                  const granted = await requestNotificationPermissions();
                  if (granted) {
                    setNotificationsEnabled(true);
                    Alert.alert(t.common.success, t.notifications.permissionsGranted);
                  } else {
                    Alert.alert(t.common.error, t.notifications.permissionsDenied);
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '600' }}>
                  {t.notifications.enablePermissions}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 16 }}>
              {/* Time Picker */}
              <View>
                <Text style={[styles.noteDate, { color: theme.colors.text, marginBottom: 8 }]}>
                  {t.notifications.time}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput
                    style={[styles.noteInput, { 
                      flex: 1,
                      minHeight: 48,
                      textAlign: 'center',
                      fontSize: 18,
                      fontWeight: '600',
                      borderColor: theme.colors.border,
                      color: theme.colors.text,
                      backgroundColor: theme.colors.background
                    }]}
                    value={`${Math.floor(notificationTime / 60).toString().padStart(2, '0')}:${(notificationTime % 60).toString().padStart(2, '0')}`}
                    editable={false}
                  />
                </View>
                <Text style={[styles.notYetHint, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                  {t.notifications.selectTime}
                </Text>
              </View>

              {/* Days Selection */}
              <View>
                <Text style={[styles.noteDate, { color: theme.colors.text, marginBottom: 8 }]}>
                  {t.notifications.days}
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
                    const isSelected = selectedDays.includes(dayIndex);
                    const dayName = t.notifications.dayNamesShort[
                      ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayIndex] as keyof typeof t.notifications.dayNamesShort
                    ];
                    
                    return (
                      <TouchableOpacity
                        key={dayIndex}
                        onPress={() => handleDayToggle(dayIndex)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 20,
                          backgroundColor: isSelected ? theme.colors.primary : theme.colors.background,
                          borderWidth: 1,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        }}
                      >
                        <Text style={{ 
                          color: isSelected ? '#FFF' : theme.colors.text, 
                          fontWeight: '600',
                          fontSize: 14,
                        }}>
                          {dayName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: theme.colors.primary, padding: 14 }]}
                onPress={handleSaveNotificationSettings}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={{ color: '#FFF', fontWeight: '600', marginLeft: 8 }}>
                  {t.common.save}
                </Text>
              </TouchableOpacity>

              {/* Test Notification Button */}
              <TouchableOpacity
                style={[styles.updateButton, { 
                  backgroundColor: theme.colors.background,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  padding: 14 
                }]}
                onPress={handleTestNotification}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={20} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.text, fontWeight: '600', marginLeft: 8 }}>
                  {t.notifications.testNotification}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Save as Template Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSaveAsTemplate}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Save as template"
        >
          <Ionicons name="bookmark-outline" size={20} color="#FFF" />
          <Text style={styles.buttonText}>{t.goalDetail.saveAsTemplate}</Text>
        </TouchableOpacity>

        {/* Archive Button */}
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: '#f59e0b' }]}
          onPress={handleDelete}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Archive goal"
          testID="archive-goal-button"
        >
          <Ionicons name="archive-outline" size={20} color="#FFF" />
          <Text style={styles.buttonText}>{t.goalDetail.archiveGoal}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteModal}
        title={t.goalDetail.archiveConfirmTitle}
        message={t.goalDetail.archiveConfirmMessage}
        confirmText={t.goalDetail.archiveGoal}
        cancelText={t.common.cancel}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmStyle="default"
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

      {/* Extend Deadline Modal */}
      <Modal
        visible={showExtendModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelExtendDeadline}
      >
        <Pressable style={styles.modalOverlay} onPress={cancelExtendDeadline}>
          <Pressable style={[styles.modal100, { backgroundColor: theme.colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modal100Title, { color: theme.colors.text }]}>
              ⏰ {t.goalDetail.extendDeadlineTitle}
            </Text>
            <Text style={[styles.modal100Message, { color: theme.colors.textSecondary }]}>
              {t.goalDetail.extendDeadlineMessage}
            </Text>
            <TextInput
              style={[styles.extendInput, { 
                borderColor: theme.colors.border, 
                color: theme.colors.text,
                backgroundColor: theme.colors.background 
              }]}
              value={extendDays}
              onChangeText={setExtendDays}
              keyboardType="number-pad"
              placeholder="7"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <View style={styles.modal100Buttons}>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.primary }]}
                onPress={confirmExtendDeadline}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.modal100ButtonText}>{t.common.save}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.border }]}
                onPress={cancelExtendDeadline}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.text} />
                <Text style={[styles.modal100ButtonText, { color: theme.colors.text }]}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 100% Completion Modal */}
      <Modal
        visible={show100PercentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShow100PercentModal(false);
          setNotYetValue('');
        }}
      >
        <Pressable style={styles.modalOverlay} onPress={() => { setShow100PercentModal(false); setNotYetValue(''); }}>
          <Pressable style={[styles.modal100, { backgroundColor: theme.colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modal100Title, { color: theme.colors.text }]}>
              🎉 {t.goalDetail.complete100Title}
            </Text>
            <Text style={[styles.modal100Message, { color: theme.colors.textSecondary }]}>
              {t.goalDetail.complete100Message}
            </Text>
            
            {/* Optional value adjustment input */}
            <View style={styles.notYetSection}>
              <Text style={[styles.notYetLabel, { color: theme.colors.text }]}>
                {t.goalDetail.notYetLabel}
              </Text>
              <TextInput
                style={[styles.notYetInput, { 
                  borderColor: theme.colors.border, 
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background 
                }]}
                value={notYetValue}
                onChangeText={setNotYetValue}
                keyboardType="numeric"
                placeholder={t.goalDetail.notYetPlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
              />
              <Text style={[styles.notYetHint, { color: theme.colors.textSecondary }]}>
                {t.goalDetail.notYetHint}
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.modal100Buttons}>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.border }]}
                onPress={handle100PercentCancel}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.text} />
                <Text style={[styles.modal100ButtonText, { color: theme.colors.text }]}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.primary }]}
                onPress={handle100PercentSave}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.modal100ButtonText}>{t.common.save}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Save as Template Modal */}
      <Modal
        visible={showSaveTemplateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelSaveTemplate}
      >
        <Pressable style={styles.modalOverlay} onPress={cancelSaveTemplate}>
          <Pressable style={[styles.modal100, { backgroundColor: theme.colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modal100Title, { color: theme.colors.text }]}>
              📋 {t.goalDetail.saveAsTemplateTitle}
            </Text>
            <Text style={[styles.modal100Message, { color: theme.colors.textSecondary }]}>
              {t.goalDetail.saveAsTemplateMessage}
            </Text>
            
            <View style={styles.notYetSection}>
              <TextInput
                style={[styles.notYetInput, { 
                  borderColor: theme.colors.border, 
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background 
                }]}
                value={templateName}
                onChangeText={setTemplateName}
                placeholder={t.goalDetail.templateNamePlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                autoFocus
              />
            </View>

            <View style={styles.modal100Buttons}>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.border }]}
                onPress={cancelSaveTemplate}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.text} />
                <Text style={[styles.modal100ButtonText, { color: theme.colors.text }]}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.primary }]}
                onPress={confirmSaveTemplate}
                activeOpacity={0.8}
              >
                <Ionicons name="bookmark" size={20} color="#FFF" />
                <Text style={styles.modal100ButtonText}>{t.common.save}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        visible={showAddNoteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelAddNote}
      >
        <Pressable style={styles.modalOverlay} onPress={cancelAddNote}>
          <Pressable style={[styles.modal100, { backgroundColor: theme.colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modal100Title, { color: theme.colors.text }]}>
              📝 {t.goalDetail.addNote}
            </Text>
            
            <View style={styles.notYetSection}>
              <TextInput
                style={[styles.noteInput, { 
                  borderColor: theme.colors.border, 
                  color: theme.colors.text,
                  backgroundColor: theme.colors.background,
                  textAlign: isRTL ? 'right' : 'left',
                }]}
                value={noteText}
                onChangeText={setNoteText}
                placeholder={t.goalDetail.noteInputPlaceholder}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
                autoFocus
              />
            </View>

            <View style={styles.modal100Buttons}>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.border }]}
                onPress={cancelAddNote}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.text} />
                <Text style={[styles.modal100ButtonText, { color: theme.colors.text }]}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.primary }]}
                onPress={confirmAddNote}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.modal100ButtonText}>{t.common.save}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Note Confirmation Modal */}
      <ConfirmationModal
        visible={showDeleteNoteModal}
        title={t.goalDetail.deleteNote}
        message={t.goalDetail.deleteNoteConfirm}
        confirmText={t.common.delete}
        cancelText={t.common.cancel}
        onConfirm={confirmDeleteNote}
        onCancel={cancelDeleteNote}
        confirmStyle="destructive"
      />

      {/* Select Dependencies Modal */}
      <Modal
        visible={showDependenciesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDependencies}
      >
        <Pressable style={styles.modalOverlay} onPress={cancelDependencies}>
          <Pressable style={[styles.dependenciesModal, { backgroundColor: theme.colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modal100Title, { color: theme.colors.text }]}>
              🔗 {t.goalDetail.selectDependencies}
            </Text>
            <Text style={[styles.modal100Message, { color: theme.colors.textSecondary }]}>
              {t.goalDetail.dependencyDescription}
            </Text>
            
            <ScrollView style={styles.dependenciesScrollView}>
              {availableGoalsForDependencies.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 20 }]}>
                  No available goals to add as dependencies
                </Text>
              ) : (
                availableGoalsForDependencies.map((g) => (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.dependencySelectItem, { 
                      backgroundColor: selectedDependencies.includes(g.id) ? theme.colors.primary + '20' : theme.colors.background,
                      borderColor: selectedDependencies.includes(g.id) ? theme.colors.primary : theme.colors.border,
                    }]}
                    onPress={() => toggleDependencySelection(g.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dependencySelectInfo}>
                      <Text style={{ fontSize: 24, marginRight: 12 }}>{g.icon || '🎯'}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.dependencyTitle, { color: theme.colors.text }]}>
                          {g.title}
                        </Text>
                        <Text style={[styles.dependencyStatus, { color: theme.colors.textSecondary }]}>
                          {Math.round(g.progress)}% • {g.points} pts
                        </Text>
                      </View>
                    </View>
                    {selectedDependencies.includes(g.id) && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View style={styles.modal100Buttons}>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.border }]}
                onPress={cancelDependencies}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.text} />
                <Text style={[styles.modal100ButtonText, { color: theme.colors.text }]}>
                  {t.common.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modal100Button, { backgroundColor: theme.colors.primary }]}
                onPress={confirmDependencies}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                <Text style={styles.modal100ButtonText}>{t.common.save}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  pauseButton: {
    flexDirection: 'row',
    gap: 8,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  sliderWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  incrementButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    flex: 1,
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
  quickAdjustContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  quickAdjustLabel: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '500',
  },
  jumpButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  jumpButtonsScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  jumpButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  jumpButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  manualInputContainer: {
    marginTop: 20,
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
    marginTop: 12,
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
  expiredWarning: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 20,
    gap: 12,
  },
  expiredWarningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiredWarningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  extendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 12,
    borderRadius: 8,
  },
  extendButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal100: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modal100Title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modal100Message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  extendInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modal100Buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modal100Button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  modal100ButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notYetSection: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  notYetLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  notYetInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  notYetHint: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timeRemainingBadge: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  timeRemainingBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeRemainingEndDate: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  notesList: {
    gap: 12,
  },
  noteItem: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  blockedBanner: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  blockedText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dependenciesList: {
    gap: 12,
  },
  dependencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  dependencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  dependencyIcon: {
    fontSize: 24,
  },
  dependencyDetails: {
    flex: 1,
  },
  dependencyTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  dependencyStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  dependenciesModal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dependenciesScrollView: {
    maxHeight: 400,
    marginVertical: 16,
  },
  dependencySelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 8,
  },
  dependencySelectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
});

