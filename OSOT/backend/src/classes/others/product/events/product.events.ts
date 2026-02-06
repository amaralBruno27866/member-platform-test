/**
 * Product Events
 *
 * Event classes for Product entity lifecycle management.
 * Used for async processing, notifications, audit logs, and integration workflows.
 *
 * EVENTS:
 * - ProductCreatedEvent: Fired when a new product is created
 * - ProductUpdatedEvent: Fired when a product is updated
 * - ProductDeletedEvent: Fired when a product is deleted (soft or hard)
 * - ProductInsuranceCreatedEvent: Fired when an insurance product is created
 * - ProductInsuranceUpdatedEvent: Fired when insurance fields are updated
 *
 * @file product.events.ts
 * @module ProductModule
 * @layer Events
 * @since 2025-05-01
 */

import { ProductStatus } from '../enums/product-status.enum';
import { InsuranceType } from '../enums/insurance-type.enum';

/**
 * Product Created Event
 * Emitted when a new product is successfully created
 */
export class ProductCreatedEvent {
  constructor(
    public readonly productId: string,
    public readonly productCode: string,
    public readonly status: ProductStatus,
    public readonly createdBy: string,
    public readonly operationId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Product Updated Event
 * Emitted when a product is successfully updated
 */
export class ProductUpdatedEvent {
  constructor(
    public readonly productId: string,
    public readonly productCode: string,
    public readonly previousStatus: ProductStatus,
    public readonly newStatus: ProductStatus,
    public readonly updatedBy: string,
    public readonly operationId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Product Deleted Event
 * Emitted when a product is deleted (soft or hard)
 */
export class ProductDeletedEvent {
  constructor(
    public readonly productId: string,
    public readonly productCode: string,
    public readonly isHardDelete: boolean,
    public readonly deletedBy: string,
    public readonly operationId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Product Price Changed Event
 * Emitted when product pricing is updated
 */
export class ProductPriceChangedEvent {
  constructor(
    public readonly productId: string,
    public readonly productCode: string,
    public readonly priceField: string,
    public readonly oldPrice: number | null,
    public readonly newPrice: number | null,
    public readonly updatedBy: string,
    public readonly operationId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Product Inventory Changed Event
 * Emitted when product inventory is updated
 */
export class ProductInventoryChangedEvent {
  constructor(
    public readonly productId: string,
    public readonly productCode: string,
    public readonly previousInventory: number,
    public readonly newInventory: number,
    public readonly updatedBy: string,
    public readonly operationId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Product Low Stock Event
 * Emitted when product inventory falls below threshold
 */
export class ProductLowStockEvent {
  constructor(
    public readonly productId: string,
    public readonly productCode: string,
    public readonly currentInventory: number,
    public readonly threshold: number,
    public readonly operationId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Product Insurance Created Event
 * Emitted when an insurance product is created
 *
 * Use Cases:
 * - Audit trail for insurance products
 * - Compliance reporting
 * - Notifications to insurance administrators
 * - Integration with external insurance systems
 */
export class ProductInsuranceCreatedEvent {
  constructor(
    public readonly productId: string,
    public readonly productCode: string,
    public readonly insuranceType: InsuranceType,
    public readonly insuranceLimit: number,
    public readonly createdBy: string,
    public readonly operationId: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Product Insurance Updated Event
 * Emitted when insurance type or limit is updated
 *
 * Use Cases:
 * - Track changes to insurance coverage
 * - Alert on significant limit changes
 * - Compliance audit requirements
 * - Integration with risk management systems
 */
export class ProductInsuranceUpdatedEvent {
  constructor(
    public readonly productId: string,
    public readonly productCode: string,
    public readonly updatedBy: string,
    public readonly operationId: string,
    public readonly previousInsuranceType?: InsuranceType,
    public readonly newInsuranceType?: InsuranceType,
    public readonly previousInsuranceLimit?: number,
    public readonly newInsuranceLimit?: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}
