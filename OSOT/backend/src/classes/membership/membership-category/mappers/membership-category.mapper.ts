/*
 * ESLint is disabled for no-unsafe-* rules on enum display name functions below.
 * These functions are type-safe (return string) but ESLint cannot infer types correctly
 * due to re-exports through common/enums/index.ts.
 */

import {
  MembershipCategoryResponseDto,
  MembershipCategoryCreateDto,
  MembershipCategoryUpdateDto,
  MembershipCategoryInternal,
} from '../index';
import {
  AccessModifier,
  Privilege,
  Category,
  MembershipEligilibility,
  AffiliateEligibility,
  UserGroup,
  getAccessModifierDisplayName,
  getPrivilegeDisplayName,
  getCategoryDisplayName,
  getEligibilityDisplayName,
  getAffiliateEligibilityDisplayName,
  getUserGroupDisplayName,
} from '../../../../common/enums';
import {
  ParentalLeaveExpected,
  getParentalLeaveExpectedDisplayName,
} from '../enums/parental-leave-expected.enum';

/**
 * Parse AccessModifier from Dataverse value
 * Handles both numeric and string representations
 */
export function parseAccessModifier(value: unknown): AccessModifier | null {
  if (value === null || value === undefined) return null;

  // Handle numeric values (Dataverse option set)
  if (typeof value === 'number') {
    switch (value) {
      case 0:
        return AccessModifier.PUBLIC;
      case 1:
        return AccessModifier.PROTECTED;
      case 2:
        return AccessModifier.PRIVATE;
      default:
        return null;
    }
  }

  // Handle string values
  if (typeof value === 'string') {
    const upperValue = value.toUpperCase();
    switch (upperValue) {
      case 'PUBLIC':
        return AccessModifier.PUBLIC;
      case 'PROTECTED':
        return AccessModifier.PROTECTED;
      case 'PRIVATE':
        return AccessModifier.PRIVATE;
      default:
        return null;
    }
  }

  return null;
}

/**
 * Parse Privilege from Dataverse value
 * Handles both numeric and string representations
 */
export function parsePrivilege(value: unknown): Privilege | null {
  if (value === null || value === undefined) return null;

  // Handle numeric values (Dataverse option set)
  if (typeof value === 'number') {
    switch (value) {
      case 1:
        return Privilege.OWNER;
      case 2:
        return Privilege.ADMIN;
      case 3:
        return Privilege.MAIN;
      default:
        return null;
    }
  }

  // Handle string values
  if (typeof value === 'string') {
    const upperValue = value.toUpperCase();
    switch (upperValue) {
      case 'OWNER':
        return Privilege.OWNER;
      case 'ADMIN':
        return Privilege.ADMIN;
      case 'MAIN':
        return Privilege.MAIN;
      default:
        return null;
    }
  }

  return null;
}

/**
 * Parse MembershipYear from Dataverse value
 */
export function parseMembershipYear(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  return null;
}

/**
 * Parse Category from Dataverse value
 */
export function parseCategory(value: unknown): Category | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (Object.values(Category).includes(value)) {
      return value as Category;
    }
  }

  return null;
}

/**
 * Parse MembershipEligilibility from Dataverse value
 */
export function parseMembershipEligibility(
  value: unknown,
): MembershipEligilibility | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (Object.values(MembershipEligilibility).includes(value)) {
      return value as MembershipEligilibility;
    }
  }

  return null;
}

/**
 * Parse AffiliateEligibility from Dataverse value
 */
export function parseAffiliateEligibility(
  value: unknown,
): AffiliateEligibility | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (Object.values(AffiliateEligibility).includes(value)) {
      return value as AffiliateEligibility;
    }
  }

  return null;
}

/**
 * Parse UserGroup from Dataverse value
 * Handles numeric values (Dataverse option set)
 */
export function parseUserGroup(value: unknown): UserGroup | null {
  if (value === null || value === undefined) return null;

  // Handle numeric values (Dataverse option set)
  if (typeof value === 'number') {
    if (Object.values(UserGroup).includes(value)) {
      return value as UserGroup;
    }
  }

  return null;
}

/**
 * Parse ParentalLeaveExpected from Dataverse value
 * Handles numeric values (Dataverse option set)
 */
