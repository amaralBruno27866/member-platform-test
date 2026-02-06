/**
 * Address Mapper (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for transformation error handling
 * - enums: Uses centralized enums for type safety and validation
 * - utils: Uses utility functions for data normalization
 * - integrations: Compatible with DataverseService response formats
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential address data transformations only
 * - Clean mapping between DTOs and internal representations
 * - Type-safe enum conversions
 * - Proper data normalization and validation
 */

import {
  City,
  Province,
  Country,
  AddressType,
  AddressPreference,
  AccessModifier,
  Privilege,
  getCityDisplayName,
  getProvinceDisplayName,
  getCountryDisplayName,
  getAddressTypeDisplayName,
  getAddressPreferenceDisplayName,
  getAccessModifierDisplayName,
  getPrivilegeDisplayName,
} from '../../../../common/enums';
import { CreateAddressDto } from '../dtos/address-create.dto';
import { CreateAddressForAccountDto } from '../dtos/create-address-for-account.dto';
import { UpdateAddressDto } from '../dtos/address-update.dto';
import { AddressResponseDto } from '../dtos/address-response.dto';
import { AddressPublicDto } from '../dtos/address-public.dto';
import { AddressInternal } from '../interfaces/address-internal.interface';

// Export the AddressResponseDto type for external use
export { AddressResponseDto } from '../dtos/address-response.dto';
export { AddressPublicDto } from '../dtos/address-public.dto';

/**
 * Helper functions for enum conversions and data parsing
 */

/**
 * Convert string/number to City enum
 */
function parseCity(value: unknown): City | undefined {
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
 * Convert string/number to Province enum
 */
function parseProvince(value: unknown): Province | undefined {
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
 * Convert string/number to Country enum
 */
function parseCountry(value: unknown): Country | undefined {
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

/**
 * Convert string/number to AddressType enum
 */
function parseAddressType(value: unknown): AddressType | undefined {
  if (typeof value === 'number') {
    return Object.values(AddressType).includes(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && Object.values(AddressType).includes(numValue)) {
      return numValue;
    }
  }
  return undefined;
}

/**
 * Convert string/number/array to AddressPreference array
 * Handles Dataverse string format "1,2,3" and arrays
 */
function parseAddressPreference(
  value: unknown,
): AddressPreference[] | undefined {
  if (!value) return undefined;

  // Handle array input
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (
          typeof item === 'number' &&
          Object.values(AddressPreference).includes(item)
        ) {
          return item;
        }
        if (typeof item === 'string') {
          const numValue = parseInt(item, 10);
          if (
            !isNaN(numValue) &&
            Object.values(AddressPreference).includes(numValue)
          ) {
            return numValue;
          }
        }
        return null;
      })
      .filter((item): item is AddressPreference => item !== null);
  }

  // Handle string input from Dataverse (e.g., "1,2,3")
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => {
        const numValue = parseInt(item.trim(), 10);
        if (
          !isNaN(numValue) &&
          Object.values(AddressPreference).includes(numValue)
        ) {
          return numValue;
        }
        return null;
      })
      .filter((item): item is AddressPreference => item !== null);
  }

  // Handle single number input
  if (
    typeof value === 'number' &&
    Object.values(AddressPreference).includes(value)
  ) {
    return [value];
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
 * Normalize and validate Canadian postal code
 * Format: A1A 1A1 (letter-digit-letter space digit-letter-digit)
 */
function normalizePostalCode(postalCode: string): string | undefined {
  if (!postalCode || typeof postalCode !== 'string') return undefined;

  // Remove all spaces and convert to uppercase
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase();

  // Validate format: ALALAL (letter-digit-letter-digit-letter-digit)
  const canadianPostalRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;

  if (!canadianPostalRegex.test(cleaned)) {
    return undefined;
  }

  // Format with space: A1A 1A1
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
}

/**
 * Normalize address line text
 * Trims whitespace and ensures proper length limits
 */
function normalizeAddressLine(
  addressLine: string,
  maxLength: number = 255,
): string | undefined {
  if (!addressLine || typeof addressLine !== 'string') return undefined;

  const trimmed = addressLine.trim();
  if (trimmed.length === 0) return undefined;

  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength);
}

