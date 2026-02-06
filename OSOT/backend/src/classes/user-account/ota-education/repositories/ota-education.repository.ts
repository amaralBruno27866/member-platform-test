/**
 * OTA Education Repository Implementation (SIMPLIFIED)
 * Handles data access operations for OTA Education records in Dataverse.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - interfaces: Implements OtaEducationRepository contract
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT needs
 * - Clean abstraction over DataverseService
 * - Follows OT Education repository pattern exactly
 */

import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { createAppError } from '../../../../common/errors/error.factory';

// Import interfaces and constants
import { OtaEducationInternal } from '../interfaces/ota-education-internal.interface';
import { DataverseOtaEducation } from '../interfaces/ota-education-dataverse.interface';
import { OtaEducationRepository } from '../interfaces/ota-education-repository.interface';
import {
  OTA_EDUCATION_ODATA,
  OTA_EDUCATION_FIELDS,
} from '../constants/ota-education.constants';

// Type definitions for Dataverse responses
interface DataverseCollectionResponse {
  value: DataverseOtaEducation[];
  '@odata.count'?: number;
}

@Injectable()
export class OtaEducationRepositoryService implements OtaEducationRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new OTA education record
   */
  async create(
    educationData: Partial<OtaEducationInternal>,
  ): Promise<OtaEducationInternal> {
    try {
      const payload = this.mapToDataverse(educationData);
      const response = await this.dataverseService.request(
        'POST',
        OTA_EDUCATION_ODATA.TABLE_NAME,
        payload,
      );

      // Log successful data persistence
      console.log('✅ [OTA-EDUCATION] Data persisted in Dataverse:');
      console.log(JSON.stringify(response, null, 2));

      return this.mapFromDataverse(response as DataverseOtaEducation);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find OTA education by ID
   */
  async findById(educationId: string): Promise<OtaEducationInternal | null> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${OTA_EDUCATION_ODATA.TABLE_NAME}(${educationId})`,
      );

      return response
        ? this.mapFromDataverse(response as DataverseOtaEducation)
        : null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find OTA education by business ID
   */
  async findByBusinessId(
    businessId: string,
  ): Promise<OtaEducationInternal | null> {
    try {
      const query = `$filter=${OTA_EDUCATION_FIELDS.OTA_EDUCATION_ID} eq '${businessId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${OTA_EDUCATION_ODATA.TABLE_NAME}?${query}`,
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
   * Find OTA education records by account ID (GUID)
   * Uses _osot_table_account_value lookup field (Dataverse format for lookups)
   */
  async findByAccountId(accountId: string): Promise<OtaEducationInternal[]> {
    try {
      // Dataverse lookup fields require _fieldname_value format for filtering
      const filter = `_osot_table_account_value eq ${accountId}`;
      const endpoint = `${OTA_EDUCATION_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`;
      const response = await this.dataverseService.request('GET', endpoint);

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: DataverseOtaEducation) =>
        this.mapFromDataverse(record),
      );
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_ota_education_by_account',
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find OTA education by user business ID
   */
  async findByUserBusinessId(
    userBusinessId: string,
  ): Promise<OtaEducationInternal | null> {
    try {
      const query = `$filter=${OTA_EDUCATION_FIELDS.USER_BUSINESS_ID} eq '${userBusinessId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${OTA_EDUCATION_ODATA.TABLE_NAME}?${query}`,
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
   * Update OTA education by ID
   */
  async update(
    educationId: string,
    updateData: Partial<OtaEducationInternal>,
  ): Promise<OtaEducationInternal> {
    try {
      const payload = this.mapToDataverse(updateData);

      // Update the record
      await this.dataverseService.request(
        'PATCH',
        `${OTA_EDUCATION_ODATA.TABLE_NAME}(${educationId})`,
        payload,
      );

      // Fetch the updated record
      const updatedRecord = await this.findById(educationId);
      if (!updatedRecord) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'update_ota_education',
          entityId: educationId,
          entityType: 'OtaEducation',
          message: 'Updated record not found',
        });
      }

      return updatedRecord;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'update_ota_education',
        entityId: educationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete OTA education by ID (soft delete)
   */
  async delete(educationId: string): Promise<boolean> {
    try {
      await this.dataverseService.request(
        'DELETE',
        `${OTA_EDUCATION_ODATA.TABLE_NAME}(${educationId})`,
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
   * Check if user business ID exists (for duplicate validation)
   */
  async existsByUserBusinessId(userBusinessId: string): Promise<boolean> {
    try {
      const result = await this.findByUserBusinessId(userBusinessId);
      return !!result;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find multiple OTA education records with filters
   */
  async findMany(filters: {
    accountId?: string;
    degreeType?: number;
    college?: number;
    country?: number;
    graduationYear?: number;
    workDeclaration?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<OtaEducationInternal[]> {
    try {
      const filterClauses: string[] = [];

      if (filters.accountId) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.TABLE_ACCOUNT} eq '${filters.accountId}'`,
        );
      }
      if (filters.degreeType !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.OTA_DEGREE_TYPE} eq ${filters.degreeType}`,
        );
      }
      if (filters.college !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.OTA_COLLEGE} eq ${filters.college}`,
        );
      }
      if (filters.country !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.OTA_COUNTRY} eq ${filters.country}`,
        );
      }
      if (filters.graduationYear !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.OTA_GRAD_YEAR} eq ${filters.graduationYear}`,
        );
      }
      if (filters.workDeclaration !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.WORK_DECLARATION} eq ${filters.workDeclaration}`,
        );
      }

      let query = '';
      if (filterClauses.length > 0) {
        query += `$filter=${filterClauses.join(' and ')}`;
      }

      if (filters.limit) {
        query += query ? '&' : '';
        query += `$top=${filters.limit}`;
      }

      if (filters.offset) {
        query += query ? '&' : '';
        query += `$skip=${filters.offset}`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${OTA_EDUCATION_ODATA.TABLE_NAME}${query ? '?' + query : ''}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: DataverseOtaEducation) =>
        this.mapFromDataverse(record),
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
   * Count OTA education records with filters
   */
  async count(filters: {
    accountId?: string;
    degreeType?: number;
    college?: number;
    country?: number;
    graduationYear?: number;
    workDeclaration?: boolean;
  }): Promise<number> {
    try {
      const filterClauses: string[] = [];

      if (filters.accountId) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.TABLE_ACCOUNT} eq '${filters.accountId}'`,
        );
      }
      if (filters.degreeType !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.OTA_DEGREE_TYPE} eq ${filters.degreeType}`,
        );
      }
      if (filters.college !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.OTA_COLLEGE} eq ${filters.college}`,
        );
      }
      if (filters.country !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.OTA_COUNTRY} eq ${filters.country}`,
        );
      }
      if (filters.graduationYear !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.OTA_GRAD_YEAR} eq ${filters.graduationYear}`,
        );
      }
      if (filters.workDeclaration !== undefined) {
        filterClauses.push(
          `${OTA_EDUCATION_FIELDS.WORK_DECLARATION} eq ${filters.workDeclaration}`,
        );
      }

      let query = '$count=true';
      if (filterClauses.length > 0) {
        query += `&$filter=${filterClauses.join(' and ')}`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${OTA_EDUCATION_ODATA.TABLE_NAME}?${query}`,
      );

      const countResponse = response as DataverseCollectionResponse;
      return countResponse?.['@odata.count'] || 0;
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
  mapFromDataverse(dataverse: DataverseOtaEducation): OtaEducationInternal {
    return {
      // System fields
      osot_table_ota_educationid:
        dataverse[OTA_EDUCATION_FIELDS.TABLE_OTA_EDUCATION],
      osot_ota_education_id: dataverse[OTA_EDUCATION_FIELDS.OTA_EDUCATION_ID],
      ownerid: dataverse[OTA_EDUCATION_FIELDS.OWNER_ID],
      createdon: dataverse[OTA_EDUCATION_FIELDS.CREATED_ON],
      modifiedon: dataverse[OTA_EDUCATION_FIELDS.MODIFIED_ON],

      // Account relationship - removed, handled via @odata.bind instead

      // Business fields
      osot_user_business_id: dataverse[OTA_EDUCATION_FIELDS.USER_BUSINESS_ID],
      osot_work_declaration: dataverse[OTA_EDUCATION_FIELDS.WORK_DECLARATION],
      osot_ota_degree_type: dataverse[OTA_EDUCATION_FIELDS.OTA_DEGREE_TYPE],
      osot_ota_college: dataverse[OTA_EDUCATION_FIELDS.OTA_COLLEGE],
      osot_ota_grad_year: dataverse[OTA_EDUCATION_FIELDS.OTA_GRAD_YEAR],
      osot_education_category: this.parseEducationCategory(
        dataverse[OTA_EDUCATION_FIELDS.EDUCATION_CATEGORY],
      ),
      osot_ota_country: dataverse[OTA_EDUCATION_FIELDS.OTA_COUNTRY],
      osot_ota_other: dataverse[OTA_EDUCATION_FIELDS.OTA_OTHER],
      osot_access_modifiers: dataverse[OTA_EDUCATION_FIELDS.ACCESS_MODIFIERS],
      osot_privilege: dataverse[OTA_EDUCATION_FIELDS.PRIVILEGE],
    };
  }

  /**
   * Parse education category value from Dataverse
   * Handles both number and string inputs
   * Critical: Value 0 (GRADUATED) is valid and must not be treated as falsy
   */
  private parseEducationCategory(value: unknown): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (typeof value === 'string') {
      const numValue = parseInt(value, 10);
      return isNaN(numValue) ? undefined : numValue;
    }

    return undefined;
  }

  /**
   * Transform internal format to Dataverse format
   */
  mapToDataverse(
    internal: Partial<OtaEducationInternal>,
  ): Partial<DataverseOtaEducation> {
    const dataverse: Record<string, unknown> = {};

    // Account relationship (required for creation)
    // Handle OData binding if it exists in the internal object
    const internalWithBinding = internal as OtaEducationInternal & {
      'osot_Table_Account@odata.bind'?: string;
    };
    const odataBinding = internalWithBinding['osot_Table_Account@odata.bind'];
    if (
      odataBinding &&
      typeof odataBinding === 'string' &&
      odataBinding.trim() !== ''
    ) {
      // ✅ CORRECTION: Use the binding directly, don't use TABLE_ACCOUNT constant
      dataverse['osot_Table_Account@odata.bind'] = odataBinding;
    }

    // Map business fields
    if (internal.osot_user_business_id !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.USER_BUSINESS_ID] =
        internal.osot_user_business_id;
    }
    if (internal.osot_work_declaration !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.WORK_DECLARATION] =
        internal.osot_work_declaration;
    }
    if (internal.osot_ota_degree_type !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.OTA_DEGREE_TYPE] =
        internal.osot_ota_degree_type;
    }
    if (internal.osot_ota_college !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.OTA_COLLEGE] = internal.osot_ota_college;
    }
    if (internal.osot_ota_grad_year !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.OTA_GRAD_YEAR] =
        internal.osot_ota_grad_year;
    }
    if (internal.osot_education_category !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.EDUCATION_CATEGORY] =
        internal.osot_education_category;
    }
    if (internal.osot_ota_country !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.OTA_COUNTRY] = internal.osot_ota_country;
    }
    if (internal.osot_ota_other !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.OTA_OTHER] = internal.osot_ota_other;
    }
    if (internal.osot_access_modifiers !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.ACCESS_MODIFIERS] =
        internal.osot_access_modifiers;
    }
    if (internal.osot_privilege !== undefined) {
      dataverse[OTA_EDUCATION_FIELDS.PRIVILEGE] = internal.osot_privilege;
    }

    return dataverse as Partial<DataverseOtaEducation>;
  }
}
