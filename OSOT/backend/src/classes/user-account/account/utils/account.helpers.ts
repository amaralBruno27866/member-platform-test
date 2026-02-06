/**
 * Account Helper Functions
 * Objective: Provide reusable utility functions for Account data processing.
 * Functionality: Data normalization, validation, parsing, and transformation utilities.
 * Expected Result: Clean, validated, and properly formatted Account data.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses AccountGroup, AccountStatus, AccessModifier, Privilege for parsing
 * - utils: Uses formatPhoneNumber for phone number normalization
 *
 * REUSABLE UTILITIES:
 * - Text normalization with length validation and trimming
 * - Phone number formatting to Canadian standards
 * - Date normalization to ISO format
 * - Enum parsing with type safety
 * - Data validation and sanitization
 *
 * USAGE SCENARIOS:
 * - Data transformation in mappers
 * - Input validation in services
 * - Data cleaning in DTOs
 * - API response formatting
 */

import { formatPhoneNumber } from '../../../../utils/phone-formatter.utils';
import {
  AccountGroup,
  AccountStatus,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

// ========================================
// TEXT AND STRING UTILITIES
// ========================================

/**
 * Normalize text input with length validation and trimming
 * @param text - Input text to normalize
 * @param maxLength - Optional maximum length constraint
 * @returns Normalized text or undefined if invalid
 */
export function normalizeText(
  text: string | undefined,
  maxLength?: number,
): string | undefined {
  if (!text || typeof text !== 'string') return undefined;
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  return maxLength ? trimmed.substring(0, maxLength) : trimmed;
}

/**
 * Normalize email address to lowercase with validation
 * @param email - Input email to normalize
 * @param maxLength - Optional maximum length constraint
 * @returns Normalized email or undefined if invalid
 */
export function normalizeEmail(
  email: string | undefined,
  maxLength: number = 100,
): string | undefined {
  const normalized = normalizeText(email, maxLength);
  return normalized?.toLowerCase();
}

// ========================================
// PHONE NUMBER UTILITIES
// ========================================

/**
 * Normalize phone number to Canadian format
 * @param phone - Input phone number to normalize
 * @returns Formatted phone number or undefined if invalid
 */
export function normalizePhoneNumber(
  phone: string | undefined,
): string | undefined {
  if (!phone) return undefined;
  try {
    return formatPhoneNumber(phone);
  } catch {
    return undefined;
  }
}

// ========================================
// DATE UTILITIES
// ========================================

/**
 * Normalize date to YYYY-MM-DD format
 * @param date - Input date string to normalize
 * @returns Normalized date string or undefined if invalid
 */
export function normalizeDate(date: string | undefined): string | undefined {
  if (!date) return undefined;

  // Check if already in correct format
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  // Try to parse and format
  const parsed = new Date(date);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return undefined;
}

/**
 * Validate if date string is in valid format
 * @param date - Date string to validate
 * @returns True if valid date format
 */
export function isValidDateFormat(date: string | undefined): boolean {
  if (!date) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
}

// ========================================
// ENUM PARSING UTILITIES
// ========================================

/**
 * Parse account group from string/number to enum
 * @param value - Value to parse (string or number)
 * @returns AccountGroup enum value or undefined if invalid
 */
export function parseAccountGroup(value: any): AccountGroup | undefined {
  if (value === undefined || value === null) return undefined;

  // Handle numeric values
  if (typeof value === 'number') {
    return Object.values(AccountGroup).includes(value) ? value : undefined;
  }

  // Handle string values
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(AccountGroup).includes(numValue)) {
      return numValue;
    }
  }

  return undefined;
}

/**
 * Parse account status from string/number to enum
 * @param value - Value to parse (string or number)
 * @returns AccountStatus enum value or undefined if invalid
 */
export function parseAccountStatus(value: any): AccountStatus | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'number') {
    return Object.values(AccountStatus).includes(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(AccountStatus).includes(numValue)) {
      return numValue;
    }
  }

  return undefined;
}

/**
 * Parse access modifier from string/number to enum
 * @param value - Value to parse (string or number)
 * @returns AccessModifier enum value or undefined if invalid
 */
export function parseAccessModifier(value: any): AccessModifier | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'number') {
    return Object.values(AccessModifier).includes(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(AccessModifier).includes(numValue)) {
      return numValue;
    }
  }

  return undefined;
}

/**
 * Parse privilege from string/number to enum
 * @param value - Value to parse (string or number)
 * @returns Privilege enum value or undefined if invalid
 */
export function parsePrivilege(value: any): Privilege | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'number') {
    return Object.values(Privilege).includes(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(Privilege).includes(numValue)) {
      return numValue;
    }
  }

  return undefined;
}

// ========================================
// VALIDATION UTILITIES
// ========================================

/**
 * Check if a value is a valid enum value
 * @param value - Value to check
 * @param enumObject - Enum object to check against
 * @returns True if value is valid enum value
 */
export function isValidEnumValue(
  value: any,
  enumObject: Record<string | number, string | number>,
): boolean {
  return Object.values(enumObject as Record<string, unknown>).includes(value);
}

/**
 * Sanitize string input for security
 * @param input - Input string to sanitize
 * @param maxLength - Maximum allowed length
 * @returns Sanitized string or undefined
 */
export function sanitizeString(
  input: string | undefined,
  maxLength: number = 255,
): string | undefined {
  if (!input || typeof input !== 'string') return undefined;

  // Remove potentially dangerous characters
  const sanitized = input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .substring(0, maxLength);

  return sanitized || undefined;
}

// ========================================
// DATA TRANSFORMATION UTILITIES
// ========================================

/**
 * Convert boolean-like values to actual boolean
 * @param value - Value to convert
 * @returns Boolean value or undefined
 */
export function parseBoolean(value: any): boolean | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'yes') return true;
    if (lower === 'false' || lower === '0' || lower === 'no') return false;
  }

  if (typeof value === 'number') {
    return value === 1 ? true : value === 0 ? false : undefined;
  }

  return undefined;
}

/**
 * Get display name for AccountGroup enum
 * @param group - AccountGroup enum value
 * @returns Human-readable display name
 */
export function getAccountGroupDisplayName(group: AccountGroup): string {
  switch (group) {
    case AccountGroup.OTHER:
      return 'Other';
    case AccountGroup.OCCUPATIONAL_THERAPIST:
      return 'Occupational Therapist';
    case AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT:
      return 'Occupational Therapist Assistant';
    case AccountGroup.VENDOR_ADVERTISER:
      return 'Vendor/Advertiser';
    default:
      return 'Unknown';
  }
}

/**
 * Get display name for AccountStatus enum
 * @param status - AccountStatus enum value
 * @returns Human-readable display name
 */
export function getAccountStatusDisplayName(status: AccountStatus): string {
  switch (status) {
    case AccountStatus.ACTIVE:
      return 'Active';
    case AccountStatus.INACTIVE:
      return 'Inactive';
    case AccountStatus.PENDING:
      return 'Pending';
    default:
      return 'Unknown';
  }
}
