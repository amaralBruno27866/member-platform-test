/**
 * Interface representing the raw Dataverse response for Account entity.
 * Maps directly to osot_table_account table structure.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety
 * - Based on Table Account.csv specification exactly (17 fields total)
 * - Used internally for type safety when working with raw Dataverse data
 *
 * MATCHES Table Account.csv specification exactly.
 */

import {
  AccountGroup,
  AccountStatus,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

export interface AccountDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /** Primary key GUID */
  osot_table_accountid?: string;

  /** Autonumber Business ID (osot-0000001) */
  osot_account_id?: string;

  /** ISO datetime string */
  createdon?: string;

  /** ISO datetime string */
  modifiedon?: string;

  /** Owner GUID */
  ownerid?: string;

  // ========================================
  // ORGANIZATION CONTEXT (Multi-Tenant)
  // ========================================

  /** Organization lookup GUID - Dataverse stores lookup as _fieldname_value (note: Table_ is part of field name) */
  _osot_table_organization_value?: string;

  // ========================================
  // PERSONAL INFORMATION (Business Required)
  // ========================================

  /** Last name of the account holder */
  osot_last_name?: string;

  /** First name of the account holder */
  osot_first_name?: string;

  /** Date of birth (Date only, no time component) */
  osot_date_of_birth?: string;

  // ========================================
  // CONTACT INFORMATION (Business Required)
  // ========================================

  /** Mobile phone number */
  osot_mobile_phone?: string;

  /** Email address for the account */
  osot_email?: string;

  /** Account password (encrypted/hashed) */
  osot_password?: string;

  // ========================================
  // ACCOUNT CONFIGURATION (Business Required)
  // ========================================

  /** Account group classification */
  osot_account_group?: AccountGroup;

  /** Account declaration acceptance */
  osot_account_declaration?: boolean;

  // ========================================
  // ACCOUNT STATUS (Optional with defaults)
  // ========================================

  /** Account status */
  osot_account_status?: AccountStatus;

  /** Whether the account is an active member */
  osot_active_member?: boolean;

  // ========================================
  // ACCESS CONTROL (Optional with defaults)
  // ========================================

  /** Access modifier for account visibility */
  osot_access_modifiers?: AccessModifier;

  /** Privilege level for the account */
  osot_privilege?: Privilege;
}
