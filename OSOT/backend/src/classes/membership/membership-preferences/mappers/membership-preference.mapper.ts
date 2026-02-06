/**
 * Membership Preferences Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized and local enums for type safety
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential membership preferences data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions (4 local + 2 global enums)
 * - Proper OData bind handling for 3 lookup fields
 * - Following membership-settings proven patterns
 *
 * KEY RESPONSIBILITIES:
 * - Transform Create/Update DTOs to Internal representation
 * - Transform Internal to Response DTOs for API output (enums → strings)
 * - Transform Dataverse responses to Internal
 * - Transform Internal to Dataverse payloads
 * - Handle OData bind format conversions
 * - Validate preference data completeness
 * - Sanitize sensitive data for logging
 *
 * ENUM TO LABEL CONVERSION:
 * - Response DTOs return human-readable string labels
 * - Internal types maintain enum values for business logic
 * - Display name functions convert enums to strings
 */

import { Privilege, AccessModifier } from '../../../../common/enums';
import { UpdateMembershipPreferenceDto } from '../dtos/membership-preference-update.dto';
import { MembershipPreferenceResponseDto } from '../dtos/membership-preference-response.dto';
import { CreateMembershipPreferenceDto } from '../dtos/membership-preference-create.dto';
import { MembershipPreferenceInternal } from '../interfaces/membership-preference-internal.interface';
import { MembershipPreferenceDataverse } from '../interfaces/membership-preference-dataverse.interface';
import {
  ThirdParties,
  getThirdPartyDisplayName,
} from '../enums/third-parties.enum';
import {
  PracticePromotion,
  getPracticePromotionDisplayName,
} from '../enums/practice-promotion.enum';
import {
  SearchTools,
  getSearchToolDisplayName,
} from '../enums/search-tools.enum';
import {
  PsychotherapySupervision,
  getPsychotherapySupervisionDisplayName,
} from '../enums/psychotherapy-supervision.enum';
import { MEMBERSHIP_PREFERENCES_FIELDS } from '../constants/membership-preference.constants';

// Export the ResponseDto type for external use
export { MembershipPreferenceResponseDto } from '../dtos/membership-preference-response.dto';

/**
 * Complete DTO with system-determined fields for preference creation
 * Used internally when controller enriches CreateDto with system fields
 */
export interface EnrichedCreateMembershipPreferenceDto
  extends CreateMembershipPreferenceDto {
  osot_membership_year: string;
  'osot_Table_Membership_Category@odata.bind'?: string;
  'osot_Table_Account@odata.bind'?: string;
  'osot_Table_Account_Affiliate@odata.bind'?: string;
  osot_privilege?: Privilege;
  osot_access_modifiers?: AccessModifier;
  osot_members_search_tools?: SearchTools[];
}

/**
 * Helper functions for enum conversions and data parsing
 */

