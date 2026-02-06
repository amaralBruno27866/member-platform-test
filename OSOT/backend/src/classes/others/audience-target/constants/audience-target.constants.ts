/**
 * Audience Target Module Constants
 *
 * Centralizes configuration values, cache keys, defaults, and helpers
 * for Audience Target operations in OSOT Dataverse API.
 *
 * This entity manages product targeting based on user attributes across
 * 35 different criteria fields (all multiple choice).
 */

import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { ErrorCodes } from '../../../../common/errors/error-codes';

// ========================================
// CACHE CONFIGURATION
// ========================================

export const AUDIENCE_TARGET_CACHE_KEYS = {
  TARGET_BY_ID: (targetId: string) => `audience_target:${targetId}`,
  TARGET_BY_PRODUCT_ID: (productId: string) =>
    `audience_target:product:${productId}`,
  TARGETS_ALL: 'audience_target:all',
  TARGET_COUNT: 'audience_target:count',
  USER_MATCHING_PRODUCTS: (userId: string, page: number) =>
    `audience_target:user_match:${userId}:page:${page}`,
} as const;

// Cache TTL Values (in seconds)
export const AUDIENCE_TARGET_CACHE_TTL = {
  DEFAULT: 3600, // 1 hour - targets don't change frequently
  BY_PRODUCT: 7200, // 2 hours - product-target relationship stable
  USER_MATCHING: 900, // 15 minutes - user profile can change
  COUNT: 1800, // 30 minutes
} as const;

// ========================================
// DEFAULT VALUES
// ========================================

export const AUDIENCE_TARGET_DEFAULTS = {
  PRIVILEGE: Privilege.OWNER, // Owner (standard privilege)
  ACCESS_MODIFIER: AccessModifier.PRIVATE, // Private (backend only)
} as const;

// ========================================
// VALIDATION LIMITS
// ========================================

export const AUDIENCE_TARGET_LIMITS = {
  // Maximum number of selections per multiple choice field
  MAX_SELECTIONS_PER_FIELD: 50,

  // Minimum selections (0 = optional, all fields are optional)
  MIN_SELECTIONS_PER_FIELD: 0,

  // Pagination limits for product matching
  PRODUCTS_PER_PAGE_DEFAULT: 20,
  PRODUCTS_PER_PAGE_MAX: 100,
} as const;

// ========================================
// FIELD NAMES (35 Multiple Choice Fields)
// ========================================

export const AUDIENCE_TARGET_FIELDS = {
  // System fields
  TARGET_ID: 'osot_target_id', // Autonumber: osot-tgt-0000001
  TABLE_AUDIENCE_TARGET_ID: 'osot_table_audience_targetid', // GUID
  TABLE_PRODUCT: 'osot_Table_Product', // Lookup to Product (PascalCase for OData navigation)

  // Account Group (1 field)
  ACCOUNT_GROUP: 'osot_account_group',

  // Affiliate (3 fields)
  AFFILIATE_AREA: 'osot_affiliate_area',
  AFFILIATE_CITY: 'osot_affiliate_city',
  AFFILIATE_PROVINCE: 'osot_affiliate_province',

  // Address (2 fields)
  MEMBERSHIP_CITY: 'osot_membership_city',
  PROVINCE: 'osot_province',

  // Identity (4 fields)
  GENDER: 'osot_gender',
  INDIGENOUS_DETAILS: 'osot_indigenous_details',
  LANGUAGE: 'osot_language',
  RACE: 'osot_race',

  // Membership Category (2 fields)
  ELIGIBILITY_AFFILIATE: 'osot_eligibility_affiliate',
  MEMBERSHIP_CATEGORY: 'osot_membership_category',

  // Employment (9 fields)
  EARNINGS: 'osot_earnings',
  EARNINGS_SELF_DIRECT: 'osot_earnings_selfdirect',
  EARNINGS_SELF_INDIRECT: 'osot_earnings_selfindirect',
  EMPLOYMENT_BENEFITS: 'osot_employment_benefits',
  EMPLOYMENT_STATUS: 'osot_employment_status',
  POSITION_FUNDING: 'osot_position_funding',
  PRACTICE_YEARS: 'osot_practice_years',
  ROLE_DESCRIPTION: 'osot_role_description',
  WORK_HOURS: 'osot_work_hours',

  // Practice (4 fields)
  CLIENT_AGE: 'osot_client_age',
  PRACTICE_AREA: 'osot_practice_area',
  PRACTICE_SERVICES: 'osot_practice_services',
  PRACTICE_SETTINGS: 'osot_practice_settings',

  // Preference (4 fields)
  MEMBERSHIP_SEARCH_TOOLS: 'osot_membership_search_tools',
  PRACTICE_PROMOTION: 'osot_practice_promotion',
  PSYCHOTHERAPY_SUPERVISION: 'osot_psychotherapy_supervision',
  THIRD_PARTIES: 'osot_third_parties',

  // Education OT (3 fields)
  COTO_STATUS: 'osot_coto_status',
  OT_GRAD_YEAR: 'osot_ot_grad_year',
  OT_UNIVERSITY: 'osot_ot_university',

  // Education OTA (2 fields)
  OTA_GRAD_YEAR: 'osot_ota_grad_year',
  OTA_COLLEGE: 'osot_ota_college',
} as const;

