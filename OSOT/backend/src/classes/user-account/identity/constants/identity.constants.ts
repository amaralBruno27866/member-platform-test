/**
 * Identity Module Constants
 *
 * Centraliza valores de configuração, timeouts, cache keys e outros constants
 * específicos para operações de identity no OSOT Dataverse API
 */

import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { Language } from '../../../../common/enums/language-choice.enum';
import { IndigenousDetail } from '../../../../common/enums/indigenous-detail.enum';
import { ErrorCodes } from '../../../../common/errors/error-codes';

// Cache Configuration
export const IDENTITY_CACHE_KEYS = {
  IDENTITY_BY_ID: (identityId: string) => `identity:${identityId}`,
  IDENTITY_BY_USER_BUSINESS_ID: (businessId: string) =>
    `identity:business_id:${businessId}`,
  IDENTITY_BY_ACCOUNT_ID: (accountId: string) =>
    `identity:account:${accountId}`,
  IDENTITY_PRIVILEGE: (identityId: string) =>
    `identity:privilege:${identityId}`,
  IDENTITY_STATUS: (identityId: string) => `identity:status:${identityId}`,
  IDENTITY_SEARCH: (query: string) => `identity:search:${query}`,
} as const;

// Cache TTL Values (in seconds)
export const IDENTITY_CACHE_TTL = {
  DEFAULT: 3600, // 1 hour
  PRIVILEGE: 1800, // 30 minutes (security-sensitive)
  STATUS: 900, // 15 minutes (frequently changing)
  SEARCH: 300, // 5 minutes (dynamic results)
} as const;

// Default Values (based on Table Identity.csv)
export const IDENTITY_DEFAULTS = {
  PRIVILEGE: Privilege.OWNER, // Owner (from Privilege enum)
  ACCESS_MODIFIER: AccessModifier.PRIVATE, // Private (from AccessModifier enum)
  LANGUAGE: Language.ENGLISH.toString(), // English as string (Dataverse multiple choice format)
  LANGUAGE_ARRAY: [Language.ENGLISH], // Internal array representation for UI/validation
  GENDER: null, // None (from CSV - Optional field)
  RACE: null, // None (from CSV - Optional field)
  INDIGENOUS: false, // No = 0 (from CSV)
  DISABILITY: false, // No = 0 (from CSV)
  TIMEZONE: 'America/Toronto',
} as const;

// Validation Limits (based on Table Identity.csv)
export const IDENTITY_LIMITS = {
  USER_BUSINESS_ID_MAX_LENGTH: 20, // From CSV
  CHOSEN_NAME_MAX_LENGTH: 255, // From CSV
  OTHER_LANGUAGE_MAX_LENGTH: 255, // From CSV
  INDIGENOUS_DETAIL_OTHER_MAX_LENGTH: 100, // From CSV
  SEARCH_MIN_LENGTH: 2,
  LANGUAGES_MAX_SELECTIONS: 10, // Maximum number of languages a user can select
  LANGUAGES_MIN_SELECTIONS: 1, // At least one language must be selected (business required)
} as const;

// Rate Limiting
export const IDENTITY_RATE_LIMITS = {
  IDENTITY_CREATION: 10, // Max identity creations per hour per IP
  IDENTITY_UPDATE: 30, // Max identity updates per hour
  SEARCH_REQUESTS: 100, // Max search requests per minute
  VERIFICATION_ATTEMPTS: 5, // Max verification attempts per hour
} as const;

