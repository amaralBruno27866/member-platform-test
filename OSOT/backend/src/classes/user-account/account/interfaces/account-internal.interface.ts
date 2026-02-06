/**
 * Internal Account interface with all fields including sensitive information.
 * Used for server-side operations and business logic.
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety
 * - MATCHES Table Account.csv specification exactly (17 fields total)
 *
 * WARNING: This interface contains sensitive fields (password) and should NEVER be exposed
 * directly to public APIs. Use AccountResponseDto for public responses.
 *
 * SECURITY CONSIDERATIONS:
 * - Complete internal representation for business logic
 * - Includes system fields for auditing and ownership
 * - Contains password field for authentication operations
 * - Type-safe enum integration
 * - Used for service layer operations and data transformations
 */

import {
  AccountGroup,
  AccountStatus,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

export interface AccountInternal {
  // ========================================
  // SYSTEM FIELDS (internal use only - never expose publicly)
  // ========================================

  /** GUID - Primary key */
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

  /** Organization GUID - Links account to parent organization (osot_table_organization) */
  organizationGuid?: string;

  // ========================================
  // PERSONAL INFORMATION
  // ========================================

  /** Last name of the account holder */
  osot_last_name: string;

  /** First name of the account holder */
  osot_first_name: string;

  /** Date of birth (Date only, no time component) */
  osot_date_of_birth: string;

  // ========================================
  // CONTACT INFORMATION (SENSITIVE)
  // ========================================

  /** Mobile phone number */
  osot_mobile_phone: string;

  /** Email address for the account */
  osot_email: string;

  /** Account password (encrypted/hashed) - NEVER expose in responses */
  osot_password: string;

  // ========================================
  // ACCOUNT CONFIGURATION
  // ========================================

  /** Account group classification */
  osot_account_group: AccountGroup;

  /** Account declaration acceptance */
  osot_account_declaration: boolean;

  // ========================================
  // ACCOUNT STATUS
  // ========================================

  /** Account status */
  osot_account_status: AccountStatus;

  /** Whether the account is an active member */
  osot_active_member: boolean;

  // ========================================
  // ACCESS CONTROL
  // ========================================

  /** Access modifier for account visibility */
  osot_access_modifiers: AccessModifier;

  /** Privilege level for the account */
  osot_privilege: Privilege;
}

/**
 * Account Internal interface for partial updates
 * All fields optional for flexible update operations
 */
export interface AccountInternalUpdate extends Partial<AccountInternal> {
  /** Primary key is required for updates */
  osot_table_accountid: string;
}

/**
 * Account Internal interface for creation
 * Excludes system-generated fields but includes all business fields
 */
export interface AccountInternalCreate
  extends Omit<
    AccountInternal,
    | 'osot_table_accountid'
    | 'osot_account_id'
    | 'createdon'
    | 'modifiedon'
    | 'ownerid'
  > {
  /** Optional owner override for admin operations */
  ownerid?: string;
}

/**
 * Account System Update interface for internal system operations
 * SECURITY: This interface is for internal system operations only
 * Used by orchestrators, business rules, and admin workflows
 * NOT exposed in public APIs
 */
export interface AccountSystemUpdate {
  /** Account status transition (business logic controlled) */
  osot_account_status?: AccountStatus;

  /** Active member flag (membership validation controlled) */
  osot_active_member?: boolean;

  /** Access modifier (admin/security controlled) */
  osot_access_modifiers?: AccessModifier;

  /** Privilege level (role management controlled) */
  osot_privilege?: Privilege;
}
