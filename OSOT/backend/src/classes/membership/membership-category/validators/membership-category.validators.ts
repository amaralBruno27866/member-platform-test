import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  MEMBERSHIP_CATEGORY_RULES,
  MEMBERSHIP_CATEGORY_LIMITS,
  MEMBERSHIP_CATEGORY_ERRORS,
} from '../constants/business.constants';
import { Category, UserGroup } from '../../../../common/enums';

/**
 * Validator for Membership Category ID
 * Validates format, length, and pattern requirements (osot-cat-0000001)
 */
@ValidatorConstraint({ name: 'membershipCategoryId', async: false })
export class MembershipCategoryIdValidator
  implements ValidatorConstraintInterface
{
  validate(categoryId: string): boolean {
    if (!categoryId) return false; // Optional field, but if provided must be valid

    // Check minimum length for autonumber format
    if (
      categoryId.length <
      MEMBERSHIP_CATEGORY_LIMITS.CATEGORY_ID_MIN_DIGITS +
        MEMBERSHIP_CATEGORY_LIMITS.CATEGORY_ID_PREFIX.length +
        1
    ) {
      return false;
    }

    // Check pattern (osot-cat-XXXXXXX format)
    const pattern = new RegExp(
      `^${MEMBERSHIP_CATEGORY_LIMITS.CATEGORY_ID_PREFIX}-\\d{${MEMBERSHIP_CATEGORY_LIMITS.CATEGORY_ID_MIN_DIGITS},}$`,
    );
    return pattern.test(categoryId.trim());
  }

  defaultMessage(): string {
    return `Category ID must follow the pattern ${MEMBERSHIP_CATEGORY_LIMITS.CATEGORY_ID_PREFIX}-XXXXXXX with minimum ${MEMBERSHIP_CATEGORY_LIMITS.CATEGORY_ID_MIN_DIGITS} digits`;
  }
}

/**
 * Validator for Membership Year
 * Validates against string year values and business rules
 */
@ValidatorConstraint({ name: 'categoryMembershipYear', async: false })
export class CategoryMembershipYearValidator
  implements ValidatorConstraintInterface
{
  validate(value: unknown): boolean {
    if (typeof value !== 'number') {
      return false;
    }

    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 50; // Allow up to 50 years back
    const maxYear = currentYear + 10; // Allow up to 10 years in future

    return value >= minYear && value <= maxYear;
  }

  defaultMessage(): string {
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 50;
    const maxYear = currentYear + 10;
    return `Membership year must be between ${minYear} and ${maxYear}`;
  }
}

/**
 * Validator for Membership Category
 * Validates against Category enum values
 */
@ValidatorConstraint({ name: 'categoryMembershipCategory', async: false })
export class CategoryMembershipCategoryValidator
  implements ValidatorConstraintInterface
{
  validate(category: Category): boolean {
    if (!category) return true; // Optional field

    // Check if category is valid enum value
    return Object.values(Category).includes(category);
  }

  defaultMessage(): string {
    return 'Membership category must be a valid category value';
  }
}

/**
 * Validator for Exclusive User Reference
 * Ensures only ONE of Account OR Affiliate is specified, never both
 */
@ValidatorConstraint({ name: 'exclusiveUserReference', async: false })
export class ExclusiveUserReferenceValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;
    const accountBind = object['osot_Table_Account@odata.bind'] as string;
    const affiliateBind = object[
      'osot_Table_Account_Affiliate@odata.bind'
    ] as string;

    // Must have exactly one reference
    const hasAccount =
      accountBind &&
      typeof accountBind === 'string' &&
      accountBind.trim().length > 0;
    const hasAffiliate =
      affiliateBind &&
      typeof affiliateBind === 'string' &&
      affiliateBind.trim().length > 0;

    // XOR logic: exactly one must be true
    return hasAccount !== hasAffiliate;
  }

  defaultMessage(): string {
    return MEMBERSHIP_CATEGORY_ERRORS.MULTIPLE_USER_REFERENCES;
  }
}

/**
 * Validator for User Reference Required
 * Ensures at least one user reference is provided
 */
@ValidatorConstraint({ name: 'userReferenceRequired', async: false })
export class UserReferenceRequiredValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;
    const accountBind = object['osot_Table_Account@odata.bind'];
    const affiliateBind = object['osot_Table_Account_Affiliate@odata.bind'];

    // At least one must be provided
    const hasAccount =
      typeof accountBind === 'string' && accountBind.trim().length > 0;
    const hasAffiliate =
      typeof affiliateBind === 'string' && affiliateBind.trim().length > 0;

    return hasAccount || hasAffiliate;
  }

  defaultMessage(): string {
    return MEMBERSHIP_CATEGORY_ERRORS.NO_USER_REFERENCE;
  }
}

