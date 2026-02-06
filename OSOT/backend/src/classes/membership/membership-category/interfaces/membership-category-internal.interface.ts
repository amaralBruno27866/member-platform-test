import { Category } from '../../../../common/enums/categories-enum';
import { MembershipEligilibility } from '../../../../common/enums/eligibility-enum';
import { AffiliateEligibility } from '../../../../common/enums/affiliate-eligibility-enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { UserGroup } from '../../../../common/enums/user-group.enum';
import { ParentalLeaveExpected } from '../enums/parental-leave-expected.enum';

/**
 * Internal Membership Category interface with all fields including sensitive information.
 * Used for server-side operations and business logic.
 *
 * MATCHES Table Membership Category.csv specification exactly (16 fields total).
 *
 * WARNING: This interface contains sensitive fields and should NEVER be exposed
 * directly to public APIs. Use MembershipCategoryResponseDto for public responses.
 */
export interface MembershipCategoryInternal {
  // System fields (internal use only - never expose publicly)
  osot_table_membership_categoryid?: string; // GUID - Primary key
  osot_category_id?: string; // Autonumber Business ID (osot-cat-0000001)
  createdon?: Date; // Date object for internal processing
  modifiedon?: Date; // Date object for internal processing
  ownerid?: string; // Owner GUID

  // User reference fields (business critical - exclusive OR relationship)
  osot_table_account?: string; // FK to Table_Account (OT/OTA users)
  osot_table_account_affiliate?: string; // FK to Table_Account_Affiliate (Affiliate users)

  // Core membership category fields
  osot_membership_year: string; // Text field - membership year as string (required)
  osot_membership_category?: Category; // Choice field - Category enum (optional)
  osot_users_group?: UserGroup; // Choice field - UserGroup enum (optional, internal classification)

  // Eligibility fields (based on user type)
  osot_eligibility?: MembershipEligilibility; // Choice field for OT/OTA users (optional)
  osot_eligibility_affiliate?: AffiliateEligibility; // Choice field for Affiliate users (optional)

  // Special date fields (Date objects for internal processing)
  osot_parental_leave_from?: Date; // Parental leave start date (optional)
  osot_parental_leave_to?: Date; // Parental leave end date (optional)
  osot_parental_leave_expected?: ParentalLeaveExpected; // Choice field - Expected parental leave duration (optional)
  osot_retirement_start?: Date; // Retirement start date (optional)

  // Security and access control
  osot_privilege?: Privilege; // Privilege enum (optional, default: Owner)
  osot_access_modifiers?: AccessModifier; // AccessModifier enum (optional, default: Private)

  // Computed fields for business logic (not stored in database)
  isActive?: boolean; // Computed: based on membership year status and dates
  userType?: 'account' | 'affiliate'; // Computed: based on which FK is populated
  isEligible?: boolean; // Computed: based on eligibility rules and category
  hasParentalLeave?: boolean; // Computed: has active parental leave period
  isRetired?: boolean; // Computed: has retirement status with valid date
  daysUntilExpiration?: number; // Computed: days until membership expires
}

/**
 * Type representing valid User Reference combinations for Internal interface
 * Enforces business rule: Must have EITHER Account OR Affiliate, never both
 */
export type MembershipCategoryInternalUserReference =
  | {
      osot_table_account: string;
      osot_table_account_affiliate?: never;
      userType: 'account';
    }
  | {
      osot_table_account?: never;
      osot_table_account_affiliate: string;
      userType: 'affiliate';
    };

/**
 * Type representing complete Internal Membership Category with enforced user reference
 * Combines base interface with user reference constraint and computed userType
 */
export type MembershipCategoryInternalComplete = Omit<
  MembershipCategoryInternal,
  'osot_table_account' | 'osot_table_account_affiliate' | 'userType'
> &
  MembershipCategoryInternalUserReference;

/**
 * Type for creating new Internal Membership Category records
 * Excludes system-generated and computed fields
 */
export interface CreateMembershipCategoryInternal
  extends Omit<
    MembershipCategoryInternal,
    | 'osot_table_membership_categoryid'
    | 'osot_category_id'
    | 'createdon'
    | 'modifiedon'
    | 'ownerid'
    | 'isActive'
    | 'userType'
    | 'isEligible'
    | 'hasParentalLeave'
    | 'isRetired'
    | 'daysUntilExpiration'
  > {
  // Explicitly require these fields for creation
  osot_membership_year: string;
  osot_membership_declaration: boolean;
}

/**
 * Type for updating existing Internal Membership Category records
 * Makes all fields optional except system ID and excludes computed fields
 */
export interface UpdateMembershipCategoryInternal
  extends Partial<
    Omit<
      MembershipCategoryInternal,
      | 'osot_table_membership_categoryid'
      | 'osot_category_id'
      | 'createdon'
      | 'modifiedon'
      | 'ownerid'
      | 'isActive'
      | 'userType'
      | 'isEligible'
      | 'hasParentalLeave'
      | 'isRetired'
      | 'daysUntilExpiration'
    >
  > {
  // ID is required for updates
  osot_table_membership_categoryid: string;
}

/**
 * Business logic configuration for Internal interface
 * Defines how computed fields should be calculated
 */
export const MEMBERSHIP_CATEGORY_INTERNAL_CONFIG = {
  // Field computation rules
  COMPUTED_FIELDS: {
    isActive: 'Based on membership year status and current date',
    userType: 'Based on which FK is populated (account vs affiliate)',
    isEligible: 'Based on eligibility rules and category requirements',
    hasParentalLeave:
      'Has active parental leave period (current date between from/to)',
    isRetired: 'Has retirement category with valid retirement start date',
    daysUntilExpiration: 'Days until membership expires (can be negative)',
  },

  // Default values for computed fields
  COMPUTED_DEFAULTS: {
    isActive: false,
    isEligible: false,
    hasParentalLeave: false,
    isRetired: false,
    daysUntilExpiration: 0,
  },
} as const;
