/**
 * Interface representing the raw Dataverse response for Membership Settings entity.
 * Maps directly to osot_table_membership_settings table structure.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety
 * - Based on Table Membership Setting.csv specification exactly (9 business fields total)
 * - Used internally for type safety when working with raw Dataverse data
 *
 * MATCHES Table Membership Setting.csv specification exactly.
 * Supports Individual (account) and Business (affiliate) membership groups.
 */

import {
  AccountStatus,
  Privilege,
  AccessModifier,
} from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';

export interface MembershipSettingsDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /** Primary key GUID */
  osot_table_membership_settingid?: string;

  /** Autonumber Business ID (osot-set-0000001) - CSV: osot_settingsid logical name */
  osot_settingsid?: string;

  /** ISO datetime string */
  createdon?: string;

  /** ISO datetime string */
  modifiedon?: string;

  /** Owner GUID */
  ownerid?: string;

  // ========================================
  // RELATIONSHIP FIELDS (required - Lookup to Table_Organization)
  // ========================================

  /** Organization lookup GUID - Returned on read operations */
  _osot_table_organization_value?: string;

  /** Organization binding - Used for write/create operations (maps to _osot_table_organization_value) */
  'osot_table_organization@odata.bind'?: string;

  // ========================================
  // BUSINESS FIELDS (required)
  // ========================================

  /** Text field - CSV: Single line of text (4 chars) */
  osot_membership_year: string;

  /** Choice value - Choices_Status */
  osot_membership_year_status: AccountStatus;

  /** Choice value - Choices_Membership_Group */
  osot_membership_group: MembershipGroup;

  /** Date string - YYYY-MM-DD format */
  osot_year_starts: string;

  /** Date string - YYYY-MM-DD format */
  osot_year_ends: string;

  // ========================================
  // ACCESS CONTROL FIELDS (optional)
  // ========================================

  /** Choice value - Choices_Privilege */
  osot_privilege?: Privilege;

  /** Choice value - Choices_Access_Modifiers */
  osot_access_modifiers?: AccessModifier;
}
