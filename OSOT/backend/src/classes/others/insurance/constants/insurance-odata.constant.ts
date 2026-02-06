/**
 * Insurance OData Constants
 *
 * Centralized configuration for Insurance entity OData operations:
 * - Field names (Dataverse schema)
 * - Entity metadata
 * - Query select configurations
 *
 * CRITICAL: Field names must match exactly with Dataverse schema
 * Any mismatch will cause OData query failures
 */

/**
 * Insurance entity metadata for Dataverse API
 */
export const INSURANCE_ENTITY = {
  /**
   * Logical name used in OData API endpoints
   * Example: /api/data/v9.2/osot_table_insurances
   */
  logicalName: 'osot_table_insurance',

  /**
   * Plural name for collection endpoints
   */
  collectionName: 'osot_table_insurances',

  /**
   * Primary key field name (GUID)
   */
  primaryKey: 'osot_table_insuranceid',
} as const;

/**
 * Insurance field names exactly as they appear in Dataverse
 * Used for OData $select, $filter, $orderby operations
 *
 * IMPORTANT: These names are case-sensitive and must match Dataverse schema
 */
export const INSURANCE_FIELDS = {
  // ========================================
  // IDENTIFIERS (2 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * System-generated unique identifier
   */
  TABLE_INSURANCE_ID: 'osot_table_insuranceid',

  /**
   * Business ID (Autonumber)
   * Format: osot-ins-0000001
   * User-friendly unique identifier
   */
  INSURANCE_NUMBER: 'osot_insuranceid',

  // ========================================
  // RELATIONSHIPS/LOOKUPS (3 required fields)
  // ========================================

  /**
   * Organization lookup (sponsoring entity)
   * Business required - multi-tenant isolation
   */
  ORGANIZATION: 'osot_table_organization',

  /**
   * Organization lookup value field returned by Dataverse
   */
  ORGANIZATION_LOOKUP_VALUE: '_osot_table_organization_value',

  /**
   * Organization @odata.bind field name
   */
  ORGANIZATION_BIND: 'osot_Table_Organization@odata.bind',

  /**
   * Order lookup (parent order that triggered this insurance)
   * Business required - immutable reference
   */
  ORDER: 'osot_table_order',

  /**
   * Order lookup value field returned by Dataverse
   */
  ORDER_LOOKUP_VALUE: '_osot_table_order_value',

  /**
   * Order @odata.bind field name
   */
  ORDER_BIND: 'osot_Table_Order@odata.bind',

  /**
   * Account/User lookup (insured person)
   * Business required - who is insured
   */
  ACCOUNT: 'osot_table_account',

  /**
   * Account lookup value field returned by Dataverse
   */
  ACCOUNT_LOOKUP_VALUE: '_osot_table_account_value',

  /**
   * Account @odata.bind field name
   */
  ACCOUNT_BIND: 'osot_Table_Account@odata.bind',

  // ========================================
  // SNAPSHOT FIELDS FROM ACCOUNT (8 required)
  // ========================================

  /**
   * Account group (copied from osot_table_account.osot_account_group)
   * Immutable snapshot
   */
  ACCOUNT_GROUP: 'osot_account_group',

  /**
   * Category (copied from membership_category.osot_membership_category)
   * Immutable snapshot
   */
  CATEGORY: 'osot_category',

  /**
   * Membership (copied from membership_category.osot_category_id)
   * Immutable snapshot
   */
  MEMBERSHIP: 'osot_membership',

  /**
   * Certificate ID (copied from osot_table_account.osot_account_id)
   * Immutable snapshot
   */
  CERTIFICATE: 'osot_certificate',

  /**
   * First name (copied from osot_table_account.osot_first_name)
   * Immutable snapshot
   */
  FIRST_NAME: 'osot_first_name',

  /**
   * Last name (copied from osot_table_account.osot_last_name)
   * Immutable snapshot
   */
  LAST_NAME: 'osot_last_name',

  /**
   * Personal/Corporation name (optional)
   * Immutable snapshot
   */
  PERSONAL_CORPORATION: 'osot_personal_corporation',

  // ========================================
  // SNAPSHOT FIELDS FROM ADDRESS (4 required, 1 optional)
  // ========================================

  /**
   * Address line 1 (copied from address)
   * Immutable snapshot
   */
  ADDRESS_1: 'osot_address_1',

  /**
   * Address line 2 (optional)
   * Immutable snapshot
   */
  ADDRESS_2: 'osot_address_2',

  /**
   * City (copied from address)
   * Immutable snapshot
   */
  CITY: 'osot_city',

  /**
   * Province (copied from address)
   * Immutable snapshot
   */
  PROVINCE: 'osot_province',

  /**
   * Postal code (copied from address)
   * Immutable snapshot
   */
  POSTAL_CODE: 'osot_postal_code',

  /**
   * Phone number (copied from osot_table_account.osot_mobile_phone)
   * Immutable snapshot
   */
  PHONE_NUMBER: 'osot_phone_number',

  /**
   * Email (copied from osot_table_account.osot_email)
   * Immutable snapshot
   */
  EMAIL: 'osot_email',

  // ========================================
  // INSURANCE DETAILS (6 fields - 5 required, 1 optional)
  // ========================================

  /**
   * Insurance type (copied from product name)
   * Example: "Professional Liability", "General Liability"
   * Business required - immutable snapshot
   */
  INSURANCE_TYPE: 'osot_insurance_type',

  /**
   * Insurance limit amount (copied from product insurance_limit)
   * Business required - immutable snapshot
   * Currency: 0 to 922,337,203,685,477
   */
  INSURANCE_LIMIT: 'osot_insurance_limit',

  /**
   * Insurance price (copied from product selected_price)
   * Business required - immutable snapshot
   * Currency: 0 to 922,337,203,685,477
   */
  INSURANCE_PRICE: 'osot_insurance_price',

  /**
   * Insurance total (copied from order_product item_total)
   * Business required - immutable snapshot (price + tax)
   * Currency: 0 to 922,337,203,685,477
   */
  TOTAL: 'osot_total',

  /**
   * Insurance status (DRAFT, PENDING, ACTIVE, EXPIRED, CANCELLED)
   * Business required - mutable based on lifecycle
   */
  INSURANCE_STATUS: 'osot_insurance_status',

  /**
   * Insurance declaration (Yes/No boolean)
   * Business required - user must declare truthfulness
   */
  INSURANCE_DECLARATION: 'osot_insurance_declaration',

  // ========================================
  // DATE FIELDS (2 required, 1 optional)
  // ========================================

  /**
   * Effective date (copied from order.createdon or explicit date)
   * Business required - when coverage starts
   */
  EFFECTIVE_DATE: 'osot_effective_date',

  /**
   * Expiry date (copied from membership_settings.year_ends)
   * Business required - when coverage ends
   */
  EXPIRY_DATE: 'osot_expires_date',

  /**
   * Endorsement effective date (for amendments)
   * Optional - null unless endorsement applied
   */
  ENDORSEMENT_EFFECTIVE_DATE: 'osot_endorsement_effective_date',

  // ========================================
  // QUESTIONS & ENDORSEMENTS (6 fields - all optional)
  // ========================================

  /**
   * Insurance question 1: Allegations of negligence (Yes/No)
   * Optional - default No
   */
  INSURANCE_QUESTION_1: 'osot_insurance_question_1',

  /**
   * Explanation for question 1 (text area, 4000 chars max)
   * Optional - only required if question_1 = Yes
   */
  INSURANCE_QUESTION_1_EXPLAIN: 'osot_insurance_question_1_explain',

  /**
   * Insurance question 2: Insurer cancellation/denial (Yes/No)
   * Optional - default No
   */
  INSURANCE_QUESTION_2: 'osot_insurance_question_2',

  /**
   * Explanation for question 2 (text area, 4000 chars max)
   * Optional - only required if question_2 = Yes
   */
  INSURANCE_QUESTION_2_EXPLAIN: 'osot_insurance_question_2_explain',

  /**
   * Insurance question 3: Awareness of potential claims (Yes/No)
   * Optional - default No
   */
  INSURANCE_QUESTION_3: 'osot_insurance_question_3',

  /**
   * Explanation for question 3 (text area, 4000 chars max)
   * Optional - only required if question_3 = Yes
   */
  INSURANCE_QUESTION_3_EXPLAIN: 'osot_insurance_question_3_explain',

  /**
   * Endorsement description (text area, 4000 chars max)
   * Optional - only for admin users, used for policy amendments
   */
  ENDORSEMENT_DESCRIPTION: 'osot_endorsement_description',

  // ========================================
  // ACCESS CONTROL (2 optional fields)
  // ========================================

  /**
   * Privilege level (Owner, Admin, etc.)
   * Optional - defaults to Owner
   */
  PRIVILEGE: 'osot_privilege',

  /**
   * Access modifier (Public, Private, etc.)
   * Optional - defaults to Private
   */
  ACCESS_MODIFIERS: 'osot_access_modifiers',
} as const;

