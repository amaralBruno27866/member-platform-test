/**
 * Membership Employment Constants
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - enums: References centralized enums for Choice field validation
 *   • Privilege: osot_privilege (Choices_Privilege)
 *   • AccessModifier: osot_access_modifiers (Choices_Access_Modifiers)
 * - local enums: Module-specific enums for employment choices
 *   • EmploymentStatus: osot_employment_status (Choices_Employment_Status)
 *   • WorkHours: osot_work_hours (Choices_Work_Hours) - Multiple choice
 *   • RoleDescription: osot_role_descriptor (Choices_Role_Descriptor)
 *   • PracticeYears: osot_practice_years (Choices_Practice_Years)
 *   • Funding: osot_position_funding (Choices_Funding) - Multiple choice
 *   • Benefits: osot_employment_benefits (Choices_Benefits) - Multiple choice
 *   • HourlyEarnings: osot_earnings_* (Choices_Hourly_Earnings)
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Only essential constants for OSOT membership employment management
 * - Dataverse field mappings from Table Membership Employment.csv
 * - Business validation rules based on CSV specifications
 * - Enum-based validation for all Choice fields from CSV
 */

// Essential modules integration
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccessModifier, Privilege } from '../../../../common/enums';

// Local module enums
import { EmploymentStatus } from '../enums/employment-status.enum';
import { WorkHours } from '../enums/work-hours.enum';
import { RoleDescription } from '../enums/role-descriptor.enum';
import { PracticeYears } from '../enums/practice-years.enum';
import { Funding } from '../enums/funding.enum';
import { Benefits } from '../enums/benefits.enum';
import { HourlyEarnings } from '../enums/hourly-earnings.enum';

// ========================================
// MEMBERSHIP EMPLOYMENT VALIDATION RULES
// ========================================

/**
 * Membership year validation
 * Based on CSV: Single line of text, 4 characters max
 */
export const MEMBERSHIP_YEAR_LENGTH = {
  MIN_LENGTH: 4,
  MAX_LENGTH: 4,
  PATTERN: /^\d{4}$/, // Must be a 4-digit year
} as const;

/**
 * Employment ID format validation
 * Based on CSV: Autonumber with string prefix "osot-emp", 7 digits minimum
 * Example: osot-emp-0000001
 */
export const EMPLOYMENT_ID_PATTERN = /^osot-emp-\d{7}$/;

/**
 * Text field length validation
 * Based on CSV: "Other" fields and Union_Name are 255 characters max
 */
export const TEXT_FIELD_LENGTH = {
  MIN_LENGTH: 0,
  MAX_LENGTH: 255,
} as const;

// ========================================
// ENUM VALIDATION CONSTANTS
// ========================================

/**
 * Enum validation arrays for Choice fields from CSV
 * Based on Dataverse global choice synchronization
 */
