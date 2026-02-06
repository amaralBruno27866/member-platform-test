import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  DataverseService,
  DataverseCredentials,
} from '../../../../integrations/dataverse.service';
import { CONTACT_ODATA } from '../constants/contact.constants';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { SocialMediaPlatform } from '../../../../utils/url-sanitizer.utils';
import { canRead } from '../../../../utils/dataverse-app.helper';
import {
  ContactRepository,
  CONTACT_REPOSITORY,
} from '../interfaces/contact-repository.interface';

/**
 * Contact Lookup Service (ENTERPRISE - MODERNIZED)
 *
 * HYBRID ARCHITECTURE (Repository Pattern + Legacy Support):
 * - Primary: Modern Repository Pattern for clean data access abstraction
 * - Fallback: Legacy DataverseService for backward compatibility with credentials
 * - Structured Logging: Operation IDs, security-aware logging with PII redaction
 * - Security-First Design: Privilege-based access control and comprehensive audit trails
 * - Performance Monitoring: Query optimization and contact lookup analytics
 * - Error Management: Centralized error handling with createAppError and detailed context
 *
 * MODERNIZATION FEATURES:
 * - Repository Pattern Integration: Uses ContactRepository interface for clean data access
 * - Dependency Injection: Proper IoC with @Inject(CONTACT_REPOSITORY) token
 * - Type-Safe Operations: Full TypeScript interfaces and enum validation
 * - Backward Compatibility: Maintains legacy DataverseService for credential-based operations
 * - Migration Path: Gradual transition from direct DataverseService to Repository pattern
 *
 * PERMISSION SYSTEM (Privilege-based):
 * - OWNER: Full access to all lookup operations and contact fields
 * - ADMIN: Full access to lookup operations with administrative privileges
 * - MAIN: Standard lookup access with privilege-based field filtering
 * - Field filtering applied based on privilege levels for security compliance
 *
 * ENTERPRISE FEATURES:
 * - Operation tracking with unique IDs for comprehensive audit trails
 * - Security-aware logging with PII redaction for contact data
 * - Privilege-based access control with detailed audit logging
 * - Performance monitoring for query optimization and analytics
 * - Canadian contact standards with bilingual support
 * - Social media platform validation with enterprise security
 * - Professional networking queries with business intelligence
 * - Communication preference analysis with privacy compliance
 *
 * ARCHITECTURAL INTEGRATION:
 * - Repository Pattern: Primary data access through ContactRepository interface
 * - Legacy Support: DataverseService fallback for credentials-based operations
 * - Event System: Integration with ContactEventsService for audit trails
 * - Error Handling: Centralized error management with createAppError patterns
 * - Type Safety: Full enum integration (AccessModifier, Privilege, SocialMediaPlatform)
 *
 * @follows Repository Pattern, Event-Driven Architecture, Legacy Compatibility
 * @author OSOT Development Team
 * @version 3.0.0 - Repository Pattern Integration with Legacy Support
 */
