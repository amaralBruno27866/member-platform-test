/**
 * Insurance Provider OData Constants
 *
 * Centralized configuration for Insurance Provider entity OData operations:
 * - Field names (Dataverse schema)
 * - Entity metadata
 * - Query select configurations
 *
 * CRITICAL: Field names must match exactly with Dataverse schema
 * Any mismatch will cause OData query failures
 */

/**
 * Insurance Provider entity metadata for Dataverse API
 */
export const INSURANCE_PROVIDER_ENTITY = {
  /**
   * Logical name used in OData API endpoints
   * Example: /api/data/v9.2/osot_table_insurance_providers
   */
  logicalName: 'osot_table_insurance_provider',

  /**
   * Plural name for collection endpoints
   */
  collectionName: 'osot_table_insurance_providers',

  /**
   * Primary key field name (GUID)
   */
  primaryKey: 'osot_table_insurance_providerid',
} as const;

/**
 * Insurance Provider field names exactly as they appear in Dataverse
 * Used for OData $select, $filter, $orderby operations
 *
 * IMPORTANT: These names are case-sensitive and must match Dataverse schema
 */
export const INSURANCE_PROVIDER_FIELDS = {
  // ========================================
  // IDENTIFIERS (2 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * System-generated unique identifier
   */
  TABLE_INSURANCE_PROVIDER_ID: 'osot_table_insurance_providerid',

  /**
   * Business ID (Autonumber)
   * Format: osot-prov-0000001
   * User-friendly unique identifier
   */
  PROVIDER_ID: 'osot_provider_id',

  // ========================================
  // RELATIONSHIPS/LOOKUPS (1 required field)
  // ========================================

  /**
   * Organization lookup (parent)
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

  // ========================================
  // PROVIDER INFORMATION (9 fields)
  // ========================================

  /**
   * Insurance company name
   * Required
   */
  INSURANCE_COMPANY_NAME: 'osot_insurance_company_name',

  /**
   * Insurance broker name
   * Required
   */
  INSURANCE_BROKER_NAME: 'osot_insurance_broker_name',

  /**
   * Insurance company logo URL
   * Required
   */
  INSURANCE_COMPANY_LOGO: 'osot_insurance_company_logo',

  /**
   * Insurance broker logo URL
   * Optional
   */
  INSURANCE_BROKER_LOGO: 'osot_insurance_broker_logo',

  /**
   * Policy period start date (Date only)
   * Required
   */
  POLICY_PERIOD_START: 'osot_policy_period_start',

  /**
   * Policy period end date (Date only)
   * Required
   */
  POLICY_PERIOD_END: 'osot_policy_period_end',

  /**
   * Master policy description (Text area)
   * Required
   */
  MASTER_POLICY_DESCRIPTION: 'osot_master_policy_description',

  /**
   * Insurance authorized representative (URL)
   * Required
   */
  INSURANCE_AUTHORIZED_REPRESENTATIVE:
    'osot_insurance_authorized_representative',

  /**
   * Certificate observations (Text area)
   * Optional
   */
  CERTIFICATE_OBSERVATIONS: 'osot_certificate_observations',

  /**
   * Broker general information (Text area)
   * Optional
   */
  BROKER_GENERAL_INFORMATION: 'osot_broker_general_information',

  // ========================================
  // ACCESS CONTROL (2 fields)
  // ========================================

  /**
   * Privilege level for access control
   * Optional - defaults to Main
   */
  PRIVILEGE: 'osot_privilege',

  /**
   * Access modifier for viewing control
   * Optional - defaults to Protected
   */
  ACCESS_MODIFIER: 'osot_access_modifier',
} as const;

/**
 * OData constants for SELECT queries
 */
export const INSURANCE_PROVIDER_ODATA = {
  /**
   * Default select fields for standard queries
   * Includes identifiers, lookups, and core provider details
   */
  SELECT_FIELDS: Object.values(INSURANCE_PROVIDER_FIELDS)
    .filter(
      (field) =>
        !field.includes('@') &&
        !field.includes('_value') &&
        field !== '_osot_table_organization_value',
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
    `${INSURANCE_PROVIDER_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`,
} as const;

/**
 * OData query helper constants
 * Pre-built queries for common operations
 */
export const INSURANCE_PROVIDER_ODATA_QUERIES = {
  /**
   * Select all fields including system fields and lookups
   * Used for full record retrieval
   */
  SELECT_ALL_FIELDS: [
    INSURANCE_PROVIDER_FIELDS.TABLE_INSURANCE_PROVIDER_ID,
    INSURANCE_PROVIDER_FIELDS.PROVIDER_ID,
    'createdon',
    'modifiedon',
    'statecode',
    'statuscode',
    'ownerid',
    INSURANCE_PROVIDER_FIELDS.ORGANIZATION_LOOKUP_VALUE,
    INSURANCE_PROVIDER_FIELDS.INSURANCE_COMPANY_NAME,
    INSURANCE_PROVIDER_FIELDS.INSURANCE_BROKER_NAME,
    INSURANCE_PROVIDER_FIELDS.INSURANCE_COMPANY_LOGO,
    INSURANCE_PROVIDER_FIELDS.INSURANCE_BROKER_LOGO,
    INSURANCE_PROVIDER_FIELDS.POLICY_PERIOD_START,
    INSURANCE_PROVIDER_FIELDS.POLICY_PERIOD_END,
    INSURANCE_PROVIDER_FIELDS.MASTER_POLICY_DESCRIPTION,
    INSURANCE_PROVIDER_FIELDS.INSURANCE_AUTHORIZED_REPRESENTATIVE,
    INSURANCE_PROVIDER_FIELDS.CERTIFICATE_OBSERVATIONS,
    INSURANCE_PROVIDER_FIELDS.BROKER_GENERAL_INFORMATION,
    INSURANCE_PROVIDER_FIELDS.PRIVILEGE,
    INSURANCE_PROVIDER_FIELDS.ACCESS_MODIFIER,
  ].join(','),
} as const;
