import {
  Category,
  MembershipEligilibility,
  AffiliateEligibility,
  UserGroup,
} from '../../../../common/enums';

/**
 * Format membership category for display with human-readable names
 */
export function formatMembershipCategory(category: Category | null): string {
  if (category === null || category === undefined) return 'Not Set';

  const categoryLabels: Record<Category, string> = {
    [Category.ALL]: 'All Categories',
    [Category.OT_PR]: 'OT - Practicing',
    [Category.OT_NP]: 'OT - Non-Practicing',
    [Category.OT_RET]: 'OT - Retired',
    [Category.OT_NG]: 'OT - New Graduate',
    [Category.OT_STU]: 'OT - Student',
    [Category.OT_LIFE]: 'OT - Life Member',
    [Category.OTA_PR]: 'OTA - Practicing',
    [Category.OTA_NP]: 'OTA - Non-Practicing',
    [Category.OTA_RET]: 'OTA - Retired',
    [Category.OTA_NG]: 'OTA - New Graduate',
    [Category.OTA_STU]: 'OTA - Student',
    [Category.OTA_LIFE]: 'OTA - Life Member',
    [Category.ASSOC]: 'Associate',
    [Category.AFF_PRIM]: 'Affiliate - Primary',
    [Category.AFF_PREM]: 'Affiliate - Premium',
  };

  return categoryLabels[category] || 'Unknown Category';
}

/**
 * Format membership year for display
 */
export function formatMembershipYear(year: string | null): string {
  if (year === null || year === undefined) return 'Not Set';

  return year;
}

/**
 * Format eligibility for display
 */
export function formatEligibility(
  eligibility: MembershipEligilibility | null,
): string {
  if (eligibility === null || eligibility === undefined) return 'Not Set';

  const eligibilityLabels: Record<MembershipEligilibility, string> = {
    [MembershipEligilibility.NONE]: 'None',
    [MembershipEligilibility.QUESTION_1]: 'Question 1',
    [MembershipEligilibility.QUESTION_2]: 'Question 2',
    [MembershipEligilibility.QUESTION_3]: 'Question 3',
    [MembershipEligilibility.QUESTION_4]: 'Question 4',
    [MembershipEligilibility.QUESTION_5]: 'Question 5',
    [MembershipEligilibility.QUESTION_6]: 'Question 6',
    [MembershipEligilibility.QUESTION_7]: 'Question 7',
  };

  return eligibilityLabels[eligibility] || 'Unknown Eligibility';
}

/**
 * Format affiliate eligibility for display
 */
export function formatAffiliateEligibility(
  eligibility: AffiliateEligibility | null,
): string {
  if (eligibility === null || eligibility === undefined) return 'Not Set';

  const affiliateLabels: Record<AffiliateEligibility, string> = {
    [AffiliateEligibility.PRIMARY]: 'Primary',
    [AffiliateEligibility.PREMIUM]: 'Premium',
  };

  return affiliateLabels[eligibility] || 'Unknown Affiliate Eligibility';
}

/**
 * Format users group for display
 */
export function formatUsersGroup(usersGroup: UserGroup | null): string {
  if (usersGroup === null || usersGroup === undefined) return 'Not Set';

  const userGroupLabels: Record<UserGroup, string> = {
    [UserGroup.OT_STUDENT]: 'OT Student',
    [UserGroup.OTA_STUDENT]: 'OTA Student',
    [UserGroup.OT_STUDENT_NEW_GRAD]: 'OT Student (New Graduate)',
    [UserGroup.OTA_STUDENT_NEW_GRAD]: 'OTA Student (New Graduate)',
    [UserGroup.OT]: 'Occupational Therapist',
    [UserGroup.OTA]: 'Occupational Therapy Assistant',
    [UserGroup.VENDOR_ADVERTISER_RECRUITER]: 'Vendor/Advertiser/Recruiter',
    [UserGroup.OTHER]: 'Other',
    [UserGroup.AFFILIATE]: 'Affiliate',
  };

  return userGroupLabels[usersGroup] || 'Unknown User Group';
}

/**
 * Format date for display (from ISO string)
 */
export function formatDate(dateString: string | null): string {
  if (!dateString) return 'Not Set';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';

    return date.toLocaleDateString('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  } catch {
    return 'Invalid Date';
  }
}

/**
 * Format membership status for display
 */
export function formatMembershipStatus(
  status: 'active' | 'inactive' | 'retired' | 'on-leave',
): string {
  const statusLabels = {
    active: 'Active',
    inactive: 'Inactive',
    retired: 'Retired',
    'on-leave': 'On Parental Leave',
  };

  return statusLabels[status] || 'Unknown Status';
}

/**
 * Format parental leave duration
 */
export function formatParentalLeaveDuration(
  startDate: string | null,
  endDate: string | null,
): string {
  if (!startDate || !endDate) return 'Not Set';

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Invalid Dates';
    }

    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Invalid Range';
    if (diffDays === 0) return '1 day';
    if (diffDays === 1) return '1 day';

    return `${diffDays} days`;
  } catch {
    return 'Invalid Dates';
  }
}