/**
 * Validator for GUID format (User References)
 * Validates GUID format for Account and Affiliate references
 */
@ValidatorConstraint({ name: 'guidFormat', async: false })
export class GuidFormatValidator implements ValidatorConstraintInterface {
  validate(guid: string): boolean {
    if (!guid) return true; // Optional fields

    // GUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const guidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidPattern.test(guid.trim());
  }

  defaultMessage(): string {
    return 'User reference must be a valid GUID format';
  }
}

/**
 * Validator for Eligibility Consistency
 * Ensures correct eligibility type is used based on user type
 */
@ValidatorConstraint({ name: 'eligibilityConsistency', async: false })
export class EligibilityConsistencyValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;
    const accountBind = object['osot_Table_Account@odata.bind'];
    const affiliateBind = object['osot_Table_Account_Affiliate@odata.bind'];
    const eligibility = object.osot_eligibility;
    const eligibilityAffiliate = object.osot_eligibility_affiliate;

    const hasAccount =
      typeof accountBind === 'string' && accountBind.trim().length > 0;
    const hasAffiliate =
      typeof affiliateBind === 'string' && affiliateBind.trim().length > 0;

    // If Account user, should not have affiliate eligibility
    if (hasAccount && eligibilityAffiliate) {
      return false;
    }

    // If Affiliate user, should not have regular eligibility
    if (hasAffiliate && eligibility) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return MEMBERSHIP_CATEGORY_ERRORS.ELIGIBILITY_MISMATCH;
  }
}

/**
 * Validator for Parental Leave Date Range
 * Ensures from date is before to date when both are provided
 */
@ValidatorConstraint({ name: 'parentalLeaveDateRange', async: false })
export class ParentalLeaveDateRangeValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;
    const fromDate = object.osot_parental_leave_from;
    const toDate = object.osot_parental_leave_to;

    if (!fromDate || !toDate) return true; // Both must be provided to validate

    // Ensure both are strings before creating Date objects
    if (typeof fromDate !== 'string' || typeof toDate !== 'string') {
      return false;
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);

    // Validate dates are valid
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return false;
    }

    // From must be before To
    if (from >= to) {
      return false;
    }

    // Check maximum duration
    const diffDays = Math.ceil(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays <= MEMBERSHIP_CATEGORY_LIMITS.MAX_PARENTAL_LEAVE_DAYS;
  }

  defaultMessage(): string {
    return MEMBERSHIP_CATEGORY_ERRORS.INVALID_PARENTAL_LEAVE_PERIOD;
  }
}

/**
 * Validator for Retirement Date Required
 * Ensures retirement date is provided for retirement categories
 */
@ValidatorConstraint({ name: 'retirementDateRequired', async: false })
export class RetirementDateRequiredValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;
    const category = object.osot_membership_category;
    const retirementStart = object.osot_retirement_start;

    // Ensure category is a number before checking
    if (typeof category !== 'number') {
      return true; // If no valid category, skip validation
    }

    // Check if category is retirement category
    const isRetirementCategory =
      MEMBERSHIP_CATEGORY_RULES.RETIREMENT_CATEGORIES.includes(
        category as Category.OT_RET | Category.OTA_RET,
      );

    if (isRetirementCategory) {
      // Retirement date is required for retirement categories
      return (
        typeof retirementStart === 'string' && retirementStart.trim().length > 0
      );
    }

    return true; // Not a retirement category, no validation needed
  }

  defaultMessage(): string {
    return MEMBERSHIP_CATEGORY_ERRORS.RETIREMENT_DATE_REQUIRED;
  }
}

/**
 * Validator for Date Format (ISO Date)
 * Validates date fields are in correct ISO format
 */
@ValidatorConstraint({ name: 'isoDateFormat', async: false })
export class IsoDateFormatValidator implements ValidatorConstraintInterface {
  validate(dateString: string): boolean {
    if (!dateString) return true; // Optional fields

    // Check ISO date format YYYY-MM-DD
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoDatePattern.test(dateString.trim())) {
      return false;
    }

    // Validate actual date
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  defaultMessage(): string {
    return 'Date must be in ISO format (YYYY-MM-DD) and be a valid date';
  }
}

/**
 * Validator for Future Date Restriction
 * Prevents future dates where not allowed
 */
