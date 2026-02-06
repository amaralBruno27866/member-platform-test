/**
 * Order Events Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Structured Logging: Operation IDs, security-aware logging
 * - Event Philosophy: Prepare for future event sourcing integration
 * - Audit Trail: Comprehensive lifecycle tracking
 * - Business Rules: Validation event tracking
 *
 * EVENT PHILOSOPHY:
 * - Essential order events for comprehensive lifecycle tracking
 * - Clean event interfaces for audit trails and compliance
 * - Simple event service for publishing with enterprise logging
 * - Focus on core order operations with business rule tracking
 *
 * Events tracked:
 * - OrderCreatedEvent
 * - OrderUpdatedEvent
 * - OrderDeletedEvent
 * - OrderStatusChangedEvent
 * - PaymentStatusChangedEvent
 *
 * FUTURE INTEGRATION READY:
 * - Event Bus (Phase 2): NestJS EventEmitter2
 * - Event Store (Phase 3): PostgreSQL event sourcing
 * - CQRS (Phase 4): Read/Write model separation
 * - Distributed Events (Phase 5): RabbitMQ/Kafka
 *
 * @file order.events.ts
 * @module OrderModule
 * @layer Events
 * @since 2026-01-22
 */

import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

/**
 * Order created event
 */
export interface OrderCreatedEvent {
  orderId: string;
  orderNumber: string;
  organizationGuid: string;
  accountGuid?: string;
  affiliateGuid?: string;
  osot_total: number;
  osot_order_status: OrderStatus;
  osot_payment_status: PaymentStatus;
  createdAt: Date;
}

/**
 * Order updated event
 */
export interface OrderUpdatedEvent {
  orderId: string;
  orderNumber: string;
  organizationGuid: string;
  accountGuid?: string;
  affiliateGuid?: string;
  osot_total: number;
  previousStatus?: OrderStatus;
  currentStatus: OrderStatus;
  previousPaymentStatus?: PaymentStatus;
  currentPaymentStatus: PaymentStatus;
  changedFields: string[];
  updatedAt: Date;
}

/**
 * Order deleted event
 */
export interface OrderDeletedEvent {
  orderId: string;
  orderNumber: string;
  organizationGuid: string;
  accountGuid?: string;
  affiliateGuid?: string;
  osot_total: number;
  osot_order_status: OrderStatus;
  osot_payment_status: PaymentStatus;
  deletedAt: Date;
  hardDelete: boolean; // true if permanently deleted, false if soft delete
}

/**
 * Order status changed event
 */
export interface OrderStatusChangedEvent {
  orderId: string;
  orderNumber: string;
  organizationGuid: string;
  previousStatus: OrderStatus;
  currentStatus: OrderStatus;
  reason?: string;
  changedAt: Date;
}

/**
 * Payment status changed event
 */
export interface PaymentStatusChangedEvent {
  orderId: string;
  orderNumber: string;
  organizationGuid: string;
  osot_total: number;
  previousPaymentStatus: PaymentStatus;
  currentPaymentStatus: PaymentStatus;
  externalTransactionId?: string; // For PayPal/Stripe integration
  reason?: string;
  changedAt: Date;
}

/**
 * Order Events Service
 *
 * Handles event publishing with structured logging (Phase 1: Logging only)
 * Prepares for future integration with event buses, event sourcing, and CQRS patterns.
 *
 * Current Implementation:
 * - Phase 1 ✅: Structured logging with audit trail context
 *
 * Future Phases:
 * - Phase 2 🔮: Event Bus (NestJS EventEmitter2)
 * - Phase 3 🔮: Event Store (PostgreSQL event sourcing)
 * - Phase 4 🔮: CQRS (read/write model separation)
 * - Phase 5 🔮: Distributed Events (RabbitMQ/Kafka)
 */
@Injectable()
export class OrderEventsService {
  private readonly logger = new Logger(OrderEventsService.name);

  constructor() {
    this.logger.log('Order Events Service initialized successfully');
  }

  // ========================================
  // CORE LIFECYCLE EVENTS
  // ========================================

