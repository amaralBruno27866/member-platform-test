/**
 * Affiliate Events
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error tracking
 * - enums: Uses centralized enums for type safety
 * - utils: Ready for business-rule.util integration
 * - integrations: Compatible with event sourcing patterns
 *
 * EVENT PHILOSOPHY:
 * - Essential affiliate events only
 * - Clean event interfaces for audit trails
 * - Simple event service for publishing
 * - Focus on core affiliate operations
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  AffiliateArea,
  AccountStatus,
  AccessModifier,
  Privilege,
  City,
  Province,
  Country,
} from '../../../../common/enums';

/**
 * Affiliate Events Data Transfer Objects
 */
export interface AffiliateCreatedEvent {
  affiliateId: string;
  accountId: string;
  affiliateName: string;
  affiliateArea: AffiliateArea;
  representativeFirstName: string;
  representativeLastName: string;
  representativeJobTitle: string;
  affiliateEmail: string;
  affiliatePhone: string;
  affiliateCity?: City;
  otherCity?: string;
  affiliateProvince?: Province;
  otherProvinceState?: string;
  affiliateCountry?: Country;
  createdBy: string;
  timestamp: Date;
}

export interface AffiliateUpdatedEvent {
  affiliateId: string;
  accountId: string;
  changes: {
    old: Partial<{
      affiliateName: string;
      affiliateArea: AffiliateArea;
      representativeFirstName: string;
      representativeLastName: string;
      representativeJobTitle: string;
      affiliateEmail: string;
      affiliatePhone: string;
      affiliateWebsite?: string;
      affiliateFacebook?: string;
      affiliateInstagram?: string;
      affiliateTikTok?: string;
      affiliateLinkedIn?: string;
      affiliateAddress1: string;
      affiliateAddress2?: string;
      affiliateCity?: City;
      otherCity?: string;
      affiliateProvince?: Province;
      otherProvinceState?: string;
      affiliatePostalCode: string;
      affiliateCountry?: Country;
      accountStatus?: AccountStatus;
      accountDeclaration?: boolean;
      activeMember?: boolean;
      accessModifiers?: AccessModifier;
      privilege?: Privilege;
    }>;
    new: Partial<{
      affiliateName: string;
      affiliateArea: AffiliateArea;
      representativeFirstName: string;
      representativeLastName: string;
      representativeJobTitle: string;
      affiliateEmail: string;
      affiliatePhone: string;
      affiliateWebsite?: string;
      affiliateFacebook?: string;
      affiliateInstagram?: string;
      affiliateTikTok?: string;
      affiliateLinkedIn?: string;
      affiliateAddress1: string;
      affiliateAddress2?: string;
      affiliateCity?: City;
      otherCity?: string;
      affiliateProvince?: Province;
      otherProvinceState?: string;
      affiliatePostalCode: string;
      affiliateCountry?: Country;
      accountStatus?: AccountStatus;
      accountDeclaration?: boolean;
      activeMember?: boolean;
      accessModifiers?: AccessModifier;
      privilege?: Privilege;
    }>;
  };
  updatedBy: string;
  timestamp: Date;
}

export interface AffiliateDeletedEvent {
  affiliateId: string;
  accountId: string;
  affiliateName: string;
  affiliateArea: AffiliateArea;
  representativeName: string;
  deletedBy: string;
  reason?: string;
  timestamp: Date;
}

export interface AffiliateBulkEvent {
  operation: 'bulk_create' | 'bulk_update' | 'bulk_delete';
  accountId?: string;
  affiliateCount: number;
  successCount: number;
  errorCount: number;
  timestamp: Date;
}

export interface AffiliateValidationEvent {
  affiliateId?: string;
  accountId: string;
  validationType:
    | 'creation'
    | 'update'
    | 'email_format'
    | 'phone_format'
    | 'website_url'
    | 'social_media_url'
    | 'postal_code_format'
    | 'duplicate_check'
    | 'representative_required'
    | 'address_required';
  isValid: boolean;
  errors?: string[];
  timestamp: Date;
}