/**
 * OData constants for SELECT queries
 */
export const INSURANCE_ODATA = {
  /**
   * Default select fields for standard queries
   * Includes identifiers, lookups, and core insurance details
   */
  SELECT_FIELDS: Object.values(INSURANCE_FIELDS)
    .filter(
      (field) =>
        !field.includes('@') &&
        !field.includes('_value') &&
        field !== '_osot_table_organization_value' &&
        field !== '_osot_table_order_value' &&
        field !== '_osot_table_account_value',
    )
    .join(','),

  /**
   * Default order by for list queries
   * Most recent first
   */
  DEFAULT_ORDER_BY: 'createdon desc',

  /**
   * Filter for active records only
   */
  FILTER_ACTIVE: 'statecode eq 0',

  /**
   * Filter by organization
   */
  FILTER_BY_ORGANIZATION: (organizationGuid: string) =>
    `${INSURANCE_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`,

  /**
   * Filter by order
   */
  FILTER_BY_ORDER: (orderGuid: string) =>
    `${INSURANCE_FIELDS.ORDER_LOOKUP_VALUE} eq '${orderGuid}'`,

  /**
   * Filter by account/user
   */
  FILTER_BY_ACCOUNT: (accountGuid: string) =>
    `${INSURANCE_FIELDS.ACCOUNT_LOOKUP_VALUE} eq '${accountGuid}'`,

  /**
   * Filter by insurance status
   */
  FILTER_BY_STATUS: (status: number) =>
    `${INSURANCE_FIELDS.INSURANCE_STATUS} eq ${status}`,

  /**
   * Filter expired certificates (expiry_date < today)
   */
  FILTER_EXPIRED: `${INSURANCE_FIELDS.EXPIRY_DATE} lt now()`,

  /**
   * Filter active certificates (status = ACTIVE and effective <= today <= expiry)
   */
  FILTER_COVERAGE_ACTIVE: `${INSURANCE_FIELDS.INSURANCE_STATUS} eq 3 and ${INSURANCE_FIELDS.EFFECTIVE_DATE} le now() and ${INSURANCE_FIELDS.EXPIRY_DATE} ge now()`,
} as const;

