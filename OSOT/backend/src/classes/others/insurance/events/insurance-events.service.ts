/**
 * Insurance Events Service
 *
 * Publishes domain events for Insurance lifecycle with structured logging.
 * Events are emitted via NestJS EventEmitter2 for consumption by listeners.
 *
 * EVENTS:
 * 1. insurance.validation-completed - Validation of insurance items passed
 * 2. insurance.validation-failed - Validation of insurance items failed
 * 3. insurance.created - Insurance records successfully created
 * 4. insurance.creation-failed - Insurance creation failed
 * 5. insurance.updated - Insurance record updated
 * 6. insurance.deleted - Insurance record deleted
 * 7. insurance.expired - Insurance coverage expired (from scheduler)
 *
 * LISTENER INTEGRATION:
 * - InsuranceEventListeners subscribes to:
 *   a. order.created (from OrderEventsService)
 *   b. insurance.validation-completed (from this service)
 *   c. insurance.validation-failed (from this service)
 *   d. insurance.creation-failed (from this service)
 *
 * EVENT FLOW:
 * 1. OrderEventsService.publishOrderCreated()
 *    ↓
 * 2. InsuranceEventListeners.onOrderCreated()
 *    ↓
 * 3. OrderInsuranceOrchestratorService.orchestrateInsuranceValidation()
 *    ↓
 * 4. InsuranceEventsService.publishInsuranceValidationCompleted() [SUCCESS]
 *    or InsuranceEventsService.publishInsuranceValidationFailed() [FAILURE]
 *    ↓
 * 5. InsuranceEventListeners.onInsuranceValidationCompleted()
 *    ↓
 * 6. InsuranceSnapshotOrchestratorService.createInsuranceFromSession()
 *    ↓
 * 7. InsuranceEventsService.publishInsuranceCreated() [SUCCESS]
 *    or InsuranceEventsService.publishInsuranceCreationFailed() [FAILURE]
 *
 * DESIGN PATTERN:
 * - Events published for audit trail logging
 * - EventEmitter2 handles async listener execution
 * - Don't throw on event publishing (events should not break main flow)
 * - All listener errors caught and logged (no cascade failures)
 *
 * @file insurance-events.service.ts
 * @module InsuranceModule
 * @layer Events
 * @since 2026-01-28
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Insurance validation completed event payload
 */
export interface InsuranceValidationCompletedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  sessionId: string;
  timestamp: Date;
}

/**
 * Insurance validation failed event payload
 */
export interface InsuranceValidationFailedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  sessionId: string;
  timestamp: Date;
  errors: string[];
}

/**
 * Insurance created event payload
 */
export interface InsuranceCreatedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  insuranceCount: number;
  insuranceIds: string[];
  timestamp: Date;
}

/**
 * Insurance creation failed event payload
 */
export interface InsuranceCreationFailedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  sessionId: string;
  timestamp: Date;
  error: string;
}

/**
 * Insurance updated event payload
 */
