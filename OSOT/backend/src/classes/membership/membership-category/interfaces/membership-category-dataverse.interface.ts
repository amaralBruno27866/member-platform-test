/**
 * Interface representing the raw Dataverse response for Membership Category entity.
 * Maps directly to Table Membership Category.csv table structure.
 *
 * MATCHES Table Membership Category.csv specification exactly (16 fields total).
 * Used internally for type safety when working with raw Dataverse data.
 */
export interface MembershipCategoryDataverse {
  // System fields
  osot_table_membership_categoryid?: string; // Primary key GUID (singular)
  osot_category_id?: string; // Autonumber Business ID (osot-cat-0000001)
  createdon?: string; // ISO datetime string
  modifiedon?: string; // ISO datetime string
  ownerid?: string; // Owner GUID

  // User reference fields (Lookup - exclusive OR relationship)
  osot_table_account?: string; // FK to Table_Account (OT/OTA users)
  osot_table_account_affiliate?: string; // FK to Table_Account_Affiliate (Affiliate users)

  // Core membership category fields
  osot_membership_year: string; // String field - Membership year (required)
  osot_membership_category?: number; // Choice field - Category enum (optional)
  osot_users_group?: number; // Choice field - UserGroup enum (optional, internal classification)

  // Eligibility fields (Choice fields based on user type)
  osot_eligibility?: number; // Choice field - MembershipEligilibility enum for OT/OTA (optional)
  osot_eligibility_affiliate?: number; // Choice field - AffiliateEligibility enum for Affiliates (optional)

  // Special date fields (Date only format)
  osot_parental_leave_from?: string; // Date field - ISO date string (optional)
  osot_parental_leave_to?: string; // Date field - ISO date string (optional)
  osot_parental_leave_expected?: number; // Choice field - ParentalLeaveExpected enum (optional)
  osot_retirement_start?: string; // Date field - ISO date string (optional)

  // Security and access control (Choice fields)
  osot_privilege?: number; // Privilege enum (optional, default: Owner)
  osot_access_modifiers?: number; // AccessModifier enum (optional, default: Private)
}

/**
 * Type representing valid User Reference combinations
 * Enforces business rule: Must have EITHER Account OR Affiliate, never both
 */
export type MembershipCategoryUserReference =
  | {
      osot_table_account: string;
      osot_table_account_affiliate?: never;
    }
  | {
      osot_table_account?: never;
      osot_table_account_affiliate: string;
    };

/**
 * Type representing complete Membership Category with enforced user reference
 * Combines base interface with user reference constraint
 */
export type MembershipCategoryDataverseComplete = Omit<
  MembershipCategoryDataverse,
  'osot_table_account' | 'osot_table_account_affiliate'
> &
  MembershipCategoryUserReference;

/**
 * Type for creating new Membership Category records
 * Excludes system-generated fields and makes required fields explicit
 */
export interface CreateMembershipCategoryDataverse
  extends Omit<
    MembershipCategoryDataverse,
    | 'osot_table_membership_categoryid'
    | 'osot_category_id'
    | 'createdon'
    | 'modifiedon'
    | 'ownerid'
  > {
  // Explicitly require these fields for creation
  osot_membership_year: string;
  osot_membership_declaration: boolean;
}

/**
 * Type for updating existing Membership Category records
 * Makes all fields optional except system ID
 */
export interface UpdateMembershipCategoryDataverse
  extends Partial<
    Omit<
      MembershipCategoryDataverse,
      | 'osot_table_membership_categoryid'
      | 'osot_category_id'
      | 'createdon'
      | 'modifiedon'
      | 'ownerid'
    >
  > {
  // ID is required for updates
  osot_table_membership_categoryid: string;
}

/**
 * Enum mapping for Choice fields
 * Maps Dataverse choice values to enum names for documentation
 */
export const MEMBERSHIP_CATEGORY_CHOICE_MAPPINGS = {
  osot_membership_year: 'MembershipYear', // 1-32 (2019-2050)
  osot_membership_category: 'Category', // 1-15 (OT_PR, OTA_PR, AFF_PRIM, etc.)
  osot_users_group: 'UserGroup', // 1-9 (OT_STUDENT, OTA_STUDENT, OT, OTA, etc.)
  osot_eligibility: 'MembershipEligilibility', // 0-7 (NONE, QUESTION_1-7)
  osot_eligibility_affiliate: 'AffiliateEligibility', // 1-2 (PRIMARY, PREMIUM)
  osot_parental_leave_expected: 'ParentalLeaveExpected', // 1-2 (FULL_YEAR, SIX_MONTHS)
  osot_privilege: 'Privilege', // 1-3 (OWNER, ADMIN, MAIN)
  osot_access_modifiers: 'AccessModifier', // 1-3 (PUBLIC, PROTECTED, PRIVATE)
} as const;
