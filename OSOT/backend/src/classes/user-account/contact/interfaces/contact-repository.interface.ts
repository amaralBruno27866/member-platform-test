import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { ListContactsQueryDto } from '../dtos/list-contacts.query.dto';
import { ContactInternal } from './contact-internal.interface';

/**
 * Contact Repository Interface
 *
 * Defines the contract for contact data access operations following the Repository Pattern.
 * This interface abstracts data access operations and provides a clean contract for
 * dependency injection across the contact module.
 *
 * ENTERPRISE FEATURES:
 * - Repository Pattern: Clean data access abstraction
 * - Dependency Injection: Injectable via CONTACT_REPOSITORY token
 * - Type Safety: Full TypeScript support for all operations
 * - CRUD Operations: Complete Create, Read, Update, Delete functionality
 * - Advanced Queries: Business logic and social media search capabilities
 * - Pagination Support: Efficient data retrieval with limit/offset
 * - Statistics: Contact analytics and reporting functionality
 *
 * BUSINESS OPERATIONS:
 * - Account-based Contact Management: Multi-tenant contact organization
 * - Business ID Lookups: Integration with external business systems
 * - Job Title Searches: Professional contact categorization
 * - Social Media Integration: Platform-specific contact discovery
 * - Access Control: Permission-based data access with privileges
 *
 * @interface ContactRepository
 * @follows Repository Pattern, Dependency Injection
 * @author OSOT Development Team
 * @version 2.0.0 - Enterprise Interface Standard
 */
export interface ContactRepository {
  /**
   * Create a new contact record
   *
   * @param payload - Contact data following ContactInternal interface
   * @returns Promise<ContactInternal> - Created contact with generated GUID
   * @throws {ValidationError} When payload fails schema validation
   * @throws {DuplicateError} When contact already exists for account
   */
  create(payload: Partial<ContactInternal>): Promise<ContactInternal>;

  /**
   * Find contact by GUID identifier
   *
   * @param guid - Contact GUID in Dataverse format
   * @returns Promise<Record<string, unknown> | undefined> - Contact data or undefined if not found
   * @throws {ValidationError} When GUID format is invalid
   */
  findByGuid(guid: string): Promise<Record<string, unknown> | undefined>;

  /**
   * Update contact by GUID with new data
   *
   * @param guid - Contact GUID to update
   * @param payload - Partial contact data for update
   * @returns Promise<void> - Operation completion
   * @throws {NotFoundError} When contact GUID doesn't exist
   * @throws {ValidationError} When payload fails validation
   */
  updateByGuid(guid: string, payload: Record<string, unknown>): Promise<void>;

  /**
   * Delete contact by GUID
   *
   * @param guid - Contact GUID to delete
   * @returns Promise<void> - Operation completion
   * @throws {NotFoundError} When contact GUID doesn't exist
   */
  deleteByGuid(guid: string): Promise<void>;

  /**
   * Find all contacts associated with an account
   *
   * @param accountId - Account identifier (business ID or GUID)
   * @param query - Optional pagination and filtering parameters
   * @returns Promise<Record<string, unknown>[]> - Array of contacts for the account
   * @throws {ValidationError} When accountId format is invalid
   */
  findByAccountId(
    accountId: string,
    query?: ListContactsQueryDto,
  ): Promise<Record<string, unknown>[]>;

  /**
   * Find contact by business ID directly (osot_contact_id)
   *
   * @param businessId - Contact business identifier (e.g., osot-ct-0000001)
   * @returns Promise<Record<string, unknown> | undefined> - Contact data or undefined
   * @throws {ValidationError} When business ID is invalid
   */
  findByBusinessId(
    businessId: string,
  ): Promise<Record<string, unknown> | undefined>;

  /**
   * Find contacts by user business ID directly (no account navigation)
   * More reliable than OData navigation for business ID lookups
   *
   * @param userBusinessId - User business ID to search for
   * @returns Promise<Record<string, unknown>[]> - Contacts matching business ID
   * @throws {ValidationError} When business ID format is invalid
   */
  findByUserBusinessId(
    userBusinessId: string,
  ): Promise<Record<string, unknown>[]>;

  /**
   * Find contacts by job title pattern within an account
   *
   * @param accountId - Account identifier
   * @param jobTitlePattern - Job title search pattern (supports wildcards)
   * @returns Promise<Record<string, unknown>[]> - Contacts matching job title
   * @throws {ValidationError} When parameters are invalid
   */
  findByJobTitle(
    accountId: string,
    jobTitlePattern: string,
  ): Promise<Record<string, unknown>[]>;

  /**
   * Find contacts by social media platform presence
   *
   * @param accountId - Account identifier
   * @param platform - Social media platform identifier
   * @returns Promise<Record<string, unknown>[]> - Contacts with platform presence
   * @throws {ValidationError} When platform is unsupported
   */
  findBySocialMedia(
    accountId: string,
    platform: 'facebook' | 'instagram' | 'tiktok' | 'linkedin',
  ): Promise<Record<string, unknown>[]>;

  /**
   * Advanced multi-criteria contact search
   *
   * @param criteria - Search criteria with multiple filters and pagination
   * @returns Promise<SearchResult> - Paginated search results with metadata
   * @throws {ValidationError} When search criteria are invalid
   */
  search(criteria: {
    accountId?: string;
    businessId?: string;
    jobTitle?: string;
    email?: string;
    socialMedia?: {
      platform?: 'facebook' | 'instagram' | 'tiktok' | 'linkedin';
      hasProfile?: boolean;
    };
    accessModifier?: AccessModifier;
    privilege?: Privilege;
    limit?: number;
    offset?: number;
  }): Promise<{
    results: Record<string, unknown>[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Get contact statistics for an account (EXISTING IMPLEMENTATION)
   *
   * @param accountId - Account identifier for statistics
   * @returns Promise<ContactStatistics> - Statistical summary matching existing implementation
   * @throws {ValidationError} When accountId is invalid
   */
  getContactStatistics(accountId: string): Promise<{
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
  }>;

  /**
   * Check if business ID exists within account (avoid duplicates)
   *
   * @param accountId - Account identifier
   * @param businessId - Business ID to check
   * @param excludeContactId - Optional contact ID to exclude from check
   * @returns Promise<boolean> - True if business ID exists
   * @throws {ValidationError} When identifiers are invalid
   */
  businessIdExists(
    accountId: string,
    businessId: string,
    excludeContactId?: string,
  ): Promise<boolean>;

  /**
   * Analyze professional network within account
   *
   * @param accountId - Account identifier
   * @returns Promise<NetworkAnalysis> - Professional network insights
   * @throws {ValidationError} When accountId is invalid
   */
  analyzeProfessionalNetwork(accountId: string): Promise<{
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
  }>;
}

/**
 * Dependency Injection Token for ContactRepository
 *
 * Use this token to inject the ContactRepository implementation:
 * ```typescript
 * constructor(
 *   @Inject(CONTACT_REPOSITORY)
 *   private readonly contactRepository: ContactRepository
 * ) {}
 * ```
 */
export const CONTACT_REPOSITORY = 'CONTACT_REPOSITORY';
