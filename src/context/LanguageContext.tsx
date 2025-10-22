/**
 * Language context provider
 * Manages language state and provides translation utilities
 */

import { Language, translations, Translations } from '@/src/i18n/translations';
import { themeStorage } from '@/src/utils/storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
}

/**
 * Language Provider Component
 * Wraps the app to provide language context to all children
 */
export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on mount
  useEffect(() => {
    loadLanguage();
  }, []);

  /**
   * Load language from storage
   */
  const loadLanguage = async () => {
    try {
      const savedLanguage = await themeStorage.loadLanguage();
      if (savedLanguage && isValidLanguage(savedLanguage)) {
        setLanguageState(savedLanguage as Language);
        // Set RTL for Arabic
        if (savedLanguage === 'ar') {
          I18nManager.forceRTL(true);
        }
      }
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update language and persist to storage
   */
  const setLanguage = useCallback(async (newLanguage: Language) => {
    try {
      await themeStorage.saveLanguage(newLanguage);
      setLanguageState(newLanguage);
      
      // Handle RTL for Arabic
      const shouldBeRTL = newLanguage === 'ar';
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
      }
    } catch (error) {
      console.error('Error saving language:', error);
      setLanguageState(newLanguage);
    }
  }, []);

  /**
   * Get current translations
   */
  const t = useMemo(() => translations[language], [language]);

  /**
   * Check if current language is RTL
   */
  const isRTL = useMemo(() => language === 'ar', [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isRTL,
    }),
    [language, setLanguage, t, isRTL]
  );

  // Don't render children until language is loaded
  if (isLoading) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access language context
 * @throws Error if used outside LanguageProvider
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Validate language string
 */
function isValidLanguage(lang: string): lang is Language {
  return lang === 'en' || lang === 'ar';
}
