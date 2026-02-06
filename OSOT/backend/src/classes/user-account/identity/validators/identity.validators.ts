import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Language, AccessModifier, Privilege } from '../../../../common/enums';
import {
  IDENTITY_LIMITS,
  IDENTITY_PATTERNS,
  IDENTITY_LANGUAGE_HELPERS,
} from '../constants/identity.constants';

/**
 * Validator for Identity User Business ID
 * Validates format, length, and uniqueness requirements
 */
@ValidatorConstraint({ name: 'identityUserBusinessId', async: false })
export class IdentityUserBusinessIdValidator
  implements ValidatorConstraintInterface
{
  validate(userBusinessId: string): boolean {
    if (!userBusinessId) return false; // Business required field

    // Check length constraints (1-20 characters based on CSV)
    if (
      userBusinessId.length < 1 ||
      userBusinessId.length > IDENTITY_LIMITS.USER_BUSINESS_ID_MAX_LENGTH
    ) {
      return false;
    }

    // Check pattern (alphanumeric with dash/underscore)
    return IDENTITY_PATTERNS.USER_BUSINESS_ID.test(userBusinessId.trim());
  }

  defaultMessage(): string {
    return `User Business ID must be 1-${IDENTITY_LIMITS.USER_BUSINESS_ID_MAX_LENGTH} characters and contain only letters, numbers, hyphens, and underscores`;
  }
}

/**
 * Validator for Identity Chosen Name
 * Validates length and format restrictions for preferred names
 */
@ValidatorConstraint({ name: 'identityChosenName', async: false })
export class IdentityChosenNameValidator
  implements ValidatorConstraintInterface
{
  validate(chosenName: string): boolean {
    if (!chosenName) return true; // Optional field

    // Check length
    if (chosenName.length > IDENTITY_LIMITS.CHOSEN_NAME_MAX_LENGTH) {
      return false;
    }

    // Check pattern (letters, spaces, hyphens, apostrophes, dots)
    const trimmed = chosenName.trim();
    if (trimmed.length === 0) return true; // Allow empty after trim

    return IDENTITY_PATTERNS.NAME.test(trimmed);
  }

  defaultMessage(): string {
    return `Chosen name must not exceed ${IDENTITY_LIMITS.CHOSEN_NAME_MAX_LENGTH} characters and contain only letters, spaces, hyphens, apostrophes, and dots`;
  }
}

/**
 * Validator for Identity Language Preferences (Multiple Choice)
 * Validates language selection array and Dataverse format
 */
@ValidatorConstraint({ name: 'identityLanguages', async: false })
export class IdentityLanguagesValidator
  implements ValidatorConstraintInterface
{
  validate(languages: number[] | string): boolean {
    if (!languages) return false; // Business required field

    // Get all valid language values from the Language enum
    const validLanguages = Object.values(Language).filter(
      (value) => typeof value === 'number',
    ) as number[];

    // Handle array format (internal representation)
    if (Array.isArray(languages)) {
      // Check minimum and maximum selections
      if (
        languages.length < IDENTITY_LANGUAGE_HELPERS.MIN_LANGUAGES ||
        languages.length > IDENTITY_LANGUAGE_HELPERS.MAX_LANGUAGES
      ) {
        return false;
      }

      // Validate each language value against the Language enum
      return languages.every((lang) => validLanguages.includes(lang));
    }

    // Handle string format (Dataverse representation)
    if (typeof languages === 'string') {
      if (languages.trim() === '') return false;

      const languageNumbers =
        IDENTITY_LANGUAGE_HELPERS.dataverseToArray(languages);

      // Check minimum and maximum selections
      if (
        languageNumbers.length < IDENTITY_LANGUAGE_HELPERS.MIN_LANGUAGES ||
        languageNumbers.length > IDENTITY_LANGUAGE_HELPERS.MAX_LANGUAGES
      ) {
        return false;
      }

      // Validate each language value against the Language enum
      return languageNumbers.every((lang) => validLanguages.includes(lang));
    }

    return false; // Invalid type
  }

  defaultMessage(): string {
    return `Language selection must include ${IDENTITY_LANGUAGE_HELPERS.MIN_LANGUAGES}-${IDENTITY_LANGUAGE_HELPERS.MAX_LANGUAGES} valid languages`;
  }
}

/**
 * Validator for Identity Indigenous Detail Other
 * Validates text input when "Other" is selected for Indigenous detail
 */
@ValidatorConstraint({ name: 'identityIndigenousDetailOther', async: false })
export class IdentityIndigenousDetailOtherValidator
  implements ValidatorConstraintInterface
{
  validate(text: string): boolean {
    if (!text) return true; // Optional field by default

    // Check length limit
    if (text.length > IDENTITY_LIMITS.INDIGENOUS_DETAIL_OTHER_MAX_LENGTH) {
      return false;
    }

    // Basic text validation (no harmful characters)
    const trimmed = text.trim();
    return (
      trimmed.length > 0 &&
      trimmed.length <= IDENTITY_LIMITS.INDIGENOUS_DETAIL_OTHER_MAX_LENGTH
    );
  }

  defaultMessage(): string {
    return `Indigenous detail description must not exceed ${IDENTITY_LIMITS.INDIGENOUS_DETAIL_OTHER_MAX_LENGTH} characters`;
  }
}

/**
 * Validator for Identity Canadian SIN (Social Insurance Number)
 * Validates Canadian SIN format and checksum
 */
