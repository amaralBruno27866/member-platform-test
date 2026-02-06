/**
 * Insurance Report Status Enum
 *
 * Represents the lifecycle status of an insurance report
 * used for 24-hour sales reporting and provider notifications.
 *
 * Lifecycle:
 * PENDING_APPROVAL → APPROVED → (sent to provider)
 *                 ↘ REJECTED
 *
 * @file insurance-report-status.enum.ts
 * @module InsuranceModule
 * @layer Enums
 */

export enum InsuranceReportStatus {
  /**
   * Report generated, awaiting admin approval
   * Displayed to admin in approval email
   */
  PENDING_APPROVAL = 'PENDING_APPROVAL',

  /**
   * Report approved by admin
   * Can now be sent to insurance provider
   */
  APPROVED = 'APPROVED',

  /**
   * Report rejected by admin
   * Will not be sent to provider
   * Reason provided by admin
   */
  REJECTED = 'REJECTED',

  /**
   * Report sent to insurance provider
   * JSON payload delivered successfully
   */
  SENT_TO_PROVIDER = 'SENT_TO_PROVIDER',

  /**
   * Provider acknowledged receipt
   * Confirmation received and logged
   */
  ACKNOWLEDGED = 'ACKNOWLEDGED',
}
