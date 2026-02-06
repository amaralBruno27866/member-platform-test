/**
 * Interface for Membership Employment repository operations.
 * Defines the contract for data access layer operations.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - integrations: Uses DataverseService for data operations
 * - errors: Returns structured error handling
 * - interfaces: Works with MembershipEmploymentInternal and MembershipEmploymentDataverse
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT membership employment management needs
 * - No complex aggregations or analytics
 * - Focus on reliable data access patterns for employment data management
 *
 * CRITICAL BUSINESS RULES:
 * - One employment record per user per year
 * - membership_year is system-defined from membership-settings
 * - Account and Affiliate are mutually exclusive (XOR)
 */

import { MembershipEmploymentInternal } from './membership-employment-internal.interface';

export interface MembershipEmploymentRepository {
  /**
   * Create a new membership employment record
   * CRITICAL: membership_year must be resolved from membership-settings before calling
   */
  create(
    employmentData: Partial<MembershipEmploymentInternal>,
  ): Promise<MembershipEmploymentInternal>;

  /**
   * Find membership employment by Employment ID (business ID)
   */
  findByEmploymentId(
    employmentId: string,
  ): Promise<MembershipEmploymentInternal | null>;

  /**
   * Find membership employment by GUID
   */
  findById(id: string): Promise<MembershipEmploymentInternal | null>;

  /**
   * Find membership employments by membership year
   */
  findByYear(year: string): Promise<MembershipEmploymentInternal[]>;

  /**
   * Find membership employments by account lookup
   */
  findByAccountId(accountId: string): Promise<MembershipEmploymentInternal[]>;

  /**
   * Find membership employments by affiliate lookup
   */
  findByAffiliateId(
    affiliateId: string,
  ): Promise<MembershipEmploymentInternal[]>;

  /**
   * Find membership employment by user (account or affiliate) and year
   * Business rule: one employment record per user per year
   * CRITICAL: Used to enforce uniqueness constraint
   */
  findByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
  ): Promise<MembershipEmploymentInternal | null>;

  /**
   * Update membership employment by Employment ID
   * CRITICAL: membership_year CANNOT be updated (immutable after creation)
   */
  update(
    employmentId: string,
    updateData: Partial<MembershipEmploymentInternal>,
  ): Promise<MembershipEmploymentInternal>;

  /**
   * Update membership employment by GUID
   * CRITICAL: membership_year CANNOT be updated (immutable after creation)
   */
  updateById(
    id: string,
    updateData: Partial<MembershipEmploymentInternal>,
  ): Promise<MembershipEmploymentInternal>;

  /**
   * Delete membership employment by Employment ID
   */
  delete(employmentId: string): Promise<void>;

  /**
   * Delete membership employment by GUID
   */
  deleteById(id: string): Promise<void>;

  /**
   * List all membership employments with optional filters
   */
  findAll(filters?: {
    year?: string;
    accountId?: string;
    affiliateId?: string;
    skip?: number;
    top?: number;
  }): Promise<MembershipEmploymentInternal[]>;

  /**
   * Count membership employments with optional filters
   */
  count(filters?: {
    year?: string;
    accountId?: string;
    affiliateId?: string;
  }): Promise<number>;

  /**
   * Check if user already has employment record for given year
   * Returns true if record exists, false otherwise
   * Used for duplicate prevention
   */
  existsByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
  ): Promise<boolean>;
}
