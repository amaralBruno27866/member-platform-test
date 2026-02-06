/**
 * Membership Practices Constants
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - enums: References centralized enums for Choice field validation
 *   • Privilege: osot_privilege (Choices_Privilege)
 *   • AccessModifier: osot_access_modifiers (Choices_Access_Modifiers)
 * - local enums: Module-specific enums for practice choices
 *   • ClientsAge: osot_clients_age (Choices_Populations) - Multiple choice
 *   • PracticeArea: osot_practice_area (Choices_Practice_Area) - Multiple choice
 *   • PracticeSettings: osot_practice_settings (Choices_Practice_Settings) - Multiple choice
 *   • PracticeServices: osot_practice_services (Choices_Practice_Services) - Multiple choice
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Only essential constants for OSOT membership practice management
 * - Dataverse field mappings from Table Membership Practices.csv
 * - Business validation rules based on CSV specifications
 * - Enum-based validation for all Choice fields from CSV
 */

// Essential modules integration
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccessModifier, Privilege } from '../../../../common/enums';

// Local module enums
import { ClientsAge } from '../enums/clients-age.enum';
import { PracticeArea } from '../enums/practice-area.enum';
import { PracticeSettings } from '../enums/practice-settings.enum';
import { PracticeServices } from '../enums/practice-services.enum';

// ========================================
// MEMBERSHIP PRACTICES VALIDATION RULES
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
 * Practice ID format validation
 * Based on CSV: Autonumber with string prefix "osot-pra", 7 digits minimum
 * Example: osot-pra-0000001
 */
export const PRACTICE_ID_PATTERN = /^osot-pra-\d{7}$/;

/**
 * Text field length validation
 * Based on CSV: "Other" fields are 255 characters max
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
export const MEMBERSHIP_PRACTICES_ENUMS = {
  // From CSV: osot_clients_age (Choices_Populations) - Multiple choice - Business required
  VALID_CLIENTS_AGES: Object.values(ClientsAge).filter(
    (v) => typeof v === 'number',
  ) as ClientsAge[],

  // From CSV: osot_practice_area (Choices_Practice_Area) - Multiple choice
  VALID_PRACTICE_AREAS: Object.values(PracticeArea).filter(
    (v) => typeof v === 'number',
  ) as PracticeArea[],

  // From CSV: osot_practice_settings (Choices_Practice_Settings) - Multiple choice
  VALID_PRACTICE_SETTINGS: Object.values(PracticeSettings).filter(
    (v) => typeof v === 'number',
  ) as PracticeSettings[],

  // From CSV: osot_practice_services (Choices_Practice_Services) - Multiple choice
  VALID_PRACTICE_SERVICES: Object.values(PracticeServices).filter(
    (v) => typeof v === 'number',
  ) as PracticeServices[],

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
 * Dataverse field names for Membership Practices table
 * Based on Table Membership Practices.csv schema - using logical names
 */
export const MEMBERSHIP_PRACTICES_FIELDS = {
  // System fields
  PRACTICE_ID: 'osot_practice_id', // Business ID (osot-pra-0000001) - CSV: logical name
  TABLE_ID: 'osot_table_membership_practiceid', // GUID - CSV: logical name
  CREATED_ON: 'createdon', // System audit
  MODIFIED_ON: 'modifiedon', // System audit
  OWNER_ID: 'ownerid', // System owner

  // Lookup fields (relationships to other tables)
  TABLE_ACCOUNT: 'osot_table_account', // Lookup to Table_Account
  ACCOUNT_BIND: 'osot_Table_Account@odata.bind', // OData bind for account lookup
  ACCOUNT_VALUE: '_osot_table_account_value', // OData query field for account

  // Business fields (from CSV)
  MEMBERSHIP_YEAR: 'osot_membership_year', // Single line of text (4 chars) - Business required
  PRECEPTOR_DECLARATION: 'osot_preceptor_declaration', // Yes/No (boolean) - Optional
  CLIENTS_AGE: 'osot_clients_age', // Choice (Multiple) - Choices_Populations - Business required
  PRACTICE_AREA: 'osot_practice_area', // Choice (Multiple) - Choices_Practice_Area - Optional
  PRACTICE_SETTINGS: 'osot_practice_settings', // Choice (Multiple) - Choices_Practice_Settings - Optional
  PRACTICE_SETTINGS_OTHER: 'osot_practice_settings_other', // Single line of text (255 chars) - Optional
  PRACTICE_SERVICES: 'osot_practice_services', // Choice (Multiple) - Choices_Practice_Services - Optional
  PRACTICE_SERVICES_OTHER: 'osot_practice_services_other', // Single line of text (255 chars) - Optional

  // Access control fields (optional - from CSV "Optional")
  PRIVILEGE: 'osot_privilege', // Choice - Choices_Privilege (default: Owner)
  ACCESS_MODIFIERS: 'osot_access_modifiers', // Choice - Choices_Access_Modifiers (default: Private)
} as const;

