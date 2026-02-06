/**
 * Interface representing the raw Dataverse response for Membership Practices entity.
 * Maps directly to osot_table_membership_practice table structure.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (Privilege, AccessModifier)
 * - Based on Table Membership Practices.csv specification exactly (17 fields total)
 * - Used internally for type safety when working with raw Dataverse data
 * - MultiSelect fields are stored as comma-separated strings in Dataverse
 *
 * MATCHES Table Membership Practices.csv specification exactly.
 */

import { AccessModifier, Privilege } from '../../../../common/enums';

export interface MembershipPracticesDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /** Primary key GUID */
  osot_table_membership_practiceid?: string;

  /** Autonumber Business ID (osot-pra-0000001) - CSV: osot_practice_id logical name */
  osot_practice_id?: string;

  /** ISO datetime string */
  createdon?: string;

  /** ISO datetime string */
  modifiedon?: string;

  /** Owner GUID */
  ownerid?: string;

  // ========================================
  // LOOKUP FIELDS (GUID references)
  // ========================================

  /** Lookup GUID to Table_Account - Optional */
  osot_table_account?: string;

  // ========================================
  // BUSINESS FIELDS
  // ========================================

  /** Text field - CSV: Single line of text (4 chars) - SYSTEM-DEFINED from membership-settings */
  osot_membership_year: string;

  /** Boolean - Yes/No field - Optional (default: No) */
  osot_preceptor_declaration?: boolean;

  /** Choice value - Choices_Populations - Multi-select - Business required (Dataverse format: "1,2,3") */
  osot_clients_age: string;

  /** Choice value - Choices_Practice_Area - Multi-select - Optional (Dataverse format: "1,2,3") */
  osot_practice_area?: string;

  /** Choice value - Choices_Practice_Settings - Multi-select - Optional (Dataverse format: "1,2,3") */
  osot_practice_settings?: string;

  /** Text field - CSV: Single line of text (255 chars) - Optional (required when practice_settings contains OTHER) */
  osot_practice_settings_other?: string;

  /** Choice value - Choices_Practice_Services - Multi-select - Optional (Dataverse format: "1,2,3") */
  osot_practice_services?: string;

  /** Text field - CSV: Single line of text (255 chars) - Optional (required when practice_services contains OTHER) */
  osot_practice_services_other?: string;

  // ========================================
  // ACCESS CONTROL FIELDS (optional)
  // ========================================

  /** Choice value - Choices_Privilege (default: Owner) */
  osot_privilege?: Privilege;

  /** Choice value - Choices_Access_Modifiers (default: Private) */
  osot_access_modifiers?: AccessModifier;
}
