/**
 * Additional Insured Constants
 *
 * Centralized constants for Additional Insured entity including:
 * - Field names (matching Dataverse schema)
 * - OData query builders (select, expand, filters)
 * - Validation rules
 * - Business rule constraints
 *
 * SYNCHRONIZATION NOTE:
 * These constants must match the Dataverse table schema exactly:
 * Table: osot_Table_Additional_Insured
 * Publisher Prefix: osot
 *
 * @file additional-insured.constants.ts
 * @module AdditionalInsuredModule
 * @layer Constants
 */

// ========================================
// FIELD NAMES
// ========================================

/**
 * Field names as they exist in Dataverse
 * Used for OData queries and mapping
 */
export const ADDITIONAL_INSURED_FIELDS = {
  // System fields
  RECORD_ID: 'osot_table_additional_insuredid', // GUID Primary Key
  BUSINESS_ID: 'osot_additionalinsuredid', // Autonumber (osot-add-ins-0000001)

  // Relationship lookup
  INSURANCE: 'osot_table_insurance', // Lookup to osot_table_insurance
  INSURANCE_ID: '_osot_table_insurance_value', // GUID of Insurance record

  // Company Information
  COMPANY_NAME: 'osot_company_name', // Text (255)
  ADDRESS: 'osot_address', // Text (255)
  CITY: 'osot_city', // Choice (global)
  PROVINCE: 'osot_province', // Choice (global)
  POSTAL_CODE: 'osot_postal_code', // Text (7)

  // Privilege and Access Control
  PRIVILEGE: 'osot_privilege', // Choice (global) - default: Owner
  ACCESS_MODIFIERS: 'osot_access_modifiers', // Choice (global) - default: Private

  // System Audit Fields
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  CREATED_BY: 'createdby',
  MODIFIED_BY: 'modifiedby',
  OWNER: 'ownerid',
};

// ========================================
// ODATA QUERY CONFIGURATION
// ========================================

/**
 * OData query builders for Additional Insured operations
 * Standardizes which fields to select/expand in different scenarios
 */
export const ADDITIONAL_INSURED_ODATA = {
  // Standard fields to always select
  SELECT_FIELDS: [
    ADDITIONAL_INSURED_FIELDS.RECORD_ID,
    ADDITIONAL_INSURED_FIELDS.BUSINESS_ID,
    ADDITIONAL_INSURED_FIELDS.INSURANCE_ID,
    ADDITIONAL_INSURED_FIELDS.COMPANY_NAME,
    ADDITIONAL_INSURED_FIELDS.ADDRESS,
    ADDITIONAL_INSURED_FIELDS.CITY,
    ADDITIONAL_INSURED_FIELDS.PROVINCE,
    ADDITIONAL_INSURED_FIELDS.POSTAL_CODE,
    ADDITIONAL_INSURED_FIELDS.PRIVILEGE,
    ADDITIONAL_INSURED_FIELDS.ACCESS_MODIFIERS,
    ADDITIONAL_INSURED_FIELDS.CREATED_ON,
    ADDITIONAL_INSURED_FIELDS.MODIFIED_ON,
  ].join(','),

  // With lookup expansion
  SELECT_WITH_INSURANCE: [
    ADDITIONAL_INSURED_FIELDS.RECORD_ID,
    ADDITIONAL_INSURED_FIELDS.BUSINESS_ID,
    ADDITIONAL_INSURED_FIELDS.INSURANCE_ID,
    ADDITIONAL_INSURED_FIELDS.COMPANY_NAME,
    ADDITIONAL_INSURED_FIELDS.ADDRESS,
    ADDITIONAL_INSURED_FIELDS.CITY,
    ADDITIONAL_INSURED_FIELDS.PROVINCE,
    ADDITIONAL_INSURED_FIELDS.POSTAL_CODE,
    ADDITIONAL_INSURED_FIELDS.PRIVILEGE,
    ADDITIONAL_INSURED_FIELDS.ACCESS_MODIFIERS,
    ADDITIONAL_INSURED_FIELDS.CREATED_ON,
    ADDITIONAL_INSURED_FIELDS.MODIFIED_ON,
  ].join(','),

  // Expand insurance lookup
  EXPAND_INSURANCE: `$expand=osot_Table_Insurance($select=${[
    'osot_table_insuranceid',
    'osot_insurance_type',
    'osot_insurance_status',
    '_osot_order_value',
    '_osot_account_value',
  ].join(',')}`,

  // OData bind pattern for insurance relationship
  INSURANCE_BIND: (insuranceGuid: string) =>
    `/osot_table_insurances(${insuranceGuid})`,
};

// ========================================
// ENTITY CONFIGURATION
// ========================================

