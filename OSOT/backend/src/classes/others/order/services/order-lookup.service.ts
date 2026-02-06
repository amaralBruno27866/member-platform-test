/**
 * Order Lookup Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with OrderRepository
 * - Business Rules: Permission validation via OrderBusinessRulesService
 * - Multi-Tenant: Organization-level data isolation
 * - Caching: Redis integration for performance optimization
 * - Data Transformation: Mappers for Internal ↔ Response conversions
 *
 * PERMISSION SYSTEM (Order Lookup):
 * - MAIN (privilege = 3): Can read all orders across all organizations
 * - ADMIN (privilege = 2): Can read orders within their organization
 * - OWNER (privilege = 1): Can read only their own orders (accountGuid = userId OR affiliateGuid = userAffiliateId)
 *
 * LOOKUP FEATURES:
 * - List orders with filtering, sorting, pagination
 * - Find by account (individual orders)
 * - Find by affiliate (company orders)
 * - Find by status (order status, payment status)
 * - Order statistics (count by status, revenue aggregations)
 * - Search by order number
 *
 * MULTI-TENANT SAFETY:
 * - All queries filter by organizationGuid (except MAIN privilege)
 * - Ownership validation for OWNER role
 * - Organization-level statistics
 *
 * @file order-lookup.service.ts
 * @module OrderModule
 * @layer Services
 * @since 2026-01-22
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { CacheService } from '../../../../cache/cache.service';
import { OrderRepository } from '../interfaces/order-repository.interface';
import { OrderInternal } from '../interfaces/order-internal.interface';
import { OrderMapper } from '../mappers/order.mapper';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';
import { OrderBusinessRulesService } from './order-business-rules.service';

/**
 * Order query options for listing
 */
export interface OrderQueryOptions {
  accountGuid?: string;
  affiliateGuid?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  skip?: number;
  top?: number;
  orderBy?: string;
  page?: number; // Pagination: page number (1-based)
  limit?: number; // Pagination: items per page (default: 20)
  organizationGuid?: string;
}

/**
 * Paginated order response
 */
export interface PaginatedOrderResponse {
  orders: OrderResponseDto[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Order statistics aggregation
 */
export interface OrderStatistics {
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  ordersByPaymentStatus: Record<PaymentStatus, number>;
  totalRevenue: number;
  averageOrderValue: number;
  organizationGuid: string;
}

/**
 * Order Lookup Service
 *
 * Handles all read operations for orders with permission validation,
 * multi-tenant isolation, and performance optimization via caching.
 */
@Injectable()
export class OrderLookupService {
  private readonly logger = new Logger(OrderLookupService.name);
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @Inject('ORDER_REPOSITORY')
    private readonly orderRepository: OrderRepository,
    private readonly orderMapper: OrderMapper,
    private readonly businessRuleService: OrderBusinessRulesService,
    private readonly cacheService: CacheService,
  ) {}

  // ========================================
  // PRIMARY LOOKUP METHODS
  // ========================================

  /**
   * Find order by ID with permission validation
   *
   * @param orderId - Order GUID
   * @param userPrivilege - User privilege level
   * @param userId - User ID from JWT (for OWNER validation)
   * @param organizationGuid - Organization GUID from JWT
   * @returns Order response DTO or null if not found
   * @throws AppError if permission denied
   */
  async findById(
    orderId: string,
    userPrivilege: Privilege,
    userId?: string,
    organizationGuid?: string,
  ): Promise<OrderResponseDto | null> {
    const operationId = `find_order_by_id_${Date.now()}`;
    this.logger.log(
      `Finding order by ID: ${orderId} - Operation: ${operationId}`,
    );

    try {
      // Check cache
      const cacheKey = `order:${orderId}`;
      const cached = await this.cacheService.get<OrderInternal>(cacheKey);

      let order: OrderInternal | null;

      if (cached) {
        this.logger.debug(`Cache hit for order: ${orderId}`);
        order = cached;
      } else {
        // Fetch from repository
        order = await this.orderRepository.findById(orderId, operationId);

        if (!order) {
          this.logger.warn(`Order not found: ${orderId}`);
          return null;
        }

        // Cache the result
        await this.cacheService.set(cacheKey, order, this.CACHE_TTL);
      }

      // Permission validation
      const permissionCheck = this.businessRuleService.validateReadPermission(
        userPrivilege,
        order,
        userId,
      );

      if (!permissionCheck.isValid) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: permissionCheck.errors.join(', '),
          orderId,
          userPrivilege,
          operationId,
        });
      }

