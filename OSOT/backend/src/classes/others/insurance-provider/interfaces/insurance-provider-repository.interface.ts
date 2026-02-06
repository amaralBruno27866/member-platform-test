/**
 * Insurance Provider Repository Interface
 *
 * Contract for Insurance Provider data access layer.
 * Defines all methods for interacting with Insurance Provider entity in Dataverse.
 *
 * Responsibilities:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Query operations (Find, Filter)
 * - Organization scoping
 *
 * All methods return InsuranceProviderInternal objects (not Dataverse-specific).
 */

import { InsuranceProviderInternal } from './insurance-provider-internal.interface';

/**
 * Insurance Provider Repository contract
 */
export interface InsuranceProviderRepository {
  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a new insurance provider
   *
   * @param provider - Provider data (without IDs - auto-generated)
   * @param operationId - Operation tracking ID
   * @returns Created provider with generated IDs
   */
  create(
    provider: Omit<
      InsuranceProviderInternal,
      'osot_table_insurance_providerid' | 'osot_provider_id'
    >,
    operationId?: string,
  ): Promise<InsuranceProviderInternal>;

  /**
   * Update existing provider
   *
   * @param id - Provider GUID (osot_table_insurance_providerid)
   * @param updates - Partial provider data to update
   * @param organizationGuid - Organization context (multi-tenant security)
   * @param operationId - Operation tracking ID
   * @returns Updated provider
   */
  update(
    id: string,
    updates: Partial<InsuranceProviderInternal>,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceProviderInternal>;

  /**
   * Delete provider (soft delete - mark as inactive)
   *
   * @param id - Provider GUID (osot_table_insurance_providerid)
   * @param organizationGuid - Organization context (multi-tenant security)
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  delete(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean>;

  /**
   * Hard delete provider (permanent removal)
   *
   * @param id - Provider GUID (osot_table_insurance_providerid)
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  hardDelete(id: string, operationId?: string): Promise<boolean>;

  // ========================================
  // FIND OPERATIONS (Single Record)
  // ========================================

  /**
   * Find provider by internal ID (GUID)
   *
   * @param id - Provider GUID (osot_table_insurance_providerid)
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Provider or null if not found
   */
  findById(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceProviderInternal | null>;

  /**
   * Find provider by business ID (Autonumber)
   *
   * @param providerId - Business provider ID (osot_provider_id, e.g., "osot-prov-0000001")
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Provider or null if not found
   */
  findByProviderId(
    providerId: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceProviderInternal | null>;

  // ========================================
  // FIND OPERATIONS (Multiple Records)
  // ========================================

  /**
   * Find all providers for an organization
   *
   * @param organizationGuid - Organization context (multi-tenant filter)
   * @param operationId - Operation tracking ID
   * @returns Array of providers
   */
  findByOrganization(
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceProviderInternal[]>;

  /**
   * Find all providers with optional filters
   *
   * @param filters - Optional filters (organizationGuid, skip, top, orderBy)
   * @param operationId - Operation tracking ID
   * @returns Array of providers
   */
  findAll(
    filters?: {
      organizationGuid?: string;
      skip?: number;
      top?: number;
      orderBy?: string;
    },
    operationId?: string,
  ): Promise<InsuranceProviderInternal[]>;
}
