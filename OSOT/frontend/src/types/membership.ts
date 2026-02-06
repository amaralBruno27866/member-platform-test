/**
 * Membership Types
 * TypeScript interfaces for membership-related data structures
 */

// ========================================
// MEMBERSHIP CATEGORY
// ========================================

export interface MembershipCategory {
  osot_category_id: string;
  osot_table_membership_categoryid: string;
  osot_table_account?: string;
  osot_table_account_affiliate?: string;
  osot_membership_year: string;
  osot_eligibility?: string;
  osot_eligibility_affiliate?: string;
  osot_membership_category?: string;
  osot_membership_declaration: boolean;
  osot_users_group?: string;
  osot_parental_leave_from?: string;
  osot_parental_leave_to?: string;
  osot_retirement_start?: string;
  osot_access_modifiers?: string;
  osot_privilege?: string;
}

// ========================================
// MEMBERSHIP EMPLOYMENT
// ========================================

export interface MembershipEmployment {
  osot_membership_year: string;
  osot_employment_status: string;
  osot_work_hours: string[];
  osot_role_descriptor: string;
  osot_role_descriptor_other?: string;
  osot_practice_years: string;
  osot_position_funding: string[];
  osot_position_funding_other?: string;
  osot_employment_benefits: string[];
  osot_employment_benefits_other?: string;
  osot_earnings_employment: string;
  osot_earnings_self_direct: string;
  osot_earnings_self_indirect: string;
  osot_union_name: string;
  osot_another_employment: boolean;
}

// ========================================
// MEMBERSHIP PRACTICES
// ========================================

export interface MembershipPractices {
  osot_membership_year: string;
  osot_preceptor_declaration?: boolean;
  osot_clients_age: string[];
  osot_practice_area?: string[];
  osot_practice_settings?: string[];
  osot_practice_services?: string[];
  osot_practice_services_other?: string;
}

// ========================================
// MEMBERSHIP PREFERENCES
// ========================================

export interface MembershipPreferences {
  osot_preference_id?: string;
  osot_membership_year: string;
  osot_auto_renewal: boolean;
  osot_third_parties?: string[];
  osot_practice_promotion?: string[];
  osot_search_tools?: string[];
  osot_psychotherapy_supervision?: string[];
  osot_shadowing?: boolean;
}

// ========================================
// COMBINED MEMBERSHIP DATA
// ========================================

export interface MembershipData {
  category: MembershipCategory | null;
  employment: MembershipEmployment | null;
  practices: MembershipPractices | null;
  preferences: MembershipPreferences | null;
  hasActiveMembership: boolean;
}
