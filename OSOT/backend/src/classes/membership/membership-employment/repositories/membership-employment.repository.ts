/**
 * Membership Employment Repository
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes/ErrorMessages for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - interfaces: Implements MembershipEmploymentRepository contract
 * - mappers: Uses MembershipEmploymentMapper for data transformation
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT employment management needs
 * - Follows membership-preferences repository pattern exactly
 * - Clean abstraction over DataverseService
 * - Structured error handling with proper logging
 * - Hard delete (no soft delete)
 */

import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { MEMBERSHIP_EMPLOYMENT_ODATA } from '../constants/membership-employment.constants';
import { MembershipEmploymentRepository } from '../interfaces/membership-employment-repository.interface';
import { MembershipEmploymentInternal } from '../interfaces/membership-employment-internal.interface';
import { MembershipEmploymentDataverse } from '../interfaces/membership-employment-dataverse.interface';
import { MembershipEmploymentMapper } from '../mappers/membership-employment.mapper';
import { getAppForOperation } from '../../../../utils/dataverse-app.helper';

export const MEMBERSHIP_EMPLOYMENT_REPOSITORY =
  'MEMBERSHIP_EMPLOYMENT_REPOSITORY';

/**
 * DataverseMembershipEmploymentRepository
 *
 * Repository implementation for Membership Employment entities using Microsoft Dataverse.
 * Provides a clean abstraction layer between the application and Dataverse API.
 */
