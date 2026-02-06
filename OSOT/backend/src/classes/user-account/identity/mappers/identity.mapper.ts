/*
 * ESLint is disabled for no-unsafe-* rules on enum display name functions below.
 * These functions are type-safe (return string) but ESLint cannot infer types correctly
 * due to re-exports through common/enums/index.ts. The functions are:
 * - getLanguageDisplayName, getGenderDisplayName, getRaceDisplayName,
 *   getIndigenousDetailDisplayName, getAccessModifierDisplayName, getPrivilegeDisplayName
 */

import { IdentityResponseDto } from '../dtos/identity-response.dto';
import { IdentityCreateDto } from '../dtos/identity-create.dto';
import { IdentityUpdateDto } from '../dtos/identity-update.dto';
import { IdentityRegistrationDto } from '../dtos/identity-registration.dto';
import { CreateIdentityForAccountDto } from '../dtos/create-identity-for-account.dto';
import { IdentityPublicDto } from '../dtos/identity-public.dto';
import { IdentityInternal } from '../interfaces/identity-internal.interface';
import {
  Language,
  Gender,
  Race,
  IndigenousDetail,
  AccessModifier,
  Privilege,
  getLanguageDisplayName,
  getGenderDisplayName,
  getRaceDisplayName,
  getIndigenousDetailDisplayName,
  getAccessModifierDisplayName,
  getPrivilegeDisplayName,
} from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

// Export DTOs for external use
export { IdentityResponseDto } from '../dtos/identity-response.dto';
export { IdentityPublicDto } from '../dtos/identity-public.dto';

/**
 * Helper to parse Language enum arrays from Dataverse string format
 * Dataverse stores multiple choices as comma-separated strings: "13,18"
 * Internal representation uses arrays: [13, 18]
 */
function parseLanguageArray(value: unknown): Language[] {
  if (Array.isArray(value)) {
    // Already in array format (internal use)
    return value.filter(
      (v: any) =>
        typeof v === 'number' &&
        Object.values(Language).includes(v as Language),
    ) as Language[];
  }
  if (typeof value === 'string') {
    // Dataverse format: "13,18" -> [13, 18]
    return value
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && Object.values(Language).includes(n));
  }
  if (typeof value === 'number') {
    // Single value -> array
    return Object.values(Language).includes(value) ? [value] : [];
  }
  return [];
}

/**
 * Helper to convert Language array to Dataverse string format
 * Internal array [13, 18] -> Dataverse string "13,18"
 */
function languageArrayToString(languages: Language[]): string {
  return languages.join(',');
}

/**
 * Helper to convert string/number to Gender enum
 */