// Identity Field Patterns
export const IDENTITY_PATTERNS = {
  // Canadian Social Insurance Number (SIN): 123-456-789 or 123456789
  CANADIAN_SIN: /^(\d{3}-?\d{3}-?\d{3})$/,
  // User Business ID (alphanumeric, up to 20 chars)
  USER_BUSINESS_ID: /^[A-Za-z0-9\-_]{1,20}$/,
  // Name validation (letters, spaces, hyphens, apostrophes, dots)
  NAME: /^[a-zA-Z\s\-'.]+$/,
  // Languages validation (array of numbers representing language enum values)
  LANGUAGES_ARRAY: /^\[(\d+)(,\d+)*\]$/, // Matches array format like [13] or [13,18,6]
} as const;

// Identity Error Codes (using ErrorCodes enum for consistency)
export const IDENTITY_ERROR_CODES = {
  // Not Found Errors
  IDENTITY_NOT_FOUND: ErrorCodes.NOT_FOUND,

  // Validation Errors
  INVALID_USER_BUSINESS_ID: ErrorCodes.INVALID_INPUT,
  INVALID_LANGUAGE_SELECTION: ErrorCodes.INVALID_INPUT,
  INVALID_GENDER_CHOICE: ErrorCodes.INVALID_INPUT,
  INVALID_RACE_CHOICE: ErrorCodes.INVALID_INPUT,
  INVALID_INDIGENOUS_DETAIL: ErrorCodes.INVALID_INPUT,

  // Business Rule Violations
  DUPLICATE_USER_BUSINESS_ID: ErrorCodes.BUSINESS_RULE_VIOLATION,
  INVALID_ACCOUNT_BINDING: ErrorCodes.BUSINESS_RULE_VIOLATION,
  LANGUAGE_SELECTION_REQUIRED: ErrorCodes.BUSINESS_RULE_VIOLATION,
  TOO_MANY_LANGUAGES_SELECTED: ErrorCodes.BUSINESS_RULE_VIOLATION,

  // Permission Errors
  INSUFFICIENT_PRIVILEGE: ErrorCodes.PERMISSION_DENIED,
  IDENTITY_ACCESS_DENIED: ErrorCodes.FORBIDDEN,

  // Integration Errors
  DATAVERSE_IDENTITY_ERROR: ErrorCodes.DATAVERSE_SERVICE_ERROR,
  REDIS_CACHE_ERROR: ErrorCodes.REDIS_SERVICE_ERROR,
} as const;

// Scheduler Configuration
export const IDENTITY_SCHEDULER = {
  VERIFICATION_REMINDER_INTERVAL: '0 */6 * * *', // Every 6 hours
  CLEANUP_INTERVAL: '0 3 * * *', // Daily at 3 AM
  SYNC_INTERVAL: '0 */2 * * *', // Every 2 hours
  VERIFICATION_TIMEOUT: 86400, // 24 hours in seconds
} as const;

// Email Configuration
export const IDENTITY_EMAILS = {
  IDENTITY_VERIFICATION: 'identity-verification',
  VERIFICATION_REMINDER: 'verification-reminder',
  IDENTITY_UPDATED: 'identity-updated',
  DOCUMENT_REQUIRED: 'document-required',
} as const;

// Event Types
export const IDENTITY_EVENTS = {
  CREATED: 'identity.created',
  UPDATED: 'identity.updated',
  DELETED: 'identity.deleted',
  VERIFIED: 'identity.verified',
  VERIFICATION_FAILED: 'identity.verification.failed',
  DOCUMENT_UPLOADED: 'identity.document.uploaded',
  PRIVILEGE_CHANGED: 'identity.privilege.changed',
} as const;

// Dataverse App Selection
export const IDENTITY_DATAVERSE_APPS = {
  MAIN: 'main',
  OWNER: 'owner',
  ADMIN: 'admin',
  VERIFICATION: 'verification',
} as const;

// Dataverse Field Names (based on Table Identity.csv)
export const IDENTITY_FIELDS = {
  IDENTITY_ID: 'osot_Identity_ID',
  TABLE_IDENTITY_ID: 'osot_Table_IdentityId',
  TABLE_ACCOUNT: 'osot_Table_Account',
  USER_BUSINESS_ID: 'osot_User_Business_ID',
  CHOSEN_NAME: 'osot_Chosen_Name',
  LANGUAGE: 'osot_Language',
  OTHER_LANGUAGE: 'osot_Other_Language',
  GENDER: 'osot_Gender',
  RACE: 'osot_Race',
  INDIGENOUS: 'osot_Indigenous',
  INDIGENOUS_DETAIL: 'osot_Indigenous_Detail',
  INDIGENOUS_DETAIL_OTHER: 'osot_Indigenous_Detail_Other',
  DISABILITY: 'osot_Disability',
  ACCESS_MODIFIERS: 'osot_Access_Modifiers',
  PRIVILEGE: 'osot_Privilege',
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',
} as const;

// Dataverse Choice Field Names (from CSV)
export const IDENTITY_CHOICE_FIELDS = {
  LANGUAGE: 'Choices_Languages',
  GENDER: 'Choices_Genders',
  RACE: 'Choices_Races',
  INDIGENOUS: 'Choices_Indigenous',
  ACCESS_MODIFIERS: 'Choices_Access_Modifiers',
  PRIVILEGE: 'Choices_Privilege',
} as const;

// Identity ID Auto-number Configuration (from CSV)
export const IDENTITY_AUTONUMBER = {
  PREFIX: 'osot-id',
  MIN_DIGITS: 7,
  SEED_VALUE: 1,
  PREVIEW_FORMAT: 'osot-id-0000001',
} as const;

// Business Rules (based on Table Identity.csv)
export const IDENTITY_BUSINESS_RULES = {
  REQUIRE_USER_BUSINESS_ID: true, // User Business ID is business required
  REQUIRE_LANGUAGE: true, // Language is business required (at least one selection)
  LANGUAGE_MULTIPLE_CHOICES: true, // Language field allows multiple selections
  DEFAULT_INDIGENOUS: false, // Default: No = 0
  DEFAULT_DISABILITY: false, // Default: No = 0
  DEFAULT_ACCESS_MODIFIER: AccessModifier.PRIVATE, // Default: Private (from AccessModifier enum)
  DEFAULT_PRIVILEGE: Privilege.OWNER, // Default: Owner (from Privilege enum)
  VALIDATE_USER_BUSINESS_ID_FORMAT: true, // Business ID format validation
  VALIDATE_CHOSEN_NAME: false, // Optional field
  VALIDATE_LANGUAGE_ARRAY: true, // Validate languages as array with min/max selections

  // Fields used for duplicate checking
  DUPLICATE_CHECK_FIELDS: [
    'osot_user_business_id',
    'osot_table_account', // Link to account
  ],

  // Fields that users can update (non-admin roles)
  USER_EDITABLE_FIELDS: [
    'osot_chosen_name',
    'osot_language',
    'osot_gender',
    'osot_race',
    'osot_indigenous',
    'osot_indigenous_detail',
    'osot_indigenous_detail_other',
    'osot_disability',
  ],

  // Fields that only admins/internal systems can modify
  RESTRICTED_FIELDS: [
    'osot_privilege',
    'osot_access_modifiers', // Internal control - users cannot modify
    'osot_user_business_id', // Set at creation, cannot be changed
    'osot_table_account', // Link to account, cannot be changed by user
    'osot_table_identityid',
    'osot_identity_id',
    'createdon',
    'modifiedon',
    'ownerid',
  ],
} as const;

// Dataverse OData Configuration
export const IDENTITY_ODATA = {
  TABLE_NAME: 'osot_table_identities',
  SELECT_FIELDS: [
    'osot_identity_id',
    'osot_table_identityid',
    'osot_user_business_id',
    'osot_chosen_name',
    'osot_language',
    'osot_other_language',
    'osot_gender',
    'osot_race',
    'osot_indigenous',
    'osot_indigenous_detail',
    'osot_indigenous_detail_other',
    'osot_disability',
    'osot_access_modifiers',
    'osot_privilege',
    '_osot_table_account_value', // Account relationship GUID for cache invalidation
    'createdon',
    'modifiedon',
    'ownerid',
  ],
  EXPAND_FIELDS: [
    'osot_table_account($select=osot_account_id,osot_first_name,osot_last_name)',
  ],

  // Individual field mappings for OData queries (using correct Dataverse logical names)
  ID: 'osot_identity_id',
  TABLE_ID: 'osot_table_identityid',
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',
  ACCOUNT_LOOKUP: 'osot_table_account', // Lookup field for account relationships
  USER_BUSINESS_ID: 'osot_user_business_id', // Correct logical name from CSV
  CHOSEN_NAME: 'osot_chosen_name',
  LANGUAGE: 'osot_language',
  OTHER_LANGUAGE: 'osot_other_language',
  GENDER: 'osot_gender',
  RACE: 'osot_race',
  INDIGENOUS: 'osot_indigenous',
  INDIGENOUS_DETAIL: 'osot_indigenous_detail',
  INDIGENOUS_DETAIL_OTHER: 'osot_indigenous_detail_other',
  DISABILITY: 'osot_disability',
  ACCESS_MODIFIERS: 'osot_access_modifiers',
  PRIVILEGE: 'osot_privilege',
} as const;

// Identity Types (for categorization)
export const IDENTITY_TYPES = {
  INDIVIDUAL: 'individual',
  PROFESSIONAL: 'professional',
  STUDENT: 'student',
  ASSOCIATE: 'associate',
} as const;

// Verification Status
export const IDENTITY_VERIFICATION_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
} as const;