      // Organization validation (ADMIN and OWNER must be in same org)
      if (
        userPrivilege !== Privilege.MAIN &&
        organizationGuid &&
        order.organizationGuid !== organizationGuid
      ) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Cannot access order from different organization',
          orderId,
          organizationGuid,
          operationId,
        });
      }

      return this.orderMapper.mapInternalToResponseDto(order);
    } catch (error) {
      if ((error as { code?: string }).code) {
        throw error; // Re-throw AppError
      }

      this.logger.error(`Error finding order by ID: ${orderId}`, error);
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to find order',
        orderId,
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Find order by order number (business ID)
   *
   * @param orderNumber - Order number (e.g., "osot_ord-0000001")
   * @param userPrivilege - User privilege level
   * @param userId - User ID from JWT
   * @param organizationGuid - Organization GUID from JWT
   * @returns Order response DTO or null if not found
   */
  async findByOrderNumber(
    orderNumber: string,
    userPrivilege: Privilege,
    userId?: string,
    organizationGuid?: string,
  ): Promise<OrderResponseDto | null> {
    const operationId = `find_order_by_number_${Date.now()}`;
    this.logger.log(
      `Finding order by number: ${orderNumber} - Operation: ${operationId}`,
    );

    try {
      const order = await this.orderRepository.findByOrderNumber(
        orderNumber,
        operationId,
      );

      if (!order) {
        return null;
      }

      // Permission validation
      const permissionCheck = this.businessRuleService.validateReadPermission(
        userPrivilege,
        order,
        userId,
      );

      if (!permissionCheck.isValid) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: permissionCheck.errors.join(', '),
          orderNumber,
          userPrivilege,
          operationId,
        });
      }

      // Organization validation
      if (
        userPrivilege !== Privilege.MAIN &&
        organizationGuid &&
        order.organizationGuid !== organizationGuid
      ) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Cannot access order from different organization',
          orderNumber,
          organizationGuid,
          operationId,
        });
      }

      return this.orderMapper.mapInternalToResponseDto(order);
    } catch (error) {
      if ((error as { code?: string }).code) {
        throw error;
      }

      this.logger.error(`Error finding order by number: ${orderNumber}`, error);
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to find order by number',
        orderNumber,
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  // ========================================
  // LIST & FILTER METHODS
  // ========================================

  /**
   * List orders with filtering, sorting, and pagination
   *
   * @param options - Query options (filters, pagination)
   * @param userPrivilege - User privilege level
   * @param userId - User ID from JWT (for OWNER filtering)
   * @param organizationGuid - Organization GUID from JWT
   * @returns Paginated order response
   */
  async listOrders(
    options: OrderQueryOptions,
    userPrivilege: Privilege,
    userId?: string,
    organizationGuid?: string,
  ): Promise<PaginatedOrderResponse> {
    const operationId = `list_orders_${Date.now()}`;
    this.logger.log(`Listing orders with options - Operation: ${operationId}`);

    try {
      // Build filters based on privilege
      const filters: Record<string, any> = { ...options };

      // OWNER can only see own orders
      if (userPrivilege === Privilege.OWNER && userId) {
        filters.accountGuid = userId;
        // Note: If user has affiliateGuid, need to also filter by that
        // This would require additional logic or OR query
      }

      // ADMIN and OWNER must filter by organization
      if (
        userPrivilege !== Privilege.MAIN &&
        organizationGuid &&
        !filters.organizationGuid
      ) {
        filters.organizationGuid = organizationGuid;
      }

      // Pagination (convert page/limit to skip/top)
      const page = options.page || 1;
      const limit = options.limit || 20;
      filters.skip = (page - 1) * limit;
      filters.top = limit;

      // Check cache for list
      const cacheKey = `orders:list:${JSON.stringify(filters)}`;
      const cached = await this.cacheService.get<OrderInternal[]>(cacheKey);

      let orders: OrderInternal[];

      if (cached) {
        this.logger.debug('Cache hit for order list');
        orders = cached;
      } else {
        // Fetch from repository
        orders = await this.orderRepository.findAll(filters, operationId);

        // Cache the result
        await this.cacheService.set(cacheKey, orders, this.CACHE_TTL);
      }

      // Enforce per-record read permission and org isolation; deny if any record not permitted
      for (const order of orders) {
        const perm = this.businessRuleService.validateReadPermission(
          userPrivilege,
          order,
          userId,
        );

        if (!perm.isValid) {
          throw createAppError(ErrorCodes.PERMISSION_DENIED, {
            message: perm.errors.join(', '),
            operationId,
          });
        }

        if (
          userPrivilege !== Privilege.MAIN &&
          organizationGuid &&
          order.organizationGuid !== organizationGuid
        ) {
          throw createAppError(ErrorCodes.PERMISSION_DENIED, {
            message: 'Cannot access order from different organization',
            organizationGuid,
            operationId,
          });
        }
      }

      const totalItems = await this.orderRepository.count(filters, operationId);

      // Transform to response DTOs
      const orderDtos = orders.map((order) =>
        this.orderMapper.mapInternalToResponseDto(order),
      );

      // Build pagination metadata
      const totalPages = Math.ceil(totalItems / limit);

      return {
        orders: orderDtos,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      if ((error as { code?: string }).code) {
        throw error;
      }

      this.logger.error('Error listing orders', error);
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to list orders',
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  // ========================================
  // RELATIONSHIP-BASED QUERIES
  // ========================================

  /**
   * Find orders by account (individual orders)
   *
   * @param accountGuid - Account GUID
   * @param userPrivilege - User privilege level
   * @param userId - User ID from JWT
   * @param organizationGuid - Organization GUID from JWT
   * @returns Array of order response DTOs
   */
  async findByAccount(
    accountGuid: string,
    userPrivilege: Privilege,
    userId?: string,
    organizationGuid?: string,
  ): Promise<OrderResponseDto[]> {
    const operationId = `find_orders_by_account_${Date.now()}`;
    this.logger.log(
      `Finding orders for account: ${accountGuid} - Operation: ${operationId}`,
    );

    try {
      // OWNER can only view own orders
      if (userPrivilege === Privilege.OWNER && accountGuid !== userId) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Owner can only view their own orders',
          accountGuid,
          userId,
          operationId,
        });
      }

      const orders = await this.orderRepository.findByAccount(
        accountGuid,
        organizationGuid,
        operationId,
      );

      return orders.map((order) =>
        this.orderMapper.mapInternalToResponseDto(order),
      );
    } catch (error) {
      if ((error as { code?: string }).code) {
        throw error;
      }

      this.logger.error(
        `Error finding orders by account: ${accountGuid}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to find orders by account',
        accountGuid,
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Find orders by affiliate (company orders)
   *
   * @param affiliateGuid - Affiliate GUID
   * @param userPrivilege - User privilege level
   * @param organizationGuid - Organization GUID from JWT
   * @returns Array of order response DTOs
   */
  async findByAffiliate(
    affiliateGuid: string,
    userPrivilege: Privilege,
    organizationGuid?: string,
  ): Promise<OrderResponseDto[]> {
    const operationId = `find_orders_by_affiliate_${Date.now()}`;
    this.logger.log(
      `Finding orders for affiliate: ${affiliateGuid} - Operation: ${operationId}`,
    );

    try {
      // OWNER cannot use this endpoint (they use findByAccount)
      if (userPrivilege === Privilege.OWNER) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Owner privilege cannot query by affiliate',
          affiliateGuid,
          operationId,
        });
      }

      const orders = await this.orderRepository.findByAffiliate(
        affiliateGuid,
        organizationGuid,
        operationId,
      );

      return orders.map((order) =>
        this.orderMapper.mapInternalToResponseDto(order),
      );
    } catch (error) {
      if ((error as { code?: string }).code) {
        throw error;
      }

      this.logger.error(
        `Error finding orders by affiliate: ${affiliateGuid}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to find orders by affiliate',
        affiliateGuid,
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  // ========================================
  // STATUS-BASED QUERIES
  // ========================================

  /**
   * Find orders by order status
   *
   * @param orderStatus - Order status enum
   * @param userPrivilege - User privilege level
   * @param organizationGuid - Organization GUID from JWT
   * @returns Array of order response DTOs
   */
  async findByStatus(
    orderStatus: OrderStatus,
    userPrivilege: Privilege,
    organizationGuid?: string,
  ): Promise<OrderResponseDto[]> {
    const operationId = `find_orders_by_status_${Date.now()}`;
    this.logger.log(
      `Finding orders by status: ${orderStatus} - Operation: ${operationId}`,
    );

    try {
      // OWNER cannot use this endpoint (they use listOrders with filters)
      if (userPrivilege === Privilege.OWNER) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Owner privilege must use listOrders with status filter',
          orderStatus,
          operationId,
        });
      }

      const orders = await this.orderRepository.findByStatus(
        orderStatus,
        organizationGuid,
        operationId,
      );

      return orders.map((order) =>
        this.orderMapper.mapInternalToResponseDto(order),
      );
    } catch (error) {
      if ((error as { code?: string }).code) {
        throw error;
      }

      this.logger.error(
        `Error finding orders by status: ${orderStatus}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to find orders by status',
        orderStatus,
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Find orders by payment status
   *
   * @param paymentStatus - Payment status enum
   * @param userPrivilege - User privilege level
   * @param organizationGuid - Organization GUID from JWT
   * @returns Array of order response DTOs
   */
  async findByPaymentStatus(
    paymentStatus: PaymentStatus,
    userPrivilege: Privilege,
    organizationGuid?: string,
  ): Promise<OrderResponseDto[]> {
    const operationId = `find_orders_by_payment_status_${Date.now()}`;
    this.logger.log(
      `Finding orders by payment status: ${paymentStatus} - Operation: ${operationId}`,
    );

    try {
      // OWNER cannot use this endpoint
      if (userPrivilege === Privilege.OWNER) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message:
            'Owner privilege must use listOrders with payment status filter',
          paymentStatus,
          operationId,
        });
      }

      const orders = await this.orderRepository.findByPaymentStatus(
        paymentStatus,
        organizationGuid,
        operationId,
      );

      return orders.map((order) =>
        this.orderMapper.mapInternalToResponseDto(order),
      );
    } catch (error) {
      if ((error as { code?: string }).code) {
        throw error;
      }

      this.logger.error(
        `Error finding orders by payment status: ${paymentStatus}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to find orders by payment status',
        paymentStatus,
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  // ========================================
  // STATISTICS & AGGREGATIONS
  // ========================================

  /**
   * Get order statistics for organization
   *
   * Aggregates:
   * - Total orders
   * - Orders by status
   * - Orders by payment status
   * - Total revenue (sum of osot_total)
   * - Average order value
   *
   * @param userPrivilege - User privilege level
   * @param organizationGuid - Organization GUID from JWT
   * @returns Order statistics object
   */
  async getOrderStatistics(
    userPrivilege: Privilege,
    organizationGuid?: string,
  ): Promise<OrderStatistics> {
    const operationId = `get_order_statistics_${Date.now()}`;
    this.logger.log(
      `Getting order statistics for organization: ${organizationGuid} - Operation: ${operationId}`,
    );

    try {
      // OWNER cannot access statistics
      if (userPrivilege === Privilege.OWNER) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Owner privilege cannot access order statistics',
          operationId,
        });
      }

      // Check cache
      const cacheKey = `order:stats:${organizationGuid || 'all'}`;
      const cached = await this.cacheService.get<OrderStatistics>(cacheKey);

      if (cached) {
        this.logger.debug('Cache hit for order statistics');
        return cached;
      }

      // Fetch all orders (with organization filter if not MAIN)
      const filters: Record<string, any> = {};
      if (userPrivilege !== Privilege.MAIN && organizationGuid) {
        filters.organizationGuid = organizationGuid;
      }

      const orders = await this.orderRepository.findAll(filters, operationId);

      // Aggregate statistics
      const stats: OrderStatistics = {
        totalOrders: orders.length,
        ordersByStatus: {} as Record<OrderStatus, number>,
        ordersByPaymentStatus: {} as Record<PaymentStatus, number>,
        totalRevenue: 0,
        averageOrderValue: 0,
        organizationGuid: organizationGuid || 'all',
      };

      // Initialize counters
      Object.values(OrderStatus).forEach((status) => {
        stats.ordersByStatus[status] = 0;
      });
      Object.values(PaymentStatus).forEach((status) => {
        stats.ordersByPaymentStatus[status] = 0;
      });

      // Count and sum
      orders.forEach((order) => {
        if (order.osot_order_status) {
          stats.ordersByStatus[order.osot_order_status]++;
        }
        if (order.osot_payment_status) {
          stats.ordersByPaymentStatus[order.osot_payment_status]++;
        }
        stats.totalRevenue += order.osot_total || 0;
      });

      // Calculate average
      stats.averageOrderValue =
        orders.length > 0 ? stats.totalRevenue / orders.length : 0;

      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, stats, this.CACHE_TTL);

      return stats;
    } catch (error) {
      if ((error as { code?: string }).code) {
        throw error;
      }

      this.logger.error('Error getting order statistics', error);
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to get order statistics',
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Check if order exists by ID
   *
   * @param orderId - Order GUID
   * @returns True if exists, false otherwise
   */
  async exists(orderId: string): Promise<boolean> {
    const operationId = `check_order_exists_${Date.now()}`;

    try {
      return await this.orderRepository.exists(orderId, operationId);
    } catch (error) {
      this.logger.error(`Error checking order existence: ${orderId}`, error);
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to check order existence',
        orderId,
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Count orders with filters
   *
   * @param filters - Query filters
   * @returns Total count
   */
  async count(filters: Record<string, any>): Promise<number> {
    const operationId = `count_orders_${Date.now()}`;

    try {
      return await this.orderRepository.count(filters, operationId);
    } catch (error) {
      this.logger.error('Error counting orders', error);
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to count orders',
        operationId,
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Invalidate order cache
   *
   * @param orderId - Order GUID to invalidate
   */
  async invalidateCache(orderId?: string): Promise<void> {
    if (orderId) {
      await this.cacheService.invalidate(`order:${orderId}`);
      this.logger.debug(`Invalidated cache for order: ${orderId}`);
    } else {
      // Invalidate all order-related caches (use pattern matching if available)
      this.logger.debug('Invalidating all order caches');
      // Note: CacheService would need to support pattern-based deletion
      // For now, specific keys are invalidated in CRUD operations
    }
  }
}
