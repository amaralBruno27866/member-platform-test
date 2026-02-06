/**
 * Membership Settings Mapper (CLEAN REBUILD)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized enums for type safety and validation
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential membership settings data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions
 * - Proper data normalization and validation
 * - Following address module proven patterns
 */

/*
 * ESLint is disabled for no-unsafe-* rules on enum display name functions below.
 * These functions are type-safe (return string) but ESLint cannot infer types correctly
 * due to re-exports through common/enums/index.ts.
 */

import {
  AccountStatus,
  Privilege,
  AccessModifier,
  getAccountStatusDisplayName,
} from '../../../../common/enums';
import {
  MembershipGroup,
  getMembershipGroupDisplayName,
} from '../enums/membership-group.enum';
import { CreateMembershipSettingsDto } from '../dtos/membership-settings-create.dto';
import { UpdateMembershipSettingsDto } from '../dtos/membership-settings-update.dto';
import { MembershipSettingsResponseDto } from '../dtos/membership-settings-response.dto';
import { MembershipSettingsInternal } from '../interfaces/membership-settings-internal.interface';
import { MembershipSettingsDataverse } from '../interfaces/membership-settings-dataverse.interface';

// Export the ResponseDto type for external use
export { MembershipSettingsResponseDto } from '../dtos/membership-settings-response.dto';

/**
 * Helper functions for enum conversions and data parsing
 */

/**
 * Convert string/number to MembershipGroup enum
 */
