/**
 * Settings screen
 * User preferences and app information
 */

import ConfirmationModal from '@/components/ConfirmationModal';
import { useGoals } from '@/src/context/GoalsContext';
import { useLanguage } from '@/src/context/LanguageContext';
import { useRewards } from '@/src/context/RewardsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { PartialImportError, useImportBackup } from '@/src/hooks/use-import-backup';
import { translations } from '@/src/i18n/translations';
import { Language, ThemeMode } from '@/src/types';
import { generateCSVExport, generateJSONExport, parseJSONImport, shareData } from '@/src/utils/export-data';
import { type ImportMode } from '@/src/utils/import-data';
import { formatNumber } from '@/src/utils/number-formatting';
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
  const { goals, lifetimePointsEarned, unarchiveGoal, permanentlyDeleteGoal, rescheduleReminders } = useGoals();
  const { rewards } = useRewards();
  const importBackup = useImportBackup();
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
      // A restart is needed for the layout direction to switch fully. Say so in
      // the language just chosen: `t` here is still the previous one.
      if (newLanguage !== language) {
        const next = translations[newLanguage];
        // Scheduled reminders are still worded in the old language.
        void rescheduleReminders(next.notifications);
        Alert.alert(next.common.success, next.settings.languageChangedRestart, [
          { text: next.common.close, style: 'cancel' },
        ]);
      }
    },
    [setLanguage, language, rescheduleReminders]
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
          accessibilityLabel={t.settings.themeOptionLabel.replace('{theme}', option.label)}
          accessibilityHint={t.settings.themeOptionHint.replace('{theme}', option.label)}
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
    [theme, themeMode, handleThemeModeChange, t]
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
          accessibilityLabel={t.settings.languageOptionLabel.replace('{language}', option.label)}
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
    [theme, language, handleLanguageChange, t]
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
        // Native: read through expo-file-system's File API. `readAsStringAsync`
        // moved to the legacy entrypoint in SDK 54, so the old top-level call
        // resolved to undefined at runtime.
        const { File } = await import('expo-file-system');
        content = await new File(file.uri).text();
      }

      if (file.name.endsWith('.csv')) {
        Alert.alert(t.common.error, t.import.csvUnsupported);
        setIsImporting(false);
        return;
      }
      if (!file.name.endsWith('.json')) {
        throw new Error('Unsupported file format');
      }

      const importResult = parseJSONImport(content);
      if (!importResult.success || !importResult.data) {
        // The parser's own message is English and technical; show ours.
        Alert.alert(t.common.error, t.import.invalidFile);
        setIsImporting(false);
        return;
      }

      const incoming = importResult.data;
      const skipped = importResult.errors.length;
      const count = (n: number) => formatNumber(n, language);

      // Applies the whole backup or nothing; see useImportBackup. This used to
      // re-create each goal and reward through addGoal/addReward, which
      // dropped completion state, history, notes, schedules and links, and
      // never restored points.
      const applyImport = async (mode: ImportMode) => {
        try {
          await importBackup(incoming, mode);

          Alert.alert(
            t.common.success,
            t.import.importSuccess
              .replace('{goals}', count(incoming.goals.length))
              .replace('{rewards}', count(incoming.rewards.length))
          );
        } catch (error) {
          console.error('Failed to import data:', error);
          Alert.alert(
            t.common.error,
            error instanceof PartialImportError ? t.import.partialError : t.import.importError
          );
        } finally {
          setIsImporting(false);
        }
      };

      // Replace discards everything the user has now, so it gets a second,
      // explicit confirmation that says exactly what will be lost.
      const confirmReplace = () => {
        Alert.alert(
          t.import.replaceConfirmTitle,
          t.import.replaceConfirmMessage
            .replace('{goals}', count(goals.length))
            .replace('{rewards}', count(rewards.length)),
          [
            { text: t.common.cancel, style: 'cancel', onPress: () => setIsImporting(false) },
            {
              text: t.import.replace,
              style: 'destructive',
              onPress: () => void applyImport('replace'),
            },
          ]
        );
      };

      const summary = t.import.confirmMessage
        .replace('{goals}', count(incoming.goals.length))
        .replace('{rewards}', count(incoming.rewards.length));
      // Invalid records used to be dropped without a word.
      const message =
        skipped > 0
          ? summary + '\n\n' + t.import.skipped.replace('{count}', count(skipped))
          : summary;

      Alert.alert(t.import.confirmTitle, message, [
        { text: t.common.cancel, style: 'cancel', onPress: () => setIsImporting(false) },
        { text: t.import.merge, onPress: () => void applyImport('merge') },
        { text: t.import.replace, style: 'destructive', onPress: confirmReplace },
      ]);
    } catch (error) {
      console.error('Failed to import data:', error);
      Alert.alert(t.common.error, t.import.importError);
      setIsImporting(false);
    }
  }, [t, language, goals, rewards, importBackup]);

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
                {formatNumber(archivedGoals.length, language)}
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
                      {goal.archivedAt ? (
                        <Text style={[styles.archivedGoalDate, { color: theme.colors.textSecondary }]}>
                          {new Date(goal.archivedAt).toLocaleDateString()}
                        </Text>
                      ) : null}
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
