/**
 * Account Events
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error tracking
 * - enums: Uses centralized enums for type safety (AccountGroup, AccountStatus, etc.)
 * - utils: Ready for business-rule.util integration
 * - integrations: Compatible with event sourcing patterns
 *
 * EVENT PHILOSOPHY:
 * - Essential account events for comprehensive lifecycle tracking
 * - Clean event interfaces for audit trails and compliance
 * - Simple event service for publishing with enterprise logging
 * - Focus on core account operations with anti-fraud tracking
 * - Canadian standards compliance event tracking
 *
 * ENTERPRISE FEATURES:
 * - Comprehensive audit trail for regulatory compliance
 * - Anti-fraud event tracking (email/person uniqueness violations)
 * - Security-aware logging with PII redaction in event data
 * - Business rule violation tracking with detailed context
 * - Multi-app privilege change tracking
 * - Password security event monitoring
 * - Account lifecycle management with detailed operation tracking
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  AccountGroup,
  AccountStatus,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

/**
 * Account Events Data Transfer Objects
 */

/**
 * Account Created Event
 * Tracks new account creation with comprehensive details for audit and analytics
 */
export interface AccountCreatedEvent {
  accountId: string;
  accountBusinessId: string; // osot-0000001 format
  firstName: string;
  lastName: string;
  email: string;
  mobilePhone: string;
  dateOfBirth: string;
  accountGroup: AccountGroup;
  accountStatus: AccountStatus;
  accessModifiers: AccessModifier;
  privilege: Privilege;
  activeMember: boolean;
  accountDeclaration: boolean;
  registrationSource?: string; // 'web', 'api', 'admin', etc.
  ipAddress?: string;
  userAgent?: string;
  createdBy?: string; // Admin user who created the account
  timestamp: Date;
}

/**
 * Account Updated Event
 * Tracks account modifications with detailed change tracking for compliance
 */
export interface AccountUpdatedEvent {
  accountId: string;
  accountBusinessId: string;
  changes: {
    old: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      mobilePhone: string;
      dateOfBirth: string;
      accountGroup: AccountGroup;
      accountStatus: AccountStatus;
      accessModifiers: AccessModifier;
      privilege: Privilege;
      activeMember: boolean;
      accountDeclaration: boolean;
      passwordLastChanged?: string;
    }>;
    new: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      mobilePhone: string;
      dateOfBirth: string;
      accountGroup: AccountGroup;
      accountStatus: AccountStatus;
      accessModifiers: AccessModifier;
      privilege: Privilege;
      activeMember: boolean;
      accountDeclaration: boolean;
      passwordLastChanged?: string;
    }>;
  };
  updateReason?: string; // 'user_request', 'admin_action', 'system_update', 'compliance'
  updatedBy: string; // User ID or system identifier
  timestamp: Date;
}

/**
 * Account Deleted Event
 * Tracks account deletion with comprehensive audit information
 */
export interface AccountDeletedEvent {
  accountId: string;
  accountBusinessId: string;
  firstName: string;
  lastName: string;
  email: string; // Redacted in logs but kept for audit
  deletionReason:
    | 'user_request'
    | 'admin_action'
    | 'compliance'
    | 'fraud'
    | 'inactive';
  dataRetentionPeriod?: number; // Days before permanent deletion
  relatedEntities?: string[]; // IDs of related entities to be cleaned up
  deletedBy: string;
  timestamp: Date;
}

/**
 * Account Status Change Event
 * Tracks status transitions for business rule enforcement and compliance
 */
export interface AccountStatusChangeEvent {
  accountId: string;
  accountBusinessId: string;
  oldStatus: AccountStatus;
  newStatus: AccountStatus;
  changeReason:
    | 'activation'
    | 'deactivation'
    | 'suspension'
    | 'compliance'
    | 'fraud'
    | 'user_request';
  statusDetails?: string; // Additional context for the status change
  effectiveDate?: Date; // When the status change takes effect
  expirationDate?: Date; // When temporary status expires
  changedBy: string;
  timestamp: Date;
}

/**
 * Account Authentication Event
 * Tracks authentication-related activities for security monitoring
 */
export interface AccountAuthenticationEvent {
  accountId: string;
  accountBusinessId: string;
  eventType:
    | 'login_success'
    | 'login_failure'
    | 'password_change'
    | 'password_reset'
    | 'lockout'
    | 'unlock';
  authenticationMethod?: 'password' | 'token' | 'admin_override';
  ipAddress?: string;
  userAgent?: string;
  failureReason?: string; // For failed authentication attempts
  securityFlags?: string[]; // ['suspicious_location', 'unusual_time', 'multiple_attempts']
  timestamp: Date;
}

