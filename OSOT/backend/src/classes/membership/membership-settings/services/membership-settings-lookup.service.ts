/**
 * Membership Settings Lookup Service (CLEAN REBUILD)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseMembershipSettingsRepository
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Public read access for active settings, privileged access for all
 * - Data Transformation: Mappers for Internal ↔ Response conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Membership Settings Specific):
 * - PUBLIC ACCESS: Read access to ACTIVE membership settings only (for fee display)
 * - ADMIN (privilege = 2): Full read access to all settings (including inactive)
 * - MAIN (privilege = 3): Full read access to all settings (including inactive)
 * - OTHER PRIVILEGES: Read access to ACTIVE settings only
 *
 * PUBLIC API FEATURES:
 * - Public access to active membership settings for UI display
 * - Group-based lookup for membership forms
 * - Year-based settings lookup for current/future membership planning
 * - Active settings listing for public display
 *
 * Key Features:
 * - Public read access for active membership information
 * - Privileged access for complete administrative lookup
 * - Group and year-based filtering
 * - Existence checking for uniqueness validation
 * - Performance-optimized queries for public display
 * - Operation tracking for compliance and debugging
 */

import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { CacheService } from '../../../../cache/cache.service';
import { MembershipSettingsResponseDto } from '../dtos/membership-settings-response.dto';
import { ListMembershipSettingsQueryDto } from '../dtos/list-membership-settings.query.dto';
import {
  DataverseMembershipSettingsRepository,
  MEMBERSHIP_SETTINGS_REPOSITORY,
} from '../repositories/membership-settings.repository';
import { MembershipSettingsMapper } from '../mappers/membership-settings.mapper';
import { AccountStatus, Privilege } from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';
import { MEMBERSHIP_SETTINGS_ERROR_CODES } from '../constants/membership-settings.constants';

@Injectable()
export class MembershipSettingsLookupService {
  private readonly logger = new Logger(MembershipSettingsLookupService.name);

