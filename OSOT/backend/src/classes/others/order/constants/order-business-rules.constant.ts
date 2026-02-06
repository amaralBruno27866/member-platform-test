/**
 * Order Business Rules Constants
 *
 * Business logic rules and constraints for Order operations:
 * - Status transitions
 * - Access control rules
 * - Payment workflows
 * - Order lifecycle
 *
 * These rules define the business behavior of the Order entity
 */

import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

/**
 * Valid order status transitions
 * Defines which status changes are allowed
 *
 * BUSINESS RULES:
 * - DRAFT → SUBMITTED: Owner prepares order
 * - SUBMITTED → PENDING_APPROVAL: System awaits processing
 * - PENDING_APPROVAL → APPROVED: Admin approves (if needed)
 * - APPROVED → PROCESSING: Payment initiated
 * - PROCESSING → COMPLETED: Order fulfilled
 * - PROCESSING → CANCELLED: Order cancelled during payment
 * - COMPLETED → REFUNDED: Refund requested after completion
 * - Any → CANCELLED: Can cancel from most states (except COMPLETED)
 */
export const VALID_ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  OrderStatus[]
> = {
  /**
   * From DRAFT status:
   * Owner created order but hasn't submitted yet
   */
  [OrderStatus.DRAFT]: [
    OrderStatus.SUBMITTED, // Submit for processing
    OrderStatus.CANCELLED, // Abandon draft
  ],

  /**
   * From SUBMITTED status:
   * Order submitted, waiting for system processing
   */
  [OrderStatus.SUBMITTED]: [
    OrderStatus.PENDING_APPROVAL, // Move to approval queue
    OrderStatus.APPROVED, // Auto-approve if no manual review needed
    OrderStatus.CANCELLED, // Cancel submitted order
  ],

  /**
   * From PENDING_APPROVAL status:
   * Order awaiting admin approval (for organizational buyers, high-value, etc.)
   */
  [OrderStatus.PENDING_APPROVAL]: [
    OrderStatus.APPROVED, // Admin approves
    OrderStatus.CANCELLED, // Admin rejects/cancels
  ],

  /**
   * From APPROVED status:
   * Order approved, ready for payment processing
   */
  [OrderStatus.APPROVED]: [
    OrderStatus.PROCESSING, // Payment initiated
    OrderStatus.CANCELLED, // Cancel before payment
  ],

  /**
   * From PROCESSING status:
   * Payment/fulfillment in progress
   */
  [OrderStatus.PROCESSING]: [
    OrderStatus.COMPLETED, // Order complete
    OrderStatus.CANCELLED, // Cancel during processing
  ],

  /**
   * From COMPLETED status:
   * Order fully completed - limited transitions
   */
  [OrderStatus.COMPLETED]: [
    OrderStatus.REFUNDED, // Refund initiated
  ],

  /**
   * From CANCELLED status:
   * CANNOT transition (final state - can't "un-cancel")
   */
  [OrderStatus.CANCELLED]: [],

  /**
   * From REFUNDED status:
   * CANNOT transition (final state - refund is complete)
   */
  [OrderStatus.REFUNDED]: [],
};

/**
 * Valid payment status transitions
 * Independent from order status
 */
export const VALID_PAYMENT_STATUS_TRANSITIONS: Record<
  PaymentStatus,
  PaymentStatus[]
> = {
  /**
   * From UNPAID status:
   * Payment not yet attempted
   */
  [PaymentStatus.UNPAID]: [
    PaymentStatus.PENDING, // Payment initiated
  ],

  /**
   * From PENDING status:
   * Payment processing in progress
   */
  [PaymentStatus.PENDING]: [
    PaymentStatus.PAID, // Payment successful
  ],

  /**
   * From PAID status:
   * Payment successfully completed
   */
  [PaymentStatus.PAID]: [
    PaymentStatus.PARTIALLY_REFUNDED, // Partial refund issued
    PaymentStatus.FULLY_REFUNDED, // Full refund issued
  ],

  /**
   * From PARTIALLY_REFUNDED status:
   * Some refund has been issued
   */
  [PaymentStatus.PARTIALLY_REFUNDED]: [
    PaymentStatus.FULLY_REFUNDED, // Full refund issued
  ],

  /**
   * From FULLY_REFUNDED status:
   * CANNOT transition (final state - full refund complete)
   */
  [PaymentStatus.FULLY_REFUNDED]: [],
};

/**
 * Status transition error messages
 */
export const STATUS_TRANSITION_ERRORS = {
  INVALID_ORDER_STATUS_TRANSITION: 'Invalid order status transition',
  INVALID_PAYMENT_STATUS_TRANSITION: 'Invalid payment status transition',
  CANNOT_CANCEL_COMPLETED: 'Cannot cancel a completed order',
  CANNOT_PROCESS_UNPAID: 'Cannot process order without payment',
  CANNOT_REFUND_UNPAID: 'Cannot refund an unpaid order',
} as const;

/**
 * Order approval rules
 * Defines when an order requires admin approval
 */
export const ORDER_APPROVAL_RULES = {
  /**
   * Require approval for affiliate/organization orders
   * Personal account orders (account lookup set) do NOT require approval
   */
  REQUIRE_APPROVAL_FOR_AFFILIATE: true,

  /**
   * Require approval for high-value orders
   */
  REQUIRE_APPROVAL_FOR_HIGH_VALUE: true,

  /**
   * Threshold for high-value orders
   * Orders above this amount require approval
   */
  HIGH_VALUE_THRESHOLD: 5000.0,

  /**
   * Require approval if payment method is delayed (e.g., invoice)
   */
  REQUIRE_APPROVAL_FOR_DEFERRED_PAYMENT: true,
} as const;

