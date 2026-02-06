/**
 * Internal Membership Practices interface with all fields including sensitive information.
 * Used for server-side operations and business logic.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (Privilege, AccessModifier) and local enums
 * - MATCHES Table Membership Practices.csv specification exactly (17 fields total)
 *
 * WARNING: This interface contains sensitive fields and should NEVER be exposed
 * directly to public APIs. Use MembershipPracticesResponseDto for public responses.
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Complete internal representation for business logic
 * - Includes system fields for auditing and ownership
 * - Type-safe enum integration
 * - Supports practice data management with lookup relationships
 *
 * CRITICAL: membership_year is SYSTEM-DEFINED (from membership-settings), not user-provided
 */

import { AccessModifier, Privilege } from '../../../../common/enums';
import { ClientsAge } from '../enums/clients-age.enum';
import { PracticeArea } from '../enums/practice-area.enum';
import { PracticeSettings } from '../enums/practice-settings.enum';
import { PracticeServices } from '../enums/practice-services.enum';

export interface MembershipPracticesInternal {
  // ========================================
  // SYSTEM FIELDS (internal use only - never expose publicly)
  // ========================================

  /** GUID - Primary key */
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
  // LOOKUP FIELDS (relationships to other tables)
  // ========================================

  /** Lookup GUID to Table_Account - Optional */
  osot_table_account?: string;

  // ========================================
  // BUSINESS FIELDS (from CSV)
  // ========================================

  /** Text field (4 chars) - CSV: Single line of text - Business required
   * CRITICAL: SYSTEM-DEFINED from membership-settings, NOT user-provided
   * Users CANNOT set or edit this field
   */
  osot_membership_year: string;

  /** Boolean - Yes/No field - Optional (default: No) */
  osot_preceptor_declaration?: boolean;

  /** Choice - Choices_Populations - Business required - Multi-select
   * CRITICAL: Must have at least one value (business required array)
   */
  osot_clients_age: ClientsAge[];

  /** Choice - Choices_Practice_Area - Optional - Multi-select */
  osot_practice_area?: PracticeArea[];

  /** Choice - Choices_Practice_Settings - Optional - Multi-select */
  osot_practice_settings?: PracticeSettings[];

  /** Text field (255 chars) - Optional (required when osot_practice_settings contains OTHER) */
  osot_practice_settings_other?: string;

  /** Choice - Choices_Practice_Services - Optional - Multi-select */
  osot_practice_services?: PracticeServices[];

  /** Text field (255 chars) - Optional (required when osot_practice_services contains OTHER) */
  osot_practice_services_other?: string;

  // ========================================
  // ACCESS CONTROL FIELDS (optional - from CSV "Optional")
  // ========================================

  /** Choice - Choices_Privilege (default: Owner) */
  osot_privilege?: Privilege;

  /** Choice - Choices_Access_Modifiers (default: Private) */
  osot_access_modifiers?: AccessModifier;
}
