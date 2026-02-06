/**
 * Account Constants
 *
 * This file contains all constant values used across the Account module.
 * These constants are derived from the Dataverse Table Account.csv schema and business requirements.
 * Values are aligned with global enums for consistency across the system.
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

// Essential modules integration
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  AccountStatus,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

// ========================================
// ACCOUNT GROUP CONSTANTS
// ========================================

/**
 * Account group values based on Dataverse Choices_Account_Group
 * Aligned with global AccountGroup enum
 */
export const ACCOUNT_GROUPS = {
  OTHER: 0,
  OCCUPATIONAL_THERAPIST: 1,
  OCCUPATIONAL_THERAPIST_ASSISTANT: 2,
  VENDOR_ADVERTISER: 3,
} as const;

/**
 * Account group display labels
 */
export const ACCOUNT_GROUPS_LABELS = {
  [ACCOUNT_GROUPS.OTHER]: 'Other',
  [ACCOUNT_GROUPS.OCCUPATIONAL_THERAPIST]:
    'Occupational Therapist (includes student, new grad or retired/resigned)',
  [ACCOUNT_GROUPS.OCCUPATIONAL_THERAPIST_ASSISTANT]:
    'Occupational Therapist Assistant (includes student, new grad or retired)',
  [ACCOUNT_GROUPS.VENDOR_ADVERTISER]: 'Vendor / Advertiser',
} as const;

// ========================================
// ACCOUNT STATUS CONSTANTS
// ========================================

/**
 * Account status values based on Dataverse Choices_Status
 * Aligned with global AccountStatus enum
 */
export const ACCOUNT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  PENDING: 3,
} as const;

/**
 * Account status display labels
 */
export const ACCOUNT_STATUS_LABELS = {
  [ACCOUNT_STATUS.ACTIVE]: 'Active',
  [ACCOUNT_STATUS.INACTIVE]: 'Inactive',
  [ACCOUNT_STATUS.PENDING]: 'Pending',
} as const;

/**
 * Default account status
 */
export const DEFAULT_ACCOUNT_STATUS = ACCOUNT_STATUS.PENDING;

// ========================================
// ACCESS MODIFIERS CONSTANTS
// ========================================

/**
 * Access modifier values based on Dataverse Choices_Access_Modifiers
 * Aligned with global AccessModifier enum
 */
export const ACCESS_MODIFIERS = {
  PUBLIC: 1,
  PROTECTED: 2,
  PRIVATE: 3,
} as const;

/**
 * Access modifier display labels
 */
export const ACCESS_MODIFIERS_LABELS = {
  [ACCESS_MODIFIERS.PUBLIC]: 'Public',
  [ACCESS_MODIFIERS.PROTECTED]: 'Protected',
  [ACCESS_MODIFIERS.PRIVATE]: 'Private',
} as const;

/**
 * Default access modifier
 */
export const DEFAULT_ACCESS_MODIFIER = ACCESS_MODIFIERS.PRIVATE;

// ========================================
// PRIVILEGES CONSTANTS
// ========================================

/**
 * Privilege levels based on Dataverse Choices_Privilege
 * Aligned with global Privilege enum
 */
export const PRIVILEGES = {
  OWNER: 1,
  ADMIN: 2,
  MAIN: 3,
} as const;

/**
 * Privilege display labels
 */
export const PRIVILEGES_LABELS = {
  [PRIVILEGES.OWNER]: 'Owner',
  [PRIVILEGES.ADMIN]: 'Admin',
  [PRIVILEGES.MAIN]: 'Main',
} as const;

/**
 * Default privilege level
 */
export const DEFAULT_PRIVILEGE = PRIVILEGES.OWNER;

// ========================================
// VALIDATION CONSTANTS
// ========================================

/**
 * Field length limits based on Dataverse Table Account.csv schema
 */
export const ACCOUNT_FIELD_LIMITS = {
  ACCOUNT_ID: 850, // Autonumber with prefix (osot-0000001)
  LAST_NAME: 255,
  FIRST_NAME: 255,
  MOBILE_PHONE: 14,
  EMAIL: 255,
  PASSWORD: 255,
} as const;

/**
 * Validation patterns for account fields
 */
export const ACCOUNT_VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Canadian phone format: (XXX) XXX-XXXX - exactly 14 characters
  PHONE: /^\(\d{3}\) \d{3}-\d{4}$/,
  // Canadian date format: YYYY-MM-DD
  DATE_OF_BIRTH: /^\d{4}-\d{2}-\d{2}$/,
  // Password strength (minimum 8 chars, at least 1 upper, 1 lower, 1 number)
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  // Account ID format: osot-0000001
  ACCOUNT_ID: /^osot-\d{7}$/,
} as const;

