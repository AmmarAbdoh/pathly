/**
 * Settings screen
 * User preferences and app information
 */

import { useLanguage } from '@/src/context/LanguageContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Language, ThemeMode } from '@/src/types';
import React, { useCallback, useMemo } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: -0.2,
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
});
