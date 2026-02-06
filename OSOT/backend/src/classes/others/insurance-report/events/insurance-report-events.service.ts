/**
 * Insurance Report Events Service
 *
 * Publishes domain events for Insurance Report operations.
 * Used for audit trails and integration with other systems.
 *
 * Events:
 * - reportCreated     → When report is initially created
 * - reportApproved    → When report is approved by approver
 * - reportRejected    → When report is rejected with reason
 * - reportSentToProvider   → When report is sent to insurance provider
 * - reportAcknowledged → When provider acknowledges receipt
 *
 * @file insurance-report-events.service.ts
 * @module InsuranceReportModule
 * @layer Events
 */

import { Injectable, Logger } from '@nestjs/common';

/**
 * Insurance Report domain event payloads
 */
export interface ReportCreatedEvent {
  reportId: string;
  reportGuid: string;
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  createdOn: Date;
}

export interface ReportApprovedEvent {
  reportId: string;
  reportGuid: string;
  organizationId: string;
  approvedBy: string;
  approvedDate: Date;
  approvedToken: string;
}

export interface ReportRejectedEvent {
  reportId: string;
  reportGuid: string;
  organizationId: string;
  rejectedBy: string;
  rejectedDate: Date;
  rejectionReason: string;
  rejectionToken: string;
}

export interface ReportSentToProviderEvent {
  reportId: string;
  reportGuid: string;
  organizationId: string;
  sentDate: Date;
}

export interface ReportAcknowledgedEvent {
  reportId: string;
  reportGuid: string;
  organizationId: string;
  acknowledgedDate: Date;
}

/**
 * Insurance Report Events Service
 * Publishes domain events to event bus (currently logs to logger)
 * TODO: Integrate with event sourcing system
 */
@Injectable()
export class InsuranceReportEventsService {
  private readonly logger = new Logger(InsuranceReportEventsService.name);

  /**
   * Publish: Report Created Event
   */
  publishReportCreated(event: ReportCreatedEvent, operationId: string): void {
    this.logger.log(`Report Created Event - Operation: ${operationId}`, {
      eventType: 'reportCreated',
      operationId,
      reportId: event.reportId,
      reportGuid: event.reportGuid,
      organizationId: event.organizationId,
      periodStart: event.periodStart.toISOString(),
      periodEnd: event.periodEnd.toISOString(),
      createdOn: event.createdOn.toISOString(),
      timestamp: new Date().toISOString(),
    });

    // TODO: Emit to event bus
    // this.eventBus.publish(new ReportCreatedEvent(event));
  }

  /**
   * Publish: Report Approved Event
   */
  publishReportApproved(event: ReportApprovedEvent, operationId: string): void {
    this.logger.log(`Report Approved Event - Operation: ${operationId}`, {
      eventType: 'reportApproved',
      operationId,
      reportId: event.reportId,
      reportGuid: event.reportGuid,
      organizationId: event.organizationId,
      approvedBy: event.approvedBy,
      approvedDate: event.approvedDate.toISOString(),
      approvedToken: event.approvedToken,
      timestamp: new Date().toISOString(),
    });

    // TODO: Emit to event bus
    // this.eventBus.publish(new ReportApprovedEvent(event));
  }

  /**
   * Publish: Report Rejected Event
   */
  publishReportRejected(event: ReportRejectedEvent, operationId: string): void {
    this.logger.log(`Report Rejected Event - Operation: ${operationId}`, {
      eventType: 'reportRejected',
      operationId,
      reportId: event.reportId,
      reportGuid: event.reportGuid,
      organizationId: event.organizationId,
      rejectedBy: event.rejectedBy,
      rejectedDate: event.rejectedDate.toISOString(),
      rejectionReason: event.rejectionReason,
      rejectionToken: event.rejectionToken,
      timestamp: new Date().toISOString(),
    });

    // TODO: Emit to event bus
    // this.eventBus.publish(new ReportRejectedEvent(event));
  }

  /**
   * Publish: Report Sent to Provider Event
   */
  publishReportSentToProvider(
    event: ReportSentToProviderEvent,
    operationId: string,
  ): void {
    this.logger.log(
      `Report Sent to Provider Event - Operation: ${operationId}`,
      {
        eventType: 'reportSentToProvider',
        operationId,
        reportId: event.reportId,
        reportGuid: event.reportGuid,
        organizationId: event.organizationId,
        sentDate: event.sentDate.toISOString(),
        timestamp: new Date().toISOString(),
      },
    );

    // TODO: Emit to event bus
    // this.eventBus.publish(new ReportSentToProviderEvent(event));
  }

  /**
   * Publish: Report Acknowledged Event
   */
  publishReportAcknowledged(
    event: ReportAcknowledgedEvent,
    operationId: string,
  ): void {
    this.logger.log(`Report Acknowledged Event - Operation: ${operationId}`, {
      eventType: 'reportAcknowledged',
      operationId,
      reportId: event.reportId,
      reportGuid: event.reportGuid,
      organizationId: event.organizationId,
      acknowledgedDate: event.acknowledgedDate.toISOString(),
      timestamp: new Date().toISOString(),
    });

    // TODO: Emit to event bus
    // this.eventBus.publish(new ReportAcknowledgedEvent(event));
  }
}
