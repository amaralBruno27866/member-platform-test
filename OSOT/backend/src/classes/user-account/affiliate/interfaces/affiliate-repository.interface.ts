/**
 * Interface for Affiliate repository operations.
 * Defines the contract for data access layer operations.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - integrations: Uses DataverseService for data operations
 * - errors: Returns structured error handling
 * - interfaces: Works with AffiliateInternal and AffiliateDataverse
 * - constants: Uses AFFILIATE_* constants for validation and queries
 *
 * BUSINESS CONTEXT:
 * - Affiliates are partner organizations with OSOT
 * - Each affiliate has a representative (contact person)
 * - Supports complex queries for business intelligence
 * - Includes area-based and status-based filtering
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations for affiliate management
 * - Business-specific query patterns for OSOT needs
 * - Optimized for common affiliate operations
 * - Focus on reliable data access patterns
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

import { AffiliateInternal } from './affiliate-internal.interface';
import {
  AffiliateDataverse,
  AffiliateDataverseQuery,
} from './affiliate-dataverse.interface';
import {
  AffiliateArea,
  AccountStatus,
  Province,
  Country,
} from '../../../../common/enums';

export interface AffiliateRepository {
  // ========================================
  // CORE CRUD OPERATIONS
  // ========================================

  /**
   * Create a new affiliate record
   * @param affiliateData - Partial affiliate data for creation
   * @returns Promise<AffiliateInternal> - Created affiliate with system-generated fields
   */
  create(affiliateData: Partial<AffiliateInternal>): Promise<AffiliateInternal>;

  /**
   * Find affiliate by internal table ID
   * @param affiliateId - Internal GUID identifier
   * @returns Promise<AffiliateInternal | null> - Affiliate or null if not found
   */
  findById(affiliateId: string): Promise<AffiliateInternal | null>;

  /**
   * Find affiliate by business ID (public identifier)
   * @param businessId - Public business ID (e.g., affi-0000001)
   * @returns Promise<AffiliateInternal | null> - Affiliate or null if not found
   */
  findByBusinessId(businessId: string): Promise<AffiliateInternal | null>;

  /**
   * Find affiliate by email address
   * @param email - Affiliate email address
   * @param organizationGuid - Optional organization GUID for multi-tenant isolation
   * @returns Promise<AffiliateInternal | null> - Affiliate or null if not found
   */
  findByEmail(
    email: string,
    organizationGuid?: string,
  ): Promise<AffiliateInternal | null>;

  /**
   * Update affiliate by ID
   * @param affiliateId - Internal GUID identifier
   * @param updateData - Partial affiliate data for update
   * @returns Promise<AffiliateInternal> - Updated affiliate
   */
  update(
    affiliateId: string,
    updateData: Partial<AffiliateInternal>,
  ): Promise<AffiliateInternal>;

  /**
   * Delete affiliate by ID (soft delete - update status)
   * @param affiliateId - Internal GUID identifier
   * @returns Promise<boolean> - Success status
   */
  delete(affiliateId: string): Promise<boolean>;

  /**
   * Check if affiliate exists by ID
   * @param affiliateId - Internal GUID identifier
   * @returns Promise<boolean> - Existence status
   */
  exists(affiliateId: string): Promise<boolean>;

  // ========================================
  // BUSINESS-SPECIFIC QUERIES
  // ========================================

  /**
   * Find affiliates by business area
   * @param area - Affiliate business area
   * @param limit - Optional result limit
   * @returns Promise<AffiliateInternal[]> - Array of affiliates
   */
  findByArea(area: AffiliateArea, limit?: number): Promise<AffiliateInternal[]>;

  /**
   * Find affiliates by account status
   * @param status - Account status filter
   * @param limit - Optional result limit
   * @returns Promise<AffiliateInternal[]> - Array of affiliates
   */
  findByStatus(
    status: AccountStatus,
    limit?: number,
  ): Promise<AffiliateInternal[]>;

  /**
   * Find active affiliates (active_member = true)
   * @param limit - Optional result limit
   * @returns Promise<AffiliateInternal[]> - Array of active affiliates
   */
  findActiveAffiliates(limit?: number): Promise<AffiliateInternal[]>;

  /**
   * Find affiliates by province/region
   * @param province - Province filter
   * @param limit - Optional result limit
   * @returns Promise<AffiliateInternal[]> - Array of affiliates
   */
  findByProvince(
    province: Province,
    limit?: number,
  ): Promise<AffiliateInternal[]>;

  /**
   * Find affiliates by country
   * @param country - Country filter
   * @param limit - Optional result limit
   * @returns Promise<AffiliateInternal[]> - Array of affiliates
   */
  findByCountry(country: Country, limit?: number): Promise<AffiliateInternal[]>;

  // ========================================
  // SEARCH & FILTERING
  // ========================================

  /**
   * Search affiliates by name (partial match)
   * @param searchTerm - Search term for affiliate name
   * @param limit - Optional result limit
   * @returns Promise<AffiliateInternal[]> - Array of matching affiliates
   */
  searchByName(
    searchTerm: string,
    limit?: number,
  ): Promise<AffiliateInternal[]>;

  /**
   * Search affiliates by representative name
   * @param searchTerm - Search term for representative name
   * @param limit - Optional result limit
   * @returns Promise<AffiliateInternal[]> - Array of matching affiliates
   */
  searchByRepresentative(
    searchTerm: string,
    limit?: number,
  ): Promise<AffiliateInternal[]>;

  /**
   * Advanced search with multiple filters
   * @param filters - Object containing search filters
   * @param limit - Optional result limit
   * @returns Promise<AffiliateInternal[]> - Array of matching affiliates
   */
  advancedSearch(
    filters: {
      name?: string;
      area?: AffiliateArea;
      status?: AccountStatus;
      province?: Province;
      country?: Country;
      activeOnly?: boolean;
    },
    limit?: number,
  ): Promise<AffiliateInternal[]>;

  // ========================================
  // AUTHENTICATION & VALIDATION
  // ========================================

  /**
   * Validate affiliate credentials for login
   * @param email - Affiliate email
   * @param password - Plain text password
   * @returns Promise<AffiliateInternal | null> - Affiliate if valid, null if invalid
   */
  validateCredentials(
    email: string,
    password: string,
  ): Promise<AffiliateInternal | null>;

  /**
   * Check if email is already registered
   * @param email - Email to check
   * @param excludeId - Optional ID to exclude from check (for updates)
   * @returns Promise<boolean> - True if email exists
   */
  emailExists(email: string, excludeId?: string): Promise<boolean>;

  /**
   * Update affiliate password
   * @param affiliateId - Internal GUID identifier
   * @param hashedPassword - New hashed password
   * @returns Promise<boolean> - Success status
   */
  updatePassword(affiliateId: string, hashedPassword: string): Promise<boolean>;

  // ========================================
  // ANALYTICS & REPORTING
  // ========================================

  /**
   * Count affiliates by area
   * @returns Promise<Record<AffiliateArea, number>> - Count per area
   */
  countByArea(): Promise<Record<AffiliateArea, number>>;

  /**
   * Count affiliates by status
   * @returns Promise<Record<AccountStatus, number>> - Count per status
   */
  countByStatus(): Promise<Record<AccountStatus, number>>;

  /**
   * Count affiliates by province
   * @param country - Optional country filter
   * @returns Promise<Record<Province, number>> - Count per province
   */
  countByProvince(country?: Country): Promise<Record<Province, number>>;

  /**
   * Get total affiliate count
   * @param activeOnly - Count only active affiliates
   * @returns Promise<number> - Total count
   */
  getTotalCount(activeOnly?: boolean): Promise<number>;

  /**
   * Get recently created affiliates
   * @param days - Number of days to look back
   * @param limit - Optional result limit
   * @returns Promise<AffiliateInternal[]> - Array of recent affiliates
   */
  getRecentlyCreated(
    days: number,
    limit?: number,
  ): Promise<AffiliateInternal[]>;

  // ========================================
  // ADVANCED OPERATIONS
  // ========================================

  /**
   * Bulk update affiliate status
   * @param affiliateIds - Array of affiliate IDs
   * @param newStatus - New status to apply
   * @returns Promise<number> - Number of records updated
   */
  bulkUpdateStatus(
    affiliateIds: string[],
    newStatus: AccountStatus,
  ): Promise<number>;

  /**
   * Raw Dataverse query for complex scenarios
   * @param query - OData query parameters
   * @returns Promise<AffiliateDataverse[]> - Raw Dataverse response
   */
  queryRaw(query: AffiliateDataverseQuery): Promise<AffiliateDataverse[]>;

  /**
   * Execute custom OData query string
   * @param oDataQuery - Full OData query string
   * @returns Promise<AffiliateDataverse[]> - Raw query results
   */
  executeQuery(oDataQuery: string): Promise<AffiliateDataverse[]>;

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  /**
   * Batch create multiple affiliates
   * @param affiliatesData - Array of affiliate data
   * @returns Promise<AffiliateInternal[]> - Array of created affiliates
   */
  batchCreate(
    affiliatesData: Partial<AffiliateInternal>[],
  ): Promise<AffiliateInternal[]>;

  /**
   * Batch update multiple affiliates
   * @param updates - Array of update operations
   * @returns Promise<AffiliateInternal[]> - Array of updated affiliates
   */
  batchUpdate(
    updates: Array<{
      id: string;
      data: Partial<AffiliateInternal>;
    }>,
  ): Promise<AffiliateInternal[]>;

  // ========================================
  // RELATIONSHIP OPERATIONS
  // ========================================

  /**
   * Find affiliates by owner/user
   * @param ownerId - Owner/user GUID
   * @returns Promise<AffiliateInternal[]> - Array of owned affiliates
   */
  findByOwner(ownerId: string): Promise<AffiliateInternal[]>;

  /**
   * Transfer affiliate ownership
   * @param affiliateId - Affiliate ID
   * @param newOwnerId - New owner GUID
   * @returns Promise<boolean> - Success status
   */
  transferOwnership(affiliateId: string, newOwnerId: string): Promise<boolean>;
}

/**
 * Injection token for AffiliateRepository
 */
export const AFFILIATE_REPOSITORY = 'AFFILIATE_REPOSITORY' as const;