function parseGender(value: unknown): Gender | undefined {
  if (typeof value === 'number') {
    return Object.values(Gender).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(Gender).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Helper to convert string/number to Race enum
 */
function parseRace(value: unknown): Race | undefined {
  if (typeof value === 'number') {
    return Object.values(Race).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(Race).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Helper to convert string/number to IndigenousDetail enum
 */
function parseIndigenousDetail(value: unknown): IndigenousDetail | undefined {
  if (typeof value === 'number') {
    // Explicit check for valid IndigenousDetail values including 0
    if (value === 0 || value === 1 || value === 2 || value === 3) {
      return value as IndigenousDetail;
    }
    return undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (
      !isNaN(numValue) &&
      (numValue === 0 || numValue === 1 || numValue === 2 || numValue === 3)
    ) {
      return numValue as IndigenousDetail;
    }
  }
  return undefined;
}

/**
 * Helper to convert string/number to AccessModifier enum
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
 * Helper to convert string/number to Privilege enum
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
 * Helper to convert various boolean representations to boolean
 */
function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    // Dataverse Yes/No fields: 1 = true, 0 = false
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined; // Any other number is invalid
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  return undefined;
}

/**
 * Map Dataverse raw data to internal interface (includes sensitive fields)
 * WARNING: Only use this internally - never expose IdentityInternal to public APIs
 */
export function mapDataverseToIdentityInternal(raw: unknown): IdentityInternal {
  try {
    const out: IdentityInternal = {} as IdentityInternal;
    if (!raw || typeof raw !== 'object') {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'map_dataverse_to_identity_internal',
        error: 'Invalid raw data provided - expected object',
        raw,
      });
    }
    const r = raw as Record<string, unknown>;

    const getString = (keys: string[]) => {
      for (const k of keys) {
        const v = r[k];
        if (typeof v === 'string') return v;
      }
      return undefined;
    };

    // === SYSTEM FIELDS ===
    out.osot_table_identityid = getString([
      'osot_table_identityid',
      'osot_Table_IdentityId',
    ]);
    out.osot_identity_id = getString([
      'osot_identity_id',
      'osot_Identity_Id',
      'osotIdentityId',
    ]);
    out.ownerid = getString(['ownerid', 'OwnerId']);
    out.createdon = getString(['createdon', 'CreatedOn']);
    out.modifiedon = getString(['modifiedon', 'ModifiedOn']);

    // === ACCOUNT RELATIONSHIP ===
    out.osot_table_account = getString([
      'osot_table_account',
      'osot_Table_Account',
      '_osot_table_account_value',
    ]);

    // === IDENTITY DATA ===
    out.osot_user_business_id = getString([
      'osot_user_business_id',
      'osot_User_Business_Id',
    ]);
    out.osot_chosen_name = getString(['osot_chosen_name', 'osot_Chosen_Name']);

    // === PERSONAL CHARACTERISTICS ===
    // Language requires special handling (array internally, string in Dataverse)
    const languageValue = r['osot_language'] || r['osot_Language'];
    out.osot_language = parseLanguageArray(languageValue);
    out.osot_other_language = getString([
      'osot_other_language',
      'osot_Other_Language',
    ]);

    out.osot_gender = parseGender(r['osot_gender'] || r['osot_Gender']);
    out.osot_race = parseRace(r['osot_race'] || r['osot_Race']);

    // === CULTURAL IDENTITY ===
    out.osot_indigenous = parseBoolean(
      r['osot_indigenous'] || r['osot_Indigenous'],
    );
    out.osot_indigenous_detail = parseIndigenousDetail(
      r['osot_indigenous_detail'] || r['osot_Indigenous_Detail'],
    );
    out.osot_indigenous_detail_other = getString([
      'osot_indigenous_detail_other',
      'osot_Indigenous_Detail_Other',
    ]);

    // === ACCESSIBILITY ===
    out.osot_disability = parseBoolean(
      r['osot_disability'] || r['osot_Disability'],
    );

    // === PRIVACY & PERMISSIONS ===
    out.osot_access_modifiers = parseAccessModifier(
      r['osot_access_modifiers'] || r['osot_Access_Modifiers'],
    );
    // SECURITY: Include privilege in internal interface for business logic
    out.osot_privilege = parsePrivilege(
      r['osot_privilege'] || r['osot_Privilege'],
    );

    return out;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      // Re-throw our custom errors
      throw error;
    }
    throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
      operation: 'map_dataverse_to_identity_internal',
      error: error instanceof Error ? error.message : 'Unknown mapping error',
      raw,
    });
  }
}

/**
 * Map Dataverse raw data to public response DTO (excludes sensitive fields)
 * Safe for public API responses
 */