// ========================================
// COMPARISON MAPPING
// ========================================

/**
 * Maps each audience target field to the entity table where
 * user data should be compared for matching logic.
 */
export const AUDIENCE_TARGET_COMPARISON_MAP = {
  [AUDIENCE_TARGET_FIELDS.ACCOUNT_GROUP]: 'Table_Account',

  [AUDIENCE_TARGET_FIELDS.AFFILIATE_AREA]: 'Table_Account_Affiliate',
  [AUDIENCE_TARGET_FIELDS.AFFILIATE_CITY]: 'Table_Account_Affiliate',
  [AUDIENCE_TARGET_FIELDS.AFFILIATE_PROVINCE]: 'Table_Account_Affiliate',

  [AUDIENCE_TARGET_FIELDS.MEMBERSHIP_CITY]: 'Table_Address',
  [AUDIENCE_TARGET_FIELDS.PROVINCE]: 'Table_Address',

  [AUDIENCE_TARGET_FIELDS.GENDER]: 'Table_Identity',
  [AUDIENCE_TARGET_FIELDS.INDIGENOUS_DETAILS]: 'Table_Identity',
  [AUDIENCE_TARGET_FIELDS.LANGUAGE]: 'Table_Identity',
  [AUDIENCE_TARGET_FIELDS.RACE]: 'Table_Identity',

  [AUDIENCE_TARGET_FIELDS.ELIGIBILITY_AFFILIATE]: 'Table_Membership_Category',
  [AUDIENCE_TARGET_FIELDS.MEMBERSHIP_CATEGORY]: 'Table_Membership_Category',

  [AUDIENCE_TARGET_FIELDS.EARNINGS]: 'Table_Membership_Employment',
  [AUDIENCE_TARGET_FIELDS.EARNINGS_SELF_DIRECT]: 'Table_Membership_Employment',
  [AUDIENCE_TARGET_FIELDS.EARNINGS_SELF_INDIRECT]:
    'Table_Membership_Employment',
  [AUDIENCE_TARGET_FIELDS.EMPLOYMENT_BENEFITS]: 'Table_Membership_Employment',
  [AUDIENCE_TARGET_FIELDS.EMPLOYMENT_STATUS]: 'Table_Membership_Employment',
  [AUDIENCE_TARGET_FIELDS.POSITION_FUNDING]: 'Table_Membership_Employment',
  [AUDIENCE_TARGET_FIELDS.PRACTICE_YEARS]: 'Table_Membership_Employment',
  [AUDIENCE_TARGET_FIELDS.ROLE_DESCRIPTION]: 'Table_Membership_Employment',
  [AUDIENCE_TARGET_FIELDS.WORK_HOURS]: 'Table_Membership_Employment',

  [AUDIENCE_TARGET_FIELDS.CLIENT_AGE]: 'Table_Membership_Practice',
  [AUDIENCE_TARGET_FIELDS.PRACTICE_AREA]: 'Table_Membership_Practice',
  [AUDIENCE_TARGET_FIELDS.PRACTICE_SERVICES]: 'Table_Membership_Practice',
  [AUDIENCE_TARGET_FIELDS.PRACTICE_SETTINGS]: 'Table_Membership_Practice',

  [AUDIENCE_TARGET_FIELDS.MEMBERSHIP_SEARCH_TOOLS]:
    'Table_Membership_Preference',
  [AUDIENCE_TARGET_FIELDS.PRACTICE_PROMOTION]: 'Table_Membership_Preference',
  [AUDIENCE_TARGET_FIELDS.PSYCHOTHERAPY_SUPERVISION]:
    'Table_Membership_Preference',
  [AUDIENCE_TARGET_FIELDS.THIRD_PARTIES]: 'Table_Membership_Preference',

  [AUDIENCE_TARGET_FIELDS.COTO_STATUS]: 'Table_OT_Education',
  [AUDIENCE_TARGET_FIELDS.OT_GRAD_YEAR]: 'Table_OT_Education',
  [AUDIENCE_TARGET_FIELDS.OT_UNIVERSITY]: 'Table_OT_Education',

  [AUDIENCE_TARGET_FIELDS.OTA_GRAD_YEAR]: 'Table_OTA_Education',
  [AUDIENCE_TARGET_FIELDS.OTA_COLLEGE]: 'Table_OTA_Education',
} as const;

