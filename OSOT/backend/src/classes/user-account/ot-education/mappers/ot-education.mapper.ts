/**
 * OT Education Mapper (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized enums for type safety and validation
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential OT education data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions
 * - Proper data normalization and validation
 */

/*
 * ESLint is disabled for no-unsafe-* rules on enum display name functions below.
 * These functions are type-safe (return string) but ESLint cannot infer types correctly
 * due to re-exports through common/enums/index.ts.
 */

import {
  CotoStatus,
  DegreeType,
  OtUniversity,
  GraduationYear,
  EducationCategory,
  Country,
  AccessModifier,
  Privilege,
  getCotoStatusDisplayName,
  getDegreeTypeDisplayName,
  getOtUniversityDisplayName,
  getGraduationYearDisplayName,
  getEducationCategoryDisplayName,
  getCountryDisplayName,
  getAccessModifierDisplayName,
  getPrivilegeDisplayName,
} from '../../../../common/enums';
import { UpdateOtEducationDto } from '../dtos/update-ot-education.dto';
import { OtEducationResponseDto } from '../dtos/ot-education-response.dto';
import { OtEducationPublicDto } from '../dtos/ot-education-public.dto';
import { OtEducationInternal } from '../interfaces/ot-education-internal.interface';
import { DataverseOtEducation } from '../interfaces/ot-education-dataverse.interface';

// Export the OtEducationResponseDto type for external use
export { OtEducationResponseDto } from '../dtos/ot-education-response.dto';
export { OtEducationPublicDto } from '../dtos/ot-education-public.dto';

/**
 * Helper functions for enum conversions and data parsing
 */

/**
 * Convert string/number to CotoStatus enum
 */
