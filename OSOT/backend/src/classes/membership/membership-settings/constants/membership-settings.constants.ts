/**
 * Membership Settings Constants
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - enums: References centralized enums for Choice field validation
 *   • MembershipGroup: osot_membership_group (Choices_Membership_Group)
 *   • AccountStatus: osot_membership_year_status (Choices_Status)
 *   • Privilege: osot_privilege (Choices_Privilege)
 *   • AccessModifier: osot_access_modifiers (Choices_Access_Modifiers)
 * - utils: Integration flags for centralized utilities
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Only essential constants for OSOT membership year period configuration
 * - Dataverse field mappings from Table Membership Setting.csv
 * - Business validation rules based on CSV specifications
 * - Enum-based validation for all Choice fields from CSV
 * - Supports Individual (account) and Business (affiliate) membership groups
 */

// Essential modules integration
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  AccessModifier,
  Privilege,
  AccountStatus,
} from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';

// ========================================
// MEMBERSHIP SETTINGS VALIDATION RULES
// ========================================

/**
 * Membership year validation range
 * Business rule: Support current year and future planning (5 years ahead)
 */
export const MEMBERSHIP_YEAR_RANGE = {
  MIN_YEAR: 2020,
  MAX_YEAR: new Date().getFullYear() + 5,
} as const;

/**
 * Settings ID format validation
 * Based on CSV: Autonumber with string prefix "osot-set", 7 digits minimum
 * Example: osot-set-0000001
 */
export const SETTINGS_ID_PATTERN = /^osot-set-\d{7}$/;

// ========================================
// ENUM VALIDATION CONSTANTS
// ========================================

/**
 * Enum validation arrays for Choice fields from CSV
 * Based on Dataverse global choice synchronization
 * NOTE: osot_membership_year is now Single line of text (not Choice)
 */
export const MEMBERSHIP_SETTINGS_ENUMS = {
  // osot_membership_year is now text field - no enum validation needed

  // From CSV: osot_membership_group (Choices_Membership_Group)
  VALID_GROUPS: Object.values(MembershipGroup).filter(
    (v) => typeof v === 'number',
  ) as MembershipGroup[],

  // From CSV: osot_membership_year_status (Choices_Status)
  VALID_STATUSES: Object.values(AccountStatus).filter(
    (v) => typeof v === 'number',
  ) as AccountStatus[],

  // From CSV: osot_privilege (Choices_Privilege)
  VALID_PRIVILEGES: Object.values(Privilege).filter(
    (v) => typeof v === 'number',
  ) as Privilege[],

  // From CSV: osot_access_modifiers (Choices_Access_Modifiers)
  VALID_ACCESS_MODIFIERS: Object.values(AccessModifier).filter(
    (v) => typeof v === 'number',
  ) as AccessModifier[],
} as const;

// ========================================
// DATAVERSE FIELD MAPPINGS
// ========================================

/**
 * Dataverse field names for Membership Settings table
 * Based on Table Membership Setting.csv schema - using logical names
 */
export const MEMBERSHIP_SETTINGS_FIELDS = {
  // System fields
  SETTINGS_ID: 'osot_settingsid', // Business ID (osot-set-0000001) - CSV: logical name
  TABLE_ID: 'osot_table_membership_settingid', // GUID - CORRECTED: singular form + id
  CREATED_ON: 'createdon', // System audit
  MODIFIED_ON: 'modifiedon', // System audit
  OWNER_ID: 'ownerid', // System owner

  // Relationship fields (required - from CSV "Business requires")
  ORGANIZATION: 'osot_table_organization', // Lookup to Table_Organization - MULTI-TENANT REQUIRED

  // Business fields (required - from CSV "Business requires")
  MEMBERSHIP_YEAR: 'osot_membership_year', // CSV: Single line of text (4 chars)
  MEMBERSHIP_YEAR_STATUS: 'osot_membership_year_status', // Choice - Choices_Status
  MEMBERSHIP_GROUP: 'osot_membership_group', // Choice - Choices_Membership_Group
  YEAR_STARTS: 'osot_year_starts', // Date only - Year period start
  YEAR_ENDS: 'osot_year_ends', // Date only - Year period end

  // Access control fields (optional - from CSV "Optional")
  PRIVILEGE: 'osot_privilege', // Choice - Choices_Privilege (default: Owner)
  ACCESS_MODIFIERS: 'osot_access_modifiers', // Choice - Choices_Access_Modifiers (default: Protected)
} as const;