@ValidatorConstraint({ name: 'noFutureDates', async: false })
export class NoFutureDatesValidator implements ValidatorConstraintInterface {
  validate(dateString: string): boolean {
    if (!dateString) return true; // Optional fields

    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    return date <= today;
  }

  defaultMessage(): string {
    return 'Date cannot be in the future';
  }
}

/**
 * Validator for Category User Type Consistency
 * Ensures category matches user type (OT/OTA vs Affiliate)
 */
@ValidatorConstraint({ name: 'categoryUserTypeConsistency', async: false })
export class CategoryUserTypeConsistencyValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;
    const accountBind = object['osot_Table_Account@odata.bind'];
    const affiliateBind = object['osot_Table_Account_Affiliate@odata.bind'];
    const category = object.osot_membership_category;

    if (typeof category !== 'number') return true; // Optional field

    const hasAccount =
      typeof accountBind === 'string' && accountBind.trim().length > 0;
    const hasAffiliate =
      typeof affiliateBind === 'string' && affiliateBind.trim().length > 0;
    const isAffiliateCategory =
      MEMBERSHIP_CATEGORY_RULES.AFFILIATE_CATEGORIES.includes(
        category as Category.AFF_PRIM | Category.AFF_PREM,
      );

    // If Account user, should not have affiliate category
    if (hasAccount && isAffiliateCategory) {
      return false;
    }

    // If Affiliate user, should have affiliate category
    if (hasAffiliate && !isAffiliateCategory) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return MEMBERSHIP_CATEGORY_ERRORS.CATEGORY_USER_TYPE_MISMATCH;
  }
}

/**
 * Validator for Users Group
 * Validates UserGroup enum values and business consistency
 */
@ValidatorConstraint({ name: 'usersGroup', async: false })
export class UsersGroupValidator implements ValidatorConstraintInterface {
  validate(usersGroup: number): boolean {
    if (usersGroup === null || usersGroup === undefined) return true; // Optional field

    // Validate range (1-9 based on UserGroup enum)
    if (
      usersGroup < MEMBERSHIP_CATEGORY_LIMITS.USERS_GROUP_MIN_VALUE ||
      usersGroup > MEMBERSHIP_CATEGORY_LIMITS.USERS_GROUP_MAX_VALUE
    ) {
      return false;
    }

    // Validate it's a valid UserGroup enum value
    const validValues = Object.values(UserGroup).filter(
      (value) => typeof value === 'number',
    ) as number[];

    return validValues.includes(usersGroup);
  }

  defaultMessage(): string {
    return MEMBERSHIP_CATEGORY_ERRORS.USERS_GROUP_INVALID;
  }
}

/**
 * Helper function to get all membership category validators
 * Used for dependency injection or manual validation
 */
export const getMembershipCategoryValidators = () => ({
  MembershipCategoryIdValidator,
  CategoryMembershipYearValidator,
  CategoryMembershipCategoryValidator,
  ExclusiveUserReferenceValidator,
  UserReferenceRequiredValidator,
  GuidFormatValidator,
  EligibilityConsistencyValidator,
  ParentalLeaveDateRangeValidator,
  RetirementDateRequiredValidator,
  IsoDateFormatValidator,
  NoFutureDatesValidator,
  CategoryUserTypeConsistencyValidator,
  UsersGroupValidator,
});

/**
 * Validator configuration for common use cases
 */
export const MEMBERSHIP_CATEGORY_VALIDATOR_CONFIG = {
  // System field validators
  SYSTEM_FIELDS: {
    categoryId: [MembershipCategoryIdValidator],
    membershipYear: [CategoryMembershipYearValidator],
  },

  // User reference validators
  USER_REFERENCE: {
    exclusive: [ExclusiveUserReferenceValidator],
    required: [UserReferenceRequiredValidator],
    format: [GuidFormatValidator],
    consistency: [
      EligibilityConsistencyValidator,
      CategoryUserTypeConsistencyValidator,
    ],
  },

  // Date field validators
  DATE_FIELDS: {
    format: [IsoDateFormatValidator],
    range: [ParentalLeaveDateRangeValidator],
    future: [NoFutureDatesValidator],
    retirement: [RetirementDateRequiredValidator],
  },

  // Business rule validators
  BUSINESS_RULES: {
    userReference: [
      ExclusiveUserReferenceValidator,
      UserReferenceRequiredValidator,
    ],
    eligibility: [EligibilityConsistencyValidator],
    category: [
      CategoryMembershipCategoryValidator,
      CategoryUserTypeConsistencyValidator,
    ],
    dates: [ParentalLeaveDateRangeValidator, RetirementDateRequiredValidator],
  },
} as const;
