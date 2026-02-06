/**
 * Address Sanitizer Utility (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for sanitization errors
 * - enums: Uses centralized enums for validation
 * - utils: Integrates with global sanitization patterns
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential address data sanitization only
 * - Clean and normalize address input data
 * - Proper data validation and cleaning
 * - Canadian address format focus
 */

import type { AddressInternal } from '../interfaces/address-internal.interface';
import { PostalCodeValidator } from '../validators/postal-code.validator';
import { AddressBusinessRules } from '../rules/address-business-rules';

/**
 * Address Data Sanitizer
 * Sanitizes and cleans address input data
 */
export class AddressDataSanitizer {
  /**
   * Sanitize user business ID
   * @param businessId Raw business ID
   * @returns Cleaned business ID
   */
  static sanitizeUserBusinessId(businessId: string): string {
    if (!businessId) return '';

    return businessId
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, '') // Remove invalid characters
      .substring(0, 20); // Enforce max length from CSV
  }

  /**
   * Sanitize address line (address_1 or address_2)
   * @param addressLine Raw address line
   * @returns Cleaned address line
   */
  static sanitizeAddressLine(addressLine: string): string {
    if (!addressLine) return '';

    const cleaned = addressLine.trim();

    // Remove potentially dangerous characters
    const sanitized = cleaned
      .replace(/[<>]/g, '') // Remove HTML-like brackets
      .replace(/[^\w\s\-#.,'/]/g, '') // Keep only safe characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 255); // Enforce max length from CSV

    return sanitized;
  }

  /**
   * Sanitize Canadian postal code
   * DELEGATES TO PostalCodeValidator - Single source of truth
   * @param postalCode Raw postal code
   * @returns Cleaned postal code
   */
  static sanitizePostalCode(postalCode: string): string {
    // DELEGATE TO PostalCodeValidator.sanitize() - Single source of truth
    return PostalCodeValidator.sanitize(postalCode);
  }

  /**
   * Sanitize complete address data
   * @param address Raw address data
   * @returns Sanitized address data
   */
  static sanitizeAddressData(
    address: Partial<AddressInternal>,
  ): Partial<AddressInternal> {
    const sanitized: Partial<AddressInternal> = {};

    // Sanitize string fields
    if (address.osot_user_business_id) {
      sanitized.osot_user_business_id = this.sanitizeUserBusinessId(
        address.osot_user_business_id,
      );
    }

    if (address.osot_address_1) {
      sanitized.osot_address_1 = this.sanitizeAddressLine(
        address.osot_address_1,
      );
    }

    if (address.osot_address_2) {
      sanitized.osot_address_2 = this.sanitizeAddressLine(
        address.osot_address_2,
      );
    }

    if (address.osot_postal_code) {
      sanitized.osot_postal_code = this.sanitizePostalCode(
        address.osot_postal_code,
      );
    }

    // Sanitize other city/province fields
    if (address.osot_other_city !== undefined) {
      sanitized.osot_other_city = address.osot_other_city
        ? this.sanitizeAddressLine(address.osot_other_city)
        : '';
    }

    if (address.osot_other_province_state !== undefined) {
      sanitized.osot_other_province_state = address.osot_other_province_state
        ? this.sanitizeAddressLine(address.osot_other_province_state)
        : '';
    }

    // Copy enum fields (already validated by DTOs)
    if (address.osot_city !== undefined) {
      sanitized.osot_city = address.osot_city;
    }
    if (address.osot_province !== undefined) {
      sanitized.osot_province = address.osot_province;
    }
    if (address.osot_country !== undefined) {
      sanitized.osot_country = address.osot_country;
    }
    if (address.osot_address_type !== undefined) {
      sanitized.osot_address_type = address.osot_address_type;
    }
    if (address.osot_address_preference !== undefined) {
      sanitized.osot_address_preference = address.osot_address_preference;
    }
    if (address.osot_access_modifiers !== undefined) {
      sanitized.osot_access_modifiers = address.osot_access_modifiers;
    }
    if (address.osot_privilege !== undefined) {
      sanitized.osot_privilege = address.osot_privilege;
    }

    // Copy system fields as-is
    if (address.osot_table_addressid) {
      sanitized.osot_table_addressid = address.osot_table_addressid;
    }
    if (address.osot_address_id) {
      sanitized.osot_address_id = address.osot_address_id;
    }
    // osot_table_account: Removed - relationship handled via @odata.bind

    return sanitized;
  }

  /**
   * Validate address data against business rules
   * DELEGATES TO AddressBusinessRules - Single source of truth
   * @param address Address data to validate
   * @returns Validation result
   */
  static validateAddressData(address: Partial<AddressInternal>): {
    isValid: boolean;
    errors: string[];
  } {
    // Delegate to centralized business rules validation
    const validation = AddressBusinessRules.validateBusinessRules(address, {
      isRegistration: false,
    });

    return {
      isValid: validation.isValid,
      errors: validation.errors,
    };
  }

  /**
   * Check if address is complete for business use
   * @param address Address data
   * @returns Whether address is complete
   */
  static isCompleteAddress(address: Partial<AddressInternal>): boolean {
    const validation = this.validateAddressData(address);
    return validation.isValid;
  }

  /**
   * Strip sensitive or internal fields for public display
   * @param address Address data
   * @returns Public-safe address data
   */
  static stripInternalFields(
    address: AddressInternal,
  ): Partial<AddressInternal> {
    const publicAddress: Partial<AddressInternal> = {
      osot_address_1: address.osot_address_1,
      osot_address_2: address.osot_address_2,
      osot_city: address.osot_city,
      osot_province: address.osot_province,
      osot_postal_code: address.osot_postal_code,
      osot_country: address.osot_country,
      osot_address_type: address.osot_address_type,
      osot_address_preference: address.osot_address_preference,
    };

    return publicAddress;
  }
}