export function parseParentalLeaveExpected(
  value: unknown,
): ParentalLeaveExpected | null {
  if (value === null || value === undefined) return null;

  // Handle numeric values (Dataverse option set)
  if (typeof value === 'number') {
    if (Object.values(ParentalLeaveExpected).includes(value)) {
      return value as ParentalLeaveExpected;
    }
  }

  return null;
}

/**
 * Parse date value from Dataverse
 * Handles both ISO strings and Date objects
 */
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

/**
 * Parse boolean value from Dataverse
 * Handles Dataverse Yes/No format (0/1)
 */
export function parseBoolean(value: unknown): boolean {
  if (value === null || value === undefined) return false;

  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }

  return false;
}

/**
 * Determine user type based on FK references
 * Account and Affiliate references are mutually exclusive
 */
function determineUserType(
  accountRef: string | undefined,
  affiliateRef: string | undefined,
): 'account' | 'affiliate' | undefined {
  if (accountRef && !affiliateRef) return 'account';
  if (affiliateRef && !accountRef) return 'affiliate';
  return undefined; // Invalid state - both or neither set
}

/**
 * Calculate if membership is active based on category and dates
 */
function calculateIsActive(
  membershipYear: string | null,
  retirementStart: Date | null,
  parentalLeaveFrom: Date | null,
  parentalLeaveTo: Date | null,
): boolean {
  // If no membership year, not active
  if (!membershipYear) return false;

  const today = new Date();

  // If retired, not active
  if (retirementStart && today >= retirementStart) return false;

  // If on parental leave, considered active but on leave
  if (
    parentalLeaveFrom &&
    parentalLeaveTo &&
    today >= parentalLeaveFrom &&
    today <= parentalLeaveTo
  ) {
    return true; // On parental leave is still active status
  }

  // Otherwise active based on having current membership year
  // Parse year from string for comparison
  const currentYear = today.getFullYear();
  const membershipYearNumber = parseInt(membershipYear, 10);

  if (isNaN(membershipYearNumber)) return false;
  return membershipYearNumber >= currentYear;
}

/**
 * Calculate eligibility based on business rules
 */
function calculateIsEligible(
  userType: 'account' | 'affiliate' | undefined,
  eligibility: MembershipEligilibility | null,
  affiliateEligibility: AffiliateEligibility | null,
): boolean {
  // Must have user type determined
  if (!userType) return false;

  // Check eligibility based on user type
  if (userType === 'account') {
    return eligibility !== null;
  }

  if (userType === 'affiliate') {
    return affiliateEligibility !== null;
  }

  return false;
}

/**
 * Calculate parental leave duration in days
 */
function calculateParentalLeaveDuration(
  startDate: Date | null,
  endDate: Date | null,
): number | null {
  if (!startDate || !endDate) return null;

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : null;
}

/**
 * Map raw Dataverse response to normalized internal format
 * Based on Table Membership Category.csv structure
 */
