/**
 * Order CRUD Service
 *
 * Lightweight CRUD operations for Order entity.
 * Handles data transformation and repository interaction.
 *
 * RESPONSIBILITIES:
 * - Map DTOs to internal format and vice versa
 * - Call repository layer for persistence
 * - Invalidate cache after mutations
 * - Track operations with operationId
 * - Log events for debugging
 *
 * NOT RESPONSIBLE FOR:
 * - Business rule validation (use OrderBusinessRulesService)
 * - Permission checks (use OrderBusinessRulesService)
 * - Complex orchestration (use OrderOrchestratorService)
 *
 * @file order-crud.service.ts
 * @module OrderModule
 * @layer Services
 * @since 2026-01-22
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { CacheService } from '../../../../cache/cache.service';
import { OrderRepository } from '../interfaces/order-repository.interface';
import { OrderMapper } from '../mappers/order.mapper';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { UpdateOrderDto } from '../dtos/update-order.dto';
import { OrderResponseDto } from '../dtos/order-response.dto';

/**
 * Order CRUD Service
 * Pure CRUD operations without business logic
 */
@Injectable()
export class OrderCrudService {
  private readonly logger = new Logger(OrderCrudService.name);

  constructor(
    @Inject('ORDER_REPOSITORY')
    private readonly orderRepository: OrderRepository,
    private readonly orderMapper: OrderMapper,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Create a new order
   *
   * Responsibility: Map DTO → Internal, call repository, invalidate cache
   * Business validation happens in OrderBusinessRulesService
   *
   * @param createDto - Order creation data (already validated)
   * @param organizationGuid - Organization context for multi-tenancy
   * @param operationId - Operation tracking ID
   * @returns Created order with generated IDs
   * @throws DATAVERSE_SERVICE_ERROR on repository failure
   */
  async create(
    createDto: CreateOrderDto,
    organizationGuid: string,
    operationId?: string,
  ): Promise<OrderResponseDto> {
    const opId = operationId || `create_order_${Date.now()}`;

    try {
      this.logger.log(`Creating order for operation ${opId}`, {
        accountGuid: createDto.accountGuid,
        affiliateGuid: createDto.affiliateGuid,
      });

      // Map DTO to internal format
      const internalData = this.orderMapper.mapCreateDtoToInternal(createDto);
      internalData.organizationGuid = organizationGuid;

      // Create in repository
      const createdOrder = await this.orderRepository.create(internalData);

      // Invalidate cache
      await this.cacheService.invalidatePattern('orders:*');

      // Map to response DTO
      const response = this.orderMapper.mapInternalToResponseDto(createdOrder);

      this.logger.log(`Order created successfully for operation ${opId}`, {
        orderId: createdOrder.osot_table_orderid,
        orderNumber: createdOrder.osot_orderid,
      });

      return response;
    } catch (error) {
      this.logger.error(`Error creating order for operation ${opId}`, error);

      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create order',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update an existing order
   *
   * Responsibility: Map DTO → Internal, call repository, invalidate cache
   * Business validation happens in OrderBusinessRulesService
   *
   * @param id - Order GUID (osot_table_orderid)
   * @param updateDto - Order update data (already validated)
   * @param organizationGuid - Organization context for multi-tenancy
   * @param operationId - Operation tracking ID
   * @returns Updated order
   * @throws DATAVERSE_SERVICE_ERROR on repository failure
   */
  async update(
    id: string,
    updateDto: UpdateOrderDto,
    organizationGuid: string,
    operationId?: string,
  ): Promise<OrderResponseDto> {
    const opId = operationId || `update_order_${Date.now()}`;

    try {
      this.logger.log(`Updating order ${id} for operation ${opId}`, {
        orderStatus: updateDto.orderStatus,
        paymentStatus: updateDto.paymentStatus,
      });

      // Map DTO to internal format
      const updateData = this.orderMapper.mapUpdateDtoToInternal(updateDto);

      // Update in repository
      const updatedOrder = await this.orderRepository.update(
        id,
        updateData,
        organizationGuid,
      );

      // Invalidate cache
      await this.cacheService.invalidate(`orders:detail:${id}`);
      await this.cacheService.invalidatePattern('orders:*');

      // Map to response DTO
      const response = this.orderMapper.mapInternalToResponseDto(updatedOrder);

      this.logger.log(`Order updated successfully for operation ${opId}`, {
        orderId: updatedOrder.osot_table_orderid,
        orderNumber: updatedOrder.osot_orderid,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Error updating order ${id} for operation ${opId}`,
        error,
      );

      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update order',
        operationId: opId,
        orderId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Soft delete an order (set status to Inactive)
   *
   * Responsibility: Call repository for soft delete, invalidate cache
   * Business validation happens in OrderBusinessRulesService
   *
   * @param id - Order GUID (osot_table_orderid)
   * @param organizationGuid - Organization context for multi-tenancy
   * @param operationId - Operation tracking ID
   * @returns Success boolean
   * @throws DATAVERSE_SERVICE_ERROR on repository failure
   */
  async delete(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete_order_${Date.now()}`;

    try {
      this.logger.log(`Soft deleting order ${id} for operation ${opId}`);

      // Soft delete in repository (sets osot_status = 'Inactive')
      const success = await this.orderRepository.delete(id, opId);

      if (!success) {
        throw new Error('Repository returned false');
      }

      // Invalidate cache
      await this.cacheService.invalidate(`orders:detail:${id}`);
      await this.cacheService.invalidatePattern('orders:*');

      this.logger.log(`Order soft deleted successfully for operation ${opId}`, {
        orderId: id,
      });

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting order ${id} for operation ${opId}`,
        error,
      );

      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to delete order',
        operationId: opId,
        orderId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Hard delete an order (permanent removal)
   *
   * Responsibility: Call repository for hard delete, invalidate cache
   * Business validation happens in OrderBusinessRulesService
   *
   * CAUTION: This is irreversible. Ensure business validation is done before calling.
   *
   * @param id - Order GUID (osot_table_orderid)
   * @param operationId - Operation tracking ID
   * @returns Success boolean
   * @throws DATAVERSE_SERVICE_ERROR on repository failure
   */
  async hardDelete(id: string, operationId?: string): Promise<boolean> {
    const opId = operationId || `hard_delete_order_${Date.now()}`;

    try {
      this.logger.warn(
        `Hard deleting order ${id} for operation ${opId} - THIS IS IRREVERSIBLE`,
      );

      // Hard delete in repository (permanent removal)
      const success = await this.orderRepository.hardDelete(id, opId);

      if (!success) {
        throw new Error('Repository returned false');
      }

      // Invalidate cache
      await this.cacheService.invalidate(`orders:detail:${id}`);
      await this.cacheService.invalidatePattern('orders:*');

      this.logger.warn(
        `Order hard deleted successfully for operation ${opId}`,
        {
          orderId: id,
        },
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error hard deleting order ${id} for operation ${opId}`,
        error,
      );

      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to hard delete order',
        operationId: opId,
        orderId: id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
