/**
 * Membership Preferences Lookup Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with DataverseMembershipPreferenceRepository
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Privilege-based access control for preferences
 * - Data Transformation: Mappers for Internal ↔ Response conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Membership Preferences Specific):
 * - OWNER (privilege = 0): Read access to own preferences only
 * - ADMIN (privilege = 2): Read access to all preferences in their organization
 * - MAIN (privilege = 3): Full read access to all preferences
 * - PUBLIC ACCESS: No direct access (must authenticate)
 *
 * LOOKUP FEATURES:
 * - Find by preference ID (business or internal ID)
 * - Find by user and year for current preference lookup
 * - Find by category for category-specific preferences
 * - Find by auto-renewal status for renewal workflows
 * - List with filtering, sorting, and pagination
 * - Existence checking for uniqueness validation
 *
 * Key Features:
 * - Privilege-based data filtering
 * - Year and category-based lookup
 * - Auto-renewal status queries for annual workflows
 * - User-year uniqueness validation
 * - Performance-optimized queries
 * - Operation tracking for compliance and debugging
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { MembershipPreferenceResponseDto } from '../dtos/membership-preference-response.dto';
import { ListMembershipPreferencesQueryDto } from '../dtos/list-membership-preferences.query.dto';
import {
  DataverseMembershipPreferenceRepository,
  MEMBERSHIP_PREFERENCE_REPOSITORY,
} from '../repositories/membership-preference.repository';
import { MembershipPreferenceMapper } from '../mappers/membership-preference.mapper';
import { Privilege } from '../../../../common/enums';

@Injectable()
export class MembershipPreferenceLookupService {
  private readonly logger = new Logger(MembershipPreferenceLookupService.name);

  constructor(
    @Inject(MEMBERSHIP_PREFERENCE_REPOSITORY)
    private readonly repository: DataverseMembershipPreferenceRepository,
  ) {}

  /**
   * Find membership preference by Preference ID (business ID)
   * Privilege-based access control applied
   *
   * @param preferenceId - Business preference ID (osot_preference_id)
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership validation
   * @param operationId - Unique operation identifier
   * @returns Preference or null if not found/no access
   */
  async findByPreferenceId(
    preferenceId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto | null> {
    const opId = operationId || `find-pref-${Date.now()}`;
    this.logger.log(
      `Finding preference by ID ${preferenceId} for operation ${opId}`,
    );

    try {
      const preference = await this.repository.findByPreferenceId(preferenceId);

      if (!preference) {
        return null;
      }

      // Check access based on privilege and ownership
      if (!this.canAccessPreference(preference, userPrivilege, userId)) {
        this.logger.warn(
          `Access denied for preference ${preferenceId}, privilege: ${userPrivilege}, userId: ${userId}`,
        );
        return null;
      }

      const response =
        MembershipPreferenceMapper.mapInternalToResponseDto(preference);
      this.logger.log(
        `Successfully found preference ${preferenceId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding preference ${preferenceId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find membership preference',
        operationId: opId,
        preferenceId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find membership preference by internal ID
   * Privilege-based access control applied
   *
   * @param id - Internal GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership validation
   * @param operationId - Unique operation identifier
   * @returns Preference or null if not found/no access
   */
  async findById(
    id: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto | null> {
    const opId = operationId || `find-id-${Date.now()}`;
    this.logger.log(`Finding preference by GUID ${id} for operation ${opId}`);

    try {
      const preference = await this.repository.findById(id);

      if (!preference) {
        return null;
      }

      // Check access based on privilege and ownership
      if (!this.canAccessPreference(preference, userPrivilege, userId)) {
        this.logger.warn(
          `Access denied for preference ${id}, privilege: ${userPrivilege}, userId: ${userId}`,
        );
        return null;
      }

      const response =
        MembershipPreferenceMapper.mapInternalToResponseDto(preference);
      this.logger.log(
        `Successfully found preference by GUID ${id} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding preference by GUID ${id} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find membership preference by ID',
        operationId: opId,
        id,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find membership preference by user and year
   * Returns the user's preference for a specific membership year
   *
   * @param userId - Account or Affiliate GUID
   * @param year - Membership year
   * @param userType - 'account' or 'affiliate'
   * @param userPrivilege - User's privilege level
   * @param requestingUserId - ID of user making request (for ownership check)
   * @param operationId - Unique operation identifier
   * @returns Preference or null if not found/no access
   */
  async findByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
    userPrivilege?: Privilege,
    requestingUserId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto | null> {
    const opId = operationId || `find-user-year-${Date.now()}`;

    try {
      const preference = await this.repository.findByUserAndYear(
        userId,
        year,
        userType,
      );

      if (!preference) {
        return null;
      }

      // Check access based on privilege and ownership
      // When requesting user is the same as the preference owner, always allow
      const isOwnPreference = requestingUserId === userId;
      if (
        !isOwnPreference &&
        !this.canAccessPreference(preference, userPrivilege, requestingUserId)
      ) {
        this.logger.warn(
          `Access denied for ${userType} ${userId} preference, year ${year}`,
        );
        return null;
      }

      const response =
        MembershipPreferenceMapper.mapInternalToResponseDto(preference);
      this.logger.log(
        `Successfully found preference for ${userType} ${userId}, year ${year} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding preference for ${userType} ${userId}, year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find membership preference by user and year',
        operationId: opId,
        userId,
        year,
        userType,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get membership preferences by year
   * Filtered by privilege level
   *
   * @param year - Membership year
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of preferences
   */
  async getByYear(
    year: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto[]> {
    const opId = operationId || `year-prefs-${Date.now()}`;
    this.logger.log(
      `Getting preferences for year ${year} for operation ${opId}`,
    );

    try {
      const preferences = await this.repository.findByYear(year);

      // Filter based on access privileges
      const filteredPreferences = preferences.filter((pref) =>
        this.canAccessPreference(pref, userPrivilege, userId),
      );

      const response = filteredPreferences.map((pref) =>
        MembershipPreferenceMapper.mapInternalToResponseDto(pref),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} preferences for year ${year} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting preferences for year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get membership preferences by year',
        operationId: opId,
        year,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get membership preferences by category
   * Filtered by privilege level
   *
   * @param categoryId - Membership category GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of preferences
   */
  async getByCategory(
    categoryId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto[]> {
    const opId = operationId || `category-prefs-${Date.now()}`;
    this.logger.log(
      `Getting preferences for category ${categoryId} for operation ${opId}`,
    );

    try {
      const preferences = await this.repository.findByCategoryId(categoryId);

      // Filter based on access privileges
      const filteredPreferences = preferences.filter((pref) =>
        this.canAccessPreference(pref, userPrivilege, userId),
      );

      const response = filteredPreferences.map((pref) =>
        MembershipPreferenceMapper.mapInternalToResponseDto(pref),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} preferences for category ${categoryId} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting preferences for category ${categoryId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get membership preferences by category',
        operationId: opId,
        categoryId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get membership preferences by account
   * Filtered by privilege level
   *
   * @param accountId - Account GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of preferences
   */
  async getByAccount(
    accountId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto[]> {
    const opId = operationId || `account-prefs-${Date.now()}`;
    this.logger.log(
      `Getting preferences for account ${accountId} for operation ${opId}`,
    );

    try {
      const preferences = await this.repository.findByAccountId(accountId);

      // Filter based on access privileges
      const filteredPreferences = preferences.filter((pref) =>
        this.canAccessPreference(pref, userPrivilege, userId),
      );

      const response = filteredPreferences.map((pref) =>
        MembershipPreferenceMapper.mapInternalToResponseDto(pref),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} preferences for account ${accountId} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting preferences for account ${accountId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get membership preferences by account',
        operationId: opId,
        accountId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get membership preferences by affiliate
   * Filtered by privilege level
   *
   * @param affiliateId - Affiliate GUID
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of preferences
   */
  async getByAffiliate(
    affiliateId: string,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto[]> {
    const opId = operationId || `affiliate-prefs-${Date.now()}`;
    this.logger.log(
      `Getting preferences for affiliate ${affiliateId} for operation ${opId}`,
    );

    try {
      const preferences = await this.repository.findByAffiliateId(affiliateId);

      // Filter based on access privileges
      const filteredPreferences = preferences.filter((pref) =>
        this.canAccessPreference(pref, userPrivilege, userId),
      );

      const response = filteredPreferences.map((pref) =>
        MembershipPreferenceMapper.mapInternalToResponseDto(pref),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} preferences for affiliate ${affiliateId} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting preferences for affiliate ${affiliateId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get membership preferences by affiliate',
        operationId: opId,
        affiliateId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get membership preferences by auto-renewal status
   * Used for annual renewal workflows
   *
   * @param autoRenewal - Auto-renewal enabled (true) or disabled (false)
   * @param userPrivilege - User's privilege level (Admin/Main only)
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Array of preferences
   */
  async getByAutoRenewal(
    autoRenewal: boolean,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<MembershipPreferenceResponseDto[]> {
    const opId = operationId || `auto-renewal-${Date.now()}`;
    this.logger.log(
      `Getting preferences with auto-renewal ${autoRenewal} for operation ${opId}`,
    );

    try {
      // Only Admin and Main can query by auto-renewal
      if (!this.canAccessAllPreferences(userPrivilege)) {
        throw createAppError(ErrorCodes.PERMISSION_DENIED, {
          message: 'Insufficient privileges: Admin or Main privilege required',
          operationId: opId,
          requiredPrivilege: 'Admin/Main',
          userPrivilege: userPrivilege || 'None',
        });
      }

      const preferences = await this.repository.findByAutoRenewal(autoRenewal);

      const response = preferences.map((pref) =>
        MembershipPreferenceMapper.mapInternalToResponseDto(pref),
      );

      this.logger.log(
        `Successfully retrieved ${response.length} preferences with auto-renewal ${autoRenewal} for operation ${opId}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Error getting preferences by auto-renewal for operation ${opId}:`,
        error,
      );

      // Re-throw if already an app error
      if (error && typeof error === 'object' && 'code' in error) {
        throw error;
      }

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get membership preferences by auto-renewal',
        operationId: opId,
        autoRenewal,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * List membership preferences with filtering and pagination
   * Privilege-based filtering applied
   *
   * NOTE: Repository findAll only supports basic pagination.
   * Advanced filtering is done in-memory for now.
   *
   * @param query - Query parameters for filtering and pagination
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Paginated preferences list
   */
  async list(
    query: ListMembershipPreferencesQueryDto,
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<{
    data: MembershipPreferenceResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    const opId = operationId || `list-prefs-${Date.now()}`;
    this.logger.log(`Listing membership preferences for operation ${opId}`);

    try {
      // Repository only supports basic pagination
      const skip = ((query.page || 1) - 1) * (query.pageSize || 10);
      const top = query.pageSize || 10;

      const allPreferences = await this.repository.findAll({
        skip,
        top,
        orderBy: query.sortBy || 'createdOn desc',
      });

      // Apply privilege-based filtering
      let filteredData = allPreferences.filter((pref) =>
        this.canAccessPreference(pref, userPrivilege, userId),
      );

      // Apply additional filters in-memory
      if (query.membershipYear) {
        filteredData = filteredData.filter(
          (pref) => pref.osot_membership_year === query.membershipYear,
        );
      }

      if (query.membershipCategoryId) {
        filteredData = filteredData.filter(
          (pref) =>
            pref.osot_table_membership_category === query.membershipCategoryId,
        );
      }

      if (query.accountId) {
        filteredData = filteredData.filter(
          (pref) => pref.osot_table_account === query.accountId,
        );
      }

      if (query.affiliateId) {
        filteredData = filteredData.filter(
          (pref) => pref.osot_table_account_affiliate === query.affiliateId,
        );
      }

      if (query.autoRenewal !== undefined) {
        filteredData = filteredData.filter(
          (pref) => pref.osot_auto_renewal === query.autoRenewal,
        );
      }

      // Transform to response DTOs
      const data = filteredData.map((pref) =>
        MembershipPreferenceMapper.mapInternalToResponseDto(pref),
      );

      const page = query.page || 1;
      const pageSize = query.pageSize || 10;

      this.logger.log(
        `Successfully listed ${data.length} membership preferences for operation ${opId}`,
      );

      return {
        data,
        total: data.length,
        page,
        pageSize,
        totalPages: Math.ceil(data.length / pageSize),
      };
    } catch (error) {
      this.logger.error(
        `Error listing membership preferences for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to list membership preferences',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if user-year combination exists (for uniqueness validation)
   *
   * @param userId - Account or Affiliate GUID
   * @param year - Membership year
   * @param userType - 'account' or 'affiliate'
   * @param operationId - Unique operation identifier
   * @returns True if exists, false otherwise
   */
  async existsByUserAndYear(
    userId: string,
    year: string,
    userType: 'account' | 'affiliate',
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `exists-check-${Date.now()}`;
    this.logger.log(
      `Checking existence for ${userType} ${userId}, year ${year} for operation ${opId}`,
    );

    try {
      const exists = await this.repository.existsByUserAndYear(
        userId,
        year,
        userType,
      );

      this.logger.log(
        `Existence check result for ${userType} ${userId}, year ${year}: ${exists} for operation ${opId}`,
      );
      return exists;
    } catch (error) {
      this.logger.error(
        `Error checking existence for ${userType} ${userId}, year ${year} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to check user-year existence',
        operationId: opId,
        userId,
        year,
        userType,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Count total membership preferences
   * NOTE: Repository count doesn't support filters currently.
   * This returns total count only.
   *
   * @param userPrivilege - User's privilege level
   * @param userId - User ID for ownership filtering
   * @param operationId - Unique operation identifier
   * @returns Total count
   */
  async count(
    userPrivilege?: Privilege,
    userId?: string,
    operationId?: string,
  ): Promise<number> {
    const opId = operationId || `count-prefs-${Date.now()}`;
    this.logger.log(`Counting membership preferences for operation ${opId}`);

    try {
      const count = await this.repository.count();

      this.logger.log(
        `Successfully counted ${count} membership preferences for operation ${opId}`,
      );
      return count;
    } catch (error) {
      this.logger.error(
        `Error counting membership preferences for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to count membership preferences',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Check if user can access specific preference based on privilege and ownership
   */
  private canAccessPreference(
    preference: unknown,
    userPrivilege?: Privilege,
    userId?: string,
  ): boolean {
    // Admin and Main can access all preferences
    if (this.canAccessAllPreferences(userPrivilege)) {
      return true;
    }

    // Owner can only access their own preferences
    if (userPrivilege === Privilege.OWNER && userId) {
      const pref = preference as {
        osot_table_account?: string;
        osot_table_account_affiliate?: string;
      };
      return (
        pref.osot_table_account === userId ||
        pref.osot_table_account_affiliate === userId
      );
    }

    // No access for other cases
    return false;
  }

  /**
   * Check if user can access all preferences (Admin/Main only)
   */
  private canAccessAllPreferences(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}
