/**
 * Affiliate Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized enums for type safety and validation
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * MAPPING PHILOSOPHY:
 * - Essential affiliate data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions
 * - Proper data normalization and validation
 */

import {
  AffiliateArea,
  AccountStatus,
  AccessModifier,
  Privilege,
  City,
  Province,
  Country,
} from '../../../../common/enums';
import { getAffiliateAreaDisplayName } from '../../../../common/enums/affiliate-area.enum';
import { getAccountStatusDisplayName } from '../../../../common/enums/account-status.enum';
import { getProvinceDisplayName } from '../../../../common/enums/provinces.enum';
import { getCityDisplayName } from '../../../../common/enums/cities.enum';
import { getCountryDisplayName } from '../../../../common/enums/countries.enum';
import { CreateAffiliateDto } from '../dtos/create-affiliate.dto';
import { UpdateAffiliateDto } from '../dtos/update-affiliate.dto';
import { AffiliateResponseDto } from '../dtos/affiliate-response.dto';
import { AffiliatePublicDto } from '../dtos/affiliate-public.dto';
import { AffiliateInternal } from '../interfaces/affiliate-internal.interface';
import { AffiliateDataverse } from '../interfaces/affiliate-dataverse.interface';
import { sanitizeUrl } from '../../../../utils/url-sanitizer.utils';

// Re-export types for external use
export { AffiliateResponseDto } from '../dtos/affiliate-response.dto';
export { AffiliatePublicDto } from '../dtos/affiliate-public.dto';

// ========================================
// UTILITY FUNCTIONS (Internal)
// ========================================

/**
 * Normalize text input with length validation and trimming
 */
function normalizeText(
  text: string | undefined,
  maxLength?: number,
): string | undefined {
  if (!text || typeof text !== 'string') return undefined;
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  return maxLength ? trimmed.substring(0, maxLength) : trimmed;
}

/**
 * Normalize email input with basic validation
 */
function normalizeEmail(email: string | undefined): string | undefined {
  if (!email) return undefined;
  const trimmed = email.trim().toLowerCase();
  if (trimmed === '' || !trimmed.includes('@')) return undefined;
  return trimmed;
}

/**
 * Normalize phone number input
 */
function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  // Remove all non-digit characters except + at the start
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned === '' ? undefined : cleaned;
}

/**
 * Normalize URL input with protocol validation
 */
function normalizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (trimmed === '') return undefined;
  return sanitizeUrl(trimmed);
}

/**
 * Normalize postal code
 */
function normalizePostalCode(
  postalCode: string | undefined,
): string | undefined {
  if (!postalCode) return undefined;
  return postalCode.trim().toUpperCase() || undefined;
}

// ========================================
// ENUM PARSING FUNCTIONS
// ========================================

/**
 * Parse affiliate area from string/number to enum
 */
function parseAffiliateArea(value: any): AffiliateArea | undefined {
  if (value === undefined || value === null) return undefined;

  // Handle numeric values
  if (typeof value === 'number') {
    return Object.values(AffiliateArea).includes(value) ? value : undefined;
  }

  // Handle string values
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(AffiliateArea).includes(numValue)) {
      return numValue;
    }
  }

  return undefined;
}

/**
 * Parse account status from string/number to enum
 */
function parseAccountStatus(value: any): AccountStatus | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'number') {
    return Object.values(AccountStatus).includes(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(AccountStatus).includes(numValue)) {
      return numValue;
    }
  }

  return undefined;
}

/**
 * Parse access modifier from string/number to enum
 */
function parseAccessModifier(value: any): AccessModifier | undefined {
  if (value === undefined || value === null) return undefined;

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
 * Parse privilege from string/number to enum
 */
function parsePrivilege(value: any): Privilege | undefined {
  if (value === undefined || value === null) return undefined;

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
 * Parse city from string/number to enum
 */
function parseCity(value: any): City | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'number') {
    return Object.values(City).includes(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(City).includes(numValue)) {
      return numValue;
    }
  }

  return undefined;
}

