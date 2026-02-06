/**
 * Repository interface for Audience Target operations.
 *
 * Defines all database operations for the Audience Target entity.
 * Implementations must handle conversion between internal and Dataverse formats.
 */

import { AudienceTargetInternal } from './audience-target-internal.interface';

export interface IAudienceTargetRepository {
  /**
   * Create a new audience target
   * @param target - Target data in internal format
   * @returns Created target with system-generated fields
   */
  create(
    target: Partial<AudienceTargetInternal>,
  ): Promise<AudienceTargetInternal>;

  /**
   * Find audience target by its ID (osot_target)
   * @param targetId - Business ID (e.g., "osot-tgt-0000001")
   * @returns Target or null if not found
   */
  findById(targetId: string): Promise<AudienceTargetInternal | null>;

  /**
   * Find audience target by GUID (osot_table_audience_targetid)
   * @param guid - Dataverse GUID
   * @returns Target or null if not found
   */
  findByGuid(guid: string): Promise<AudienceTargetInternal | null>;

  /**
   * Find audience target by product ID
   * CRITICAL: Used to enforce one-to-one relationship (one target per product)
   * @param productId - Product GUID
   * @param app - Application context ('admin' or 'main', defaults to 'main')
   * @returns Target or null if product has no target yet
   */
  findByProductId(
    productId: string,
    app?: 'admin' | 'main',
  ): Promise<AudienceTargetInternal | null>;

  /**
   * Count audience targets for a product
   * Used for diagnostics and validation
   * @param productId - Product GUID
   * @returns Number of targets associated with product
   */
  countByProductId(productId: string): Promise<number>;

  /**
   * Find all audience targets with optional filtering
   * @param options - Query options (filter, pagination, etc.)
   * @returns Array of targets
   */
  findAll(options?: {
    filter?: string;
    orderBy?: string;
    top?: number;
    skip?: number;
    select?: string;
    expand?: string;
  }): Promise<AudienceTargetInternal[]>;

  /**
   * Update an existing audience target
   * @param targetId - Business ID or GUID
   * @param updates - Partial updates (fields to change)
   * @returns Updated target
   */
  update(
    targetId: string,
    updates: Partial<AudienceTargetInternal>,
  ): Promise<AudienceTargetInternal>;

  /**
   * Delete an audience target
   * @param targetId - Business ID or GUID
   * @returns True if deleted, false if not found
   */
  delete(targetId: string): Promise<boolean>;

  /**
   * Check if an audience target exists
   * @param targetId - Business ID or GUID
   * @returns True if exists
   */
  exists(targetId: string): Promise<boolean>;

  /**
   * Find products matching a user's profile
   * Core matching logic for dashboard product filtering
   * @param userData - User profile data from multiple entities
   * @param options - Pagination and filtering options
   * @returns Array of product IDs that match the user's profile
   */
  findMatchingProducts(
    userData: {
      accountGroup?: number;
      affiliateArea?: number[];
      affiliateCity?: number;
      affiliateProvince?: number;
      membershipCity?: number;
      province?: number;
      gender?: number;
      indigenousDetails?: number;
      language?: number[];
      race?: number;
      eligibilityAffiliate?: number;
      membershipCategory?: number;
      earnings?: number;
      earningsSelfDirect?: number;
      earningsSelfIndirect?: number;
      employmentBenefits?: number[];
      employmentStatus?: number;
      positionFunding?: number[];
      practiceYears?: number;
      roleDescription?: number[];
      workHours?: number;
      clientAge?: number[];
      practiceArea?: number[];
      practiceServices?: number[];
      practiceSettings?: number[];
      membershipSearchTools?: number[];
      practicePromotion?: number[];
      psychotherapySupervision?: number;
      thirdParties?: number[];
      cotoStatus?: number;
      otGradYear?: number;
      otUniversity?: number;
      otaGradYear?: number;
      otaCollege?: number;
    },
    options?: {
      page?: number;
      limit?: number;
      cacheKey?: string;
    },
  ): Promise<{
    productIds: string[];
    totalCount: number;
    page: number;
    limit: number;
  }>;

  /**
   * Batch operations for bulk create/update
   * Useful for initial data seeding or bulk administration
   */
  createBatch(
    targets: Partial<AudienceTargetInternal>[],
  ): Promise<AudienceTargetInternal[]>;

  /**
   * Get total count of audience targets
   * @returns Total number of targets in database
   */
  count(): Promise<number>;
}

/**
 * Usage notes:
 *
 * - findByProductId is CRITICAL for enforcing one-to-one relationship
 * - findMatchingProducts implements the core user-to-product matching logic
 * - All methods should use Redis caching for performance
 * - Batch operations should be used sparingly (admin only)
 * - Repository handles all Dataverse ↔ Internal conversions
 *
 * @example Enforce one-to-one relationship:
 * ```ts
 * const existing = await repository.findByProductId(productId);
 * if (existing) {
 *   throw new Error('Product already has audience target');
 * }
 * ```
 *
 * @example Find matching products for user:
 * ```ts
 * const result = await repository.findMatchingProducts({
 *   accountGroup: 1, // OT
 *   province: 1, // Ontario
 *   language: [13, 18], // English + French
 * }, {
 *   page: 1,
 *   limit: 20,
 * });
 * // Returns first 20 product IDs that match user's profile
 * ```
 */

/**
 * Injection token for Audience Target Repository
 * Used for dependency injection in NestJS modules
 */
export const AUDIENCE_TARGET_REPOSITORY = 'AUDIENCE_TARGET_REPOSITORY' as const;
