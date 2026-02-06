/**
 * Internal OT Education shape used inside the application and orchestrator.
 *
 * This interface includes internal identifiers (for example `osot_table_ot_educationid`)
 * and sensitive fields like `osot_privilege` that must NOT be exposed directly
 * to end users. Public responses should use the DTOs in `../dtos` and the mappers
 * in `../mappers` to strip/hide these internal fields.
 *
 * SECURITY WARNING: Never expose this interface or its fields in public APIs.
 *
 * Based on Table OT Education.csv schema with typed enums.
 */

import {
  CotoStatus,
  DegreeType,
  GraduationYear,
  OtUniversity,
  EducationCategory,
  Country,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

export interface OtEducationInternal {
  // === SYSTEM FIELDS ===
  /** Internal GUID used to relate rows in Dataverse */
  osot_table_ot_educationid?: string;

  /** Public business id (auto-generated: osot-oted-0000001) */
  osot_OT_Education_ID?: string;

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
  /** Business required - unique business identifier (max 20 chars) */
  osot_user_business_id?: string;

  /** Business required - COTO registration status */
  osot_coto_status?: CotoStatus;

  /** Business required - type of OT degree */
  osot_ot_degree_type?: DegreeType;

  /** Business required - university where degree was obtained */
  osot_ot_university?: OtUniversity;

  /** Business required - year of graduation */
  osot_ot_grad_year?: GraduationYear;

  /** Business required - country where education was obtained */
  osot_ot_country?: Country;

  // === OPTIONAL BUSINESS FIELDS ===
  /** Optional - COTO registration number (max 8 chars) */
  osot_coto_registration?: string;

  /** Optional - category of education */
  osot_education_category?: EducationCategory;

  /** Optional - additional education details or notes (max 100 chars) */
  osot_ot_other?: string;

  // === PRIVACY & PERMISSIONS ===
  /** Optional, default: PRIVATE - controls visibility */
  osot_access_modifiers?: AccessModifier;

  /** INTERNAL ONLY - determines Dataverse app access */
  osot_privilege?: Privilege;

  // === COMPUTED/DERIVED FIELDS (for internal business logic) ===
  /** Computed: whether this person has an active COTO registration */
  isActiveCotoMember?: boolean;

  /** Computed: whether COTO registration is required for current status */
  cotoRegistrationRequired?: boolean;

  /** Computed: whether this is Canadian education */
  isCanadianEducation?: boolean;

  /** Computed: whether this is international education requiring validation */
  requiresInternationalValidation?: boolean;

  /** Computed: education record completeness score (0-100) */
  completenessScore?: number;

  /** Computed: education level category */
  educationLevel?: 'masters' | 'doctoral' | 'bachelor' | 'other';

  /** Computed: years since graduation */
  yearsSinceGraduation?: number;

  /** Computed: whether this is a recent graduate (last 5 years) */
  isRecentGraduate?: boolean;

  // Any other fields returned by Dataverse or computed internally may be included here
  [key: string]: any;
}
