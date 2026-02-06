/**
 * Insurance Report Dataverse Interface
 *
 * Represents Insurance Report as returned by Dataverse API.
 * Matches exact Dataverse schema with snake_case fields.
 *
 * DIFFERENCES FROM INTERNAL:
 * - snake_case field names (osot_report_id not reportId)
 * - Dates as ISO 8601 strings (not Date objects)
 * - OData lookups with @odata.bind and _value suffixes
 * - Enum values as Dataverse numbers (not TypeScript enums)
 *
 * USAGE:
 * ```typescript
 * const dataverseResponse: InsuranceReportDataverse = {
 *   osot_table_insurance_reportid: 'guid-123',
 *   osot_report_id: 'osot-rep-0000123',
 *   _osot_table_organization_value: 'org-guid-xyz',
 *   osot_period_start: '2026-01-29',
 *   osot_period_end: '2026-01-30',
 *   osot_total_records: 15,
 *   osot_total_value: 12500.00,
 *   osot_report_status: 100000000, // PENDING_APPROVAL
 * };
 * ```
 *
 * ODATA BINDING:
 * - Create: `osot_Table_Organization@odata.bind: '/osot_table_organizations(guid)'`
 * - Read: `_osot_table_organization_value: 'guid'`
 *
 * @file insurance-report-dataverse.interface.ts
 * @module InsuranceReportModule
 * @layer Interfaces
 */

/**
 * Insurance Report Dataverse Interface
 *
 * Complete Dataverse representation with all fields.
 * Optional fields represent nullable database columns.
 */
export interface InsuranceReportDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /** Primary key (GUID) */
  osot_table_insurance_reportid?: string;

  /** Created timestamp (ISO 8601 string) */
  createdon?: string;

  /** Last modified timestamp (ISO 8601 string) */
  modifiedon?: string;

  /** Owner ID (systemuser GUID) */
  ownerid?: string;

  // ========================================
  // IDENTITY FIELDS
  // ========================================

  /** Report ID (autonumber: osot-rep-0000001) */
  osot_report_id?: string;

  /** Organization lookup value (GUID extracted from OData) */
  _osot_table_organization_value?: string;

  /** Organization OData binding (for create/update operations) */
  'osot_Table_Organization@odata.bind'?: string;

  // ========================================
  // PERIOD FIELDS (24-hour window)
  // ========================================

  /** Period start date (ISO 8601 date string: YYYY-MM-DD) */
  osot_period_start?: string;

  /** Period end date (ISO 8601 date string: YYYY-MM-DD) */
  osot_period_end?: string;

  // ========================================
  // METRICS FIELDS
  // ========================================

  /** Total insurance records in report */
  osot_total_records?: number;

  /** Total value (sum of all insurance premiums) */
  osot_total_value?: number;

  // ========================================
  // STATUS FIELD
  // ========================================

  /** Report status (Dataverse choice number) */
  osot_report_status?: number;

  // ========================================
  // APPROVAL FIELDS
  // ========================================

  /** Approval token (UUID hashed with SHA256) */
  osot_approved_token?: string;

  /** User ID who approved the report */
  osot_approved_by?: string;

  /** Approval timestamp (ISO 8601 string) */
  osot_approved_date?: string;

  // ========================================
  // REJECTION FIELDS
  // ========================================

  /** Rejection token (UUID hashed with SHA256) */
  osot_rejection_token?: string;

  /** User ID who rejected the report */
  osot_reject_by?: string;

  /** Rejection timestamp (ISO 8601 string) */
  osot_rejected_date?: string;

  /** Reason for rejection (admin-provided text) */
  osot_rejection_reason?: string;

  // ========================================
  // ACCESS CONTROL FIELDS
  // ========================================

  /** Privilege level (Dataverse choice number) */
  osot_privilege?: number;

  /** Access modifier (Dataverse choice number) */
  osot_access_modifier?: number;

  // ========================================
  // EXPANDED NAVIGATION PROPERTIES
  // ========================================

  /** Expanded organization entity (when using $expand) */
  osot_Table_Organization?: {
    osot_table_organizationid: string;
    osot_name: string;
    osot_slug?: string;
  };
}

/**
 * Insurance Report Status Dataverse Enum
 *
 * Dataverse choice values for osot_report_status field.
 * Maps to InsuranceReportStatus TypeScript enum.
 */
export enum InsuranceReportStatusDataverse {
  /** Report generated, awaiting admin approval */
  PENDING_APPROVAL = 100000000,

  /** Report approved by admin */
  APPROVED = 100000001,

  /** Report rejected by admin */
  REJECTED = 100000002,

  /** Report sent to insurance provider */
  SENT_TO_PROVIDER = 100000003,

  /** Provider acknowledged receipt */
  ACKNOWLEDGED = 100000004,
}

/**
 * Insurance Report Create Payload
 *
 * Minimal fields required for Dataverse CREATE operation.
 * Uses OData binding for organization relationship.
 */
export interface InsuranceReportDataverseCreatePayload {
  /** Organization OData binding (required) */
  'osot_Table_Organization@odata.bind': string;

  /** Period start date (required) */
  osot_period_start: string;

  /** Period end date (required) */
  osot_period_end: string;

  /** Total insurance records (required) */
  osot_total_records: number;

  /** Total value (required) */
  osot_total_value: number;

  /** Report status (defaults to PENDING_APPROVAL) */
  osot_report_status: number;

  /** Approval token (optional) */
  osot_approved_token?: string;

  /** Rejection token (optional) */
  osot_rejection_token?: string;

  /** Privilege level (optional) */
  osot_privilege?: number;

  /** Access modifier (optional) */
  osot_access_modifier?: number;
}

/**
 * Insurance Report Update Payload
 *
 * Fields allowed for Dataverse PATCH operation.
 * System fields (created_on, modified_on) cannot be updated.
 */
export interface InsuranceReportDataverseUpdatePayload {
  /** Update report status */
  osot_report_status?: number;

  /** Update approval token */
  osot_approved_token?: string;

  /** Set approver user ID */
  osot_approved_by?: string;

  /** Set approval timestamp */
  osot_approved_date?: string;

  /** Update rejection token */
  osot_rejection_token?: string;

  /** Set rejector user ID */
  osot_reject_by?: string;

  /** Set rejection timestamp */
  osot_rejected_date?: string;

  /** Set rejection reason */
  osot_rejection_reason?: string;
}
