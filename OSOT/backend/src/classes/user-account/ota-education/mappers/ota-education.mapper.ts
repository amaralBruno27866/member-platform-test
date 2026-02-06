/**
 * OTA Education Mapper (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized enums for type safety and validation
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential OTA education data transformations only
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
  DegreeType,
  OtaCollege,
  GraduationYear,
  EducationCategory,
  Country,
  getDegreeTypeDisplayName,
  getOtaCollegeDisplayName,
  getGraduationYearDisplayName,
  getEducationCategoryDisplayName,
  getCountryDisplayName,
} from '../../../../common/enums';

import { UpdateOtaEducationDto } from '../dtos/update-ota-education.dto';
import { OtaEducationResponseDto } from '../dtos/ota-education-response.dto';
import { OtaEducationPublicDto } from '../dtos/ota-education-public.dto';
import { OtaEducationInternal } from '../interfaces/ota-education-internal.interface';
import { DataverseOtaEducation } from '../interfaces/ota-education-dataverse.interface';

// Export the OtaEducationResponseDto type for external use
export { OtaEducationResponseDto } from '../dtos/ota-education-response.dto';
export { OtaEducationPublicDto } from '../dtos/ota-education-public.dto';

/**
 * Helper functions for enum conversions and data parsing
 */

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
 * Convert string/number to OtaCollege enum
 */
