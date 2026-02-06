/**
 * Private Order Controller
 *
 * AUTHENTICATED ACCESS - REQUIRES AUTHENTICATION & AUTHORIZATION
 *
 * ENDPOINTS:
 * - POST /private/orders - Create new order (Main/Admin)
 * - GET /private/orders/:id - Get order by ID (Main/Admin)
 * - GET /private/orders - List all orders with pagination (Main/Admin)
 * - GET /private/orders/status/:status - Filter orders by status (Main/Admin)
 * - GET /private/orders/payment/:paymentStatus - Filter by payment status (Main/Admin)
 * - GET /private/orders/organization/stats - Get organization statistics (Admin only)
 * - PATCH /private/orders/:id - Update order (Main only)
 * - DELETE /private/orders/:id - Soft delete order (Main only)
 * - DELETE /private/orders/:id/permanent - Hard delete order (Main only)
 *
 * SECURITY:
 * - Requires JWT authentication
 * - Role-based access control (Main privilege = 3, Admin privilege = 2)
 * - Organization-level data isolation
 * - Audit logging for all operations
 *
 * PERMISSIONS:
 * - CREATE: Main (privilege = 3), Admin (privilege = 2)
 * - READ: Main (privilege = 3), Admin (privilege = 2)
 * - UPDATE: Main (privilege = 3) only
 * - DELETE: Main (privilege = 3) only
 * - STATISTICS: Admin (privilege = 2) only
 *
 * @file private-order.controller.ts
 * @module OrderModule
 * @layer Controllers
 * @since 2026-01-22
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrderCrudService } from '../services/order-crud.service';
import { OrderLookupService } from '../services/order-lookup.service';
import { OrderBusinessRulesService } from '../services/order-business-rules.service';
import { OrderEventsService } from '../events/order.events';
import { OrderInsuranceOrchestratorService } from '../orchestrator/services/order-insurance.orchestrator.service';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { UpdateOrderDto } from '../dtos/update-order.dto';
import { ListOrdersQueryDto } from '../dtos/list-orders-query.dto';
import { OrderResponseDto } from '../dtos/order-response.dto';
import { Privilege } from '../../../../common/enums';
import { decryptOrganizationId } from '../../../../utils/organization-crypto.util';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Request interface with user data from JWT
 */
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    userGuid: string;
    privilege: Privilege;
    userType: 'account' | 'affiliate';
    organizationId: string;
  };
}

/**
 * Private Order Controller
 * Handles all authenticated order endpoints with proper privilege checks
 */
@Controller('private/orders')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Private Order Operations')
@ApiBearerAuth('JWT-auth')
export class PrivateOrderController {
  private readonly logger = new Logger(PrivateOrderController.name);

  constructor(
    private readonly orderCrudService: OrderCrudService,
    private readonly orderLookupService: OrderLookupService,
    private readonly businessRulesService: OrderBusinessRulesService,
    private readonly eventsService: OrderEventsService,
    private readonly orderInsuranceOrchestrator: OrderInsuranceOrchestratorService,
  ) {}

  // ========================================
  // CREATE
  // ========================================

