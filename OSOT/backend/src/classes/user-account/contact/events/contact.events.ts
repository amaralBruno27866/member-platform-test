import { Injectable, Logger } from '@nestjs/common';
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Contact Events Data Transfer Objects
 */
export interface ContactCreatedEvent {
  contactId: string;
  accountId: string;
  businessId: string;
  jobTitle?: string;
  email?: string;
  socialMedia: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
  };
  timestamp: Date;
}

export interface ContactUpdatedEvent {
  contactId: string;
  accountId: string;
  changes: {
    old: Partial<{
      businessId: string;
      jobTitle?: string;
      email?: string;
      homePhone?: string;
      workPhone?: string;
      businessWebsite?: string;
      socialMedia?: {
        facebook?: string;
        instagram?: string;
        tiktok?: string;
        linkedin?: string;
      };
      accessModifiers?: AccessModifier;
      privilege?: Privilege;
    }>;
    new: Partial<{
      businessId: string;
      jobTitle?: string;
      email?: string;
      homePhone?: string;
      workPhone?: string;
      businessWebsite?: string;
      socialMedia?: {
        facebook?: string;
        instagram?: string;
        tiktok?: string;
        linkedin?: string;
      };
      accessModifiers?: AccessModifier;
      privilege?: Privilege;
    }>;
  };
  updatedBy: string;
  timestamp: Date;
}

export interface ContactDeletedEvent {
  contactId: string;
  accountId: string;
  businessId: string;
  email?: string;
  deletedBy: string;
  reason?: string;
  timestamp: Date;
}

export interface ContactBulkEvent {
  operation: 'bulk_create' | 'bulk_update' | 'bulk_delete';
  accountId: string;
  contactCount: number;
  successCount: number;
  errorCount: number;
  timestamp: Date;
}

export interface ContactValidationEvent {
  contactId?: string;
  accountId: string;
  validationType:
    | 'creation'
    | 'update'
    | 'business_id_uniqueness'
    | 'email_format'
    | 'phone_format'
    | 'social_media_urls';
  isValid: boolean;
  errors?: string[];
  timestamp: Date;
}

export interface ContactSocialMediaEvent {
  contactId: string;
  accountId: string;
  platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin';
  action: 'added' | 'updated' | 'removed' | 'discovered';
  oldUrl?: string;
  newUrl?: string;
  discoverySource?: string;
  timestamp: Date;
}

export interface ContactBusinessIdEvent {
  contactId: string;
  accountId: string;
  oldBusinessId?: string;
  newBusinessId: string;
  changeReason: 'creation' | 'update' | 'conflict_resolution';
  updatedBy: string;
  timestamp: Date;
}

export interface ContactNetworkingEvent {
  contactId: string;
  accountId: string;
  eventType:
    | 'connection_discovered'
    | 'opportunity_identified'
    | 'network_analysis';
  details: {
    connectedContactId?: string;
    commonPlatforms?: string[];
    opportunityType?: string;
    potentialValue?: number;
    industryCategory?: string;
  };
  timestamp: Date;
}

export interface ContactJobTitleEvent {
  contactId: string;
  accountId: string;
  oldJobTitle?: string;
  newJobTitle: string;
  industryChange: boolean;
  industryCategory: string;
  updatedBy: string;
  timestamp: Date;
}

/**
 * Contact Events Service
 *
 * Manages the publication and handling of contact-related events.
 * Events can be consumed by external systems for auditing, notifications,
 * analytics, CRM integration, or triggering other business processes.
 *
 * Integration Features:
 * - AccessModifier and Privilege enum integration for type-safe event data
 * - Compatible with phone-formatter.utils and url-sanitizer.utils for normalized data
 * - Structured event interfaces leveraging #file:enums for consistency
 * - Ready for integration with #file:utils for data normalization events
 * - Event-driven architecture supporting #file:integrations patterns
 *
 * Key Features:
 * - Type-safe event interfaces for all contact lifecycle events
 * - Social media profile management events with URL normalization support
 * - Professional networking and opportunity events with industry categorization
 * - Business ID uniqueness and validation events
 * - Comprehensive audit trail for compliance with enum-based access control
 * - Integration-ready for CRM systems and marketing automation
 * - Structured logging for all events with contextual information
 * - Easy integration with event buses or message brokers
 * - Phone number and URL normalization event tracking
 *
 * Contact-Specific Events:
 * - Business ID changes and uniqueness validation
 * - Social media profile updates and discovery with URL validation
 * - Professional networking connection analysis
 * - Job title changes and industry categorization
 * - Communication preference updates with format validation
 * - Bulk operations for data migration and updates
 * - Data normalization events for phone numbers and URLs
 */
