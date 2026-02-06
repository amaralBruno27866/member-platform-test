/**
 * Enum: OrderStatus
 * Objective: Define the available order status options for order lifecycle management.
 * Functionality: Provides standardized order status choices synchronized with Dataverse global choices.
 * Expected Result: Consistent order state tracking from creation through completion/cancellation.
 *
 * Workflow:
 * - DRAFT: Order created but not yet submitted for processing
 * - SUBMITTED: Order submitted by owner, awaiting backend processing
 * - PENDING_APPROVAL: Order pending approval (e.g., from admin for organizational buyers)
 * - APPROVED: Order approved and ready for payment processing
 * - PROCESSING: Payment/fulfillment in progress
 * - COMPLETED: Order fully completed
 * - CANCELLED: Order cancelled by owner or admin
 * - REFUNDED: Order refunded (associated with payment refund)
 *
 * Note: This enum corresponds to the Choices_Order_Status global choice in Dataverse.
 * Values are synchronized with the Choice field osot_Order_Status in osot_table_order.
 * This is a single choice field - orders can only have one status at a time.
 */
export enum OrderStatus {
  DRAFT = 1,
  SUBMITTED = 2,
  PENDING_APPROVAL = 3,
  APPROVED = 4,
  PROCESSING = 5,
  COMPLETED = 6,
  CANCELLED = 7,
  REFUNDED = 8,
}

/**
 * Helper function to get order status display name
 * Used for UI rendering, emails, and API responses
 */
export function getOrderStatusDisplayName(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.DRAFT:
      return 'Draft';
    case OrderStatus.SUBMITTED:
      return 'Submitted';
    case OrderStatus.PENDING_APPROVAL:
      return 'Pending Approval';
    case OrderStatus.APPROVED:
      return 'Approved';
    case OrderStatus.PROCESSING:
      return 'Processing';
    case OrderStatus.COMPLETED:
      return 'Completed';
    case OrderStatus.CANCELLED:
      return 'Cancelled';
    case OrderStatus.REFUNDED:
      return 'Refunded';
    default:
      return 'Unknown';
  }
}