/**
 * Autonumber configuration for Account ID
 */
export const ACCOUNT_ID_CONFIG = {
  PREFIX: 'osot',
  SEPARATOR: '-',
  MIN_DIGITS: 7,
  SEED_VALUE: 1,
  PREVIEW_FORMAT: 'osot-0000001',
} as const;

// ========================================
// DATAVERSE FIELD MAPPINGS
// ========================================

/**
 * Account field mappings to Dataverse schema names
 * Based on Table Account.csv structure
 */
export const ACCOUNT_FIELDS = {
  // Primary Key & System Fields
  ACCOUNT_ID: 'osot_account_id', // Autonumber: osot-0000001
  TABLE_ACCOUNT_ID: 'osot_table_accountid', // Primary key GUID

  // System Audit Fields
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',

  // Organization Context (Multi-Tenant)
  ORGANIZATION: 'osot_Organization', // Lookup to osot_table_organization

  // Personal Information Fields (Business Required)
  LAST_NAME: 'osot_last_name', // Business required, max 255
  FIRST_NAME: 'osot_first_name', // Business required, max 255
  DATE_OF_BIRTH: 'osot_date_of_birth', // Business required, Date only

  // Contact Information Fields (Business Required)
  MOBILE_PHONE: 'osot_mobile_phone', // Business required, max 14
  EMAIL: 'osot_email', // Business required, max 255
  PASSWORD: 'osot_password', // Business required, max 255

  // Account Configuration Fields
  ACCOUNT_GROUP: 'osot_account_group', // Business required, Choice
  ACCOUNT_DECLARATION: 'osot_account_declaration', // Business required, Yes/No

  // Account Status Fields (Optional)
  ACCOUNT_STATUS: 'osot_account_status', // Optional, Choice, default: Pending
  ACTIVE_MEMBER: 'osot_active_member', // Optional, Yes/No, default: No

  // Access Control Fields (Optional)
  ACCESS_MODIFIERS: 'osot_access_modifiers', // Optional, Choice, default: Private
  PRIVILEGE: 'osot_privilege', // Optional, Choice, default: Owner
} as const;

// ========================================
// ODATA CONFIGURATION
// ========================================

/**
 * OData configuration for Account Dataverse operations
 */
export const ACCOUNT_ODATA = {
  // Table Configuration
  TABLE_NAME: 'osot_table_accounts',
  ENTITY_SET_NAME: 'osot_table_accounts',
  ENTITY_TYPE_NAME: 'osot_table_account',

  // Primary Key Field
  PRIMARY_KEY: 'osot_table_accountid',

  // Relationship Navigation
  RELATIONSHIPS: {
    OWNER: 'ownerid',
    ORGANIZATION: '_osot_table_organization_value', // Dataverse lookup field (note: Table_ in name)
  },

  // OData Binding for Relationships
  ORGANIZATION_BIND: 'osot_Table_Organization@odata.bind', // Format: /osot_table_organizations(guid)

  // Standard OData Query Options
  DEFAULT_SELECT: [
    ACCOUNT_FIELDS.ACCOUNT_ID,
    ACCOUNT_FIELDS.TABLE_ACCOUNT_ID,
    '_osot_table_organization_value', // Organization lookup GUID
    ACCOUNT_FIELDS.FIRST_NAME,
    ACCOUNT_FIELDS.LAST_NAME,
    ACCOUNT_FIELDS.DATE_OF_BIRTH,
    ACCOUNT_FIELDS.MOBILE_PHONE,
    ACCOUNT_FIELDS.EMAIL,
    ACCOUNT_FIELDS.ACCOUNT_GROUP,
    ACCOUNT_FIELDS.ACCOUNT_DECLARATION,
    ACCOUNT_FIELDS.ACCOUNT_STATUS,
    ACCOUNT_FIELDS.ACTIVE_MEMBER,
    ACCOUNT_FIELDS.ACCESS_MODIFIERS,
    ACCOUNT_FIELDS.PRIVILEGE,
    ACCOUNT_FIELDS.CREATED_ON,
    ACCOUNT_FIELDS.MODIFIED_ON,
  ].join(','),

  // Select without sensitive fields (for public endpoints)
  PUBLIC_SELECT: [
    ACCOUNT_FIELDS.ACCOUNT_ID,
    ACCOUNT_FIELDS.FIRST_NAME,
    ACCOUNT_FIELDS.LAST_NAME,
    ACCOUNT_FIELDS.ACCOUNT_GROUP,
    ACCOUNT_FIELDS.ACCOUNT_STATUS,
    ACCOUNT_FIELDS.ACTIVE_MEMBER,
    ACCOUNT_FIELDS.CREATED_ON,
  ].join(','),

  // Expand Options for Related Data
  DEFAULT_EXPAND: '',
} as const;