  /**
   * POST /private/orders
   * Create a new order
   *
   * @param createDto - Order creation data
   * @param req - Authenticated request with user data
   * @returns Created order with navigation links
   * @requires Main privilege (privilege = 3) or Admin privilege (privilege = 2)
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new order',
    description: `
Creates a new order with Main or Admin privilege validation.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 3) OR Admin privilege (privilege = 2)

**REQUIRED FIELDS:**
- osot_account_id: Account identifier (GUID or business ID)
- osot_order_items: Array of order items
- osot_currency: Currency code (CAD, USD)

**OPTIONAL FIELDS:**
- osot_order_status: Order status (default: PENDING)
- osot_payment_status: Payment status (default: PENDING)
- osot_payment_method: Payment method
- osot_notes: Internal notes

**AUTO-CALCULATED FIELDS:**
- osot_order_number: Auto-generated (ORD-XXXXXX)
- osot_subtotal: Sum of order items
- osot_tax_amount: Calculated tax
- osot_total_amount: Subtotal + tax
- osot_created_date: Current timestamp

**BUSINESS RULES:**
- Account must exist and be active
- Order items must reference valid products
- Total amount must match item calculations
- Currency must be valid ISO code
    `,
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data (validation errors).',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Main or Admin privilege required.',
  })
  async create(
    @Body() createDto: CreateOrderDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{
    data: OrderResponseDto;
    message: string;
    _links: Record<string, string>;
  }> {
    const operationId = `create_order_${Date.now()}`;

    try {
      const organizationId = decryptOrganizationId(req.user.organizationId);

      if (
        req.user.privilege !== Privilege.MAIN &&
        req.user.privilege !== Privilege.ADMIN
      ) {
        const err = createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Only Main and Admin users can create orders',
          operationId,
        });
        throw err;
      }

      const validation = this.businessRulesService.validateOrderCreation(
        createDto,
        req.user.privilege,
        req.user.userId,
        organizationId,
        operationId,
      );

      if (!validation.isValid) {
        const err = createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Order validation failed',
          operationId,
          errors: validation.errors,
        });
        throw err;
      }

      const created = await this.orderCrudService.create(
        createDto,
        organizationId,
        operationId,
      );

      // Validate and normalize insurance items (cascade delete rule)
      // If Professional insurance is NOT selected, remove ALL insurance items
      try {
        const removedItems =
          await this.orderInsuranceOrchestrator.validateAndNormalizeInsuranceItems(
            created.id ?? '',
            operationId,
          );

        if (removedItems.length > 0) {
          this.logger.warn(
            `Insurance cascade delete: Removed ${removedItems.length} items (Professional not selected) - Operation: ${operationId}`,
            { orderId: created.id, removedItems },
          );
        }
      } catch (normalizationError) {
        this.logger.error(
          `Insurance normalization failed: ${normalizationError instanceof Error ? normalizationError.message : String(normalizationError)} - Operation: ${operationId}`,
          { orderId: created.id },
        );
        // Continue despite normalization error - order already created
        // Insurance items remain in order for now; frontend should handle validation
      }

      this.eventsService.publishOrderCreated({
        orderId: created.id ?? '',
        orderNumber: created.orderNumber ?? '',
        organizationGuid: created.organizationGuid ?? organizationId,
        accountGuid: created.accountGuid,
        affiliateGuid: created.affiliateGuid,
        osot_total: created.total ?? 0,
        osot_order_status: createDto.orderStatus ?? OrderStatus.DRAFT,
        osot_payment_status: createDto.paymentStatus ?? PaymentStatus.UNPAID,
        createdAt: new Date(),
      });

      this.logger.log(`Order created - Operation: ${operationId}`, {
        orderId: created.id,
        userId: req.user.userId,
      });

      return {
        data: created,
        message: 'Order created successfully',
        _links: {
          self: `/private/orders/${created.id}`,
          list: '/private/orders',
        },
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error creating order - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // READ
  // ========================================

  /**
   * GET /private/orders/:id
   * Get order details by ID
   *
   * @param id - Order identifier (GUID)
   * @param req - Authenticated request with user data
   * @returns Order details
   * @requires Main privilege (privilege = 3) or Admin privilege (privilege = 2)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
    description: `
Returns order details by Dataverse GUID.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 3) OR Admin privilege (privilege = 2)

**INCLUDES:**
- Complete order information
- Order items with product details
- Payment information
- Account information
- Timestamps and audit data

**ORGANIZATION ISOLATION:**
- Only returns orders from authenticated user's organization
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Order GUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Order found.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient privileges.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  async findById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ data: OrderResponseDto; message: string }> {
    const operationId = `find_order_${Date.now()}`;

    try {
      const organizationId = decryptOrganizationId(req.user.organizationId);

      if (req.user.privilege === Privilege.OWNER) {
        const err = createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Only Main and Admin users can view orders',
          operationId,
        });
        throw err;
      }

      const order = await this.orderLookupService.findById(
        id,
        req.user.privilege,
        req.user.userId,
        organizationId,
      );

      if (!order) {
        const err = createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Order not found',
          operationId,
        });
        throw err;
      }

      return {
        data: order,
        message: 'Order retrieved successfully',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error finding order - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * GET /private/orders
   * List all orders with pagination and filtering
   *
   * @param query - Query parameters (page, limit, filters, sorting)
   * @param req - Authenticated request with user data
   * @returns Paginated list of orders
   * @requires Main privilege (privilege = 3) or Admin privilege (privilege = 2)
   */
  @Get()
  @ApiOperation({
    summary: 'List all orders (paginated)',
    description: `
Returns a paginated list of orders with optional filtering and sorting.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 3) OR Admin privilege (privilege = 2)

**FILTERS:**
- status: Filter by order status (PENDING, PROCESSING, COMPLETED, etc.)
- paymentStatus: Filter by payment status (PENDING, PAID, FAILED, etc.)
- accountId: Filter by specific account
- startDate: Filter orders created after date
- endDate: Filter orders created before date

**PAGINATION:**
- page: Page number (default: 1)
- limit: Items per page (default: 20, max: 100)

**SORTING:**
- orderBy: Field name (e.g., "osot_created_date", "osot_total_amount")
- sortOrder: "asc" or "desc" (default: "desc")

**RESPONSE METADATA:**
- total: Total number of orders matching filters
- page: Current page number
- limit: Items per page
- pages: Total number of pages

**ORGANIZATION ISOLATION:**
- Only returns orders from authenticated user's organization
    `,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient privileges.',
  })
  async listOrders(
    @Query() query: ListOrdersQueryDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ data: OrderResponseDto[]; pagination: any; message: string }> {
    const operationId = `list_orders_${Date.now()}`;

    try {
      const organizationId = decryptOrganizationId(req.user.organizationId);

      if (req.user.privilege === Privilege.OWNER) {
        const err = createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Only Main and Admin users can list orders',
          operationId,
        });
        throw err;
      }