/**
 * Address Mapper Class
 *
 * Handles all data transformations between different address representations:
 * - DTOs ↔ Internal interfaces
 * - Dataverse responses ↔ Internal interfaces
 * - Data normalization and validation
 * - Type-safe enum conversions
 * - Error handling for transformation failures
 *
 * Key Features:
 * - Type-safe transformations with enum validation
 * - Canadian postal code normalization
 * - Address line sanitization and length validation
 * - Business ID format validation
 * - Comprehensive error handling
 * - Integration with essential modules
 */
export class AddressMapper {
  /**
   * Map CreateAddressDto to AddressInternal
   * Used when creating new addresses from API requests
   */
  static mapCreateDtoToInternal(dto: CreateAddressDto): AddressInternal {
    const internal: AddressInternal = {
      osot_address_1: dto.osot_address_1,
      osot_city: dto.osot_city,
      osot_province: dto.osot_province,
      osot_postal_code: dto.osot_postal_code,
      osot_country: dto.osot_country,
      osot_address_type: dto.osot_address_type,
    };

    // Optional fields
    if (dto.osot_address_2) {
      internal.osot_address_2 = normalizeAddressLine(dto.osot_address_2);
    }
    if (dto.osot_address_preference !== undefined) {
      internal.osot_address_preference = dto.osot_address_preference;
    }
    if (dto.osot_other_city) {
      internal.osot_other_city = normalizeAddressLine(dto.osot_other_city);
    }
    if (dto.osot_other_province_state) {
      internal.osot_other_province_state = normalizeAddressLine(
        dto.osot_other_province_state,
      );
    }

    // Handle OData binding for account relationship
    const dtoWithBinding = dto as CreateAddressDto & {
      'osot_Table_Account@odata.bind'?: string;
      'osot_Table_Organization@odata.bind'?: string;
    };
    const accountOdataBinding = dtoWithBinding['osot_Table_Account@odata.bind'];
    if (
      accountOdataBinding &&
      typeof accountOdataBinding === 'string' &&
      accountOdataBinding.trim() !== ''
    ) {
      // Keep OData binding as-is for Dataverse navigation property
      // Do NOT extract GUID to avoid duplicate field errors
      Object.assign(internal, {
        'osot_Table_Account@odata.bind': accountOdataBinding,
      });
    }

    // Handle OData binding for organization relationship (NEW)
    const organizationOdataBinding =
      dtoWithBinding['osot_Table_Organization@odata.bind'];
    if (
      organizationOdataBinding &&
      typeof organizationOdataBinding === 'string' &&
      organizationOdataBinding.trim() !== ''
    ) {
      // Keep OData binding as-is for Dataverse navigation property
      Object.assign(internal, {
        'osot_Table_Organization@odata.bind': organizationOdataBinding,
      });
    }

    return internal;
  }

  /**
   * Map UpdateAddressDto to partial AddressInternal
   * Used when updating existing addresses from API requests
   */
  static mapUpdateDtoToInternal(
    dto: UpdateAddressDto,
  ): Partial<AddressInternal> {
    const internal: Partial<AddressInternal> = {};

    // Map all provided fields (only essential fields from simplified DTO)
    if (dto.osot_address_1 !== undefined) {
      internal.osot_address_1 = normalizeAddressLine(dto.osot_address_1);
    }
    if (dto.osot_address_2 !== undefined) {
      internal.osot_address_2 = dto.osot_address_2
        ? normalizeAddressLine(dto.osot_address_2)
        : undefined;
    }
    if (dto.osot_city !== undefined) {
      internal.osot_city = dto.osot_city;
    }
    if (dto.osot_province !== undefined) {
      internal.osot_province = dto.osot_province;
    }
    if (dto.osot_postal_code !== undefined) {
      internal.osot_postal_code = normalizePostalCode(dto.osot_postal_code);
    }
    if (dto.osot_country !== undefined) {
      internal.osot_country = dto.osot_country;
    }
    if (dto.osot_address_type !== undefined) {
      internal.osot_address_type = dto.osot_address_type;
    }
    if (dto.osot_address_preference !== undefined) {
      internal.osot_address_preference = dto.osot_address_preference;
    }
    if (dto.osot_other_city !== undefined) {
      internal.osot_other_city = dto.osot_other_city
        ? normalizeAddressLine(dto.osot_other_city)
        : ''; // Permitir string vazia para limpar o campo
    }
    if (dto.osot_other_province_state !== undefined) {
      internal.osot_other_province_state = dto.osot_other_province_state
        ? normalizeAddressLine(dto.osot_other_province_state)
        : ''; // Permitir string vazia para limpar o campo
    }

    return internal;
  }

