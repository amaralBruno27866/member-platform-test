/**
 * Management Constants
 *
 * This file contains all constant values used across the Management module.
 * These constants are derived from the Dataverse table schema and business requirements.
 * Values are aligned with global enums for consistency across the system.
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

// Import required enums for Choice fields
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';

// ========================================
// DATAVERSE SCHEMA CONSTANTS
// ========================================

/**
 * Dataverse table and field schema names
 * Aligned with osot_Table_Account_Management entity
 */
export const MANAGEMENT_SCHEMA = {
  // Table Names
  TABLE_NAME: 'osot_table_account_managements',
  TABLE_DISPLAY_NAME: 'Table_Account_Management',
  TABLE_PLURAL_NAME: 'Table_Account_Managements',
  TABLE_SCHEMA_NAME: 'osot_Table_Account_Management',

  // Field Schema Names
  FIELDS: {
    ID: 'osot_table_account_managementid',
    ACCOUNT_MANAGEMENT_ID: 'osot_account_management_id',
    TABLE_ACCOUNT: 'osot_table_account',
    USER_BUSINESS_ID: 'osot_user_business_id',
    LIFE_MEMBER_RETIRED: 'osot_life_member_retired',
    SHADOWING: 'osot_shadowing',
    PASSED_AWAY: 'osot_passed_away',
    VENDOR: 'osot_vendor',
    ADVERTISING: 'osot_advertising',
    RECRUITMENT: 'osot_recruitment',
    DRIVER_REHAB: 'osot_driver_rehab',
    ACCESS_MODIFIERS: 'osot_access_modifiers',
    PRIVILEGE: 'osot_privilege',
    CREATED_ON: 'createdon',
    MODIFIED_ON: 'modifiedon',
    OWNER_ID: 'ownerid',
  },

  // OData Bind Names
  ODATA_BINDS: {
    TABLE_ACCOUNT: 'osot_Table_Account@odata.bind',
  },

  // Relationship Names
  RELATIONSHIPS: {
    ACCOUNT_TO_MANAGEMENT: 'osot_Account_to_Account_Management',
  },
} as const;

// ========================================
// FIELD MAPPING CONSTANTS
// ========================================

/**
 * Field mapping for Dataverse operations
 * Maps internal field names to Dataverse schema names
 */
export const MANAGEMENT_FIELDS = {
  // Primary Key & System Fields
  TABLE_ACCOUNT_MANAGEMENT_ID: 'osot_table_account_managementid',
  ACCOUNT_MANAGEMENT_ID: 'osot_account_management_id',
  OWNER_ID: 'ownerid',

  // System Audit Fields
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',

  // Relationship Fields
  TABLE_ACCOUNT: 'osot_table_account',

  // Business Fields
  USER_BUSINESS_ID: 'osot_user_business_id',
  LIFE_MEMBER_RETIRED: 'osot_life_member_retired',
  SHADOWING: 'osot_shadowing',
  PASSED_AWAY: 'osot_passed_away',
  VENDOR: 'osot_vendor',
  ADVERTISING: 'osot_advertising',
  RECRUITMENT: 'osot_recruitment',
  DRIVER_REHAB: 'osot_driver_rehab',

  // Access Control Fields
  ACCESS_MODIFIERS: 'osot_access_modifiers',
  PRIVILEGE: 'osot_privilege',
} as const;

// ========================================
// ODATA CONFIGURATION
// ========================================

/**
 * OData configuration for Management Dataverse operations
 */