// Document Types for Identity Verification
export const IDENTITY_DOCUMENT_TYPES = {
  GOVERNMENT_ID: 'government_id',
  PASSPORT: 'passport',
  DRIVERS_LICENSE: 'drivers_license',
  HEALTH_CARD: 'health_card',
  SIN_DOCUMENT: 'sin_document',
  PROFESSIONAL_LICENSE: 'professional_license',
} as const;

// Language Field Helpers (for multiple choice handling)
export const IDENTITY_LANGUAGE_HELPERS = {
  // Dataverse format: string representation for multiple choice fields
  DATAVERSE: {
    ENGLISH_ONLY: Language.ENGLISH.toString(),
    FRENCH_ONLY: Language.FRENCH.toString(),
    BILINGUAL_EN_FR: `${Language.ENGLISH},${Language.FRENCH}`,
  },

  // Internal array format for UI/validation/business logic
  ARRAYS: {
    ENGLISH_ONLY: [Language.ENGLISH],
    FRENCH_ONLY: [Language.FRENCH],
    BILINGUAL_EN_FR: [Language.ENGLISH, Language.FRENCH],
  },

  // Validation functions (will be used in DTOs and services)
  MAX_LANGUAGES: 10,
  MIN_LANGUAGES: 1,

  // Conversion helpers
  arrayToDataverse: (languages: number[]): string => languages.sort().join(','),
  dataverseToArray: (languages: string): number[] =>
    languages ? languages.split(',').map((l) => parseInt(l.trim())) : [],

  // Default language sets
  DEFAULT_SINGLE: [Language.ENGLISH], // English only (internal format)
  DEFAULT_BILINGUAL: [Language.ENGLISH, Language.FRENCH], // English + French (internal format)
  DEFAULT_SINGLE_DATAVERSE: Language.ENGLISH.toString(), // English only (Dataverse format)
  DEFAULT_BILINGUAL_DATAVERSE: `${Language.ENGLISH},${Language.FRENCH}`, // English + French (Dataverse format)
} as const;

