/**
 * Dataverse Insurance Provider Repository
 *
 * Implementation of InsuranceProviderRepository using Dataverse as data store.
 * Handles all CRUD operations for InsuranceProvider entity via DataverseService.
 *
 * Architecture Notes:
 * - Uses DataverseService for HTTP calls to Dataverse API
 * - Maps between Internal ↔ Dataverse representations via InsuranceProviderMapper
 * - Enforces multi-tenant security via organizationGuid filtering
 * - All providers are org-scoped and immutable after creation (except access control)
 * - Uses 'main' app for all database operations
 *
 * @file dataverse-insurance-provider.repository.ts
 * @module InsuranceProviderModule
 * @layer Repositories
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import {
  InsuranceProviderInternal,
  InsuranceProviderDataverse,
  InsuranceProviderRepository,
} from '../interfaces';
import { InsuranceProviderMapper } from '../mappers';
import {
  INSURANCE_PROVIDER_ENTITY,
  INSURANCE_PROVIDER_FIELDS,
  INSURANCE_PROVIDER_ODATA,
} from '../constants';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Dataverse implementation of Insurance Provider Repository
 */
@Injectable()
export class DataverseInsuranceProviderRepository
  implements InsuranceProviderRepository
{
  private readonly logger = new Logger(
    DataverseInsuranceProviderRepository.name,
  );

  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new Insurance Provider
   *
   * @param data - Insurance Provider data (requires organizationGuid)
   * @param operationId - Optional operation tracking ID
   * @returns Created provider with generated IDs (GUID, autonumber)
   */
  async create(
    data: Partial<InsuranceProviderInternal>,
    operationId?: string,
  ): Promise<InsuranceProviderInternal> {
    const opId = operationId || `create_insurance_provider_${Date.now()}`;

    try {
      this.logger.log(
        `Creating Insurance Provider - Organization: ${data.organizationGuid} - Operation: ${opId}`,
      );

      // Validate required fields
      if (!data.organizationGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'organizationGuid is required',
          operationId: opId,
        });
      }

      if (!data.osot_insurance_company_name) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Company name is required',
          operationId: opId,
        });
      }

      // Map Internal → Dataverse (handles @odata.bind)
      const dataversePayload =
        InsuranceProviderMapper.internalToDataverse(data);

      // Get credentials for Dataverse
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Create in Dataverse
      const endpoint = INSURANCE_PROVIDER_ENTITY.collectionName;
      const response = (await this.dataverseService.request(
        'POST',
        endpoint,
        dataversePayload,
        credentials,
      )) as Record<string, string>;

      // Extract GUID from response
      const createdId = this.extractIdFromResponse(response);

      // Fetch created record to get full data
      const created = await this.findById(createdId, data.organizationGuid);

      if (!created) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Provider created but could not be retrieved',
          operationId: opId,
          providerId: createdId,
        });
      }

      this.logger.log(
        `Insurance Provider created successfully: ${created.osot_table_insurance_providerid} (${created.osot_provider_id}) - Operation: ${opId}`,
      );

      return created;
    } catch (error) {
      this.logger.error(
        `Error creating Insurance Provider - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create Insurance Provider',
        operationId: opId,
        originalError: error,
      });
    }
  }

  /**
   * Update an existing Insurance Provider
   *
   * @param id - Provider GUID
   * @param data - Partial provider data
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param operationId - Optional operation tracking ID
   * @returns Updated provider
   */
  async update(
    id: string,
    data: Partial<InsuranceProviderInternal>,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceProviderInternal> {
    const opId = operationId || `update_insurance_provider_${Date.now()}`;

    try {
      this.logger.log(
        `Updating Insurance Provider: ${id} - Organization: ${organizationGuid} - Operation: ${opId}`,
      );

      // Verify provider exists and belongs to organization
      const existing = await this.findById(id, organizationGuid, opId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message:
            'Insurance Provider not found or does not belong to organization',
          operationId: opId,
          providerId: id,
        });
      }

      // Filter out immutable field: organizationGuid cannot change
      const updateData: Partial<InsuranceProviderInternal> = {
        ...data,
      };
      delete updateData.organizationGuid;

      if (Object.keys(updateData).length === 0) {
        this.logger.warn(`No fields to update - Operation: ${opId}`, {
          providerId: id,
        });
        return existing;
      }

      // Map Internal → Dataverse
      const dataversePayload =
        InsuranceProviderMapper.internalToDataverse(updateData);

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${INSURANCE_PROVIDER_ENTITY.collectionName}(${id})`;

      await this.dataverseService.request(
        'PATCH',
        endpoint,
        dataversePayload,
        credentials,
      );

      // Fetch updated record
      const updated = await this.findById(id, organizationGuid, opId);

      if (!updated) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Provider updated but could not be retrieved',
          operationId: opId,
          providerId: id,
        });
      }

      this.logger.log(
        `Insurance Provider updated successfully: ${id} - Operation: ${opId}`,
      );

      return updated;
    } catch (error) {
      this.logger.error(
        `Error updating Insurance Provider: ${id} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update Insurance Provider',
        operationId: opId,
        providerId: id,
        originalError: error,
      });
    }
  }

  /**
   * Delete an Insurance Provider (soft delete - set status to inactive)
   *
   * @param id - Provider GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param operationId - Optional operation tracking ID
   * @returns True if deleted successfully
   */
  async delete(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete_insurance_provider_${Date.now()}`;

    try {
      this.logger.log(
        `Soft deleting Insurance Provider: ${id} - Organization: ${organizationGuid} - Operation: ${opId}`,
      );

      // Verify provider exists and belongs to organization
      const existing = await this.findById(id, organizationGuid, opId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message:
            'Insurance Provider not found or does not belong to organization',
          operationId: opId,
          providerId: id,
        });
      }

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${INSURANCE_PROVIDER_ENTITY.collectionName}(${id})`;

      // Soft delete: set status to inactive (0)
      await this.dataverseService.request(
        'PATCH',
        endpoint,
        { statecode: 0 }, // 0 = Inactive
        credentials,
      );

      this.logger.log(
        `Insurance Provider soft deleted successfully: ${id} - Operation: ${opId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting Insurance Provider: ${id} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to delete Insurance Provider',
        operationId: opId,
        providerId: id,
        originalError: error,
      });
    }
  }

  /**
   * Hard delete an Insurance Provider (permanent removal)
   *
   * WARNING: Irreversible operation. Use only for data cleanup/GDPR compliance.
   *
   * @param id - Provider GUID
   * @param operationId - Optional operation tracking ID
   * @returns True if deleted successfully
   */
  async hardDelete(id: string, operationId?: string): Promise<boolean> {
    const opId = operationId || `hard_delete_insurance_provider_${Date.now()}`;

    try {
      this.logger.warn(
        `Hard deleting Insurance Provider: ${id} - Operation: ${opId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${INSURANCE_PROVIDER_ENTITY.collectionName}(${id})`;

      await this.dataverseService.request(
        'DELETE',
        endpoint,
        null,
        credentials,
      );

      this.logger.warn(
        `Insurance Provider hard deleted successfully: ${id} - Operation: ${opId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error hard deleting Insurance Provider: ${id} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to hard delete Insurance Provider',
        operationId: opId,
        providerId: id,
        originalError: error,
      });
    }
  }

  /**
   * Find Insurance Provider by GUID
   *
   * @param id - Provider GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param operationId - Optional operation tracking ID
   * @returns Provider if found, null otherwise
   */
  async findById(
    id: string,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceProviderInternal | null> {
    const operationId =
      _operationId || `find_insurance_provider_by_id_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Insurance Provider by ID: ${id} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Multi-tenant filter: match ID AND organization
      const filter = `${INSURANCE_PROVIDER_FIELDS.TABLE_INSURANCE_PROVIDER_ID} eq '${id}' and ${INSURANCE_PROVIDER_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`;
      const endpoint = `${INSURANCE_PROVIDER_ENTITY.collectionName}?$filter=${filter}&$select=${INSURANCE_PROVIDER_ODATA.SELECT_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: InsuranceProviderDataverse[] = Array.isArray(value)
        ? (value as InsuranceProviderDataverse[])
        : [];

      return items.length > 0
        ? InsuranceProviderMapper.dataverseToInternal(items[0])
        : null;
    } catch (error) {
      this.logger.error(
        `Error finding Insurance Provider by ID: ${id} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Find Insurance Provider by provider ID (autonumber)
   *
   * @param providerId - Provider ID (osot-prov-0000001 format)
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param operationId - Optional operation tracking ID
   * @returns Provider if found, null otherwise
   */
  async findByProviderId(
    providerId: string,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceProviderInternal | null> {
    const operationId =
      _operationId || `find_insurance_provider_by_providerid_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Insurance Provider by Provider ID: ${providerId} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const filter = `${INSURANCE_PROVIDER_FIELDS.PROVIDER_ID} eq '${providerId}' and ${INSURANCE_PROVIDER_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`;
      const endpoint = `${INSURANCE_PROVIDER_ENTITY.collectionName}?$filter=${filter}&$select=${INSURANCE_PROVIDER_ODATA.SELECT_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: InsuranceProviderDataverse[] = Array.isArray(value)
        ? (value as InsuranceProviderDataverse[])
        : [];

      return items.length > 0
        ? InsuranceProviderMapper.dataverseToInternal(items[0])
        : null;
    } catch (error) {
      this.logger.error(
        `Error finding Insurance Provider by Provider ID: ${providerId} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Find all Insurance Providers for a specific Organization
   *
   * @param organizationGuid - Organization GUID
   * @param operationId - Optional operation tracking ID
   * @returns Array of providers for organization
   */
  async findByOrganization(
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceProviderInternal[]> {
    return this.findAll({}, organizationGuid, _operationId);
  }

  /**
   * Find all Insurance Providers matching filters
   *
   * @param filters - OData filter conditions (search, activeOnly, sortBy, sortDirection, skip, top)
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param operationId - Optional operation tracking ID
   * @returns Array of providers matching filters
   */
  async findAll(
    filters: Record<string, any>,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceProviderInternal[]> {
    const operationId =
      _operationId || `find_all_insurance_providers_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding all Insurance Providers with filters - Organization: ${organizationGuid} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Build OData query
      let endpoint = `${INSURANCE_PROVIDER_ENTITY.collectionName}?$select=${INSURANCE_PROVIDER_ODATA.SELECT_FIELDS}`;

      // Build filter string
      const filterString = this.buildFilterString(filters, organizationGuid);
      if (filterString) {
        endpoint += `&$filter=${filterString}`;
      }

      // Add pagination
      if (filters.skip !== undefined) {
        endpoint += `&$skip=${filters.skip as number}`;
      }
      if (filters.top !== undefined) {
        endpoint += `&$top=${filters.top as number}`;
      }

      // Add sorting
      if (filters.sortBy) {
        let sortBy = filters.sortBy as string;
        // Map user-friendly names to Dataverse field names
        if (sortBy === 'companyName') {
          sortBy = INSURANCE_PROVIDER_FIELDS.INSURANCE_COMPANY_NAME;
        } else if (sortBy === 'brokerName') {
          sortBy = INSURANCE_PROVIDER_FIELDS.INSURANCE_BROKER_NAME;
        } else if (sortBy === 'createdOn') {
          sortBy = 'createdon';
        } else if (sortBy === 'modifiedOn') {
          sortBy = 'modifiedon';
        }
        const sortDir = filters.sortDirection === 'desc' ? 'desc' : 'asc';
        endpoint += `&$orderby=${sortBy} ${sortDir}`;
      }

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: InsuranceProviderDataverse[] = Array.isArray(value)
        ? (value as InsuranceProviderDataverse[])
        : [];

      return items.map((item) =>
        InsuranceProviderMapper.dataverseToInternal(item),
      );
    } catch (error) {
      this.logger.error(
        `Error finding all Insurance Providers - Organization: ${organizationGuid} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve Insurance Providers',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Check if Insurance Provider exists by ID
   *
   * @param id - Provider GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param operationId - Optional operation tracking ID
   * @returns True if exists, false otherwise
   */
  async exists(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean> {
    const provider = await this.findById(id, organizationGuid, operationId);
    return provider !== null;
  }

  /**
   * Count Insurance Providers matching filters
   *
   * @param filters - Filter conditions
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param operationId - Optional operation tracking ID
   * @returns Count of matching providers
   */
  async count(
    filters: Record<string, any>,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<number> {
    const operationId =
      _operationId || `count_insurance_providers_${Date.now()}`;

    try {
      this.logger.debug(
        `Counting Insurance Providers - Organization: ${organizationGuid} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Build filter string
      const filterString = this.buildFilterString(filters, organizationGuid);

      let endpoint = `${INSURANCE_PROVIDER_ENTITY.collectionName}/$count`;
      if (filterString) {
        endpoint += `?$filter=${filterString}`;
      }

      const count = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as number;

      return Number(count ?? 0);
    } catch (error) {
      this.logger.error(
        `Error counting Insurance Providers - Organization: ${organizationGuid} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to count Insurance Providers',
        operationId,
        originalError: error,
      });
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Extract entity ID from Dataverse POST response
   *
   * @param response - Dataverse response with OData-EntityId header
   * @returns Entity GUID
   */
  private extractIdFromResponse(response: Record<string, string>): string {
    const entityId = response['@odata.id'] || response['OData-EntityId'];
    if (!entityId) {
      throw new Error('No entity ID found in response');
    }

    // Extract GUID from URL: /osot_table_insurance_providers(guid)
    const match = entityId.match(/\(([a-f0-9-]+)\)/i);
    if (!match) {
      throw new Error('Could not extract GUID from entity ID');
    }

    return match[1];
  }

  /**
   * Build OData filter string from filters object
   *
   * @param filters - Filter conditions
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns OData filter string
   */
  private buildFilterString(
    filters: Record<string, any>,
    organizationGuid: string,
  ): string {
    const conditions: string[] = [];

    // Always filter by organization (multi-tenant)
    conditions.push(
      `${INSURANCE_PROVIDER_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`,
    );

    // Search filter: company name or broker name contains search term
    if (filters.search) {
      const searchTerm = (filters.search as string).toUpperCase();
      conditions.push(
        `(contains(${INSURANCE_PROVIDER_FIELDS.INSURANCE_COMPANY_NAME}, '${searchTerm}') or contains(${INSURANCE_PROVIDER_FIELDS.INSURANCE_BROKER_NAME}, '${searchTerm}'))`,
      );
    }

    // Active only filter
    if (filters.activeOnly === true) {
      conditions.push('statecode eq 1'); // 1 = Active
    }

    return conditions.join(' and ');
  }
}
