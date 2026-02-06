/**
 * Address Constants (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - enums: References centralized enums for validation
 * - utils: Integration flags for centralized utilities
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Only essential constants for OSOT address management
 * - Canadian postal code validation regex
 * - Dataverse field mappings from Table Address.csv
 * - Remove complex validation rules and keep simple patterns
 */

// Essential modules integration
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Country, AccessModifier, Privilege } from '../../../../common/enums';

// ========================================
// ADDRESS VALIDATION PATTERNS
// ========================================

/**
 * Canadian postal code validation pattern
 * Format: A1A 1A1 (letter-digit-letter space digit-letter-digit)
 */
export const CANADIAN_POSTAL_CODE_PATTERN =
  /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;

/**
 * Address field length limits based on Dataverse table schema
 */
export const ADDRESS_FIELD_LIMITS = {
  USER_BUSINESS_ID: 20,
  ADDRESS_1: 255,
  ADDRESS_2: 255,
  OTHER_CITY: 255,
  OTHER_PROVINCE_STATE: 255,
  POSTAL_CODE: 7,
} as const;

// ========================================
// DATAVERSE FIELD MAPPINGS
// ========================================

/**
 * Dataverse field names for Address table
 * Based on Table Address.csv schema
 */
export const ADDRESS_FIELDS = {
  // System fields
  ID: 'osot_address_id',
  TABLE_ID: 'osot_table_addressid',
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',

  // Business fields
  USER_BUSINESS_ID: 'osot_user_business_id',
  ADDRESS_1: 'osot_address_1',
  ADDRESS_2: 'osot_address_2',
  CITY: 'osot_city',
  PROVINCE: 'osot_province',
  POSTAL_CODE: 'osot_postal_code',
  COUNTRY: 'osot_country',
  ADDRESS_TYPE: 'osot_address_type',
  ADDRESS_PREFERENCE: 'osot_address_preference',
  OTHER_CITY: 'osot_other_city',
  OTHER_PROVINCE_STATE: 'osot_other_province_state',
  ACCESS_MODIFIERS: 'osot_access_modifiers',
  PRIVILEGE: 'osot_privilege',

  // Relationship fields
  TABLE_ACCOUNT: 'osot_table_account',
  ACCOUNT_BIND: 'osot_Table_Account@odata.bind',
  TABLE_ORGANIZATION: 'osot_table_organization',
  ORGANIZATION_BIND: 'osot_Table_Organization@odata.bind',
} as const;

// ========================================
// ERROR CODES MAPPING
// ========================================

/**
 * Address-specific error codes
 * Uses existing ErrorCodes enum from essential modules
 */
export const ADDRESS_ERROR_CODES = {
  INVALID_POSTAL_CODE: ErrorCodes.INVALID_POSTAL_CODE,
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
 * Default values for Address creation
 * Based on Dataverse table schema defaults
 */
export const ADDRESS_DEFAULTS = {
  COUNTRY: Country.CANADA,
  ACCESS_MODIFIERS: AccessModifier.PRIVATE,
  PRIVILEGE: Privilege.OWNER,
} as const;

// ========================================
// ENUM INTEGRATION FLAGS
// ========================================

/**
 * Integration flags for centralized enum usage
 * Helps identify which enums are used by Address module
 */
export const ADDRESS_ENUM_INTEGRATION = {
  USES_CITY_ENUM: true,
  USES_PROVINCE_ENUM: true,
  USES_COUNTRY_ENUM: true,
  USES_ADDRESS_TYPE_ENUM: true,
  USES_ADDRESS_PREFERENCE_ENUM: true,
  USES_ACCESS_MODIFIER_ENUM: true,
  USES_PRIVILEGE_ENUM: true,
} as const;

// ========================================
// UTILITY INTEGRATION FLAGS
// ========================================

/**
 * Integration flags for centralized utilities
 * Indicates which utils can be used by Address module
 */
export const ADDRESS_UTILS_INTEGRATION = {
  USES_DATAVERSE_HELPER: true,
  USES_BUSINESS_RULES: true,
  USES_USER_DECORATOR: true,
  CAN_USE_PHONE_FORMATTER: false, // Address doesn't handle phones
  CAN_USE_URL_SANITIZER: false, // Address doesn't handle URLs
  CAN_USE_JWT_UTILS: false, // Address doesn't handle JWTs directly
} as const;

// ========================================
// ODATA CONFIGURATION
// ========================================

/**
 * OData configuration for Address table operations
 * Based on Table Address.csv schema and Dataverse API patterns
 */
export const ADDRESS_ODATA = {
  TABLE_NAME: 'osot_table_addresses',
  ACCOUNT_TABLE_NAME: 'osot_table_accounts',
  RELATIONSHIP_NAME: 'osot_Account_to_Address',

  // All 20 fields from Table Address.csv for SELECT queries
  SELECT_FIELDS: [
    'osot_Address_ID', // Autonumber
    'osot_Table_AddressId', // GUID
    'createdon', // DateTime
    'modifiedon', // DateTime
    'ownerid', // Owner
    'osot_Table_Account', // Lookup
    'osot_User_Business_ID', // Optional text
    'osot_Address_1', // Business required
    'osot_Address_2', // Optional
    'osot_City', // Choice (Business required)
    'osot_Province', // Choice (Business required)
    'osot_Postal_Code', // Business required
    'osot_Country', // Choice (Business required)
    'osot_Address_Type', // Choice (Business required)
    'osot_Address_Preference', // Choice (Optional)
    'osot_Other_City', // Optional text
    'osot_Other_Province_State', // Optional text
    'osot_Access_Modifiers', // Choice (Optional)
    'osot_Privilege', // Choice (Optional)
  ].join(','),

  // Individual field mappings (from ADDRESS_FIELDS)
  ID: 'osot_address_id',
  TABLE_ID: 'osot_table_addressid',
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',
  USER_BUSINESS_ID: 'osot_user_business_id',
  ADDRESS_1: 'osot_address_1',
  ADDRESS_2: 'osot_address_2',
  CITY: 'osot_city',
  PROVINCE: 'osot_province',
  POSTAL_CODE: 'osot_postal_code',
  COUNTRY: 'osot_country',
  ADDRESS_TYPE: 'osot_address_type',
  ADDRESS_PREFERENCE: 'osot_address_preference',
  OTHER_CITY: 'osot_other_city',
  OTHER_PROVINCE_STATE: 'osot_other_province_state',
  ACCESS_MODIFIER: 'osot_access_modifiers',
  PRIVILEGE: 'osot_privilege',
  ACCOUNT_LOOKUP: 'osot_table_account',
  ACCOUNT_BIND: 'osot_Table_Account@odata.bind',
} as const;
