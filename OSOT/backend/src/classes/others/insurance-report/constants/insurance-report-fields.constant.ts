/**
 * Insurance Report Fields Constants
 *
 * Centralized field name definitions for the Insurance Report entity.
 * Maps to osot_table_insurance_report in Dataverse.
 *
 * USAGE:
 * - OData queries: `$select=${INSURANCE_REPORT_FIELDS.REPORT_ID}`
 * - Mappers: `dataverse[INSURANCE_REPORT_FIELDS.PERIOD_START]`
 * - Business rules: Field validation and transformation
 *
 * FIELD CATEGORIES:
 * - System: Primary key, timestamps, ownership
 * - Identity: Report ID (autonumber), organization link
 * - Period: Start/end dates for 24-hour window
 * - Metrics: Total records, total value
 * - Status: Report lifecycle (PENDING_APPROVAL → APPROVED/REJECTED)
 * - Approval: Tokens, approver info, timestamps
 * - Rejection: Tokens, rejector info, reason, timestamps
 * - Access Control: Privilege, access modifier
 *
 * @file insurance-report-fields.constant.ts
 * @module InsuranceReportModule
 * @layer Constants
 */

/**
 * Insurance Report Field Names
 *
 * All field names match Dataverse schema exactly.
 * Use these constants instead of hardcoded strings.
 */
export const INSURANCE_REPORT_FIELDS = {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /** Primary key (GUID) - osot_table_insurance_reportid */
  TABLE_INSURANCE_REPORT_ID: 'osot_table_insurance_reportid',

  /** Created timestamp (system managed) */
  CREATED_ON: 'createdon',

  /** Last modified timestamp (system managed) */
  MODIFIED_ON: 'modifiedon',

  /** Owner ID (systemuser GUID) */
  OWNER_ID: 'ownerid',

  // ========================================
  // IDENTITY FIELDS
  // ========================================

  /** Report ID (autonumber: osot-rep-0000001) */
  REPORT_ID: 'osot_report_id',

  /** Organization lookup (GUID to osot_table_organization) */
  ORGANIZATION: '_osot_table_organization_value',

  /** Organization binding for OData */
  ORGANIZATION_BIND: 'osot_Table_Organization@odata.bind',

  // ========================================
  // PERIOD FIELDS (24-hour window)
  // ========================================

  /** Period start date (ISO 8601 date only) */
  PERIOD_START: 'osot_period_start',

  /** Period end date (ISO 8601 date only) */
  PERIOD_END: 'osot_period_end',

  // ========================================
  // METRICS FIELDS
  // ========================================

  /** Total insurance records in report */
  TOTAL_RECORDS: 'osot_total_records',

  /** Total value (sum of all insurance premiums) */
  TOTAL_VALUE: 'osot_total_value',

  // ========================================
  // STATUS FIELD
  // ========================================

  /** Report status (InsuranceReportStatus enum) */
  REPORT_STATUS: 'osot_report_status',

  // ========================================
  // APPROVAL FIELDS
  // ========================================

  /** Approval token (UUID hashed with SHA256) */
  APPROVED_TOKEN: 'osot_approved_token',

  /** User ID who approved the report */
  APPROVED_BY: 'osot_approved_by',

  /** Approval timestamp */
  APPROVED_DATE: 'osot_approved_date',

  // ========================================
  // REJECTION FIELDS
  // ========================================

  /** Rejection token (UUID hashed with SHA256) */
  REJECTION_TOKEN: 'osot_rejection_token',

  /** User ID who rejected the report */
  REJECT_BY: 'osot_reject_by',

  /** Rejection timestamp */
  REJECTED_DATE: 'osot_rejected_date',

  /** Reason for rejection (admin-provided text) */
  REJECTION_REASON: 'osot_rejection_reason',

  // ========================================
  // ACCESS CONTROL FIELDS
  // ========================================

  /** Privilege level (Main, Admin, Owner) */
  PRIVILEGE: 'osot_privilege',

  /** Access modifier (Public, Private, Protected) */
  ACCESS_MODIFIER: 'osot_access_modifier',
} as const;

/**
 * Insurance Report Entity Name
 *
 * Used in OData queries and repository operations.
 */
export const INSURANCE_REPORT_ENTITY = 'osot_table_insurance_reports';

/**
 * Insurance Report Identity Fields
 *
 * Fields used for unique identification and lookup.
 * Used in business rule validations and deduplication.
 */
export const INSURANCE_REPORT_IDENTITY_FIELDS = [
  INSURANCE_REPORT_FIELDS.REPORT_ID,
  INSURANCE_REPORT_FIELDS.ORGANIZATION,
  INSURANCE_REPORT_FIELDS.PERIOD_START,
  INSURANCE_REPORT_FIELDS.PERIOD_END,
] as const;

/**
 * Insurance Report Required Fields
 *
 * Fields that must be present on creation.
 * Used by validators and business rule services.
 */
export const INSURANCE_REPORT_REQUIRED_FIELDS = [
  INSURANCE_REPORT_FIELDS.ORGANIZATION,
  INSURANCE_REPORT_FIELDS.PERIOD_START,
  INSURANCE_REPORT_FIELDS.PERIOD_END,
  INSURANCE_REPORT_FIELDS.TOTAL_RECORDS,
  INSURANCE_REPORT_FIELDS.TOTAL_VALUE,
  INSURANCE_REPORT_FIELDS.REPORT_STATUS,
] as const;

/**
 * Insurance Report Updatable Fields
 *
 * Fields that can be updated after creation.
 * Audit fields (created_on, modified_on) are system-managed and immutable.
 */
export const INSURANCE_REPORT_UPDATABLE_FIELDS = [
  INSURANCE_REPORT_FIELDS.REPORT_STATUS,
  INSURANCE_REPORT_FIELDS.APPROVED_TOKEN,
  INSURANCE_REPORT_FIELDS.APPROVED_BY,
  INSURANCE_REPORT_FIELDS.APPROVED_DATE,
  INSURANCE_REPORT_FIELDS.REJECTION_TOKEN,
  INSURANCE_REPORT_FIELDS.REJECT_BY,
  INSURANCE_REPORT_FIELDS.REJECTED_DATE,
  INSURANCE_REPORT_FIELDS.REJECTION_REASON,
] as const;