export interface AffiliateContactUpdateEvent {
  affiliateId: string;
  accountId: string;
  updateType:
    | 'email_changed'
    | 'phone_changed'
    | 'website_added'
    | 'website_removed'
    | 'social_media_added'
    | 'social_media_removed'
    | 'social_media_updated';
  contactDetails: {
    oldEmail?: string;
    newEmail?: string;
    oldPhone?: string;
    newPhone?: string;
    oldWebsite?: string;
    newWebsite?: string;
    socialMediaChanges?: {
      platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin';
      oldUrl?: string;
      newUrl?: string;
    }[];
  };
  updatedBy: string;
  timestamp: Date;
}

export interface AffiliateAddressUpdateEvent {
  affiliateId: string;
  accountId: string;
  addressType:
    | 'primary_address'
    | 'secondary_address'
    | 'postal_code'
    | 'location';
  oldAddress?: {
    address1?: string;
    address2?: string;
    city?: City;
    province?: Province;
    postalCode?: string;
    country?: Country;
  };
  newAddress: {
    address1?: string;
    address2?: string;
    city?: City;
    province?: Province;
    postalCode?: string;
    country?: Country;
  };
  updatedBy: string;
  timestamp: Date;
}

export interface AffiliateStatusChangeEvent {
  affiliateId: string;
  accountId: string;
  statusType: 'account_status' | 'member_status' | 'declaration_status';
  oldStatus?: AccountStatus | boolean;
  newStatus: AccountStatus | boolean;
  changeReason:
    | 'creation'
    | 'activation'
    | 'deactivation'
    | 'suspension'
    | 'declaration_update'
    | 'membership_update';
  updatedBy: string;
  timestamp: Date;
}

export interface AffiliateBusinessRuleEvent {
  affiliateId: string;
  accountId: string;
  ruleType:
    | 'email_format_validation'
    | 'phone_format_validation'
    | 'url_validation'
    | 'postal_code_validation'
    | 'duplicate_affiliate_check'
    | 'representative_completeness'
    | 'address_completeness'
    | 'social_media_url_validation'
    | 'account_declaration_required'
    | 'member_status_consistency';
  rulePassed: boolean;
  ruleDetails: {
    expectedFormat?: string;
    actualValue?: any;
    conflictingAffiliateId?: string;
    missingFields?: string[];
    validationPattern?: string;
  };
  timestamp: Date;
}

export interface AffiliateRegistrationEvent {
  affiliateId: string;
  accountId: string;
  registrationStep: string;
  registrationSource: string;
  termsAccepted: boolean;
  declarationCompleted: boolean;
  verificationStatus?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AffiliateAreaChangeEvent {
  affiliateId: string;
  accountId: string;
  oldArea?: AffiliateArea;
  newArea: AffiliateArea;
  changeReason:
    | 'creation'
    | 'business_expansion'
    | 'business_pivot'
    | 'correction';
  impactedServices?: string[];
  updatedBy: string;
  timestamp: Date;
}

export interface AffiliateRepresentativeChangeEvent {
  affiliateId: string;
  accountId: string;
  changeType: 'name_change' | 'job_title_change' | 'complete_replacement';
  oldRepresentative?: {
    firstName?: string;
    lastName?: string;
    jobTitle?: string;
  };
  newRepresentative: {
    firstName: string;
    lastName: string;
    jobTitle: string;
  };
  changeReason: 'correction' | 'personnel_change' | 'promotion' | 'replacement';
  updatedBy: string;
  timestamp: Date;
}

/**
 * Affiliate Events Service
 *
 * Manages the publication and handling of affiliate-related events.
 * Events can be consumed by external systems for auditing, notifications,
 * analytics, affiliate relationship tracking, or triggering other business processes.
 *
 * Key Features:
 * - Affiliate lifecycle event tracking
 * - Contact information change tracking
 * - Address and location change tracking
 * - Status change monitoring
 * - Business area change tracking
 * - Representative change tracking
 * - Bulk operation event aggregation
 * - Audit trail for affiliate changes
 * - Integration with business rule validation
 * - Error tracking for affiliate operations
 * - Registration workflow tracking
 * - Social media presence tracking
 *
 * Event Types:
 * 1. Lifecycle Events: Created, Updated, Deleted
 * 2. Contact Events: Email, phone, website, social media changes
 * 3. Address Events: Primary/secondary address, postal code, location changes
 * 4. Status Events: Account status, member status, declaration changes
 * 5. Business Events: Area changes, representative changes, bulk operations
 * 6. Validation Events: Format validation, duplicate detection, completeness checks
 * 7. Registration Events: Registration workflow, terms acceptance, verification
 * 8. Compliance Events: Declaration requirements, member status consistency
 */
@Injectable()
export class AffiliateEventsService {
  private readonly logger = new Logger(AffiliateEventsService.name);

