/**
 * Additional Insured Repository Interface
 *
 * Contract for data access operations on Additional Insured entity.
 * Abstracts Dataverse details, providing clean interface for services.
 *
 * PATTERN:
 * - Services call repository methods
 * - Repository calls DataverseService with proper OData queries
 * - Repository handles Dataverse-specific logic (binding, normalization, etc.)
 *
 * @file additional-insured-repository.interface.ts
 * @module AdditionalInsuredModule
 * @layer Interfaces
 */

import { AdditionalInsuredInternal } from './additional-insured-internal.interface';

/**
 * Repository interface for Additional Insured entity
 * Defines all data access methods available
 */
export interface IAdditionalInsuredRepository {
  // ========================================
  // CREATE OPERATIONS
  // ========================================

  /**
   * Create a new additional insured record
   *
   * @param data - Internal representation of additional insured
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param credentials - Dataverse credentials for this operation
   * @returns Created record with system-assigned IDs
   * @throws Error if insurance not found, wrong type, or duplicate company
   */
  create(
    data: Partial<AdditionalInsuredInternal>,
    organizationGuid: string,
    credentials: unknown,
  ): Promise<AdditionalInsuredInternal>;

  // ========================================
  // READ OPERATIONS
  // ========================================

  /**
   * Find additional insured by ID (GUID)
   *
   * @param id - Record GUID (osot_table_additional_insuredid)
   * @param organizationGuid - Organization GUID for data isolation
   * @param credentials - Dataverse credentials
   * @returns Additional insured record or null if not found
   */
  findById(
    id: string,
    organizationGuid: string,
    credentials: unknown,
  ): Promise<AdditionalInsuredInternal | null>;

  /**
   * Find all additional insureds for a specific insurance
   *
   * @param insuranceGuid - Insurance record GUID (parent)
   * @param organizationGuid - Organization GUID for data isolation
   * @param credentials - Dataverse credentials
   * @returns Array of additional insureds (empty if none found)
   */
  findByInsurance(
    insuranceGuid: string,
    organizationGuid: string,
    credentials: unknown,
  ): Promise<AdditionalInsuredInternal[]>;

  /**
   * Find additional insured by company name within specific insurance
   *
   * @param companyName - Exact company name (normalized: UPPERCASE)
   * @param insuranceGuid - Insurance record GUID
   * @param organizationGuid - Organization GUID
   * @param credentials - Dataverse credentials
   * @returns Record if found, null otherwise
   */
  findByCompanyName(
    companyName: string,
    insuranceGuid: string,
    organizationGuid: string,
    credentials: unknown,
  ): Promise<AdditionalInsuredInternal | null>;

  /**
   * Check if company already exists for this insurance
   * Used for duplicate detection before creation
   *
   * @param companyName - Company name (normalized)
   * @param insuranceGuid - Insurance GUID
   * @param organizationGuid - Organization GUID
   * @param credentials - Dataverse credentials
   * @returns true if exists, false if not
   */
  existsByCompanyName(
    companyName: string,
    insuranceGuid: string,
    organizationGuid: string,
    credentials: unknown,
  ): Promise<boolean>;

  /**
   * Find all additional insureds for user's insurances
   * Optimized query for list views
   *
   * @param userGuid - User GUID (insurance owner)
   * @param organizationGuid - Organization GUID
   * @param credentials - Dataverse credentials
   * @param filters - Optional filtering criteria
   * @returns Array of additional insureds
   */
  findByUser(
    userGuid: string,
    organizationGuid: string,
    credentials: unknown,
    filters?: {
      searchText?: string;
      insuranceGuid?: string;
      city?: string;
      province?: string;
    },
  ): Promise<AdditionalInsuredInternal[]>;

  // ========================================
  // UPDATE OPERATIONS
  // ========================================

  /**
   * Update an existing additional insured record
   *
   * EDITABLE FIELDS (ADMIN/MAIN only):
   * - osot_company_name
   * - osot_address
   * - osot_city
   * - osot_province
   * - osot_postal_code
   * - osot_privilege
   * - osot_access_modifiers
   *
   * IMMUTABLE FIELDS (cannot change):
   * - osot_table_additional_insuredid
   * - insuranceGuid
   * - organizationGuid
   * - createdon
   * - createdBy
   *
   * @param id - Record GUID to update
   * @param data - Partial data with fields to update
   * @param organizationGuid - Organization GUID for data isolation
   * @param credentials - Dataverse credentials
   * @returns Updated record
   * @throws Error if record not found or validation fails
   */
  update(
    id: string,
    data: Partial<AdditionalInsuredInternal>,
    organizationGuid: string,
    credentials: unknown,
  ): Promise<AdditionalInsuredInternal>;

  // ========================================
  // DELETE OPERATIONS
  // ========================================

  /**
   * Delete (hard delete) an additional insured record
   *
   * RULE: Only MAIN privilege users can delete
   *
   * @param id - Record GUID to delete
   * @param organizationGuid - Organization GUID for data isolation
   * @param credentials - Dataverse credentials
   * @returns true if deleted successfully
   * @throws Error if record not found or deletion fails
   */
  delete(
    id: string,
    organizationGuid: string,
    credentials: unknown,
  ): Promise<boolean>;

  /**
   * Delete all additional insureds for a specific insurance
   * Used when insurance is deleted (cascade delete)
   *
   * @param insuranceGuid - Insurance GUID
   * @param organizationGuid - Organization GUID
   * @param credentials - Dataverse credentials
   * @returns Number of records deleted
   */
  deleteByInsurance(
    insuranceGuid: string,
    organizationGuid: string,
    credentials: unknown,
  ): Promise<number>;

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  /**
   * Create multiple additional insureds in batch
   *
   * @param records - Array of additional insured data
   * @param organizationGuid - Organization GUID
   * @param credentials - Dataverse credentials
   * @returns Array of created records
   * @throws Error if any record fails (rollback behavior TBD)
   */
  createBatch(
    records: Partial<AdditionalInsuredInternal>[],
    organizationGuid: string,
    credentials: unknown,
  ): Promise<AdditionalInsuredInternal[]>;
}

/**
 * Token for dependency injection
 * Used to register and inject the repository implementation
 */
export const ADDITIONAL_INSURED_REPOSITORY = 'ADDITIONAL_INSURED_REPOSITORY';
