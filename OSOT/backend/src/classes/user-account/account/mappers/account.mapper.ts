/**
 * Account Mapper
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized enums for type safety and validation
 * - utils: Uses account helper functions for data normalization and parsing
 * - integrations: Compatible with DataverseService response formats
 *
 * MAPPING PHILOSOPHY:
 * - Essential account data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions via helper functions
 * - Proper data normalization and validation through utilities
 * - Security-focused: password field handling
 * - Separation of concerns: utility functions in dedicated helpers
 */

import {
  AccountGroup,
  AccountStatus,
  getAccountStatusDisplayName,
  AccessModifier,
  getAccessModifierDisplayName,
  Privilege,
} from '../../../../common/enums';
import { CreateAccountDto } from '../dtos/create-account.dto';
import { UpdateAccountDto } from '../dtos/update-account.dto';
import { AccountResponseDto } from '../dtos/account-response.dto';
import { AccountPublicDto } from '../dtos/account-public.dto';
import {
  AccountInternal,
  AccountInternalCreate,
  AccountSystemUpdate,
} from '../interfaces/account-internal.interface';
import { AccountDataverse } from '../interfaces/account-dataverse.interface';
// Import helper functions
import {
  normalizeText,
  normalizePhoneNumber,
  normalizeDate,
  parseAccountGroup,
  parseAccountStatus,
  parseAccessModifier,
  parsePrivilege,
} from '../utils/account.helpers';

// Re-export types for external use
export { AccountResponseDto } from '../dtos/account-response.dto';
export { AccountPublicDto } from '../dtos/account-public.dto';

// ========================================
// CORE MAPPING FUNCTIONS
// ========================================

/**
 * Map Dataverse response to internal representation
 * Handles the transformation from external API format to internal business objects
 */
export function mapDataverseToInternal(
  dataverse: AccountDataverse,
): AccountInternal {
  return {
    // System fields
    osot_table_accountid: dataverse.osot_table_accountid,
    osot_account_id: dataverse.osot_account_id,
    createdon: dataverse.createdon,
    modifiedon: dataverse.modifiedon,
    ownerid: dataverse.ownerid,

    // Organization context (multi-tenant)
    organizationGuid: dataverse._osot_table_organization_value,

    // Personal information
    osot_last_name: normalizeText(dataverse.osot_last_name, 50),
    osot_first_name: normalizeText(dataverse.osot_first_name, 50),
    osot_date_of_birth: normalizeDate(dataverse.osot_date_of_birth),

    // Contact information
    osot_mobile_phone: normalizePhoneNumber(dataverse.osot_mobile_phone),
    osot_email: normalizeText(dataverse.osot_email, 100)?.toLowerCase(),
    osot_password: dataverse.osot_password, // Keep as-is for security

    // Account configuration
    osot_account_group: parseAccountGroup(dataverse.osot_account_group),
    osot_account_declaration: dataverse.osot_account_declaration,

    // System configuration
    osot_account_status: parseAccountStatus(dataverse.osot_account_status),
    osot_active_member: dataverse.osot_active_member || false,
    osot_access_modifiers: parseAccessModifier(dataverse.osot_access_modifiers),
    osot_privilege: parsePrivilege(dataverse.osot_privilege),
  };
}

/**
 * Map internal representation to Response DTO format
 * Used for API responses and external consumption
 * SECURITY: Excludes password field
 */
