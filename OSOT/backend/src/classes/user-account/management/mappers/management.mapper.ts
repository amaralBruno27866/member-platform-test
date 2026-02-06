/**
 * Management Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized enums for type safety and validation
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * MAPPING PHILOSOPHY:
 * - Essential management data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions
 * - Proper data normalization and validation
 */

import { AccessModifier, Privilege } from '../../../../common/enums';
import { CreateManagementDto } from '../dtos/create-management.dto';
import { UpdateManagementDto } from '../dtos/update-management.dto';
import { ManagementResponseDto } from '../dtos/management-response.dto';
import { ManagementInternal } from '../interfaces/management-internal.interface';
import { DataverseManagement } from '../interfaces/management-dataverse.interface';

// Re-export types for external use
export { ManagementResponseDto } from '../dtos/management-response.dto';

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
 * Convert Dataverse Yes/No field (boolean, 0/1, or undefined) to boolean
 */
function parseBoolean(value: number | boolean | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  return false;
}

/**
 * Convert boolean to Dataverse Yes/No field (true/false)
 */
function booleanToDataverse(value: boolean | undefined): boolean {
  return value === true;
}

// ========================================
// ENUM PARSING FUNCTIONS
// ========================================

/**
 * Parse Access Modifier from string/number to enum
 */
function parseAccessModifier(value: any): AccessModifier | undefined {
  if (value === undefined || value === null) return undefined;

  // Handle numeric values from Dataverse
  if (typeof value === 'number') {
    switch (value) {
      case 1:
        return AccessModifier.PUBLIC;
      case 2:
        return AccessModifier.PROTECTED;
      case 3:
        return AccessModifier.PRIVATE;
      default:
        return undefined;
    }
  }

  // Handle string values
  if (typeof value === 'string') {
    switch (value.toUpperCase()) {
      case 'PUBLIC':
        return AccessModifier.PUBLIC;
      case 'PROTECTED':
        return AccessModifier.PROTECTED;
      case 'PRIVATE':
        return AccessModifier.PRIVATE;
      default:
        return undefined;
    }
  }

  // Handle enum values directly
  if (
    typeof value === 'number' &&
    Object.values(AccessModifier).includes(value as AccessModifier)
  ) {
    return value as AccessModifier;
  }

  return undefined;
}

/**
 * Parse Privilege from string/number to enum
 */