// ========================================
// ODATA CONFIGURATION
// ========================================

export const AUDIENCE_TARGET_ODATA = {
  TABLE_NAME: 'osot_table_audience_targets',

  // OData bind format for creating relationships
  PRODUCT_BIND_FORMAT: (productGuid: string) =>
    `/osot_table_products(${productGuid})`,

  // Select fields for queries (optimize payload)
  SELECT_FIELDS: [
    'osot_target',
    'osot_table_audience_targetid',
    '_osot_table_product_value',
    'createdon',
    'modifiedon',
    // All 35 choice fields
    'osot_account_group',
    'osot_affiliate_area',
    'osot_affiliate_city',
    'osot_affiliate_province',
    'osot_membership_city',
    'osot_province',
    'osot_gender',
    'osot_indigenous_details',
    'osot_language',
    'osot_race',
    'osot_eligibility_affiliate',
    'osot_membership_category',
    'osot_earnings',
    'osot_earnings_selfdirect',
    'osot_earnings_selfindirect',
    'osot_employment_benefits',
    'osot_employment_status',
    'osot_position_funding',
    'osot_practice_years',
    'osot_role_description',
    'osot_work_hours',
    'osot_client_age',
    'osot_practice_area',
    'osot_practice_services',
    'osot_practice_settings',
    'osot_membership_search_tools',
    'osot_practice_promotion',
    'osot_psychotherapy_supervision',
    'osot_third_parties',
    'osot_coto_status',
    'osot_ot_grad_year',
    'osot_ot_university',
    'osot_ota_grad_year',
    'osot_ota_college',
  ].join(','),

  // Expand related entities
  EXPAND_PRODUCT: 'osot_Table_Product',
} as const;

// ========================================
// ARRAY CONVERSION HELPERS
// ========================================

/**
 * Helper functions for converting between internal array format
 * and Dataverse comma-separated string format for multiple choice fields.
 *
 * Internal format: [1, 2, 3] (array of enum numbers)
 * Dataverse format: "1,2,3" (comma-separated string)
 */
