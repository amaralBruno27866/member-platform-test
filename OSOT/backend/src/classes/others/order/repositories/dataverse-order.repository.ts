/**
 * Dataverse Order Repository
 *
 * Data access layer for Order entity.
 * Handles all interactions with Microsoft Dataverse for Order CRUD operations.
 *
 * @module OrderModule
 * @layer Repositories
 * @since 2026-01-22
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { OrderRepository } from '../interfaces/order-repository.interface';
import { OrderInternal, OrderDataverse } from '../interfaces';
import { OrderMapper } from '../mappers/order.mapper';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';
import {
  ORDER_ENTITY,
  ORDER_ODATA,
  ORDER_ODATA_SELECT,
} from '../constants/order-odata.constant';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { getAppForOperation } from '../../../../utils/dataverse-app.helper';

// Type definition for Dataverse collection responses
interface DataverseCollectionResponse {
  value: any[];
  '@odata.count'?: number;
}

/**
 * Dataverse implementation of OrderRepository interface
 */
@Injectable()
export class DataverseOrderRepository implements OrderRepository {
  private readonly logger = new Logger(DataverseOrderRepository.name);

  constructor(
    private readonly dataverseService: DataverseService,
    private readonly orderMapper: OrderMapper,
  ) {}

  /**
   * Helper to get credentials for operations
   */
  private getCredentials(
    operation: 'create' | 'read' | 'write' | 'delete',
    userRole?: string,
  ) {
    const app = getAppForOperation(operation, userRole);
    return {
      credentials: this.dataverseService.getCredentialsByApp(app),
      app,
    };
  }

  /**
   * Create a new order in Dataverse
   */
  async create(data: Partial<OrderInternal>): Promise<OrderInternal> {
    const operationId = `create_order_${Date.now()}`;

    try {
      if (!data.organizationGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'organizationGuid is required',
          operationId,
        });
      }

