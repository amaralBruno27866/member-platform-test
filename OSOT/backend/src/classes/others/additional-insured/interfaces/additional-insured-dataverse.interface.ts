/**
 * Additional Insured Dataverse Interface
 *
 * Represents the exact structure of Additional Insured data as returned by Dataverse API.
 * Used for mapping between API responses and internal models.
 *
 * KEY DIFFERENCES FROM INTERNAL:
 * - _osot_table_insurance_value: Numeric GUID string from lookup
 * - Choice fields: Numeric IDs instead of string display names
 * - Dates: ISO 8601 strings instead of Date objects
 * - Includes @odata properties for relationship binding
 *
 * DATAVERSE TABLE: osot_Table_Additional_Insured
 * PUBLISHER PREFIX: osot
 *
 * @file additional-insured-dataverse.interface.ts
 * @module AdditionalInsuredModule
 * @layer Interfaces
 */

/**
 * Additional Insured Dataverse Model
 *
 * Exact representation of data as stored in and returned from Dataverse.
 * All field names and types match Dataverse schema exactly.
 *
 * TECHNICAL NOTES:
 * - Lookup values are prefixed with underscore: _fieldname_value (GUID)
 * - Choice fields are numeric IDs
 * - Dates are ISO 8601 strings (e.g., "2026-01-29T00:00:00Z")
 * - OData binding properties (e.g., osot_Table_Insurance@odata.bind) used for creation only
 */
export interface AdditionalInsuredDataverse {
  // ========================================
  // IDENTITY FIELDS
  // ========================================

  /**
   * Unique identifier (GUID) assigned by Dataverse.
   * Format: UUID (e.g., "f47ac10b-58cc-4372-a567-0e02b2c3d479")
   * System-assigned and immutable.
   */
  osot_table_additional_insuredid?: string;

  /**
   * Human-readable business ID (autonumber).
   * Format: osot-add-ins-0000001, osot-add-ins-0000002, etc.
   * System-assigned and immutable.
   * Optional in responses.
   */
  osot_additionalinsuredid?: string;

  // ========================================
  // RELATIONSHIP FIELDS (LOOKUP)
  // ========================================

  /**
   * GUID of parent Insurance record (lookup value).
   * Set via osot_Table_Insurance@odata.bind during creation.
   * Immutable after creation.
   * Format: UUID string
   * Optional in responses (empty if not set).
   */
  _osot_table_insurance_value?: string;

  /**
   * OData binding property for creating/updating insurance relationship.
   * Format: "/osot_table_insurances({guid})"
   * Used ONLY during POST/PATCH operations, not returned in GET responses.
   * Example: '/osot_table_insurances(f47ac10b-58cc-4372-a567-0e02b2c3d479)'
   * Optional - used only when setting relationship.
   */
  'osot_Table_Insurance@odata.bind'?: string;

  /**
   * Expanded Insurance data (if $expand=osot_Table_Insurance used).
   * Contains full insurance record for lazy loading relationships.
   * Only included if explicitly expanded in OData query.
   * Optional.
   */
  osot_Table_Insurance?: {
    osot_table_insuranceid?: string;
    osot_insurance_type?: number;
    osot_insurance_status?: string;
    _osot_order_value?: string;
    _osot_account_value?: string;
  };

  // ========================================
  // COMPANY INFORMATION FIELDS
  // ========================================

  /**
   * Name of the company/entity covered by insurance.
   * Stored as UPPERCASE in Dataverse.
   * Examples: "ABC CORPORATION", "XYZ INDUSTRIES LTD"
   * Max 255 characters.
   * Must be unique per insurance record.
   * Required field.
   */
  osot_company_name?: string;

  /**
   * Street address of the company.
   * Examples: "123 MAIN STREET", "SUITE 100, 456 OAK AVENUE"
   * Max 255 characters.
   * Required field.
   */
  osot_address?: string;

  /**
   * City choice value (numeric ID).
   * Numeric ID from Choices_Cities global choice set.
   * Examples: 1 (Toronto), 2 (Montreal), etc.
   * Maps to cities.enum.ts values.
   * Optional in creation, required in valid records.
   */
  osot_city?: number;

