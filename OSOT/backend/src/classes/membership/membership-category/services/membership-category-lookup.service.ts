/**
 * Membership Category Lookup Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with MembershipCategoryRepositoryService
 * - Structured Logging: Operation IDs, security-aware logging
 * - Security-First Design: Public read access for active categories, privileged access for all
 * - Data Transformation: Mappers for Internal ↔ Response conversions
 * - Error Management: Centralized error handling with ErrorCodes
 *
 * PERMISSION SYSTEM (Membership Category Specific):
 * - PUBLIC ACCESS: Read access to ACTIVE membership categories only (for category selection)
 * - ADMIN (privilege = 2): Full read access to all categories (including inactive)
 * - MAIN (privilege = 3): Full read access to all categories (including inactive)
 * - OTHER PRIVILEGES: Read access to ACTIVE categories only
 *
 * PUBLIC API FEATURES:
 * - Public access to active membership category information for UI display
 * - Category-based lookup for membership forms
 * - Year-based category lookup for membership planning
 * - Active categories listing for public category selection
 * - User group and eligibility-based filtering
 *
 * Key Features:
 * - Public read access for active membership category information
 * - Privileged access for complete administrative lookup
 * - Category type and year-based filtering
 * - User reference validation (Account XOR Affiliate)
 * - Existence checking for uniqueness validation
 * - Performance-optimized queries for public display
 * - Operation tracking for compliance and debugging
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { MembershipCategoryResponseDto } from '../dtos/membership-category-response.dto';
import { MembershipCategoryListDto } from '../dtos/membership-category-list.dto';
import {
  MembershipCategoryRepositoryService,
  MEMBERSHIP_CATEGORY_REPOSITORY,
} from '../repositories/membership-category.repository';
import { MembershipCategoryBusinessRuleService } from './membership-category-business-rule.service';
import {
  mapDataverseToInternal,
  mapInternalToResponse,
} from '../mappers/membership-category.mapper';
import {
  Category,
  AccessModifier,
  Privilege,
  UserGroup,
} from '../../../../common/enums';

/**
 * Query interface for list operations
 * Defines filtering and pagination options
 */
export interface MembershipCategoryQueryOptions {
  // Pagination
  page?: number;
  pageSize?: number;

  // Core filtering
  osot_membership_year?: string;
  osot_membership_category?: Category;
  osot_users_group?: UserGroup;

  // User references (exclusive)
  osot_table_account?: string;
  osot_table_account_affiliate?: string;

  // Access control filtering
  osot_access_modifiers?: AccessModifier;
  osot_privilege?: Privilege;

  // Date range filtering
  membership_year_from?: string;
  membership_year_to?: string;
}

@Injectable()
export class MembershipCategoryLookupService {
  private readonly logger = new Logger(MembershipCategoryLookupService.name);

  constructor(
    @Inject(MEMBERSHIP_CATEGORY_REPOSITORY)
    private readonly repository: MembershipCategoryRepositoryService,
    private readonly businessRuleService: MembershipCategoryBusinessRuleService,
  ) {}

  /**
   * Find membership category by Category ID (Business ID)
   * Public access for active categories, privileged access for all
   */
  async findByCategoryId(
    categoryId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipCategoryResponseDto | null> {
    const opId = operationId || `find-category-${Date.now()}`;
    this.logger.log(
      `Finding membership category by ID ${categoryId} for operation ${opId}`,
    );

    try {
      const category = await this.repository.findByCategoryId(categoryId);

      if (!category) {
        return null;
      }

      // Convert to internal format
      const internal = mapDataverseToInternal(category);
      if (!internal) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to map category to internal format',
          operationId: opId,
        });
      }

      // Check access based on privilege and access modifiers
      if (!this.canAccessCategory(internal, userPrivilege)) {
        this.logger.warn(
          `Access denied for category ${categoryId}, privilege: ${userPrivilege}, access_modifier: ${internal.osot_access_modifiers}`,
        );
        return null;
      }

