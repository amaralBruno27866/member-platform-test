/**
 * API Error Response Types
 * Based on backend error handling system
 */

export interface ApiErrorResponse {
  code: number;
  message: string;
}

export class ApiError extends Error {
  code: number;
  originalMessage: string;

  constructor(code: number, message: string) {
    super(message);
    this.code = code;
    this.originalMessage = message;
    this.name = 'ApiError';
  }
}

// Error code ranges
export enum ErrorCategory {
  ACCOUNT = '1xxx',
  VALIDATION = '2xxx',
  PERMISSION = '3xxx',
  EXTERNAL_SERVICE = '4xxx',
  APPLICATION = '5xxx',
  EDUCATION = '51xx',
}

// Specific error codes (from backend)
export enum ErrorCode {
  // Account errors (1000-1999)
  ACCOUNT_NOT_FOUND = 1001,
  ACCOUNT_DUPLICATE = 1002,
  INVALID_CREDENTIALS = 1003,
  EMAIL_IN_USE = 1004,
  PHONE_IN_USE = 1005,
  ACCOUNT_LOCKED = 1006,
  SESSION_EXPIRED = 1007,
  INSUFFICIENT_PRIVILEGE = 1008,
  INVALID_ACCOUNT_STATUS = 1009,
  REGISTRATION_EXPIRED = 1010,

  // Validation errors (2000-2999)
  INVALID_INPUT = 2001,
  INVALID_EMAIL = 2002,
  INVALID_PHONE = 2003,
  INVALID_POSTAL_CODE = 2004,
  INVALID_PASSWORD = 2005,
  INVALID_NAME = 2006,
  INVALID_SEARCH = 2007,

  // Permission errors (3000-3999)
  PERMISSION_DENIED = 3001,
  CONFLICT = 3002,
  VALIDATION_ERROR = 3003,
  BUSINESS_RULE_VIOLATION = 3004,

  // External service errors (4000-4999)
  EXTERNAL_SERVICE_ERROR = 4001,
  DATAVERSE_ERROR = 4002,
  REDIS_ERROR = 4003,
  EMAIL_SERVICE_ERROR = 4004,

  // Application errors (5000-5999)
  NOT_FOUND = 5001,
  INTERNAL_ERROR = 5002,
  FORBIDDEN = 5003,

  // Education errors (5100-5199)
  EDUCATION_NOT_FOUND = 5101,
  INVALID_EDUCATION_CATEGORY = 5102,
  EDUCATION_INCOMPLETE = 5103,
}