function parsePrivilege(value: any): Privilege | undefined {
  if (value === undefined || value === null) return undefined;

  // Handle numeric values from Dataverse
  if (typeof value === 'number') {
    switch (value) {
      case 1:
        return Privilege.OWNER;
      case 2:
        return Privilege.ADMIN;
      case 3:
        return Privilege.MAIN;
      default:
        return undefined;
    }
  }

  // Handle string values
  if (typeof value === 'string') {
    switch (value.toUpperCase()) {
      case 'OWNER':
        return Privilege.OWNER;
      case 'ADMIN':
        return Privilege.ADMIN;
      case 'MAIN':
        return Privilege.MAIN;
      default:
        return undefined;
    }
  }

  // Handle enum values directly
  if (
    typeof value === 'number' &&
    Object.values(Privilege).includes(value as Privilege)
  ) {
    return value as Privilege;
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
  dataverse: DataverseManagement,
): ManagementInternal {
  return {
    // System fields
    osot_table_account_managementid: dataverse.osot_table_account_managementid,
    osot_account_management_id: dataverse.osot_account_management_id,
    createdon: dataverse.createdon,
    modifiedon: dataverse.modifiedon,
    ownerid: dataverse.ownerid,

    // Account relationship
    osot_table_account: dataverse.osot_table_account,

    // Business identity
    osot_user_business_id: normalizeText(dataverse.osot_user_business_id) || '',

    // Management flags (convert from Dataverse 0/1 to boolean)
    osot_life_member_retired: parseBoolean(dataverse.osot_life_member_retired),
    osot_shadowing: parseBoolean(dataverse.osot_shadowing),
    osot_passed_away: parseBoolean(dataverse.osot_passed_away),
    osot_vendor: parseBoolean(dataverse.osot_vendor),
    osot_advertising: parseBoolean(dataverse.osot_advertising),
    osot_recruitment: parseBoolean(dataverse.osot_recruitment),
    osot_driver_rehab: parseBoolean(dataverse.osot_driver_rehab),

    // Access control (convert from Dataverse numbers to enums)
    osot_access_modifiers: parseAccessModifier(dataverse.osot_access_modifiers),
    osot_privilege: parsePrivilege(dataverse.osot_privilege),
  };
}

/**
 * Map internal representation to Response DTO format
 * Used for API responses and external consumption
 */
export function mapInternalToResponseDto(
  internal: ManagementInternal,
): ManagementResponseDto {
  // Create an instance to get computed properties functionality
  const responseDto = new ManagementResponseDto();

  // Use Object.assign to avoid unsafe member access warnings
  return Object.assign(responseDto, {
    // System fields
    osot_table_account_managementid:
      internal.osot_table_account_managementid || '',
    osot_account_management_id: internal.osot_account_management_id || '',
    createdon: internal.createdon,
    modifiedon: internal.modifiedon,
    ownerid: internal.ownerid,

    // Account relationship
    osot_table_account: internal.osot_table_account,

    // Business identity
    osot_user_business_id: internal.osot_user_business_id || '',

    // Management flags
    osot_life_member_retired: internal.osot_life_member_retired || false,
    osot_shadowing: internal.osot_shadowing || false,
    osot_passed_away: internal.osot_passed_away || false,
    osot_vendor: internal.osot_vendor || false,
    osot_advertising: internal.osot_advertising || false,
    osot_recruitment: internal.osot_recruitment || false,
    osot_driver_rehab: internal.osot_driver_rehab || false,

    // Access control
    osot_access_modifiers: internal.osot_access_modifiers,
    osot_privilege: internal.osot_privilege,

    // Note: Computed properties (getters) are automatically calculated by the class
    // They don't need to be explicitly mapped here - they're computed on access
  });
}

/**
 * Map Create DTO to internal representation
 * Used for new management account creation operations
 */
export function mapCreateDtoToInternal(
  dto: CreateManagementDto,
): Partial<ManagementInternal> {
  return {
    // Business identity (required)
    osot_user_business_id: normalizeText(dto.osot_user_business_id) || '',

    // Management flags (optional, defaults to false)
    osot_life_member_retired: dto.osot_life_member_retired || false,
    osot_shadowing: dto.osot_shadowing || false,
    osot_passed_away: dto.osot_passed_away || false,
    osot_vendor: dto.osot_vendor || false,
    osot_advertising: dto.osot_advertising || false,
    osot_recruitment: dto.osot_recruitment || false,
    osot_driver_rehab: dto.osot_driver_rehab || false,

    // Access control (optional, with defaults)
    osot_access_modifiers:
      dto.osot_access_modifiers || AccessModifier.PROTECTED,
    osot_privilege: dto.osot_privilege || Privilege.MAIN,

    // System fields are handled by Dataverse
    // Account relationship handled by service layer
  };
}

/**
 * Map Update DTO to internal representation (partial updates)
 * Only maps fields that are explicitly provided in the update
 */
export function mapUpdateDtoToInternal(
  dto: UpdateManagementDto,
): Partial<ManagementInternal> {
  const internal: Partial<ManagementInternal> = {};

  // Only map fields that are explicitly provided (not undefined)
  if (dto.osot_user_business_id !== undefined) {
    internal.osot_user_business_id =
      normalizeText(dto.osot_user_business_id) || '';
  }

  // Management flags
  if (dto.osot_life_member_retired !== undefined) {
    internal.osot_life_member_retired = dto.osot_life_member_retired;
  }
  if (dto.osot_shadowing !== undefined) {
    internal.osot_shadowing = dto.osot_shadowing;
  }
  if (dto.osot_passed_away !== undefined) {
    internal.osot_passed_away = dto.osot_passed_away;
  }
  if (dto.osot_vendor !== undefined) {
    internal.osot_vendor = dto.osot_vendor;
  }
  if (dto.osot_advertising !== undefined) {
    internal.osot_advertising = dto.osot_advertising;
  }
  if (dto.osot_recruitment !== undefined) {
    internal.osot_recruitment = dto.osot_recruitment;
  }
  if (dto.osot_driver_rehab !== undefined) {
    internal.osot_driver_rehab = dto.osot_driver_rehab;
  }

  // Access control
  if (dto.osot_access_modifiers !== undefined) {
    internal.osot_access_modifiers = dto.osot_access_modifiers;
  }
  if (dto.osot_privilege !== undefined) {
    internal.osot_privilege = dto.osot_privilege;
  }

  return internal;
}

/**
 * Map internal representation to Dataverse format for API calls
 * Converts enums back to numbers and formats data for Dataverse
 */
export function mapInternalToDataverse(
  internal: ManagementInternal,
): DataverseManagement {
  return {
    // System fields
    osot_table_account_managementid: internal.osot_table_account_managementid,
    osot_account_management_id: internal.osot_account_management_id,
    createdon: internal.createdon,
    modifiedon: internal.modifiedon,
    ownerid: internal.ownerid,

    // Account relationship
    osot_table_account: internal.osot_table_account,

    // Business identity
    osot_user_business_id: internal.osot_user_business_id,

    // Management flags (convert boolean to Dataverse 0/1)
    osot_life_member_retired: booleanToDataverse(
      internal.osot_life_member_retired,
    ),
    osot_shadowing: booleanToDataverse(internal.osot_shadowing),
    osot_passed_away: booleanToDataverse(internal.osot_passed_away),
    osot_vendor: booleanToDataverse(internal.osot_vendor),
    osot_advertising: booleanToDataverse(internal.osot_advertising),
    osot_recruitment: booleanToDataverse(internal.osot_recruitment),
    osot_driver_rehab: booleanToDataverse(internal.osot_driver_rehab),

    // Access control (convert enums to numbers)
    osot_access_modifiers: internal.osot_access_modifiers,
    osot_privilege: internal.osot_privilege,
  };
}

// ========================================
// VALIDATION AND UTILITY FUNCTIONS
// ========================================

/**
 * Validate internal management data for completeness and business rules
 */
export function validateInternalManagement(
  management: Partial<ManagementInternal>,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!management.osot_user_business_id) {
    errors.push('User Business ID is required');
  }

  // Business rule validations
  if (management.osot_vendor && management.osot_recruitment) {
    errors.push('Vendors cannot have recruitment permissions');
  }

  if (management.osot_passed_away && management.osot_life_member_retired) {
    errors.push('Cannot be both passed away and life member retired');
  }

  // Active services validation for deceased members
  if (management.osot_passed_away) {
    const activeServices = [
      'osot_shadowing',
      'osot_vendor',
      'osot_advertising',
      'osot_recruitment',
      'osot_driver_rehab',
    ];

    for (const service of activeServices) {
      if (management[service as keyof ManagementInternal] === true) {
        errors.push(
          `Deceased members cannot have active ${service.replace('osot_', '')} service`,
        );
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Check if management data contains any sensitive information
 */
export function containsSensitiveInfo(management: ManagementInternal): boolean {
  return !!(
    management.osot_table_account_managementid ||
    management.osot_privilege === Privilege.OWNER ||
    management.ownerid
  );
}

/**
 * Utility function to safely extract public fields for external APIs
 */
export function extractPublicFields(
  management: ManagementInternal,
): Partial<ManagementInternal> {
  const result = { ...management };
  delete result.osot_table_account_managementid;
  delete result.ownerid;
  return result;
}

/**
 * Map CreateManagementForAccountDto to ManagementInternal
 * Used specifically for account integration workflow with repository pattern
 * Includes relationship fields (osot_user_business_id and @odata.bind)
 */
export function mapCreateManagementForAccountDtoToInternal(
  dto: import('../dtos/create-management-for-account.dto').CreateManagementForAccountDto,
): Partial<ManagementInternal> {
  return {
    // CRITICAL: Include relationship fields for account integration
    osot_user_business_id: dto.osot_user_business_id,

    // Management flags (use DTO values or default to false)
    osot_life_member_retired: dto.osot_life_member_retired ?? false,
    osot_shadowing: dto.osot_shadowing ?? false,
    osot_passed_away: dto.osot_passed_away ?? false,
    osot_vendor: dto.osot_vendor ?? false,
    osot_advertising: dto.osot_advertising ?? false,
    osot_recruitment: dto.osot_recruitment ?? false,
    osot_driver_rehab: dto.osot_driver_rehab ?? false,

    // System defaults
    osot_access_modifiers: AccessModifier.PROTECTED,
    osot_privilege: Privilege.OWNER,

    // Handle OData binding for account relationship - keep as-is, don't extract GUID
    ...(dto['osot_Table_Account@odata.bind'] && {
      'osot_Table_Account@odata.bind': dto['osot_Table_Account@odata.bind'],
    }),
  };
}
