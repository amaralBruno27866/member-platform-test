/**
 * Address Formatter Utility (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes for formatting errors
 * - enums: Uses centralized enums for type safety
 * - utils: Integrates with global postal code and sanitization utils
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential address formatting only
 * - Canadian postal code focus
 * - Clean address display formats
 * - Geographic data normalization
 */

import {
  City,
  Province,
  Country,
  AddressType,
  AddressPreference,
} from '../../../../common/enums';
import { getAddressPreferenceDisplayName } from '../../../../common/enums/address-preference.enum';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { AppError } from '../../../../common/errors/app-error';
import type { AddressInternal } from '../interfaces/address-internal.interface';

/**
 * Address Formatter Class
 * Formats and normalizes address data for display and storage
 */
export class AddressFormatter {
  /**
   * Format Canadian postal code to standard K1A 0A6 format
   * @param postalCode Raw postal code input
   * @returns Formatted postal code
   */
  static formatCanadianPostalCode(postalCode: string): string {
    if (!postalCode) return '';

    // Remove all non-alphanumeric characters and convert to uppercase
    const cleaned = postalCode.replace(/[^A-Z0-9]/gi, '').toUpperCase();

    // Validate Canadian postal code pattern
    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(cleaned)) {
      throw new AppError(
        ErrorCodes.INVALID_POSTAL_CODE,
        'Invalid Canadian postal code format',
        { postalCode: cleaned },
      );
    }

    // Format as K1A 0A6
    return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)}`;
  }

  /**
   * Format full address display string
   * @param address Address data
   * @returns Formatted address string
   */
  static formatFullAddress(address: AddressInternal): string {
    const parts: string[] = [];

    // Address line 1 (required)
    if (address.osot_address_1) {
      parts.push(address.osot_address_1.trim());
    }

    // Address line 2 (optional)
    if (address.osot_address_2) {
      parts.push(address.osot_address_2.trim());
    }

    // City, Province Postal Code
    const cityProvince: string[] = [];
    if (address.osot_city) {
      cityProvince.push(this.getCityDisplayName(address.osot_city));
    }
    if (address.osot_province) {
      cityProvince.push(this.getProvinceDisplayName(address.osot_province));
    }

    if (cityProvince.length > 0) {
      let cityProvinceStr = cityProvince.join(', ');
      if (address.osot_postal_code) {
        cityProvinceStr += ` ${address.osot_postal_code}`;
      }
      parts.push(cityProvinceStr);
    }

    // Country (if not Canada)
    if (address.osot_country && address.osot_country !== Country.CANADA) {
      parts.push(this.getCountryDisplayName(address.osot_country));
    }

    return parts.join(', ');
  }

  /**
   * Format address for mailing label (multi-line)
   * @param address Address data
   * @returns Array of address lines for mailing
   */
  static formatMailingLabel(address: AddressInternal): string[] {
    const lines: string[] = [];

    // Address line 1
    if (address.osot_address_1) {
      lines.push(address.osot_address_1.trim());
    }

    // Address line 2
    if (address.osot_address_2) {
      lines.push(address.osot_address_2.trim());
    }

    // City Province Postal Code
    const cityLine: string[] = [];
    if (address.osot_city) {
      cityLine.push(this.getCityDisplayName(address.osot_city));
    }
    if (address.osot_province) {
      cityLine.push(this.getProvinceDisplayName(address.osot_province));
    }
    if (address.osot_postal_code) {
      cityLine.push(address.osot_postal_code);
    }

    if (cityLine.length > 0) {
      lines.push(cityLine.join(' '));
    }

    // Country
    if (address.osot_country) {
      lines.push(this.getCountryDisplayName(address.osot_country));
    }

    return lines.filter((line) => line.length > 0);
  }

  /**
   * Get display name for City enum
   * @param city City enum value
   * @returns Human-readable city name
   */
  static getCityDisplayName(city: City): string {
    // This would map to actual city names from the enum
    // For now, return the enum value as string
    return City[city] || 'Unknown City';
  }

  /**
   * Get abbreviation for Province enum (ON, BC, etc.)
   * @param province Province enum value
   * @returns Province abbreviation
   */
  static getProvinceDisplayName(province: Province): string {
    // Use the existing helper but return abbreviations for addresses
    const abbreviations: Partial<Record<Province, string>> = {
      [Province.ONTARIO]: 'ON',
      [Province.ALBERTA]: 'AB',
      [Province.BRITISH_COLUMBIA]: 'BC',
      [Province.MANITOBA]: 'MB',
      [Province.NEW_BRUNSWICK]: 'NB',
      [Province.NEWFOUNDLAND_AND_LABRADOR]: 'NL',
      [Province.NOVA_SCOTIA]: 'NS',
      [Province.NORTHWEST_TERRITORIES]: 'NT',
      [Province.NUNAVUT]: 'NU',
      [Province.PRINCE_EDWARD_ISLAND]: 'PE',
      [Province.QUEBEC]: 'QC',
      [Province.SASKATCHEWAN]: 'SK',
      [Province.YUKON]: 'YT',
      [Province.N_A]: 'N/A',
    };
    return abbreviations[province] || 'Unknown';
  }

  /**
   * Get display name for Country enum
   * @param country Country enum value
   * @returns Human-readable country name
   */
  static getCountryDisplayName(country: Country): string {
    const commonCountries: Partial<Record<Country, string>> = {
      [Country.CANADA]: 'Canada',
      [Country.USA]: 'United States',
      [Country.OTHER]: 'Other',
    };
    return commonCountries[country] || 'Unknown Country';
  }

  /**
   * Get display name for Address Type
   * @param addressType AddressType enum value
   * @returns Human-readable address type
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
   * Get display name for Address Preference
   * DELEGATED TO CENTRALIZED ENUM FUNCTION - No duplication
   * @param preference AddressPreference enum value
   * @returns Human-readable preference
   */
  static getAddressPreferenceDisplayName(
    preference: AddressPreference,
  ): string {
    // Delegate to centralized enum function to avoid duplication
    return getAddressPreferenceDisplayName(preference);
  }

  /**
   * Normalize address lines (trim, proper case)
   * @param addressLine Raw address line
   * @returns Normalized address line
   */
  static normalizeAddressLine(addressLine: string): string {
    if (!addressLine) return '';

    return addressLine
      .trim()
      .split(' ')
      .map((word) => {
        // Keep certain words lowercase (prepositions, articles)
        const lowercaseWords = [
          'of',
          'in',
          'on',
          'at',
          'by',
          'for',
          'with',
          'the',
          'a',
          'an',
        ];
        if (lowercaseWords.includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        // Capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
}
