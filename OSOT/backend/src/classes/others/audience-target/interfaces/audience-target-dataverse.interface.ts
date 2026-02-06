/**
 * Dataverse format interface for Audience Target.
 *
 * This interface represents the RAW format returned by Microsoft Dataverse.
 * All multiple choice fields are stored as comma-separated strings.
 *
 * Use the mapper to convert between this format and AudienceTargetInternal.
 */

export interface AudienceTargetDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================
  osot_table_audience_targetid?: string; // GUID
  osot_target?: string; // Autonumber: osot-tgt-0000001
  ownerid?: string; // System owner
  createdon?: string; // ISO date
  modifiedon?: string; // ISO date

  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================
  osot_table_product?: string; // Lookup GUID
  _osot_table_product_value?: string; // Lookup value (alternative field name)

  // ========================================
  // CHOICE FIELDS (All stored as comma-separated strings)
  // Format: "1,2,3" or empty string ""
  // ========================================

  // Account Group
  osot_account_group?: string;

  // Affiliate
  osot_affiliate_area?: string;
  osot_affiliate_city?: string;
  osot_affiliate_province?: string;

  // Address
  osot_membership_city?: string;
  osot_province?: string;

  // Identity
  osot_gender?: string;
  osot_indigenous_details?: string;
  osot_language?: string;
  osot_race?: string;

  // Membership Category
  osot_eligibility_affiliate?: string;
  osot_membership_category?: string;

  // Employment
  osot_earnings?: string;
  osot_earnings_selfdirect?: string;
  osot_earnings_selfindirect?: string;
  osot_employment_benefits?: string;
  osot_employment_status?: string;
  osot_position_funding?: string;
  osot_practice_years?: string;
  osot_role_description?: string;
  osot_work_hours?: string;

  // Practice
  osot_client_age?: string;
  osot_practice_area?: string;
  osot_practice_services?: string;
  osot_practice_settings?: string;

  // Preference
  osot_membership_search_tools?: string;
  osot_practice_promotion?: string;
  osot_psychotherapy_supervision?: string;
  osot_third_parties?: string;

  // Education OT
  osot_coto_status?: string;
  osot_ot_grad_year?: string;
  osot_ot_university?: string;

  // Education OTA
  osot_ota_grad_year?: string;
  osot_ota_college?: string;

  // ========================================
  // INDEX SIGNATURE
  // ========================================
  [key: string]: unknown;
}

/**
 * Usage notes:
 *
 * - This interface matches the RAW Dataverse API response
 * - All choice fields are strings: "1,2,3" or ""
 * - Use AudienceTargetMapper to convert to internal format
 * - Lookup fields may have alternative names (_osot_table_product_value)
 *
 * @example Raw Dataverse response:
 * ```json
 * {
 *   "osot_table_audience_targetid": "abc-123-def-456",
 *   "osot_target": "osot-tgt-0000001",
 *   "_osot_table_product_value": "product-guid-789",
 *   "osot_account_group": "1,2",
 *   "osot_province": "1,3,5",
 *   "osot_language": "13,18",
 *   "createdon": "2025-12-17T10:00:00Z"
 * }
 * ```
 */
