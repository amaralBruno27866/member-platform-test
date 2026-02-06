/**
 * Order Events Layer - Barrel Export
 *
 * Exports all order events and the events service for dependency injection and module configuration.
 * Provides unified access to event publishing functionality.
 */

export { OrderEventsService } from './order.events';
export type {
  OrderCreatedEvent,
  OrderUpdatedEvent,
  OrderDeletedEvent,
  OrderStatusChangedEvent,
  PaymentStatusChangedEvent,
} from './order.events';

/**
 * Event Integration Pattern:
 *
 * OrderEventsService:
 * - Depends on: (none - stateless event publishing)
 * - Provides: Event publishing with structured logging
 * - Responsibility: Audit trail, event tracking, future event sourcing preparation
 *
 * Usage in Services:
 * 1. Inject OrderEventsService into CrudService or BusinessRulesService
 * 2. Call publishOrderCreated/Updated/Deleted after mutations
 * 3. Call publishOrderStatusChanged when status transitions
 * 4. Call publishPaymentStatusChanged when payment status changes
 *
 * Events Never Break Flow:
 * - All event publishing wrapped in try-catch
 * - Errors logged but not thrown
 * - Ensures mutations complete even if event publishing fails
 * - Future: Integrate with event bus/store without blocking
 *
 * Event Structure:
 * - Includes: orderId, orderNumber, organizationGuid, timestamps
 * - Includes: Previous/current state for change tracking
 * - Includes: Context (user type, account/affiliate, reason)
 * - Excludes: Sensitive data (passwords, PII redaction)
 *
 * Future Phases:
 * - Phase 2: Event Bus (NestJS EventEmitter2)
 * - Phase 3: Event Store (PostgreSQL event sourcing)
 * - Phase 4: CQRS (read/write model separation)
 * - Phase 5: Distributed Events (RabbitMQ/Kafka)
 *
 * @see ../order.module.ts - Module configuration with DI setup
 */
