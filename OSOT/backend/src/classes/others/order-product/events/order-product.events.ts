/**
 * Order Product Domain Events
 *
 * Events published when order products are created, updated, or deleted.
 * Used for audit trails, notifications, and event sourcing.
 *
 * @file order-product.events.ts
 * @module Events
 */

/**
 * Event published when an order product is added to a cart
 */
export class OrderProductAddedEvent {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly tax: number,
    public readonly userId: string,
    public readonly organizationGuid: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event published when an order product quantity is updated
 */
export class OrderProductUpdatedEvent {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly oldQuantity: number,
    public readonly newQuantity: number,
    public readonly oldPrice: number,
    public readonly newPrice: number,
    public readonly userId: string,
    public readonly organizationGuid: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event published when an order product is removed from cart
 */
export class OrderProductRemovedEvent {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly quantity: number,
    public readonly price: number,
    public readonly userId: string,
    public readonly organizationGuid: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event published when entire cart is cleared
 */
export class OrderProductCartClearedEvent {
  constructor(
    public readonly orderId: string,
    public readonly itemCount: number,
    public readonly userId: string,
    public readonly organizationGuid: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event published when order is finalized (checkout complete)
 */
export class OrderProductCheckoutCompletedEvent {
  constructor(
    public readonly orderId: string,
    public readonly itemCount: number,
    public readonly subtotal: number,
    public readonly tax: number,
    public readonly total: number,
    public readonly userId: string,
    public readonly organizationGuid: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event published when checkout fails
 */
export class OrderProductCheckoutFailedEvent {
  constructor(
    public readonly orderId: string,
    public readonly reason: string,
    public readonly userId: string,
    public readonly organizationGuid: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event published when inventory validation fails
 */
export class OrderProductInventoryValidationFailedEvent {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly requestedQuantity: number,
    public readonly availableStock: number,
    public readonly userId: string,
    public readonly organizationGuid: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}

/**
 * Event published when product snapshot is captured
 */
export class OrderProductSnapshotCapturedEvent {
  constructor(
    public readonly orderId: string,
    public readonly productId: string,
    public readonly productName: string,
    public readonly insuranceType: string | undefined,
    public readonly insuranceLimit: number | undefined,
    public readonly productAdditionalInfo: string | undefined,
    public readonly price: number,
    public readonly tax: number,
    public readonly userId: string,
    public readonly organizationGuid: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}
