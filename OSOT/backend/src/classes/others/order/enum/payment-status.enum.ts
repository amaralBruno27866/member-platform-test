/**
 * Enum: PaymentStatus
 * Objective: Define the available payment status options for transaction tracking and reconciliation.
 * Functionality: Provides standardized payment state choices synchronized with Dataverse global choices.
 * Expected Result: Accurate payment tracking from creation through completion/refund.
 *
 * Workflow:
 * - UNPAID: Order created, payment not yet initiated
 * - PENDING: Payment processing initiated, awaiting confirmation from payment gateway
 * - PAID: Payment successfully completed and confirmed
 * - PARTIALLY_REFUNDED: Partial refund processed (e.g., discount applied after purchase)
 * - FULLY_REFUNDED: Full order amount refunded
 *
 * Note: This enum corresponds to the Choices_Payment_Status global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Payment_Status in osot_table_order.
 * This is a single choice field - orders can only have one payment status at a time.
 * Payment status is independent from order status (e.g., order can be COMPLETED with PAID status).
 */
export enum PaymentStatus {
  UNPAID = 1,
  PENDING = 2,
  PAID = 3,
  PARTIALLY_REFUNDED = 4,
  FULLY_REFUNDED = 5,
}

/**
 * Helper function to get payment status display name
 * Used for UI rendering, emails, and API responses
 */
export function getPaymentStatusDisplayName(status: PaymentStatus): string {
  switch (status) {
    case PaymentStatus.UNPAID:
      return 'Unpaid';
    case PaymentStatus.PENDING:
      return 'Pending';
    case PaymentStatus.PAID:
      return 'Paid';
    case PaymentStatus.PARTIALLY_REFUNDED:
      return 'Partially Refunded';
    case PaymentStatus.FULLY_REFUNDED:
      return 'Fully Refunded';
    default:
      return 'Unknown';
  }
}
