/**
 * AddGoalForm component
 * Form for creating new goals with validation
 */

import { DEFAULT_GOAL_ICON, GOAL_REWARD_ICONS } from '@/src/constants/icons';
import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { GoalDirection, GoalTemplate, TimePeriod } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import ConfirmationModal from './ConfirmationModal';

interface AddGoalFormProps {
  onAddGoal: (
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
    icon?: string
  ) => void;
  parentId?: number; // If set, this is a subgoal form
  parentTitle?: string; // Parent goal title for display
  editMode?: boolean; // If true, this is editing an existing goal
  templateData?: GoalTemplate | null; // Template to pre-fill form
  onClearTemplate?: () => void; // Clear template after applying
  initialValues?: {
    title: string;
    description?: string;
    target: number;
    current: number;
    unit: string;
    direction: GoalDirection;
    points: number;
    period: TimePeriod;
    customPeriodDays?: number;
    isUltimate?: boolean;
    isRecurring?: boolean;
    icon?: string;
  };
}

/**
 * Form component for adding new goals
 */
export default function AddGoalForm({ onAddGoal, parentId, parentTitle, editMode = false, templateData, onClearTemplate, initialValues }: AddGoalFormProps) {
  const { theme } = useTheme();
  const { t, isRTL } = useLanguage();
  
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const [target, setTarget] = useState(initialValues?.target.toString() || '');
  const [current, setCurrent] = useState(initialValues?.current.toString() || '');
  const [unit, setUnit] = useState(initialValues?.unit || '');
  const [points, setPoints] = useState(initialValues?.points.toString() || '');
  const [direction, setDirection] = useState<GoalDirection>(initialValues?.direction || 'increase');
  const [period, setPeriod] = useState<TimePeriod>(initialValues?.period || 'custom');
  const [customPeriodDays, setCustomPeriodDays] = useState(initialValues?.customPeriodDays?.toString() || '');
  const [isUltimate, setIsUltimate] = useState(initialValues?.isUltimate || false);
  const [isRecurring, setIsRecurring] = useState(initialValues?.isRecurring || false);
  const [selectedIcon, setSelectedIcon] = useState(initialValues?.icon || DEFAULT_GOAL_ICON);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [open, setOpen] = useState(false);
  const [periodOpen, setPeriodOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingGoalData, setPendingGoalData] = useState<any>(null);

  // Apply template data when it changes
  useEffect(() => {
    if (templateData) {
      setTitle(templateData.title);
      setDescription(templateData.description || '');
      setTarget(templateData.target.toString());
      setCurrent('0');
      setUnit(templateData.unit);
      setPoints(templateData.points.toString());
      setDirection(templateData.direction);
      setPeriod(templateData.period);
      setCustomPeriodDays('');
      setIsUltimate(false);
      setIsRecurring(false);
      // Set icon from template
      if (templateData.icon) {
        setSelectedIcon(templateData.icon);
      }
      setErrors({});
      
      // Clear template after applying
      if (onClearTemplate) {
        onClearTemplate();
      }
    }
  }, [templateData?.id, templateData?.icon, onClearTemplate]);

  // Dropdown items
  const directionItems = useMemo(
    () => [
      { label: t.goalForm.directionIncrease, value: 'increase' as const },
      { label: t.goalForm.directionDecrease, value: 'decrease' as const },
    ],
    [t]
  );
  
  const periodItems = useMemo(
    () => [
      { label: t.goalForm.periodDaily, value: 'daily' as const },
      { label: t.goalForm.periodWeekly, value: 'weekly' as const },
      { label: t.goalForm.periodMonthly, value: 'monthly' as const },
      { label: t.goalForm.periodYearly, value: 'yearly' as const },
      { label: t.goalForm.periodCustom, value: 'custom' as const },
    ],
    [t]
  );

  /**
   * Reset form fields
   */
  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setTarget('');
    setCurrent('');
    setUnit('');
    setPoints('');
    setDirection('increase');
    setPeriod('custom');
    setCustomPeriodDays('');
    setIsUltimate(false);
    setIsRecurring(false);
    setSelectedIcon(DEFAULT_GOAL_ICON);
    setErrors({});
    setShowConfirmModal(false);
    setPendingGoalData(null);
  }, []);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(() => {
    // Validate empty strings first
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = t.validation.titleRequired;
    }
    
    // Skip target/current/unit validation for ultimate goals
    if (!isUltimate) {
      if (!target.trim()) {
        newErrors.target = t.validation.targetRequired;
      } else if (isNaN(parseFloat(target)) || parseFloat(target) <= 0) {
        newErrors.target = t.validation.targetPositive;
      }
      
      if (!current.trim()) {
        newErrors.current = t.validation.currentRequired;
      } else if (isNaN(parseFloat(current)) || parseFloat(current) < 0) {
        newErrors.current = t.validation.currentValid;
      }
      
      if (!unit.trim()) {
        newErrors.unit = t.validation.unitRequired;
      }
    }
    
    if (!points.trim()) {
      newErrors.points = t.validation.pointsRequired;
    } else if (isNaN(parseFloat(points)) || parseFloat(points) < 0) {
      newErrors.points = t.validation.pointsValid;
    }
    
    if (period === 'custom' && !customPeriodDays.trim()) {
      newErrors.customPeriodDays = 'Custom period days is required';
    } else if (period === 'custom' && (isNaN(parseFloat(customPeriodDays)) || parseFloat(customPeriodDays) <= 0)) {
      newErrors.customPeriodDays = 'Custom period must be a positive number';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const formData = {
      title: title.trim(),
      description: description.trim() || undefined,
      // Use defaults for ultimate goals (progress calculated from subgoals)
      target: isUltimate ? 100 : parseFloat(target),
      current: isUltimate ? 0 : parseFloat(current),
      unit: isUltimate ? 'subgoals' : unit.trim(),
      direction,
      points: parseFloat(points),
      period,
      customPeriodDays: period === 'custom' ? parseFloat(customPeriodDays) : undefined,
      parentId,
      isUltimate,
      isRecurring,
      icon: selectedIcon,
    };

    // Clear errors and show confirmation
    setErrors({});
    setPendingGoalData(formData);
    setShowConfirmModal(true);
  }, [title, description, target, current, unit, direction, points, period, customPeriodDays, parentId, isUltimate, isRecurring, t]);

  /**
   * Confirm and add goal
   */
  const confirmAddGoal = useCallback(() => {
    if (!pendingGoalData) return;

    onAddGoal(
      pendingGoalData.title,
      pendingGoalData.target,
      pendingGoalData.current,
      pendingGoalData.unit,
      pendingGoalData.direction,
      pendingGoalData.points,
      pendingGoalData.period,
      pendingGoalData.customPeriodDays,
      pendingGoalData.parentId,
      pendingGoalData.isUltimate,
      pendingGoalData.isRecurring,
      pendingGoalData.description,
      pendingGoalData.icon
    );

    resetForm();
  }, [pendingGoalData, onAddGoal, resetForm]);

  /**
   * Cancel adding goal
   */
  const cancelAddGoal = useCallback(() => {
    setShowConfirmModal(false);
    setPendingGoalData(null);
  }, []);

  // Memoize styles
  const containerStyle = useMemo(
    () => [
      styles.container,
      {
        backgroundColor: theme.colors.card,
        ...theme.shadows.small,
      },
    ],
    [theme]
  );

  const inputStyle = useCallback(
    (fieldName?: string, isMultiline = false) => [
      styles.input,
      {
        borderColor: errors[fieldName || ''] ? theme.colors.danger : theme.colors.border,
        color: theme.colors.text,
        backgroundColor: theme.colors.background,
        textAlign: (isRTL ? 'right' : 'left') as 'left' | 'right',
        ...(isMultiline && styles.multilineInput),
      },
    ],
    [theme, isRTL, errors]
  );

  const labelStyle = useMemo(
    () => [
      styles.label,
      {
        color: theme.colors.text,
        textAlign: (isRTL ? 'right' : 'left') as 'left' | 'right',
      },
    ],
    [theme, isRTL]
  );

  const buttonStyle = useMemo(
    () => [styles.button, { backgroundColor: theme.colors.primary }],
    [theme]
  );

  /**
   * Render error message for a field
   */
  const renderError = (fieldName: string) => {
    if (!errors[fieldName]) return null;
    return (
      <Text style={[styles.errorText, { color: theme.colors.danger }]}>
        {errors[fieldName]}
      </Text>
    );
  };

  return (
    <View style={containerStyle}>
      <Text style={labelStyle}>{t.goalForm.title}</Text>

      {/* Icon Picker */}
      <Text style={[labelStyle, styles.sectionLabel]}>{t.rewards.icon}</Text>
      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
        onPress={() => setShowIconPicker(true)}
      >
        <Text style={styles.selectedIcon}>{selectedIcon}</Text>
      </TouchableOpacity>

      {/* Title Input */}
      <TextInput
        style={inputStyle('title')}
        placeholder={t.goalForm.titlePlaceholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          if (errors.title) {
            const newErrors = { ...errors };
            delete newErrors.title;
            setErrors(newErrors);
          }
        }}
        maxLength={100}
        accessibilityLabel={t.goalForm.titleLabel}
        accessibilityHint={t.goalForm.titleHint}
      />
      {renderError('title')}

      {/* Description Input (Optional) */}
      <Text style={[labelStyle, styles.sectionLabel]}>{t.goalForm.description}</Text>
      <TextInput
        style={inputStyle('description', true)}
        placeholder={t.goalForm.descriptionPlaceholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={description}
        onChangeText={setDescription}
        maxLength={200}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Ultimate Goal Checkbox (only if not a subgoal) - Moved to top */}
      {!parentId && (
        <Pressable
          style={styles.checkboxContainer}
          onPress={() => setIsUltimate(!isUltimate)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isUltimate }}
          accessibilityLabel={t.goalForm.ultimateGoal}
          accessibilityHint={t.goalForm.ultimateGoalHint}
        >
          <View style={[styles.checkbox, { borderColor: theme.colors.border }, isUltimate && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
            {isUltimate && (
              <Text style={styles.checkboxIcon}>✓</Text>
            )}
          </View>
          <View style={styles.checkboxTextContainer}>
            <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
              {t.goalForm.ultimateGoal}
            </Text>
            <Text style={[styles.checkboxHint, { color: theme.colors.textSecondary }]}>
              {t.goalForm.ultimateGoalHint}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Target/Current/Unit fields - Hidden for ultimate goals */}
      {!isUltimate && (
        <>
          {/* Target Input */}
          <TextInput
        style={inputStyle('target')}
        placeholder={t.goalForm.targetPlaceholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="decimal-pad"
        value={target}
        onChangeText={(text) => {
          setTarget(text);
          if (errors.target) {
            const newErrors = { ...errors };
            delete newErrors.target;
            setErrors(newErrors);
          }
        }}
        accessibilityLabel={t.goalForm.targetLabel}
        accessibilityHint={t.goalForm.targetHint}
      />
      {renderError('target')}

      {/* Current Input */}
      <TextInput
        style={inputStyle('current')}
        placeholder={t.goalForm.currentPlaceholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="decimal-pad"
        value={current}
        onChangeText={(text) => {
          setCurrent(text);
          if (errors.current) {
            const newErrors = { ...errors };
            delete newErrors.current;
            setErrors(newErrors);
          }
        }}
        accessibilityLabel={t.goalForm.currentLabel}
        accessibilityHint={t.goalForm.currentHint}
      />
      {renderError('current')}

      {/* Unit Input with Suggestions */}
      <Text style={[labelStyle, styles.sectionLabel]}>{t.goalForm.unit}</Text>
      <TextInput
        style={inputStyle('unit')}
        value={unit}
        onChangeText={(text) => {
          setUnit(text);
          if (errors.unit) {
            const newErrors = { ...errors };
            delete newErrors.unit;
            setErrors(newErrors);
          }
        }}
        placeholder={t.goalForm.unit}
        placeholderTextColor={theme.colors.textSecondary}
      />
      {renderError('unit')}
      
      {/* Unit Suggestions */}
      <View style={styles.suggestionsContainer}>
        {['kg', 'lb', 'km', 'mi', 'books', 'pages', 'hours', 'days', 'times', 'reps', 'calories', 'minutes', 'dollars'].map((suggestion) => (
          <Pressable
            key={suggestion}
            style={[styles.suggestionChip, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
            onPress={() => setUnit(t.units[suggestion as keyof typeof t.units])}
          >
            <Text style={[styles.suggestionText, { color: theme.colors.text }]}>{t.units[suggestion as keyof typeof t.units]}</Text>
          </Pressable>
        ))}
      </View>

          {/* Direction Dropdown */}
          <Text style={[labelStyle, styles.sectionLabel]}>{t.goalForm.direction}</Text>

          <View style={styles.dropdownContainer}>
        <DropDownPicker
          open={open}
          value={direction}
          items={directionItems}
          setOpen={setOpen}
          setValue={setDirection}
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          }}
          dropDownContainerStyle={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            zIndex: 20,
          }}
          textStyle={{
            color: theme.colors.text,
          }}
          listMode="SCROLLVIEW"
          onClose={() => setOpen(false)}
          closeOnBackPressed={true}
        />
          </View>
        </>
      )}

      {/* Time Period Dropdown */}
      <Text style={[labelStyle, styles.sectionLabel]}>{t.goalForm.period}</Text>

      <View style={styles.dropdownContainer}>
        <DropDownPicker
          open={periodOpen}
          value={period}
          items={periodItems}
          setOpen={setPeriodOpen}
          setValue={setPeriod}
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
          }}
          dropDownContainerStyle={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.border,
            zIndex: 10,
          }}
          textStyle={{
            color: theme.colors.text,
          }}
          listMode="SCROLLVIEW"
          onClose={() => setPeriodOpen(false)}
          closeOnBackPressed={true}
        />
      </View>

      {/* Custom Period Days Input (conditional) */}
      {period === 'custom' && (
        <>
          <Text style={[labelStyle, styles.sectionLabel]}>{t.goalForm.customPeriodDays}</Text>
          <TextInput
            style={inputStyle('customPeriodDays')}
            placeholder={t.goalForm.customPeriodPlaceholder}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="number-pad"
            value={customPeriodDays}
            onChangeText={(text) => {
              setCustomPeriodDays(text);
              if (errors.customPeriodDays) {
                const newErrors = { ...errors };
                delete newErrors.customPeriodDays;
                setErrors(newErrors);
              }
            }}
          />
          {renderError('customPeriodDays')}
        </>
      )}

      {/* Points Input */}
      <Text style={[labelStyle, styles.sectionLabel]}>{t.goalForm.points}</Text>
      
      <TextInput
        style={inputStyle('points')}
        placeholder={t.goalForm.pointsPlaceholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="number-pad"
        value={points}
        onChangeText={(text) => {
          setPoints(text);
          if (errors.points) {
            const newErrors = { ...errors };
            delete newErrors.points;
            setErrors(newErrors);
          }
        }}
        accessibilityLabel={t.goalForm.pointsLabel}
        accessibilityHint={t.goalForm.pointsHint}
      />
      {renderError('points')}

      {/* Recurring Goal Checkbox (only if not ultimate and not subgoal) */}
      {!parentId && !isUltimate && (
        <Pressable
          style={styles.checkboxContainer}
          onPress={() => setIsRecurring(!isRecurring)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isRecurring }}
          accessibilityLabel={t.goalForm.recurringGoal}
          accessibilityHint={t.goalForm.recurringGoalHint}
        >
          <View style={[styles.checkbox, { borderColor: theme.colors.border }, isRecurring && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }]}>
            {isRecurring && (
              <Text style={styles.checkboxIcon}>✓</Text>
            )}
          </View>
          <View style={styles.checkboxTextContainer}>
            <Text style={[styles.checkboxLabel, { color: theme.colors.text }]}>
              {t.goalForm.recurringGoal}
            </Text>
            <Text style={[styles.checkboxHint, { color: theme.colors.textSecondary }]}>
              {t.messages.automaticallyResets.replace('{period}', period !== 'custom' ? period : customPeriodDays + ' ' + t.messages.day)}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Submit Button */}
      <TouchableOpacity
        style={buttonStyle}
        onPress={handleSubmit}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={editMode ? t.goalForm.editButton : t.goalForm.addButton}
        accessibilityHint={t.goalForm.addButtonHint}
      >
        <Text style={styles.buttonText}>{editMode ? t.goalForm.editButton : t.goalForm.addButton}</Text>
      </TouchableOpacity>

      {/* Icon Picker Modal */}
      <Modal visible={showIconPicker} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.iconPickerContent, { backgroundColor: theme.colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{t.rewards.icon}</Text>
              <TouchableOpacity onPress={() => setShowIconPicker(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.iconScrollView}
              removeClippedSubviews={true}
            >
              <View style={styles.iconGrid}>
                {GOAL_REWARD_ICONS.map((icon, index) => (
                  <TouchableOpacity
                    key={`icon-${index}-${icon}`}
                    style={[
                      styles.iconOption,
                      { backgroundColor: theme.colors.background },
                      selectedIcon === icon && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
                    ]}
                    onPress={() => {
                      setSelectedIcon(icon);
                      setShowIconPicker(false);
                    }}
                  >
                    <Text style={styles.iconOptionText}>{icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        title={t.common.add + ' ' + t.home.addGoal}
        message={`${t.goalForm.titleLabel}: ${pendingGoalData?.title}\n${t.goalForm.targetLabel}: ${pendingGoalData?.target} ${pendingGoalData?.unit}\n${t.goalForm.points}: ${pendingGoalData?.points}`}
        confirmText={t.common.add}
        cancelText={t.common.cancel}
        onConfirm={confirmAddGoal}
        onCancel={cancelAddGoal}
        confirmStyle="default"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionLabel: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdownContainer: {
    zIndex: 10,
    marginBottom: 16,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9,
  },
  errorText: {
    color: '#FF4B4B',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxIcon: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  checkboxHint: {
    fontSize: 12,
    lineHeight: 18,
  },
  iconButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedIcon: {
    fontSize: 48,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iconPickerContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  iconScrollView: {
    maxHeight: 400,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 15,
  },
  iconOption: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionText: {
    fontSize: 32,
  },
});
