/**
 * Identity Business Logic Utility
 *
 * Contains pure business logic functions specific to identity domain.
 * These utilities implement business rules, validation logic, and
 * complex calculations related to identity data.
 */

import {
  Language,
  Gender,
  Race,
  IndigenousDetail,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { IdentityInternal } from '../interfaces/identity-internal.interface';

/**
 * Identity Business Logic Utilities
 */
export class IdentityBusinessLogic {
  /**
   * Validate cultural consistency rules
   * Ensures that cultural identity fields are logically consistent
   * @param identity Identity data to validate
   * @returns Validation result with errors if any
   */
  static validateCulturalConsistency(identity: Partial<IdentityInternal>): {
    isValid: boolean;
    errors: string[];
  } {
    try {
      if (!identity || typeof identity !== 'object') {
        throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
          operation: 'validate_cultural_consistency',
          error: 'Invalid identity object provided',
          identity,
        });
      }

      const errors: string[] = [];

      // Rule 1: If indigenous is true, indigenous_detail should be provided
      if (
        identity.osot_indigenous === true &&
        (identity.osot_indigenous_detail === null ||
          identity.osot_indigenous_detail === undefined)
      ) {
        errors.push(
          'Indigenous detail is required when indigenous status is true',
        );
      }

      // Rule: If indigenous is false, indigenous_detail should not be provided
      if (
        identity.osot_indigenous === false &&
        identity.osot_indigenous_detail !== null &&
        identity.osot_indigenous_detail !== undefined
      ) {
        errors.push(
          'Indigenous detail should not be provided when indigenous status is false',
        );
      }

      // Rule 2: If indigenous_detail is OTHER, indigenous_detail_other should be provided
      if (
        identity.osot_indigenous_detail === IndigenousDetail.OTHER &&
        (!identity.osot_indigenous_detail_other ||
          identity.osot_indigenous_detail_other.trim() === '')
      ) {
        errors.push(
          'Indigenous detail other description is required when detail is set to Other',
        );
      }

      // Rule: If indigenous_detail is not OTHER, indigenous_detail_other should not be provided
      if (
        identity.osot_indigenous_detail !== undefined &&
        identity.osot_indigenous_detail !== IndigenousDetail.OTHER &&
        identity.osot_indigenous_detail_other &&
        identity.osot_indigenous_detail_other.trim() !== ''
      ) {
        errors.push(
          'Indigenous detail other description should only be provided when detail is set to Other',
        );
      }

      // Rule: If indigenous_detail_other is provided, indigenous_detail must be set to OTHER
      if (
        identity.osot_indigenous_detail_other &&
        identity.osot_indigenous_detail_other.trim() !== '' &&
        identity.osot_indigenous_detail !== IndigenousDetail.OTHER
      ) {
        errors.push(
          'Indigenous detail must be set to Other when other description is provided',
        );
      }

      return {
        isValid: errors.length === 0,
        errors,
      };
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error) {
        // Re-throw our custom errors
        throw error;
      }
      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        operation: 'validate_cultural_consistency',
        error:
          error instanceof Error ? error.message : 'Unknown validation error',
        identity,
      });
    }
  }

  /**
   * Check if identity data is complete for verification purposes
   * @param identity Identity data to check
   * @returns Completeness assessment
   */
  static assessDataCompleteness(identity: Partial<IdentityInternal>): {
    isComplete: boolean;
    missingFields: string[];
    completenessScore: number;
  } {
    const requiredFields = ['osot_user_business_id', 'osot_language'];
    const optionalFields = [
      'osot_chosen_name',
      'osot_gender',
      'osot_race',
      'osot_indigenous',
      'osot_disability',
    ];

    const missingFields: string[] = [];
    let providedFields = 0;

    // Check required fields
    requiredFields.forEach((field) => {
      if (!identity[field as keyof IdentityInternal]) {
        missingFields.push(field);
      } else {
        providedFields++;
      }
    });

    // Check optional fields
    optionalFields.forEach((field) => {
      if (identity[field as keyof IdentityInternal] !== undefined) {
        providedFields++;
      }
    });

    const totalFields = requiredFields.length + optionalFields.length;
    const completenessScore = (providedFields / totalFields) * 100;

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completenessScore: Math.round(completenessScore),
    };
  }

  /**
   * Determine if identity information can be shared based on access modifiers
   * @param identity Identity data
   * @param requesterPrivilege Privilege level of the requester
   * @returns Sharing permissions
   */
  static canShareIdentityData(
    identity: Partial<IdentityInternal>,
    requesterPrivilege: Privilege,
  ): {
    canShare: boolean;
    restrictedFields: string[];
    reason?: string;
  } {
    const accessModifier =
      identity.osot_access_modifiers || AccessModifier.PRIVATE;
    const restrictedFields: string[] = [];

    // Admin and Owner can always access data
    if (
      requesterPrivilege === Privilege.ADMIN ||
      requesterPrivilege === Privilege.OWNER
    ) {
      return { canShare: true, restrictedFields: [] };
    }

    // Private data - very restricted sharing
    if (accessModifier === AccessModifier.PRIVATE) {
      // Only basic non-sensitive fields
      restrictedFields.push(
        'osot_chosen_name',
        'osot_gender',
        'osot_race',
        'osot_indigenous',
        'osot_indigenous_detail',
        'osot_indigenous_detail_other',
        'osot_disability',
      );

      return {
        canShare: true,
        restrictedFields,
        reason: 'Privacy settings restrict sharing of personal characteristics',
      };
    }

    // For other access levels, allow more sharing
    return { canShare: true, restrictedFields: [] };
  }

  /**
   * Generate user business ID if not provided
   * @param existingIds Array of existing IDs to avoid duplicates
   * @param prefix Optional prefix (default: 'osot-id-')
   * @returns Generated unique business ID
   */
  static generateUserBusinessId(
    existingIds: string[] = [],
    prefix = 'osot-id-',
  ): string {
    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
      // Generate random 7-digit number
      const randomNum = Math.floor(Math.random() * 10000000)
        .toString()
        .padStart(7, '0');
      const candidateId = `${prefix}${randomNum}`;

      // Check if it's unique
      if (!existingIds.includes(candidateId)) {
        return candidateId;
      }

      attempts++;
    }

    // Fallback: use timestamp + random
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Calculate identity diversity score for analytics
   * @param identities Array of identity data
   * @returns Diversity metrics
   */
  static calculateDiversityScore(identities: Partial<IdentityInternal>[]): {
    languageDiversity: number;
    genderDiversity: number;
    racialDiversity: number;
    overallScore: number;
  } {
    if (identities.length === 0) {
      return {
        languageDiversity: 0,
        genderDiversity: 0,
        racialDiversity: 0,
        overallScore: 0,
      };
    }

    // Calculate language diversity
    const languages = new Set<Language>();
    identities.forEach((identity) => {
      if (Array.isArray(identity.osot_language)) {
        identity.osot_language.forEach((lang) => languages.add(lang));
      }
    });
    const languageDiversity =
      (languages.size / Object.keys(Language).length) * 100;

    // Calculate gender diversity
    const genders = new Set<Gender>();
    identities.forEach((identity) => {
      if (identity.osot_gender) {
        genders.add(identity.osot_gender);
      }
    });
    const genderDiversity = (genders.size / Object.keys(Gender).length) * 100;

    // Calculate racial diversity
    const races = new Set<Race>();
    identities.forEach((identity) => {
      if (identity.osot_race) {
        races.add(identity.osot_race);
      }
    });
    const racialDiversity = (races.size / Object.keys(Race).length) * 100;

    // Overall diversity score (weighted average)
    const overallScore =
      languageDiversity * 0.4 + genderDiversity * 0.3 + racialDiversity * 0.3;

    return {
      languageDiversity: Math.round(languageDiversity),
      genderDiversity: Math.round(genderDiversity),
      racialDiversity: Math.round(racialDiversity),
      overallScore: Math.round(overallScore),
    };
  }

  /**
   * Validate language selection business rules
   * @param languages Selected languages
   * @returns Validation result
   */
  static validateLanguageSelection(languages: Language[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Must have at least one language
    if (!languages || languages.length === 0) {
      errors.push('At least one language must be selected');
    }

    // Maximum 10 languages
    if (languages && languages.length > 10) {
      errors.push('Maximum 10 languages allowed');
    }

    // Check for duplicates
    if (languages && new Set(languages).size !== languages.length) {
      errors.push('Duplicate languages are not allowed');
    }

    // Business rule: English or French should be included (Canadian context)
    if (
      languages &&
      !languages.includes(Language.ENGLISH) &&
      !languages.includes(Language.FRENCH)
    ) {
      warnings.push(
        'Consider including English or French as official Canadian languages',
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Standalone business logic functions
 */

/**
 * Quick cultural consistency validation
 * @param identity Identity to validate
 * @returns True if culturally consistent
 */
export function isCulturallyConsistent(
  identity: Partial<IdentityInternal>,
): boolean {
  return IdentityBusinessLogic.validateCulturalConsistency(identity).isValid;
}

/**
 * Quick completeness check
 * @param identity Identity to check
 * @returns True if data is complete
 */
export function isIdentityComplete(
  identity: Partial<IdentityInternal>,
): boolean {
  return IdentityBusinessLogic.assessDataCompleteness(identity).isComplete;
}

/**
 * Quick business ID generation
 * @param existingIds Existing IDs to avoid
 * @returns Generated unique ID
 */
export function generateBusinessId(existingIds: string[] = []): string {
  return IdentityBusinessLogic.generateUserBusinessId(existingIds);
}