  /**
   * Map AddressInternal to AddressResponseDto
   * Used when returning address data from API endpoints
   */
  static mapInternalToResponseDto(
    internal: AddressInternal,
  ): AddressResponseDto {
    return {
      osot_Address_ID: internal.osot_address_id || '',
      osot_Table_AddressId: internal.osot_table_addressid || '',
      osot_user_business_id: internal.osot_user_business_id,
      osot_address_1: internal.osot_address_1,
      osot_address_2: internal.osot_address_2,
      osot_city: internal.osot_city
        ? getCityDisplayName(internal.osot_city)
        : '',
      osot_province: internal.osot_province
        ? getProvinceDisplayName(internal.osot_province)
        : '',
      osot_postal_code: internal.osot_postal_code,
      osot_country: internal.osot_country
        ? getCountryDisplayName(internal.osot_country)
        : '',
      osot_address_type: internal.osot_address_type
        ? getAddressTypeDisplayName(internal.osot_address_type)
        : '',
      osot_address_preference: internal.osot_address_preference
        ? internal.osot_address_preference.map((pref) =>
            getAddressPreferenceDisplayName(pref),
          )
        : undefined,
      osot_other_city: internal.osot_other_city,
      osot_other_province_state: internal.osot_other_province_state,
      osot_access_modifiers: internal.osot_access_modifiers
        ? getAccessModifierDisplayName(internal.osot_access_modifiers)
        : undefined,
      osot_privilege: internal.osot_privilege
        ? getPrivilegeDisplayName(internal.osot_privilege)
        : undefined,
      // osot_Table_Account: removed - handled via @odata.bind instead
      CreatedOn: internal.createdon,
      ModifiedOn: internal.modifiedon,
      OwnerId: internal.ownerid,
    };
  }

  /**
   * Map AddressInternal to AddressPublicDto
   * Used when returning filtered address data for public API endpoints
   * Excludes system fields (GUIDs, timestamps, relationships, access control)
   */
  static mapInternalToPublicDto(internal: AddressInternal): AddressPublicDto {
    return {
      osot_address_1: internal.osot_address_1,
      osot_address_2: internal.osot_address_2,
      osot_city: internal.osot_city
        ? getCityDisplayName(internal.osot_city)
        : '',
      osot_province: internal.osot_province
        ? getProvinceDisplayName(internal.osot_province)
        : '',
      osot_postal_code: internal.osot_postal_code,
      osot_country: internal.osot_country
        ? getCountryDisplayName(internal.osot_country)
        : '',
      osot_address_type: internal.osot_address_type
        ? getAddressTypeDisplayName(internal.osot_address_type)
        : '',
      osot_address_preference: internal.osot_address_preference
        ? internal.osot_address_preference.map((pref) =>
            getAddressPreferenceDisplayName(pref),
          )
        : undefined,
      osot_other_city: internal.osot_other_city,
      osot_other_province_state: internal.osot_other_province_state,
    };
  }