@Injectable()
export class DataverseMembershipEmploymentRepository
  implements MembershipEmploymentRepository
{
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new employment record in Dataverse
   */
  async create(
    employmentData: Partial<MembershipEmploymentInternal>,
  ): Promise<MembershipEmploymentInternal> {
    try {
      // Use main app credentials for create operations
      const app = getAppForOperation('create', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = MembershipEmploymentMapper.mapInternalToDataverse(
        employmentData as MembershipEmploymentInternal,
        false,
      );
      const response = await this.dataverseService.request(
        'POST',
        MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME,
        payload,
        credentials,
        app,
      );

      // Map response from Dataverse
      const created = this.mapDataverseToInternal(
        response as MembershipEmploymentDataverse,
      );

      // Preserve lookup GUIDs from original data
      // Note: Dataverse POST response doesn't return lookup fields by default
      // The employmentData already has GUIDs extracted from @odata.bind by mapper
      // XOR: Account OR Affiliate, never both
      if (employmentData.osot_table_account) {
        created.osot_table_account = employmentData.osot_table_account;
      }
      if (employmentData.osot_table_account_affiliate) {
        created.osot_table_account_affiliate =
          employmentData.osot_table_account_affiliate;
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
   * Find employment by Employment ID (business ID)
   */
  async findByEmploymentId(
    employmentId: string,
  ): Promise<MembershipEmploymentInternal | null> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${MEMBERSHIP_EMPLOYMENT_ODATA.EMPLOYMENT_ID} eq '${employmentId}'&$select=${MEMBERSHIP_EMPLOYMENT_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipEmploymentDataverse[];
      };
      const employment = responseData?.value?.[0];

      return employment ? this.mapDataverseToInternal(employment) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find employment by GUID
   */
  async findById(id: string): Promise<MembershipEmploymentInternal | null> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$select=${MEMBERSHIP_EMPLOYMENT_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}(${id})?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      return this.mapDataverseToInternal(
        response as MembershipEmploymentDataverse,
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
   * Find employment records by membership year
   */
  async findByYear(year: string): Promise<MembershipEmploymentInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${MEMBERSHIP_EMPLOYMENT_ODATA.MEMBERSHIP_YEAR} eq '${year}'&$orderby=${MEMBERSHIP_EMPLOYMENT_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_EMPLOYMENT_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipEmploymentDataverse[];
      };
      const employments = responseData?.value || [];
      return employments.map((employment: MembershipEmploymentDataverse) =>
        this.mapDataverseToInternal(employment),
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
   * Find employment records by account lookup
   */
  async findByAccountId(
    accountId: string,
  ): Promise<MembershipEmploymentInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${MEMBERSHIP_EMPLOYMENT_ODATA.ACCOUNT_VALUE} eq ${accountId}&$orderby=${MEMBERSHIP_EMPLOYMENT_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_EMPLOYMENT_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipEmploymentDataverse[];
      };
      const employments = responseData?.value || [];
      return employments.map((employment: MembershipEmploymentDataverse) =>
        this.mapDataverseToInternal(employment),
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
   * Find employment records by affiliate lookup
   */
  async findByAffiliateId(
    affiliateId: string,
  ): Promise<MembershipEmploymentInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${MEMBERSHIP_EMPLOYMENT_ODATA.ACCOUNT_AFFILIATE_VALUE} eq ${affiliateId}&$orderby=${MEMBERSHIP_EMPLOYMENT_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_EMPLOYMENT_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipEmploymentDataverse[];
      };
      const employments = responseData?.value || [];
      return employments.map((employment: MembershipEmploymentDataverse) =>
        this.mapDataverseToInternal(employment),
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
   * Find employment by user (account or affiliate) and year
   * Business rule: one employment record per user per year
   */
  async findByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
  ): Promise<MembershipEmploymentInternal | null> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Convert Business ID to GUID
      let userGuid: string;

      if (userType === 'account') {
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
        userGuid = accountData.value[0].osot_table_accountid;
      } else {
        const affiliate = await this.dataverseService.request(
          'GET',
          `osot_table_account_affiliates?$filter=osot_affiliate_id eq '${userId}'&$select=osot_table_account_affiliateid&$top=1`,
          undefined,
          credentials,
          app,
        );
        const affiliateData = affiliate as {
          value: Array<{ osot_table_account_affiliateid: string }>;
        };
        if (!affiliateData.value || affiliateData.value.length === 0) {
          throw new Error(`Affiliate not found: ${userId}`);
        }
        userGuid = affiliateData.value[0].osot_table_account_affiliateid;
      }

      // Use OData _value fields for lookups in queries with GUID
      const userField =
        userType === 'account'
          ? MEMBERSHIP_EMPLOYMENT_ODATA.ACCOUNT_VALUE
          : MEMBERSHIP_EMPLOYMENT_ODATA.ACCOUNT_AFFILIATE_VALUE;

      const oDataQuery = `$filter=${userField} eq ${userGuid} and ${MEMBERSHIP_EMPLOYMENT_ODATA.MEMBERSHIP_YEAR} eq '${year}'&$select=${MEMBERSHIP_EMPLOYMENT_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipEmploymentDataverse[];
      };
      const employment = responseData?.value?.[0];

      return employment ? this.mapDataverseToInternal(employment) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update employment by Employment ID
   */
  async update(
    employmentId: string,
    updateData: Partial<MembershipEmploymentInternal>,
  ): Promise<MembershipEmploymentInternal> {
    try {
      // First find the record to get the GUID
      const existing = await this.findByEmploymentId(employmentId);
      if (!existing?.osot_table_membership_employmentid) {
        throw new Error(`Employment record with ID ${employmentId} not found`);
      }

      // Use main app credentials for update operations
      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = MembershipEmploymentMapper.mapInternalToDataverse(
        updateData as MembershipEmploymentInternal,
        true,
      );
      await this.dataverseService.request(
        'PATCH',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}(${existing.osot_table_membership_employmentid})`,
        payload,
        credentials,
        app,
      );

      // Return the updated data
      return this.mapDataverseToInternal({
        ...existing,
        ...payload,
        osot_table_membership_employmentid:
          existing.osot_table_membership_employmentid,
      } as MembershipEmploymentDataverse);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update employment by GUID
   */
  async updateById(
    id: string,
    updateData: Partial<MembershipEmploymentInternal>,
  ): Promise<MembershipEmploymentInternal> {
    try {
      // Use main app credentials for update operations
      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = MembershipEmploymentMapper.mapInternalToDataverse(
        updateData as MembershipEmploymentInternal,
        true,
      );
      await this.dataverseService.request(
        'PATCH',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}(${id})`,
        payload,
        credentials,
        app,
      );

      // Return updated record
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated employment record');
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
   * Delete employment by Employment ID (hard delete)
   */
  async delete(employmentId: string): Promise<void> {
    try {
      // First find the record to get the GUID
      const existing = await this.findByEmploymentId(employmentId);
      if (!existing?.osot_table_membership_employmentid) {
        throw new Error(`Employment record with ID ${employmentId} not found`);
      }

      // Use main app credentials for delete operations
      const app = getAppForOperation('delete', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Hard delete
      await this.dataverseService.request(
        'DELETE',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}(${existing.osot_table_membership_employmentid})`,
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
   * Delete employment by GUID (hard delete)
   */
  async deleteById(id: string): Promise<void> {
    try {
      // Use main app credentials for delete operations
      const app = getAppForOperation('delete', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Hard delete
      await this.dataverseService.request(
        'DELETE',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}(${id})`,
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
   * List all employment records with pagination
   */
  async findAll(options?: {
    skip?: number;
    top?: number;
    orderBy?: string;
  }): Promise<MembershipEmploymentInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const skip = options?.skip || 0;
      const top = options?.top || 50;
      const orderBy =
        options?.orderBy || `${MEMBERSHIP_EMPLOYMENT_ODATA.CREATED_ON} desc`;

      const oDataQuery = `$skip=${skip}&$top=${top}&$orderby=${orderBy}&$select=${MEMBERSHIP_EMPLOYMENT_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipEmploymentDataverse[];
      };
      const employments = responseData?.value || [];
      return employments.map((employment: MembershipEmploymentDataverse) =>
        this.mapDataverseToInternal(employment),
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
   * Count total employment records
   */
  async count(): Promise<number> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = '$count=true&$top=1';
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}?${oDataQuery}`,
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
   * Check if an employment record exists for user and year (uniqueness validation)
   */
  async existsByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
  ): Promise<boolean> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Use OData _value fields for lookups in queries
      const userField =
        userType === 'account'
          ? MEMBERSHIP_EMPLOYMENT_ODATA.ACCOUNT_VALUE
          : MEMBERSHIP_EMPLOYMENT_ODATA.ACCOUNT_AFFILIATE_VALUE;

      const filterQuery = `${userField} eq ${userId} and ${MEMBERSHIP_EMPLOYMENT_ODATA.MEMBERSHIP_YEAR} eq '${year}'`;
      const oDataQuery = `$filter=${filterQuery}&$count=true&$top=1`;

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}?${oDataQuery}`,
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
   * Find employment records by employment status
   */
  async findByEmploymentStatus(
    status: number,
  ): Promise<MembershipEmploymentInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${MEMBERSHIP_EMPLOYMENT_ODATA.EMPLOYMENT_STATUS} eq ${status}&$orderby=${MEMBERSHIP_EMPLOYMENT_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_EMPLOYMENT_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_EMPLOYMENT_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipEmploymentDataverse[];
      };
      const employments = responseData?.value || [];
      return employments.map((employment: MembershipEmploymentDataverse) =>
        this.mapDataverseToInternal(employment),
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
    dataverseData: MembershipEmploymentDataverse,
  ): MembershipEmploymentInternal {
    return MembershipEmploymentMapper.mapDataverseToInternal(dataverseData);
  }

  /**
   * Transform internal data to Dataverse format
   */
  mapInternalToDataverse(
    internalData: Partial<MembershipEmploymentInternal>,
  ): Partial<MembershipEmploymentDataverse> {
    return MembershipEmploymentMapper.mapInternalToDataverse(
      internalData as MembershipEmploymentInternal,
      true,
    );
  }
}
