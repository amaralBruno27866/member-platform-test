/**
 * Affiliate Constants
 *
 * This file contains all constant values used across the Affiliate module.
 * These constants are derived from the Dataverse table schema and business requirements.
 * Values are aligned with global enums for consistency across the system.
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

// ========================================
// AFFILIATE AREAS
// ========================================

/**
 * Available affiliate areas based on Dataverse Choices_Affiliate_Areas
 * Aligned with global AffiliateArea enum
 */
export const AFFILIATE_AREAS = {
  OTHER: 0,
  HEALTHCARE_AND_LIFE_SCIENCES: 1,
  GOVERNMENT_AND_PUBLIC_SECTOR: 2,
  CONSTRUCTION_REAL_ESTATE_AND_PROPERTY_MANAGEMENT: 3,
  CONSUMER_GOODS_AND_RETAIL: 4,
  FINANCIAL_SERVICES_AND_INSURANCE: 5,
  INFORMATION_TECHNOLOGY_AND_SOFTWARE: 6,
  LEGAL_SERVICES: 7,
  NONPROFIT_AND_SOCIAL_SERVICES: 8,
  PHARMACEUTICALS_AND_BIOTECHNOLOGY: 9,
  PROFESSIONAL_SERVICES: 10,
  SCIENCE_AND_RESEARCH: 11,
} as const;

/**
 * Affiliate areas display labels
 */
export const AFFILIATE_AREAS_LABELS = {
  [AFFILIATE_AREAS.OTHER]: 'Other',
  [AFFILIATE_AREAS.HEALTHCARE_AND_LIFE_SCIENCES]:
    'Healthcare and Life Sciences',
  [AFFILIATE_AREAS.GOVERNMENT_AND_PUBLIC_SECTOR]:
    'Government and Public Sector',
  [AFFILIATE_AREAS.CONSTRUCTION_REAL_ESTATE_AND_PROPERTY_MANAGEMENT]:
    'Construction, Real Estate and Property Management',
  [AFFILIATE_AREAS.CONSUMER_GOODS_AND_RETAIL]: 'Consumer Goods and Retail',
  [AFFILIATE_AREAS.FINANCIAL_SERVICES_AND_INSURANCE]:
    'Financial Services and Insurance',
  [AFFILIATE_AREAS.INFORMATION_TECHNOLOGY_AND_SOFTWARE]:
    'Information Technology and Software',
  [AFFILIATE_AREAS.LEGAL_SERVICES]: 'Legal Services',
  [AFFILIATE_AREAS.NONPROFIT_AND_SOCIAL_SERVICES]:
    'Nonprofit and Social Services',
  [AFFILIATE_AREAS.PHARMACEUTICALS_AND_BIOTECHNOLOGY]:
    'Pharmaceuticals and Biotechnology',
  [AFFILIATE_AREAS.PROFESSIONAL_SERVICES]:
    'Professional Services (e.g., Consulting, Accounting)',
  [AFFILIATE_AREAS.SCIENCE_AND_RESEARCH]: 'Science and Research',
} as const;

// ========================================
// ACCOUNT STATUS
// ========================================

/**
 * Account status values based on Dataverse Choices_Status
 * Aligned with global AccountStatus enum
 */
export const AFFILIATE_ACCOUNT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
  PENDING: 3,
} as const;

/**
 * Account status display labels
 */
export const AFFILIATE_ACCOUNT_STATUS_LABELS = {
  [AFFILIATE_ACCOUNT_STATUS.ACTIVE]: 'Active',
  [AFFILIATE_ACCOUNT_STATUS.INACTIVE]: 'Inactive',
  [AFFILIATE_ACCOUNT_STATUS.PENDING]: 'Pending',
} as const;

/**
 * Default account status
 */
export const DEFAULT_AFFILIATE_ACCOUNT_STATUS =
  AFFILIATE_ACCOUNT_STATUS.PENDING;

// ========================================
// PRIVILEGES
// ========================================

/**
 * Privilege levels based on Dataverse Choices_Privilege
 * Aligned with global Privilege enum
 */
export const AFFILIATE_PRIVILEGES = {
  OWNER: 1,
  ADMIN: 2,
  MAIN: 3,
} as const;

/**
 * Privilege display labels
 */