@Injectable()
export class ContactEventsService {
  private readonly logger = new Logger(ContactEventsService.name);

  /**
   * Emit contact created event
   * Called when a new contact is successfully created
   */
  emitContactCreated(event: ContactCreatedEvent): void {
    const socialPlatformCount = Object.values(event.socialMedia).filter(
      Boolean,
    ).length;

    this.logger.log(
      `Contact created: ID=${event.contactId}, Account=${event.accountId}, BusinessID=${event.businessId}, Job=${event.jobTitle || 'N/A'}, SocialPlatforms=${socialPlatformCount}`,
    );

    // Here you could publish to an event bus, message broker, or external system
    this.publishEvent('contact.created', event);
  }

  /**
   * Emit contact updated event
   * Called when an existing contact is successfully updated
   */
  emitContactUpdated(event: ContactUpdatedEvent): void {
    const changeCount = Object.keys(event.changes.new).length;

    this.logger.log(
      `Contact updated: ID=${event.contactId}, Account=${event.accountId}, Changes=${changeCount}, By=${event.updatedBy}`,
    );

    this.publishEvent('contact.updated', event);
  }

  /**
   * Emit contact deleted event
   * Called when a contact is successfully deleted
   */
  emitContactDeleted(event: ContactDeletedEvent): void {
    this.logger.log(
      `Contact deleted: ID=${event.contactId}, Account=${event.accountId}, BusinessID=${event.businessId}, By=${event.deletedBy}`,
    );

    this.publishEvent('contact.deleted', event);
  }

  /**
   * Emit bulk operation event
   * Called when bulk contact operations are completed
   */
  emitBulkOperation(event: ContactBulkEvent): void {
    this.logger.log(
      `Contact bulk ${event.operation}: Account=${event.accountId}, Total=${event.contactCount}, Success=${event.successCount}, Errors=${event.errorCount}`,
    );

    this.publishEvent('contact.bulk', event);
  }

  /**
   * Emit validation event
   * Called during contact validation processes
   */
  emitValidation(event: ContactValidationEvent): void {
    const status = event.isValid ? 'PASSED' : 'FAILED';
    const errorInfo = event.errors?.length
      ? ` (${event.errors.length} errors)`
      : '';

    this.logger.log(
      `Contact validation ${status}: Account=${event.accountId}, Type=${event.validationType}${errorInfo}`,
    );

    this.publishEvent('contact.validation', event);
  }

  /**
   * Emit social media event
   * Called when social media profiles are added, updated, or discovered
   */
  emitSocialMediaEvent(event: ContactSocialMediaEvent): void {
    const actionDesc =
      event.action === 'discovered'
        ? `discovered via ${event.discoverySource}`
        : event.action;

    this.logger.log(
      `Contact social media ${actionDesc}: ID=${event.contactId}, Platform=${event.platform}, Account=${event.accountId}`,
    );

    this.publishEvent('contact.social_media', event);
  }

  /**
   * Emit business ID changed event
   * Special event for business ID changes, which affects uniqueness within account
   */
  emitBusinessIdChanged(event: ContactBusinessIdEvent): void {
    const changeDesc = event.oldBusinessId
      ? `${event.oldBusinessId}→${event.newBusinessId}`
      : event.newBusinessId;

    this.logger.log(
      `Contact business ID ${event.changeReason}: ID=${event.contactId}, Account=${event.accountId}, ${changeDesc}, By=${event.updatedBy}`,
    );

    this.publishEvent('contact.business_id_changed', event);
  }