export function mapDataverseToInternal(
  rawData: unknown,
): MembershipCategoryInternal | null {
  if (!rawData || typeof rawData !== 'object') return null;

  const data = rawData as Record<string, unknown>;

  try {
    // Parse system fields (from CSV)
    const osot_table_membership_categoryid =
      data.osot_table_membership_categoryid as string;
    const osot_category_id = data.osot_category_id as string;

    // Parse user reference fields (exclusive OR relationship)
    const osot_table_account = data.osot_table_account as string | undefined;
    const osot_table_account_affiliate = data.osot_table_account_affiliate as
      | string
      | undefined;

    // Parse required fields (from CSV)
    const osot_membership_year = parseMembershipYear(data.osot_membership_year);
    if (!osot_membership_year) {
      console.warn('Missing required osot_membership_year in Dataverse data');
      return null;
    }

    // Parse optional enum fields (from CSV)
    const osot_membership_category = parseCategory(
      data.osot_membership_category,
    );
    const osot_eligibility = parseMembershipEligibility(data.osot_eligibility);
    const osot_eligibility_affiliate = parseAffiliateEligibility(
      data.osot_eligibility_affiliate,
    );
    const osot_users_group = parseUserGroup(data.osot_users_group);
    const osot_privilege = parsePrivilege(data.osot_privilege);
    const osot_access_modifiers = parseAccessModifier(
      data.osot_access_modifiers,
    );

    // Parse date fields (from CSV)
    const osot_parental_leave_from = parseDate(data.osot_parental_leave_from);
    const osot_parental_leave_to = parseDate(data.osot_parental_leave_to);
    const osot_parental_leave_expected = parseParentalLeaveExpected(
      data.osot_parental_leave_expected,
    );
    const osot_retirement_start = parseDate(data.osot_retirement_start);

    // Parse system timestamps
    const createdon = parseDate(data.createdon);
    const modifiedon = parseDate(data.modifiedon);
    const ownerid = data.ownerid as string | undefined;

    // Calculate computed fields
    const userType = determineUserType(
      osot_table_account,
      osot_table_account_affiliate,
    );
    const isActive = calculateIsActive(
      osot_membership_year,
      osot_retirement_start,
      osot_parental_leave_from,
      osot_parental_leave_to,
    );
    const isEligible = calculateIsEligible(
      userType,
      osot_eligibility,
      osot_eligibility_affiliate,
    );
    const hasParentalLeave =
      osot_parental_leave_from &&
      osot_parental_leave_to &&
      new Date() >= osot_parental_leave_from &&
      new Date() <= osot_parental_leave_to;
    const isRetired =
      osot_retirement_start && new Date() >= osot_retirement_start;

    return {
      // System fields
      osot_table_membership_categoryid,
      osot_category_id,
      createdon,
      modifiedon,
      ownerid,

      // User reference fields
      osot_table_account,
      osot_table_account_affiliate,

      // Required fields
      osot_membership_year,

      // Optional fields
      osot_membership_category,
      osot_eligibility,
      osot_eligibility_affiliate,
      osot_users_group,
      osot_parental_leave_from,
      osot_parental_leave_to,
      osot_parental_leave_expected,
      osot_retirement_start,
      osot_privilege,
      osot_access_modifiers,

      // Computed fields
      isActive,
      userType,
      isEligible,
      hasParentalLeave,
      isRetired,
    };
  } catch (error) {
    console.error('Error mapping Dataverse to internal format:', error);
    return null;
  }
}

/**
 * Map internal format to response DTO
 * Strips sensitive and computed fields, returns clean response
 */
export function mapInternalToResponse(
  internal: MembershipCategoryInternal,
): MembershipCategoryResponseDto {
  return {
    // Basic DTO fields (non-sensitive) - convert enums to labels
    osot_membership_year: internal.osot_membership_year,
    osot_membership_category:
      internal.osot_membership_category !== undefined
        ? getCategoryDisplayName(internal.osot_membership_category)
        : undefined,
    osot_eligibility:
      internal.osot_eligibility !== undefined
        ? getEligibilityDisplayName(internal.osot_eligibility)
        : undefined,
    osot_eligibility_affiliate:
      internal.osot_eligibility_affiliate !== undefined
        ? getAffiliateEligibilityDisplayName(
            internal.osot_eligibility_affiliate,
          )
        : undefined,
    osot_users_group:
      internal.osot_users_group !== undefined
        ? getUserGroupDisplayName(internal.osot_users_group)
        : undefined,
    osot_parental_leave_from:
      internal.osot_parental_leave_from?.toISOString().split('T')[0] || null,
    osot_parental_leave_to:
      internal.osot_parental_leave_to?.toISOString().split('T')[0] || null,
    osot_parental_leave_expected:
      internal.osot_parental_leave_expected !== undefined
        ? getParentalLeaveExpectedDisplayName(
            internal.osot_parental_leave_expected,
          )
        : undefined,
    osot_retirement_start:
      internal.osot_retirement_start?.toISOString().split('T')[0] || null,
    osot_privilege:
      internal.osot_privilege !== undefined
        ? getPrivilegeDisplayName(internal.osot_privilege)
        : undefined,
    osot_access_modifiers:
      internal.osot_access_modifiers !== undefined
        ? getAccessModifierDisplayName(internal.osot_access_modifiers)
        : undefined,

    // Response DTO fields
    osot_category_id: internal.osot_category_id,
    osot_table_membership_categoryid: internal.osot_table_membership_categoryid,
    osot_table_account: internal.osot_table_account,
    osot_table_account_affiliate: internal.osot_table_account_affiliate,
    createdon: internal.createdon?.toISOString() || null,
    modifiedon: internal.modifiedon?.toISOString() || null,
    ownerid: internal.ownerid,

    // Computed/Display fields for frontend
    userType: internal.userType === 'account' ? 'Account' : 'Affiliate',
    membershipYearDisplay: internal.osot_membership_year.toString(),
    status: internal.isRetired
      ? 'Retired'
      : internal.hasParentalLeave
        ? 'On Leave'
        : internal.isActive
          ? 'Active'
          : 'Inactive',
    isOnParentalLeave: !!internal.hasParentalLeave,
    isRetired: !!internal.isRetired,
    parentalLeaveDaysRemaining: calculateParentalLeaveDuration(
      internal.osot_parental_leave_from,
      internal.osot_parental_leave_to,
    ),
  };
}

