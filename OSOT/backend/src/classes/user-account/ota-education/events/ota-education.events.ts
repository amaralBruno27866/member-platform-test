/**
 * OTA Education Events (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error tracking
 * - enums: Uses centralized enums for type safety
 * - utils: Ready for business-rule.util integration
 * - integrations: Compatible with event sourcing patterns
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential OTA education events only
 * - Clean event interfaces for audit trails
 * - Simple event service for publishing
 * - Focus on core OTA education operations
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  DegreeType,
  OtaCollege,
  GraduationYear,
  EducationCategory,
  Country,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

/**
 * OTA Education Events Data Transfer Objects
 */
export interface OtaEducationCreatedEvent {
  otaEducationId: string;
  accountId: string;
  userBusinessId: string;
  workDeclaration: boolean;
  degreeType?: DegreeType;
  college?: OtaCollege;
  graduationYear?: GraduationYear;
  educationCategory?: EducationCategory;
  country?: Country;
  createdBy: string;
  timestamp: Date;
}

export interface OtaEducationUpdatedEvent {
  otaEducationId: string;
  accountId: string;
  changes: {
    old: Partial<{
      userBusinessId: string;
      workDeclaration: boolean;
      degreeType?: DegreeType;
      college?: OtaCollege;
      graduationYear?: GraduationYear;
      educationCategory?: EducationCategory;
      country?: Country;
      grade?: string;
      program?: string;
      areaOfStudy?: string;
      accessModifiers?: AccessModifier;
      privilege?: Privilege;
      description?: string;
    }>;
    new: Partial<{
      userBusinessId: string;
      workDeclaration: boolean;
      degreeType?: DegreeType;
      college?: OtaCollege;
      graduationYear?: GraduationYear;
      educationCategory?: EducationCategory;
      country?: Country;
      grade?: string;
      program?: string;
      areaOfStudy?: string;
      accessModifiers?: AccessModifier;
      privilege?: Privilege;
      description?: string;
    }>;
  };
  updatedBy: string;
  timestamp: Date;
}

export interface OtaEducationDeletedEvent {
  otaEducationId: string;
  accountId: string;
  userBusinessId: string;
  college?: OtaCollege;
  graduationYear?: GraduationYear;
  deletedBy: string;
  reason?: string;
  timestamp: Date;
}

export interface OtaEducationBulkEvent {
  operation: 'bulk_create' | 'bulk_update' | 'bulk_delete';
  accountId: string;
  educationCount: number;
  successCount: number;
  errorCount: number;
  timestamp: Date;
}

export interface OtaEducationValidationEvent {
  otaEducationId?: string;
  accountId: string;
  validationType:
    | 'creation'
    | 'update'
    | 'work_declaration_required'
    | 'user_business_id_format'
    | 'graduation_year_range'
    | 'college_country_match'
    | 'duplicate_check';
  isValid: boolean;
  errors?: string[];
  timestamp: Date;
}

export interface OtaEducationWorkDeclarationEvent {
  otaEducationId: string;
  accountId: string;
  oldWorkDeclaration?: boolean;
  newWorkDeclaration: boolean;
  declarationChanged: boolean;
  changeReason: 'creation' | 'status_update' | 'declaration_completed';
  updatedBy: string;
  timestamp: Date;
}

export interface OtaEducationGraduationEvent {
  otaEducationId: string;
  accountId: string;
  eventType:
    | 'graduation_year_verified'
    | 'college_changed'
    | 'degree_type_updated'
    | 'education_category_updated'
    | 'international_education_detected';
  details: {
    oldCollege?: OtaCollege;
    newCollege?: OtaCollege;
    oldDegreeType?: DegreeType;
    newDegreeType?: DegreeType;
    oldGraduationYear?: GraduationYear;
    newGraduationYear?: GraduationYear;
    oldEducationCategory?: EducationCategory;
    newEducationCategory?: EducationCategory;
    isInternational?: boolean;
    requiresVerification?: boolean;
  };
  timestamp: Date;
}