export const AFFILIATE_PRIVILEGES_LABELS = {
  [AFFILIATE_PRIVILEGES.OWNER]: 'Owner',
  [AFFILIATE_PRIVILEGES.ADMIN]: 'Admin',
  [AFFILIATE_PRIVILEGES.MAIN]: 'Main',
} as const;

/**
 * Default privilege level
 */
export const DEFAULT_AFFILIATE_PRIVILEGE = AFFILIATE_PRIVILEGES.OWNER;

// ========================================
// ACCESS MODIFIERS
// ========================================

/**
 * Access modifier values based on Dataverse Choices_Access_Modifiers
 * Aligned with global AccessModifier enum
 */
export const AFFILIATE_ACCESS_MODIFIERS = {
  PUBLIC: 1,
  PROTECTED: 2,
  PRIVATE: 3,
} as const;

/**
 * Access modifier display labels
 */
export const AFFILIATE_ACCESS_MODIFIERS_LABELS = {
  [AFFILIATE_ACCESS_MODIFIERS.PUBLIC]: 'Public',
  [AFFILIATE_ACCESS_MODIFIERS.PROTECTED]: 'Protected',
  [AFFILIATE_ACCESS_MODIFIERS.PRIVATE]: 'Private',
} as const;

/**
 * Default access modifier
 */
export const DEFAULT_AFFILIATE_ACCESS_MODIFIER =
  AFFILIATE_ACCESS_MODIFIERS.PRIVATE;

// ========================================
// REPRESENTATIVE JOB TITLES
// ========================================

/**
 * Common representative job titles
 */
export const AFFILIATE_REPRESENTATIVE_JOB_TITLES = {
  CEO: 'ceo',
  PRESIDENT: 'president',
  DIRECTOR: 'director',
  MANAGER: 'manager',
  COORDINATOR: 'coordinator',
  REPRESENTATIVE: 'representative',
  CONTACT_PERSON: 'contact_person',
  ADMINISTRATOR: 'administrator',
  OTHER: 'other',
} as const;

/**
 * Representative job titles display labels
 */
export const AFFILIATE_REPRESENTATIVE_JOB_TITLES_LABELS = {
  [AFFILIATE_REPRESENTATIVE_JOB_TITLES.CEO]: 'Chief Executive Officer',
  [AFFILIATE_REPRESENTATIVE_JOB_TITLES.PRESIDENT]: 'President',
  [AFFILIATE_REPRESENTATIVE_JOB_TITLES.DIRECTOR]: 'Director',
  [AFFILIATE_REPRESENTATIVE_JOB_TITLES.MANAGER]: 'Manager',
  [AFFILIATE_REPRESENTATIVE_JOB_TITLES.COORDINATOR]: 'Coordinator',
  [AFFILIATE_REPRESENTATIVE_JOB_TITLES.REPRESENTATIVE]: 'Representative',
  [AFFILIATE_REPRESENTATIVE_JOB_TITLES.CONTACT_PERSON]: 'Contact Person',
  [AFFILIATE_REPRESENTATIVE_JOB_TITLES.ADMINISTRATOR]: 'Administrator',
  [AFFILIATE_REPRESENTATIVE_JOB_TITLES.OTHER]: 'Other',
} as const;

// ========================================
// GEOGRAPHIC CONSTANTS
// ========================================

/**
 * Canadian provinces based on Dataverse Choices_Provinces
 * Aligned with global Province enum
 */
export const AFFILIATE_PROVINCES = {
  N_A: 0,
  ONTARIO: 1,
  ALBERTA: 2,
  BRITISH_COLUMBIA: 3,
  MANITOBA: 4,
  NEW_BRUNSWICK: 5,
  NEWFOUNDLAND_AND_LABRADOR: 6,
  NOVA_SCOTIA: 7,
  NORTHWEST_TERRITORIES: 8,
  NUNAVUT: 9,
  PRINCE_EDWARD_ISLAND: 10,
  QUEBEC: 11,
  SASKATCHEWAN: 12,
  YUKON: 13,
} as const;

/**
 * Province display labels
 */
