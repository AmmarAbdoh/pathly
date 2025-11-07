/**
 * Unit tests for validation utilities
 */

import { GoalFormData } from '../../types';
import { isValidNumber, validateGoalForm } from '../validation';

describe('Validation Utilities', () => {
  describe('validateGoalForm', () => {
    const validGoalData: Partial<GoalFormData> = {
      title: 'Test Goal',
      target: 100,
      current: 0,
      unit: 'units',
      direction: 'increase',
      points: 50,
      period: 'daily',
    };

    it('should validate a complete valid goal', () => {
      const result = validateGoalForm(validGoalData);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    describe('Title Validation', () => {
      it('should reject empty title', () => {
        const result = validateGoalForm({ ...validGoalData, title: '' });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.title).toBeDefined();
      });

      it('should reject whitespace-only title', () => {
        const result = validateGoalForm({ ...validGoalData, title: '   ' });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.title).toBeDefined();
      });

      it('should reject title exceeding max length', () => {
        const longTitle = 'a'.repeat(101); // Assuming max is 100
        const result = validateGoalForm({ ...validGoalData, title: longTitle });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.title).toBeDefined();
        expect(result.errors.title).toContain('less than');
      });

      it('should accept title at max length', () => {
        const maxTitle = 'a'.repeat(100); // Assuming max is 100
        const result = validateGoalForm({ ...validGoalData, title: maxTitle });
        
        // Should not have title error (might have other errors)
        expect(result.errors.title).toBeUndefined();
      });
    });

    describe('Target Validation', () => {
      it('should reject undefined target', () => {
        const result = validateGoalForm({ ...validGoalData, target: undefined });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.target).toBeDefined();
      });

      it('should reject negative target', () => {
        const result = validateGoalForm({ ...validGoalData, target: -1 });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.target).toBeDefined();
      });

      it('should reject target exceeding max', () => {
        const result = validateGoalForm({ ...validGoalData, target: 1000001 }); // Assuming max is 1000000
        
        expect(result.isValid).toBe(false);
        expect(result.errors.target).toBeDefined();
      });

      it('should reject zero target (minimum is 0.01)', () => {
        const result = validateGoalForm({ ...validGoalData, target: 0 });
        
        // Should have target error for zero (minimum is 0.01)
        expect(result.errors.target).toBe('Target must be at least 0.01');
        expect(result.isValid).toBe(false);
      });
    });

    describe('Current Value Validation', () => {
      it('should reject undefined current', () => {
        const result = validateGoalForm({ ...validGoalData, current: undefined });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.current).toBeDefined();
      });

      it('should reject negative current for increase goals', () => {
        const result = validateGoalForm({ ...validGoalData, current: -1 });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.current).toBeDefined();
      });

      it('should accept zero current', () => {
        const result = validateGoalForm({ ...validGoalData, current: 0 });
        
        expect(result.errors.current).toBeUndefined();
      });

      it('should reject current value exceeding maximum', () => {
        const result = validateGoalForm({ ...validGoalData, current: 1000001 });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.current).toBeDefined();
      });
    });

    describe('Unit Validation', () => {
      it('should reject empty unit', () => {
        const result = validateGoalForm({ ...validGoalData, unit: '' });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.unit).toBeDefined();
      });

      it('should reject whitespace-only unit', () => {
        const result = validateGoalForm({ ...validGoalData, unit: '   ' });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.unit).toBeDefined();
      });

      it('should reject unit exceeding max length', () => {
        const longUnit = 'a'.repeat(51); // Assuming max is 50
        const result = validateGoalForm({ ...validGoalData, unit: longUnit });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.unit).toBeDefined();
      });
    });

    describe('Points Validation', () => {
      it('should accept undefined points (optional for subgoals)', () => {
        const result = validateGoalForm({ ...validGoalData, points: undefined });
        
        expect(result.errors.points).toBeUndefined();
      });

      it('should reject negative points', () => {
        const result = validateGoalForm({ ...validGoalData, points: -1 });
        
        expect(result.isValid).toBe(false);
        expect(result.errors.points).toBeDefined();
      });

      it('should accept zero points', () => {
        const result = validateGoalForm({ ...validGoalData, points: 0 });
        
        expect(result.errors.points).toBeUndefined();
      });

      it('should reject points exceeding max', () => {
        const result = validateGoalForm({ ...validGoalData, points: 100001 }); // Assuming max is 100000
        
        expect(result.isValid).toBe(false);
        expect(result.errors.points).toBeDefined();
      });
    });

    describe('Multiple Errors', () => {
      it('should collect all validation errors', () => {
        const invalidData: Partial<GoalFormData> = {
          title: '',
          target: -1,
          current: -1,
          unit: '',
          points: -1,
        };
        
        const result = validateGoalForm(invalidData);
        
        expect(result.isValid).toBe(false);
        expect(Object.keys(result.errors).length).toBeGreaterThan(1);
        expect(result.errors.title).toBeDefined();
        expect(result.errors.target).toBeDefined();
        expect(result.errors.current).toBeDefined();
        expect(result.errors.unit).toBeDefined();
        expect(result.errors.points).toBeDefined();
      });
    });
  });

  describe('isValidNumber', () => {
    it('should validate integer strings', () => {
      expect(isValidNumber('42')).toBe(true);
      expect(isValidNumber('0')).toBe(true);
      expect(isValidNumber('1000')).toBe(true);
    });

    it('should validate decimal strings', () => {
      expect(isValidNumber('3.14')).toBe(true);
      expect(isValidNumber('0.5')).toBe(true);
      expect(isValidNumber('99.99')).toBe(true);
    });

    it('should validate negative numbers', () => {
      expect(isValidNumber('-42')).toBe(true);
      expect(isValidNumber('-3.14')).toBe(true);
    });

    it('should reject non-numeric strings', () => {
      expect(isValidNumber('abc')).toBe(false);
      expect(isValidNumber('12abc')).toBe(false);
      expect(isValidNumber('1.2.3')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidNumber('')).toBe(false);
    });

    it('should reject infinity', () => {
      expect(isValidNumber('Infinity')).toBe(false);
      expect(isValidNumber('-Infinity')).toBe(false);
    });

    it('should reject NaN', () => {
      expect(isValidNumber('NaN')).toBe(false);
    });

    it('should handle whitespace', () => {
      expect(isValidNumber('  42  ')).toBe(true);
      expect(isValidNumber('   ')).toBe(false);
    });
  });
});
