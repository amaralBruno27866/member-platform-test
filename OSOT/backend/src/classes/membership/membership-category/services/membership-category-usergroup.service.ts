import { Injectable, Logger, Inject } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AccountGroup, UserGroup } from '../../../../common/enums';
import {
  AccountRepository,
  ACCOUNT_REPOSITORY,
} from '../../../user-account/account/interfaces/account-repository.interface';
import {
  OtEducationRepository,
  OT_EDUCATION_REPOSITORY,
} from '../../../user-account/ot-education/interfaces/ot-education-repository.interface';
import {
  OtaEducationRepository,
  OTA_EDUCATION_REPOSITORY,
} from '../../../user-account/ota-education/interfaces/ota-education-repository.interface';
import {
  AffiliateRepository,
  AFFILIATE_REPOSITORY,
} from '../../../user-account/affiliate/interfaces/affiliate-repository.interface';

/**
 * Membership Category User Group Service
 *
 * BUSINESS LOGIC RESPONSIBILITIES:
 * - Step 1: Determine user group based on account group and education
 * - Map education categories to user groups
 * - Determine which education table to use
 * - Collect education data during membership creation
 *
 * @version 1.0.0
 */
@Injectable()
export class MembershipCategoryUsergroupService {
  private readonly logger = new Logger(MembershipCategoryUsergroupService.name);

  constructor(
    private readonly dataverseService: DataverseService,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    @Inject(OT_EDUCATION_REPOSITORY)
    private readonly otEducationRepository: OtEducationRepository,
    @Inject(OTA_EDUCATION_REPOSITORY)
    private readonly otaEducationRepository: OtaEducationRepository,
    @Inject(AFFILIATE_REPOSITORY)
    private readonly affiliateRepository: AffiliateRepository,
  ) {}