export function mapDataverseToIdentityResponse(
  raw: unknown,
): IdentityResponseDto {
  try {
    const out: IdentityResponseDto = {} as IdentityResponseDto;
    if (!raw || typeof raw !== 'object') {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'map_dataverse_to_identity_response',
        error: 'Invalid raw data provided - expected object',
        raw,
      });
    }
    const r = raw as Record<string, unknown>;

    const getString = (keys: string[]) => {
      for (const k of keys) {
        const v = r[k];
        if (typeof v === 'string') return v;
      }
      return undefined;
    };

    // === PUBLIC SYSTEM FIELDS ===
    out.osot_identity_id =
      getString(['osot_identity_id', 'osot_Identity_Id', 'osotIdentityId']) ||
      '';
    out.osot_table_identityid =
      getString(['osot_table_identityid', 'osot_Table_IdentityId']) || '';
    out.ownerid = getString(['ownerid', 'OwnerId']) || '';
    out.createdon = getString(['createdon', 'CreatedOn']) || '';
    out.modifiedon = getString(['modifiedon', 'ModifiedOn']);

    // === ACCOUNT RELATIONSHIP ===
    out.osot_table_account = getString([
      'osot_table_account',
      'osot_Table_Account',
      '_osot_table_account_value',
    ]);

    // === IDENTITY DATA ===
    out.osot_user_business_id =
      getString(['osot_user_business_id', 'osot_User_Business_Id']) || '';
    out.osot_chosen_name = getString(['osot_chosen_name', 'osot_Chosen_Name']);

    // === PERSONAL CHARACTERISTICS ===
    // Language requires special handling (array internally, string in Dataverse)
    const languageValue = r['osot_language'] ?? r['osot_Language'];
    const languageEnums = parseLanguageArray(languageValue);
    out.osot_language = languageEnums.map((lang: Language) =>
      getLanguageDisplayName(lang),
    );

    const genderEnum = parseGender(r['osot_gender'] ?? r['osot_Gender']);
    out.osot_gender =
      genderEnum !== undefined ? getGenderDisplayName(genderEnum) : undefined;

    const raceEnum = parseRace(r['osot_race'] ?? r['osot_Race']);
    out.osot_race =
      raceEnum !== undefined ? getRaceDisplayName(raceEnum) : undefined;

    // === CULTURAL IDENTITY ===
    const indigenousRaw = r['osot_indigenous'] ?? r['osot_Indigenous'];
    const indigenousDetailRaw =
      r['osot_indigenous_detail'] ?? r['osot_Indigenous_Detail'];

    out.osot_indigenous = parseBoolean(indigenousRaw);
    const indigenousDetailEnum = parseIndigenousDetail(indigenousDetailRaw);
    out.osot_indigenous_detail =
      indigenousDetailEnum !== undefined
        ? getIndigenousDetailDisplayName(indigenousDetailEnum)
        : undefined;
    out.osot_indigenous_detail_other = getString([
      'osot_indigenous_detail_other',
      'osot_Indigenous_Detail_Other',
    ]);

    // === ACCESSIBILITY ===
    const disabilityRaw = r['osot_disability'] ?? r['osot_Disability'];

    out.osot_disability = parseBoolean(disabilityRaw);

    // === PRIVACY & PERMISSIONS (PUBLIC SAFE) ===
    const accessModifierEnum = parseAccessModifier(
      r['osot_access_modifiers'] ?? r['osot_Access_Modifiers'],
    );
    out.osot_access_modifiers = accessModifierEnum
      ? getAccessModifierDisplayName(accessModifierEnum)
      : undefined;

    const privilegeEnum = parsePrivilege(
      r['osot_privilege'] ?? r['osot_Privilege'],
    );
    out.osot_privilege = privilegeEnum
      ? getPrivilegeDisplayName(privilegeEnum)
      : undefined;

    // SECURITY NOTES - Fields NOT mapped to public response:
    // (None - all Identity fields are considered safe for public display,
    //  but services should apply business rules for sensitive information)

    return out;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      // Re-throw our custom errors
      throw error;
    }
    throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
      operation: 'map_dataverse_to_identity_response',
      error: error instanceof Error ? error.message : 'Unknown mapping error',
      raw,
    });
  }
}

/**
 * Map IdentityInternal to IdentityPublicDto
 * Used when returning filtered identity data for public API endpoints
 * Excludes system fields (GUIDs, timestamps, relationships, access control)
 */
