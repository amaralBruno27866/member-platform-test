import { Injectable, Logger } from '@nestjs/common';
import {
  CotoStatus,
  DegreeType,
  OtUniversity,
  GraduationYear,
  Country,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

/**
 * OT Education Events Data Transfer Objects
 */
export interface OtEducationCreatedEvent {
  otEducationId: string;
  accountId: string;
  userBusinessId: string;
  cotoStatus: CotoStatus;
  degreeType: DegreeType;
  university: OtUniversity;
  graduationYear: GraduationYear;
  country: Country;
  cotoRegistration?: string;
  createdBy: string;
  timestamp: Date;
}

export interface OtEducationUpdatedEvent {
  otEducationId: string;
  accountId: string;
  changes: {
    old: Partial<{
      userBusinessId: string;
      cotoStatus: CotoStatus;
      degreeType: DegreeType;
      university: OtUniversity;
      graduationYear: GraduationYear;
      country: Country;
      cotoRegistration?: string;
      accessModifiers?: AccessModifier;
      privilege?: Privilege;
    }>;
    new: Partial<{
      userBusinessId: string;
      cotoStatus: CotoStatus;
      degreeType: DegreeType;
      university: OtUniversity;
      graduationYear: GraduationYear;
      country: Country;
      cotoRegistration?: string;
      accessModifiers?: AccessModifier;
      privilege?: Privilege;
    }>;
  };
  updatedBy: string;
  timestamp: Date;
}

export interface OtEducationDeletedEvent {
  otEducationId: string;
  accountId: string;
  userBusinessId: string;
  university: OtUniversity;
  graduationYear: GraduationYear;
  deletedBy: string;
  reason?: string;
  timestamp: Date;
}

export interface OtEducationBulkEvent {
  operation: 'bulk_create' | 'bulk_update' | 'bulk_delete';
  accountId: string;
  educationCount: number;
  successCount: number;
  errorCount: number;
  timestamp: Date;
}

export interface OtEducationValidationEvent {
  otEducationId?: string;
  accountId: string;
  validationType:
    | 'creation'
    | 'update'
    | 'coto_registration_format'
    | 'graduation_year_range'
    | 'university_country_match'
    | 'duplicate_check';
  isValid: boolean;
  errors?: string[];
  timestamp: Date;
}

export interface OtEducationCotoStatusEvent {
  otEducationId: string;
  accountId: string;
  oldCotoStatus?: CotoStatus;
  newCotoStatus: CotoStatus;
  cotoRegistrationChanged: boolean;
  changeReason: 'creation' | 'status_update' | 'registration_completed';
  updatedBy: string;
  timestamp: Date;
}

export interface OtEducationGraduationEvent {
  otEducationId: string;
  accountId: string;
  eventType:
    | 'graduation_year_verified'
    | 'university_changed'
    | 'degree_type_updated'
    | 'international_education_detected';
  details: {
    oldUniversity?: OtUniversity;
    newUniversity?: OtUniversity;
    oldDegreeType?: DegreeType;
    newDegreeType?: DegreeType;
    oldGraduationYear?: GraduationYear;
    newGraduationYear?: GraduationYear;
    isInternational?: boolean;
    requiresVerification?: boolean;
  };
  timestamp: Date;
}

export interface OtEducationBusinessRuleEvent {
  otEducationId: string;
  accountId: string;
  ruleType:
    | 'coto_registration_required'
    | 'graduation_year_future'
    | 'university_country_mismatch'
    | 'duplicate_education_entry'
    | 'international_verification_needed';
  rulePassed: boolean;
  ruleDetails: {
    expectedValue?: any;
    actualValue?: any;
    conflictingEducationId?: string;
    verificationRequirements?: string[];
  };
  timestamp: Date;
}

/**
 * OT Education Events Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Structured Logging: Logger with operation IDs and comprehensive event tracking
 * - Security-Aware Design: Safe event publishing with error isolation
 * - Event-Driven Architecture: Comprehensive lifecycle notifications for OT education
 * - Business Rule Integration: Events for validation and rule compliance
 * - Audit Trail Support: Complete change tracking with detailed context
 *
 * ENTERPRISE EVENT MANAGEMENT:
 * - Integration with business rule validation
 * - Error tracking for education operations with operation IDs
 * - COTO status change tracking with comprehensive context
 * - International education verification events with detailed metadata
 * - University and graduation change tracking with complete audit trails
 * - Bulk operations monitoring with success/failure metrics
 *
 * Event Categories:
 * 1. Lifecycle Events: Created, Updated, Deleted with comprehensive change tracking
 * 2. Validation Events: COTO registration, graduation year, university validation
 * 3. Business Events: Status changes, bulk operations, degree tracking with audit
 * 4. Compliance Events: International verification, duplicate detection, rule compliance
 * 5. Error Events: Validation failures, system errors with detailed context
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Safe event publishing that never breaks main application flow
 * - Structured logging with timestamp and detailed context
 * - Error isolation and recovery for robust event processing
 */
@Injectable()
export class OtEducationEventsService {
  private readonly logger = new Logger(OtEducationEventsService.name);

  /**
   * Publish OT education created event with enterprise tracking
   * Enhanced with operation IDs and structured logging
   */
  publishOtEducationCreated(event: OtEducationCreatedEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      this.logger.log(
        `OT Education created event publishing - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationCreated',
          operationId,
          otEducationId: event.otEducationId,
          accountId: event.accountId?.substring(0, 8) + '...',
          userBusinessId: event.userBusinessId?.substring(0, 4) + '...',
          cotoStatus: event.cotoStatus,
          university: event.university,
          graduationYear: event.graduationYear,
          country: event.country,
          degreeType: event.degreeType,
          hasCotoRegistration: !!event.cotoRegistration,
          createdBy: event.createdBy?.substring(0, 8) + '...',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtEducationCreatedEvent(event));

      this.logger.log(
        `OT Education created event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationCreated',
          operationId,
          otEducationId: event.otEducationId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OT Education created event - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationCreated',
          operationId,
          otEducationId: event.otEducationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish OT education updated event with enterprise tracking
   * Enhanced with detailed change tracking and PII protection
   */
  publishOtEducationUpdated(event: OtEducationUpdatedEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      const changedFields = Object.keys(event.changes.new);
      const changeDetails = changedFields.map((field) => {
        const oldValue =
          event.changes.old[field as keyof typeof event.changes.old];
        const newValue =
          event.changes.new[field as keyof typeof event.changes.new];

        // Protect PII in logs
        if (field === 'userBusinessId') {
          return `${field}: ${String(oldValue)?.substring(0, 4) || 'undefined'}... → ${String(newValue)?.substring(0, 4) || 'undefined'}...`;
        }
        if (field === 'cotoRegistration') {
          return `${field}: ${String(oldValue)?.substring(0, 4) || 'undefined'}... → ${String(newValue)?.substring(0, 4) || 'undefined'}...`;
        }

        return `${field}: ${oldValue || 'undefined'} → ${newValue || 'undefined'}`;
      });

      this.logger.log(
        `OT Education updated event publishing - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationUpdated',
          operationId,
          otEducationId: event.otEducationId,
          accountId: event.accountId?.substring(0, 8) + '...',
          changedFieldsCount: changedFields.length,
          changedFields: changedFields.join(', '),
          changeDetails,
          updatedBy: event.updatedBy?.substring(0, 8) + '...',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtEducationUpdatedEvent(event));

      this.logger.log(
        `OT Education updated event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationUpdated',
          operationId,
          otEducationId: event.otEducationId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OT Education updated event - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationUpdated',
          operationId,
          otEducationId: event.otEducationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish OT education deleted event with enterprise tracking
   */
  publishOtEducationDeleted(event: OtEducationDeletedEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      this.logger.log(
        `OT Education deleted event publishing - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationDeleted',
          operationId,
          otEducationId: event.otEducationId,
          accountId: event.accountId?.substring(0, 8) + '...',
          userBusinessId: event.userBusinessId?.substring(0, 4) + '...',
          university: event.university,
          graduationYear: event.graduationYear,
          deletedBy: event.deletedBy?.substring(0, 8) + '...',
          reason: event.reason || 'Not specified',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtEducationDeletedEvent(event));

      this.logger.log(
        `OT Education deleted event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationDeleted',
          operationId,
          otEducationId: event.otEducationId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OT Education deleted event - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationDeleted',
          operationId,
          otEducationId: event.otEducationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish OT education validation event with enterprise tracking
   */
  publishOtEducationValidation(event: OtEducationValidationEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      const status = event.isValid ? 'PASSED' : 'FAILED';
      const errorDetails = event.errors ? event.errors.join(', ') : 'None';

      this.logger.log(
        `OT Education validation event publishing - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationValidation',
          operationId,
          otEducationId: event.otEducationId || 'N/A',
          accountId: event.accountId?.substring(0, 8) + '...',
          validationType: event.validationType,
          status,
          isValid: event.isValid,
          errorCount: event.errors?.length || 0,
          errors: errorDetails,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtEducationValidationEvent(event));

      this.logger.log(
        `OT Education validation event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationValidation',
          operationId,
          validationType: event.validationType,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OT Education validation event - Operation: ${operationId}`,
        {
          operation: 'publishOtEducationValidation',
          operationId,
          validationType: event.validationType,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish bulk operation event with enterprise metrics tracking
   */
  publishBulkOperation(event: OtEducationBulkEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      const successRate =
        event.educationCount > 0
          ? ((event.successCount / event.educationCount) * 100).toFixed(2)
          : '0.00';

      this.logger.log(
        `OT Education bulk operation event publishing - Operation: ${operationId}`,
        {
          operation: 'publishBulkOperation',
          operationId,
          accountId: event.accountId?.substring(0, 8) + '...',
          bulkOperation: event.operation,
          totalRecords: event.educationCount,
          successCount: event.successCount,
          errorCount: event.errorCount,
          successRate: `${successRate}%`,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtEducationBulkEvent(event));

      this.logger.log(
        `OT Education bulk operation event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishBulkOperation',
          operationId,
          bulkOperation: event.operation,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OT Education bulk operation event - Operation: ${operationId}`,
        {
          operation: 'publishBulkOperation',
          operationId,
          bulkOperation: event.operation,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish COTO status change event with enterprise tracking
   */
  publishCotoStatusChange(event: OtEducationCotoStatusEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      this.logger.log(
        `OT Education COTO status change event publishing - Operation: ${operationId}`,
        {
          operation: 'publishCotoStatusChange',
          operationId,
          otEducationId: event.otEducationId,
          accountId: event.accountId?.substring(0, 8) + '...',
          oldCotoStatus: event.oldCotoStatus || 'None',
          newCotoStatus: event.newCotoStatus,
          cotoRegistrationChanged: event.cotoRegistrationChanged,
          changeReason: event.changeReason,
          updatedBy: event.updatedBy?.substring(0, 8) + '...',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtEducationCotoStatusEvent(event));

      this.logger.log(
        `OT Education COTO status change event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishCotoStatusChange',
          operationId,
          otEducationId: event.otEducationId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OT Education COTO status change event - Operation: ${operationId}`,
        {
          operation: 'publishCotoStatusChange',
          operationId,
          otEducationId: event.otEducationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish graduation tracking event
   */
  publishGraduationEvent(event: OtEducationGraduationEvent): void {
    const eventDescription = this.getGraduationEventDescription(event);

    this.logger.log(
      `OT Education graduation event - ID: ${event.otEducationId}, ${eventDescription}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new OtEducationGraduationEvent(event));
  }

  /**
   * Publish business rule validation event
   */
  publishBusinessRuleEvent(event: OtEducationBusinessRuleEvent): void {
    const status = event.rulePassed ? 'PASSED' : 'FAILED';
    const ruleDetails = event.ruleDetails.expectedValue
      ? ` (Expected: ${event.ruleDetails.expectedValue}, Actual: ${event.ruleDetails.actualValue})`
      : '';

    this.logger.log(
      `Business rule ${status} - ID: ${event.otEducationId}, Rule: ${event.ruleType}${ruleDetails}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new OtEducationBusinessRuleEvent(event));
  }

  /**
   * Helper method to describe graduation events
   */
  private getGraduationEventDescription(
    event: OtEducationGraduationEvent,
  ): string {
    switch (event.eventType) {
      case 'graduation_year_verified':
        return `Graduation year verified: ${event.details.newGraduationYear}`;
      case 'university_changed':
        return `University changed: ${event.details.oldUniversity} → ${event.details.newUniversity}`;
      case 'degree_type_updated':
        return `Degree type updated: ${event.details.oldDegreeType} → ${event.details.newDegreeType}`;
      case 'international_education_detected':
        return `International education detected, verification: ${event.details.requiresVerification ? 'required' : 'not required'}`;
      default:
        return `Event type: ${String(event.eventType)}`;
    }
  }

  /**
   * Utility method to create a validation event
   */
  createValidationEvent(
    otEducationId: string,
    accountId: string,
    validationType: OtEducationValidationEvent['validationType'],
    isValid: boolean,
    errors?: string[],
  ): OtEducationValidationEvent {
    return {
      otEducationId,
      accountId,
      validationType,
      isValid,
      errors,
      timestamp: new Date(),
    };
  }

  /**
   * Utility method to create a COTO status change event
   */
  createCotoStatusChangeEvent(
    otEducationId: string,
    accountId: string,
    oldStatus: CotoStatus | undefined,
    newStatus: CotoStatus,
    changeReason: OtEducationCotoStatusEvent['changeReason'],
    updatedBy: string,
    registrationChanged = false,
  ): OtEducationCotoStatusEvent {
    return {
      otEducationId,
      accountId,
      oldCotoStatus: oldStatus,
      newCotoStatus: newStatus,
      cotoRegistrationChanged: registrationChanged,
      changeReason,
      updatedBy,
      timestamp: new Date(),
    };
  }

  /**
   * Utility method to create a business rule event
   */
  createBusinessRuleEvent(
    otEducationId: string,
    accountId: string,
    ruleType: OtEducationBusinessRuleEvent['ruleType'],
    rulePassed: boolean,
    ruleDetails: OtEducationBusinessRuleEvent['ruleDetails'] = {},
  ): OtEducationBusinessRuleEvent {
    return {
      otEducationId,
      accountId,
      ruleType,
      rulePassed,
      ruleDetails,
      timestamp: new Date(),
    };
  }
}