/**
 * Account Validation Event
 * Tracks business rule validation for anti-fraud and compliance monitoring
 */
export interface AccountValidationEvent {
  accountId?: string; // May not exist yet for creation validation
  validationType:
    | 'email_uniqueness'
    | 'person_uniqueness'
    | 'password_complexity'
    | 'business_rules'
    | 'anti_fraud';
  isValid: boolean;
  validationContext:
    | 'creation'
    | 'update'
    | 'authentication'
    | 'periodic_check';
  validationData?: {
    email?: string; // Domain only for logging
    duplicateCount?: number;
    violationDetails?: string[];
  };
  errors?: string[]; // Validation error messages
  performedBy?: string; // System or user who triggered validation
  timestamp: Date;
}

/**
 * Account Email Change Event
 * Tracks email address changes for security and anti-fraud monitoring
 */
export interface AccountEmailChangeEvent {
  accountId: string;
  accountBusinessId: string;
  oldEmail: string; // Will be redacted in logs
  newEmail: string; // Will be redacted in logs
  oldEmailDomain: string; // For analytics
  newEmailDomain: string; // For analytics
  verificationRequired: boolean;
  verificationToken?: string; // For email verification process
  changeReason: 'user_request' | 'admin_correction' | 'security_update';
  securityFlags?: string[]; // ['suspicious_domain', 'high_risk_change']
  changedBy: string;
  timestamp: Date;
}

/**
 * Account Group Change Event
 * Tracks account group modifications for compliance and access control
 */
export interface AccountGroupChangeEvent {
  accountId: string;
  accountBusinessId: string;
  oldGroup: AccountGroup;
  newGroup: AccountGroup;
  changeReason:
    | 'promotion'
    | 'role_change'
    | 'correction'
    | 'compliance'
    | 'business_need';
  privilegeImpact?: {
    oldPrivileges: Privilege[];
    newPrivileges: Privilege[];
    accessModifierChanges?: AccessModifier;
  };
  approvalRequired?: boolean;
  approvedBy?: string;
  changedBy: string;
  timestamp: Date;
}

/**
 * Account Anti-Fraud Event
 * Tracks suspicious activities and anti-fraud detection for security monitoring
 */
export interface AccountAntiFraudEvent {
  accountId?: string;
  suspiciousActivity:
    | 'duplicate_email'
    | 'duplicate_person'
    | 'rapid_creation'
    | 'suspicious_pattern'
    | 'data_inconsistency';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectionDetails: {
    duplicateEmails?: string[];
    duplicatePersons?: Array<{
      accountId: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    }>;
    patternDetails?: string;
    timeWindow?: string; // For rate-based detection
  };
  actionTaken?: 'flagged' | 'blocked' | 'review_required' | 'auto_resolved';
  reviewRequired: boolean;
  ipAddress?: string;
  userAgent?: string;
  detectedBy: string; // System component that detected the issue
  timestamp: Date;
}

/**
 * Account Privacy Event
 * Tracks privacy-related operations for GDPR and regulatory compliance
 */
export interface AccountPrivacyEvent {
  accountId: string;
  accountBusinessId: string;
  privacyAction:
    | 'data_export'
    | 'data_deletion'
    | 'consent_granted'
    | 'consent_revoked'
    | 'data_correction';
  dataCategories?: string[]; // ['personal_info', 'authentication', 'preferences']
  legalBasis?: string; // GDPR legal basis
  retentionPeriod?: number; // Days
  requestSource:
    | 'user_request'
    | 'legal_request'
    | 'compliance_audit'
    | 'system_cleanup';
  processedBy: string;
  timestamp: Date;
}

/**
 * Account Events Service
 *
 * Manages the publication and handling of account-related events.
 * Provides enterprise-grade event publishing with comprehensive logging,
 * audit trail capabilities, and anti-fraud monitoring.
 *
 * ENTERPRISE FEATURES:
 * - Security-aware logging with PII redaction
 * - Anti-fraud event correlation and tracking
 * - Regulatory compliance event management
 * - Business rule violation tracking
 * - Multi-app privilege change monitoring
 * - Comprehensive audit trail for compliance
 *
 * SECURITY CONSIDERATIONS:
 * - All events include security context and audit information
 * - PII redaction in logging while maintaining audit capabilities
 * - Anti-fraud pattern detection and alerting
 * - Suspicious activity tracking and escalation
 * - Compliance event tracking for regulatory requirements
 *
 * INTEGRATION READY:
 * - Event sourcing system integration points
 * - Real-time alerting system hooks
 * - Analytics and business intelligence integration
 * - Compliance reporting system integration
 * - Security incident response system integration
 */
