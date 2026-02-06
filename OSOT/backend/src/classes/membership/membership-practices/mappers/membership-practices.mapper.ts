/**
 * Membership Practices Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized and local enums for type safety
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential practice data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions (4 local multi-select + 2 global enums)
 * - Proper OData bind handling for 1 optional lookup field (Account)
 * - Multi-select array ↔ string conversions for Dataverse
 *
 * KEY RESPONSIBILITIES:
 * - Transform Create/Update DTOs to Internal representation
 * - Transform Internal to Response DTOs for API output
 * - Transform Dataverse responses to Internal
 * - Transform Internal to Dataverse payloads
 * - Handle OData bind format conversions
 * - Convert multi-select arrays to/from comma-separated strings
 * - Validate practice data completeness
 * - Sanitize sensitive data for logging
 */

import { Privilege, AccessModifier } from '../../../../common/enums';
import { UpdateMembershipPracticesDto } from '../dtos/membership-practices-update.dto';
import { ResponseMembershipPracticesDto } from '../dtos/membership-practices-response.dto';
import { CreateMembershipPracticesDto } from '../dtos/membership-practices-create.dto';
import { MembershipPracticesInternal } from '../interfaces/membership-practices-internal.interface';
import { MembershipPracticesDataverse } from '../interfaces/membership-practices-dataverse.interface';
import {
  ClientsAge,
  getClientsAgeDisplayName,
} from '../enums/clients-age.enum';
import {
  PracticeArea,
  getPracticeAreaDisplayName,
} from '../enums/practice-area.enum';
import {
  PracticeSettings,
  getPracticeSettingsDisplayName,
} from '../enums/practice-settings.enum';
import {
  PracticeServices,
  getPracticeServicesDisplayName,
} from '../enums/practice-services.enum';
import { MEMBERSHIP_PRACTICES_FIELDS } from '../constants/membership-practices.constants';

// Export the ResponseDto type for external use
export { ResponseMembershipPracticesDto } from '../dtos/membership-practices-response.dto';

/**
 * Complete DTO with system-determined fields for practice creation
 * Used internally when controller enriches CreateDto with system fields
 */
export interface EnrichedCreateMembershipPracticesDto
  extends CreateMembershipPracticesDto {
  osot_membership_year: string; // SYSTEM-DEFINED from membership-settings (YYYY format)
  'osot_Table_Account@odata.bind'?: string;
  osot_privilege?: Privilege;
  osot_access_modifiers?: AccessModifier;
}

/**
 * Helper functions for enum conversions and data parsing
 */

/**
 * Convert string/number or array to ClientsAge enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 * BUSINESS REQUIRED: Must have at least one value
 */
function parseClientsAge(value: unknown): ClientsAge[] | undefined {
  if (value === null || value === undefined) return undefined;

  // Handle Dataverse comma-separated string format: "1,2,3"
  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) &&
            Object.values(ClientsAge).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is ClientsAge => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    // Single value string
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(ClientsAge).includes(numValue)) {
      return [numValue];
    }
  }

  // Handle array (internal format)
  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(ClientsAge).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) &&
            Object.values(ClientsAge).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is ClientsAge => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  // Handle single number value
  if (typeof value === 'number') {
    return Object.values(ClientsAge).includes(value) ? [value] : undefined;
  }

  return undefined;
}

/**
 * Convert string/number or array to PracticeArea enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parsePracticeArea(value: unknown): PracticeArea[] | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) &&
            Object.values(PracticeArea).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is PracticeArea => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(PracticeArea).includes(numValue)) {
      return [numValue];
    }
  }

  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(PracticeArea).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) &&
            Object.values(PracticeArea).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is PracticeArea => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  if (typeof value === 'number') {
    return Object.values(PracticeArea).includes(value) ? [value] : undefined;
  }

  return undefined;
}

/**
 * Convert string/number or array to PracticeSettings enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parsePracticeSettings(value: unknown): PracticeSettings[] | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) &&
            Object.values(PracticeSettings).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is PracticeSettings => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    const numValue = parseInt(value, 10);
    if (
      !isNaN(numValue) &&
      Object.values(PracticeSettings).includes(numValue)
    ) {
      return [numValue];
    }
  }

  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(PracticeSettings).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) &&
            Object.values(PracticeSettings).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is PracticeSettings => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  if (typeof value === 'number') {
    return Object.values(PracticeSettings).includes(value)
      ? [value]
      : undefined;
  }

  return undefined;
}

/**
 * Convert string/number or array to PracticeServices enum array (Multi-select)
 * Handles Dataverse comma-separated format: "1,2,3" -> [1, 2, 3]
 */
