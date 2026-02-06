/**
 * @fileoverview Membership Preferences Events
 * @description Domain events for membership preferences operations
 * @author Bruno Amaral
 * @since 2025
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Structured Logging: Operation IDs, security-aware logging
 * - Event Philosophy: Prepare for future event sourcing integration
 * - Audit Trail: Comprehensive lifecycle tracking
 * - Business Rules: Validation event tracking
 *
 * EVENT PHILOSOPHY:
 * - Essential preference events for comprehensive lifecycle tracking
 * - Clean event interfaces for audit trails and compliance
 * - Simple event service for publishing with enterprise logging
 * - Focus on core preference operations with business rule tracking
 * - Renewable membership workflow support
 *
 * Events tracked:
 * - MembershipPreferenceCreatedEvent
 * - MembershipPreferenceUpdatedEvent
 * - MembershipPreferenceDeletedEvent
 * - MembershipPreferenceAutoRenewalChangedEvent
 * - MembershipPreferenceUserYearDuplicateEvent
 */

import { Injectable, Logger } from '@nestjs/common';
import { Privilege } from '../../../../common/enums';

/**
 * Membership Preference Events Data Transfer Objects
 */

/**
 * Membership Preference Created Event
 * Tracks new preference creation with comprehensive details for audit and analytics
 */
export interface MembershipPreferenceCreatedEvent {
  preferenceId: string;
  operationId: string;
  membershipYear: string;
  accountId?: string;
  affiliateId?: string;
  categoryId?: string;
  autoRenewal?: boolean;
  thirdParties?: boolean;
  practicePromotion?: boolean;
  membersSearchTools?: boolean;
  shadowing?: boolean;
  psychotherapySupervision?: boolean;
  userId?: string;
  userPrivilege?: Privilege;
  registrationSource?: string; // 'web', 'api', 'admin', etc.
  timestamp: Date;
}

/**
 * Membership Preference Updated Event
 * Tracks preference modifications with detailed change tracking for compliance
 */
export interface MembershipPreferenceUpdatedEvent {
  preferenceId: string;
  operationId: string;
  membershipYear: string;
  changes: {
    old: Record<string, any>;
    new: Record<string, any>;
  };
  updateReason?: string; // 'user_request', 'admin_action', 'system_update', 'renewal'
  updatedBy: string;
  userPrivilege?: Privilege;
  timestamp: Date;
}

/**
 * Membership Preference Deleted Event
 * Tracks preference deletion with comprehensive audit information (hard delete)
 */
export interface MembershipPreferenceDeletedEvent {
  preferenceId: string;
  operationId: string;
  membershipYear: string;
  accountId?: string;
  affiliateId?: string;
  deletionReason:
    | 'user_request'
    | 'admin_action'
    | 'year_change'
    | 'duplicate_cleanup';
  deletedBy: string;
  userPrivilege?: Privilege;
  timestamp: Date;
}

/**
 * Membership Preference Auto-Renewal Changed Event
 * Tracks auto-renewal setting changes for annual renewal workflows
 */
export interface MembershipPreferenceAutoRenewalChangedEvent {
  preferenceId: string;
  operationId: string;
  membershipYear: string;
  accountId?: string;
  affiliateId?: string;
  previousAutoRenewal: boolean;
  newAutoRenewal: boolean;
  changeReason?:
    | 'user_request'
    | 'admin_override'
    | 'payment_failure'
    | 'compliance';
  changedBy: string;
  userPrivilege?: Privilege;
  timestamp: Date;
}

/**
 * Membership Preference User-Year Duplicate Event
 * Tracks validation failures for user-year uniqueness (for auditing and alerts)
 */
export interface MembershipPreferenceUserYearDuplicateEvent {
  preferenceId: string; // The ID that was attempted
  operationId: string;
  membershipYear: string;
  accountId?: string;
  affiliateId?: string;
  existingPreferenceId?: string; // The existing preference that caused conflict
  attemptedBy?: string;
  ipAddress?: string;
  timestamp: Date;
}

/**
 * Membership Preference Events Service
 * Handles event publishing with structured logging (Phase 1: Logging only)
 *
 * FUTURE INTEGRATION READY:
 * - Event Bus (Phase 2): NestJS EventEmitter2
 * - Event Store (Phase 3): PostgreSQL event sourcing
 * - CQRS (Phase 4): Read/Write model separation
 * - Distributed Events (Phase 5): RabbitMQ/Kafka
 */
@Injectable()
export class MembershipPreferenceEventsService {
  private readonly logger = new Logger(MembershipPreferenceEventsService.name);

  constructor() {
    this.logger.log(
      'Membership Preference Events Service initialized successfully',
    );
  }

  // ========================================
  // CORE LIFECYCLE EVENTS
  // ========================================

