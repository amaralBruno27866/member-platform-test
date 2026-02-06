/**
 * Membership Settings Repository (CLEAN REBUILD)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes/ErrorMessages for structured error handling
 * - integrations: Uses DataverseService for all data operations
 * - interfaces: Implements MembershipSettingsRepository contract
 * - mappers: Uses MembershipSettingsMapper for data transformation
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential CRUD operations only
 * - Simple query patterns for OSOT membership management needs
 * - Follows Address repository pattern exactly
 * - Clean abstraction over DataverseService
 * - Structured error handling with proper logging
 */

import { Injectable } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { AccountStatus } from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';
import { MEMBERSHIP_SETTINGS_ODATA } from '../constants/membership-settings.constants';
import { MembershipSettingsRepository } from '../interfaces/membership-settings-repository.interface';
import { MembershipSettingsInternal } from '../interfaces/membership-settings-internal.interface';
import { MembershipSettingsDataverse } from '../interfaces/membership-settings-dataverse.interface';
import { MembershipSettingsMapper } from '../mappers/membership-settings.mapper';
import { getAppForOperation } from '../../../../utils/dataverse-app.helper';

export const MEMBERSHIP_SETTINGS_REPOSITORY = 'MEMBERSHIP_SETTINGS_REPOSITORY';

/**
 * DataverseMembershipSettingsRepository
 *
 * Repository implementation for Membership Settings entities using Microsoft Dataverse.
 * Provides a clean abstraction layer between the application and Dataverse API.
 */
