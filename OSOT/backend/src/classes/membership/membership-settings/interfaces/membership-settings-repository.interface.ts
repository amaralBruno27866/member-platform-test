/**
 * Interface for Membership Settings repository operations.
 * Defines the contract for data access layer operations.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - integrations: Uses DataverseService for data operations
 * - errors: Returns structured error handling
 * - interfaces: Works with MembershipSettingsInternal and MembershipSettingsDataverse
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT membership management needs
 * - No complex aggregations or analytics
 * - Focus on reliable data access patterns for membership period configuration
 * - Group-based queries (Individual vs Business)
 * - Year-based period management
 */

import { MembershipSettingsInternal } from './membership-settings-internal.interface';
import { MembershipSettingsDataverse } from './membership-settings-dataverse.interface';
import { AccountStatus } from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';

export interface MembershipSettingsRepository {
  /**
   * Create a new membership settings record
   */
  create(
    settingsData: Partial<MembershipSettingsInternal>,
  ): Promise<MembershipSettingsInternal>;

  /**
   * Find membership settings by Settings ID (business ID - org scoped)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param settingsId - Membership settings business ID
   */
  findBySettingsId(
    organizationGuid: string,
    settingsId: string,
  ): Promise<MembershipSettingsInternal | null>;

  /**
   * Find membership settings by GUID (org scoped)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param id - Record GUID
   */
  findById(
    organizationGuid: string,
    id: string,
  ): Promise<MembershipSettingsInternal | null>;

  /**
   * Find membership settings by group and year (org-scoped uniqueness)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param group - Membership group
   * @param year - Membership year
   */
  findByGroupAndYear(
    organizationGuid: string,
    group: MembershipGroup,
    year: string,
  ): Promise<MembershipSettingsInternal | null>;

  /**
   * Find all membership settings for a specific year (org scoped)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param year - Membership year
   */
  findByYear(
    organizationGuid: string,
    year: string,
  ): Promise<MembershipSettingsInternal[]>;

  /**
   * Find all membership settings for a specific group (org scoped)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param group - Membership group
   */
  findByGroup(
    organizationGuid: string,
    group: MembershipGroup,
  ): Promise<MembershipSettingsInternal[]>;

  /**
   * Find all membership settings by status (org scoped)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param status - Account status filter
   */
  findByStatus(
    organizationGuid: string,
    status: AccountStatus,
  ): Promise<MembershipSettingsInternal[]>;

  /**
   * Update membership settings by Settings ID (org scoped)
   * @param organizationGuid - Organization GUID for validation
   * @param settingsId - Membership settings business ID
   * @param updateData - Fields to update
   */
  update(
    organizationGuid: string,
    settingsId: string,
    updateData: Partial<MembershipSettingsInternal>,
  ): Promise<MembershipSettingsInternal>;

  /**
   * Update membership settings by GUID (org scoped)
   * @param organizationGuid - Organization GUID for validation
   * @param id - Record GUID
   * @param updateData - Fields to update
   */
  updateById(
    organizationGuid: string,
    id: string,
    updateData: Partial<MembershipSettingsInternal>,
  ): Promise<MembershipSettingsInternal>;

  /**
   * Delete membership settings by Settings ID (soft delete - org scoped)
   * @param organizationGuid - Organization GUID for validation
   * @param settingsId - Membership settings business ID
   */
  delete(organizationGuid: string, settingsId: string): Promise<boolean>;

  /**
   * Delete membership settings by GUID (soft delete - org scoped)
   * @param organizationGuid - Organization GUID for validation
   * @param id - Record GUID
   */
  deleteById(organizationGuid: string, id: string): Promise<boolean>;

  /**
   * List membership settings with filtering and pagination (org scoped)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param options - Filter and pagination options
   */
  list(
    organizationGuid: string,
    options?: {
      membershipYear?: string;
      membershipGroup?: MembershipGroup;
      membershipYearStatus?: AccountStatus;
      searchTerm?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      pageSize?: number;
      createdFrom?: string;
      createdTo?: string;
    },
  ): Promise<{
    data: MembershipSettingsInternal[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;

  /**
   * Count total membership settings records (org scoped)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param filters - Optional filters
   */
  count(
    organizationGuid: string,
    filters?: {
      membershipYear?: string;
      membershipGroup?: MembershipGroup;
      membershipYearStatus?: AccountStatus;
    },
  ): Promise<number>;

  /**
   * Check if group-year combination exists (org-scoped uniqueness validation)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param group - Membership group
   * @param year - Membership year
   * @param excludeSettingsId - Optional settings ID to exclude from check
   */
  existsByGroupAndYear(
    organizationGuid: string,
    group: MembershipGroup,
    year: string,
    excludeSettingsId?: string,
  ): Promise<boolean>;

  /**
   * Find active membership settings (org scoped)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   */
  findActive(organizationGuid: string): Promise<MembershipSettingsInternal[]>;

  /**
   * Find membership settings ending in date range (org scoped)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param fromDate - Start date (ISO 8601)
   * @param toDate - End date (ISO 8601)
   */
  findEndingInRange(
    organizationGuid: string,
    fromDate: string,
    toDate: string,
  ): Promise<MembershipSettingsInternal[]>;

  /**
   * Convert raw Dataverse response to internal interface
   */
  mapFromDataverse(
    dataverseData: MembershipSettingsDataverse,
  ): MembershipSettingsInternal;

  /**
   * Convert internal interface to Dataverse format
   */
  mapToDataverse(
    internalData: MembershipSettingsInternal,
  ): MembershipSettingsDataverse;
}
