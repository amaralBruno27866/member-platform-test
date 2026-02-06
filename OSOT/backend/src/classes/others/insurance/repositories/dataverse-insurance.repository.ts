/**
 * Dataverse Insurance Repository
 *
 * Implementation of InsuranceRepository using Dataverse as data store.
 * Handles all CRUD operations for Insurance entity via DataverseService.
 *
 * Architecture Notes:
 * - Uses DataverseService for HTTP calls to Dataverse API
 * - Maps between Internal ↔ Dataverse representations via InsuranceMapper
 * - Enforces multi-tenant security via organizationGuid filtering
 * - Respects immutability of snapshot fields (21 frozen fields)
 * - Role-based credentials: always uses 'main' app for Insurance operations
 *
 * @file dataverse-insurance.repository.ts
 * @module InsuranceModule
 * @layer Repositories
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import {
  InsuranceInternal,
  InsuranceDataverse,
  InsuranceRepository,
} from '../interfaces';
import { InsuranceMapper } from '../mappers';
import {
  INSURANCE_ENTITY,
  INSURANCE_FIELDS,
  INSURANCE_ODATA_QUERIES,
} from '../constants';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Dataverse implementation of Insurance Repository
 */
@Injectable()
export class DataverseInsuranceRepository implements InsuranceRepository {
  private readonly logger = new Logger(DataverseInsuranceRepository.name);

  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new Insurance certificate
   *
   * @param data - Insurance data (requires organizationGuid, orderGuid, accountGuid)
   * @returns Created Insurance with generated IDs
   */
  async create(
    data: Partial<InsuranceInternal>,
    operationId?: string,
  ): Promise<InsuranceInternal> {
    const opId = operationId || `create_insurance_${Date.now()}`;

    try {
      this.logger.log(
        `Creating Insurance for order ${data.orderGuid} - Operation: ${opId}`,
      );

      // Validate required fields
      if (!data.organizationGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'organizationGuid is required',
          operationId: opId,
        });
      }

