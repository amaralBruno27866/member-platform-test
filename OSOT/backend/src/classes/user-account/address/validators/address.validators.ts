/**
 * Address Validators (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes and ErrorMessages for structured validation
 * - constants: Uses ADDRESS_FIELD_LIMITS and CANADIAN_POSTAL_CODE_PATTERN
 * - enums: Validates against centralized enums
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential validation only for OSOT address management
 * - Canadian postal code validation (simple regex)
 * - Required field validation
 * - OData binding validation for Account relationship
 * - Remove complex geographic validations
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ADDRESS_FIELD_LIMITS } from '../constants/address.constants';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  City,
  Province,
  Country,
  AddressType,
  AddressPreference,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

/**
 * Validator for Address User Business ID
 * Validates format and length requirements
 */
@ValidatorConstraint({ name: 'addressUserBusinessId', async: false })
export class AddressUserBusinessIdValidator
  implements ValidatorConstraintInterface
{
  validate(userBusinessId: string): boolean {
    if (!userBusinessId) return true; // Optional field

    // Check length constraints
    if (userBusinessId.length > ADDRESS_FIELD_LIMITS.USER_BUSINESS_ID) {
      return false;
    }

    // Simple alphanumeric with basic special characters validation
    const pattern = /^[a-zA-Z0-9_-]+$/;
    return pattern.test(userBusinessId.trim());
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

/**
 * Validator for Address Line 1
 * Validates required field with length constraints
 */
@ValidatorConstraint({ name: 'addressLine1', async: false })
export class AddressLine1Validator implements ValidatorConstraintInterface {
  validate(address1: string): boolean {
    if (!address1) return false; // Required field

    const trimmed = address1.trim();

    // Check minimum length (at least some meaningful content)
    if (trimmed.length < 3) {
      return false;
    }

    // Check maximum length
    if (trimmed.length > ADDRESS_FIELD_LIMITS.ADDRESS_1) {
      return false;
    }

    // Basic pattern validation (allow letters, numbers, spaces, common punctuation)
    const pattern = /^[a-zA-Z0-9\s,.-/#]+$/;
    return pattern.test(trimmed);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

/**
 * Validator for Address Line 2
 * Validates optional field with length constraints
 */
@ValidatorConstraint({ name: 'addressLine2', async: false })
export class AddressLine2Validator implements ValidatorConstraintInterface {
  validate(address2: string): boolean {
    if (!address2) return true; // Optional field

    const trimmed = address2.trim();

    // Check maximum length
    if (trimmed.length > ADDRESS_FIELD_LIMITS.ADDRESS_2) {
      return false;
    }

    // Basic pattern validation (allow letters, numbers, spaces, common punctuation)
    const pattern = /^[a-zA-Z0-9\s,.-/#]+$/;
    return pattern.test(trimmed);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

/**
 * Validator for Other City
 * Validates optional field with length constraints
 */
@ValidatorConstraint({ name: 'otherCity', async: false })
export class OtherCityValidator implements ValidatorConstraintInterface {
  validate(otherCity: string): boolean {
    if (!otherCity) return true; // Optional field

    const trimmed = otherCity.trim();

    // Allow empty string (for clearing the field)
    if (trimmed.length === 0) {
      return true;
    }

    // Check minimum length (at least 2 characters for meaningful city name)
    if (trimmed.length < 2) {
      return false;
    }

    // Check maximum length
    if (trimmed.length > ADDRESS_FIELD_LIMITS.OTHER_CITY) {
      return false;
    }

    // Basic pattern validation (allow letters, numbers, spaces, common punctuation for city names)
    const pattern = /^[a-zA-Z0-9\s,.-/']+$/;
    return pattern.test(trimmed);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

/**
 * Validator for Other Province/State
 * Validates optional field with length constraints
 */
@ValidatorConstraint({ name: 'otherProvinceState', async: false })
export class OtherProvinceStateValidator
  implements ValidatorConstraintInterface
{
  validate(otherProvinceState: string): boolean {
    if (!otherProvinceState) return true; // Optional field

    const trimmed = otherProvinceState.trim();

    // Allow empty string (for clearing the field)
    if (trimmed.length === 0) {
      return true;
    }

    // Check minimum length (at least 2 characters for meaningful province/state name)
    if (trimmed.length < 2) {
      return false;
    }

    // Check maximum length
    if (trimmed.length > ADDRESS_FIELD_LIMITS.OTHER_PROVINCE_STATE) {
      return false;
    }

    // Basic pattern validation (allow letters, numbers, spaces, common punctuation for province/state names)
    const pattern = /^[a-zA-Z0-9\s,.-/']+$/;
    return pattern.test(trimmed);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

/**
 * Validator for OData Account Binding
 * Validates /osot_table_accounts(guid) format
 */
@ValidatorConstraint({ name: 'odataAccountBinding', async: false })
export class ODataAccountBindingValidator
  implements ValidatorConstraintInterface
{
  validate(binding: string): boolean {
    if (!binding) return false; // Required for creation

    // OData binding pattern: /osot_table_accounts(guid)
    const pattern =
      /^\/osot_table_accounts\([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\)$/i;
    return pattern.test(binding.trim());
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_INPUT].publicMessage;
  }
}

/**
 * Validator for City Enum
 * Validates against centralized City enum
 */
@ValidatorConstraint({ name: 'cityEnum', async: false })
export class CityEnumValidator implements ValidatorConstraintInterface {
  validate(city: unknown): boolean {
    if (city === null || city === undefined) return false; // Required field

    // Check if value exists in City enum
    return Object.values(City).includes(city as City);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

/**
 * Validator for Province Enum
 * Validates against centralized Province enum
 */
@ValidatorConstraint({ name: 'provinceEnum', async: false })
export class ProvinceEnumValidator implements ValidatorConstraintInterface {
  validate(province: unknown): boolean {
    if (province === null || province === undefined) return false; // Required field

    // Check if value exists in Province enum
    return Object.values(Province).includes(province as Province);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

/**
 * Validator for Country Enum
 * Validates against centralized Country enum
 */
@ValidatorConstraint({ name: 'countryEnum', async: false })
export class CountryEnumValidator implements ValidatorConstraintInterface {
  validate(country: unknown): boolean {
    if (country === null || country === undefined) return false; // Required field

    // Check if value exists in Country enum
    return Object.values(Country).includes(country as Country);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

/**
 * Validator for AddressType Enum
 * Validates against centralized AddressType enum
 */
@ValidatorConstraint({ name: 'addressTypeEnum', async: false })
export class AddressTypeEnumValidator implements ValidatorConstraintInterface {
  validate(addressType: unknown): boolean {
    if (addressType === null || addressType === undefined) return false; // Required field

    // Check if value exists in AddressType enum
    return Object.values(AddressType).includes(addressType as AddressType);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

/**
 * Validator for AddressPreference Enum (Optional)
 * Validates against centralized AddressPreference enum
 */
@ValidatorConstraint({ name: 'addressPreferenceEnum', async: false })
export class AddressPreferenceEnumValidator
  implements ValidatorConstraintInterface
{
  validate(preference: unknown): boolean {
    if (preference === null || preference === undefined) return true; // Optional field

    // Check if value exists in AddressPreference enum
    return Object.values(AddressPreference).includes(
      preference as AddressPreference,
    );
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

/**
 * Validator for AccessModifier Enum (Optional)
 * Validates against centralized AccessModifier enum
 */
@ValidatorConstraint({ name: 'accessModifierEnum', async: false })
export class AccessModifierEnumValidator
  implements ValidatorConstraintInterface
{
  validate(accessModifier: unknown): boolean {
    if (accessModifier === null || accessModifier === undefined) return true; // Optional field

    // Check if value exists in AccessModifier enum
    return Object.values(AccessModifier).includes(
      accessModifier as AccessModifier,
    );
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}

/**
 * Validator for Privilege Enum (Optional)
 * Validates against centralized Privilege enum
 */
@ValidatorConstraint({ name: 'privilegeEnum', async: false })
export class PrivilegeEnumValidator implements ValidatorConstraintInterface {
  validate(privilege: unknown): boolean {
    if (privilege === null || privilege === undefined) return true; // Optional field

    // Check if value exists in Privilege enum
    return Object.values(Privilege).includes(privilege as Privilege);
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.VALIDATION_ERROR].publicMessage;
  }
}