/**
 * Payment processing rules
 */
export const PAYMENT_PROCESSING_RULES = {
  /**
   * Orders must have status APPROVED before payment processing
   */
  REQUIRES_APPROVAL_BEFORE_PAYMENT: true,

  /**
   * Payment must succeed before order status moves to COMPLETED
   */
  PAYMENT_SUCCESS_REQUIRED_FOR_COMPLETION: true,

  /**
   * Maximum payment retry attempts
   * If payment fails, max attempts before order is marked failed
   */
  MAX_PAYMENT_RETRIES: 3,

  /**
   * Payment timeout in minutes
   * If payment processing takes longer, mark as failed
   */
  PAYMENT_TIMEOUT_MINUTES: 30,

  /**
   * Automatic payment reconciliation
   * Periodically check if pending payments have been processed externally
   */
  AUTO_RECONCILIATION_ENABLED: true,
} as const;

/**
 * Coupon/Discount rules
 */
export const COUPON_RULES = {
  /**
   * Coupon discount is applied to subtotal
   * Calculation: subtotal - coupon_discount + taxes = total
   */
  DISCOUNT_APPLIED_TO_SUBTOTAL: true,

  /**
   * Coupon must be active/valid at time of purchase
   */
  VALIDATE_COUPON_ACTIVE: true,

  /**
   * Coupon must not be expired
   */
  VALIDATE_COUPON_EXPIRATION: true,

  /**
   * Coupon can have usage limits
   */
  VALIDATE_COUPON_USAGE_LIMIT: true,

  /**
   * Coupon discount cannot exceed subtotal
   * Cannot result in negative total
   */
  DISCOUNT_CANNOT_EXCEED_SUBTOTAL: true,

  /**
   * Each order can have maximum one coupon
   */
  MAX_COUPONS_PER_ORDER: 1,
} as const;

/**
 * Order lifecycle timeouts
 * For automatic transitions or cleanup
 */
export const ORDER_LIFECYCLE_TIMEOUTS = {
  /**
   * DRAFT order auto-delete after this duration
   * Abandoned carts are cleaned up after 7 days
   */
  DRAFT_AUTO_DELETE_HOURS: 168, // 7 days

  /**
   * PENDING_APPROVAL auto-cancel after this duration
   * If admin doesn't approve in time, order is cancelled
   */
  PENDING_APPROVAL_AUTO_CANCEL_HOURS: 72, // 3 days

  /**
   * PROCESSING auto-cancel after this duration
   * If payment doesn't complete in time, order is cancelled
   */
  PROCESSING_AUTO_CANCEL_HOURS: 2, // 2 hours

  /**
   * Refund processing timeout
   * Maximum time to process a refund
   */
  REFUND_PROCESSING_HOURS: 24,
} as const;

/**
 * Buyer eligibility rules
 */
export const BUYER_ELIGIBILITY_RULES = {
  /**
   * Account buyer must be active member
   */
  ACCOUNT_MUST_BE_ACTIVE: true,

  /**
   * Account buyer must not be suspended
   */
  ACCOUNT_MUST_NOT_BE_SUSPENDED: true,

  /**
   * Affiliate must be active
   */
  AFFILIATE_MUST_BE_ACTIVE: true,

  /**
   * Affiliate must belong to same organization as order
   */
  AFFILIATE_ORGANIZATION_MUST_MATCH: true,

  /**
   * Account must belong to same organization as order
   */
  ACCOUNT_ORGANIZATION_MUST_MATCH: true,
} as const;

/**
 * Audit and compliance rules
 */
export const AUDIT_AND_COMPLIANCE_RULES = {
  /**
   * Log all order status transitions for audit trail
   */
  LOG_STATUS_TRANSITIONS: true,

  /**
   * Log all payment status changes
   */
  LOG_PAYMENT_STATUS_CHANGES: true,

  /**
   * Preserve order data even after cancellation
   */
  PRESERVE_CANCELLED_ORDERS: true,

  /**
   * Preserve refunded orders
   */
  PRESERVE_REFUNDED_ORDERS: true,

  /**
   * Minimum data retention period (years)
   */
  DATA_RETENTION_YEARS: 7,
} as const;

/**
 * Error messages for business rule violations
 */
export const BUSINESS_RULE_VIOLATION_ERRORS = {
  INVALID_STATUS_TRANSITION:
    'Cannot transition from {currentStatus} to {newStatus}',
  APPROVAL_REQUIRED: 'This order requires approval before payment processing',
  PAYMENT_FAILED:
    'Payment processing failed. Please try again or contact support.',
  PAYMENT_TIMEOUT: 'Payment processing timed out. Order was cancelled.',
  BUYER_NOT_ELIGIBLE: 'Buyer is not eligible to make purchases at this time',
  BUYER_SUSPENDED: 'Buyer account is suspended',
  AFFILIATE_INACTIVE: 'Affiliate is not active',
  COUPON_NOT_VALID: 'Coupon is not valid or has expired',
  COUPON_USAGE_EXCEEDED: 'Coupon usage limit has been exceeded',
  COUPON_DISCOUNT_EXCEEDS_SUBTOTAL:
    'Coupon discount cannot exceed order subtotal',
} as const;
