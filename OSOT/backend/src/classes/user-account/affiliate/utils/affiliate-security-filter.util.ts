/**
 * Affiliate Security Filter Utility
 *
 * PURPOSE:
 * - Filters affiliate response data based on user privilege level
 * - Prevents unauthorized access to sensitive affiliate information
 * - Implements role-based field visibility controls
 *
 * PRIVILEGE LEVELS (from Dataverse):
 * - OWNER (1): Full access to own affiliate data
 * - ADMIN (2): Administrative fields and sensitive data access
 * - MAIN (3): Extended information for authenticated users
 * - null/undefined: Public access only (non-authenticated users)
 *
 * INTEGRATION:
 * - Used by affiliate controllers to filter responses
 * - Follows same pattern as account-security-filter.util.ts
 * - Uses Dataverse-synchronized Privilege enum directly
 */

import { Privilege } from '../../../../common/enums';
import type { AffiliateInternal } from '../interfaces/affiliate-internal.interface';

interface FilterContext {
  isOwner?: boolean;
  isRepresentative?: boolean;
}

/**
 * Filter affiliate fields based on user privilege level and context
 */
export function filterAffiliateFields(
  affiliate: Record<string, unknown> | AffiliateInternal,
  userPrivilege?: Privilege,
  context?: FilterContext,
): Partial<AffiliateInternal> {
  if (!affiliate) return {};

  const filtered: Partial<AffiliateInternal> = {};

  // PUBLIC fields - visible to everyone (including non-authenticated users)
  if (!userPrivilege) {
    return {
      osot_affiliate_id: affiliate.osot_affiliate_id, // Public business ID for user support
      osot_affiliate_name: affiliate.osot_affiliate_name,
      osot_affiliate_area: affiliate.osot_affiliate_area,
      osot_affiliate_city: affiliate.osot_affiliate_city,
      osot_affiliate_province: affiliate.osot_affiliate_province,
      osot_affiliate_country: affiliate.osot_affiliate_country,
      osot_affiliate_website: affiliate.osot_affiliate_website,
      osot_other_city: affiliate.osot_other_city,
      osot_other_province_state: affiliate.osot_other_province_state,
      // Social media (public profiles only)
      osot_affiliate_facebook: affiliate.osot_affiliate_facebook,
      osot_affiliate_instagram: affiliate.osot_affiliate_instagram,
      osot_affiliate_linkedin: affiliate.osot_affiliate_linkedin,
    } as Partial<AffiliateInternal>;
  }

  // MAIN privilege (authenticated users) - extended information
  if (userPrivilege === Privilege.MAIN) {
    Object.assign(filtered, {
      // Public fields
      osot_affiliate_id: affiliate.osot_affiliate_id, // Public business ID for user support
      osot_affiliate_name: affiliate.osot_affiliate_name,
      osot_affiliate_area: affiliate.osot_affiliate_area,
      osot_affiliate_city: affiliate.osot_affiliate_city,
      osot_affiliate_province: affiliate.osot_affiliate_province,
      osot_affiliate_country: affiliate.osot_affiliate_country,
      osot_affiliate_website: affiliate.osot_affiliate_website,
      osot_other_city: affiliate.osot_other_city,
      osot_other_province_state: affiliate.osot_other_province_state,
      osot_affiliate_facebook: affiliate.osot_affiliate_facebook,
      osot_affiliate_instagram: affiliate.osot_affiliate_instagram,
      osot_affiliate_linkedin: affiliate.osot_affiliate_linkedin,
      osot_affiliate_tiktok: affiliate.osot_affiliate_tiktok,

      // Extended info for authenticated users
      osot_affiliate_address_1: affiliate.osot_affiliate_address_1,
      osot_affiliate_postal_code: affiliate.osot_affiliate_postal_code,
      osot_representative_first_name: affiliate.osot_representative_first_name,
      osot_representative_last_name: affiliate.osot_representative_last_name,
      osot_representative_job_title: affiliate.osot_representative_job_title,
      osot_account_status: affiliate.osot_account_status,
    });

    // Contact info only if owner or admin
    if (context?.isOwner || userPrivilege <= Privilege.ADMIN) {
      Object.assign(filtered, {
        osot_affiliate_email: affiliate.osot_affiliate_email,
        osot_affiliate_phone: affiliate.osot_affiliate_phone,
      });
    }

    return filtered;
  }

  // ADMIN privilege - administrative access
  if (userPrivilege === Privilege.ADMIN) {
    Object.assign(filtered, {
      // All MAIN fields
      osot_affiliate_name: affiliate.osot_affiliate_name,
      osot_affiliate_area: affiliate.osot_affiliate_area,
      osot_affiliate_city: affiliate.osot_affiliate_city,
      osot_affiliate_province: affiliate.osot_affiliate_province,
      osot_affiliate_country: affiliate.osot_affiliate_country,
      osot_affiliate_website: affiliate.osot_affiliate_website,
      osot_other_city: affiliate.osot_other_city,
      osot_other_province_state: affiliate.osot_other_province_state,
      osot_affiliate_facebook: affiliate.osot_affiliate_facebook,
      osot_affiliate_instagram: affiliate.osot_affiliate_instagram,
      osot_affiliate_linkedin: affiliate.osot_affiliate_linkedin,
      osot_affiliate_tiktok: affiliate.osot_affiliate_tiktok,
      osot_affiliate_address_1: affiliate.osot_affiliate_address_1,
      osot_affiliate_address_2: affiliate.osot_affiliate_address_2,
      osot_affiliate_postal_code: affiliate.osot_affiliate_postal_code,
      osot_representative_first_name: affiliate.osot_representative_first_name,
      osot_representative_last_name: affiliate.osot_representative_last_name,
      osot_representative_job_title: affiliate.osot_representative_job_title,
      osot_affiliate_email: affiliate.osot_affiliate_email,
      osot_affiliate_phone: affiliate.osot_affiliate_phone,
      osot_account_status: affiliate.osot_account_status,

      // Admin-specific fields
      osot_affiliate_id: affiliate.osot_affiliate_id,
      osot_account_declaration: affiliate.osot_account_declaration,
      osot_access_modifiers: affiliate.osot_access_modifiers,
      osot_privilege: affiliate.osot_privilege,

      // Timestamps
      createdon: affiliate.createdon,
      modifiedon: affiliate.modifiedon,
    });

    return filtered;
  }

  // OWNER privilege - full access (should only be used for self-access)
  if (userPrivilege === Privilege.OWNER) {
    // Return all fields except sensitive internal system IDs
    const affiliateClone = { ...affiliate } as AffiliateInternal;
    delete affiliateClone.osot_table_account_affiliateid; // Remove internal GUID for security
    return affiliateClone;
  }

  // Fallback to public fields for unknown privileges
  return {
    osot_affiliate_id: affiliate.osot_affiliate_id, // Public business ID for user support
    osot_affiliate_name: affiliate.osot_affiliate_name,
    osot_affiliate_area: affiliate.osot_affiliate_area,
    osot_affiliate_city: affiliate.osot_affiliate_city,
    osot_affiliate_province: affiliate.osot_affiliate_province,
    osot_affiliate_country: affiliate.osot_affiliate_country,
    osot_affiliate_website: affiliate.osot_affiliate_website,
    osot_other_city: affiliate.osot_other_city,
    osot_other_province_state: affiliate.osot_other_province_state,
    osot_affiliate_facebook: affiliate.osot_affiliate_facebook,
    osot_affiliate_instagram: affiliate.osot_affiliate_instagram,
    osot_affiliate_linkedin: affiliate.osot_affiliate_linkedin,
  } as Partial<AffiliateInternal>;
}

/**
 * Check if user can access specific affiliate data
 */
export function canAccessAffiliate(
  userPrivilege?: Privilege,
  targetAffiliateId?: string,
  userAffiliateId?: string,
): boolean {
  // Owner can access their own affiliate
  if (
    targetAffiliateId &&
    userAffiliateId &&
    targetAffiliateId === userAffiliateId
  ) {
    return true;
  }

  // Admin can access any affiliate
  if (userPrivilege && userPrivilege <= Privilege.ADMIN) {
    return true;
  }

  // Main users can only access their own
  return targetAffiliateId === userAffiliateId;
}

/**
 * Check if user can modify specific affiliate data
 */
export function canModifyAffiliate(
  userPrivilege?: Privilege,
  targetAffiliateId?: string,
  userAffiliateId?: string,
): boolean {
  // Owner can modify their own affiliate
  if (
    targetAffiliateId &&
    userAffiliateId &&
    targetAffiliateId === userAffiliateId
  ) {
    return true;
  }

  // Admin can modify any affiliate
  if (userPrivilege && userPrivilege <= Privilege.ADMIN) {
    return true;
  }

  // Main users cannot modify other affiliates
  return false;
}
