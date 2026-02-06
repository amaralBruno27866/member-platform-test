/**
 * Membership Practices Repository
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes/ErrorMessages for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - interfaces: Implements MembershipPracticesRepository contract
 * - mappers: Uses MembershipPracticesMapper for data transformation
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT practice management needs
 * - Follows membership-employment repository pattern exactly
 * - Clean abstraction over DataverseService
 * - Structured error handling with proper logging
 * - Hard delete (no soft delete)
 */

import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { MEMBERSHIP_PRACTICES_ODATA } from '../constants/membership-practices.constants';
import { MembershipPracticesRepository } from '../interfaces/membership-practices-repository.interface';
import { MembershipPracticesInternal } from '../interfaces/membership-practices-internal.interface';
import { MembershipPracticesDataverse } from '../interfaces/membership-practices-dataverse.interface';
import { MembershipPracticesMapper } from '../mappers/membership-practices.mapper';
import { getAppForOperation } from '../../../../utils/dataverse-app.helper';

export const MEMBERSHIP_PRACTICES_REPOSITORY =
  'MEMBERSHIP_PRACTICES_REPOSITORY';

/**
 * DataverseMembershipPracticesRepository
 *
 * Repository implementation for Membership Practices entities using Microsoft Dataverse.
 * Provides a clean abstraction layer between the application and Dataverse API.
 */