  /**
   * Publish affiliate created event
   */
  publishAffiliateCreated(event: AffiliateCreatedEvent): void {
    try {
      this.logger.log(
        `Affiliate created - ID: ${event.affiliateId}, Name: ${event.affiliateName}, Area: ${event.affiliateArea}, Representative: ${event.representativeFirstName} ${event.representativeLastName}`,
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AffiliateCreatedEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Affiliate created event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish affiliate updated event
   */
  publishAffiliateUpdated(event: AffiliateUpdatedEvent): void {
    try {
      const changedFields = Object.keys(event.changes.new).join(', ');
      this.logger.log(
        `Affiliate updated - ID: ${event.affiliateId}, Fields: ${changedFields}`,
      );

      // TODO: Integrate with event sourcing system
      // await this.eventBus.publish(new AffiliateUpdatedEvent(event));
    } catch (error) {
      this.logger.error(
        `Failed to publish Affiliate updated event: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - events should not break the main flow
    }
  }

  /**
   * Publish affiliate deleted event
   */
  publishAffiliateDeleted(event: AffiliateDeletedEvent): void {
    this.logger.log(
      `Affiliate deleted - ID: ${event.affiliateId}, Name: ${event.affiliateName}, Representative: ${event.representativeName}, Reason: ${event.reason || 'Not specified'}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateDeletedEvent(event));
  }

  /**
   * Publish affiliate validation event
   */
  publishAffiliateValidation(event: AffiliateValidationEvent): void {
    const status = event.isValid ? 'PASSED' : 'FAILED';
    const errorDetails = event.errors
      ? ` - Errors: ${event.errors.join(', ')}`
      : '';

    this.logger.log(
      `Affiliate validation ${status} - Type: ${event.validationType}${errorDetails}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateValidationEvent(event));
  }

  /**
   * Publish bulk operation event
   */
  publishBulkOperation(event: AffiliateBulkEvent): void {
    this.logger.log(
      `Affiliate bulk ${event.operation} - Total: ${event.affiliateCount}, Success: ${event.successCount}, Errors: ${event.errorCount}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateBulkEvent(event));
  }

  /**
   * Publish contact information update event
   */
  publishContactUpdate(event: AffiliateContactUpdateEvent): void {
    const updateDescription = this.getContactUpdateDescription(event);

    this.logger.log(
      `Affiliate contact updated - ID: ${event.affiliateId}, ${updateDescription}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateContactUpdateEvent(event));
  }

  /**
   * Publish address update event
   */
  publishAddressUpdate(event: AffiliateAddressUpdateEvent): void {
    const addressDescription = this.getAddressUpdateDescription(event);

    this.logger.log(
      `Affiliate address updated - ID: ${event.affiliateId}, ${addressDescription}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateAddressUpdateEvent(event));
  }

  /**
   * Publish status change event
   */
  publishStatusChange(event: AffiliateStatusChangeEvent): void {
    this.logger.log(
      `Affiliate status changed - ID: ${event.affiliateId}, Type: ${event.statusType}, ${event.oldStatus || 'None'} → ${event.newStatus}, Reason: ${event.changeReason}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateStatusChangeEvent(event));
  }

  /**
   * Publish business rule validation event
   */
  publishBusinessRuleEvent(event: AffiliateBusinessRuleEvent): void {
    const status = event.rulePassed ? 'PASSED' : 'FAILED';
    const ruleDetails = event.ruleDetails.expectedFormat
      ? ` (Expected: ${event.ruleDetails.expectedFormat}, Actual: ${event.ruleDetails.actualValue})`
      : '';

    this.logger.log(
      `Business rule ${status} - ID: ${event.affiliateId}, Rule: ${event.ruleType}${ruleDetails}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateBusinessRuleEvent(event));
  }

  /**
   * Publish registration workflow event
   */
  publishRegistrationEvent(event: AffiliateRegistrationEvent): void {
    this.logger.log(
      `Affiliate registration step - ID: ${event.affiliateId}, Step: ${event.registrationStep}, Source: ${event.registrationSource}, Terms: ${event.termsAccepted}, Declaration: ${event.declarationCompleted}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateRegistrationEvent(event));
  }

  /**
   * Publish affiliate area change event
   */
  publishAreaChange(event: AffiliateAreaChangeEvent): void {
    this.logger.log(
      `Affiliate area changed - ID: ${event.affiliateId}, ${event.oldArea || 'None'} → ${event.newArea}, Reason: ${event.changeReason}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateAreaChangeEvent(event));
  }

  /**
   * Publish representative change event
   */
  publishRepresentativeChange(event: AffiliateRepresentativeChangeEvent): void {
    const changeDescription = this.getRepresentativeChangeDescription(event);

    this.logger.log(
      `Affiliate representative changed - ID: ${event.affiliateId}, ${changeDescription}`,
    );

    // TODO: Integrate with event sourcing system
    // await this.eventBus.publish(new AffiliateRepresentativeChangeEvent(event));
  }

  // ========================================
  // HELPER METHODS FOR EVENT DESCRIPTIONS
  // ========================================

  private getContactUpdateDescription(
    event: AffiliateContactUpdateEvent,
  ): string {
    switch (event.updateType) {
      case 'email_changed':
        return `Email: ${event.contactDetails.oldEmail || 'None'} → ${event.contactDetails.newEmail}`;
      case 'phone_changed':
        return `Phone: ${event.contactDetails.oldPhone || 'None'} → ${event.contactDetails.newPhone}`;
      case 'website_added':
        return `Website added: ${event.contactDetails.newWebsite}`;
      case 'website_removed':
        return `Website removed: ${event.contactDetails.oldWebsite}`;
      case 'social_media_added':
      case 'social_media_removed':
      case 'social_media_updated': {
        const socialChanges = event.contactDetails.socialMediaChanges || [];
        return `Social media ${event.updateType.replace('social_media_', '')}: ${socialChanges
          .map(
            (c) =>
              `${c.platform}: ${c.oldUrl || 'None'} → ${c.newUrl || 'Removed'}`,
          )
          .join(', ')}`;
      }
      default:
        return 'Contact update';
    }
  }

  private getAddressUpdateDescription(
    event: AffiliateAddressUpdateEvent,
  ): string {
    const oldAddr = event.oldAddress;
    const newAddr = event.newAddress;

    switch (event.addressType) {
      case 'primary_address':
        return `Primary address: ${oldAddr?.address1 || 'None'} → ${newAddr.address1}`;
      case 'secondary_address':
        return `Secondary address: ${oldAddr?.address2 || 'None'} → ${newAddr.address2 || 'Removed'}`;
      case 'postal_code':
        return `Postal code: ${oldAddr?.postalCode || 'None'} → ${newAddr.postalCode}`;
      case 'location':
        return `Location: ${oldAddr?.city || 'None'}, ${oldAddr?.province || 'None'} → ${newAddr.city}, ${newAddr.province}`;
      default:
        return 'Address update';
    }
  }

  private getRepresentativeChangeDescription(
    event: AffiliateRepresentativeChangeEvent,
  ): string {
    const oldRep = event.oldRepresentative;
    const newRep = event.newRepresentative;

    switch (event.changeType) {
      case 'name_change':
        return `Name: ${oldRep?.firstName || ''} ${oldRep?.lastName || ''} → ${newRep.firstName} ${newRep.lastName}`;
      case 'job_title_change':
        return `Job title: ${oldRep?.jobTitle || 'None'} → ${newRep.jobTitle}`;
      case 'complete_replacement':
        return `Representative replaced: ${oldRep?.firstName || ''} ${oldRep?.lastName || ''} → ${newRep.firstName} ${newRep.lastName}`;
      default:
        return 'Representative update';
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  private maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `${user}@${domain}`;
    return `${user.substring(0, 2)}***@${domain}`;
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 4) return phone;
    return `***${phone.slice(-4)}`;
  }

  private maskIpAddress(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.**`;
    }
    return '***';
  }
}
