/**
 * Dataverse Additional Insured Repository
 *
 * Implementation of IAdditionalInsuredRepository using Dataverse as data store.
 * Handles all CRUD operations for Additional Insured entity via DataverseService.
 *
 * Architecture Notes:
 * - Uses DataverseService for HTTP calls to Dataverse API
 * - Maps between Internal ↔ Dataverse representations via AdditionalInsuredMapper
 * - Enforces multi-tenant security via organizationGuid filtering (inherited from Insurance)
 * - Respects immutability of snapshot fields (city, province inherited from Insurance)
 * - Role-based credentials: always uses 'main' app for Additional Insured operations
 *
 * Business Rules Enforced:
 * - Additional insureds can only be created for GENERAL (Commercial) insurance type
 * - Company names must be unique per insurance record
 * - All records must belong to an organization (inherited from parent Insurance)
 *
 * @file dataverse-additional-insured.repository.ts
 * @module AdditionalInsuredModule
 * @layer Repositories
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import {
  AdditionalInsuredInternal,
  AdditionalInsuredDataverse,
  IAdditionalInsuredRepository,
} from '../interfaces';
import { AdditionalInsuredMapper } from '../mappers';
import {
  ADDITIONAL_INSURED_CONFIG,
  ADDITIONAL_INSURED_FIELDS,
  ADDITIONAL_INSURED_ODATA,
} from '../constants';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Dataverse implementation of Additional Insured Repository
 */