// Enum References (for easy access to common enum values)
export const IDENTITY_ENUM_VALUES = {
  // From Language enum (language-choice.enum.ts) - Multiple choices allowed
  LANGUAGES: {
    ENGLISH: Language.ENGLISH,
    FRENCH: Language.FRENCH,
    // Common bilingual combinations
    ENGLISH_FRENCH: [Language.ENGLISH, Language.FRENCH],
    // Add other common languages as needed
  },
  // From AccessModifier enum (access-modifier.enum.ts)
  ACCESS_MODIFIERS: {
    PUBLIC: AccessModifier.PUBLIC,
    PROTECTED: AccessModifier.PROTECTED,
    PRIVATE: AccessModifier.PRIVATE,
  },
  // From Privilege enum (privilege.enum.ts)
  PRIVILEGES: {
    OWNER: Privilege.OWNER,
    ADMIN: Privilege.ADMIN,
    MAIN: Privilege.MAIN,
  },
  // From IndigenousDetail enum (indigenous-detail.enum.ts)
  INDIGENOUS_DETAILS: {
    OTHER: IndigenousDetail.OTHER,
    FIRST_NATIONS: IndigenousDetail.FIRST_NATIONS,
    INUIT: IndigenousDetail.INUIT,
    METIS: IndigenousDetail.METIS,
  },
} as const;

// Export all constants as a single object for easy importing
export const IDENTITY_CONSTANTS = {
  CACHE_KEYS: IDENTITY_CACHE_KEYS,
  CACHE_TTL: IDENTITY_CACHE_TTL,
  DEFAULTS: IDENTITY_DEFAULTS,
  LIMITS: IDENTITY_LIMITS,
  RATE_LIMITS: IDENTITY_RATE_LIMITS,
  PATTERNS: IDENTITY_PATTERNS,
  ERROR_CODES: IDENTITY_ERROR_CODES,
  SCHEDULER: IDENTITY_SCHEDULER,
  EMAILS: IDENTITY_EMAILS,
  EVENTS: IDENTITY_EVENTS,
  DATAVERSE_APPS: IDENTITY_DATAVERSE_APPS,
  FIELDS: IDENTITY_FIELDS,
  CHOICE_FIELDS: IDENTITY_CHOICE_FIELDS,
  AUTONUMBER: IDENTITY_AUTONUMBER,
  BUSINESS_RULES: IDENTITY_BUSINESS_RULES,
  ODATA: IDENTITY_ODATA,
  TYPES: IDENTITY_TYPES,
  VERIFICATION_STATUS: IDENTITY_VERIFICATION_STATUS,
  DOCUMENT_TYPES: IDENTITY_DOCUMENT_TYPES,
  LANGUAGE_HELPERS: IDENTITY_LANGUAGE_HELPERS,
  ENUM_VALUES: IDENTITY_ENUM_VALUES,
} as const;
