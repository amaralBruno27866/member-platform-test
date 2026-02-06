/**
 * Order Product Events Service
 *
 * Publishes domain events for order product lifecycle.
 * Events are logged for audit trails and can be subscribed to by listeners.
 *
 * TODO: Integrate with NestJS EventEmitter2 when @nestjs/event-emitter is installed
 * Installation: npm install @nestjs/event-emitter
 * Then uncomment EventEmitter2 import and update emit calls
 *
 * @file order-product-events.service.ts
 * @module Events
 */

import { Injectable, Logger } from '@nestjs/common';
// TODO: Uncomment when @nestjs/event-emitter is installed
// import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OrderProductAddedEvent,
  OrderProductUpdatedEvent,
  OrderProductRemovedEvent,
  OrderProductCartClearedEvent,
  OrderProductCheckoutCompletedEvent,
  OrderProductCheckoutFailedEvent,
  OrderProductInventoryValidationFailedEvent,
  OrderProductSnapshotCapturedEvent,
} from './order-product.events';

/**
 * Service for publishing order product domain events
 *
 * Currently logs events to Logger. Can be extended to:
 * - Emit via NestJS EventEmitter2 (real-time listeners)
 * - Send to message queue (async processing)
 * - Write to event store (event sourcing)
 * - Send webhooks to external systems
 */
@Injectable()
export class OrderProductEventsService {
  private readonly logger = new Logger(OrderProductEventsService.name);

  // TODO: Uncomment when @nestjs/event-emitter is installed
  // constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Publish event: Product added to cart
   */
  publishProductAdded(
    orderId: string,
    productId: string,
    quantity: number,
    price: number,
    tax: number,
    userId: string,
    organizationGuid: string,
  ): void {
    const event = new OrderProductAddedEvent(
      orderId,
      productId,
      quantity,
      price,
      tax,
      userId,
      organizationGuid,
    );

    this.logger.log(`[EVENT] OrderProductAdded`, {
      orderId,
      productId,
      quantity,
      userId,
      organizationGuid,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Uncomment when @nestjs/event-emitter is installed
    // this.eventEmitter.emit('order-product.added', event);
  }

  /**
   * Publish event: Product quantity updated
   */
  publishProductUpdated(
    orderId: string,
    productId: string,
    oldQuantity: number,
    newQuantity: number,
    oldPrice: number,
    newPrice: number,
    userId: string,
    organizationGuid: string,
  ): void {
    const event = new OrderProductUpdatedEvent(
      orderId,
      productId,
      oldQuantity,
      newQuantity,
      oldPrice,
      newPrice,
      userId,
      organizationGuid,
    );

    this.logger.log(`[EVENT] OrderProductUpdated`, {
      orderId,
      productId,
      oldQuantity,
      newQuantity,
      userId,
      organizationGuid,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Uncomment when @nestjs/event-emitter is installed
    // this.eventEmitter.emit('order-product.updated', event);
  }

  /**
   * Publish event: Product removed from cart
   */
  publishProductRemoved(
    orderId: string,
    productId: string,
    quantity: number,
    price: number,
    userId: string,
    organizationGuid: string,
  ): void {
    const event = new OrderProductRemovedEvent(
      orderId,
      productId,
      quantity,
      price,
      userId,
      organizationGuid,
    );

    this.logger.log(`[EVENT] OrderProductRemoved`, {
      orderId,
      productId,
      quantity,
      userId,
      organizationGuid,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Uncomment when @nestjs/event-emitter is installed
    // this.eventEmitter.emit('order-product.removed', event);
  }

  /**
   * Publish event: Entire cart cleared
   */
  publishCartCleared(
    orderId: string,
    itemCount: number,
    userId: string,
    organizationGuid: string,
  ): void {
    const event = new OrderProductCartClearedEvent(
      orderId,
      itemCount,
      userId,
      organizationGuid,
    );

    this.logger.log(`[EVENT] OrderProductCartCleared`, {
      orderId,
      itemCount,
      userId,
      organizationGuid,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Uncomment when @nestjs/event-emitter is installed
    // this.eventEmitter.emit('order-product.cart-cleared', event);
  }

  /**
   * Publish event: Checkout completed successfully
   */
  publishCheckoutCompleted(
    orderId: string,
    itemCount: number,
    subtotal: number,
    tax: number,
    total: number,
    userId: string,
    organizationGuid: string,
  ): void {
    const event = new OrderProductCheckoutCompletedEvent(
      orderId,
      itemCount,
      subtotal,
      tax,
      total,
      userId,
      organizationGuid,
    );

    this.logger.log(`[EVENT] OrderProductCheckoutCompleted`, {
      orderId,
      itemCount,
      subtotal,
      tax,
      total,
      userId,
      organizationGuid,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Uncomment when @nestjs/event-emitter is installed
    // this.eventEmitter.emit('order-product.checkout-completed', event);
  }

  /**
   * Publish event: Checkout failed
   */
  publishCheckoutFailed(
    orderId: string,
    reason: string,
    userId: string,
    organizationGuid: string,
  ): void {
    const event = new OrderProductCheckoutFailedEvent(
      orderId,
      reason,
      userId,
      organizationGuid,
    );

    this.logger.log(`[EVENT] OrderProductCheckoutFailed`, {
      orderId,
      reason,
      userId,
      organizationGuid,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Uncomment when @nestjs/event-emitter is installed
    // this.eventEmitter.emit('order-product.checkout-failed', event);
  }

  /**
   * Publish event: Inventory validation failed
   */
  publishInventoryValidationFailed(
    orderId: string,
    productId: string,
    requestedQuantity: number,
    availableStock: number,
    userId: string,
    organizationGuid: string,
  ): void {
    const event = new OrderProductInventoryValidationFailedEvent(
      orderId,
      productId,
      requestedQuantity,
      availableStock,
      userId,
      organizationGuid,
    );

    this.logger.log(`[EVENT] OrderProductInventoryValidationFailed`, {
      orderId,
      productId,
      requestedQuantity,
      availableStock,
      userId,
      organizationGuid,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Uncomment when @nestjs/event-emitter is installed
    // this.eventEmitter.emit('order-product.inventory-validation-failed', event);
  }

  /**
   * Publish event: Product snapshot captured
   */
  publishSnapshotCaptured(
    orderId: string,
    productId: string,
    productName: string,
    insuranceType: string | undefined,
    insuranceLimit: number | undefined,
    productAdditionalInfo: string | undefined,
    price: number,
    tax: number,
    userId: string,
    organizationGuid: string,
  ): void {
    const event = new OrderProductSnapshotCapturedEvent(
      orderId,
      productId,
      productName,
      insuranceType,
      insuranceLimit,
      productAdditionalInfo,
      price,
      tax,
      userId,
      organizationGuid,
    );

    this.logger.log(`[EVENT] OrderProductSnapshotCaptured`, {
      orderId,
      productId,
      productName,
      insuranceType,
      insuranceLimit,
      productAdditionalInfo,
      price,
      tax,
      userId,
      organizationGuid,
      timestamp: event.timestamp.toISOString(),
    });

    // TODO: Uncomment when @nestjs/event-emitter is installed
    // this.eventEmitter.emit('order-product.snapshot-captured', event);
  }
}