export const MANAGEMENT_ODATA = {
  // Table Configuration
  TABLE_NAME: 'osot_table_account_managements',
  ENTITY_SET_NAME: 'osot_table_account_managements',
  ENTITY_TYPE_NAME: 'osot_table_account_managements',

  // Primary Key Field
  PRIMARY_KEY: 'osot_table_account_managementid',

  // Individual field mappings (aligned with MANAGEMENT_FIELDS)
  USER_BUSINESS_ID: 'osot_user_business_id',
  TABLE_ACCOUNT: 'osot_table_account',

  // Relationship Navigation
  RELATIONSHIPS: {
    OWNER: 'ownerid',
    TABLE_ACCOUNT: 'osot_table_account',
  },

  // Standard OData Query Options
  DEFAULT_SELECT: [
    MANAGEMENT_FIELDS.TABLE_ACCOUNT_MANAGEMENT_ID,
    MANAGEMENT_FIELDS.ACCOUNT_MANAGEMENT_ID,
    MANAGEMENT_FIELDS.USER_BUSINESS_ID,
    MANAGEMENT_FIELDS.LIFE_MEMBER_RETIRED,
    MANAGEMENT_FIELDS.SHADOWING,
    MANAGEMENT_FIELDS.PASSED_AWAY,
    MANAGEMENT_FIELDS.VENDOR,
    MANAGEMENT_FIELDS.ADVERTISING,
    MANAGEMENT_FIELDS.RECRUITMENT,
    MANAGEMENT_FIELDS.DRIVER_REHAB,
    MANAGEMENT_FIELDS.ACCESS_MODIFIERS,
    MANAGEMENT_FIELDS.PRIVILEGE,
    MANAGEMENT_FIELDS.CREATED_ON,
    MANAGEMENT_FIELDS.MODIFIED_ON,
    MANAGEMENT_FIELDS.OWNER_ID,
  ],

  // Common Query Patterns
  QUERY_PATTERNS: {
    BY_BUSINESS_ID: `$filter=${MANAGEMENT_FIELDS.USER_BUSINESS_ID} eq '{0}'`,
    BY_ACCOUNT_ID: `$filter=${MANAGEMENT_FIELDS.ACCOUNT_MANAGEMENT_ID} eq '{0}'`,
    ACTIVE_USERS: `$filter=${MANAGEMENT_FIELDS.PASSED_AWAY} eq false`,
    VENDORS: `$filter=${MANAGEMENT_FIELDS.VENDOR} eq true`,
    LIFE_MEMBERS: `$filter=${MANAGEMENT_FIELDS.LIFE_MEMBER_RETIRED} eq true`,
    BY_PRIVILEGE: `$filter=${MANAGEMENT_FIELDS.PRIVILEGE} eq {0}`,
  },

  // Default Ordering
  DEFAULT_ORDER_BY: `$orderby=${MANAGEMENT_FIELDS.MODIFIED_ON} desc`,

  // Expand Options for Related Data
  EXPAND_OPTIONS: {
    WITH_ACCOUNT: `$expand=${MANAGEMENT_FIELDS.TABLE_ACCOUNT}`,
  },
} as const;

// ========================================
// MANAGEMENT CONFIGURATION FLAGS
// ========================================

/**
 * Boolean configuration flags for user management
 * All flags default to false for new accounts
 */
export const MANAGEMENT_FLAGS = {
  // Default values for new management records
  DEFAULTS: {
    LIFE_MEMBER_RETIRED: false,
    SHADOWING: false,
    PASSED_AWAY: false,
    VENDOR: false,
    ADVERTISING: false,
    RECRUITMENT: false,
    DRIVER_REHAB: false,
  },

  // Flag categories for validation and grouping
  CATEGORIES: {
    MEMBERSHIP_STATUS: ['LIFE_MEMBER_RETIRED', 'PASSED_AWAY'],
    BUSINESS_PERMISSIONS: ['VENDOR', 'ADVERTISING', 'RECRUITMENT'],
    PROFESSIONAL_SERVICES: ['SHADOWING', 'DRIVER_REHAB'],
  },
} as const;

// ========================================
// CHOICE FIELD DEFAULTS
// ========================================

/**
 * Default values for Choice fields
 * Based on CSV specifications and global enums
 */
export const MANAGEMENT_CHOICE_DEFAULTS = {
  // Access Modifiers default to "Protected" (CSV specification)
  ACCESS_MODIFIERS: AccessModifier.PROTECTED, // Value: 2

  // Privilege defaults to "Owner" (CSV specification)
  PRIVILEGE: Privilege.OWNER, // Value: 1
} as const;

// ========================================
// VALIDATION CONSTANTS
// ========================================

/**
 * Validation rules for management fields
 * Used by validators and business rule services
 */
export const MANAGEMENT_VALIDATION = {
  // User Business ID validation
  USER_BUSINESS_ID: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 20,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
    ERROR_MESSAGE:
      'User Business ID must be 1-20 alphanumeric characters, underscores, or hyphens',
  },

  // Account Management ID format
  ACCOUNT_MANAGEMENT_ID: {
    PREFIX: 'osot-am',
    MIN_DIGITS: 7,
    SEED_VALUE: 1,
    PATTERN: /^osot-am-\d{7}$/,
    EXAMPLE: 'osot-am-0000001',
  },

  // Required fields for creation
  REQUIRED_FIELDS: ['userBusinessId'],

  // Optional fields that can be updated
  OPTIONAL_FIELDS: [
    'lifeMemberRetired',
    'shadowing',
    'passedAway',
    'vendor',
    'advertising',
    'recruitment',
    'driverRehab',
    'accessModifiers',
    'privilege',
  ],
} as const;

