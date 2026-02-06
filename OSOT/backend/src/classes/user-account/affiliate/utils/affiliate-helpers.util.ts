/**
 * Affiliate Helper Utilities
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Pure helper functions for data formatting and display
 * - No validation logic (moved to validators/)
 * - UI-focused utilities for better user experience
 *
 * UTILITY SCOPE (Formatting and Display Helpers Only):
 * - Social media URL formatting and sanitization
 * - Postal code formatting (country-specific)
 * - Phone number formatting and display
 * - Data formatting and display helpers
 * - Password requirements display (for UI)
 *
 * BUSINESS CONTEXT:
 * - Pure helper functions for data formatting and display
 * - No validation logic (moved to validators/)
 * - Stateless functions for consistent data presentation
 * - UI-focused utilities for better user experience
 *
 * NOTE: All validation logic has been moved to affiliate.validators.ts
 * This file contains only formatting, display, and data transformation utilities.
 *
 * @author OSOT Development Team
 * @version 2.0.0 (Helpers Only)
 */

// ========================================
// SOCIAL MEDIA URL FORMATTING UTILITIES
// ========================================

/**
 * Sanitize and format social media URL
 * @param url Raw URL input
 * @returns Formatted URL or null if invalid
 */
export function formatSocialMediaUrl(url: string): string | null {
  if (!url) return null;

  let trimmedUrl = url.trim();

  // Add https:// if missing
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    trimmedUrl = `https://${trimmedUrl}`;
  }

  return trimmedUrl;
}

// ========================================
// POSTAL CODE FORMATTING UTILITIES
// ========================================

/**
 * Format postal code according to country standards
 * Utility function for postal code formatting
 */
export function formatPostalCode(postalCode: string, country?: number): string {
  if (!postalCode) return '';

  const trimmedCode = postalCode.trim().toUpperCase();

  if (country === 1 || Number(country) === 1) {
    // Canadian postal code formatting (A1A 1A1)
    const cleanCode = trimmedCode.replace(/\s/g, '');
    if (cleanCode.length === 6) {
      return `${cleanCode.substring(0, 3)} ${cleanCode.substring(3)}`;
    }
  }

  return trimmedCode;
}

// ========================================
// PASSWORD DISPLAY UTILITIES
// ========================================

/**
 * Get password strength display name
 * @param strength Password strength enum value
 * @returns Human-readable strength name
 */
export function getPasswordStrengthDisplayName(strength: number): string {
  switch (strength) {
    case 1:
      return 'Very Weak';
    case 2:
      return 'Weak';
    case 3:
      return 'Fair';
    case 4:
      return 'Good';
    case 5:
      return 'Strong';
    default:
      return 'Unknown';
  }
}

// ========================================
// PHONE NUMBER FORMATTING UTILITIES
// ========================================

/**
 * Format Canadian phone number for display
 * @param phone Raw phone number
 * @returns Formatted phone number or original if invalid
 */
export function formatCanadianPhoneNumber(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle different formats
  if (digits.length === 10) {
    // Format: (123) 456-7890
    return `(${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    // Format: +1 (123) 456-7890
    return `+1 (${digits.substring(1, 4)}) ${digits.substring(4, 7)}-${digits.substring(7)}`;
  }

  // Return original if can't format
  return phone;
}

// ========================================
// DATA FORMATTING UTILITIES
// ========================================

/**
 * Capitalize first letter of each word
 * @param text Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  if (!text) return '';

  return text
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format name for display (proper case)
 * @param firstName First name
 * @param lastName Last name
 * @returns Formatted full name
 */
export function formatFullName(firstName?: string, lastName?: string): string {
  const parts: string[] = [];

  if (firstName?.trim()) {
    parts.push(capitalizeWords(firstName.trim()));
  }

  if (lastName?.trim()) {
    parts.push(capitalizeWords(lastName.trim()));
  }

  return parts.join(' ');
}

/**
 * Mask sensitive data for logging
 * @param value Sensitive value
 * @param visibleChars Number of characters to show at start/end
 * @returns Masked value
 */
export function maskSensitiveData(
  value: string,
  visibleChars: number = 2,
): string {
  if (!value || value.length <= visibleChars * 2) {
    return '*'.repeat(value?.length || 0);
  }

  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const middle = '*'.repeat(value.length - visibleChars * 2);

  return `${start}${middle}${end}`;
}

/**
 * Truncate text with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text || '';
  }

  return `${text.substring(0, maxLength - 3)}...`;
}
