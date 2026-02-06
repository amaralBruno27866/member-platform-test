/**
 * OT Education Repository Implementation (SIMPLIFIED)
 * Handles data access operations for OT Education records in Dataverse.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - interfaces: Implements OtEducationRepository contract
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT needs
 * - Clean abstraction over DataverseService
 * - Follows Address repository pattern exactly
 */

import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { createAppError } from '../../../../common/errors/error.factory';

// Import interfaces and constants
import { OtEducationInternal } from '../interfaces/ot-education-internal.interface';
import { DataverseOtEducation } from '../interfaces/ot-education-dataverse.interface';
import { OtEducationRepository } from '../interfaces/ot-education-repository.interface';
import { OT_EDUCATION_ODATA } from '../constants/ot-education.constants';

// Type definitions for Dataverse responses
interface DataverseCollectionResponse {
  value: DataverseOtEducation[];
  '@odata.count'?: number;
}

@Injectable()
export class OtEducationRepositoryService implements OtEducationRepository {
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new OT education record
   */
  async create(
    educationData: Partial<OtEducationInternal>,
  ): Promise<OtEducationInternal> {
    try {
      const payload = this.mapInternalToDataverse(educationData);

      const response = await this.dataverseService.request(
        'POST',
        OT_EDUCATION_ODATA.TABLE_NAME,
        payload,
      );

      // Log dos dados persistidos com sucesso
      console.log('✅ [OT-EDUCATION] Dados persistidos no Dataverse:');
      console.log(JSON.stringify(response, null, 2));

      return this.mapDataverseToInternal(response as DataverseOtEducation);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find OT education by ID
   */
  async findById(educationId: string): Promise<OtEducationInternal | null> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${OT_EDUCATION_ODATA.TABLE_NAME}(${educationId})`,
      );

      return response
        ? this.mapDataverseToInternal(response as DataverseOtEducation)
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
   * Find OT education records by account ID (GUID)
   * Uses _osot_table_account_value lookup field (Dataverse format for lookups)
   */
  async findByAccountId(accountId: string): Promise<OtEducationInternal[]> {
    try {
      // Dataverse lookup fields require _fieldname_value format for filtering
      const filter = `_osot_table_account_value eq ${accountId}`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}`;
      const response = await this.dataverseService.request('GET', endpoint);

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: DataverseOtEducation) =>
        this.mapDataverseToInternal(record),
      );
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_ot_education_by_account',
        accountId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Find OT education records by user (owner)
   */
  async findByUserId(userId: string): Promise<OtEducationInternal[]> {
    try {
      const query = `$filter=${OT_EDUCATION_ODATA.OWNER_ID} eq '${userId}'`;
      const response = await this.dataverseService.request(
        'GET',
        `${OT_EDUCATION_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: DataverseOtEducation) =>
        this.mapDataverseToInternal(record),
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
   * Find OT education by business ID (osot_ot_education_id)
   */
  async findByBusinessId(
    businessId: string,
  ): Promise<OtEducationInternal | null> {
    try {
      const filter = `${OT_EDUCATION_ODATA.AUTO_ID} eq '${businessId}'`;
      const endpoint = `${OT_EDUCATION_ODATA.TABLE_NAME}?$filter=${encodeURIComponent(filter)}&$top=1`;
      const response = await this.dataverseService.request('GET', endpoint);

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.length > 0
        ? this.mapDataverseToInternal(records[0])
        : null;
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'find_ot_education_by_business_id',
        businessId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update OT education by ID
   */
  async update(
    educationId: string,
    updateData: Partial<OtEducationInternal>,
  ): Promise<OtEducationInternal> {
    try {
      const payload = this.mapInternalToDataverse(updateData);

      // Update the record
      await this.dataverseService.request(
        'PATCH',
        `${OT_EDUCATION_ODATA.TABLE_NAME}(${educationId})`,
        payload,
      );

      // Fetch the updated record
      const updatedRecord = await this.findById(educationId);
      if (!updatedRecord) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          operation: 'update_ot_education',
          entityId: educationId,
          entityType: 'OtEducation',
          message: 'Updated record not found',
        });
      }

      return updatedRecord;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        throw error; // Re-throw app errors as-is
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'update_ot_education',
        entityId: educationId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete OT education by ID (soft delete)
   */
  async delete(educationId: string): Promise<boolean> {
    try {
      await this.dataverseService.request(
        'DELETE',
        `${OT_EDUCATION_ODATA.TABLE_NAME}(${educationId})`,
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
   * Check if OT education exists
   */
  async exists(educationId: string): Promise<boolean> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${OT_EDUCATION_ODATA.TABLE_NAME}(${educationId})`,
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
   * Find OT education records by COTO registration (for duplicate checking)
   */
  async findByCotoRegistration(
    cotoRegistration: string,
    accountId?: string,
  ): Promise<OtEducationInternal[]> {
    try {
      let query = `$filter=${OT_EDUCATION_ODATA.COTO_REGISTRATION} eq '${cotoRegistration}'`;
      if (accountId) {
        query += ` and ${OT_EDUCATION_ODATA.ACCOUNT_LOOKUP} ne '${accountId}'`;
      }

      const response = await this.dataverseService.request(
        'GET',
        `${OT_EDUCATION_ODATA.TABLE_NAME}?${query}`,
      );

      const collectionResponse = response as DataverseCollectionResponse;
      const records = collectionResponse?.value || [];
      return records.map((record: DataverseOtEducation) =>
        this.mapDataverseToInternal(record),
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
   * Count OT education records for account
   */
  async countByAccountId(accountId: string): Promise<number> {
    try {
      const query = `$filter=${OT_EDUCATION_ODATA.ACCOUNT_LOOKUP} eq '${accountId}'&$count=true`;
      const response = await this.dataverseService.request(
        'GET',
        `${OT_EDUCATION_ODATA.TABLE_NAME}?${query}`,
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
   * Raw Dataverse query for complex scenarios
   */
  async queryRaw(oDataQuery: string): Promise<DataverseOtEducation[]> {
    try {
      const response = await this.dataverseService.request(
        'GET',
        `${OT_EDUCATION_ODATA.TABLE_NAME}?${oDataQuery}`,
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
   * Batch operations for multiple OT education records
   */
  async batchCreate(
    educations: Partial<OtEducationInternal>[],
  ): Promise<OtEducationInternal[]> {
    try {
      const results: OtEducationInternal[] = [];

      for (const education of educations) {
        const result = await this.create(education);
        results.push(result);
      }

      return results;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Health check - verify repository can connect to Dataverse
   */
  async healthCheck(): Promise<{
    isHealthy: boolean;
    message: string;
    timestamp: string;
  }> {
    try {
      await this.dataverseService.request(
        'GET',
        `${OT_EDUCATION_ODATA.TABLE_NAME}?$top=1&$select=${OT_EDUCATION_ODATA.EDUCATION_ID}`,
      );

      return {
        isHealthy: true,
        message: 'OT Education repository is healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: `Health check failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS - DATA MAPPING
  // =============================================================================

  /**
   * Map internal data model to Dataverse model
   */
  private mapInternalToDataverse(
    internal: Partial<OtEducationInternal>,
  ): Record<string, unknown> {
    const dataverse: Record<string, unknown> = {};

    // Account relationship (required for creation) - handle @odata.bind directly
    const internalWithBinding = internal as Partial<OtEducationInternal> & {
      'osot_Table_Account@odata.bind'?: string;
    };
    const odataBinding = internalWithBinding['osot_Table_Account@odata.bind'];
    if (
      odataBinding &&
      typeof odataBinding === 'string' &&
      odataBinding.trim() !== ''
    ) {
      // Use direct binding assignment instead of constant to ensure correct OData format
      dataverse['osot_Table_Account@odata.bind'] = odataBinding;
    }

    // Map all available fields using correct property names from the internal interface
    if (internal.osot_user_business_id !== undefined) {
      dataverse[OT_EDUCATION_ODATA.USER_BUSINESS_ID] =
        internal.osot_user_business_id;
    }
    if (internal.osot_coto_status !== undefined) {
      dataverse[OT_EDUCATION_ODATA.COTO_STATUS] = internal.osot_coto_status;
    }
    if (internal.osot_coto_registration !== undefined) {
      dataverse[OT_EDUCATION_ODATA.COTO_REGISTRATION] =
        internal.osot_coto_registration;
    }
    if (internal.osot_ot_degree_type !== undefined) {
      dataverse[OT_EDUCATION_ODATA.OT_DEGREE_TYPE] =
        internal.osot_ot_degree_type;
    }
    if (internal.osot_ot_university !== undefined) {
      dataverse[OT_EDUCATION_ODATA.OT_UNIVERSITY] = internal.osot_ot_university;
    }
    if (internal.osot_ot_grad_year !== undefined) {
      dataverse[OT_EDUCATION_ODATA.OT_GRAD_YEAR] = internal.osot_ot_grad_year;
    }
    if (internal.osot_education_category !== undefined) {
      dataverse[OT_EDUCATION_ODATA.EDUCATION_CATEGORY] =
        internal.osot_education_category;
    }
    if (internal.osot_ot_country !== undefined) {
      dataverse[OT_EDUCATION_ODATA.OT_COUNTRY] = internal.osot_ot_country;
    }
    if (internal.osot_ot_other !== undefined) {
      dataverse[OT_EDUCATION_ODATA.OT_OTHER] = internal.osot_ot_other;
    }
    if (internal.osot_access_modifiers !== undefined) {
      dataverse[OT_EDUCATION_ODATA.ACCESS_MODIFIERS] =
        internal.osot_access_modifiers;
    }
    if (internal.osot_privilege !== undefined) {
      dataverse[OT_EDUCATION_ODATA.PRIVILEGE] = internal.osot_privilege;
    }

    return dataverse;
  }

  /**
   * Map Dataverse model to internal data model
   */
  private mapDataverseToInternal(
    dataverse: DataverseOtEducation,
  ): OtEducationInternal {
    return {
      // System fields
      osot_table_ot_educationid: dataverse[OT_EDUCATION_ODATA.EDUCATION_ID],
      osot_OT_Education_ID: dataverse[OT_EDUCATION_ODATA.AUTO_ID] as string,
      // Account relationship removed - handled via @odata.bind instead
      ownerid: dataverse[OT_EDUCATION_ODATA.OWNER_ID],

      // Business fields
      osot_user_business_id: dataverse[OT_EDUCATION_ODATA.USER_BUSINESS_ID],
      osot_coto_status: dataverse[OT_EDUCATION_ODATA.COTO_STATUS],
      osot_coto_registration: dataverse[OT_EDUCATION_ODATA.COTO_REGISTRATION],
      osot_ot_degree_type: dataverse[OT_EDUCATION_ODATA.OT_DEGREE_TYPE],
      osot_ot_university: dataverse[OT_EDUCATION_ODATA.OT_UNIVERSITY],
      osot_ot_grad_year: dataverse[OT_EDUCATION_ODATA.OT_GRAD_YEAR],
      osot_education_category: this.parseEducationCategory(
        dataverse[OT_EDUCATION_ODATA.EDUCATION_CATEGORY],
      ),
      osot_ot_country: dataverse[OT_EDUCATION_ODATA.OT_COUNTRY],
      osot_ot_other: dataverse[OT_EDUCATION_ODATA.OT_OTHER],

      // Privacy fields
      osot_access_modifiers: dataverse[OT_EDUCATION_ODATA.ACCESS_MODIFIERS],
      osot_privilege: dataverse[OT_EDUCATION_ODATA.PRIVILEGE],

      // System metadata
      createdon: dataverse.createdon,
      modifiedon: dataverse.modifiedon,
    };
  }

  /**
   * Parse education category value from Dataverse
   * Handles both number and string inputs
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
}