/**
 * Map raw Dataverse response directly to response DTO
 * Convenience function for simple transformations
 */
export function mapDataverseToResponse(
  rawData: unknown,
): MembershipCategoryResponseDto | null {
  const internal = mapDataverseToInternal(rawData);
  if (!internal) return null;

  return mapInternalToResponse(internal);
}

/**
 * Map array of Dataverse responses to response DTO array
 * Handles bulk operations and list responses
 */
export function mapDataverseArrayToResponse(
  rawArray: unknown[],
): MembershipCategoryResponseDto[] {
  if (!Array.isArray(rawArray)) return [];

  return rawArray
    .map(mapDataverseToResponse)
    .filter(
      (category): category is MembershipCategoryResponseDto =>
        category !== null,
    );
}

/**
 * Map CreateMembershipCategoryDto to Dataverse payload format
 * Based on CSV structure - only includes fields that exist in CSV
 */
export function mapCreateDtoToDataverse(
  dto: MembershipCategoryCreateDto,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Required fields from CSV
  if (dto.osot_membership_year !== undefined) {
    payload.osot_membership_year = dto.osot_membership_year;
  }

  // User reference fields (exclusive OR) - using OData bind format
  if (dto['osot_Table_Account@odata.bind'] !== undefined) {
    payload['osot_Table_Account@odata.bind'] =
      dto['osot_Table_Account@odata.bind'];
  }

  if (dto['osot_Table_Account_Affiliate@odata.bind'] !== undefined) {
    payload['osot_Table_Account_Affiliate@odata.bind'] =
      dto['osot_Table_Account_Affiliate@odata.bind'];
  }

  // Optional fields from CSV
  if (dto.osot_membership_category !== undefined) {
    payload.osot_membership_category = dto.osot_membership_category;
  }

  if (dto.osot_eligibility !== undefined) {
    payload.osot_eligibility = dto.osot_eligibility;
  }

  if (dto.osot_eligibility_affiliate !== undefined) {
    payload.osot_eligibility_affiliate = dto.osot_eligibility_affiliate;
  }

  if (dto.osot_users_group !== undefined) {
    payload.osot_users_group = dto.osot_users_group;
  }

  if (dto.osot_parental_leave_from !== undefined) {
    payload.osot_parental_leave_from = dto.osot_parental_leave_from;
  }

  if (dto.osot_parental_leave_to !== undefined) {
    payload.osot_parental_leave_to = dto.osot_parental_leave_to;
  }

  if (dto.osot_parental_leave_expected !== undefined) {
    payload.osot_parental_leave_expected = dto.osot_parental_leave_expected;
  }

  if (dto.osot_retirement_start !== undefined) {
    payload.osot_retirement_start = dto.osot_retirement_start;
  }

  if (dto.osot_privilege !== undefined) {
    payload.osot_privilege = dto.osot_privilege;
  }

  if (dto.osot_access_modifiers !== undefined) {
    payload.osot_access_modifiers = dto.osot_access_modifiers;
  }

  return payload;
}

/**
 * Map UpdateMembershipCategoryDto to Dataverse payload format
 * Only includes fields that are being updated
 */
