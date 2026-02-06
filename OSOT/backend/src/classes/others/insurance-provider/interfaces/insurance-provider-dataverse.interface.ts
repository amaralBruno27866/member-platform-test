/**
 * Insurance Provider Dataverse Interface
 *
 * Dataverse API representation of Insurance Provider entity (OData format).
 * Matches the exact field names and types returned by Dataverse API.
 *
 * Architecture Notes:
 * - snake_case naming (Dataverse convention)
 * - All fields optional (partial updates supported)
 * - Dates are ISO 8601 strings (not Date objects)
 * - _osot_table_organization_value is lookup GUID (read-only)
 * - osot_Table_Organization@odata.bind is used for writes
 */

/**
 * Insurance Provider entity - Dataverse API representation
 */
export interface InsuranceProviderDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /**
   * Primary key (GUID)
   */
  osot_table_insurance_providerid?: string;

  /**
   * Autonumber ID (human-readable)
   * Format: osot-prov-0000001
   * Read-only
   */
  osot_provider_id?: string;

  /**
   * Creation timestamp (ISO 8601 string)
   */
  createdon?: string;

  /**
   * Modification timestamp (ISO 8601 string)
   */
  modifiedon?: string;

  /**
   * Owner ID (GUID)
   */
  ownerid?: string;

  /**
   * State code (0 = Active, 1 = Inactive)
   */
  statecode?: number;

  /**
   * Status code (detailed status)
   */
  statuscode?: number;

  // ========================================
  // REQUIRED RELATIONSHIP FIELDS (Lookup)
  // ========================================

  /**
   * Organization GUID (read-only lookup value)
   * Retrieved via $select=_osot_table_organization_value
   */
  _osot_table_organization_value?: string;

  /**
   * Organization @odata.bind field name
   * Used for creating/updating organization relationships
   * Format: "/osot_table_organizations(guid)"
   */
  'osot_Table_Organization@odata.bind'?: string;

  // ========================================
  // PROVIDER INFORMATION (9 fields)
  // ========================================

  /**
   * Insurance company name
   */
  osot_insurance_company_name?: string;

  /**
   * Insurance broker name
   */
  osot_insurance_broker_name?: string;

  /**
   * Insurance company logo URL
   */
  osot_insurance_company_logo?: string;

  /**
   * Insurance broker logo URL
   */
  osot_insurance_broker_logo?: string;

  /**
   * Policy period start date (Date only)
   * ISO 8601 string
   */
  osot_policy_period_start?: string;

  /**
   * Policy period end date (Date only)
   * ISO 8601 string
   */
  osot_policy_period_end?: string;

  /**
   * Master policy description (Text area)
   */
  osot_master_policy_description?: string;

  /**
   * Insurance authorized representative (URL)
   */
  osot_insurance_authorized_representative?: string;

  /**
   * Certificate observations (Text area)
   */
  osot_certificate_observations?: string;

  /**
   * Broker general information (Text area)
   */
  osot_broker_general_information?: string;

  // ========================================
  // ACCESS CONTROL (2 optional fields)
  // ========================================

  /**
   * Privilege level (Choice field)
   * Optional - defaults to Main
   */
  osot_privilege?: number;

  /**
   * Access modifier (Choice field)
   * Optional - defaults to Protected
   */
  osot_access_modifier?: number;

  // ========================================
  // ODATA METADATA (Read-only)
  // ========================================

  /**
   * OData context (API metadata)
   */
  '@odata.context'?: string;

  /**
   * OData etag (concurrency control)
   */
  '@odata.etag'?: string;
}
