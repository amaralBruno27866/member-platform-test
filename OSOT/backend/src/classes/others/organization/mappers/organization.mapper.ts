/**
 * Organization Mappers
 *
 * Bidirectional transformation functions for Organization entity:
 * - Dataverse (raw API) ↔ Internal (TypeScript types) ↔ Response DTOs
 *
 * TRANSFORMATION LAYERS:
 * 1. Dataverse → Internal: Parse strings/numbers to Date/enums
 * 2. Internal → Dataverse: Convert Date/enums to strings/numbers
 * 3. Internal → Response DTOs: Format for API responses
 *
 * FIELD TRANSFORMATIONS:
 * - Dates: ISO string ↔ Date objects (createdon, modifiedon)
 * - Enums: numbers ↔ TypeScript enums (status, privilege, access_modifier)
 * - All other fields: Direct mapping (strings remain strings)
 */

import { OrganizationInternal, OrganizationDataverse } from '../interfaces';
import {
  OrganizationResponseDto,
  OrganizationPublicResponseDto,
} from '../dtos';
import {
  AccountStatus,
  Privilege,
  AccessModifier,
  getAccountStatusDisplayName,
} from '../../../../common/enums';

// ========================================
// UTILITY FUNCTIONS (Type Parsers)
// ========================================

/**
 * Parse AccountStatus from Dataverse value
 * Handles numeric values (1=Active, 2=Inactive, 3=Pending)
 */
export function parseAccountStatus(value: unknown): AccountStatus | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (Object.values(AccountStatus).includes(value)) {
      return value as AccountStatus;
    }
  }

  return null;
}

/**
 * Parse Privilege from Dataverse value
 * Handles numeric values (1=Owner, 2=Admin, 3=Main)
 */
export function parsePrivilege(value: unknown): Privilege | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (Object.values(Privilege).includes(value)) {
      return value as Privilege;
    }
  }

  return null;
}

/**
 * Parse AccessModifier from Dataverse value
 * Handles numeric values (0=Public, 1=Protected, 2=Private)
 */
export function parseAccessModifier(value: unknown): AccessModifier | null {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') {
    if (Object.values(AccessModifier).includes(value)) {
      return value as AccessModifier;
    }
  }

  return null;
}

/**
 * Parse date value from Dataverse
 * Handles ISO strings and Date objects
 */
export function parseDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

// ========================================
// COMPUTED FIELD CALCULATORS
// ========================================

/**
 * Calculate if organization is active
 * Based on organization_status === ACTIVE
 */
function calculateIsActive(status: AccountStatus | null | undefined): boolean {
  return status === AccountStatus.ACTIVE;
}

/**
 * Calculate if organization has complete branding
 * Both logo and website must be set
 */
function calculateHasCompleteBranding(
  logo: string | undefined,
  website: string | undefined,
): boolean {
  return Boolean(logo && website);
}

// ========================================
// MAIN MAPPER FUNCTIONS
// ========================================

/**
 * Map raw Dataverse response to Internal format
 * Converts API data (strings, numbers) to TypeScript types (Date, enums)
 *
 * @param rawData - Raw Dataverse API response
 * @returns OrganizationInternal or null if invalid
 */
export function toInternal(rawData: unknown): OrganizationInternal | null {
  if (!rawData || typeof rawData !== 'object') return null;

  const data = rawData as Record<string, unknown>;

  try {
    // Required fields validation
    const osot_organization_name = data.osot_organization_name as string;
    const osot_legal_name = data.osot_legal_name as string;
    const osot_slug = data.osot_slug as string;
    const osot_organization_logo = data.osot_organization_logo as string;
    const osot_organization_website = data.osot_organization_website as string;
    const osot_representative = data.osot_representative as string;
    const osot_organization_email = data.osot_organization_email as string;
    const osot_organization_phone = data.osot_organization_phone as string;

    if (
      !osot_organization_name ||
      !osot_legal_name ||
      !osot_slug ||
      !osot_organization_logo ||
      !osot_organization_website ||
      !osot_representative ||
      !osot_organization_email ||
      !osot_organization_phone
    ) {
      console.warn('Missing required fields in Dataverse data');
      return null;
    }

    // System fields
    const osot_table_organizationid = data.osot_table_organizationid as
      | string
      | undefined;
    const osot_organizationid = data.osot_organizationid as string | undefined;
    const createdon = parseDate(data.createdon);
    const modifiedon = parseDate(data.modifiedon);
    const ownerid = data.ownerid as string | undefined;

    // Optional fields
    const osot_acronym = data.osot_acronym as string | undefined;
    const osot_organization_status = parseAccountStatus(
      data.osot_organization_status,
    );
    const osot_privilege = parsePrivilege(data.osot_privilege);
    const osot_access_modifier = parseAccessModifier(data.osot_access_modifier);

    // Relationship fields (NEW)
    const addressGuid = data._osot_table_address_value as string | undefined;

    // Computed fields
    const isActive = calculateIsActive(osot_organization_status);
    const hasCompleteBranding = calculateHasCompleteBranding(
      osot_organization_logo,
      osot_organization_website,
    );

    // Build internal object
    const internal: OrganizationInternal = {
      // System fields
      osot_table_organizationid,
      osot_organizationid,
      createdon: createdon ?? undefined,
      modifiedon: modifiedon ?? undefined,
      ownerid,

      // Required fields
      osot_organization_name,
      osot_legal_name,
      osot_slug,
      osot_organization_logo,
      osot_organization_website,
      osot_representative,
      osot_organization_email,
      osot_organization_phone,

      // Optional fields
      osot_acronym,
      osot_organization_status: osot_organization_status ?? undefined,
      osot_privilege: osot_privilege ?? undefined,
      osot_access_modifier: osot_access_modifier ?? undefined,

      // Relationship fields (NEW)
      addressGuid,

      // Computed fields
      isActive,
      hasCompleteBranding,
    };

    return internal;
  } catch (error) {
    console.error('Error mapping Dataverse to Internal:', error);
    return null;
  }
}