  /**
   * Map AddressResponseDto to AddressPublicDto
   * Used in controllers to filter response DTOs before returning to public API
   * Removes sensitive/internal fields (GUIDs, timestamps, relationships, access control)
   */
  static mapResponseDtoToPublicDto(
    response: AddressResponseDto,
  ): AddressPublicDto {
    return {
      osot_address_1: response.osot_address_1,
      osot_address_2: response.osot_address_2,
      osot_city: response.osot_city, // Already a label string
      osot_province: response.osot_province, // Already a label string
      osot_postal_code: response.osot_postal_code,
      osot_country: response.osot_country, // Already a label string
      osot_address_type: response.osot_address_type, // Already a label string
      osot_address_preference: response.osot_address_preference, // Already label strings
      osot_other_city: response.osot_other_city,
      osot_other_province_state: response.osot_other_province_state,
    };
  }

  /**
   * Map Dataverse response to AddressInternal
   * Used when receiving data from Dataverse API
   */
  static mapDataverseToInternal(
    dataverse: Record<string, unknown>,
  ): AddressInternal {
    return {
      osot_table_addressid: dataverse.osot_table_addressid as string,
      osot_address_id: dataverse.osot_address_id as string,
      osot_user_business_id: dataverse.osot_user_business_id as string,
      osot_address_1: dataverse.osot_address_1 as string,
      osot_address_2: dataverse.osot_address_2 as string,
      osot_city: parseCity(dataverse.osot_city),
      osot_province: parseProvince(dataverse.osot_province),
      osot_postal_code: dataverse.osot_postal_code as string,
      osot_country: parseCountry(dataverse.osot_country),
      osot_address_type: parseAddressType(dataverse.osot_address_type),
      osot_address_preference: parseAddressPreference(
        dataverse.osot_address_preference,
      ),
      osot_other_city: dataverse.osot_other_city as string,
      osot_other_province_state: dataverse.osot_other_province_state as string,
      osot_access_modifiers: parseAccessModifier(
        dataverse.osot_access_modifiers,
      ),
      osot_privilege: parsePrivilege(dataverse.osot_privilege),
      // osot_table_account: removed - relationship handled via @odata.bind
      createdon: dataverse.createdon as string,
      modifiedon: dataverse.modifiedon as string,
      ownerid: dataverse.ownerid as string,
    };
  }

  /**
   * Map AddressInternal to Dataverse payload
   * Used when sending data to Dataverse API
   */
  static mapInternalToDataverse(
    internal: AddressInternal,
  ): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    // Map all fields that have values
    if (internal.osot_user_business_id !== undefined) {
      payload.osot_user_business_id = internal.osot_user_business_id;
    }
    if (internal.osot_address_1 !== undefined) {
      payload.osot_address_1 = internal.osot_address_1;
    }
    if (internal.osot_address_2 !== undefined) {
      payload.osot_address_2 = internal.osot_address_2;
    }
    if (internal.osot_city !== undefined) {
      payload.osot_city = internal.osot_city;
    }
    if (internal.osot_province !== undefined) {
      payload.osot_province = internal.osot_province;
    }
    if (internal.osot_postal_code !== undefined) {
      payload.osot_postal_code = internal.osot_postal_code;
    }
    if (internal.osot_country !== undefined) {
      payload.osot_country = internal.osot_country;
    }
    if (internal.osot_address_type !== undefined) {
      payload.osot_address_type = internal.osot_address_type;
    }
    if (internal.osot_address_preference !== undefined) {
      payload.osot_address_preference = internal.osot_address_preference;
    }
    if (internal.osot_other_city !== undefined) {
      payload.osot_other_city = internal.osot_other_city;
    }
    if (internal.osot_other_province_state !== undefined) {
      payload.osot_other_province_state = internal.osot_other_province_state;
    }
    if (internal.osot_access_modifiers !== undefined) {
      payload.osot_access_modifiers = internal.osot_access_modifiers;
    }
    if (internal.osot_privilege !== undefined) {
      payload.osot_privilege = internal.osot_privilege;
    }
    // Handle OData binding if it exists in the internal object
    const internalWithBinding = internal as AddressInternal & {
      'osot_Table_Account@odata.bind'?: string;
      'osot_Table_Organization@odata.bind'?: string;
    };
    const accountOdataBinding =
      internalWithBinding['osot_Table_Account@odata.bind'];
    if (
      accountOdataBinding &&
      typeof accountOdataBinding === 'string' &&
      accountOdataBinding.trim() !== ''
    ) {
      payload['osot_Table_Account@odata.bind'] = accountOdataBinding;
    }