export const AUDIENCE_TARGET_ARRAY_HELPERS = {
  /**
   * Convert array to Dataverse string format
   * @example [1, 2, 3] -> "1,2,3"
   */
  arrayToDataverse: (values: number[]): string => {
    if (!values || values.length === 0) return '';
    return values.sort((a, b) => a - b).join(',');
  },

  /**
   * Convert Dataverse string to array format
   * @example "1,2,3" -> [1, 2, 3]
   */
  dataverseToArray: (values: string): number[] => {
    if (!values || values.trim() === '') return [];
    return values
      .split(',')
      .map((v) => parseInt(v.trim(), 10))
      .filter((n) => !isNaN(n));
  },

  /**
   * Validate array length is within limits
   */
  isValidLength: (values: number[] | string): boolean => {
    const array = Array.isArray(values)
      ? values
      : AUDIENCE_TARGET_ARRAY_HELPERS.dataverseToArray(values);

    return (
      array.length >= AUDIENCE_TARGET_LIMITS.MIN_SELECTIONS_PER_FIELD &&
      array.length <= AUDIENCE_TARGET_LIMITS.MAX_SELECTIONS_PER_FIELD
    );
  },

  /**
   * Check if arrays have any common values (for matching logic)
   * @example hasIntersection([1,2,3], [2,4,5]) -> true (2 is common)
   */
  hasIntersection: (arr1: number[], arr2: number[]): boolean => {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) {
      return false;
    }
    return arr1.some((val) => arr2.includes(val));
  },
} as const;

// ========================================
// ERROR CODES
// ========================================

export const AUDIENCE_TARGET_ERROR_CODES = {
  // Not Found Errors
  TARGET_NOT_FOUND: ErrorCodes.NOT_FOUND,
  PRODUCT_NOT_FOUND: ErrorCodes.NOT_FOUND,

  // Validation Errors
  INVALID_TARGET_ID: ErrorCodes.INVALID_INPUT,
  INVALID_PRODUCT_BINDING: ErrorCodes.INVALID_INPUT,
  INVALID_ARRAY_LENGTH: ErrorCodes.INVALID_INPUT,
  INVALID_ENUM_VALUE: ErrorCodes.INVALID_INPUT,

  // Business Rule Violations
  PRODUCT_ALREADY_HAS_TARGET: ErrorCodes.BUSINESS_RULE_VIOLATION,
  TARGET_CANNOT_BE_EMPTY: ErrorCodes.BUSINESS_RULE_VIOLATION,
  PRODUCT_DOES_NOT_EXIST: ErrorCodes.BUSINESS_RULE_VIOLATION,

  // Permission Errors
  INSUFFICIENT_PRIVILEGE: ErrorCodes.PERMISSION_DENIED,
  TARGET_ACCESS_DENIED: ErrorCodes.FORBIDDEN,
} as const;

// ========================================
// BUSINESS RULES
// ========================================

export const AUDIENCE_TARGET_BUSINESS_RULES = {
  /**
   * One-to-One Relationship Rule
   * Despite being Many-to-One in Dataverse, business logic enforces
   * that each product can have only ONE audience target.
   */
  ONE_TARGET_PER_PRODUCT: true,

  /**
   * All 35 fields are optional
   * Admin can activate only the fields they want to use for targeting
   */
  ALL_FIELDS_OPTIONAL: true,

  /**
   * Empty target rule
   * At least one field must be populated (otherwise target matches nobody)
   */
  REQUIRE_AT_LEAST_ONE_FIELD: false, // Allow empty targets (matches everyone)

  /**
   * Privilege requirements
   */
  CREATE_PRIVILEGE: Privilege.MAIN, // Only Main can create
  UPDATE_PRIVILEGE: Privilege.ADMIN, // Admin and above can update
  DELETE_PRIVILEGE: Privilege.MAIN, // Only Main can delete
  READ_PRIVILEGE: Privilege.OWNER, // All can read (for matching logic)
} as const;

// ========================================
// AUTONUMBER CONFIGURATION
// ========================================

export const AUDIENCE_TARGET_AUTONUMBER = {
  PREFIX: 'osot-tgt',
  DIGITS: 7,
  SEED: 1,
  FORMAT: 'osot-tgt-0000001',
  PATTERN: /^osot-tgt-\d{7}$/,
} as const;

// ========================================
// FIELD GROUPS (for organization)
// ========================================