  /**
   * Publish order created event
   * Logs order creation with business context for audit trails
   */
  publishOrderCreated(event: OrderCreatedEvent): void {
    try {
      const userType = event.accountGuid ? 'Account' : 'Affiliate';
      const userId = event.accountGuid || event.affiliateGuid;

      this.logger.log(
        `Order created - ID: ${event.orderId}, Number: ${event.orderNumber}, Total: $${event.osot_total}, Status: ${event.osot_order_status}, User: ${userType}/${userId}`,
        {
          operation: 'order_created',
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          organizationGuid: event.organizationGuid,
          accountGuid: event.accountGuid,
          affiliateGuid: event.affiliateGuid,
          osot_total: event.osot_total,
          osot_order_status: event.osot_order_status,
          osot_payment_status: event.osot_payment_status,
          timestamp: event.createdAt.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('order.created', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Order created event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish order updated event
   * Tracks order modifications with detailed change analysis
   */
  publishOrderUpdated(event: OrderUpdatedEvent): void {
    try {
      const userType = event.accountGuid ? 'Account' : 'Affiliate';
      const userId = event.accountGuid || event.affiliateGuid;

      this.logger.log(
        `Order updated - ID: ${event.orderId}, Number: ${event.orderNumber}, Total: $${event.osot_total}, Status: ${event.previousStatus} → ${event.currentStatus}, User: ${userType}/${userId}`,
        {
          operation: 'order_updated',
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          organizationGuid: event.organizationGuid,
          accountGuid: event.accountGuid,
          affiliateGuid: event.affiliateGuid,
          osot_total: event.osot_total,
          previousStatus: event.previousStatus,
          currentStatus: event.currentStatus,
          previousPaymentStatus: event.previousPaymentStatus,
          currentPaymentStatus: event.currentPaymentStatus,
          changedFields: event.changedFields,
          timestamp: event.updatedAt.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('order.updated', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Order updated event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish order deleted event
   * Logs order deletion with comprehensive audit information
   */
  publishOrderDeleted(event: OrderDeletedEvent): void {
    try {
      const userType = event.accountGuid ? 'Account' : 'Affiliate';
      const userId = event.accountGuid || event.affiliateGuid;
      const deleteType = event.hardDelete ? 'Hard Delete' : 'Soft Delete';

      this.logger.log(
        `Order deleted - ID: ${event.orderId}, Number: ${event.orderNumber}, Total: $${event.osot_total}, Type: ${deleteType}, User: ${userType}/${userId}`,
        {
          operation: 'order_deleted',
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          organizationGuid: event.organizationGuid,
          accountGuid: event.accountGuid,
          affiliateGuid: event.affiliateGuid,
          osot_total: event.osot_total,
          osot_order_status: event.osot_order_status,
          osot_payment_status: event.osot_payment_status,
          hardDelete: event.hardDelete,
          timestamp: event.deletedAt.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('order.deleted', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Order deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - events should not break the main flow
    }
  }

  // ========================================
  // BUSINESS RULE EVENTS
  // ========================================

  /**
   * Publish order status changed event
   * Tracks order status transitions through workflow
   */
  publishOrderStatusChanged(event: OrderStatusChangedEvent): void {
    try {
      this.logger.log(
        `Order status changed - ID: ${event.orderId}, Number: ${event.orderNumber}, Status: ${event.previousStatus} → ${event.currentStatus}, Reason: ${event.reason || 'N/A'}`,
        {
          operation: 'order_status_changed',
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          organizationGuid: event.organizationGuid,
          previousStatus: event.previousStatus,
          currentStatus: event.currentStatus,
          reason: event.reason,
          timestamp: event.changedAt.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('order.status_changed', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Order status changed event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish payment status changed event
   * Tracks payment status changes and payment processing
   */
  publishPaymentStatusChanged(event: PaymentStatusChangedEvent): void {
    try {
      this.logger.log(
        `Order payment status changed - ID: ${event.orderId}, Number: ${event.orderNumber}, Total: $${event.osot_total}, Payment: ${event.previousPaymentStatus} → ${event.currentPaymentStatus}, Reason: ${event.reason || 'N/A'}`,
        {
          operation: 'order_payment_status_changed',
          orderId: event.orderId,
          orderNumber: event.orderNumber,
          organizationGuid: event.organizationGuid,
          osot_total: event.osot_total,
          previousPaymentStatus: event.previousPaymentStatus,
          currentPaymentStatus: event.currentPaymentStatus,
          externalTransactionId: event.externalTransactionId,
          reason: event.reason,
          timestamp: event.changedAt.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('order.payment_status_changed', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Payment status changed event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - events should not break the main flow
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get event statistics for monitoring
   */
  getEventStats(): { eventsEmitted: number; lastEventTime: Date } {
    return {
      eventsEmitted: 0, // TODO: Track event count
      lastEventTime: new Date(),
    };
  }

  /**
   * Get events for a specific order (for audit trail)
   */
  getOrderEventHistory(orderId: string): Promise<any[]> {
    this.logger.log(`Retrieving event history for order: ${orderId}`);

    // TODO: Implement event retrieval from event store
    return Promise.resolve([]);
  }

  /**
   * Get events for a specific account across all orders
   */
  getAccountOrderEventHistory(accountGuid: string): Promise<any[]> {
    this.logger.log(
      `Retrieving order event history for account: ${accountGuid}`,
    );

    // TODO: Implement event retrieval from event store
    return Promise.resolve([]);
  }

  /**
   * Get events for a specific organization across all orders
   */
  getOrganizationOrderEventHistory(organizationGuid: string): Promise<any[]> {
    this.logger.log(
      `Retrieving order event history for organization: ${organizationGuid}`,
    );

    // TODO: Implement event retrieval from event store
    return Promise.resolve([]);
  }
}