// ========================================
// DEFAULT VALUES
// ========================================

/**
 * Default values for Account creation
 * Based on Dataverse table schema defaults
 */
export const ACCOUNT_DEFAULTS = {
  ACCOUNT_STATUS: AccountStatus.PENDING,
  ACCESS_MODIFIERS: AccessModifier.PRIVATE,
  PRIVILEGE: Privilege.OWNER,
  ACCOUNT_DECLARATION: false,
  ACTIVE_MEMBER: false,
} as const;

// ========================================
// ERROR HANDLING INTEGRATION
// ========================================

/**
 * Integration with centralized error handling system
 *
 * This module uses the centralized error handling system located in common/errors:
 * - ErrorCodes: Standardized error codes across the application
 * - ErrorMessages: Centralized error message management with public/log variants
 * - AppError: Standard error class for application errors
 * - error.factory: Factory for creating standardized errors
 *
 * Usage example in services:
 * ```typescript
 * import { createAppError } from '../../../../common/errors/error.factory';
 * import { ACCOUNT_ERROR_CODES } from '../constants/account.constants';
 *
 * if (existingAccount) {
 *   throw createAppError(ACCOUNT_ERROR_CODES.EMAIL_EXISTS, { email });
 * }
 * ```
 */
export const ACCOUNT_ERROR_HANDLING = {
  USES_CENTRALIZED_SYSTEM: true,
  ERROR_FACTORY_PATH: '../../../../common/errors/error.factory',
  APP_ERROR_PATH: '../../../../common/errors/app-error',
  ERROR_CODES_PATH: '../../../../common/errors/error-codes',
} as const;

// ========================================
// ERROR CODES MAPPING
// ========================================

/**
 * Account-specific error codes
 * Uses existing ErrorCodes enum from centralized error handling system
 * The error messages are handled by the centralized ErrorMessages in common/errors
 */
export const ACCOUNT_ERROR_CODES = {
  EMAIL_EXISTS: ErrorCodes.ACCOUNT_EMAIL_EXISTS,
  PHONE_EXISTS: ErrorCodes.ACCOUNT_PHONE_EXISTS,
  NOT_FOUND: ErrorCodes.ACCOUNT_NOT_FOUND,
  PERMISSION_DENIED: ErrorCodes.PERMISSION_DENIED,
  VALIDATION_ERROR: ErrorCodes.VALIDATION_ERROR,
  DATAVERSE_ERROR: ErrorCodes.DATAVERSE_SERVICE_ERROR,
  INTERNAL_ERROR: ErrorCodes.INTERNAL_ERROR,
  INVALID_CREDENTIALS: ErrorCodes.INVALID_CREDENTIALS,
  ACCOUNT_LOCKED: ErrorCodes.ACCOUNT_LOCKED,
  INSUFFICIENT_PRIVILEGE: ErrorCodes.ACCOUNT_INSUFFICIENT_PRIVILEGE,
  INVALID_STATUS: ErrorCodes.ACCOUNT_INVALID_STATUS,
  SESSION_EXPIRED: ErrorCodes.ACCOUNT_SESSION_EXPIRED,
  DUPLICATE: ErrorCodes.ACCOUNT_DUPLICATE,
  REGISTRATION_EXPIRED: ErrorCodes.ACCOUNT_REGISTRATION_EXPIRED,
  // Input validation specific to account
  INVALID_EMAIL: ErrorCodes.INVALID_EMAIL_FORMAT,
  INVALID_PHONE: ErrorCodes.INVALID_PHONE_FORMAT,
  WEAK_PASSWORD: ErrorCodes.INVALID_PASSWORD_STRENGTH,
  INVALID_NAME: ErrorCodes.INVALID_NAME_FORMAT,
} as const;

// ========================================
// SUCCESS MESSAGES
// ========================================

/**
 * Standard success messages for account operations
 * Note: Error messages are handled by the centralized ErrorMessages system
 */
export const ACCOUNT_SUCCESS_MESSAGES = {
  CREATED: 'Account created successfully',
  UPDATED: 'Account updated successfully',
  DELETED: 'Account deleted successfully',
  VALIDATED: 'Account validated successfully',
  STATUS_CHANGED: 'Account status changed successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  PHONE_VERIFIED: 'Phone number verified successfully',
} as const;

// ========================================
// CACHE CONSTANTS
// ========================================

/**
 * Cache keys for account data
 */
