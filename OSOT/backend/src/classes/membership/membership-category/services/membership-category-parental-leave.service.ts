import { Injectable, Logger } from '@nestjs/common';
import { UserGroup, MembershipEligilibility } from '../../../../common/enums';
import { MembershipCategoryCreateDto } from '../dtos/membership-category-create.dto';
import { MembershipCategoryRepositoryService } from '../repositories/membership-category.repository';

interface SimpleValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Membership Category Parental Leave Service
 *
 * BUSINESS LOGIC RESPONSIBILITIES:
 * - Get available parental leave period options based on user history
 * - Validate parental leave expected field (1=FULL_YEAR, 2=SIX_MONTHS)
 * - Check required date fields based on eligibility selection
 * - Validate date logic for parental leave and retirement dates
 *
 * PARENTAL LEAVE RULES:
 * 1. Only available for Account users (NOT affiliates)
 * 2. Only when osot_users_group = OT(5) or OTA(6)
 * 3. Only when osot_eligibility = 6 (On Parental Leave)
 * 4. Requires osot_parental_leave_from and osot_parental_leave_to
 * 5. Each option (1=FULL_YEAR, 2=SIX_MONTHS) can only be used once in lifetime
 *
 * @version 1.0.0
 */
@Injectable()
export class MembershipCategoryParentalLeaveService {
  private readonly logger = new Logger(
    MembershipCategoryParentalLeaveService.name,
  );

  /**
   * Check if additional date fields are required based on eligibility
   * @param eligibility The selected eligibility
   * @returns Object indicating which date fields are required
   */
  getRequiredDateFields(eligibility?: MembershipEligilibility): {
    requiresParentalLeave: boolean;
    requiresRetirement: boolean;
    parentalLeaveFields: string[];
    retirementFields: string[];
  } {
    // Initialize the result shape with defaults.
    const result = {
      requiresParentalLeave: false,
      requiresRetirement: false,
      parentalLeaveFields: [] as string[],
      retirementFields: [] as string[],
    };

    if (eligibility === MembershipEligilibility.QUESTION_6) {
      // Parental leave
      result.requiresParentalLeave = true;
      result.parentalLeaveFields = [
        'osot_parental_leave_from',
        'osot_parental_leave_to',
      ];
    }

    if (eligibility === MembershipEligilibility.QUESTION_5) {
      // Retired or resigned
      result.requiresRetirement = true;
      result.retirementFields = ['osot_retirement_start'];
    }

    // Return the required field metadata.
    return result;
  }

  /**
   * Validate required date fields based on eligibility
   * @param eligibility Selected eligibility
   * @param dto The membership category create DTO
   * @returns Validation result
   */
  validateRequiredDateFields(
    eligibility: MembershipEligilibility,
    dto: MembershipCategoryCreateDto,
  ): SimpleValidationResult {
    // Resolve which date fields are required for the selected eligibility.
    const requiredFields = this.getRequiredDateFields(eligibility);

    // Check parental leave fields
    if (requiredFields.requiresParentalLeave) {
      if (!dto.osot_parental_leave_from || !dto.osot_parental_leave_to) {
        // Fail if either parental leave date is missing.
        return {
          isValid: false,
          message:
            'Parental leave dates (from and to) are required when selecting parental leave eligibility',
        };
      }

      // Validate date logic
      const fromDate = new Date(dto.osot_parental_leave_from);
      const toDate = new Date(dto.osot_parental_leave_to);

      if (fromDate >= toDate) {
        // Fail if the end date is not after the start date.
        return {
          isValid: false,
          message: 'Parental leave end date must be after start date',
        };
      }
    }

    // Check retirement fields
    if (requiredFields.requiresRetirement) {
      if (!dto.osot_retirement_start) {
        // Fail if retirement start date is missing.
        return {
          isValid: false,
          message:
            'Retirement start date is required when selecting retired/resigned eligibility',
        };
      }

      // Validate retirement date is not in future
      const retirementDate = new Date(dto.osot_retirement_start);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for date comparison

      if (retirementDate > today) {
        // Fail if retirement date is in the future.
        return {
          isValid: false,
          message: 'Retirement date cannot be in the future',
        };
      }
    }

    // All required date fields are valid.
    return { isValid: true };
  }