/**
 * Table naming conventions based on CSV Table Information section
 */
export const MEMBERSHIP_PRACTICES_TABLE = {
  DISPLAY_NAME: 'Table_Membership_Practice', // For UI/Interface (singular from CSV)
  PLURAL_NAME: 'Table_Membership_Practices', // For routes/endpoints
  SCHEMA_NAME: 'osot_Table_Membership_Practice', // CSV: Schema name
  LOGICAL_NAME: 'osot_table_membership_practices', // CSV: Logical name (lowercase, plural)
} as const;

/**
 * OData query configurations for Dataverse operations
 */
export const MEMBERSHIP_PRACTICES_ODATA = {
  TABLE_NAME: MEMBERSHIP_PRACTICES_TABLE.LOGICAL_NAME,
  BUSINESS_ID_FIELD: MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_ID,
  PRIMARY_KEY_FIELD: MEMBERSHIP_PRACTICES_FIELDS.TABLE_ID,

  // Field mappings for OData queries
  PRACTICE_ID: MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_ID,
  MEMBERSHIP_YEAR: MEMBERSHIP_PRACTICES_FIELDS.MEMBERSHIP_YEAR,
  PRECEPTOR_DECLARATION: MEMBERSHIP_PRACTICES_FIELDS.PRECEPTOR_DECLARATION,
  CLIENTS_AGE: MEMBERSHIP_PRACTICES_FIELDS.CLIENTS_AGE,
  PRACTICE_AREA: MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_AREA,
  PRACTICE_SETTINGS: MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_SETTINGS,
  PRACTICE_SETTINGS_OTHER: MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_SETTINGS_OTHER,
  PRACTICE_SERVICES: MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_SERVICES,
  PRACTICE_SERVICES_OTHER: MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_SERVICES_OTHER,
  PRIVILEGE: MEMBERSHIP_PRACTICES_FIELDS.PRIVILEGE,
  ACCESS_MODIFIERS: MEMBERSHIP_PRACTICES_FIELDS.ACCESS_MODIFIERS,
  CREATED_ON: MEMBERSHIP_PRACTICES_FIELDS.CREATED_ON,
  MODIFIED_ON: MEMBERSHIP_PRACTICES_FIELDS.MODIFIED_ON,
  OWNER_ID: MEMBERSHIP_PRACTICES_FIELDS.OWNER_ID,

  // Lookup field mappings
  TABLE_ACCOUNT: MEMBERSHIP_PRACTICES_FIELDS.TABLE_ACCOUNT,
  ACCOUNT_BIND: MEMBERSHIP_PRACTICES_FIELDS.ACCOUNT_BIND,
  ACCOUNT_VALUE: MEMBERSHIP_PRACTICES_FIELDS.ACCOUNT_VALUE,

  // $select clause for OData queries - ensures all fields are returned including GUID
  SELECT_FIELDS: [
    // NOTE: Do NOT include TABLE_ID (primary key) in $select - Dataverse returns it automatically
    MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_ID, // Business ID (osot_practice_id)
    MEMBERSHIP_PRACTICES_FIELDS.MEMBERSHIP_YEAR,
    MEMBERSHIP_PRACTICES_FIELDS.PRECEPTOR_DECLARATION,
    MEMBERSHIP_PRACTICES_FIELDS.CLIENTS_AGE,
    MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_AREA,
    MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_SETTINGS,
    MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_SETTINGS_OTHER,
    MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_SERVICES,
    MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_SERVICES_OTHER,
    MEMBERSHIP_PRACTICES_FIELDS.PRIVILEGE,
    MEMBERSHIP_PRACTICES_FIELDS.ACCESS_MODIFIERS,
    // Use _value field for lookup in $select queries
    MEMBERSHIP_PRACTICES_FIELDS.ACCOUNT_VALUE, // _osot_table_account_value
    MEMBERSHIP_PRACTICES_FIELDS.CREATED_ON,
    MEMBERSHIP_PRACTICES_FIELDS.MODIFIED_ON,
    MEMBERSHIP_PRACTICES_FIELDS.OWNER_ID,
  ].join(','),
} as const;

// ========================================
// ERROR CODES MAPPING
// ========================================

/**
 * Membership Practices specific error codes
 * Uses existing ErrorCodes enum from essential modules
 */