export const AFFILIATE_PROVINCES_LABELS = {
  [AFFILIATE_PROVINCES.N_A]: 'N/A',
  [AFFILIATE_PROVINCES.ONTARIO]: 'Ontario',
  [AFFILIATE_PROVINCES.ALBERTA]: 'Alberta',
  [AFFILIATE_PROVINCES.BRITISH_COLUMBIA]: 'British Columbia',
  [AFFILIATE_PROVINCES.MANITOBA]: 'Manitoba',
  [AFFILIATE_PROVINCES.NEW_BRUNSWICK]: 'New Brunswick',
  [AFFILIATE_PROVINCES.NEWFOUNDLAND_AND_LABRADOR]: 'Newfoundland and Labrador',
  [AFFILIATE_PROVINCES.NOVA_SCOTIA]: 'Nova Scotia',
  [AFFILIATE_PROVINCES.NORTHWEST_TERRITORIES]: 'Northwest Territories',
  [AFFILIATE_PROVINCES.NUNAVUT]: 'Nunavut',
  [AFFILIATE_PROVINCES.PRINCE_EDWARD_ISLAND]: 'Prince Edward Island',
  [AFFILIATE_PROVINCES.QUEBEC]: 'Quebec',
  [AFFILIATE_PROVINCES.SASKATCHEWAN]: 'Saskatchewan',
  [AFFILIATE_PROVINCES.YUKON]: 'Yukon',
} as const;

/**
 * Default province
 */
export const DEFAULT_AFFILIATE_PROVINCE = AFFILIATE_PROVINCES.ONTARIO;

/**
 * Countries based on Dataverse Choices_Countries
 * Aligned with global Country enum
 */
export const AFFILIATE_COUNTRIES = {
  OTHER: 0,
  CANADA: 1,
  USA: 2,
} as const;

/**
 * Country display labels
 */
export const AFFILIATE_COUNTRIES_LABELS = {
  [AFFILIATE_COUNTRIES.OTHER]: 'Other',
  [AFFILIATE_COUNTRIES.CANADA]: 'Canada',
  [AFFILIATE_COUNTRIES.USA]: 'United States',
} as const;

/**
 * Default country
 */
export const DEFAULT_AFFILIATE_COUNTRY = AFFILIATE_COUNTRIES.CANADA;

// ========================================
// VALIDATION CONSTANTS
// ========================================

/**
 * Field length limits based on Dataverse schema
 */
export const AFFILIATE_FIELD_LIMITS = {
  NAME: 255,
  FIRST_NAME: 255,
  LAST_NAME: 255,
  EMAIL: 255,
  PHONE: 14,
  ADDRESS_1: 255,
  ADDRESS_2: 255,
  POSTAL_CODE: 7,
  PASSWORD: 255,
  WEBSITE: 255,
  SOCIAL_MEDIA_URL: 255,
  JOB_TITLE: 255,
  OTHER_CITY: 255,
  OTHER_PROVINCE_STATE: 255,
} as const;

/**
 * Validation patterns
 */
export const AFFILIATE_VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Canadian phone format: (XXX) XXX-XXXX - exactly 14 characters
  PHONE: /^\(\d{3}\) \d{3}-\d{4}$/,
  POSTAL_CODE_CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
  POSTAL_CODE_US: /^\d{5}(-\d{4})?$/,
  URL: /^https?:\/\/.+\..+/,
  // Password strength (minimum 8 chars, at least 1 upper, 1 lower, 1 number, 1 special char)
  PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/,
} as const;

// ========================================
// DATAVERSE FIELD MAPPINGS
// ========================================

/**
 * Affiliate field mappings to Dataverse schema names
 * Based on Table Account Affiliate.csv structure
 */
