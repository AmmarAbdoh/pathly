/**
 * GoalSchedulePicker component
 * UI for selecting when a recurring goal should appear
 */

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { GoalSchedule } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface GoalSchedulePickerProps {
  schedule?: GoalSchedule;
  onScheduleChange: (schedule?: GoalSchedule) => void;
  isRecurring: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun', fullName: 'Sunday' },
  { value: 1, label: 'Mon', fullName: 'Monday' },
  { value: 2, label: 'Tue', fullName: 'Tuesday' },
  { value: 3, label: 'Wed', fullName: 'Wednesday' },
  { value: 4, label: 'Thu', fullName: 'Thursday' },
  { value: 5, label: 'Fri', fullName: 'Friday' },
  { value: 6, label: 'Sat', fullName: 'Saturday' },
];

export default function GoalSchedulePicker({ schedule, onScheduleChange, isRecurring }: GoalSchedulePickerProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [scheduleType, setScheduleType] = useState<'none' | 'weekly' | 'monthly-dates' | 'monthly-range'>(
    schedule?.daysOfWeek ? 'weekly' :
    schedule?.datesOfMonth ? 'monthly-dates' :
    schedule?.dateRangeStart !== undefined ? 'monthly-range' : 'none'
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(schedule?.daysOfWeek || []);
  const [selectedDates, setSelectedDates] = useState<number[]>(schedule?.datesOfMonth || []);
  const [rangeStart, setRangeStart] = useState(schedule?.dateRangeStart?.toString() || '');
  const [rangeEnd, setRangeEnd] = useState(schedule?.dateRangeEnd?.toString() || '');

  if (!isRecurring) {
    return null;
  }

  const handleDayToggle = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleDateToggle = (date: number) => {
    if (selectedDates.includes(date)) {
      setSelectedDates(selectedDates.filter(d => d !== date));
    } else {
      setSelectedDates([...selectedDates, date].sort((a, b) => a - b));
    }
  };

  const handleApply = () => {
    let newSchedule: GoalSchedule | undefined;

    if (scheduleType === 'none') {
      newSchedule = undefined;
    } else if (scheduleType === 'weekly') {
      if (selectedDays.length > 0) {
        newSchedule = { daysOfWeek: selectedDays };
      }
    } else if (scheduleType === 'monthly-dates') {
      if (selectedDates.length > 0) {
        newSchedule = { datesOfMonth: selectedDates };
      }
    } else if (scheduleType === 'monthly-range') {
      const start = parseInt(rangeStart);
      const end = parseInt(rangeEnd);
      if (!isNaN(start) && !isNaN(end) && start >= 1 && start <= 31 && end >= 1 && end <= 31 && start <= end) {
        newSchedule = { dateRangeStart: start, dateRangeEnd: end };
      }
    }

    onScheduleChange(newSchedule);
    setShowModal(false);
  };

  const getScheduleText = () => {
    if (!schedule) return 'Every day';
    
    if (schedule.daysOfWeek && schedule.daysOfWeek.length > 0) {
      const days = schedule.daysOfWeek.map(d => DAYS_OF_WEEK[d].label).join(', ');
      return `Every ${days}`;
    }
    
    if (schedule.datesOfMonth && schedule.datesOfMonth.length > 0) {
      const dates = schedule.datesOfMonth.join(', ');
      return `Monthly: day ${dates}`;
    }
    
    if (schedule.dateRangeStart !== undefined && schedule.dateRangeEnd !== undefined) {
      return `Monthly: days ${schedule.dateRangeStart}-${schedule.dateRangeEnd}`;
    }
    
    return 'Every day';
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.scheduleButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => setShowModal(true)}
      >
        <View style={styles.scheduleButtonContent}>
          <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.scheduleButtonText, { color: theme.colors.text }]}>
            {getScheduleText()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Schedule</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Schedule Type Selection */}
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: scheduleType === 'none' ? theme.colors.primary : theme.colors.card },
                  ]}
                  onPress={() => setScheduleType('none')}
                >
                  <Text style={[styles.typeButtonText, { color: scheduleType === 'none' ? '#fff' : theme.colors.text }]}>
                    Every Day
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: scheduleType === 'weekly' ? theme.colors.primary : theme.colors.card },
                  ]}
                  onPress={() => setScheduleType('weekly')}
                >
                  <Text style={[styles.typeButtonText, { color: scheduleType === 'weekly' ? '#fff' : theme.colors.text }]}>
                    Specific Days
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: scheduleType === 'monthly-dates' ? theme.colors.primary : theme.colors.card },
                  ]}
                  onPress={() => setScheduleType('monthly-dates')}
                >
                  <Text style={[styles.typeButtonText, { color: scheduleType === 'monthly-dates' ? '#fff' : theme.colors.text }]}>
                    Monthly Dates
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: scheduleType === 'monthly-range' ? theme.colors.primary : theme.colors.card },
                  ]}
                  onPress={() => setScheduleType('monthly-range')}
                >
                  <Text style={[styles.typeButtonText, { color: scheduleType === 'monthly-range' ? '#fff' : theme.colors.text }]}>
                    Date Range
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Weekly Schedule */}
              {scheduleType === 'weekly' && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Select days of the week:
                  </Text>
                  <View style={styles.daysGrid}>
                    {DAYS_OF_WEEK.map(day => (
                      <TouchableOpacity
                        key={day.value}
                        style={[
                          styles.dayButton,
                          {
                            backgroundColor: selectedDays.includes(day.value) ? theme.colors.primary : theme.colors.card,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        onPress={() => handleDayToggle(day.value)}
                      >
                        <Text
                          style={[
                            styles.dayButtonText,
                            { color: selectedDays.includes(day.value) ? '#fff' : theme.colors.text },
                          ]}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Monthly Dates Schedule */}
              {scheduleType === 'monthly-dates' && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Select dates of the month:
                  </Text>
                  <View style={styles.datesGrid}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(date => (
                      <TouchableOpacity
                        key={date}
                        style={[
                          styles.dateButton,
                          {
                            backgroundColor: selectedDates.includes(date) ? theme.colors.primary : theme.colors.card,
                            borderColor: theme.colors.border,
                          },
                        ]}
                        onPress={() => handleDateToggle(date)}
                      >
                        <Text
                          style={[
                            styles.dateButtonText,
                            { color: selectedDates.includes(date) ? '#fff' : theme.colors.text },
                          ]}
                        >
                          {date}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Monthly Range Schedule */}
              {scheduleType === 'monthly-range' && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    Select date range (e.g., 20-25):
                  </Text>
                  <View style={styles.rangeInputs}>
                    <View style={styles.rangeInput}>
                      <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>From</Text>
                      <TextInput
                        style={[styles.rangeTextInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                        value={rangeStart}
                        onChangeText={setRangeStart}
                        placeholder="1"
                        placeholderTextColor={theme.colors.textSecondary}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                    <Text style={[styles.rangeSeparator, { color: theme.colors.text }]}>-</Text>
                    <View style={styles.rangeInput}>
                      <Text style={[styles.rangeLabel, { color: theme.colors.textSecondary }]}>To</Text>
                      <TextInput
                        style={[styles.rangeTextInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                        value={rangeEnd}
                        onChangeText={setRangeEnd}
                        placeholder="31"
                        placeholderTextColor={theme.colors.textSecondary}
                        keyboardType="number-pad"
                        maxLength={2}
                      />
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  scheduleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scheduleButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  rangeTextInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  rangeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  applyButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
