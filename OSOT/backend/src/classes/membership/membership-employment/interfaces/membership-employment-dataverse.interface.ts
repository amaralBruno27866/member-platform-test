/**
 * Interface representing the raw Dataverse response for Membership Employment entity.
 * Maps directly to osot_table_membership_employment table structure.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (Privilege, AccessModifier)
 * - Based on Table Membership Employment.csv specification exactly (24 fields total)
 * - Used internally for type safety when working with raw Dataverse data
 * - MultiSelect fields are stored as comma-separated strings in Dataverse
 *
 * MATCHES Table Membership Employment.csv specification exactly.
 */

import { Privilege, AccessModifier } from '../../../../common/enums';

export interface MembershipEmploymentDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /** Primary key GUID */
  osot_table_membership_employmentid?: string;

  /** Autonumber Business ID (osot-emp-0000001) - CSV: osot_employment_id logical name */
  osot_employment_id?: string;

  /** ISO datetime string */
  createdon?: string;

  /** ISO datetime string */
  modifiedon?: string;

  /** Owner GUID */
  ownerid?: string;

  // ========================================
  // LOOKUP FIELDS (GUID references)
  // ========================================

  /** Lookup GUID to Table_Account - Optional (XOR with affiliate) */
  osot_table_account?: string;

  /** Lookup GUID to Table_Account_Affiliate - Optional (XOR with account) */
  osot_table_account_affiliate?: string;

  // ========================================
  // BUSINESS FIELDS (required)
  // ========================================

  /** Text field - CSV: Single line of text (4 chars) - SYSTEM-DEFINED from membership-settings */
  osot_membership_year: string;

  /** Choice value - Choices_Employment_Status - Single select */
  osot_employment_status: number;

  /** Choice value - Choices_Work_Hours - Multi-select (Dataverse format: "1,2,3") */
  osot_work_hours: string;

  /** Choice value - Choices_Role_Descriptor - Single select */
  osot_role_descriptor: number;

  /** Text field - CSV: Single line of text (255 chars) - Optional (required when role_descriptor = OTHER) */
  osot_role_descriptor_other?: string;

  /** Choice value - Choices_Practice_Years - Single select */
  osot_practice_years: number;

  /** Choice value - Choices_Funding - Multi-select (Dataverse format: "1,2,3") */
  osot_position_funding: string;

  /** Text field - CSV: Single line of text (255 chars) - Optional (required when position_funding contains OTHER) */
  osot_position_funding_other?: string;

  /** Choice value - Choices_Benefits - Multi-select (Dataverse format: "1,2,3") */
  osot_employment_benefits: string;

  /** Text field - CSV: Single line of text (255 chars) - Optional (required when employment_benefits contains OTHER) */
  osot_employment_benefits_other?: string;

  /** Choice value - Choices_Hourly_Earnings - Single select */
  osot_earnings_employment: number;

  /** Choice value - Choices_Hourly_Earnings - Single select */
  osot_earnings_self_direct: number;

  /** Choice value - Choices_Hourly_Earnings - Single select */
  osot_earnings_self_indirect: number;

  /** Text field - CSV: Single line of text (255 chars) - Business required */
  osot_union_name: string;

  /** Boolean value - Yes/No field - Optional */
  osot_another_employment?: boolean;

  // ========================================
  // ACCESS CONTROL FIELDS (optional)
  // ========================================

  /** Choice value - Choices_Privilege (default: Owner) */
  osot_privilege?: Privilege;

  /** Choice value - Choices_Access_Modifiers (default: Private) */
  osot_access_modifiers?: AccessModifier;
}
