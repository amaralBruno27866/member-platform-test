/**
 * Insurance Report Business Rules Constants
 *
 * Validation rules, constraints, and business logic constants
 * for the Insurance Report entity.
 *
 * CATEGORIES:
 * - Token Validation: Expiry, format, hashing
 * - Period Validation: Date ranges, 24-hour window
 * - Value Constraints: Min/max totals
 * - Status Transitions: Valid state changes
 * - Error Messages: User-facing validation messages
 *
 * USAGE:
 * ```typescript
 * if (Date.now() - tokenCreated > INSURANCE_REPORT_RULES.TOKEN_EXPIRY_MS) {
 *   throw new Error(INSURANCE_REPORT_MESSAGES.TOKEN_EXPIRED);
 * }
 * ```
 *
 * @file insurance-report-business-rules.constant.ts
 * @module InsuranceReportModule
 * @layer Constants
 */

import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';

/**
 * Insurance Report Business Rules
 *
 * Numeric and boolean constraints for validation.
 */
export const INSURANCE_REPORT_RULES = {
  // ========================================
  // TOKEN VALIDATION
  // ========================================

  /** Token expiry duration in milliseconds (24 hours) */
  TOKEN_EXPIRY_MS: 24 * 60 * 60 * 1000,

  /** Token expiry in hours (for display) */
  TOKEN_EXPIRY_HOURS: 24,

  /** Token format regex (UUID v4) */
  TOKEN_FORMAT_REGEX:
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  /** Hashed token length (SHA256 hex = 64 chars) */
  HASHED_TOKEN_LENGTH: 64,

  // ========================================
  // PERIOD VALIDATION
  // ========================================

  /** Report period duration in hours (24 hours) */
  REPORT_PERIOD_HOURS: 24,

  /** Report period duration in milliseconds */
  REPORT_PERIOD_MS: 24 * 60 * 60 * 1000,

  /** Maximum days back to generate reports (30 days) */
  MAX_HISTORICAL_DAYS: 30,

  // ========================================
  // VALUE CONSTRAINTS
  // ========================================

  /** Minimum total records in report (at least 1 insurance) */
  MIN_TOTAL_RECORDS: 1,

  /** Maximum total records in report (safety limit) */
  MAX_TOTAL_RECORDS: 10000,

  /** Minimum total value (cannot be negative) */
  MIN_TOTAL_VALUE: 0,

  /** Maximum total value (safety limit: $1M) */
  MAX_TOTAL_VALUE: 1000000,

  // ========================================
  // STATUS TRANSITIONS
  // ========================================

  /**
   * Valid status transitions
   * Key: Current status, Value: Array of allowed next statuses
   */
  VALID_STATUS_TRANSITIONS: {
    [InsuranceReportStatus.PENDING_APPROVAL]: [
      InsuranceReportStatus.APPROVED,
      InsuranceReportStatus.REJECTED,
    ],
    [InsuranceReportStatus.APPROVED]: [InsuranceReportStatus.SENT_TO_PROVIDER],
    [InsuranceReportStatus.SENT_TO_PROVIDER]: [
      InsuranceReportStatus.ACKNOWLEDGED,
    ],
    [InsuranceReportStatus.REJECTED]: [], // Terminal state
    [InsuranceReportStatus.ACKNOWLEDGED]: [], // Terminal state
  } as Record<InsuranceReportStatus, InsuranceReportStatus[]>,

  // ========================================
  // STRING CONSTRAINTS
  // ========================================

  /** Maximum length for rejection reason */
  MAX_REJECTION_REASON_LENGTH: 4000,

  /** Maximum length for report ID (autonumber) */
  MAX_REPORT_ID_LENGTH: 850,

  /** Maximum length for approved_by / reject_by fields */
  MAX_USER_ID_LENGTH: 850,

  // ========================================
  // SCHEDULING
  // ========================================

  /** Report generation time (6 AM Toronto timezone) */
  REPORT_GENERATION_HOUR: 6,

  /** Cron expression for daily report generation */
  REPORT_CRON_EXPRESSION: '0 6 * * *',

  /** Timezone for report generation */
  REPORT_TIMEZONE: 'America/Toronto',
} as const;

