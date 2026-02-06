/**
 * Audience Target Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses 15 common enums and 15 membership-specific enums
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential audience targeting data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions for all 35 multiple choice fields
 * - Proper OData bind handling for Product lookup
 * - Multi-select array ↔ string conversions for Dataverse
 *
 * KEY RESPONSIBILITIES:
 * - Transform Create/Update DTOs to Internal representation
 * - Transform Internal to Response DTOs for API output
 * - Transform Dataverse responses to Internal
 * - Transform Internal to Dataverse payloads
 * - Handle OData bind format conversions for Product lookup
 * - Convert multi-select arrays (35 fields) to/from comma-separated strings
 * - Validate audience target data completeness
 * - Sanitize data for logging
 */

import { Privilege, AccessModifier } from '../../../../common/enums';
import { UpdateAudienceTargetDto } from '../dtos/audience-target-update.dto';
import { AudienceTargetResponseDto } from '../dtos/audience-target-response.dto';
import { CreateAudienceTargetDto } from '../dtos/audience-target-create.dto';
import { AudienceTargetInternal } from '../interfaces/audience-target-internal.interface';
import { AudienceTargetDataverse } from '../interfaces/audience-target-dataverse.interface';
import { AUDIENCE_TARGET_FIELDS } from '../constants/audience-target.constants';

// Export the ResponseDto type for external use
export { AudienceTargetResponseDto } from '../dtos/audience-target-response.dto';

/**
 * Complete DTO with system-determined fields for target creation
 * Used internally when controller enriches CreateDto with system fields
 */
export interface EnrichedCreateAudienceTargetDto
  extends CreateAudienceTargetDto {
  osot_privilege?: Privilege;
  osot_access_modifiers?: AccessModifier;
}

/**
 * Helper Functions for Multi-Select Array Conversions
 */

/**
 * Convert multi-select field from various formats to number array
 * Handles:
 * - Dataverse comma-separated string: "1,2,3" -> [1, 2, 3]
 * - Array of numbers: [1, 2, 3] -> [1, 2, 3]
 * - Single number: 1 -> [1]
 * - Single string: "1" -> [1]
 * - Empty/null/undefined -> undefined
 */
function parseMultiSelectField(value: unknown): number[] | undefined {
  if (value === null || value === undefined) return undefined;

  // Handle Dataverse comma-separated string format: "1,2,3"
  if (typeof value === 'string') {
    if (value.trim() === '') return undefined;

    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => parseInt(v.trim(), 10))
        .filter((n) => !isNaN(n));

      return parsed.length > 0 ? parsed : undefined;
    }

    // Single value string
    const numValue = parseInt(value, 10);
    return !isNaN(numValue) ? [numValue] : undefined;
  }

  // Handle array (internal format)
  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) ? numValue : null;
        }
        return null;
      })
      .filter((v): v is number => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  // Handle single number value
  if (typeof value === 'number') {
    return [value];
  }

  return undefined;
}

/**
 * Convert number array to Dataverse comma-separated string
 * [1, 2, 3] -> "1,2,3"
 * Also handles string inputs (already in Dataverse format)
 */
function arrayToDataverseString(
  arr: number[] | string | undefined | null,
): string | null | undefined {
  // Explicitly handle null to clear field in Dataverse
  if (arr === null) return null;
  // Handle undefined (field not provided in update)
  if (arr === undefined) return undefined;
  // If already a string, return as-is
  if (typeof arr === 'string') return arr;
  // If array, convert to comma-separated string
  if (Array.isArray(arr) && arr.length > 0) return arr.join(',');
  // Empty array should clear the field
  if (Array.isArray(arr) && arr.length === 0) return null;
  return undefined;
}

/**
 * Ensure value is a number array for Response DTOs
 * Converts string format to array if needed
 */
function ensureNumberArray(
  value: number[] | string | undefined,
): number[] | undefined {
  if (!value) return undefined;
  // If already an array, return as-is
  if (Array.isArray(value)) return value;
  // If string, convert to array
  if (typeof value === 'string') {
    return parseMultiSelectField(value);
  }
  return undefined;
}

/**
 * Extract GUID from OData bind string
 * Example: "/osot_table_products(a1b2c3d4-e5f6-7890-abcd-ef1234567890)" -> "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 */