  /**
   * Publish preference created event
   * Logs preference creation with business context for audit trails
   */
  publishPreferenceCreated(event: MembershipPreferenceCreatedEvent): void {
    try {
      const userType = event.accountId ? 'Account' : 'Affiliate';
      const userId = event.accountId || event.affiliateId;

      this.logger.log(
        `Preference created - ID: ${event.preferenceId}, Year: ${event.membershipYear}, User: ${userType}/${userId}, Auto-Renewal: ${event.autoRenewal}`,
        {
          operation: 'preference_created',
          preferenceId: event.preferenceId,
          operationId: event.operationId,
          membershipYear: event.membershipYear,
          accountId: event.accountId,
          affiliateId: event.affiliateId,
          categoryId: event.categoryId,
          autoRenewal: event.autoRenewal,
          registrationSource: event.registrationSource || 'unknown',
          userId: event.userId,
          userPrivilege: event.userPrivilege,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('preference.created', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Preference created event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish preference updated event
   * Tracks preference modifications with detailed change analysis
   */
  publishPreferenceUpdated(event: MembershipPreferenceUpdatedEvent): void {
    try {
      const changedFields = Object.keys(event.changes.new).join(', ');

      this.logger.log(
        `Preference updated - ID: ${event.preferenceId}, Year: ${event.membershipYear}, Fields: ${changedFields}, Reason: ${event.updateReason || 'Not specified'}`,
        {
          operation: 'preference_updated',
          preferenceId: event.preferenceId,
          operationId: event.operationId,
          membershipYear: event.membershipYear,
          changedFields,
          updateReason: event.updateReason,
          updatedBy: event.updatedBy,
          userPrivilege: event.userPrivilege,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('preference.updated', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Preference updated event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Publish preference deleted event
   * Logs preference deletion with comprehensive audit information
   */
  publishPreferenceDeleted(event: MembershipPreferenceDeletedEvent): void {
    try {
      const userType = event.accountId ? 'Account' : 'Affiliate';
      const userId = event.accountId || event.affiliateId;

      this.logger.log(
        `Preference deleted - ID: ${event.preferenceId}, Year: ${event.membershipYear}, User: ${userType}/${userId}, Reason: ${event.deletionReason}`,
        {
          operation: 'preference_deleted',
          preferenceId: event.preferenceId,
          operationId: event.operationId,
          membershipYear: event.membershipYear,
          accountId: event.accountId,
          affiliateId: event.affiliateId,
          deletionReason: event.deletionReason,
          deletedBy: event.deletedBy,
          userPrivilege: event.userPrivilege,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('preference.deleted', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Preference deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // ========================================
  // BUSINESS RULE EVENTS
  // ========================================

  /**
   * Publish auto-renewal changed event
   * Tracks auto-renewal setting changes for annual renewal workflows
   */
  publishAutoRenewalChanged(
    event: MembershipPreferenceAutoRenewalChangedEvent,
  ): void {
    try {
      const userType = event.accountId ? 'Account' : 'Affiliate';
      const userId = event.accountId || event.affiliateId;

      this.logger.log(
        `Auto-renewal changed - ID: ${event.preferenceId}, Year: ${event.membershipYear}, User: ${userType}/${userId}, Change: ${event.previousAutoRenewal} → ${event.newAutoRenewal}, Reason: ${event.changeReason || 'Not specified'}`,
        {
          operation: 'preference_auto_renewal_changed',
          preferenceId: event.preferenceId,
          operationId: event.operationId,
          membershipYear: event.membershipYear,
          accountId: event.accountId,
          affiliateId: event.affiliateId,
          previousAutoRenewal: event.previousAutoRenewal,
          newAutoRenewal: event.newAutoRenewal,
          changeReason: event.changeReason,
          changedBy: event.changedBy,
          userPrivilege: event.userPrivilege,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('preference.auto_renewal_changed', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Auto-renewal changed event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Publish user-year duplicate detection event
   * Tracks validation failures for auditing and security monitoring
   */
  publishUserYearDuplicate(
    event: MembershipPreferenceUserYearDuplicateEvent,
  ): void {
    try {
      const userType = event.accountId ? 'Account' : 'Affiliate';
      const userId = event.accountId || event.affiliateId;

      this.logger.warn(
        `User-year duplicate detected - Year: ${event.membershipYear}, User: ${userType}/${userId}, Attempted ID: ${event.preferenceId}, Existing ID: ${event.existingPreferenceId}`,
        {
          operation: 'preference_user_year_duplicate',
          attemptedPreferenceId: event.preferenceId,
          existingPreferenceId: event.existingPreferenceId,
          operationId: event.operationId,
          membershipYear: event.membershipYear,
          accountId: event.accountId,
          affiliateId: event.affiliateId,
          attemptedBy: event.attemptedBy,
          ipAddress: event.ipAddress,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish('preference.duplicate_detected', event);
    } catch (error) {
      this.logger.error(
        `Failed to publish User-year duplicate event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get event statistics for monitoring
   */
  getEventStats(): {
    eventsEmitted: number;
    lastEventTime: Date;
    eventTypes: Record<string, number>;
  } {
    return {
      eventsEmitted: 0, // TODO: Implement event counting
      lastEventTime: new Date(),
      eventTypes: {
        created: 0,
        updated: 0,
        deleted: 0,
        autoRenewalChanged: 0,
        duplicateDetected: 0,
      },
    };
  }

  /**
   * Get events for a specific preference (for audit trail)
   */
  getPreferenceEventHistory(preferenceId: string): Promise<any[]> {
    this.logger.log(`Retrieving event history for preference: ${preferenceId}`);

    // TODO: Implement event retrieval from event store
    return Promise.resolve([]);
  }

  /**
   * Get events for a specific user across all years
   */
  getUserPreferenceHistory(
    userId: string,
    userType: 'account' | 'affiliate',
  ): Promise<any[]> {
    this.logger.log(`Retrieving preference history for ${userType}: ${userId}`);

    // TODO: Implement event retrieval from event store
    return Promise.resolve([]);
  }
}
