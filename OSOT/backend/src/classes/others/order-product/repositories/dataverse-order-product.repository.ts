/**
 * Dataverse Order Product Repository
 *
 * Implementation of OrderProductRepository using Dataverse as data store.
 * Handles all CRUD operations for Order Product entity via DataverseService.
 *
 * Architecture Notes:
 * - Uses DataverseService for HTTP calls to Dataverse API
 * - Maps between Internal ↔ Dataverse representations via OrderProductMapper
 * - Role-based credentials handled by getAppForOperation (called by services)
 * - All OData queries use constants from ORDER_PRODUCT_ODATA
 *
 * @file dataverse-order-product.repository.ts
 * @module OrderProductModule
 * @layer Repositories
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import {
  OrderProductInternal,
  OrderProductDataverse,
  OrderProductRepository,
} from '../interfaces';
import { OrderProductMapper } from '../mappers';
import {
  ORDER_PRODUCT_ENTITY,
  ORDER_PRODUCT_FIELDS,
  ORDER_PRODUCT_ODATA,
} from '../constants';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Dataverse implementation of Order Product Repository
 */
@Injectable()
export class DataverseOrderProductRepository implements OrderProductRepository {
  private readonly logger = new Logger(DataverseOrderProductRepository.name);

  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new Order Product (line item)
   *
   * @param orderProduct - Order Product data (requires orderGuid, productId, etc.)
   * @returns Created Order Product with generated IDs
   */
  async create(
    orderProduct: Partial<OrderProductInternal>,
  ): Promise<OrderProductInternal> {
    const operationId = `create_order_product_${Date.now()}`;

    try {
      this.logger.log(
        `Creating Order Product for order ${orderProduct.orderGuid} - Operation: ${operationId}`,
      );

      // Map Internal → Dataverse (handles @odata.bind)
      const dataversePayload =
        OrderProductMapper.mapInternalToDataverse(orderProduct);

      // Get credentials (service layer passes userRole via getAppForOperation)
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Create in Dataverse
      const endpoint = ORDER_PRODUCT_ENTITY;
      const response = (await this.dataverseService.request(
        'POST',
        endpoint,
        dataversePayload,
        credentials,
      )) as Record<string, string>;

      // Extract GUID from response header
      const createdId = this.extractIdFromResponse(response);

      // Fetch created record to get full data (including autonumber)
      const created = await this.findById(createdId);

      if (!created) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Order Product created but could not be retrieved',
          operationId,
          orderProductId: createdId,
        });
      }

      this.logger.log(
        `Order Product created successfully: ${created.osot_table_order_productid} - Operation: ${operationId}`,
      );

      return created;
    } catch (error) {
      this.logger.error(
        `Error creating Order Product - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create Order Product',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Find Order Product by GUID
   *
   * @param orderProductId - Order Product GUID
   * @returns Order Product if found, null otherwise
   */
  async findById(orderProductId: string): Promise<OrderProductInternal | null> {
    const operationId = `find_order_product_by_id_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Order Product by ID: ${orderProductId} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${ORDER_PRODUCT_ENTITY}(${orderProductId})?$select=${ORDER_PRODUCT_ODATA.SELECT_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as OrderProductDataverse | null;

      if (!response) {
        return null;
      }

      return OrderProductMapper.mapDataverseToInternal(response);
    } catch (error) {
      this.logger.error(
        `Error finding Order Product by ID: ${orderProductId} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Find all Order Products matching filters
   *
   * @param filters - OData filter conditions
   * @returns Array of Order Products (empty if none found)
   */
  async findAll(
    filters?: Record<string, any>,
  ): Promise<OrderProductInternal[]> {
    const operationId = `find_all_order_products_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding all Order Products with filters - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Build OData query
      let endpoint = `${ORDER_PRODUCT_ENTITY}?$select=${ORDER_PRODUCT_ODATA.SELECT_FIELDS}`;

      if (filters && Object.keys(filters).length > 0) {
        const filterString = this.buildFilterString(filters);
        if (filterString) {
          endpoint += `&$filter=${filterString}`;
        }
      }

      // Add default ordering
      endpoint += `&$orderby=${ORDER_PRODUCT_ODATA.DEFAULT_ORDER_BY}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: OrderProductDataverse[] = Array.isArray(value)
        ? (value as OrderProductDataverse[])
        : [];

      return OrderProductMapper.mapDataverseArrayToInternal(items);
    } catch (error) {
      this.logger.error(
        `Error finding all Order Products - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve Order Products',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Find all Order Products for a specific Order
   *
   * @param orderGuid - Parent Order GUID
   * @returns Array of Order Products belonging to the order
   */
  async findByOrderId(orderGuid: string): Promise<OrderProductInternal[]> {
    const operationId = `find_order_products_by_order_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Order Products for order: ${orderGuid} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${ORDER_PRODUCT_ENTITY}?$select=${ORDER_PRODUCT_ODATA.SELECT_FIELDS}&$filter=${ORDER_PRODUCT_ODATA.FILTER_BY_ORDER(orderGuid)}&$orderby=${ORDER_PRODUCT_ODATA.DEFAULT_ORDER_BY}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: OrderProductDataverse[] = Array.isArray(value)
        ? (value as OrderProductDataverse[])
        : [];

      return OrderProductMapper.mapDataverseArrayToInternal(items);
    } catch (error) {
      this.logger.error(
        `Error finding Order Products by order: ${orderGuid} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve Order Products by order',
        operationId,
        orderGuid,
        originalError: error,
      });
    }
  }

  /**
   * Find Order Products by Product ID (across all orders)
   *
   * @param productId - Product ID reference (e.g., 'osot-prod-0000048')
   * @returns Array of Order Products referencing this product
   */
  async findByProductId(productId: string): Promise<OrderProductInternal[]> {
    const operationId = `find_order_products_by_product_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Order Products for product: ${productId} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${ORDER_PRODUCT_ENTITY}?$select=${ORDER_PRODUCT_ODATA.SELECT_FIELDS}&$filter=${ORDER_PRODUCT_ODATA.FILTER_BY_PRODUCT(productId)}&$orderby=${ORDER_PRODUCT_ODATA.DEFAULT_ORDER_BY}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: OrderProductDataverse[] = Array.isArray(value)
        ? (value as OrderProductDataverse[])
        : [];

      return OrderProductMapper.mapDataverseArrayToInternal(items);
    } catch (error) {
      this.logger.error(
        `Error finding Order Products by product: ${productId} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve Order Products by product',
        operationId,
        productId,
        originalError: error,
      });
    }
  }

  /**
   * Update an existing Order Product
   *
   * @param orderProductId - Order Product GUID
   * @param updates - Partial Order Product data (only changed fields)
   * @returns Updated Order Product
   */
  async update(
    orderProductId: string,
    updates: Partial<OrderProductInternal>,
  ): Promise<OrderProductInternal> {
    const operationId = `update_order_product_${Date.now()}`;

    try {
      this.logger.log(
        `Updating Order Product: ${orderProductId} - Operation: ${operationId}`,
      );

      // Map Internal → Dataverse
      const dataversePayload =
        OrderProductMapper.mapInternalToDataverse(updates);

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${ORDER_PRODUCT_ENTITY}(${orderProductId})`;

      await this.dataverseService.request(
        'PATCH',
        endpoint,
        dataversePayload,
        credentials,
      );

      // Fetch updated record
      const updated = await this.findById(orderProductId);

      if (!updated) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Order Product updated but could not be retrieved',
          operationId,
          orderProductId,
        });
      }

      this.logger.log(
        `Order Product updated successfully: ${orderProductId} - Operation: ${operationId}`,
      );

      return updated;
    } catch (error) {
      this.logger.error(
        `Error updating Order Product: ${orderProductId} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update Order Product',
        operationId,
        orderProductId,
        originalError: error,
      });
    }
  }

  /**
   * Delete an Order Product (hard delete)
   *
   * @param orderProductId - Order Product GUID
   * @returns True if deleted successfully
   */
  async delete(orderProductId: string): Promise<boolean> {
    const operationId = `delete_order_product_${Date.now()}`;

    try {
      this.logger.log(
        `Deleting Order Product: ${orderProductId} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${ORDER_PRODUCT_ENTITY}(${orderProductId})`;

      await this.dataverseService.request(
        'DELETE',
        endpoint,
        null,
        credentials,
      );

      this.logger.log(
        `Order Product deleted successfully: ${orderProductId} - Operation: ${operationId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting Order Product: ${orderProductId} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to delete Order Product',
        operationId,
        orderProductId,
        originalError: error,
      });
    }
  }

  /**
   * Count Order Products matching filters
   *
   * @param filters - OData filter conditions
   * @returns Count of matching Order Products
   */
  async count(filters?: Record<string, any>): Promise<number> {
    const operationId = `count_order_products_${Date.now()}`;

    try {
      this.logger.debug(
        `Counting Order Products with filters - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Build OData query with $count
      let endpoint = `${ORDER_PRODUCT_ENTITY}?$count=true&$select=${ORDER_PRODUCT_FIELDS.TABLE_ORDER_PRODUCT_ID}`;

      if (filters && Object.keys(filters).length > 0) {
        const filterString = this.buildFilterString(filters);
        if (filterString) {
          endpoint += `&$filter=${filterString}`;
        }
      }

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { '@odata.count'?: number };

      return Number(response?.['@odata.count'] ?? 0);
    } catch (error) {
      this.logger.error(
        `Error counting Order Products - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to count Order Products',
        operationId,
        originalError: error,
      });
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Extract entity ID from Dataverse POST response
   *
   * @param response - Dataverse response with OData-EntityId header
   * @returns Entity GUID
   */
  private extractIdFromResponse(response: Record<string, string>): string {
    const entityId = response['@odata.id'] || response['OData-EntityId'];
    if (!entityId) {
      throw new Error('No entity ID found in response');
    }

    // Extract GUID from URL: /osot_table_order_products(guid)
    const match = entityId.match(/\(([a-f0-9-]+)\)/i);
    if (!match) {
      throw new Error('Could not extract GUID from entity ID');
    }

    return match[1];
  }

  /**
   * Build OData filter string from filters object
   *
   * @param filters - Filter conditions
   * @returns OData filter string
   */
  private buildFilterString(filters: Record<string, any>): string {
    const conditions: string[] = [];

    // Order GUID filter
    if (filters.orderGuid) {
      conditions.push(
        `${ORDER_PRODUCT_FIELDS.ORDER_VALUE} eq '${filters.orderGuid}'`,
      );
    }

    // Product ID filter
    if (filters.productId) {
      conditions.push(
        `${ORDER_PRODUCT_FIELDS.PRODUCT_ID} eq '${filters.productId}'`,
      );
    }

    // Product Name filter (partial match)
    if (filters.productName) {
      conditions.push(
        `contains(${ORDER_PRODUCT_FIELDS.PRODUCT_NAME}, '${filters.productName}')`,
      );
    }

    // Privilege filter
    if (filters.privilege !== undefined) {
      conditions.push(
        `${ORDER_PRODUCT_FIELDS.PRIVILEGE} eq ${filters.privilege}`,
      );
    }

    // Access Modifier filter
    if (filters.accessModifier !== undefined) {
      conditions.push(
        `${ORDER_PRODUCT_FIELDS.ACCESS_MODIFIERS} eq ${filters.accessModifier}`,
      );
    }

    // Active records only
    if (filters.activeOnly === true) {
      conditions.push(ORDER_PRODUCT_ODATA.FILTER_ACTIVE);
    }

    return conditions.join(' and ');
  }
}
