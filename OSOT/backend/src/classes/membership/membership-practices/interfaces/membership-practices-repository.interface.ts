/**
 * Interface for Membership Practices repository operations.
 * Defines the contract for data access layer operations.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - integrations: Uses DataverseService for data operations
 * - errors: Returns structured error handling
 * - interfaces: Works with MembershipPracticesInternal and MembershipPracticesDataverse
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT membership practice management needs
 * - No complex aggregations or analytics
 * - Focus on reliable data access patterns for practice data management
 *
 * CRITICAL BUSINESS RULES:
 * - One practice record per user per year
 * - membership_year is system-defined from membership-settings
 * - clients_age is business required (must have at least one value)
 */

import { MembershipPracticesInternal } from './membership-practices-internal.interface';

export interface MembershipPracticesRepository {
  /**
   * Create a new membership practice record
   * CRITICAL: membership_year must be resolved from membership-settings before calling
   */
  create(
    practiceData: Partial<MembershipPracticesInternal>,
  ): Promise<MembershipPracticesInternal>;

  /**
   * Find membership practice by Practice ID (business ID)
   */
  findByPracticeId(
    practiceId: string,
  ): Promise<MembershipPracticesInternal | null>;

  /**
   * Find membership practice by GUID
   */
  findById(id: string): Promise<MembershipPracticesInternal | null>;

  /**
   * Find membership practices by membership year
   */
  findByYear(year: string): Promise<MembershipPracticesInternal[]>;

  /**
   * Find membership practices by account lookup
   */
  findByAccountId(accountId: string): Promise<MembershipPracticesInternal[]>;

  /**
   * Find membership practice by user (account) and year
   * Business rule: one practice record per user per year
   * CRITICAL: Used to enforce uniqueness constraint
   */
  findByUserAndYear(
    userId: string,
    year: string,
  ): Promise<MembershipPracticesInternal | null>;

  /**
   * Update membership practice by Practice ID
   * CRITICAL: membership_year CANNOT be updated (immutable after creation)
   */
  update(
    practiceId: string,
    updateData: Partial<MembershipPracticesInternal>,
  ): Promise<MembershipPracticesInternal>;

  /**
   * Update membership practice by GUID
   * CRITICAL: membership_year CANNOT be updated (immutable after creation)
   */
  updateById(
    id: string,
    updateData: Partial<MembershipPracticesInternal>,
  ): Promise<MembershipPracticesInternal>;

  /**
   * Delete membership practice by Practice ID
   */
  delete(practiceId: string): Promise<void>;

  /**
   * Delete membership practice by GUID
   */
  deleteById(id: string): Promise<void>;

  /**
   * List all membership practices with optional filters
   */
  findAll(filters?: {
    year?: string;
    accountId?: string;
    skip?: number;
    top?: number;
  }): Promise<MembershipPracticesInternal[]>;

  /**
   * Count membership practices with optional filters
   */
  count(filters?: { year?: string; accountId?: string }): Promise<number>;

  /**
   * Check if user already has practice record for given year
   * Returns true if record exists, false otherwise
   * Used for duplicate prevention
   */
  existsByUserAndYear(userId: string, year: string): Promise<boolean>;
}