@Injectable()
export class DataverseMembershipPracticesRepository
  implements MembershipPracticesRepository
{
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new practice record in Dataverse
   */
  async create(
    practiceData: Partial<MembershipPracticesInternal>,
  ): Promise<MembershipPracticesInternal> {
    try {
      // Use main app credentials for create operations
      const app = getAppForOperation('create', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = MembershipPracticesMapper.mapInternalToDataverse(
        practiceData as MembershipPracticesInternal,
        false,
      );
      const response = await this.dataverseService.request(
        'POST',
        MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME,
        payload,
        credentials,
        app,
      );

      // Map response from Dataverse
      const created = this.mapDataverseToInternal(
        response as MembershipPracticesDataverse,
      );

      // Preserve lookup GUID from original data (optional)
      // Note: Dataverse POST response doesn't return lookup fields by default
      // The practiceData already has GUID extracted from @odata.bind by mapper
      if (practiceData.osot_table_account) {
        created.osot_table_account = practiceData.osot_table_account;
      }

      return created;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find practice by Practice ID (business ID)
   */
  async findByPracticeId(
    practiceId: string,
  ): Promise<MembershipPracticesInternal | null> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${MEMBERSHIP_PRACTICES_ODATA.PRACTICE_ID} eq '${practiceId}'&$select=${MEMBERSHIP_PRACTICES_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipPracticesDataverse[];
      };
      const practice = responseData?.value?.[0];

      return practice ? this.mapDataverseToInternal(practice) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find practice by GUID
   */
  async findById(id: string): Promise<MembershipPracticesInternal | null> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$select=${MEMBERSHIP_PRACTICES_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}(${id})?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      return this.mapDataverseToInternal(
        response as MembershipPracticesDataverse,
      );
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
   * Find practice records by membership year
   */
  async findByYear(year: string): Promise<MembershipPracticesInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${MEMBERSHIP_PRACTICES_ODATA.MEMBERSHIP_YEAR} eq '${year}'&$orderby=${MEMBERSHIP_PRACTICES_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_PRACTICES_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipPracticesDataverse[];
      };
      const practices = responseData?.value || [];
      return practices.map((practice: MembershipPracticesDataverse) =>
        this.mapDataverseToInternal(practice),
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
   * Find practice records by account lookup (optional)
   */
  async findByAccountId(
    accountId: string,
  ): Promise<MembershipPracticesInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${MEMBERSHIP_PRACTICES_ODATA.ACCOUNT_VALUE} eq ${accountId}&$orderby=${MEMBERSHIP_PRACTICES_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_PRACTICES_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipPracticesDataverse[];
      };
      const practices = responseData?.value || [];
      return practices.map((practice: MembershipPracticesDataverse) =>
        this.mapDataverseToInternal(practice),
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
   * Find practice by user (account) and year
   * Business rule: one practice record per user per year
   */
  async findByUserAndYear(
    userId: string,
    year: string,
  ): Promise<MembershipPracticesInternal | null> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Convert Business ID to GUID
      const account = await this.dataverseService.request(
        'GET',
        `osot_table_accounts?$filter=osot_account_id eq '${userId}'&$select=osot_table_accountid&$top=1`,
        undefined,
        credentials,
        app,
      );
      const accountData = account as {
        value: Array<{ osot_table_accountid: string }>;
      };
      if (!accountData.value || accountData.value.length === 0) {
        throw new Error(`Account not found: ${userId}`);
      }
      const userGuid = accountData.value[0].osot_table_accountid;

      // Use OData _value field for lookup in queries with GUID
      const oDataQuery = `$filter=${MEMBERSHIP_PRACTICES_ODATA.ACCOUNT_VALUE} eq ${userGuid} and ${MEMBERSHIP_PRACTICES_ODATA.MEMBERSHIP_YEAR} eq '${year}'&$select=${MEMBERSHIP_PRACTICES_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipPracticesDataverse[];
      };
      const practice = responseData?.value?.[0];

      return practice ? this.mapDataverseToInternal(practice) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update practice by Practice ID
   */
  async update(
    practiceId: string,
    updateData: Partial<MembershipPracticesInternal>,
  ): Promise<MembershipPracticesInternal> {
    try {
      // First find the record to get the GUID
      const existing = await this.findByPracticeId(practiceId);
      if (!existing?.osot_table_membership_practiceid) {
        throw new Error(`Practice record with ID ${practiceId} not found`);
      }

      // Use main app credentials for update operations
      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = MembershipPracticesMapper.mapInternalToDataverse(
        updateData as MembershipPracticesInternal,
        true,
      );
      await this.dataverseService.request(
        'PATCH',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}(${existing.osot_table_membership_practiceid})`,
        payload,
        credentials,
        app,
      );

      // Return the updated data
      return this.mapDataverseToInternal({
        ...existing,
        ...payload,
        osot_table_membership_practiceid:
          existing.osot_table_membership_practiceid,
      } as MembershipPracticesDataverse);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update practice by GUID
   */
  async updateById(
    id: string,
    updateData: Partial<MembershipPracticesInternal>,
  ): Promise<MembershipPracticesInternal> {
    try {
      // Use main app credentials for update operations
      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = MembershipPracticesMapper.mapInternalToDataverse(
        updateData as MembershipPracticesInternal,
        true,
      );
      await this.dataverseService.request(
        'PATCH',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}(${id})`,
        payload,
        credentials,
        app,
      );

      // Return updated record
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated practice record');
      }

      return updated;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Delete practice by Practice ID (hard delete)
   */
  async delete(practiceId: string): Promise<void> {
    try {
      // First find the record to get the GUID
      const existing = await this.findByPracticeId(practiceId);
      if (!existing?.osot_table_membership_practiceid) {
        throw new Error(`Practice record with ID ${practiceId} not found`);
      }

      // Use main app credentials for delete operations
      const app = getAppForOperation('delete', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Hard delete
      await this.dataverseService.request(
        'DELETE',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}(${existing.osot_table_membership_practiceid})`,
        undefined,
        credentials,
        app,
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
   * Delete practice by GUID (hard delete)
   */
  async deleteById(id: string): Promise<void> {
    try {
      // Use main app credentials for delete operations
      const app = getAppForOperation('delete', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Hard delete
      await this.dataverseService.request(
        'DELETE',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}(${id})`,
        undefined,
        credentials,
        app,
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
   * List all practice records with pagination
   */
  async findAll(options?: {
    skip?: number;
    top?: number;
    orderBy?: string;
  }): Promise<MembershipPracticesInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const skip = options?.skip || 0;
      const top = options?.top || 50;
      const orderBy =
        options?.orderBy || `${MEMBERSHIP_PRACTICES_ODATA.CREATED_ON} desc`;

      const oDataQuery = `$skip=${skip}&$top=${top}&$orderby=${orderBy}&$select=${MEMBERSHIP_PRACTICES_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipPracticesDataverse[];
      };
      const practices = responseData?.value || [];
      return practices.map((practice: MembershipPracticesDataverse) =>
        this.mapDataverseToInternal(practice),
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
   * Count total practice records
   */
  async count(): Promise<number> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = '$count=true&$top=1';
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { '@odata.count'?: number };
      return responseData?.['@odata.count'] || 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Check if a practice record exists for user and year (uniqueness validation)
   */
  async existsByUserAndYear(userId: string, year: string): Promise<boolean> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Use OData _value field for lookup in queries
      const filterQuery = `${MEMBERSHIP_PRACTICES_ODATA.ACCOUNT_VALUE} eq ${userId} and ${MEMBERSHIP_PRACTICES_ODATA.MEMBERSHIP_YEAR} eq '${year}'`;
      const oDataQuery = `$filter=${filterQuery}&$count=true&$top=1`;

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { '@odata.count'?: number };
      return (responseData?.['@odata.count'] || 0) > 0;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find practice records by clients age (multi-select filter)
   */
  async findByClientsAge(
    clientsAge: number,
  ): Promise<MembershipPracticesInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // For multi-select fields, use contains operator
      const oDataQuery = `$filter=contains(${MEMBERSHIP_PRACTICES_ODATA.CLIENTS_AGE}, '${clientsAge}')&$orderby=${MEMBERSHIP_PRACTICES_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_PRACTICES_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_PRACTICES_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipPracticesDataverse[];
      };
      const practices = responseData?.value || [];
      return practices.map((practice: MembershipPracticesDataverse) =>
        this.mapDataverseToInternal(practice),
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
   * Transform raw Dataverse data to internal format
   */
  mapDataverseToInternal(
    dataverseData: MembershipPracticesDataverse,
  ): MembershipPracticesInternal {
    return MembershipPracticesMapper.mapDataverseToInternal(dataverseData);
  }

  /**
   * Transform internal data to Dataverse format
   */
  mapInternalToDataverse(
    internalData: Partial<MembershipPracticesInternal>,
  ): Partial<MembershipPracticesDataverse> {
    return MembershipPracticesMapper.mapInternalToDataverse(
      internalData as MembershipPracticesInternal,
      true,
    );
  }
}
