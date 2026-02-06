/**
 * Canadian Postal Code Validator (ENHANCED - SINGLE SOURCE OF TRUTH)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorMessages for consistent validation feedback
 *
 * ENHANCED FUNCTIONALITY (CONSOLIDATED FROM MULTIPLE FILES):
 * - Canadian postal code validation only (A1A 1A1 format)
 * - Province-specific postal code validation (all 13 provinces/territories)
 * - Self-contained validation logic (no external utils dependency)
 * - Normalize input (trim, uppercase)
 * - Format and sanitization utilities
 * - Static methods for business logic integration
 *
 * REPLACES DUPLICATED LOGIC FROM:
 * - address-business-rules.service.ts (validatePostalCodeFormat method)
 * - address-business-logic.util.ts (postal code logic in validateCountrySpecificRules)
 * - address-sanitizer.util.ts (CANADIAN_POSTAL pattern)
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Pattern for Canadian postal code validation
 * Format: A1A 1A1 where A=letter (excluding D,F,I,O,Q,U) and 1=digit
 */
const CANADIAN_POSTAL_CODE_PATTERN =
  /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\s?\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i;

/**
 * Province-specific postal code first letter mapping
 * Consolidated from address-business-rules.service.ts
 */
const PROVINCE_POSTAL_MAPPING: { [key: number]: string[] } = {
  10: ['A'], // Newfoundland and Labrador
  11: ['B'], // Nova Scotia
  12: ['C'], // Prince Edward Island
  13: ['E'], // New Brunswick
  24: ['G', 'H', 'J'], // Quebec
  35: ['K', 'L', 'M', 'N', 'P'], // Ontario
  46: ['R'], // Manitoba
  47: ['S'], // Saskatchewan
  48: ['T'], // Alberta
  59: ['V'], // British Columbia
  60: ['X'], // Northwest Territories and Nunavut
  61: ['Y'], // Yukon
};

/**
 * Enhanced Canadian Postal Code Validator
 * SINGLE SOURCE OF TRUTH - Replaces duplicated logic from multiple files
 *
 * Features:
 * - Basic format validation (A1A 1A1)
 * - Province-specific validation
 * - Normalization and formatting utilities
 * - Sanitization for storage
 * - Class-validator integration
 */
@ValidatorConstraint({ name: 'postalCode', async: false })
export class PostalCodeValidator implements ValidatorConstraintInterface {
  // ========================================
  // CLASS-VALIDATOR IMPLEMENTATION
  // ========================================

  validate(postalCode: string): boolean {
    return PostalCodeValidator.isValid(postalCode);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_POSTAL_CODE].publicMessage;
  }

  // ========================================
  // STATIC METHODS - BUSINESS LOGIC INTEGRATION
  // ========================================

  /**
   * Basic postal code format validation
   * Replaces: Original isValid logic + sanitizer validation
   */
  static isValid(postalCode: string): boolean {
    if (!postalCode) return false;

    try {
      const normalized = PostalCodeValidator.normalize(postalCode);
      const noSpaces = normalized.replace(/\s/g, '');

      // Must be exactly 6 characters
      if (noSpaces.length !== 6) {
        return false;
      }

      // Add space in correct position and validate pattern
      const formatted = `${noSpaces.slice(0, 3)} ${noSpaces.slice(3)}`;
      return CANADIAN_POSTAL_CODE_PATTERN.test(formatted);
    } catch {
      return false;
    }
  }

  /**
   * Province-specific postal code validation
   * Replaces: address-business-rules.service.ts validatePostalCodeFormat method
   */
  static isValidForProvince(postalCode: string, province: number): boolean {
    // First check basic format
    if (!PostalCodeValidator.isValid(postalCode)) {
      return false;
    }

    // Then check province-specific rules
    const firstLetter = postalCode.charAt(0).toUpperCase();
    const allowedLetters = PROVINCE_POSTAL_MAPPING[province];

    return allowedLetters ? allowedLetters.includes(firstLetter) : false;
  }

  /**
   * Normalize postal code input
   * Replaces: address-sanitizer.util.ts postal code normalization
   */
  static normalize(postalCode: string): string {
    if (typeof postalCode !== 'string') {
      throw new Error('Postal code must be a string');
    }

    const normalized = postalCode.trim().toUpperCase();

    if (!normalized) {
      throw new Error('Postal code cannot be empty');
    }

    return normalized.replace(/\s+/g, ' '); // Replace multiple spaces with single space
  }

  /**
   * Format postal code to A1A 1A1 standard
   * Replaces: Multiple formatting logic across files
   */
  static format(postalCode: string): string {
    try {
      const normalized = PostalCodeValidator.normalize(postalCode);
      const noSpaces = normalized.replace(/\s/g, '');

      if (noSpaces.length !== 6) {
        return postalCode; // Return original if invalid length
      }

      const formatted = `${noSpaces.slice(0, 3)} ${noSpaces.slice(3)}`;

      // Validate before returning formatted version
      if (CANADIAN_POSTAL_CODE_PATTERN.test(formatted)) {
        return formatted;
      }

      return postalCode; // Return original if invalid format
    } catch {
      return postalCode;
    }
  }

  /**
   * Sanitize postal code for storage
   * Replaces: address-sanitizer.util.ts sanitizePostalCode logic
   */
  static sanitize(postalCode: string): string {
    if (!postalCode) return '';

    try {
      const normalized = PostalCodeValidator.normalize(postalCode);
      const formatted = PostalCodeValidator.format(normalized);

      // Return formatted if valid, empty string if invalid
      return PostalCodeValidator.isValid(formatted) ? formatted : '';
    } catch {
      return '';
    }
  }

  /**
   * Get allowed first letters for a province
   * Utility method for business logic validation
   */
  static getAllowedLettersForProvince(province: number): string[] {
    return PROVINCE_POSTAL_MAPPING[province] || [];
  }

  /**
   * Validate and provide detailed error information
   * Enhanced method for business rules integration
   */
  static validateWithDetails(
    postalCode: string,
    province?: number,
  ): {
    isValid: boolean;
    errors: string[];
    formatted?: string;
  } {
    const errors: string[] = [];

    if (!postalCode) {
      errors.push('Postal code is required');
      return { isValid: false, errors };
    }

    // Check basic format
    if (!PostalCodeValidator.isValid(postalCode)) {
      errors.push('Invalid Canadian postal code format (expected: A1A 1A1)');
      return { isValid: false, errors };
    }

    const formatted = PostalCodeValidator.format(postalCode);

    // Check province-specific rules if province provided
    if (
      province !== undefined &&
      !PostalCodeValidator.isValidForProvince(postalCode, province)
    ) {
      const allowedLetters =
        PostalCodeValidator.getAllowedLettersForProvince(province);
      errors.push(
        `Postal code first letter must be one of: ${allowedLetters.join(', ')} for this province`,
      );
      return { isValid: false, errors, formatted };
    }

    return { isValid: true, errors: [], formatted };
  }
}
