/**
 * Additional Insured Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - DTOs: CreateAdditionalInsuredDto, UpdateAdditionalInsuredDto, AdditionalInsuredResponseDto
 * - Interfaces: Internal (app model), Dataverse (API contract)
 * - Enums: Choice values for city, province, privilege, access_modifiers
 *
 * CRITICAL RESPONSIBILITIES:
 * - Transform Create/Update DTOs to Internal representation
 * - Transform Internal to Response DTOs for API output
 * - Transform Dataverse responses to Internal
 * - Transform Internal to Dataverse payloads
 * - Handle OData @odata.bind for relationship lookups (Insurance)
 * - Handle choice ID conversions (numeric ↔ string)
 * - Handle postal code normalization (spaces, uppercase)
 * - Handle company name normalization (uppercase)
 * - Convert dates between ISO 8601 strings (Dataverse) and Date objects (Internal)
 * - Validate snapshot field immutability (city, province - inherited from insurance)
 *
 * SNAPSHOT FIELDS (2 immutable - inherited from Insurance):
 * - osot_city: Copied from parent Insurance
 * - osot_province: Copied from parent Insurance
 *
 * CHOICE FIELD HANDLING:
 * - Dataverse: Numeric choice IDs (1=Owner, 2=Admin, 3=Main)
 * - Internal: Numeric choice IDs (same as Dataverse)
 * - Response: String display names (Owner, Admin, Main)
 * - DTO: String for API consumption
 *
 * POSTAL CODE NORMALIZATION:
 * - Storage: K1A0A6 (uppercase, no spaces)
 * - Write to Dataverse: K1A0A6 (remove spaces, uppercase)
 * - Read from Dataverse: K1A0A6 (as stored)
 * - Response to API: K1A 0A6 (formatted with space)
 * - Format pattern: A#A#A# → A#A #A# (Canadian format)
 *
 * COMPANY NAME NORMALIZATION:
 * - Storage: ABC CORPORATION (uppercase)
 * - Write: ABC CORPORATION (normalize to uppercase)
 * - Read: ABC CORPORATION (as stored)
 *
 * ODATA BIND PATTERN for Relationships:
 * - Create payload: osot_Table_Insurance@odata.bind: "/osot_table_insurances(guid)"
 * - Response includes: _osot_table_insurance_value: "guid" (read-only lookup value)
 * - Mapper converts between both formats via createOdataBind() helper
 *
 * @file additional-insured.mapper.ts
 * @module AdditionalInsuredModule
 * @layer Mappers
 */

import { CreateAdditionalInsuredDto } from '../dtos/create-additional-insured.dto';
import { UpdateAdditionalInsuredDto } from '../dtos/update-additional-insured.dto';
import { AdditionalInsuredResponseDto } from '../dtos/additional-insured-response.dto';
import { AdditionalInsuredInternal } from '../interfaces/additional-insured-internal.interface';
import { AdditionalInsuredDataverse } from '../interfaces/additional-insured-dataverse.interface';

export { AdditionalInsuredResponseDto } from '../dtos/additional-insured-response.dto';

/**
 * Helper Functions for Data Conversions
 */

/**
 * Convert ISO 8601 string to Date object
 * Handles null/undefined safely
 * Example: '2026-01-29T10:30:00Z' -> Date object
 */
function parseIsoDate(dateString: string | undefined): Date | undefined {
  if (!dateString) return undefined;
  return new Date(dateString);
}

/**
 * Convert Date object to ISO 8601 string
 * Handles null/undefined safely
 * Example: Date object -> '2026-01-29T10:30:00Z'
 */
function toIsoString(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  return date.toISOString();
}

/**
 * Create OData @odata.bind string from GUID
 * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890" -> "/osot_table_insurances(a1b2c3d4-e5f6-7890-abcd-ef1234567890)"
 *
 * IMPORTANT: Entity name must match Dataverse OData endpoint naming (plural form)
 * Examples:
 * - 'insurances' → /osot_table_insurances(guid)
 * - 'accounts' → /osot_table_accounts(guid)
 * - 'organizations' → /osot_table_organizations(guid)
 */
function createOdataBind(
  entityPlural: string,
  guid: string | undefined,
): string | undefined {
  if (!guid) return undefined;
  return `/osot_table_${entityPlural}(${guid})`;
}

/**
 * Normalize company name to UPPERCASE
 * Example: "ABC Corporation" -> "ABC CORPORATION"
 */
function normalizeCompanyName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  return name.trim().toUpperCase();
}

/**
 * Normalize postal code: remove spaces and uppercase
 * Write to storage: "K1A 0A6" -> "K1A0A6"
 */
function normalizePostalCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  return code.trim().toUpperCase().replace(/\s/g, '');
}

/**
 * Format postal code for display: add space in middle
 * Read from storage: "K1A0A6" -> "K1A 0A6"
 */
function formatPostalCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  const normalized = code.trim().toUpperCase().replace(/\s/g, '');
  if (normalized.length === 6) {
    return `${normalized.slice(0, 3)} ${normalized.slice(3)}`;
  }
  return normalized;
}

