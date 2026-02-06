/**
 * Insurance Report Internal Interface
 *
 * Internal application representation of Insurance Report entity.
 * Used throughout business logic, services, and mappers.
 *
 * DIFFERENCES FROM DATAVERSE:
 * - Uses camelCase instead of snake_case
 * - Date fields as Date objects (not ISO strings)
 * - Organization as GUID string (not OData lookup)
 * - Enum values as TypeScript enums (not numbers)
 *
 * USAGE:
 * ```typescript
 * const report: InsuranceReportInternal = {
 *   reportId: 'osot-rep-0000123',
 *   organizationGuid: 'org-guid-xyz',
 *   periodStart: new Date('2026-01-29'),
 *   periodEnd: new Date('2026-01-30'),
 *   totalRecords: 15,
 *   totalValue: 12500.00,
 *   reportStatus: InsuranceReportStatus.PENDING_APPROVAL,
 * };
 * ```
 *
 * @file insurance-report-internal.interface.ts
 * @module InsuranceReportModule
 * @layer Interfaces
 */

import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';

/**
 * Insurance Report Internal Interface
 *
 * Complete internal representation with all fields.
 * Optional fields represent nullable database columns.
 */
export interface InsuranceReportInternal {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /** Primary key (GUID) */
  osot_table_insurance_reportid?: string;

  /** Created timestamp */
  createdon?: Date;

  /** Last modified timestamp */
  modifiedon?: Date;

  /** Owner ID (systemuser GUID) */
  ownerid?: string;

  // ========================================
  // IDENTITY FIELDS
  // ========================================

  /** Report ID (autonumber: osot-rep-0000001) */
  reportId?: string;

  /** Organization GUID */
  organizationGuid: string;

  // ========================================
  // PERIOD FIELDS (24-hour window)
  // ========================================

  /** Period start date */
  periodStart: Date;

  /** Period end date */
  periodEnd: Date;

  // ========================================
  // METRICS FIELDS
  // ========================================

  /** Total insurance records in report */
  totalRecords: number;

  /** Total value (sum of all insurance premiums) */
  totalValue: number;

  // ========================================
  // STATUS FIELD
  // ========================================

  /** Report status */
  reportStatus: InsuranceReportStatus;

  // ========================================
  // APPROVAL FIELDS
  // ========================================

  /** Approval token (UUID hashed with SHA256) */
  approvedToken?: string;

  /** User ID who approved the report */
  approvedBy?: string;

  /** Approval timestamp */
  approvedDate?: Date;

  // ========================================
  // REJECTION FIELDS
  // ========================================

  /** Rejection token (UUID hashed with SHA256) */
  rejectionToken?: string;

  /** User ID who rejected the report */
  rejectBy?: string;

  /** Rejection timestamp */
  rejectedDate?: Date;

  /** Reason for rejection (admin-provided text) */
  rejectionReason?: string;

  // ========================================
  // ACCESS CONTROL FIELDS
  // ========================================

  /** Privilege level (Main, Admin, Owner) */
  privilege?: string;

  /** Access modifier (Public, Private, Protected) */
  accessModifier?: string;
}

/**
 * Create Insurance Report Data
 *
 * Minimal fields required to create a new report.
 * Used by CRUD service and orchestrators.
 */
export interface CreateInsuranceReportData {
  /** Organization GUID (required) */
  organizationGuid: string;

  /** Period start date (required) */
  periodStart: Date;

  /** Period end date (required) */
  periodEnd: Date;

  /** Total insurance records (required) */
  totalRecords: number;

  /** Total value (required) */
  totalValue: number;

  /** Initial status (defaults to PENDING_APPROVAL) */
  reportStatus?: InsuranceReportStatus;

  /** Approval token (hashed UUID) */
  approvedToken?: string;

  /** Rejection token (hashed UUID) */
  rejectionToken?: string;

  /** Privilege level (optional) */
  privilege?: string;

  /** Access modifier (optional) */
  accessModifier?: string;
}

/**
 * Update Insurance Report Data
 *
 * Fields that can be updated after creation.
 * System fields (created_on, modified_on) are immutable.
 */
export interface UpdateInsuranceReportData {
  /** Update report status */
  reportStatus?: InsuranceReportStatus;

  /** Update approval token */
  approvedToken?: string;

  /** Set approver user ID */
  approvedBy?: string;

  /** Set approval timestamp */
  approvedDate?: Date;

  /** Update rejection token */
  rejectionToken?: string;

  /** Set rejector user ID */
  rejectBy?: string;

  /** Set rejection timestamp */
  rejectedDate?: Date;

  /** Set rejection reason */
  rejectionReason?: string;
}

/**
 * Insurance Report Query Filters
 *
 * Common filter criteria for lookup operations.
 */
export interface InsuranceReportQueryFilters {
  /** Filter by organization GUID */
  organizationGuid?: string;

  /** Filter by report status */
  reportStatus?: InsuranceReportStatus;

  /** Filter by report ID (autonumber) */
  reportId?: string;

  /** Filter by period start date */
  periodStart?: Date;

  /** Filter by period end date */
  periodEnd?: Date;

  /** Filter by created date range */
  createdFrom?: Date;
  createdTo?: Date;

  /** Pagination: page number (1-based) */
  page?: number;

  /** Pagination: items per page */
  pageSize?: number;
}