export function mapInternalToPublicDto(
  internal: IdentityInternal,
): IdentityPublicDto {
  const languageEnums = Array.isArray(internal.osot_language)
    ? internal.osot_language
    : parseLanguageArray(internal.osot_language);

  return {
    osot_chosen_name: internal.osot_chosen_name,
    osot_language: languageEnums.map((lang) => getLanguageDisplayName(lang)),
    osot_other_language: internal.osot_other_language,
    osot_gender: internal.osot_gender
      ? getGenderDisplayName(internal.osot_gender)
      : null,
    osot_race: internal.osot_race
      ? getRaceDisplayName(internal.osot_race)
      : null,
    osot_indigenous: internal.osot_indigenous,
    osot_indigenous_detail: internal.osot_indigenous_detail
      ? getIndigenousDetailDisplayName(internal.osot_indigenous_detail)
      : null,
    osot_indigenous_detail_other: internal.osot_indigenous_detail_other,
    osot_disability: internal.osot_disability,
  };
}

/**
 * Map IdentityResponseDto to IdentityPublicDto
 * Used in controllers to filter response DTOs before returning to public API
 * Removes sensitive/internal fields (GUIDs, timestamps, relationships, access control)
 * Ensures all 8 public fields are always present (uses null for missing values to ensure JSON serialization)
 */
export function mapResponseDtoToPublicDto(
  response: IdentityResponseDto,
): IdentityPublicDto {
  const result = {
    osot_chosen_name: response.osot_chosen_name ?? null,
    osot_language: response.osot_language ?? [],
    osot_other_language: response.osot_other_language ?? null,
    osot_gender: response.osot_gender ?? null,
    osot_race: response.osot_race ?? null,
    osot_indigenous: response.osot_indigenous ?? null,
    osot_indigenous_detail: response.osot_indigenous_detail ?? null,
    osot_indigenous_detail_other: response.osot_indigenous_detail_other ?? null,
    osot_disability: response.osot_disability ?? null,
  };

  return result;
}

/**
 * Map Create DTO to Dataverse payload format
 * Adds secure default values for system-controlled fields
 * Converts from DTO structure to Dataverse API expected format
 */
/**
 * Map Create DTO to Internal format
 * Follows Repository Pattern: DTO → Internal → Repository handles Dataverse transformation
 */
export function mapCreateDtoToInternal(
  dto: IdentityCreateDto,
): Partial<IdentityInternal> {
  const internal: Partial<IdentityInternal> = {
    // Language array (Internal uses array, repository converts to Dataverse string)
    osot_language: dto.osot_language,

    // System-controlled fields with secure defaults
    osot_access_modifiers: AccessModifier.PRIVATE,
    osot_privilege: Privilege.OWNER,
  };

  // Handle optional fields from DTO
  if (dto.osot_chosen_name !== undefined) {
    internal.osot_chosen_name = dto.osot_chosen_name;
  }

  if (dto.osot_other_language !== undefined) {
    internal.osot_other_language = dto.osot_other_language;
  }

  if (dto.osot_gender !== undefined) {
    internal.osot_gender = dto.osot_gender;
  }

  if (dto.osot_race !== undefined) {
    internal.osot_race = dto.osot_race;
  }

  if (dto.osot_indigenous !== undefined) {
    internal.osot_indigenous = dto.osot_indigenous;
  }

  if (dto.osot_indigenous_detail !== undefined) {
    internal.osot_indigenous_detail = dto.osot_indigenous_detail;
  }

  if (dto.osot_indigenous_detail_other !== undefined) {
    internal.osot_indigenous_detail_other = dto.osot_indigenous_detail_other;
  }

  if (dto.osot_disability !== undefined) {
    internal.osot_disability = dto.osot_disability;
  }

  // Handle OData binding for Account relationship
  if (dto['osot_Table_Account@odata.bind']) {
    internal['osot_Table_Account@odata.bind'] =
      dto['osot_Table_Account@odata.bind'];
  }

  return internal;
}

