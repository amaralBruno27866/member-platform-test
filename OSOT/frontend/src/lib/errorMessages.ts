/**
 * Error Messages - User-Friendly Messages
 * Maps error codes to clear, actionable messages
 */

import { ErrorCode } from '@/types/errors';

export const ERROR_MESSAGES: Record<number, string> = {
  // Account errors (1000-1999)
  [ErrorCode.ACCOUNT_NOT_FOUND]: 'Account not found',
  [ErrorCode.ACCOUNT_DUPLICATE]: 'An account with this information already exists',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.EMAIL_IN_USE]: 'This email is already registered. Please use a different email or try to log in',
  [ErrorCode.PHONE_IN_USE]: 'This phone number is already in use. Please use a different number',
  [ErrorCode.ACCOUNT_LOCKED]: 'Account has been locked. Please contact support',
  [ErrorCode.SESSION_EXPIRED]: 'Session expired. Please log in again',
  [ErrorCode.INSUFFICIENT_PRIVILEGE]: 'Insufficient permissions for this action',
  [ErrorCode.INVALID_ACCOUNT_STATUS]: 'Invalid account status',
  [ErrorCode.REGISTRATION_EXPIRED]: 'Registration session has expired. Please start the registration process again',

  // Validation errors (2000-2999)
  [ErrorCode.INVALID_INPUT]: 'Invalid data provided. Please check all fields and try again',
  [ErrorCode.INVALID_EMAIL]: 'Invalid email format. Please enter a valid email address',
  [ErrorCode.INVALID_PHONE]: 'Invalid phone number. Please use Canadian format: (XXX) XXX-XXXX',
  [ErrorCode.INVALID_POSTAL_CODE]: 'Invalid postal code. Please use Canadian format: A1A 1A1',
  [ErrorCode.INVALID_PASSWORD]: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  [ErrorCode.INVALID_NAME]: 'Name contains invalid characters. Please use only letters, spaces, hyphens, and apostrophes',
  [ErrorCode.INVALID_SEARCH]: 'Invalid search query',

  // Permission errors (3000-3999)
  [ErrorCode.PERMISSION_DENIED]: 'Access denied',
  [ErrorCode.CONFLICT]: 'Resource already exists',
  [ErrorCode.VALIDATION_ERROR]: 'Validation error in the provided data',
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Operation violates business rules',

  // External service errors (4000-4999)
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error. Please try again',
  [ErrorCode.DATAVERSE_ERROR]: 'Database access error. Please try again',
  [ErrorCode.REDIS_ERROR]: 'Cache system error',
  [ErrorCode.EMAIL_SERVICE_ERROR]: 'Failed to send email. Please try again',

  // Application errors (5000-5999)
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error. Please try again',
  [ErrorCode.FORBIDDEN]: 'Access forbidden',

  // Education errors (5100-5199)
  [ErrorCode.EDUCATION_NOT_FOUND]: 'Education data not found',
  [ErrorCode.INVALID_EDUCATION_CATEGORY]: 'Invalid education category',
  [ErrorCode.EDUCATION_INCOMPLETE]: 'Incomplete education data',
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(code: number, fallbackMessage?: string): string {
  return ERROR_MESSAGES[code] || fallbackMessage || 'An unexpected error occurred. Please try again';
}

/**
 * Check if error requires logout (session expired, account locked)
 */
export function requiresLogout(code: number): boolean {
  return [
    ErrorCode.SESSION_EXPIRED,
    ErrorCode.ACCOUNT_LOCKED,
  ].includes(code);
}

/**
 * Check if error should be displayed prominently
 */
export function isCriticalError(code: number): boolean {
  return [
    ErrorCode.ACCOUNT_LOCKED,
    ErrorCode.SESSION_EXPIRED,
    ErrorCode.INTERNAL_ERROR,
    ErrorCode.DATAVERSE_ERROR,
  ].includes(code);
}