export function mapInternalToResponseDto(
  internal: AccountInternal,
): AccountResponseDto {
  // Create an instance to get computed properties functionality
  const responseDto = new AccountResponseDto();

  // Use Object.assign to avoid unsafe member access warnings
  return Object.assign(responseDto, {
    // System fields
    osot_table_accountid: internal.osot_table_accountid || '',
    osot_account_id: internal.osot_account_id || '',
    createdon: internal.createdon,
    modifiedon: internal.modifiedon,

    // Personal information
    osot_last_name: internal.osot_last_name || '',
    osot_first_name: internal.osot_first_name || '',
    osot_date_of_birth: internal.osot_date_of_birth || '',

    // Contact information
    osot_mobile_phone: internal.osot_mobile_phone || '',
    osot_email: internal.osot_email || '',
    // NOTE: password is intentionally excluded for security

    // Account configuration (return numeric values for consistency)
    osot_account_group:
      internal.osot_account_group !== undefined
        ? internal.osot_account_group
        : AccountGroup.OTHER,
    osot_account_declaration:
      internal.osot_account_declaration !== undefined
        ? internal.osot_account_declaration
        : false,

    // System configuration
    osot_account_status: getAccountStatusDisplayName(
      internal.osot_account_status || AccountStatus.PENDING,
    ),
    osot_active_member: internal.osot_active_member || false,
    osot_access_modifiers: getAccessModifierDisplayName(
      internal.osot_access_modifiers || AccessModifier.PRIVATE,
    ),
    osot_privilege:
      internal.osot_privilege !== undefined
        ? internal.osot_privilege
        : Privilege.OWNER,
  });
}

/**
 * Map internal representation to Public DTO format
 * Used for public API responses (UI/UX)
 * SECURITY: Excludes password, internal GUID, audit fields, and osot_access_modifiers
 * INCLUDES: osot_privilege for user context awareness
 */
export function mapInternalToPublicDto(
  internal: AccountInternal,
): AccountPublicDto {
  return {
    // Business identifier
    osot_account_id: internal.osot_account_id || '',

    // Personal information
    osot_last_name: internal.osot_last_name || '',
    osot_first_name: internal.osot_first_name || '',
    osot_date_of_birth: internal.osot_date_of_birth || '',

    // Contact information
    osot_mobile_phone: internal.osot_mobile_phone || '',
    osot_email: internal.osot_email || '',

    // Account configuration (return numeric values for frontend compatibility)
    osot_account_group:
      internal.osot_account_group !== undefined
        ? internal.osot_account_group
        : AccountGroup.OTHER, // Default to 0 (OTHER)
    osot_account_declaration:
      internal.osot_account_declaration !== undefined
        ? internal.osot_account_declaration
        : false,

    // System configuration (read-only)
    osot_account_status: getAccountStatusDisplayName(
      internal.osot_account_status || AccountStatus.PENDING,
    ),
    osot_active_member: internal.osot_active_member || false,

    // Access control (read-only) - return numeric value for frontend
    osot_privilege:
      internal.osot_privilege !== undefined
        ? internal.osot_privilege
        : Privilege.OWNER, // Default to 1 (OWNER)
  };
}

/**
 * Map Response DTO to Public DTO format
 * Used when converting service responses to public API format
 * SECURITY: Excludes internal GUID, audit fields, and osot_access_modifiers
 * INCLUDES: osot_privilege for user context awareness
 */
export function mapResponseDtoToPublicDto(
  response: AccountResponseDto,
): AccountPublicDto {
  return {
    // Business identifier
    osot_account_id: response.osot_account_id || '',

    // Personal information
    osot_last_name: response.osot_last_name || '',
    osot_first_name: response.osot_first_name || '',
    osot_date_of_birth: response.osot_date_of_birth || '',

    // Contact information
    osot_mobile_phone: response.osot_mobile_phone || '',
    osot_email: response.osot_email || '',

    // Account configuration (return numeric values for frontend compatibility)
    osot_account_group:
      typeof response.osot_account_group === 'number'
        ? response.osot_account_group
        : AccountGroup.OTHER, // Default to 0 (OTHER)
    osot_account_declaration:
      response.osot_account_declaration !== undefined
        ? response.osot_account_declaration
        : false,

    // System configuration (read-only)
    osot_account_status:
      response.osot_account_status ||
      getAccountStatusDisplayName(AccountStatus.PENDING),
    osot_active_member: response.osot_active_member || false,

    // Access control (read-only) - return numeric value for frontend
    osot_privilege:
      typeof response.osot_privilege === 'number'
        ? response.osot_privilege
        : Privilege.OWNER, // Default to 1 (OWNER)
  };
}