      const response = mapInternalToResponse(internal);
      this.logger.log(
        `Successfully found membership category ${categoryId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding membership category ${categoryId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find membership category',
        operationId: opId,
        categoryId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find membership category by System ID (Primary Key)
   * Administrative lookup method
   */
  async findBySystemId(
    systemId: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipCategoryResponseDto | null> {
    const opId = operationId || `find-system-${Date.now()}`;
    this.logger.log(
      `Finding membership category by system ID ${systemId} for operation ${opId}`,
    );

    try {
      const category = await this.repository.findById(systemId);

      if (!category) {
        return null;
      }

      // Convert to internal format
      const internal = mapDataverseToInternal(category);
      if (!internal) {
        throw createAppError(ErrorCodes.INTERNAL_ERROR, {
          message: 'Failed to map category to internal format',
          operationId: opId,
        });
      }

      // Check access based on privilege and access modifiers
      if (!this.canAccessCategory(internal, userPrivilege)) {
        this.logger.warn(
          `Access denied for system category ${systemId}, privilege: ${userPrivilege}`,
        );
        return null;
      }

      const response = mapInternalToResponse(internal);
      this.logger.log(
        `Successfully found membership category by system ID ${systemId} for operation ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding membership category by system ID ${systemId} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find membership category by system ID',
        operationId: opId,
        systemId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find membership categories by membership year and category type
   * Used for membership planning and category selection
   */
  findByYearAndCategoryType(
    membershipYear: string,
    categoryType?: Category,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipCategoryResponseDto[]> {
    const opId = operationId || `find-year-category-${Date.now()}`;
    this.logger.log(
      `Finding membership categories for year ${membershipYear}, category ${categoryType} for operation ${opId}`,
    );

    try {
      // For now, we'll simulate a repository method that filters by year
      // In future implementation, this should be added to the repository
      this.logger.warn(
        'findByYearAndCategoryType: Repository method not implemented yet, returning empty array',
      );
      return Promise.resolve([] as MembershipCategoryResponseDto[]);
    } catch (error) {
      this.logger.error(
        `Error finding membership categories for year ${membershipYear}, category ${categoryType} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message:
          'Failed to find membership categories by year and category type',
        operationId: opId,
        membershipYear,
        categoryType,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find membership categories by user reference (Account OR Affiliate)
   * Used for user-specific category lookup
   */
  findByUserReference(
    accountId?: string,
    affiliateId?: string,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipCategoryResponseDto[]> {
    const opId = operationId || `find-user-ref-${Date.now()}`;
    this.logger.log(
      `Finding membership categories for account ${accountId}, affiliate ${affiliateId} for operation ${opId}`,
    );

    // Validate exclusive OR relationship
    if (accountId && affiliateId) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message:
          'Cannot specify both account and affiliate ID - they are mutually exclusive',
        operationId: opId,
      });
    }

    if (!accountId && !affiliateId) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Must specify either account ID or affiliate ID',
        operationId: opId,
      });
    }

    try {
      // For now, we'll simulate repository methods for user reference lookup
      // In future implementation, these should be added to the repository
      this.logger.warn(
        'findByUserReference: Repository methods not implemented yet, returning empty array',
      );
      return Promise.resolve([] as MembershipCategoryResponseDto[]);
    } catch (error) {
      this.logger.error(
        `Error finding membership categories for user reference for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find membership categories by user reference',
        operationId: opId,
        accountId,
        affiliateId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find membership category by user and year
   * Used for determining user's category for a specific membership year
   *
   * @param userId - User business ID (account_id or affiliate_id)
   * @param membershipYear - Membership year (e.g., "2025")
   * @param userType - Type of user ('account' or 'affiliate')
   * @param userPrivilege - User's privilege level
   * @param operationId - Unique operation identifier
   * @returns Membership category for the specified year or null if not found
   */
  async findByUserAndYear(
    userId: string,
    membershipYear: string,
    userType: 'account' | 'affiliate',
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipCategoryResponseDto | null> {
    const opId = operationId || `find-user-year-${Date.now()}`;
    this.logger.log(
      `Finding membership category for user ${userId}, year ${membershipYear}, type ${userType} - Operation: ${opId}`,
    );

    try {
      // Get all categories for the user from repository
      const userCategories = await this.repository.findByUser(userId, userType);

      if (!userCategories || userCategories.length === 0) {
        this.logger.warn(
          `No membership categories found for user ${userId} - Operation: ${opId}`,
        );
        return null;
      }

      // Filter by membership year
      const categoryForYear = userCategories.find(
        (cat) => cat.osot_membership_year === membershipYear,
      );

      if (!categoryForYear) {
        this.logger.warn(
          `No membership category found for user ${userId}, year ${membershipYear} - Operation: ${opId}`,
        );
        return null;
      }

      // Map to internal format first
      const internalCategory = mapDataverseToInternal(categoryForYear);

      // Check access based on privilege
      // For category lookup in business rules, we allow access if user can read their own data
      const canAccess =
        userPrivilege === Privilege.ADMIN ||
        userPrivilege === Privilege.MAIN ||
        userPrivilege === Privilege.OWNER;

      if (!canAccess) {
        const privilegeStr =
          userPrivilege !== undefined ? String(userPrivilege) : 'undefined';
        this.logger.warn(
          `Access denied for category lookup - User: ${userId}, Privilege: ${privilegeStr} - Operation: ${opId}`,
        );
        return null;
      }

      const response = mapInternalToResponse(internalCategory);

      this.logger.log(
        `Successfully found category ${response.osot_membership_category} for user ${userId}, year ${membershipYear} - Operation: ${opId}`,
      );

      return response;
    } catch (error) {
      this.logger.error(
        `Error finding membership category for user ${userId}, year ${membershipYear} - Operation: ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find membership category by user and year',
        operationId: opId,
        userId,
        membershipYear,
        userType,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get active membership categories for public display
   * Always returns only accessible categories based on privilege
   */
  getActiveCategories(
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<MembershipCategoryListDto[]> {
    const opId = operationId || `active-categories-${Date.now()}`;
    this.logger.log(
      `Getting active membership categories for operation ${opId}`,
    );

    try {
      // For now, we'll simulate an active categories lookup
      // In future implementation, this should use repository filtering
      this.logger.warn(
        'getActiveCategories: Repository method not implemented yet, returning empty array',
      );
      return Promise.resolve([] as MembershipCategoryListDto[]);
    } catch (error) {
      this.logger.error(
        `Error getting active membership categories for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get active membership categories',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if a membership category exists for uniqueness validation
   * Used during creation and update operations
   */
  existsByYearAndUser(
    membershipYear: string,
    accountId?: string,
    affiliateId?: string,
    excludeCategoryId?: string,
    operationId?: string,
  ): Promise<boolean> {
    const opId = operationId || `exists-check-${Date.now()}`;
    this.logger.log(
      `Checking existence for year ${membershipYear}, account ${accountId}, affiliate ${affiliateId} for operation ${opId}`,
    );

    // Validate exclusive OR relationship
    if (accountId && affiliateId) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message:
          'Cannot specify both account and affiliate ID - they are mutually exclusive',
        operationId: opId,
      });
    }

    if (!accountId && !affiliateId) {
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Must specify either account ID or affiliate ID',
        operationId: opId,
      });
    }

    try {
      // For now, we'll simulate existence checking
      // In future implementation, this should be added to the repository
      this.logger.warn(
        'existsByYearAndUser: Repository method not implemented yet, returning false',
      );
      return Promise.resolve(false);
    } catch (error) {
      this.logger.error(
        `Error checking existence for year ${membershipYear} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to check category existence',
        operationId: opId,
        membershipYear,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get available parental leave expected options for a user
   * Used by frontend to show/hide options based on user's history
   *
   * BUSINESS RULES:
   * - Only available for Account users (NOT affiliates - companies don't take parental leave)
   * - Each option (1=FULL_YEAR, 2=SIX_MONTHS) can only be used once in user's lifetime
   * - Returns which options are still available and which have been used
   *
   * @param userId - User's business ID (osot_business_id)
   * @param userType - Type of user ('account' or 'affiliate')
   * @param operationId - Unique operation identifier for logging
   * @returns Object with available options array and used options array
   *
   * @example
   * // User has never used parental leave
   * { available: [1, 2], used: [] }
   *
   * @example
   * // User has used FULL_YEAR (1) in the past
   * { available: [2], used: [1] }
   *
   * @example
   * // User has used both options
   * { available: [], used: [1, 2] }
   *
   * @example
   * // Affiliate user (not eligible)
   * { available: [], used: [] }
   */
  getAvailableParentalLeaveOptions(
    userId: string,
    userType: 'account' | 'affiliate',
    operationId?: string,
  ): Promise<{ available: number[]; used: number[] }> {
    const opId = operationId || `parental-leave-options-${Date.now()}`;
    this.logger.log(
      `Getting available parental leave options for user ${userId}, type ${userType} - Operation: ${opId}`,
    );

    try {
      // PLACEHOLDER: Parental leave options tracking
      // Affiliate users don't have parental leave options
      if (userType === 'affiliate') {
        return Promise.resolve({
          available: [],
          used: [],
        });
      }

      // TODO: Implement parental leave history lookup
      // This is a placeholder that returns all options as available
      // Future implementation should query membership history to determine
      // which parental leave options have been used by the employee
      this.logger.warn(
        `getAvailableParentalLeaveOptions: Full implementation pending - returning default for user ${userId}`,
      );

      return Promise.resolve({
        available: [1, 2], // 1=FULL_YEAR, 2=SIX_MONTHS
        used: [],
      });
    } catch (error) {
      this.logger.error(
        `Error getting parental leave options for user ${userId} - Operation: ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to get available parental leave options',
        operationId: opId,
        userId,
        userType,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Check if user can access specific category based on access modifiers and privilege
   */
  private canAccessCategory(
    category: {
      osot_access_modifiers?: AccessModifier;
      osot_privilege?: Privilege;
    },
    userPrivilege?: Privilege,
  ): boolean {
    // Privileged users (Admin/Main) can access all categories
    if (this.canAccessAllCategories(userPrivilege)) {
      return true;
    }

    // Non-privileged users can only access public categories
    return category.osot_access_modifiers === AccessModifier.PUBLIC;
  }

  /**
   * Check if user can access all categories (including private)
   */
  private canAccessAllCategories(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}