export const AFFILIATE_FIELDS = {
  // Primary Key & System Fields
  AFFILIATE_ID: 'osot_affiliate_id', // Autonumber: affi-0000001
  TABLE_ACCOUNT_AFFILIATE: 'osot_table_account_affiliateid', // Primary key GUID

  // System Audit Fields
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',

  // Organization Profile Fields
  AFFILIATE_NAME: 'osot_affiliate_name', // Business required, max 255
  AFFILIATE_AREA: 'osot_affiliate_area', // Choice: Affiliate Areas

  // Representative Identity Fields
  REPRESENTATIVE_FIRST_NAME: 'osot_representative_first_name', // Business required, max 255
  REPRESENTATIVE_LAST_NAME: 'osot_representative_last_name', // Business required, max 255
  REPRESENTATIVE_JOB_TITLE: 'osot_representative_job_title', // Text, max 255

  // Contact Information Fields
  AFFILIATE_EMAIL: 'osot_affiliate_email', // Business required, max 255
  AFFILIATE_PHONE: 'osot_affiliate_phone', // Text, max 14
  AFFILIATE_WEBSITE: 'osot_affiliate_website', // Text, max 255

  // Social Media Fields
  AFFILIATE_FACEBOOK: 'osot_affiliate_facebook', // Text, max 255
  AFFILIATE_INSTAGRAM: 'osot_affiliate_instagram', // Text, max 255
  AFFILIATE_TIKTOK: 'osot_affiliate_tiktok', // Text, max 255
  AFFILIATE_LINKEDIN: 'osot_affiliate_linkedin', // Text, max 255

  // Address Fields
  AFFILIATE_ADDRESS_1: 'osot_affiliate_address_1', // Business required, max 255
  AFFILIATE_ADDRESS_2: 'osot_affiliate_address_2', // Text, max 255
  AFFILIATE_CITY: 'osot_affiliate_city', // Choice: Cities
  OTHER_CITY: 'osot_other_city', // Text, max 255
  AFFILIATE_PROVINCE: 'osot_affiliate_province', // Choice: Provinces
  OTHER_PROVINCE_STATE: 'osot_other_province_state', // Text, max 255
  AFFILIATE_POSTAL_CODE: 'osot_affiliate_postal_code', // Business required, max 7
  AFFILIATE_COUNTRY: 'osot_affiliate_country', // Choice: Countries

  // Account & Security Fields
  PASSWORD: 'osot_password', // Text, max 255 (encrypted)
  ACCOUNT_STATUS: 'osot_account_status', // Choice: Account Status
  ACCOUNT_DECLARATION: 'osot_account_declaration', // Business required, Yes/No
  ACTIVE_MEMBER: 'osot_active_member', // Yes/No, default false

  // Access Control Fields
  ACCESS_MODIFIERS: 'osot_access_modifiers', // Choice: Access Modifiers
  PRIVILEGE: 'osot_privilege', // Choice: Privileges
} as const;

// ========================================
// ODATA CONFIGURATION
// ========================================

/**
 * OData configuration for Affiliate Dataverse operations
 */
export const AFFILIATE_ODATA = {
  // Table Configuration
  TABLE_NAME: 'osot_table_account_affiliates',
  ENTITY_SET_NAME: 'osot_table_account_affiliates',
  ENTITY_TYPE_NAME: 'osot_table_account_affiliate',

  // Primary Key Field
  PRIMARY_KEY: 'osot_table_account_affiliateid',

  // Relationship Navigation
  RELATIONSHIPS: {
    OWNER: 'ownerid',
  },

  // Standard OData Query Options
  DEFAULT_SELECT: [
    AFFILIATE_FIELDS.AFFILIATE_ID,
    AFFILIATE_FIELDS.AFFILIATE_NAME,
    AFFILIATE_FIELDS.AFFILIATE_AREA,
    AFFILIATE_FIELDS.REPRESENTATIVE_FIRST_NAME,
    AFFILIATE_FIELDS.REPRESENTATIVE_LAST_NAME,
    AFFILIATE_FIELDS.REPRESENTATIVE_JOB_TITLE,
    AFFILIATE_FIELDS.AFFILIATE_EMAIL,
    AFFILIATE_FIELDS.AFFILIATE_PHONE,
    AFFILIATE_FIELDS.AFFILIATE_WEBSITE,
    AFFILIATE_FIELDS.AFFILIATE_ADDRESS_1,
    AFFILIATE_FIELDS.AFFILIATE_ADDRESS_2,
    AFFILIATE_FIELDS.AFFILIATE_CITY,
    AFFILIATE_FIELDS.OTHER_CITY,
    AFFILIATE_FIELDS.AFFILIATE_PROVINCE,
    AFFILIATE_FIELDS.OTHER_PROVINCE_STATE,
    AFFILIATE_FIELDS.AFFILIATE_POSTAL_CODE,
    AFFILIATE_FIELDS.AFFILIATE_COUNTRY,
    AFFILIATE_FIELDS.ACCOUNT_STATUS,
    AFFILIATE_FIELDS.ACCOUNT_DECLARATION,
    AFFILIATE_FIELDS.ACTIVE_MEMBER,
    AFFILIATE_FIELDS.ACCESS_MODIFIERS,
    AFFILIATE_FIELDS.PRIVILEGE,
    AFFILIATE_FIELDS.CREATED_ON,
    AFFILIATE_FIELDS.MODIFIED_ON,
  ].join(','),

  // Expand Options for Related Data
  DEFAULT_EXPAND: '',
} as const;

