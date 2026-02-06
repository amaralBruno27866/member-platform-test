/**
 * Internal Membership Preferences interface with all fields including sensitive information.
 * Used for server-side operations and business logic.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (Privilege, AccessModifier) and local enums
 * - MATCHES Table Membership Preferences.csv specification exactly (17 fields total)
 *
 * WARNING: This interface contains sensitive fields and should NEVER be exposed
 * directly to public APIs. Use MembershipPreferenceResponseDto for public responses.
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Complete internal representation for business logic
 * - Includes system fields for auditing and ownership
 * - Type-safe enum integration
 * - Supports user preference management with lookup relationships
 */

import { Privilege, AccessModifier } from '../../../../common/enums';
import { ThirdParties } from '../enums/third-parties.enum';
import { PracticePromotion } from '../enums/practice-promotion.enum';
import { SearchTools } from '../enums/search-tools.enum';
import { PsychotherapySupervision } from '../enums/psychotherapy-supervision.enum';

export interface MembershipPreferenceInternal {
  // ========================================
  // SYSTEM FIELDS (internal use only - never expose publicly)
  // ========================================

  /** GUID - Primary key */
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
  // LOOKUP FIELDS (relationships to other tables)
  // ========================================

  /** Lookup GUID to Table_Membership_Category - Optional */
  osot_table_membership_category?: string;

  /** Lookup GUID to Table_Account - Optional */
  osot_table_account?: string;

  /** Lookup GUID to Table_Account_Affiliate - Optional */
  osot_table_account_affiliate?: string;

  // ========================================
  // BUSINESS FIELDS (from CSV)
  // ========================================

  /** Text field (4 chars) - CSV: Single line of text - Business required */
  osot_membership_year: string;

  /** Choice - Choices_Third_Parties - Optional - Multi-select */
  osot_third_parties?: ThirdParties[];

  /** Choice - Choices_Practice_Promotion - Optional - Multi-select */
  osot_practice_promotion?: PracticePromotion[];

  /** Choice - Choices_Search_Tools - Optional - Multi-select */
  osot_members_search_tools?: SearchTools[];

  /** Boolean - Yes/No field - Optional (default: No) */
  osot_shadowing?: boolean;

  /** Choice - Choices_Psychotherapy - Optional - Multi-select */
  osot_psychotherapy_supervision?: PsychotherapySupervision[];

  /** Boolean - Yes/No field - Business required (default: No) */
  osot_auto_renewal: boolean;

  /** Boolean - Yes/No field - Business required (default: No) - User must accept to proceed */
  osot_membership_declaration: boolean;

  // ========================================
  // ACCESS CONTROL FIELDS (optional - from CSV "Optional")
  // ========================================

  /** Choice - Choices_Privilege (default: Owner) */
  osot_privilege?: Privilege;

  /** Choice - Choices_Access_Modifiers (default: Private) */
  osot_access_modifiers?: AccessModifier;
}
