/**
 * Insurance Report OData Constants
 *
 * Predefined OData query fragments for Insurance Report operations.
 * Optimizes Dataverse API calls and ensures consistent data retrieval.
 *
 * QUERY PATTERNS:
 * - SELECT: Field lists for different contexts (basic, full, minimal)
 * - FILTER: Common search patterns (by status, period, organization)
 * - EXPAND: Organization lookup expansion
 * - ORDERBY: Sort orders (date descending, status)
 *
 * USAGE:
 * ```typescript
 * const endpoint = `${INSURANCE_REPORT_ENTITY}?${INSURANCE_REPORT_ODATA.SELECT_FULL}&${INSURANCE_REPORT_ODATA.FILTER_PENDING}`;
 * const response = await dataverseService.request('GET', endpoint, null, credentials);
 * ```
 *
 * PERFORMANCE:
 * - Always use SELECT to limit returned fields
 * - Use EXPAND sparingly (adds JOIN overhead)
 * - Combine FILTER with ORDERBY and TOP for pagination
 *
 * @file insurance-report-odata.constant.ts
 * @module InsuranceReportModule
 * @layer Constants
 */

import {
  INSURANCE_REPORT_FIELDS,
  INSURANCE_REPORT_ENTITY,
} from './insurance-report-fields.constant';

/**
 * Insurance Report OData Queries
 *
 * Reusable OData query fragments for common operations.
 */
