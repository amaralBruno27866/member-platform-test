/**
 * Order Product CRUD Service
 *
 * Handles Create, Read, Update, Delete for Order Product line items.
 * Integrates with ProductLookupService to create snapshots of product data at purchase time.
 *
 * Key Responsibility:
 * - Create snapshot of product (name, price, tax rate) when added to order
 * - Validate inventory (if physical product: inventory_quantity is NOT null)
 * - Calculate and validate amounts (subtotal, tax, total)
 * - Manage lifecycle until order finalization
 *
 * Inventory Logic:
 * - inventory_quantity = null/undefined → Service (unlimited quantity allowed)
 * - inventory_quantity = 0 or positive → Physical product (must validate stock)
 * - Reduction only happens when order is finalized
 *
 * @file order-product-crud.service.ts
 * @module OrderProductModule
 * @layer Services
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseOrderProductRepository } from '../repositories';
import { OrderProductLookupService } from './order-product-lookup.service';
import { OrderProductBusinessRuleService } from './order-product-business-rules.service';
import { ProductLookupService } from '../../product/services/product-lookup.service';
import { OrderProductMapper } from '../mappers/order-product.mapper';
import { CreateOrderProductDto } from '../dtos/create-order-product.dto';
import { UpdateOrderProductDto } from '../dtos/update-order-product.dto';
import { OrderProductResponseDto } from '../dtos/order-product-response.dto';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  InsuranceType,
  getInsuranceTypeDisplayName,
} from '../../product/enums/insurance-type.enum';

@Injectable()
export class OrderProductCrudService {
  private readonly logger = new Logger(OrderProductCrudService.name);

  constructor(
    private readonly orderProductRepository: DataverseOrderProductRepository,
    private readonly orderProductLookupService: OrderProductLookupService,
    private readonly orderProductBusinessRuleService: OrderProductBusinessRuleService,
    private readonly productLookupService: ProductLookupService,
  ) {}

  /**
   * Create a new Order Product (add item to order)
   *
   * Flow:
   * 1. Validate input with business rules (inventory check if physical)
   * 2. Lookup product from catalog
   * 3. Create snapshot of product data at purchase time
   * 4. Calculate amounts (subtotal, tax, total)
   * 5. Validate calculations
   * 6. Persist to Dataverse
   *
   * @param dto - CreateOrderProductDto (productId, quantity)
   * @param orderGuid - Parent Order GUID
   * @returns OrderProductResponseDto with created item
   */
  async create(
    dto: CreateOrderProductDto,
    orderGuid: string,
  ): Promise<OrderProductResponseDto> {
    const operationId = `create_order_product_${Date.now()}`;

    try {
      this.logger.log(
        `Creating Order Product for Order ${orderGuid} - Operation: ${operationId}`,
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

      // 2️⃣ LOOKUP PRODUCT
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

      // 3️⃣ CREATE SNAPSHOT OF PRODUCT DATA
      const internal = OrderProductMapper.mapCreateDtoToInternal(dto);
      internal.orderGuid = orderGuid;

      // Snapshot product data (immutable at purchase time)
      const productData = product as unknown as Record<string, unknown>;
      internal.osot_product_id = (productData.osot_table_productid ??
        productData.osot_product_id) as string;
      internal.osot_product_name = (productData.osot_product_name ??
        productData.osot_name) as string;
      internal.osot_selectedprice = (productData.displayPrice ??
        productData.osot_product_price) as number;
      internal.osot_producttax = (productData.osot_tax_rate ?? 0) as number;

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

      // 6️⃣ PERSIST TO DATAVERSE
      const created = await this.orderProductRepository.create(internal);

      this.logger.log(
        `Order Product created successfully: ${created.osot_table_order_productid} - Operation: ${operationId}`,
      );

      return OrderProductMapper.mapInternalToResponseDto(created);
    } catch (error) {
      this.logger.error(
        `Error creating Order Product - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Update an existing Order Product
   *
   * Only privilege/access_modifiers can be updated (snapshot is immutable)
   *
   * @param orderProductId - Order Product GUID
   * @param updates - UpdateOrderProductDto with changes
   * @returns OrderProductResponseDto with updated item
   */
  async update(
    orderProductId: string,
    updates: UpdateOrderProductDto,
  ): Promise<OrderProductResponseDto> {
    const operationId = `update_order_product_${Date.now()}`;

    try {
      this.logger.log(
        `Updating Order Product ${orderProductId} - Operation: ${operationId}`,
      );

      // 1️⃣ RETRIEVE CURRENT STATE
      const current =
        await this.orderProductLookupService.findById(orderProductId);

      if (!current) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Item de pedido não encontrado',
          operationId,
          orderProductId,
        });
      }

      // 2️⃣ VALIDATE CHANGES
      const validation =
        this.orderProductBusinessRuleService.validateOrderProductForUpdate(
          current,
          updates,
        );

      if (!validation.isValid) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Validação de atualização falhou',
          errors: validation.errors,
          operationId,
        });
      }

      // 3️⃣ APPLY UPDATES
      const internal = { ...current };

      if (updates.osot_privilege !== undefined) {
        internal.osot_privilege = updates.osot_privilege;
      }

      if (updates.osot_access_modifiers !== undefined) {
        internal.osot_access_modifiers = updates.osot_access_modifiers;
      }

      // 4️⃣ PERSIST CHANGES
      const updated = await this.orderProductRepository.update(
        orderProductId,
        internal,
      );

      this.logger.log(
        `Order Product updated successfully: ${orderProductId} - Operation: ${operationId}`,
      );

      return OrderProductMapper.mapInternalToResponseDto(updated);
    } catch (error) {
      this.logger.error(
        `Error updating Order Product ${orderProductId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete an Order Product
   *
   * @param orderProductId - Order Product GUID
   */
  async delete(orderProductId: string): Promise<void> {
    const operationId = `delete_order_product_${Date.now()}`;

    try {
      this.logger.log(
        `Deleting Order Product ${orderProductId} - Operation: ${operationId}`,
      );

      // 1️⃣ RETRIEVE CURRENT STATE
      const current =
        await this.orderProductLookupService.findById(orderProductId);

      if (!current) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Item de pedido não encontrado',
          operationId,
          orderProductId,
        });
      }

      // 2️⃣ VALIDATE DELETABLE STATE
      const validation =
        this.orderProductBusinessRuleService.validateOrderProductForDeletion(
          orderProductId,
          current,
        );

      if (!validation.isValid) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Não é permitido remover este item',
          errors: validation.errors,
          operationId,
        });
      }

      // 3️⃣ DELETE FROM DATAVERSE
      await this.orderProductRepository.delete(orderProductId);

      this.logger.log(
        `Order Product deleted successfully: ${orderProductId} - Operation: ${operationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error deleting Order Product ${orderProductId} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }
}
