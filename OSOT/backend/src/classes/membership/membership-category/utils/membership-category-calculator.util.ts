import {
  Category,
  MembershipEligilibility,
  AffiliateEligibility,
} from '../../../../common/enums';
import { MembershipCategoryInternal } from '../interfaces/membership-category-internal.interface';

/**
 * Calculate if membership is active based on category and dates
 */
export function calculateIsActive(
  membershipYear: string | null,
  retirementStart: Date | null,
  parentalLeaveFrom: Date | null,
  parentalLeaveTo: Date | null,
): boolean {
  if (!membershipYear) return false;

  const currentYear = new Date().getFullYear();
  const categoryYear = parseInt(membershipYear, 10);

  if (isNaN(categoryYear)) return false;

  // If retired, not active
  if (retirementStart && retirementStart <= new Date()) {
    return false;
  }

  // If on parental leave, still considered active
  if (parentalLeaveFrom && parentalLeaveTo) {
    const now = new Date();
    if (now >= parentalLeaveFrom && now <= parentalLeaveTo) {
      return true; // On leave but still active member
    }
  }

  // Active if membership is for current year or future
  return categoryYear >= currentYear;
}

/**
 * Calculate eligibility based on business rules
 */
export function calculateIsEligible(
  userType: 'account' | 'affiliate' | undefined,
  eligibility: MembershipEligilibility | null,
  affiliateEligibility: AffiliateEligibility | null,
  membershipDeclaration: boolean,
): boolean {
  // Declaration is required for eligibility
  if (!membershipDeclaration) return false;

  if (userType === 'account') {
    // Account users need proper eligibility (not NONE)
    return eligibility !== null && eligibility !== MembershipEligilibility.NONE;
  }

  if (userType === 'affiliate') {
    // Affiliate users need affiliate eligibility
    return affiliateEligibility !== null;
  }

  return false;
}

/**
 * Calculate parental leave duration in days
 */
export function calculateParentalLeaveDuration(
  startDate: Date | null,
  endDate: Date | null,
): number | null {
  if (!startDate || !endDate) return null;

  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return daysDiff > 0 ? daysDiff : null;
}

/**
 * Calculate days until membership expiration
 */
export function calculateDaysUntilExpiration(
  membershipYear: string | null,
): number | null {
  if (!membershipYear) return null;

  const categoryYear = parseInt(membershipYear, 10);
  if (isNaN(categoryYear)) return null;

  const expirationDate = new Date(categoryYear + 1, 0, 1); // January 1st of next year
  const today = new Date();

  const timeDiff = expirationDate.getTime() - today.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  return daysDiff;
}

/**
 * Determine user type based on FK references
 */
export function determineUserType(
  accountRef: string | undefined,
  affiliateRef: string | undefined,
): 'account' | 'affiliate' | undefined {
  if (accountRef && !affiliateRef) return 'account';
  if (!accountRef && affiliateRef) return 'affiliate';
  return undefined; // Invalid state or missing references
}

/**
 * Calculate if user has parental leave active
 */
export function calculateHasParentalLeave(
  parentalLeaveFrom: Date | null,
  parentalLeaveTo: Date | null,
): boolean {
  if (!parentalLeaveFrom || !parentalLeaveTo) return false;

  const now = new Date();
  return now >= parentalLeaveFrom && now <= parentalLeaveTo;
}

/**
 * Calculate if user is retired
 */
export function calculateIsRetired(
  retirementStart: Date | null,
  category: Category | null,
): boolean {
  if (!retirementStart) return false;

  const retirementCategories = [Category.OT_RET, Category.OTA_RET];
  const hasRetirementCategory =
    category && retirementCategories.includes(category);

  return hasRetirementCategory && retirementStart <= new Date();
}

/**
 * Calculate membership status (specific to membership-category domain)
 */
export function calculateMembershipStatus(
  category: MembershipCategoryInternal,
): 'active' | 'inactive' | 'retired' | 'on-leave' {
  const isRetired = calculateIsRetired(
    category.osot_retirement_start || null,
    category.osot_membership_category || null,
  );

  const hasParentalLeave = calculateHasParentalLeave(
    category.osot_parental_leave_from || null,
    category.osot_parental_leave_to || null,
  );

  const isActive = calculateIsActive(
    category.osot_membership_year,
    category.osot_retirement_start || null,
    category.osot_parental_leave_from || null,
    category.osot_parental_leave_to || null,
  );

  if (isRetired) return 'retired';
  if (hasParentalLeave) return 'on-leave';
  if (isActive) return 'active';
  return 'inactive';
}