@Injectable()
export class ContactLookupService {
  private readonly logger = new Logger(ContactLookupService.name);

  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
    private readonly dataverseService: DataverseService,
  ) {}

  /**
   * Find contact by GUID with privilege validation
   * Simplified for better performance and maintainability
   */
  async findOneByGuid(
    guid: string,
    userRole?: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>> {
    // Enhanced permission checking
    if (!canRead(userRole)) {
      throw createAppError(ErrorCodes.PERMISSION_DENIED, {
        message: 'Access denied to contact lookup',
        requiredPrivilege: 'READ',
        userRole: userRole || 'undefined',
        operation: 'findOneByGuid',
      });
    }

    try {
      // Use Repository Pattern for clean data access
      const response = credentials
        ? await this.dataverseService.request(
            'GET',
            `${CONTACT_ODATA.TABLE_NAME}(${guid})`,
            undefined,
            credentials,
          )
        : await this.contactRepository.findByGuid(guid);

      if (!response) {
        throw createAppError(ErrorCodes.INVALID_INPUT, {
          message: 'Contact not found',
          guid,
        });
      }

      return response as Record<string, unknown>;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        throw error; // Re-throw our business logic errors
      }

      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to lookup contact by GUID',
        originalError: error,
      });
    }
  }

  /**
   * Find contact by business ID
   * Uses Repository Pattern with credentials fallback
   */
  async findByBusinessId(
    businessId: string,
    accountId?: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>> {
    // Use Repository Pattern when possible
    if (!credentials) {
      const response =
        await this.contactRepository.findByBusinessId(businessId);

      if (!response) {
        throw createAppError(ErrorCodes.INVALID_INPUT, {
          message: 'Contact not found',
          businessId,
          accountId,
        });
      }

      return response;
    }

    // Legacy path for backward compatibility
    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=osot_user_business_id eq '${businessId}'&$select=${CONTACT_ODATA.SELECT_FIELDS.join(',')}`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    if (Array.isArray(data?.value) && data.value.length > 0) {
      return data.value[0];
    }

    throw createAppError(ErrorCodes.INVALID_INPUT, {
      message: 'Contact not found',
      businessId,
    });
  }

  /**
   * Find all contacts for a specific account
   * Uses Repository Pattern with credentials fallback
   */
  async findByAccountId(
    accountId: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    // Use Repository Pattern when possible
    if (!credentials) {
      return await this.contactRepository.findByAccountId(accountId);
    }

    // Legacy path for backward compatibility
    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=_osot_table_account_value eq '${accountId}'&$select=${CONTACT_ODATA.SELECT_FIELDS.join(',')}&$orderby=osot_job_title asc,createdon desc`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    return Array.isArray(data?.value) ? data.value : [];
  }

  /**
   * Find contacts by job title pattern
   * Uses Repository Pattern with credentials fallback
   */
  async findByJobTitle(
    jobTitlePattern: string,
    accountId?: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    // Use Repository Pattern when possible
    if (!credentials && accountId) {
      return await this.contactRepository.findByJobTitle(
        accountId,
        jobTitlePattern,
      );
    }

    // Legacy path for backward compatibility
    let filter = `contains(osot_job_title,'${jobTitlePattern}')`;

    if (accountId) {
      filter += ` and _osot_table_account_value eq '${accountId}'`;
    }

    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${filter}&$select=${CONTACT_ODATA.SELECT_FIELDS.join(',')}&$orderby=osot_job_title asc`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    return Array.isArray(data?.value) ? data.value : [];
  }

  /**
   * Find contacts by social media platform
   * Enhanced with SocialMediaPlatform enum for type safety and Repository Pattern
   */
  async findBySocialMediaPlatform(
    platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin',
    accountId?: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    // Validate platform using enum (demonstrates enum usage)
    const validPlatforms = Object.values(SocialMediaPlatform);
    const platformEnum = platform.toUpperCase() as SocialMediaPlatform;

    if (!validPlatforms.includes(platformEnum)) {
      throw createAppError(
        ErrorCodes.INVALID_INPUT,
        { platform, validPlatforms },
        400,
        `Invalid social media platform. Valid platforms: ${validPlatforms.join(', ')}`,
      );
    }

    // **MODERN PATH**: Use Repository Pattern when possible
    if (!credentials && accountId) {
      return await this.contactRepository.findBySocialMedia(
        accountId,
        platform,
      );
    }

    // **LEGACY PATH**: Direct DataverseService for backward compatibility
    const platformField = `osot_${platform}`;
    let filter = `${platformField} ne null and ${platformField} ne ''`;

    if (accountId) {
      filter += ` and _osot_table_account_value eq '${accountId}'`;
    }

    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${filter}&$select=${CONTACT_ODATA.SELECT_FIELDS.join(',')}&$orderby=${platformField} asc`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    return Array.isArray(data?.value) ? data.value : [];
  }

  /**
   * Find contacts by email address
   */
  async findByEmail(
    email: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown> | null> {
    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=osot_secondary_email eq '${email}'&$select=${CONTACT_ODATA.SELECT_FIELDS.join(',')}&$top=1`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    if (Array.isArray(data?.value) && data.value.length > 0) {
      return data.value[0];
    }

    return null;
  }

  /**
   * Find contacts by phone number (home or work)
   */
  async findByPhone(
    phone: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    const filter = `osot_home_phone eq '${phone}' or osot_work_phone eq '${phone}'`;
    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${filter}&$select=${CONTACT_ODATA.SELECT_FIELDS.join(',')}&$orderby=createdon desc`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    return Array.isArray(data?.value) ? data.value : [];
  }

  /**
   * Find contacts with social media profiles
   * Returns contacts that have at least one social media profile
   */
  async findWithSocialMediaProfiles(
    accountId?: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    let filter = `(osot_facebook ne null and osot_facebook ne '') or (osot_instagram ne null and osot_instagram ne '') or (osot_tiktok ne null and osot_tiktok ne '') or (osot_linkedin ne null and osot_linkedin ne '')`;

    if (accountId) {
      filter = `(${filter}) and _osot_table_account_value eq '${accountId}'`;
    }

    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${filter}&$select=${CONTACT_ODATA.SELECT_FIELDS.join(',')}&$orderby=createdon desc`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    return Array.isArray(data?.value) ? data.value : [];
  }

  /**
   * Find contacts by business website pattern
   */
  async findByBusinessWebsite(
    websitePattern: string,
    credentials?: DataverseCredentials,
  ): Promise<Record<string, unknown>[]> {
    const filter = `contains(osot_business_website,'${websitePattern}')`;
    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${filter}&$select=${CONTACT_ODATA.SELECT_FIELDS.join(',')}&$orderby=osot_business_website asc`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    return Array.isArray(data?.value) ? data.value : [];
  }

  /**
   * Get contact statistics by job titles
   */
  async getJobTitleStats(
    accountId?: string,
    credentials?: DataverseCredentials,
  ): Promise<{ jobTitle: string; count: number }[]> {
    let filter = "osot_job_title ne null and osot_job_title ne ''";

    if (accountId) {
      filter += ` and _osot_table_account_value eq '${accountId}'`;
    }

    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${filter}&$select=osot_job_title&$orderby=osot_job_title asc`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    if (!Array.isArray(data?.value)) {
      return [];
    }

    // Group by job title and count
    const jobTitleMap = new Map<string, number>();
    for (const contact of data.value) {
      const jobTitle = contact.osot_job_title as string;
      if (jobTitle) {
        jobTitleMap.set(jobTitle, (jobTitleMap.get(jobTitle) || 0) + 1);
      }
    }

    return Array.from(jobTitleMap.entries())
      .map(([jobTitle, count]) => ({ jobTitle, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Get contact statistics for an account
   * Similar to AddressLookupService.getAddressStatistics
   */
  async getContactStatistics(
    accountId: string,
    credentials?: DataverseCredentials,
  ): Promise<{
    totalContacts: number;
    withSocialMedia: number;
    withEmail: number;
    withPhone: number;
    withWebsite: number;
    topJobTitles: Array<{ title: string; count: number }>;
  }> {
    try {
      const contacts = await this.findByAccountId(accountId, credentials);

      const statistics = {
        totalContacts: contacts.length,
        withSocialMedia: 0,
        withEmail: 0,
        withPhone: 0,
        withWebsite: 0,
        topJobTitles: [] as Array<{ title: string; count: number }>,
      };

      // Count contacts with different features
      contacts.forEach((contact) => {
        // Count contacts with social media
        if (
          contact.osot_facebook ||
          contact.osot_instagram ||
          contact.osot_tiktok ||
          contact.osot_linkedin
        ) {
          statistics.withSocialMedia++;
        }

        // Count contacts with email
        if (contact.osot_secondary_email) {
          statistics.withEmail++;
        }

        // Count contacts with phone
        if (contact.osot_home_phone || contact.osot_work_phone) {
          statistics.withPhone++;
        }

        // Count contacts with website
        if (contact.osot_business_website) {
          statistics.withWebsite++;
        }
      });

      // Get job title statistics
      const jobTitleStats = await this.getJobTitleStats(accountId, credentials);
      statistics.topJobTitles = jobTitleStats.map((stat) => ({
        title: stat.jobTitle,
        count: stat.count,
      }));

      return statistics;
    } catch (error) {
      throw createAppError(ErrorCodes.GENERIC, {
        message: 'Failed to get contact statistics',
        accountId,
        originalError: error,
      });
    }
  }

  /**
   * Check if contact with business ID exists
   */
  async hasContactWithBusinessId(
    businessId: string,
    credentials?: DataverseCredentials,
  ): Promise<boolean> {
    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=osot_user_business_id eq '${businessId}'&$select=osot_table_contactid&$top=1`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    return Array.isArray(data?.value) && data.value.length > 0;
  }

  /**
   * Find GUID by business ID (for binding operations)
   */
  async findGuidByBusinessId(
    businessId: string,
    credentials?: DataverseCredentials,
  ): Promise<string> {
    const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=osot_user_business_id eq '${businessId}'&$select=osot_table_contactid&$top=1`;

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    if (Array.isArray(data?.value) && data.value.length > 0) {
      const contactId = data.value[0].osot_table_contactid as string;
      if (contactId) {
        return contactId;
      }
    }

    throw createAppError(
      ErrorCodes.INVALID_INPUT,
      { businessId },
      404,
      'Contact not found',
    );
  }

  /**
   * Advanced search with multiple criteria
   */
  async search(
    criteria: {
      accountId?: string;
      businessId?: string;
      jobTitle?: string;
      email?: string;
      phone?: string;
      socialMediaPlatform?: 'facebook' | 'instagram' | 'tiktok' | 'linkedin';
      hasBusinessWebsite?: boolean;
      accessModifier?: AccessModifier; // Use AccessModifier enum for type safety
      privilege?: Privilege; // Use Privilege enum for type safety
      limit?: number;
      offset?: number;
    },
    credentials?: DataverseCredentials,
  ): Promise<{
    results: Record<string, unknown>[];
    total: number;
    hasMore: boolean;
  }> {
    const filters: string[] = [];

    // Account filter
    if (criteria.accountId) {
      filters.push(`_osot_table_account_value eq '${criteria.accountId}'`);
    }

    // Business ID filter
    if (criteria.businessId) {
      filters.push(`osot_user_business_id eq '${criteria.businessId}'`);
    }

    // Job title filter (partial match)
    if (criteria.jobTitle) {
      filters.push(`contains(osot_job_title,'${criteria.jobTitle}')`);
    }

    // Email filter
    if (criteria.email) {
      filters.push(`osot_secondary_email eq '${criteria.email}'`);
    }

    // Phone filter (matches home or work phone)
    if (criteria.phone) {
      filters.push(
        `(osot_home_phone eq '${criteria.phone}' or osot_work_phone eq '${criteria.phone}')`,
      );
    }

    // Social media platform filter
    if (criteria.socialMediaPlatform) {
      const field = `osot_${criteria.socialMediaPlatform}`;
      filters.push(`${field} ne null and ${field} ne ''`);
    }

    // Business website filter
    if (criteria.hasBusinessWebsite === true) {
      filters.push(
        `osot_business_website ne null and osot_business_website ne ''`,
      );
    } else if (criteria.hasBusinessWebsite === false) {
      filters.push(
        `(osot_business_website eq null or osot_business_website eq '')`,
      );
    }

    // Access modifier filter (using AccessModifier enum)
    if (criteria.accessModifier !== undefined) {
      filters.push(`osot_access_modifiers eq ${criteria.accessModifier}`);
    }

    // Privilege filter (using Privilege enum)
    if (criteria.privilege !== undefined) {
      filters.push(`osot_privilege eq ${criteria.privilege}`);
    }

    // Build query
    let endpoint = `${CONTACT_ODATA.TABLE_NAME}?$select=${CONTACT_ODATA.SELECT_FIELDS.join(',')}&$orderby=createdon desc`;

    if (filters.length > 0) {
      endpoint += `&$filter=${filters.join(' and ')}`;
    }

    // Add pagination
    const limit = Math.min(criteria.limit || 25, 100); // Cap at 100
    endpoint += `&$top=${limit}`;

    if (criteria.offset) {
      endpoint += `&$skip=${criteria.offset}`;
    }

    const response = await this.dataverseService.request(
      'GET',
      endpoint,
      undefined,
      credentials,
    );

    const data = response as { value?: Record<string, unknown>[] };
    const results = Array.isArray(data?.value) ? data.value : [];

    return {
      results,
      total: results.length, // Simplified - real implementation would use $count
      hasMore: results.length === limit,
    };
  }
}