@ValidatorConstraint({ name: 'identityCanadianSIN', async: false })
export class IdentityCanadianSINValidator
  implements ValidatorConstraintInterface
{
  validate(sin: string): boolean {
    if (!sin) return true; // Optional field

    // Remove any formatting (hyphens, spaces)
    const cleanSIN = sin.replace(/[-\s]/g, '');

    // Check basic format (9 digits)
    if (!/^\d{9}$/.test(cleanSIN)) return false;

    // Check pattern from constants
    if (!IDENTITY_PATTERNS.CANADIAN_SIN.test(sin)) return false;

    // Validate SIN checksum (Luhn algorithm variant for SIN)
    return this.validateSINChecksum(cleanSIN);
  }

  private validateSINChecksum(sin: string): boolean {
    const digits = sin.split('').map(Number);
    let sum = 0;

    // SIN validation algorithm
    for (let i = 0; i < 8; i++) {
      let value = digits[i];
      if (i % 2 === 1) {
        // Even positions (0-indexed)
        value *= 2;
        if (value > 9) {
          value = Math.floor(value / 10) + (value % 10);
        }
      }
      sum += value;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[8];
  }

  defaultMessage(): string {
    return 'Invalid Canadian Social Insurance Number format or checksum';
  }
}

/**
 * Validator for Identity Cultural Consistency
 * Validates that cultural identity fields are consistent with each other
 */
@ValidatorConstraint({ name: 'identityCulturalConsistency', async: false })
export class IdentityCulturalConsistencyValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args?: any): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!args?.object) return true; // Can't validate without context

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const data = args.object;

    // If Indigenous detail is provided, Indigenous flag must be true
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (data.osot_indigenous_detail && !data.osot_indigenous) {
      return false;
    }

    // If Indigenous detail other text is provided, Indigenous detail must be set to "Other"
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (data.osot_indigenous_detail_other && !data.osot_indigenous_detail) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Cultural identity fields must be consistent (Indigenous detail requires Indigenous status, Other detail requires specific Indigenous detail)';
  }
}

/**
 * Validator for Identity Access Modifier Permissions
 * Validates that access modifiers are appropriate for the user context
 */
@ValidatorConstraint({ name: 'identityAccessModifier', async: false })
export class IdentityAccessModifierValidator
  implements ValidatorConstraintInterface
{
  validate(accessModifier: number): boolean {
    if (accessModifier == null) return true; // Optional field, will use default

    // Validate against allowed access modifier values
    const validAccessModifiers: number[] = [
      AccessModifier.PUBLIC,
      AccessModifier.PROTECTED,
      AccessModifier.PRIVATE,
    ];
    return validAccessModifiers.includes(accessModifier);
  }

  defaultMessage(): string {
    return 'Invalid access modifier value';
  }
}

/**
 * Validator for Identity Privilege Level (Internal Only)
 * Validates that privilege can only be set by internal systems
 */
@ValidatorConstraint({ name: 'identityPrivilege', async: false })
export class IdentityPrivilegeValidator
  implements ValidatorConstraintInterface
{
  validate(privilege: number, args?: any): boolean {
    if (privilege == null) return true; // Optional, will use default

    // This field should only be set by internal systems
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    if (args?.constraints?.includes('internal-only')) {
      const validPrivileges: number[] = [
        Privilege.OWNER,
        Privilege.ADMIN,
        Privilege.MAIN,
      ];
      return validPrivileges.includes(privilege);
    }

    // For non-internal requests, privilege should not be provided
    return privilege == null;
  }

  defaultMessage(): string {
    return 'Privilege level can only be set by internal systems';
  }
}

/**
 * Composite validator for complete Identity validation
 * Orchestrates validation of all Identity fields with business rules
 */
@ValidatorConstraint({ name: 'identityComposite', async: false })
export class IdentityCompositeValidator
  implements ValidatorConstraintInterface
{
  validate(data: any): boolean {
    if (!data) return false;

    // Validate required fields
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!data.osot_user_business_id || !data.osot_language) return false;

    // Validate user business ID
    const userBusinessIdValidator = new IdentityUserBusinessIdValidator();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    if (!userBusinessIdValidator.validate(data.osot_user_business_id))
      return false;

    // Validate languages
    const languageValidator = new IdentityLanguagesValidator();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    if (!languageValidator.validate(data.osot_language)) return false;

    // Validate cultural consistency if cultural fields are present
    if (
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data.osot_indigenous ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data.osot_indigenous_detail ||
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      data.osot_indigenous_detail_other
    ) {
      const culturalValidator = new IdentityCulturalConsistencyValidator();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      if (!culturalValidator.validate(data, { object: data })) return false;
    }

    // Validate chosen name if provided
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (data.osot_chosen_name) {
      const chosenNameValidator = new IdentityChosenNameValidator();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      if (!chosenNameValidator.validate(data.osot_chosen_name)) return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Identity data validation failed. Please check all required fields and business rules.';
  }
}

/**
 * Export all validators for easy importing
 */
export const IdentityValidators = {
  IdentityUserBusinessIdValidator,
  IdentityChosenNameValidator,
  IdentityLanguagesValidator,
  IdentityIndigenousDetailOtherValidator,
  IdentityCanadianSINValidator,
  IdentityCulturalConsistencyValidator,
  IdentityAccessModifierValidator,
  IdentityPrivilegeValidator,
  IdentityCompositeValidator,
};

/**
 * Usage notes:
 * - Use specific validators for individual field validation in DTOs
 * - Use IdentityCompositeValidator for complete entity validation
 * - Cultural consistency validator ensures Indigenous fields are properly related
 * - Language validator handles both array and string formats for Dataverse compatibility
 * - SIN validator includes proper checksum validation for Canadian SINs
 * - Access modifier and privilege validators enforce security and privacy rules
 * - All validators follow class-validator patterns for NestJS integration
 */
