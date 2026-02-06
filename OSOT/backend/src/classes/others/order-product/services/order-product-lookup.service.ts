/**
 * Order Product Lookup Service
 *
 * Pure read operations for Order Products.
 * No mutations allowed - lookup only.
 *
 * Key Responsibilities:
 * - Find order products by ID, order ID, or product ID
 * - List all order products for an order
 * - Count items in an order
 * - Apply filters and pagination
 *
 * @file order-product-lookup.service.ts
 * @module OrderProductModule
 * @layer Services
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseOrderProductRepository } from '../repositories';
import { OrderProductInternal } from '../interfaces';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

@Injectable()
export class OrderProductLookupService {
  private readonly logger = new Logger(OrderProductLookupService.name);

  constructor(
    private readonly orderProductRepository: DataverseOrderProductRepository,
  ) {}

  /**
   * Find an Order Product by ID
   *
   * @param orderProductId - Order Product GUID
   * @returns Order Product or null if not found
   */
  async findById(orderProductId: string): Promise<OrderProductInternal | null> {
    const operationId = `find_order_product_by_id_${Date.now()}`;

    try {
      this.logger.log(
        `Finding Order Product ${orderProductId} - Operation: ${operationId}`,
      );

      const result = await this.orderProductRepository.findById(orderProductId);

      if (!result) {
        this.logger.warn(
          `Order Product not found: ${orderProductId} - Operation: ${operationId}`,
        );
        return null;
      }

      return result;
    } catch (error) {
      this.logger.error(
        `Error finding Order Product ${orderProductId} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: 'Erro ao buscar item de pedido',
        operationId,
        orderProductId,
      });
    }
  }

  /**
   * Find all Order Products for a specific Order
   *
   * @param orderGuid - Parent Order GUID
   * @returns Array of Order Products for the order
   */
  async findByOrderId(orderGuid: string): Promise<OrderProductInternal[]> {
    const operationId = `find_order_products_by_order_${Date.now()}`;

    try {
      this.logger.log(
        `Finding Order Products for Order ${orderGuid} - Operation: ${operationId}`,
      );

      const results =
        await this.orderProductRepository.findByOrderId(orderGuid);

      this.logger.log(
        `Found ${results.length} Order Products for Order ${orderGuid} - Operation: ${operationId}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error finding Order Products for Order ${orderGuid} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: 'Erro ao listar itens do pedido',
        operationId,
        orderGuid,
      });
    }
  }

  /**
   * Find all Order Products for a specific Product
   *
   * @param productId - Product GUID
   * @returns Array of Order Products using this product
   */
  async findByProductId(productId: string): Promise<OrderProductInternal[]> {
    const operationId = `find_order_products_by_product_${Date.now()}`;

    try {
      this.logger.log(
        `Finding Order Products for Product ${productId} - Operation: ${operationId}`,
      );

      const results =
        await this.orderProductRepository.findByProductId(productId);

      this.logger.log(
        `Found ${results.length} Order Products for Product ${productId} - Operation: ${operationId}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error finding Order Products for Product ${productId} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: 'Erro ao buscar pedidos do produto',
        operationId,
        productId,
      });
    }
  }

  /**
   * Find all Order Products (with optional filters)
   *
   * @param filters - Optional filter conditions
   * @returns Array of Order Products
   */
  async findAll(
    filters?: Record<string, any>,
  ): Promise<OrderProductInternal[]> {
    const operationId = `find_all_order_products_${Date.now()}`;

    try {
      this.logger.log(`Finding all Order Products - Operation: ${operationId}`);

      const results = await this.orderProductRepository.findAll(filters);

      this.logger.log(
        `Found ${results.length} Order Products - Operation: ${operationId}`,
      );

      return results;
    } catch (error) {
      this.logger.error(
        `Error finding all Order Products - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Erro ao listar itens de pedido',
        operationId,
      });
    }
  }
}