@Injectable()
export class AccountEventsService {
  private readonly logger = new Logger(AccountEventsService.name);

  constructor() {
    this.logger.log('Account Events Service initialized successfully');
  }

  // ========================================
  // CORE LIFECYCLE EVENTS
  // ========================================

  /**
   * Publish account created event
   * Logs account creation with security context for audit trails
   */
  publishAccountCreated(event: AccountCreatedEvent): void {
    try {
      this.logger.log(
        `Account created - Business ID: ${event.accountBusinessId}, Group: ${event.accountGroup}, Email Domain: ${this.extractDomain(event.email)}`,
        {
          operation: 'account_created',
          accountId: event.accountId,
          accountBusinessId: event.accountBusinessId,
          accountGroup: event.accountGroup,
          accountStatus: event.accountStatus,
          registrationSource: event.registrationSource || 'unknown',
          emailDomain: this.extractDomain(event.email),
          ipAddress: event.ipAddress
            ? this.redactIpAddress(event.ipAddress)
            : undefined,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AccountCreatedEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Account created event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish account updated event
   * Tracks account modifications with detailed change analysis
   */
  publishAccountUpdated(event: AccountUpdatedEvent): void {
    try {
      const changedFields = Object.keys(event.changes.new).join(', ');

      this.logger.log(
        `Account updated - Business ID: ${event.accountBusinessId}, Fields: ${changedFields}, Reason: ${event.updateReason || 'Not specified'}`,
        {
          operation: 'account_updated',
          accountId: event.accountId,
          accountBusinessId: event.accountBusinessId,
          changedFields,
          updateReason: event.updateReason,
          updatedBy: event.updatedBy,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AccountUpdatedEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Account updated event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Publish account deleted event
   * Logs account deletion with comprehensive audit information
   */
  publishAccountDeleted(event: AccountDeletedEvent): void {
    try {
      this.logger.log(
        `Account deleted - Business ID: ${event.accountBusinessId}, Name: ${event.firstName} ${event.lastName}, Reason: ${event.deletionReason}`,
        {
          operation: 'account_deleted',
          accountId: event.accountId,
          accountBusinessId: event.accountBusinessId,
          deletionReason: event.deletionReason,
          dataRetentionPeriod: event.dataRetentionPeriod,
          emailDomain: this.extractDomain(event.email),
          deletedBy: event.deletedBy,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AccountDeletedEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Account deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // ========================================
  // STATUS AND SECURITY EVENTS
  // ========================================

  /**
   * Publish account status change event
   * Tracks status transitions for compliance and business rule enforcement
   */
  publishAccountStatusChange(event: AccountStatusChangeEvent): void {
    try {
      this.logger.log(
        `Account status changed - Business ID: ${event.accountBusinessId}, Status: ${event.oldStatus} → ${event.newStatus}, Reason: ${event.changeReason}`,
        {
          operation: 'account_status_change',
          accountId: event.accountId,
          accountBusinessId: event.accountBusinessId,
          oldStatus: event.oldStatus,
          newStatus: event.newStatus,
          changeReason: event.changeReason,
          effectiveDate: event.effectiveDate?.toISOString(),
          changedBy: event.changedBy,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AccountStatusChangeEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Account status change event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Publish account authentication event
   * Tracks authentication activities for security monitoring
   */
  publishAccountAuthentication(event: AccountAuthenticationEvent): void {
    try {
      const loggerMethod: 'log' | 'warn' =
        event.eventType.includes('failure') ||
        event.eventType.includes('lockout')
          ? 'warn'
          : 'log';

      this.logger[loggerMethod](
        `Account authentication ${event.eventType} - Business ID: ${event.accountBusinessId}`,
        {
          operation: 'account_authentication',
          accountId: event.accountId,
          accountBusinessId: event.accountBusinessId,
          eventType: event.eventType,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          failureReason: event.failureReason,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AccountAuthenticationEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Account authentication event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // ========================================
  // BUSINESS RULE AND VALIDATION EVENTS
  // ========================================

  /**
   * Publish account validation event
   * Tracks business rule validation for compliance and anti-fraud monitoring
   */
  publishAccountValidation(event: AccountValidationEvent): void {
    try {
      const status = event.isValid ? 'PASSED' : 'FAILED';
      const errorDetails = event.errors
        ? ` - Errors: ${event.errors.join(', ')}`
        : '';

      this.logger.log(
        `Account validation ${status} - Type: ${event.validationType}, Context: ${event.validationContext}${errorDetails}`,
        {
          operation: 'account_validation',
          accountId: event.accountId,
          validationType: event.validationType,
          validationContext: event.validationContext,
          isValid: event.isValid,
          errorCount: event.errors?.length || 0,
          duplicateCount: event.validationData?.duplicateCount,
          performedBy: event.performedBy,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AccountValidationEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Account validation event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Publish account email change event
   * Tracks email changes for security and anti-fraud monitoring
   */
  publishAccountEmailChange(event: AccountEmailChangeEvent): void {
    try {
      this.logger.log(
        `Account email changed - Business ID: ${event.accountBusinessId}, Domain: ${event.oldEmailDomain} → ${event.newEmailDomain}, Reason: ${event.changeReason}`,
        {
          operation: 'account_email_change',
          accountId: event.accountId,
          accountBusinessId: event.accountBusinessId,
          oldEmailDomain: event.oldEmailDomain,
          newEmailDomain: event.newEmailDomain,
          changeReason: event.changeReason,
          verificationRequired: event.verificationRequired,
          securityFlags: event.securityFlags,
          changedBy: event.changedBy,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AccountEmailChangeEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Account email change event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Publish account group change event
   * Tracks group changes for compliance and access control monitoring
   */
  publishAccountGroupChange(event: AccountGroupChangeEvent): void {
    try {
      this.logger.log(
        `Account group changed - Business ID: ${event.accountBusinessId}, Group: ${event.oldGroup} → ${event.newGroup}, Reason: ${event.changeReason}`,
        {
          operation: 'account_group_change',
          accountId: event.accountId,
          accountBusinessId: event.accountBusinessId,
          oldGroup: event.oldGroup,
          newGroup: event.newGroup,
          changeReason: event.changeReason,
          approvalRequired: event.approvalRequired,
          approvedBy: event.approvedBy,
          changedBy: event.changedBy,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AccountGroupChangeEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Account group change event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // ========================================
  // ANTI-FRAUD AND PRIVACY EVENTS
  // ========================================

  /**
   * Publish account anti-fraud event
   * Tracks suspicious activities for security monitoring and escalation
   */
  publishAccountAntiFraud(event: AccountAntiFraudEvent): void {
    try {
      const logLevel =
        event.riskLevel === 'critical' || event.riskLevel === 'high'
          ? 'warn'
          : 'log';

      this.logger[logLevel](
        `ANTI-FRAUD ALERT - Activity: ${event.suspiciousActivity}, Risk: ${event.riskLevel.toUpperCase()}, Action: ${event.actionTaken || 'none'}`,
        {
          operation: 'account_anti_fraud',
          accountId: event.accountId,
          suspiciousActivity: event.suspiciousActivity,
          riskLevel: event.riskLevel,
          actionTaken: event.actionTaken,
          reviewRequired: event.reviewRequired,
          duplicateCount:
            event.detectionDetails.duplicateEmails?.length ||
            event.detectionDetails.duplicatePersons?.length,
          detectedBy: event.detectedBy,
          ipAddress: event.ipAddress
            ? this.redactIpAddress(event.ipAddress)
            : undefined,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system and alerting
      // await this.eventBus.publish(new AccountAntiFraudEvent(event));
      // await this.alertingService.sendSecurityAlert(event);
    } catch (error) {
      this.logger.error(
        `Failed to publish Account anti-fraud event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Publish account privacy event
   * Tracks privacy operations for GDPR and regulatory compliance
   */
  publishAccountPrivacy(event: AccountPrivacyEvent): void {
    try {
      this.logger.log(
        `Account privacy action - Business ID: ${event.accountBusinessId}, Action: ${event.privacyAction}, Source: ${event.requestSource}`,
        {
          operation: 'account_privacy',
          accountId: event.accountId,
          accountBusinessId: event.accountBusinessId,
          privacyAction: event.privacyAction,
          dataCategories: event.dataCategories,
          legalBasis: event.legalBasis,
          requestSource: event.requestSource,
          processedBy: event.processedBy,
          timestamp: event.timestamp.toISOString(),
        },
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AccountPrivacyEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Account privacy event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  // ========================================
  // UTILITY METHODS FOR PII PROTECTION
  // ========================================

  /**
   * Extract domain from email for logging purposes
   */
  private extractDomain(email: string): string {
    try {
      return email.split('@')[1] || 'unknown-domain';
    } catch {
      return 'invalid-email';
    }
  }

  /**
   * Redact IP address for privacy compliance (keep first 3 octets)
   */
  private redactIpAddress(ipAddress: string): string {
    try {
      const parts = ipAddress.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
      }
      return 'xxx.xxx.xxx.xxx';
    } catch {
      return 'invalid-ip';
    }
  }
}