export interface InsuranceUpdatedEvent {
  insuranceId: string;
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
 * Insurance deleted event payload
 */
export interface InsuranceDeletedEvent {
  insuranceId: string;
  accountGuid: string;
  organizationGuid: string;
  certificateNumber: string;
  reason?: string;
  timestamp: Date;
}

/**
 * Insurance expired event payload (from scheduler)
 */
export interface InsuranceExpiredEvent {
  insuranceId: string;
  accountGuid: string;
  organizationGuid: string;
  certificateNumber: string;
  membershipYear: string;
  expiryDate: string;
  timestamp: Date;
}

/**
 * Insurance Events Service
 */
@Injectable()
export class InsuranceEventsService {
  private readonly logger = new Logger(InsuranceEventsService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Publish insurance validation completed event
   *
   * Triggered by: OrderInsuranceOrchestratorService
   * Consumed by: InsuranceEventListeners.onInsuranceValidationCompleted()
   *
   * @param event - Validation completed event
   */
  publishInsuranceValidationCompleted(
    event: InsuranceValidationCompletedEvent,
  ): void {
    try {
      this.logger.log(
        `Insurance validation completed event publishing - Order: ${event.orderId}, Session: ${event.sessionId}`,
        {
          operation: 'publishInsuranceValidationCompleted',
          orderId: event.orderId,
          sessionId: event.sessionId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event (async, non-blocking)
      this.eventEmitter.emit('insurance.validation-completed', event);

      this.logger.log(
        `Insurance validation completed event emitted successfully - Session: ${event.sessionId}`,
        {
          operation: 'publishInsuranceValidationCompleted',
          sessionId: event.sessionId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Insurance validation completed event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishInsuranceValidationCompleted',
          orderId: event.orderId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish insurance validation failed event
   *
   * Triggered by: OrderInsuranceOrchestratorService
   * Consumed by: InsuranceEventListeners.onInsuranceValidationFailed()
   *
   * @param event - Validation failed event
   */
  publishInsuranceValidationFailed(
    event: InsuranceValidationFailedEvent,
  ): void {
    try {
      this.logger.warn(
        `Insurance validation failed event publishing - Order: ${event.orderId}, Errors: ${event.errors.length}`,
        {
          operation: 'publishInsuranceValidationFailed',
          orderId: event.orderId,
          sessionId: event.sessionId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          errorCount: event.errors.length,
          errors: event.errors,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('insurance.validation-failed', event);

      this.logger.log(
        `Insurance validation failed event emitted successfully - Session: ${event.sessionId}`,
        {
          operation: 'publishInsuranceValidationFailed',
          sessionId: event.sessionId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Insurance validation failed event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishInsuranceValidationFailed',
          orderId: event.orderId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish insurance created event
   *
   * Triggered by: InsuranceSnapshotOrchestratorService
   * Used for: Audit trail logging
   *
   * @param event - Insurance created event
   */
  publishInsuranceCreated(event: InsuranceCreatedEvent): void {
    try {
      this.logger.log(
        `Insurance created event publishing - Order: ${event.orderId}, Records: ${event.insuranceCount}`,
        {
          operation: 'publishInsuranceCreated',
          orderId: event.orderId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          organizationGuid: event.organizationGuid?.substring(0, 8) + '...',
          recordCount: event.insuranceCount,
          insuranceIds: event.insuranceIds,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('insurance.created', event);

      this.logger.log(
        `Insurance created event emitted successfully - Order: ${event.orderId}`,
        {
          operation: 'publishInsuranceCreated',
          orderId: event.orderId,
          recordCount: event.insuranceCount,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Insurance created event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishInsuranceCreated',
          orderId: event.orderId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish insurance creation failed event
   *
   * Triggered by: InsuranceSnapshotOrchestratorService
   * Consumed by: InsuranceEventListeners.onInsuranceCreationFailed()
   *
   * @param event - Creation failed event
   */
  publishInsuranceCreationFailed(event: InsuranceCreationFailedEvent): void {
    try {
      this.logger.error(
        `Insurance creation failed event publishing - Order: ${event.orderId}, Error: ${event.error}`,
        {
          operation: 'publishInsuranceCreationFailed',
          orderId: event.orderId,
          sessionId: event.sessionId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          error: event.error,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('insurance.creation-failed', event);

      this.logger.log(
        `Insurance creation failed event emitted successfully - Session: ${event.sessionId}`,
        {
          operation: 'publishInsuranceCreationFailed',
          sessionId: event.sessionId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Insurance creation failed event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishInsuranceCreationFailed',
          orderId: event.orderId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish insurance updated event
   *
   * @param event - Insurance updated event
   */
  publishInsuranceUpdated(event: InsuranceUpdatedEvent): void {
    try {
      const changedFieldsList = event.changedFields.join(', ');

      this.logger.log(
        `Insurance updated event publishing - Insurance: ${event.insuranceId}, Fields: ${changedFieldsList}`,
        {
          operation: 'publishInsuranceUpdated',
          insuranceId: event.insuranceId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          changedFields: changedFieldsList,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('insurance.updated', event);

      this.logger.log(
        `Insurance updated event emitted successfully - Insurance: ${event.insuranceId}`,
        {
          operation: 'publishInsuranceUpdated',
          insuranceId: event.insuranceId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Insurance updated event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishInsuranceUpdated',
          insuranceId: event.insuranceId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish insurance deleted event
   *
   * @param event - Insurance deleted event
   */
  publishInsuranceDeleted(event: InsuranceDeletedEvent): void {
    try {
      this.logger.log(
        `Insurance deleted event publishing - Insurance: ${event.insuranceId}, Certificate: ${event.certificateNumber}, Reason: ${event.reason || 'Not specified'}`,
        {
          operation: 'publishInsuranceDeleted',
          insuranceId: event.insuranceId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          certificateNumber: event.certificateNumber,
          reason: event.reason || 'Not specified',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('insurance.deleted', event);

      this.logger.log(
        `Insurance deleted event emitted successfully - Insurance: ${event.insuranceId}`,
        {
          operation: 'publishInsuranceDeleted',
          insuranceId: event.insuranceId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Insurance deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishInsuranceDeleted',
          insuranceId: event.insuranceId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish insurance expired event (from scheduler)
   *
   * Triggered by: InsuranceSchedulerService (Phase 4)
   * Used for: Audit trail logging
   *
   * @param event - Insurance expired event
   */
  publishInsuranceExpired(event: InsuranceExpiredEvent): void {
    try {
      this.logger.log(
        `Insurance expired event publishing - Insurance: ${event.insuranceId}, Year: ${event.membershipYear}`,
        {
          operation: 'publishInsuranceExpired',
          insuranceId: event.insuranceId,
          accountGuid: event.accountGuid?.substring(0, 8) + '...',
          certificateNumber: event.certificateNumber,
          membershipYear: event.membershipYear,
          expiryDate: event.expiryDate,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('insurance.expired', event);

      this.logger.log(
        `Insurance expired event emitted successfully - Insurance: ${event.insuranceId}`,
        {
          operation: 'publishInsuranceExpired',
          insuranceId: event.insuranceId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Insurance expired event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishInsuranceExpired',
          insuranceId: event.insuranceId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }
}