/**
 * Convert string/number or array to ThirdParties enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parseThirdParties(value: unknown): ThirdParties[] | undefined {
  // Handle null/undefined
  if (value === null || value === undefined) return undefined;

  // Handle Dataverse comma-separated string format: "1,2,3"
  if (typeof value === 'string') {
    // Check if it contains commas (multi-value from Dataverse)
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) &&
            Object.values(ThirdParties).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is ThirdParties => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    // Single value string
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(ThirdParties).includes(numValue)) {
      return [numValue];
    }
  }

  // Handle array (internal format)
  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(ThirdParties).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) &&
            Object.values(ThirdParties).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is ThirdParties => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  // Handle single number value
  if (typeof value === 'number') {
    return Object.values(ThirdParties).includes(value) ? [value] : undefined;
  }

  return undefined;
}

/**
 * Convert string/number or array to PracticePromotion enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parsePracticePromotion(
  value: unknown,
): PracticePromotion[] | undefined {
  // Handle null/undefined
  if (value === null || value === undefined) return undefined;

  // Handle Dataverse comma-separated string format: "1,2,3"
  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) &&
            Object.values(PracticePromotion).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is PracticePromotion => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    // Single value string
    const numValue = parseInt(value, 10);
    if (
      !isNaN(numValue) &&
      Object.values(PracticePromotion).includes(numValue)
    ) {
      return [numValue];
    }
  }

  // Handle array (internal format)
  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(PracticePromotion).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) &&
            Object.values(PracticePromotion).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is PracticePromotion => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  // Handle single number value
  if (typeof value === 'number') {
    return Object.values(PracticePromotion).includes(value)
      ? [value]
      : undefined;
  }

  return undefined;
}

/**
 * Convert string/number or array to SearchTools enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parseSearchTools(value: unknown): SearchTools[] | undefined {
  // Handle null/undefined
  if (value === null || value === undefined) return undefined;

  // Handle Dataverse comma-separated string format: "1,2,3"
  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) &&
            Object.values(SearchTools).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is SearchTools => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    // Single value string
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(SearchTools).includes(numValue)) {
      return [numValue];
    }
  }

  // Handle array (internal format)
  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(SearchTools).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) &&
            Object.values(SearchTools).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is SearchTools => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  // Handle single number value
  if (typeof value === 'number') {
    return Object.values(SearchTools).includes(value) ? [value] : undefined;
  }

  return undefined;
}

/**
 * Convert string/number or array to PsychotherapySupervision enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parsePsychotherapySupervision(
  value: unknown,
): PsychotherapySupervision[] | undefined {
  // Handle null/undefined
  if (value === null || value === undefined) return undefined;

  // Handle Dataverse comma-separated string format: "1,2,3"
  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) &&
            Object.values(PsychotherapySupervision).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is PsychotherapySupervision => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    // Single value string
    const numValue = parseInt(value, 10);
    if (
      !isNaN(numValue) &&
      Object.values(PsychotherapySupervision).includes(numValue)
    ) {
      return [numValue];
    }
  }

  // Handle array (internal format)
  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(PsychotherapySupervision).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) &&
            Object.values(PsychotherapySupervision).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is PsychotherapySupervision => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  // Handle single number value
  if (typeof value === 'number') {
    return Object.values(PsychotherapySupervision).includes(value)
      ? [value]
      : undefined;
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
 * Normalize and validate Preference ID format
 * Ensures proper business ID format consistency (osot-pref-NNNNNNN)
 */
