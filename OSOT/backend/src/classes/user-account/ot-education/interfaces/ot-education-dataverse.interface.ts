/**
 * Raw OT Education shape returned directly from Dataverse API.
 *
 * This interface represents the exact structure of data as it comes from
 * Dataverse, including all system fields, choice values as numbers,
 * and raw field names. Used for type safety when interacting with
 * the Dataverse API before any transformations are applied.
 *
 * Field naming follows Dataverse conventions (snake_case with osot_ prefix).
 * Choice fields are represented as numbers (0, 1, 2, etc.) as returned by Dataverse.
 *
 * Based on Table OT Education.csv schema exactly.
 */
export interface DataverseOtEducation {
  // === SYSTEM FIELDS ===
  /** Unique identifier for entity instances (Primary Key) */
  osot_table_ot_educationid?: string;

  /** Auto-generated business ID (osot-oted-0000001 format) */
  osot_OT_Education_ID?: string;

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

  /** COTO Status - returned as number from Dataverse (business required) */
  osot_coto_status?: number;

  /** OT Degree Type - returned as number from Dataverse (business required) */
  osot_ot_degree_type?: number;

  /** OT University - returned as number from Dataverse (business required) */
  osot_ot_university?: number;

  /** OT Graduation Year - returned as number from Dataverse (business required) */
  osot_ot_grad_year?: number;

  /** OT Country - returned as number from Dataverse (business required) */
  osot_ot_country?: number;

  // === OPTIONAL FIELDS ===
  /** COTO Registration number (optional, max 8 chars) */
  osot_coto_registration?: string;

  /** Education Category - returned as number from Dataverse (optional) */
  osot_education_category?: number;

  /** Additional education details (optional, max 100 chars) */
  osot_ot_other?: string;

  // === PRIVACY & ACCESS FIELDS ===
  /** Access Modifiers - returned as number from Dataverse (optional, default: Private) */
  osot_access_modifiers?: number;

  /** Privilege - returned as number from Dataverse (optional, default: Owner) */
  osot_privilege?: number;

  // === DATAVERSE METADATA ===
  /** Entity version number for optimistic concurrency */
  '@odata.etag'?: string;

  /** OData type identifier */
  '@odata.type'?: string;

  /** OData context URL */
  '@odata.context'?: string;

  // === RELATIONSHIP METADATA ===
  /** Account relationship navigation property */
  'osot_table_account@OData.Community.Display.V1.FormattedValue'?: string;
  'osot_table_account@Microsoft.Dynamics.CRM.lookuplogicalname'?: string;

  // === CHOICE FIELD FORMATTED VALUES ===
  /** COTO Status formatted display value */
  'osot_coto_status@OData.Community.Display.V1.FormattedValue'?: string;

  /** OT Degree Type formatted display value */
  'osot_ot_degree_type@OData.Community.Display.V1.FormattedValue'?: string;

  /** OT University formatted display value */
  'osot_ot_university@OData.Community.Display.V1.FormattedValue'?: string;

  /** OT Graduation Year formatted display value */
  'osot_ot_grad_year@OData.Community.Display.V1.FormattedValue'?: string;

  /** Education Category formatted display value */
  'osot_education_category@OData.Community.Display.V1.FormattedValue'?: string;

  /** OT Country formatted display value */
  'osot_ot_country@OData.Community.Display.V1.FormattedValue'?: string;

  /** Access Modifiers formatted display value */
  'osot_access_modifiers@OData.Community.Display.V1.FormattedValue'?: string;

  /** Privilege formatted display value */
  'osot_privilege@OData.Community.Display.V1.FormattedValue'?: string;

  // === CALCULATED FIELDS (if any) ===
  /** Calculated field for COTO registration status */
  osot_has_coto_registration?: boolean;

  /** Calculated field for education completeness */
  osot_education_completeness?: number;

  // Any other fields returned by Dataverse may be included here
  [key: string]: any;
}
