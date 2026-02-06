/**
 * Additional Insured Events Service
 *
 * Publishes domain events for Additional Insured lifecycle with structured logging.
 * Events are emitted via NestJS EventEmitter2 for consumption by listeners.
 *
 * EVENTS:
 * 1. additional-insured.created - Additional insured record successfully created
 * 2. additional-insured.updated - Additional insured record updated
 * 3. additional-insured.deleted - Additional insured record deleted (soft delete)
 *
 * DESIGN PATTERN:
 * - Events published for audit trail logging
 * - EventEmitter2 handles async listener execution
 * - Don't throw on event publishing (events should not break main flow)
 * - All errors caught and logged (no cascade failures)
 *
 * @file additional-insured-events.service.ts
 * @module AdditionalInsuredModule
 * @layer Events
 * @since 2026-01-29
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * Additional insured created event payload
 */
export interface AdditionalInsuredCreatedEvent {
  additionalInsuredId: string;
  insuranceId: string;
  organizationGuid: string;
  companyName: string;
  userGuid: string;
  timestamp: Date;
}

/**
 * Additional insured updated event payload
 */
export interface AdditionalInsuredUpdatedEvent {
  additionalInsuredId: string;
  insuranceId: string;
  organizationGuid: string;
  changes: {
    new: Record<string, any>;
    old: Record<string, any>;
  };
  changedFields: string[];
  userGuid: string;
  timestamp: Date;
}

/**
 * Additional insured deleted event payload
 */
export interface AdditionalInsuredDeletedEvent {
  additionalInsuredId: string;
  insuranceId: string;
  organizationGuid: string;
  companyName: string;
  userGuid: string;
  reason?: string;
  timestamp: Date;
}

/**
 * Additional Insured Events Service
 */
@Injectable()
export class AdditionalInsuredEventsService {
  private readonly logger = new Logger(AdditionalInsuredEventsService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Publish additional insured created event
   *
   * Triggered by: AdditionalInsuredCrudService.create()
   * Used for: Audit trail logging
   *
   * @param event - Additional insured created event
   */
  publishAdditionalInsuredCreated(event: AdditionalInsuredCreatedEvent): void {
    try {
      this.logger.log(
        `Additional insured created event publishing - Insurance: ${event.insuranceId}, Company: ${event.companyName}`,
        {
          operation: 'publishAdditionalInsuredCreated',
          additionalInsuredId: event.additionalInsuredId,
          insuranceId: event.insuranceId,
          organizationGuid: event.organizationGuid?.substring(0, 8) + '...',
          companyName: event.companyName,
          userGuid: event.userGuid?.substring(0, 8) + '...',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event (async, non-blocking)
      this.eventEmitter.emit('additional-insured.created', event);

      this.logger.log(
        `Additional insured created event emitted successfully - ID: ${event.additionalInsuredId}`,
        {
          operation: 'publishAdditionalInsuredCreated',
          additionalInsuredId: event.additionalInsuredId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Additional insured created event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishAdditionalInsuredCreated',
          additionalInsuredId: event.additionalInsuredId,
          insuranceId: event.insuranceId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish additional insured updated event
   *
   * Triggered by: AdditionalInsuredCrudService.update()
   * Used for: Audit trail logging
   *
   * @param event - Additional insured updated event
   */
  publishAdditionalInsuredUpdated(event: AdditionalInsuredUpdatedEvent): void {
    try {
      const changedFieldsList = event.changedFields.join(', ');

      this.logger.log(
        `Additional insured updated event publishing - ID: ${event.additionalInsuredId}, Fields: ${changedFieldsList}`,
        {
          operation: 'publishAdditionalInsuredUpdated',
          additionalInsuredId: event.additionalInsuredId,
          insuranceId: event.insuranceId,
          organizationGuid: event.organizationGuid?.substring(0, 8) + '...',
          changedFields: changedFieldsList,
          userGuid: event.userGuid?.substring(0, 8) + '...',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('additional-insured.updated', event);

      this.logger.log(
        `Additional insured updated event emitted successfully - ID: ${event.additionalInsuredId}`,
        {
          operation: 'publishAdditionalInsuredUpdated',
          additionalInsuredId: event.additionalInsuredId,
          changedFieldsCount: event.changedFields.length,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Additional insured updated event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishAdditionalInsuredUpdated',
          additionalInsuredId: event.additionalInsuredId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }

  /**
   * Publish additional insured deleted event
   *
   * Triggered by: AdditionalInsuredCrudService.delete()
   * Used for: Audit trail logging (soft delete)
   *
   * @param event - Additional insured deleted event
   */
  publishAdditionalInsuredDeleted(event: AdditionalInsuredDeletedEvent): void {
    try {
      this.logger.log(
        `Additional insured deleted event publishing - ID: ${event.additionalInsuredId}, Company: ${event.companyName}, Reason: ${event.reason || 'Not specified'}`,
        {
          operation: 'publishAdditionalInsuredDeleted',
          additionalInsuredId: event.additionalInsuredId,
          insuranceId: event.insuranceId,
          organizationGuid: event.organizationGuid?.substring(0, 8) + '...',
          companyName: event.companyName,
          userGuid: event.userGuid?.substring(0, 8) + '...',
          reason: event.reason || 'Not specified',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // Emit event
      this.eventEmitter.emit('additional-insured.deleted', event);

      this.logger.log(
        `Additional insured deleted event emitted successfully - ID: ${event.additionalInsuredId}`,
        {
          operation: 'publishAdditionalInsuredDeleted',
          additionalInsuredId: event.additionalInsuredId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish Additional insured deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          operation: 'publishAdditionalInsuredDeleted',
          additionalInsuredId: event.additionalInsuredId,
          error: error instanceof Error ? error.stack : undefined,
        },
      );
    }
  }
}
