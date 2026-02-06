/**
 * Organization Constants
 *
 * Centralized constants for Organization entity:
 * - Error codes
 * - Field mappings
 * - Default values
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - enums: References centralized enums for validation
 */

import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccessModifier, Privilege } from '../../../../common/enums';

// Re-export OData and Validation constants
export * from './organization-odata.constant';
export * from './organization-validation.constant';

// ========================================
// ERROR CODES MAPPING
// ========================================

/**
 * Organization-specific error codes
 * Uses existing ErrorCodes enum from essential modules
 */
export const ORGANIZATION_ERROR_CODES = {
  /**
   * Organization not found by ID or slug
   */
  NOT_FOUND: ErrorCodes.NOT_FOUND,

  /**
   * Slug already exists (duplicate)
   */
  SLUG_ALREADY_EXISTS: ErrorCodes.VALIDATION_ERROR,

  /**
   * Slug is reserved
   */
  SLUG_RESERVED: ErrorCodes.VALIDATION_ERROR,

  /**
   * Invalid slug format
   */
  INVALID_SLUG: ErrorCodes.VALIDATION_ERROR,

  /**
   * Validation error (generic)
   */
  VALIDATION_ERROR: ErrorCodes.VALIDATION_ERROR,

  /**
   * Permission denied
   */
  PERMISSION_DENIED: ErrorCodes.PERMISSION_DENIED,

  /**
   * Dataverse service error
   */
  DATAVERSE_ERROR: ErrorCodes.DATAVERSE_SERVICE_ERROR,

  /**
   * Internal server error
   */
  INTERNAL_ERROR: ErrorCodes.INTERNAL_ERROR,

  /**
   * Organization is inactive (cannot be used for login)
   */
  ORGANIZATION_INACTIVE: ErrorCodes.VALIDATION_ERROR,
} as const;

// ========================================
// DATAVERSE FIELD MAPPINGS
// ========================================

/**
 * Dataverse field names for Organization table
 * Based on Table Organization.csv schema
 * (Also exported from organization-odata.constant.ts)
 */
export const ORGANIZATION_FIELDS = {
  // System fields
  ID: 'osot_organizationid',
  TABLE_ID: 'osot_table_organizationid',
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',

  // Business fields
  ORGANIZATION_NAME: 'osot_organization_name',
  LEGAL_NAME: 'osot_legal_name',
  ACRONYM: 'osot_acronym',
  SLUG: 'osot_slug',
  ORGANIZATION_STATUS: 'osot_organization_status',
  ORGANIZATION_LOGO: 'osot_organization_logo',
  ORGANIZATION_WEBSITE: 'osot_organization_website',
  REPRESENTATIVE: 'osot_representative',
  ORGANIZATION_EMAIL: 'osot_organization_email',
  ORGANIZATION_PHONE: 'osot_organization_phone',
  ACCESS_MODIFIERS: 'osot_access_modifier',
  PRIVILEGE: 'osot_privilege',

  // Relationship fields
  TABLE_ADDRESS: 'osot_table_address',
  ADDRESS_BIND: 'osot_Table_Address@odata.bind',
} as const;

// ========================================
// DEFAULT VALUES
// ========================================

/**
 * Default values for organization creation
 */
export const ORGANIZATION_DEFAULT_VALUES = {
  /**
   * Default privilege level
   * Main = 1 (from Privilege enum)
   */
  privilege: Privilege.MAIN,

  /**
   * Default access modifier
   * Private = 1 (from AccessModifier enum)
   */
  accessModifier: AccessModifier.PRIVATE,

  /**
   * Default status
   * Active = 1 (will be defined in OrganizationStatus enum)
   */
  status: 1, // Active
} as const;

// ========================================
// QUERY LIMITS
// ========================================

/**
 * Pagination and query limits
 */
export const ORGANIZATION_QUERY_LIMITS = {
  /**
   * Default page size for list queries
   */
  DEFAULT_PAGE_SIZE: 20,

  /**
   * Maximum page size
   */
  MAX_PAGE_SIZE: 100,

  /**
   * Minimum page size
   */
  MIN_PAGE_SIZE: 1,
} as const;

// ========================================
// REPOSITORY INJECTION TOKEN
// ========================================

/**
 * Injection token for Organization Repository
 * Used in NestJS dependency injection
 */
export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');