/**
 * OData query helper constants
 * Pre-built queries for common operations
 */
export const INSURANCE_ODATA_QUERIES = {
  /**
   * Select all fields including system fields and lookups
   * Used for full record retrieval
   */
  SELECT_ALL_FIELDS: [
    INSURANCE_FIELDS.TABLE_INSURANCE_ID,
    INSURANCE_FIELDS.INSURANCE_NUMBER,
    'createdon',
    'modifiedon',
    'statecode',
    'statuscode',
    'ownerid',
    INSURANCE_FIELDS.ORGANIZATION_LOOKUP_VALUE,
    INSURANCE_FIELDS.ORDER_LOOKUP_VALUE,
    INSURANCE_FIELDS.ACCOUNT_LOOKUP_VALUE,
    INSURANCE_FIELDS.ACCOUNT_GROUP,
    INSURANCE_FIELDS.CATEGORY,
    INSURANCE_FIELDS.MEMBERSHIP,
    INSURANCE_FIELDS.CERTIFICATE,
    INSURANCE_FIELDS.FIRST_NAME,
    INSURANCE_FIELDS.LAST_NAME,
    INSURANCE_FIELDS.PERSONAL_CORPORATION,
    INSURANCE_FIELDS.ADDRESS_1,
    INSURANCE_FIELDS.ADDRESS_2,
    INSURANCE_FIELDS.CITY,
    INSURANCE_FIELDS.PROVINCE,
    INSURANCE_FIELDS.POSTAL_CODE,
    INSURANCE_FIELDS.PHONE_NUMBER,
    INSURANCE_FIELDS.EMAIL,
    INSURANCE_FIELDS.INSURANCE_TYPE,
    INSURANCE_FIELDS.INSURANCE_LIMIT,
    INSURANCE_FIELDS.INSURANCE_PRICE,
    INSURANCE_FIELDS.TOTAL,
    INSURANCE_FIELDS.INSURANCE_STATUS,
    INSURANCE_FIELDS.INSURANCE_DECLARATION,
    INSURANCE_FIELDS.EFFECTIVE_DATE,
    INSURANCE_FIELDS.EXPIRY_DATE,
    INSURANCE_FIELDS.ENDORSEMENT_EFFECTIVE_DATE,
    INSURANCE_FIELDS.INSURANCE_QUESTION_1,
    INSURANCE_FIELDS.INSURANCE_QUESTION_1_EXPLAIN,
    INSURANCE_FIELDS.INSURANCE_QUESTION_2,
    INSURANCE_FIELDS.INSURANCE_QUESTION_2_EXPLAIN,
    INSURANCE_FIELDS.INSURANCE_QUESTION_3,
    INSURANCE_FIELDS.INSURANCE_QUESTION_3_EXPLAIN,
    INSURANCE_FIELDS.ENDORSEMENT_DESCRIPTION,
    INSURANCE_FIELDS.PRIVILEGE,
    INSURANCE_FIELDS.ACCESS_MODIFIERS,
  ].join(','),
} as const;