/**
 * Insurance Report Validation Messages
 *
 * User-facing error messages for business rule violations.
 */
export const INSURANCE_REPORT_MESSAGES = {
  // ========================================
  // TOKEN VALIDATION MESSAGES
  // ========================================

  TOKEN_EXPIRED:
    'Approval/rejection token has expired. Please request a new report.',
  TOKEN_INVALID_FORMAT: 'Invalid token format. Token must be a valid UUID.',
  TOKEN_MISMATCH:
    'Token does not match stored value. Possible tampering detected.',
  TOKEN_ALREADY_USED:
    'Token has already been used. Cannot reuse approval/rejection tokens.',

  // ========================================
  // PERIOD VALIDATION MESSAGES
  // ========================================

  PERIOD_INVALID_RANGE: 'Period end must be after period start.',
  PERIOD_NOT_24_HOURS: 'Report period must be exactly 24 hours.',
  PERIOD_TOO_OLD: `Cannot generate reports older than ${INSURANCE_REPORT_RULES.MAX_HISTORICAL_DAYS} days.`,
  PERIOD_IN_FUTURE: 'Cannot generate reports for future dates.',

  // ========================================
  // VALUE VALIDATION MESSAGES
  // ========================================

  TOTAL_RECORDS_TOO_LOW: `Report must contain at least ${INSURANCE_REPORT_RULES.MIN_TOTAL_RECORDS} insurance record.`,
  TOTAL_RECORDS_TOO_HIGH: `Report cannot exceed ${INSURANCE_REPORT_RULES.MAX_TOTAL_RECORDS} insurance records.`,
  TOTAL_VALUE_NEGATIVE: 'Total value cannot be negative.',
  TOTAL_VALUE_TOO_HIGH: `Total value exceeds maximum allowed (${INSURANCE_REPORT_RULES.MAX_TOTAL_VALUE}).`,

  // ========================================
  // STATUS TRANSITION MESSAGES
  // ========================================

  INVALID_STATUS_TRANSITION: (from: string, to: string) =>
    `Cannot transition report from ${from} to ${to}. Invalid status change.`,
  REPORT_ALREADY_APPROVED: 'Report has already been approved. Cannot modify.',
  REPORT_ALREADY_REJECTED: 'Report has already been rejected. Cannot modify.',

  // ========================================
  // GENERAL VALIDATION MESSAGES
  // ========================================

  REPORT_NOT_FOUND: 'Insurance report not found.',
  ORGANIZATION_NOT_FOUND: 'Organization not found for report generation.',
  NO_INSURANCES_IN_PERIOD:
    'No insurance records found in the specified period.',
  DUPLICATE_REPORT: 'A report for this period and organization already exists.',
  REJECTION_REASON_TOO_LONG: `Rejection reason cannot exceed ${INSURANCE_REPORT_RULES.MAX_REJECTION_REASON_LENGTH} characters.`,

  // ========================================
  // PERMISSION MESSAGES
  // ========================================

  INSUFFICIENT_PRIVILEGES:
    'You do not have permission to approve/reject reports.',
  ONLY_ADMIN_CAN_APPROVE:
    'Only Admin or Main users can approve insurance reports.',
  ONLY_ADMIN_CAN_REJECT:
    'Only Admin or Main users can reject insurance reports.',
} as const;

/**
 * Insurance Report Field Lengths
 *
 * Maximum character lengths for text fields.
 * Used by DTOs and validators.
 */
export const INSURANCE_REPORT_FIELD_LENGTHS = {
  REPORT_ID: 850,
  APPROVED_TOKEN: 1000,
  REJECTION_TOKEN: 1000,
  APPROVED_BY: 850,
  REJECT_BY: 850,
  REJECTION_REASON: 4000,
} as const;
