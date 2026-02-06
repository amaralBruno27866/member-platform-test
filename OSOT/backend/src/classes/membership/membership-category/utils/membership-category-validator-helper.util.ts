import {
  Category,
  AffiliateEligibility,
  UserGroup,
} from '../../../../common/enums';
import {
  MEMBERSHIP_CATEGORY_RULES,
  MEMBERSHIP_CATEGORY_LIMITS,
} from '../constants/business.constants';

/**
 * Validation result structure for business rules
 */
export interface CategoryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validate user reference exclusivity (Account XOR Affiliate)
 * This is specific to membership-category domain
 */
export function validateUserReferenceExclusivity(
  accountId?: string,
  affiliateId?: string,
): CategoryValidationResult {
  const hasAccount = !!(accountId && accountId.trim().length > 0);
  const hasAffiliate = !!(affiliateId && affiliateId.trim().length > 0);

  const errors: string[] = [];

  // Must have exactly one reference
  if (!hasAccount && !hasAffiliate) {
    errors.push('Must specify either Account or Affiliate user reference');
  }

  if (hasAccount && hasAffiliate) {
    errors.push('Cannot specify both Account and Affiliate user references');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate eligibility consistency with user type
 * Specific business rule for membership-category
 */
export function validateEligibilityConsistency(
  eligibility?: number | AffiliateEligibility,
  accountId?: string,
  affiliateId?: string,
): CategoryValidationResult {
  const hasAccount = !!(accountId && accountId.trim().length > 0);
  const hasAffiliate = !!(affiliateId && affiliateId.trim().length > 0);

  const errors: string[] = [];

  // If Account user, should not have affiliate eligibility (check if it's AffiliateEligibility enum)
  if (hasAccount && typeof eligibility === 'object') {
    errors.push('Account users should not have affiliate eligibility');
  }

  // If Affiliate user, should not have regular eligibility (check if it's number)
  if (hasAffiliate && typeof eligibility === 'number') {
    errors.push('Affiliate users should not have regular eligibility');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate UserGroup consistency with Category
 * Domain-specific business rule
 */
export function validateUsersGroupCategoryConsistency(
  usersGroup?: UserGroup,
  category?: Category,
  _eligibility?: number | AffiliateEligibility,
): CategoryValidationResult {
  if (!usersGroup || !category) {
    return { isValid: true, errors: [] }; // Skip validation if either is missing
  }

  const errors: string[] = [];

  // Student UserGroups should match Student Categories
  if (
    [
      UserGroup.OT_STUDENT,
      UserGroup.OTA_STUDENT,
      UserGroup.OT_STUDENT_NEW_GRAD,
      UserGroup.OTA_STUDENT_NEW_GRAD,
    ].includes(usersGroup)
  ) {
    if (![Category.OT_STU, Category.OTA_STU].includes(category)) {
      errors.push('Student Users Group does not match student category');
    }
  }

  // Affiliate UserGroups should match Affiliate Categories
  if ([UserGroup.AFFILIATE].includes(usersGroup)) {
    if (![Category.AFF_PRIM, Category.AFF_PREM].includes(category)) {
      errors.push('Affiliate Users Group does not match affiliate category');
    }
  }

  // Add more specific validations as needed

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate parental leave date range
 * Specific to membership-category domain
 */
export function validateParentalLeaveDateRange(
  parentalLeaveStartDate?: string,
  parentalLeaveEndDate?: string,
  _dateOfBirth?: string,
): CategoryValidationResult {
  if (!parentalLeaveStartDate || !parentalLeaveEndDate) {
    return { isValid: true, errors: [] }; // Both must be provided to validate
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  const from = new Date(parentalLeaveStartDate);
  const to = new Date(parentalLeaveEndDate);

  // Validate dates are valid
  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    errors.push('Invalid date format for parental leave dates');
    return { isValid: false, errors };
  }

  // From must be before To
  if (from >= to) {
    errors.push('Parental leave end date must be after start date');
  }

  // Check maximum duration
  const diffDays = Math.ceil(
    (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays > MEMBERSHIP_CATEGORY_LIMITS.MAX_PARENTAL_LEAVE_DAYS) {
    errors.push('Parental leave period cannot exceed 2 years');
  }

  // Warn if dates are in the future
  const today = new Date();
  if (from > today) {
    warnings.push('Parental leave start date is in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate retirement requirements
 * Domain-specific business rule
 */
export function validateRetirementRequirements(
  _eligibility?: number | AffiliateEligibility,
  category?: Category,
  retirementDate?: string,
  _dateOfBirth?: string,
): CategoryValidationResult {
  if (!category) {
    return { isValid: true, errors: [] }; // Optional field
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  const isRetirementCategory =
    MEMBERSHIP_CATEGORY_RULES.RETIREMENT_CATEGORIES.includes(
      category as Category.OT_RET | Category.OTA_RET,
    );

  if (isRetirementCategory) {
    // Retirement date is required for retirement categories
    if (!retirementDate || retirementDate.trim().length === 0) {
      errors.push(
        'Retirement start date is required for retirement categories',
      );
    } else {
      // Validate date format
      const parsedRetirementDate = new Date(retirementDate);
      if (isNaN(parsedRetirementDate.getTime())) {
        errors.push('Invalid retirement date format');
      } else if (parsedRetirementDate > new Date()) {
        warnings.push('Retirement date is in the future');
      }
    }
  } else if (retirementDate) {
    warnings.push('Retirement date provided for non-retirement category');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
