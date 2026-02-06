/**
 * Insurance Event Listeners
 *
 * Listens for order checkout completion and orchestrates insurance creation.
 *
 * EVENT FLOW:
 * 1. Frontend checkout → Order created + persisted to Dataverse
 * 2. OrderCreatedEvent emitted with order + orderProducts[]
 * 3. Insurance listeners triggered:
 *    a. ValidateInsuranceForOrder - Validate insurance items
 *    b. CreateInsuranceFromOrder - Create insurance records
 *
 * LISTENERS:
 * 1. OnOrderCreated (ValidateInsuranceForOrder)
 *    - Check if order has insurance items
 *    - If no insurance → exit silently
 *    - If has insurance:
 *      a. Call OrderInsuranceOrchestratorService.orchestrateInsuranceValidation()
 *      b. Validates all insurance items
 *      c. Returns session ID with validation results
 *      d. Emits InsuranceValidationCompletedEvent (for next listener)
 *
 * 2. OnInsuranceValidationCompleted (CreateInsuranceFromOrder)
 *    - Receive session ID from validation event
 *    - Call InsuranceSnapshotOrchestratorService.createInsuranceFromSession()
 *    - Creates Insurance records from validated session
 *    - Updates session status to 'completed'
 *    - Emits InsuranceCreatedEvent (for audit trail)
 *    - Deletes session (cleanup)
 *
 * ERROR HANDLING:
 * - If validation fails → EmitInsuranceValidationFailedEvent
 * - If creation fails → Emit InsuranceCreationFailedEvent
 * - Session cleanup on failures
 * - Logs all operations for audit trail
 *
 * INTEGRATION POINTS:
 * - OrderCreatedEvent (input)
 * - OrderInsuranceOrchestratorService (validation)
 * - InsuranceSnapshotOrchestratorService (creation)
 * - InsuranceEventsService (emit events)
 * - RedisService (session management)
 *
 * @file insurance.listeners.ts
 * @module InsuranceModule
 * @layer EventListeners
 * @since 2026-01-28
 */

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderInsuranceOrchestratorService } from '../../../order/orchestrator/services/order-insurance.orchestrator.service';
import { InsuranceSnapshotOrchestratorService } from '../services/insurance-snapshot.orchestrator.service';
import { InsuranceEventsService } from '../../events/insurance-events.service';
import { OrderEventsService } from '../../../order/events/order-events.service';
import { RedisService } from '../../../../../redis/redis.service';

/**
 * Order created event payload (from Order module)
 */
interface OrderCreatedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  orderProducts?: Array<{
    osot_product_category?: string;
    osot_insurance_type?: string;
    [key: string]: unknown;
  }>;
  timestamp: Date;
}

/**
 * Insurance validation completed event payload
 */
interface InsuranceValidationCompletedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  sessionId: string;
  timestamp: Date;
}

/**
 * Insurance validation failed event payload
 */
interface InsuranceValidationFailedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  sessionId: string;
  timestamp: Date;
  errors: string[];
}

/**
 * Insurance creation failed event payload
 */
interface InsuranceCreationFailedEvent {
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  sessionId: string;
  timestamp: Date;
  error: string;
}

/**
 * Insurance event listeners
 *
 * Handles:
 * - Validation of insurance items from order
 * - Creation of insurance records from validated session
 * - Event emission for audit trail
 * - Error handling and cleanup
 */
@Injectable()
export class InsuranceEventListeners {
  private readonly logger: Logger = new Logger(InsuranceEventListeners.name);

