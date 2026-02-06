/**
 * Identity Formatter Utility
 *
 * Provides formatting functions for identity-specific data including
 * user business IDs, language preferences, names, and display formats.
 * Ensures consistent data presentation across the application.
 */

import {
  Language,
  Gender,
  Race,
  IndigenousDetail,
} from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { IdentityInternal } from '../interfaces/identity-internal.interface';

/**
 * Identity Data Formatter
 * Formats identity data for display and presentation
 */
export class IdentityFormatter {
  /**
   * Format user business ID to display format
   * @param businessId Raw business ID
   * @returns Formatted business ID
   */
  static formatUserBusinessId(businessId: string): string {
    try {
      if (!businessId) return '';

      // Ensure consistent uppercase format
      return businessId.trim().toUpperCase();
    } catch (error) {
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'format_user_business_id',
        error:
          error instanceof Error ? error.message : 'Unknown formatting error',
        businessId,
      });
    }
  }

  /**
   * Format chosen name for display
   * @param chosenName Raw chosen name
   * @returns Formatted chosen name
   */
  static formatChosenName(chosenName: string): string {
    if (!chosenName) return '';

    // Title case formatting
    return chosenName
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Format language array to human-readable string
   * @param languages Array of language enums
   * @returns Formatted language list
   */
  static formatLanguageList(languages: Language[]): string {
    if (!languages || languages.length === 0) return 'None specified';

    const languageNames = languages.map((lang) => this.getLanguageName(lang));

    if (languageNames.length === 1) return languageNames[0];
    if (languageNames.length === 2)
      return `${languageNames[0]} and ${languageNames[1]}`;

    const lastLanguage = languageNames.pop();
    return `${languageNames.join(', ')}, and ${lastLanguage}`;
  }

  /**
   * Get human-readable language name from enum
   * @param language Language enum value
   * @returns Language name
   */
  static getLanguageName(language: Language): string {
    // Convert to number for comparison
    const langNum = Number(language);

    // Basic language mapping - extend as needed based on actual enum values
    if (langNum === Number(Language.ENGLISH)) return 'English';
    if (langNum === Number(Language.FRENCH)) return 'French';

    return `Language ${language}`;
  }

  /**
   * Format gender for display
   * @param gender Gender enum value
   * @returns Formatted gender string
   */
  static formatGender(gender?: Gender): string {
    if (gender === undefined) return 'Not specified';

    // Use enum values directly
    switch (gender) {
      case Gender.FEMALE:
        return 'Female';
      case Gender.MALE:
        return 'Male';
      case Gender.QUEER:
        return 'Queer';
      case Gender.TRANSGENDER:
        return 'Transgender';
      case Gender.GENDER_NON_CONFORMING:
        return 'Gender Non-Conforming';
      case Gender.GENDERFLUID:
        return 'Genderfluid';
      case Gender.NON_BINARY:
        return 'Non-Binary';
      case Gender.TWO_SPIRIT:
        return 'Two-Spirit';
      case Gender.PREFER_NOT_TO_DISCLOSE:
        return 'Prefer Not to Disclose';
      default:
        return 'Gender (Not specified)';
    }
  }

  /**
   * Format race for display
   * @param race Race enum value
   * @returns Formatted race string
   */
  static formatRace(race?: Race): string {
    if (race === undefined) return 'Not specified';

    // Use enum values directly - aligned with getRaceDisplayName
    switch (race) {
      case Race.OTHER:
        return 'Other';
      case Race.WHITE:
        return 'White';
      case Race.BLACK:
        return 'Black';
      case Race.CHINESE:
        return 'Chinese';
      case Race.FILIPINO:
        return 'Filipino';
      case Race.KOREAN:
        return 'Korean';
      case Race.NON_WHITE_LATIN_AMERICAN:
        return 'Non-White Latin American (including Indigenous persons from Central and South America, etc.)';
      case Race.NON_WHITE_WEST_ASIAN:
        return 'Non-White West Asian (including Egyptian; Libyan; Lebanese; Iranian; etc.)';
      case Race.PERSON_OF_MIXED_ORIGIN:
        return 'Person of Mixed Origin';
      case Race.SOUTH_ASIAN_INDIAN:
        return 'South Asian/Indian (including Indian from India; Bangladeshi; Pakistani; Indian from Guyana, Trinidad, East Africa; etc.)';
      case Race.SOUTHEAST_ASIAN:
        return 'Southeast Asian (including Burmese; Cambodian; Laotian; Thai; Vietnamese; etc.)';
      default:
        return 'Unknown';
    }
  }

  /**
   * Format indigenous detail for display
   * @param detail IndigenousDetail enum value
   * @param otherDescription Optional other description
   * @returns Formatted indigenous detail string
   */
  static formatIndigenousDetail(
    detail?: IndigenousDetail,
    otherDescription?: string,
  ): string {
    if (detail === undefined) return 'Not specified';

    // Use enum values directly - aligned with getIndigenousDetailDisplayName
    switch (detail) {
      case IndigenousDetail.OTHER:
        return otherDescription ? otherDescription : 'Other';
      case IndigenousDetail.FIRST_NATIONS:
        return 'First Nations';
      case IndigenousDetail.METIS:
        return 'Metis';
      case IndigenousDetail.INUIT:
        return 'Inuit';
      default: {
        const baseText = 'Unknown';
        return otherDescription ? `${baseText}: ${otherDescription}` : baseText;
      }
    }
  }

  /**
   * Format complete identity summary for display
   * @param identity Identity object
   * @returns Formatted identity summary
   */
  static formatIdentitySummary(identity: IdentityInternal): string {
    const parts: string[] = [];

    // Business ID
    if (identity.osot_user_business_id) {
      parts.push(
        `ID: ${this.formatUserBusinessId(identity.osot_user_business_id)}`,
      );
    }

    // Chosen name
    if (identity.osot_chosen_name) {
      parts.push(`Name: ${this.formatChosenName(identity.osot_chosen_name)}`);
    }

    // Languages
    if (
      Array.isArray(identity.osot_language) &&
      identity.osot_language.length > 0
    ) {
      parts.push(
        `Languages: ${this.formatLanguageList(identity.osot_language)}`,
      );
    }

    return parts.length > 0
      ? parts.join(', ')
      : 'Identity information not available';
  }

  /**
   * Format identity for accessibility purposes
   * @param identity Identity object
   * @returns Screen reader friendly format
   */
  static formatForAccessibility(identity: IdentityInternal): string {
    const parts: string[] = [];

    if (identity.osot_user_business_id) {
      parts.push(`User business identifier ${identity.osot_user_business_id}`);
    }

    if (identity.osot_chosen_name) {
      parts.push(`Chosen name ${identity.osot_chosen_name}`);
    }

    if (Array.isArray(identity.osot_language)) {
      const languages = this.formatLanguageList(identity.osot_language);
      parts.push(`Preferred languages ${languages}`);
    }

    if (identity.osot_gender) {
      parts.push(`Gender ${this.formatGender(identity.osot_gender)}`);
    }

    return (
      parts.join('. ') +
      (parts.length > 0 ? '.' : 'No identity information available.')
    );
  }

  /**
   * Create display name from available identity data
   * @param identity Identity object
   * @returns Best available display name
   */
  static createDisplayName(identity: IdentityInternal): string {
    // Priority: chosen name > user business ID > fallback
    if (identity.osot_chosen_name) {
      return this.formatChosenName(identity.osot_chosen_name);
    }

    if (identity.osot_user_business_id) {
      return this.formatUserBusinessId(identity.osot_user_business_id);
    }

    return 'Anonymous User';
  }

  /**
   * Format cultural identity information
   * @param identity Identity object
   * @returns Formatted cultural information
   */
  static formatCulturalIdentity(identity: IdentityInternal): string {
    const parts: string[] = [];

    if (identity.osot_race) {
      parts.push(`Race: ${this.formatRace(identity.osot_race)}`);
    }

    if (identity.osot_indigenous) {
      const indigenousText = this.formatIndigenousDetail(
        identity.osot_indigenous_detail,
        identity.osot_indigenous_detail_other,
      );
      parts.push(`Indigenous: ${indigenousText}`);
    }

    return parts.length > 0
      ? parts.join(', ')
      : 'Cultural identity not specified';
  }
}

/**
 * Standalone formatting functions for specific use cases
 */

/**
 * Quick format user business ID
 * @param businessId Business ID to format
 * @returns Formatted business ID
 */
export function formatUserBusinessId(businessId: string): string {
  return IdentityFormatter.formatUserBusinessId(businessId);
}

/**
 * Quick format chosen name
 * @param name Name to format
 * @returns Formatted name
 */
export function formatChosenName(name: string): string {
  return IdentityFormatter.formatChosenName(name);
}

/**
 * Quick format language list
 * @param languages Language array
 * @returns Formatted language string
 */
export function formatLanguages(languages: Language[]): string {
  return IdentityFormatter.formatLanguageList(languages);
}