function parsePracticeServices(value: unknown): PracticeServices[] | undefined {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') {
    if (value.includes(',')) {
      const parsed = value
        .split(',')
        .map((v) => {
          const numValue = parseInt(v.trim(), 10);
          return !isNaN(numValue) &&
            Object.values(PracticeServices).includes(numValue)
            ? numValue
            : null;
        })
        .filter((v): v is PracticeServices => v !== null);

      return parsed.length > 0 ? parsed : undefined;
    }
    const numValue = parseInt(value, 10);
    if (
      !isNaN(numValue) &&
      Object.values(PracticeServices).includes(numValue)
    ) {
      return [numValue];
    }
  }

  if (Array.isArray(value)) {
    const parsed = value
      .map((v) => {
        if (typeof v === 'number') {
          return Object.values(PracticeServices).includes(v) ? v : null;
        }
        if (typeof v === 'string') {
          const numValue = parseInt(v, 10);
          return !isNaN(numValue) &&
            Object.values(PracticeServices).includes(numValue)
            ? numValue
            : null;
        }
        return null;
      })
      .filter((v): v is PracticeServices => v !== null);

    return parsed.length > 0 ? parsed : undefined;
  }

  if (typeof value === 'number') {
    return Object.values(PracticeServices).includes(value)
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
 * Membership Practices Mapper Class
 *
 * Handles all data transformations between different practice representations:
 * - DTOs ↔ Internal interfaces
 * - Dataverse responses ↔ Internal interfaces
 * - OData bind conversions for lookup
 * - Multi-select array ↔ comma-separated string conversions
 * - Data normalization and validation
 * - Type-safe enum conversions (6 enums total: 4 local multi-select + 2 global)
 * - Error handling for transformation failures
 *
 * Key Features:
 * - Type-safe transformations with enum validation
 * - OData bind handling for 1 optional lookup field (Account)
 * - Multi-select field conversions (ClientsAge, PracticeArea, PracticeSettings, PracticeServices)
 * - Practice ID format validation (osot-pra-NNNNNNN)
 * - Business rule validation integration (conditional _Other fields, required clients_age)
 * - Comprehensive error handling
 * - Integration with essential modules
 */
export class MembershipPracticesMapper {
  /**
   * Map CreateDto to Internal (overload for simple DTO)
   */
  static mapCreateDtoToInternal(
    dto: CreateMembershipPracticesDto,
  ): Partial<MembershipPracticesInternal>;

  /**
   * Map CreateDto to Internal (overload for enriched DTO)
   */
  static mapCreateDtoToInternal(
    dto: EnrichedCreateMembershipPracticesDto,
  ): MembershipPracticesInternal;

  /**
   * Map CreateDto to Internal (implementation)
   * Handles both simple and enriched DTOs
   */
  static mapCreateDtoToInternal(
    dto: CreateMembershipPracticesDto | EnrichedCreateMembershipPracticesDto,
  ): MembershipPracticesInternal | Partial<MembershipPracticesInternal> {
    const internal: Partial<MembershipPracticesInternal> = {
      osot_clients_age: dto.osot_clients_age, // BUSINESS REQUIRED
      osot_preceptor_declaration: dto.osot_preceptor_declaration,
      osot_practice_area: dto.osot_practice_area,
      osot_practice_settings: dto.osot_practice_settings,
      osot_practice_services: dto.osot_practice_services,
    };

    // Add membership year if provided (enriched DTO) - SYSTEM-DEFINED
    if ('osot_membership_year' in dto && dto.osot_membership_year) {
      internal.osot_membership_year = dto.osot_membership_year;
    }

    // Handle lookup field - convert OData bind to GUID (optional)
    if ('osot_Table_Account@odata.bind' in dto) {
      const accountBind = dto['osot_Table_Account@odata.bind'];
      if (accountBind) {
        internal.osot_table_account = extractGuidFromBind(accountBind);
      }
    }

    // Conditional "_Other" fields
    if (dto.osot_practice_settings_other !== undefined) {
      internal.osot_practice_settings_other = dto.osot_practice_settings_other;
    }
    if (dto.osot_practice_services_other !== undefined) {
      internal.osot_practice_services_other = dto.osot_practice_services_other;
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

    return internal as MembershipPracticesInternal;
  }

  /**
   * Map UpdateDto to partial Internal
   * Used when updating existing practice from API requests
   * Supports partial updates - only provided fields are included
   */
  static mapUpdateDtoToInternal(
    dto: UpdateMembershipPracticesDto,
  ): Partial<MembershipPracticesInternal> {
    const internal: Partial<MembershipPracticesInternal> = {};

    // Practice fields (all optional in update)
    if (dto.osot_preceptor_declaration !== undefined) {
      internal.osot_preceptor_declaration = dto.osot_preceptor_declaration;
    }
    if (dto.osot_clients_age !== undefined) {
      internal.osot_clients_age = dto.osot_clients_age;
    }
    if (dto.osot_practice_area !== undefined) {
      internal.osot_practice_area = dto.osot_practice_area;
    }
    if (dto.osot_practice_settings !== undefined) {
      internal.osot_practice_settings = dto.osot_practice_settings;
    }
    if (dto.osot_practice_services !== undefined) {
      internal.osot_practice_services = dto.osot_practice_services;
    }

    // Conditional "_Other" fields
    if (dto.osot_practice_settings_other !== undefined) {
      internal.osot_practice_settings_other = dto.osot_practice_settings_other;
    }
    if (dto.osot_practice_services_other !== undefined) {
      internal.osot_practice_services_other = dto.osot_practice_services_other;
    }

    return internal;
  }

  /**
   * Map Internal to ResponseDto
   * Used when returning practice data from API endpoints
   * Returns user-relevant fields (8 total: 7 practice + membership_year)
   * Converts enum arrays to string arrays with human-readable labels
   */
  static mapInternalToResponseDto(
    internal: MembershipPracticesInternal,
  ): ResponseMembershipPracticesDto {
    const response: ResponseMembershipPracticesDto = {
      osot_membership_year: internal.osot_membership_year,
      osot_preceptor_declaration: internal.osot_preceptor_declaration,
      osot_clients_age: internal.osot_clients_age.map((ca) =>
        getClientsAgeDisplayName(ca),
      ),
      osot_practice_area: internal.osot_practice_area?.map((pa) =>
        getPracticeAreaDisplayName(pa),
      ),
      osot_practice_settings: internal.osot_practice_settings?.map((ps) =>
        getPracticeSettingsDisplayName(ps),
      ),
      osot_practice_services: internal.osot_practice_services?.map((ps) =>
        getPracticeServicesDisplayName(ps),
      ),
    };

    // Conditional "_Other" fields
    if (internal.osot_practice_settings_other !== undefined) {
      response.osot_practice_settings_other =
        internal.osot_practice_settings_other;
    }
    if (internal.osot_practice_services_other !== undefined) {
      response.osot_practice_services_other =
        internal.osot_practice_services_other;
    }

    return response;
  }

  /**
   * Map Internal to Self-Service DTO (/me route)
   * Used specifically for GET /me endpoint
   * Returns user-relevant fields (8 total) - excludes system fields and lookups
   */
  static mapInternalToSelfServiceDto(
    internal: MembershipPracticesInternal,
  ): ResponseMembershipPracticesDto {
    // For practices, self-service DTO is identical to full response DTO
    // No sensitive data to exclude
    return this.mapInternalToResponseDto(internal);
  }

  /**
   * Map Dataverse response to Internal
   * Used when receiving data from Dataverse API
   * Handles multi-select comma-separated string to array conversion
   */
  static mapDataverseToInternal(
    dataverse: MembershipPracticesDataverse,
  ): MembershipPracticesInternal {
    return {
      // Primary key (GUID) - Required for updates
      osot_table_membership_practiceid:
        dataverse.osot_table_membership_practiceid,
      osot_practice_id: dataverse.osot_practice_id,
      osot_membership_year: dataverse.osot_membership_year,

      // Lookup field - Dataverse returns it directly as GUID (optional)
      osot_table_account: dataverse.osot_table_account,

      // Practice fields with enum parsing
      osot_preceptor_declaration: dataverse.osot_preceptor_declaration,
      osot_clients_age: parseClientsAge(dataverse.osot_clients_age), // BUSINESS REQUIRED
      osot_practice_area: parsePracticeArea(dataverse.osot_practice_area),
      osot_practice_settings: parsePracticeSettings(
        dataverse.osot_practice_settings,
      ),
      osot_practice_services: parsePracticeServices(
        dataverse.osot_practice_services,
      ),

      // Conditional "_Other" fields
      osot_practice_settings_other: dataverse.osot_practice_settings_other,
      osot_practice_services_other: dataverse.osot_practice_services_other,

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
   * Converts multi-select arrays to comma-separated strings
   * Converts lookup GUID to OData bind format
   */
  static mapInternalToDataverse(
    internal: MembershipPracticesInternal,
    isUpdate = false,
  ): Partial<MembershipPracticesDataverse> {
    const payload: Partial<MembershipPracticesDataverse> = {};

    // Primary key (only for updates)
    if (isUpdate && internal.osot_practice_id !== undefined) {
      payload.osot_practice_id = internal.osot_practice_id;
    }

    // Membership year (SYSTEM-DEFINED, should not be in updates)
    if (internal.osot_membership_year !== undefined && !isUpdate) {
      payload.osot_membership_year = internal.osot_membership_year;
    }

    // Lookup field - convert to OData bind format (optional)
    if (internal.osot_table_account !== undefined) {
      payload[MEMBERSHIP_PRACTICES_FIELDS.ACCOUNT_BIND] = createODataBind(
        'osot_table_accounts',
        internal.osot_table_account,
      );
    }

    // Boolean field
    if (internal.osot_preceptor_declaration !== undefined) {
      payload.osot_preceptor_declaration = internal.osot_preceptor_declaration;
    }

    // Multi-select fields - convert arrays to comma-separated strings
    if (internal.osot_clients_age !== undefined) {
      // BUSINESS REQUIRED - must have values
      payload.osot_clients_age = Array.isArray(internal.osot_clients_age)
        ? internal.osot_clients_age.join(',')
        : String(internal.osot_clients_age);
    }

    if (internal.osot_practice_area !== undefined) {
      payload.osot_practice_area = Array.isArray(internal.osot_practice_area)
        ? internal.osot_practice_area.join(',')
        : String(internal.osot_practice_area);
    }

    if (internal.osot_practice_settings !== undefined) {
      payload.osot_practice_settings = Array.isArray(
        internal.osot_practice_settings,
      )
        ? internal.osot_practice_settings.join(',')
        : String(internal.osot_practice_settings);
    }

    if (internal.osot_practice_services !== undefined) {
      payload.osot_practice_services = Array.isArray(
        internal.osot_practice_services,
      )
        ? internal.osot_practice_services.join(',')
        : String(internal.osot_practice_services);
    }

    // Conditional "_Other" fields
    if (internal.osot_practice_settings_other !== undefined) {
      payload.osot_practice_settings_other =
        internal.osot_practice_settings_other;
    }
    if (internal.osot_practice_services_other !== undefined) {
      payload.osot_practice_services_other =
        internal.osot_practice_services_other;
    }

    // Access control fields
    if (internal.osot_privilege !== undefined) {
      payload[MEMBERSHIP_PRACTICES_FIELDS.PRIVILEGE] = internal.osot_privilege;
    }
    if (internal.osot_access_modifiers !== undefined) {
      payload[MEMBERSHIP_PRACTICES_FIELDS.ACCESS_MODIFIERS] =
        internal.osot_access_modifiers;
    }

    return payload;
  }

  /**
   * Validate practice data for completeness
   * Returns validation errors if any required fields are missing or invalid
   */
  static validatePracticeData(
    practice: Partial<MembershipPracticesInternal>,
  ): string[] {
    const errors: string[] = [];

    // Check required membership year
    if (!practice.osot_membership_year) {
      errors.push('Membership year is required');
    } else {
      // Validate year format (4 digits)
      if (!/^\d{4}$/.test(practice.osot_membership_year)) {
        errors.push('Membership year must be a 4-digit year (YYYY)');
      }
    }

    // Validate BUSINESS REQUIRED field: clients_age
    if (!practice.osot_clients_age || practice.osot_clients_age.length === 0) {
      errors.push('Clients age is required and must have at least one value');
    }

    // Validate conditional "_Other" fields
    if (
      practice.osot_practice_settings?.includes(PracticeSettings.OTHER) &&
      !practice.osot_practice_settings_other
    ) {
      errors.push(
        'Practice settings other is required when settings include OTHER',
      );
    }
    if (
      practice.osot_practice_services?.includes(PracticeServices.OTHER) &&
      !practice.osot_practice_services_other
    ) {
      errors.push(
        'Practice services other is required when services include OTHER',
      );
    }

    // Validate enum values if provided
    if (practice.osot_clients_age !== undefined) {
      if (!Array.isArray(practice.osot_clients_age)) {
        errors.push('Clients age must be an array');
      } else {
        const invalidValues = practice.osot_clients_age.filter(
          (val) => !Object.values(ClientsAge).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid clients age value(s)');
        }
      }
    }

    if (practice.osot_practice_area !== undefined) {
      if (!Array.isArray(practice.osot_practice_area)) {
        errors.push('Practice area must be an array');
      } else {
        const invalidValues = practice.osot_practice_area.filter(
          (val) => !Object.values(PracticeArea).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid practice area value(s)');
        }
      }
    }

    if (practice.osot_practice_settings !== undefined) {
      if (!Array.isArray(practice.osot_practice_settings)) {
        errors.push('Practice settings must be an array');
      } else {
        const invalidValues = practice.osot_practice_settings.filter(
          (val) => !Object.values(PracticeSettings).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid practice settings value(s)');
        }
      }
    }

    if (practice.osot_practice_services !== undefined) {
      if (!Array.isArray(practice.osot_practice_services)) {
        errors.push('Practice services must be an array');
      } else {
        const invalidValues = practice.osot_practice_services.filter(
          (val) => !Object.values(PracticeServices).includes(val),
        );
        if (invalidValues.length > 0) {
          errors.push('Invalid practice services value(s)');
        }
      }
    }

    return errors;
  }

  /**
   * Sanitize practice data by removing sensitive fields
   * Used when preparing data for logging or external systems
   */
  static sanitizePracticeData(
    practice: MembershipPracticesInternal,
  ): Partial<MembershipPracticesInternal> {
    const sanitized: Partial<MembershipPracticesInternal> = {
      osot_practice_id: practice.osot_practice_id,
      osot_membership_year: practice.osot_membership_year,
      osot_preceptor_declaration: practice.osot_preceptor_declaration,
      osot_clients_age: practice.osot_clients_age,
      osot_practice_area: practice.osot_practice_area,
      osot_practice_settings: practice.osot_practice_settings,
      osot_practice_services: practice.osot_practice_services,
      createdon: practice.createdon,
      modifiedon: practice.modifiedon,
    };

    // Exclude lookup GUID (user reference)
    // Exclude conditional "_Other" fields (may contain PII)

    return sanitized;
  }
}
