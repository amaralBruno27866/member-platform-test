import { Injectable, Logger, Inject } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccountStatus } from '../../../../common/enums';
import { MembershipCategoryCreateDto } from '../dtos/membership-category-create.dto';
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
} from '../../../user-account/account/interfaces/account-repository.interface';
import type { UserEligibilityInfo } from '../rules/membership-category-business-rules';

// Define interfaces for business rules validation results
interface InternalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

interface SimpleValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Membership Category Validation Service
 *
 * BUSINESS LOGIC RESPONSIBILITIES:
 * - User information extraction from DTO or context
 * - User eligibility status check (authentication, account status, active member)
 * - Membership uniqueness validation
 * - User reference exclusivity validation
 *
 * @version 1.0.0
 */
@Injectable()
export class MembershipCategoryValidationService {
  private readonly logger = new Logger(
    MembershipCategoryValidationService.name,
  );

  constructor(
    private readonly dataverseService: DataverseService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
  ) {}

  /**
   * Extract user information from DTO and validate user eligibility
   * @private
   */
  async extractAndValidateUserInfo(
    dto: MembershipCategoryCreateDto,
    userContext?: { userId: string; userType: 'account' | 'affiliate' },
  ): Promise<UserEligibilityInfo> {
    // Determine user type and ID from DTO or context
    let userId: string;
    let userType: 'account' | 'affiliate';

    if (userContext) {
      userId = userContext.userId;
      userType = userContext.userType;
    } else {
      // Extract from OData binds in DTO
      const accountBind = dto['osot_Table_Account@odata.bind'];
      const affiliateBind = dto['osot_Table_Account_Affiliate@odata.bind'];

      if (accountBind) {
        userType = 'account';
        userId = this.extractGuidFromODataBind(accountBind);
      } else if (affiliateBind) {
        userType = 'affiliate';
        userId = this.extractGuidFromODataBind(affiliateBind);
      } else {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'No valid user reference found in membership category data',
        });
      }
    }

    // Query user information from appropriate table
    const userInfo = await this.getUserInfo(userId, userType);

    if (!userInfo) {
      throw createAppError(ErrorCodes.NOT_FOUND, {
        message: `${userType === 'account' ? 'Account' : 'Affiliate'} not found: ${userId}`,
      });
    }

    return userInfo;
  }

  /**
   * Get user information from Dataverse
   * @private
   */
  async getUserInfo(
    userId: string,
    userType: 'account' | 'affiliate',
  ): Promise<UserEligibilityInfo | null> {
    try {
      if (userType === 'account') {
        // Query Account table
        const response = await this.dataverseService.request(
          'GET',
          `osot_table_accounts(${userId})?$select=osot_table_accountid,osot_account_status,osot_active_member,osot_email,osot_first_name,osot_last_name`,
        );

        if (response) {
          const account = response as {
            osot_table_accountid: string;
            osot_account_status: number;
            osot_active_member: boolean;
            osot_email: string;
            osot_first_name: string;
            osot_last_name: string;
          };
          return {
            userType: 'account',
            userId: account.osot_table_accountid,
            osot_account_status: account.osot_account_status,
            osot_active_member: account.osot_active_member,
            userEmail: account.osot_email,
            userName: `${account.osot_first_name} ${account.osot_last_name}`,
          };
        }
      } else {
        // Query Affiliate table
        const response = await this.dataverseService.request(
          'GET',
          `osot_table_account_affiliates(${userId})?$select=osot_table_account_affiliateid,osot_account_status,osot_active_member,osot_affiliate_email,osot_affiliate_name`,
        );

        if (response) {
          const affiliate = response as {
            osot_table_account_affiliateid: string;
            osot_account_status: number;
            osot_active_member: boolean;
            osot_affiliate_email: string;
            osot_affiliate_name: string;
          };
          return {
            userType: 'affiliate',
            userId: affiliate.osot_table_account_affiliateid,
            osot_account_status: affiliate.osot_account_status,
            osot_active_member: affiliate.osot_active_member,
            userEmail: affiliate.osot_affiliate_email,
            userName: affiliate.osot_affiliate_name,
          };
        }
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to get user info for ${userType} ${userId}`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: `Failed to retrieve user information`,
      });
    }
  }

  /**
   * Check if membership category already exists for user in specific year
   * OPTIMIZED QUERY: Uses specific user + year filter for performance
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
    const operationId = `check_membership_exists_${Date.now()}`;

    try {
      const userField =
        userType === 'account'
          ? '_osot_table_account_value'
          : '_osot_table_account_affiliate_value';

      // OPTIMIZED FILTER: User + Year (instead of fetching all user records)
      const filter = `${userField} eq ${userId} and osot_membership_year eq '${membershipYear}'`;
      const select = 'osot_table_membership_categoryid'; // Only need ID to check existence

      this.logger.log(
        `Checking membership category existence - Operation: ${operationId}`,
        {
          operationId,
          userId: userId.substring(0, 8) + '...',
          userType,
          membershipYear,
          timestamp: new Date().toISOString(),
        },
      );

      const response = await this.dataverseService.request(
        'GET',
        `osot_table_membership_categories?$filter=${encodeURIComponent(filter)}&$select=${select}&$top=1`,
      );

      const data = response as {
        value: Array<{ osot_table_membership_categoryid: string }>;
      };

      const exists = data.value && data.value.length > 0;

      if (exists) {
        this.logger.warn(
          `Membership category already exists - Operation: ${operationId}`,
          {
            operationId,
            userId: userId.substring(0, 8) + '...',
            userType,
            membershipYear,
            existingRecordId:
              data.value[0].osot_table_membership_categoryid.substring(0, 8) +
              '...',
            timestamp: new Date().toISOString(),
          },
        );
      }

      return exists;
    } catch (error) {
      this.logger.error(
        `Failed to check membership category existence for ${userType} ${userId} in year ${membershipYear} - Operation: ${operationId}`,
        error,
      );
      // In case of error, return false to allow validation to proceed
      // (other validations will catch issues if needed)
      return false;
    }
  }

  /**
   * Extract GUID from OData bind string
   * @private
   */
  private extractGuidFromODataBind(odataBind: string): string {
    // OData bind format: "/osot_table_accounts/123-456-789" or "/osot_table_accounts(123-456-789)"
    const match =
      odataBind.match(/\/([^/]+)\/([^)]+)\)?$/) ||
      odataBind.match(/\/([^/]+)\(([^)]+)\)$/);

    if (match && match[2]) {
      return match[2];
    }

    throw createAppError(ErrorCodes.VALIDATION_ERROR, {
      message: `Invalid OData bind format: ${odataBind}`,
    });
  }

  /**
   * Check if user is eligible for membership registration
   * Public method for quick eligibility check
   */
  async checkUserEligibility(
    userId: string,
    userType: 'account' | 'affiliate',
  ): Promise<{
    isEligible: boolean;
    reasons?: string[];
    userInfo?: UserEligibilityInfo;
  }> {
    try {
      const userInfo = await this.getUserInfo(userId, userType);

      if (!userInfo) {
        return {
          isEligible: false,
          reasons: [
            `${userType === 'account' ? 'Account' : 'Affiliate'} not found`,
          ],
        };
      }

      const errors: string[] = [];

      // Check authentication
      const authValidation: SimpleValidationResult =
        this.validateUserAuthentication(userInfo);
      if (!authValidation.isValid) {
        errors.push(
          authValidation.message ?? 'Authentication validation failed',
        );
      }

      // Check account status
      const statusValidation: SimpleValidationResult =
        this.validateAccountStatus(userInfo);
      if (!statusValidation.isValid) {
        errors.push(
          statusValidation.message ?? 'Account status validation failed',
        );
      }

      // Check active member status
      const memberValidation: SimpleValidationResult =
        this.validateNotActiveMember(userInfo);
      if (!memberValidation.isValid) {
        errors.push(
          memberValidation.message ?? 'Active member validation failed',
        );
      }

      return {
        isEligible: errors.length === 0,
        reasons: errors.length > 0 ? errors : undefined,
        userInfo,
      };
    } catch (error) {
      this.logger.error(
        `Error checking user eligibility for ${userType} ${userId}`,
        error,
      );
      return {
        isEligible: false,
        reasons: ['Error checking user eligibility'],
      };
    }
  }

  /**
   * Validate internal membership eligibility
   * Runs authentication, exclusivity, status, and member checks
   */
  validateUserEligibilityInternal(
    userInfo: UserEligibilityInfo,
    dto: MembershipCategoryCreateDto,
  ): InternalValidationResult {
    const errors: string[] = [];

    // 1. Authentication validation
    const authValidation = this.validateUserAuthentication(userInfo);
    if (!authValidation.isValid) {
      errors.push(authValidation.message ?? 'Authentication validation failed');
      return { isValid: false, errors }; // Stop here if not authenticated
    }

    // 2. User reference exclusivity validation
    const exclusivityValidation = this.validateUserReferenceExclusivity(dto);
    if (!exclusivityValidation.isValid) {
      errors.push(
        exclusivityValidation.message ?? 'User reference exclusivity error',
      );
    }

    // 3. Account status validation
    const statusValidation = this.validateAccountStatus(userInfo);
    if (!statusValidation.isValid) {
      errors.push(
        statusValidation.message ?? 'Account status validation failed',
      );
    }

    // 4. Active member validation
    const memberValidation = this.validateNotActiveMember(userInfo);
    if (!memberValidation.isValid) {
      errors.push(
        memberValidation.message ?? 'Active member validation failed',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate user authentication
   * @private
   */
  private validateUserAuthentication(
    userInfo: UserEligibilityInfo | null,
  ): SimpleValidationResult {
    if (!userInfo) {
      return {
        isValid: false,
        message: 'Usuário deve estar logado para gerar registro',
      };
    }
    return { isValid: true };
  }

  /**
   * Validate account status is ACTIVE
   * @private
   */
  private validateAccountStatus(
    userInfo: UserEligibilityInfo,
  ): SimpleValidationResult {
    // Status 1 = Active
    if (userInfo.osot_account_status !== AccountStatus.ACTIVE) {
      return {
        isValid: false,
        message:
          'O osot_account_status deve estar active para gerar registro de categoria de membership',
      };
    }
    return { isValid: true };
  }

  /**
   * Validate user is not already an active member
   * @private
   */
  private validateNotActiveMember(
    userInfo: UserEligibilityInfo,
  ): SimpleValidationResult {
    if (userInfo.osot_active_member === true) {
      return {
        isValid: false,
        message:
          'User is already an active member and cannot create new membership category',
      };
    }
    return { isValid: true };
  }

  /**
   * Validate user reference exclusivity (Account XOR Affiliate)
   * @private
   */
  private validateUserReferenceExclusivity(
    dto: MembershipCategoryCreateDto,
  ): SimpleValidationResult {
    const hasAccountReference = Boolean(dto['osot_Table_Account@odata.bind']);
    const hasAffiliateReference = Boolean(
      dto['osot_Table_Account_Affiliate@odata.bind'],
    );

    if (!hasAccountReference && !hasAffiliateReference) {
      return {
        isValid: false,
        message:
          'Membership category must be linked to either Account or Affiliate',
      };
    }

    if (hasAccountReference && hasAffiliateReference) {
      return {
        isValid: false,
        message:
          'Membership category cannot be linked to both Account and Affiliate',
      };
    }

    return { isValid: true };
  }
}
