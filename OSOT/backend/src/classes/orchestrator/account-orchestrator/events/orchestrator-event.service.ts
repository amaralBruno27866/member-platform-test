/**
 * Orchestrator Event Service
 *
 * Service responsible for emitting and managing orchestrator workflow events.
 * Provides observability and enables reactive programming patterns.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  OrchestratorEvent,
  ORCHESTRATOR_EVENT_TYPES,
  OrchestratorEventType,
  RegistrationInitiatedEvent,
  RegistrationValidatedEvent,
  RegistrationStagedEvent,
  RegistrationStatusChangedEvent,
  RegistrationApprovedEvent,
  RegistrationRejectedEvent,
  RegistrationStageCompletedEvent,
  RegistrationStageFailedEvent,
  RegistrationCompletedEvent,
  RegistrationFailedEvent,
  RegistrationExpiredEvent,
  EmailVerificationEvent,
} from './orchestrator-event.interfaces';

@Injectable()
export class OrchestratorEventService {
  private readonly logger = new Logger(OrchestratorEventService.name);
  private readonly eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
    // Increase max listeners to handle multiple event types
    this.eventEmitter.setMaxListeners(100);
  }

  /**
   * Emit registration initiated event
   */
  emitRegistrationInitiated(event: RegistrationInitiatedEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_INITIATED, event);
    this.logger.log(
      `🚀 Registration initiated for session: ${event.sessionId} (${event.email})`,
    );
  }

  /**
   * Emit registration validated event
   */
  emitRegistrationValidated(event: RegistrationValidatedEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_VALIDATED, event);

    if (event.isValid) {
      this.logger.log(
        `✅ Registration validation passed for session: ${event.sessionId}`,
      );
    } else {
      this.logger.warn(
        `❌ Registration validation failed for session: ${event.sessionId} - ${event.errors?.join(', ')}`,
      );
    }
  }

  /**
   * Emit registration staged event
   */
  emitRegistrationStaged(event: RegistrationStagedEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_STAGED, event);
    this.logger.log(
      `📦 Registration staged for session: ${event.sessionId} (${event.email}) - Progress: ${event.progressPercentage}%`,
    );
  }

  /**
   * Emit registration status changed event
   */
  emitRegistrationStatusChanged(event: RegistrationStatusChangedEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_STATUS_CHANGED, event);
    this.logger.log(
      `🔄 Registration status changed for session: ${event.sessionId} - ${event.previousStatus} → ${event.newStatus}`,
    );
  }

  /**
   * Emit registration approved event
   */
  emitRegistrationApproved(event: RegistrationApprovedEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_APPROVED, event);
    this.logger.log(
      `👍 Registration approved for session: ${event.sessionId} by ${event.approvedBy}`,
    );
  }

  /**
   * Emit registration rejected event
   */
  emitRegistrationRejected(event: RegistrationRejectedEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_REJECTED, event);
    this.logger.warn(
      `👎 Registration rejected for session: ${event.sessionId} by ${event.rejectedBy} - Reason: ${event.rejectionReason}`,
    );
  }

  /**
   * Emit registration stage completed event
   */
  emitRegistrationStageCompleted(event: RegistrationStageCompletedEvent): void {
    this.emitEvent(
      ORCHESTRATOR_EVENT_TYPES.REGISTRATION_STAGE_COMPLETED,
      event,
    );
    this.logger.log(
      `✅ Stage '${event.stageName}' completed for session: ${event.sessionId} - Progress: ${event.progressPercentage}%`,
    );
  }

  /**
   * Emit registration stage failed event
   */
  emitRegistrationStageFailed(event: RegistrationStageFailedEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_STAGE_FAILED, event);
    this.logger.error(
      `❌ Stage '${event.stageName}' failed for session: ${event.sessionId} - Error: ${event.error}`,
    );
  }

  /**
   * Emit registration completed event
   */
  emitRegistrationCompleted(event: RegistrationCompletedEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_COMPLETED, event);
    this.logger.log(
      `🎉 Registration completed for session: ${event.sessionId} (${event.email}) - Account ID: ${event.accountId}`,
    );
  }

  /**
   * Emit registration failed event
   */
  emitRegistrationFailed(event: RegistrationFailedEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_FAILED, event);
    this.logger.error(
      `💥 Registration failed for session: ${event.sessionId} (${event.email}) - Error: ${event.error}`,
    );
  }

  /**
   * Emit registration expired event
   */
  emitRegistrationExpired(event: RegistrationExpiredEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.REGISTRATION_EXPIRED, event);
    this.logger.warn(
      `⏰ Registration expired for session: ${event.sessionId} (${event.email}) - Reason: ${event.expirationReason}`,
    );
  }

  /**
   * Emit email verification event
   */
  emitEmailVerification(event: EmailVerificationEvent): void {
    this.emitEvent(ORCHESTRATOR_EVENT_TYPES.EMAIL_VERIFICATION, event);

    if (event.verified) {
      this.logger.log(
        `📧 Email verified for session: ${event.sessionId} (${event.email})`,
      );
    } else {
      this.logger.warn(
        `📧 Email verification failed for session: ${event.sessionId} (${event.email})`,
      );
    }
  }

  /**
   * Generic method to emit any orchestrator event
   */
  emitEvent<T extends OrchestratorEvent>(
    eventType: OrchestratorEventType,
    event: T,
  ): void {
    try {
      // Add event type to the event data
      const eventData = {
        ...event,
        eventType,
        emittedAt: new Date(),
      };

      // Emit the event
      this.eventEmitter.emit(eventType, eventData);

      // Debug log for development
      this.logger.debug(
        `Event emitted: ${eventType} for session: ${event.sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit event ${eventType} for session: ${event.sessionId}`,
        error,
      );
    }
  }

  /**
   * Get all available event types
   */
  getEventTypes(): typeof ORCHESTRATOR_EVENT_TYPES {
    return ORCHESTRATOR_EVENT_TYPES;
  }

  /**
   * Helper method to create base event data
   */
  createBaseEvent(
    sessionId: string,
    metadata?: { [key: string]: any },
  ): { sessionId: string; timestamp: Date; metadata?: any } {
    return {
      sessionId,
      timestamp: new Date(),
      metadata,
    };
  }
}
