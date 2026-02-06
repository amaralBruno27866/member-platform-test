/**
 * Additional Insured Internal Interface
 *
 * Represents the internal application model for Additional Insured data.
 * Used throughout services, mappers, and business logic.
 *
 * KEY DIFFERENCES FROM DATAVERSE:
 * - insuranceGuid: GUID instead of _osot_table_insurance_value
 * - choice values: strings (display names) instead of numeric IDs
 * - dates: JavaScript Date objects instead of ISO strings
 * - No @odata.bind properties (used only for Dataverse writes)
 *
 * @file additional-insured-internal.interface.ts
 * @module AdditionalInsuredModule
 * @layer Interfaces
 */

/**
 * Additional Insured Internal Model
 *
 * Represents a company/entity that is covered under a Commercial insurance policy.
 * Example: User has Commercial insurance, adds ABC Corp and XYZ Inc as additional insureds.
 *
 * BUSINESS CONTEXT:
 * - Only applicable to Commercial (GENERAL) insurance type
 * - One insurance can have multiple additional insureds (1:N relationship)
 * - Company names must be unique per insurance
 * - Inherits organization context from parent Insurance
 *
 * IMMUTABLE FIELDS (set at creation, cannot change):
 * - osot_table_additional_insuredid (GUID)
 * - osot_additionalinsuredid (autonumber)
 * - insuranceGuid (insurance relationship)
 * - organizationGuid (inherited from insurance)
 * - createdon
 * - createdBy
 * - ownerid
 *
 * EDITABLE FIELDS (by ADMIN/MAIN only):
 * - osot_company_name
 * - osot_address
 * - osot_city
 * - osot_province
 * - osot_postal_code
 * - osot_privilege (default: Owner)
 * - osot_access_modifiers (default: Private)
 *
 * MUTABLE SYSTEM FIELDS:
 * - modifiedon
 * - modifiedBy
 */
export interface AdditionalInsuredInternal {
  // ========================================
  // IDENTITY FIELDS
  // ========================================

  /**
   * Unique identifier (GUID) assigned by Dataverse at creation.
   * System-assigned and immutable.
   */
  osot_table_additional_insuredid: string;

  /**
   * Human-readable business ID (autonumber).
   * Format: osot-add-ins-0000001, osot-add-ins-0000002, etc.
   * System-assigned and immutable.
   */
  osot_additionalinsuredid?: string;

  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================

  /**
   * Foreign key to parent Insurance record (GUID).
   * Establishes 1:N relationship: Insurance → Additional Insured.
   * Immutable - set at creation, cannot be changed.
   * RULE: Insurance must be type GENERAL (Commercial) and status ACTIVE
   */
  insuranceGuid: string;

  /**
   * Organization GUID inherited from parent Insurance.
   * Used for multi-tenant isolation and data access control.
   * Immutable - derived from insurance relationship.
   */
  organizationGuid?: string;

  // ========================================
  // COMPANY INFORMATION FIELDS
  // ========================================

  /**
   * Name of the company/entity being covered.
   * Examples: "ABC Corporation", "XYZ Industries Ltd", "John Smith Consulting"
   *
   * NORMALIZATION:
   * - Write: UPPERCASE (ABC CORPORATION)
   * - Read: As stored (UPPERCASE)
   * - Max 255 characters
   * - Must be unique per insurance (no duplicates allowed)
   */
  osot_company_name: string;

  /**
   * Street address of the additional insured company.
   * Examples: "123 Main Street", "Suite 100, 456 Oak Avenue"
   *
   * NORMALIZATION:
   * - Trimmed of whitespace
   * - Max 255 characters
   * - Required field
   */
  osot_address: string;

  /**
   * City of the additional insured company.
   * Stored as choice value name (display name).
   * Examples: "Toronto", "Montreal", "Vancouver"
   *
   * INTERNAL REPRESENTATION: string (city name)
   * DATAVERSE REPRESENTATION: numeric choice ID
   */
  osot_city: string;

  /**
   * Province/state of the additional insured company.
   * Stored as choice value name (display name).
   * Examples: "Ontario", "Quebec", "British Columbia"
   *
   * INTERNAL REPRESENTATION: string (province name)
   * DATAVERSE REPRESENTATION: numeric choice ID
   */
  osot_province: string;

  /**
   * Postal/ZIP code of the additional insured company.
   * Canadian postal code format (no spaces in storage).
   * Examples: "K1A0A6", "M5H2N2", "V6B4X8"
   *
   * NORMALIZATION:
   * - Write: Remove spaces, UPPERCASE (K1A 0A6 → K1A0A6)
   * - Read: Format with space (K1A0A6 → K1A 0A6)
   * - Max 7 characters (no spaces)
   * - Must match Canadian postal code pattern: A#A#A#
   */
  osot_postal_code: string;

  // ========================================
  // ACCESS CONTROL FIELDS
  // ========================================

  /**
   * Privilege level for data access (defaults to Owner = 1).
   * Stored as numeric choice ID from privilege.enum.ts
   * Values: 1 (Owner), 2 (Admin), 3 (Main)
   *
   * INTERNAL REPRESENTATION: number
   * Used to determine who can view/edit this record
   */
  osot_privilege?: number;

  /**
   * Access modifier controlling record visibility (defaults to Private = 1).
   * Stored as numeric choice ID from access-modifier.enum.ts
   * Values: 1 (Private), 2 (Public), etc.
   *
   * INTERNAL REPRESENTATION: number
   * Determines scope: Own records only, shared, or public
   */
  osot_access_modifiers?: number;

  // ========================================
  // SYSTEM AUDIT FIELDS
  // ========================================

  /**
   * Timestamp when record was created.
   * System-assigned and immutable.
   * Used for audit trail and sorting.
   */
  createdon?: Date;

  /**
   * Timestamp when record was last modified.
   * System-updated on every change.
   * Used for detecting recent updates.
   */
  modifiedon?: Date;

  /**
   * GUID of user who created the record.
   * System-assigned and immutable.
   * Used for audit trail.
   */
  createdBy?: string;

  /**
   * GUID of user who last modified the record.
   * System-updated on every change.
   * Used for audit trail.
   */
  modifiedBy?: string;

  /**
   * Owner of the record (GUID).
   * Typically the account or affiliate that owns the parent insurance.
   * Used for permission checks and data isolation.
   */
  ownerid?: string;
}

/**
 * Additional Insured with validation metadata
 * Extended interface including validation/operation context
 */
export interface AdditionalInsuredInternalWithMetadata
  extends AdditionalInsuredInternal {
  // Operation tracking
  operationId?: string;

  // Validation context
  validationErrors?: string[];
  isValid?: boolean;

  // Audit context
  changedFields?: string[];
  previousValues?: Record<string, unknown>;
}