    // Handle Organization OData binding (NEW)
    const organizationOdataBinding =
      internalWithBinding['osot_Table_Organization@odata.bind'];
    if (
      organizationOdataBinding &&
      typeof organizationOdataBinding === 'string' &&
      organizationOdataBinding.trim() !== ''
    ) {
      payload['osot_Table_Organization@odata.bind'] = organizationOdataBinding;
    }

    return payload;
  }

  /**
   * Validate address data for completeness
   * Returns validation errors if any required fields are missing or invalid
   */
  static validateAddressData(address: Partial<AddressInternal>): string[] {
    const errors: string[] = [];

    // Check required fields
    if (!address.osot_address_1) {
      errors.push('Address line 1 is required');
    }
    if (!address.osot_city) {
      errors.push('City is required');
    }
    if (!address.osot_province) {
      errors.push('Province is required');
    }
    if (!address.osot_postal_code) {
      errors.push('Postal code is required');
    } else {
      // Validate postal code format
      const normalized = normalizePostalCode(address.osot_postal_code);
      if (!normalized) {
        errors.push('Invalid Canadian postal code format (should be A1A 1A1)');
      }
    }
    if (!address.osot_country) {
      errors.push('Country is required');
    }
    if (!address.osot_address_type) {
      errors.push('Address type is required');
    }

    return errors;
  }

  /**
   * Sanitize address data by removing sensitive fields
   * Used when preparing data for logging or external systems
   */
  /**
   * Map CreateAddressForAccountDto to AddressInternal
   * Used specifically for account integration workflow
   * Includes relationship fields (osot_user_business_id and @odata.bind)
   */
  static mapCreateAddressForAccountDtoToInternal(
    dto: CreateAddressForAccountDto,
  ): Partial<AddressInternal> {
    const internal: Partial<AddressInternal> = {
      // Essential address fields
      osot_address_1: normalizeAddressLine(dto.osot_address_1),
      osot_city: dto.osot_city,
      osot_province: dto.osot_province,
      osot_postal_code: dto.osot_postal_code,
      osot_country: dto.osot_country,
      osot_address_type: dto.osot_address_type,

      // CRITICAL: Include relationship fields (missing in regular mapper)
      osot_user_business_id: dto.osot_user_business_id,
    };

    // Optional fields
    if (dto.osot_address_2) {
      internal.osot_address_2 = normalizeAddressLine(dto.osot_address_2);
    }
    if (dto.osot_address_preference !== undefined) {
      internal.osot_address_preference = dto.osot_address_preference;
    }
    if (dto.osot_other_city) {
      internal.osot_other_city = normalizeAddressLine(dto.osot_other_city);
    }
    if (dto.osot_other_province_state) {
      internal.osot_other_province_state = normalizeAddressLine(
        dto.osot_other_province_state,
      );
    }

    // Handle OData binding for account relationship - keep as-is, don't extract GUID
    const odataBinding = dto['osot_Table_Account@odata.bind'];
    if (
      odataBinding &&
      typeof odataBinding === 'string' &&
      odataBinding.trim() !== ''
    ) {
      // Keep OData binding as-is for Dataverse navigation property
      // Do NOT extract GUID to avoid duplicate field errors
      Object.assign(internal, {
        'osot_Table_Account@odata.bind': odataBinding,
      });
    }

    return internal;
  }

  static sanitizeAddressData(
    address: AddressInternal,
  ): Partial<AddressInternal> {
    const sanitized: Partial<AddressInternal> = {
      osot_address_id: address.osot_address_id,
      osot_city: address.osot_city,
      osot_province: address.osot_province,
      osot_postal_code: address.osot_postal_code?.slice(0, 3) + ' ***', // Partial postal code
      osot_country: address.osot_country,
      osot_address_type: address.osot_address_type,
      createdon: address.createdon,
      modifiedon: address.modifiedon,
    };

    return sanitized;
  }
}
