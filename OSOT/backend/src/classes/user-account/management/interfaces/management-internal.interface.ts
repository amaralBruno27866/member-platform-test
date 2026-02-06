import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';

/**
 * Internal management shape used inside the application and orchestrator.
 *
 * This interface includes internal identifiers (for example `osot_table_account_managementid`)
 * and sensitive fields like `osot_privilege` that must NOT be exposed directly
 * to end users. Public responses should use the DTOs in `../dtos` and the mappers
 * in `../mappers` to strip/hide these internal fields.
 *
 * SECURITY WARNING: Never expose this interface or its fields in public APIs.
 */
export interface ManagementInternal {
  // === SYSTEM FIELDS ===
  osot_table_account_managementid?: string; // internal GUID used to relate rows in Dataverse
  osot_account_management_id?: string; // public business id (auto-generated: osot-am-0000001)
  ownerid?: string; // system owner id (managed by Dataverse)
  createdon?: string; // system creation timestamp
  modifiedon?: string; // system modification timestamp

  // === ACCOUNT RELATIONSHIP ===
  osot_table_account?: string; // lookup to Account table (optional relationship)

  // === MANAGEMENT DATA ===
  osot_user_business_id?: string; // business required - unique business identifier

  // === MANAGEMENT FLAGS (Boolean fields) ===
  osot_life_member_retired?: boolean; // optional - life member retired status
  osot_shadowing?: boolean; // optional - shadowing availability
  osot_passed_away?: boolean; // optional - passed away status
  osot_vendor?: boolean; // optional - vendor status
  osot_advertising?: boolean; // optional - advertising permissions
  osot_recruitment?: boolean; // optional - recruitment permissions
  osot_driver_rehab?: boolean; // optional - driver rehabilitation services

  // === PRIVACY & PERMISSIONS ===
  osot_access_modifiers?: AccessModifier; // optional, default: PROTECTED - controls visibility
  osot_privilege?: Privilege; // INTERNAL ONLY - determines Dataverse app access (default: OWNER)

  // any other fields returned by Dataverse may be included here
  [key: string]: unknown;
}

/**
 * Usage notes:
 * - Services/repositories and the orchestrator may return/accept ManagementInternal.
 * - Controllers MUST use mappers to convert to public DTOs before returning responses.
 * - Boolean flags are stored as 0/1 in Dataverse but converted to true/false internally.
 * - Never expose osot_table_account_managementid, osot_privilege, or other sensitive internal fields.
 * - Management flags control business permissions and account lifecycle.
 * - Mutual exclusivity rules apply to certain flags (e.g., active vs passed_away).
 *
 * @example Boolean field handling:
 * ```ts
 * // Internal representation (for business logic)
 * const management: ManagementInternal = {
 *   osot_vendor: true,
 *   osot_recruitment: false,
 *   osot_passed_away: false,
 * };
 *
 * // Dataverse storage format
 * const dataverseFormat = {
 *   osot_vendor: 1, // true = 1
 *   osot_recruitment: 0, // false = 0
 *   osot_passed_away: 0, // false = 0
 * };
 * ```
 *
 * @example Business rule validation:
 * ```ts
 * // Check mutual exclusivity
 * if (management.osot_vendor && management.osot_recruitment) {
 *   throw new Error('Vendors cannot have recruitment permissions');
 * }
 *
 * // Check lifecycle rules
 * if (management.osot_passed_away && management.osot_shadowing) {
 *   throw new Error('Deceased members cannot offer shadowing');
 * }
 * ```
 */

/**
 * Utility type for creating new Management records (excluding system fields)
 */
export type CreateManagementInternal = Omit<
  ManagementInternal,
  | 'osot_table_account_managementid'
  | 'osot_account_management_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
>;

/**
 * Utility type for updating Management records (excluding immutable fields)
 */
export type UpdateManagementInternal = Omit<
  ManagementInternal,
  | 'osot_table_account_managementid'
  | 'osot_account_management_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
  | 'osot_user_business_id' // Business ID is immutable after creation
>;

/**
 * Utility type for public-safe Management (removing internal access control fields)
 */
export type PublicManagement = Omit<
  ManagementInternal,
  'osot_table_account_managementid' | 'osot_privilege' | 'ownerid'
>;