export const INSURANCE_REPORT_ODATA = {
  // ========================================
  // SELECT CLAUSES
  // ========================================

  /**
   * Basic fields for list views
   * Returns: ID, Report ID, Period, Status, Totals
   */
  SELECT_BASIC: `$select=${[
    INSURANCE_REPORT_FIELDS.TABLE_INSURANCE_REPORT_ID,
    INSURANCE_REPORT_FIELDS.REPORT_ID,
    INSURANCE_REPORT_FIELDS.ORGANIZATION,
    INSURANCE_REPORT_FIELDS.PERIOD_START,
    INSURANCE_REPORT_FIELDS.PERIOD_END,
    INSURANCE_REPORT_FIELDS.TOTAL_RECORDS,
    INSURANCE_REPORT_FIELDS.TOTAL_VALUE,
    INSURANCE_REPORT_FIELDS.REPORT_STATUS,
    INSURANCE_REPORT_FIELDS.CREATED_ON,
  ].join(',')}`,

  /**
   * Full fields for detailed views
   * Returns: All fields including approval/rejection metadata
   */
  SELECT_FULL: `$select=${[
    INSURANCE_REPORT_FIELDS.TABLE_INSURANCE_REPORT_ID,
    INSURANCE_REPORT_FIELDS.REPORT_ID,
    INSURANCE_REPORT_FIELDS.ORGANIZATION,
    INSURANCE_REPORT_FIELDS.PERIOD_START,
    INSURANCE_REPORT_FIELDS.PERIOD_END,
    INSURANCE_REPORT_FIELDS.TOTAL_RECORDS,
    INSURANCE_REPORT_FIELDS.TOTAL_VALUE,
    INSURANCE_REPORT_FIELDS.REPORT_STATUS,
    INSURANCE_REPORT_FIELDS.APPROVED_TOKEN,
    INSURANCE_REPORT_FIELDS.APPROVED_BY,
    INSURANCE_REPORT_FIELDS.APPROVED_DATE,
    INSURANCE_REPORT_FIELDS.REJECTION_TOKEN,
    INSURANCE_REPORT_FIELDS.REJECT_BY,
    INSURANCE_REPORT_FIELDS.REJECTED_DATE,
    INSURANCE_REPORT_FIELDS.REJECTION_REASON,
    INSURANCE_REPORT_FIELDS.PRIVILEGE,
    INSURANCE_REPORT_FIELDS.ACCESS_MODIFIER,
    INSURANCE_REPORT_FIELDS.CREATED_ON,
    INSURANCE_REPORT_FIELDS.MODIFIED_ON,
  ].join(',')}`,

  /**
   * Minimal fields for existence checks
   * Returns: Primary key only
   */
  SELECT_ID_ONLY: `$select=${INSURANCE_REPORT_FIELDS.TABLE_INSURANCE_REPORT_ID}`,

  /**
   * Approval workflow fields
   * Returns: Fields needed for token validation
   */
  SELECT_APPROVAL: `$select=${[
    INSURANCE_REPORT_FIELDS.TABLE_INSURANCE_REPORT_ID,
    INSURANCE_REPORT_FIELDS.REPORT_ID,
    INSURANCE_REPORT_FIELDS.REPORT_STATUS,
    INSURANCE_REPORT_FIELDS.APPROVED_TOKEN,
    INSURANCE_REPORT_FIELDS.REJECTION_TOKEN,
    INSURANCE_REPORT_FIELDS.ORGANIZATION,
  ].join(',')}`,

  // ========================================
  // FILTER CLAUSES
  // ========================================

  /**
   * Filter by report status (PENDING_APPROVAL)
   */
  FILTER_PENDING: `$filter=${INSURANCE_REPORT_FIELDS.REPORT_STATUS} eq 'PENDING_APPROVAL'`,

  /**
   * Filter by report status (APPROVED)
   */
  FILTER_APPROVED: `$filter=${INSURANCE_REPORT_FIELDS.REPORT_STATUS} eq 'APPROVED'`,

  /**
   * Filter by report status (REJECTED)
   */
  FILTER_REJECTED: `$filter=${INSURANCE_REPORT_FIELDS.REPORT_STATUS} eq 'REJECTED'`,

  /**
   * Filter by organization GUID
   * Usage: `${INSURANCE_REPORT_ODATA.FILTER_BY_ORGANIZATION('org-guid-123')}`
   */
  FILTER_BY_ORGANIZATION: (organizationGuid: string) =>
    `$filter=${INSURANCE_REPORT_FIELDS.ORGANIZATION} eq '${organizationGuid}'`,

  /**
   * Filter by period start date
   * Usage: `${INSURANCE_REPORT_ODATA.FILTER_BY_PERIOD_START('2026-01-30')}`
   */
  FILTER_BY_PERIOD_START: (startDate: string) =>
    `$filter=${INSURANCE_REPORT_FIELDS.PERIOD_START} eq ${startDate}`,

  /**
   * Filter by report ID (autonumber)
   * Usage: `${INSURANCE_REPORT_ODATA.FILTER_BY_REPORT_ID('osot-rep-0000123')}`
   */
  FILTER_BY_REPORT_ID: (reportId: string) =>
    `$filter=${INSURANCE_REPORT_FIELDS.REPORT_ID} eq '${reportId}'`,

  /**
   * Filter by created date range
   * Usage: `${INSURANCE_REPORT_ODATA.FILTER_BY_DATE_RANGE('2026-01-01', '2026-01-31')}`
   */
  FILTER_BY_DATE_RANGE: (startDate: string, endDate: string) =>
    `$filter=${INSURANCE_REPORT_FIELDS.CREATED_ON} ge ${startDate} and ${INSURANCE_REPORT_FIELDS.CREATED_ON} le ${endDate}`,

  // ========================================
  // EXPAND CLAUSES
  // ========================================

  /**
   * Expand organization lookup
   * Returns: osot_name, osot_slug
   */
  EXPAND_ORGANIZATION: `$expand=osot_Table_Organization($select=osot_table_organizationid,osot_name,osot_slug)`,

  // ========================================
  // ORDER BY CLAUSES
  // ========================================

  /**
   * Sort by created date descending (newest first)
   */
  ORDERBY_CREATED_DESC: `$orderby=${INSURANCE_REPORT_FIELDS.CREATED_ON} desc`,

  /**
   * Sort by period start descending
   */
  ORDERBY_PERIOD_DESC: `$orderby=${INSURANCE_REPORT_FIELDS.PERIOD_START} desc`,

  /**
   * Sort by report status and date
   */
  ORDERBY_STATUS_DATE: `$orderby=${INSURANCE_REPORT_FIELDS.REPORT_STATUS},${INSURANCE_REPORT_FIELDS.CREATED_ON} desc`,

  // ========================================
  // PAGINATION
  // ========================================

  /**
   * Limit results (for pagination)
   * Usage: `${INSURANCE_REPORT_ODATA.TOP(50)}`
   */
  TOP: (count: number) => `$top=${count}`,

  /**
   * Skip results (for pagination)
   * Usage: `${INSURANCE_REPORT_ODATA.SKIP(100)}`
   */
  SKIP: (count: number) => `$skip=${count}`,

  // ========================================
  // COMMON QUERIES (Combined)
  // ========================================

  /**
   * Get all pending reports for an organization
   */
  GET_PENDING_BY_ORG: (organizationGuid: string, limit = 50) =>
    `${INSURANCE_REPORT_ENTITY}?${INSURANCE_REPORT_ODATA.SELECT_BASIC}&${INSURANCE_REPORT_ODATA.FILTER_BY_ORGANIZATION(organizationGuid)}&${INSURANCE_REPORT_ODATA.FILTER_PENDING}&${INSURANCE_REPORT_ODATA.ORDERBY_CREATED_DESC}&${INSURANCE_REPORT_ODATA.TOP(limit)}`,

  /**
   * Get report by ID with full details
   */
  GET_BY_REPORT_ID: (reportId: string) =>
    `${INSURANCE_REPORT_ENTITY}?${INSURANCE_REPORT_ODATA.SELECT_FULL}&${INSURANCE_REPORT_ODATA.FILTER_BY_REPORT_ID(reportId)}`,

  /**
   * Get recent reports (last 30 days)
   */
  GET_RECENT: (limit = 100) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return `${INSURANCE_REPORT_ENTITY}?${INSURANCE_REPORT_ODATA.SELECT_BASIC}&${INSURANCE_REPORT_ODATA.FILTER_BY_DATE_RANGE(thirtyDaysAgo, today)}&${INSURANCE_REPORT_ODATA.ORDERBY_CREATED_DESC}&${INSURANCE_REPORT_ODATA.TOP(limit)}`;
  },
} as const;