      const result = await this.orderLookupService.listOrders(
        query,
        req.user.privilege,
        req.user.userId,
        organizationId,
      );

      return {
        data: result.orders,
        pagination: result.pagination,
        message: 'Orders retrieved successfully',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error listing orders - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * GET /private/orders/status/:status
   * Filter orders by order status
   *
   * @param status - Order status to filter by
   * @param req - Authenticated request with user data
   * @returns Array of matching orders
   * @requires Main privilege (privilege = 3) or Admin privilege (privilege = 2)
   */
  @Get('status/:status')
  @ApiOperation({
    summary: 'List orders by status',
    description: `
Returns orders filtered by order status.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 3) OR Admin privilege (privilege = 2)

**STATUS VALUES:**
- PENDING: Order created, awaiting processing
- PROCESSING: Order being fulfilled
- COMPLETED: Order successfully fulfilled
- CANCELLED: Order cancelled by user or admin
- REFUNDED: Order refunded

**ORGANIZATION ISOLATION:**
- Only returns orders from authenticated user's organization
    `,
  })
  @ApiParam({
    name: 'status',
    type: 'string',
    description: 'Order status',
    example: 'PENDING',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient privileges.',
  })
  async findByStatus(
    @Param('status') status: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ data: OrderResponseDto[]; message: string }> {
    const operationId = `find_orders_by_status_${Date.now()}`;

    try {
      const organizationId = decryptOrganizationId(req.user.organizationId);

      if (req.user.privilege === Privilege.OWNER) {
        const err = createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Only Main and Admin users can list orders',
          operationId,
        });
        throw err;
      }

      const orderStatus = status as unknown as OrderStatus;
      const orders = await this.orderLookupService.findByStatus(
        orderStatus,
        req.user.privilege,
        organizationId,
      );

      return {
        data: orders,
        message: `Orders with status '${status}' retrieved successfully`,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error finding orders by status - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * GET /private/orders/payment/:paymentStatus
   * Filter orders by payment status
   *
   * @param paymentStatus - Payment status to filter by
   * @param req - Authenticated request with user data
   * @returns Array of matching orders
   * @requires Main privilege (privilege = 3) or Admin privilege (privilege = 2)
   */
  @Get('payment/:paymentStatus')
  @ApiOperation({
    summary: 'List orders by payment status',
    description: `
Returns orders filtered by payment status.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 3) OR Admin privilege (privilege = 2)

**PAYMENT STATUS VALUES:**
- PENDING: Payment not yet processed
- PROCESSING: Payment being processed
- PAID: Payment completed successfully
- FAILED: Payment failed
- REFUNDED: Payment refunded to customer

**USE CASES:**
- Financial reconciliation
- Identifying failed payments
- Tracking pending payments
- Refund management

**ORGANIZATION ISOLATION:**
- Only returns orders from authenticated user's organization
    `,
  })
  @ApiParam({
    name: 'paymentStatus',
    type: 'string',
    description: 'Payment status',
    example: 'PAID',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Insufficient privileges.',
  })
  async findByPaymentStatus(
    @Param('paymentStatus') paymentStatus: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ data: OrderResponseDto[]; message: string }> {
    const operationId = `find_orders_by_payment_status_${Date.now()}`;

    try {
      const organizationId = decryptOrganizationId(req.user.organizationId);

      if (req.user.privilege === Privilege.OWNER) {
        const err = createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Only Main and Admin users can list orders',
          operationId,
        });
        throw err;
      }

      const payStatus = paymentStatus as unknown as PaymentStatus;
      const orders = await this.orderLookupService.findByPaymentStatus(
        payStatus,
        req.user.privilege,
        organizationId,
      );

      return {
        data: orders,
        message: `Orders with payment status '${paymentStatus}' retrieved successfully`,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error finding orders by payment status - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * GET /private/orders/organization/stats
   * Get organization order statistics
   *
   * @param req - Authenticated request with user data
   * @returns Statistics object with order metrics
   * @requires Admin privilege (privilege = 2) ONLY
   */
  @Get('organization/stats')
  @ApiOperation({
    summary: 'Get organization statistics',
    description: `
Returns order statistics for the authenticated user's organization.

**PERMISSION REQUIRED:**
- Admin privilege (privilege = 2) ONLY
- Main users are NOT allowed (business compliance requirement)

**STATISTICS INCLUDE:**
- Total number of orders
- Orders by status breakdown
- Orders by payment status breakdown
- Total revenue (sum of completed orders)
- Average order value
- Orders by month (last 12 months)
- Top products by order count

**USE CASES:**
- Admin dashboard metrics
- Financial reporting
- Business intelligence
- Performance monitoring

**ORGANIZATION ISOLATION:**
- Only returns statistics for authenticated user's organization
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          properties: {
            totalOrders: { type: 'number', example: 1250 },
            totalRevenue: { type: 'number', example: 125000.5 },
            averageOrderValue: { type: 'number', example: 100.0 },
            ordersByStatus: {
              type: 'object',
              example: {
                PENDING: 45,
                PROCESSING: 23,
                COMPLETED: 1150,
                CANCELLED: 32,
              },
            },
            ordersByPaymentStatus: {
              type: 'object',
              example: {
                PENDING: 50,
                PAID: 1180,
                FAILED: 15,
                REFUNDED: 5,
              },
            },
          },
        },
        message: {
          type: 'string',
          example: 'Statistics retrieved successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privilege required.',
  })
  async getOrganizationStats(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ data: any; message: string }> {
    const operationId = `get_org_stats_${Date.now()}`;

    try {
      const organizationId = decryptOrganizationId(req.user.organizationId);

      if (req.user.privilege !== Privilege.ADMIN) {
        const err = createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Only Admin users can view organization statistics',
          operationId,
        });
        throw err;
      }

      const stats = await this.orderLookupService.getOrderStatistics(
        req.user.privilege,
        organizationId,
      );

      return {
        data: stats,
        message: 'Statistics retrieved successfully',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error getting organization stats - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // UPDATE
  // ========================================

  /**
   * PATCH /private/orders/:id
   * Update existing order
   *
   * @param id - Order identifier (GUID)
   * @param updateDto - Order update data
   * @param req - Authenticated request with user data
   * @returns Updated order
   * @requires Main privilege (privilege = 3) ONLY
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update order',
    description: `
Updates an existing order with Main privilege validation.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 3) ONLY
- Admin users are NOT allowed (compliance requirement)

**UPDATABLE FIELDS:**
- osot_order_status: Change order status
- osot_payment_status: Update payment status
- osot_payment_method: Modify payment method
- osot_notes: Update internal notes
- osot_order_items: Modify order items (triggers recalculation)

**AUTO-RECALCULATED FIELDS:**
- osot_subtotal: Recalculated if items change
- osot_tax_amount: Recalculated if items change
- osot_total_amount: Recalculated if items change
- modifiedon: Automatically updated by Dataverse

**BUSINESS RULES:**
- Cannot update orders with status COMPLETED or CANCELLED
- Payment status transitions must follow valid flow
- Order items changes require product validation
- Total amount must match recalculated values

**PARTIAL UPDATES:**
- Only provided fields are updated
- Omitted fields remain unchanged
- Empty strings are treated as actual updates (not skipped)
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Order GUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({ type: UpdateOrderDto })
  @ApiResponse({
    status: 200,
    description: 'Order updated successfully.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data (validation errors).',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ data: OrderResponseDto; message: string }> {
    const operationId = `update_order_${Date.now()}`;

    try {
      const organizationId = decryptOrganizationId(req.user.organizationId);

      if (req.user.privilege !== Privilege.MAIN) {
        const err = createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Only Main users can update orders',
          operationId,
        });
        throw err;
      }

      const currentOrder = await this.orderLookupService.findById(
        id,
        req.user.privilege,
        req.user.userId,
        organizationId,
      );

      if (!currentOrder) {
        const err = createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Order not found',
          operationId,
        });
        throw err;
      }

      const validation = await this.businessRulesService.validateOrderUpdate(
        id,
        updateDto,
        req.user.privilege,
        req.user.userId,
        organizationId,
        operationId,
      );

      if (!validation.isValid) {
        const err = createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Order update validation failed',
          operationId,
          errors: validation.errors,
        });
        throw err;
      }

      const updated = await this.orderCrudService.update(
        id,
        updateDto,
        organizationId,
        operationId,
      );

      this.eventsService.publishOrderUpdated({
        orderId: updated.id ?? id,
        orderNumber: updated.orderNumber ?? '',
        organizationGuid: updated.organizationGuid ?? organizationId,
        accountGuid: updated.accountGuid ?? currentOrder.accountGuid,
        affiliateGuid: updated.affiliateGuid ?? currentOrder.affiliateGuid,
        osot_total: updated.total ?? 0,
        previousStatus: currentOrder.orderStatus as unknown as
          | OrderStatus
          | undefined,
        currentStatus: updateDto.orderStatus,
        previousPaymentStatus: currentOrder.paymentStatus as unknown as
          | PaymentStatus
          | undefined,
        currentPaymentStatus: updateDto.paymentStatus,
        changedFields: Object.keys(updateDto || {}),
        updatedAt: new Date(),
      });

      return {
        data: updated,
        message: 'Order updated successfully',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error updating order - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // DELETE
  // ========================================

  /**
   * DELETE /private/orders/:id
   * Soft delete order (sets status to CANCELLED)
   *
   * @param id - Order identifier (GUID)
   * @param req - Authenticated request with user data
   * @returns Success message
   * @requires Main privilege (privilege = 3) ONLY
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft delete order',
    description: `
Soft deletes an order by setting status to CANCELLED.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 3) ONLY

**SOFT DELETE BEHAVIOR:**
- Sets osot_order_status to CANCELLED
- Order data is preserved in database
- Can be tracked for audit purposes
- Cannot be undone (use UPDATE to change status instead)

**BUSINESS RULES:**
- Cannot delete orders with status COMPLETED
- Cannot delete orders with payment status PAID (must refund first)
- Checks for dependencies and business constraints

**AUDIT TRAIL:**
- Publishes OrderDeletedEvent for tracking
- Logs deletion with user ID and timestamp

**NOTE:** This is a reversible operation. Use DELETE /:id/permanent for permanent deletion.
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Order GUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Order soft deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Order deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete - business rule violation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const operationId = `delete_order_${Date.now()}`;

    try {
      const organizationId = decryptOrganizationId(req.user.organizationId);

      if (req.user.privilege !== Privilege.MAIN) {
        const err = createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Only Main users can delete orders',
          operationId,
        });
        throw err;
      }

      const currentOrder = await this.orderLookupService.findById(
        id,
        req.user.privilege,
        req.user.userId,
        organizationId,
      );

      if (!currentOrder) {
        const err = createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Order not found',
          operationId,
        });
        throw err;
      }

      const validation = await this.businessRulesService.validateOrderDeletion(
        id,
        req.user.privilege,
        organizationId,
        operationId,
      );

      if (!validation.isValid) {
        const err = createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Order cannot be deleted',
          operationId,
          errors: validation.errors,
        });
        throw err;
      }

      await this.orderCrudService.delete(id, organizationId, operationId);

      this.eventsService.publishOrderDeleted({
        orderId: currentOrder?.id ?? id,
        orderNumber: currentOrder?.orderNumber ?? '',
        organizationGuid: currentOrder?.organizationGuid ?? organizationId,
        accountGuid: currentOrder?.accountGuid,
        affiliateGuid: currentOrder?.affiliateGuid,
        osot_total: currentOrder?.total ?? 0,
        osot_order_status: currentOrder?.orderStatus as unknown as
          | OrderStatus
          | undefined,
        osot_payment_status: currentOrder?.paymentStatus as unknown as
          | PaymentStatus
          | undefined,
        deletedAt: new Date(),
        hardDelete: false,
      });

      return {
        message: 'Order deleted successfully',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error deleting order - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * DELETE /private/orders/:id/permanent
   * Permanently delete order from database
   *
   * @param id - Order identifier (GUID)
   * @param req - Authenticated request with user data
   * @returns Success message
   * @requires Main privilege (privilege = 3) ONLY
   */
  @Delete(':id/permanent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Permanently delete order (IRREVERSIBLE)',
    description: `
Permanently deletes an order from the database.

**⚠️ WARNING: IRREVERSIBLE OPERATION ⚠️**
This action cannot be undone. All order data will be permanently removed.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 3) ONLY

**HARD DELETE BEHAVIOR:**
- Permanently removes order record from database
- All order data is lost forever
- Cannot be recovered or reactivated
- Checks for dependencies before deletion

**BUSINESS RULES:**
- Cannot delete orders with status COMPLETED
- Cannot delete orders with payment status PAID
- Cannot delete orders with related invoices or shipments
- Must meet all business constraints for permanent deletion

**USE CASES:**
- Complete cleanup of test/demo orders
- Compliance with data deletion requests
- Removing orders created in error
- GDPR/data privacy compliance

**RECOMMENDATION:**
- Use soft delete (DELETE /:id) in most cases
- Only use hard delete when absolutely necessary
- Always backup data before hard delete
- Confirm with user before executing

**AUDIT TRAIL:**
- Publishes OrderDeletedEvent for tracking
- Logs permanent deletion with user ID and timestamp
    `,
  })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: 'Order GUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Order permanently deleted.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Order permanently deleted',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Cannot delete - business rule violation or dependencies exist.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  async hardDelete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    const operationId = `hard_delete_order_${Date.now()}`;

    try {
      const organizationId = decryptOrganizationId(req.user.organizationId);

      if (req.user.privilege !== Privilege.MAIN) {
        const err = createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Only Main users can permanently delete orders',
          operationId,
        });
        throw err;
      }