  /**
   * Determine user group based on account group and education category
   * Implements the complete mapping logic for membership categories
   * @private
   */
  async determineUserGroup(
    userId: string,
    userType: 'account' | 'affiliate',
  ): Promise<UserGroup> {
    if (userType === 'affiliate') {
      return UserGroup.AFFILIATE;
    }

    // For account users, get account group from account table
    // NOTE: userId here is Business ID (osot-0000187), not GUID
    const account = await this.accountRepository.findByBusinessId(userId);
    if (!account) {
      throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
        message: `Account not found: ${userId}`,
        userId,
      });
    }

    const accountGroup = account.osot_account_group;

    // Apply account group mapping
    switch (accountGroup) {
      case AccountGroup.OTHER:
        return UserGroup.OTHER;

      case AccountGroup.VENDOR_ADVERTISER:
        return UserGroup.VENDOR_ADVERTISER_RECRUITER;

      case AccountGroup.OCCUPATIONAL_THERAPIST:
      case AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT:
        // Need to get education category for OT/OTA
        // NOTE: Pass the GUID from the fetched account, not the Business ID
        return await this.determineUserGroupWithEducation(
          account.osot_table_accountid,
          accountGroup,
        );

      default:
        this.logger.warn(
          `Unknown account group: ${accountGroup as number} for user ${userId}`,
        );
        return UserGroup.OTHER;
    }
  }

  /**
   * Determine user group for OT/OTA users based on education category
   * Falls back to UserGroup.OTHER if education data is not found
   * @private
   */
  private async determineUserGroupWithEducation(
    userId: string,
    accountGroup:
      | AccountGroup.OCCUPATIONAL_THERAPIST
      | AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT,
  ): Promise<UserGroup> {
    try {
      let educationCategory: number | undefined;

      if (accountGroup === AccountGroup.OCCUPATIONAL_THERAPIST) {
        // Get OT education data
        const otEducationRecords =
          await this.otEducationRepository.findByAccountId(userId);

        if (otEducationRecords.length === 0) {
          this.logger.warn(
            `OT education data not found for user: ${userId}. Using UserGroup.OTHER as fallback.`,
            {
              userId,
              accountGroup,
              educationTable: 'ot-education',
              fallbackUserGroup: 'OTHER',
            },
          );
          return UserGroup.OTHER; // Fallback to OTHER if no education data
        }

        // Get the most recent education record
        const mostRecent = otEducationRecords[0];
        educationCategory = mostRecent.osot_education_category;

        if (educationCategory === undefined) {
          this.logger.warn(
            `OT education category is missing for user: ${userId}. Using UserGroup.OTHER as fallback.`,
            {
              userId,
              educationTable: 'ot-education',
              fallbackUserGroup: 'OTHER',
            },
          );
          return UserGroup.OTHER; // Fallback to OTHER if category is undefined
        }

        // Apply OT mapping: Account Group = 1 (OT)
        return this.mapOTEducationToUserGroup(educationCategory);
      } else {
        // Get OTA education data
        const otaEducationRecords =
          await this.otaEducationRepository.findByAccountId(userId);

        if (otaEducationRecords.length === 0) {
          this.logger.warn(
            `OTA education data not found for user: ${userId}. Using UserGroup.OTHER as fallback.`,
            {
              userId,
              accountGroup,
              educationTable: 'ota-education',
              fallbackUserGroup: 'OTHER',
            },
          );
          return UserGroup.OTHER; // Fallback to OTHER if no education data
        }

        // Get the most recent education record
        const mostRecent = otaEducationRecords[0];
        educationCategory = mostRecent.osot_education_category;

        if (educationCategory === undefined) {
          this.logger.warn(
            `OTA education category is missing for user: ${userId}. Using UserGroup.OTHER as fallback.`,
            {
              userId,
              educationTable: 'ota-education',
              fallbackUserGroup: 'OTHER',
            },
          );
          return UserGroup.OTHER; // Fallback to OTHER if category is undefined
        }

        // Apply OTA mapping: Account Group = 2 (OTA)
        return this.mapOTAEducationToUserGroup(educationCategory);
      }
    } catch (error) {
      this.logger.error(
        `Failed to determine user group with education for user ${userId}, accountGroup ${accountGroup}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Map OT education category to user group
   * @private
   */
  private mapOTEducationToUserGroup(educationCategory: number): UserGroup {
    switch (educationCategory) {
      case 0: // Graduated
        return UserGroup.OT;
      case 1: // Student
        return UserGroup.OT_STUDENT;
      case 2: // New Graduated
        return UserGroup.OT_STUDENT_NEW_GRAD;
      default:
        throw createAppError(ErrorCodes.INVALID_EDUCATION_CATEGORY, {
          message: `Invalid OT education category: ${educationCategory}`,
          category: educationCategory,
          accountGroup: AccountGroup.OCCUPATIONAL_THERAPIST,
        });
    }
  }

  /**
   * Map OTA education category to user group
   * @private
   */
  private mapOTAEducationToUserGroup(educationCategory: number): UserGroup {
    switch (educationCategory) {
      case 0: // Graduated
        return UserGroup.OTA;
      case 1: // Student
        return UserGroup.OTA_STUDENT;
      case 2: // New Graduated
        return UserGroup.OTA_STUDENT_NEW_GRAD;
      default:
        throw createAppError(ErrorCodes.INVALID_EDUCATION_CATEGORY, {
          message: `Invalid OTA education category: ${educationCategory}`,
          category: educationCategory,
          accountGroup: AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT,
        });
    }
  }

  /**
   * Collect Affiliate specific data for membership creation
   * Accepts Business ID and converts to GUID for Dataverse lookup
   * @private
   */
  async collectAffiliateData(affiliateBusinessId: string): Promise<{
    userType: 'affiliate';
    userGuid: string;
    affiliate_id: string;
  } | null> {
    // Convert Business ID to GUID for Dataverse lookup
    const affiliate =
      await this.affiliateRepository.findByBusinessId(affiliateBusinessId);

    if (!affiliate) {
      return null;
    }

    return {
      userType: 'affiliate',
      userGuid: affiliate.osot_table_account_affiliateid,
      affiliate_id: affiliate.osot_affiliate_id,
    };
  }

  /**
   * Collect Account specific data for membership creation
   * @private
   */
  async collectAccountData(userId: string): Promise<{
    userType: 'account';
    userGuid: string;
    user_group: UserGroup;
    education_category?: string;
    education_table?: 'ot-education' | 'ota-education';
  } | null> {
    // NOTE: userId here is Business ID (osot-0000187), need to fetch GUID
    const account = await this.accountRepository.findByBusinessId(userId);
    if (!account) {
      throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
        message: `Account not found: ${userId}`,
        userId,
      });
    }

    // Determine user group using the Business ID
    const userGroup = await this.determineUserGroup(userId, 'account');

    // Collect education data based on the determined user_group
    // Pass GUID to collectEducationData as it queries Dataverse
    const educationData = await this.collectEducationData(
      userGroup,
      account.osot_table_accountid,
    );

    return {
      userType: 'account',
      userGuid: account.osot_table_accountid, // Return GUID, not Business ID
      user_group: userGroup,
      ...educationData,
    };
  }

  /**
   * Collect education data based on user group
   * @private
   */
  private async collectEducationData(
    userGroup: UserGroup,
    userId: string,
  ): Promise<{
    education_category?: string;
    education_table?: 'ot-education' | 'ota-education';
  }> {
    try {
      // Determine which education table to query based on user_group
      const educationTable = this.determineEducationTable(userGroup);

      if (!educationTable) {
        this.logger.warn(
          `No education table determined for user_group: ${userGroup}`,
        );
        return {};
      }

      // Query the appropriate education table
      const tableName =
        educationTable === 'ot-education'
          ? 'osot_table_ot_educations'
          : 'osot_table_ota_educations';

      const response = await this.dataverseService.request(
        'GET',
        `${tableName}?$filter=_osot_table_account_value eq ${userId}&$select=osot_education_category&$top=1`,
      );

      const data = response as {
        value: Array<{
          osot_education_category?: string;
        }>;
      };

      const education = data.value?.[0];

      return {
        education_category: education?.osot_education_category,
        education_table: educationTable,
      };
    } catch (error) {
      this.logger.error(
        `Failed to collect education data for user_group ${userGroup}`,
        error,
      );
      // Return empty object instead of throwing to allow process to continue
      return {};
    }
  }

  /**
   * Determine which education table to use based on user group
   * @private
   */
  private determineEducationTable(
    userGroup: UserGroup,
  ): 'ot-education' | 'ota-education' | null {
    // Determine education table based on UserGroup enum
    switch (userGroup) {
      case UserGroup.OT_STUDENT:
      case UserGroup.OT_STUDENT_NEW_GRAD:
      case UserGroup.OT:
        return 'ot-education';

      case UserGroup.OTA_STUDENT:
      case UserGroup.OTA_STUDENT_NEW_GRAD:
      case UserGroup.OTA:
        return 'ota-education';

      // These user groups don't have education tables
      case UserGroup.VENDOR_ADVERTISER_RECRUITER:
      case UserGroup.OTHER:
      case UserGroup.AFFILIATE:
      default:
        return null;
    }
  }
}
