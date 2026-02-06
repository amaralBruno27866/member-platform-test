import { Injectable, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  Privilege,
  UserGroup,
  MembershipEligilibility,
} from '../../../../common/enums';
import { Category } from '../../../../common/enums/categories-enum';
import { MembershipCategoryCreateDto } from '../dtos/membership-category-create.dto';
import {
  UserCreationData,
  AffiliateUserCreationData,
  AccountUserCreationData,
} from '../types/user-creation-data.types';
import { MembershipCategoryRepositoryService } from '../repositories/membership-category.repository';
import { MembershipCategoryValidationService } from './membership-category-validation.service';
import { MembershipCategoryUsergroupService } from './membership-category-usergroup.service';
import { MembershipCategoryEligibilityService } from './membership-category-eligibility.service';
import { MembershipCategoryDeterminationService } from './membership-category-determination.service';
import { MembershipCategoryParentalLeaveService } from './membership-category-parental-leave.service';

import type { UserEligibilityInfo } from '../rules/membership-category-business-rules';

/**
 * Simple validation result interface for date field validation
 */
interface SimpleValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Membership Category Business Rule Service (ORCHESTRATOR)
 *
 * BUSINESS LOGIC RESPONSIBILITIES:
 * - Orchestrate membership category creation workflow
 * - Coordinate validation, user group determination, eligibility checks, and category mapping
 * - Call appropriate services based on business context
 *
 * SERVICE ARCHITECTURE:
 * This service acts as an orchestrator coordinating:
 * - MembershipCategoryValidationService: User info extraction and validation
 * - MembershipCategoryUsergroupService: Step 1 - Determine user group
 * - MembershipCategoryEligibilityService: Step 2 - Get eligibility options
 * - MembershipCategoryDeterminationService: Step 3 - Map to category
 * - MembershipCategoryParentalLeaveService: Parental leave logic
 *
 * INTEGRATION PATTERNS:
 * - All services use centralized error handling
 * - Logging with operation IDs for traceability
 *
 * @version 2.0.0 - Refactored with specialized services
 */
@Injectable()
export class MembershipCategoryBusinessRuleService {
  private readonly logger = new Logger(
    MembershipCategoryBusinessRuleService.name,
  );

  constructor(
    private readonly validationService: MembershipCategoryValidationService,
    private readonly usergroupService: MembershipCategoryUsergroupService,
    private readonly eligibilityService: MembershipCategoryEligibilityService,
    private readonly determinationService: MembershipCategoryDeterminationService,
    private readonly parentalLeaveService: MembershipCategoryParentalLeaveService,
    private readonly membershipCategoryRepository: MembershipCategoryRepositoryService,
  ) {}

  /**
   * Validate business rules for membership category creation
   * Orchestrates validation through all services
   * @param dto Create membership category DTO
   * @param userPrivilege Current user's privilege level
   * @param userContext Optional user context if available
   * @returns Validation result
   */
  async validateMembershipCategoryCreation(
    dto: MembershipCategoryCreateDto,
    userPrivilege?: Privilege,
    userContext?: { userId: string; userType: 'account' | 'affiliate' },
  ): Promise<{ isValid: boolean; errors: string[] }> {
    this.logger.debug('Validating membership category creation business rules');

    try {
      // 1. Extract user information and run basic validations via validation service
      const userInfo = await this.validationService.extractAndValidateUserInfo(
        dto,
        userContext,
      );

      // 2. Apply comprehensive business rules validation
      const validation = this.validationService.validateUserEligibilityInternal(
        userInfo,
        dto,
      );

      // 3. Validate parental leave expected if provided via parental leave service
      if (dto.osot_parental_leave_expected !== undefined) {
        const parentalLeaveValidation =
          await this.parentalLeaveService.validateParentalLeaveExpected(
            dto,
            userInfo.userId,
            userInfo.userType,
            this.membershipCategoryRepository,
          );

        if (!parentalLeaveValidation.isValid) {
          validation.isValid = false;
          validation.errors.push(
            parentalLeaveValidation.message ||
              'Invalid parental leave expected value',
          );
        }
      }

      if (!validation.isValid) {
        this.logger.warn('Membership category creation validation failed', {
          errors: validation.errors,
          userId: userInfo?.userId,
          userType: userInfo?.userType,
        });
      }

      return validation;
    } catch (error) {
      this.logger.error('Error during membership category validation', error);
      return {
        isValid: false,
        errors: ['Internal validation error occurred'],
      };
    }
  }

