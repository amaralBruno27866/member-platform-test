import { Injectable, Logger } from '@nestjs/common';
import { MembershipOrchestratorRepository } from '../repositories/membership-orchestrator.repository';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccountGroup } from '../../../../common/enums/account-group.enum';
import { UserGroup } from '../../../../common/enums/user-group.enum';
import { Category } from '../../../../common/enums/categories-enum';

/**
 * Step 1-2: Membership Eligibility Validator Service
 *
 * Validates membership eligibility and determines user group/category:
 * - Step 1: Verify basic eligibility (not already member, account exists, etc.)
 * - Step 2: Determine user group and membership category based on account group
 */
@Injectable()
export class Step1_2EligibilityValidatorService {
  private readonly logger = new Logger(Step1_2EligibilityValidatorService.name);

  constructor(private readonly repository: MembershipOrchestratorRepository) {}

  /**
   * Validate membership eligibility
   * Checks if user can register for new membership
   */
  async validateEligibility(
    userGuid: string,
    organizationId: string,
    membershipYear: string,
  ): Promise<{
    isEligible: boolean;
    reason?: string;
    membershipType: 'NEW' | 'RENEWAL';
    accountGroup: AccountGroup;
    previousYears: string[];
  }> {
    const operationId = `validate_eligibility_${Date.now()}`;

    try {
      // Get account and check osot_active_member status
      const account = (await this.repository.findAccountById(userGuid)) as {
        osot_table_accountid: string;
        osot_active_member: boolean;
        osot_account_group: number;
      } | null;

      if (!account) {
        throw createAppError(ErrorCodes.NOT_FOUND, {
          message: 'Account not found',
          userGuid,
          operationId,
        });
      }

      // Check if user already has active membership
      if (account.osot_active_member === true) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'User already has an active membership',
          userGuid,
          operationId,
        });
      }

      // Check if user already registered for this year
      const existingCategoryForYear =
        await this.repository.findCategoriesByUser(userGuid, 'account');

      // Filter for current year if needed
      const categoryForYear = existingCategoryForYear?.find(
        (cat: { osot_membership_year?: string }) =>
          cat.osot_membership_year === membershipYear,
      );

      if (categoryForYear) {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'User already registered for this membership year',
          userGuid,
          membershipYear,
          operationId,
        });
      }

      // Check ALL existing membership-category records (any year)
      const allExistingCategories = (await this.repository.findCategoriesByUser(
        userGuid,
        'account',
      )) as Array<{ osot_membership_year: string }>;

      const membershipType: 'NEW' | 'RENEWAL' =
        allExistingCategories.length === 0 ? 'NEW' : 'RENEWAL';

      const previousYears: string[] = allExistingCategories.map(
        (cat: { osot_membership_year: string }) => cat.osot_membership_year,
      );

      const accountGroup: AccountGroup = account.osot_account_group;

      this.logger.log(
        `✅ Eligibility verified - Type: ${membershipType} | Account Group: ${accountGroup} | Previous years: ${previousYears.join(', ') || 'None'}`,
      );

      return {
        isEligible: true,
        membershipType,
        accountGroup,
        previousYears,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `❌ Eligibility check failed - User: ${userGuid}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Failed to validate membership eligibility',
        operationId,
        userGuid,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Determine user group and membership category
   * Based on account group and education level
   */
  async determineUserGroupAndCategory(
    accountGroup: number,
    organizationId: string,
    otEducationLookupService: {
      hasEducationRecords: (id: string) => Promise<boolean>;
    },
    otaEducationLookupService: {
      hasEducationRecords: (id: string) => Promise<boolean>;
    },
  ): Promise<{
    usersGroup: UserGroup | null;
    needsEligibility: boolean;
    membershipCategory: Category | null;
    needsEmployment: boolean;
    needsPractices: boolean;
  }> {
    const operationId = `determine_user_group_${Date.now()}`;

    try {
      let usersGroup: UserGroup | null = null;
      let needsEligibility = false;
      let membershipCategory: Category | null = null;
      let needsEmployment = false;
      let needsPractices = false;

      // OT (1) or OTA (2) - Education-based determination
      if (accountGroup === 1 || accountGroup === 2) {
        const isOT = accountGroup === 1;

        // Check for education records
        const educationLookupService = isOT
          ? otEducationLookupService
          : otaEducationLookupService;

        const hasEducation =
          await educationLookupService.hasEducationRecords(organizationId);

        if (!hasEducation) {
          throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
            message: 'No education records found for user',
            accountGroup,
            operationId,
          });
        }

        // Determine Users Group and Category (education-based)
        usersGroup = isOT ? 5 : 6; // UserGroup.OT = 5, UserGroup.OTA = 6
        needsEligibility = true;
        // Category will be determined by frontend from eligibility selection
      } else if (accountGroup === 3 || accountGroup === 4) {
        // Vendors/Others have predefined membership categories
        usersGroup = accountGroup === 3 ? 7 : 8; // UserGroup.VENDOR = 7, UserGroup.OTHER = 8
        membershipCategory = accountGroup === 3 ? 14 : 13; // Category.AFF_PRIM = 14, Category.ASSOC = 13
        needsEligibility = false;
        needsEmployment = false;
        needsPractices = false;
      } else if (accountGroup === 5) {
        // STAFF - No membership allowed
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'STAFF accounts cannot register for membership',
          accountGroup,
          operationId,
        });
      } else {
        throw createAppError(ErrorCodes.BUSINESS_RULE_VIOLATION, {
          message: 'Unknown account group',
          accountGroup,
          operationId,
        });
      }

      // Determine if Employment and Practices are required
      // Categories that need Employment & Practices: OT_PR(1), OT_NG(4), OT_LIFE(6), OTA_PR(7), OTA_NG(10), OTA_LIFE(12)
      const CATEGORIES_NEEDING_EMPLOYMENT_AND_PRACTICES = [1, 4, 6, 7, 10, 12];

      if (membershipCategory !== null) {
        needsEmployment = CATEGORIES_NEEDING_EMPLOYMENT_AND_PRACTICES.includes(
          membershipCategory as number,
        );
        needsPractices = CATEGORIES_NEEDING_EMPLOYMENT_AND_PRACTICES.includes(
          membershipCategory as number,
        );
      }

      this.logger.log(
        `✅ User group determined - Group: ${usersGroup} | Category: ${membershipCategory || 'TBD'} | Needs Employment: ${needsEmployment}`,
      );

      return {
        usersGroup,
        needsEligibility,
        membershipCategory,
        needsEmployment,
        needsPractices,
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `❌ User group determination failed`,
        error instanceof Error ? error.stack : String(error),
      );

      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Failed to determine user group and category',
        operationId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
