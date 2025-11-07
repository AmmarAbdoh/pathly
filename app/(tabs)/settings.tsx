/**
 * Settings screen
 * User preferences and app information
 */

import ConfirmationModal from '@/components/ConfirmationModal';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useRewards } from '@/src/context/RewardsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Language, ThemeMode } from '@/src/types';
import { generateCSVExport, generateJSONExport, parseJSONImport, shareData } from '@/src/utils/export-data';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ThemeOption {
  label: string;
  value: ThemeMode;
}

interface LanguageOption {
  label: string;
  value: Language;
}

/**
 * Settings screen component
 */
export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { goals, lifetimePointsEarned, unarchiveGoal, permanentlyDeleteGoal, addGoal } = useGoals();
  const { rewards, addReward, removeReward } = useRewards();
  const [showArchivedGoals, setShowArchivedGoals] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const THEME_OPTIONS: readonly ThemeOption[] = useMemo(() => [
    { label: t.settings.themeSystem, value: 'system' },
    { label: t.settings.themeLight, value: 'light' },
    { label: t.settings.themeDark, value: 'dark' },
  ], [t]);

  const LANGUAGE_OPTIONS: readonly LanguageOption[] = useMemo(() => [
    { label: t.settings.languageEnglish, value: 'en' },
    { label: t.settings.languageArabic, value: 'ar' },
  ], [t]);

  /**
   * Handle theme mode change
   */
  const handleThemeModeChange = useCallback(
    (mode: ThemeMode) => {
      setThemeMode(mode);
    },
    [setThemeMode]
  );

  /**
   * Handle language change
   */
  const handleLanguageChange = useCallback(
    async (newLanguage: Language) => {
      await setLanguage(newLanguage);
      // Show alert that app needs restart for full RTL support
      if (newLanguage === 'ar' && language === 'en') {
        Alert.alert(
          t.common.success,
          'Language changed to Arabic. Please restart the app for full RTL support.',
          [{ text: t.common.cancel, style: 'cancel' }]
        );
      } else if (newLanguage === 'en' && language === 'ar') {
        Alert.alert(
          t.common.success,
          'Language changed to English. Please restart the app for full effect.',
          [{ text: t.common.cancel, style: 'cancel' }]
        );
      }
    },
    [setLanguage, language, t]
  );

  /**
   * Render theme option button
   */
  const renderThemeOption = useCallback(
    (option: ThemeOption) => {
      const isSelected = themeMode === option.value;

      return (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.themeOption,
            {
              backgroundColor: isSelected
                ? theme.colors.primary
                : theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => handleThemeModeChange(option.value)}
          activeOpacity={0.7}
          accessibilityRole="radio"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={`${option.label} theme`}
          accessibilityHint={`Switch to ${option.label.toLowerCase()} theme mode`}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color: isSelected ? '#FFF' : theme.colors.text,
              },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [theme, themeMode, handleThemeModeChange]
  );

  /**
   * Render language option button
   */
  const renderLanguageOption = useCallback(
    (option: LanguageOption) => {
      const isSelected = language === option.value;

      return (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.themeOption,
            {
              backgroundColor: isSelected
                ? theme.colors.primary
                : theme.colors.background,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => handleLanguageChange(option.value)}
          activeOpacity={0.7}
          accessibilityRole="radio"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={`${option.label} language`}
        >
          <Text
            style={[
              styles.themeOptionText,
              {
                color: isSelected ? '#FFF' : theme.colors.text,
              },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      );
    },
    [theme, language, handleLanguageChange]
  );

  const archivedGoals = useMemo(() => goals.filter(g => g.isArchived), [goals]);

  const handleRestoreGoal = useCallback(async (goalId: number) => {
    try {
      await unarchiveGoal(goalId);
      Alert.alert(t.common.success, t.settings.restoreSuccess);
    } catch (error) {
      console.error('Failed to restore goal:', error);
      Alert.alert(t.common.error, t.settings.restoreError);
    }
  }, [unarchiveGoal, t]);

  const handlePermanentlyDeleteGoal = useCallback(async () => {
    if (!goalToDelete) return;
    
    try {
      await permanentlyDeleteGoal(goalToDelete);
      setGoalToDelete(null);
      Alert.alert(t.common.success, t.settings.deletePermanentlySuccess);
    } catch (error) {
      console.error('Failed to delete goal:', error);
      Alert.alert(t.common.error, t.settings.deletePermanentlyError);
    }
  }, [goalToDelete, permanentlyDeleteGoal, t]);

  /**
   * Handle import data
   */
  const handleImportData = useCallback(async () => {
    setIsImporting(true);
    try {
      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/csv', 'text/comma-separated-values'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];
      
      // Read file content
      let content: string;
      if (Platform.OS === 'web') {
        // For web, we can read the file directly
        const response = await fetch(file.uri);
        content = await response.text();
      } else {
        // For native, read from file system
        const FileSystem = require('expo-file-system');
        content = await FileSystem.readAsStringAsync(file.uri);
      }

      // Parse the import
      let importResult;
      if (file.name.endsWith('.json')) {
        importResult = parseJSONImport(content);
      } else if (file.name.endsWith('.csv')) {
        Alert.alert(t.common.error, 'CSV import is not yet supported. Please use JSON format.');
        setIsImporting(false);
        return;
      } else {
        throw new Error('Unsupported file format');
      }

      if (!importResult.success || !importResult.data) {
        Alert.alert(t.common.error, importResult.message || 'Failed to parse import file');
        setIsImporting(false);
        return;
      }

      const { goals: importedGoals, rewards: importedRewards, lifetimePoints } = importResult.data;

      // Show confirmation dialog
      Alert.alert(
        t.import.confirmTitle,
        t.import.confirmMessage
          .replace('{goals}', importedGoals.length.toString())
          .replace('{rewards}', importedRewards.length.toString()),
        [
          {
            text: t.common.cancel,
            style: 'cancel',
            onPress: () => setIsImporting(false),
          },
          {
            text: t.import.merge,
            onPress: async () => {
              try {
                // Import goals by calling addGoal with all required parameters
                for (const goal of importedGoals) {
                  await addGoal(
                    goal.title,
                    goal.target,
                    goal.current,
                    goal.unit,
                    goal.direction,
                    goal.points,
                    goal.period,
                    goal.customPeriodDays,
                    goal.parentId,
                    goal.isUltimate,
                    goal.isRecurring,
                    goal.description,
                    goal.icon
                  );
                }

                // Import rewards
                for (const reward of importedRewards) {
                  await addReward(reward.title, reward.description || '', reward.pointsCost, reward.icon);
                }

                Alert.alert(
                  t.common.success,
                  t.import.importSuccess
                    .replace('{goals}', importedGoals.length.toString())
                    .replace('{rewards}', importedRewards.length.toString())
                );
              } catch (error) {
                console.error('Failed to import data:', error);
                Alert.alert(t.common.error, t.import.importError);
              } finally {
                setIsImporting(false);
              }
            },
          },
          {
            text: t.import.replace,
            style: 'destructive',
            onPress: async () => {
              try {
                // Clear existing data
                const allGoalIds = goals.map(g => g.id);
                for (const id of allGoalIds) {
                  await permanentlyDeleteGoal(id);
                }

                const allRewardIds = rewards.map(r => r.id);
                for (const id of allRewardIds) {
                  await removeReward(id);
                }

                // Import new data
                for (const goal of importedGoals) {
                  await addGoal(
                    goal.title,
                    goal.target,
                    goal.current,
                    goal.unit,
                    goal.direction,
                    goal.points,
                    goal.period,
                    goal.customPeriodDays,
                    goal.parentId,
                    goal.isUltimate,
                    goal.isRecurring,
                    goal.description,
                    goal.icon
                  );
                }

                for (const reward of importedRewards) {
                  await addReward(reward.title, reward.description || '', reward.pointsCost, reward.icon);
                }

                Alert.alert(
                  t.common.success,
                  t.import.importSuccess
                    .replace('{goals}', importedGoals.length.toString())
                    .replace('{rewards}', importedRewards.length.toString())
                );
              } catch (error) {
                console.error('Failed to import data:', error);
                Alert.alert(t.common.error, t.import.importError);
              } finally {
                setIsImporting(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to import data:', error);
      Alert.alert(t.common.error, t.import.importError);
      setIsImporting(false);
    }
  }, [t, goals, rewards, addGoal, addReward, permanentlyDeleteGoal, removeReward]);

  /**
   * Handle export as JSON
   */
  const handleExportJSON = useCallback(async () => {
    if (goals.length === 0 && rewards.length === 0) {
      Alert.alert(t.common.error, t.export.noData);
      return;
    }

    setIsExporting(true);
    try {
      const jsonData = generateJSONExport(goals, rewards, lifetimePointsEarned);
      const filename = `pathly-export-${new Date().toISOString().split('T')[0]}.json`;
      await shareData(jsonData, filename);
      Alert.alert(t.common.success, t.export.exportSuccess);
    } catch (error) {
      console.error('Failed to export JSON:', error);
      Alert.alert(t.common.error, t.export.exportError);
    } finally {
      setIsExporting(false);
    }
  }, [goals, rewards, lifetimePointsEarned, t]);

  /**
   * Handle export as CSV
   */
  const handleExportCSV = useCallback(async () => {
    if (goals.length === 0 && rewards.length === 0) {
      Alert.alert(t.common.error, t.export.noData);
      return;
    }

    setIsExporting(true);
    try {
      const csvData = generateCSVExport(goals, rewards, lifetimePointsEarned);
      const filename = `pathly-export-${new Date().toISOString().split('T')[0]}.csv`;
      await shareData(csvData, filename);
      Alert.alert(t.common.success, t.export.exportSuccess);
    } catch (error) {
      console.error('Failed to export CSV:', error);
      Alert.alert(t.common.error, t.export.exportError);
    } finally {
      setIsExporting(false);
    }
  }, [goals, rewards, lifetimePointsEarned, t]);

  const sectionStyle = useMemo(
    () => [
      styles.section,
      {
        backgroundColor: theme.colors.card,
        ...theme.shadows.small,
      },
    ],
    [theme]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top']}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{t.settings.title}</Text>

        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t.settings.appearance}
          </Text>
          <View style={styles.themeOptions}>
            {THEME_OPTIONS.map(renderThemeOption)}
          </View>
        </View>

        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t.settings.language}
          </Text>
          <View style={styles.themeOptions}>
            {LANGUAGE_OPTIONS.map(renderLanguageOption)}
          </View>
        </View>

        {/* Import Data Section */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t.import.title}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            {t.import.description}
          </Text>
          
          <TouchableOpacity
            style={[styles.importButton, { 
              backgroundColor: theme.colors.primary,
              opacity: isImporting ? 0.6 : 1,
            }]}
            onPress={handleImportData}
            disabled={isImporting}
            activeOpacity={0.7}
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#FFF" />
            <View style={styles.exportButtonContent}>
              <Text style={styles.exportButtonTitle}>{t.import.selectFile}</Text>
              <Text style={styles.exportButtonDescription}>{t.import.supportedFormats}</Text>
            </View>
          </TouchableOpacity>
          
          {isImporting && (
            <Text style={[styles.exportingText, { color: theme.colors.textSecondary }]}>
              {t.import.importing}
            </Text>
          )}
        </View>

        {/* Export Data Section */}
        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t.export.title}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            {t.export.description}
          </Text>
          
          <View style={styles.exportButtons}>
            <TouchableOpacity
              style={[styles.exportButton, { 
                backgroundColor: theme.colors.primary,
                opacity: isExporting ? 0.6 : 1,
              }]}
              onPress={handleExportJSON}
              disabled={isExporting}
              activeOpacity={0.7}
            >
              <Ionicons name="code-download-outline" size={24} color="#FFF" />
              <View style={styles.exportButtonContent}>
                <Text style={styles.exportButtonTitle}>{t.export.exportJSON}</Text>
                <Text style={styles.exportButtonDescription}>{t.export.jsonDescription}</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.exportButton, { 
                backgroundColor: '#22c55e',
                opacity: isExporting ? 0.6 : 1,
              }]}
              onPress={handleExportCSV}
              disabled={isExporting}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={24} color="#FFF" />
              <View style={styles.exportButtonContent}>
                <Text style={styles.exportButtonTitle}>{t.export.exportCSV}</Text>
                <Text style={styles.exportButtonDescription}>{t.export.csvDescription}</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {isExporting && (
            <Text style={[styles.exportingText, { color: theme.colors.textSecondary }]}>
              {t.export.exporting}
            </Text>
          )}
        </View>

        {/* Archived Goals Section */}
        <View style={sectionStyle}>
          <View style={styles.sectionHeader}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {t.settings.archivedGoals}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                {t.settings.archivedGoalsSubtitle}
              </Text>
            </View>
            <View style={styles.archivedBadge}>
              <Text style={[styles.archivedBadgeText, { color: theme.colors.primary }]}>
                {archivedGoals.length}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.viewArchivedButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowArchivedGoals(!showArchivedGoals)}
            activeOpacity={0.7}
          >
            <Ionicons name="archive-outline" size={20} color="#FFF" />
            <Text style={styles.viewArchivedButtonText}>
              {showArchivedGoals ? t.common.close : t.settings.viewArchived}
            </Text>
          </TouchableOpacity>

          {showArchivedGoals && (
            <View style={styles.archivedGoalsList}>
              {archivedGoals.length === 0 ? (
                <Text style={[styles.noArchivedText, { color: theme.colors.textSecondary }]}>
                  {t.settings.noArchivedGoals}
                </Text>
              ) : (
                archivedGoals.map(goal => (
                  <View 
                    key={goal.id} 
                    style={[styles.archivedGoalItem, { 
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.border 
                    }]}
                  >
                    <View style={styles.archivedGoalInfo}>
                      <Text style={[styles.archivedGoalTitle, { color: theme.colors.text }]}>
                        {goal.icon} {goal.title}
                      </Text>
                      {goal.archivedAt && (
                        <Text style={[styles.archivedGoalDate, { color: theme.colors.textSecondary }]}>
                          {new Date(goal.archivedAt).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.archivedGoalActions}>
                      <TouchableOpacity
                        style={[styles.restoreButton, { backgroundColor: '#22c55e' }]}
                        onPress={() => handleRestoreGoal(goal.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="refresh-outline" size={18} color="#FFF" />
                        <Text style={styles.archivedActionText}>{t.settings.restoreGoal}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: theme.colors.danger }]}
                        onPress={() => setGoalToDelete(goal.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="trash-outline" size={18} color="#FFF" />
                        <Text style={styles.archivedActionText}>{t.settings.deleteGoalPermanently}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        <View style={sectionStyle}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            {t.settings.about}
          </Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            {t.settings.aboutText}
          </Text>
          <Text
            style={[
              styles.version,
              { color: theme.colors.textSecondary, marginTop: 12 },
            ]}
          >
            {t.settings.version} 1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Permanent Delete Confirmation Modal */}
      <ConfirmationModal
        visible={goalToDelete !== null}
        title={t.settings.deletePermanentlyTitle}
        message={t.settings.deletePermanentlyMessage}
        confirmText={t.settings.deleteGoalPermanently}
        cancelText={t.common.cancel}
        onConfirm={handlePermanentlyDeleteGoal}
        onCancel={() => setGoalToDelete(null)}
        confirmStyle="destructive"
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
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  version: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  themeOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  archivedBadge: {
    backgroundColor: '#e0e7ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
    flexShrink: 0,
  },
  archivedBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewArchivedButton: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  viewArchivedButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  archivedGoalsList: {
    marginTop: 8,
  },
  noArchivedText: {
    textAlign: 'center',
    fontSize: 15,
    paddingVertical: 20,
  },
  archivedGoalItem: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  archivedGoalInfo: {
    marginBottom: 12,
  },
  archivedGoalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  archivedGoalDate: {
    fontSize: 13,
  },
  archivedGoalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  restoreButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archivedActionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 16,
  },
  exportButtons: {
    gap: 12,
    marginTop: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  exportButtonContent: {
    flex: 1,
  },
  exportButtonTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exportButtonDescription: {
    color: '#FFF',
    fontSize: 13,
    opacity: 0.9,
  },
  exportingText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
  },
});