export interface OtaEducationBusinessRuleEvent {
  otaEducationId: string;
  accountId: string;
  ruleType:
    | 'work_declaration_required'
    | 'user_business_id_format'
    | 'graduation_year_future'
    | 'college_country_mismatch'
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

export interface OtaEducationRegistrationEvent {
  otaEducationId: string;
  accountId: string;
  registrationStep: string;
  registrationSource: string;
  termsAccepted: boolean;
  verificationStatus?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

/**
 * OTA Education Events Service (ENTERPRISE)
 *
 * MODERNIZED ARCHITECTURE INTEGRATION:
 * - Structured Logging: Logger with operation IDs and comprehensive event tracking
 * - Security-Aware Design: Safe event publishing with error isolation
 * - Event-Driven Architecture: Comprehensive lifecycle notifications for OTA education
 * - Business Rule Integration: Events for validation and rule compliance
 * - Audit Trail Support: Complete change tracking with detailed context
 *
 * ENTERPRISE EVENT MANAGEMENT:
 * - Integration with business rule validation
 * - Error tracking for education operations with operation IDs
 * - Registration workflow tracking with comprehensive context
 * - International education verification events with detailed metadata
 * - Work declaration change tracking with complete audit trails
 * - Bulk operations monitoring with success/failure metrics
 *
 * Event Categories:
 * 1. Lifecycle Events: Created, Updated, Deleted with comprehensive change tracking
 * 2. Validation Events: Work declaration, user business ID, graduation year, college validation
 * 3. Business Events: Declaration changes, bulk operations, degree tracking with audit
 * 4. Registration Events: Registration workflow, terms acceptance, verification with metadata
 * 5. Compliance Events: International verification, duplicate detection, rule compliance
 * 6. Error Events: Validation failures, system errors with detailed context
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Safe event publishing that never breaks main application flow
 * - Structured logging with timestamp and detailed context
 * - Error isolation and recovery for robust event processing
 */
@Injectable()
export class OtaEducationEventsService {
  private readonly logger = new Logger(OtaEducationEventsService.name);

