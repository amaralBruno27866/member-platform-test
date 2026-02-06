import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { CONTACT_ODATA } from '../constants/contact.constants';
import { ListContactsQueryDto } from '../dtos/list-contacts.query.dto';
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { ContactRepository } from '../interfaces/contact-repository.interface';
import { ContactInternal } from '../interfaces/contact-internal.interface';
import { mapDataverseToContactInternal } from '../mappers/contact.mapper';

/**
 * DataverseContactRepository
 *
 * Repository implementation for Contact entities using Microsoft Dataverse.
 * Provides a clean abstraction layer between the application and Dataverse API,
 * handling all CRUD operations and complex queries for contact data.
 *
 * Integration Features:
 * - AccessModifier enum integration for consistent access control typing
 * - Privilege enum integration for standardized permission management
 * - Type-safe interfaces leveraging #file:enums for all operations
 * - Proper error handling following project standards
 * - Business logic validation using established patterns
 *
 * Key Features:
 * - Full CRUD operations with proper error handling
 * - Complex filtering and search capabilities with enum type safety
 * - Account-based contact queries with business ID validation
 * - Social media profile queries and analytics
 * - Professional networking analysis with relationship strength calculation
 * - Contact statistics and metrics with proper enum categorization
 * - Business ID uniqueness validation within account scope
 * - Standardized error handling and logging
 * - Type-safe interfaces for all operations using AccessModifier/Privilege enums
 *
 * Contact Table Structure (from Table Contact.csv):
 * - Contact_ID: Autonumber (osot-ct-0000001)
 * - Table_Contact: Unique identifier (GUID)
 * - User_Business_ID: Business required (20 char max)
 * - Secondary_Email: Email (255 char max)
 * - Job_Title: Text (50 char max)
 * - Home_Phone/Work_Phone: Phone (14 char max)
 * - Business_Website: URL (255 char max)
 * - Social Media: Facebook, Instagram, TikTok, LinkedIn (255 char max each)
 * - Access_Modifiers: Choice (AccessModifier enum values)
 * - Privilege: Choice (Privilege enum values)
 * - Table_Account: Required lookup to Account table
 *
 * Architecture Benefits:
 * - Abstracts Dataverse specifics from business logic
 * - Enables easy unit testing with mock implementations
 * - Centralizes data access patterns for consistency
 * - Provides single point of change for data layer modifications
 * - Ensures type safety with enum integration throughout
 */