export const MEMBERSHIP_PRACTICES_ERROR_CODES = {
  INVALID_MEMBERSHIP_YEAR: ErrorCodes.INVALID_INPUT,
  INVALID_LOOKUP_REFERENCE: ErrorCodes.INVALID_INPUT,
  MISSING_REQUIRED_LOOKUP: ErrorCodes.VALIDATION_ERROR,
  INVALID_PRACTICE_SETTINGS_OTHER: ErrorCodes.VALIDATION_ERROR,
  INVALID_PRACTICE_SERVICES_OTHER: ErrorCodes.VALIDATION_ERROR,
  MISSING_ACTIVE_MEMBERSHIP_SETTINGS: ErrorCodes.VALIDATION_ERROR, // No active membership-settings found
  MEMBERSHIP_YEAR_NOT_USER_EDITABLE: ErrorCodes.VALIDATION_ERROR, // User tried to set/edit membership_year
  DUPLICATE_PRACTICE_FOR_YEAR: ErrorCodes.VALIDATION_ERROR, // User already has practice for this year
  CLIENTS_AGE_REQUIRED: ErrorCodes.VALIDATION_ERROR, // Business required field missing
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
export const MEMBERSHIP_PRACTICES_DEFAULTS = {
  // From CSV: Default values specified
  PRIVILEGE: Privilege.OWNER, // CSV: Default "Owner"
  ACCESS_MODIFIERS: AccessModifier.PRIVATE, // CSV: Default "Private"

  // Boolean defaults from CSV
  PRECEPTOR_DECLARATION: false, // CSV: Default "No"

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
 * Business validation constants for membership practices
 */
export const MEMBERSHIP_PRACTICES_BUSINESS_RULES = {
  // Year validation
  MIN_YEAR: 2020, // Minimum acceptable year
  MAX_YEAR: new Date().getFullYear() + 5, // Maximum future year (calendar-based validation only)

  // Lookup validation
  REQUIRED_LOOKUP_COUNT: 0, // Table_Account lookup is optional
  LOOKUP_FIELDS: ['tableAccount'] as const,

  // Conditional field validation (when "Other" is selected)
  REQUIRES_OTHER_FIELD: {
    PRACTICE_SETTINGS: PracticeSettings.OTHER, // When OTHER selected, practice_settings_other is required
    PRACTICE_SERVICES: PracticeServices.OTHER, // When OTHER selected, practice_services_other is required
  },

  // Multi-select array validation
  REQUIRED_ARRAY_FIELDS: {
    CLIENTS_AGE: true, // Business required - must have at least one value
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

  // Uniqueness: One practice record per user per year
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
export const MEMBERSHIP_PRACTICES_ROUTES = {
  // Based on CSV Plural Name: "Table_Membership_Practices" -> "membership-practices"
  BASE_PATH: 'membership-practices',
  PUBLIC_PATH: 'public/membership-practices',
  PRIVATE_PATH: 'private/membership-practices',

  // Endpoint patterns
  BY_ID: ':id',
  BY_BUSINESS_ID: 'business/:businessId',
  BY_YEAR: 'year/:year',
  BY_ACCOUNT: 'account/:accountId',
  MY_PRACTICES: 'me', // For authenticated users
} as const;

// ========================================
// PERMISSION CONFIGURATIONS
// ========================================

/**
 * Permission levels for membership practices operations
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
 * - Users can only access their own practice records
 */
export const MEMBERSHIP_PRACTICES_PERMISSIONS = {
  // Create permissions (who can create practice records)
  CAN_CREATE: [Privilege.MAIN, Privilege.ADMIN, Privilege.OWNER],

  // Read permissions (who can read practice records)
  CAN_READ: [Privilege.MAIN, Privilege.ADMIN, Privilege.OWNER],

  // Update permissions (who can update practice records)
  CAN_UPDATE: [Privilege.MAIN, Privilege.ADMIN, Privilege.OWNER],

  // Delete permissions (who can delete practice records)
  CAN_DELETE: [Privilege.MAIN, Privilege.ADMIN],

  // Default privilege for new practice records
  DEFAULT_PRIVILEGE: Privilege.OWNER,
} as const;

// ========================================
// QUERY CONFIGURATIONS
// ========================================

/**
 * Query configurations for listing and filtering
 */
export const MEMBERSHIP_PRACTICES_QUERY = {
  // Pagination
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,

  // Sorting
  DEFAULT_SORT_FIELD: MEMBERSHIP_PRACTICES_FIELDS.MEMBERSHIP_YEAR,
  DEFAULT_SORT_ORDER: 'DESC' as const,

  // Filtering
  SEARCHABLE_FIELDS: [
    MEMBERSHIP_PRACTICES_FIELDS.PRACTICE_ID,
    MEMBERSHIP_PRACTICES_FIELDS.MEMBERSHIP_YEAR,
  ] as const,
} as const;
