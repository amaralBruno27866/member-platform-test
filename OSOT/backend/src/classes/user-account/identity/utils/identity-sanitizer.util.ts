/**
 * Identity Sanitizer Utility
 *
 * Provides data sanitization and cleaning functions for identity data.
 * Ensures data consistency and removes potentially harmful content.
 * Focuses on cultural and demographic data sanitization.
 */

import { Language } from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Identity Data Sanitizer
 * Sanitizes and cleans identity input data
 */
export class IdentityDataSanitizer {
  /**
   * Sanitize user business ID
   * @param businessId Raw business ID
   * @returns Cleaned business ID
   */
  static sanitizeUserBusinessId(businessId: string): string {
    try {
      if (!businessId) return '';

      return businessId
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '') // Remove invalid characters
        .substring(0, 20); // Enforce max length from CSV
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'sanitize_user_business_id',
        error:
          error instanceof Error ? error.message : 'Unknown sanitization error',
        businessId,
      });
    }
  }

  /**
   * Sanitize chosen name
   * @param chosenName Raw chosen name
   * @returns Cleaned chosen name
   */
  static sanitizeChosenName(chosenName: string): string {
    if (!chosenName) return '';

    return chosenName
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML brackets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 255); // Enforce max length from CSV
  }

  /**
   * Sanitize language array
   * @param languages Raw language values
   * @returns Valid language array
   */
  static sanitizeLanguages(languages: unknown): Language[] {
    if (!languages) return [];

    let langArray: any[] = [];

    // Handle different input types
    if (Array.isArray(languages)) {
      langArray = languages;
    } else if (typeof languages === 'string') {
      // Handle comma-separated string format from Dataverse
      langArray = languages
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
    } else if (typeof languages === 'number') {
      langArray = [languages];
    }

    // Filter to valid Language enum values
    const validLanguages = langArray.filter((lang) =>
      Object.values(Language).includes(lang as Language),
    ) as Language[];

    // Ensure at least one language (default to English if none valid)
    return validLanguages.length > 0 ? validLanguages : [Language.ENGLISH]; // English default
  }

  /**
   * Sanitize indigenous detail text
   * @param detailText Raw indigenous detail text
   * @returns Cleaned indigenous detail text
   */
  static sanitizeIndigenousDetailOther(detailText: string): string {
    if (!detailText) return '';

    return detailText
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML brackets
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 100); // Enforce max length from CSV
  }

  /**
   * Sanitize complete identity object
   * @param identity Raw identity data
   * @returns Sanitized identity object
   */
  static sanitizeIdentity(
    identity: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    // Required fields
    if (
      identity.osot_user_business_id &&
      typeof identity.osot_user_business_id === 'string'
    ) {
      sanitized.osot_user_business_id = this.sanitizeUserBusinessId(
        identity.osot_user_business_id,
      );
    }

    if (identity.osot_language) {
      sanitized.osot_language = this.sanitizeLanguages(identity.osot_language);
    }

    // Optional fields
    if (
      identity.osot_chosen_name &&
      typeof identity.osot_chosen_name === 'string'
    ) {
      sanitized.osot_chosen_name = this.sanitizeChosenName(
        identity.osot_chosen_name,
      );
    }

    if (
      identity.osot_indigenous_detail_other &&
      typeof identity.osot_indigenous_detail_other === 'string'
    ) {
      sanitized.osot_indigenous_detail_other =
        this.sanitizeIndigenousDetailOther(
          identity.osot_indigenous_detail_other,
        );
    }

    // Copy other fields that don't need sanitization (enums, booleans, etc.)
    const fieldsToPreserve = [
      'osot_gender',
      'osot_race',
      'osot_indigenous',
      'osot_indigenous_detail',
      'osot_disability',
      'osot_access_modifiers',
      'osot_privilege',
      'osot_table_account',
    ];

    fieldsToPreserve.forEach((field) => {
      if (identity[field] !== undefined) {
        sanitized[field] = identity[field];
      }
    });

    return sanitized;
  }

  /**
   * Remove potentially harmful content from text fields
   * @param text Raw text
   * @returns Safe text
   */
  static removePotentiallyHarmfulContent(text: string): string {
    if (!text) return '';

    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate and sanitize enum values
   * @param value Raw enum value
   * @param enumObject Enum object to validate against
   * @returns Valid enum value or undefined
   */
  static sanitizeEnumValue<T extends Record<string, number>>(
    value: unknown,
    enumObject: T,
  ): T[keyof T] | undefined {
    if (value === undefined || value === null) return undefined;

    const numValue =
      typeof value === 'string' ? parseInt(value, 10) : Number(value);

    if (isNaN(numValue)) return undefined;

    const validValues = Object.values(enumObject) as T[keyof T][];
    return validValues.includes(numValue as T[keyof T])
      ? (numValue as T[keyof T])
      : undefined;
  }

  /**
   * Sanitize boolean values from various input types
   * @param value Raw boolean value
   * @returns Boolean or undefined
   */
  static sanitizeBoolean(value: unknown): boolean | undefined {
    if (value === undefined || value === null) return undefined;

    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }

    return undefined;
  }
}

/**
 * Standalone sanitization functions for specific use cases
 */

/**
 * Quick sanitize user business ID
 * @param businessId Business ID to sanitize
 * @returns Sanitized business ID
 */
export function sanitizeUserBusinessId(businessId: string): string {
  return IdentityDataSanitizer.sanitizeUserBusinessId(businessId);
}

/**
 * Quick sanitize chosen name
 * @param name Name to sanitize
 * @returns Sanitized name
 */
export function sanitizeChosenName(name: string): string {
  return IdentityDataSanitizer.sanitizeChosenName(name);
}

/**
 * Quick sanitize language array
 * @param languages Languages to sanitize
 * @returns Sanitized language array
 */
export function sanitizeLanguages(languages: unknown): Language[] {
  return IdentityDataSanitizer.sanitizeLanguages(languages);
}

/**
 * Quick remove harmful content
 * @param text Text to clean
 * @returns Safe text
 */
export function removeHarmfulContent(text: string): string {
  return IdentityDataSanitizer.removePotentiallyHarmfulContent(text);
}