  /**
   * Emit networking event
   * Called when professional connections or opportunities are discovered
   */
  emitNetworkingEvent(event: ContactNetworkingEvent): void {
    let eventDesc = `Contact ${event.eventType}: ID=${event.contactId}, Account=${event.accountId}`;

    if (event.details.connectedContactId) {
      eventDesc += `, Connected=${event.details.connectedContactId}`;
    }

    if (event.details.commonPlatforms?.length) {
      eventDesc += `, Platforms=[${event.details.commonPlatforms.join(', ')}]`;
    }

    if (event.details.potentialValue) {
      eventDesc += `, Value=${event.details.potentialValue}`;
    }

    this.logger.log(eventDesc);

    this.publishEvent('contact.networking', event);
  }

  /**
   * Emit job title changed event
   * Called when a contact's job title changes, potentially affecting industry categorization
   */
  emitJobTitleChanged(event: ContactJobTitleEvent): void {
    const changeDesc = event.oldJobTitle
      ? `${event.oldJobTitle}→${event.newJobTitle}`
      : event.newJobTitle;

    const industryNote = event.industryChange
      ? ` [Industry: ${event.industryCategory}]`
      : '';

    this.logger.log(
      `Contact job title changed: ID=${event.contactId}, Account=${event.accountId}, ${changeDesc}${industryNote}, By=${event.updatedBy}`,
    );

    this.publishEvent('contact.job_title_changed', event);
  }

  /**
   * Emit contact normalization event
   * Called when contact fields are automatically normalized (phone numbers, URLs, etc.)
   */
  emitContactNormalized(
    contactId: string,
    accountId: string,
    normalizedFields: string[],
  ): void {
    const event = {
      contactId,
      accountId,
      normalizedFields,
      timestamp: new Date(),
    };

    this.logger.log(
      `Contact normalized: ID=${contactId}, Account=${accountId}, Fields=[${normalizedFields.join(', ')}]`,
    );

    this.publishEvent('contact.normalized', event);
  }

  /**
   * Emit contact communication preference event
   * Called when contact communication preferences are updated
   */
  emitCommunicationPreferenceChanged(
    contactId: string,
    accountId: string,
    preferenceType: 'email' | 'phone' | 'social',
    oldValue?: string,
    newValue?: string,
    updatedBy?: string,
  ): void {
    const event = {
      contactId,
      accountId,
      preferenceType,
      oldValue,
      newValue,
      updatedBy,
      timestamp: new Date(),
    };

    const changeDesc = oldValue
      ? `${oldValue}→${newValue}`
      : newValue || 'removed';

    this.logger.log(
      `Contact ${preferenceType} preference changed: ID=${contactId}, Account=${accountId}, ${changeDesc}`,
    );

    this.publishEvent('contact.communication_preference_changed', event);
  }

  /**
   * Emit contact professional network analysis event
   * Called when network analysis is performed for strategic insights
   */
  emitNetworkAnalysis(
    accountId: string,
    totalContacts: number,
    industryDistribution: Record<string, number>,
    networkingOpportunities: number,
  ): void {
    const event = {
      accountId,
      totalContacts,
      industryDistribution,
      networkingOpportunities,
      timestamp: new Date(),
    };

    const topIndustries = Object.entries(industryDistribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([industry, count]) => `${industry}:${count}`)
      .join(', ');

    this.logger.log(
      `Contact network analysis: Account=${accountId}, Total=${totalContacts}, Opportunities=${networkingOpportunities}, TopIndustries=[${topIndustries}]`,
    );

    this.publishEvent('contact.network_analysis', event);
  }

  /**
   * Private method to publish events to external systems
   * Override this method to integrate with specific event bus or message broker
   */
  private publishEvent(
    eventType: string,
    eventData:
      | ContactCreatedEvent
      | ContactUpdatedEvent
      | ContactDeletedEvent
      | ContactBulkEvent
      | ContactValidationEvent
      | ContactSocialMediaEvent
      | ContactBusinessIdEvent
      | ContactNetworkingEvent
      | ContactJobTitleEvent
      | Record<string, unknown>,
  ): void {
    // TODO: Integrate with event bus (e.g., NestJS EventEmitter, Bull Queue, RabbitMQ, etc.)
    // For now, we just log the event type and data structure
    this.logger.debug(`Publishing event: ${eventType}`, {
      type: eventType,
      timestamp: 'timestamp' in eventData ? eventData.timestamp : new Date(),
      dataKeys: Object.keys(eventData),
    });
  }

