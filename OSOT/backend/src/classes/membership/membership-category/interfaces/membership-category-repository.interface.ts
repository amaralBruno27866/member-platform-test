import { MembershipCategoryDataverse } from './membership-category-dataverse.interface';

/**
 * Repository interface for Membership Category data access operations.
 * Defines the contract for all database interactions and CRUD operations.
 */
export interface MembershipCategoryRepository {
  /**
   * Create a new membership category record
   */
  create(
    categoryData: Omit<
      MembershipCategoryDataverse,
      | 'osot_table_membership_categoryid'
      | 'osot_category_id'
      | 'createdon'
      | 'modifiedon'
      | 'ownerid'
    >,
  ): Promise<MembershipCategoryDataverse>;

  /**
   * Find membership category by ID
   */
  findById(id: string): Promise<MembershipCategoryDataverse | null>;

  /**
   * Find membership category by Category ID (business ID)
   */
  findByCategoryId(
    categoryId: string,
  ): Promise<MembershipCategoryDataverse | null>;

  /**
   * Find membership categories by user (Account or Affiliate)
   */
  findByUser(
    userId: string,
    userType: 'account' | 'affiliate',
  ): Promise<MembershipCategoryDataverse[]>;

  /**
   * Find membership categories by membership year
   */
  findByMembershipYear(year: number): Promise<MembershipCategoryDataverse[]>;

  /**
   * Find membership categories by category
   */
  findByCategory(category: number): Promise<MembershipCategoryDataverse[]>;

  /**
   * Find membership categories by Users Group
   */
  findByUsersGroup(usersGroup: number): Promise<MembershipCategoryDataverse[]>;

  /**
   * Find membership categories with complex filters
   */
  findWithFilters(
    filters: MembershipCategoryFilters,
  ): Promise<RepositoryQueryResult<MembershipCategoryDataverse>>;

  /**
   * Update an existing membership category
   */
  update(
    id: string,
    updateData: Partial<MembershipCategoryDataverse>,
  ): Promise<MembershipCategoryDataverse>;

  /**
   * Delete a membership category (soft delete)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Hard delete a membership category (permanent)
   */
  hardDelete(id: string): Promise<boolean>;

  /**
   * Get membership categories with pagination
   */
  findPaginated(
    options: PaginationOptions,
  ): Promise<PaginatedResult<MembershipCategoryDataverse>>;

  /**
   * Count total membership categories
   */
  count(filters?: MembershipCategoryFilters): Promise<number>;

  /**
   * Check if membership category exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Bulk operations
   */
  bulkCreate(
    categories: Array<
      Omit<
        MembershipCategoryDataverse,
        | 'osot_table_membership_categoryid'
        | 'osot_category_id'
        | 'createdon'
        | 'modifiedon'
        | 'ownerid'
      >
    >,
  ): Promise<MembershipCategoryDataverse[]>;
  bulkUpdate(
    updates: Array<{ id: string; data: Partial<MembershipCategoryDataverse> }>,
  ): Promise<MembershipCategoryDataverse[]>;
  bulkDelete(ids: string[]): Promise<boolean>;
}

/**
 * Filter options for membership category queries
 */
export interface MembershipCategoryFilters {
  // User filters
  userId?: string;
  userType?: 'account' | 'affiliate';

  // Membership filters
  membershipYear?: number;
  membershipYears?: number[];
  category?: number;
  categories?: number[];
  usersGroup?: number; // Filter by Users Group
  usersGroups?: number[]; // Filter by multiple Users Groups

  // Eligibility filters
  eligibility?: number;
  eligibilityAffiliate?: number;

  // Date filters
  createdAfter?: Date;
  createdBefore?: Date;
  modifiedAfter?: Date;
  modifiedBefore?: Date;

  // Special status filters
  hasParentalLeave?: boolean;
  isRetired?: boolean;
  declarationStatus?: boolean;

  // Access control filters
  privilege?: number;
  accessModifier?: number;
  ownerId?: string;

  // System filters
  isActive?: boolean;
  includeDeleted?: boolean;
}

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: MembershipCategoryFilters;
}

/**
 * Paginated query result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Repository query result with metadata
 */
export interface RepositoryQueryResult<T> {
  data: T[];
  metadata: {
    totalCount: number;
    filteredCount: number;
    executionTime: number;
    cacheHit?: boolean;
  };
}

/**
 * Repository configuration options
 */
export interface RepositoryConfig {
  // Connection settings
  connectionString?: string;
  timeout?: number;
  retryAttempts?: number;

  // Caching settings
  enableCaching?: boolean;
  cacheTimeout?: number;
  cacheKeyPrefix?: string;

  // Performance settings
  enableOptimizations?: boolean;
  batchSize?: number;
  maxConcurrentQueries?: number;

  // Logging and monitoring
  enableQueryLogging?: boolean;
  enablePerformanceTracking?: boolean;
  enableErrorTracking?: boolean;
}

/**
 * Default repository configuration
 */
export const DEFAULT_REPOSITORY_CONFIG: RepositoryConfig = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  enableCaching: true,
  cacheTimeout: 300, // 5 minutes
  cacheKeyPrefix: 'membership-category:',
  enableOptimizations: true,
  batchSize: 100,
  maxConcurrentQueries: 5,
  enableQueryLogging: true,
  enablePerformanceTracking: true,
  enableErrorTracking: true,
};
