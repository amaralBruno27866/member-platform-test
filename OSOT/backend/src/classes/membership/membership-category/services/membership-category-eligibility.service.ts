import { Injectable, Logger } from '@nestjs/common';
import { UserGroup, MembershipEligilibility } from '../../../../common/enums';
import { getEligibilityDisplayName } from '../../../../common/enums/eligibility-enum';
import { MembershipCategoryUsergroupService } from './membership-category-usergroup.service';

interface SimpleValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Membership Category Eligibility Service
 *
 * BUSINESS LOGIC RESPONSIBILITIES:
 * - Step 2: Get available eligibility options based on user group
 * - Check if eligibility is required for a user group
 * - Validate eligibility choices against available options
 * - Get eligibility options for API responses (frontend consumption)
 * - Provide descriptions for each eligibility option
 *
 * @version 1.0.0
 */
@Injectable()
export class MembershipCategoryEligibilityService {
  private readonly logger = new Logger(
    MembershipCategoryEligibilityService.name,
  );

  constructor(
    private readonly usergroupService: MembershipCategoryUsergroupService,
  ) {}

  /**
   * Get available eligibility options based on user group
   * Step 2: Only applies to OT (5) and OTA (6) user groups
   * @param userGroup The determined user group from Step 1
   * @returns Array of available eligibility options
   */
  getAvailableEligibilityOptions(
    userGroup: UserGroup,
  ): MembershipEligilibility[] {
    // Select the eligibility options based on the user's group.
    switch (userGroup) {
      case UserGroup.OT: // user_group = 5
        // OT options: 0,1,2,5,6
        return [
          MembershipEligilibility.NONE, // 0
          MembershipEligilibility.QUESTION_1, // 1 - Living and working as OT
          MembershipEligilibility.QUESTION_2, // 2 - Registering with College
          MembershipEligilibility.QUESTION_5, // 5 - Retired or resigned
          MembershipEligilibility.QUESTION_6, // 6 - On Parental leave
        ];

      case UserGroup.OTA: // user_group = 6
        // OTA options: 0,3,4,5,6
        return [
          MembershipEligilibility.NONE, // 0
          MembershipEligilibility.QUESTION_3, // 3 - Living and working as assistant
          MembershipEligilibility.QUESTION_4, // 4 - Previously worked as assistant
          MembershipEligilibility.QUESTION_5, // 5 - Retired or resigned
          MembershipEligilibility.QUESTION_6, // 6 - On Parental leave
        ];

      // All other user groups don't require eligibility selection
      case UserGroup.OT_STUDENT:
      case UserGroup.OT_STUDENT_NEW_GRAD:
      case UserGroup.OTA_STUDENT:
      case UserGroup.OTA_STUDENT_NEW_GRAD:
      case UserGroup.VENDOR_ADVERTISER_RECRUITER:
      case UserGroup.OTHER:
      case UserGroup.AFFILIATE:
      default:
        return []; // No eligibility options for these groups
    }
  }

  /**
   * Check if eligibility selection is required for the given user group
   * @param userGroup The user group from Step 1
   * @returns true if eligibility selection is required
   */
  isEligibilityRequired(userGroup: UserGroup): boolean {
    // Eligibility is required only for OT and OTA groups.
    return userGroup === UserGroup.OT || userGroup === UserGroup.OTA;
  }

  /**
   * Validate that the selected eligibility is valid for the user group
   * @param userGroup The user group from Step 1
   * @param selectedEligibility The eligibility selected by the user
   * @returns Validation result
   */
  validateEligibilityChoice(
    userGroup: UserGroup,
    selectedEligibility: MembershipEligilibility,
  ): SimpleValidationResult {
    // If eligibility is not required, skip validation
    if (!this.isEligibilityRequired(userGroup)) {
      // Return a passing validation result.
      return { isValid: true };
    }

    // Get available options for this user group
    const availableOptions = this.getAvailableEligibilityOptions(userGroup);

    // Check if selected eligibility is in available options
    const isValidChoice = availableOptions.includes(selectedEligibility);

    if (!isValidChoice) {
      // Build a user-friendly message with valid values.
      const userGroupName = userGroup === UserGroup.OT ? 'OT' : 'OTA';
      const availableValues = availableOptions.join(', ');

      return {
        isValid: false,
        message: `Invalid eligibility choice ${selectedEligibility} for ${userGroupName} user. Available options: ${availableValues}`,
      };
    }

    // Selected eligibility is valid.
    return { isValid: true };
  }

  /**
   * Get eligibility options for API response (frontend consumption)
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
    try {
      // Step 1: Determine user group
      const userGroup = await this.usergroupService.determineUserGroup(
        userId,
        userType,
      );

      // Step 2: Check if eligibility is required
      const requiresEligibility = this.isEligibilityRequired(userGroup);

      if (!requiresEligibility) {
        // If no eligibility is required, return empty options.
        return {
          requiresEligibility: false,
          options: [],
        };
      }

      // Get available options
      const availableOptions = this.getAvailableEligibilityOptions(userGroup);

      // Map to display format
      const options = availableOptions.map((eligibility) => {
        // Build a display record for the frontend.
        return {
          value: eligibility,
          label: getEligibilityDisplayName(eligibility),
          description: this.getEligibilityDescription(eligibility),
        };
      });

      return {
        requiresEligibility: true,
        options,
      };
    } catch (error) {
      // Log the error before returning a standardized failure.
      this.logger.error(
        `Failed to get eligibility options for user ${userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get additional description for eligibility options
   * @private
   */
  private getEligibilityDescription(
    eligibility: MembershipEligilibility,
  ): string {
    // Map each eligibility value to a descriptive message.
    switch (eligibility) {
      case MembershipEligilibility.NONE:
        return 'Select if none of the other options apply to your situation';
      case MembershipEligilibility.QUESTION_1:
        return 'For OT professionals currently practicing in Ontario';
      case MembershipEligilibility.QUESTION_2:
        return 'For those in the process of registration with the College';
      case MembershipEligilibility.QUESTION_3:
        return 'For OTA professionals currently working in Ontario';
      case MembershipEligilibility.QUESTION_4:
        return 'For those who previously worked as an OT assistant';
      case MembershipEligilibility.QUESTION_5:
        return 'For retired or resigned professionals';
      case MembershipEligilibility.QUESTION_6:
        return 'For those currently on parental leave';
      default:
        return 'Please contact support for more information';
    }
  }
}
