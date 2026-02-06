import {
  OrganizationInternal,
  CreateOrganizationInternal,
  UpdateOrganizationInternal,
} from './organization-internal.interface';

/**
 * Repository interface for Organization entity
 * Defines contract for data access operations
 *
 * Repository pattern separates data access logic from business logic.
 * Implementations handle Dataverse-specific operations (OData queries, error handling).
 */
export interface IOrganizationRepository {
  // ========================================
  // CREATE OPERATIONS
  // ========================================

  /**
   * Create a new organization
   *
   * @param data - Organization data (excludes system-generated fields)
   * @returns Promise resolving to created organization with all fields
   * @throws Error if creation fails or slug is not unique
   *
   * Business rules enforced:
   * - Slug must be unique across all organizations
   * - Slug must match pattern: ^[a-z0-9-]+$
   * - Slug cannot be a reserved keyword
   */
  create(data: CreateOrganizationInternal): Promise<OrganizationInternal>;

  // ========================================
  // READ OPERATIONS
  // ========================================

  /**
   * Find organization by GUID (primary key)
   *
   * @param id - Organization GUID (osot_table_organizationid)
   * @returns Promise resolving to organization or null if not found
   */
  findById(id: string): Promise<OrganizationInternal | null>;

  /**
   * Find organization by slug (unique text identifier)
   * Used for white-label login: /login/{slug}
   *
   * @param slug - Organization slug (lowercase, unique)
   * @returns Promise resolving to organization or null if not found
   *
   * Note: This is a public operation, returns only safe fields
   */
  findBySlug(slug: string): Promise<OrganizationInternal | null>;

  /**
   * Find organization by business ID (autonumber)
   *
   * @param organizationId - Organization business ID (osot-org-0000001)
   * @returns Promise resolving to organization or null if not found
   */
  findByOrganizationId(
    organizationId: string,
  ): Promise<OrganizationInternal | null>;

  /**
   * Find all organizations with pagination
   *
   * @param options - Query options for filtering, pagination, sorting
   * @returns Promise resolving to array of organizations and total count
   *
   * Query options:
   * - page: Page number (default: 1)
   * - pageSize: Items per page (default: 20, max: 100)
   * - status: Filter by organization status (Active/Inactive/Pending)
   * - search: Search in name, legal_name, acronym, slug
   * - orderBy: Sort field (name, created_on, etc.)
   * - orderDirection: Sort direction (asc/desc)
   */
  findAll(options?: OrganizationQueryOptions): Promise<{
    data: OrganizationInternal[];
    total: number;
  }>;

  /**
   * Check if slug is unique (not already used)
   * Used during creation and validation
   *
   * @param slug - Slug to check
   * @param excludeId - Optional: Exclude this organization ID from check (for updates)
   * @returns Promise resolving to true if slug is available, false if taken
   */
  isSlugUnique(slug: string, excludeId?: string): Promise<boolean>;

  // ========================================
  // UPDATE OPERATIONS
  // ========================================

  /**
   * Update an existing organization
   *
   * @param id - Organization GUID
   * @param data - Partial organization data to update
   * @returns Promise resolving to updated organization
   * @throws Error if organization not found or update fails
   *
   * Business rules enforced:
   * - Slug cannot be changed after creation (immutable)
   * - Only updatable fields are modified
   */
  update(
    id: string,
    data: UpdateOrganizationInternal,
  ): Promise<OrganizationInternal>;

  // ========================================
  // DELETE OPERATIONS
  // ========================================

  /**
   * Delete an organization (soft delete - set status to Inactive)
   *
   * @param id - Organization GUID
   * @returns Promise resolving to true if deleted successfully
   * @throws Error if organization not found or has dependent records
   *
   * Business rules enforced:
   * - Cannot delete organization with active accounts/affiliates
   * - Soft delete: Sets status to Inactive instead of physical deletion
   */
  delete(id: string): Promise<boolean>;

  /**
   * Hard delete an organization (physical deletion)
   * USE WITH CAUTION: This permanently removes the record
   *
   * @param id - Organization GUID
   * @returns Promise resolving to true if deleted successfully
   * @throws Error if organization not found or has dependent records
   */
  hardDelete(id: string): Promise<boolean>;

  // ========================================
  // UTILITY OPERATIONS
  // ========================================

  /**
   * Count organizations by status
   *
   * @param status - Optional status filter (Active/Inactive/Pending)
   * @returns Promise resolving to count of organizations
   */
  count(options?: OrganizationQueryOptions): Promise<number>;

  /**
   * Check if organization exists by ID
   *
   * @param id - Organization GUID
   * @returns Promise resolving to true if exists, false otherwise
   */
  exists(id: string): Promise<boolean>;
}

/**
 * Query options for findAll operation
 */
export interface OrganizationQueryOptions {
  /**
   * Page number (1-based)
   * Default: 1
   */
  page?: number;

  /**
   * Items per page
   * Default: 20
   * Max: 100
   */
  pageSize?: number;

  /**
   * Filter by organization status
   * Values: 1=Active, 2=Inactive, 3=Pending
   */
  status?: number;

  /**
   * Search term (searches in name, legal_name, acronym, slug)
   */
  search?: string;

  /**
   * Filter by exact slug match
   */
  slug?: string;

  /**
   * Sort field
   * Options: 'name', 'created_on', 'modified_on', 'slug'
   * Default: 'name'
   */
  orderBy?: 'name' | 'created_on' | 'modified_on' | 'slug';

  /**
   * Sort direction
   * Default: 'asc'
   */
  orderDirection?: 'asc' | 'desc';

  /**
   * OData $skip value (alternative to page)
   */
  skip?: number;

  /**
   * OData $top value (alternative to pageSize)
   */
  top?: number;
}