function extractGuidFromBind(odataBind: string): string | undefined {
  if (!odataBind) return undefined;
  const match = odataBind.match(/\(([a-f0-9-]+)\)/i);
  return match ? match[1] : undefined;
}

/**
 * Create OData bind string from GUID
 * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" -> "/osot_table_products(a1b2c3d4-e5f6-7890-abcd-ef1234567890)"
 */
function createODataBind(tableName: string, guid: string): string {
  return `/${tableName}(${guid})`;
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
 * Audience Target Mapper Class
 *
 * Handles all data transformations between different audience target representations:
 * - DTOs ↔ Internal interfaces
 * - Dataverse responses ↔ Internal interfaces
 * - OData bind conversions for Product lookup
 * - Multi-select array ↔ comma-separated string conversions (35 fields)
 * - Data normalization and validation
 * - Type-safe enum conversions
 * - Error handling for transformation failures
 *
 * Key Features:
 * - Type-safe transformations with enum validation
 * - OData bind handling for Product lookup
 * - Multi-select field conversions (35 fields: all 0-50 selections)
 * - Target ID format validation (osot-tgt-NNNNNNN)
 * - Comprehensive error handling
 * - Integration with essential modules
 */
export class AudienceTargetMapper {
  /**
   * Map CreateDto to Internal (overload for simple DTO)
   */
  static mapCreateDtoToInternal(
    dto: CreateAudienceTargetDto,
  ): Partial<AudienceTargetInternal>;

  /**
   * Map CreateDto to Internal (overload for enriched DTO)
   */
  static mapCreateDtoToInternal(
    dto: EnrichedCreateAudienceTargetDto,
  ): Partial<AudienceTargetInternal>;

  /**
   * Map CreateDto to Internal (implementation)
   * Handles both simple and enriched DTOs
   */
  static mapCreateDtoToInternal(
    dto: CreateAudienceTargetDto | EnrichedCreateAudienceTargetDto,
  ): Partial<AudienceTargetInternal> {
    const internal: Partial<AudienceTargetInternal> = {
      // Account Group (1 field)
      osot_account_group: dto.osot_account_group,

      // Affiliate (3 fields)
      osot_affiliate_area: dto.osot_affiliate_area,
      osot_affiliate_city: dto.osot_affiliate_city,
      osot_affiliate_province: dto.osot_affiliate_province,

      // Address (2 fields)
      osot_membership_city: dto.osot_membership_city,
      osot_province: dto.osot_province,

      // Identity (4 fields)
      osot_gender: dto.osot_gender,
      osot_indigenous_details: dto.osot_indigenous_details,
      osot_language: dto.osot_language,
      osot_race: dto.osot_race,

      // Membership Category (2 fields)
      osot_eligibility_affiliate: dto.osot_eligibility_affiliate,
      osot_membership_category: dto.osot_membership_category,

      // Employment (9 fields)
      osot_earnings: dto.osot_earnings,
      osot_earnings_selfdirect: dto.osot_earnings_selfdirect,
      osot_earnings_selfindirect: dto.osot_earnings_selfindirect,
      osot_employment_benefits: dto.osot_employment_benefits,
      osot_employment_status: dto.osot_employment_status,
      osot_position_funding: dto.osot_position_funding,
      osot_practice_years: dto.osot_practice_years,
      osot_role_description: dto.osot_role_description,
      osot_work_hours: dto.osot_work_hours,

      // Practice (4 fields)
      osot_client_age: dto.osot_client_age,
      osot_practice_area: dto.osot_practice_area,
      osot_practice_services: dto.osot_practice_services,
      osot_practice_settings: dto.osot_practice_settings,

      // Preference (4 fields)
      osot_membership_search_tools: dto.osot_membership_search_tools,
      osot_practice_promotion: dto.osot_practice_promotion,
      osot_psychotherapy_supervision: dto.osot_psychotherapy_supervision,
      osot_third_parties: dto.osot_third_parties,

      // Education OT (3 fields)
      osot_coto_status: dto.osot_coto_status,
      osot_ot_grad_year: dto.osot_ot_grad_year,
      osot_ot_university: dto.osot_ot_university,

      // Education OTA (2 fields)
      osot_ota_grad_year: dto.osot_ota_grad_year,
      osot_ota_college: dto.osot_ota_college,
    };

    // Handle Product lookup - convert OData bind to GUID
    if (dto['osot_Table_Product@odata.bind']) {
      const productBind = dto['osot_Table_Product@odata.bind'];
      internal.osot_table_product = extractGuidFromBind(productBind);
    }

    // Optional access control fields (defaults applied at service layer)
    if ('osot_privilege' in dto && dto.osot_privilege !== undefined) {
      internal.osot_privilege = dto.osot_privilege;
    }
    if (
      'osot_access_modifiers' in dto &&
      dto.osot_access_modifiers !== undefined
    ) {
      internal.osot_access_modifiers = dto.osot_access_modifiers;
    }

    return internal;
  }

  /**
   * Map UpdateDto to partial Internal
   * Used when updating existing target from API requests
   * Supports partial updates - only provided fields are included
   */
  static mapUpdateDtoToInternal(
    dto: UpdateAudienceTargetDto,
  ): Partial<AudienceTargetInternal> {
    const internal: Partial<AudienceTargetInternal> = {};

    // Account Group (1 field)
    if (dto.osot_account_group !== undefined) {
      internal.osot_account_group = dto.osot_account_group;
    }

    // Affiliate (3 fields)
    if (dto.osot_affiliate_area !== undefined) {
      internal.osot_affiliate_area = dto.osot_affiliate_area;
    }
    if (dto.osot_affiliate_city !== undefined) {
      internal.osot_affiliate_city = dto.osot_affiliate_city;
    }
    if (dto.osot_affiliate_province !== undefined) {
      internal.osot_affiliate_province = dto.osot_affiliate_province;
    }

    // Address (2 fields)
    if (dto.osot_membership_city !== undefined) {
      internal.osot_membership_city = dto.osot_membership_city;
    }
    if (dto.osot_province !== undefined) {
      internal.osot_province = dto.osot_province;
    }

    // Identity (4 fields)
    if (dto.osot_gender !== undefined) {
      internal.osot_gender = dto.osot_gender;
    }
    if (dto.osot_indigenous_details !== undefined) {
      internal.osot_indigenous_details = dto.osot_indigenous_details;
    }
    if (dto.osot_language !== undefined) {
      internal.osot_language = dto.osot_language;
    }
    if (dto.osot_race !== undefined) {
      internal.osot_race = dto.osot_race;
    }

    // Membership Category (2 fields)
    if (dto.osot_eligibility_affiliate !== undefined) {
      internal.osot_eligibility_affiliate = dto.osot_eligibility_affiliate;
    }
    if (dto.osot_membership_category !== undefined) {
      internal.osot_membership_category = dto.osot_membership_category;
    }

    // Employment (9 fields)
    if (dto.osot_earnings !== undefined) {
      internal.osot_earnings = dto.osot_earnings;
    }
    if (dto.osot_earnings_selfdirect !== undefined) {
      internal.osot_earnings_selfdirect = dto.osot_earnings_selfdirect;
    }
    if (dto.osot_earnings_selfindirect !== undefined) {
      internal.osot_earnings_selfindirect = dto.osot_earnings_selfindirect;
    }
    if (dto.osot_employment_benefits !== undefined) {
      internal.osot_employment_benefits = dto.osot_employment_benefits;
    }
    if (dto.osot_employment_status !== undefined) {
      internal.osot_employment_status = dto.osot_employment_status;
    }
    if (dto.osot_position_funding !== undefined) {
      internal.osot_position_funding = dto.osot_position_funding;
    }
    if (dto.osot_practice_years !== undefined) {
      internal.osot_practice_years = dto.osot_practice_years;
    }
    if (dto.osot_role_description !== undefined) {
      internal.osot_role_description = dto.osot_role_description;
    }
    if (dto.osot_work_hours !== undefined) {
      internal.osot_work_hours = dto.osot_work_hours;
    }

    // Practice (4 fields)
    if (dto.osot_client_age !== undefined) {
      internal.osot_client_age = dto.osot_client_age;
    }
    if (dto.osot_practice_area !== undefined) {
      internal.osot_practice_area = dto.osot_practice_area;
    }
    if (dto.osot_practice_services !== undefined) {
      internal.osot_practice_services = dto.osot_practice_services;
    }
    if (dto.osot_practice_settings !== undefined) {
      internal.osot_practice_settings = dto.osot_practice_settings;
    }

    // Preference (4 fields)
    if (dto.osot_membership_search_tools !== undefined) {
      internal.osot_membership_search_tools = dto.osot_membership_search_tools;
    }
    if (dto.osot_practice_promotion !== undefined) {
      internal.osot_practice_promotion = dto.osot_practice_promotion;
    }
    if (dto.osot_psychotherapy_supervision !== undefined) {
      internal.osot_psychotherapy_supervision =
        dto.osot_psychotherapy_supervision;
    }
    if (dto.osot_third_parties !== undefined) {
      internal.osot_third_parties = dto.osot_third_parties;
    }

    // Education OT (3 fields)
    if (dto.osot_coto_status !== undefined) {
      internal.osot_coto_status = dto.osot_coto_status;
    }
    if (dto.osot_ot_grad_year !== undefined) {
      internal.osot_ot_grad_year = dto.osot_ot_grad_year;
    }
    if (dto.osot_ot_university !== undefined) {
      internal.osot_ot_university = dto.osot_ot_university;
    }

    // Education OTA (2 fields)
    if (dto.osot_ota_grad_year !== undefined) {
      internal.osot_ota_grad_year = dto.osot_ota_grad_year;
    }
    if (dto.osot_ota_college !== undefined) {
      internal.osot_ota_college = dto.osot_ota_college;
    }

    return internal;
  }

  /**
   * Map Internal to ResponseDto
   * Used when returning audience target data from API endpoints
   * Returns all targeting fields as number arrays (35 fields)
   */
  static mapInternalToResponseDto(
    internal: AudienceTargetInternal,
  ): AudienceTargetResponseDto {
    const response: AudienceTargetResponseDto = {
      // System fields
      osot_target: internal.osot_target,
      osot_table_audience_targetid: internal.osot_table_audience_targetid,
      osot_table_product: internal.osot_table_product,

      // Account Group (1 field)
      osot_account_group: ensureNumberArray(internal.osot_account_group),

      // Affiliate (3 fields)
      osot_affiliate_area: ensureNumberArray(internal.osot_affiliate_area),
      osot_affiliate_city: ensureNumberArray(internal.osot_affiliate_city),
      osot_affiliate_province: ensureNumberArray(
        internal.osot_affiliate_province,
      ),

      // Address (2 fields)
      osot_membership_city: ensureNumberArray(internal.osot_membership_city),
      osot_province: ensureNumberArray(internal.osot_province),

      // Identity (4 fields)
      osot_gender: ensureNumberArray(internal.osot_gender),
      osot_indigenous_details: ensureNumberArray(
        internal.osot_indigenous_details,
      ),
      osot_language: ensureNumberArray(internal.osot_language),
      osot_race: ensureNumberArray(internal.osot_race),

      // Membership Category (2 fields)
      osot_eligibility_affiliate: ensureNumberArray(
        internal.osot_eligibility_affiliate,
      ),
      osot_membership_category: ensureNumberArray(
        internal.osot_membership_category,
      ),

      // Employment (9 fields)
      osot_earnings: ensureNumberArray(internal.osot_earnings),
      osot_earnings_selfdirect: ensureNumberArray(
        internal.osot_earnings_selfdirect,
      ),
      osot_earnings_selfindirect: ensureNumberArray(
        internal.osot_earnings_selfindirect,
      ),
      osot_employment_benefits: ensureNumberArray(
        internal.osot_employment_benefits,
      ),
      osot_employment_status: ensureNumberArray(
        internal.osot_employment_status,
      ),
      osot_position_funding: ensureNumberArray(internal.osot_position_funding),
      osot_practice_years: ensureNumberArray(internal.osot_practice_years),
      osot_role_description: ensureNumberArray(internal.osot_role_description),
      osot_work_hours: ensureNumberArray(internal.osot_work_hours),

      // Practice (4 fields)
      osot_client_age: ensureNumberArray(internal.osot_client_age),
      osot_practice_area: ensureNumberArray(internal.osot_practice_area),
      osot_practice_services: ensureNumberArray(
        internal.osot_practice_services,
      ),
      osot_practice_settings: ensureNumberArray(
        internal.osot_practice_settings,
      ),

      // Preference (4 fields)
      osot_membership_search_tools: ensureNumberArray(
        internal.osot_membership_search_tools,
      ),
      osot_practice_promotion: ensureNumberArray(
        internal.osot_practice_promotion,
      ),
      osot_psychotherapy_supervision: ensureNumberArray(
        internal.osot_psychotherapy_supervision,
      ),
      osot_third_parties: ensureNumberArray(internal.osot_third_parties),

      // Education OT (3 fields)
      osot_coto_status: ensureNumberArray(internal.osot_coto_status),
      osot_ot_grad_year: ensureNumberArray(internal.osot_ot_grad_year),
      osot_ot_university: ensureNumberArray(internal.osot_ot_university),

      // Education OTA (2 fields)
      osot_ota_grad_year: ensureNumberArray(internal.osot_ota_grad_year),
      osot_ota_college: ensureNumberArray(internal.osot_ota_college),

      // System timestamps
      createdon: internal.createdon,
      modifiedon: internal.modifiedon,
    };

    return response;
  }

  /**
   * Map Dataverse response to Internal
   * Used when receiving data from Dataverse API
   * Handles multi-select comma-separated string to array conversion for all 35 fields
   */
  static mapDataverseToInternal(
    dataverse: AudienceTargetDataverse,
  ): AudienceTargetInternal {
    return {
      // System fields (Primary key - GUID)
      osot_table_audience_targetid: dataverse.osot_table_audience_targetid,
      osot_target: dataverse.osot_target,

      // Product lookup - Dataverse returns GUID in _value field
      osot_table_product:
        dataverse._osot_table_product_value || dataverse.osot_table_product,

      // Account Group (1 field)
      osot_account_group: parseMultiSelectField(dataverse.osot_account_group),

      // Affiliate (3 fields)
      osot_affiliate_area: parseMultiSelectField(dataverse.osot_affiliate_area),
      osot_affiliate_city: parseMultiSelectField(dataverse.osot_affiliate_city),
      osot_affiliate_province: parseMultiSelectField(
        dataverse.osot_affiliate_province,
      ),

      // Address (2 fields)
      osot_membership_city: parseMultiSelectField(
        dataverse.osot_membership_city,
      ),
      osot_province: parseMultiSelectField(dataverse.osot_province),

      // Identity (4 fields)
      osot_gender: parseMultiSelectField(dataverse.osot_gender),
      osot_indigenous_details: parseMultiSelectField(
        dataverse.osot_indigenous_details,
      ),
      osot_language: parseMultiSelectField(dataverse.osot_language),
      osot_race: parseMultiSelectField(dataverse.osot_race),

      // Membership Category (2 fields)
      osot_eligibility_affiliate: parseMultiSelectField(
        dataverse.osot_eligibility_affiliate,
      ),
      osot_membership_category: parseMultiSelectField(
        dataverse.osot_membership_category,
      ),

      // Employment (9 fields)
      osot_earnings: parseMultiSelectField(dataverse.osot_earnings),
      osot_earnings_selfdirect: parseMultiSelectField(
        dataverse.osot_earnings_selfdirect,
      ),
      osot_earnings_selfindirect: parseMultiSelectField(
        dataverse.osot_earnings_selfindirect,
      ),
      osot_employment_benefits: parseMultiSelectField(
        dataverse.osot_employment_benefits,
      ),
      osot_employment_status: parseMultiSelectField(
        dataverse.osot_employment_status,
      ),
      osot_position_funding: parseMultiSelectField(
        dataverse.osot_position_funding,
      ),
      osot_practice_years: parseMultiSelectField(dataverse.osot_practice_years),
      osot_role_description: parseMultiSelectField(
        dataverse.osot_role_description,
      ),
      osot_work_hours: parseMultiSelectField(dataverse.osot_work_hours),

      // Practice (4 fields)
      osot_client_age: parseMultiSelectField(dataverse.osot_client_age),
      osot_practice_area: parseMultiSelectField(dataverse.osot_practice_area),
      osot_practice_services: parseMultiSelectField(
        dataverse.osot_practice_services,
      ),
      osot_practice_settings: parseMultiSelectField(
        dataverse.osot_practice_settings,
      ),

      // Preference (4 fields)
      osot_membership_search_tools: parseMultiSelectField(
        dataverse.osot_membership_search_tools,
      ),
      osot_practice_promotion: parseMultiSelectField(
        dataverse.osot_practice_promotion,
      ),
      osot_psychotherapy_supervision: parseMultiSelectField(
        dataverse.osot_psychotherapy_supervision,
      ),
      osot_third_parties: parseMultiSelectField(dataverse.osot_third_parties),

      // Education OT (3 fields)
      osot_coto_status: parseMultiSelectField(dataverse.osot_coto_status),
      osot_ot_grad_year: parseMultiSelectField(dataverse.osot_ot_grad_year),
      osot_ot_university: parseMultiSelectField(dataverse.osot_ot_university),

      // Education OTA (2 fields)
      osot_ota_grad_year: parseMultiSelectField(dataverse.osot_ota_grad_year),
      osot_ota_college: parseMultiSelectField(dataverse.osot_ota_college),

      // Access control fields with enum parsing
      osot_privilege: parsePrivilege(dataverse.osot_privilege),
      osot_access_modifiers: parseAccessModifier(
        dataverse.osot_access_modifiers,
      ),

      // System timestamps
      createdon: dataverse.createdon,
      modifiedon: dataverse.modifiedon,
    };
  }

  /**
   * Map Internal to Dataverse payload
   * Used when sending data to Dataverse API
   * Converts multi-select arrays (35 fields) to comma-separated strings
   * Converts Product GUID to OData bind format
   */
  static mapInternalToDataverse(
    internal: AudienceTargetInternal,
    isUpdate = false,
  ): Partial<AudienceTargetDataverse> {
    const payload: Partial<AudienceTargetDataverse> = {};

    // Primary key (only for updates)
    if (isUpdate && internal.osot_target !== undefined) {
      payload.osot_target = internal.osot_target;
    }

    // Product lookup - convert to OData bind format
    // IMPORTANT: Only use @odata.bind, never the base field
    if (internal.osot_table_product !== undefined) {
      payload[AUDIENCE_TARGET_FIELDS.TABLE_PRODUCT + '@odata.bind'] =
        createODataBind('osot_table_products', internal.osot_table_product);
    }

    // Account Group (1 field)
    // Include field if explicitly provided (even if null to clear it)
    if (internal.osot_account_group !== undefined) {
      payload.osot_account_group = arrayToDataverseString(
        internal.osot_account_group,
      );
    }

    // Affiliate (3 fields)
    if (internal.osot_affiliate_area !== undefined) {
      payload.osot_affiliate_area = arrayToDataverseString(
        internal.osot_affiliate_area,
      );
    }
    if (internal.osot_affiliate_city !== undefined) {
      payload.osot_affiliate_city = arrayToDataverseString(
        internal.osot_affiliate_city,
      );
    }
    if (internal.osot_affiliate_province !== undefined) {
      payload.osot_affiliate_province = arrayToDataverseString(
        internal.osot_affiliate_province,
      );
    }

    // Address (2 fields)
    if (internal.osot_membership_city !== undefined) {
      payload.osot_membership_city = arrayToDataverseString(
        internal.osot_membership_city,
      );
    }
    if (internal.osot_province !== undefined) {
      payload.osot_province = arrayToDataverseString(internal.osot_province);
    }

    // Identity (4 fields)
    if (internal.osot_gender !== undefined) {
      payload.osot_gender = arrayToDataverseString(internal.osot_gender);
    }
    if (internal.osot_indigenous_details !== undefined) {
      payload.osot_indigenous_details = arrayToDataverseString(
        internal.osot_indigenous_details,
      );
    }
    if (internal.osot_language !== undefined) {
      payload.osot_language = arrayToDataverseString(internal.osot_language);
    }
    if (internal.osot_race !== undefined) {
      payload.osot_race = arrayToDataverseString(internal.osot_race);
    }

    // Membership Category (2 fields)
    if (internal.osot_eligibility_affiliate !== undefined) {
      payload.osot_eligibility_affiliate = arrayToDataverseString(
        internal.osot_eligibility_affiliate,
      );
    }
    if (internal.osot_membership_category !== undefined) {
      payload.osot_membership_category = arrayToDataverseString(
        internal.osot_membership_category,
      );
    }

    // Employment (9 fields)
    if (internal.osot_earnings !== undefined) {
      payload.osot_earnings = arrayToDataverseString(internal.osot_earnings);
    }
    if (internal.osot_earnings_selfdirect !== undefined) {
      payload.osot_earnings_selfdirect = arrayToDataverseString(
        internal.osot_earnings_selfdirect,
      );
    }
    if (internal.osot_earnings_selfindirect !== undefined) {
      payload.osot_earnings_selfindirect = arrayToDataverseString(
        internal.osot_earnings_selfindirect,
      );
    }
    if (internal.osot_employment_benefits !== undefined) {
      payload.osot_employment_benefits = arrayToDataverseString(
        internal.osot_employment_benefits,
      );
    }
    if (internal.osot_employment_status !== undefined) {
      payload.osot_employment_status = arrayToDataverseString(
        internal.osot_employment_status,
      );
    }
    if (internal.osot_position_funding !== undefined) {
      payload.osot_position_funding = arrayToDataverseString(
        internal.osot_position_funding,
      );
    }
    if (internal.osot_practice_years !== undefined) {
      payload.osot_practice_years = arrayToDataverseString(
        internal.osot_practice_years,
      );
    }
    if (internal.osot_role_description !== undefined) {
      payload.osot_role_description = arrayToDataverseString(
        internal.osot_role_description,
      );
    }
    if (internal.osot_work_hours !== undefined) {
      payload.osot_work_hours = arrayToDataverseString(
        internal.osot_work_hours,
      );
    }

    // Practice (4 fields)
    if (internal.osot_client_age !== undefined) {
      payload.osot_client_age = arrayToDataverseString(
        internal.osot_client_age,
      );
    }
    if (internal.osot_practice_area !== undefined) {
      payload.osot_practice_area = arrayToDataverseString(
        internal.osot_practice_area,
      );
    }
    if (internal.osot_practice_services !== undefined) {
      payload.osot_practice_services = arrayToDataverseString(
        internal.osot_practice_services,
      );
    }
    if (internal.osot_practice_settings !== undefined) {
      payload.osot_practice_settings = arrayToDataverseString(
        internal.osot_practice_settings,
      );
    }

    // Preference (4 fields)
    if (internal.osot_membership_search_tools !== undefined) {
      payload.osot_membership_search_tools = arrayToDataverseString(
        internal.osot_membership_search_tools,
      );
    }
    if (internal.osot_practice_promotion !== undefined) {
      payload.osot_practice_promotion = arrayToDataverseString(
        internal.osot_practice_promotion,
      );
    }
    if (internal.osot_psychotherapy_supervision !== undefined) {
      payload.osot_psychotherapy_supervision = arrayToDataverseString(
        internal.osot_psychotherapy_supervision,
      );
    }
    if (internal.osot_third_parties !== undefined) {
      payload.osot_third_parties = arrayToDataverseString(
        internal.osot_third_parties,
      );
    }

    // Education OT (3 fields)
    if (internal.osot_coto_status !== undefined) {
      payload.osot_coto_status = arrayToDataverseString(
        internal.osot_coto_status,
      );
    }
    if (internal.osot_ot_grad_year !== undefined) {
      payload.osot_ot_grad_year = arrayToDataverseString(
        internal.osot_ot_grad_year,
      );
    }
    if (internal.osot_ot_university !== undefined) {
      payload.osot_ot_university = arrayToDataverseString(
        internal.osot_ot_university,
      );
    }

    // Education OTA (2 fields)
    if (internal.osot_ota_grad_year !== undefined) {
      payload.osot_ota_grad_year = arrayToDataverseString(
        internal.osot_ota_grad_year,
      );
    }
    if (internal.osot_ota_college !== undefined) {
      payload.osot_ota_college = arrayToDataverseString(
        internal.osot_ota_college,
      );
    }

    // Access control fields
    if (internal.osot_privilege !== undefined) {
      payload.osot_privilege = internal.osot_privilege;
    }
    if (internal.osot_access_modifiers !== undefined) {
      payload.osot_access_modifiers = internal.osot_access_modifiers;
    }

    return payload;
  }

  /**
   * Validate audience target data for completeness
   * Returns validation errors if any required fields are missing or invalid
   * Note: For audience targets, only Product is required. All 35 fields are optional.
   */
  static validateTargetData(target: Partial<AudienceTargetInternal>): string[] {
    const errors: string[] = [];

    // Check required Product lookup
    if (!target.osot_table_product) {
      errors.push('Product reference is required');
    } else {
      // Validate GUID format
      const guidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidPattern.test(target.osot_table_product)) {
        errors.push('Product reference must be a valid GUID');
      }
    }

    // Optional: Validate that at least one targeting field is populated
    // (Otherwise target matches everyone - which may or may not be desired)
    const hasAnyTargetingField =
      target.osot_account_group ||
      target.osot_affiliate_area ||
      target.osot_affiliate_city ||
      target.osot_affiliate_province ||
      target.osot_membership_city ||
      target.osot_province ||
      target.osot_gender ||
      target.osot_indigenous_details ||
      target.osot_language ||
      target.osot_race ||
      target.osot_eligibility_affiliate ||
      target.osot_membership_category ||
      target.osot_earnings ||
      target.osot_earnings_selfdirect ||
      target.osot_earnings_selfindirect ||
      target.osot_employment_benefits ||
      target.osot_employment_status ||
      target.osot_position_funding ||
      target.osot_practice_years ||
      target.osot_role_description ||
      target.osot_work_hours ||
      target.osot_client_age ||
      target.osot_practice_area ||
      target.osot_practice_services ||
      target.osot_practice_settings ||
      target.osot_membership_search_tools ||
      target.osot_practice_promotion ||
      target.osot_psychotherapy_supervision ||
      target.osot_third_parties ||
      target.osot_coto_status ||
      target.osot_ot_grad_year ||
      target.osot_ot_university ||
      target.osot_ota_grad_year ||
      target.osot_ota_college;

    // This is a warning, not an error - empty target is technically valid
    // but may not be intended by the admin
    if (!hasAnyTargetingField) {
      // Optional: Could add to errors if business rules require at least one field
      // errors.push('At least one targeting field should be populated');
    }

    return errors;
  }

  /**
   * Sanitize audience target data by removing sensitive fields
   * Used when preparing data for logging or external systems
   */
  static sanitizeTargetData(
    target: AudienceTargetInternal,
  ): Partial<AudienceTargetInternal> {
    const sanitized: Partial<AudienceTargetInternal> = {
      osot_target_id: target.osot_target_id,
      osot_table_audience_targetid: target.osot_table_audience_targetid,
      osot_table_product: target.osot_table_product,
      createdon: target.createdon,
      modifiedon: target.modifiedon,
    };

    // Include non-sensitive targeting metadata (counts only, not actual values)
    const fieldCounts = {
      account_group: target.osot_account_group?.length || 0,
      affiliate_fields: [
        target.osot_affiliate_area?.length,
        target.osot_affiliate_city?.length,
        target.osot_affiliate_province?.length,
      ].filter((v) => v && v > 0).length,
      identity_fields: [
        target.osot_gender?.length,
        target.osot_indigenous_details?.length,
        target.osot_language?.length,
        target.osot_race?.length,
      ].filter((v) => v && v > 0).length,
      employment_fields: [
        target.osot_earnings?.length,
        target.osot_employment_benefits?.length,
        target.osot_employment_status?.length,
      ].filter((v) => v && v > 0).length,
    };

    // Log only the counts, not the actual targeting criteria
    return {
      ...sanitized,
      _targeting_summary: fieldCounts as any, // Metadata only
    };
  }

  /**
   * Count populated targeting fields
   * Returns number of fields with at least one selection
   */
  static countPopulatedFields(target: AudienceTargetInternal): number {
    let count = 0;

    const fields = [
      target.osot_account_group,
      target.osot_affiliate_area,
      target.osot_affiliate_city,
      target.osot_affiliate_province,
      target.osot_membership_city,
      target.osot_province,
      target.osot_gender,
      target.osot_indigenous_details,
      target.osot_language,
      target.osot_race,
      target.osot_eligibility_affiliate,
      target.osot_membership_category,
      target.osot_earnings,
      target.osot_earnings_selfdirect,
      target.osot_earnings_selfindirect,
      target.osot_employment_benefits,
      target.osot_employment_status,
      target.osot_position_funding,
      target.osot_practice_years,
      target.osot_role_description,
      target.osot_work_hours,
      target.osot_client_age,
      target.osot_practice_area,
      target.osot_practice_services,
      target.osot_practice_settings,
      target.osot_membership_search_tools,
      target.osot_practice_promotion,
      target.osot_psychotherapy_supervision,
      target.osot_third_parties,
      target.osot_coto_status,
      target.osot_ot_grad_year,
      target.osot_ot_university,
      target.osot_ota_grad_year,
      target.osot_ota_college,
    ];

    for (const field of fields) {
      if (field && Array.isArray(field) && field.length > 0) {
        count++;
      }
    }

    return count;
  }
}
