/**
 * Order Product Orchestrator Service
 *
 * Implements Redis staging pattern for order products:
 * 1. User adds items to cart → Stored in Redis (fast, temporary)
 * 2. User reviews cart → All validations in Redis
 * 3. User checkout → Atomic commit to Dataverse
 *
 * Benefits:
 * - No orphaned data in Dataverse if user abandons cart
 * - Rollback is simple (delete Redis key)
 * - Complete validation before DB commit
 * - Better performance (multiple adds don't hit DB)
 *
 * Redis Keys:
 * - order:${orderGuid}:items:${itemId} → OrderProductInternal
 * - order:${orderGuid}:itemIds → List of item IDs
 *
 * @file order-product-orchestrator.service.ts
 * @module OrderProductModule
 * @layer Services/Orchestration
 */

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataverseOrderProductRepository } from '../repositories';
import { OrderProductLookupService } from './order-product-lookup.service';
import { OrderProductBusinessRuleService } from './order-product-business-rules.service';
import { ProductLookupService } from '../../product/services/product-lookup.service';
import { OrderProductMapper } from '../mappers/order-product.mapper';
import { OrderProductEventsService } from '../events/order-product-events.service';
import { CreateOrderProductDto } from '../dtos/create-order-product.dto';
import { OrderProductResponseDto } from '../dtos/order-product-response.dto';
import { OrderProductInternal } from '../interfaces';
import { RedisService } from '../../../../redis/redis.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  InsuranceType,
  getInsuranceTypeDisplayName,
} from '../../product/enums/insurance-type.enum';

@Injectable()
export class OrderProductOrchestratorService {
  private readonly logger = new Logger(OrderProductOrchestratorService.name);

  // Redis TTL: 2 hours (user has 2 hours to checkout)
  private readonly CART_SESSION_TTL = 7200;

  constructor(
    private readonly redisService: RedisService,
    private readonly orderProductRepository: DataverseOrderProductRepository,
    private readonly orderProductLookupService: OrderProductLookupService,
    private readonly orderProductBusinessRuleService: OrderProductBusinessRuleService,
    private readonly productLookupService: ProductLookupService,
    private readonly eventsService: OrderProductEventsService,
  ) {}