/**
 * Parse province from string/number to enum
 */
function parseProvince(value: any): Province | undefined {
  if (value === undefined || value === null) return undefined;

  if (typeof value === 'number') {
    return Object.values(Province).includes(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(Province).includes(numValue)) {
      return numValue;
    }
  }

  return undefined;
}

/**
 * Parse country from string/number to enum
 */
function parseCountry(value: any): Country | undefined {
  if (value === undefined || value === null) return undefined;

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

// ========================================
// CORE MAPPING FUNCTIONS
// ========================================

/**
 * Map Dataverse response to internal representation
 * Handles the transformation from external API format to internal business objects
 */
export function mapDataverseToInternal(
  dataverse: AffiliateDataverse,
): AffiliateInternal {
  return {
    // System fields
    osot_table_account_affiliateid: dataverse.osot_table_account_affiliateid,
    osot_affiliate_id: dataverse.osot_affiliate_id,
    createdon: dataverse.createdon,
    modifiedon: dataverse.modifiedon,
    ownerid: dataverse.ownerid,

    // Organization profile
    osot_affiliate_name: dataverse.osot_affiliate_name || '',
    osot_affiliate_area:
      parseAffiliateArea(dataverse.osot_affiliate_area) || AffiliateArea.OTHER,

    // Representative identity
    osot_representative_first_name:
      dataverse.osot_representative_first_name || '',
    osot_representative_last_name:
      dataverse.osot_representative_last_name || '',
    osot_representative_job_title:
      dataverse.osot_representative_job_title || '',

    // Contact information
    osot_affiliate_email: dataverse.osot_affiliate_email || '',
    osot_affiliate_phone: dataverse.osot_affiliate_phone || '',
    osot_affiliate_website: dataverse.osot_affiliate_website,

    // Social media links
    osot_affiliate_facebook: dataverse.osot_affiliate_facebook,
    osot_affiliate_instagram: dataverse.osot_affiliate_instagram,
    osot_affiliate_tiktok: dataverse.osot_affiliate_tiktok,
    osot_affiliate_linkedin: dataverse.osot_affiliate_linkedin,

    // Address information
    osot_affiliate_address_1: dataverse.osot_affiliate_address_1 || '',
    osot_affiliate_address_2: dataverse.osot_affiliate_address_2,
    osot_affiliate_city: parseCity(dataverse.osot_affiliate_city),
    osot_other_city: dataverse.osot_other_city,
    osot_affiliate_province: parseProvince(dataverse.osot_affiliate_province),
    osot_other_province_state: dataverse.osot_other_province_state,
    osot_affiliate_postal_code: dataverse.osot_affiliate_postal_code || '',
    osot_affiliate_country: parseCountry(dataverse.osot_affiliate_country),

    // Authentication and system fields
    osot_password: dataverse.osot_password,
    osot_account_status: parseAccountStatus(dataverse.osot_account_status),
    osot_account_declaration: Boolean(dataverse.osot_account_declaration),
    osot_active_member: Boolean(dataverse.osot_active_member),

    // Access control
    osot_access_modifiers: parseAccessModifier(dataverse.osot_access_modifiers),
    osot_privilege: parsePrivilege(dataverse.osot_privilege),
  };
}

/**
 * Map internal representation to Response DTO format
 * Used for API responses and external consumption
 */
export function mapInternalToResponseDto(
  internal: AffiliateInternal,
): AffiliateResponseDto {
  const responseDto = new AffiliateResponseDto();

  // Use Object.assign to set all fields including readonly ones
  return Object.assign(responseDto, {
    // System fields (readonly)
    osot_affiliate_id: internal.osot_affiliate_id,
    osot_table_account_affiliateid: internal.osot_table_account_affiliateid,
    createdon: internal.createdon,
    modifiedon: internal.modifiedon,
    ownerid: internal.ownerid,

    // Organization profile
    osot_affiliate_name: internal.osot_affiliate_name,
    osot_affiliate_area: internal.osot_affiliate_area,

    // Representative identity
    osot_representative_first_name: internal.osot_representative_first_name,
    osot_representative_last_name: internal.osot_representative_last_name,
    osot_representative_job_title: internal.osot_representative_job_title,

    // Contact information
    osot_affiliate_email: internal.osot_affiliate_email,
    osot_affiliate_phone: internal.osot_affiliate_phone,

    // Address information
    osot_affiliate_address_1: internal.osot_affiliate_address_1,
    osot_affiliate_address_2: internal.osot_affiliate_address_2,
    osot_affiliate_city: internal.osot_affiliate_city,
    osot_other_city: internal.osot_other_city,
    osot_affiliate_province: internal.osot_affiliate_province,
    osot_other_province_state: internal.osot_other_province_state,
    osot_affiliate_postal_code: internal.osot_affiliate_postal_code,
    osot_affiliate_country: internal.osot_affiliate_country,

    // Social media & web presence
    osot_affiliate_website: internal.osot_affiliate_website,
    osot_affiliate_facebook: internal.osot_affiliate_facebook,
    osot_affiliate_instagram: internal.osot_affiliate_instagram,
    osot_affiliate_tiktok: internal.osot_affiliate_tiktok,
    osot_affiliate_linkedin: internal.osot_affiliate_linkedin,

    // Account management
    osot_account_declaration: internal.osot_account_declaration,
    osot_account_status: internal.osot_account_status,
  });
}

/**
 * Map internal representation to Public DTO format
 * Used for public-facing API responses (excludes system fields and sensitive data)
 */
export function mapInternalToPublicDto(
  internal: AffiliateInternal,
): AffiliatePublicDto {
  return {
    osot_affiliate_id: internal.osot_affiliate_id ?? null,
    osot_affiliate_name: internal.osot_affiliate_name ?? null,
    osot_affiliate_area:
      typeof internal.osot_affiliate_area === 'number'
        ? getAffiliateAreaDisplayName(internal.osot_affiliate_area)
        : null,
    osot_affiliate_email: internal.osot_affiliate_email ?? null,
    osot_affiliate_phone: internal.osot_affiliate_phone ?? null,
    osot_affiliate_website: internal.osot_affiliate_website ?? null,
    osot_representative_first_name:
      internal.osot_representative_first_name ?? null,
    osot_representative_last_name:
      internal.osot_representative_last_name ?? null,
    osot_representative_job_title:
      internal.osot_representative_job_title ?? null,
    osot_affiliate_address_1: internal.osot_affiliate_address_1 ?? null,
    osot_affiliate_address_2: internal.osot_affiliate_address_2 ?? null,
    osot_affiliate_city:
      typeof internal.osot_affiliate_city === 'number'
        ? getCityDisplayName(internal.osot_affiliate_city)
        : null,
    osot_affiliate_province:
      typeof internal.osot_affiliate_province === 'number'
        ? getProvinceDisplayName(internal.osot_affiliate_province)
        : null,
    osot_affiliate_country:
      typeof internal.osot_affiliate_country === 'number'
        ? getCountryDisplayName(internal.osot_affiliate_country)
        : null,
    osot_affiliate_postal_code: internal.osot_affiliate_postal_code ?? null,
    osot_affiliate_facebook: internal.osot_affiliate_facebook ?? null,
    osot_affiliate_instagram: internal.osot_affiliate_instagram ?? null,
    osot_affiliate_tiktok: internal.osot_affiliate_tiktok ?? null,
    osot_affiliate_linkedin: internal.osot_affiliate_linkedin ?? null,
    osot_account_declaration: internal.osot_account_declaration ?? null,
    osot_account_status:
      typeof internal.osot_account_status === 'number'
        ? getAccountStatusDisplayName(internal.osot_account_status)
        : null,
  };
}

/**
 * Map Response DTO to Public DTO format
 * Used when converting full response data to public-facing format
 * Converts numeric enum values to human-readable labels
 */
export function mapResponseDtoToPublicDto(
  response: AffiliateResponseDto,
): AffiliatePublicDto {
  return {
    osot_affiliate_id: response.osot_affiliate_id ?? null,
    osot_affiliate_name: response.osot_affiliate_name ?? null,
    osot_affiliate_area:
      typeof response.osot_affiliate_area === 'number'
        ? getAffiliateAreaDisplayName(response.osot_affiliate_area)
        : null,
    osot_affiliate_email: response.osot_affiliate_email ?? null,
    osot_affiliate_phone: response.osot_affiliate_phone ?? null,
    osot_affiliate_website: response.osot_affiliate_website ?? null,
    osot_representative_first_name:
      response.osot_representative_first_name ?? null,
    osot_representative_last_name:
      response.osot_representative_last_name ?? null,
    osot_representative_job_title:
      response.osot_representative_job_title ?? null,
    osot_affiliate_address_1: response.osot_affiliate_address_1 ?? null,
    osot_affiliate_address_2: response.osot_affiliate_address_2 ?? null,
    osot_affiliate_city:
      typeof response.osot_affiliate_city === 'number'
        ? getCityDisplayName(response.osot_affiliate_city)
        : null,
    osot_affiliate_province:
      typeof response.osot_affiliate_province === 'number'
        ? getProvinceDisplayName(response.osot_affiliate_province)
        : null,
    osot_affiliate_country:
      typeof response.osot_affiliate_country === 'number'
        ? getCountryDisplayName(response.osot_affiliate_country)
        : null,
    osot_affiliate_postal_code: response.osot_affiliate_postal_code ?? null,
    osot_affiliate_facebook: response.osot_affiliate_facebook ?? null,
    osot_affiliate_instagram: response.osot_affiliate_instagram ?? null,
    osot_affiliate_tiktok: response.osot_affiliate_tiktok ?? null,
    osot_affiliate_linkedin: response.osot_affiliate_linkedin ?? null,
    osot_account_declaration: response.osot_account_declaration ?? null,
    osot_account_status:
      response.osot_account_status !== undefined &&
      response.osot_account_status !== null
        ? getAccountStatusDisplayName(response.osot_account_status)
        : null,
  };
}

/**
 * Map Create DTO to internal representation
 * Used for new affiliate creation operations
 */
export function mapCreateDtoToInternal(
  dto: CreateAffiliateDto,
): Partial<AffiliateInternal> {
  return {
    // Organization profile
    osot_affiliate_name: normalizeText(dto.osot_affiliate_name, 255) || '',
    osot_affiliate_area:
      parseAffiliateArea(dto.osot_affiliate_area) || AffiliateArea.OTHER,

    // Representative identity
    osot_representative_first_name:
      normalizeText(dto.osot_representative_first_name, 255) || '',
    osot_representative_last_name:
      normalizeText(dto.osot_representative_last_name, 255) || '',
    osot_representative_job_title: normalizeText(
      dto.osot_representative_job_title,
      255,
    ),

    // Contact information
    osot_affiliate_email: normalizeEmail(dto.osot_affiliate_email) || '',
    osot_affiliate_phone: normalizePhone(dto.osot_affiliate_phone),
    osot_affiliate_website: normalizeUrl(dto.osot_affiliate_website),

    // Social media
    osot_affiliate_facebook: normalizeUrl(dto.osot_affiliate_facebook),
    osot_affiliate_instagram: normalizeUrl(dto.osot_affiliate_instagram),
    osot_affiliate_tiktok: normalizeUrl(dto.osot_affiliate_tiktok),
    osot_affiliate_linkedin: normalizeUrl(dto.osot_affiliate_linkedin),

    // Address
    osot_affiliate_address_1:
      normalizeText(dto.osot_affiliate_address_1, 255) || '',
    osot_affiliate_address_2: normalizeText(dto.osot_affiliate_address_2, 255),
    osot_affiliate_city: parseCity(dto.osot_affiliate_city),
    osot_other_city: normalizeText(dto.osot_other_city, 255),
    osot_affiliate_province: parseProvince(dto.osot_affiliate_province),
    osot_other_province_state: normalizeText(
      dto.osot_other_province_state,
      255,
    ),
    osot_affiliate_postal_code:
      normalizePostalCode(dto.osot_affiliate_postal_code) || '',
    osot_affiliate_country: parseCountry(dto.osot_affiliate_country),

    // Account & security
    osot_password: dto.osot_password, // Will be hashed by service layer
    osot_account_declaration: Boolean(dto.osot_account_declaration),

    // System fields will be set by DataverseService or registration service
    osot_account_status: undefined, // Set by system
    osot_active_member: undefined, // Set by system
    osot_access_modifiers: undefined, // Set by system
    osot_privilege: undefined, // Set by system

    // Generated system fields
    osot_table_account_affiliateid: undefined,
    osot_affiliate_id: undefined,
    createdon: undefined,
    modifiedon: undefined,
    ownerid: undefined,
  };
}

/**
 * Map Update DTO to internal representation (partial updates)
 * Only maps fields that are explicitly provided in the update
 */
export function mapUpdateDtoToInternal(
  dto: UpdateAffiliateDto,
): Partial<AffiliateInternal> {
  const result: Partial<AffiliateInternal> = {};

  // Organization profile
  if (dto.osot_affiliate_name !== undefined) {
    result.osot_affiliate_name =
      normalizeText(dto.osot_affiliate_name, 255) || '';
  }
  if (dto.osot_affiliate_area !== undefined) {
    result.osot_affiliate_area = parseAffiliateArea(dto.osot_affiliate_area);
  }

  // Representative identity
  if (dto.osot_representative_first_name !== undefined) {
    result.osot_representative_first_name =
      normalizeText(dto.osot_representative_first_name, 255) || '';
  }
  if (dto.osot_representative_last_name !== undefined) {
    result.osot_representative_last_name =
      normalizeText(dto.osot_representative_last_name, 255) || '';
  }
  if (dto.osot_representative_job_title !== undefined) {
    result.osot_representative_job_title = normalizeText(
      dto.osot_representative_job_title,
      255,
    );
  }

  // Contact information
  if (dto.osot_affiliate_email !== undefined) {
    result.osot_affiliate_email =
      normalizeEmail(dto.osot_affiliate_email) || '';
  }
  if (dto.osot_affiliate_phone !== undefined) {
    result.osot_affiliate_phone = normalizePhone(dto.osot_affiliate_phone);
  }
  if (dto.osot_affiliate_website !== undefined) {
    result.osot_affiliate_website = normalizeUrl(dto.osot_affiliate_website);
  }

  // Social media
  if (dto.osot_affiliate_facebook !== undefined) {
    result.osot_affiliate_facebook = normalizeUrl(dto.osot_affiliate_facebook);
  }
  if (dto.osot_affiliate_instagram !== undefined) {
    result.osot_affiliate_instagram = normalizeUrl(
      dto.osot_affiliate_instagram,
    );
  }
  if (dto.osot_affiliate_tiktok !== undefined) {
    result.osot_affiliate_tiktok = normalizeUrl(dto.osot_affiliate_tiktok);
  }
  if (dto.osot_affiliate_linkedin !== undefined) {
    result.osot_affiliate_linkedin = normalizeUrl(dto.osot_affiliate_linkedin);
  }

  // Address
  if (dto.osot_affiliate_address_1 !== undefined) {
    result.osot_affiliate_address_1 =
      normalizeText(dto.osot_affiliate_address_1, 255) || '';
  }
  if (dto.osot_affiliate_address_2 !== undefined) {
    result.osot_affiliate_address_2 = normalizeText(
      dto.osot_affiliate_address_2,
      255,
    );
  }
  if (dto.osot_affiliate_city !== undefined) {
    result.osot_affiliate_city = parseCity(dto.osot_affiliate_city);
  }
  if (dto.osot_affiliate_province !== undefined) {
    result.osot_affiliate_province = parseProvince(dto.osot_affiliate_province);
  }
  if (dto.osot_affiliate_postal_code !== undefined) {
    result.osot_affiliate_postal_code =
      normalizePostalCode(dto.osot_affiliate_postal_code) || '';
  }
  if (dto.osot_affiliate_country !== undefined) {
    result.osot_affiliate_country = parseCountry(dto.osot_affiliate_country);
  }

  // Note: Read-only fields excluded from UpdateDto:
  // - osot_account_declaration (set at registration, immutable)
  // - osot_account_status (system-managed)
  // - osot_password (use dedicated password change endpoint)
  // - System fields (GUIDs, timestamps, ownership, access control)

  return result;
}

/**
 * Map internal representation to Dataverse format for API calls
 * Converts enums back to numbers and formats data for Dataverse
 */
export function mapInternalToDataverse(
  internal: AffiliateInternal,
): AffiliateDataverse {
  return {
    // System fields
    osot_table_account_affiliateid: internal.osot_table_account_affiliateid,
    osot_affiliate_id: internal.osot_affiliate_id,
    ownerid: internal.ownerid,
    createdon: internal.createdon,
    modifiedon: internal.modifiedon,

    // Organization profile
    osot_affiliate_name: internal.osot_affiliate_name,
    osot_affiliate_area: internal.osot_affiliate_area,

    // Representative identity
    osot_representative_first_name: internal.osot_representative_first_name,
    osot_representative_last_name: internal.osot_representative_last_name,
    osot_representative_job_title: internal.osot_representative_job_title,

    // Contact information
    osot_affiliate_email: internal.osot_affiliate_email,
    osot_affiliate_phone: internal.osot_affiliate_phone,
    osot_affiliate_website: internal.osot_affiliate_website,

    // Social media links
    osot_affiliate_facebook: internal.osot_affiliate_facebook,
    osot_affiliate_instagram: internal.osot_affiliate_instagram,
    osot_affiliate_tiktok: internal.osot_affiliate_tiktok,
    osot_affiliate_linkedin: internal.osot_affiliate_linkedin,

    // Address information
    osot_affiliate_address_1: internal.osot_affiliate_address_1,
    osot_affiliate_address_2: internal.osot_affiliate_address_2,
    osot_affiliate_city: internal.osot_affiliate_city,
    osot_other_city: internal.osot_other_city,
    osot_affiliate_province: internal.osot_affiliate_province,
    osot_other_province_state: internal.osot_other_province_state,
    osot_affiliate_postal_code: internal.osot_affiliate_postal_code,
    osot_affiliate_country: internal.osot_affiliate_country,

    // Authentication and system fields
    osot_password: internal.osot_password,
    osot_account_status: internal.osot_account_status,
    osot_account_declaration: internal.osot_account_declaration,
    osot_active_member: internal.osot_active_member,

    // Access control
    osot_access_modifiers: internal.osot_access_modifiers,
    osot_privilege: internal.osot_privilege,
  };
}

// ========================================
// VALIDATION HELPER FUNCTIONS
// ========================================

/**
 * Validate if an affiliate internal object meets business requirements
 */
export function validateAffiliateInternal(
  affiliate: Partial<AffiliateInternal>,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields validation
  if (!affiliate.osot_affiliate_name) {
    errors.push('Affiliate name is required');
  }
  if (!affiliate.osot_affiliate_email) {
    errors.push('Affiliate email is required');
  }
  if (!affiliate.osot_affiliate_phone) {
    errors.push('Affiliate phone is required');
  }
  if (!affiliate.osot_representative_first_name) {
    errors.push('Representative first name is required');
  }
  if (!affiliate.osot_representative_last_name) {
    errors.push('Representative last name is required');
  }
  if (!affiliate.osot_affiliate_address_1) {
    errors.push('Primary address is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if affiliate data contains any personal information that needs redaction
 */
export function containsPersonalInfo(affiliate: AffiliateInternal): boolean {
  return !!(
    affiliate.osot_affiliate_email ||
    affiliate.osot_affiliate_phone ||
    affiliate.osot_representative_first_name ||
    affiliate.osot_representative_last_name ||
    affiliate.osot_affiliate_address_1 ||
    affiliate.osot_affiliate_address_2
  );
}
