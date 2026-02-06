/**
 * OTA Education Constants
 *
 * Domain-specific constants for Occupational Therapy Assistant Education management.
 * Includes default values, validation rules, cache keys, and business constraints.
 */

import {
  DegreeType,
  Country,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

// =============================================================================
// DEFAULT VALUES (Based on CSV Schema Defaults)
// =============================================================================

export const OTA_EDUCATION_DEFAULTS = {
  // Core Education Defaults
  OTA_DEGREE_TYPE: DegreeType.DIPLOMA_CREDENTIAL, // CSV shows "Diploma/Credential" default
  OTA_COUNTRY: Country.CANADA, // CSV shows "Canada" as default

  // Work Declaration Default
  WORK_DECLARATION: false, // CSV shows "No" as default (0)

  // Privacy & Access Defaults
  ACCESS_MODIFIER: AccessModifier.PRIVATE, // CSV shows "Private" as default
  PRIVILEGE: Privilege.OWNER, // CSV shows "Owner" as default

  // College & Category Defaults
  OTA_COLLEGE: null, // CSV shows "None" default (user must select)
  OTA_GRAD_YEAR: null, // CSV shows "None" default (user must select)
  EDUCATION_CATEGORY: null, // CSV shows "None" default (optional field)
  OTA_OTHER: null, // Optional field, no default
} as const;

// =============================================================================
// VALIDATION CONSTRAINTS (Based on CSV Schema)
// =============================================================================

export const OTA_EDUCATION_VALIDATION = {
  // Field Length Constraints
  USER_BUSINESS_ID: {
    MAX_LENGTH: 20,
    REQUIRED: true,
    PATTERN: /^[a-zA-Z0-9_-]+$/, // Alphanumeric with underscore/dash
  },

  OTA_OTHER: {
    MAX_LENGTH: 100,
    REQUIRED: false,
    ALLOW_EMPTY: true,
  },

  // Required Fields (Business Required from CSV)
  REQUIRED_FIELDS: ['osot_user_business_id', 'osot_work_declaration'],

  // Optional Fields with Defaults
  OPTIONAL_WITH_DEFAULTS: [
    'osot_ota_degree_type',
    'osot_ota_country',
    'osot_access_modifiers',
    'osot_privilege',
  ],

  // Completely Optional Fields
  OPTIONAL_FIELDS: [
    'osot_ota_college',
    'osot_ota_grad_year',
    'osot_education_category',
    'osot_ota_other',
  ],
} as const;

// =============================================================================
// FIELD MAPPINGS (Schema Names from CSV)
// =============================================================================

export const OTA_EDUCATION_FIELDS = {
  // Primary Key & System Fields
  OTA_EDUCATION_ID: 'osot_ota_education_id', // Autonumber: osot-ota-ed-0000001
  TABLE_OTA_EDUCATION: 'osot_table_ota_educationid', // Unique identifier

  // System Audit Fields
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',

  // Relationship Fields
  TABLE_ACCOUNT: 'osot_Table_Account@odata.bind', // OData binding for Account relationship

  // Core Education Fields
  USER_BUSINESS_ID: 'osot_user_business_id', // Business required, max 20 chars
  OTA_DEGREE_TYPE: 'osot_ota_degree_type', // Choice: Diploma/Credential default
  OTA_COLLEGE: 'osot_ota_college', // Choice: OTA Colleges
  OTA_GRAD_YEAR: 'osot_ota_grad_year', // Choice: Years
  EDUCATION_CATEGORY: 'osot_education_category', // Choice: Education Category
  OTA_COUNTRY: 'osot_ota_country', // Choice: Countries, Canada default
  OTA_OTHER: 'osot_ota_other', // Text, max 100 chars

  // Work Declaration
  WORK_DECLARATION: 'osot_work_declaration', // Business required, Yes/No

  // Access Control Fields
  ACCESS_MODIFIERS: 'osot_access_modifiers', // Choice: Private default
  PRIVILEGE: 'osot_privilege', // Choice: Owner default
} as const;

// =============================================================================
// ODATA CONFIGURATION
// =============================================================================

export const OTA_EDUCATION_ODATA = {
  // Table Configuration
  TABLE_NAME: 'osot_table_ota_educations',
  ENTITY_SET_NAME: 'osot_table_ota_educations',
  ENTITY_TYPE_NAME: 'osot_table_ota_education',

  // Primary Key Field
  PRIMARY_KEY: 'osot_table_ota_educationid',

  // Relationship Navigation
  RELATIONSHIPS: {
    ACCOUNT: 'osot_Account_to_OTA_Education', // From CSV: Relationship name
    OWNER: 'ownerid',
  },

  // Standard OData Query Options
  DEFAULT_SELECT: [
    OTA_EDUCATION_FIELDS.OTA_EDUCATION_ID,
    OTA_EDUCATION_FIELDS.USER_BUSINESS_ID,
    OTA_EDUCATION_FIELDS.OTA_DEGREE_TYPE,
    OTA_EDUCATION_FIELDS.OTA_COLLEGE,
    OTA_EDUCATION_FIELDS.OTA_GRAD_YEAR,
    OTA_EDUCATION_FIELDS.EDUCATION_CATEGORY,
    OTA_EDUCATION_FIELDS.OTA_COUNTRY,
    OTA_EDUCATION_FIELDS.WORK_DECLARATION,
    OTA_EDUCATION_FIELDS.ACCESS_MODIFIERS,
    OTA_EDUCATION_FIELDS.PRIVILEGE,
    OTA_EDUCATION_FIELDS.CREATED_ON,
    OTA_EDUCATION_FIELDS.MODIFIED_ON,
  ].join(','),

  // Expand Options for Related Data
  DEFAULT_EXPAND: [
    `${OTA_EDUCATION_FIELDS.TABLE_ACCOUNT}($select=osot_account_id,osot_account_name)`,
  ].join(','),
} as const;

// =============================================================================
// BUSINESS RULES CONFIGURATION
// =============================================================================

export const OTA_EDUCATION_BUSINESS_RULES = {
  // User Business ID Rules
  USER_BUSINESS_ID: {
    MUST_BE_UNIQUE: true,
    GENERATION_PREFIX: 'OTA-ED',
    AUTO_GENERATE: true,
    PATTERN: /^OTA-ED-\d{7}$/, // Pattern: OTA-ED-0000001
  },

  // Work Declaration Rules
  WORK_DECLARATION: {
    REQUIRED_FOR_COMPLETION: true,
    MUST_BE_EXPLICIT: true, // Cannot be null, must be true or false
  },

  // Degree Type Rules
  DEGREE_TYPE: {
    RESTRICT_TO_OTA_PROGRAMS: true,
    ALLOWED_TYPES: [DegreeType.DIPLOMA_CREDENTIAL, DegreeType.OTHER],
  },

  // Country Validation
  COUNTRY: {
    DEFAULT_TO_CANADA: true,
    VALIDATE_AGAINST_COLLEGE: true, // College must match country
  },

  // Education Category Rules
  EDUCATION_CATEGORY: {
    OPTIONAL_BUT_RECOMMENDED: true,
    AFFECTS_VERIFICATION: true, // May affect profile verification
  },
} as const;

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

export const OTA_EDUCATION_CACHE = {
  // Cache Key Patterns
  KEYS: {
    BY_ID: (id: string) => `ota_education:id:${id}`,
    BY_USER_BUSINESS_ID: (userBusinessId: string) =>
      `ota_education:user_business_id:${userBusinessId}`,
    BY_ACCOUNT: (accountId: string) => `ota_education:account:${accountId}`,
    BY_COLLEGE: (college: string) => `ota_education:college:${college}`,
    BY_GRAD_YEAR: (year: string) => `ota_education:grad_year:${year}`,
    STATISTICS: (accountId: string) => `ota_education:stats:${accountId}`,
  },

  // Cache TTL (Time To Live)
  TTL: {
    INDIVIDUAL_RECORD: 300, // 5 minutes
    LIST_RESULTS: 180, // 3 minutes
    STATISTICS: 600, // 10 minutes
    LOOKUP_DATA: 1800, // 30 minutes (colleges, years, etc.)
  },

  // Cache Tags for Invalidation
  TAGS: {
    ENTITY: 'ota_education',
    ACCOUNT_RELATED: 'ota_education:account',
    COLLEGE_RELATED: 'ota_education:college',
    STATISTICS: 'ota_education:stats',
  },
} as const;

// =============================================================================
// SECURITY & PERMISSIONS
// =============================================================================

export const OTA_EDUCATION_SECURITY = {
  // Role-Based Field Access
  FIELD_ACCESS: {
    // Fields visible to all roles
    PUBLIC_FIELDS: [
      OTA_EDUCATION_FIELDS.OTA_EDUCATION_ID,
      OTA_EDUCATION_FIELDS.OTA_DEGREE_TYPE,
      OTA_EDUCATION_FIELDS.OTA_COLLEGE,
      OTA_EDUCATION_FIELDS.OTA_GRAD_YEAR,
      OTA_EDUCATION_FIELDS.OTA_COUNTRY,
    ],

    // Fields requiring elevated permissions
    PROTECTED_FIELDS: [
      OTA_EDUCATION_FIELDS.USER_BUSINESS_ID,
      OTA_EDUCATION_FIELDS.WORK_DECLARATION,
      OTA_EDUCATION_FIELDS.ACCESS_MODIFIERS,
      OTA_EDUCATION_FIELDS.PRIVILEGE,
    ],

    // Fields only for system/admin access
    ADMIN_ONLY_FIELDS: [
      OTA_EDUCATION_FIELDS.TABLE_OTA_EDUCATION,
      OTA_EDUCATION_FIELDS.OWNER_ID,
      OTA_EDUCATION_FIELDS.CREATED_ON,
      OTA_EDUCATION_FIELDS.MODIFIED_ON,
    ],
  },

  // Permission Requirements
  PERMISSIONS: {
    CREATE: ['main', 'owner'], // Who can create OTA education records
    READ: ['main', 'admin', 'owner'], // Who can read records
    UPDATE: ['main', 'admin', 'owner'], // Who can update records
    DELETE: ['main'], // Only main can delete records
  },

  // PII Fields (for logging redaction)
  PII_FIELDS: [
    OTA_EDUCATION_FIELDS.USER_BUSINESS_ID,
    OTA_EDUCATION_FIELDS.OTA_OTHER, // May contain personal information
  ],
} as const;

// =============================================================================
// ERROR MESSAGES
// =============================================================================

export const OTA_EDUCATION_ERRORS = {
  // Validation Errors
  VALIDATION: {
    USER_BUSINESS_ID_REQUIRED:
      'User Business ID is required for OTA education records',

    USER_BUSINESS_ID_INVALID:
      'User Business ID must be alphanumeric with dashes/underscores only',
    USER_BUSINESS_ID_TOO_LONG: `User Business ID cannot exceed ${OTA_EDUCATION_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH} characters`,
    USER_BUSINESS_ID_DUPLICATE:
      'User Business ID must be unique across all OTA education records',

    WORK_DECLARATION_REQUIRED:
      'Work declaration is required for OTA education records',
    WORK_DECLARATION_INVALID:
      'Work declaration must be explicitly true or false',

    OTA_OTHER_TOO_LONG: `OTA Other field cannot exceed ${OTA_EDUCATION_VALIDATION.OTA_OTHER.MAX_LENGTH} characters`,

    DEGREE_TYPE_INVALID:
      'Degree type must be appropriate for OTA programs (Diploma, Certificate, or Credential)',
    COLLEGE_COUNTRY_MISMATCH:
      'Selected college must be from the specified country',
  },

  // Business Rule Errors
  BUSINESS_RULES: {
    ACCOUNT_REQUIRED: 'OTA education record must be associated with an account',
    DEGREE_TYPE_RESTRICTED: 'Only OTA-appropriate degree types are allowed',
    INVALID_GRADUATION_YEAR:
      'Graduation year must be valid and not in the future',
    INCOMPLETE_EDUCATION_PROFILE:
      'OTA education profile is incomplete and requires additional information',
  },

  // Permission Errors
  PERMISSIONS: {
    CREATE_DENIED: 'Insufficient permissions to create OTA education records',
    READ_DENIED: 'Insufficient permissions to read OTA education records',
    UPDATE_DENIED: 'Insufficient permissions to update OTA education records',
    DELETE_DENIED: 'Insufficient permissions to delete OTA education records',
    FIELD_ACCESS_DENIED: 'Insufficient permissions to access protected fields',
  },

  // System Errors
  SYSTEM: {
    GENERATION_FAILED:
      'Failed to generate User Business ID for OTA education record',
    DATAVERSE_ERROR:
      'Error communicating with Dataverse for OTA education operations',
    CACHE_ERROR: 'Cache operation failed for OTA education data',
    UNEXPECTED_ERROR:
      'An unexpected error occurred while processing OTA education request',
  },
} as const;

// =============================================================================
// AUDIT & LOGGING
// =============================================================================

export const OTA_EDUCATION_AUDIT = {
  // Event Types
  EVENTS: {
    CREATED: 'ota_education.created',
    UPDATED: 'ota_education.updated',
    DELETED: 'ota_education.deleted',
    VIEWED: 'ota_education.viewed',
    WORK_DECLARATION_CHANGED: 'ota_education.work_declaration_changed',
    COLLEGE_CHANGED: 'ota_education.college_changed',
  },

  // Audit Context Fields
  CONTEXT_FIELDS: [
    'operationId',
    'userId',
    'userRole',
    'timestamp',
    'ipAddress',
    'userAgent',
    'changes',
  ],

  // PII Redaction Rules
  REDACTION: {
    USER_BUSINESS_ID: (value: string) => value?.substring(0, 6) + '...',
    OTA_OTHER: () => '[REDACTED]',
    TABLE_ID: (value: string) => value?.substring(0, 8) + '...',
  },
} as const;

// =============================================================================
// EXPORT ALL CONSTANTS
// =============================================================================

export const OTA_EDUCATION_CONSTANTS = {
  DEFAULTS: OTA_EDUCATION_DEFAULTS,
  VALIDATION: OTA_EDUCATION_VALIDATION,
  FIELDS: OTA_EDUCATION_FIELDS,
  ODATA: OTA_EDUCATION_ODATA,
  BUSINESS_RULES: OTA_EDUCATION_BUSINESS_RULES,
  CACHE: OTA_EDUCATION_CACHE,
  SECURITY: OTA_EDUCATION_SECURITY,
  ERRORS: OTA_EDUCATION_ERRORS,
  AUDIT: OTA_EDUCATION_AUDIT,
} as const;

// Type-safe constant access
export type OtaEducationConstants = typeof OTA_EDUCATION_CONSTANTS;