function parseCotoStatus(value: unknown): CotoStatus | undefined {
  if (typeof value === 'number') {
    return Object.values(CotoStatus).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(CotoStatus).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to DegreeType enum
 */
function parseDegreeType(value: unknown): DegreeType | undefined {
  if (typeof value === 'number') {
    return Object.values(DegreeType).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(DegreeType).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to OtUniversity enum
 */
function parseOtUniversity(value: unknown): OtUniversity | undefined {
  if (typeof value === 'number') {
    return Object.values(OtUniversity).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(OtUniversity).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to GraduationYear enum
 */
function parseGraduationYear(value: unknown): GraduationYear | undefined {
  if (typeof value === 'number') {
    return Object.values(GraduationYear).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(GraduationYear).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to EducationCategory enum
 */
function parseEducationCategory(value: unknown): EducationCategory | undefined {
  if (typeof value === 'number') {
    return Object.values(EducationCategory).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (
      !isNaN(numValue) &&
      Object.values(EducationCategory).includes(numValue)
    ) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to Country enum
 */
function parseCountry(value: unknown): Country | undefined {
  if (typeof value === 'number') {
    return Object.values(Country).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(Country).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to AccessModifier enum
 */
function parseAccessModifier(value: unknown): AccessModifier | undefined {
  if (typeof value === 'number') {
    return Object.values(AccessModifier).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(AccessModifier).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to Privilege enum
 */
function parsePrivilege(value: unknown): Privilege | undefined {
  if (typeof value === 'number') {
    return Object.values(Privilege).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(Privilege).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Normalize and validate COTO registration number
 * Format: 8 digits (12345678)
 */
const normalizeCotoRegistration = (registration: string): string => {
  return registration?.replace(/\D/g, '') || '';
};

// Type-safe union for mapper input that supports both DTO types
type CreateOtEducationMapperInput = {
  'osot_Table_Account@odata.bind'?: string;
  osot_user_business_id?: string; // Business ID injected by orchestrator
  osot_coto_status: CotoStatus;
  osot_ot_degree_type: DegreeType;
  osot_ot_university: OtUniversity;
  osot_ot_grad_year: GraduationYear;
  osot_ot_country: Country;
  osot_coto_registration?: string;
  osot_ot_other?: string;
  osot_education_category?: EducationCategory; // Optional - present when auto-determined by service
};

/**
 * Normalize user business ID
 * Trims whitespace and ensures proper format
 */
function normalizeUserBusinessId(businessId: string): string | undefined {
  if (!businessId || typeof businessId !== 'string') return undefined;

  const trimmed = businessId.trim();
  if (trimmed.length === 0) return undefined;

  // Ensure max 20 characters as per table schema
  return trimmed.length <= 20 ? trimmed : trimmed.slice(0, 20);
}

/**
 * Validate date string format from Dataverse
 */
function parseDataverseDate(
  dateString: string | undefined,
): string | undefined {
  if (!dateString) return undefined;

  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date.toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Core Mapping Functions
 */

/**
 * Map raw Dataverse response to internal OT Education representation
 * Handles enum conversions and data normalization
 */
export function mapDataverseToInternal(
  dataverse: DataverseOtEducation,
): OtEducationInternal {
  return {
    // System fields
    osot_table_ot_educationid: dataverse.osot_table_ot_educationid,
    osot_OT_Education_ID: dataverse.osot_OT_Education_ID,
    ownerid: dataverse.ownerid,
    createdon: parseDataverseDate(dataverse.createdon),
    modifiedon: parseDataverseDate(dataverse.modifiedon),

    // Account relationship - removed, handled via @odata.bind

    // Business required fields
    osot_user_business_id: normalizeUserBusinessId(
      dataverse.osot_user_business_id || '',
    ),
    osot_coto_status: parseCotoStatus(dataverse.osot_coto_status),
    osot_ot_degree_type: parseDegreeType(dataverse.osot_ot_degree_type),
    osot_ot_university: parseOtUniversity(dataverse.osot_ot_university),
    osot_ot_grad_year: parseGraduationYear(dataverse.osot_ot_grad_year),
    osot_ot_country: parseCountry(dataverse.osot_ot_country),

    // Optional business fields
    osot_coto_registration: normalizeCotoRegistration(
      dataverse.osot_coto_registration || '',
    ),
    osot_education_category: parseEducationCategory(
      dataverse.osot_education_category,
    ),
    osot_ot_other: dataverse.osot_ot_other || undefined,

    // Privacy and access control (internal only)
    osot_access_modifiers: parseAccessModifier(dataverse.osot_access_modifiers),
    osot_privilege: parsePrivilege(dataverse.osot_privilege),
  };
}

/**
 * Map internal representation to public response DTO
 * Excludes sensitive fields and system internals
 */
export function mapInternalToResponse(
  internal: OtEducationInternal,
): OtEducationResponseDto {
  return {
    // System identifiers - converted to logical names
    osot_ot_education_id: internal.osot_OT_Education_ID || '',
    osot_table_ot_educationid: internal.osot_table_ot_educationid || '',
    ownerid: internal.ownerid || '',
    createdon: internal.createdon || '',
    modifiedon: internal.modifiedon || '',

    // Business data - convert enums to human-readable labels
    osot_user_business_id: internal.osot_user_business_id || '',
    osot_coto_status: internal.osot_coto_status
      ? getCotoStatusDisplayName(internal.osot_coto_status)
      : '',
    osot_ot_degree_type: internal.osot_ot_degree_type
      ? getDegreeTypeDisplayName(internal.osot_ot_degree_type)
      : '',
    osot_ot_university: internal.osot_ot_university
      ? getOtUniversityDisplayName(internal.osot_ot_university)
      : '',
    osot_ot_grad_year: internal.osot_ot_grad_year
      ? getGraduationYearDisplayName(internal.osot_ot_grad_year)
      : '',
    osot_ot_country: internal.osot_ot_country
      ? getCountryDisplayName(internal.osot_ot_country)
      : '',

    // Optional fields
    osot_coto_registration: internal.osot_coto_registration,
    osot_education_category:
      internal.osot_education_category !== undefined
        ? getEducationCategoryDisplayName(internal.osot_education_category)
        : undefined,
    osot_ot_other: internal.osot_ot_other,
    osot_access_modifiers: internal.osot_access_modifiers
      ? getAccessModifierDisplayName(internal.osot_access_modifiers)
      : undefined,
    osot_privilege: internal.osot_privilege
      ? getPrivilegeDisplayName(internal.osot_privilege)
      : undefined,

    // Account relationship - removed, handled via @odata.bind
  };
}

/**
 * Map create DTO to internal representation for Dataverse
 * Prepares data for insertion with proper enum conversions
 * Works with both CreateOtEducationDto and CreateOtEducationForAccountDto
 */
export function mapCreateDtoToInternal(
  dto: CreateOtEducationMapperInput,
): Partial<OtEducationInternal> {
  const result: Partial<OtEducationInternal> = {
    // Business required fields (inherited from OtEducationBasicDto)
    // Include osot_user_business_id if provided (injected by orchestrator)
    osot_user_business_id: dto.osot_user_business_id,
    osot_coto_status: dto.osot_coto_status,
    osot_ot_degree_type: dto.osot_ot_degree_type,
    osot_ot_university: dto.osot_ot_university,
    osot_ot_grad_year: dto.osot_ot_grad_year,
    osot_ot_country: dto.osot_ot_country,

    // Optional business fields
    osot_coto_registration: dto.osot_coto_registration
      ? normalizeCotoRegistration(dto.osot_coto_registration)
      : undefined,
    osot_education_category: dto.osot_education_category,
    osot_ot_other: dto.osot_ot_other,

    // Note: System fields like osot_table_ot_educationid, createdon, modifiedon, ownerid are managed by Dataverse
    // Note: Privacy fields (osot_access_modifiers, osot_privilege) use system defaults
  };

  // Handle OData binding for account relationship - keep as-is, don't extract GUID
  const odataBinding = dto['osot_Table_Account@odata.bind'];
  if (
    odataBinding &&
    typeof odataBinding === 'string' &&
    odataBinding.trim() !== ''
  ) {
    // Keep OData binding as-is for Dataverse navigation property
    // Do NOT extract GUID to avoid duplicate field errors
    Object.assign(result, {
      'osot_Table_Account@odata.bind': odataBinding,
    });
  }

  return result;
}

/**
 * Map update DTO to partial internal representation
 * Only includes fields that are being updated
 */
export function mapUpdateDtoToInternal(
  dto: UpdateOtEducationDto,
): Partial<OtEducationInternal> {
  const result: Partial<OtEducationInternal> = {};

  // Only map fields that are actually provided in the update
  // Note: osot_user_business_id is system-controlled and cannot be updated by users

  if (dto.osot_coto_status !== undefined) {
    result.osot_coto_status = dto.osot_coto_status;
  }

  if (dto.osot_ot_degree_type !== undefined) {
    result.osot_ot_degree_type = dto.osot_ot_degree_type;
  }

  if (dto.osot_ot_university !== undefined) {
    result.osot_ot_university = dto.osot_ot_university;
  }

  if (dto.osot_ot_country !== undefined) {
    result.osot_ot_country = dto.osot_ot_country;
  }

  if (dto.osot_coto_registration !== undefined) {
    result.osot_coto_registration = dto.osot_coto_registration
      ? normalizeCotoRegistration(dto.osot_coto_registration)
      : undefined;
  }

  if (dto.osot_ot_other !== undefined) {
    result.osot_ot_other = dto.osot_ot_other;
  }

  // Note: Privacy fields (osot_access_modifiers, osot_privilege) are system-controlled
  // and cannot be updated directly by users

  return result;
}

/**
 * Map internal representation to Dataverse format for API calls
 * Converts enums back to numbers and formats data for Dataverse
 */
export function mapInternalToDataverse(
  internal: OtEducationInternal,
): DataverseOtEducation {
  return {
    // System fields
    osot_table_ot_educationid: internal.osot_table_ot_educationid,
    osot_OT_Education_ID: internal.osot_OT_Education_ID,
    ownerid: internal.ownerid,
    createdon: internal.createdon,
    modifiedon: internal.modifiedon,

    // Account relationship - removed, handled via @odata.bind

    // Business fields (convert enums to numbers)
    osot_user_business_id: internal.osot_user_business_id,
    osot_coto_status: internal.osot_coto_status,
    osot_ot_degree_type: internal.osot_ot_degree_type,
    osot_ot_university: internal.osot_ot_university,
    osot_ot_grad_year: internal.osot_ot_grad_year,
    osot_ot_country: internal.osot_ot_country,

    // Optional fields
    osot_coto_registration: internal.osot_coto_registration,
    osot_ot_other: internal.osot_ot_other,
    osot_education_category: internal.osot_education_category,
    osot_education_category_text:
      (internal.osot_education_category_text as string) || undefined,

    // Privacy and access control
    osot_access_modifiers: internal.osot_access_modifiers,
    osot_privilege: internal.osot_privilege,
  };
}

/**
 * Utility Functions for Complex Mappings
 */

/**
 * Validate COTO registration format and status alignment
 * Business rule: If status is REGISTERED, registration number is required
 */
export function validateCotoAlignment(
  cotoStatus: CotoStatus,
  cotoRegistration?: string,
): { isValid: boolean; error?: string } {
  if (cotoStatus === CotoStatus.GENERAL && !cotoRegistration) {
    return {
      isValid: false,
      error: 'COTO registration number is required when status is REGISTERED',
    };
  }

  if (cotoRegistration && !normalizeCotoRegistration(cotoRegistration)) {
    return {
      isValid: false,
      error: 'COTO registration must be exactly 8 digits',
    };
  }

  return { isValid: true };
}

/**
 * Validate university-country alignment
 * Business rule: Canadian universities should be paired with Canada
 */
export function validateUniversityCountryAlignment(
  university: OtUniversity,
  country: Country,
): { isValid: boolean; error?: string } {
  const canadianUniversities = [
    OtUniversity.MCMASTER_UNIVERSITY,
    OtUniversity.QUEENS_UNIVERSITY,
    OtUniversity.UNIVERSITY_OF_OTTAWA,
    OtUniversity.UNIVERSITY_OF_TORONTO,
    OtUniversity.WESTERN_UNIVERSITY,
  ];

  if (canadianUniversities.includes(university) && country !== Country.CANADA) {
    return {
      isValid: false,
      error: `${university} is a Canadian university and should be paired with Canada`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate education completeness score
 * Returns a percentage (0-100) of how complete the education record is
 */
export function calculateCompletenessScore(
  internal: OtEducationInternal,
): number {
  const fields = [
    internal.osot_user_business_id,
    internal.osot_coto_status,
    internal.osot_ot_degree_type,
    internal.osot_ot_university,
    internal.osot_ot_grad_year,
    internal.osot_ot_country,
    internal.osot_coto_registration,
    internal.osot_education_category,
  ];

  const filledFields = fields.filter(
    (field) => field !== undefined && field !== null && field !== '',
  ).length;
  return Math.round((filledFields / fields.length) * 100);
}

/**
 * Extract searchable text from OT education record
 * Used for full-text search and indexing
 */
export function extractSearchableText(internal: OtEducationInternal): string {
  const searchableFields = [
    internal.osot_user_business_id,
    internal.osot_OT_Education_ID,
    internal.osot_coto_registration,
    internal.osot_education_category_text,
  ];

  return searchableFields
    .filter((field) => field && typeof field === 'string')
    .join(' ')
    .toLowerCase();
}

/**
 * Map OtEducationInternal to OtEducationPublicDto
 * Used when returning filtered OT education data for public API endpoints
 * Excludes system fields (GUIDs, timestamps, relationships, access control)
 *
 * PUBLIC FIELDS (8 fields):
 * - osot_coto_status
 * - osot_coto_registration
 * - osot_ot_degree_type
 * - osot_ot_university
 * - osot_ot_grad_year
 * - osot_education_category
 * - osot_ot_country
 * - osot_ot_other
 */
export function mapInternalToPublicDto(
  internal: OtEducationInternal,
): OtEducationPublicDto {
  return {
    osot_coto_status: internal.osot_coto_status
      ? getCotoStatusDisplayName(internal.osot_coto_status)
      : null,
    osot_coto_registration: internal.osot_coto_registration ?? null,
    osot_ot_degree_type: internal.osot_ot_degree_type
      ? getDegreeTypeDisplayName(internal.osot_ot_degree_type)
      : null,
    osot_ot_university: internal.osot_ot_university
      ? getOtUniversityDisplayName(internal.osot_ot_university)
      : null,
    osot_ot_grad_year: internal.osot_ot_grad_year
      ? getGraduationYearDisplayName(internal.osot_ot_grad_year)
      : null,
    osot_education_category:
      internal.osot_education_category !== undefined
        ? getEducationCategoryDisplayName(internal.osot_education_category)
        : null,
    osot_ot_country: internal.osot_ot_country
      ? getCountryDisplayName(internal.osot_ot_country)
      : null,
    osot_ot_other: internal.osot_ot_other ?? null,
  };
}

/**
 * Map OtEducationResponseDto to OtEducationPublicDto
 * Used in controllers to filter response DTOs before returning to public API
 * Removes sensitive/internal fields (GUIDs, timestamps, relationships, access control)
 *
 * This mapper is used when transforming the full ResponseDto from services
 * into the filtered PublicDto for UI/UX consumption.
 * Note: Response DTO already contains string labels, so this is a simple filter operation.
 */
export function mapResponseDtoToPublicDto(
  response: OtEducationResponseDto,
): OtEducationPublicDto {
  return {
    osot_coto_status: response.osot_coto_status ?? null,
    osot_coto_registration: response.osot_coto_registration ?? null,
    osot_ot_degree_type: response.osot_ot_degree_type ?? null,
    osot_ot_university: response.osot_ot_university ?? null,
    osot_ot_grad_year: response.osot_ot_grad_year ?? null,
    osot_education_category: response.osot_education_category ?? null,
    osot_ot_country: response.osot_ot_country ?? null,
    osot_ot_other: response.osot_ot_other ?? null,
  };
}