@Injectable()
export class DataverseAdditionalInsuredRepository
  implements IAdditionalInsuredRepository
{
  private readonly logger = new Logger(
    DataverseAdditionalInsuredRepository.name,
  );

  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new Additional Insured record
   *
   * @param data - Additional Insured data (requires insuranceGuid, organizationGuid)
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param credentials - Dataverse credentials (app-specific)
   * @returns Created Additional Insured with generated IDs
   */
  async create(
    data: Partial<AdditionalInsuredInternal>,
    organizationGuid: string,
  ): Promise<AdditionalInsuredInternal> {
    const operationId = `create_additional_insured_${Date.now()}`;

    try {
      this.logger.log(
        `Creating Additional Insured for insurance ${data.insuranceGuid} - Operation: ${operationId}`,
      );

      // Validate required fields
      if (!data.insuranceGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'insuranceGuid is required',
          operationId,
        });
      }

      if (!organizationGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'organizationGuid is required',
          operationId,
        });
      }

      // Add organizationGuid to data
      const dataWithOrg = {
        ...data,
        organizationGuid,
      };

      // Map Internal → Dataverse (handles @odata.bind for insurance relationship)
      const dataversePayload =
        AdditionalInsuredMapper.internalToDataverse(dataWithOrg);

      // Get credentials
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Create in Dataverse
      const endpoint = ADDITIONAL_INSURED_CONFIG.ENTITY_SET_NAME;
      const response = (await this.dataverseService.request(
        'POST',
        endpoint,
        dataversePayload,
        credentials,
      )) as Record<string, string>;

      // Extract GUID from response
      const createdId = this.extractIdFromResponse(response);

      // Fetch created record to get full data
      const created = await this.findById(createdId, organizationGuid);

      if (!created) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Additional Insured created but could not be retrieved',
          operationId,
          additionalInsuredId: createdId,
        });
      }

      this.logger.log(
        `Additional Insured created successfully: ${created.osot_table_additional_insuredid} - Operation: ${operationId}`,
      );

      return created;
    } catch (error) {
      this.logger.error(
        `Error creating Additional Insured - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create Additional Insured',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Find Additional Insured by GUID
   *
   * @param id - Additional Insured GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param credentials - Dataverse credentials
   * @returns Additional Insured if found, null otherwise
   */
  async findById(
    id: string,
    organizationGuid: string,
  ): Promise<AdditionalInsuredInternal | null> {
    const operationId = `find_additional_insured_by_id_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Additional Insured by ID: ${id} - Operation: ${operationId}`,
      );

      // Get credentials
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Build OData filter: match ID AND organization (inherited from insurance)
      const filter = `${ADDITIONAL_INSURED_FIELDS.RECORD_ID} eq '${id}'`;
      const endpoint = `${ADDITIONAL_INSURED_CONFIG.ENTITY_SET_NAME}?$filter=${filter}&$select=${ADDITIONAL_INSURED_ODATA.SELECT_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: AdditionalInsuredDataverse[] = Array.isArray(value)
        ? (value as AdditionalInsuredDataverse[])
        : [];

      if (items.length === 0) {
        return null;
      }

      const internal = AdditionalInsuredMapper.dataverseToInternal(items[0]);

      // Add organizationGuid from parameter (not in Dataverse response)
      internal.organizationGuid = organizationGuid;

      return internal;
    } catch (error) {
      this.logger.error(
        `Error finding Additional Insured by ID: ${id} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Find all Additional Insureds for a specific Insurance
   *
   * @param insuranceGuid - Insurance GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param credentials - Dataverse credentials
   * @returns Array of Additional Insureds (empty if none found)
   */
  async findByInsurance(
    insuranceGuid: string,
    organizationGuid: string,
  ): Promise<AdditionalInsuredInternal[]> {
    const operationId = `find_additional_insureds_by_insurance_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Additional Insureds for insurance: ${insuranceGuid} - Operation: ${operationId}`,
      );

      // Get credentials
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Filter by insurance GUID
      const filter = `${ADDITIONAL_INSURED_FIELDS.INSURANCE_ID} eq '${insuranceGuid}'`;
      const endpoint = `${ADDITIONAL_INSURED_CONFIG.ENTITY_SET_NAME}?$filter=${filter}&$select=${ADDITIONAL_INSURED_ODATA.SELECT_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: AdditionalInsuredDataverse[] = Array.isArray(value)
        ? (value as AdditionalInsuredDataverse[])
        : [];

      return items.map((item) => {
        const internal = AdditionalInsuredMapper.dataverseToInternal(item);
        internal.organizationGuid = organizationGuid;
        return internal;
      });
    } catch (error) {
      this.logger.error(
        `Error finding Additional Insureds by insurance: ${insuranceGuid} - Operation: ${operationId}`,
        error,
      );
      return [];
    }
  }

  /**
   * Find Additional Insured by company name within a specific Insurance
   *
   * @param companyName - Company name (normalized to UPPERCASE)
   * @param insuranceGuid - Insurance GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param credentials - Dataverse credentials
   * @returns Additional Insured if found, null otherwise
   */
  async findByCompanyName(
    companyName: string,
    insuranceGuid: string,
    organizationGuid: string,
  ): Promise<AdditionalInsuredInternal | null> {
    const operationId = `find_additional_insured_by_company_name_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Additional Insured by company name: ${companyName} in insurance ${insuranceGuid} - Operation: ${operationId}`,
      );

      // Get credentials
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Normalize company name to UPPERCASE for comparison
      const normalizedName = companyName.trim().toUpperCase();

      // Filter by company name AND insurance GUID
      const filter = `${ADDITIONAL_INSURED_FIELDS.COMPANY_NAME} eq '${normalizedName}' and ${ADDITIONAL_INSURED_FIELDS.INSURANCE_ID} eq '${insuranceGuid}'`;
      const endpoint = `${ADDITIONAL_INSURED_CONFIG.ENTITY_SET_NAME}?$filter=${filter}&$select=${ADDITIONAL_INSURED_ODATA.SELECT_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: AdditionalInsuredDataverse[] = Array.isArray(value)
        ? (value as AdditionalInsuredDataverse[])
        : [];

      if (items.length === 0) {
        return null;
      }

      const internal = AdditionalInsuredMapper.dataverseToInternal(items[0]);
      internal.organizationGuid = organizationGuid;

      return internal;
    } catch (error) {
      this.logger.error(
        `Error finding Additional Insured by company name: ${companyName} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Check if a company name exists for a specific Insurance
   *
   * @param companyName - Company name (normalized to UPPERCASE)
   * @param insuranceGuid - Insurance GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param credentials - Dataverse credentials
   * @returns true if exists, false otherwise
   */
  async existsByCompanyName(
    companyName: string,
    insuranceGuid: string,
    organizationGuid: string,
  ): Promise<boolean> {
    const found = await this.findByCompanyName(
      companyName,
      insuranceGuid,
      organizationGuid,
    );
    return found !== null;
  }

  /**
   * Find all Additional Insureds created by a specific user
   *
   * @param userGuid - User GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param credentials - Dataverse credentials
   * @param filters - Optional additional filters (pagination, search, etc.)
   * @returns Array of Additional Insureds (empty if none found)
   */
  async findByUser(
    userGuid: string,
    organizationGuid: string,
    filters?: Record<string, unknown>,
  ): Promise<AdditionalInsuredInternal[]> {
    const operationId = `find_additional_insureds_by_user_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Additional Insureds for user: ${userGuid} - Operation: ${operationId}`,
      );

      // Get credentials
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Build filter string
      const filterParts: string[] = [];

      // Filter by owner (created by user)
      // Note: In Dataverse, ownerid is the systemuser GUID
      // This assumes ownerid matches userGuid
      filterParts.push(
        `Microsoft.Dynamics.CRM.ContainValues(PropertyName='ownerid',PropertyValues=['${userGuid}'])`,
      );

      // Add additional filters if provided
      if (filters?.insuranceGuid && typeof filters.insuranceGuid === 'string') {
        filterParts.push(
          `${ADDITIONAL_INSURED_FIELDS.INSURANCE_ID} eq '${filters.insuranceGuid}'`,
        );
      }

      const filter = filterParts.join(' and ');
      const endpoint = `${ADDITIONAL_INSURED_CONFIG.ENTITY_SET_NAME}?$filter=${filter}&$select=${ADDITIONAL_INSURED_ODATA.SELECT_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: AdditionalInsuredDataverse[] = Array.isArray(value)
        ? (value as AdditionalInsuredDataverse[])
        : [];

      return items.map((item) => {
        const internal = AdditionalInsuredMapper.dataverseToInternal(item);
        internal.organizationGuid = organizationGuid;
        return internal;
      });
    } catch (error) {
      this.logger.error(
        `Error finding Additional Insureds by user: ${userGuid} - Operation: ${operationId}`,
        error,
      );
      return [];
    }
  }

  /**
   * Update an Additional Insured record
   *
   * @param id - Additional Insured GUID
   * @param data - Partial data to update (only mutable fields)
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param credentials - Dataverse credentials
   * @returns Updated Additional Insured
   */
  async update(
    id: string,
    data: Partial<AdditionalInsuredInternal>,
    organizationGuid: string,
  ): Promise<AdditionalInsuredInternal> {
    const operationId = `update_additional_insured_${Date.now()}`;

    try {
      this.logger.log(
        `Updating Additional Insured: ${id} - Operation: ${operationId}`,
      );

      // Verify record exists first
      const existing = await this.findById(id, organizationGuid);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Additional Insured not found',
          operationId,
          additionalInsuredId: id,
        });
      }

      // Map Internal → Dataverse (only mutable fields)
      const dataversePayload =
        AdditionalInsuredMapper.internalToDataverse(data);

      // Get credentials
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Update in Dataverse
      const endpoint = `${ADDITIONAL_INSURED_CONFIG.ENTITY_SET_NAME}(${id})`;
      await this.dataverseService.request(
        'PATCH',
        endpoint,
        dataversePayload,
        credentials,
      );

      // Fetch updated record
      const updated = await this.findById(id, organizationGuid);

      if (!updated) {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          message: 'Additional Insured updated but could not be retrieved',
          operationId,
          additionalInsuredId: id,
        });
      }

      this.logger.log(
        `Additional Insured updated successfully: ${id} - Operation: ${operationId}`,
      );

      return updated;
    } catch (error) {
      this.logger.error(
        `Error updating Additional Insured: ${id} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update Additional Insured',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Delete an Additional Insured record
   *
   * @param id - Additional Insured GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param credentials - Dataverse credentials
   * @returns true if deleted successfully
   */
  /**
   * Soft delete an Additional Insured (set osot_status = 'Inactive')
   *
   * Performs a soft delete by updating the status field to 'Inactive'.
   * This preserves the record for audit trail and historical data.
   *
   * @param id - Additional Insured GUID
   * @param organizationGuid - Organization GUID for multi-tenant context
   * @returns Success boolean
   * @throws DATAVERSE_SERVICE_ERROR on failure
   */
  async delete(id: string, organizationGuid: string): Promise<boolean> {
    const operationId = `soft_delete_additional_insured_${Date.now()}`;

    try {
      this.logger.log(
        `Soft deleting Additional Insured: ${id} - Operation: ${operationId}`,
      );

      // Verify record exists first
      const existing = await this.findById(id, organizationGuid);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Additional Insured not found',
          operationId,
          additionalInsuredId: id,
        });
      }

      // Get credentials
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Soft delete: Update status to Inactive
      const endpoint = `${ADDITIONAL_INSURED_CONFIG.ENTITY_SET_NAME}(${id})`;
      await this.dataverseService.request(
        'PATCH',
        endpoint,
        { osot_status: 'Inactive' },
        credentials,
      );

      this.logger.log(
        `Additional Insured soft deleted successfully: ${id} - Operation: ${operationId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting Additional Insured: ${id} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to delete Additional Insured',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Delete all Additional Insureds for a specific Insurance (cascade delete)
   *
   * @param insuranceGuid - Insurance GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param credentials - Dataverse credentials
   * @returns Number of records deleted
   */
  async deleteByInsurance(
    insuranceGuid: string,
    organizationGuid: string,
  ): Promise<number> {
    const operationId = `delete_additional_insureds_by_insurance_${Date.now()}`;

    try {
      this.logger.log(
        `Deleting all Additional Insureds for insurance: ${insuranceGuid} - Operation: ${operationId}`,
      );

      // Find all additional insureds for this insurance
      const records = await this.findByInsurance(
        insuranceGuid,
        organizationGuid,
      );

      // Delete each record
      let deletedCount = 0;
      for (const record of records) {
        try {
          await this.delete(
            record.osot_table_additional_insuredid,
            organizationGuid,
          );
          deletedCount++;
        } catch (error) {
          this.logger.warn(
            `Failed to delete Additional Insured ${record.osot_table_additional_insuredid} during cascade delete`,
            error,
          );
        }
      }

      this.logger.log(
        `Deleted ${deletedCount} Additional Insureds for insurance ${insuranceGuid} - Operation: ${operationId}`,
      );

      return deletedCount;
    } catch (error) {
      this.logger.error(
        `Error deleting Additional Insureds by insurance: ${insuranceGuid} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to cascade delete Additional Insureds',
        operationId,
        insuranceGuid,
        originalError: error,
      });
    }
  }

  /**
   * Create multiple Additional Insured records in batch
   *
   * @param records - Array of Additional Insured data
   * @param organizationGuid - Organization GUID for multi-tenant isolation
   * @param credentials - Dataverse credentials
   * @returns Array of created Additional Insureds
   */
  async createBatch(
    records: Partial<AdditionalInsuredInternal>[],
    organizationGuid: string,
  ): Promise<AdditionalInsuredInternal[]> {
    const operationId = `create_batch_additional_insureds_${Date.now()}`;

    try {
      this.logger.log(
        `Creating ${records.length} Additional Insureds in batch - Operation: ${operationId}`,
      );

      const created: AdditionalInsuredInternal[] = [];

      for (const record of records) {
        try {
          const createdRecord = await this.create(record, organizationGuid);
          created.push(createdRecord);
        } catch (error) {
          this.logger.warn(
            `Failed to create Additional Insured in batch for company ${record.osot_company_name}`,
            error,
          );
        }
      }

      this.logger.log(
        `Created ${created.length} of ${records.length} Additional Insureds in batch - Operation: ${operationId}`,
      );

      return created;
    } catch (error) {
      this.logger.error(
        `Error creating Additional Insureds in batch - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create Additional Insureds in batch',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Extract ID from Dataverse response
   * @param response - Dataverse response object
   * @returns Extracted GUID
   */
  private extractIdFromResponse(response: Record<string, string>): string {
    // Try multiple possible response formats
    const id =
      response.osot_table_additional_insuredid ||
      response['@odata.id']?.match(/\(([a-f0-9-]+)\)/i)?.[1] ||
      response.id;

    if (!id) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Could not extract ID from Dataverse response',
        response,
      });
    }

    return id;
  }
}