  /**
   * Province choice value (numeric ID).
   * Numeric ID from Choices_Provinces global choice set.
   * Examples: 1 (Ontario), 2 (Quebec), etc.
   * Maps to provinces.enum.ts values.
   * Optional in creation, required in valid records.
   */
  osot_province?: number;

  /**
   * Postal code (Canadian format, no spaces).
   * Stored as: K1A0A6, M5H2N2, V6B4X8 (no spaces)
   * Max 7 characters.
   * Pattern: [A-Z][0-9][A-Z][0-9][A-Z][0-9]
   * Required field.
   */
  osot_postal_code?: string;

  // ========================================
  // ACCESS CONTROL FIELDS
  // ========================================

  /**
   * Privilege choice value (numeric ID).
   * Numeric ID from Choices_Privilege global choice set.
   * Default: 1 (Owner)
   * Values: 1 (Owner), 2 (Admin), 3 (Main)
   * Maps to privilege.enum.ts
   * Optional (defaults to Owner).
   */
  osot_privilege?: number;

  /**
   * Access modifier choice value (numeric ID).
   * Numeric ID from Choices_Access_Modifiers global choice set.
   * Default: 1 (Private)
   * Values: 1 (Private), 2 (Public), etc.
   * Maps to access-modifier.enum.ts
   * Optional (defaults to Private).
   */
  osot_access_modifiers?: number;

  // ========================================
  // SYSTEM AUDIT FIELDS
  // ========================================

  /**
   * Record creation timestamp (ISO 8601 string).
   * Example: "2026-01-29T10:30:45.123Z"
   * System-assigned and immutable.
   * Optional in creation requests.
   */
  createdon?: string;

  /**
   * Record last modification timestamp (ISO 8601 string).
   * Example: "2026-01-29T15:45:30.456Z"
   * System-updated on every change.
   * Optional in responses.
   */
  modifiedon?: string;

  /**
   * User who created the record (object with id and name).
   * System-assigned and immutable.
   * Optional in responses.
   */
  createdby?: {
    '@odata.type': string;
    '@odata.id'?: string;
    logicalname?: string;
    name?: string;
    id?: string;
  };

  /**
   * User who last modified the record (object with id and name).
   * System-updated on every change.
   * Optional in responses.
   */
  modifiedby?: {
    '@odata.type': string;
    '@odata.id'?: string;
    logicalname?: string;
    name?: string;
    id?: string;
  };

  /**
   * Owner of the record (object with id and name).
   * System-managed.
   * Optional in responses.
   */
  ownerid?: {
    '@odata.type': string;
    '@odata.id'?: string;
    logicalname?: string;
    name?: string;
    id?: string;
  };

  /**
   * Version of the record (for optimistic locking).
   * Increments on each update.
   * Used to prevent concurrent modification conflicts.
   * Optional in responses.
   */
  versionnumber?: number;

  /**
   * OData context URL.
   * Set by Dataverse API, not used in application logic.
   * Example: "https://org.crm3.dynamics.com/api/data/v9.2/$metadata#osot_table_additional_insureds/$entity"
   * Optional in responses.
   */
  '@odata.context'?: string;

  /**
   * OData entity type.
   * Set by Dataverse API.
   * Example: "Microsoft.Dynamics.CRM.osot_table_additional_insured"
   * Optional in responses.
   */
  '@odata.type'?: string;

  /**
   * OData entity ID/URL.
   * Set by Dataverse API for linking.
   * Example: "https://org.crm3.dynamics.com/api/data/v9.2/osot_table_additional_insureds(guid)"
   * Optional in responses.
   */
  '@odata.id'?: string;

  /**
   * OData etag for change tracking.
   * Set by Dataverse API.
   * Optional in responses.
   */
  '@odata.etag'?: string;
}

/**
 * Dataverse API Response wrapper for batch operations
 */
export interface DataverseResponse<T> {
  '@odata.context': string;
  value: T[];
}

/**
 * Dataverse API Error Response
 */
export interface DataverseErrorResponse {
  error: {
    code: string;
    message: string;
    innererror?: {
      message: string;
      type: string;
      stacktrace: string;
    };
  };
}
