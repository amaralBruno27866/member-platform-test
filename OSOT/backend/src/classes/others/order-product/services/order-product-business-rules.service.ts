/**
 * Order Product Business Rules Service
 *
 * Encapsulates business logic validation for Order Products.
 * Handles inventory checks, calculation validation, and state validation.
 *
 * Key Responsibilities:
 * - Validate creation (inventory check, product existence)
 * - Validate update (immutability enforcement, state checks)
 * - Validate deletion (state allows deletion)
 * - Validate calculations (amount consistency)
 *
 * Inventory Logic:
 * - inventory_quantity = null/undefined → Service (unlimited qty allowed)
 * - inventory_quantity = 0 or positive → Physical product (stock must be validated)
 *
 * @file order-product-business-rules.service.ts
 * @module OrderProductModule
 * @layer Services
 */

import { Injectable, Logger } from '@nestjs/common';
import { CreateOrderProductDto } from '../dtos/create-order-product.dto';
import { OrderProductInternal } from '../interfaces';
import { OrderProductLookupService } from './order-product-lookup.service';
import { ProductLookupService } from '../../product/services/product-lookup.service';

/**
 * Validation result object
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class OrderProductBusinessRuleService {
  private readonly logger = new Logger(OrderProductBusinessRuleService.name);

  constructor(
    private readonly orderProductLookupService: OrderProductLookupService,
    private readonly productLookupService: ProductLookupService,
  ) {}

  /**
   * Validate Order Product for creation
   *
   * Checks:
   * - Quantity is positive
   * - Product exists
   * - Product can be purchased (date range, status)
   * - If physical product (category=general): inventory is sufficient
   * - If service product: quantity >= 1 (unlimited)
   *
   * @param dto - CreateOrderProductDto
   * @param orderGuid - Parent Order GUID (for context)
   * @returns ValidationResult with isValid and errors[]
   */
  async validateOrderProductForCreation(
    dto: CreateOrderProductDto,
    _orderGuid: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];

    // 1️⃣ VALIDATE PRODUCT EXISTS
    const product = await this.productLookupService.findById(
      dto.osot_product_id,
    );

    if (!product) {
      errors.push(`Produto '${dto.osot_product_id}' não encontrado`);
      return { isValid: false, errors };
    }

    // 2️⃣ VALIDATE PRODUCT CAN BE PURCHASED
    const productData = product as unknown as Record<string, unknown>;
    const canPurchase = productData.canPurchase as boolean;
    const startDate = productData.startDate as string | undefined;
    const endDate = productData.endDate as string | undefined;

    if (canPurchase === false) {
      const productName = (productData.productName ??
        productData.osot_product_name) as string;
      errors.push(
        `Produto '${productName}' não está disponível para compra no momento`,
      );
    }

    // Check date ranges
    if (startDate) {
      const start = new Date(startDate);
      if (start > new Date()) {
        errors.push(`Produto disponível a partir de ${startDate}`);
      }
    }

    if (endDate) {
      const end = new Date(endDate);
      if (end < new Date()) {
        errors.push(`Produto expirou em ${endDate}`);
      }
    }

    // 3️⃣ DETERMINE PRODUCT TYPE BY CATEGORY
    // Category "general" = physical product (has inventory)
    // All other categories = service (no inventory)
    const category = (productData.productCategory ??
      productData.osot_product_category) as string;
    const isPhysicalProduct = category?.toLowerCase() === 'general';
    const inventoryQty = (productData.osot_inventory_quantity ??
      productData.inventory) as number | null | undefined;

    // 4️⃣ VALIDATE QUANTITY BASED ON PRODUCT TYPE
    if (isPhysicalProduct) {
      // PHYSICAL PRODUCT: quantity > 0 AND <= inventory
      if (!dto.osot_quantity || dto.osot_quantity <= 0) {
        errors.push('Quantidade deve ser maior que zero');
      }

      if (typeof inventoryQty === 'number' && inventoryQty >= 0) {
        const requestedQty = dto.osot_quantity;
        if (requestedQty > inventoryQty) {
          errors.push(
            `Estoque insuficiente. Disponível: ${inventoryQty}, Solicitado: ${requestedQty}`,
          );
        }
      }
    } else {
      // SERVICE PRODUCT: quantity >= 1 (unlimited, no inventory check)
      if (!dto.osot_quantity || dto.osot_quantity < 1) {
        errors.push('Serviços requerem quantidade mínima de 1');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Order Product for update
   *
   * Checks:
   * - Immutable fields are not changed
   * - State allows update
   *
   * @param current - Current Order Product
   * @param updates - Partial updates
   * @returns ValidationResult with isValid and errors[]
   */
  validateOrderProductForUpdate(
    current: OrderProductInternal,
    updates: Partial<OrderProductInternal>,
  ): ValidationResult {
    const errors: string[] = [];

    // 1️⃣ CHECK IMMUTABLE FIELDS
    const immutableFields = [
      'osot_product_id',
      'osot_product_name',
      'osot_insurance_type',
      'osot_insurance_limit',
      'osot_product_additional_info',
      'osot_quantity',
      'osot_selectedprice',
      'osot_producttax',
      'osot_itemsubtotal',
      'osot_taxamount',
      'osot_itemtotal',
    ];

    for (const field of immutableFields) {
      const key = field as keyof OrderProductInternal;
      if (updates[key] !== undefined && updates[key] !== current[key]) {
        errors.push(`Campo '${field}' é imutável e não pode ser alterado`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate Order Product for deletion
   *
   * Checks:
   * - Order is in a deletable state (e.g., DRAFT, not finalized)
   *
   * @param orderProductId - Order Product GUID
   * @param current - Current Order Product
   * @returns ValidationResult with isValid and errors[]
   */
  validateOrderProductForDeletion(
    orderProductId: string,
    current: OrderProductInternal,
  ): ValidationResult {
    const errors: string[] = [];

    // 1️⃣ CHECK IF ORDER ALLOWS DELETION
    // Note: We would check the parent order's status here
    // For now, we allow deletion if order product exists
    // This should be enhanced to check parent order status via OrderLookupService

    if (!current) {
      errors.push('Item de pedido não encontrado');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate amount calculations
   *
   * Ensures calculations are correct:
   * - subtotal = price × quantity
   * - tax_amount = subtotal × (tax_rate / 100)
   * - total = subtotal + tax_amount
   *
   * @param quantity - Item quantity
   * @param price - Unit price
   * @param taxRate - Tax rate percentage (0-100)
   * @param subtotal - Calculated subtotal
   * @param taxAmount - Calculated tax
   * @param total - Calculated total
   * @returns ValidationResult with isValid and errors[]
   */
  validateCalculations(
    quantity: number,
    price: number,
    taxRate: number,
    subtotal: number,
    taxAmount: number,
    total: number,
  ): ValidationResult {
    const errors: string[] = [];

    // Calculate expected values
    const expectedSubtotal = price * quantity;
    const expectedTaxAmount = expectedSubtotal * (taxRate / 100);
    const expectedTotal = expectedSubtotal + expectedTaxAmount;

    // Allow small floating-point rounding differences (0.01)
    const tolerance = 0.01;

    if (Math.abs(subtotal - expectedSubtotal) > tolerance) {
      errors.push(
        `Subtotal incorreto. Esperado: ${expectedSubtotal}, Recebido: ${subtotal}`,
      );
    }

    if (Math.abs(taxAmount - expectedTaxAmount) > tolerance) {
      errors.push(
        `Imposto incorreto. Esperado: ${expectedTaxAmount}, Recebido: ${taxAmount}`,
      );
    }

    if (Math.abs(total - expectedTotal) > tolerance) {
      errors.push(
        `Total incorreto. Esperado: ${expectedTotal}, Recebido: ${total}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