export function mapCreateDtoToDataversePayload(
  dto: IdentityCreateDto,
): Record<string, unknown> {
  try {
    if (!dto || typeof dto !== 'object') {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'map_create_dto_to_dataverse_payload',
        error: 'Invalid DTO provided - expected IdentityCreateDto object',
        dto,
      });
    }

    const payload: Record<string, unknown> = {
      // Convert language array to Dataverse string format
      osot_language: languageArrayToString(dto.osot_language),

      // System-controlled fields with secure defaults
      osot_access_modifiers: AccessModifier.PRIVATE,
      osot_privilege: Privilege.OWNER,
    };

    // Note: osot_user_business_id is auto-generated by Dataverse, not provided by user

    // Handle optional fields that may be present in DTO
    if (dto.osot_chosen_name !== undefined) {
      payload.osot_chosen_name = dto.osot_chosen_name;
    }

    if (dto.osot_other_language !== undefined) {
      payload.osot_other_language = dto.osot_other_language;
    }

    if (dto.osot_gender !== undefined) {
      payload.osot_gender = dto.osot_gender;
    }

    if (dto.osot_race !== undefined) {
      payload.osot_race = dto.osot_race;
    }

    if (dto.osot_indigenous !== undefined) {
      payload.osot_indigenous = dto.osot_indigenous;
    }

    if (dto.osot_indigenous_detail !== undefined) {
      payload.osot_indigenous_detail = dto.osot_indigenous_detail;
    }

    if (dto.osot_indigenous_detail_other !== undefined) {
      payload.osot_indigenous_detail_other = dto.osot_indigenous_detail_other;
    }

    if (dto.osot_disability !== undefined) {
      payload.osot_disability = dto.osot_disability;
    }

    // Exclude read-only system fields:
    // - osot_identity_id: Generated by Dataverse autonumber
    // - osot_table_identityid: Generated by Dataverse as GUID
    // - createdon/modifiedon: Set by system
    // - ownerid: Set by system based on authenticated user
    // Note: osot_user_business_id is now required and provided by the calling service

    return payload;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      // Re-throw our custom errors
      throw error;
    }
    throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
      operation: 'map_create_dto_to_dataverse_payload',
      error: error instanceof Error ? error.message : 'Unknown mapping error',
      dto,
    });
  }
}

/**
 * Map Update DTO to Dataverse payload format
 * Only includes fields that are being updated (exclude undefined/null)
 * System-controlled fields are not updatable by users
 */
export function mapUpdateDtoToDataversePayload(
  dto: IdentityUpdateDto,
): Record<string, unknown> {
  try {
    if (!dto || typeof dto !== 'object') {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'map_update_dto_to_dataverse_payload',
        error: 'Invalid DTO provided - expected IdentityUpdateDto object',
        dto,
      });
    }

    const payload: Record<string, unknown> = {};

    // Map fields if they exist in the update DTO
    if (dto.osot_chosen_name !== undefined) {
      payload.osot_chosen_name = dto.osot_chosen_name;
    }

    if (dto.osot_language !== undefined) {
      // Convert language array to Dataverse string format
      payload.osot_language = languageArrayToString(dto.osot_language);
    }

    if (dto.osot_other_language !== undefined) {
      payload.osot_other_language = dto.osot_other_language;
    }

    if (dto.osot_gender !== undefined) {
      payload.osot_gender = dto.osot_gender;
    }

    if (dto.osot_race !== undefined) {
      payload.osot_race = dto.osot_race;
    }

    if (dto.osot_indigenous !== undefined) {
      payload.osot_indigenous = dto.osot_indigenous;
    }

    if (dto.osot_indigenous_detail !== undefined) {
      payload.osot_indigenous_detail = dto.osot_indigenous_detail;
    }

    if (dto.osot_indigenous_detail_other !== undefined) {
      payload.osot_indigenous_detail_other = dto.osot_indigenous_detail_other;
    }

    if (dto.osot_disability !== undefined) {
      payload.osot_disability = dto.osot_disability;
    }

    // Exclude system-controlled fields that users cannot update:
    // - osot_user_business_id: Auto-generated, cannot be modified
    // - osot_access_modifiers: Controlled by internal business logic
    // - osot_privilege: Controlled by internal business logic
    // - osot_table_account: Relationship managed by system
    // - osot_identity_id: Cannot be updated (autonumber)
    // - osot_table_identityid: Cannot be updated (system GUID)
    // - createdon/modifiedon: Managed by system
    // - ownerid: Usually managed by system/business logic

    return payload;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      // Re-throw our custom errors
      throw error;
    }
    throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
      operation: 'map_update_dto_to_dataverse_payload',
      error: error instanceof Error ? error.message : 'Unknown mapping error',
      dto,
    });
  }
}

