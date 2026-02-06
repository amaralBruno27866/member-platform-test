/**
 * Membership Preferences Constants
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - enums: References centralized enums for Choice field validation
 *   • Privilege: osot_privilege (Choices_Privilege)
 *   • AccessModifier: osot_access_modifiers (Choices_Access_Modifiers)
 * - local enums: Module-specific enums for preference choices
 *   • ThirdParties: osot_third_parties (Choices_Third_Parties)
 *   • PracticePromotion: osot_practice_promotion (Choices_Practice_Promotion)
 *   • SearchTools: osot_members_search_tools (Choices_Search_Tools)
 *   • PsychotherapySupervision: osot_psychotherapy_supervision (Choices_Psychotherapy)
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Only essential constants for OSOT membership preferences management
 * - Dataverse field mappings from Table Membership Preferences.csv
 * - Business validation rules based on CSV specifications
 * - Enum-based validation for all Choice fields from CSV
 */

// Essential modules integration
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccessModifier, Privilege } from '../../../../common/enums';

// Local module enums
import { ThirdParties } from '../enums/third-parties.enum';
import { PracticePromotion } from '../enums/practice-promotion.enum';
import { SearchTools } from '../enums/search-tools.enum';
import { PsychotherapySupervision } from '../enums/psychotherapy-supervision.enum';

// ========================================
// MEMBERSHIP PREFERENCES VALIDATION RULES
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
 * Preference ID format validation
 * Based on CSV: Autonumber with string prefix "osot-pref", 7 digits minimum
 * Example: osot-pref-0000001
 */
export const PREFERENCE_ID_PATTERN = /^osot-pref-\d{7}$/;

// ========================================
// ENUM VALIDATION CONSTANTS
// ========================================

/**
 * Enum validation arrays for Choice fields from CSV
 * Based on Dataverse global choice synchronization
 */