      if (!data.accountGuid && !data.affiliateGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message:
            'At least one buyer (accountGuid or affiliateGuid) is required',
          operationId,
        });
      }

      const { credentials, app } = this.getCredentials('create', 'main');
      const dataversePayload = this.orderMapper.mapInternalToDataverse(data);

      const response = (await this.dataverseService.request(
        'POST',
        ORDER_ENTITY.collectionName,
        dataversePayload,
        credentials,
        app,
      )) as OrderDataverse;

      const createdOrderId = response.osot_table_orderid;
      const created = await this.findById(
        createdOrderId,
        data.organizationGuid,
      );

      if (!created) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Failed to retrieve created order',
          operationId,
        });
      }

      this.logger.log(`Order created - Operation: ${operationId}`, {
        orderId: createdOrderId,
      });

      return created;
    } catch (error) {
      this.logger.error(`Error creating order - ${operationId}`, error);
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create order',
        operationId,
      });
    }
  }

  /**
   * Update an existing order
   */
  async update(
    id: string,
    data: Partial<OrderInternal>,
    organizationGuid: string,
  ): Promise<OrderInternal> {
    const operationId = `update_order_${Date.now()}`;

    try {
      const existing = await this.findById(id, organizationGuid);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Order not found',
          operationId,
        });
      }

      const { credentials, app } = this.getCredentials('write', 'main');

      // Filter out immutable fields
      const updateData = { ...data };
      delete updateData.organizationGuid;
      delete updateData.accountGuid;
      delete updateData.affiliateGuid;
      delete updateData.osot_table_orderid;
      delete updateData.osot_orderid;

      const dataversePayload =
        this.orderMapper.mapInternalToDataverse(updateData);
      const endpoint = `${ORDER_ENTITY.collectionName}(${id})`;

      await this.dataverseService.request(
        'PATCH',
        endpoint,
        dataversePayload,
        credentials,
        app,
      );

      const updated = await this.findById(id, organizationGuid);
      if (!updated) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Failed to retrieve updated order',
          operationId,
        });
      }

      this.logger.log(`Order updated - Operation: ${operationId}`, {
        orderId: id,
      });

      return updated;
    } catch (error) {
      this.logger.error(`Error updating order - ${operationId}`, error);
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update order',
        operationId,
      });
    }
  }

  /**
   * Soft delete an order (set osot_status = 'Inactive')
   */
  async delete(id: string, operationId?: string): Promise<boolean> {
    const opId = operationId || `soft_delete_order_${Date.now()}`;

    try {
      const { credentials, app } = this.getCredentials('delete', 'main');
      const endpoint = `${ORDER_ENTITY.collectionName}(${id})`;

      await this.dataverseService.request(
        'PATCH',
        endpoint,
        { osot_status: 'Inactive' },
        credentials,
        app,
      );

      this.logger.log(`Order deleted - Operation: ${opId}`, {
        orderId: id,
      });
      return true;
    } catch (error) {
      this.logger.error(`Error deleting order - ${opId}`, error);
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to delete order',
        operationId: opId,
      });
    }
  }

  /**
   * Hard delete an order (permanent removal)
   */
  async hardDelete(id: string, operationId?: string): Promise<boolean> {
    const opId = operationId || `hard_delete_order_${Date.now()}`;

    try {
      const { credentials, app } = this.getCredentials('delete', 'main');
      const endpoint = `${ORDER_ENTITY.collectionName}(${id})`;

      await this.dataverseService.request(
        'DELETE',
        endpoint,
        undefined,
        credentials,
        app,
      );

      this.logger.warn(`Order hard deleted - ${opId}`, { orderId: id });
      return true;
    } catch (error) {
      this.logger.error(`Error hard deleting order - ${opId}`, error);
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to hard delete order',
        operationId: opId,
      });
    }
  }

  /**
   * Find order by ID with multi-tenant safety check
   */
  async findById(
    id: string,
    organizationGuid: string,
  ): Promise<OrderInternal | null> {
    try {
      const { credentials, app } = this.getCredentials('read');
      const filter = `osot_table_orderid eq '${id}' and _osot_table_organization_value eq '${organizationGuid}'`;

      const response = (await this.dataverseService.request(
        'GET',
        `${ORDER_ENTITY.collectionName}?$filter=${filter}&$select=${ORDER_ODATA_SELECT.FULL}`,
        undefined,
        credentials,
        app,
      )) as DataverseCollectionResponse;

      const records = response?.value || [];

      return records.length > 0
        ? this.orderMapper.mapDataverseToInternal(records[0] as OrderDataverse)
        : null;
    } catch (error) {
      if (error instanceof Error && 'code' in error) throw error;
      this.logger.error('Error finding order by ID', error);
      return null;
    }
  }

  /**
   * Find order by order number (business identifier)
   */
  async findByOrderNumber(
    orderNumber: string,
    organizationGuid: string,
  ): Promise<OrderInternal | null> {
    try {
      const { credentials, app } = this.getCredentials('read');
      const filter = `${ORDER_ODATA.ORDER_NUMBER} eq '${orderNumber}' and _osot_table_organization_value eq '${organizationGuid}'`;
      const query = `$filter=${filter}&$select=${ORDER_ODATA_SELECT.FULL}`;

      const response = (await this.dataverseService.request(
        'GET',
        `${ORDER_ENTITY.collectionName}?${query}`,
        undefined,
        credentials,
        app,
      )) as DataverseCollectionResponse;

      const records = response?.value || [];

      return records.length > 0
        ? this.orderMapper.mapDataverseToInternal(records[0] as OrderDataverse)
        : null;
    } catch (error) {
      if (error instanceof Error && 'code' in error) throw error;
      this.logger.error('Error finding order by number', {
        orderNumber,
        organizationGuid,
      });
      return null;
    }
  }

  /**
   * Find all orders matching filters
   */
  async findAll(
    filters: Record<string, any>,
    organizationGuid: string,
  ): Promise<OrderInternal[]> {
    try {
      const { credentials, app } = this.getCredentials('read');

      let odataFilter = `_osot_table_organization_value eq '${organizationGuid}'`;

      if (filters.orderStatus) {
        odataFilter += ` and ${ORDER_ODATA.ORDER_STATUS} eq ${filters.orderStatus}`;
      }
      if (filters.paymentStatus) {
        odataFilter += ` and ${ORDER_ODATA.PAYMENT_STATUS} eq ${filters.paymentStatus}`;
      }
      if (filters.accountGuid) {
        odataFilter += ` and _osot_table_account_value eq '${filters.accountGuid}'`;
      }
      if (filters.affiliateGuid) {
        odataFilter += ` and _osot_table_affiliate_value eq '${filters.affiliateGuid}'`;
      }

      let endpoint = `${ORDER_ENTITY.collectionName}?$filter=${odataFilter}&$select=${ORDER_ODATA_SELECT.FULL}`;

      if (filters.skip) {
        endpoint += `&$skip=${filters.skip as number}`;
      }
      if (filters.top) {
        endpoint += `&$top=${filters.top as number}`;
      }

      if (filters.orderBy) {
        let sortBy = filters.orderBy as string;
        if (filters.orderBy === 'createdOn') {
          sortBy = 'createdon';
        } else if (filters.orderBy === 'orderNumber') {
          sortBy = ORDER_ODATA.ORDER_NUMBER;
        }
        const sortDir = filters.sortDirection === 'desc' ? 'desc' : 'asc';
        endpoint += `&$orderby=${sortBy} ${sortDir}`;
      }

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
        app,
      )) as DataverseCollectionResponse;

      if (!response?.value || response.value.length === 0) {
        return [];
      }

      return response.value.map((record) =>
        this.orderMapper.mapDataverseToInternal(record as OrderDataverse),
      );
    } catch (error) {
      if (error instanceof Error && 'code' in error) throw error;
      this.logger.error('Error finding all orders', {
        filters,
        organizationGuid,
      });
      return [];
    }
  }

  /**
   * Find all orders for a specific account
   */
  async findByAccount(
    accountGuid: string,
    organizationGuid: string,
  ): Promise<OrderInternal[]> {
    return this.findAll({ accountGuid }, organizationGuid);
  }

  /**
   * Find all orders for a specific affiliate
   */
  async findByAffiliate(
    affiliateGuid: string,
    organizationGuid: string,
  ): Promise<OrderInternal[]> {
    return this.findAll({ affiliateGuid }, organizationGuid);
  }

  /**
   * Find all orders with a specific status
   */
  async findByStatus(
    status: OrderStatus,
    organizationGuid: string,
  ): Promise<OrderInternal[]> {
    return this.findAll({ orderStatus: status }, organizationGuid);
  }

  /**
   * Find all orders with a specific payment status
   */
  async findByPaymentStatus(
    paymentStatus: PaymentStatus,
    organizationGuid: string,
  ): Promise<OrderInternal[]> {
    return this.findAll({ paymentStatus }, organizationGuid);
  }

  /**
   * Check if order exists
   */
  async exists(id: string, organizationGuid: string): Promise<boolean> {
    try {
      const { credentials, app } = this.getCredentials('read');
      const filter = `osot_table_orderid eq '${id}' and _osot_table_organization_value eq '${organizationGuid}'`;
      const query = `$filter=${filter}&$select=osot_table_orderid&$count=true`;

      const response = await this.dataverseService.request(
        'GET',
        `${ORDER_ENTITY.collectionName}?${query}`,
        undefined,
        credentials,
        app,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return (collectionResponse?.value?.length ?? 0) > 0;
    } catch (error) {
      this.logger.error('Error checking order exists', error);
      return false;
    }
  }

  /**
   * Count orders matching filters
   */
  async count(
    filters: Record<string, any>,
    organizationGuid: string,
  ): Promise<number> {
    try {
      const { credentials, app } = this.getCredentials('read');

      let odataFilter = `_osot_table_organization_value eq '${organizationGuid}'`;

      if (filters.orderStatus) {
        odataFilter += ` and ${ORDER_ODATA.ORDER_STATUS} eq ${filters.orderStatus}`;
      }
      if (filters.paymentStatus) {
        odataFilter += ` and ${ORDER_ODATA.PAYMENT_STATUS} eq ${filters.paymentStatus}`;
      }

      const endpoint = `${ORDER_ENTITY.collectionName}?$filter=${odataFilter}&$count=true`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        undefined,
        credentials,
        app,
      )) as DataverseCollectionResponse;

      return response['@odata.count'] ?? 0;
    } catch (error) {
      if (error instanceof Error && 'code' in error) throw error;
      this.logger.error('Error counting orders', {
        filters,
        organizationGuid,
      });
      return 0;
    }
  }
}
