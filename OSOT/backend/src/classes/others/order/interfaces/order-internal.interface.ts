/**
 * Order Internal Interface
 *
 * Internal representation of Order entity used throughout the application.
 * This interface represents the clean, TypeScript-native structure used in:
 * - Services (business logic)
 * - DTOs (data transfer)
 * - Mappers (transformation)
 *
 * All fields use TypeScript types and enums for type safety.
 * Optional fields (?) match Dataverse schema (Optional vs Required).
 *
 * Based on: Table_Order.csv schema (10 fields)
 */

import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';
import { Privilege } from '../../../../common/enums';

/**
 * Order entity internal representation
 */
export interface OrderInternal {
  // ========================================
  // IDENTIFIERS (2 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * System-generated, immutable
   * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  osot_table_orderid?: string;

  /**
   * Business ID (Autonumber)
   * Format: osot_ord-0000001
   * User-friendly identifier, auto-generated
   * Used for customer communication (emails, receipts, etc.)
   */
  osot_orderid?: string;

  // ========================================
  // RELATIONSHIPS/LOOKUPS (3 fields)
  // ========================================

  /**
   * Parent organization GUID
   * Required for multi-tenant isolation (immutable after creation)
   * Every order belongs to exactly one organization
   */
  organizationGuid: string;

  /**
   * Account (person) GUID - Order owner
   * Optional - required if affiliate is null
   * Represents individual OT/OTA making purchase
   * Immutable after creation
   */
  accountGuid?: string;

  /**
   * Account Affiliate (company) GUID - Order buyer
   * Optional - required if account is null
   * Represents organization/company making purchase
   * Immutable after creation
   */
  affiliateGuid?: string;

  // ========================================
  // STATUS FIELDS (2 fields)
  // ========================================

  /**
   * Order status (enum)
   * Workflow: DRAFT → SUBMITTED → PENDING_APPROVAL → APPROVED → PROCESSING → COMPLETED/CANCELLED/REFUNDED
   * Immutable = false (can transition based on business rules)
   * Default: DRAFT
   */
  osot_order_status?: OrderStatus;

  /**
   * Payment status (enum)
   * Workflow: UNPAID → PENDING → PAID → PARTIALLY_REFUNDED/FULLY_REFUNDED
   * Independent from order status
   * Default: UNPAID
   */
  osot_payment_status?: PaymentStatus;

  // ========================================
  // ACCESS CONTROL FIELDS (2 fields)
  // ========================================

  /**
   * Privilege level for order management
   * Optional, aligns with global privilege choices
   */
  osot_privilege?: Privilege;

  /**
   * Access modifier controlling order visibility
   * Optional, numeric OptionSet value (Public/Protected/Private)
   */
  osot_access_modifiers?: number;

  // ========================================
  // FINANCIAL FIELDS (3 fields)
  // ========================================

  /**
   * Order subtotal (Currency - CAD)
   * Sum of all OrderProduct itemSubtotal values
   * Before coupon discount and taxes
   * Required field, must be >= 0
   * Precision: 2 decimal places
   */
  osot_subtotal: number;

  /**
   * Coupon code (Text)
   * Reference code for discount coupon (e.g., "DISCOUNT15", "SUMMER_2025")
   * Optional - if null, no coupon applied
   * Max length: 100 characters
   * Will be validated against Coupon entity in business rules
   */
  osot_coupon?: string;

  /**
   * Order total (Currency - CAD)
   * Final amount: sum(OrderProduct.itemTotal) - coupon_discount
   * Includes all taxes from line items, excludes shipping (already in products)
   * Required field, must be >= 0
   * Precision: 2 decimal places
   */
  osot_total: number;

  // ========================================
  // SYSTEM FIELDS (Auto-managed by Dataverse)
  // ========================================

  /**
   * Created on (DateTime)
   * System-managed - set automatically by Dataverse
   * Cannot be modified
   */
  createdon?: Date;

  /**
   * Modified on (DateTime)
   * System-managed - updated automatically by Dataverse
   * Cannot be modified directly
   */
  modifiedon?: Date;

  /**
   * Created by (Owner)
   * System-managed - user who created the record
   * Format: GUID of user
   */
  createdby?: string;

  /**
   * Modified by (Owner)
   * System-managed - user who last modified the record
   * Format: GUID of user
   */
  modifiedby?: string;

  /**
   * Owner (Owner)
   * User or team that owns the record
   * Used for row-level security
   * Format: GUID of user/team
   */
  ownerid?: string;
}