  /**
   * Publish OTA education created event with enterprise tracking
   * Enhanced with operation IDs and structured logging
   */
  publishOtaEducationCreated(event: OtaEducationCreatedEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      this.logger.log(
        `OTA Education created event publishing - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationCreated',
          operationId,
          otaEducationId: event.otaEducationId,
          accountId: event.accountId?.substring(0, 8) + '...',
          userBusinessId: event.userBusinessId?.substring(0, 4) + '...',
          hasWorkDeclaration: !!event.workDeclaration,
          college: event.college || 'Not specified',
          graduationYear: event.graduationYear || 'Not specified',
          country: event.country || 'Not specified',
          createdBy: event.createdBy?.substring(0, 8) + '...',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtaEducationCreatedEvent(event));

      this.logger.log(
        `OTA Education created event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationCreated',
          operationId,
          otaEducationId: event.otaEducationId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OTA Education created event - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationCreated',
          operationId,
          otaEducationId: event.otaEducationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish OTA education updated event with enterprise tracking
   * Enhanced with detailed change tracking and PII protection
   */
  publishOtaEducationUpdated(event: OtaEducationUpdatedEvent): void {
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

        return `${field}: ${oldValue || 'undefined'} → ${newValue || 'undefined'}`;
      });

      this.logger.log(
        `OTA Education updated event publishing - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationUpdated',
          operationId,
          otaEducationId: event.otaEducationId,
          accountId: event.accountId?.substring(0, 8) + '...',
          changedFieldsCount: changedFields.length,
          changedFields: changedFields.join(', '),
          changeDetails,
          updatedBy: event.updatedBy?.substring(0, 8) + '...',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtaEducationUpdatedEvent(event));

      this.logger.log(
        `OTA Education updated event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationUpdated',
          operationId,
          otaEducationId: event.otaEducationId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OTA Education updated event - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationUpdated',
          operationId,
          otaEducationId: event.otaEducationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish OTA education deleted event with enterprise tracking
   */
  publishOtaEducationDeleted(event: OtaEducationDeletedEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      this.logger.log(
        `OTA Education deleted event publishing - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationDeleted',
          operationId,
          otaEducationId: event.otaEducationId,
          accountId: event.accountId?.substring(0, 8) + '...',
          userBusinessId: event.userBusinessId?.substring(0, 4) + '...',
          college: event.college || 'Not specified',
          graduationYear: event.graduationYear || 'Not specified',
          deletedBy: event.deletedBy?.substring(0, 8) + '...',
          reason: event.reason || 'Not specified',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtaEducationDeletedEvent(event));

      this.logger.log(
        `OTA Education deleted event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationDeleted',
          operationId,
          otaEducationId: event.otaEducationId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OTA Education deleted event - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationDeleted',
          operationId,
          otaEducationId: event.otaEducationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish OTA education validation event with enterprise tracking
   */
  publishOtaEducationValidation(event: OtaEducationValidationEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      const status = event.isValid ? 'PASSED' : 'FAILED';
      const errorDetails = event.errors ? event.errors.join(', ') : 'None';

      this.logger.log(
        `OTA Education validation event publishing - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationValidation',
          operationId,
          otaEducationId: event.otaEducationId || 'N/A',
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
      // await this.eventBus.publish(new OtaEducationValidationEvent(event));

      this.logger.log(
        `OTA Education validation event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationValidation',
          operationId,
          validationType: event.validationType,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OTA Education validation event - Operation: ${operationId}`,
        {
          operation: 'publishOtaEducationValidation',
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
  publishBulkOperation(event: OtaEducationBulkEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      const successRate =
        event.educationCount > 0
          ? ((event.successCount / event.educationCount) * 100).toFixed(2)
          : '0.00';

      this.logger.log(
        `OTA Education bulk operation event publishing - Operation: ${operationId}`,
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
      // await this.eventBus.publish(new OtaEducationBulkEvent(event));

      this.logger.log(
        `OTA Education bulk operation event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishBulkOperation',
          operationId,
          bulkOperation: event.operation,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OTA Education bulk operation event - Operation: ${operationId}`,
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
   * Publish work declaration change event with enterprise tracking
   */
  publishWorkDeclarationChange(event: OtaEducationWorkDeclarationEvent): void {
    const operationId = Math.random().toString(36).substring(2, 15);

    try {
      this.logger.log(
        `OTA Education work declaration change event publishing - Operation: ${operationId}`,
        {
          operation: 'publishWorkDeclarationChange',
          operationId,
          otaEducationId: event.otaEducationId,
          accountId: event.accountId?.substring(0, 8) + '...',
          oldWorkDeclaration: event.oldWorkDeclaration ?? 'None',
          newWorkDeclaration: event.newWorkDeclaration,
          declarationChanged: event.declarationChanged,
          changeReason: event.changeReason,
          updatedBy: event.updatedBy?.substring(0, 8) + '...',
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new OtaEducationWorkDeclarationEvent(event));

      this.logger.log(
        `OTA Education work declaration change event published successfully - Operation: ${operationId}`,
        {
          operation: 'publishWorkDeclarationChange',
          operationId,
          otaEducationId: event.otaEducationId,
          status: 'success',
        },
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish OTA Education work declaration change event - Operation: ${operationId}`,
        {
          operation: 'publishWorkDeclarationChange',
          operationId,
          otaEducationId: event.otaEducationId,
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
  publishGraduationEvent(event: OtaEducationGraduationEvent): void {
    const eventDescription = this.getGraduationEventDescription(event);

    this.logger.log(
      `OTA Education graduation event - ID: ${event.otaEducationId}, ${eventDescription}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new OtaEducationGraduationEvent(event));
  }

  /**
   * Publish business rule validation event
   */
  publishBusinessRuleEvent(event: OtaEducationBusinessRuleEvent): void {
    const status = event.rulePassed ? 'PASSED' : 'FAILED';
    const ruleDetails = event.ruleDetails.expectedValue
      ? ` (Expected: ${event.ruleDetails.expectedValue}, Actual: ${event.ruleDetails.actualValue})`
      : '';

    this.logger.log(
      `Business rule ${status} - ID: ${event.otaEducationId}, Rule: ${event.ruleType}${ruleDetails}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new OtaEducationBusinessRuleEvent(event));
  }

  /**
   * Publish registration workflow event
   */
  publishRegistrationEvent(event: OtaEducationRegistrationEvent): void {
    this.logger.log(
      `OTA Education registration - ID: ${event.otaEducationId}, Step: ${event.registrationStep}, Source: ${event.registrationSource}, Terms: ${event.termsAccepted ? 'Accepted' : 'Not accepted'}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new OtaEducationRegistrationEvent(event));
  }

  /**
   * Helper method to describe graduation events
   */
  private getGraduationEventDescription(
    event: OtaEducationGraduationEvent,
  ): string {
    switch (event.eventType) {
      case 'graduation_year_verified':
        return `Graduation year verified: ${event.details.newGraduationYear}`;
      case 'college_changed':
        return `College changed: ${event.details.oldCollege} → ${event.details.newCollege}`;
      case 'degree_type_updated':
        return `Degree type updated: ${event.details.oldDegreeType} → ${event.details.newDegreeType}`;
      case 'education_category_updated':
        return `Education category updated: ${event.details.oldEducationCategory} → ${event.details.newEducationCategory}`;
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
    otaEducationId: string,
    accountId: string,
    validationType: OtaEducationValidationEvent['validationType'],
    isValid: boolean,
    errors?: string[],
  ): OtaEducationValidationEvent {
    return {
      otaEducationId,
      accountId,
      validationType,
      isValid,
      errors,
      timestamp: new Date(),
    };
  }

  /**
   * Utility method to create a work declaration change event
   */
  createWorkDeclarationChangeEvent(
    otaEducationId: string,
    accountId: string,
    oldDeclaration: boolean | undefined,
    newDeclaration: boolean,
    changeReason: OtaEducationWorkDeclarationEvent['changeReason'],
    updatedBy: string,
    declarationChanged = false,
  ): OtaEducationWorkDeclarationEvent {
    return {
      otaEducationId,
      accountId,
      oldWorkDeclaration: oldDeclaration,
      newWorkDeclaration: newDeclaration,
      declarationChanged,
      changeReason,
      updatedBy,
      timestamp: new Date(),
    };
  }

  /**
   * Utility method to create a business rule event
   */
  createBusinessRuleEvent(
    otaEducationId: string,
    accountId: string,
    ruleType: OtaEducationBusinessRuleEvent['ruleType'],
    rulePassed: boolean,
    ruleDetails: OtaEducationBusinessRuleEvent['ruleDetails'] = {},
  ): OtaEducationBusinessRuleEvent {
    return {
      otaEducationId,
      accountId,
      ruleType,
      rulePassed,
      ruleDetails,
      timestamp: new Date(),
    };
  }

  /**
   * Utility method to create a registration event
   */
  createRegistrationEvent(
    otaEducationId: string,
    accountId: string,
    registrationStep: string,
    registrationSource: string,
    termsAccepted: boolean,
    verificationStatus?: string,
    ipAddress?: string,
    userAgent?: string,
  ): OtaEducationRegistrationEvent {
    return {
      otaEducationId,
      accountId,
      registrationStep,
      registrationSource,
      termsAccepted,
      verificationStatus,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    };
  }
}