  /**
   * Collect extended user information needed for membership creation process
   * Delegates to usergroup service
   * @param userId User ID (Business ID)
   * @param userType Type of user (account or affiliate)
   * @returns Extended user information with all necessary data
   */
  async collectUserCreationData(
    userId: string,
    userType: 'account' | 'affiliate',
  ): Promise<UserCreationData | null> {
    try {
      this.logger.debug(
        `Collecting creation data for ${userType} user: ${userId}`,
      );

      if (userType === 'affiliate') {
        return (await this.usergroupService.collectAffiliateData(
          userId,
        )) as AffiliateUserCreationData | null;
      } else {
        return (await this.usergroupService.collectAccountData(
          userId,
        )) as AccountUserCreationData | null;
      }
    } catch (error) {
      this.logger.error(
        `Failed to collect user creation data for ${userType} ${userId}`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to collect user creation data',
      });
    }
  }

  /**
   * Check if membership category already exists for user in specific year
   * Delegates to validation service
   *
   * @param userId - User GUID (Account or Affiliate)
   * @param userType - Type of user ('account' | 'affiliate')
   * @param membershipYear - Year to check (e.g., "2025")
   * @returns true if exists, false otherwise
   */
  async checkMembershipCategoryExists(
    userId: string,
    userType: 'account' | 'affiliate',
    membershipYear: string,
  ): Promise<boolean> {
    return await this.validationService.checkMembershipCategoryExists(
      userId,
      userType,
      membershipYear,
    );
  }

  /**
   * Check if user is eligible for membership registration
   * Public method for quick eligibility check
   * Delegates to validation service
   */
  async checkUserEligibility(
    userId: string,
    userType: 'account' | 'affiliate',
  ): Promise<{
    isEligible: boolean;
    reasons?: string[];
    userInfo?: UserEligibilityInfo;
  }> {
    return await this.validationService.checkUserEligibility(userId, userType);
  }

  /**
   * Get eligibility options for API response (frontend consumption)
   * Delegates to eligibility service
   * @param userId User ID
   * @param userType User type ('account' | 'affiliate')
   * @returns Available eligibility options with display names
   */
  async getEligibilityOptionsForUser(
    userId: string,
    userType: 'account' | 'affiliate',
  ): Promise<{
    requiresEligibility: boolean;
    options: Array<{
      value: MembershipEligilibility;
      label: string;
      description: string;
    }>;
  }> {
    return await this.eligibilityService.getEligibilityOptionsForUser(
      userId,
      userType,
    );
  }

  /**
   * Determine membership category based on user group and eligibility
   * Delegates to determination service for category mapping logic (Step 3)
   *
   * @param userGroup The determined user group from Step 1
   * @param eligibility The selected eligibility from Step 2 (optional for some groups)
   * @param eligibilityAffiliate For affiliate users, separate eligibility field
   * @returns The determined membership category
   */
  determineMembershipCategory(
    userGroup: UserGroup,
    eligibility?: MembershipEligilibility,
    eligibilityAffiliate?: number,
  ): Category {
    return this.determinationService.determineMembershipCategory(
      userGroup,
      eligibility,
      eligibilityAffiliate,
    );
  }

  /**
   * Check if additional date fields are required based on eligibility
   * Delegates to parental leave service for date requirement logic
   * @param eligibility The selected eligibility
   * @returns Object indicating which date fields are required
   */
  getRequiredDateFields(eligibility?: MembershipEligilibility): {
    requiresParentalLeave: boolean;
    requiresRetirement: boolean;
    parentalLeaveFields: string[];
    retirementFields: string[];
  } {
    return this.parentalLeaveService.getRequiredDateFields(eligibility);
  }

  /**
   * Validate required date fields based on eligibility
   * Delegates to parental leave service for date validation logic
   * @param eligibility Selected eligibility
   * @param dto The membership category create DTO
   * @returns Validation result
   */
  validateRequiredDateFields(
    eligibility: MembershipEligilibility,
    dto: MembershipCategoryCreateDto,
  ): SimpleValidationResult {
    return this.parentalLeaveService.validateRequiredDateFields(
      eligibility,
      dto,
    );
  }

  /**
   * Complete membership category determination with validation
   * Orchestrates Steps 1, 2, and 3 with full validation across all services
   *
   * @param userId User ID
   * @param userType User type ('account' | 'affiliate')
   * @param eligibility Selected eligibility (for OT/OTA)
   * @param eligibilityAffiliate Selected eligibility (for affiliates)
   * @param dto The membership category create DTO (for date validation)
   * @returns Complete membership category information
   */
  async determineMembershipCategoryComplete(
    userId: string,
    userType: 'account' | 'affiliate',
    eligibility?: MembershipEligilibility,
    eligibilityAffiliate?: number,
    dto?: MembershipCategoryCreateDto,
  ): Promise<{
    userGroup: UserGroup;
    membershipCategory: Category;
    requiresEligibility: boolean;
    requiresDateFields: {
      requiresParentalLeave: boolean;
      requiresRetirement: boolean;
      parentalLeaveFields: string[];
      retirementFields: string[];
    };
    validation: {
      isValid: boolean;
      errors: string[];
    };
  }> {
    const errors: string[] = [];

    try {
      // Step 1: Determine user group via usergroup service
      const userCreationData = await this.collectUserCreationData(
        userId,
        userType,
      );

      // Type guard to safely access user_group property
      let userGroup: UserGroup | undefined;
      if (
        userCreationData &&
        userCreationData.userType === 'account' &&
        'user_group' in userCreationData
      ) {
        userGroup = userCreationData.user_group as UserGroup;
      } else if (
        userCreationData &&
        userCreationData.userType === 'affiliate'
      ) {
        userGroup = UserGroup.AFFILIATE;
      }

      if (!userGroup) {
        errors.push('Unable to determine user group for membership category');
      }

      // Step 2: Validate eligibility if required via eligibility service
      const eligibilityInfo = await this.getEligibilityOptionsForUser(
        userId,
        userType,
      );
      const requiresEligibility = eligibilityInfo.requiresEligibility;

      if (requiresEligibility && eligibility !== undefined) {
        // Check if selected eligibility is in available options
        const availableValues = eligibilityInfo.options.map((o) => o.value);
        if (!availableValues.includes(eligibility)) {
          errors.push(
            `Invalid eligibility choice: ${eligibility} is not available for this user group`,
          );
        }
      }

      // Step 3: Determine membership category via determination service
      let membershipCategory = Category.ASSOC; // Default fallback
      if (userGroup !== undefined) {
        membershipCategory = this.determineMembershipCategory(
          userGroup,
          eligibility,
          eligibilityAffiliate,
        );
      }

      // Validate required date fields if DTO provided via parental leave service
      const requiresDateFields = this.getRequiredDateFields(eligibility);
      if (dto && eligibility !== undefined) {
        try {
          const dateValidation = this.validateRequiredDateFields(
            eligibility,
            dto,
          );
          if (!dateValidation.isValid) {
            errors.push(
              dateValidation.message ?? 'Invalid date field validation',
            );
          }
        } catch (validationError) {
          this.logger.error('Date field validation error', validationError);
          errors.push('Failed to validate date fields');
        }
      }

      return {
        userGroup: userGroup ?? UserGroup.OTHER,
        membershipCategory,
        requiresEligibility,
        requiresDateFields,
        validation: {
          isValid: errors.length === 0,
          errors,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to determine membership category for user ${userId}`,
        error instanceof Error ? error.message : String(error),
      );

      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to determine membership category',
        userId,
        userType,
      });
    }
  }
}