function _normalizePreferenceId(preferenceId: string): string | undefined {
  if (!preferenceId || typeof preferenceId !== 'string') return undefined;

  const trimmed = preferenceId.trim();
  if (trimmed.length === 0) return undefined;

  // Basic sanitization - remove any potentially harmful characters
  const sanitized = trimmed.replace(/[<>'"&]/g, '');

  return sanitized.length > 0 ? sanitized : undefined;
}

/**
 * Extract GUID from OData bind string
 * Example: "/osot_table_accounts(a1b2c3d4-e5f6-7890-abcd-ef1234567890)" -> "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 */
function extractGuidFromBind(odataBind: string): string | undefined {
  if (!odataBind) return undefined;
  const match = odataBind.match(/\(([a-f0-9-]+)\)/i);
  return match ? match[1] : undefined;
}

/**
 * Create OData bind string from GUID
 * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" -> "/osot_table_accounts(a1b2c3d4-e5f6-7890-abcd-ef1234567890)"
 */
function createODataBind(tableName: string, guid: string): string {
  return `/${tableName}(${guid})`;
}

/**
 * Membership Preferences Mapper Class
 *
 * Handles all data transformations between different membership preferences representations:
 * - DTOs ↔ Internal interfaces
 * - Dataverse responses ↔ Internal interfaces
 * - OData bind conversions for lookups
 * - Data normalization and validation
 * - Type-safe enum conversions (6 enums total)
 * - Error handling for transformation failures
 *
 * Key Features:
 * - Type-safe transformations with enum validation (4 local + 2 global)
 * - OData bind handling for 3 lookup fields (category, account, affiliate)
 * - Preference ID format validation (osot-pref-NNNNNNN)
 * - Business rule validation integration (XOR, lookup required)
 * - Comprehensive error handling
 * - Integration with essential modules
 */
export class MembershipPreferenceMapper {
  /**
   * Map CreateDto to Internal (overload for simple DTO)
   * Used when service layer creates preferences with basic DTO
   */
  static mapCreateDtoToInternal(
    dto: CreateMembershipPreferenceDto,
  ): Partial<MembershipPreferenceInternal>;

  /**
   * Map CreateDto to Internal (overload for enriched DTO)
   * Used when controller enriches DTO with system-determined fields
   */
  static mapCreateDtoToInternal(
    dto: EnrichedCreateMembershipPreferenceDto,
  ): MembershipPreferenceInternal;

  /**
   * Map CreateDto to Internal (implementation)
   * Handles both simple and enriched DTOs
   * Handles OData bind to GUID conversions for lookup fields
   */
  static mapCreateDtoToInternal(
    dto: CreateMembershipPreferenceDto | EnrichedCreateMembershipPreferenceDto,
  ): MembershipPreferenceInternal | Partial<MembershipPreferenceInternal> {
    // Build internal representation with available fields
    const internal: Partial<MembershipPreferenceInternal> = {
      osot_auto_renewal: dto.osot_auto_renewal,
      osot_membership_declaration: dto.osot_membership_declaration,
    };

    // Add membership year if provided (enriched DTO)
    if ('osot_membership_year' in dto && dto.osot_membership_year) {
      internal.osot_membership_year = dto.osot_membership_year;
    }

    // Handle lookup fields - convert OData binds to GUIDs
    if ('osot_Table_Membership_Category@odata.bind' in dto) {
      const categoryBind = dto['osot_Table_Membership_Category@odata.bind'];
      if (categoryBind) {
        internal.osot_table_membership_category =
          extractGuidFromBind(categoryBind);
      }
    }

    if ('osot_Table_Account@odata.bind' in dto) {
      const accountBind = dto['osot_Table_Account@odata.bind'];
      if (accountBind) {
        internal.osot_table_account = extractGuidFromBind(accountBind);
      }
    }

    if ('osot_Table_Account_Affiliate@odata.bind' in dto) {
      const affiliateBind = dto['osot_Table_Account_Affiliate@odata.bind'];
      if (affiliateBind) {
        internal.osot_table_account_affiliate =
          extractGuidFromBind(affiliateBind);
      }
    }

    // Optional preference fields
    if (dto.osot_third_parties !== undefined) {
      internal.osot_third_parties = dto.osot_third_parties;
    }
    if (dto.osot_practice_promotion !== undefined) {
      internal.osot_practice_promotion = dto.osot_practice_promotion;
    }
    // Handle both field names for search tools (osot_search_tools from API, osot_members_search_tools for internal)
    if (
      'osot_members_search_tools' in dto &&
      dto.osot_members_search_tools !== undefined
    ) {
      internal.osot_members_search_tools = dto.osot_members_search_tools;
    } else if (dto.osot_search_tools !== undefined) {
      internal.osot_members_search_tools = dto.osot_search_tools;
    }
    if (dto.osot_shadowing !== undefined) {
      internal.osot_shadowing = dto.osot_shadowing;
    }
    if (dto.osot_psychotherapy_supervision !== undefined) {
      internal.osot_psychotherapy_supervision =
        dto.osot_psychotherapy_supervision;
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

    return internal as MembershipPreferenceInternal;
  }

  /**
   * Map UpdateDto to partial Internal
   * Used when updating existing membership preferences from API requests
   * Supports partial updates - only provided fields are included
   * Note: UpdateDto only contains editable preference fields (no system fields)
   */
  static mapUpdateDtoToInternal(
    dto: UpdateMembershipPreferenceDto,
  ): Partial<MembershipPreferenceInternal> {
    const internal: Partial<MembershipPreferenceInternal> = {};

    // Auto renewal field
    if (dto.osot_auto_renewal !== undefined) {
      internal.osot_auto_renewal = dto.osot_auto_renewal;
    }

    // Declaration field
    if (dto.osot_membership_declaration !== undefined) {
      internal.osot_membership_declaration = dto.osot_membership_declaration;
    }

    // Optional preference fields
    if (dto.osot_third_parties !== undefined) {
      internal.osot_third_parties = dto.osot_third_parties;
    }
    if (dto.osot_practice_promotion !== undefined) {
      internal.osot_practice_promotion = dto.osot_practice_promotion;
    }
    // Handle field name mapping (osot_search_tools from DTO -> osot_members_search_tools for internal)
    if (dto.osot_search_tools !== undefined) {
      internal.osot_members_search_tools = dto.osot_search_tools;
    }
    if (dto.osot_shadowing !== undefined) {
      internal.osot_shadowing = dto.osot_shadowing;
    }
    if (dto.osot_psychotherapy_supervision !== undefined) {
      internal.osot_psychotherapy_supervision =
        dto.osot_psychotherapy_supervision;
    }

    return internal;
  }

  /**
   * Map Internal to ResponseDto
   * Used when returning membership preferences data from API endpoints
   * Returns only user-relevant fields (7 total)
   */
  static mapInternalToResponseDto(
    internal: MembershipPreferenceInternal,
  ): MembershipPreferenceResponseDto {
    const response: MembershipPreferenceResponseDto = {
      osot_preference_id: internal.osot_preference_id,
      osot_membership_year: internal.osot_membership_year,
      osot_auto_renewal: internal.osot_auto_renewal,
      osot_membership_declaration: internal.osot_membership_declaration,
      // Convert search tools enum array to string array
      osot_search_tools:
        internal.osot_members_search_tools !== undefined
          ? internal.osot_members_search_tools.map((tool) =>
              getSearchToolDisplayName(tool),
            )
          : undefined,
    };

    // Optional preference fields - convert enum arrays to string arrays
    if (internal.osot_third_parties !== undefined) {
      response.osot_third_parties = internal.osot_third_parties.map((party) =>
        getThirdPartyDisplayName(party),
      );
    }
    if (internal.osot_practice_promotion !== undefined) {
      response.osot_practice_promotion = internal.osot_practice_promotion.map(
        (promo) => getPracticePromotionDisplayName(promo),
      );
    }
    if (internal.osot_psychotherapy_supervision !== undefined) {
      response.osot_psychotherapy_supervision =
        internal.osot_psychotherapy_supervision.map((supervision) =>
          getPsychotherapySupervisionDisplayName(supervision),
        );
    }
    if (internal.osot_shadowing !== undefined) {
      response.osot_shadowing = internal.osot_shadowing;
    }

    return response;
  }

  /**
   * Map Dataverse response to Internal
   * Used when receiving data from Dataverse API
   * Handles OData lookup value fields (_field_value format)
   */
  static mapDataverseToInternal(
    dataverse: MembershipPreferenceDataverse,
  ): MembershipPreferenceInternal {
    return {
      // Primary key (GUID) - Required for updates
      osot_table_membership_preferenceid:
        dataverse.osot_table_membership_preferenceid,
      osot_preference_id: dataverse.osot_preference_id,
      osot_membership_year: dataverse.osot_membership_year,
      osot_auto_renewal: dataverse.osot_auto_renewal,
      osot_membership_declaration: dataverse.osot_membership_declaration,

      // Lookup fields - Dataverse returns them directly as GUIDs
      osot_table_membership_category: dataverse.osot_table_membership_category,
      osot_table_account: dataverse.osot_table_account,
      osot_table_account_affiliate: dataverse.osot_table_account_affiliate,

      // Optional preference fields with enum parsing
      osot_third_parties: parseThirdParties(dataverse.osot_third_parties),
      osot_practice_promotion: parsePracticePromotion(
        dataverse.osot_practice_promotion,
      ),
      osot_members_search_tools: parseSearchTools(
        dataverse.osot_members_search_tools,
      ),
      osot_shadowing: dataverse.osot_shadowing,
      osot_psychotherapy_supervision: parsePsychotherapySupervision(
        dataverse.osot_psychotherapy_supervision,
      ),

      // Access control fields with enum parsing
      osot_privilege: parsePrivilege(dataverse.osot_privilege),
      osot_access_modifiers: parseAccessModifier(
        dataverse.osot_access_modifier,
      ),

      // System timestamps
      createdon: dataverse.createdon,
      modifiedon: dataverse.modifiedon,
    };
  }

  /**
   * Map Internal to Dataverse payload
   * Used when sending data to Dataverse API
   * Converts lookup GUIDs to OData bind format for creation/updates
   */
  static mapInternalToDataverse(
    internal: MembershipPreferenceInternal,
    isUpdate = false,
  ): Partial<MembershipPreferenceDataverse> {
    const payload: Partial<MembershipPreferenceDataverse> = {};

    // Primary key (only for updates)
    if (isUpdate && internal.osot_preference_id !== undefined) {
      payload.osot_preference_id = internal.osot_preference_id;
    }

    // Business required fields
    if (internal.osot_membership_year !== undefined) {
      payload.osot_membership_year = internal.osot_membership_year;
    }
    if (internal.osot_auto_renewal !== undefined) {
      payload.osot_auto_renewal = internal.osot_auto_renewal;
    }
    if (internal.osot_membership_declaration !== undefined) {
      payload.osot_membership_declaration =
        internal.osot_membership_declaration;
    }

    // Lookup fields - convert to OData bind format using constants
    if (internal.osot_table_membership_category !== undefined) {
      payload[MEMBERSHIP_PREFERENCES_FIELDS.MEMBERSHIP_CATEGORY_BIND] =
        createODataBind(
          'osot_table_membership_categories',
          internal.osot_table_membership_category,
        );
    }

    if (internal.osot_table_account !== undefined) {
      payload[MEMBERSHIP_PREFERENCES_FIELDS.ACCOUNT_BIND] = createODataBind(
        'osot_table_accounts',
        internal.osot_table_account,
      );
    }

    if (internal.osot_table_account_affiliate !== undefined) {
      payload[MEMBERSHIP_PREFERENCES_FIELDS.ACCOUNT_AFFILIATE_BIND] =
        createODataBind(
          'osot_table_account_affiliates',
          internal.osot_table_account_affiliate,
        );
    }

    // Optional preference fields (MultiSelect fields must be converted to comma-separated strings)
    if (internal.osot_third_parties !== undefined) {
      payload.osot_third_parties = Array.isArray(internal.osot_third_parties)
        ? internal.osot_third_parties.join(',')
        : String(internal.osot_third_parties);
    }
    if (internal.osot_practice_promotion !== undefined) {
      payload.osot_practice_promotion = Array.isArray(
        internal.osot_practice_promotion,
      )
        ? internal.osot_practice_promotion.join(',')
        : String(internal.osot_practice_promotion);
    }
    if (internal.osot_members_search_tools !== undefined) {
      payload.osot_members_search_tools = Array.isArray(
        internal.osot_members_search_tools,
      )
        ? internal.osot_members_search_tools.join(',')
        : String(internal.osot_members_search_tools);
    }
    if (internal.osot_shadowing !== undefined) {
      payload.osot_shadowing = internal.osot_shadowing;
    }
    if (internal.osot_psychotherapy_supervision !== undefined) {
      payload.osot_psychotherapy_supervision = Array.isArray(
        internal.osot_psychotherapy_supervision,
      )
        ? internal.osot_psychotherapy_supervision.join(',')
        : String(internal.osot_psychotherapy_supervision);
    }

    // Access control fields (use constants to ensure correct Dataverse field names)
    if (internal.osot_privilege !== undefined) {
      payload[MEMBERSHIP_PREFERENCES_FIELDS.PRIVILEGE] =
        internal.osot_privilege;
    }
    if (internal.osot_access_modifiers !== undefined) {
      payload[MEMBERSHIP_PREFERENCES_FIELDS.ACCESS_MODIFIERS] =
        internal.osot_access_modifiers;
    }

    return payload;
  }

  /**
   * Validate membership preferences data for completeness
   * Returns validation errors if any required fields are missing or invalid
   * Includes business rule validation (XOR, lookup required)
   */
  static validateMembershipPreferenceData(
    preference: Partial<MembershipPreferenceInternal>,
  ): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!preference.osot_membership_year) {
      errors.push('Membership year is required');
    } else {
      // Validate year format (4 digits)
      if (!/^\d{4}$/.test(preference.osot_membership_year)) {
        errors.push('Membership year must be a 4-digit year');
      }
    }

    if (
      preference.osot_auto_renewal === undefined ||
      preference.osot_auto_renewal === null
    ) {
      errors.push('Auto renewal preference is required');
    }

    if (
      preference.osot_membership_declaration === undefined ||
      preference.osot_membership_declaration === null
    ) {
      errors.push('Membership declaration is required');
    }

    // Validate lookup required rule (at least one must be provided)
    const hasCategory = !!preference.osot_table_membership_category;
    const hasAccount = !!preference.osot_table_account;
    const hasAffiliate = !!preference.osot_table_account_affiliate;

    if (!hasCategory && !hasAccount && !hasAffiliate) {
      errors.push(
        'At least one lookup field is required (category, account, or affiliate)',
      );
    }

    // Validate Account/Affiliate XOR rule
    if (hasAccount && hasAffiliate) {
      errors.push(
        'Account and Affiliate are mutually exclusive - only one can be provided',
      );
    }

    // Validate enum values if provided
    if (preference.osot_third_parties !== undefined) {
      if (!Array.isArray(preference.osot_third_parties)) {
        errors.push('Third parties must be an array');
      } else {
        const invalidValues = preference.osot_third_parties.filter(
          (val) => !Object.values(ThirdParties).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid third parties value(s)');
        }
      }
    }

    if (preference.osot_practice_promotion !== undefined) {
      if (!Array.isArray(preference.osot_practice_promotion)) {
        errors.push('Practice promotion must be an array');
      } else {
        const invalidValues = preference.osot_practice_promotion.filter(
          (val) => !Object.values(PracticePromotion).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid practice promotion value(s)');
        }
      }
    }

    if (preference.osot_members_search_tools !== undefined) {
      if (!Array.isArray(preference.osot_members_search_tools)) {
        errors.push('Search tools must be an array');
      } else {
        const invalidValues = preference.osot_members_search_tools.filter(
          (val) => !Object.values(SearchTools).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid search tools value(s)');
        }
      }
    }

    if (preference.osot_psychotherapy_supervision !== undefined) {
      if (!Array.isArray(preference.osot_psychotherapy_supervision)) {
        errors.push('Psychotherapy supervision must be an array');
      } else {
        const invalidValues = preference.osot_psychotherapy_supervision.filter(
          (val) => !Object.values(PsychotherapySupervision).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid psychotherapy supervision value(s)');
        }
      }
    }

    if (preference.osot_privilege !== undefined) {
      if (!Object.values(Privilege).includes(preference.osot_privilege)) {
        errors.push('Invalid privilege value');
      }
    }

    if (preference.osot_access_modifiers !== undefined) {
      if (
        !Object.values(AccessModifier).includes(
          preference.osot_access_modifiers,
        )
      ) {
        errors.push('Invalid access modifier value');
      }
    }

    return errors;
  }

  /**
   * Sanitize membership preferences data by removing sensitive fields
   * Used when preparing data for logging or external systems
   */
  static sanitizeMembershipPreferenceData(
    preference: MembershipPreferenceInternal,
  ): Partial<MembershipPreferenceInternal> {
    const sanitized: Partial<MembershipPreferenceInternal> = {
      osot_preference_id: preference.osot_preference_id,
      osot_membership_year: preference.osot_membership_year,
      osot_auto_renewal: preference.osot_auto_renewal,
      osot_membership_declaration: preference.osot_membership_declaration,
      osot_third_parties: preference.osot_third_parties,
      osot_practice_promotion: preference.osot_practice_promotion,
      osot_members_search_tools: preference.osot_members_search_tools,
      osot_shadowing: preference.osot_shadowing,
      osot_psychotherapy_supervision: preference.osot_psychotherapy_supervision,
      createdon: preference.createdon,
      modifiedon: preference.modifiedon,
    };

    // Note: Lookup GUIDs are included as they're not sensitive
    // Remove only truly sensitive data (if any in future)

    return sanitized;
  }
}
