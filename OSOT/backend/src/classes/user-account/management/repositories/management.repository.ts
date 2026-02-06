/**
 * Management Repository Implementation
 * Handles data access operations for Management records in Dataverse.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - interfaces: Implements ManagementRepository contract
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT needs
 * - Clean abstraction over DataverseService
 * - Follows affiliate repository pattern exactly
 */

import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';

// Import interfaces and constants
import { ManagementInternal } from '../interfaces/management-internal.interface';
import { DataverseManagement } from '../interfaces/management-dataverse.interface';
import { ManagementRepository } from '../interfaces/management-repository.interface';
import {
  MANAGEMENT_ODATA,
  MANAGEMENT_FIELDS,
} from '../constants/management.constants';

// Import mappers
import {
  mapDataverseToInternal,
  mapInternalToDataverse,
} from '../mappers/management.mapper';

// Type definitions for Dataverse responses
interface DataverseCollectionResponse {
  value: DataverseManagement[];
  '@odata.count'?: number;
}

@Injectable()
export class ManagementRepositoryService implements ManagementRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Map ManagementInternal to Dataverse payload format
   * Handles OData binding and field transformations for Dataverse API
   * @param internal Management internal data
   * @returns Dataverse-compatible payload
   */
  private mapInternalToDataverse(
    internal: Partial<ManagementInternal>,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...internal };

    // Handle OData binding for account relationship
    if ('osot_Table_Account@odata.bind' in internal) {
      const odataBinding = (internal as Record<string, unknown>)[
        'osot_Table_Account@odata.bind'
      ];
      if (odataBinding && typeof odataBinding === 'string') {
        payload['osot_Table_Account@odata.bind'] = odataBinding;
      }
    }

    return payload;
  }

  /**
   * Create a new management record
   */
  async create(
    internal: Partial<ManagementInternal>,
  ): Promise<Record<string, unknown>> {
    try {
      // Transform internal data to Dataverse payload format
      const payload = this.mapInternalToDataverse(internal);

      const response = await this.dataverseService.request(
        'POST',
        MANAGEMENT_ODATA.TABLE_NAME,
        payload,
      );

      // Log dos dados persistidos com sucesso
      console.log('✅ [MANAGEMENT] Dados persistidos no Dataverse:');
      console.log(JSON.stringify(response, null, 2));

      return response as Record<string, unknown>;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find management by GUID identifier
   */
  async findByGuid(guid: string): Promise<Record<string, unknown> | undefined> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}(${guid})`,
      );

      return response as Record<string, unknown> | undefined;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return undefined;
      }
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update management by GUID with new data using Update-then-Fetch pattern
   */
  async updateByGuid(
    guid: string,
    payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    try {
      // Update the record in Dataverse
      await this.dataverseService.request(
        'PATCH',
        `${MANAGEMENT_ODATA.TABLE_NAME}(${guid})`,
        payload,
      );

      // Fetch and return the updated record (Update-then-Fetch pattern)
      const updatedRecord = await this.findByGuid(guid);

      if (!updatedRecord) {
        throw new Error(`Management record not found after update: ${guid}`);
      }

      return updatedRecord;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Delete management by GUID
   */
  async deleteByGuid(guid: string): Promise<void> {
    try {
      await this.dataverseService.request(
        'DELETE',
        `${MANAGEMENT_ODATA.TABLE_NAME}(${guid})`,
      );
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find all management records associated with an account using USER_BUSINESS_ID
   */
  async findByAccountId(accountId: string): Promise<Record<string, unknown>[]> {
    try {
      // CORREÇÃO: Usar user_business_id ao invés de lookup complexo
      // Seguindo o padrão das outras entidades (address, ot-education, ota-education)
      const query = `$filter=${MANAGEMENT_ODATA.USER_BUSINESS_ID} eq '${accountId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return collectionResponse?.value || [];
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find specific management by business ID
   */
  async findByBusinessId(
    businessId: string,
  ): Promise<Record<string, unknown> | undefined> {
    try {
      const query = `$filter=${MANAGEMENT_FIELDS.USER_BUSINESS_ID} eq '${businessId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? records[0] : undefined;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Advanced multi-criteria management search with flags and permissions
   */
  async search(criteria: {
    accountId?: string;
    lifeMemberRetired?: boolean;
    shadowing?: boolean;
    passedAway?: boolean;
    vendor?: boolean;
    advertising?: boolean;
    recruitment?: boolean;
    driverRehab?: boolean;
    accessModifiers?: number[];
    privilege?: number[];
    limit?: number;
  }): Promise<{
    results: Record<string, unknown>[];
    totalCount: number;
  }> {
    try {
      const filters: string[] = [];

      if (criteria.accountId) {
        filters.push(
          `${MANAGEMENT_FIELDS.TABLE_ACCOUNT} eq '${criteria.accountId}'`,
        );
      }
      if (criteria.lifeMemberRetired !== undefined) {
        filters.push(
          `${MANAGEMENT_FIELDS.LIFE_MEMBER_RETIRED} eq ${criteria.lifeMemberRetired ? 1 : 0}`,
        );
      }
      if (criteria.shadowing !== undefined) {
        filters.push(
          `${MANAGEMENT_FIELDS.SHADOWING} eq ${criteria.shadowing ? 1 : 0}`,
        );
      }
      if (criteria.passedAway !== undefined) {
        filters.push(
          `${MANAGEMENT_FIELDS.PASSED_AWAY} eq ${criteria.passedAway ? 1 : 0}`,
        );
      }
      if (criteria.vendor !== undefined) {
        filters.push(
          `${MANAGEMENT_FIELDS.VENDOR} eq ${criteria.vendor ? 1 : 0}`,
        );
      }
      if (criteria.advertising !== undefined) {
        filters.push(
          `${MANAGEMENT_FIELDS.ADVERTISING} eq ${criteria.advertising ? 1 : 0}`,
        );
      }
      if (criteria.recruitment !== undefined) {
        filters.push(
          `${MANAGEMENT_FIELDS.RECRUITMENT} eq ${criteria.recruitment ? 1 : 0}`,
        );
      }
      if (criteria.driverRehab !== undefined) {
        filters.push(
          `${MANAGEMENT_FIELDS.DRIVER_REHAB} eq ${criteria.driverRehab ? 1 : 0}`,
        );
      }
      if (criteria.accessModifiers && criteria.accessModifiers.length > 0) {
        const modifierFilter = criteria.accessModifiers
          .map((m) => `${MANAGEMENT_FIELDS.ACCESS_MODIFIERS} eq ${m}`)
          .join(' or ');
        filters.push(`(${modifierFilter})`);
      }
      if (criteria.privilege && criteria.privilege.length > 0) {
        const privilegeFilter = criteria.privilege
          .map((p) => `${MANAGEMENT_FIELDS.PRIVILEGE} eq ${p}`)
          .join(' or ');
        filters.push(`(${privilegeFilter})`);
      }

      const filterQuery =
        filters.length > 0 ? `$filter=${filters.join(' and ')}` : '';
      const countQuery = '$count=true';
      const limitQuery = criteria.limit ? `&$top=${criteria.limit}` : '';
      const orderQuery = `&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`;

      const query = `${countQuery}${filterQuery ? '&' + filterQuery : ''}${limitQuery}${orderQuery}`;

      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const results = collectionResponse?.value || [];
      const totalCount = collectionResponse?.['@odata.count'] || 0;

      return { results, totalCount };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find management records by vendor status
   */
  async findVendors(
    includeInactive?: boolean,
  ): Promise<Record<string, unknown>[]> {
    try {
      const filters = [`${MANAGEMENT_FIELDS.VENDOR} eq 1`];
      if (!includeInactive) {
        filters.push(`${MANAGEMENT_FIELDS.PASSED_AWAY} eq 0`);
      }

      const query = `$filter=${filters.join(' and ')}&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return collectionResponse?.value || [];
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find management records by recruitment permission
   */
  async findRecruitmentEnabled(): Promise<Record<string, unknown>[]> {
    try {
      const query = `$filter=${MANAGEMENT_FIELDS.RECRUITMENT} eq 1&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return collectionResponse?.value || [];
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find management records offering shadowing services
   */
  async findShadowingAvailable(): Promise<Record<string, unknown>[]> {
    try {
      const query = `$filter=${MANAGEMENT_FIELDS.SHADOWING} eq 1&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return collectionResponse?.value || [];
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find life members (retired or active)
   */
  async findLifeMembers(
    retiredOnly?: boolean,
  ): Promise<Record<string, unknown>[]> {
    try {
      const query = retiredOnly
        ? `$filter=${MANAGEMENT_FIELDS.LIFE_MEMBER_RETIRED} eq 1&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`
        : `$filter=${MANAGEMENT_FIELDS.LIFE_MEMBER_RETIRED} eq 1&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`;

      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return collectionResponse?.value || [];
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find records by administrative privilege level
   */
  async findByPrivilege(privilege: number): Promise<Record<string, unknown>[]> {
    try {
      const query = `$filter=${MANAGEMENT_FIELDS.PRIVILEGE} eq ${privilege}&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      return collectionResponse?.value || [];
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  // Placeholder implementations for complex methods
  getManagementStatistics(): Promise<any> {
    return Promise.reject(
      new Error('Method not implemented - getManagementStatistics'),
    );
  }

  getSystemAnalytics(): Promise<any> {
    return Promise.reject(
      new Error('Method not implemented - getSystemAnalytics'),
    );
  }

  bulkUpdate(): Promise<any> {
    return Promise.reject(new Error('Method not implemented - bulkUpdate'));
  }

  validateBusinessRules(): Promise<any> {
    return Promise.reject(
      new Error('Method not implemented - validateBusinessRules'),
    );
  }

  findConflicts(): Promise<any> {
    return Promise.reject(new Error('Method not implemented - findConflicts'));
  }

  deactivateAccount(): Promise<void> {
    return Promise.reject(
      new Error('Method not implemented - deactivateAccount'),
    );
  }

  reactivateAccount(): Promise<void> {
    return Promise.reject(
      new Error('Method not implemented - reactivateAccount'),
    );
  }

  getAuditTrail(): Promise<any> {
    return Promise.reject(new Error('Method not implemented - getAuditTrail'));
  }

  /**
   * Find management record by account management ID
   */
  async findByAccountManagementId(
    accountManagementId: string,
  ): Promise<ManagementInternal | null> {
    try {
      const query = `$filter=${MANAGEMENT_FIELDS.ACCOUNT_MANAGEMENT_ID} eq '${accountManagementId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0 ? this.mapFromDataverse(records[0]) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update management record by ID
   */
  async update(
    managementId: string,
    updateData: Partial<ManagementInternal>,
  ): Promise<ManagementInternal> {
    try {
      const payload = this.mapToDataverse(updateData);
      const response = await this.dataverseService.request(
        'PATCH',
        `${MANAGEMENT_ODATA.TABLE_NAME}(${managementId})`,
        payload,
      );

      return this.mapFromDataverse(response as DataverseManagement);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Delete management record by ID (soft delete)
   */
  async delete(managementId: string): Promise<boolean> {
    try {
      await this.dataverseService.request(
        'DELETE',
        `${MANAGEMENT_ODATA.TABLE_NAME}(${managementId})`,
      );
      return true;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if management record exists by ID
   */
  async exists(managementId: string): Promise<boolean> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}(${managementId})?$select=${MANAGEMENT_FIELDS.TABLE_ACCOUNT_MANAGEMENT_ID}`,
      );
      return !!response;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return false;
      }
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find all active management records (not passed away)
   */
  async findAllActive(): Promise<ManagementInternal[]> {
    try {
      const query = MANAGEMENT_ODATA.QUERY_PATTERNS.ACTIVE_USERS;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record) => this.mapFromDataverse(record));
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find all vendor accounts
   */
  async findAllVendors(): Promise<ManagementInternal[]> {
    try {
      const query = MANAGEMENT_ODATA.QUERY_PATTERNS.VENDORS;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record) => this.mapFromDataverse(record));
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find all life member retired accounts
   */
  async findAllLifeMembers(): Promise<ManagementInternal[]> {
    try {
      const query = MANAGEMENT_ODATA.QUERY_PATTERNS.LIFE_MEMBERS;
      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record) => this.mapFromDataverse(record));
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find management records with pagination
   */
  async findAllPaginated(
    page: number = 1,
    pageSize: number = 50,
  ): Promise<{
    records: ManagementInternal[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const skip = (page - 1) * pageSize;
      const query = `$count=true&$skip=${skip}&$top=${pageSize}&${MANAGEMENT_ODATA.DEFAULT_ORDER_BY}`;

      const response = await this.dataverseService.request(
        'GET',
        `${MANAGEMENT_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      const totalCount = collectionResponse?.['@odata.count'] || 0;

      return {
        records: records.map((record) => this.mapFromDataverse(record)),
        totalCount,
        page,
        pageSize,
      };
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Transform Dataverse response to internal format
   */
  private mapFromDataverse(dataverse: DataverseManagement): ManagementInternal {
    return mapDataverseToInternal(dataverse);
  }

  /**
   * Transform internal format to Dataverse format
   */
  private mapToDataverse(
    internal: Partial<ManagementInternal>,
  ): Partial<DataverseManagement> {
    return mapInternalToDataverse(internal);
  }
}