  /**
   * Get available parental leave expected options for a user
   * Returns array of available options based on user's history
   * @param userId User's business ID
   * @param userType Type of user (account or affiliate)
   * @param repository Repository instance for querying history
   * @returns Array of available options: [1, 2] (all), [1] or [2] (one remaining), or [] (none)
   */
  async getAvailableParentalLeaveOptions(
    userId: string,
    userType: 'account' | 'affiliate',
    repository: MembershipCategoryRepositoryService,
  ): Promise<number[]> {
    // Parental leave expected is NOT available for affiliates.
    if (userType === 'affiliate') {
      // Return no options for affiliates.
      return [];
    }

    // Wrap the repository lookup in a try/catch to handle data access errors.
    try {
      // Query the user's historical parental leave selections.
      const usedOptions: number[] =
        await repository.findParentalLeaveHistoryByUser(userId, userType);

      // Define all supported options: 1 = full year, 2 = six months.
      const allOptions = [1, 2];

      // Return only options that the user has not used yet.
      return allOptions.filter((option) => !usedOptions.includes(option));
    } catch (error) {
      // Log the error with context for troubleshooting.
      this.logger.error(
        `Failed to get available parental leave options for user ${userId}`,
        error,
      );
      // On error, return an empty list as a conservative fallback.
      return [];
    }
  }

  /**
   * Validate parental leave expected field for create/update operations
   * Enforces business rules:
   * 1. Only available for Account users (NOT affiliates)
   * 2. Only when osot_users_group = OT(5) or OTA(6)
   * 3. Only when osot_eligibility = 6 (On Parental Leave)
   * 4. Requires osot_parental_leave_from and osot_parental_leave_to
   * 5. Each option (1=FULL_YEAR, 2=SIX_MONTHS) can only be used once in user's lifetime
   *
   * @param dto DTO with parental leave expected value
   * @param userId User's business ID
   * @param userType Type of user (account or affiliate)
   * @param repository Repository instance for querying history
   * @returns Validation result with errors if any
   */
  async validateParentalLeaveExpected(
    dto: {
      osot_parental_leave_expected?: number;
      osot_users_group?: UserGroup;
      osot_eligibility?: number;
      osot_parental_leave_from?: string;
      osot_parental_leave_to?: string;
    },
    userId: string,
    userType: 'account' | 'affiliate',
    repository: MembershipCategoryRepositoryService,
  ): Promise<SimpleValidationResult> {
    // If the field is not provided, there is nothing to validate.
    if (dto.osot_parental_leave_expected === undefined) {
      // Return a passing validation result.
      return { isValid: true };
    }

    // Rule 1: Parental leave is NOT allowed for affiliates.
    if (userType === 'affiliate') {
      // Reject the request for affiliate users.
      return {
        isValid: false,
        message:
          'Parental Leave Expected is not available for Affiliate users. This feature is only for Account users (OT/OTA practitioners)',
      };
    }

    // Rule 2: Only OT or OTA user groups can use this field.
    if (
      dto.osot_users_group !== UserGroup.OT &&
      dto.osot_users_group !== UserGroup.OTA
    ) {
      // Reject if the user group is not eligible.
      return {
        isValid: false,
        message:
          'Parental Leave Expected is only available for OT or OTA practitioners',
      };
    }

    // Rule 3: Eligibility must be "On Parental Leave" (value 6).
    if (dto.osot_eligibility !== 6) {
      // Reject if eligibility is not the required value.
      return {
        isValid: false,
        message:
          'Parental Leave Expected requires eligibility "On Parental Leave" (value 6)',
      };
    }

    // Rule 4: Both parental leave dates are required.
    if (!dto.osot_parental_leave_from || !dto.osot_parental_leave_to) {
      // Reject if either date is missing.
      return {
        isValid: false,
        message:
          'Parental Leave Expected requires both parental leave from and to dates',
      };
    }

    // Rule 5: Validate one-time use by checking available options.
    try {
      // Load the remaining options the user can select.
      const availableOptions = await this.getAvailableParentalLeaveOptions(
        userId,
        userType,
        repository,
      );

      // Ensure the requested option is still available.
      if (!availableOptions.includes(dto.osot_parental_leave_expected)) {
        // Determine the display label for the rejected option.
        const optionName =
          dto.osot_parental_leave_expected === 1
            ? 'Full Year (12 months)'
            : 'Six Months';

        // Return an error explaining that this option was already used.
        return {
          isValid: false,
          message: `${optionName} parental leave has already been used. Each parental leave option can only be used once for insurance coverage purposes.`,
        };
      }

      // All checks passed.
      return { isValid: true };
    } catch (error) {
      // Log the error for troubleshooting.
      this.logger.error(
        `Failed to validate parental leave expected for user ${userId}`,
        error,
      );
      // Return a safe error message to the caller.
      return {
        isValid: false,
        message:
          'Failed to validate parental leave expected. Please try again.',
      };
    }
  }
}