  constructor(
    @Inject(MEMBERSHIP_SETTINGS_REPOSITORY)
    private readonly repository: DataverseMembershipSettingsRepository,
    private readonly dataverseService: DataverseService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Find membership settings by Settings ID
   * Public access for active settings, privileged access for all
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param settingsId - Membership settings ID
   * @param userPrivilege - Optional user privilege for access control
   * @param operationId - Optional operation ID for tracking
   */
  async findBySettingsId(
    organizationGuid: string,
    settingsId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipSettingsResponseDto | null> {
    const opId = operationId || `find-settings-${Date.now()}`;

    try {
      const settings = await this.repository.findBySettingsId(
        organizationGuid,
        settingsId,
      );

      if (!settings) {
        return null;
      }

      // Check access based on privilege and status
      if (!this.canAccessSettings(settings, userPrivilege)) {
        this.logger.warn(
          `Access denied for settings ${settingsId}, privilege: ${userPrivilege}, status: ${settings.osot_membership_year_status}`,
        );
        return null;
      }

      const response =
        MembershipSettingsMapper.mapInternalToResponseDto(settings);
      this.logger.log(
        `Successfully found membership settings ${settingsId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding membership settings ${settingsId} for operation ${opId}:`,
        error,
      );
      throw createAppError(MEMBERSHIP_SETTINGS_ERROR_CODES.INTERNAL_ERROR, {
        message: 'Failed to find membership settings',
        operationId: opId,
        settingsId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find membership settings by group and year
   * Used for uniqueness validation and public lookup
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param group - Membership group
   * @param year - Membership year
   * @param userPrivilege - Optional user privilege for access control
   * @param operationId - Optional operation ID for tracking
   */
  async findByGroupAndYear(
    organizationGuid: string,
    group: MembershipGroup,
    year: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipSettingsResponseDto | null> {
    const opId = operationId || `find-group-year-${Date.now()}`;
    this.logger.log(
      `Finding membership settings for group ${group}, year ${year} for operation ${opId}`,
    );

    try {
      const settings = await this.repository.findByGroupAndYear(
        organizationGuid,
        group,
        year,
      );

      if (!settings) {
        return null;
      }

      // Check access based on privilege and status
      if (!this.canAccessSettings(settings, userPrivilege)) {
        return null;
      }

      const response =
        MembershipSettingsMapper.mapInternalToResponseDto(settings);
      this.logger.log(
        `Successfully found membership settings for group ${group}, year ${year} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding membership settings for group ${group}, year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(MEMBERSHIP_SETTINGS_ERROR_CODES.INTERNAL_ERROR, {
        message: 'Failed to find membership settings by group and year',
        operationId: opId,
        group,
        year,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * List membership settings with filtering and pagination
   * Public access for active settings only
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param query - Query filters and pagination
   * @param userPrivilege - Optional user privilege for access control
   * @param operationId - Optional operation ID for tracking
   */
  async list(
    organizationGuid: string,
    query: ListMembershipSettingsQueryDto,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<{
    data: MembershipSettingsResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const opId = operationId || `list-settings-${Date.now()}`;
    this.logger.log(`Listing membership settings for operation ${opId}`);

    try {
      // Apply privilege-based filtering
      const options = {
        ...query,
        // Force ACTIVE status for non-privileged users
        membershipYearStatus: this.canAccessAllSettings(userPrivilege)
          ? query.membershipYearStatus
          : AccountStatus.ACTIVE,
      };

      const result = await this.repository.list(organizationGuid, options);

      // Transform to response DTOs
      const data = result.data.map((settings) =>
        MembershipSettingsMapper.mapInternalToResponseDto(settings),
      );

      this.logger.log(
        `Successfully listed ${result.total} membership settings for operation ${opId}`,
      );

      return {
        ...result,
        data,
      };
    } catch (error) {
      this.logger.error(
        `Error listing membership settings for operation ${opId}:`,
        error,
      );
      throw createAppError(MEMBERSHIP_SETTINGS_ERROR_CODES.INTERNAL_ERROR, {
        message: 'Failed to list membership settings',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get active membership settings for public display
   * Always returns only active settings regardless of privilege
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param operationId - Optional operation ID for tracking
   */
  async getActiveSettings(
    organizationGuid: string,
    operationId?: string,
  ): Promise<MembershipSettingsResponseDto[]> {
    const opId = operationId || `active-settings-${Date.now()}`;
    this.logger.log(`Getting active membership settings for operation ${opId}`);

    try {
      const settings = await this.repository.findByStatus(
        organizationGuid,
        AccountStatus.ACTIVE,
      );

      const response = settings.map((setting) =>
        MembershipSettingsMapper.mapInternalToResponseDto(setting),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} active membership settings for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting active membership settings for operation ${opId}:`,
        error,
      );
      throw createAppError(MEMBERSHIP_SETTINGS_ERROR_CODES.INTERNAL_ERROR, {
        message: 'Failed to get active membership settings',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get membership settings by year (public access for active, privileged for all)
   * @param organizationGuid - REQUIRED: Organization GUID for multi-tenant isolation
   * @param year - Membership year
   * @param userPrivilege - Optional user privilege for access control
   * @param operationId - Optional operation ID for tracking
   */
  async getByYear(
    organizationGuid: string,
    year: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipSettingsResponseDto[]> {
    const opId = operationId || `year-settings-${Date.now()}`;
    this.logger.log(
      `Getting membership settings for year ${year} for operation ${opId}`,
    );

    try {
      const settings = await this.repository.findByYear(organizationGuid, year);

      // Filter based on access privileges
      const filteredSettings = settings.filter((setting) =>
        this.canAccessSettings(setting, userPrivilege),
      );

      const response = filteredSettings.map((setting) =>
        MembershipSettingsMapper.mapInternalToResponseDto(setting),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} membership settings for year ${year} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting membership settings for year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(MEMBERSHIP_SETTINGS_ERROR_CODES.INTERNAL_ERROR, {
        message: 'Failed to get membership settings by year',
        operationId: opId,
        year,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if group-year combination exists (for uniqueness validation)
   */
  async existsByGroupAndYear(
    organizationGuid: string,
    group: MembershipGroup,
    year: string,
    excludeSettingsId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `exists-check-${Date.now()}`;
    this.logger.log(
      `Checking existence for group ${group}, year ${year} for operation ${opId}`,
    );

    try {
      const exists = await this.repository.existsByGroupAndYear(
        organizationGuid,
        group,
        year,
        excludeSettingsId,
      );

      this.logger.log(
        `Existence check result for group ${group}, year ${year}: ${exists} for operation ${opId}`,
      );
      return exists;
    } catch (error) {
      this.logger.error(
        `Error checking existence for group ${group}, year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(MEMBERSHIP_SETTINGS_ERROR_CODES.INTERNAL_ERROR, {
        message: 'Failed to check group-year existence',
        operationId: opId,
        group,
        year,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get membership expiration information for authenticated user
   * Simplified approach: Only checks if user has active membership and returns expiration date
   * All memberships expire on the same date, so we just need any active setting
   *
   * @param userGuid - GUID from JWT (osot_table_accountid or osot_table_account_affiliateid)
   * @param isAffiliate - True if affiliate user, false if account user
   */
  async getMyExpiration(
    userGuid: string,
    isAffiliate: boolean,
  ): Promise<{
    expiresDate: string;
    daysRemaining: number;
    membershipYear: string;
    category: string;
    status: string;
    requiresRenewal: boolean;
  }> {
    const operationId = `get-my-expiration-${Date.now()}`;
    const userType = isAffiliate ? 'affiliate' : 'account';
    const tableName = isAffiliate
      ? 'osot_table_account_affiliates'
      : 'osot_table_accounts';

    // Check cache first
    const cacheKey = this.cacheService.buildMembershipExpirationKey(userGuid);
    const cached = await this.cacheService.get<{
      expiresDate: string;
      daysRemaining: number;
      membershipYear: string;
      category: string;
      status: string;
      requiresRenewal: boolean;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // Step 1: Check if user has active membership
      const userResponse = (await this.dataverseService.request(
        'GET',
        `${tableName}(${userGuid})?$select=osot_active_member`,
      )) as { osot_active_member?: boolean };

      if (!userResponse.osot_active_member) {
        this.logger.warn(
          `User ${userGuid} does not have active membership (osot_active_member = false)`,
        );
        throw new NotFoundException(
          'You do not have an active membership. Please complete your membership registration.',
        );
      }

      // Step 2: Get any active membership setting
      const settingsResponse = (await this.dataverseService.request(
        'GET',
        `osot_table_membership_settings?$filter=osot_membership_year_status eq 1&$select=osot_year_ends,osot_membership_year&$top=1`,
      )) as {
        value?: Array<{
          osot_year_ends: string;
          osot_membership_year: string;
        }>;
      };

      if (!settingsResponse.value || settingsResponse.value.length === 0) {
        this.logger.warn('No active membership settings found in the system');
        throw new NotFoundException(
          'Membership settings not configured. Please contact support.',
        );
      }

      const activeSetting = settingsResponse.value[0];
      const expiresDate = new Date(activeSetting.osot_year_ends);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expiresDate.setHours(0, 0, 0, 0);

      // Calculate days remaining
      const timeDiff = expiresDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      // Determine status
      const requiresRenewal = daysRemaining <= 30 && daysRemaining >= 0;
      const status =
        daysRemaining < 0
          ? 'expired'
          : requiresRenewal
            ? 'renewal-required'
            : 'active';

      const result = {
        expiresDate: activeSetting.osot_year_ends,
        daysRemaining,
        membershipYear: activeSetting.osot_membership_year,
        category: 'Active Member',
        status,
        requiresRenewal,
      };

      // Cache the result
      await this.cacheService.set(cacheKey, result);

      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Error fetching membership expiration for ${userType} GUID ${userGuid} - Operation: ${operationId}:`,
        error,
      );
      throw createAppError(MEMBERSHIP_SETTINGS_ERROR_CODES.INTERNAL_ERROR, {
        message: 'Failed to fetch membership expiration',
        operationId,
        userGuid,
        userType,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if user can access specific settings based on status and privilege
   */
  private canAccessSettings(
    settings: unknown,
    userPrivilege?: Privilege,
  ): boolean {
    // Privileged users can access all settings
    if (this.canAccessAllSettings(userPrivilege)) {
      return true;
    }

    // Non-privileged users can only access active settings
    const settingsObj = settings as {
      osot_membership_year_status?: AccountStatus;
    };
    return settingsObj.osot_membership_year_status === AccountStatus.ACTIVE;
  }

  /**
   * Check if user can access all settings (including inactive)
   */
  private canAccessAllSettings(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}