// ========================================
// ACCESS CONTROL CONSTANTS
// ========================================

/**
 * Access control and privilege management
 * Admin-only module with different privilege levels
 */
export const MANAGEMENT_ACCESS = {
  // Required privileges to access management functions
  REQUIRED_PRIVILEGES: {
    READ: ['OWNER', 'ADMIN'],
    CREATE: ['OWNER', 'ADMIN'],
    UPDATE: ['OWNER', 'ADMIN'],
    DELETE: ['OWNER'],
    BULK_OPERATIONS: ['OWNER'],
  },

  // Administrative roles
  ADMIN_ROLES: {
    SUPER_ADMIN: 'OWNER',
    CONFIG_ADMIN: 'ADMIN',
    VIEW_ADMIN: 'MAIN', // Read-only access
  },

  // Sensitive operations requiring additional verification
  SENSITIVE_OPERATIONS: [
    'PASSED_AWAY',
    'LIFE_MEMBER_RETIRED',
    'PRIVILEGE_CHANGE',
  ],
} as const;

// ========================================
// BUSINESS RULE CONSTANTS
// ========================================

/**
 * Business rules and constraints for management operations
 */
export const MANAGEMENT_BUSINESS_RULES = {
  // Mutual exclusivity rules
  EXCLUSIVE_FLAGS: {
    // Cannot be both active and passed away
    ACTIVE_VS_DECEASED: ['lifeMemberRetired', 'passedAway'],

    // Business permission combinations
    VENDOR_RESTRICTIONS: {
      // Vendors cannot have certain flags
      RESTRICTED_WITH_VENDOR: ['recruitment'],
    },
  },

  // Account lifecycle rules
  LIFECYCLE_RULES: {
    // Actions that require account to be active
    REQUIRE_ACTIVE_ACCOUNT: [
      'shadowing',
      'vendor',
      'advertising',
      'recruitment',
      'driverRehab',
    ],

    // Actions that deactivate an account
    DEACTIVATING_FLAGS: ['passedAway'],
  },

  // Audit requirements
  AUDIT_REQUIREMENTS: {
    // Changes that require audit logging
    REQUIRE_AUDIT: ['passedAway', 'lifeMemberRetired', 'privilege'],

    // Changes that require admin approval
    REQUIRE_APPROVAL: ['privilege'],
  },
} as const;

// ========================================
// QUERY AND SEARCH CONSTANTS
// ========================================

/**
 * Query optimization and search configuration
 */
export const MANAGEMENT_QUERIES = {
  // Default pagination settings
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 50,
    MAX_PAGE_SIZE: 200,
    DEFAULT_SORT_FIELD: 'modifiedon',
    DEFAULT_SORT_ORDER: 'desc',
  },

  // Search field weights for relevance scoring
  SEARCH_WEIGHTS: {
    USER_BUSINESS_ID: 10,
    ACCOUNT_MANAGEMENT_ID: 8,
    CREATED_ON: 5,
    MODIFIED_ON: 3,
  },

  // Commonly used filters
  COMMON_FILTERS: {
    ACTIVE_USERS: 'passedAway eq false',
    VENDORS: 'vendor eq true',
    RECRUITMENT_ALLOWED: 'recruitment eq true',
    LIFE_MEMBERS: 'lifeMemberRetired eq true',
    SHADOWING_AVAILABLE: 'shadowing eq true',
  },
} as const;

// ========================================
// CACHE AND PERFORMANCE CONSTANTS
// ========================================

/**
 * Caching and performance optimization settings
 */
export const MANAGEMENT_CACHE = {
  // Cache key prefixes
  CACHE_KEYS: {
    PREFIX: 'management:',
    USER_CONFIG: 'management:user:',
    ADMIN_STATS: 'management:stats:admin',
    FLAG_COUNTS: 'management:counts:flags',
  },

  // Cache TTL settings (in seconds)
  TTL: {
    USER_CONFIG: 3600, // 1 hour
    ADMIN_STATS: 1800, // 30 minutes
    FLAG_COUNTS: 600, // 10 minutes
  },

  // Batch operation limits
  BATCH_LIMITS: {
    MAX_BULK_CREATE: 100,
    MAX_BULK_UPDATE: 50,
    MAX_BULK_DELETE: 25,
  },
} as const;