/**
 * Map Internal interface to Response DTO (removes sensitive internal fields)
 * Used to convert internal data structures to API-safe response format
 */
export function mapInternalToIdentityResponse(
  internal: IdentityInternal,
): IdentityResponseDto {
  const dto: IdentityResponseDto = {} as IdentityResponseDto;

  // === PUBLIC SYSTEM FIELDS ===
  dto.osot_identity_id = internal.osot_identity_id || '';
  dto.osot_table_identityid = internal.osot_table_identityid || '';
  dto.ownerid = internal.ownerid || '';
  dto.createdon = internal.createdon || '';
  dto.modifiedon = internal.modifiedon;

  // === ACCOUNT RELATIONSHIP ===
  dto.osot_table_account = internal.osot_table_account;

  // === IDENTITY DATA ===
  dto.osot_user_business_id = internal.osot_user_business_id || '';
  dto.osot_chosen_name = internal.osot_chosen_name;

  // === PERSONAL CHARACTERISTICS ===
  // Handle language conversion from internal format
  const languageEnums = Array.isArray(internal.osot_language)
    ? internal.osot_language
    : typeof internal.osot_language === 'string'
      ? parseLanguageArray(internal.osot_language)
      : [];

  dto.osot_language = languageEnums.map((lang) => getLanguageDisplayName(lang));

  dto.osot_gender = internal.osot_gender
    ? getGenderDisplayName(internal.osot_gender)
    : undefined;
  dto.osot_race = internal.osot_race
    ? getRaceDisplayName(internal.osot_race)
    : undefined;

  // === CULTURAL IDENTITY ===
  dto.osot_indigenous = internal.osot_indigenous;
  dto.osot_indigenous_detail = internal.osot_indigenous_detail
    ? getIndigenousDetailDisplayName(internal.osot_indigenous_detail)
    : undefined;
  dto.osot_indigenous_detail_other = internal.osot_indigenous_detail_other;

  // === ACCESSIBILITY ===
  dto.osot_disability = internal.osot_disability;

  // === PRIVACY & PERMISSIONS ===
  dto.osot_access_modifiers = internal.osot_access_modifiers
    ? getAccessModifierDisplayName(internal.osot_access_modifiers)
    : undefined;
  dto.osot_privilege = internal.osot_privilege
    ? getPrivilegeDisplayName(internal.osot_privilege)
    : undefined;

  return dto;
}

/**
 * Convert IdentityResponseDto back to IdentityInternal for internal processing
 * Used when response data needs to be processed internally again
 */
/**
 * DEPRECATED: This function should not be used after enum-to-label conversion.
 * Response DTOs now contain string labels, not enum values.
 * Use mapDataverseToIdentityInternal instead to get Internal data from Dataverse.
 */
