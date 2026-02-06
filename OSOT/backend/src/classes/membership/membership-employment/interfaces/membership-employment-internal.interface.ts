/**
 * Internal Membership Employment interface with all fields including sensitive information.
 * Used for server-side operations and business logic.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (Privilege, AccessModifier) and local enums
 * - MATCHES Table Membership Employment.csv specification exactly (24 fields total)
 *
 * WARNING: This interface contains sensitive fields and should NEVER be exposed
 * directly to public APIs. Use MembershipEmploymentResponseDto for public responses.
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Complete internal representation for business logic
 * - Includes system fields for auditing and ownership
 * - Type-safe enum integration
 * - Supports employment data management with lookup relationships
 *
 * CRITICAL: membership_year is SYSTEM-DEFINED (from membership-settings), not user-provided
 */

import { Privilege, AccessModifier } from '../../../../common/enums';
import { EmploymentStatus } from '../enums/employment-status.enum';
import { WorkHours } from '../enums/work-hours.enum';
import { RoleDescription } from '../enums/role-descriptor.enum';
import { PracticeYears } from '../enums/practice-years.enum';
import { Funding } from '../enums/funding.enum';
import { Benefits } from '../enums/benefits.enum';
import { HourlyEarnings } from '../enums/hourly-earnings.enum';

export interface MembershipEmploymentInternal {
  // ========================================
  // SYSTEM FIELDS (internal use only - never expose publicly)
  // ========================================

  /** GUID - Primary key */
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
  // LOOKUP FIELDS (relationships to other tables)
  // ========================================

  /** Lookup GUID to Table_Account - Optional (XOR with affiliate) */
  osot_table_account?: string;

  /** Lookup GUID to Table_Account_Affiliate - Optional (XOR with account) */
  osot_table_account_affiliate?: string;

  // ========================================
  // BUSINESS FIELDS (from CSV)
  // ========================================

  /** Text field (4 chars) - CSV: Single line of text - Business required
   * CRITICAL: SYSTEM-DEFINED from membership-settings, NOT user-provided
   * Users CANNOT set or edit this field
   */
  osot_membership_year: string;

  /** Choice - Choices_Employment_Status - Business required - Single select */
  osot_employment_status: EmploymentStatus;

  /** Choice - Choices_Work_Hours - Business required - Multi-select */
  osot_work_hours: WorkHours[];

  /** Choice - Choices_Role_Descriptor - Business required - Single select */
  osot_role_descriptor: RoleDescription;

  /** Text field (255 chars) - Optional (required when osot_role_descriptor = OTHER) */
  osot_role_descriptor_other?: string;

  /** Choice - Choices_Practice_Years - Business required - Single select */
  osot_practice_years: PracticeYears;

  /** Choice - Choices_Funding - Business required - Multi-select */
  osot_position_funding: Funding[];

  /** Text field (255 chars) - Optional (required when osot_position_funding contains OTHER) */
  osot_position_funding_other?: string;

  /** Choice - Choices_Benefits - Business required - Multi-select */
  osot_employment_benefits: Benefits[];

  /** Text field (255 chars) - Optional (required when osot_employment_benefits contains OTHER) */
  osot_employment_benefits_other?: string;

  /** Choice - Choices_Hourly_Earnings - Business required - Single select */
  osot_earnings_employment: HourlyEarnings;

  /** Choice - Choices_Hourly_Earnings - Business required - Single select */
  osot_earnings_self_direct: HourlyEarnings;

  /** Choice - Choices_Hourly_Earnings - Business required - Single select */
  osot_earnings_self_indirect: HourlyEarnings;

  /** Text field (255 chars) - Business required */
  osot_union_name: string;

  /** Boolean - Yes/No field - Optional (default: No) */
  osot_another_employment?: boolean;

  // ========================================
  // ACCESS CONTROL FIELDS (optional - from CSV "Optional")
  // ========================================

  /** Choice - Choices_Privilege (default: Owner) */
  osot_privilege?: Privilege;

  /** Choice - Choices_Access_Modifiers (default: Private) */
  osot_access_modifiers?: AccessModifier;
}