@Injectable()
export class DataverseContactRepository implements ContactRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new contact record in Dataverse
   * @param contactData Contact internal data to create
   * @returns Created contact record with generated ID
   */
  async create(
    contactData: Partial<ContactInternal>,
  ): Promise<ContactInternal> {
    try {
      const payload = this.mapInternalToDataverse(contactData);

      const response = await this.dataverseService.request(
        'POST',
        CONTACT_ODATA.TABLE_NAME,
        payload,
      );

      // Log successful data persistence
      console.log('✅ [CONTACT] Data persisted in Dataverse:');
      console.log(JSON.stringify(response, null, 2));

      return mapDataverseToContactInternal(response);
    } catch (error) {
      throw new Error(
        `Failed to create contact: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find contact by its unique GUID identifier
   * @param guid Contact GUID to search for
   * @returns Contact record or undefined if not found
   */
  async findByGuid(guid: string): Promise<Record<string, unknown> | undefined> {
    try {
      const endpoint = `${CONTACT_ODATA.TABLE_NAME}(${guid})`;
      const response = await this.dataverseService.request('GET', endpoint);
      return response as Record<string, unknown> | undefined;
    } catch (error) {
      // Handle 404 as undefined rather than throwing
      if (error instanceof Error && error.message.includes('404')) {
        return undefined;
      }
      throw new Error(
        `Failed to find contact by GUID ${guid}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update existing contact record by GUID
   * @param guid Contact GUID to update
   * @param payload Updated contact data
   */
  async updateByGuid(
    guid: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    try {
      const endpoint = `${CONTACT_ODATA.TABLE_NAME}(${guid})`;
      await this.dataverseService.request('PATCH', endpoint, payload);
    } catch (error) {
      throw new Error(
        `Failed to update contact ${guid}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Delete contact record by GUID
   * @param guid Contact GUID to delete
   */
  async deleteByGuid(guid: string): Promise<void> {
    try {
      const endpoint = `${CONTACT_ODATA.TABLE_NAME}(${guid})`;
      await this.dataverseService.request('DELETE', endpoint);
    } catch (error) {
      throw new Error(
        `Failed to delete contact ${guid}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find all contacts associated with a specific account
   * @param accountId Account GUID to search contacts for
   * @param query Optional query parameters for filtering and pagination
   * @returns Array of contact records for the account
   */
  async findByAccountId(
    accountId: string,
    query?: ListContactsQueryDto,
  ): Promise<Record<string, unknown>[]> {
    try {
      // CORREÇÃO: Usar user_business_id ao invés de lookup complexo (seguindo padrão do address)
      let filter = `${CONTACT_ODATA.USER_BUSINESS_ID} eq '${accountId}'`;

      // Add additional filters from query using correct DTO property names
      if (query?.osot_job_title) {
        filter += ` and contains(${CONTACT_ODATA.JOB_TITLE}, '${query.osot_job_title}')`;
      }
      if (query?.osot_secondary_email) {
        filter += ` and contains(${CONTACT_ODATA.SECONDARY_EMAIL}, '${query.osot_secondary_email}')`;
      }
      if (query?.osot_user_business_id) {
        filter += ` and contains(${CONTACT_ODATA.USER_BUSINESS_ID}, '${query.osot_user_business_id}')`;
      }
      if (query?.osot_home_phone) {
        filter += ` and contains(${CONTACT_ODATA.HOME_PHONE}, '${query.osot_home_phone}')`;
      }
      if (query?.osot_work_phone) {
        filter += ` and contains(${CONTACT_ODATA.WORK_PHONE}, '${query.osot_work_phone}')`;
      }
      if (query?.osot_table_account) {
        filter += ` and ${CONTACT_ODATA.USER_BUSINESS_ID} eq '${query.osot_table_account}'`;
      }

      // Free text search across multiple fields
      if (query?.q) {
        const searchTerm = query.q;
        filter += ` and (contains(${CONTACT_ODATA.USER_BUSINESS_ID}, '${searchTerm}') or contains(${CONTACT_ODATA.JOB_TITLE}, '${searchTerm}') or contains(${CONTACT_ODATA.SECONDARY_EMAIL}, '${searchTerm}'))`;
      }

      let endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`;

      // Add pagination using page/limit instead of offset
      if (query?.limit) {
        endpoint += `&$top=${query.limit}`;
      }
      if (query?.page && query?.limit) {
        const skip = (query.page - 1) * query.limit;
        endpoint += `&$skip=${skip}`;
      }

      const response = await this.dataverseService.request('GET', endpoint);
      const data = response as { value?: Record<string, unknown>[] };

      return data?.value || [];
    } catch (error) {
      throw new Error(
        `Failed to find contacts for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find contact by business ID directly (osot_contact_id)
   * @param businessId Contact business ID (e.g., osot-ct-0000001)
   * @returns Single contact record or undefined if not found
   */
  async findByBusinessId(
    businessId: string,
  ): Promise<Record<string, unknown> | undefined> {
    try {
      const filter = `${CONTACT_ODATA.ID} eq '${businessId}'`;
      const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$top=1`;

      const response = await this.dataverseService.request('GET', endpoint);
      const data = response as { value?: Record<string, unknown>[] };

      return data?.value?.[0];
    } catch (error) {
      throw new Error(
        `Failed to find contact by business ID ${businessId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find contacts by user business ID directly (no account navigation)
   * More reliable than OData navigation for business ID lookups
   */
  async findByUserBusinessId(
    userBusinessId: string,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filter = `${CONTACT_ODATA.USER_BUSINESS_ID} eq '${userBusinessId}'`;
      const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`;

      const response = await this.dataverseService.request('GET', endpoint);
      const data = response as { value?: Record<string, unknown>[] };

      return Array.isArray(data?.value) ? data.value : [];
    } catch (error) {
      throw new Error(
        `Failed to find contacts by user business ID ${userBusinessId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find contacts by job title pattern
   * Supports partial matching for professional networking features
   * @param accountId Account GUID to search within
   * @param jobTitlePattern Job title pattern to match
   * @returns Array of matching contact records
   */
  async findByJobTitle(
    accountId: string,
    jobTitlePattern: string,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filter = `_osot_table_account_value eq ${accountId} and contains(osot_job_title, '${jobTitlePattern}')`;
      const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`;

      const response = await this.dataverseService.request('GET', endpoint);
      const data = response as { value?: Record<string, unknown>[] };

      return data?.value || [];
    } catch (error) {
      throw new Error(
        `Failed to find contacts by job title for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Find contacts by social media platform
   * Returns contacts that have profiles on specific social platforms
   * @param accountId Account GUID to search within
   * @param platform Social media platform to check
   * @returns Array of contacts with profiles on the specified platform
   */
  async findBySocialMedia(
    accountId: string,
    platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin',
  ): Promise<Record<string, unknown>[]> {
    try {
      const platformField = `osot_${platform}`;
      const filter = `_osot_table_account_value eq ${accountId} and ${platformField} ne null and ${platformField} ne ''`;
      const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`;

      const response = await this.dataverseService.request('GET', endpoint);
      const data = response as { value?: Record<string, unknown>[] };

      return data?.value || [];
    } catch (error) {
      throw new Error(
        `Failed to find contacts by ${platform} for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Search contacts with complex criteria
   * @param criteria Search parameters including filters and pagination
   * @returns Search results with data, total count, and hasMore flag
   */
  async search(criteria: {
    accountId?: string;
    businessId?: string;
    jobTitle?: string;
    email?: string;
    socialMedia?: {
      platform?: 'facebook' | 'instagram' | 'tiktok' | 'linkedin';
      hasProfile?: boolean;
    };
    accessModifier?: number;
    privilege?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    results: Record<string, unknown>[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      const filters: string[] = [];

      if (criteria.accountId) {
        filters.push(`_osot_table_account_value eq ${criteria.accountId}`);
      }
      if (criteria.businessId) {
        filters.push(
          `contains(osot_user_business_id, '${criteria.businessId}')`,
        );
      }
      if (criteria.jobTitle) {
        filters.push(`contains(osot_job_title, '${criteria.jobTitle}')`);
      }
      if (criteria.email) {
        filters.push(`contains(osot_secondary_email, '${criteria.email}')`);
      }
      if (criteria.accessModifier !== undefined) {
        filters.push(`osot_access_modifiers eq ${criteria.accessModifier}`);
      }
      if (criteria.privilege !== undefined) {
        filters.push(`osot_privilege eq ${criteria.privilege}`);
      }

      // Social media filters
      if (criteria.socialMedia?.platform) {
        const platformField = `osot_${criteria.socialMedia.platform}`;
        if (criteria.socialMedia.hasProfile) {
          filters.push(`${platformField} ne null and ${platformField} ne ''`);
        } else {
          filters.push(`(${platformField} eq null or ${platformField} eq '')`);
        }
      }

      const filterString = filters.length > 0 ? filters.join(' and ') : '';
      const limitClause = criteria.limit ? `&$top=${criteria.limit + 1}` : ''; // +1 to check hasMore
      const offsetClause = criteria.offset ? `&$skip=${criteria.offset}` : '';

      let endpoint = `${CONTACT_ODATA.TABLE_NAME}`;
      if (filterString) {
        endpoint += `?$filter=${encodeURIComponent(filterString)}${limitClause}${offsetClause}&$count=true`;
      } else if (limitClause || offsetClause) {
        endpoint += `?${limitClause.substring(1)}${offsetClause}&$count=true`; // Remove leading &
      } else {
        endpoint += `?$count=true`;
      }

      const response = await this.dataverseService.request('GET', endpoint);
      const data = response as {
        value?: Record<string, unknown>[];
        '@odata.count'?: number;
      };

      const results = data?.value || [];
      const total = data?.['@odata.count'] || 0;

      // Check if there are more results
      let hasMore = false;
      if (criteria.limit && results.length > criteria.limit) {
        hasMore = true;
        results.pop(); // Remove the extra record used for hasMore check
      }

      return {
        results,
        total,
        hasMore,
      };
    } catch (error) {
      throw new Error(
        `Failed to search contacts: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get comprehensive contact statistics for an account
   * @param accountId Account GUID to analyze
   * @returns Detailed statistics about contacts in the account
   */
  async getContactStatistics(accountId: string): Promise<{
    total: number;
    byJobTitle: Record<string, number>;
    bySocialMedia: {
      facebook: number;
      instagram: number;
      tiktok: number;
      linkedin: number;
      withAnyProfile: number;
      withAllProfiles: number;
    };
    byAccessModifier: Record<AccessModifier, number>;
    byPrivilege: Record<Privilege, number>;
    withSecondaryEmail: number;
    withPhones: {
      home: number;
      work: number;
      both: number;
    };
  }> {
    try {
      const contacts = await this.findByAccountId(accountId);

      const stats = {
        total: contacts.length,
        byJobTitle: {} as Record<string, number>,
        bySocialMedia: {
          facebook: 0,
          instagram: 0,
          tiktok: 0,
          linkedin: 0,
          withAnyProfile: 0,
          withAllProfiles: 0,
        },
        byAccessModifier: {} as Record<AccessModifier, number>,
        byPrivilege: {} as Record<Privilege, number>,
        withSecondaryEmail: 0,
        withPhones: {
          home: 0,
          work: 0,
          both: 0,
        },
      };

      contacts.forEach((contact) => {
        // Job title stats
        const jobTitle = contact.osot_job_title as string;
        if (jobTitle) {
          stats.byJobTitle[jobTitle] = (stats.byJobTitle[jobTitle] || 0) + 1;
        }

        // Social media stats
        const hasFacebook = !!(contact.osot_facebook as string);
        const hasInstagram = !!(contact.osot_instagram as string);
        const hasTikTok = !!(contact.osot_tiktok as string);
        const hasLinkedIn = !!(contact.osot_linkedin as string);

        if (hasFacebook) stats.bySocialMedia.facebook++;
        if (hasInstagram) stats.bySocialMedia.instagram++;
        if (hasTikTok) stats.bySocialMedia.tiktok++;
        if (hasLinkedIn) stats.bySocialMedia.linkedin++;

        if (hasFacebook || hasInstagram || hasTikTok || hasLinkedIn) {
          stats.bySocialMedia.withAnyProfile++;
        }
        if (hasFacebook && hasInstagram && hasTikTok && hasLinkedIn) {
          stats.bySocialMedia.withAllProfiles++;
        }

        // Access modifier stats
        const accessModifier = contact.osot_access_modifiers as number;
        if (accessModifier !== undefined && accessModifier in AccessModifier) {
          const modifierEnum = accessModifier as AccessModifier;
          stats.byAccessModifier[modifierEnum] =
            (stats.byAccessModifier[modifierEnum] || 0) + 1;
        }

        // Privilege stats
        const privilege = contact.osot_privilege as number;
        if (privilege !== undefined && privilege in Privilege) {
          const privilegeEnum = privilege as Privilege;
          stats.byPrivilege[privilegeEnum] =
            (stats.byPrivilege[privilegeEnum] || 0) + 1;
        }

        // Email stats
        if (contact.osot_secondary_email as string) {
          stats.withSecondaryEmail++;
        }

        // Phone stats
        const hasHomePhone = !!(contact.osot_home_phone as string);
        const hasWorkPhone = !!(contact.osot_work_phone as string);

        if (hasHomePhone) stats.withPhones.home++;
        if (hasWorkPhone) stats.withPhones.work++;
        if (hasHomePhone && hasWorkPhone) stats.withPhones.both++;
      });

      return stats;
    } catch (error) {
      throw new Error(
        `Failed to get contact statistics for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Check if a business ID already exists for an account
   * @param accountId Account GUID to check
   * @param businessId Business ID to check for
   * @param excludeContactId Optional contact ID to exclude from check
   * @returns True if business ID exists, false otherwise
   */
  async businessIdExists(
    accountId: string,
    businessId: string,
    excludeContactId?: string,
  ): Promise<boolean> {
    try {
      let filter = `_osot_table_account_value eq ${accountId} and osot_user_business_id eq '${businessId}'`;

      if (excludeContactId) {
        filter += ` and osot_table_contactid ne ${excludeContactId}`;
      }

      const endpoint = `${CONTACT_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$top=1&$select=osot_table_contactid`;

      const response = await this.dataverseService.request('GET', endpoint);
      const data = response as { value?: Record<string, unknown>[] };

      return (data?.value?.length || 0) > 0;
    } catch (error) {
      throw new Error(
        `Failed to check business ID existence for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Analyze professional network for an account
   * Provides insights into professional connections and networking opportunities
   * @param accountId Account GUID to analyze
   * @returns Professional network analysis with connections and opportunities
   */
  async analyzeProfessionalNetwork(accountId: string): Promise<{
    totalContacts: number;
    industryDistribution: Record<string, number>;
    commonConnections: Array<{
      contact1Id: string;
      contact2Id: string;
      commonPlatforms: string[];
      relationshipStrength: number;
    }>;
    networkingOpportunities: Array<{
      contactId: string;
      opportunity: string;
      potentialValue: number;
    }>;
  }> {
    try {
      const contacts = await this.findByAccountId(accountId);

      // Industry distribution based on job titles
      const industryDistribution: Record<string, number> = {};
      contacts.forEach((contact) => {
        const jobTitle = contact.osot_job_title as string;
        if (jobTitle) {
          // Extract industry from job title (simplified logic)
          const industry = this.extractIndustryFromJobTitle(jobTitle);
          industryDistribution[industry] =
            (industryDistribution[industry] || 0) + 1;
        }
      });

      // Find common connections based on social media platforms
      const commonConnections = this.findCommonConnections(contacts);

      // Generate networking opportunities
      const networkingOpportunities =
        this.generateNetworkingOpportunities(contacts);

      return {
        totalContacts: contacts.length,
        industryDistribution,
        commonConnections,
        networkingOpportunities,
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze professional network for account ${accountId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Extract industry from job title (simplified categorization)
   * @private
   */
  private extractIndustryFromJobTitle(jobTitle: string): string {
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
   * Find common connections between contacts based on social media platforms
   * @private
   */
  private findCommonConnections(contacts: Record<string, unknown>[]): Array<{
    contact1Id: string;
    contact2Id: string;
    commonPlatforms: string[];
    relationshipStrength: number;
  }> {
    const connections: Array<{
      contact1Id: string;
      contact2Id: string;
      commonPlatforms: string[];
      relationshipStrength: number;
    }> = [];

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const contact1 = contacts[i];
        const contact2 = contacts[j];

        const commonPlatforms: string[] = [];
        const platforms = ['facebook', 'instagram', 'linkedin', 'tiktok'];

        platforms.forEach((platform) => {
          const field = `osot_${platform}`;
          if (contact1[field] && contact2[field]) {
            commonPlatforms.push(platform);
          }
        });

        if (commonPlatforms.length > 0) {
          const relationshipStrength = this.calculateRelationshipStrength(
            contact1,
            contact2,
            commonPlatforms,
          );

          connections.push({
            contact1Id: contact1.osot_table_contactid as string,
            contact2Id: contact2.osot_table_contactid as string,
            commonPlatforms,
            relationshipStrength,
          });
        }
      }
    }

    return connections.sort(
      (a, b) => b.relationshipStrength - a.relationshipStrength,
    );
  }

  /**
   * Calculate relationship strength between two contacts
   * @private
   */
  private calculateRelationshipStrength(
    contact1: Record<string, unknown>,
    contact2: Record<string, unknown>,
    commonPlatforms: string[],
  ): number {
    let strength = commonPlatforms.length * 10; // Base score for common platforms

    // Bonus for similar job titles
    const job1 = (contact1.osot_job_title as string)?.toLowerCase() || '';
    const job2 = (contact2.osot_job_title as string)?.toLowerCase() || '';
    if (job1 && job2) {
      const commonWords = job1
        .split(' ')
        .filter((word) => job2.includes(word) && word.length > 3);
      strength += commonWords.length * 5;
    }

    // Bonus for LinkedIn connection (professional network)
    if (commonPlatforms.includes('linkedin')) {
      strength += 15;
    }

    return Math.min(strength, 100); // Cap at 100
  }

  /**
   * Generate networking opportunities based on contact analysis
   * @private
   */
  private generateNetworkingOpportunities(
    contacts: Record<string, unknown>[],
  ): Array<{
    contactId: string;
    opportunity: string;
    potentialValue: number;
  }> {
    const opportunities: Array<{
      contactId: string;
      opportunity: string;
      potentialValue: number;
    }> = [];

    contacts.forEach((contact) => {
      const contactId = contact.osot_table_contactid as string;
      const jobTitle = contact.osot_job_title as string;

      // High-value contacts (executives, directors, managers)
      if (
        jobTitle &&
        (jobTitle.toLowerCase().includes('ceo') ||
          jobTitle.toLowerCase().includes('director') ||
          jobTitle.toLowerCase().includes('vp') ||
          jobTitle.toLowerCase().includes('president'))
      ) {
        opportunities.push({
          contactId,
          opportunity:
            'High-level executive connection - strategic partnership potential',
          potentialValue: 90,
        });
      }

      // Contacts with complete social media profiles
      const socialPlatforms = [
        'facebook',
        'instagram',
        'linkedin',
        'tiktok',
      ].filter((platform) => contact[`osot_${platform}`]);

      if (socialPlatforms.length >= 3) {
        opportunities.push({
          contactId,
          opportunity: 'Strong social media presence - influencer potential',
          potentialValue: 70,
        });
      }

      // Contacts in technology/innovation roles
      if (
        jobTitle &&
        (jobTitle.toLowerCase().includes('innovation') ||
          jobTitle.toLowerCase().includes('technology') ||
          jobTitle.toLowerCase().includes('digital') ||
          jobTitle.toLowerCase().includes('ai') ||
          jobTitle.toLowerCase().includes('data'))
      ) {
        opportunities.push({
          contactId,
          opportunity: 'Technology innovator - collaboration opportunities',
          potentialValue: 80,
        });
      }
    });

    return opportunities.sort((a, b) => b.potentialValue - a.potentialValue);
  }

  /**
   * Map ContactInternal to Dataverse payload format
   * Handles special fields like @odata.bind relationships
   */
  private mapInternalToDataverse(
    internal: Partial<ContactInternal>,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    // Account relationship (required for creation) - handle @odata.bind directly
    const internalWithBinding = internal as Partial<ContactInternal> & {
      'osot_Table_Account@odata.bind'?: string;
    };
    const odataBinding = internalWithBinding['osot_Table_Account@odata.bind'];
    if (
      odataBinding &&
      typeof odataBinding === 'string' &&
      odataBinding.trim() !== ''
    ) {
      // ✅ CORRECTION: Use uppercase 'Table' for Dataverse compatibility
      payload['osot_Table_Account@odata.bind'] = odataBinding;
    }

    // Map all available fields using correct property names
    if (internal.osot_user_business_id !== undefined) {
      payload.osot_user_business_id = internal.osot_user_business_id;
    }
    if (internal.osot_secondary_email !== undefined) {
      payload.osot_secondary_email = internal.osot_secondary_email;
    }
    if (internal.osot_job_title !== undefined) {
      payload.osot_job_title = internal.osot_job_title;
    }
    if (internal.osot_home_phone !== undefined) {
      payload.osot_home_phone = internal.osot_home_phone;
    }
    if (internal.osot_work_phone !== undefined) {
      payload.osot_work_phone = internal.osot_work_phone;
    }
    if (internal.osot_business_website !== undefined) {
      payload.osot_business_website = internal.osot_business_website;
    }
    if (internal.osot_facebook !== undefined) {
      payload.osot_facebook = internal.osot_facebook;
    }
    if (internal.osot_instagram !== undefined) {
      payload.osot_instagram = internal.osot_instagram;
    }
    if (internal.osot_tiktok !== undefined) {
      payload.osot_tiktok = internal.osot_tiktok;
    }
    if (internal.osot_linkedin !== undefined) {
      payload.osot_linkedin = internal.osot_linkedin;
    }
    if (internal.osot_access_modifiers !== undefined) {
      payload.osot_access_modifiers = internal.osot_access_modifiers;
    }
    if (internal.osot_privilege !== undefined) {
      payload.osot_privilege = internal.osot_privilege;
    }

    return payload;
  }
}

// Dependency Injection Token
export const CONTACT_REPOSITORY = 'CONTACT_REPOSITORY';

// Export interface for type safety
export { ContactRepository } from '../interfaces/contact-repository.interface';