  constructor(
    private readonly orderInsuranceOrchestrator: OrderInsuranceOrchestratorService,
    private readonly insuranceSnapshotOrchestrator: InsuranceSnapshotOrchestratorService,
    private readonly insuranceEventsService: InsuranceEventsService,
    private readonly orderEventsService: OrderEventsService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * LISTENER 1: Validate Insurance Items When Order is Created
   *
   * Triggered by: OrderCreatedEvent
   *
   * PROCESS:
   * 1. Check if order has insurance items
   * 2. If no insurance items → exit silently (nothing to do)
   * 3. If has insurance items:
   *    a. Call orchestrator to validate
   *    b. Get session with validation results
   *    c. Emit InsuranceValidationCompletedEvent for next listener
   *
   * @param event - OrderCreatedEvent
   */

  @OnEvent('order.created')
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const operationId = `on_order_created_${Date.now()}`;

    try {
      this.logger.log(
        `Processing order creation for insurance - Order: ${event.orderId}`,
        {
          operation: 'onOrderCreated',
          operationId,
          orderId: event.orderId,
        },
      );

      // 1. Check if order has insurance items
      // NOTE: OrderCreatedEvent should include orderProducts array with category info
      // If event doesn't have products, skip insurance orchestration
      if (!event.orderProducts || event.orderProducts.length === 0) {
        this.logger.log(`No order products in event - Order: ${event.orderId}`);
        return;
      }

      const hasInsuranceItems = event.orderProducts.some(
        (op) => op.osot_product_category === '1', // ProductCategory.INSURANCE = '1' (string)
      );

      if (!hasInsuranceItems) {
        this.logger.log(
          `No insurance items in order - Order: ${event.orderId}`,
        );
        return; // Nothing to do
      }

      // 2. Orchestrate insurance validation
      const sessionId =
        await this.orderInsuranceOrchestrator.orchestrateInsuranceValidation(
          event.orderId,
          event.accountGuid,
          event.organizationGuid,
        );

      // 3. Get session to check status
      const session =
        await this.orderInsuranceOrchestrator.getSession(sessionId);

      if (!session) {
        throw new Error(`Session not found after orchestration: ${sessionId}`);
      }

      // 4. Emit validation completed event (for next listener)
      const validationEvent: InsuranceValidationCompletedEvent = {
        orderId: event.orderId,
        accountGuid: event.accountGuid,
        organizationGuid: event.organizationGuid,
        sessionId,
        timestamp: new Date(),
      };

      this.logger.log(
        `Insurance validation completed - Session: ${sessionId}, Status: ${session.status}`,
        {
          operation: 'onOrderCreated',
          operationId,
          orderId: event.orderId,
          sessionId,
          itemCount: session.insuranceItems.length,
          errorCount: session.errors.length,
        },
      );

      // Emit event for creation listener (only if validation passed)
      if (session.status === 'validated') {
        this.insuranceEventsService.publishInsuranceValidationCompleted(
          validationEvent,
        );
      } else if (session.status === 'failed') {
        // Emit failure event
        this.insuranceEventsService.publishInsuranceValidationFailed({
          ...validationEvent,
          errors: session.errors,
        });
      }
    } catch (error) {
      this.logger.error(
        `Error processing order for insurance: ${error instanceof Error ? error.message : String(error)}`,
        { operation: 'onOrderCreated', operationId, orderId: event.orderId },
      );

      // Emit failure event
      this.insuranceEventsService.publishInsuranceValidationFailed({
        orderId: event.orderId,
        accountGuid: event.accountGuid,
        organizationGuid: event.organizationGuid,
        sessionId: '',
        timestamp: new Date(),
        errors: [error instanceof Error ? error.message : String(error)],
      });
    }
  }

  /**
   * LISTENER 2: Create Insurance Records When Validation Completes
   *
   * Triggered by: InsuranceValidationCompletedEvent
   *
   * PROCESS:
   * 1. Get orchestration session
   * 2. Create insurance records from session
   * 3. Emit InsuranceCreatedEvent (audit trail)
   * 4. Cleanup session (delete from Redis)
   *
   * NOTE: This listener is called ONLY if validation passed
   *
   * @param event - InsuranceValidationCompletedEvent
   */

  @OnEvent('insurance.validation-completed')
  async onInsuranceValidationCompleted(
    event: InsuranceValidationCompletedEvent,
  ): Promise<void> {
    const operationId = `on_insurance_validation_completed_${Date.now()}`;

    try {
      this.logger.log(
        `Creating insurance records from validation session - Session: ${event.sessionId}`,
        {
          operation: 'onInsuranceValidationCompleted',
          operationId,
          sessionId: event.sessionId,
          orderId: event.orderId,
        },
      );

      // 1. Create insurance records
      const createdRecords =
        await this.insuranceSnapshotOrchestrator.createInsuranceFromSession(
          event.sessionId,
        );

      // 2. Emit creation success event (audit trail)
      this.insuranceEventsService.publishInsuranceCreated({
        orderId: event.orderId,
        accountGuid: event.accountGuid,
        organizationGuid: event.organizationGuid,
        insuranceCount: createdRecords.length,
        insuranceIds: createdRecords.map((r) => r.insuranceId),
        timestamp: new Date(),
      });

      // 3. Cleanup session
      await this.orderInsuranceOrchestrator.deleteSession(event.sessionId);

      this.logger.log(
        `Insurance creation completed and session deleted - Session: ${event.sessionId}, Records: ${createdRecords.length}`,
        {
          operation: 'onInsuranceValidationCompleted',
          operationId,
          sessionId: event.sessionId,
          recordCount: createdRecords.length,
        },
      );
    } catch (error) {
      this.logger.error(
        `Error creating insurance from validation: ${error instanceof Error ? error.message : String(error)}`,
        {
          operation: 'onInsuranceValidationCompleted',
          operationId,
          sessionId: event.sessionId,
        },
      );

      // Emit failure event
      this.insuranceEventsService.publishInsuranceCreationFailed({
        orderId: event.orderId,
        accountGuid: event.accountGuid,
        organizationGuid: event.organizationGuid,
        sessionId: event.sessionId,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      });

      // Attempt cleanup (don't fail if this throws)
      try {
        await this.orderInsuranceOrchestrator.deleteSession(event.sessionId);
      } catch (cleanupError) {
        this.logger.warn(
          `Error cleaning up session ${event.sessionId}: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`,
        );
      }
    }
  }