export const MEMBERSHIP_PREFERENCES_ENUMS = {
  // From CSV: osot_third_parties (Choices_Third_Parties)
  VALID_THIRD_PARTIES: Object.values(ThirdParties).filter(
    (v) => typeof v === 'number',
  ) as ThirdParties[],

  // From CSV: osot_practice_promotion (Choices_Practice_Promotion)
  VALID_PRACTICE_PROMOTIONS: Object.values(PracticePromotion).filter(
    (v) => typeof v === 'number',
  ) as PracticePromotion[],

  // From CSV: osot_members_search_tools (Choices_Search_Tools)
  VALID_SEARCH_TOOLS: Object.values(SearchTools).filter(
    (v) => typeof v === 'number',
  ) as SearchTools[],

  // From CSV: osot_psychotherapy_supervision (Choices_Psychotherapy)
  VALID_PSYCHOTHERAPY_SUPERVISIONS: Object.values(
    PsychotherapySupervision,
  ).filter((v) => typeof v === 'number') as PsychotherapySupervision[],

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
 * Dataverse field names for Membership Preferences table
 * Based on Table Membership Preferences.csv schema - using logical names
 */
export const MEMBERSHIP_PREFERENCES_FIELDS = {
  // System fields
  PREFERENCE_ID: 'osot_preference_id', // Business ID (osot-pref-0000001) - CSV: logical name
  TABLE_ID: 'osot_table_membership_preferenceid', // GUID - CSV: logical name (note typo in CSV)
  CREATED_ON: 'createdon', // System audit
  MODIFIED_ON: 'modifiedon', // System audit
  OWNER_ID: 'ownerid', // System owner

  // Lookup fields (relationships to other tables)
  TABLE_MEMBERSHIP_CATEGORY: 'osot_table_membership_category', // Lookup to Table_Membership_Category
  MEMBERSHIP_CATEGORY_BIND: 'osot_Table_Membership_Category@odata.bind', // OData bind for category lookup
  MEMBERSHIP_CATEGORY_VALUE: '_osot_table_membership_category_value', // OData query field for category
  TABLE_ACCOUNT: 'osot_table_account', // Lookup to Table_Account
  ACCOUNT_BIND: 'osot_Table_Account@odata.bind', // OData bind for account lookup
  ACCOUNT_VALUE: '_osot_table_account_value', // OData query field for account
  TABLE_ACCOUNT_AFFILIATE: 'osot_table_account_affiliate', // Lookup to Table_Account_Affiliate
  ACCOUNT_AFFILIATE_BIND: 'osot_Table_Account_Affiliate@odata.bind', // OData bind for affiliate lookup
  ACCOUNT_AFFILIATE_VALUE: '_osot_table_account_affiliate_value', // OData query field for affiliate

  // Business fields (from CSV)
  MEMBERSHIP_YEAR: 'osot_membership_year', // Single line of text (4 chars) - Business required
  THIRD_PARTIES: 'osot_third_parties', // Choice - Choices_Third_Parties
  PRACTICE_PROMOTION: 'osot_practice_promotion', // Choice - Choices_Practice_Promotion
  MEMBERS_SEARCH_TOOLS: 'osot_members_search_tools', // Choice - Choices_Search_Tools
  SHADOWING: 'osot_shadowing', // Yes/No (boolean)
  PSYCHOTHERAPY_SUPERVISION: 'osot_psychotherapy_supervision', // Choice - Choices_Psychotherapy
  AUTO_RENEWAL: 'osot_auto_renewal', // Yes/No (boolean) - Business required
  MEMBERSHIP_DECLARATION: 'osot_membership_declaration', // Yes/No (boolean) - Business required - User must accept to proceed

  // Access control fields (optional - from CSV "Optional")
  PRIVILEGE: 'osot_privilege', // Choice - Choices_Privilege (default: Owner)
  ACCESS_MODIFIERS: 'osot_access_modifier', // Choice - Choices_Access_Modifiers (default: Private) - NOTE: singular in Dataverse!
} as const;

/**
 * Table naming conventions based on CSV Table Information section
 */
export const MEMBERSHIP_PREFERENCES_TABLE = {
  DISPLAY_NAME: 'Table_Membership_Preference', // For UI/Interface (singular from CSV)
  PLURAL_NAME: 'Table_Membership_Preferences', // For routes/endpoints
  SCHEMA_NAME: 'osot_Table_Membership_Preference', // CSV: Schema name
  LOGICAL_NAME: 'osot_table_membership_preferences', // CSV: Logical name (lowercase, plural)
} as const;

/**
 * OData query configurations for Dataverse operations
 */
export const MEMBERSHIP_PREFERENCES_ODATA = {
  TABLE_NAME: MEMBERSHIP_PREFERENCES_TABLE.LOGICAL_NAME,
  BUSINESS_ID_FIELD: MEMBERSHIP_PREFERENCES_FIELDS.PREFERENCE_ID,
  PRIMARY_KEY_FIELD: MEMBERSHIP_PREFERENCES_FIELDS.TABLE_ID,

  // Field mappings for OData queries
  PREFERENCE_ID: MEMBERSHIP_PREFERENCES_FIELDS.PREFERENCE_ID,
  MEMBERSHIP_YEAR: MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_YEAR,
  THIRD_PARTIES: MEMBERSHIP_PREFERENCES_FIELDS.THIRD_PARTIES,
  PRACTICE_PROMOTION: MEMBERSHIP_PREFERENCES_FIELDS.PRACTICE_PROMOTION,
  MEMBERS_SEARCH_TOOLS: MEMBERSHIP_PREFERENCES_FIELDS.MEMBERS_SEARCH_TOOLS,
  SHADOWING: MEMBERSHIP_PREFERENCES_FIELDS.SHADOWING,
  PSYCHOTHERAPY_SUPERVISION:
    MEMBERSHIP_PREFERENCES_FIELDS.PSYCHOTHERAPY_SUPERVISION,
  AUTO_RENEWAL: MEMBERSHIP_PREFERENCES_FIELDS.AUTO_RENEWAL,
  MEMBERSHIP_DECLARATION: MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_DECLARATION,
  PRIVILEGE: MEMBERSHIP_PREFERENCES_FIELDS.PRIVILEGE,
  ACCESS_MODIFIERS: MEMBERSHIP_PREFERENCES_FIELDS.ACCESS_MODIFIERS,
  CREATED_ON: MEMBERSHIP_PREFERENCES_FIELDS.CREATED_ON,
  MODIFIED_ON: MEMBERSHIP_PREFERENCES_FIELDS.MODIFIED_ON,
  OWNER_ID: MEMBERSHIP_PREFERENCES_FIELDS.OWNER_ID,

  // Lookup field mappings
  TABLE_MEMBERSHIP_CATEGORY:
    MEMBERSHIP_PREFERENCES_FIELDS.TABLE_MEMBERSHIP_CATEGORY,
  MEMBERSHIP_CATEGORY_BIND:
    MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_CATEGORY_BIND,
  MEMBERSHIP_CATEGORY_VALUE:
    MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_CATEGORY_VALUE,
  TABLE_ACCOUNT: MEMBERSHIP_PREFERENCES_FIELDS.TABLE_ACCOUNT,
  ACCOUNT_BIND: MEMBERSHIP_PREFERENCES_FIELDS.ACCOUNT_BIND,
  ACCOUNT_VALUE: MEMBERSHIP_PREFERENCES_FIELDS.ACCOUNT_VALUE,
  TABLE_ACCOUNT_AFFILIATE:
    MEMBERSHIP_PREFERENCES_FIELDS.TABLE_ACCOUNT_AFFILIATE,
  ACCOUNT_AFFILIATE_BIND: MEMBERSHIP_PREFERENCES_FIELDS.ACCOUNT_AFFILIATE_BIND,
  ACCOUNT_AFFILIATE_VALUE:
    MEMBERSHIP_PREFERENCES_FIELDS.ACCOUNT_AFFILIATE_VALUE,

  // $select clause for OData queries - ensures all fields are returned including GUID
  SELECT_FIELDS: [
    // NOTE: Do NOT include TABLE_ID (primary key) in $select - Dataverse returns it automatically
    MEMBERSHIP_PREFERENCES_FIELDS.PREFERENCE_ID, // Business ID (osot_preference_id)
    MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_YEAR,
    MEMBERSHIP_PREFERENCES_FIELDS.THIRD_PARTIES,
    MEMBERSHIP_PREFERENCES_FIELDS.PRACTICE_PROMOTION,
    MEMBERSHIP_PREFERENCES_FIELDS.MEMBERS_SEARCH_TOOLS,
    MEMBERSHIP_PREFERENCES_FIELDS.SHADOWING,
    MEMBERSHIP_PREFERENCES_FIELDS.PSYCHOTHERAPY_SUPERVISION,
    MEMBERSHIP_PREFERENCES_FIELDS.AUTO_RENEWAL,
    MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_DECLARATION,
    MEMBERSHIP_PREFERENCES_FIELDS.PRIVILEGE,
    MEMBERSHIP_PREFERENCES_FIELDS.ACCESS_MODIFIERS,
    // Use _value fields for lookups in $select queries
    MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_CATEGORY_VALUE, // _osot_table_membership_category_value
    MEMBERSHIP_PREFERENCES_FIELDS.ACCOUNT_VALUE, // _osot_table_account_value
    // Note: ACCOUNT_AFFILIATE_VALUE field does not exist in this entity
    MEMBERSHIP_PREFERENCES_FIELDS.CREATED_ON,
    MEMBERSHIP_PREFERENCES_FIELDS.MODIFIED_ON,
    MEMBERSHIP_PREFERENCES_FIELDS.OWNER_ID,
  ].join(','),
} as const;

// ========================================
// ERROR CODES MAPPING
// ========================================

/**
 * Membership Preferences specific error codes
 * Uses existing ErrorCodes enum from essential modules
 */
export const MEMBERSHIP_PREFERENCES_ERROR_CODES = {
  INVALID_MEMBERSHIP_YEAR: ErrorCodes.INVALID_INPUT,
  INVALID_LOOKUP_REFERENCE: ErrorCodes.INVALID_INPUT,
  MISSING_REQUIRED_LOOKUP: ErrorCodes.VALIDATION_ERROR,
  EXCLUSIVE_USER_REFERENCE_VIOLATION: ErrorCodes.VALIDATION_ERROR,
  DUPLICATE_PREFERENCE: ErrorCodes.VALIDATION_ERROR,
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
export const MEMBERSHIP_PREFERENCES_DEFAULTS = {
  // From CSV: Default values specified
  PRIVILEGE: Privilege.OWNER, // CSV: Default "Owner"
  ACCESS_MODIFIERS: AccessModifier.PRIVATE, // CSV: Default "Private"

  // Boolean defaults from CSV
  SHADOWING: false, // CSV: Default "No"
  AUTO_RENEWAL: false, // CSV: Default "No"
  MEMBERSHIP_DECLARATION: false, // CSV: Default "No" - MUST be set to TRUE by user

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
 * Business validation constants for membership preferences
 */
export const MEMBERSHIP_PREFERENCES_BUSINESS_RULES = {
  // Year validation
  MIN_YEAR: 2020, // Minimum acceptable year
  MAX_YEAR: new Date().getFullYear() + 5, // Maximum future year (calendar-based validation only)

  // Lookup validation
  REQUIRED_LOOKUP_COUNT: 1, // At least one of: category, account, or affiliate
  EXCLUSIVE_USER_REFERENCE: true, // Account and Affiliate are mutually exclusive (XOR)
  LOOKUP_FIELDS: [
    'tableMembershipCategory',
    'tableAccount',
    'tableAccountAffiliate',
  ] as const,

  // Uniqueness constraints
  UNIQUE_CONSTRAINT: 'user_year_unique', // Business rule: one preference per user/year

  // Year format
  YEAR_FORMAT: 'YYYY', // 4-digit year format
} as const;

// ========================================
// ROUTE CONFIGURATIONS
// ========================================

/**
 * API route configurations based on plural name from CSV
 */
export const MEMBERSHIP_PREFERENCES_ROUTES = {
  // Based on CSV Plural Name: "Table_Membership_Preferences" -> "membership-preferences"
  BASE_PATH: 'membership-preferences',
  PUBLIC_PATH: 'public/membership-preferences',
  PRIVATE_PATH: 'private/membership-preferences',

  // Endpoint patterns
  BY_ID: ':id',
  BY_BUSINESS_ID: 'business/:businessId',
  BY_YEAR: 'year/:year',
  BY_CATEGORY: 'category/:categoryId',
  BY_ACCOUNT: 'account/:accountId',
  BY_AFFILIATE: 'affiliate/:affiliateId',
  MY_PREFERENCES: 'me', // For authenticated users
} as const;

// ========================================
// PERMISSION CONFIGURATIONS
// ========================================

/**
 * Permission levels for membership preferences operations
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
 * - Users can only access their own preferences
 */
export const MEMBERSHIP_PREFERENCES_PERMISSIONS = {
  // Create permissions (who can create preferences)
  CAN_CREATE: [Privilege.MAIN, Privilege.ADMIN, Privilege.OWNER],

  // Read permissions (who can read preferences)
  CAN_READ: [Privilege.MAIN, Privilege.ADMIN, Privilege.OWNER],

  // Update permissions (who can update preferences)
  CAN_UPDATE: [Privilege.MAIN, Privilege.ADMIN, Privilege.OWNER],

  // Delete permissions (who can delete preferences)
  CAN_DELETE: [Privilege.MAIN, Privilege.ADMIN],

  // Default privilege for new preferences
  DEFAULT_PRIVILEGE: Privilege.OWNER,
} as const;

// ========================================
// QUERY CONFIGURATIONS
// ========================================

/**
 * Query configurations for listing and filtering
 */
export const MEMBERSHIP_PREFERENCES_QUERY = {
  // Pagination
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100,

  // Sorting
  DEFAULT_SORT_FIELD: MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_YEAR,
  DEFAULT_SORT_ORDER: 'DESC' as const,

  // Filtering
  SEARCHABLE_FIELDS: [
    MEMBERSHIP_PREFERENCES_FIELDS.PREFERENCE_ID,
    MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_YEAR,
  ] as const,
} as const;