      const currentOrder = await this.orderLookupService.findById(
        id,
        req.user.privilege,
        req.user.userId,
        organizationId,
      );

      if (!currentOrder) {
        const err = createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Order not found',
          operationId,
        });
        throw err;
      }

      const validation = await this.businessRulesService.validateOrderDeletion(
        id,
        req.user.privilege,
        organizationId,
        operationId,
      );

      if (!validation.isValid) {
        const err = createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Order cannot be permanently deleted',
          operationId,
          errors: validation.errors,
        });
        throw err;
      }

      const success = await this.orderCrudService.hardDelete(id, operationId);

      if (!success) {
        const err = createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Failed to permanently delete order',
          operationId,
        });
        throw err;
      }

      this.eventsService.publishOrderDeleted({
        orderId: currentOrder?.id ?? id,
        orderNumber: currentOrder?.orderNumber ?? '',
        organizationGuid: currentOrder?.organizationGuid ?? organizationId,
        accountGuid: currentOrder?.accountGuid,
        affiliateGuid: currentOrder?.affiliateGuid,
        osot_total: currentOrder?.total ?? 0,
        osot_order_status: currentOrder?.orderStatus as unknown as
          | OrderStatus
          | undefined,
        osot_payment_status: currentOrder?.paymentStatus as unknown as
          | PaymentStatus
          | undefined,
        deletedAt: new Date(),
        hardDelete: true,
      });

      return {
        message: 'Order permanently deleted',
      };
    } catch (error: unknown) {
      this.logger.error(
        `Error hard deleting order - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }
}