export const ADDITIONAL_INSURED_CONFIG = {
  // Dataverse table information
  TABLE_NAME: 'osot_table_additional_insured',
  LOGICAL_NAME: 'osot_table_additional_insured',
  DISPLAY_NAME: 'Table_Additional_Insured',
  PLURAL_NAME: 'Table_Additional_Insureds',
  ENTITY_SET_NAME: 'osot_table_additional_insureds',

  // Business prefix for autonumber
  BUSINESS_ID_PREFIX: 'osot-add-ins',

  // Operational constraints
  MAX_RECORDS_PER_INSURANCE: 50, // Practical limit for additional insureds per insurance
  MAX_BATCH_SIZE: 100, // For bulk operations
};

// ========================================
// VALIDATION RULES
// ========================================

/**
 * Field-level validation rules
 */
export const ADDITIONAL_INSURED_VALIDATION_RULES = {
  // Company Name
  COMPANY_NAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 255,
    REQUIRED: true,
    PATTERN: /^[a-zA-Z0-9\s\-&.,()]+$/, // Allow alphanumeric, spaces, common chars
    ERROR_MESSAGE:
      'Company name must be 3-255 characters with valid business name characters',
  },

  // Address
  ADDRESS: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
    REQUIRED: true,
    PATTERN: /^[a-zA-Z0-9\s\-.,()#]+$/,
    ERROR_MESSAGE: 'Address must be 5-255 characters',
  },

  // City
  CITY: {
    REQUIRED: true,
    ERROR_MESSAGE: 'City must be selected from available choices',
  },

  // Province
  PROVINCE: {
    REQUIRED: true,
    ERROR_MESSAGE: 'Province must be selected from available choices',
  },

  // Postal Code (Canadian format)
  POSTAL_CODE: {
    MAX_LENGTH: 7,
    REQUIRED: true,
    PATTERN: /^[A-Za-z]\d[A-Za-z]\d[A-Za-z]\d$/, // Canadian postal code: A1A 1A1 (no space)
    FORMAT_PATTERN: /^([A-Za-z]\d[A-Za-z])\s?(\d[A-Za-z]\d)$/, // With optional space
    ERROR_MESSAGE:
      'Postal code must be valid Canadian format (e.g., K1A0A6 or K1A 0A6)',
  },

  // Privilege (optional, defaults to Owner)
  PRIVILEGE: {
    REQUIRED: false,
    DEFAULT_VALUE: 1, // Owner = 1 (from privilege.enum.ts)
    ERROR_MESSAGE: 'Invalid privilege selection',
  },

  // Access Modifiers (optional, defaults to Private)
  ACCESS_MODIFIERS: {
    REQUIRED: false,
    DEFAULT_VALUE: 1, // Private = 1 (from access-modifier.enum.ts)
    ERROR_MESSAGE: 'Invalid access modifier selection',
  },
};

// ========================================
// DATAVERSE BINDING PATTERNS
// ========================================

/**
 * OData bind patterns for relationship creation
 * Used during record creation/update to establish relationships
 */
export const ADDITIONAL_INSURED_ODATA_BIND = {
  // Insurance relationship binding
  INSURANCE_BIND_PATTERN: (insuranceGuid: string) =>
    `/osot_table_insurances(${insuranceGuid})`,
};

// ========================================
// BUSINESS RULE MESSAGES
// ========================================

export const ADDITIONAL_INSURED_BUSINESS_RULES = {
  // Insurance type validation
  INSURANCE_TYPE_VALIDATION: {
    MUST_BE_COMMERCIAL:
      'Additional insureds can only be added to Commercial (General) insurance coverage',
    INSURANCE_NOT_FOUND: 'Insurance record not found',
    INSURANCE_NOT_ACTIVE:
      'Insurance must be in ACTIVE status to add additional insureds',
  },

  // Duplicate validation
  DUPLICATE_VALIDATION: {
    COMPANY_ALREADY_EXISTS:
      'This company is already listed as an additional insured for this insurance',
    UNIQUE_CONSTRAINT_MESSAGE:
      'Company name must be unique for each insurance record',
  },

  // CRUD permissions
  PERMISSION_ERRORS: {
    CREATE_DENIED:
      'Insufficient privileges to create additional insured. Required: OWNER, ADMIN, or MAIN',
    READ_DENIED:
      'Insufficient privileges to read additional insured. Required: OWNER, ADMIN, or MAIN',
    UPDATE_DENIED:
      'Insufficient privileges to update additional insured. Required: ADMIN or MAIN',
    DELETE_DENIED: 'Only MAIN privilege users can delete additional insureds',
  },

  // Normalization
  NORMALIZATION: {
    COMPANY_NAME_UPPERCASE: true, // Normalize to uppercase
    POSTAL_CODE_NO_SPACES: true, // Remove spaces (K1A 0A6 → K1A0A6)
    POSTAL_CODE_UPPERCASE: true, // Ensure uppercase
    ADDRESS_TRIM: true, // Trim whitespace
  },
};