  /**
   * Helper method to create standardized contact event metadata
   */
  private createEventMetadata() {
    return {
      timestamp: new Date(),
      source: 'contact-service',
      version: '1.0.0',
    };
  }

  /**
   * Get event statistics (useful for monitoring and debugging)
   */
  getEventStats(): {
    eventsPublished: number;
    lastEventTime?: Date;
    eventTypeDistribution?: Record<string, number>;
  } {
    // TODO: Implement event counting and statistics
    return {
      eventsPublished: 0,
      lastEventTime: undefined,
      eventTypeDistribution: {},
    };
  }

  /**
   * Helper method to extract social media platforms from contact data
   */
  private extractSocialMediaInfo(contact: {
    osot_facebook?: string;
    osot_instagram?: string;
    osot_tiktok?: string;
    osot_linkedin?: string;
  }): {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
  } {
    return {
      facebook: contact.osot_facebook || undefined,
      instagram: contact.osot_instagram || undefined,
      tiktok: contact.osot_tiktok || undefined,
      linkedin: contact.osot_linkedin || undefined,
    };
  }

  /**
   * Helper method to categorize industry from job title
   */
  private categorizeIndustryFromJobTitle(jobTitle?: string): string {
    if (!jobTitle) return 'Unknown';

    const title = jobTitle.toLowerCase();

    if (
      title.includes('developer') ||
      title.includes('engineer') ||
      title.includes('programmer')
    ) {
      return 'Technology';
    } else if (
      title.includes('manager') ||
      title.includes('director') ||
      title.includes('executive')
    ) {
      return 'Management';
    } else if (
      title.includes('sales') ||
      title.includes('account') ||
      title.includes('business development')
    ) {
      return 'Sales';
    } else if (
      title.includes('marketing') ||
      title.includes('brand') ||
      title.includes('communications')
    ) {
      return 'Marketing';
    } else if (
      title.includes('finance') ||
      title.includes('accounting') ||
      title.includes('controller')
    ) {
      return 'Finance';
    } else if (
      title.includes('hr') ||
      title.includes('human resources') ||
      title.includes('recruiter')
    ) {
      return 'Human Resources';
    } else if (title.includes('consultant') || title.includes('advisor')) {
      return 'Consulting';
    } else {
      return 'Other';
    }
  }

  /**
   * Helper method to validate and convert AccessModifier enum values
   * Ensures type safety when working with AccessModifier values from external sources
   */
  private validateAccessModifier(value: unknown): AccessModifier | undefined {
    if (typeof value === 'number' && value in AccessModifier) {
      return value as AccessModifier;
    }
    return undefined;
  }

  /**
   * Helper method to validate and convert Privilege enum values
   * Ensures type safety when working with Privilege values from external sources
   */
  private validatePrivilege(value: unknown): Privilege | undefined {
    if (typeof value === 'number' && value in Privilege) {
      return value as Privilege;
    }
    return undefined;
  }

  /**
   * Helper method to create contact change event with proper enum validation
   * Validates enum values and ensures type safety for AccessModifier and Privilege
   */
  createContactUpdatedEvent(
    contactId: string,
    accountId: string,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
    updatedBy: string,
  ): ContactUpdatedEvent {
    return {
      contactId,
      accountId,
      changes: {
        old: {
          businessId: oldData.businessId as string,
          jobTitle: oldData.jobTitle as string,
          email: oldData.email as string,
          homePhone: oldData.homePhone as string,
          workPhone: oldData.workPhone as string,
          businessWebsite: oldData.businessWebsite as string,
          socialMedia: this.extractSocialMediaInfo(oldData),
          accessModifiers: this.validateAccessModifier(oldData.accessModifiers),
          privilege: this.validatePrivilege(oldData.privilege),
        },
        new: {
          businessId: newData.businessId as string,
          jobTitle: newData.jobTitle as string,
          email: newData.email as string,
          homePhone: newData.homePhone as string,
          workPhone: newData.workPhone as string,
          businessWebsite: newData.businessWebsite as string,
          socialMedia: this.extractSocialMediaInfo(newData),
          accessModifiers: this.validateAccessModifier(newData.accessModifiers),
          privilege: this.validatePrivilege(newData.privilege),
        },
      },
      updatedBy,
      timestamp: new Date(),
    };
  }
}