// ========================================
// ERROR HANDLING CONSTANTS
// ========================================

/**
 * Error codes and messages specific to management operations
 */
export const MANAGEMENT_ERRORS = {
  // Error code mappings
  ERROR_CODES: {
    USER_NOT_FOUND: 'MANAGEMENT_USER_NOT_FOUND',
    ACCOUNT_NOT_LINKED: 'MANAGEMENT_ACCOUNT_NOT_LINKED',
    INVALID_FLAG_COMBINATION: 'MANAGEMENT_INVALID_FLAG_COMBINATION',
    INSUFFICIENT_PRIVILEGES: 'MANAGEMENT_INSUFFICIENT_PRIVILEGES',
    BUSINESS_RULE_VIOLATION: 'MANAGEMENT_BUSINESS_RULE_VIOLATION',
    AUDIT_REQUIREMENT_NOT_MET: 'MANAGEMENT_AUDIT_REQUIREMENT_NOT_MET',
  },

  // User-friendly error messages
  ERROR_MESSAGES: {
    USER_NOT_FOUND: 'User account not found for the provided Business ID',
    ACCOUNT_NOT_LINKED: 'Management record must be linked to a valid account',
    INVALID_FLAG_COMBINATION: 'Invalid combination of management flags',
    INSUFFICIENT_PRIVILEGES:
      'Insufficient administrative privileges for this operation',
    BUSINESS_RULE_VIOLATION: 'Operation violates business rules',
    AUDIT_REQUIREMENT_NOT_MET:
      'Audit requirements not satisfied for this operation',
  },
} as const;

// ========================================
// INTEGRATION CONSTANTS
// ========================================

/**
 * Integration settings with other modules and external systems
 */
export const MANAGEMENT_INTEGRATION = {
  // Related table references
  RELATED_TABLES: {
    ACCOUNT: '/osot_table_accounts',
    AFFILIATE: '/osot_table_account_affiliates',
  },

  // Event types for integration
  EVENT_TYPES: {
    MANAGEMENT_CREATED: 'management.created',
    MANAGEMENT_UPDATED: 'management.updated',
    MANAGEMENT_DELETED: 'management.deleted',
    FLAG_CHANGED: 'management.flag.changed',
    PRIVILEGE_CHANGED: 'management.privilege.changed',
  },

  // External system integration points
  EXTERNAL_SYSTEMS: {
    EMAIL_NOTIFICATIONS: ['passedAway', 'lifeMemberRetired'],
    AUDIT_SYSTEMS: ['privilege', 'passedAway'],
    REPORTING_SYSTEMS: ['vendor', 'recruitment', 'advertising'],
  },
} as const;

// ========================================
// EXPORT ALL CONSTANTS
// ========================================

/**
 * Consolidated export of all management constants
 */
export const MANAGEMENT_CONSTANTS = {
  SCHEMA: MANAGEMENT_SCHEMA,
  FIELDS: MANAGEMENT_FIELDS,
  ODATA: MANAGEMENT_ODATA,
  FLAGS: MANAGEMENT_FLAGS,
  CHOICE_DEFAULTS: MANAGEMENT_CHOICE_DEFAULTS,
  VALIDATION: MANAGEMENT_VALIDATION,
  ACCESS: MANAGEMENT_ACCESS,
  BUSINESS_RULES: MANAGEMENT_BUSINESS_RULES,
  QUERIES: MANAGEMENT_QUERIES,
  CACHE: MANAGEMENT_CACHE,
  ERRORS: MANAGEMENT_ERRORS,
  INTEGRATION: MANAGEMENT_INTEGRATION,
} as const;

/**
 * Type definitions for constant values
 */
export type ManagementSchemaField = keyof typeof MANAGEMENT_SCHEMA.FIELDS;
export type ManagementFlag = keyof typeof MANAGEMENT_FLAGS.DEFAULTS;
export type ManagementErrorCode = keyof typeof MANAGEMENT_ERRORS.ERROR_CODES;
export type ManagementEventType =
  keyof typeof MANAGEMENT_INTEGRATION.EVENT_TYPES;
