/**
 * Raw identity shape returned directly from Dataverse API.
 *
 * This interface represents the exact structure of data as it comes from
 * Dataverse, including all system fields, choice values as numbers,
 * and raw field names. Used for type safety when interacting with
 * the Dataverse API before any transformations are applied.
 *
 * Field naming follows Dataverse conventions (snake_case with osot_ prefix).
 * Choice fields are represented as numbers (0, 1, 2, etc.) as returned by Dataverse.
 * Multiple choice fields (like Language) are returned as comma-separated strings.
 */
export interface DataverseIdentity {
  // === SYSTEM FIELDS ===
  /** Unique identifier for entity instances (Primary Key) */
  osot_table_identityid?: string;

  /** Auto-generated business ID (osot-id-0000001 format) */
  osot_identity_id?: string;

  /** Date and time when the record was created */
  createdon?: string;

  /** Date and time when the record was modified */
  modifiedon?: string;

  /** Owner Id (system required) */
  ownerid?: string;

  // === ACCOUNT RELATIONSHIP ===
  /** Lookup to Account table (required relationship) */
  osot_table_account?: string;

  // === IDENTITY INFORMATION ===
  /** User business identifier (business required) */
  osot_user_business_id?: string;

  /** Preferred/chosen name (optional) */
  osot_chosen_name?: string;

  // === PERSONAL CHARACTERISTICS (Choice Fields as Numbers/Strings) ===
  /** Languages spoken - returned as comma-separated string from Dataverse (business required) */
  osot_language?: string;

  /** Other language not in predefined list (optional) */
  osot_other_language?: string;

  /** Gender identity - returned as number from Dataverse (optional) */
  osot_gender?: number;

  /** Racial identity - returned as number from Dataverse (optional) */
  osot_race?: number;

  // === CULTURAL IDENTITY (Yes/No Fields as Numbers) ===
  /** Indigenous identity - returned as 0 (No) or 1 (Yes) from Dataverse */
  osot_indigenous?: number;

  /** Specific Indigenous identity - returned as number from Dataverse (optional) */
  osot_indigenous_detail?: number;

  /** Other Indigenous identity description (optional text) */
  osot_indigenous_detail_other?: string;

  // === ACCESSIBILITY (Yes/No Field as Number) ===
  /** Disability status - returned as 0 (No) or 1 (Yes) from Dataverse */
  osot_disability?: number;

  // === PRIVACY & PERMISSIONS (Choice Fields as Numbers) ===
  /** Access visibility control - returned as number from Dataverse */
  osot_access_modifiers?: number;

  /** System privilege level - returned as number from Dataverse */
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
 * - Choice fields are numbers (0, 1, 2, etc.) and need enum mapping for business logic.
 * - Multiple choice fields like osot_language are comma-separated strings ("13,18").
 * - Yes/No fields are numbers (0 = No, 1 = Yes) and need boolean conversion.
 * - Use mappers to convert DataverseIdentity to IdentityInternal for business use.
 * - System fields (osot_table_identityid, ownerid) should never be exposed to end users.
 *
 * @example Raw Dataverse response:
 * ```ts
 * const rawResponse: DataverseIdentity = {
 *   osot_table_identityid: "12345678-1234-1234-1234-123456789abc",
 *   osot_identity_id: "osot-id-0000001",
 *   osot_language: "13,18", // English + French as comma-separated string
 *   osot_gender: 1, // Male (enum value)
 *   osot_indigenous: 0, // No (0 = false)
 *   osot_disability: 1, // Yes (1 = true)
 *   osot_access_modifiers: 3, // Private
 * };
 * ```
 */