/**
 * Table naming conventions based on CSV Table Information section
 */
export const MEMBERSHIP_SETTINGS_TABLE = {
  DISPLAY_NAME: 'Table_Membership_Setting', // For UI/Interface
  PLURAL_NAME: 'Table_Membership_Settings', // For routes/endpoints
  SCHEMA_NAME: 'osot_table_membership_settings', // CORRECTED: Now matches Dataverse!
  LOGICAL_NAME: 'osot_table_membership_settings', // For repository/internal use
} as const;

/**
 * OData query configurations for Dataverse operations
 */
export const MEMBERSHIP_SETTINGS_ODATA = {
  TABLE_NAME: MEMBERSHIP_SETTINGS_TABLE.SCHEMA_NAME,
  BUSINESS_ID_FIELD: MEMBERSHIP_SETTINGS_FIELDS.SETTINGS_ID,
  PRIMARY_KEY_FIELD: MEMBERSHIP_SETTINGS_FIELDS.TABLE_ID,

  // Relationship field bindings
  ORGANIZATION_BIND: 'osot_table_organization@odata.bind', // For write operations
  ORGANIZATION_LOOKUP_GUID: '_osot_table_organization_value', // For read operations (lookup GUID)

  // Field mappings for OData queries
  SETTINGS_ID: MEMBERSHIP_SETTINGS_FIELDS.SETTINGS_ID,
  ORGANIZATION: MEMBERSHIP_SETTINGS_FIELDS.ORGANIZATION,
  YEAR: MEMBERSHIP_SETTINGS_FIELDS.MEMBERSHIP_YEAR,
  GROUP: MEMBERSHIP_SETTINGS_FIELDS.MEMBERSHIP_GROUP,
  STATUS: MEMBERSHIP_SETTINGS_FIELDS.MEMBERSHIP_YEAR_STATUS,
  YEAR_STARTS: MEMBERSHIP_SETTINGS_FIELDS.YEAR_STARTS,
  YEAR_ENDS: MEMBERSHIP_SETTINGS_FIELDS.YEAR_ENDS,
  CREATED_ON: MEMBERSHIP_SETTINGS_FIELDS.CREATED_ON,
  MODIFIED_ON: MEMBERSHIP_SETTINGS_FIELDS.MODIFIED_ON,
  OWNER_ID: MEMBERSHIP_SETTINGS_FIELDS.OWNER_ID,
  ACCESS_MODIFIERS: MEMBERSHIP_SETTINGS_FIELDS.ACCESS_MODIFIERS,
  PRIVILEGE: MEMBERSHIP_SETTINGS_FIELDS.PRIVILEGE,

  // $select clause for OData queries - ensures all fields are returned including GUID and organization
  SELECT_FIELDS: [
    MEMBERSHIP_SETTINGS_FIELDS.TABLE_ID, // GUID - MUST be included for proper mapping
    MEMBERSHIP_SETTINGS_FIELDS.SETTINGS_ID, // Business ID
    MEMBERSHIP_SETTINGS_FIELDS.MEMBERSHIP_YEAR,
    MEMBERSHIP_SETTINGS_FIELDS.MEMBERSHIP_GROUP,
    MEMBERSHIP_SETTINGS_FIELDS.MEMBERSHIP_YEAR_STATUS,
    MEMBERSHIP_SETTINGS_FIELDS.YEAR_STARTS,
    MEMBERSHIP_SETTINGS_FIELDS.YEAR_ENDS,
    MEMBERSHIP_SETTINGS_FIELDS.CREATED_ON,
    MEMBERSHIP_SETTINGS_FIELDS.MODIFIED_ON,
    MEMBERSHIP_SETTINGS_FIELDS.OWNER_ID,
    MEMBERSHIP_SETTINGS_FIELDS.ACCESS_MODIFIERS,
    MEMBERSHIP_SETTINGS_FIELDS.PRIVILEGE,
    '_osot_table_organization_value', // Lookup GUID from read operations
  ].join(','),
} as const;

// ========================================
// ERROR CODES MAPPING
// ========================================

/**
 * Membership Settings specific error codes
 * Uses existing ErrorCodes enum from essential modules
 */