/**
 * Additional Insured Mapper Class
 * Handles bidirectional transformations between DTOs, Internal, and Dataverse formats
 */
export class AdditionalInsuredMapper {
  /**
   * Transform CreateAdditionalInsuredDto to AdditionalInsuredInternal
   *
   * Purpose: Convert API request data to internal domain model
   * Handles: Company name normalization, postal code normalization, GUID extraction
   *
   * @param dto - Create request DTO with all required fields
   * @returns Partial<AdditionalInsuredInternal> - Internal domain representation ready for business rules
   */
  static createDtoToInternal(
    dto: CreateAdditionalInsuredDto,
  ): Partial<AdditionalInsuredInternal> {
    return {
      // ========================================
      // REQUIRED RELATIONSHIP FIELDS (from DTO)
      // ========================================
      insuranceGuid: dto.insuranceGuid,
      // organizationGuid will be added by service layer from JWT

      // ========================================
      // COMPANY INFORMATION (from DTO, with normalization)
      // ========================================
      osot_company_name: normalizeCompanyName(dto.osot_company_name) || '',
      osot_address: dto.osot_address.trim(),
      osot_city: dto.osot_city,
      osot_province: dto.osot_province,
      osot_postal_code: normalizePostalCode(dto.osot_postal_code) || '',

      // ========================================
      // ACCESS CONTROL (from DTO, or defaults)
      // ========================================
      osot_privilege: dto.osot_privilege ? Number(dto.osot_privilege) : 1, // Default: Owner (1)
      osot_access_modifiers: dto.osot_access_modifiers
        ? Number(dto.osot_access_modifiers)
        : 1, // Default: Private (1)
    };
  }

  /**
   * Transform Internal AdditionalInsuredInternal to Dataverse payload
   *
   * Purpose: Convert domain model to Dataverse OData format
   * Handles: ISO date formatting, OData @odata.bind relationships, choice value conversion
   *
   * @param internal - Internal domain representation
   * @returns Partial<AdditionalInsuredDataverse> - Payload ready for Dataverse API
   */
  static internalToDataverse(
    internal: Partial<AdditionalInsuredInternal>,
  ): Partial<AdditionalInsuredDataverse> {
    const dataverse: Partial<AdditionalInsuredDataverse> = {
      // ========================================
      // REQUIRED RELATIONSHIP BINDINGS (OData)
      // ========================================
      'osot_Table_Insurance@odata.bind': createOdataBind(
        'insurances', // PLURAL form: matches Dataverse OData endpoint
        internal.insuranceGuid,
      ),

      // ========================================
      // COMPANY INFORMATION
      // ========================================
      osot_company_name: internal.osot_company_name,
      osot_address: internal.osot_address,
      // City and province: Internal has strings, Dataverse expects numbers
      osot_city: internal.osot_city ? Number(internal.osot_city) : undefined,
      osot_province: internal.osot_province
        ? Number(internal.osot_province)
        : undefined,
      osot_postal_code: normalizePostalCode(internal.osot_postal_code),

      // ========================================
      // ACCESS CONTROL
      // ========================================
      osot_privilege: internal.osot_privilege,
      osot_access_modifiers: internal.osot_access_modifiers,
    };

    // Remove undefined values (don't send to Dataverse)
    Object.keys(dataverse).forEach((key) => {
      if (dataverse[key as keyof AdditionalInsuredDataverse] === undefined) {
        delete dataverse[key as keyof AdditionalInsuredDataverse];
      }
    });

    return dataverse;
  }

  /**
   * Transform Dataverse response to AdditionalInsuredInternal
   *
   * Purpose: Convert Dataverse OData response to internal domain model
   * Handles: Date parsing from ISO strings, relationship GUID extraction, choice value parsing
   *
   * @param dataverse - Dataverse API response data
   * @returns AdditionalInsuredInternal - Internal domain representation
   */
  static dataverseToInternal(
    dataverse: AdditionalInsuredDataverse,
  ): AdditionalInsuredInternal {
    // Extract user ID from createdby object
    const createdById =
      typeof dataverse.createdby === 'object'
        ? dataverse.createdby?.id || dataverse.createdby?.name
        : dataverse.createdby;

    // Extract user ID from modifiedby object
    const modifiedById =
      typeof dataverse.modifiedby === 'object'
        ? dataverse.modifiedby?.id || dataverse.modifiedby?.name
        : dataverse.modifiedby;

    // Extract owner ID from ownerid object
    const ownerIdValue =
      typeof dataverse.ownerid === 'object'
        ? dataverse.ownerid?.id || dataverse.ownerid?.name
        : dataverse.ownerid;

    return {
      // ========================================
      // SYSTEM FIELDS (from Dataverse response)
      // ========================================
      osot_table_additional_insuredid:
        dataverse.osot_table_additional_insuredid || '',
      osot_additionalinsuredid: dataverse.osot_additionalinsuredid,
      createdon: parseIsoDate(dataverse.createdon),
      modifiedon: parseIsoDate(dataverse.modifiedon),
      createdBy: createdById,
      modifiedBy: modifiedById,
      ownerid: ownerIdValue,

      // ========================================
      // RELATIONSHIP FIELDS (extract GUIDs from lookup values)
      // ========================================
      insuranceGuid: dataverse._osot_table_insurance_value || '',
      // organizationGuid is not in Dataverse, added by service layer

      // ========================================
      // COMPANY INFORMATION
      // ========================================
      osot_company_name: dataverse.osot_company_name || '',
      osot_address: dataverse.osot_address || '',
      // City and province: Dataverse has numbers, convert to string
      osot_city: dataverse.osot_city ? String(dataverse.osot_city) : '',
      osot_province: dataverse.osot_province
        ? String(dataverse.osot_province)
        : '',
      osot_postal_code: normalizePostalCode(dataverse.osot_postal_code),

      // ========================================
      // ACCESS CONTROL
      // ========================================
      osot_privilege: dataverse.osot_privilege,
      osot_access_modifiers: dataverse.osot_access_modifiers,
    };
  }

