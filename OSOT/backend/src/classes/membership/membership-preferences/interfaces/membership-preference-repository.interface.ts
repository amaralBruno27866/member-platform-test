/**
 * Interface for Membership Preferences repository operations.
 * Defines the contract for data access layer operations.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - integrations: Uses DataverseService for data operations
 * - errors: Returns structured error handling
 * - interfaces: Works with MembershipPreferenceInternal and MembershipPreferenceDataverse
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT membership preferences management needs
 * - No complex aggregations or analytics
 * - Focus on reliable data access patterns for user preference management
 */

import { MembershipPreferenceInternal } from './membership-preference-internal.interface';
import { MembershipPreferenceDataverse } from './membership-preference-dataverse.interface';

export interface MembershipPreferenceRepository {
  /**
   * Create a new membership preference record
   */
  create(
    preferenceData: Partial<MembershipPreferenceInternal>,
  ): Promise<MembershipPreferenceInternal>;

  /**
   * Find membership preference by Preference ID (business ID)
   */
  findByPreferenceId(
    preferenceId: string,
  ): Promise<MembershipPreferenceInternal | null>;

  /**
   * Find membership preference by GUID
   */
  findById(id: string): Promise<MembershipPreferenceInternal | null>;

  /**
   * Find membership preferences by membership year
   */
  findByYear(year: string): Promise<MembershipPreferenceInternal[]>;

  /**
   * Find membership preferences by category lookup
   */
  findByCategoryId(categoryId: string): Promise<MembershipPreferenceInternal[]>;

  /**
   * Find membership preferences by account lookup
   */
  findByAccountId(accountId: string): Promise<MembershipPreferenceInternal[]>;

  /**
   * Find membership preferences by affiliate lookup
   */
  findByAffiliateId(
    affiliateId: string,
  ): Promise<MembershipPreferenceInternal[]>;

  /**
   * Find membership preference by user (account or affiliate) and year
   * Business rule: one preference per user per year
   */
  findByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
  ): Promise<MembershipPreferenceInternal | null>;

  /**
   * Update membership preference by Preference ID
   */
  update(
    preferenceId: string,
    updateData: Partial<MembershipPreferenceInternal>,
  ): Promise<MembershipPreferenceInternal>;

  /**
   * Update membership preference by GUID
   */
  updateById(
    id: string,
    updateData: Partial<MembershipPreferenceInternal>,
  ): Promise<MembershipPreferenceInternal>;

  /**
   * Delete membership preference by Preference ID
   */
  delete(preferenceId: string): Promise<void>;

  /**
   * Delete membership preference by GUID
   */
  deleteById(id: string): Promise<void>;

  /**
   * List all membership preferences with pagination
   */
  findAll(options?: {
    skip?: number;
    top?: number;
    orderBy?: string;
  }): Promise<MembershipPreferenceInternal[]>;

  /**
   * Count total membership preferences
   */
  count(): Promise<number>;

  /**
   * Check if a preference exists for user and year (uniqueness validation)
   */
  existsByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
  ): Promise<boolean>;

  /**
   * Find preferences with auto-renewal enabled
   */
  findByAutoRenewal(
    autoRenewal: boolean,
  ): Promise<MembershipPreferenceInternal[]>;

  /**
   * Transform raw Dataverse data to internal format
   */
  mapDataverseToInternal(
    dataverseData: MembershipPreferenceDataverse,
  ): MembershipPreferenceInternal;

  /**
   * Transform internal data to Dataverse format
   */
  mapInternalToDataverse(
    internalData: Partial<MembershipPreferenceInternal>,
  ): Partial<MembershipPreferenceDataverse>;
}