  /**
   * LISTENER 3 (Optional): Handle Insurance Validation Failures
   *
   * Triggered by: InsuranceValidationFailedEvent
   *
   * PROCESS:
   * 1. Get orchestration session
   * 2. Log validation errors
   * 3. Cleanup session
   * 4. Optionally notify user (future: webhook/notification system)
   *
   * @param event - Validation failure event
   */

  @OnEvent('insurance.validation-failed')
  async onInsuranceValidationFailed(
    event: InsuranceValidationFailedEvent,
  ): Promise<void> {
    const operationId = `on_insurance_validation_failed_${Date.now()}`;

    try {
      this.logger.warn(
        `Insurance validation failed - Order: ${event.orderId}, Session: ${event.sessionId}`,
        {
          operation: 'onInsuranceValidationFailed',
          operationId,
          orderId: event.orderId,
          sessionId: event.sessionId,
          errors: event.errors,
        },
      );

      // Get session for detailed logging
      if (event.sessionId) {
        const session = await this.orderInsuranceOrchestrator.getSession(
          event.sessionId,
        );
        if (session) {
          this.logger.log(`Validation failed details:`, {
            itemCount: session.insuranceItems.length,
            errors: session.errors,
            validationResults: Object.entries(session.validationResults).map(
              ([key, result]) => ({
                itemId: key,
                isValid: (result as { isValid: boolean; errors?: string[] })
                  .isValid,
                errors: (result as { isValid: boolean; errors?: string[] })
                  .errors,
              }),
            ),
          });
        }
      }

      // Cleanup session
      if (event.sessionId) {
        await this.orderInsuranceOrchestrator.deleteSession(event.sessionId);
      }

      // TODO: Notify user via notification system about validation failure
      // await this.notificationService.sendInsuranceValidationFailedNotification({
      //   accountGuid: event.accountGuid,
      //   orderId: event.orderId,
      //   errors: event.errors,
      // });
    } catch (error) {
      this.logger.error(
        `Error handling insurance validation failure: ${error instanceof Error ? error.message : String(error)}`,
        { operation: 'onInsuranceValidationFailed', operationId },
      );
    }
  }

  /**
   * LISTENER 4 (Optional): Handle Insurance Creation Failures
   *
   * Triggered by: InsuranceCreationFailedEvent
   *
   * PROCESS:
   * 1. Log creation error
   * 2. Cleanup session
   * 3. Optionally notify support team (future)
   *
   * @param event - Creation failure event
   */

  @OnEvent('insurance.creation-failed')
  async onInsuranceCreationFailed(
    event: InsuranceCreationFailedEvent,
  ): Promise<void> {
    const operationId = `on_insurance_creation_failed_${Date.now()}`;

    try {
      this.logger.error(
        `Insurance creation failed - Order: ${event.orderId}, Error: ${event.error}`,
        {
          operation: 'onInsuranceCreationFailed',
          operationId,
          orderId: event.orderId,
          sessionId: event.sessionId,
          error: event.error,
        },
      );

      // Cleanup session
      if (event.sessionId) {
        await this.orderInsuranceOrchestrator.deleteSession(event.sessionId);
      }

      // TODO: Notify support team about creation failure
      // await this.slackService.sendInsuranceCreationFailureAlert({
      //   orderId: event.orderId,
      //   accountGuid: event.accountGuid,
      //   error: event.error,
      // });
    } catch (error) {
      this.logger.error(
        `Error handling insurance creation failure: ${error instanceof Error ? error.message : String(error)}`,
        { operation: 'onInsuranceCreationFailed', operationId },
      );
    }
  }
}