export const AUDIENCE_TARGET_FIELD_GROUPS = {
  ACCOUNT: [AUDIENCE_TARGET_FIELDS.ACCOUNT_GROUP],

  AFFILIATE: [
    AUDIENCE_TARGET_FIELDS.AFFILIATE_AREA,
    AUDIENCE_TARGET_FIELDS.AFFILIATE_CITY,
    AUDIENCE_TARGET_FIELDS.AFFILIATE_PROVINCE,
  ],

  ADDRESS: [
    AUDIENCE_TARGET_FIELDS.MEMBERSHIP_CITY,
    AUDIENCE_TARGET_FIELDS.PROVINCE,
  ],

  IDENTITY: [
    AUDIENCE_TARGET_FIELDS.GENDER,
    AUDIENCE_TARGET_FIELDS.INDIGENOUS_DETAILS,
    AUDIENCE_TARGET_FIELDS.LANGUAGE,
    AUDIENCE_TARGET_FIELDS.RACE,
  ],

  MEMBERSHIP: [
    AUDIENCE_TARGET_FIELDS.ELIGIBILITY_AFFILIATE,
    AUDIENCE_TARGET_FIELDS.MEMBERSHIP_CATEGORY,
  ],

  EMPLOYMENT: [
    AUDIENCE_TARGET_FIELDS.EARNINGS,
    AUDIENCE_TARGET_FIELDS.EARNINGS_SELF_DIRECT,
    AUDIENCE_TARGET_FIELDS.EARNINGS_SELF_INDIRECT,
    AUDIENCE_TARGET_FIELDS.EMPLOYMENT_BENEFITS,
    AUDIENCE_TARGET_FIELDS.EMPLOYMENT_STATUS,
    AUDIENCE_TARGET_FIELDS.POSITION_FUNDING,
    AUDIENCE_TARGET_FIELDS.PRACTICE_YEARS,
    AUDIENCE_TARGET_FIELDS.ROLE_DESCRIPTION,
    AUDIENCE_TARGET_FIELDS.WORK_HOURS,
  ],

  PRACTICE: [
    AUDIENCE_TARGET_FIELDS.CLIENT_AGE,
    AUDIENCE_TARGET_FIELDS.PRACTICE_AREA,
    AUDIENCE_TARGET_FIELDS.PRACTICE_SERVICES,
    AUDIENCE_TARGET_FIELDS.PRACTICE_SETTINGS,
  ],

  PREFERENCE: [
    AUDIENCE_TARGET_FIELDS.MEMBERSHIP_SEARCH_TOOLS,
    AUDIENCE_TARGET_FIELDS.PRACTICE_PROMOTION,
    AUDIENCE_TARGET_FIELDS.PSYCHOTHERAPY_SUPERVISION,
    AUDIENCE_TARGET_FIELDS.THIRD_PARTIES,
  ],

  EDUCATION_OT: [
    AUDIENCE_TARGET_FIELDS.COTO_STATUS,
    AUDIENCE_TARGET_FIELDS.OT_GRAD_YEAR,
    AUDIENCE_TARGET_FIELDS.OT_UNIVERSITY,
  ],

  EDUCATION_OTA: [
    AUDIENCE_TARGET_FIELDS.OTA_GRAD_YEAR,
    AUDIENCE_TARGET_FIELDS.OTA_COLLEGE,
  ],
} as const;

// ========================================
// EXPORT ALL CONSTANTS
// ========================================

export const AUDIENCE_TARGET_CONSTANTS = {
  CACHE_KEYS: AUDIENCE_TARGET_CACHE_KEYS,
  CACHE_TTL: AUDIENCE_TARGET_CACHE_TTL,
  DEFAULTS: AUDIENCE_TARGET_DEFAULTS,
  LIMITS: AUDIENCE_TARGET_LIMITS,
  FIELDS: AUDIENCE_TARGET_FIELDS,
  COMPARISON_MAP: AUDIENCE_TARGET_COMPARISON_MAP,
  ODATA: AUDIENCE_TARGET_ODATA,
  ARRAY_HELPERS: AUDIENCE_TARGET_ARRAY_HELPERS,
  ERROR_CODES: AUDIENCE_TARGET_ERROR_CODES,
  BUSINESS_RULES: AUDIENCE_TARGET_BUSINESS_RULES,
  AUTONUMBER: AUDIENCE_TARGET_AUTONUMBER,
  FIELD_GROUPS: AUDIENCE_TARGET_FIELD_GROUPS,
} as const;