      if (!data.orderGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'orderGuid is required',
          operationId: opId,
        });
      }

      if (!data.accountGuid) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'accountGuid is required',
          operationId: opId,
        });
      }

      // Map Internal → Dataverse (handles @odata.bind)
      const dataversePayload = InsuranceMapper.internalToDataverse(data);

      // Get credentials
      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Create in Dataverse
      const endpoint = INSURANCE_ENTITY.collectionName;
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
          message: 'Insurance created but could not be retrieved',
          operationId: opId,
          insuranceId: createdId,
        });
      }

      this.logger.log(
        `Insurance created successfully: ${created.osot_table_insuranceid} - Operation: ${opId}`,
      );

      return created;
    } catch (error) {
      this.logger.error(`Error creating Insurance - Operation: ${opId}`, error);
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create Insurance',
        operationId: opId,
        originalError: error,
      });
    }
  }

  /**
   * Find Insurance by GUID
   *
   * @param id - Insurance GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Insurance if found, null otherwise
   */
  async findById(
    id: string,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceInternal | null> {
    const operationId = _operationId || `find_insurance_by_id_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Insurance by ID: ${id} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Multi-tenant filter: match ID AND organization
      const filter = `${INSURANCE_FIELDS.TABLE_INSURANCE_ID} eq '${id}' and ${INSURANCE_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`;
      const endpoint = `${INSURANCE_ENTITY.collectionName}?$filter=${filter}&$select=${INSURANCE_ODATA_QUERIES.SELECT_ALL_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: InsuranceDataverse[] = Array.isArray(value)
        ? (value as InsuranceDataverse[])
        : [];

      return items.length > 0
        ? InsuranceMapper.dataverseToInternal(items[0])
        : null;
    } catch (error) {
      this.logger.error(
        `Error finding Insurance by ID: ${id} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Find Insurance by business identifier (autonumber)
   *
   * @param insuranceNumber - Insurance autonumber (osot_insuranceid)
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Insurance if found, null otherwise
   */
  async findByInsuranceNumber(
    insuranceNumber: string,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceInternal | null> {
    const operationId =
      _operationId || `find_insurance_by_number_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Insurance by number: ${insuranceNumber} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const filter = `${INSURANCE_FIELDS.INSURANCE_NUMBER} eq '${insuranceNumber}' and ${INSURANCE_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`;
      const endpoint = `${INSURANCE_ENTITY.collectionName}?$filter=${filter}&$select=${INSURANCE_ODATA_QUERIES.SELECT_ALL_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: InsuranceDataverse[] = Array.isArray(value)
        ? (value as InsuranceDataverse[])
        : [];

      return items.length > 0
        ? InsuranceMapper.dataverseToInternal(items[0])
        : null;
    } catch (error) {
      this.logger.error(
        `Error finding Insurance by number: ${insuranceNumber} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Find Insurance by certificate number (snapshot field)
   *
   * @param certificateNumber - Certificate number
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Insurance if found, null otherwise
   */
  async findByCertificateNumber(
    certificateNumber: string,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceInternal | null> {
    const operationId =
      _operationId || `find_insurance_by_certificate_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Insurance by certificate: ${certificateNumber} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const filter = `${INSURANCE_FIELDS.CERTIFICATE} eq '${certificateNumber}' and ${INSURANCE_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`;
      const endpoint = `${INSURANCE_ENTITY.collectionName}?$filter=${filter}&$select=${INSURANCE_ODATA_QUERIES.SELECT_ALL_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: InsuranceDataverse[] = Array.isArray(value)
        ? (value as InsuranceDataverse[])
        : [];

      return items.length > 0
        ? InsuranceMapper.dataverseToInternal(items[0])
        : null;
    } catch (error) {
      this.logger.error(
        `Error finding Insurance by certificate: ${certificateNumber} - Operation: ${operationId}`,
        error,
      );
      return null;
    }
  }

  /**
   * Find all Insurance certificates matching filters
   *
   * @param filters - OData filter conditions
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Array of Insurance certificates (empty if none found)
   */
  async findAll(
    filters: Record<string, any>,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const operationId = _operationId || `find_all_insurance_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding all Insurance with filters - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Build OData query
      let endpoint = `${INSURANCE_ENTITY.collectionName}?$select=${INSURANCE_ODATA_QUERIES.SELECT_ALL_FIELDS}`;

      // Build filter string
      const filterString = this.buildFilterString(filters, organizationGuid);
      if (filterString) {
        endpoint += `&$filter=${filterString}`;
      }

      // Add pagination
      if (filters.skip) {
        endpoint += `&$skip=${filters.skip as number}`;
      }
      if (filters.top) {
        endpoint += `&$top=${filters.top as number}`;
      }

      // Add sorting
      if (filters.orderBy) {
        let sortBy = filters.orderBy as string;
        if (sortBy === 'createdOn') {
          sortBy = 'createdon';
        } else if (sortBy === 'effectiveDate') {
          sortBy = INSURANCE_FIELDS.EFFECTIVE_DATE;
        } else if (sortBy === 'expiryDate') {
          sortBy = INSURANCE_FIELDS.EXPIRY_DATE;
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
      const items: InsuranceDataverse[] = Array.isArray(value)
        ? (value as InsuranceDataverse[])
        : [];

      return items.map((item) => InsuranceMapper.dataverseToInternal(item));
    } catch (error) {
      this.logger.error(
        `Error finding all Insurance - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve Insurance',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Find all Insurance certificates for a specific Account
   *
   * @param accountGuid - Account GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Array of Insurance certificates belonging to the account
   */
  async findByAccount(
    accountGuid: string,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceInternal[]> {
    return this.findAll({ accountGuid }, organizationGuid, _operationId);
  }

  /**
   * Find all Insurance certificates for a specific Order
   *
   * @param orderGuid - Order GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Array of Insurance certificates belonging to the order
   */
  async findByOrder(
    orderGuid: string,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceInternal[]> {
    return this.findAll({ orderGuid }, organizationGuid, _operationId);
  }

  /**
   * Find all currently active Insurance certificates
   *
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Array of active Insurance certificates
   */
  async findActive(
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceInternal[]> {
    return this.findAll(
      { insuranceStatus: 3 }, // 3 = ACTIVE
      organizationGuid,
      _operationId,
    );
  }

  /**
   * Find all expired Insurance certificates
   *
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Array of expired Insurance certificates
   */
  async findExpired(
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const operationId = _operationId || `find_expired_insurance_${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    try {
      this.logger.debug(
        `Finding expired Insurance - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const filter = `${INSURANCE_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}' and ${INSURANCE_FIELDS.EXPIRY_DATE} le '${today}'`;
      const endpoint = `${INSURANCE_ENTITY.collectionName}?$filter=${filter}&$select=${INSURANCE_ODATA_QUERIES.SELECT_ALL_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: InsuranceDataverse[] = Array.isArray(value)
        ? (value as InsuranceDataverse[])
        : [];

      return items.map((item) => InsuranceMapper.dataverseToInternal(item));
    } catch (error) {
      this.logger.error(
        `Error finding expired Insurance - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve expired Insurance',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Find Insurance certificates expiring within specified days
   *
   * @param days - Number of days to look ahead
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Array of Insurance certificates expiring soon
   */
  async findExpiringSoon(
    days: number,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const operationId =
      _operationId || `find_expiring_soon_insurance_${Date.now()}`;
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    const todayIso = today.toISOString().split('T')[0];
    const futureIso = futureDate.toISOString().split('T')[0];

    try {
      this.logger.debug(
        `Finding Insurance expiring within ${days} days - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const filter = `${INSURANCE_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}' and ${INSURANCE_FIELDS.EXPIRY_DATE} ge '${todayIso}' and ${INSURANCE_FIELDS.EXPIRY_DATE} le '${futureIso}'`;
      const endpoint = `${INSURANCE_ENTITY.collectionName}?$filter=${filter}&$select=${INSURANCE_ODATA_QUERIES.SELECT_ALL_FIELDS}`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: InsuranceDataverse[] = Array.isArray(value)
        ? (value as InsuranceDataverse[])
        : [];

      return items.map((item) => InsuranceMapper.dataverseToInternal(item));
    } catch (error) {
      this.logger.error(
        `Error finding expiring soon Insurance - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve expiring soon Insurance',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Update an existing Insurance certificate
   *
   * IMPORTANT: Only mutable fields can be updated
   * - osot_insurance_status
   * - osot_endorsement_description
   * - osot_endorsement_effective_date
   * - osot_privilege
   * - osot_access_modifiers
   *
   * @param id - Insurance GUID
   * @param data - Partial Insurance data (only changed fields)
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Updated Insurance
   */
  async update(
    id: string,
    data: Partial<InsuranceInternal>,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceInternal> {
    const opId = operationId || `update_insurance_${Date.now()}`;

    try {
      this.logger.log(`Updating Insurance: ${id} - Operation: ${opId}`);

      // Verify insurance exists and belongs to organization
      const existing = await this.findById(id, organizationGuid, opId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance not found or does not belong to organization',
          operationId: opId,
        });
      }

      // Filter out immutable fields
      const updateData: Partial<InsuranceInternal> = {};

      if (data.osot_insurance_status !== undefined)
        updateData.osot_insurance_status = data.osot_insurance_status;
      if (data.osot_endorsement_description !== undefined)
        updateData.osot_endorsement_description =
          data.osot_endorsement_description;
      if (data.osot_endorsement_effective_date !== undefined)
        updateData.osot_endorsement_effective_date =
          data.osot_endorsement_effective_date;
      if (data.osot_privilege !== undefined)
        updateData.osot_privilege = data.osot_privilege;
      if (data.osot_access_modifiers !== undefined)
        updateData.osot_access_modifiers = data.osot_access_modifiers;

      if (Object.keys(updateData).length === 0) {
        this.logger.warn(`No mutable fields to update - Operation: ${opId}`, {
          insuranceId: id,
        });
        return existing;
      }

      // Map Internal → Dataverse
      const dataversePayload = InsuranceMapper.internalToDataverse(updateData);

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${INSURANCE_ENTITY.collectionName}(${id})`;

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
          message: 'Insurance updated but could not be retrieved',
          operationId: opId,
          insuranceId: id,
        });
      }

      this.logger.log(
        `Insurance updated successfully: ${id} - Operation: ${opId}`,
      );

      return updated;
    } catch (error) {
      this.logger.error(
        `Error updating Insurance: ${id} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to update Insurance',
        operationId: opId,
        insuranceId: id,
        originalError: error,
      });
    }
  }

  /**
   * Delete an Insurance certificate (soft delete - set status to CANCELLED)
   *
   * @param id - Insurance GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns True if deleted successfully
   */
  async delete(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `delete_insurance_${Date.now()}`;

    try {
      this.logger.log(`Soft deleting Insurance: ${id} - Operation: ${opId}`);

      // Verify insurance exists and belongs to organization
      const existing = await this.findById(id, organizationGuid, opId);
      if (!existing) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Insurance not found or does not belong to organization',
          operationId: opId,
        });
      }

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${INSURANCE_ENTITY.collectionName}(${id})`;

      // Set status to CANCELLED (soft delete)
      await this.dataverseService.request(
        'PATCH',
        endpoint,
        { osot_insurance_status: 5 }, // 5 = CANCELLED
        credentials,
      );

      this.logger.log(
        `Insurance soft deleted successfully: ${id} - Operation: ${opId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting Insurance: ${id} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to delete Insurance',
        operationId: opId,
        insuranceId: id,
        originalError: error,
      });
    }
  }

  /**
   * Hard delete an Insurance certificate (permanent removal)
   *
   * WARNING: Irreversible operation. Use only for data cleanup/GDPR compliance.
   *
   * @param id - Insurance GUID
   * @returns True if deleted successfully
   */
  async hardDelete(id: string, operationId?: string): Promise<boolean> {
    const opId = operationId || `hard_delete_insurance_${Date.now()}`;

    try {
      this.logger.warn(`Hard deleting Insurance: ${id} - Operation: ${opId}`);

      const credentials = this.dataverseService.getCredentialsByApp('main');

      const endpoint = `${INSURANCE_ENTITY.collectionName}(${id})`;

      await this.dataverseService.request(
        'DELETE',
        endpoint,
        null,
        credentials,
      );

      this.logger.warn(
        `Insurance hard deleted successfully: ${id} - Operation: ${opId}`,
      );

      return true;
    } catch (error) {
      this.logger.error(
        `Error hard deleting Insurance: ${id} - Operation: ${opId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to hard delete Insurance',
        operationId: opId,
        insuranceId: id,
        originalError: error,
      });
    }
  }

  /**
   * Check if Insurance exists by ID
   *
   * @param id - Insurance GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns True if exists, false otherwise
   */
  async exists(
    id: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean> {
    const insurance = await this.findById(id, organizationGuid, operationId);
    return insurance !== null;
  }

  /**
   * Count Insurance certificates matching filters
   *
   * @param filters - Filter conditions
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Count of matching Insurance certificates
   */
  async count(
    filters: Record<string, any>,
    organizationGuid: string,
    _operationId?: string,
  ): Promise<number> {
    const operationId = _operationId || `count_insurance_${Date.now()}`;

    try {
      this.logger.debug(
        `Counting Insurance with filters - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Build filter string
      const filterString = this.buildFilterString(filters, organizationGuid);

      let endpoint = `${INSURANCE_ENTITY.collectionName}/$count`;
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
        `Error counting Insurance - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to count Insurance',
        operationId,
        originalError: error,
      });
    }
  }

  /**
   * Count active Insurance certificates
   *
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns Count of active Insurance certificates
   */
  async countActive(
    organizationGuid: string,
    operationId?: string,
  ): Promise<number> {
    return this.count(
      { insuranceStatus: 3 }, // 3 = ACTIVE
      organizationGuid,
      operationId,
    );
  }

  /**
   * Check if account has at least one active Insurance
   *
   * @param accountGuid - Account GUID
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @returns True if account has active insurance, false otherwise
   */
  async hasActiveInsurance(
    accountGuid: string,
    organizationGuid: string,
    operationId?: string,
  ): Promise<boolean> {
    const count = await this.count(
      { accountGuid, insuranceStatus: 3 }, // 3 = ACTIVE
      organizationGuid,
      operationId,
    );
    return count > 0;
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

    // Extract GUID from URL: /osot_table_insurances(guid)
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
      `${INSURANCE_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`,
    );

    // Insurance status filter
    if (filters.insuranceStatus !== undefined) {
      conditions.push(
        `${INSURANCE_FIELDS.INSURANCE_STATUS} eq ${filters.insuranceStatus}`,
      );
    }

    // Insurance type filter
    if (filters.insuranceType) {
      conditions.push(
        `${INSURANCE_FIELDS.INSURANCE_TYPE} eq '${filters.insuranceType}'`,
      );
    }

    // Account GUID filter
    if (filters.accountGuid) {
      conditions.push(
        `${INSURANCE_FIELDS.ACCOUNT_LOOKUP_VALUE} eq '${filters.accountGuid}'`,
      );
    }

    // Order GUID filter
    if (filters.orderGuid) {
      conditions.push(
        `${INSURANCE_FIELDS.ORDER_LOOKUP_VALUE} eq '${filters.orderGuid}'`,
      );
    }

    // Effective date range filters
    if (filters.effectiveDateFrom) {
      conditions.push(
        `${INSURANCE_FIELDS.EFFECTIVE_DATE} ge '${filters.effectiveDateFrom}'`,
      );
    }
    if (filters.effectiveDateTo) {
      conditions.push(
        `${INSURANCE_FIELDS.EFFECTIVE_DATE} le '${filters.effectiveDateTo}'`,
      );
    }

    // Expiry date range filters
    if (filters.expiryDateFrom) {
      conditions.push(
        `${INSURANCE_FIELDS.EXPIRY_DATE} ge '${filters.expiryDateFrom}'`,
      );
    }
    if (filters.expiryDateTo) {
      conditions.push(
        `${INSURANCE_FIELDS.EXPIRY_DATE} le '${filters.expiryDateTo}'`,
      );
    }

    return conditions.join(' and ');
  }

  /**
   * Find all Insurance certificates created in the last 24 hours
   *
   * Business Use: Daily report generation for admin review
   * Returns all insurances created/modified in the last 24 hours (not filtered by status)
   *
   * @param organizationGuid - Organization GUID for multi-tenant filtering
   * @param fromDate - Start of 24-hour window (Date object)
   * @param operationId - Operation tracking ID
   * @returns Array of Insurance certificates created in last 24h
   */
  async findLast24Hours(
    organizationGuid: string,
    fromDate: Date,
    _operationId?: string,
  ): Promise<InsuranceInternal[]> {
    const operationId = _operationId || `find_last_24h_insurance_${Date.now()}`;

    try {
      this.logger.debug(
        `Finding Insurance created in last 24 hours - Organization: ${organizationGuid} - Operation: ${operationId}`,
      );

      const credentials = this.dataverseService.getCredentialsByApp('main');

      // Format date to ISO string for OData comparison
      const fromDateIso = fromDate.toISOString();

      // Build filter: organization match AND created within 24h window
      const filter = `${INSURANCE_FIELDS.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}' and createdon ge ${fromDateIso}`;

      const endpoint = `${INSURANCE_ENTITY.collectionName}?$filter=${filter}&$select=${INSURANCE_ODATA_QUERIES.SELECT_ALL_FIELDS}&$orderby=createdon desc`;

      const response = (await this.dataverseService.request(
        'GET',
        endpoint,
        null,
        credentials,
      )) as { value?: unknown };

      const value = response?.value;
      const items: InsuranceDataverse[] = Array.isArray(value)
        ? (value as InsuranceDataverse[])
        : [];

      this.logger.log(
        `Found ${items.length} Insurance created in last 24h - Organization: ${organizationGuid} - Operation: ${operationId}`,
      );

      return items.map((item) => InsuranceMapper.dataverseToInternal(item));
    } catch (error) {
      this.logger.error(
        `Error finding Insurance created in last 24h - Organization: ${organizationGuid} - Operation: ${operationId}`,
        error,
      );
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to retrieve Insurance created in last 24h for report',
        organizationGuid,
        operationId,
        originalError: error,
      });
    }
  }
}
