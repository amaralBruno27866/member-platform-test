/**
 * Interface representing the raw Dataverse response for Membership Preferences entity.
 * Maps directly to osot_table_membership_preference table structure.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (Privilege, AccessModifier)
 * - Based on Table Membership Preferences.csv specification exactly (17 fields total)
 * - Used internally for type safety when working with raw Dataverse data
 * - MultiSelect fields are stored as comma-separated strings in Dataverse
 *
 * MATCHES Table Membership Preferences.csv specification exactly.
 */

import { Privilege, AccessModifier } from '../../../../common/enums';

export interface MembershipPreferenceDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /** Primary key GUID */
  osot_table_membership_preferenceid?: string;

  /** Autonumber Business ID (osot-pref-0000001) - CSV: osot_preference_id logical name */
  osot_preference_id?: string;

  /** ISO datetime string */
  createdon?: string;

  /** ISO datetime string */
  modifiedon?: string;

  /** Owner GUID */
  ownerid?: string;

  // ========================================
  // LOOKUP FIELDS (GUID references)
  // ========================================

  /** Lookup GUID to Table_Membership_Category */
  osot_table_membership_category?: string;

  /** Lookup GUID to Table_Account */
  osot_table_account?: string;

  /** Lookup GUID to Table_Account_Affiliate */
  osot_table_account_affiliate?: string;

  // ========================================
  // BUSINESS FIELDS (required)
  // ========================================

  /** Text field - CSV: Single line of text (4 chars) */
  osot_membership_year: string;

  /** Choice value - Choices_Third_Parties - Multi-select (Dataverse format: "1,2,3") */
  osot_third_parties?: string;

  /** Choice value - Choices_Practice_Promotion - Multi-select (Dataverse format: "1,2,3") */
  osot_practice_promotion?: string;

  /** Choice value - Choices_Search_Tools - Multi-select (Dataverse format: "1,2,3") */
  osot_members_search_tools?: string;

  /** Boolean value - Yes/No field */
  osot_shadowing?: boolean;

  /** Choice value - Choices_Psychotherapy - Multi-select (Dataverse format: "1,2,3") */
  osot_psychotherapy_supervision?: string;

  /** Boolean value - Yes/No field */
  osot_auto_renewal: boolean;

  /** Boolean value - Yes/No field - Business required (default: No) */
  osot_membership_declaration: boolean;

  // ========================================
  // ACCESS CONTROL FIELDS (optional)
  // ========================================

  /** Choice value - Choices_Privilege */
  osot_privilege?: Privilege;

  /** Choice value - Choices_Access_Modifiers - NOTE: Field name is singular in Dataverse! */
  osot_access_modifier?: AccessModifier;
}
