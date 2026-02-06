/**
 * Membership Orchestrator Event Service
 *
 * Service responsible for emitting and managing membership orchestrator workflow events.
 * Provides observability and enables reactive programming patterns.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES,
  MembershipOrchestratorEventType,
  MembershipInitiatedEvent,
  MembershipValidatedEvent,
  MembershipStagedEvent,
  MembershipStatusChangedEvent,
  MembershipCompletedEvent,
  MembershipFailedEvent,
  MembershipExpiredEvent,
  MembershipCancelledEvent,
  EntityCreationStartedEvent,
  EntityCreationCompletedEvent,
  EntityCreationFailedEvent,
  PricingCalculatedEvent,
  PricingErrorEvent,
  ProductSelectedEvent,
  InsuranceValidatedEvent,
  PaymentInitiatedEvent,
  PaymentProcessingEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  AdminApprovalRequestedEvent,
  AdminApprovalGrantedEvent,
  AdminApprovalRejectedEvent,
  AccountStatusUpdatedEvent,
} from './membership-orchestrator-event.interfaces';

@Injectable()
export class MembershipOrchestratorEventService {
  private readonly logger = new Logger(MembershipOrchestratorEventService.name);
  private readonly eventEmitter: EventEmitter;

  constructor() {
    this.eventEmitter = new EventEmitter();
    // Increase max listeners to handle multiple event types
    this.eventEmitter.setMaxListeners(100);
  }

  // ========================================
  // MEMBERSHIP LIFECYCLE EVENTS
  // ========================================

  /**
   * Emit membership initiated event
   */
  emitMembershipInitiated(event: MembershipInitiatedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_INITIATED,
      event,
    );
    this.logger.log(
      `🚀 Membership initiated for session: ${event.sessionId} (${event.email}) - Category: ${event.category}`,
    );
  }

  /**
   * Emit membership validated event
   */
  emitMembershipValidated(event: MembershipValidatedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_VALIDATED,
      event,
    );

    if (event.isValid) {
      this.logger.log(
        `✅ Membership validation passed for session: ${event.sessionId} (${event.validationDuration}ms)`,
      );
    } else {
      this.logger.warn(
        `❌ Membership validation failed for session: ${event.sessionId} - ${event.errors?.join(', ')}`,
      );
    }
  }

  /**
   * Emit membership staged event
   */
  emitMembershipStaged(event: MembershipStagedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_STAGED,
      event,
    );
    this.logger.log(
      `📦 Membership staged for session: ${event.sessionId} (${event.email}) - Progress: ${event.progressPercentage}%`,
    );
  }

  /**
   * Emit membership status changed event
   */
  emitMembershipStatusChanged(event: MembershipStatusChangedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_STATUS_CHANGED,
      event,
    );
    this.logger.log(
      `🔄 Membership status changed for session: ${event.sessionId} - ${event.previousStatus} → ${event.newStatus}`,
    );
  }

  /**
   * Emit membership completed event
   */
  emitMembershipCompleted(event: MembershipCompletedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_COMPLETED,
      event,
    );
    this.logger.log(
      `🎉 Membership completed for session: ${event.sessionId} (${event.email}) - Duration: ${event.totalDuration}ms - Entities: ${event.entitiesCreated.join(', ')}`,
    );
  }

  /**
   * Emit membership failed event
   */
  emitMembershipFailed(event: MembershipFailedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_FAILED,
      event,
    );
    this.logger.error(
      `❌ Membership failed for session: ${event.sessionId} (${event.email}) - Stage: ${event.stage} - Error: ${event.error}`,
    );
  }

  /**
   * Emit membership expired event
   */
  emitMembershipExpired(event: MembershipExpiredEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_EXPIRED,
      event,
    );
    this.logger.warn(
      `⏱️ Membership expired for session: ${event.sessionId} - Last status: ${event.lastStatus} - Duration: ${event.sessionDuration}ms`,
    );
  }

  /**
   * Emit membership cancelled event
   */
  emitMembershipCancelled(event: MembershipCancelledEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.MEMBERSHIP_CANCELLED,
      event,
    );
    this.logger.log(
      `🚫 Membership cancelled for session: ${event.sessionId} by ${event.cancelledBy} - Reason: ${event.reason || 'N/A'}`,
    );
  }

  // ========================================
  // ENTITY CREATION EVENTS
  // ========================================

  /**
   * Emit entity creation started event
   */
  emitEntityCreationStarted(event: EntityCreationStartedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ENTITY_CREATION_STARTED,
      event,
    );
    this.logger.log(
      `🔨 Creating entity ${event.entityOrder}/${event.totalEntities}: ${event.entityType} for session: ${event.sessionId}`,
    );
  }

  /**
   * Emit entity creation completed event
   */
  emitEntityCreationCompleted(event: EntityCreationCompletedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ENTITY_CREATION_COMPLETED,
      event,
    );
    this.logger.log(
      `✅ Entity created: ${event.entityType} (${event.entityId}) - Session: ${event.sessionId} - Duration: ${event.duration}ms - Progress: ${event.progressPercentage}%`,
    );
  }

  /**
   * Emit entity creation failed event
   */
  emitEntityCreationFailed(event: EntityCreationFailedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ENTITY_CREATION_FAILED,
      event,
    );
    this.logger.error(
      `❌ Entity creation failed: ${event.entityType} - Session: ${event.sessionId} - Error: ${event.error} - Retry: ${event.willRetry}`,
    );
  }

  // ========================================
  // PRICING EVENTS
  // ========================================

  /**
   * Emit pricing calculated event
   */
  emitPricingCalculated(event: PricingCalculatedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PRICING_CALCULATED,
      event,
    );
    this.logger.log(
      `💰 Pricing calculated for session: ${event.sessionId} - Total: ${event.totalPrice} ${event.currency} (Base: ${event.basePrice}, Insurance: ${event.insurancePrice}) - Duration: ${event.calculationDuration}ms`,
    );
  }

  /**
   * Emit pricing error event
   */
  emitPricingError(event: PricingErrorEvent): void {
    this.emitEvent(MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PRICING_ERROR, event);
    this.logger.error(
      `❌ Pricing calculation error for session: ${event.sessionId} - Error: ${event.error}`,
    );
  }

  // ========================================
  // PRODUCT/INSURANCE EVENTS
  // ========================================

  /**
   * Emit product selected event
   */
  emitProductSelected(event: ProductSelectedEvent): void {
    this.emitEvent(MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PRODUCT_SELECTED, event);
    this.logger.log(
      `📦 Product selected for session: ${event.sessionId} - Product: ${event.productId} (${event.productType})`,
    );
  }

  /**
   * Emit insurance validated event
   */
  emitInsuranceValidated(event: InsuranceValidatedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.INSURANCE_VALIDATED,
      event,
    );

    if (event.isValid) {
      this.logger.log(
        `✅ Insurance validated for session: ${event.sessionId} - Type: ${event.insuranceType} - Coverage: ${event.coverageAmount}`,
      );
    } else {
      this.logger.warn(
        `❌ Insurance validation failed for session: ${event.sessionId} - Errors: ${event.errors?.join(', ')}`,
      );
    }
  }

  // ========================================
  // PAYMENT EVENTS
  // ========================================

  /**
   * Emit payment initiated event
   */
  emitPaymentInitiated(event: PaymentInitiatedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PAYMENT_INITIATED,
      event,
    );
    this.logger.log(
      `💳 Payment initiated for session: ${event.sessionId} - Amount: ${event.amount} ${event.currency} - Method: ${event.paymentMethod}`,
    );
  }

  /**
   * Emit payment processing event
   */
  emitPaymentProcessing(event: PaymentProcessingEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PAYMENT_PROCESSING,
      event,
    );
    this.logger.log(
      `🔄 Payment processing for session: ${event.sessionId} - Intent: ${event.paymentIntentId}`,
    );
  }

  /**
   * Emit payment completed event
   */
  emitPaymentCompleted(event: PaymentCompletedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PAYMENT_COMPLETED,
      event,
    );
    this.logger.log(
      `✅ Payment completed for session: ${event.sessionId} - Amount: ${event.amount} ${event.currency} - Transaction: ${event.transactionId} - Duration: ${event.processingDuration}ms`,
    );
  }

  /**
   * Emit payment failed event
   */
  emitPaymentFailed(event: PaymentFailedEvent): void {
    this.emitEvent(MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.PAYMENT_FAILED, event);
    this.logger.error(
      `❌ Payment failed for session: ${event.sessionId} - Amount: ${event.amount} - Error: ${event.error} - Can retry: ${event.canRetry}`,
    );
  }

  // ========================================
  // APPROVAL EVENTS
  // ========================================

  /**
   * Emit admin approval requested event
   */
  emitAdminApprovalRequested(event: AdminApprovalRequestedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ADMIN_APPROVAL_REQUESTED,
      event,
    );
    this.logger.log(
      `👮 Admin approval requested for session: ${event.sessionId} (${event.email}) - Category: ${event.category}`,
    );
  }

  /**
   * Emit admin approval granted event
   */
  emitAdminApprovalGranted(event: AdminApprovalGrantedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ADMIN_APPROVAL_GRANTED,
      event,
    );
    this.logger.log(
      `✅ Admin approval granted for session: ${event.sessionId} by ${event.approvedBy} - Duration: ${event.approvalDuration}ms`,
    );
  }

  /**
   * Emit admin approval rejected event
   */
  emitAdminApprovalRejected(event: AdminApprovalRejectedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ADMIN_APPROVAL_REJECTED,
      event,
    );
    this.logger.warn(
      `❌ Admin approval rejected for session: ${event.sessionId} by ${event.rejectedBy} - Reason: ${event.rejectionReason}`,
    );
  }

  // ========================================
  // ACCOUNT UPDATE EVENTS
  // ========================================

  /**
   * Emit account status updated event
   */
  emitAccountStatusUpdated(event: AccountStatusUpdatedEvent): void {
    this.emitEvent(
      MEMBERSHIP_ORCHESTRATOR_EVENT_TYPES.ACCOUNT_STATUS_UPDATED,
      event,
    );
    this.logger.log(
      `🔄 Account status updated for session: ${event.sessionId} - Active member: ${event.previousActiveMember} → ${event.newActiveMember} - Year: ${event.membershipYear}`,
    );
  }

  // ========================================
  // CORE EVENT EMISSION
  // ========================================

  /**
   * Core event emission method
   */
  private emitEvent(
    eventType: MembershipOrchestratorEventType,
    payload: any,
  ): void {
    try {
      this.eventEmitter.emit(eventType, payload);
    } catch (error) {
      this.logger.error(
        `Failed to emit event ${eventType}:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Subscribe to specific event type
   */
  on(
    eventType: MembershipOrchestratorEventType,
    listener: (...args: any[]) => void,
  ): void {
    this.eventEmitter.on(eventType, listener);
  }

  /**
   * Subscribe to event type once
   */
  once(
    eventType: MembershipOrchestratorEventType,
    listener: (...args: any[]) => void,
  ): void {
    this.eventEmitter.once(eventType, listener);
  }

  /**
   * Unsubscribe from event type
   */
  off(
    eventType: MembershipOrchestratorEventType,
    listener: (...args: any[]) => void,
  ): void {
    this.eventEmitter.off(eventType, listener);
  }

  /**
   * Remove all listeners for event type
   */
  removeAllListeners(eventType?: MembershipOrchestratorEventType): void {
    if (eventType) {
      this.eventEmitter.removeAllListeners(eventType);
    } else {
      this.eventEmitter.removeAllListeners();
    }
  }

  /**
   * Get listener count for event type
   */
  listenerCount(eventType: MembershipOrchestratorEventType): number {
    return this.eventEmitter.listenerCount(eventType);
  }
}
