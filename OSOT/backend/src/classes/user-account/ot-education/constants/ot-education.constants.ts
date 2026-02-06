/**
 * OT Education Constants
 *
 * Domain-specific constants for Occupational Therapy Education management.
 * Includes default values, validation rules, cache keys, and business constraints.
 */

import {
  CotoStatus,
  DegreeType,
  Country,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

// =============================================================================
// DEFAULT VALUES (Based on CSV Schema Defaults)
// =============================================================================

export const OT_EDUCATION_DEFAULTS = {
  // Core Education Defaults
  COTO_STATUS: CotoStatus.OTHER, // CSV shows "None" but enum uses OTHER
  DEGREE_TYPE: DegreeType.MASTERS,
  COUNTRY: Country.CANADA,

  // Privacy & Access Defaults
  ACCESS_MODIFIER: AccessModifier.PRIVATE,
  PRIVILEGE: Privilege.OWNER,

  // University & Category Defaults
  UNIVERSITY: null, // No default university (user must select)
  GRADUATION_YEAR: null, // No default year (user must select)
  EDUCATION_CATEGORY: null, // Optional field, no default
} as const;

// =============================================================================
// VALIDATION CONSTRAINTS (Based on CSV Schema)
// =============================================================================

export const OT_EDUCATION_VALIDATION = {
  // Field Length Constraints
  USER_BUSINESS_ID: {
    MAX_LENGTH: 20,
    REQUIRED: true,
    PATTERN: /^[a-zA-Z0-9_-]+$/, // Alphanumeric with underscore/dash
  },

  COTO_REGISTRATION: {
    MAX_LENGTH: 8,
    REQUIRED: false,
    PATTERN: /^[A-Z0-9]+$/, // Uppercase alphanumeric format
  },

  OT_OTHER: {
    MAX_LENGTH: 100,
    REQUIRED: false,
    DESCRIPTION: 'Additional education details or notes',
  },

  // Business Rules
  REQUIRED_FIELDS: [
    'osot_user_business_id',
    'osot_coto_status',
    'osot_ot_degree_type',
    'osot_ot_university',
    'osot_ot_grad_year',
    'osot_ot_country',
  ] as const,

  OPTIONAL_FIELDS: [
    'osot_coto_registration',
    'osot_education_category',
    'osot_ot_other',
    'osot_access_modifiers',
    'osot_privilege',
  ] as const,
} as const;

// =============================================================================
// AUTONUMBER GENERATION (Based on CSV Schema)
// =============================================================================

export const OT_EDUCATION_AUTONUMBER = {
  PREFIX: 'osot-oted',
  MIN_DIGITS: 7,
  SEED_VALUE: 1,
  FORMAT_PATTERN: 'osot-oted-XXXXXXX', // e.g., osot-oted-0000001
  REGEX_VALIDATION: /^osot-oted-\d{7}$/,
} as const;

// =============================================================================
// CACHE KEYS (Following Project Patterns)
// =============================================================================

export const OT_EDUCATION_CACHE_KEYS = {
  // Entity Cache
  ENTITY_PREFIX: 'ot_education:',
  BY_ID: (id: string) => `ot_education:id:${id}`,
  BY_USER_BUSINESS_ID: (userBusinessId: string) =>
    `ot_education:user_business_id:${userBusinessId}`,
  BY_ACCOUNT: (accountId: string) => `ot_education:account:${accountId}`,

  // COTO Registration Cache
  COTO_REGISTRATION: (registration: string) =>
    `ot_education:coto:${registration}`,
  COTO_STATUS_CHECK: (userBusinessId: string) =>
    `ot_education:coto_status:${userBusinessId}`,

  // University & Graduation Analytics
  UNIVERSITY_STATS: (universityId: string) =>
    `ot_education:university_stats:${universityId}`,
  GRADUATION_YEAR_STATS: (year: string) =>
    `ot_education:grad_year_stats:${year}`,
  DEGREE_TYPE_DISTRIBUTION: 'ot_education:degree_distribution',

  // Search and Lookup Cache
  SEARCH_RESULTS: (query: string) => `ot_education:search:${query}`,
  LOOKUP_BY_CRITERIA: (criteria: string) => `ot_education:lookup:${criteria}`,
} as const;

// =============================================================================
// BUSINESS RULES & CONSTRAINTS
// =============================================================================

export const OT_EDUCATION_BUSINESS_RULES = {
  // COTO Registration Rules
  COTO: {
    REGISTRATION_LENGTH: 8,
    STATUS_REQUIRES_REGISTRATION: [
      CotoStatus.GENERAL,
      CotoStatus.PROVISIONAL_TEMPORARY,
    ], // Active statuses
    NO_REGISTRATION_STATUSES: [
      CotoStatus.OTHER,
      CotoStatus.STUDENT,
      CotoStatus.PENDING,
      CotoStatus.RESIGNED,
    ],
  },

  // University & Degree Validation
  UNIVERSITY: {
    CANADIAN_UNIVERSITIES_REQUIRE_CANADA: true,
    INTERNATIONAL_DEGREES_SUPPORTED: true,
    ACCREDITATION_VALIDATION: true,
  },

  // Graduation Year Business Logic
  GRADUATION_YEAR: {
    MIN_YEAR: 1950, // Reasonable historic minimum
    MAX_FUTURE_YEARS: 5, // Allow up to 5 years in future for planned graduation
    CURRENT_YEAR_VALIDATION: true,
  },

  // Privacy & Access Rules
  PRIVACY: {
    DEFAULT_PRIVATE: true,
    OWNER_ONLY_BY_DEFAULT: true,
    ALLOW_PUBLIC_EDUCATION_SHARING: false, // Privacy-first approach
  },
} as const;

// =============================================================================
// ERROR MESSAGES (Domain-Specific)
// =============================================================================

export const OT_EDUCATION_ERROR_MESSAGES = {
  // Validation Errors
  INVALID_USER_BUSINESS_ID:
    'User Business ID must be 20 characters or less and contain only alphanumeric characters, underscores, or dashes',
  INVALID_COTO_REGISTRATION:
    'COTO Registration must be 8 characters or less and contain only uppercase alphanumeric characters',
  INVALID_OT_OTHER:
    'Additional education details must be 100 characters or less',

  // Business Rule Errors
  COTO_STATUS_REGISTRATION_MISMATCH:
    'COTO Registration number is required when status is General or Provisional/Temporary',
  COTO_REGISTRATION_NOT_ALLOWED:
    'COTO Registration number should not be provided when status is Other, Student, Pending, or Resigned',
  DUPLICATE_USER_BUSINESS_ID:
    'User Business ID already exists for another OT Education record',
  DUPLICATE_COTO_REGISTRATION:
    'COTO Registration number already exists in the system',

  // University & Country Validation
  CANADIAN_UNIVERSITY_COUNTRY_MISMATCH:
    'Canadian universities should have Country set to Canada',
  INTERNATIONAL_DEGREE_VALIDATION_REQUIRED:
    'International degrees require additional validation',
  GRADUATION_YEAR_OUT_OF_RANGE:
    'Graduation year must be between 1950 and 5 years in the future',

  // Required Field Errors
  MISSING_REQUIRED_FIELDS: 'The following required fields are missing',
  INVALID_DEGREE_TYPE: 'Degree type must be a valid OT degree type',
  INVALID_UNIVERSITY: 'University must be selected from approved list',
  INVALID_GRADUATION_YEAR:
    'Graduation year must be selected from available options',

  // Entity Errors
  OT_EDUCATION_NOT_FOUND: 'OT Education record not found',
  OT_EDUCATION_ACCESS_DENIED: 'Access denied to OT Education record',
  OT_EDUCATION_UPDATE_FAILED: 'Failed to update OT Education record',
  OT_EDUCATION_DELETE_FAILED: 'Failed to delete OT Education record',
} as const;

// =============================================================================
// REDIS SESSION KEYS (For Orchestrator Workflows)
// =============================================================================

export const OT_EDUCATION_SESSION_KEYS = {
  // Session Prefixes
  STAGING_PREFIX: 'ot_education:staging:',
  VALIDATION_PREFIX: 'ot_education:validation:',
  CREATION_PREFIX: 'ot_education:creation:',

  // Session Generators
  STAGING_SESSION: (sessionId: string) => `ot_education:staging:${sessionId}`,
  VALIDATION_SESSION: (sessionId: string) =>
    `ot_education:validation:${sessionId}`,
  CREATION_SESSION: (sessionId: string) => `ot_education:creation:${sessionId}`,

  // Workflow Tracking
  WORKFLOW_PROGRESS: (sessionId: string) =>
    `ot_education:workflow:${sessionId}`,
  BULK_OPERATION: (batchId: string) => `ot_education:bulk:${batchId}`,

  // Session TTL (Time To Live)
  DEFAULT_TTL: 7200, // 2 hours in seconds
  VALIDATION_TTL: 3600, // 1 hour for validation sessions
  BULK_TTL: 14400, // 4 hours for bulk operations
} as const;

// =============================================================================
// ANALYTICS & REPORTING CONSTANTS
// =============================================================================

export const OT_EDUCATION_ANALYTICS = {
  // Demographic Categories
  DEMOGRAPHICS: {
    BY_UNIVERSITY: 'university_distribution',
    BY_DEGREE_TYPE: 'degree_type_distribution',
    BY_GRADUATION_YEAR: 'graduation_year_distribution',
    BY_COUNTRY: 'country_distribution',
    BY_COTO_STATUS: 'coto_status_distribution',
    BY_EDUCATION_CATEGORY: 'education_category_distribution',
  },

  // Statistical Groupings
  GROUPINGS: {
    RECENT_GRADUATES: 'last_5_years',
    CANADIAN_EDUCATION: 'canadian_institutions',
    INTERNATIONAL_EDUCATION: 'international_institutions',
    COTO_REGISTERED: 'coto_active_inactive',
    MASTERS_DEGREES: 'masters_level',
    DOCTORAL_DEGREES: 'doctoral_level',
  },

  // Privacy Aggregation
  PRIVACY_SAFE_ANALYTICS: {
    MIN_GROUP_SIZE: 5, // Minimum group size for privacy-safe analytics
    ANONYMIZE_SMALL_GROUPS: true,
    EXCLUDE_PRIVATE_RECORDS: true,
  },
} as const;

// =============================================================================
// INTEGRATION CONSTANTS
// =============================================================================

export const OT_EDUCATION_INTEGRATION = {
  // Account Integration
  ACCOUNT_RELATIONSHIP: 'osot_Account_to_OT_Education',
  ACCOUNT_FIELD: 'osot_table_account',

  // User Business ID Integration
  USER_BUSINESS_ID_FIELD: 'osot_user_business_id',
  USER_BUSINESS_ID_UNIQUE_CONSTRAINT: true,

  // Dataverse Integration
  DATAVERSE: {
    TABLE_NAME: 'osot_table_ot_educations',
    TABLE_SCHEMA: 'osot_Table_OT_Education',
    PRIMARY_KEY: 'osot_table_ot_educationid',
    AUTONUMBER_FIELD: 'osot_OT_Education_ID',
  },

  // API Integration
  API_ENDPOINTS: {
    BASE_PATH: '/ot-education',
    PUBLIC_PATH: '/public/ot-educations',
    PRIVATE_PATH: '/private/ot-educations',
  },
} as const;

// =============================================================================
// ODATA QUERY CONSTANTS
// =============================================================================

export const OT_EDUCATION_ODATA = {
  // Table Information
  TABLE_NAME: 'osot_table_ot_educations',
  TABLE_SCHEMA: 'osot_Table_OT_Education',
  PRIMARY_KEY: 'osot_table_ot_educationid',

  // Field Names (matching Dataverse schema exactly)
  EDUCATION_ID: 'osot_table_ot_educationid',
  AUTO_ID: 'osot_ot_education_id', // Dataverse retorna em lowercase
  ACCOUNT_LOOKUP: 'osot_table_account', // Lookup field for account relationships
  USER_BUSINESS_ID: 'osot_user_business_id',
  COTO_STATUS: 'osot_coto_status',
  COTO_REGISTRATION: 'osot_coto_registration',
  OT_DEGREE_TYPE: 'osot_ot_degree_type',
  OT_UNIVERSITY: 'osot_ot_university',
  OT_GRAD_YEAR: 'osot_ot_grad_year',
  EDUCATION_CATEGORY: 'osot_education_category',
  OT_COUNTRY: 'osot_ot_country',
  OT_OTHER: 'osot_ot_other',
  ACCESS_MODIFIERS: 'osot_access_modifiers',
  PRIVILEGE: 'osot_privilege',
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',

  // Select Fields for Queries
  SELECT_FIELDS: [
    'osot_table_ot_educationid',
    'osot_ot_education_id', // Campo autonumber em lowercase
    'osot_table_account',
    'osot_user_business_id',
    'osot_coto_status',
    'osot_coto_registration',
    'osot_ot_degree_type',
    'osot_ot_university',
    'osot_ot_grad_year',
    'osot_education_category',
    'osot_ot_country',
    'osot_ot_other',
    'osot_access_modifiers',
    'osot_privilege',
    'createdon',
    'modifiedon',
    'ownerid',
  ],

  // Lookup Fields
  LOOKUPS: {
    ACCOUNT: 'osot_table_account',
  },

  // OData Relationship Names
  RELATIONSHIPS: {
    ACCOUNT: 'osot_Account_to_OT_Education',
  },
} as const;

// =============================================================================
// TYPE DEFINITIONS FOR CONSTANTS
// =============================================================================

export type OtEducationDefaultsType = typeof OT_EDUCATION_DEFAULTS;
export type OtEducationValidationType = typeof OT_EDUCATION_VALIDATION;
export type OtEducationCacheKeysType = typeof OT_EDUCATION_CACHE_KEYS;
export type OtEducationBusinessRulesType = typeof OT_EDUCATION_BUSINESS_RULES;
export type OtEducationErrorMessagesType = typeof OT_EDUCATION_ERROR_MESSAGES;
export type OtEducationSessionKeysType = typeof OT_EDUCATION_SESSION_KEYS;
export type OtEducationAnalyticsType = typeof OT_EDUCATION_ANALYTICS;
export type OtEducationIntegrationType = typeof OT_EDUCATION_INTEGRATION;