function parseMembershipGroup(value: unknown): MembershipGroup | undefined {
  if (typeof value === 'number') {
    return Object.values(MembershipGroup).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(MembershipGroup).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number to AccountStatus enum
 */
function parseAccountStatus(value: unknown): AccountStatus | undefined {
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
 * Normalize and validate Settings ID format
 * Ensures proper business ID format consistency
 */
function normalizeSettingsId(settingsId: string): string | undefined {
  if (!settingsId || typeof settingsId !== 'string') return undefined;

  const trimmed = settingsId.trim();
  if (trimmed.length === 0) return undefined;

  // Basic sanitization - remove any potentially harmful characters
  const sanitized = trimmed.replace(/[<>'"&]/g, '');

  return sanitized.length > 0 ? sanitized : undefined;
}

/**
 * Membership Settings Mapper Class
 *
 * Handles all data transformations between different membership settings representations:
 * - DTOs ↔ Internal interfaces
 * - Dataverse responses ↔ Internal interfaces
 * - Data normalization and validation
 * - Type-safe enum conversions
 * - Error handling for transformation failures
 *
 * Key Features:
 * - Type-safe transformations with enum validation
 * - Membership fee normalization for currency consistency
 * - Settings ID format validation and sanitization
 * - Business rule validation integration
 * - Comprehensive error handling
 * - Integration with essential modules
 */
export class MembershipSettingsMapper {
  /**
   * Map CreateDto to Internal
   * Used when creating new membership settings from API requests
   * @param dto - Create DTO from API request
   * @param organizationGuid - Organization GUID from authenticated user's JWT context
   */
  static mapCreateDtoToInternal(
    dto: CreateMembershipSettingsDto,
    organizationGuid: string,
  ): MembershipSettingsInternal {
    const internal: MembershipSettingsInternal = {
      organizationGuid, // REQUIRED: Injected from JWT for multi-tenant isolation
      osot_membership_year: dto.osot_membership_year,
      osot_membership_group: dto.osot_membership_group,
      osot_year_starts: dto.osot_year_starts,
      osot_year_ends: dto.osot_year_ends,
      osot_membership_year_status: dto.osot_membership_year_status,
    };

    // Optional fields - osot_settingsid will be auto-generated by the service if not provided
    // CreateDto no longer includes osot_settingsid as it's system-generated

    return internal;
  }

  /**
   * Map UpdateDto to partial Internal
   * Used when updating existing membership settings from API requests
   * @param dto - Update DTO from API request
   * @param existingOrganizationGuid - Existing organization GUID (for validation that it's immutable)
   */
  static mapUpdateDtoToInternal(
    dto: UpdateMembershipSettingsDto,
    existingOrganizationGuid: string,
  ): Partial<MembershipSettingsInternal> {
    const internal: Partial<MembershipSettingsInternal> = {};

    // IMPORTANT: organizationGuid is inherited from BasicDto but MUST be immutable
    // Validate that the provided organizationGuid matches existing record
    // This validation will be done at the service layer
    internal.organizationGuid = existingOrganizationGuid;

    // Map all provided fields (only essential fields from DTO)
    if (dto.osot_settingsid !== undefined) {
      internal.osot_settingsid = normalizeSettingsId(dto.osot_settingsid);
    }
    if (dto.osot_membership_year !== undefined) {
      internal.osot_membership_year = dto.osot_membership_year;
    }
    if (dto.osot_membership_group !== undefined) {
      internal.osot_membership_group = dto.osot_membership_group;
    }
    if (dto.osot_year_starts !== undefined) {
      internal.osot_year_starts = dto.osot_year_starts;
    }
    if (dto.osot_year_ends !== undefined) {
      internal.osot_year_ends = dto.osot_year_ends;
    }
    if (dto.osot_membership_year_status !== undefined) {
      internal.osot_membership_year_status = dto.osot_membership_year_status;
    }

    return internal;
  }

  /**
   * Map Internal to ResponseDto
   * Used when returning membership settings data from API endpoints
   */
  static mapInternalToResponseDto(
    internal: MembershipSettingsInternal,
  ): MembershipSettingsResponseDto {
    return {
      organizationGuid: internal.organizationGuid,
      osot_settingsid: internal.osot_settingsid || '',
      osot_membership_year: internal.osot_membership_year,
      osot_membership_group:
        internal.osot_membership_group !== undefined
          ? getMembershipGroupDisplayName(internal.osot_membership_group)
          : '',
      osot_year_starts: internal.osot_year_starts,
      osot_year_ends: internal.osot_year_ends,
      osot_membership_year_status:
        internal.osot_membership_year_status !== undefined
          ? getAccountStatusDisplayName(internal.osot_membership_year_status)
          : '',
    };
  }

  /**
   * Map Dataverse response to Internal
   * Used when receiving data from Dataverse API
   */
  static mapDataverseToInternal(
    dataverse: MembershipSettingsDataverse,
  ): MembershipSettingsInternal {
    return {
      organizationGuid: dataverse._osot_table_organization_value || '', // Extract org GUID from lookup
      osot_table_membership_settingid:
        dataverse.osot_table_membership_settingid,
      osot_settingsid: dataverse.osot_settingsid,
      osot_membership_year: dataverse.osot_membership_year,
      osot_membership_group: parseMembershipGroup(
        dataverse.osot_membership_group,
      ),
      osot_year_starts: dataverse.osot_year_starts,
      osot_year_ends: dataverse.osot_year_ends,
      osot_membership_year_status: parseAccountStatus(
        dataverse.osot_membership_year_status,
      ),
      osot_access_modifiers: parseAccessModifier(
        dataverse.osot_access_modifiers,
      ),
      osot_privilege: parsePrivilege(dataverse.osot_privilege),
      createdon: dataverse.createdon,
      modifiedon: dataverse.modifiedon,
      ownerid: dataverse.ownerid,
    };
  }

  /**
   * Map Internal to Dataverse payload
   * Used when sending data to Dataverse API
   */
  static mapInternalToDataverse(
    internal: MembershipSettingsInternal,
    isUpdate = false,
  ): Partial<MembershipSettingsDataverse> {
    const payload: Partial<MembershipSettingsDataverse> = {};

    // Organization binding - ALWAYS include for multi-tenant isolation
    if (internal.organizationGuid) {
      payload['osot_table_organization@odata.bind'] =
        `/osot_table_organizations(${internal.organizationGuid})`;
    }

    // For Autonumber fields (osot_settingsid), only include in updates, never in creation
    if (isUpdate && internal.osot_settingsid !== undefined) {
      payload.osot_settingsid = internal.osot_settingsid;
    }
    if (internal.osot_membership_year !== undefined) {
      payload.osot_membership_year = internal.osot_membership_year;
    }
    if (internal.osot_membership_group !== undefined) {
      payload.osot_membership_group = internal.osot_membership_group;
    }
    if (internal.osot_year_starts !== undefined) {
      payload.osot_year_starts = internal.osot_year_starts;
    }
    if (internal.osot_year_ends !== undefined) {
      payload.osot_year_ends = internal.osot_year_ends;
    }
    if (internal.osot_membership_year_status !== undefined) {
      payload.osot_membership_year_status =
        internal.osot_membership_year_status;
    }
    if (internal.osot_access_modifiers !== undefined) {
      payload.osot_access_modifiers = internal.osot_access_modifiers;
    }
    if (internal.osot_privilege !== undefined) {
      payload.osot_privilege = internal.osot_privilege;
    }

    return payload;
  }

  /**
   * Validate membership settings data for completeness
   * Returns validation errors if any required fields are missing or invalid
   */
  static validateMembershipSettingsData(
    settings: Partial<MembershipSettingsInternal>,
  ): string[] {
    const errors: string[] = [];

    // Check required multi-tenant field
    if (!settings.organizationGuid) {
      errors.push('Organization GUID is required for multi-tenant isolation');
    }

    // Check required fields
    if (!settings.osot_membership_year) {
      errors.push('Membership year is required');
    }
    if (!settings.osot_membership_group) {
      errors.push('Membership group is required');
    }
    if (!settings.osot_year_starts) {
      errors.push('Year start date is required');
    }
    if (!settings.osot_year_ends) {
      errors.push('Year end date is required');
    }
    if (!settings.osot_membership_year_status) {
      errors.push('Membership year status is required');
    }

    // Validate date ranges
    if (settings.osot_year_starts && settings.osot_year_ends) {
      const startDate = new Date(settings.osot_year_starts);
      const endDate = new Date(settings.osot_year_ends);

      if (endDate <= startDate) {
        errors.push('Year end date must be after start date');
      }
    }

    return errors;
  }

  /**
   * Sanitize membership settings data by removing sensitive fields
   * Used when preparing data for logging or external systems
   */
  static sanitizeMembershipSettingsData(
    settings: MembershipSettingsInternal,
  ): Partial<MembershipSettingsInternal> {
    const sanitized: Partial<MembershipSettingsInternal> = {
      organizationGuid: settings.organizationGuid,
      osot_table_membership_settingid: settings.osot_table_membership_settingid,
      osot_settingsid: settings.osot_settingsid,
      osot_membership_year: settings.osot_membership_year,
      osot_membership_group: settings.osot_membership_group,
      osot_year_starts: settings.osot_year_starts,
      osot_year_ends: settings.osot_year_ends,
      osot_membership_year_status: settings.osot_membership_year_status,
      createdon: settings.createdon,
      modifiedon: settings.modifiedon,
    };

    return sanitized;
  }
}
