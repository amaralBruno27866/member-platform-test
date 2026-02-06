/**
 * Raw OTA Education shape returned directly from Dataverse API.
 *
 * This interface represents the exact structure of data as it comes from
 * Dataverse, including all system fields, choice values as numbers,
 * and raw field names. Used for type safety when interacting with
 * the Dataverse API before any transformations are applied.
 *
 * Field naming follows Dataverse conventions (snake_case with osot_ prefix).
 * Choice fields are represented as numbers (0, 1, 2, etc.) as returned by Dataverse.
 *
 * Based on Table OTA Education.csv schema exactly.
 */
export interface DataverseOtaEducation {
  // === SYSTEM FIELDS ===
  /** Unique identifier for entity instances (Primary Key) */
  osot_table_ota_educationid?: string;

  /** Auto-generated business ID (osot-ota-ed-0000001 format) */
  osot_ota_education_id?: string;

  /** Date and time when the record was created */
  createdon?: string;

  /** Date and time when the record was modified */
  modifiedon?: string;

  /** Owner Id (system required) */
  ownerid?: string;

  // === ACCOUNT RELATIONSHIP ===
  /** Lookup to Account table (optional relationship) */
  osot_table_account?: string;

  // === BUSINESS REQUIRED FIELDS ===
  /** User business identifier (business required, max 20 chars) */
  osot_user_business_id?: string;

  /** Work declaration (business required, Yes/No - returned as boolean) */
  osot_work_declaration?: boolean;

  // === CORE EDUCATION FIELDS ===
  /** OTA Degree Type - returned as number from Dataverse (optional) */
  osot_ota_degree_type?: number;

  /** OTA College - returned as number from Dataverse (optional) */
  osot_ota_college?: number;

  /** OTA Graduation Year - returned as number from Dataverse (optional) */
  osot_ota_grad_year?: number;

  /** Education Category - returned as number from Dataverse (optional) */
  osot_education_category?: number;

  /** OTA Country - returned as number from Dataverse (optional) */
  osot_ota_country?: number;

  /** OTA Other information (optional, max 100 chars) */
  osot_ota_other?: string;

  // === ACCESS CONTROL FIELDS ===
  /** Access modifiers - returned as number from Dataverse (optional) */
  osot_access_modifiers?: number;

  /** Privilege level - returned as number from Dataverse (optional) */
  osot_privilege?: number;

  // === ADDITIONAL FIELDS FOR EXPANDED DATA ===
  /** Expanded account information when using $expand */
  osot_table_account_expanded?: {
    osot_table_accountid: string;
    osot_account_id: string;
    // Additional account fields can be added as needed
  };

  /** @odata.etag for optimistic concurrency */
  '@odata.etag'?: string;
}

/**
 * Type guard to check if an object is a valid DataverseOtaEducation
 */
export function isDataverseOtaEducation(
  obj: any,
): obj is DataverseOtaEducation {
  return typeof obj === 'object' && obj !== null;
}

/**
 * Utility type for creating new OTA Education records (excluding system fields)
 */
export type CreateDataverseOtaEducation = Omit<
  DataverseOtaEducation,
  | 'osot_table_ota_educationid'
  | 'osot_ota_education_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
  | '@odata.etag'
>;

/**
 * Utility type for updating OTA Education records (excluding immutable fields)
 */
export type UpdateDataverseOtaEducation = Omit<
  DataverseOtaEducation,
  | 'osot_table_ota_educationid'
  | 'osot_ota_education_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
  | 'osot_user_business_id' // Business ID is immutable after creation
  | '@odata.etag'
>;