/**
 * Map Create DTO to internal create format
 * Used for account creation operations
 */
export function mapCreateDtoToInternal(
  createDto: CreateAccountDto,
): AccountInternalCreate {
  return {
    // Personal information (required)
    osot_last_name:
      normalizeText(createDto.osot_last_name, 50) || createDto.osot_last_name,
    osot_first_name:
      normalizeText(createDto.osot_first_name, 50) || createDto.osot_first_name,
    osot_date_of_birth:
      normalizeDate(createDto.osot_date_of_birth) ||
      createDto.osot_date_of_birth,

    // Contact information (required)
    osot_mobile_phone:
      normalizePhoneNumber(createDto.osot_mobile_phone) ||
      createDto.osot_mobile_phone,
    osot_email:
      normalizeText(createDto.osot_email, 100)?.toLowerCase() ||
      createDto.osot_email.toLowerCase(),
    osot_password: createDto.osot_password, // Keep as-is for hashing in service

    // Account configuration (required)
    osot_account_group: createDto.osot_account_group,
    osot_account_declaration: createDto.osot_account_declaration,

    // System configuration (defaults)
    osot_account_status: AccountStatus.PENDING,
    osot_active_member: false,
    osot_access_modifiers: AccessModifier.PRIVATE,
    osot_privilege: Privilege.OWNER,
  };
}

/**
 * Map Update DTO to internal update format
 * Used for account update operations
 * Only includes fields that are provided (not undefined)
 */
export function mapUpdateDtoToInternal(
  updateDto: UpdateAccountDto,
): Partial<AccountInternal> {
  const update: Partial<AccountInternal> = {};

  // Personal information
  if (updateDto.osot_last_name !== undefined) {
    update.osot_last_name = normalizeText(updateDto.osot_last_name, 50);
  }
  if (updateDto.osot_first_name !== undefined) {
    update.osot_first_name = normalizeText(updateDto.osot_first_name, 50);
  }
  if (updateDto.osot_date_of_birth !== undefined) {
    update.osot_date_of_birth = normalizeDate(updateDto.osot_date_of_birth);
  }

  // Contact information
  if (updateDto.osot_mobile_phone !== undefined) {
    update.osot_mobile_phone = normalizePhoneNumber(
      updateDto.osot_mobile_phone,
    );
  }
  if (updateDto.osot_email !== undefined) {
    update.osot_email = normalizeText(updateDto.osot_email, 100)?.toLowerCase();
  }
  if (updateDto.osot_password !== undefined) {
    update.osot_password = updateDto.osot_password; // Keep as-is for hashing in service
  }

  // Account configuration
  if (updateDto.osot_account_group !== undefined) {
    update.osot_account_group = updateDto.osot_account_group;
  }
  if (updateDto.osot_account_declaration !== undefined) {
    update.osot_account_declaration = updateDto.osot_account_declaration;
  }

  // SECURITY: System configuration fields are NOT mapped from DTO
  // These fields are managed through dedicated business logic workflows:
  // - osot_account_status: Use business rule services for status transitions
  // - osot_active_member: Use membership validation services
  // - osot_access_modifiers: Use admin/security management services
  // - osot_privilege: Use role management services

  return update;
}

/**
 * Map System Update to internal update format
 * Used for internal system operations (orchestrators, business rules, admin)
 * SECURITY: This function is for internal system use only
 */
export function mapSystemUpdateToInternal(
  systemUpdate: AccountSystemUpdate,
): Partial<AccountInternal> {
  const update: Partial<AccountInternal> = {};

  // System configuration fields (controlled by business logic)
  if (systemUpdate.osot_account_status !== undefined) {
    update.osot_account_status = systemUpdate.osot_account_status;
  }
  if (systemUpdate.osot_active_member !== undefined) {
    update.osot_active_member = systemUpdate.osot_active_member;
  }
  if (systemUpdate.osot_access_modifiers !== undefined) {
    update.osot_access_modifiers = systemUpdate.osot_access_modifiers;
  }
  if (systemUpdate.osot_privilege !== undefined) {
    update.osot_privilege = systemUpdate.osot_privilege;
  }

  return update;
}