export const MEMBERSHIP_EMPLOYMENT_ENUMS = {
  // From CSV: osot_employment_status (Choices_Employment_Status)
  VALID_EMPLOYMENT_STATUSES: Object.values(EmploymentStatus).filter(
    (v) => typeof v === 'number',
  ) as EmploymentStatus[],

  // From CSV: osot_work_hours (Choices_Work_Hours) - Multiple choice
  VALID_WORK_HOURS: Object.values(WorkHours).filter(
    (v) => typeof v === 'number',
  ) as WorkHours[],

  // From CSV: osot_role_descriptor (Choices_Role_Descriptor)
  VALID_ROLE_DESCRIPTORS: Object.values(RoleDescription).filter(
    (v) => typeof v === 'number',
  ) as RoleDescription[],

  // From CSV: osot_practice_years (Choices_Practice_Years)
  VALID_PRACTICE_YEARS: Object.values(PracticeYears).filter(
    (v) => typeof v === 'number',
  ) as PracticeYears[],

  // From CSV: osot_position_funding (Choices_Funding) - Multiple choice
  VALID_FUNDING_SOURCES: Object.values(Funding).filter(
    (v) => typeof v === 'number',
  ) as Funding[],

  // From CSV: osot_employment_benefits (Choices_Benefits) - Multiple choice
  VALID_BENEFITS: Object.values(Benefits).filter(
    (v) => typeof v === 'number',
  ) as Benefits[],

  // From CSV: osot_earnings_* (Choices_Hourly_Earnings)
  VALID_HOURLY_EARNINGS: Object.values(HourlyEarnings).filter(
    (v) => typeof v === 'number',
  ) as HourlyEarnings[],

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
 * Dataverse field names for Membership Employment table
 * Based on Table Membership Employment.csv schema - using logical names
 */
export const MEMBERSHIP_EMPLOYMENT_FIELDS = {
  // System fields
  EMPLOYMENT_ID: 'osot_employment_id', // Business ID (osot-emp-0000001) - CSV: logical name
  TABLE_ID: 'osot_table_membership_employmentid', // GUID - CSV: logical name
  CREATED_ON: 'createdon', // System audit
  MODIFIED_ON: 'modifiedon', // System audit
  OWNER_ID: 'ownerid', // System owner

  // Lookup fields (relationships to other tables)
  TABLE_ACCOUNT: 'osot_table_account', // Lookup to Table_Account
  ACCOUNT_BIND: 'osot_Table_Account@odata.bind', // OData bind for account lookup
  ACCOUNT_VALUE: '_osot_table_account_value', // OData query field for account
  TABLE_ACCOUNT_AFFILIATE: 'osot_table_account_affiliate', // Lookup to Table_Account_Affiliate
  ACCOUNT_AFFILIATE_BIND: 'osot_Table_Account_Affiliate@odata.bind', // OData bind for affiliate lookup
  ACCOUNT_AFFILIATE_VALUE: '_osot_table_account_affiliate_value', // OData query field for affiliate

  // Business fields (from CSV)
  MEMBERSHIP_YEAR: 'osot_membership_year', // Single line of text (4 chars) - Business required
  EMPLOYMENT_STATUS: 'osot_employment_status', // Choice - Choices_Employment_Status - Business required
  WORK_HOURS: 'osot_work_hours', // Choice (Multiple) - Choices_Work_Hours - Business required
  ROLE_DESCRIPTOR: 'osot_role_descriptor', // Choice - Choices_Role_Descriptor - Business required
  ROLE_DESCRIPTOR_OTHER: 'osot_role_descriptor_other', // Single line of text (255 chars) - Optional
  PRACTICE_YEARS: 'osot_practice_years', // Choice - Choices_Practice_Years - Business required
  POSITION_FUNDING: 'osot_position_funding', // Choice (Multiple) - Choices_Funding - Business required
  POSITION_FUNDING_OTHER: 'osot_position_funding_other', // Single line of text (255 chars) - Optional
  EMPLOYMENT_BENEFITS: 'osot_employment_benefits', // Choice (Multiple) - Choices_Benefits - Business required
  EMPLOYMENT_BENEFITS_OTHER: 'osot_employment_benefits_other', // Single line of text (255 chars) - Optional
  EARNINGS_EMPLOYMENT: 'osot_earnings_employment', // Choice - Choices_Hourly_Earnings - Business required
  EARNINGS_SELF_DIRECT: 'osot_earnings_self_direct', // Choice - Choices_Hourly_Earnings - Business required
  EARNINGS_SELF_INDIRECT: 'osot_earnings_self_indirect', // Choice - Choices_Hourly_Earnings - Business required
  UNION_NAME: 'osot_union_name', // Single line of text (255 chars) - Business required
  ANOTHER_EMPLOYMENT: 'osot_another_employment', // Yes/No (boolean) - Optional

  // Access control fields (optional - from CSV "Optional")
  PRIVILEGE: 'osot_privilege', // Choice - Choices_Privilege (default: Owner)
  ACCESS_MODIFIERS: 'osot_access_modifiers', // Choice - Choices_Access_Modifiers (default: Private)
} as const;

/**
 * Table naming conventions based on CSV Table Information section
 */
export const MEMBERSHIP_EMPLOYMENT_TABLE = {
  DISPLAY_NAME: 'Table_Membership_Employment', // For UI/Interface (singular from CSV)
  PLURAL_NAME: 'Table_Membership_Employments', // For routes/endpoints
  SCHEMA_NAME: 'osot_Table_Membership_Employment', // CSV: Schema name
  LOGICAL_NAME: 'osot_table_membership_employments', // CSV: Logical name (lowercase, plural)
} as const;

/**
 * OData query configurations for Dataverse operations
 */
export const MEMBERSHIP_EMPLOYMENT_ODATA = {
  TABLE_NAME: MEMBERSHIP_EMPLOYMENT_TABLE.LOGICAL_NAME,
  BUSINESS_ID_FIELD: MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_ID,
  PRIMARY_KEY_FIELD: MEMBERSHIP_EMPLOYMENT_FIELDS.TABLE_ID,

  // Field mappings for OData queries
  EMPLOYMENT_ID: MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_ID,
  MEMBERSHIP_YEAR: MEMBERSHIP_EMPLOYMENT_FIELDS.MEMBERSHIP_YEAR,
  EMPLOYMENT_STATUS: MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_STATUS,
  WORK_HOURS: MEMBERSHIP_EMPLOYMENT_FIELDS.WORK_HOURS,
  ROLE_DESCRIPTOR: MEMBERSHIP_EMPLOYMENT_FIELDS.ROLE_DESCRIPTOR,
  ROLE_DESCRIPTOR_OTHER: MEMBERSHIP_EMPLOYMENT_FIELDS.ROLE_DESCRIPTOR_OTHER,
  PRACTICE_YEARS: MEMBERSHIP_EMPLOYMENT_FIELDS.PRACTICE_YEARS,
  POSITION_FUNDING: MEMBERSHIP_EMPLOYMENT_FIELDS.POSITION_FUNDING,
  POSITION_FUNDING_OTHER: MEMBERSHIP_EMPLOYMENT_FIELDS.POSITION_FUNDING_OTHER,
  EMPLOYMENT_BENEFITS: MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_BENEFITS,
  EMPLOYMENT_BENEFITS_OTHER:
    MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_BENEFITS_OTHER,
  EARNINGS_EMPLOYMENT: MEMBERSHIP_EMPLOYMENT_FIELDS.EARNINGS_EMPLOYMENT,
  EARNINGS_SELF_DIRECT: MEMBERSHIP_EMPLOYMENT_FIELDS.EARNINGS_SELF_DIRECT,
  EARNINGS_SELF_INDIRECT: MEMBERSHIP_EMPLOYMENT_FIELDS.EARNINGS_SELF_INDIRECT,
  UNION_NAME: MEMBERSHIP_EMPLOYMENT_FIELDS.UNION_NAME,
  ANOTHER_EMPLOYMENT: MEMBERSHIP_EMPLOYMENT_FIELDS.ANOTHER_EMPLOYMENT,
  PRIVILEGE: MEMBERSHIP_EMPLOYMENT_FIELDS.PRIVILEGE,
  ACCESS_MODIFIERS: MEMBERSHIP_EMPLOYMENT_FIELDS.ACCESS_MODIFIERS,
  CREATED_ON: MEMBERSHIP_EMPLOYMENT_FIELDS.CREATED_ON,
  MODIFIED_ON: MEMBERSHIP_EMPLOYMENT_FIELDS.MODIFIED_ON,
  OWNER_ID: MEMBERSHIP_EMPLOYMENT_FIELDS.OWNER_ID,

  // Lookup field mappings
  TABLE_ACCOUNT: MEMBERSHIP_EMPLOYMENT_FIELDS.TABLE_ACCOUNT,
  ACCOUNT_BIND: MEMBERSHIP_EMPLOYMENT_FIELDS.ACCOUNT_BIND,
  ACCOUNT_VALUE: MEMBERSHIP_EMPLOYMENT_FIELDS.ACCOUNT_VALUE,
  TABLE_ACCOUNT_AFFILIATE: MEMBERSHIP_EMPLOYMENT_FIELDS.TABLE_ACCOUNT_AFFILIATE,
  ACCOUNT_AFFILIATE_BIND: MEMBERSHIP_EMPLOYMENT_FIELDS.ACCOUNT_AFFILIATE_BIND,
  ACCOUNT_AFFILIATE_VALUE: MEMBERSHIP_EMPLOYMENT_FIELDS.ACCOUNT_AFFILIATE_VALUE,

  // $select clause for OData queries - ensures all fields are returned including GUID
  SELECT_FIELDS: [
    // NOTE: Do NOT include TABLE_ID (primary key) in $select - Dataverse returns it automatically
    MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_ID, // Business ID (osot_employment_id)
    MEMBERSHIP_EMPLOYMENT_FIELDS.MEMBERSHIP_YEAR,
    MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_STATUS,
    MEMBERSHIP_EMPLOYMENT_FIELDS.WORK_HOURS,
    MEMBERSHIP_EMPLOYMENT_FIELDS.ROLE_DESCRIPTOR,
    MEMBERSHIP_EMPLOYMENT_FIELDS.ROLE_DESCRIPTOR_OTHER,
    MEMBERSHIP_EMPLOYMENT_FIELDS.PRACTICE_YEARS,
    MEMBERSHIP_EMPLOYMENT_FIELDS.POSITION_FUNDING,
    MEMBERSHIP_EMPLOYMENT_FIELDS.POSITION_FUNDING_OTHER,
    MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_BENEFITS,
    MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_BENEFITS_OTHER,
    MEMBERSHIP_EMPLOYMENT_FIELDS.EARNINGS_EMPLOYMENT,
    MEMBERSHIP_EMPLOYMENT_FIELDS.EARNINGS_SELF_DIRECT,
    MEMBERSHIP_EMPLOYMENT_FIELDS.EARNINGS_SELF_INDIRECT,
    MEMBERSHIP_EMPLOYMENT_FIELDS.UNION_NAME,
    MEMBERSHIP_EMPLOYMENT_FIELDS.ANOTHER_EMPLOYMENT,
    MEMBERSHIP_EMPLOYMENT_FIELDS.PRIVILEGE,
    MEMBERSHIP_EMPLOYMENT_FIELDS.ACCESS_MODIFIERS,
    // Use _value fields for lookups in $select queries
    MEMBERSHIP_EMPLOYMENT_FIELDS.ACCOUNT_VALUE, // _osot_table_account_value
    // Note: ACCOUNT_AFFILIATE_VALUE field does not exist in this entity
    MEMBERSHIP_EMPLOYMENT_FIELDS.CREATED_ON,
    MEMBERSHIP_EMPLOYMENT_FIELDS.MODIFIED_ON,
    MEMBERSHIP_EMPLOYMENT_FIELDS.OWNER_ID,
  ].join(','),
} as const;

// ========================================
// ERROR CODES MAPPING
// ========================================

/**
 * Membership Employment specific error codes
 * Uses existing ErrorCodes enum from essential modules
 */
export const MEMBERSHIP_EMPLOYMENT_ERROR_CODES = {
  INVALID_MEMBERSHIP_YEAR: ErrorCodes.INVALID_INPUT,
  INVALID_LOOKUP_REFERENCE: ErrorCodes.INVALID_INPUT,
  MISSING_REQUIRED_LOOKUP: ErrorCodes.VALIDATION_ERROR,
  EXCLUSIVE_USER_REFERENCE_VIOLATION: ErrorCodes.VALIDATION_ERROR,
  DUPLICATE_EMPLOYMENT: ErrorCodes.VALIDATION_ERROR,
  INVALID_ROLE_DESCRIPTOR_OTHER: ErrorCodes.VALIDATION_ERROR,
  INVALID_POSITION_FUNDING_OTHER: ErrorCodes.VALIDATION_ERROR,
  INVALID_EMPLOYMENT_BENEFITS_OTHER: ErrorCodes.VALIDATION_ERROR,
  MISSING_ACTIVE_MEMBERSHIP_SETTINGS: ErrorCodes.VALIDATION_ERROR, // No active membership-settings found
  MEMBERSHIP_YEAR_NOT_USER_EDITABLE: ErrorCodes.VALIDATION_ERROR, // User tried to set/edit membership_year
  DUPLICATE_EMPLOYMENT_FOR_YEAR: ErrorCodes.VALIDATION_ERROR, // User already has employment for this year
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
export const MEMBERSHIP_EMPLOYMENT_DEFAULTS = {
  // From CSV: Default values specified
  PRIVILEGE: Privilege.OWNER, // CSV: Default "Owner"
  ACCESS_MODIFIERS: AccessModifier.PRIVATE, // CSV: Default "Private"

  // Boolean defaults from CSV
  ANOTHER_EMPLOYMENT: false, // CSV: Default "No"

  // ⚠️ WARNING: DO NOT USE THIS FOR ACTUAL MEMBERSHIP YEAR!
  // This is only a fallback/placeholder value.
  // The actual membership year MUST come from MembershipCategoryMembershipYearService.getCurrentMembershipYear()
  // Example: In November 2025, the ACTIVE membership year might be 2026, NOT the calendar year!
  CURRENT_MEMBERSHIP_YEAR: new Date().getFullYear().toString(), // ⚠️ DO NOT USE - Use MembershipYearService instead!
} as const;

// ========================================
// BUSINESS RULES CONSTANTS
// ========================================

/**
 * Business validation constants for membership employment
 */
export const MEMBERSHIP_EMPLOYMENT_BUSINESS_RULES = {
  // Year validation
  MIN_YEAR: 2020, // Minimum acceptable year
  MAX_YEAR: new Date().getFullYear() + 5, // Maximum future year (calendar-based validation only)

  // Lookup validation
  REQUIRED_LOOKUP_COUNT: 1, // At least one of: account or affiliate
  EXCLUSIVE_USER_REFERENCE: true, // Account and Affiliate are mutually exclusive (XOR)
  LOOKUP_FIELDS: ['tableAccount', 'tableAccountAffiliate'] as const,

  // Conditional field validation (when "Other" is selected)
  REQUIRES_OTHER_FIELD: {
    ROLE_DESCRIPTOR: RoleDescription.OTHER, // When OTHER selected, role_descriptor_other is required
    POSITION_FUNDING: Funding.OTHER, // When OTHER selected, position_funding_other is required
    EMPLOYMENT_BENEFITS: Benefits.OTHER, // When OTHER selected, employment_benefits_other is required
  },

  // Year format
  YEAR_FORMAT: 'YYYY', // 4-digit year format

  // CRITICAL: Membership Year Management
  // - membership_year is SYSTEM-DEFINED, NOT user-provided
  // - System queries membership-settings to get active year for user
  // - User CANNOT manually set or edit membership_year
  // - CREATE blocked if user has no active membership-settings
  // - UPDATE never allows changing membership_year
  MEMBERSHIP_YEAR_SOURCE: 'membership-settings' as const,
  MEMBERSHIP_YEAR_IS_USER_EDITABLE: false,
  REQUIRE_ACTIVE_MEMBERSHIP_SETTINGS: true,

  // Uniqueness: One employment record per user per year
  // - User can have multiple records across different years (2025, 2026, etc.)
  // - But only ONE record per year
  UNIQUE_CONSTRAINT_FIELDS: ['userGuid', 'membershipYear'] as const,
  ONE_RECORD_PER_USER_PER_YEAR: true,
} as const;

// ========================================
// ROUTE CONFIGURATIONS
// ========================================

/**
 * API route configurations based on plural name from CSV
 */
export const MEMBERSHIP_EMPLOYMENT_ROUTES = {
  // Based on CSV Plural Name: "Table_Membership_Employments" -> "membership-employments"
  BASE_PATH: 'membership-employments',
  PUBLIC_PATH: 'public/membership-employments',
  PRIVATE_PATH: 'private/membership-employments',

  // Endpoint patterns
  BY_ID: ':id',
  BY_BUSINESS_ID: 'business/:businessId',
  BY_YEAR: 'year/:year',
  BY_ACCOUNT: 'account/:accountId',
  BY_AFFILIATE: 'affiliate/:affiliateId',
  MY_EMPLOYMENTS: 'me', // For authenticated users
} as const;

// ========================================
// PERMISSION CONFIGURATIONS
// ========================================

/**
 * Permission levels for membership employment operations
 * Based on Privilege enum and dataverse-app.helper.ts
 *
 * PRIVILEGE LEVELS:
 * - MAIN: Full access (create, read, write, delete)
 * - ADMIN: Administrative access (read, write)
 * - OWNER: User self-service (create, read, write own data)
 *
 * AUTHENTICATION:
 * - All private routes require JWT authentication
 * - User context extracted from JWT payload
 * - Users can only access their own employment records
 */
export const MEMBERSHIP_EMPLOYMENT_PERMISSIONS = {
  // Create permissions (who can create employment records)
  CAN_CREATE: [Privilege.MAIN, Privilege.ADMIN, Privilege.OWNER],

  // Read permissions (who can read employment records)
  CAN_READ: [Privilege.MAIN, Privilege.ADMIN, Privilege.OWNER],

  // Update permissions (who can update employment records)
  CAN_UPDATE: [Privilege.MAIN, Privilege.ADMIN, Privilege.OWNER],

  // Delete permissions (who can delete employment records)
  CAN_DELETE: [Privilege.MAIN, Privilege.ADMIN],

  // Default privilege for new employment records
  DEFAULT_PRIVILEGE: Privilege.OWNER,
} as const;

// ========================================
// QUERY CONFIGURATIONS
// ========================================

/**
 * Query configurations for listing and filtering
 */
export const MEMBERSHIP_EMPLOYMENT_QUERY = {
  // Pagination
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,

  // Sorting
  DEFAULT_SORT_FIELD: MEMBERSHIP_EMPLOYMENT_FIELDS.MEMBERSHIP_YEAR,
  DEFAULT_SORT_ORDER: 'DESC' as const,

  // Filtering
  SEARCHABLE_FIELDS: [
    MEMBERSHIP_EMPLOYMENT_FIELDS.EMPLOYMENT_ID,
    MEMBERSHIP_EMPLOYMENT_FIELDS.MEMBERSHIP_YEAR,
    MEMBERSHIP_EMPLOYMENT_FIELDS.UNION_NAME,
  ] as const,
} as const;