/**
 * Map Internal format to Dataverse format
 * Converts TypeScript types (Date, enums) to API data (strings, numbers)
 *
 * @param internal - OrganizationInternal object
 * @returns OrganizationDataverse
 */
export function toDataverse(
  internal: OrganizationInternal,
): OrganizationDataverse {
  const dataverse: OrganizationDataverse = {
    // System fields (preserve if present)
    osot_table_organizationid: internal.osot_table_organizationid,
    osot_organizationid: internal.osot_organizationid,
    createdon: internal.createdon?.toISOString(),
    modifiedon: internal.modifiedon?.toISOString(),
    ownerid: internal.ownerid,

    // Required fields
    osot_organization_name: internal.osot_organization_name,
    osot_legal_name: internal.osot_legal_name,
    osot_slug: internal.osot_slug,
    osot_organization_logo: internal.osot_organization_logo,
    osot_organization_website: internal.osot_organization_website,
    osot_representative: internal.osot_representative,
    osot_organization_email: internal.osot_organization_email,
    osot_organization_phone: internal.osot_organization_phone,

    // Optional fields (enums converted to numbers)
    osot_acronym: internal.osot_acronym,
    osot_organization_status: internal.osot_organization_status,
    osot_privilege: internal.osot_privilege,
    osot_access_modifier: internal.osot_access_modifier,

    // Note: Computed fields (isActive, hasCompleteBranding) are NOT sent to Dataverse
  };

  // Handle OData binding for address relationship if it exists (NEW)
  const internalWithBinding = internal as OrganizationInternal & {
    'osot_Table_Address@odata.bind'?: string;
  };
  const odataBinding = internalWithBinding['osot_Table_Address@odata.bind'];
  if (
    odataBinding &&
    typeof odataBinding === 'string' &&
    odataBinding.trim() !== ''
  ) {
    (
      dataverse as OrganizationDataverse & {
        'osot_Table_Address@odata.bind'?: string;
      }
    )['osot_Table_Address@odata.bind'] = odataBinding;
  }

  return dataverse;
}

/**
 * Map Internal format to Response DTO
 * Converts to user-facing API response with human-readable labels
 *
 * @param internal - OrganizationInternal object
 * @returns OrganizationResponseDto
 */
export function toResponseDto(
  internal: OrganizationInternal,
): OrganizationResponseDto {
  return {
    osot_organizationid: internal.osot_organizationid ?? '',
    osot_organization_name: internal.osot_organization_name,
    osot_legal_name: internal.osot_legal_name,
    osot_acronym: internal.osot_acronym,
    osot_slug: internal.osot_slug,
    osot_organization_status: internal.osot_organization_status
      ? getAccountStatusDisplayName(internal.osot_organization_status)
      : 'Unknown',
    osot_organization_logo: internal.osot_organization_logo,
    osot_organization_website: internal.osot_organization_website,
    osot_representative: internal.osot_representative,
    osot_organization_email: internal.osot_organization_email,
    osot_organization_phone: internal.osot_organization_phone,
  };
}

/**
 * Map Internal format to Public Response DTO
 * Returns only public-safe fields (for white-label login)
 *
 * @param internal - OrganizationInternal object
 * @returns OrganizationPublicResponseDto
 */
export function toPublicResponseDto(
  internal: OrganizationInternal,
): OrganizationPublicResponseDto {
  return {
    osot_organizationid: internal.osot_organizationid ?? '',
    osot_organization_name: internal.osot_organization_name,
    osot_acronym: internal.osot_acronym,
    osot_slug: internal.osot_slug,
    osot_organization_logo: internal.osot_organization_logo,
    osot_organization_website: internal.osot_organization_website,
  };
}

/**
 * Batch map Dataverse array to Internal array
 * Filters out null results from invalid data
 *
 * @param dataverseArray - Array of raw Dataverse responses
 * @returns Array of OrganizationInternal objects
 */
export function toInternalArray(
  dataverseArray: unknown[],
): OrganizationInternal[] {
  return dataverseArray
    .map((item) => toInternal(item))
    .filter((item): item is OrganizationInternal => item !== null);
}

/**
 * Batch map Internal array to Response DTO array
 *
 * @param internalArray - Array of OrganizationInternal objects
 * @returns Array of OrganizationResponseDto objects
 */
export function toResponseDtoArray(
  internalArray: OrganizationInternal[],
): OrganizationResponseDto[] {
  return internalArray.map(
    (item): OrganizationResponseDto => toResponseDto(item),
  );
}

/**
 * Batch map Internal array to Public Response DTO array
 *
 * @param internalArray - Array of OrganizationInternal objects
 * @returns Array of OrganizationPublicResponseDto objects
 */
export function toPublicResponseDtoArray(
  internalArray: OrganizationInternal[],
): OrganizationPublicResponseDto[] {
  return internalArray.map(
    (item): OrganizationPublicResponseDto => toPublicResponseDto(item),
  );
}
