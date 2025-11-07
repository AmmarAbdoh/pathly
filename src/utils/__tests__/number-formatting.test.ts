/**
 * Tests for number formatting utilities
 * Verify locale-specific number display
 */

import { formatNumber, formatPercentage, parseFormattedNumber } from '../number-formatting';

describe('Number Formatting Utilities', () => {
  describe('formatNumber', () => {
    it('should return Western numerals for English locale', () => {
      expect(formatNumber(12345, 'en')).toBe('12345');
      expect(formatNumber(0, 'en')).toBe('0');
      expect(formatNumber(999, 'en')).toBe('999');
    });

    it('should convert to Arabic-Indic numerals for Arabic locale', () => {
      expect(formatNumber(0, 'ar')).toBe('٠');
      expect(formatNumber(1, 'ar')).toBe('١');
      expect(formatNumber(2, 'ar')).toBe('٢');
      expect(formatNumber(3, 'ar')).toBe('٣');
      expect(formatNumber(4, 'ar')).toBe('٤');
      expect(formatNumber(5, 'ar')).toBe('٥');
      expect(formatNumber(6, 'ar')).toBe('٦');
      expect(formatNumber(7, 'ar')).toBe('٧');
      expect(formatNumber(8, 'ar')).toBe('٨');
      expect(formatNumber(9, 'ar')).toBe('٩');
    });

    it('should handle multi-digit numbers in Arabic', () => {
      expect(formatNumber(12345, 'ar')).toBe('١٢٣٤٥');
      expect(formatNumber(2025, 'ar')).toBe('٢٠٢٥');
      expect(formatNumber(100, 'ar')).toBe('١٠٠');
    });

    it('should handle decimal numbers', () => {
      expect(formatNumber(3.14, 'en')).toBe('3.14');
      expect(formatNumber(3.14, 'ar')).toBe('٣.١٤');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-42, 'en')).toBe('-42');
      expect(formatNumber(-42, 'ar')).toBe('-٤٢');
    });

    it('should handle string input', () => {
      expect(formatNumber('789', 'en')).toBe('789');
      expect(formatNumber('789', 'ar')).toBe('٧٨٩');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentage with % symbol in English', () => {
      expect(formatPercentage(50, 'en')).toBe('50%');
      expect(formatPercentage(100, 'en')).toBe('100%');
      expect(formatPercentage(0, 'en')).toBe('0%');
    });

    it('should format percentage with Arabic numerals', () => {
      expect(formatPercentage(75, 'ar')).toBe('٧٥%');
      expect(formatPercentage(100, 'ar')).toBe('١٠٠%');
      expect(formatPercentage(33, 'ar')).toBe('٣٣%');
    });

    it('should round decimal percentages', () => {
      expect(formatPercentage(75.4, 'en')).toBe('75%');
      expect(formatPercentage(75.5, 'en')).toBe('76%');
      expect(formatPercentage(75.9, 'en')).toBe('76%');
    });

    it('should handle edge cases', () => {
      expect(formatPercentage(0.1, 'en')).toBe('0%');
      expect(formatPercentage(99.9, 'en')).toBe('100%');
      expect(formatPercentage(150, 'en')).toBe('150%');
    });
  });

  describe('parseFormattedNumber', () => {
    it('should parse Western numerals', () => {
      expect(parseFormattedNumber('12345')).toBe(12345);
      expect(parseFormattedNumber('0')).toBe(0);
      expect(parseFormattedNumber('999')).toBe(999);
    });

    it('should convert Arabic-Indic numerals to Western', () => {
      expect(parseFormattedNumber('٠')).toBe(0);
      expect(parseFormattedNumber('١')).toBe(1);
      expect(parseFormattedNumber('٢')).toBe(2);
      expect(parseFormattedNumber('٣')).toBe(3);
      expect(parseFormattedNumber('٤')).toBe(4);
      expect(parseFormattedNumber('٥')).toBe(5);
      expect(parseFormattedNumber('٦')).toBe(6);
      expect(parseFormattedNumber('٧')).toBe(7);
      expect(parseFormattedNumber('٨')).toBe(8);
      expect(parseFormattedNumber('٩')).toBe(9);
    });

    it('should handle multi-digit Arabic numerals', () => {
      expect(parseFormattedNumber('١٢٣٤٥')).toBe(12345);
      expect(parseFormattedNumber('٢٠٢٥')).toBe(2025);
      expect(parseFormattedNumber('١٠٠')).toBe(100);
    });

    it('should handle decimal numbers', () => {
      expect(parseFormattedNumber('3.14')).toBe(3.14);
      expect(parseFormattedNumber('٣.١٤')).toBe(3.14);
    });

    it('should handle negative numbers', () => {
      expect(parseFormattedNumber('-42')).toBe(-42);
      expect(parseFormattedNumber('-٤٢')).toBe(-42);
    });

    it('should handle mixed numerals', () => {
      // In case someone mixes Arabic and Western (shouldn't happen, but handle it)
      expect(parseFormattedNumber('١2٣')).toBe(123);
    });

    it('should return 0 for invalid input', () => {
      expect(parseFormattedNumber('')).toBe(0);
      expect(parseFormattedNumber('abc')).toBe(0);
      expect(parseFormattedNumber('invalid')).toBe(0);
    });

    it('should handle whitespace', () => {
      expect(parseFormattedNumber('  123  ')).toBe(123);
      expect(parseFormattedNumber('  ١٢٣  ')).toBe(123);
    });
  });

  describe('Round-trip conversion', () => {
    it('should correctly convert back and forth', () => {
      const originalNumber = 12345;
      
      // English: format and parse should return same number
      const enFormatted = formatNumber(originalNumber, 'en');
      const enParsed = parseFormattedNumber(enFormatted);
      expect(enParsed).toBe(originalNumber);
      
      // Arabic: format and parse should return same number
      const arFormatted = formatNumber(originalNumber, 'ar');
      const arParsed = parseFormattedNumber(arFormatted);
      expect(arParsed).toBe(originalNumber);
    });

    it('should handle decimals in round-trip', () => {
      const originalNumber = 3.14159;
      
      const enFormatted = formatNumber(originalNumber, 'en');
      const enParsed = parseFormattedNumber(enFormatted);
      expect(enParsed).toBeCloseTo(originalNumber);
      
      const arFormatted = formatNumber(originalNumber, 'ar');
      const arParsed = parseFormattedNumber(arFormatted);
      expect(arParsed).toBeCloseTo(originalNumber);
    });
  });
});