  /**
   * Add item to cart (staging in Redis)
   * Does NOT persist to Dataverse yet
   *
   * @param orderGuid - Parent Order GUID
   * @param dto - CreateOrderProductDto (productId, quantity)
   * @param userId - User making the purchase
   * @returns OrderProductResponseDto with temp item
   */
  async addToCart(
    orderGuid: string,
    dto: CreateOrderProductDto,
    _userId: string,
  ): Promise<OrderProductResponseDto> {
    const operationId = `add_to_cart_${Date.now()}`;
    const sessionKey = this.getSessionKey(orderGuid);

    try {
      this.logger.log(
        `Adding item to cart - Order: ${orderGuid}, Product: ${dto.osot_product_id} - Operation: ${operationId}`,
      );

      // 1️⃣ VALIDATE WITH BUSINESS RULES
      const validation =
        await this.orderProductBusinessRuleService.validateOrderProductForCreation(
          dto,
          orderGuid,
        );

      if (!validation.isValid) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Validação de item de pedido falhou',
          errors: validation.errors,
          operationId,
        });
      }

      // 2️⃣ LOOKUP PRODUCT (always fresh data)
      const product = await this.productLookupService.findById(
        dto.osot_product_id,
      );

      if (!product) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: `Produto '${dto.osot_product_id}' não encontrado`,
          operationId,
          productId: dto.osot_product_id,
        });
      }

      // 3️⃣ CREATE SNAPSHOT (product data frozen at this moment)
      const internal = OrderProductMapper.mapCreateDtoToInternal(dto);
      internal.orderGuid = orderGuid;

      const productData = product as unknown as Record<string, unknown>;
      internal.osot_product_id = (productData.osot_table_productid ??
        productData.osot_product_id) as string;
      internal.osot_product_name = (productData.osot_product_name ??
        productData.osot_name) as string;
      const insuranceTypeValue = (productData.insuranceType ??
        productData.osot_insurance_type) as InsuranceType | undefined;
      if (insuranceTypeValue !== undefined && insuranceTypeValue !== null) {
        internal.osot_insurance_type =
          getInsuranceTypeDisplayName(insuranceTypeValue);
      }

      const insuranceLimitValue = (productData.insuranceLimit ??
        productData.osot_insurance_limit) as number | undefined;
      if (insuranceLimitValue !== undefined) {
        internal.osot_insurance_limit = insuranceLimitValue;
      }

      const productAdditionalInfo = (productData.productAdditionalInfo ??
        productData.osot_product_additional_info) as string | undefined;
      if (productAdditionalInfo !== undefined) {
        internal.osot_product_additional_info = productAdditionalInfo;
      }
      internal.osot_selectedprice = (productData.displayPrice ??
        productData.osot_product_price) as number;
      internal.osot_producttax = (productData.osot_tax_rate ?? 0) as number;

      // 4️⃣ CALCULATE AMOUNTS
      const subtotal = internal.osot_selectedprice * internal.osot_quantity;
      const taxAmount = subtotal * (internal.osot_producttax / 100);
      const total = subtotal + taxAmount;

      internal.osot_itemsubtotal = subtotal;
      internal.osot_taxamount = taxAmount;
      internal.osot_itemtotal = total;

      // 5️⃣ VALIDATE CALCULATIONS
      const calcValidation =
        this.orderProductBusinessRuleService.validateCalculations(
          internal.osot_quantity,
          internal.osot_selectedprice,
          internal.osot_producttax,
          internal.osot_itemsubtotal,
          internal.osot_taxamount,
          internal.osot_itemtotal,
        );

      if (!calcValidation.isValid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Cálculos de valores inconsistentes',
          errors: calcValidation.errors,
          operationId,
        });
      }

      // 6️⃣ STORE IN REDIS (staging layer)
      const itemId = uuid();
      const itemKey = `${sessionKey}:items:${itemId}`;

      // Serialize to JSON (RedisService expects string values)
      await this.redisService.set(itemKey, JSON.stringify(internal), {
        EX: this.CART_SESSION_TTL,
      });

      // Store item ID in a JSON array
      const itemIdsKey = `${sessionKey}:itemIds`;
      const existingIds = await this.redisService.get(itemIdsKey);
      const idsList = (existingIds ? JSON.parse(existingIds) : []) as string[];
      idsList.push(itemId);
      await this.redisService.set(itemIdsKey, JSON.stringify(idsList), {
        EX: this.CART_SESSION_TTL,
      });

      // Update cart total in Redis
      const currentTotal = await this.getCartTotal(orderGuid);
      await this.redisService.set(
        `${sessionKey}:total`,
        JSON.stringify(currentTotal),
        { EX: this.CART_SESSION_TTL },
      );

      this.logger.log(
        `Item added to cart: ${itemId} - Operation: ${operationId}`,
      );

      // 7️⃣ PUBLISH EVENT (snapshot captured)
      this.eventsService.publishSnapshotCaptured(
        orderGuid,
        internal.osot_product_id || '',
        internal.osot_product_name || '',
        internal.osot_insurance_type,
        internal.osot_insurance_limit,
        internal.osot_product_additional_info,
        internal.osot_selectedprice || 0,
        internal.osot_producttax || 0,
        _userId,
        '',
      );

      // 8️⃣ PUBLISH EVENT (product added)
      this.eventsService.publishProductAdded(
        orderGuid,
        internal.osot_product_id || '',
        internal.osot_quantity || 0,
        internal.osot_selectedprice || 0,
        internal.osot_producttax || 0,
        _userId,
        '',
      );

      return OrderProductMapper.mapInternalToResponseDto(
        internal as OrderProductInternal,
      );
    } catch (error) {
      this.logger.error(
        `Error adding to cart - Order: ${orderGuid} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get all items in cart (from Redis)
   *
   * @param orderGuid - Order GUID
   * @returns Array of OrderProductInternal items
   */
  async getCartItems(orderGuid: string): Promise<OrderProductInternal[]> {
    const operationId = `get_cart_items_${Date.now()}`;
    const sessionKey = this.getSessionKey(orderGuid);

    try {
      const itemIdsJson = await this.redisService.get(`${sessionKey}:itemIds`);
      const itemIds = (itemIdsJson ? JSON.parse(itemIdsJson) : []) as string[];

      const items: OrderProductInternal[] = [];

      for (const itemId of itemIds) {
        const itemJson = await this.redisService.get(
          `${sessionKey}:items:${itemId}`,
        );
        if (itemJson) {
          items.push(JSON.parse(itemJson) as OrderProductInternal);
        }
      }

      this.logger.log(
        `Retrieved ${items.length} items from cart - Operation: ${operationId}`,
      );

      return items;
    } catch (error) {
      this.logger.error(
        `Error getting cart items - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Erro ao recuperar carrinho',
        operationId,
      });
    }
  }

  /**
   * Get cart total (from Redis)
   *
   * @param orderGuid - Order GUID
   * @returns Cart total amount
   */
  async getCartTotal(orderGuid: string): Promise<number> {
    const sessionKey = this.getSessionKey(orderGuid);
    const items = await this.getCartItems(orderGuid);

    const total = items.reduce((sum, item) => sum + item.osot_itemtotal, 0);

    await this.redisService.set(`${sessionKey}:total`, JSON.stringify(total), {
      EX: this.CART_SESSION_TTL,
    });

    return total;
  }

  /**
   * Checkout - Persist ALL items to Dataverse
   * Only called when user confirms purchase
   *
   * @param orderGuid - Order GUID
   * @returns Array of created OrderProductResponseDto
   */
  async checkout(orderGuid: string): Promise<OrderProductResponseDto[]> {
    const operationId = `checkout_${Date.now()}`;

    try {
      this.logger.log(
        `Checkout started - Order: ${orderGuid} - Operation: ${operationId}`,
      );

      // 1️⃣ GET ALL ITEMS FROM REDIS
      const items = await this.getCartItems(orderGuid);

      if (items.length === 0) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Carrinho vazio',
          operationId,
        });
      }

      this.logger.log(
        `Checkout: ${items.length} items to persist - Operation: ${operationId}`,
      );

      // 2️⃣ FINAL VALIDATIONS BEFORE COMMIT
      for (const item of items) {
        const calcValidation =
          this.orderProductBusinessRuleService.validateCalculations(
            item.osot_quantity,
            item.osot_selectedprice,
            item.osot_producttax,
            item.osot_itemsubtotal,
            item.osot_taxamount,
            item.osot_itemtotal,
          );

        if (!calcValidation.isValid) {
          throw createAppError(ErrorCodes.VALIDATION_ERROR, {
            message: 'Cálculos inconsistentes detectados no checkout',
            errors: calcValidation.errors,
            operationId,
            productId: item.osot_product_id,
          });
        }
      }

      // 3️⃣ PERSIST ALL ITEMS TO DATAVERSE (atomic batch)
      const createdItems = await Promise.all(
        items.map((item) =>
          this.orderProductRepository.create({
            ...item,
            orderGuid,
          }),
        ),
      );

      this.logger.log(
        `Persisted ${createdItems.length} items to Dataverse - Operation: ${operationId}`,
      );

      // 4️⃣ PUBLISH EVENT (checkout completed)
      const totalItems = items.length;
      const subtotal = items.reduce(
        (sum, item) => sum + item.osot_itemsubtotal,
        0,
      );
      const taxAmount = items.reduce(
        (sum, item) => sum + item.osot_taxamount,
        0,
      );
      const total = items.reduce((sum, item) => sum + item.osot_itemtotal, 0);

      this.eventsService.publishCheckoutCompleted(
        orderGuid,
        totalItems,
        subtotal,
        taxAmount,
        total,
        'system', // userId not available in this context
        '',
      );

      // 5️⃣ CLEAN UP REDIS (success)
      await this.clearCart(orderGuid);

      // 6️⃣ RETURN RESPONSE
      return createdItems.map((item) =>
        OrderProductMapper.mapInternalToResponseDto(item),
      );
    } catch (error) {
      this.logger.error(
        `Checkout failed - Order: ${orderGuid} - Operation: ${operationId}`,
        error,
      );

      // PUBLISH EVENT (checkout failed)
      this.eventsService.publishCheckoutFailed(
        orderGuid,
        error instanceof Error ? error.message : String(error),
        'system',
        '',
      );

      // NOTE: Redis session is NOT deleted on error
      // User can retry checkout or abandon cart (TTL cleanup)
      throw error;
    }
  }

  /**
   * Remove item from cart
   *
   * @param orderGuid - Order GUID
   * @param itemId - Item ID to remove
   */
  async removeFromCart(orderGuid: string, itemId: string): Promise<void> {
    const operationId = `remove_from_cart_${Date.now()}`;
    const sessionKey = this.getSessionKey(orderGuid);

    try {
      this.logger.log(
        `Removing item ${itemId} from cart - Operation: ${operationId}`,
      );

      // Get item data before removing (for event)
      const itemKey = `${sessionKey}:items:${itemId}`;
      const itemJson = await this.redisService.get(itemKey);
      const item = itemJson
        ? (JSON.parse(itemJson) as OrderProductInternal)
        : null;

      // Remove item data
      await this.redisService.del(itemKey);

      // Remove item ID from list
      const itemIdsKey = `${sessionKey}:itemIds`;
      const itemIdsJson = await this.redisService.get(itemIdsKey);
      const idsList = (itemIdsJson ? JSON.parse(itemIdsJson) : []) as string[];
      const updatedIds = idsList.filter((id) => id !== itemId);
      await this.redisService.set(itemIdsKey, JSON.stringify(updatedIds), {
        EX: this.CART_SESSION_TTL,
      });

      // Recalculate total
      const newTotal = await this.getCartTotal(orderGuid);

      this.logger.log(
        `Item removed from cart - New total: ${newTotal} - Operation: ${operationId}`,
      );

      // PUBLISH EVENT (product removed)
      if (item) {
        this.eventsService.publishProductRemoved(
          orderGuid,
          item.osot_product_id,
          item.osot_quantity,
          item.osot_selectedprice,
          'system',
          '',
        );
      }
    } catch (error) {
      this.logger.error(
        `Error removing item from cart - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Erro ao remover item do carrinho',
        operationId,
        itemId,
      });
    }
  }

  /**
   * Clear entire cart (used after checkout or explicit user action)
   *
   * @param orderGuid - Order GUID
   */
  async clearCart(orderGuid: string): Promise<void> {
    const operationId = `clear_cart_${Date.now()}`;
    const sessionKey = this.getSessionKey(orderGuid);

    try {
      this.logger.log(`Clearing cart - Operation: ${operationId}`);

      // Get all item IDs
      const itemIdsJson = await this.redisService.get(`${sessionKey}:itemIds`);
      const idsList = (itemIdsJson ? JSON.parse(itemIdsJson) : []) as string[];

      // Delete each item data
      for (const itemId of idsList) {
        await this.redisService.del(`${sessionKey}:items:${itemId}`);
      }

      // Delete item IDs list
      await this.redisService.del(`${sessionKey}:itemIds`);

      // Delete total
      await this.redisService.del(`${sessionKey}:total`);

      this.logger.log(`Cart cleared - Operation: ${operationId}`);

      // PUBLISH EVENT (cart cleared)
      this.eventsService.publishCartCleared(
        orderGuid,
        idsList.length,
        'system',
        '',
      );
    } catch (error) {
      this.logger.error(
        `Error clearing cart - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Erro ao limpar carrinho',
        operationId,
      });
    }
  }

  /**
   * Get session key for Redis
   *
   * @param orderGuid - Order GUID
   * @returns Redis key prefix
   */
  private getSessionKey(orderGuid: string): string {
    return `order:${orderGuid}`;
  }
}
