/**
 * Order Events Service
 *
 * Publishes domain events for Order lifecycle with structured logging.
 * Events are emitted via NestJS EventEmitter2 for consumption by listeners.
 *
 * EVENTS:
 * 1. order.created - Emitted when order is successfully created with all order products
 * 2. order.updated - Emitted when order is modified (status, payment, etc.)
 * 3. order.deleted - Emitted when order is cancelled/deleted
 * 4. order.payment-confirmed - Emitted when payment is processed
 * 5. order.payment-failed - Emitted when payment processing fails
 *
 * KEY FIELDS IN ORDER.CREATED EVENT:
 * - orderId: Order GUID
 * - accountGuid: Account GUID (order owner)
 * - organizationGuid: Organization GUID (tenant)
 * - orderProducts[]: Array of OrderProduct records with snapshots
 *   - osot_product_category: Product type (INSURANCE=1, MEMBERSHIP=0, etc.)
 *   - osot_insurance_type: Insurance type (if product is insurance)
 *   - osot_insurance_limit: Coverage limit (if product is insurance)
 *   - osot_price: Order price at time of purchase
 *
 * LISTENER INTEGRATION:
 * - InsuranceEventListeners subscribes to order.created
 * - Checks if orderProducts[] contains insurance items (category=1)
 * - If yes, triggers insurance validation workflow
 * - If no, exits silently (nothing to do)
 *
 * DESIGN PATTERN:
 * - Events published for audit trail logging
 * - EventEmitter2 handles async listener execution
 * - Don't throw on event publishing (events should not break main flow)
 * - All listener errors caught and logged (no cascade failures)
 *
 * @file order-events.service.ts
 * @module OrderModule
 * @layer Events
 * @since 2026-01-28
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Order created event payload
 */
export interface OrderCreatedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  // KEY: Include orderProducts[] with all item data including snapshots
  orderProducts: Array<{
    orderProductId: string;
    productId: string;
    osot_product_category: string; // ProductCategory enum value as string ('0', '1', '2')
    osot_price: number;
    osot_quantity: number;
    // Insurance snapshots (if product is insurance)
    osot_insurance_type?: string;
    osot_insurance_limit?: number;
  }>;
  timestamp: Date;
}

/**
 * Order updated event payload
 */
export interface OrderUpdatedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  changes: {
    new: Record<string, any>;
    old: Record<string, any>;
  };
  changedFields: string[];
  timestamp: Date;
}

/**
 * Order deleted event payload
 */
export interface OrderDeletedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  reason?: string;
  timestamp: Date;
}

/**
 * Payment confirmed event payload
 */
export interface OrderPaymentConfirmedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  paymentId: string;
  amount: number;
  paymentMethod: string;
  timestamp: Date;
}

/**
 * Payment failed event payload
 */
export interface OrderPaymentFailedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  paymentId: string;
  amount: number;
  errorCode: string;
  errorMessage: string;
  timestamp: Date;
}

/**
 * Order Events Service
 */
@Injectable()
export class OrderEventsService {
  private readonly logger = new Logger(OrderEventsService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Publish order created event
   *
   * CRITICAL: Must include orderProducts[] array with all items
   * This allows downstream listeners (e.g., InsuranceEventListeners) to:
   * 1. Check if order has insurance items
   * 2. Validate insurance eligibility
   * 3. Create insurance records
   *
   * @param event - Order created event with orderProducts[]
   */
  publishOrderCreated(event: OrderCreatedEvent): void {
    try {
      this.logger.log(
        `Order created event publishing - Order: ${event.orderId}, Items: ${event.orderProducts.length}`,
        {
          operation: 'publishOrderCreated',
          orderId: event.orderId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          organizationGuid: event.organizationGuid?.substring(0, 8) + '...',
          totalAmount: event.totalAmount,
          orderStatus: event.orderStatus,
          paymentStatus: event.paymentStatus,
          itemCount: event.orderProducts.length,
          insuranceItemCount: event.orderProducts.filter(
            (op) => op.osot_product_category === '1', // INSURANCE = '1' (string)
          ).length,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event (async, non-blocking)
      this.eventEmitter.emit('order.created', event);

      this.logger.log(
        `Order created event emitted successfully - Order: ${event.orderId}`,
        {
          operation: 'publishOrderCreated',
          orderId: event.orderId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Order created event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishOrderCreated',
          orderId: event.orderId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish order updated event
   *
   * @param event - Order updated event
   */
  publishOrderUpdated(event: OrderUpdatedEvent): void {
    try {
      const changedFieldsList = event.changedFields.join(', ');

      this.logger.log(
        `Order updated event publishing - Order: ${event.orderId}, Fields: ${changedFieldsList}`,
        {
          operation: 'publishOrderUpdated',
          orderId: event.orderId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          changedFields: changedFieldsList,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('order.updated', event);

      this.logger.log(
        `Order updated event emitted successfully - Order: ${event.orderId}`,
        {
          operation: 'publishOrderUpdated',
          orderId: event.orderId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Order updated event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishOrderUpdated',
          orderId: event.orderId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish order deleted event
   *
   * @param event - Order deleted event
   */
  publishOrderDeleted(event: OrderDeletedEvent): void {
    try {
      this.logger.log(
        `Order deleted event publishing - Order: ${event.orderId}, Reason: ${event.reason || 'Not specified'}`,
        {
          operation: 'publishOrderDeleted',
          orderId: event.orderId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          reason: event.reason || 'Not specified',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('order.deleted', event);

      this.logger.log(
        `Order deleted event emitted successfully - Order: ${event.orderId}`,
        {
          operation: 'publishOrderDeleted',
          orderId: event.orderId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Order deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishOrderDeleted',
          orderId: event.orderId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish payment confirmed event
   *
   * @param event - Payment confirmed event
   */
  publishPaymentConfirmed(event: OrderPaymentConfirmedEvent): void {
    try {
      this.logger.log(
        `Payment confirmed event publishing - Order: ${event.orderId}, Amount: ${event.amount}, Method: ${event.paymentMethod}`,
        {
          operation: 'publishPaymentConfirmed',
          orderId: event.orderId,
          paymentId: event.paymentId,
          amount: event.amount,
          paymentMethod: event.paymentMethod,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('order.payment-confirmed', event);

      this.logger.log(
        `Payment confirmed event emitted successfully - Order: ${event.orderId}`,
        {
          operation: 'publishPaymentConfirmed',
          orderId: event.orderId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Payment confirmed event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishPaymentConfirmed',
          orderId: event.orderId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish payment failed event
   *
   * @param event - Payment failed event
   */
  publishPaymentFailed(event: OrderPaymentFailedEvent): void {
    try {
      this.logger.warn(
        `Payment failed event publishing - Order: ${event.orderId}, Amount: ${event.amount}, Error: ${event.errorCode}`,
        {
          operation: 'publishPaymentFailed',
          orderId: event.orderId,
          paymentId: event.paymentId,
          amount: event.amount,
          errorCode: event.errorCode,
          errorMessage: event.errorMessage,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('order.payment-failed', event);

      this.logger.log(
        `Payment failed event emitted successfully - Order: ${event.orderId}`,
        {
          operation: 'publishPaymentFailed',
          orderId: event.orderId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Payment failed event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishPaymentFailed',
          orderId: event.orderId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }
}
