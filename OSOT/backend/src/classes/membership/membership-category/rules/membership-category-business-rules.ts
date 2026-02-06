/**
 * Membership Category Business Rules (PURE VALIDATION LOGIC)
 *
 * CLEAR ARCHITECTURAL SEPARATION:
 * - rules: Business validation logic ONLY
 * - utils: Helper functions and utilities ONLY
 * - validators: DTO format validation ONLY
 * - services: Enterprise orchestration ONLY
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for business rule violations
 * - enums: Uses centralized enums for business logic
 * - interfaces: Uses membership category interfaces for type safety
 *
 * BUSINESS RULES PHILOSOPHY:
 * - Essential membership category business rules validation
 * - User eligibility validation for membership registration
 * - Account and Affiliate status validation
 * - Membership uniqueness validation
 * - Anti-fraud protection through user verification
 * - NO helper functions (those go in utils/)
 * - NO DTO validation (those go in validators/)
 */

import { AccountStatus } from '../../../../common/enums';
import { MembershipCategoryCreateDto } from '../dtos/membership-category-create.dto';

/**
 * User eligibility information for membership validation
 */
export interface UserEligibilityInfo {
  userType: 'account' | 'affiliate';
  userId: string;
  osot_account_status: AccountStatus;
  osot_active_member: boolean;
  userEmail?: string;
  userName?: string;
}

/**
 * Membership Category Business Rules Validator
 * PURE VALIDATION LOGIC - No helpers, no transformations
 */
export class MembershipCategoryBusinessRulesValidator {
  // ========================================
  // USER AUTHENTICATION VALIDATION
  // ========================================

  /**
   * Validate that user is authenticated for membership registration
   * @param userInfo User information from authentication context
   * @returns Validation result
   */
  static validateUserAuthentication(userInfo: UserEligibilityInfo | null): {
    isValid: boolean;
    message?: string;
  } {
    if (!userInfo) {
      return {
        isValid: false,
        message: 'User must be authenticated to create membership category',
      };
    }

    if (!userInfo.userId || !userInfo.userType) {
      return {
        isValid: false,
        message: 'Invalid user authentication context',
      };
    }

    return { isValid: true };
  }

  // ========================================
  // ACCOUNT STATUS VALIDATION
  // ========================================

  /**
   * Validate that user account status is ACTIVE
   * Business Rule: Only users with active account status can register for membership
   * @param userInfo User information including account status
   * @returns Validation result
   */
  static validateAccountStatus(userInfo: UserEligibilityInfo): {
    isValid: boolean;
    message?: string;
  } {
    if (userInfo.osot_account_status !== AccountStatus.ACTIVE) {
      const statusName = this.getAccountStatusName(
        userInfo.osot_account_status,
      );
      return {
        isValid: false,
        message: `User account status must be ACTIVE to register for membership. Current status: ${statusName}`,
      };
    }

    return { isValid: true };
  }

  // ========================================
  // ACTIVE MEMBER VALIDATION
  // ========================================

  /**
   * Validate that user is NOT already an active member
   * Business Rule: Only non-members (osot_active_member = false) can create new membership categories
   * @param userInfo User information including active member status
   * @returns Validation result
   */
  static validateNotActiveMember(userInfo: UserEligibilityInfo): {
    isValid: boolean;
    message?: string;
  } {
    if (userInfo.osot_active_member === true) {
      return {
        isValid: false,
        message:
          'User is already an active member and cannot create new membership category',
      };
    }

    return { isValid: true };
  }

  // ========================================
  // MEMBERSHIP UNIQUENESS VALIDATION
  // ========================================