export const MEMBERSHIP_SETTINGS_ERROR_CODES = {
  INVALID_MEMBERSHIP_YEAR: ErrorCodes.INVALID_INPUT,
  INVALID_YEAR_PERIOD: ErrorCodes.INVALID_INPUT,
  DUPLICATE_GROUP_YEAR: ErrorCodes.VALIDATION_ERROR,
  NOT_FOUND: ErrorCodes.NOT_FOUND,
  PERMISSION_DENIED: ErrorCodes.PERMISSION_DENIED,
  VALIDATION_ERROR: ErrorCodes.VALIDATION_ERROR,
  DATAVERSE_ERROR: ErrorCodes.DATAVERSE_SERVICE_ERROR,
  INTERNAL_ERROR: ErrorCodes.INTERNAL_ERROR,
} as const;

// ========================================
// DEFAULT VALUES
// ========================================

/**
 * Default values based on CSV specifications
 */
export const MEMBERSHIP_SETTINGS_DEFAULTS = {
  // From CSV: Default values specified
  PRIVILEGE: Privilege.MAIN, // CSV: Default "Main"
  ACCESS_MODIFIERS: AccessModifier.PROTECTED, // CSV: Default "Protected"

  // Business defaults (using enums for type safety)
  MEMBERSHIP_YEAR_STATUS: AccountStatus.ACTIVE, // Default to Active status

  // Example defaults for fields
  CURRENT_MEMBERSHIP_YEAR: new Date().getFullYear().toString(), // CSV: Text field (4 chars)
  DEFAULT_GROUP: MembershipGroup.INDIVIDUAL, // Most common: Individual
} as const;

// ========================================
// BUSINESS RULES CONSTANTS
// ========================================

/**
 * Business validation constants for membership year period management
 */
export const MEMBERSHIP_BUSINESS_RULES = {
  // Multi-tenant requirement (CRITICAL)
  ORGANIZATION_REQUIRED: true, // MUST be present on every record
  ORGANIZATION_IMMUTABLE: true, // Cannot be changed after creation

  // Year period validation
  MAX_PERIOD_DAYS: 366, // Maximum period length (leap year)
  MIN_PERIOD_DAYS: 1, // Minimum period length

  // Group-year uniqueness
  UNIQUE_CONSTRAINT: 'group_year_unique', // Business rule: one setting per group/year

  // Date validation
  DATE_FORMAT: 'YYYY-MM-DD', // ISO date format for Dataverse
  MIN_YEAR: new Date().getFullYear(), // Cannot be in the past

  // Organization-scoped uniqueness
  ORGANIZATION_GROUP_YEAR_UNIQUE: 'org_group_year_unique', // Business rule: one setting per org/group/year
} as const;

// ========================================
// ROUTE CONFIGURATIONS
// ========================================

/**
 * API route configurations based on plural name from CSV
 */
export const MEMBERSHIP_SETTINGS_ROUTES = {
  // Based on CSV Plural Name: "Table_Membership_Settings" -> "membership-settings"
  BASE_PATH: 'membership-settings',
  PUBLIC_PATH: 'public/membership-settings',
  PRIVATE_PATH: 'private/membership-settings',

  // Endpoint patterns
  BY_ID: ':id',
  BY_BUSINESS_ID: 'business/:businessId',
  BY_GROUP: 'group/:group',
  BY_YEAR: 'year/:year',
  BY_GROUP_YEAR: 'group/:group/year/:year',
} as const;

// ========================================
// QUERY CONFIGURATIONS
// ========================================

/**
 * Query configurations for listing and filtering
 */
export const MEMBERSHIP_SETTINGS_QUERY = {
  // Pagination
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,

  // Sorting
  DEFAULT_SORT_FIELD: MEMBERSHIP_SETTINGS_FIELDS.MEMBERSHIP_YEAR,
  DEFAULT_SORT_ORDER: 'DESC' as const,

  // Filtering
  SEARCHABLE_FIELDS: [
    MEMBERSHIP_SETTINGS_FIELDS.SETTINGS_ID,
    MEMBERSHIP_SETTINGS_FIELDS.MEMBERSHIP_YEAR,
    MEMBERSHIP_SETTINGS_FIELDS.MEMBERSHIP_GROUP,
  ] as const,
} as const;