@Injectable()
export class DataverseMembershipSettingsRepository
  implements MembershipSettingsRepository
{
  constructor(private readonly dataverseService: DataverseService) {}

  /**
   * Create a new membership settings record in Dataverse
   */
  async create(
    settingsData: Partial<MembershipSettingsInternal>,
  ): Promise<MembershipSettingsInternal> {
    try {
      // Use main app credentials for create operations
      const app = getAppForOperation('create', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = this.mapInternalToDataverse(settingsData, false); // false = creation
      const response = await this.dataverseService.request(
        'POST',
        MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME,
        payload,
        credentials,
        app,
      );

      return this.mapDataverseToInternal(
        response as MembershipSettingsDataverse,
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
   * Find membership settings by Settings ID (business ID)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param settingsId - Membership settings business ID
   */
  async findBySettingsId(
    organizationGuid: string,
    settingsId: string,
  ): Promise<MembershipSettingsInternal | null> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // MULTI-TENANT: Filter by organization AND settings ID
      const oDataQuery = `$filter=${MEMBERSHIP_SETTINGS_ODATA.ORGANIZATION_LOOKUP_GUID} eq '${organizationGuid}' and ${MEMBERSHIP_SETTINGS_ODATA.SETTINGS_ID} eq '${settingsId}'&$select=${MEMBERSHIP_SETTINGS_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipSettingsDataverse[];
      };
      const settings = responseData?.value?.[0];

      return settings ? this.mapDataverseToInternal(settings) : null;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw new Error(
        `${ErrorMessages[ErrorCodes.NOT_FOUND].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find membership settings by GUID (record ID)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param id - Record GUID
   */
  async findById(
    organizationGuid: string,
    id: string,
  ): Promise<MembershipSettingsInternal | null> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Get record by GUID and validate organization
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}(${id})?$select=${MEMBERSHIP_SETTINGS_ODATA.SELECT_FIELDS}`,
        undefined,
        credentials,
        app,
      );

      const record = response as MembershipSettingsDataverse | null;
      if (!record) return null;

      // MULTI-TENANT: Validate organization matches
      if (record._osot_table_organization_value !== organizationGuid) {
        return null; // Record belongs to different organization
      }

      return this.mapDataverseToInternal(record);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw new Error(
        `${ErrorMessages[ErrorCodes.NOT_FOUND].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find membership settings by group and year (business uniqueness - org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param group - Membership group
   * @param year - Membership year
   */
  async findByGroupAndYear(
    organizationGuid: string,
    group: MembershipGroup,
    year: string,
  ): Promise<MembershipSettingsInternal | null> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // MULTI-TENANT: Filter by organization, group AND year
      const oDataQuery = `$filter=${MEMBERSHIP_SETTINGS_ODATA.ORGANIZATION_LOOKUP_GUID} eq '${organizationGuid}' and ${MEMBERSHIP_SETTINGS_ODATA.GROUP} eq ${group} and ${MEMBERSHIP_SETTINGS_ODATA.YEAR} eq '${year}'&$select=${MEMBERSHIP_SETTINGS_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipSettingsDataverse[];
      };
      const settings = responseData?.value?.[0];

      return settings ? this.mapDataverseToInternal(settings) : null;
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Find all membership settings for a specific year (org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param year - Membership year
   */
  async findByYear(
    organizationGuid: string,
    year: string,
  ): Promise<MembershipSettingsInternal[]> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // MULTI-TENANT: Filter by organization AND year
      const oDataQuery = `$filter=${MEMBERSHIP_SETTINGS_ODATA.ORGANIZATION_LOOKUP_GUID} eq '${organizationGuid}' and ${MEMBERSHIP_SETTINGS_ODATA.YEAR} eq '${year}'&$orderby=${MEMBERSHIP_SETTINGS_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_SETTINGS_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipSettingsDataverse[];
      };
      const settings = responseData?.value || [];
      return settings.map((setting: MembershipSettingsDataverse) =>
        this.mapDataverseToInternal(setting),
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
   * Find all membership settings for a specific group (org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param group - Membership group
   */
  async findByGroup(
    organizationGuid: string,
    group: MembershipGroup,
  ): Promise<MembershipSettingsInternal[]> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // MULTI-TENANT: Filter by organization AND group
      const oDataQuery = `$filter=${MEMBERSHIP_SETTINGS_ODATA.ORGANIZATION_LOOKUP_GUID} eq '${organizationGuid}' and ${MEMBERSHIP_SETTINGS_ODATA.GROUP} eq ${group}&$orderby=${MEMBERSHIP_SETTINGS_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_SETTINGS_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipSettingsDataverse[];
      };
      const settings = responseData?.value || [];
      return settings.map((setting: MembershipSettingsDataverse) =>
        this.mapDataverseToInternal(setting),
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
   * Find all membership settings by status (org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param status - Account status filter
   */
  async findByStatus(
    organizationGuid: string,
    status: AccountStatus,
  ): Promise<MembershipSettingsInternal[]> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // MULTI-TENANT: Filter by organization AND status
      const oDataQuery = `$filter=${MEMBERSHIP_SETTINGS_ODATA.ORGANIZATION_LOOKUP_GUID} eq '${organizationGuid}' and ${MEMBERSHIP_SETTINGS_ODATA.STATUS} eq ${status}&$orderby=${MEMBERSHIP_SETTINGS_ODATA.CREATED_ON} desc&$select=${MEMBERSHIP_SETTINGS_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipSettingsDataverse[];
      };
      const settings = responseData?.value || [];
      return settings.map((setting: MembershipSettingsDataverse) =>
        this.mapDataverseToInternal(setting),
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
   * Update membership settings by Settings ID (org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for validation
   * @param settingsId - Membership settings business ID
   * @param updateData - Fields to update
   */
  async update(
    organizationGuid: string,
    settingsId: string,
    updateData: Partial<MembershipSettingsInternal>,
  ): Promise<MembershipSettingsInternal> {
    try {
      // First find the record to validate organization and get the GUID
      const existing = await this.findBySettingsId(
        organizationGuid,
        settingsId,
      );
      if (!existing?.osot_table_membership_settingid) {
        throw new Error(`Membership settings with ID ${settingsId} not found`);
      }

      // MULTI-TENANT: Ensure organization matches
      if (existing.organizationGuid !== organizationGuid) {
        throw new Error(
          'Cannot update settings from different organization (multi-tenant violation)',
        );
      }

      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = this.mapInternalToDataverse(updateData, true); // true = update
      await this.dataverseService.request(
        'PATCH',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}(${existing.osot_table_membership_settingid})`,
        payload,
        credentials,
        app,
      );

      // Return the updated data using the GUID
      return this.mapDataverseToInternal({
        ...existing,
        ...payload,
        osot_table_membership_settingid:
          existing.osot_table_membership_settingid,
      } as MembershipSettingsDataverse);
    } catch (error) {
      throw new Error(
        `${ErrorMessages[ErrorCodes.GENERIC].publicMessage}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Update membership settings by GUID (org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for validation
   * @param id - Record GUID
   * @param updateData - Fields to update
   */
  async updateById(
    organizationGuid: string,
    id: string,
    updateData: Partial<MembershipSettingsInternal>,
  ): Promise<MembershipSettingsInternal> {
    try {
      // Validate organization access
      const existing = await this.findById(organizationGuid, id);
      if (!existing) {
        throw new Error('Membership settings not found or org mismatch');
      }

      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = this.mapInternalToDataverse(updateData, true); // true = update
      await this.dataverseService.request(
        'PATCH',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}(${id})`,
        payload,
        credentials,
        app,
      );

      // Return updated record
      const updated = await this.findById(organizationGuid, id);
      if (!updated) {
        throw new Error('Failed to retrieve updated membership settings');
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
   * Delete membership settings by Settings ID (soft delete - org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for validation
   * @param settingsId - Membership settings business ID
   */
  async delete(organizationGuid: string, settingsId: string): Promise<boolean> {
    try {
      // First find the record to validate organization and get the GUID
      const existing = await this.findBySettingsId(
        organizationGuid,
        settingsId,
      );
      if (!existing?.osot_table_membership_settingid) {
        return false;
      }

      // Soft delete by setting status to inactive
      await this.update(organizationGuid, settingsId, {
        osot_membership_year_status: AccountStatus.INACTIVE,
      });

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
   * Delete membership settings by GUID (soft delete - org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for validation
   * @param id - Record GUID
   */
  async deleteById(organizationGuid: string, id: string): Promise<boolean> {
    try {
      const existing = await this.findById(organizationGuid, id);
      if (!existing) {
        return false;
      }

      // Soft delete by setting status to inactive
      await this.updateById(organizationGuid, id, {
        osot_membership_year_status: AccountStatus.INACTIVE,
      });

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
   * List membership settings with filtering and pagination (org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param options - Filter and pagination options
   */
  async list(
    organizationGuid: string,
    options?: {
      membershipYear?: string;
      membershipGroup?: MembershipGroup;
      membershipYearStatus?: AccountStatus;
      searchTerm?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      page?: number;
      pageSize?: number;
      createdFrom?: string;
      createdTo?: string;
    },
  ): Promise<{
    data: MembershipSettingsInternal[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    try {
      // Use main app credentials for read operations
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const page = options?.page || 1;
      const pageSize = options?.pageSize || 50;
      const skip = (page - 1) * pageSize;
      const sortOrder = options?.sortOrder === 'ASC' ? 'asc' : 'desc';
      const sortBy = options?.sortBy || MEMBERSHIP_SETTINGS_ODATA.CREATED_ON;

      // Build filter conditions (MULTI-TENANT: always include org filter)
      const filters: string[] = [
        `${MEMBERSHIP_SETTINGS_ODATA.ORGANIZATION_LOOKUP_GUID} eq '${organizationGuid}'`,
      ];

      if (options?.membershipYear) {
        filters.push(
          `${MEMBERSHIP_SETTINGS_ODATA.YEAR} eq '${options.membershipYear}'`,
        );
      }

      if (options?.membershipGroup) {
        filters.push(
          `${MEMBERSHIP_SETTINGS_ODATA.GROUP} eq ${options.membershipGroup}`,
        );
      }

      if (options?.membershipYearStatus) {
        filters.push(
          `${MEMBERSHIP_SETTINGS_ODATA.STATUS} eq ${options.membershipYearStatus}`,
        );
      }

      if (options?.searchTerm) {
        filters.push(
          `contains(${MEMBERSHIP_SETTINGS_ODATA.SETTINGS_ID}, '${options.searchTerm}')`,
        );
      }

      if (options?.createdFrom) {
        filters.push(
          `${MEMBERSHIP_SETTINGS_ODATA.CREATED_ON} ge ${options.createdFrom}`,
        );
      }

      if (options?.createdTo) {
        filters.push(
          `${MEMBERSHIP_SETTINGS_ODATA.CREATED_ON} le ${options.createdTo}`,
        );
      }

      const filterQuery = `$filter=${filters.join(' and ')}`;
      const orderQuery = `$orderby=${sortBy} ${sortOrder}`;
      const skipQuery = `$skip=${skip}`;
      const topQuery = `$top=${pageSize}`;
      const countQuery = '$count=true';

      const queryParts = [
        filterQuery,
        orderQuery,
        skipQuery,
        topQuery,
        countQuery,
        `$select=${MEMBERSHIP_SETTINGS_ODATA.SELECT_FIELDS}`,
      ];
      const oDataQuery = queryParts.join('&');

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipSettingsDataverse[];
        '@odata.count'?: number;
      };

      const settings = responseData?.value || [];
      const total = responseData?.['@odata.count'] || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: settings.map((setting: MembershipSettingsDataverse) =>
          this.mapDataverseToInternal(setting),
        ),
        total,
        page,
        pageSize,
        totalPages,
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
   * Count total membership settings records (org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param filters - Optional filters
   */
  async count(
    organizationGuid: string,
    filters?: {
      membershipYear?: string;
      membershipGroup?: MembershipGroup;
      membershipYearStatus?: AccountStatus;
    },
  ): Promise<number> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // MULTI-TENANT: Always include org filter
      const filterConditions: string[] = [
        `${MEMBERSHIP_SETTINGS_ODATA.ORGANIZATION_LOOKUP_GUID} eq '${organizationGuid}'`,
      ];

      if (filters?.membershipYear) {
        filterConditions.push(
          `${MEMBERSHIP_SETTINGS_ODATA.YEAR} eq '${filters.membershipYear}'`,
        );
      }

      if (filters?.membershipGroup) {
        filterConditions.push(
          `${MEMBERSHIP_SETTINGS_ODATA.GROUP} eq ${filters.membershipGroup}`,
        );
      }

      if (filters?.membershipYearStatus) {
        filterConditions.push(
          `${MEMBERSHIP_SETTINGS_ODATA.STATUS} eq ${filters.membershipYearStatus}`,
        );
      }

      const filterQuery = `$filter=${filterConditions.join(' and ')}&`;
      const oDataQuery = `${filterQuery}$count=true&$top=0`;

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}?${oDataQuery}`,
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
   * Check if group-year combination exists (org-scoped uniqueness validation)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param group - Membership group
   * @param year - Membership year
   * @param excludeSettingsId - Optional settings ID to exclude from check
   */
  async existsByGroupAndYear(
    organizationGuid: string,
    group: MembershipGroup,
    year: string,
    excludeSettingsId?: string,
  ): Promise<boolean> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // MULTI-TENANT: Filter by organization, group AND year
      let filterQuery = `${MEMBERSHIP_SETTINGS_ODATA.ORGANIZATION_LOOKUP_GUID} eq '${organizationGuid}' and ${MEMBERSHIP_SETTINGS_ODATA.GROUP} eq ${group} and ${MEMBERSHIP_SETTINGS_ODATA.YEAR} eq '${year}'`;

      if (excludeSettingsId) {
        filterQuery += ` and ${MEMBERSHIP_SETTINGS_ODATA.SETTINGS_ID} ne '${excludeSettingsId}'`;
      }

      const oDataQuery = `$filter=${filterQuery}&$count=true&$top=0`;

      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}?${oDataQuery}`,
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
   * Find active membership settings (status = ACTIVE - org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   */
  async findActive(
    organizationGuid: string,
  ): Promise<MembershipSettingsInternal[]> {
    return this.findByStatus(organizationGuid, AccountStatus.ACTIVE);
  }

  /**
   * Find membership settings ending in date range (org scoped)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param fromDate - Start date (ISO 8601)
   * @param toDate - End date (ISO 8601)
   */
  async findEndingInRange(
    organizationGuid: string,
    fromDate: string,
    toDate: string,
  ): Promise<MembershipSettingsInternal[]> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // MULTI-TENANT: Filter by organization AND date range
      const oDataQuery = `$filter=${MEMBERSHIP_SETTINGS_ODATA.ORGANIZATION_LOOKUP_GUID} eq '${organizationGuid}' and ${MEMBERSHIP_SETTINGS_ODATA.YEAR_ENDS} ge ${fromDate} and ${MEMBERSHIP_SETTINGS_ODATA.YEAR_ENDS} le ${toDate}&$orderby=${MEMBERSHIP_SETTINGS_ODATA.YEAR_ENDS} asc&$select=${MEMBERSHIP_SETTINGS_ODATA.SELECT_FIELDS}`;
      const response = await this.dataverseService.request(
        'GET',
        `${MEMBERSHIP_SETTINGS_ODATA.TABLE_NAME}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as {
        value?: MembershipSettingsDataverse[];
      };
      const settings = responseData?.value || [];
      return settings.map((setting: MembershipSettingsDataverse) =>
        this.mapDataverseToInternal(setting),
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
   * Convert raw Dataverse response to internal interface
   */
  mapFromDataverse(
    dataverseData: MembershipSettingsDataverse,
  ): MembershipSettingsInternal {
    return MembershipSettingsMapper.mapDataverseToInternal(dataverseData);
  }

  /**
   * Convert internal interface to Dataverse format
   */
  mapToDataverse(
    internalData: MembershipSettingsInternal,
  ): MembershipSettingsDataverse {
    return MembershipSettingsMapper.mapInternalToDataverse(
      internalData,
    ) as MembershipSettingsDataverse;
  }

  /**
   * Private helper: Map Internal to Dataverse
   */
  private mapInternalToDataverse(
    internal: Partial<MembershipSettingsInternal>,
    isUpdate = false,
  ): Partial<MembershipSettingsDataverse> {
    return MembershipSettingsMapper.mapInternalToDataverse(
      internal as MembershipSettingsInternal,
      isUpdate,
    );
  }

  /**
   * Private helper: Map Dataverse to Internal
   */
  private mapDataverseToInternal(
    dataverse: MembershipSettingsDataverse,
  ): MembershipSettingsInternal {
    return MembershipSettingsMapper.mapDataverseToInternal(dataverse);
  }
}