/*
export function mapResponseToIdentityInternal(
  response: IdentityResponseDto,
): IdentityInternal {
  const internal: IdentityInternal = {} as IdentityInternal;

  // Copy all fields from response to internal
  // (Response DTO contains all the same fields except internal metadata)
  internal.osot_table_identityid = response.osot_table_identityid;
  internal.osot_identity_id = response.osot_identity_id;
  internal.ownerid = response.ownerid;
  internal.createdon = response.createdon;
  internal.modifiedon = response.modifiedon;
  internal.osot_table_account = response.osot_table_account;
  internal.osot_user_business_id = response.osot_user_business_id;
  internal.osot_chosen_name = response.osot_chosen_name;
  internal.osot_language = response.osot_language; // Keep as array
  internal.osot_gender = response.osot_gender;
  internal.osot_race = response.osot_race;
  internal.osot_indigenous = response.osot_indigenous;
  internal.osot_indigenous_detail = response.osot_indigenous_detail;
  internal.osot_indigenous_detail_other = response.osot_indigenous_detail_other;
  internal.osot_disability = response.osot_disability;
  internal.osot_access_modifiers = response.osot_access_modifiers;
  internal.osot_privilege = response.osot_privilege;

  return internal;
}
*/

/**
 * Map Registration DTO to Dataverse payload format
 * Adds secure default values for system-controlled fields
 * Optimized for registration workflows with simplified user experience
 */
export function mapRegistrationDtoToDataversePayload(
  dto: IdentityRegistrationDto,
): Record<string, unknown> {
  try {
    if (!dto || typeof dto !== 'object') {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'map_registration_dto_to_dataverse_payload',
        error: 'Invalid DTO provided - expected IdentityRegistrationDto object',
        dto,
      });
    }

    const payload: Record<string, unknown> = {
      // Convert language array to Dataverse string format
      osot_language: languageArrayToString(dto.osot_language),

      // System-controlled fields with secure defaults for registration
      osot_access_modifiers: AccessModifier.PRIVATE,
      osot_privilege: Privilege.OWNER,
    };

    // Note: osot_user_business_id is auto-generated by Dataverse, not provided by user

    // Handle optional fields that may be present in registration DTO
    if (dto.osot_chosen_name !== undefined) {
      payload.osot_chosen_name = dto.osot_chosen_name;
    }

    if (dto.osot_gender !== undefined) {
      payload.osot_gender = dto.osot_gender;
    }

    if (dto.osot_race !== undefined) {
      payload.osot_race = dto.osot_race;
    }

    if (dto.osot_indigenous !== undefined) {
      payload.osot_indigenous = dto.osot_indigenous;
    }

    if (dto.osot_indigenous_detail !== undefined) {
      payload.osot_indigenous_detail = dto.osot_indigenous_detail;
    }

    if (dto.osot_indigenous_detail_other !== undefined) {
      payload.osot_indigenous_detail_other = dto.osot_indigenous_detail_other;
    }

    if (dto.osot_disability !== undefined) {
      payload.osot_disability = dto.osot_disability;
    }

    // Exclude system-controlled fields that users cannot set during registration:
    // - osot_identity_id: Generated by Dataverse autonumber
    // - osot_table_identityid: Generated by Dataverse as GUID
    // - createdon/modifiedon: Set by system
    // - ownerid: Set by system based on authenticated user
    // - osot_table_account: Managed by registration orchestrator
    // Note: osot_user_business_id is now required and provided by the calling service

    return payload;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      // Re-throw our custom errors
      throw error;
    }
    throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
      operation: 'map_registration_dto_to_dataverse_payload',
      error: error instanceof Error ? error.message : 'Unknown mapping error',
      dto,
    });
  }
}

/**
 * Map CreateIdentityForAccountDto to Dataverse payload format
 * Optimized for account integration workflows with minimal validation
 * Adds secure default values for system-controlled fields
 */
/**
 * Map CreateIdentityForAccountDto to IdentityInternal
 * Used specifically for account integration workflow with repository pattern
 * Includes relationship fields (osot_user_business_id and @odata.bind)
 */
