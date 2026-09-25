/**
 * Number formatting utilities
 * Consistent number display across locales
 */

import { Language } from '../types';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/**
 * The Western digits in `text` as Arabic-Indic ones (Eastern Arabic numerals).
 *
 * A worklet, so an animated number can use it on the UI thread: the Stats
 * counters counted up in Western digits, and were left showing them.
 */
export function toArabicDigits(text: string): string {
  'worklet';
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const digit = text.charCodeAt(i) - 48;
    out += digit >= 0 && digit <= 9 ? ARABIC_DIGITS[digit] : text[i];
  }
  return out;
}

/**
 * Format number for display based on language
 * Converts Western numerals to Arabic numerals for Arabic locale
 */
export function formatNumber(value: number | string, language: Language): string {
  const numStr = value.toString();
  return language === 'ar' ? toArabicDigits(numStr) : numStr;
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, language: Language): string {
  const rounded = Math.round(value);
  return `${formatNumber(rounded, language)}%`;
}

/**
 * Parse formatted number back to actual number
 * Converts Arabic numerals back to Western for calculations
 */
export function parseFormattedNumber(value: string): number {
  // Convert Arabic numerals to Western
  const westernNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let westernStr = value;
  arabicNumerals.forEach((arabic, index) => {
    westernStr = westernStr.replace(new RegExp(arabic, 'g'), westernNumerals[index]);
  });
  
  return parseFloat(westernStr) || 0;
}