// ========================================
// CACHE CONSTANTS
// ========================================

/**
 * Cache keys for affiliate data
 */
export const AFFILIATE_CACHE_KEYS = {
  PREFIX: 'affiliate:',
  BY_ID: 'affiliate:id:',
  BY_EMAIL: 'affiliate:email:',
  BY_AREA: 'affiliate:area:',
  BY_STATUS: 'affiliate:status:',
  STATISTICS: 'affiliate:statistics',
  PROVINCES: 'affiliate:provinces',
  COUNTRIES: 'affiliate:countries',
  AREAS: 'affiliate:areas',
} as const;

/**
 * Cache TTL (Time To Live) in seconds
 */
export const AFFILIATE_CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  EMAIL_VERIFICATION_TIMEOUT: 86400, // 24 hours
} as const;

/**
 * Default boolean values
 */
export const AFFILIATE_DEFAULTS = {
  ACCOUNT_DECLARATION: false,
  ACTIVE_MEMBER: false,
} as const;

// ========================================
// ERROR MESSAGES
// ========================================

/**
 * Standard error messages for affiliate operations
 */
export const AFFILIATE_ERROR_MESSAGES = {
  NOT_FOUND: 'Affiliate not found',
  EMAIL_EXISTS: 'Email already exists',
  INVALID_AREA: 'Invalid affiliate area',
  INVALID_STATUS: 'Invalid account status',
  INVALID_PRIVILEGE: 'Invalid privilege level',
  UNAUTHORIZED: 'Unauthorized access',
  VALIDATION_FAILED: 'Validation failed',
  CREATE_FAILED: 'Failed to create affiliate',
  UPDATE_FAILED: 'Failed to update affiliate',
  DELETE_FAILED: 'Failed to delete affiliate',
} as const;

// ========================================
// SUCCESS MESSAGES
// ========================================

/**
 * Standard success messages for affiliate operations
 */
export const AFFILIATE_SUCCESS_MESSAGES = {
  CREATED: 'Affiliate created successfully',
  UPDATED: 'Affiliate updated successfully',
  DELETED: 'Affiliate deleted successfully',
  VALIDATED: 'Affiliate validated successfully',
  STATUS_CHANGED: 'Affiliate status changed successfully',
} as const;

// ========================================
// TYPE EXPORTS
// ========================================

/**
 * Type definitions for constants
 */
export type AffiliateArea =
  (typeof AFFILIATE_AREAS)[keyof typeof AFFILIATE_AREAS];
export type AffiliateAccountStatus =
  (typeof AFFILIATE_ACCOUNT_STATUS)[keyof typeof AFFILIATE_ACCOUNT_STATUS];
export type AffiliatePrivilege =
  (typeof AFFILIATE_PRIVILEGES)[keyof typeof AFFILIATE_PRIVILEGES];
export type AffiliateAccessModifier =
  (typeof AFFILIATE_ACCESS_MODIFIERS)[keyof typeof AFFILIATE_ACCESS_MODIFIERS];
export type AffiliateRepresentativeJobTitle =
  (typeof AFFILIATE_REPRESENTATIVE_JOB_TITLES)[keyof typeof AFFILIATE_REPRESENTATIVE_JOB_TITLES];
export type AffiliateProvince =
  (typeof AFFILIATE_PROVINCES)[keyof typeof AFFILIATE_PROVINCES];
export type AffiliateCountry =
  (typeof AFFILIATE_COUNTRIES)[keyof typeof AFFILIATE_COUNTRIES];

// ========================================
// API CONSTANTS
// ========================================

/**
 * API route prefixes
 */
export const AFFILIATE_API_ROUTES = {
  PUBLIC: 'public/affiliate',
  PRIVATE: 'private/affiliate',
} as const;

/**
 * Default pagination settings
 */
export const AFFILIATE_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// ========================================
// BUSINESS RULES
// ========================================

/**
 * Business rule constants
 */
export const AFFILIATE_BUSINESS_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  ACCOUNT_LOCK_DURATION: 3600, // 1 hour in seconds
  SESSION_TIMEOUT: 1800, // 30 minutes in seconds
  EMAIL_VERIFICATION_TIMEOUT: 86400, // 24 hours in seconds
} as const;
