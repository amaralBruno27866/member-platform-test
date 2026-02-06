/**
 * Address Utilities (PURE HELPER FUNCTIONS)
 *
 * CLEAR ARCHITECTURAL SEPARATION:
 * - utils: Helper functions and utilities ONLY
 * - rules: Business validation logic ONLY
 * - validators: DTO format validation ONLY
 * - services: Enterprise orchestration ONLY
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for helper logic
 *
 * UTILITIES PHILOSOPHY:
 * - Helper functions for address operations
 * - Default value generators
 * - Convenience functions for common operations
 * - Transformers and formatters
 * - NO validation logic (those go in rules/)
 * - NO DTO validation (those go in validators/)
 * - NO business rules (those go in rules/)
 */

import {
  AddressType,
  AddressPreference,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';
import { getAddressPreferenceDisplayName } from '../../../../common/enums/address-preference.enum';
import type { AddressInternal } from '../interfaces/address-internal.interface';

/**
 * Address Utilities Helper
 * PURE HELPER FUNCTIONS - No validation, no business rules
 */
export class AddressUtils {
  /**
   * Check if user can have multiple addresses
   * @returns Whether multiple addresses are allowed
   */
  static canHaveMultipleAddresses(): boolean {
    // Business rule: Users can have multiple addresses (home, work, etc.)
    return true;
  }

  /**
   * Determine required fields based on address context
   * PUBLIC UTILITY - For use by forms, DTOs, etc.
   * @param isRegistration Whether this is for registration
   * @param addressType Type of address being created
   * @returns List of required field names
   */
  static getRequiredFields(
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

  /**
   * Determine default address preference for new address
   * @param existingAddresses User's existing addresses
   * @param addressType Type of new address
   * @returns Suggested preference
   */
  static getDefaultAddressPreference(
    existingAddresses: AddressInternal[],
    addressType: AddressType,
  ): AddressPreference {
    // If this is the first address, make it primary for mail
    if (existingAddresses.length === 0) {
      return AddressPreference.MAIL;
    }

    // Default preferences based on address type
    switch (addressType) {
      case AddressType.HOME:
        return AddressPreference.MAIL;
      case AddressType.WORK:
        return AddressPreference.BILLING;
      case AddressType.OTHER:
      default:
        return AddressPreference.OTHER;
    }
  }

  /**
   * Check if address can be primary (main) address
   * @param address Address data
   * @returns Whether address can be primary
   */
  static canBePrimaryAddress(address: Partial<AddressInternal>): boolean {
    // Any complete address can be primary
    const hasRequiredFields = Boolean(
      address.osot_address_1 &&
        address.osot_city &&
        address.osot_province &&
        address.osot_postal_code &&
        address.osot_country,
    );

    return hasRequiredFields;
  }

  /**
   * Determine access modifiers for address based on context
   * @param addressType Type of address
   * @param isRegistration Whether this is during registration
   * @returns Suggested access modifier
   */
  static getDefaultAccessModifier(
    addressType: AddressType,
    isRegistration: boolean = false,
  ): AccessModifier {
    if (isRegistration) {
      // Registration addresses start as private
      return AccessModifier.PRIVATE;
    }

    switch (addressType) {
      case AddressType.HOME:
        return AccessModifier.PRIVATE;
      case AddressType.WORK:
        return AccessModifier.PROTECTED; // Work addresses can be protected
      case AddressType.OTHER:
      default:
        return AccessModifier.PRIVATE;
    }
  }

  /**
   * Determine privilege level for address based on context
   * @param isOwner Whether user is the owner
   * @param isRegistration Whether this is during registration
   * @returns Suggested privilege level
   */
  static getDefaultPrivilege(
    isOwner: boolean = true,
    isRegistration: boolean = false,
  ): Privilege {
    if (isOwner || isRegistration) {
      return Privilege.OWNER;
    }

    return Privilege.MAIN;
  }

  /**
   * Check if address is complete for display purposes
   * @param address Address data
   * @returns Whether address has all display fields
   */
  static isCompleteForDisplay(address: Partial<AddressInternal>): boolean {
    return Boolean(
      address.osot_address_1 &&
        address.osot_city &&
        address.osot_province &&
        address.osot_postal_code &&
        address.osot_country,
    );
  }

  /**
   * Format address for display
   * @param address Address data
   * @returns Formatted address string
   */
  static formatForDisplay(address: Partial<AddressInternal>): string {
    const parts: string[] = [];

    if (address.osot_address_1) {
      parts.push(address.osot_address_1);
    }

    if (address.osot_address_2) {
      parts.push(address.osot_address_2);
    }

    if (
      address.osot_city &&
      address.osot_province &&
      address.osot_postal_code
    ) {
      parts.push(
        `${address.osot_city}, ${address.osot_province} ${address.osot_postal_code}`,
      );
    }

    if (address.osot_country) {
      parts.push(address.osot_country.toString());
    }

    return parts.join('\n');
  }

  /**
   * Get address type display name
   * @param addressType Address type enum value
   * @returns Human-readable address type name
   */
  static getAddressTypeDisplayName(addressType: AddressType): string {
    switch (addressType) {
      case AddressType.HOME:
        return 'Home';
      case AddressType.WORK:
        return 'Work';
      case AddressType.OTHER:
        return 'Other';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get address preference display name
   * DELEGATED TO CENTRALIZED ENUM FUNCTION - No duplication
   * @param preference Address preference enum value
   * @returns Human-readable preference name
   */
  static getAddressPreferenceDisplayName(
    preference?: AddressPreference,
  ): string {
    if (!preference) return 'No preference';

    // Delegate to centralized enum function to avoid duplication
    return getAddressPreferenceDisplayName(preference);
  }
}
