/**
 * Order Repository Interface
 *
 * Contract for Order data access layer.
 * Defines all methods for interacting with Order entity in Dataverse.
 *
 * Responsibilities:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Query operations (Find, Search, Filter)
 * - Existence checks
 * - Count operations
 *
 * All methods return OrderInternal objects (not Dataverse-specific).
 * Repository implementations handle the transformation from Dataverse to Internal.
 */

import { OrderInternal } from './order-internal.interface';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

/**
 * Order Repository contract
 */
export interface OrderRepository {
  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a new order
   *
   * @param order - Order data (without IDs - auto-generated)
   * @param operationId - Operation tracking ID
   * @returns Created order with generated IDs (osot_table_orderid, osot_orderid)
   */
  create(
    order: Omit<OrderInternal, 'osot_table_orderid' | 'osot_orderid'>,
    operationId?: string,
  ): Promise<OrderInternal>;

  /**
   * Update existing order
   *
   * @param id - Order GUID (osot_table_orderid)
   * @param updates - Partial order data to update
   * @param operationId - Operation tracking ID
   * @returns Updated order
   */
  update(
    id: string,
    updates: Partial<OrderInternal>,
    operationId?: string,
  ): Promise<OrderInternal>;

  /**
   * Delete order (soft delete - mark as inactive)
   *
   * @param id - Order GUID (osot_table_orderid)
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  delete(id: string, operationId?: string): Promise<boolean>;

  /**
   * Hard delete order (permanent removal)
   * Use with caution - irreversible operation
   *
   * @param id - Order GUID (osot_table_orderid)
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  hardDelete(id: string, operationId?: string): Promise<boolean>;

  // ========================================
  // FIND OPERATIONS (Single Record)
  // ========================================

  /**
   * Find order by internal ID (GUID)
   *
   * @param id - Order GUID (osot_table_orderid)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Order or null if not found
   */
  findById(
    id: string,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<OrderInternal | null>;

  /**
   * Find order by business ID (Autonumber)
   *
   * @param orderNumber - Business order number (osot_orderid, e.g., "osot_ord-0000001")
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Order or null if not found
   */
  findByOrderNumber(
    orderNumber: string,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<OrderInternal | null>;

  // ========================================
  // QUERY OPERATIONS (Multiple Records)
  // ========================================

  /**
   * Find all orders with optional filters
   *
   * @param filters - Optional filters (status, payment status, buyer, organization, pagination)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of orders
   */
  findAll(
    filters?: {
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      accountGuid?: string;
      affiliateGuid?: string;
      dateFrom?: Date;
      dateTo?: Date;
      skip?: number;
      top?: number;
      orderBy?: string;
    },
    organizationGuid?: string,
    operationId?: string,
  ): Promise<OrderInternal[]>;

  /**
   * Find orders by account (person buyer)
   *
   * @param accountGuid - Account GUID
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of orders for this account
   */
  findByAccount(
    accountGuid: string,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<OrderInternal[]>;

  /**
   * Find orders by affiliate (company buyer)
   *
   * @param affiliateGuid - Affiliate GUID
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of orders for this affiliate
   */
  findByAffiliate(
    affiliateGuid: string,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<OrderInternal[]>;

  /**
   * Find orders by status
   *
   * @param status - Order status filter
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of orders with this status
   */
  findByStatus(
    status: OrderStatus,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<OrderInternal[]>;

  /**
   * Find orders by payment status
   *
   * @param paymentStatus - Payment status filter
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of orders with this payment status
   */
  findByPaymentStatus(
    paymentStatus: PaymentStatus,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<OrderInternal[]>;

  // ========================================
  // EXISTENCE CHECKS
  // ========================================

  /**
   * Check if order exists by ID
   *
   * @param id - Order GUID (osot_table_orderid)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns True if exists, false otherwise
   */
  exists(
    id: string,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<boolean>;

  // ========================================
  // COUNT OPERATIONS
  // ========================================

  /**
   * Count orders matching filters
   *
   * @param filters - Optional filters for counting
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Number of matching orders
   */
  count(
    filters?: {
      orderStatus?: OrderStatus;
      paymentStatus?: PaymentStatus;
      accountGuid?: string;
      affiliateGuid?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    organizationGuid?: string,
    operationId?: string,
  ): Promise<number>;
}