export function mapUpdateDtoToDataverse(
  dto: MembershipCategoryUpdateDto,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  // Fields that can be updated (from CSV)
  if (dto.osot_membership_year !== undefined) {
    payload.osot_membership_year = dto.osot_membership_year;
  }

  if (dto.osot_membership_category !== undefined) {
    payload.osot_membership_category = dto.osot_membership_category;
  }

  if (dto.osot_eligibility !== undefined) {
    payload.osot_eligibility = dto.osot_eligibility;
  }

  if (dto.osot_eligibility_affiliate !== undefined) {
    payload.osot_eligibility_affiliate = dto.osot_eligibility_affiliate;
  }

  if (dto.osot_users_group !== undefined) {
    payload.osot_users_group = dto.osot_users_group;
  }

  if (dto.osot_parental_leave_from !== undefined) {
    payload.osot_parental_leave_from = dto.osot_parental_leave_from;
  }

  if (dto.osot_parental_leave_to !== undefined) {
    payload.osot_parental_leave_to = dto.osot_parental_leave_to;
  }

  if (dto.osot_parental_leave_expected !== undefined) {
    payload.osot_parental_leave_expected = dto.osot_parental_leave_expected;
  }

  if (dto.osot_retirement_start !== undefined) {
    payload.osot_retirement_start = dto.osot_retirement_start;
  }

  if (dto.osot_privilege !== undefined) {
    payload.osot_privilege = dto.osot_privilege;
  }

  if (dto.osot_access_modifiers !== undefined) {
    payload.osot_access_modifiers = dto.osot_access_modifiers;
  }

  return payload;
}

/**
 * Create membership category analysis summary
 * Useful for dashboard and membership management
 */
export function createMembershipAnalysis(
  category: MembershipCategoryInternal,
): {
  membershipStatus: 'active' | 'inactive' | 'retired' | 'on-leave';
  eligibilityStatus: 'eligible' | 'ineligible' | 'pending-declaration';
  userInformation: {
    userType: 'account' | 'affiliate' | 'unknown';
    hasValidReferences: boolean;
  };
  leaveInformation: {
    isOnParentalLeave: boolean;
    leaveDuration: number | null;
    leaveEndDate: string | null;
  };
  retirementInformation: {
    isRetired: boolean;
    retirementDate: string | null;
  };
  recommendations: string[];
} {
  const recommendations: string[] = [];

  // Determine membership status
  let membershipStatus: 'active' | 'inactive' | 'retired' | 'on-leave';
  if (category.isRetired) {
    membershipStatus = 'retired';
  } else if (category.hasParentalLeave) {
    membershipStatus = 'on-leave';
  } else if (category.isActive) {
    membershipStatus = 'active';
  } else {
    membershipStatus = 'inactive';
  }

  // Determine eligibility status
  let eligibilityStatus: 'eligible' | 'ineligible';
  if (category.isEligible) {
    eligibilityStatus = 'eligible';
  } else {
    eligibilityStatus = 'ineligible';
    recommendations.push(
      'Review eligibility criteria for this membership category',
    );
  }

  // User information validation
  const hasValidReferences = !!(
    (category.osot_table_account && !category.osot_table_account_affiliate) ||
    (!category.osot_table_account && category.osot_table_account_affiliate)
  );

  if (!hasValidReferences) {
    recommendations.push(
      'Invalid user references - must have exactly one account or affiliate reference',
    );
  }

  // Parental leave recommendations
  if (category.hasParentalLeave && category.osot_parental_leave_to) {
    const daysRemaining = Math.ceil(
      (category.osot_parental_leave_to.getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    if (daysRemaining <= 30) {
      recommendations.push(
        `Parental leave ending soon (${daysRemaining} days remaining)`,
      );
    }
  }

  // Membership year recommendations
  const currentYear = new Date().getFullYear();
  const membershipYearNumber = parseInt(category.osot_membership_year, 10);

  if (!isNaN(membershipYearNumber) && membershipYearNumber < currentYear) {
    recommendations.push('Membership year is outdated - consider renewal');
  }

  return {
    membershipStatus,
    eligibilityStatus,
    userInformation: {
      userType: category.userType || 'unknown',
      hasValidReferences,
    },
    leaveInformation: {
      isOnParentalLeave: !!category.hasParentalLeave,
      leaveDuration: calculateParentalLeaveDuration(
        category.osot_parental_leave_from,
        category.osot_parental_leave_to,
      ),
      leaveEndDate:
        category.osot_parental_leave_to?.toISOString().split('T')[0] || null,
    },
    retirementInformation: {
      isRetired: !!category.isRetired,
      retirementDate:
        category.osot_retirement_start?.toISOString().split('T')[0] || null,
    },
    recommendations,
  };
}
