/**
 * Enum: InsuranceStatus
 * Objective: Define the available insurance certificate status options for insurance lifecycle management.
 * Functionality: Provides standardized insurance status choices synchronized with Dataverse global choices.
 * Expected Result: Consistent insurance certificate state tracking from creation through expiration/cancellation.
 *
 * Workflow:
 * - DRAFT: Insurance certificate created but not yet submitted for processing
 * - PENDING: Insurance submitted, awaiting activation or approval
 * - ACTIVE: Insurance certificate is currently active and provides coverage
 * - EXPIRED: Insurance certificate has passed its expiry date and no longer provides coverage
 * - CANCELLED: Insurance certificate has been explicitly cancelled and cannot be reactivated
 *
 * Note: This enum corresponds to the Choices_Insurance_Status global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Insurance_Status in osot_table_insurance.
 * This is a single choice field - insurance can only have one status at a time.
 */
export enum InsuranceStatus {
  DRAFT = 1,
  PENDING = 2,
  ACTIVE = 3,
  EXPIRED = 4,
  CANCELLED = 5,
}

/**
 * Helper function to get insurance status display name
 * Used for UI rendering, emails, and API responses
 */
export function getInsuranceStatusDisplayName(status: InsuranceStatus): string {
  switch (status) {
    case InsuranceStatus.DRAFT:
      return 'Draft';
    case InsuranceStatus.PENDING:
      return 'Pending';
    case InsuranceStatus.ACTIVE:
      return 'Active';
    case InsuranceStatus.EXPIRED:
      return 'Expired';
    case InsuranceStatus.CANCELLED:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
}
