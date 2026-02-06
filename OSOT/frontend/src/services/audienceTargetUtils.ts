/**
 * Audience Target Utilities
 * Helper functions for audience targeting
 */

import type { AudienceTargetResponse } from './audienceTargetService';

/**
 * Check if a product is public (no audience restrictions)
 * Returns true if all audience targeting fields are empty/undefined
 */
export function isPublicProduct(target: AudienceTargetResponse | null | undefined): boolean {
  if (!target) return true; // No target = public
  
  const fields = [
    target.osot_account_group,
    target.osot_membership_gender,
    target.osot_indigenous_details,
    target.osot_membership_language,
    target.osot_membership_race,
    target.osot_affiliate_city,
    target.osot_affiliate_province,
    target.osot_membership_city,
    target.osot_province,
    target.osot_affiliate_area,
    target.osot_eligibility_affiliate,
    target.osot_membership_category,
    target.osot_earnings,
    target.osot_earnings_selfdirect,
    target.osot_earnings_selfindirect,
    target.osot_employment_benefits,
    target.osot_employment_status,
    target.osot_position_funding,
    target.osot_practice_years,
    target.osot_role_description,
    target.osot_work_hours,
    target.osot_client_age,
    target.osot_practice_area,
    target.osot_practice_services,
    target.osot_practice_settings,
    target.osot_membership_search_tools,
    target.osot_practice_promotion,
    target.osot_psychotherapy_supervision,
    target.osot_third_parties,
    target.osot_coto_status,
    target.osot_ot_grad_year,
    target.osot_ot_university,
    target.osot_ota_grad_year,
    target.osot_ota_college,
  ];
  
  // Check if all fields are empty/undefined
  return fields.every(field => !field || (Array.isArray(field) && field.length === 0));
}

/**
 * Get count of active audience filters
 */
export function getActiveFiltersCount(target: AudienceTargetResponse | null | undefined): number {
  if (!target) return 0;
  
  const fields = [
    target.osot_account_group,
    target.osot_membership_gender,
    target.osot_indigenous_details,
    target.osot_membership_language,
    target.osot_membership_race,
    target.osot_affiliate_city,
    target.osot_affiliate_province,
    target.osot_membership_city,
    target.osot_province,
    target.osot_affiliate_area,
    target.osot_eligibility_affiliate,
    target.osot_membership_category,
    target.osot_earnings,
    target.osot_earnings_selfdirect,
    target.osot_earnings_selfindirect,
    target.osot_employment_benefits,
    target.osot_employment_status,
    target.osot_position_funding,
    target.osot_practice_years,
    target.osot_role_description,
    target.osot_work_hours,
    target.osot_client_age,
    target.osot_practice_area,
    target.osot_practice_services,
    target.osot_practice_settings,
    target.osot_membership_search_tools,
    target.osot_practice_promotion,
    target.osot_psychotherapy_supervision,
    target.osot_third_parties,
    target.osot_coto_status,
    target.osot_ot_grad_year,
    target.osot_ot_university,
    target.osot_ota_grad_year,
    target.osot_ota_college,
  ];
  
  return fields.filter(field => field && Array.isArray(field) && field.length > 0).length;
}
