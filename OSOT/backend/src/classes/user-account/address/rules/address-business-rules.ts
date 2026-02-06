/**
 * Address Business Rules (PURE VALIDATION LOGIC)
 *
 * CLEAR ARCHITECTURAL SEPARATION:
 * - rules: Business validation logic ONLY
 * - utils: Helper functions and utilities ONLY
 * - validators: DTO format validation ONLY
 * - services: Enterprise orchestration ONLY
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for business rule violations
 * - enums: Uses centralized enums for business logic
 * - validators: Uses PostalCodeValidator for postal code validation
 *
 * BUSINESS RULES PHILOSOPHY:
 * - Essential address business rules validation
 * - Clear constraint validation with detailed error messages
 * - Address relationship management validation
 * - Canadian address business logic validation
 * - NO helper functions (those go in utils/)
 * - NO DTO validation (those go in validators/)
 */

import {
  Country,
  AddressType,
  AddressPreference,
} from '../../../../common/enums';
import type { AddressInternal } from '../interfaces/address-internal.interface';
import { PostalCodeValidator } from '../validators/postal-code.validator';

/**
 * Address Business Rules Validator
 * PURE VALIDATION LOGIC - No helpers, no transformations
 */
export class AddressBusinessRules {
  /**
   * Validate address type business rules
   * @param existingAddresses User's existing addresses
   * @param newAddressType Type of new address
   * @returns Validation result
   */
  static validateAddressTypeRules(
    _existingAddresses: AddressInternal[],
    _newAddressType: AddressType,
  ): { isValid: boolean; message?: string } {
    // Business rule: Users can have multiple addresses of the same type
    // This is allowed for flexibility (e.g., multiple work addresses)

    // Currently no restrictions on address type duplicates
    return { isValid: true };
  }

  /**
   * Validate address preference business rules
   * @param existingAddresses User's existing addresses
   * @param newPreference Preference for new address
   * @returns Validation result
   */
  static validateAddressPreferenceRules(
    existingAddresses: AddressInternal[],
    newPreference?: AddressPreference[],
  ): { isValid: boolean; message?: string } {
    if (!newPreference || newPreference.length === 0) {
      return { isValid: true }; // Preference is optional
    }

    // Business rule: Multiple addresses can have the same preference
    // This allows flexibility in address management
    // Arrays are supported for multi-select preferences

    return { isValid: true };
  }

  /**
   * Validate address country-specific business rules
   * DELEGATES postal code validation to PostalCodeValidator - Single source of truth
   * @param address Address data
   * @returns Validation result
   */
  static validateCountrySpecificRules(address: Partial<AddressInternal>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate optional "other" fields if provided (applies to all countries)
    if (address.osot_other_city) {
      if (address.osot_other_city.trim().length < 2) {
        errors.push('Other city must be at least 2 characters long');
      }
      if (address.osot_other_city.trim().length > 255) {
        errors.push('Other city cannot exceed 255 characters');
      }
    }

    if (address.osot_other_province_state) {
      if (address.osot_other_province_state.trim().length < 2) {
        errors.push('Other province/state must be at least 2 characters long');
      }
      if (address.osot_other_province_state.trim().length > 255) {
        errors.push('Other province/state cannot exceed 255 characters');
      }
    }

    if (address.osot_country === Country.CANADA) {
      // Canadian address validation - DELEGATE TO PostalCodeValidator
      if (address.osot_postal_code) {
        if (!PostalCodeValidator.isValid(address.osot_postal_code)) {
          errors.push('Invalid Canadian postal code format (e.g., K1A 0A6)');
        }
      }

      // Canadian addresses should have valid provinces
      if (!address.osot_province) {
        errors.push('Province is required for Canadian addresses');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate address against complete business constraints
   * MAIN VALIDATION METHOD - Orchestrates all business rule validations
   * @param address Address data
   * @param context Business context
   * @returns Validation result with business rule messages
   */
  static validateBusinessRules(
    address: Partial<AddressInternal>,
    context: {
      isRegistration?: boolean;
      isUpdate?: boolean;
      existingAddresses?: AddressInternal[];
      userBusinessId?: string;
    } = {},
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // For updates, only validate fields that are actually being provided
    // This follows the same pattern as AccountBusinessRules.validateAccountUpdate
    if (context.isUpdate) {
      // For updates, we only validate the fields that are present
      // No required field validation for partial updates
    } else {
      // For creation, validate all required fields
      const requiredFields = this.getRequiredFieldsForValidation(
        context.isRegistration,
        address.osot_address_type,
      );

      for (const field of requiredFields) {
        if (!address[field as keyof AddressInternal]) {
          errors.push(`${field} is required`);
        }
      }
    }

    // Validate country-specific rules
    const countryValidation = this.validateCountrySpecificRules(address);
    errors.push(...countryValidation.errors);

    // Validate address type rules
    if (context.existingAddresses && address.osot_address_type) {
      const typeValidation = this.validateAddressTypeRules(
        context.existingAddresses,
        address.osot_address_type,
      );
      if (!typeValidation.isValid && typeValidation.message) {
        errors.push(typeValidation.message);
      }
    }

    // Validate address preference rules
    if (context.existingAddresses) {
      const preferenceValidation = this.validateAddressPreferenceRules(
        context.existingAddresses,
        address.osot_address_preference,
      );
      if (!preferenceValidation.isValid && preferenceValidation.message) {
        warnings.push(preferenceValidation.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ========================================
  // PRIVATE HELPER METHODS FOR VALIDATION
  // ========================================

  /**
   * Get required fields for validation context
   * PRIVATE - Only used internally for validation
   */
  private static getRequiredFieldsForValidation(
    isRegistration: boolean = false,
    addressType?: AddressType,
  ): string[] {
    const requiredFields = [
      'osot_user_business_id',
      'osot_address_1',
      'osot_city',
      'osot_province',
      'osot_postal_code',
      'osot_country',
      'osot_address_type',
    ];

    if (isRegistration) {
      // Additional requirements for registration
      requiredFields.push('osot_table_account'); // Must be linked to account
    }

    if (addressType === AddressType.WORK) {
      // Work addresses might have additional requirements
      // Currently no additional fields required
    }

    return requiredFields;
  }
}
