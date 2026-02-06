/**
 * Internal Membership Settings interface with all fields including sensitive information.
 * Used for server-side operations and business logic.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety
 * - MATCHES Table Membership Setting.csv specification exactly (9 business fields total)
 *
 * WARNING: This interface contains sensitive fields and should NEVER be exposed
 * directly to public APIs. Use MembershipSettingsResponseDto for public responses.
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Complete internal representation for business logic
 * - Includes system fields for auditing and ownership
 * - Type-safe enum integration
 * - Supports membership year configuration and group-based settings
 * - Individual vs Business membership group differentiation
 */

import {
  AccountStatus,
  Privilege,
  AccessModifier,
} from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';

export interface MembershipSettingsInternal {
  // ========================================
  // SYSTEM FIELDS (internal use only - never expose publicly)
  // ========================================

  /** GUID - Primary key */
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
  // RELATIONSHIP FIELDS (required - from CSV "Business requires")
  // ========================================

  /** Organization GUID - Multi-tenant isolation (REQUIRED) */
  organizationGuid: string;

  // ========================================
  // BUSINESS FIELDS (required - from CSV "Business requires")
  // ========================================

  /** Text field - CSV: Single line of text (4 chars) */
  osot_membership_year: string;

  /** Choice - Choices_Status (Active, Inactive, Pending) */
  osot_membership_year_status: AccountStatus;

  /** Choice - Choices_Membership_Group (Individual, Business) */
  osot_membership_group: MembershipGroup;

  /** Date only - Membership year start date */
  osot_year_starts: string;

  /** Date only - Membership year end date */
  osot_year_ends: string;

  // ========================================
  // ACCESS CONTROL FIELDS (optional - from CSV "Optional")
  // ========================================

  /** Choice - Choices_Privilege (default: Owner) */
  osot_privilege?: Privilege;

  /** Choice - Choices_Access_Modifiers (default: Protected) */
  osot_access_modifiers?: AccessModifier;
}