  /**
   * Validate membership category uniqueness for user and year
   * Business Rule: One membership category per user per year
   * @param userId User ID (Account or Affiliate GUID)
   * @param userType Type of user ('account' | 'affiliate')
   * @param membershipYear Year for the membership
   * @param existingCategories Array of existing membership categories for the user
   * @returns Validation result
   */
  static validateMembershipUniqueness(
    userId: string,
    userType: 'account' | 'affiliate',
    membershipYear: string,
    existingCategories: Array<{
      osot_membership_year: string;
      osot_table_account?: string;
      osot_table_account_affiliate?: string;
    }>,
  ): { isValid: boolean; message?: string } {
    const conflictingCategory = existingCategories.find((category) => {
      const isSameYear = category.osot_membership_year === membershipYear;
      const isSameUser =
        userType === 'account'
          ? category.osot_table_account === userId
          : category.osot_table_account_affiliate === userId;

      return isSameYear && isSameUser;
    });

    if (conflictingCategory) {
      return {
        isValid: false,
        message: `Membership category already exists for ${userType} ${userId} in year ${membershipYear}`,
      };
    }

    return { isValid: true };
  }

  // ========================================
  // USER REFERENCE EXCLUSIVITY VALIDATION
  // ========================================

  /**
   * Validate that only ONE user reference is provided (Account XOR Affiliate)
   * Business Rule: Membership category must be linked to either Account OR Affiliate, never both
   * @param dto Create membership category DTO
   * @returns Validation result
   */
  static validateUserReferenceExclusivity(dto: MembershipCategoryCreateDto): {
    isValid: boolean;
    message?: string;
  } {
    const hasAccount = !!dto['osot_Table_Account@odata.bind'];
    const hasAffiliate = !!dto['osot_Table_Account_Affiliate@odata.bind'];

    // Must have exactly one reference
    if (!hasAccount && !hasAffiliate) {
      return {
        isValid: false,
        message:
          'Membership category must be linked to either Account or Affiliate',
      };
    }

    if (hasAccount && hasAffiliate) {
      return {
        isValid: false,
        message:
          'Membership category cannot be linked to both Account and Affiliate',
      };
    }

    return { isValid: true };
  }

  // ========================================
  // MEMBERSHIP DECLARATION VALIDATION
  // ========================================

  // ========================================
  // COMPREHENSIVE ELIGIBILITY VALIDATION
  // ========================================

  /**
   * Validate complete user eligibility for membership registration
   * Combines all business rules for membership category creation
   * @param userInfo User information from authentication and database
   * @param dto Create membership category DTO
   * @param existingCategories Existing membership categories for uniqueness check
   * @returns Validation result with all errors
   */
  static validateUserEligibility(
    userInfo: UserEligibilityInfo | null,
    dto: MembershipCategoryCreateDto,
    existingCategories: Array<{
      osot_membership_year: string;
      osot_table_account?: string;
      osot_table_account_affiliate?: string;
    }>,
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 1. Authentication validation
    const authValidation = this.validateUserAuthentication(userInfo);
    if (!authValidation.isValid) {
      errors.push(authValidation.message ?? 'Authentication error');
      return { isValid: false, errors }; // Stop here if not authenticated
    }

    // 2. User reference exclusivity validation
    const exclusivityValidation = this.validateUserReferenceExclusivity(dto);
    if (!exclusivityValidation.isValid) {
      errors.push(
        exclusivityValidation.message ?? 'User reference exclusivity error',
      );
    }

    // 4. Account status validation
    const statusValidation = this.validateAccountStatus(userInfo);
    if (!statusValidation.isValid) {
      errors.push(statusValidation.message ?? 'Account status error');
    }

    // 5. Active member validation
    const memberValidation = this.validateNotActiveMember(userInfo);
    if (!memberValidation.isValid) {
      errors.push(memberValidation.message ?? 'Active member validation error');
    }

    // 6. Membership uniqueness validation
    const uniquenessValidation = this.validateMembershipUniqueness(
      userInfo.userId,
      userInfo.userType,
      dto.osot_membership_year,
      existingCategories,
    );
    if (!uniquenessValidation.isValid) {
      errors.push(
        uniquenessValidation.message ?? 'Membership uniqueness error',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Get human-readable account status name
   * @param status Account status enum value
   * @returns Status name
   */
  private static getAccountStatusName(status: AccountStatus): string {
    switch (status) {
      case AccountStatus.ACTIVE:
        return 'Active';
      case AccountStatus.INACTIVE:
        return 'Inactive';
      case AccountStatus.PENDING:
        return 'Pending';
      default:
        return 'Unknown';
    }
  }
}
