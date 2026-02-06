/**
 * Raw management shape returned directly from Dataverse API.
 *
 * This interface represents the exact structure of data as it comes from
 * Dataverse, including all system fields, choice values as numbers,
 * and raw field names. Used for type safety when interacting with
 * the Dataverse API before any transformations are applied.
 *
 * Field naming follows Dataverse conventions (snake_case with osot_ prefix).
 * Choice fields are represented as numbers (0, 1, 2, etc.) as returned by Dataverse.
 * Yes/No fields are returned as boolean values (true/false).
 */
export interface DataverseManagement {
  // === SYSTEM FIELDS ===
  /** Unique identifier for entity instances (Primary Key) */
  osot_table_account_managementid?: string;

  /** Auto-generated management ID (osot-am-0000001 format) */
  osot_account_management_id?: string;

  /** Date and time when the record was created */
  createdon?: string;

  /** Date and time when the record was modified */
  modifiedon?: string;

  /** Owner Id (system required) */
  ownerid?: string;

  // === ACCOUNT RELATIONSHIP ===
  /** Lookup to Account table (optional relationship) */
  osot_table_account?: string;

  // === MANAGEMENT INFORMATION ===
  /** User business identifier (business required) */
  osot_user_business_id?: string;

  // === MANAGEMENT FLAGS (Yes/No Fields as Booleans) ===
  /** Life member retired status - returned as boolean from Dataverse */
  osot_life_member_retired?: boolean;

  /** Shadowing availability - returned as boolean from Dataverse */
  osot_shadowing?: boolean;

  /** Passed away status - returned as boolean from Dataverse */
  osot_passed_away?: boolean;

  /** Vendor status - returned as boolean from Dataverse */
  osot_vendor?: boolean;

  /** Advertising permissions - returned as boolean from Dataverse */
  osot_advertising?: boolean;

  /** Recruitment permissions - returned as boolean from Dataverse */
  osot_recruitment?: boolean;

  /** Driver rehabilitation services - returned as boolean from Dataverse */
  osot_driver_rehab?: boolean;

  // === PRIVACY & PERMISSIONS (Choice Fields as Numbers) ===
  /** Access visibility control - returned as number from Dataverse (default: Protected = 2) */
  osot_access_modifiers?: number;

  /** System privilege level - returned as number from Dataverse (default: Owner = 1) */
  osot_privilege?: number;

  // === EXPANDED LOOKUPS (when using $expand) ===
  /** Expanded Account data (when using $expand=osot_Table_Account) */
  osot_Table_Account?: {
    osot_account_id?: string;
    osot_first_name?: string;
    osot_last_name?: string;
    osot_email?: string;
    [key: string]: unknown;
  };

  // any other fields returned by Dataverse may be included here
  [key: string]: unknown;
}

/**
 * Usage notes:
 * - This interface represents raw Dataverse API responses before any processing.
 * - Choice fields are numbers (1 = Protected, 2 = Private, 3 = Public for Access Modifiers).
 * - Yes/No fields are boolean values (true/false).
 * - Use mappers to convert DataverseManagement to ManagementInternal for business use.
 * - System fields (osot_table_account_managementid, ownerid) should never be exposed to end users.
 *
 * @example Raw Dataverse response:
 * ```ts
 * const rawResponse: DataverseManagement = {
 *   osot_table_account_managementid: "12345678-1234-1234-1234-123456789abc",
 *   osot_account_management_id: "osot-am-0000001",
 *   osot_user_business_id: "osot_0000123",
 *   osot_life_member_retired: false, // No
 *   osot_shadowing: true, // Yes
 *   osot_vendor: false, // No
 *   osot_access_modifiers: 2, // Protected
 *   osot_privilege: 1, // Owner
 * };
 * ```
 */