export function mapCreateIdentityForAccountDtoToInternal(
  dto: CreateIdentityForAccountDto,
): Partial<IdentityInternal> {
  try {
    if (!dto || typeof dto !== 'object') {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'map_create_identity_for_account_dto_to_internal',
        error:
          'Invalid DTO provided - expected CreateIdentityForAccountDto object',
        dto,
      });
    }

    const internal: Partial<IdentityInternal> = {
      // CRITICAL: Include relationship fields for account integration
      osot_user_business_id: dto.osot_user_business_id,

      // Identity-specific fields
      osot_chosen_name: dto.osot_chosen_name,
      osot_language: dto.osot_language,
      osot_gender: dto.osot_gender,
      osot_race: dto.osot_race,
      osot_indigenous: dto.osot_indigenous,
      osot_indigenous_detail: dto.osot_indigenous_detail,
      osot_indigenous_detail_other: dto.osot_indigenous_detail_other,
      osot_disability: dto.osot_disability,

      // System defaults
      osot_access_modifiers: AccessModifier.PRIVATE,
      osot_privilege: Privilege.OWNER,
    };

    // Handle OData binding for account relationship - keep as-is, don't extract GUID
    const odataBinding = dto['osot_Table_Account@odata.bind'];
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
  } catch (error) {
    throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
      operation: 'map_create_identity_for_account_dto_to_internal',
      error: error instanceof Error ? error.message : 'Unknown mapping error',
      dto,
    });
  }
}

export function mapCreateIdentityForAccountDtoToDataversePayload(
  dto: CreateIdentityForAccountDto,
): Record<string, unknown> {
  try {
    if (!dto || typeof dto !== 'object') {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'map_create_identity_for_account_dto_to_dataverse_payload',
        error:
          'Invalid DTO provided - expected CreateIdentityForAccountDto object',
        dto,
      });
    }

    const payload: Record<string, unknown> = {
      // Convert language array to Dataverse string format
      osot_language: languageArrayToString(dto.osot_language),

      // System-controlled fields with secure defaults for account integration
      osot_access_modifiers: AccessModifier.PRIVATE,
      osot_privilege: Privilege.OWNER,
    };

    // Note: osot_user_business_id is auto-generated by Dataverse, not provided by user

    // Handle optional fields that may be present in account creation DTO
    if (dto.osot_chosen_name !== undefined) {
      payload.osot_chosen_name = dto.osot_chosen_name;
    }

    if (dto.osot_gender !== undefined) {
      payload.osot_gender = dto.osot_gender;
    }

    if (dto.osot_race !== undefined) {
      payload.osot_race = dto.osot_race;
    }

    if (dto.osot_indigenous !== undefined) {
      payload.osot_indigenous = dto.osot_indigenous;
    }

    if (dto.osot_indigenous_detail !== undefined) {
      payload.osot_indigenous_detail = dto.osot_indigenous_detail;
    }

    if (dto.osot_indigenous_detail_other !== undefined) {
      payload.osot_indigenous_detail_other = dto.osot_indigenous_detail_other;
    }

    if (dto.osot_disability !== undefined) {
      payload.osot_disability = dto.osot_disability;
    }

    // Exclude system-controlled fields that are managed during account integration:
    // - osot_identity_id: Generated by Dataverse autonumber
    // - osot_table_identityid: Generated by Dataverse as GUID
    // - createdon/modifiedon: Set by system
    // - ownerid: Set by system based on authenticated user
    // - osot_table_account: Managed by account integration orchestrator
    // Note: osot_user_business_id is now required and provided by the calling service

    return payload;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      // Re-throw our custom errors
      throw error;
    }
    throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
      operation: 'map_create_identity_for_account_dto_to_dataverse_payload',
      error: error instanceof Error ? error.message : 'Unknown mapping error',
      dto,
    });
  }
}