function parseOtaCollege(value: unknown): OtaCollege | undefined {
  if (typeof value === 'number') {
    return Object.values(OtaCollege).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(OtaCollege).includes(numValue)) {
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
 * Data Normalization Functions
 * Clean and standardize incoming data
 */
function normalizeUserBusinessId(id: string): string {
  return id.trim().toUpperCase();
}

/**
 * Normalize work declaration text
 */
function normalizeDescription(description: string): string | undefined {
  if (!description || typeof description !== 'string') return undefined;

  const trimmed = description.trim();
  if (trimmed.length === 0) return undefined;

  // Ensure max 1000 characters as per table schema
  return trimmed.length <= 1000 ? trimmed : trimmed.slice(0, 1000);
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

// Type-safe union for mapper input that supports both DTO types
type CreateOtaEducationMapperInput = {
  osot_work_declaration?: boolean;
  osot_ota_degree_type?: DegreeType;
  osot_ota_college?: OtaCollege;
  osot_ota_grad_year?: GraduationYear;
  osot_ota_country?: Country;
  osot_ota_other?: string;
  osot_education_category?: EducationCategory; // Optional - present when auto-determined by service
};

/**
 * Core Mapping Functions
 */

/**
 * Map raw Dataverse response to internal OTA Education representation
 * Handles enum conversions and data normalization
 */
export function mapDataverseToInternal(
  dataverse: DataverseOtaEducation,
): OtaEducationInternal {
  return {
    // System fields
    osot_table_ota_educationid: dataverse.osot_table_ota_educationid,
    osot_ota_education_id: dataverse.osot_ota_education_id,
    ownerid: dataverse.ownerid,
    createdon: parseDataverseDate(dataverse.createdon),
    modifiedon: parseDataverseDate(dataverse.modifiedon),

    // Account relationship - removed, handled via @odata.bind instead

    // Business required fields
    osot_user_business_id: normalizeUserBusinessId(
      dataverse.osot_user_business_id || '',
    ),
    osot_work_declaration: Boolean(dataverse.osot_work_declaration),

    // Optional business fields
    osot_ota_degree_type: parseDegreeType(dataverse.osot_ota_degree_type),
    osot_ota_college: parseOtaCollege(dataverse.osot_ota_college),
    osot_ota_grad_year: parseGraduationYear(dataverse.osot_ota_grad_year),
    osot_education_category: parseEducationCategory(
      dataverse.osot_education_category,
    ),
    osot_ota_country: parseCountry(dataverse.osot_ota_country),
    osot_ota_other: normalizeDescription(dataverse.osot_ota_other || ''),
  };
}

/**
 * Map internal representation to public response DTO
 * Uses logical names consistent with modernized DTOs
 */
export function mapInternalToResponse(
  internal: OtaEducationInternal,
): OtaEducationResponseDto {
  return {
    // System identifiers - converted to logical names
    osot_ota_education_id: internal.osot_ota_education_id || '',
    osot_table_ota_educationid: internal.osot_table_ota_educationid || '',
    ownerid: internal.ownerid || '',
    createdon: internal.createdon,
    modifiedon: internal.modifiedon,

    // Account relationship - removed, handled via @odata.bind instead

    // Business fields (using logical names)
    osot_user_business_id: internal.osot_user_business_id || '',
    osot_work_declaration: internal.osot_work_declaration || false,

    // Optional business fields - convert enums to human-readable labels
    osot_ota_college:
      internal.osot_ota_college !== undefined
        ? getOtaCollegeDisplayName(internal.osot_ota_college)
        : undefined,
    osot_ota_country:
      internal.osot_ota_country !== undefined
        ? getCountryDisplayName(internal.osot_ota_country)
        : undefined,
    osot_ota_grad_year:
      internal.osot_ota_grad_year !== undefined
        ? getGraduationYearDisplayName(internal.osot_ota_grad_year)
        : undefined,
    osot_education_category:
      internal.osot_education_category !== undefined
        ? getEducationCategoryDisplayName(internal.osot_education_category)
        : undefined,
    osot_ota_degree_type:
      internal.osot_ota_degree_type !== undefined
        ? getDegreeTypeDisplayName(internal.osot_ota_degree_type)
        : undefined,
    osot_ota_other: internal.osot_ota_other,
  };
}

/**
 * Map internal representation to Dataverse format for API calls
 * Converts enums back to numbers and formats data for Dataverse
 */
export function mapInternalToDataverse(
  internal: OtaEducationInternal,
): DataverseOtaEducation {
  return {
    // System fields
    osot_table_ota_educationid: internal.osot_table_ota_educationid,
    osot_ota_education_id: internal.osot_ota_education_id,
    ownerid: internal.ownerid,
    createdon: internal.createdon,
    modifiedon: internal.modifiedon,

    // Account relationship - removed, handled via @odata.bind instead

    // Business fields
    osot_user_business_id: internal.osot_user_business_id,
    osot_work_declaration: internal.osot_work_declaration,
    osot_ota_degree_type: internal.osot_ota_degree_type,
    osot_ota_college: internal.osot_ota_college,
    osot_ota_grad_year: internal.osot_ota_grad_year,
    osot_education_category: internal.osot_education_category,
    osot_ota_country: internal.osot_ota_country,
    osot_ota_other: internal.osot_ota_other,

    // Privacy and access control
    osot_access_modifiers: internal.osot_access_modifiers,
    osot_privilege: internal.osot_privilege,
  };
}

/**
 * Map create DTO to internal representation for Dataverse
 * Works with both CreateOtaEducationDto and CreateOtaEducationForAccountDto
 * Supports enriched DTOs with auto-determined education category
 */
export function mapCreateDtoToInternal(
  dto: CreateOtaEducationMapperInput,
): Partial<OtaEducationInternal> {
  const internal: Partial<OtaEducationInternal> = {
    // Business required fields (from OtaEducationBasicDto)
    osot_work_declaration: Boolean(dto.osot_work_declaration),

    // Optional business fields
    osot_ota_degree_type: dto.osot_ota_degree_type,
    osot_ota_college: dto.osot_ota_college,
    osot_ota_grad_year: dto.osot_ota_grad_year,
    osot_education_category: dto.osot_education_category,
    osot_ota_country: dto.osot_ota_country,
    osot_ota_other: normalizeDescription(dto.osot_ota_other || ''),

    // Note: System fields like createdon, modifiedon, ownerid are managed by Dataverse
  };

  // Include osot_user_business_id if provided (for account integration)
  const dtoWithBusinessId = dto as CreateOtaEducationMapperInput & {
    osot_user_business_id?: string;
  };
  if (dtoWithBusinessId.osot_user_business_id !== undefined) {
    internal.osot_user_business_id = dtoWithBusinessId.osot_user_business_id;
  }

  // Handle OData binding for account relationship
  const dtoWithBinding = dto as CreateOtaEducationMapperInput & {
    'osot_Table_Account@odata.bind'?: string;
  };
  const odataBinding = dtoWithBinding['osot_Table_Account@odata.bind'];
  if (
    odataBinding &&
    typeof odataBinding === 'string' &&
    odataBinding.trim() !== ''
  ) {
    // Keep OData binding as-is for Dataverse navigation property
    Object.assign(internal, {
      'osot_Table_Account@odata.bind': odataBinding,
    });
  }

  return internal;
}

/**
 * Map update DTO to partial internal representation
 * Works with PartialType(OtaEducationBasicDto) - all fields optional
 */
export function mapUpdateDtoToInternal(
  dto: UpdateOtaEducationDto,
): Partial<OtaEducationInternal> {
  const result: Partial<OtaEducationInternal> = {};

  // Only map fields that are actually provided in the update
  // Note: osot_work_declaration, osot_ota_grad_year, and osot_education_category
  // are read-only fields and cannot be updated via this DTO

  if (dto.osot_ota_degree_type !== undefined) {
    result.osot_ota_degree_type = dto.osot_ota_degree_type;
  }

  if (dto.osot_ota_college !== undefined) {
    result.osot_ota_college = dto.osot_ota_college;
  }

  if (dto.osot_ota_country !== undefined) {
    result.osot_ota_country = dto.osot_ota_country;
  }

  if (dto.osot_ota_other !== undefined) {
    result.osot_ota_other = normalizeDescription(dto.osot_ota_other || '');
  }

  return result;
}

/**
 * Utility Functions for Complex Mappings
 */

/**
 * Validate work declaration requirement
 * Business rule: Work declaration is required for all OTA education records
 */
export function validateWorkDeclaration(workDeclaration: boolean | undefined): {
  isValid: boolean;
  error?: string;
} {
  if (workDeclaration === undefined || workDeclaration === false) {
    return {
      isValid: false,
      error: 'Work declaration is required for OTA education records',
    };
  }

  return { isValid: true };
}

/**
 * Validate college-country alignment
 * Business rule: Canadian colleges should be paired with Canada
 */
export function validateCollegeCountryAlignment(
  college: OtaCollege | undefined,
  country: Country | undefined,
): { isValid: boolean; error?: string } {
  if (!college || !country) {
    return { isValid: true }; // Optional fields, no validation needed
  }

  const canadianColleges = [
    OtaCollege.ALGONQUIN_COLLEGE,
    OtaCollege.CENTENNIAL_COLLEGE,
    OtaCollege.MOHAWK_COLLEGE,
  ];

  if (canadianColleges.includes(college) && country !== Country.CANADA) {
    return {
      isValid: false,
      error: `${college} is a Canadian college and should be paired with Canada`,
    };
  }

  return { isValid: true };
}

/**
 * Calculate education completeness score
 * Returns a percentage (0-100) of how complete the education record is
 * Based on user-editable fields only
 */
export function calculateCompletenessScore(
  internal: OtaEducationInternal,
): number {
  const fields = [
    internal.osot_work_declaration,
    internal.osot_ota_degree_type,
    internal.osot_ota_college,
    internal.osot_ota_grad_year,
    internal.osot_education_category,
    internal.osot_ota_country,
    internal.osot_ota_other,
  ];

  const filledFields = fields.filter(
    (field) => field !== undefined && field !== null && field !== '',
  ).length;
  return Math.round((filledFields / fields.length) * 100);
}

/**
 * Extract searchable text from OTA education record
 * Used for full-text search and indexing
 */
export function extractSearchableText(internal: OtaEducationInternal): string {
  const searchableFields = [
    internal.osot_user_business_id,
    internal.osot_ota_education_id,
    internal.osot_ota_other,
    internal.osot_ota_college?.toString(),
    internal.osot_education_category?.toString(),
  ];

  return searchableFields
    .filter((field) => field && typeof field === 'string')
    .join(' ')
    .toLowerCase();
}

/**
 * Check if education record represents international education
 * Used for verification requirements and special processing
 */
export function isInternationalEducation(
  internal: OtaEducationInternal,
): boolean {
  return (
    internal.osot_ota_country !== undefined &&
    internal.osot_ota_country !== Country.CANADA
  );
}

/**
 * Get human-readable summary of education record
 * Used for logging and display purposes
 */
export function getEducationSummary(internal: OtaEducationInternal): string {
  const parts = [
    internal.osot_user_business_id,
    internal.osot_ota_college?.toString() || 'College not specified',
    internal.osot_ota_grad_year?.toString() || 'Year not specified',
    internal.osot_ota_degree_type?.toString() || 'Degree not specified',
  ];

  return parts.filter(Boolean).join(' | ');
}

/**
 * Map OtaEducationInternal to OtaEducationPublicDto
 * Used when returning filtered OTA education data for public API endpoints
 * Excludes system fields (GUIDs, timestamps, relationships, access control)
 *
 * PUBLIC FIELDS (7 fields):
 * - osot_ota_degree_type
 * - osot_ota_college
 * - osot_ota_grad_year
 * - osot_education_category
 * - osot_ota_country
 * - osot_ota_other
 * - osot_work_declaration
 */
export function mapInternalToPublicDto(
  internal: OtaEducationInternal,
): OtaEducationPublicDto {
  return {
    osot_ota_degree_type:
      internal.osot_ota_degree_type !== undefined
        ? getDegreeTypeDisplayName(internal.osot_ota_degree_type)
        : null,
    osot_ota_college:
      internal.osot_ota_college !== undefined
        ? getOtaCollegeDisplayName(internal.osot_ota_college)
        : null,
    osot_ota_grad_year:
      internal.osot_ota_grad_year !== undefined
        ? getGraduationYearDisplayName(internal.osot_ota_grad_year)
        : null,
    osot_education_category:
      internal.osot_education_category !== undefined
        ? getEducationCategoryDisplayName(internal.osot_education_category)
        : null,
    osot_ota_country:
      internal.osot_ota_country !== undefined
        ? getCountryDisplayName(internal.osot_ota_country)
        : null,
    osot_ota_other: internal.osot_ota_other ?? null,
    osot_work_declaration: internal.osot_work_declaration ?? null,
  };
}

/**
 * Map OtaEducationResponseDto to OtaEducationPublicDto
 * Used in controllers to filter response DTOs before returning to public API
 * Removes sensitive/internal fields (GUIDs, timestamps, relationships, access control)
 *
 * This mapper is used when transforming the full ResponseDto from services
 * into the filtered PublicDto for UI/UX consumption.
 */
export function mapResponseDtoToPublicDto(
  response: OtaEducationResponseDto,
): OtaEducationPublicDto {
  return {
    osot_ota_degree_type: response.osot_ota_degree_type ?? null,
    osot_ota_college: response.osot_ota_college ?? null,
    osot_ota_grad_year: response.osot_ota_grad_year ?? null,
    osot_education_category: response.osot_education_category ?? null,
    osot_ota_country: response.osot_ota_country ?? null,
    osot_ota_other: response.osot_ota_other ?? null,
    osot_work_declaration: response.osot_work_declaration ?? null,
  };
}
