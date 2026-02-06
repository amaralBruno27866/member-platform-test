/**
 * Internal OTA Education shape used inside the application and orchestrator.
 *
 * This interface includes internal identifiers (for example `osot_table_ota_educationid`)
 * and sensitive fields like `osot_privilege` that must NOT be exposed directly
 * to end users. Public responses should use the DTOs in `../dtos` and the mappers
 * in `../mappers` to strip/hide these internal fields.
 *
 * SECURITY WARNING: Never expose this interface or its fields in public APIs.
 *
 * Based on Table OTA Education.csv schema with typed enums.
 */

import {
  DegreeType,
  GraduationYear,
  OtaCollege,
  EducationCategory,
  Country,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

export interface OtaEducationInternal {
  // === SYSTEM FIELDS ===
  /** Internal GUID used to relate rows in Dataverse */
  osot_table_ota_educationid?: string;

  /** Public business id (auto-generated: osot-ota-ed-0000001) */
  osot_ota_education_id?: string;

  /** System owner id (managed by Dataverse) */
  ownerid?: string;

  /** System creation timestamp */
  createdon?: string;

  /** System modification timestamp */
  modifiedon?: string;

  // === ACCOUNT RELATIONSHIP ===
  /** Lookup to Account table (optional relationship) */
  // osot_table_account?: string; // DEPRECATED: Use @odata.bind instead

  // === BUSINESS REQUIRED FIELDS ===
  /** User business identifier (business required, max 20 chars) */
  osot_user_business_id?: string;

  /** Work declaration (business required, explicit true/false) */
  osot_work_declaration?: boolean;

  // === CORE EDUCATION FIELDS (Typed Enums) ===
  /** OTA Degree Type (typed enum) */
  osot_ota_degree_type?: DegreeType;

  /** OTA College (typed enum) */
  osot_ota_college?: OtaCollege;

  /** OTA Graduation Year (typed enum) */
  osot_ota_grad_year?: GraduationYear;

  /** Education Category (typed enum) */
  osot_education_category?: EducationCategory;

  /** OTA Country (typed enum) */
  osot_ota_country?: Country;

  /** OTA Other information (optional, max 100 chars) */
  osot_ota_other?: string;

  // === ACCESS CONTROL FIELDS (INTERNAL ONLY) ===
  /** Access modifiers (INTERNAL - not for public APIs) */
  osot_access_modifiers?: AccessModifier;

  /** Privilege level (INTERNAL - not for public APIs) */
  osot_privilege?: Privilege;

  // === METADATA ===
  /** ETag for optimistic concurrency */
  etag?: string;
}

/**
 * Type guard to check if an object is a valid OtaEducationInternal
 */
export function isOtaEducationInternal(obj: any): obj is OtaEducationInternal {
  return typeof obj === 'object' && obj !== null;
}

/**
 * Utility type for creating new OTA Education records (excluding system fields)
 */
export type CreateOtaEducationInternal = Omit<
  OtaEducationInternal,
  | 'osot_table_ota_educationid'
  | 'osot_ota_education_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
  | 'etag'
>;

/**
 * Utility type for updating OTA Education records (excluding immutable fields)
 */
export type UpdateOtaEducationInternal = Omit<
  OtaEducationInternal,
  | 'osot_table_ota_educationid'
  | 'osot_ota_education_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
  | 'osot_user_business_id' // Business ID is immutable after creation
  | 'etag'
>;

/**
 * Utility type for public-safe OTA Education (removing internal access control fields)
 */
export type PublicOtaEducation = Omit<
  OtaEducationInternal,
  | 'osot_table_ota_educationid' // Internal GUID
  | 'ownerid' // System field
  | 'osot_access_modifiers' // Internal access control
  | 'osot_privilege' // Internal privilege
  | 'etag' // Internal metadata
>;