  /**
   * Transform UpdateAdditionalInsuredDto to Partial AdditionalInsuredInternal
   *
   * Purpose: Convert API update request to internal domain model
   * Important: Updates are limited to mutable fields only
   * Mutable fields: company_name, address, city, province, postal_code, privilege, access_modifiers
   *
   * @param dto - Update request DTO (only mutable fields)
   * @returns Partial<AdditionalInsuredInternal> - Internal representation for update operation
   */
  static updateDtoToInternal(
    dto: UpdateAdditionalInsuredDto,
  ): Partial<AdditionalInsuredInternal> {
    const internal: Partial<AdditionalInsuredInternal> = {
      // Only these fields can be updated (all others are immutable)
      osot_company_name: dto.osot_company_name
        ? normalizeCompanyName(dto.osot_company_name)
        : undefined,
      osot_address: dto.osot_address ? dto.osot_address.trim() : undefined,
      osot_city: dto.osot_city,
      osot_province: dto.osot_province,
      osot_postal_code: dto.osot_postal_code
        ? normalizePostalCode(dto.osot_postal_code)
        : undefined,
      osot_privilege: dto.osot_privilege
        ? Number(dto.osot_privilege)
        : undefined,
      osot_access_modifiers: dto.osot_access_modifiers
        ? Number(dto.osot_access_modifiers)
        : undefined,
    };

    // Remove undefined values
    Object.keys(internal).forEach((key) => {
      if (internal[key as keyof AdditionalInsuredInternal] === undefined) {
        delete internal[key as keyof AdditionalInsuredInternal];
      }
    });

    return internal;
  }

  /**
   * Transform AdditionalInsuredInternal to AdditionalInsuredResponseDto
   *
   * Purpose: Convert internal domain model to API response format
   * Handles: Postal code formatting for display, choice value conversion
   *
   * @param internal - Internal domain representation
   * @returns AdditionalInsuredResponseDto - Response DTO ready for API client
   */
  static internalToResponseDto(
    internal: AdditionalInsuredInternal,
  ): AdditionalInsuredResponseDto {
    return {
      // ========================================
      // SYSTEM FIELDS
      // ========================================
      osot_table_additional_insuredid: internal.osot_table_additional_insuredid,
      osot_additionalinsuredid: internal.osot_additionalinsuredid,
      organizationGuid: internal.organizationGuid,
      insuranceGuid: internal.insuranceGuid,
      createdon: toIsoString(internal.createdon),
      modifiedon: toIsoString(internal.modifiedon),
      createdby: internal.createdBy,
      modifiedby: internal.modifiedBy,

      // ========================================
      // COMPANY INFORMATION
      // ========================================
      osot_company_name: internal.osot_company_name,
      osot_address: internal.osot_address,
      osot_city: internal.osot_city,
      osot_province: internal.osot_province,
      // Format postal code for display (add space)
      osot_postal_code: formatPostalCode(internal.osot_postal_code),

      // ========================================
      // ACCESS CONTROL
      // ========================================
      osot_privilege: internal.osot_privilege
        ? this.getPrivilegeDisplayName(internal.osot_privilege)
        : undefined,
      osot_access_modifiers: internal.osot_access_modifiers
        ? this.getAccessModifierDisplayName(internal.osot_access_modifiers)
        : undefined,
    };
  }

  /**
   * Convert numeric privilege choice to display name
   * @param privilegeId - Numeric privilege ID (1=Owner, 2=Admin, 3=Main)
   * @returns Display name (e.g., "Owner", "Admin", "Main")
   */
  private static getPrivilegeDisplayName(privilegeId: number): string {
    const privilegeMap: Record<number, string> = {
      1: 'Owner',
      2: 'Admin',
      3: 'Main',
    };
    return privilegeMap[privilegeId] || 'Unknown';
  }

  /**
   * Convert numeric access modifier choice to display name
   * @param modifierId - Numeric access modifier ID (1=Private, 2=Public, etc.)
   * @returns Display name (e.g., "Private", "Public")
   */
  private static getAccessModifierDisplayName(modifierId: number): string {
    const modifierMap: Record<number, string> = {
      1: 'Private',
      2: 'Public',
    };
    return modifierMap[modifierId] || 'Unknown';
  }
}
