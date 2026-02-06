/**
 * Order Product Repository Interface
 *
 * Contract for Order Product data access layer.
 * Implementations must provide CRUD operations against the data store.
 *
 * Architecture Notes:
 * - Repository pattern separates data access from business logic
 * - All methods work with OrderProductInternal representation
 * - Implementations handle mapping to/from Dataverse format
 * - Role-based access control applied at service layer (not repository)
 */

import { OrderProductInternal } from './order-product-internal.interface';

/**
 * Repository interface for Order Product entity
 */
export interface OrderProductRepository {
  /**
   * Create a new Order Product (line item)
   *
   * @param orderProduct - Order Product data (requires orderGuid, productId, etc.)
   * @returns Created Order Product with generated IDs
   * @throws DataverseServiceError if creation fails
   */
  create(
    orderProduct: Partial<OrderProductInternal>,
  ): Promise<OrderProductInternal>;

  /**
   * Find Order Product by GUID
   *
   * @param orderProductId - Order Product GUID
   * @returns Order Product if found, null otherwise
   * @throws DataverseServiceError if query fails
   */
  findById(orderProductId: string): Promise<OrderProductInternal | null>;

  /**
   * Find all Order Products matching filters
   *
   * @param filters - OData filter conditions
   * @returns Array of Order Products (empty if none found)
   * @throws DataverseServiceError if query fails
   */
  findAll(filters?: Record<string, any>): Promise<OrderProductInternal[]>;

  /**
   * Find all Order Products for a specific Order
   *
   * @param orderGuid - Parent Order GUID
   * @returns Array of Order Products belonging to the order
   * @throws DataverseServiceError if query fails
   */
  findByOrderId(orderGuid: string): Promise<OrderProductInternal[]>;

  /**
   * Find Order Products by Product ID (across all orders)
   *
   * @param productId - Product ID reference (e.g., 'osot-prod-0000048')
   * @returns Array of Order Products referencing this product
   * @throws DataverseServiceError if query fails
   * @remarks Useful for tracking product sales history
   */
  findByProductId(productId: string): Promise<OrderProductInternal[]>;

  /**
   * Update an existing Order Product
   *
   * @param orderProductId - Order Product GUID
   * @param updates - Partial Order Product data (only changed fields)
   * @returns Updated Order Product
   * @throws DataverseServiceError if update fails
   * @remarks Most fields are immutable; only privilege/access_modifiers should be updated
   */
  update(
    orderProductId: string,
    updates: Partial<OrderProductInternal>,
  ): Promise<OrderProductInternal>;

  /**
   * Delete an Order Product (hard delete)
   *
   * @param orderProductId - Order Product GUID
   * @returns True if deleted successfully
   * @throws DataverseServiceError if deletion fails
   * @remarks Only Main app has delete permission (audit compliance)
   */
  delete(orderProductId: string): Promise<boolean>;

  /**
   * Count Order Products matching filters
   *
   * @param filters - OData filter conditions
   * @returns Count of matching Order Products
   * @throws DataverseServiceError if query fails
   */
  count(filters?: Record<string, any>): Promise<number>;
}