/**
 * Map internal format to Dataverse create payload
 * Used for creating records in Dataverse
 */
export function mapInternalToDataverseCreate(
  internal: AccountInternalCreate,
): Omit<
  AccountDataverse,
  | 'osot_table_accountid'
  | 'osot_account_id'
  | 'createdon'
  | 'modifiedon'
  | 'ownerid'
> &
  Record<string, unknown> {
  const dataverse: Omit<
    AccountDataverse,
    | 'osot_table_accountid'
    | 'osot_account_id'
    | 'createdon'
    | 'modifiedon'
    | 'ownerid'
  > &
    Record<string, unknown> = {
    // Personal information
    osot_last_name: internal.osot_last_name,
    osot_first_name: internal.osot_first_name,
    osot_date_of_birth: internal.osot_date_of_birth,

    // Contact information
    osot_mobile_phone: internal.osot_mobile_phone,
    osot_email: internal.osot_email,
    osot_password: internal.osot_password,

    // Account configuration
    osot_account_group: internal.osot_account_group,
    osot_account_declaration: internal.osot_account_declaration,

    // System configuration
    osot_account_status: internal.osot_account_status,
    osot_active_member: internal.osot_active_member,
    osot_access_modifiers: internal.osot_access_modifiers,
    osot_privilege: internal.osot_privilege,
  };

  // Organization Context (Multi-Tenant) - @odata.bind for relationship
  if (internal.organizationGuid) {
    dataverse['osot_Table_Organization@odata.bind'] =
      `/osot_table_organizations(${internal.organizationGuid})`;
  }

  return dataverse;
}

/**
 * Map partial internal format to Dataverse update payload
 * Used for updating records in Dataverse
 */
export function mapInternalToDataverseUpdate(
  internal: Partial<AccountInternal>,
): Partial<
  Omit<
    AccountDataverse,
    | 'osot_table_accountid'
    | 'osot_account_id'
    | 'createdon'
    | 'modifiedon'
    | 'ownerid'
  >
> &
  Record<string, unknown> {
  const update: Partial<AccountDataverse> & Record<string, unknown> = {};

  // Personal information
  if (internal.osot_last_name !== undefined) {
    update.osot_last_name = internal.osot_last_name;
  }
  if (internal.osot_first_name !== undefined) {
    update.osot_first_name = internal.osot_first_name;
  }
  if (internal.osot_date_of_birth !== undefined) {
    update.osot_date_of_birth = internal.osot_date_of_birth;
  }

  // Contact information
  if (internal.osot_mobile_phone !== undefined) {
    update.osot_mobile_phone = internal.osot_mobile_phone;
  }
  if (internal.osot_email !== undefined) {
    update.osot_email = internal.osot_email;
  }
  if (internal.osot_password !== undefined) {
    update.osot_password = internal.osot_password;
  }

  // Account configuration
  if (internal.osot_account_group !== undefined) {
    update.osot_account_group = internal.osot_account_group;
  }
  if (internal.osot_account_declaration !== undefined) {
    update.osot_account_declaration = internal.osot_account_declaration;
  }

  // System configuration
  if (internal.osot_account_status !== undefined) {
    update.osot_account_status = internal.osot_account_status;
  }
  if (internal.osot_active_member !== undefined) {
    update.osot_active_member = internal.osot_active_member;
  }
  if (internal.osot_access_modifiers !== undefined) {
    update.osot_access_modifiers = internal.osot_access_modifiers;
  }
  if (internal.osot_privilege !== undefined) {
    update.osot_privilege = internal.osot_privilege;
  }

  // Organization Context (Multi-Tenant) - @odata.bind for relationship
  // Note: Changing organization after creation is rare, but supported for admin operations
  if (internal.organizationGuid !== undefined) {
    update['osot_Table_Organization@odata.bind'] =
      `/osot_table_organizations(${internal.organizationGuid})`;
  }

  return update;
}