export const ACCOUNT_CACHE_KEYS = {
  PREFIX: 'account:',
  BY_ID: 'account:id:',
  BY_EMAIL: 'account:email:',
  BY_PHONE: 'account:phone:',
  BY_GROUP: 'account:group:',
  BY_STATUS: 'account:status:',
  STATISTICS: 'account:statistics',
  GROUPS: 'account:groups',
  STATUSES: 'account:statuses',
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const ACCOUNT_CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  EMAIL_VERIFICATION_TIMEOUT: 86400, // 24 hours
  PASSWORD_RESET_TIMEOUT: 3600, // 1 hour
} as const;

// ========================================
// BUSINESS RULES CONSTANTS
// ========================================

/**
 * Business rule constants for account management
 */
export const ACCOUNT_BUSINESS_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION: 3600, // 1 hour in seconds
  SESSION_TIMEOUT: 1800, // 30 minutes in seconds
  EMAIL_VERIFICATION_TIMEOUT: 86400, // 24 hours in seconds
  PASSWORD_RESET_TIMEOUT: 3600, // 1 hour in seconds
  MIN_AGE: 16, // Minimum age requirement
  MAX_AGE: 120, // Maximum realistic age
} as const;

// ========================================
// API CONSTANTS
// ========================================

/**
 * API route prefixes for account endpoints
 */
export const ACCOUNT_API_ROUTES = {
  PUBLIC: 'public/account',
  PRIVATE: 'private/account',
  AUTH: 'auth/account',
} as const;

/**
 * Default pagination settings
 */
export const ACCOUNT_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// ========================================
// ENUM INTEGRATION FLAGS
// ========================================

/**
 * Integration flags for centralized enum usage
 * Helps identify which enums are used by Account module
 */
export const ACCOUNT_ENUM_INTEGRATION = {
  USES_ACCOUNT_GROUP_ENUM: true,
  USES_ACCOUNT_STATUS_ENUM: true,
  USES_ACCESS_MODIFIER_ENUM: true,
  USES_PRIVILEGE_ENUM: true,
  USES_GENDER_ENUM: false, // Not in Account table
  USES_COUNTRY_ENUM: false, // Not in Account table
  USES_PROVINCE_ENUM: false, // Not in Account table
} as const;

// ========================================
// UTILITY INTEGRATION FLAGS
// ========================================

/**
 * Integration flags for centralized utilities
 * Indicates which utils can be used by Account module
 */
export const ACCOUNT_UTILS_INTEGRATION = {
  USES_DATAVERSE_HELPER: true,
  USES_BUSINESS_RULES: true,
  USES_USER_DECORATOR: true,
  USES_PHONE_FORMATTER: true, // Account handles phone numbers
  USES_JWT_UTILS: true, // Account is central to authentication
  CAN_USE_URL_SANITIZER: false, // Account doesn't handle URLs directly
} as const;

// ========================================
// TYPE EXPORTS
// ========================================

/**
 * Type definitions for constants
 */
export type AccountGroupType =
  (typeof ACCOUNT_GROUPS)[keyof typeof ACCOUNT_GROUPS];
export type AccountStatusType =
  (typeof ACCOUNT_STATUS)[keyof typeof ACCOUNT_STATUS];
export type AccessModifierType =
  (typeof ACCESS_MODIFIERS)[keyof typeof ACCESS_MODIFIERS];
export type PrivilegeType = (typeof PRIVILEGES)[keyof typeof PRIVILEGES];

// ========================================
// SECURITY CONSTANTS
// ========================================

/**
 * Security-related constants for account operations
 */
export const ACCOUNT_SECURITY = {
  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 255,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBERS: true,
  PASSWORD_REQUIRE_SPECIAL: false,

  // Account lockout
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 3600, // 1 hour

  // Session management
  JWT_EXPIRATION: '1h',
  REFRESH_TOKEN_EXPIRATION: '7d',

  // Rate limiting
  LOGIN_RATE_LIMIT: 5, // attempts per minute
  REGISTRATION_RATE_LIMIT: 3, // attempts per minute
} as const;

/**
 * Sensitive fields that should not be returned in responses
 */
export const ACCOUNT_SENSITIVE_FIELDS = [ACCOUNT_FIELDS.PASSWORD] as const;

/**
 * Fields that can be searched publicly
 */
export const ACCOUNT_SEARCHABLE_FIELDS = [
  ACCOUNT_FIELDS.FIRST_NAME,
  ACCOUNT_FIELDS.LAST_NAME,
  ACCOUNT_FIELDS.ACCOUNT_GROUP,
  ACCOUNT_FIELDS.ACCOUNT_STATUS,
] as const;

/**
 * Fields that require special permissions to view
 */
export const ACCOUNT_PROTECTED_FIELDS = [
  ACCOUNT_FIELDS.EMAIL,
  ACCOUNT_FIELDS.MOBILE_PHONE,
  ACCOUNT_FIELDS.DATE_OF_BIRTH,
] as const;
