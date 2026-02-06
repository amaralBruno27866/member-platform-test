/**
 * Insurance Report Repository Interface
 *
 * Contract for Insurance Report data access layer.
 * Defines CRUD operations and query methods for repositories.
 *
 * IMPLEMENTATION:
 * - DataverseInsuranceReportRepository: Microsoft Dataverse implementation
 * - (Future) PostgresInsuranceReportRepository: Direct database implementation
 *
 * USAGE:
 * ```typescript
 * @Inject('INSURANCE_REPORT_REPOSITORY')
 * private readonly reportRepository: InsuranceReportRepository;
 *
 * const report = await this.reportRepository.create(createData);
 * const found = await this.reportRepository.findById(reportId, organizationId);
 * ```
 *
 * PRINCIPLES:
 * - Repository returns InsuranceReportInternal (not Dataverse format)
 * - All operations require organizationId for multi-tenancy
 * - Errors throw AppError with specific error codes
 * - Operation IDs required for audit trail
 *
 * @file insurance-report-repository.interface.ts
 * @module InsuranceReportModule
 * @layer Interfaces
 */

import {
  InsuranceReportInternal,
  CreateInsuranceReportData,
  UpdateInsuranceReportData,
  InsuranceReportQueryFilters,
} from './insurance-report-internal.interface';

/**
 * Insurance Report Repository Interface
 *
 * Defines contract for all Insurance Report repository implementations.
 */
export interface InsuranceReportRepository {
  /**
   * Create a new insurance report
   *
   * @param data - Report creation data
   * @param operationId - Operation tracking ID for audit
   * @returns Created report with generated GUID and autonumber
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on failure
   */
  create(
    data: CreateInsuranceReportData,
    operationId: string,
  ): Promise<InsuranceReportInternal>;

  /**
   * Find insurance report by primary key (GUID)
   *
   * @param reportGuid - Primary key (osot_table_insurance_reportid)
   * @param organizationId - Organization GUID for multi-tenancy
   * @param operationId - Operation tracking ID
   * @returns Report if found, null otherwise
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on API failure
   */
  findById(
    reportGuid: string,
    organizationId: string,
    operationId: string,
  ): Promise<InsuranceReportInternal | null>;

  /**
   * Find insurance report by report ID (autonumber)
   *
   * @param reportId - Report autonumber (e.g., 'osot-rep-0000123')
   * @param organizationId - Organization GUID for multi-tenancy
   * @param operationId - Operation tracking ID
   * @returns Report if found, null otherwise
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on API failure
   */
  findByReportId(
    reportId: string,
    organizationId: string,
    operationId: string,
  ): Promise<InsuranceReportInternal | null>;

  /**
   * Find insurance reports by organization
   *
   * @param organizationId - Organization GUID
   * @param operationId - Operation tracking ID
   * @param limit - Maximum results to return (default: 50)
   * @returns Array of reports (may be empty)
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on API failure
   */
  findByOrganization(
    organizationId: string,
    operationId: string,
    limit?: number,
  ): Promise<InsuranceReportInternal[]>;

  /**
   * Find insurance reports with filters
   *
   * Supports filtering by:
   * - Organization, status, period dates
   * - Created date range
   * - Pagination (page, pageSize)
   *
   * @param filters - Query filter criteria
   * @param operationId - Operation tracking ID
   * @returns Array of reports matching filters
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on API failure
   */
  findWithFilters(
    filters: InsuranceReportQueryFilters,
    operationId: string,
  ): Promise<InsuranceReportInternal[]>;

  /**
   * Find pending approval reports for organization
   *
   * Returns reports with status PENDING_APPROVAL.
   * Used by admin approval workflows.
   *
   * @param organizationId - Organization GUID
   * @param operationId - Operation tracking ID
   * @param limit - Maximum results (default: 50)
   * @returns Array of pending reports
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on API failure
   */
  findPendingByOrganization(
    organizationId: string,
    operationId: string,
    limit?: number,
  ): Promise<InsuranceReportInternal[]>;

  /**
   * Update insurance report
   *
   * Only updatable fields can be modified:
   * - Report status, approval/rejection metadata
   *
   * @param reportGuid - Primary key (osot_table_insurance_reportid)
   * @param data - Fields to update
   * @param organizationId - Organization GUID for validation
   * @param operationId - Operation tracking ID
   * @returns Updated report
   * @throws AppError with ErrorCodes.NOT_FOUND if report doesn't exist
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on API failure
   */
  update(
    reportGuid: string,
    data: UpdateInsuranceReportData,
    organizationId: string,
    operationId: string,
  ): Promise<InsuranceReportInternal>;

  /**
   * Delete insurance report (hard delete)
   *
   * Permanently removes report from Dataverse.
   * Should only be used for data corrections.
   *
   * @param reportGuid - Primary key (osot_table_insurance_reportid)
   * @param organizationId - Organization GUID for validation
   * @param operationId - Operation tracking ID
   * @returns void
   * @throws AppError with ErrorCodes.NOT_FOUND if report doesn't exist
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on API failure
   */
  delete(
    reportGuid: string,
    organizationId: string,
    operationId: string,
  ): Promise<void>;

  /**
   * Check if report exists for period
   *
   * Validates if a report already exists for the given
   * organization and period (prevents duplicates).
   *
   * @param organizationId - Organization GUID
   * @param periodStart - Period start date
   * @param periodEnd - Period end date
   * @param operationId - Operation tracking ID
   * @returns true if report exists, false otherwise
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on API failure
   */
  existsForPeriod(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    operationId: string,
  ): Promise<boolean>;

  /**
   * Count reports by status
   *
   * Returns count of reports by status for dashboard/metrics.
   *
   * @param organizationId - Organization GUID
   * @param operationId - Operation tracking ID
   * @returns Object with counts per status
   * @throws AppError with ErrorCodes.DATAVERSE_SERVICE_ERROR on API failure
   */
  countByStatus(
    organizationId: string,
    operationId: string,
  ): Promise<Record<string, number>>;
}
