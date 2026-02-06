/**
 * Order Draft Service
 *
 * Handles automatic creation of DRAFT orders for e-commerce workflow.
 * When user opens product selection screen, a DRAFT order is created
 * automatically if one doesn't exist.
 *
 * E-commerce Pattern:
 * 1. User opens shop → DRAFT order created (if not exists)
 * 2. User browses products → Adds items to existing DRAFT
 * 3. User checkout → DRAFT → FINALIZED
 *
 * @file order-draft.service.ts
 * @module OrderProductModule
 * @layer Services/Helpers
 */

import { Injectable, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { OrderCrudService } from '../../order/services/order-crud.service';
import { OrderLookupService } from '../../order/services/order-lookup.service';
import { CreateOrderDto } from '../../order/dtos/create-order.dto';
import { OrderStatus } from '../../order/enum/order-status.enum';
import { PaymentStatus } from '../../order/enum/payment-status.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * This service bridges OrderProduct (cart) with Order (DRAFT order creation).
 * It abstracts the logic for getting/creating draft orders in the e-commerce workflow.
 */
@Injectable()
export class OrderDraftService {
  private readonly logger = new Logger(OrderDraftService.name);

  constructor(
    private readonly orderCrudService: OrderCrudService,
    private readonly orderLookupService: OrderLookupService,
  ) {}

  /**
   * Get or create DRAFT order for user
   *
   * Implements e-commerce pattern:
   * - If user has existing DRAFT order → return it
   * - If no DRAFT order exists → create new one
   *
   * Called when:
   * - User opens shop/product selection screen
   * - User navigates back to shop after leaving
   *
   * @param userId - User account GUID (accountGuid or affiliateGuid depending on user type)
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Order GUID of DRAFT order
   *
   * @example
   * ```typescript
   * // Frontend: GET /shop
   * // Backend intercepts, checks for draft order
   * const draftOrderGuid = await orderDraftService.getOrCreateDraft(userId, orgGuid);
   * // Frontend gets draftOrderGuid and uses it for addToCart calls
   * // POST /orders/{draftOrderGuid}/items
   * ```
   */
  async getOrCreateDraft(
    userId: string,
    organizationGuid: string,
  ): Promise<string> {
    const operationId = `get_or_create_draft_${Date.now()}`;

    try {
      this.logger.log(
        `Getting or creating DRAFT order for user ${userId} - Operation: ${operationId}`,
      );

      // Step 1: Check if DRAFT order already exists for this user
      const existingOrders = await this.orderLookupService.listOrders(
        { orderStatus: OrderStatus.DRAFT },
        Privilege.OWNER, // OWNER privilege - can see own orders
        userId, // Filter by this user
        organizationGuid,
      );

      if (existingOrders.orders && existingOrders.orders.length > 0) {
        const draftOrderId = existingOrders.orders[0].id;
        this.logger.log(
          `Found existing DRAFT order ${draftOrderId} for user ${userId} - Operation: ${operationId}`,
        );
        return draftOrderId || '';
      }

      // Step 2: No DRAFT exists, create a new one
      this.logger.log(
        `No existing DRAFT order found. Creating new one for user ${userId} - Operation: ${operationId}`,
      );

      const createDto: CreateOrderDto = {
        accountGuid: userId, // Assume user is Account for now
        // TODO: Detect if user is Affiliate and use affiliateGuid instead
        organizationGuid,
        orderStatus: OrderStatus.DRAFT,
        paymentStatus: PaymentStatus.UNPAID,
        subtotal: 0, // Will be calculated as items added
        total: 0, // Will be calculated as items added
        products: [], // Empty cart - items added via addToCart
      };

      const created = await this.orderCrudService.create(
        createDto,
        organizationGuid,
        operationId,
      );

      this.logger.log(
        `Created new DRAFT order ${created.id} for user ${userId} - Operation: ${operationId}`,
      );

      return created.id || '';
    } catch (error) {
      this.logger.error(
        `Error getting or creating DRAFT order for user ${userId} - Operation: ${operationId}`,
        error,
      );

      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to get or create DRAFT order',
        operationId,
        userId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Clear expired DRAFT orders
   *
   * Background job to clean up old DRAFT orders
   * that users abandoned
   *
   * Can be called:
   * - Via scheduled task (e.g., every hour)
   * - Manually via admin endpoint
   *
   * @param maxAgeHours - Delete DRAFT orders older than this (default: 24 hours)
   * @returns Number of orders deleted
   */
  clearExpiredDrafts(maxAgeHours: number = 24): Promise<number> {
    const operationId = `clear_expired_drafts_${Date.now()}`;

    try {
      this.logger.log(
        `Clearing DRAFT orders older than ${maxAgeHours} hours - Operation: ${operationId}`,
      );

      // NOTE: Implementation
      // 1. Query orders with osot_status = "DRAFT"
      // 2. Filter by createdon < (now - maxAgeHours)
      // 3. Delete them
      // 4. Return count

      // Placeholder
      return Promise.resolve(0);
    } catch (error) {
      this.logger.error(
        `Error clearing expired drafts - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }
}
