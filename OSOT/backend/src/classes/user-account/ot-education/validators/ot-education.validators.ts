/**
 * OT Education Domain Validators
 *
 * Custom validation decorators and helper functions for Occupational Therapy Education.
 * Includes COTO registration validation, university-country alignment, graduation year logic,
 * and other domain-specific business rule validations.
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  GraduationYear,
  OtUniversity,
  Country,
  CotoStatus,
} from '../../../../common/enums';
import { isOntarioUniversity } from '../../../../common/enums/ot-university.enum';
import {
  OT_EDUCATION_VALIDATION,
  OT_EDUCATION_BUSINESS_RULES,
} from '../constants/ot-education.constants';
import type { OtEducationInternal } from '../interfaces/ot-education-internal.interface';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Interface for validation objects containing OT Education fields
 */
interface OtEducationValidationObject {
  osot_coto_status?: number;
  osot_coto_registration?: string;
  osot_ot_university?: number;
  osot_ot_country?: number;
  [key: string]: any;
}

// =============================================================================
// COTO REGISTRATION VALIDATORS
// =============================================================================

/**
 * Validates COTO registration number format (8 uppercase alphanumeric characters)
 */
@ValidatorConstraint({ name: 'isCotoRegistrationFormat', async: false })
export class IsCotoRegistrationFormatConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    if (!value) return true; // Allow null/undefined (handled by @IsOptional)

    return (
      typeof value === 'string' &&
      value.length <= OT_EDUCATION_BUSINESS_RULES.COTO.REGISTRATION_LENGTH &&
      OT_EDUCATION_VALIDATION.COTO_REGISTRATION.PATTERN.test(value)
    );
  }

  defaultMessage(): string {
    return 'COTO registration must be 8 characters or less and contain only uppercase alphanumeric characters';
  }
}

/**
 * Custom decorator for COTO registration format validation
 */
export function IsCotoRegistrationFormat(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCotoRegistrationFormatConstraint,
    });
  };
}

/**
 * Validates COTO status and registration combination business rules
 */
@ValidatorConstraint({ name: 'isCotoStatusRegistrationValid', async: false })
export class IsCotoStatusRegistrationValidConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as OtEducationValidationObject;
    const cotoStatus = object.osot_coto_status;
    const cotoRegistration = object.osot_coto_registration;

    // If no status provided, skip validation
    if (!cotoStatus) return true;

    const statusRequiresRegistration = cotoStatus
      ? OT_EDUCATION_BUSINESS_RULES.COTO.STATUS_REQUIRES_REGISTRATION.includes(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          cotoStatus as any,
        )
      : false;
    const statusAllowsNoRegistration = cotoStatus
      ? OT_EDUCATION_BUSINESS_RULES.COTO.NO_REGISTRATION_STATUSES.includes(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          cotoStatus as any,
        )
      : false;

    // Status requires registration but none provided
    if (statusRequiresRegistration && !cotoRegistration) {
      return false;
    }

    // Status doesn't allow registration but one is provided
    if (statusAllowsNoRegistration && cotoRegistration) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as OtEducationValidationObject;
    const cotoStatus = object.osot_coto_status;
    const cotoRegistration = object.osot_coto_registration;

    const statusRequiresRegistration = cotoStatus
      ? OT_EDUCATION_BUSINESS_RULES.COTO.STATUS_REQUIRES_REGISTRATION.includes(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          cotoStatus as any,
        )
      : false;

    if (statusRequiresRegistration && !cotoRegistration) {
      return 'COTO Registration number is required when status is General or Provisional/Temporary';
    }

    return 'COTO Registration number should not be provided when status is Other, Student, Pending, or Resigned';
  }
}

/**
 * Custom decorator for COTO status-registration combination validation
 */
export function IsCotoStatusRegistrationValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCotoStatusRegistrationValidConstraint,
    });
  };
}

// =============================================================================
// USER BUSINESS ID VALIDATORS
// =============================================================================

/**
 * Validates User Business ID format for OT Education
 */
@ValidatorConstraint({ name: 'isOtEducationUserBusinessId', async: false })
export class IsOtEducationUserBusinessIdConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    if (!value) return false; // Required field

    return (
      typeof value === 'string' &&
      value.length <= OT_EDUCATION_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH &&
      OT_EDUCATION_VALIDATION.USER_BUSINESS_ID.PATTERN.test(value)
    );
  }

  defaultMessage(): string {
    return 'User Business ID must be 20 characters or less and contain only alphanumeric characters, underscores, or dashes';
  }
}

/**
 * Custom decorator for OT Education User Business ID validation
 */
export function IsOtEducationUserBusinessId(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOtEducationUserBusinessIdConstraint,
    });
  };
}

// =============================================================================
// UNIVERSITY AND COUNTRY VALIDATORS
// =============================================================================

/**
 * Validates university-country alignment business rules
 */
@ValidatorConstraint({ name: 'isUniversityCountryAligned', async: false })
export class IsUniversityCountryAlignedConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as OtEducationValidationObject;
    const university = object.osot_ot_university;
    const country = object.osot_ot_country;

    // If either field is missing, skip validation (handled by other validators)
    if (!university || !country) return true;

    // Business rule: Canadian universities should have Country = Canada
    // This would need actual enum values to implement properly
    // For now, we'll implement a basic check structure
    return this.validateUniversityCountryAlignment(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      university as any,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      country as any,
    );
  }

  private validateUniversityCountryAlignment(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    university: OtUniversity,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    country: Country,
  ): boolean {
    // TODO: Implement actual business logic based on university enum values
    // Example logic (would need real enum values):
    // const isCanadianUniversity = CANADIAN_UNIVERSITIES.includes(university);
    // const isCanadaCountry = country === Country.CANADA;
    // return !isCanadianUniversity || isCanadaCountry;

    // For now, return true (implement when enums are available)
    return true;
  }

  defaultMessage(): string {
    return 'Canadian universities should have Country set to Canada';
  }
}

/**
 * Custom decorator for university-country alignment validation
 */
export function IsUniversityCountryAligned(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniversityCountryAlignedConstraint,
    });
  };
}

// =============================================================================
// GRADUATION YEAR VALIDATORS
// =============================================================================

/**
 * Validates graduation year business logic
 */
@ValidatorConstraint({ name: 'isValidGraduationYear', async: false })
export class IsValidGraduationYearConstraint
  implements ValidatorConstraintInterface
{
  validate(value: GraduationYear): boolean {
    if (!value) return false; // Required field

    const currentYear = new Date().getFullYear();
    const minYear = OT_EDUCATION_BUSINESS_RULES.GRADUATION_YEAR.MIN_YEAR;
    const maxFutureYears =
      OT_EDUCATION_BUSINESS_RULES.GRADUATION_YEAR.MAX_FUTURE_YEARS;
    const maxYear = currentYear + maxFutureYears;

    // Convert enum to number for validation (would need actual enum implementation)
    const yearNumber = this.graduationYearToNumber(value);

    return yearNumber >= minYear && yearNumber <= maxYear;
  }

  private graduationYearToNumber(graduationYear: GraduationYear): number {
    // TODO: Implement actual conversion based on GraduationYear enum
    // For now, assume direct conversion (would need real enum values)
    return Number(graduationYear) || new Date().getFullYear();
  }

  defaultMessage(): string {
    const currentYear = new Date().getFullYear();
    const minYear = OT_EDUCATION_BUSINESS_RULES.GRADUATION_YEAR.MIN_YEAR;
    const maxFutureYears =
      OT_EDUCATION_BUSINESS_RULES.GRADUATION_YEAR.MAX_FUTURE_YEARS;
    const maxYear = currentYear + maxFutureYears;

    return `Graduation year must be between ${minYear} and ${maxYear}`;
  }
}

/**
 * Custom decorator for graduation year validation
 */
export function IsValidGraduationYear(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidGraduationYearConstraint,
    });
  };
}

// =============================================================================
// OT OTHER FIELD VALIDATOR
// =============================================================================

/**
 * Validates OT Other field length and content
 */
@ValidatorConstraint({ name: 'isValidOtOther', async: false })
export class IsValidOtOtherConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return true; // Optional field

    return (
      typeof value === 'string' &&
      value.length <= OT_EDUCATION_VALIDATION.OT_OTHER.MAX_LENGTH &&
      value.trim().length > 0 // No empty strings
    );
  }

  defaultMessage(): string {
    return `Additional education details must be ${OT_EDUCATION_VALIDATION.OT_OTHER.MAX_LENGTH} characters or less`;
  }
}

/**
 * Custom decorator for OT Other field validation
 */
export function IsValidOtOther(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidOtOtherConstraint,
    });
  };
}

// =============================================================================
// HELPER VALIDATION FUNCTIONS
// =============================================================================

/**
 * Helper function to validate complete OT Education record
 */
export function validateOtEducationCompleteness(data: Record<string, any>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  completenessScore: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  const requiredFields = OT_EDUCATION_VALIDATION.REQUIRED_FIELDS;
  const missingFields = requiredFields.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    errors.push(`Missing required fields: ${missingFields.join(', ')}`);
  }

  // Calculate completeness score
  const totalFields = [
    ...requiredFields,
    ...OT_EDUCATION_VALIDATION.OPTIONAL_FIELDS,
  ];
  const filledFields = totalFields.filter(
    (field) =>
      data[field] !== null && data[field] !== undefined && data[field] !== '',
  );
  const completenessScore = Math.round(
    (filledFields.length / totalFields.length) * 100,
  );

  // Add warnings for low completeness
  if (completenessScore < 70 && errors.length === 0) {
    warnings.push(
      'Profile completeness is below 70%. Consider adding optional information.',
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completenessScore,
  };
}

/**
 * Helper function to validate COTO registration uniqueness (async)
 * This would typically call a service or repository
 */
export function validateCotoRegistrationUniqueness(
  _registration: string,

  _excludeId?: string,
): Promise<boolean> {
  // TODO: Implement actual uniqueness check via repository/service
  // For now, return true (implement when repository is available)
  return Promise.resolve(true);
}

/**
 * Helper function to validate User Business ID uniqueness (async)
 * This would typically call a service or repository
 */
export function validateUserBusinessIdUniqueness(
  _userBusinessId: string,

  _excludeId?: string,
): Promise<boolean> {
  // TODO: Implement actual uniqueness check via repository/service
  // For now, return true (implement when repository is available)
  return Promise.resolve(true);
}

/**
 * Helper function to validate international degree requirements
 */
export function validateInternationalDegreeRequirements(
  university: OtUniversity,
  country: Country,
): {
  requiresValidation: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // TODO: Implement actual international validation logic
  // For now, assume any non-Canadian education requires validation
  const isCanadian = country === Country.CANADA;
  const requiresValidation = !isCanadian;

  if (requiresValidation) {
    warnings.push(
      'International degrees may require additional validation for professional recognition in Canada.',
    );
  }

  return {
    requiresValidation,
    warnings,
  };
}

// =============================================================================
// PROGRAMMATIC VALIDATION UTILITIES
// =============================================================================

/**
 * OT Education Validation Utility
 *
 * PROGRAMMATIC INTERFACE for validation outside of decorators.
 * Provides convenient functions for forms, business logic, and frontend integration.
 * Uses the same constraint classes as decorators to ensure consistency.
 */
export class OtEducationValidationUtil {
  /**
   * Validate COTO registration format programmatically
   * Uses the same logic as @IsCotoRegistrationFormat decorator
   * @param registration COTO registration number
   * @returns Whether registration format is valid
   */
  static isValidCotoRegistration(registration: string): boolean {
    const validator = new IsCotoRegistrationFormatConstraint();
    return validator.validate(registration);
  }

  /**
   * Check if COTO registration is required for given status
   * Uses the same business rules as @IsCotoStatusRegistrationValid decorator
   * @param status COTO professional status
   * @returns Whether registration is required
   */
  static isCotoRegistrationRequired(status: CotoStatus): boolean {
    return (
      status === CotoStatus.GENERAL ||
      status === CotoStatus.PROVISIONAL_TEMPORARY
    );
  }

  /**
   * Validate COTO status and registration combination
   * Implements the same business logic as @IsCotoStatusRegistrationValid decorator
   * @param status COTO professional status
   * @param registration COTO registration number
   * @returns Whether the combination is valid
   */
  static isValidCotoStatusRegistration(
    status: CotoStatus,
    registration?: string,
  ): boolean {
    // Business logic: status requires registration
    const statusRequiresRegistration =
      status === CotoStatus.GENERAL ||
      status === CotoStatus.PROVISIONAL_TEMPORARY;

    // Business logic: status doesn't allow registration
    const statusAllowsNoRegistration =
      status === CotoStatus.OTHER ||
      status === CotoStatus.STUDENT ||
      status === CotoStatus.PENDING ||
      status === CotoStatus.RESIGNED;

    // Status requires registration but none provided
    if (statusRequiresRegistration && !registration) {
      return false;
    }

    // Status doesn't allow registration but one is provided
    if (statusAllowsNoRegistration && registration) {
      return false;
    }

    return true;
  }

  /**
   * Validate graduation year range
   * Uses the same logic as @IsValidGraduationYear decorator
   * @param year Graduation year
   * @returns Whether year is within valid range
   */
  static isValidGraduationYear(year: number): boolean {
    const validator = new IsValidGraduationYearConstraint();
    return validator.validate(year);
  }

  /**
   * Check if university is a Canadian institution (Ontario universities)
   * @param university OT university
   * @returns Whether university is Canadian
   */
  static isCanadianUniversity(university: OtUniversity): boolean {
    return isOntarioUniversity(university);
  }

  /**
   * Validate education record has required fields
   * @param education Education record to validate
   * @param isRegistration Whether this is for registration flow
   * @returns Validation result with missing fields
   */
  static validateRequiredFields(
    education: Partial<OtEducationInternal>,
    isRegistration: boolean = false,
  ): {
    isValid: boolean;
    missingFields: string[];
  } {
    const requiredFields = [
      'osot_user_business_id',
      'osot_coto_status',
      'osot_ot_degree_type',
      'osot_ot_university',
      'osot_ot_grad_year',
      'osot_ot_country',
    ];

    if (isRegistration) {
      requiredFields.push('osot_table_account');
    }

    const missingFields = requiredFields.filter((field) => {
      const value = education[field as keyof OtEducationInternal] as unknown;
      return value === undefined || value === null || value === '';
    });

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }

  /**
   * Clean and format COTO registration number
   * @param registration Raw registration input
   * @returns Cleaned registration number or null if invalid
   */
  static formatCotoRegistration(registration: string): string | null {
    if (!registration || typeof registration !== 'string') {
      return null;
    }

    const cleaned = registration.replace(/\D/g, ''); // Remove non-digits

    if (cleaned.length === 8) {
      return cleaned;
    }

    return null;
  }

  /**
   * Get display-friendly field labels
   * @param fieldName Internal field name
   * @returns User-friendly field label
   */
  static getFieldDisplayName(fieldName: string): string {
    const fieldLabels: Record<string, string> = {
      osot_user_business_id: 'User ID',
      osot_table_account: 'Account',
      osot_coto_status: 'COTO Status',
      osot_coto_registration: 'COTO Registration',
      osot_ot_degree_type: 'Degree Type',
      osot_ot_university: 'University',
      osot_ot_grad_year: 'Graduation Year',
      osot_ot_country: 'Country of Education',
      osot_education_category: 'Education Category',
    };

    return fieldLabels[fieldName] || fieldName;
  }

  /**
   * Create validation summary for frontend display
   * @param education Education record to validate
   * @param isRegistration Whether this is for registration
   * @returns Formatted validation summary
   */
  static createValidationSummary(
    education: Partial<OtEducationInternal>,
    isRegistration: boolean = false,
  ): {
    isValid: boolean;
    summary: string;
    details: string[];
  } {
    const details: string[] = [];

    // Check required fields
    const requiredValidation = this.validateRequiredFields(
      education,
      isRegistration,
    );
    if (!requiredValidation.isValid) {
      details.push(
        `Missing required fields: ${requiredValidation.missingFields
          .map((field) => this.getFieldDisplayName(field))
          .join(', ')}`,
      );
    }

    // Check COTO registration if status requires it
    if (
      education.osot_coto_status &&
      this.isCotoRegistrationRequired(education.osot_coto_status)
    ) {
      if (!education.osot_coto_registration) {
        details.push(
          'COTO registration is required for your professional status',
        );
      } else if (
        !this.isValidCotoRegistration(education.osot_coto_registration)
      ) {
        details.push('COTO registration must be exactly 8 digits');
      }
    }

    // Check graduation year if present
    if (
      education.osot_ot_grad_year &&
      !this.isValidGraduationYear(education.osot_ot_grad_year)
    ) {
      details.push(
        'Graduation year is outside valid range (1950 - 10 years from now)',
      );
    }

    // Check university-country alignment
    if (education.osot_ot_university && education.osot_ot_country) {
      const isCanadian = isOntarioUniversity(education.osot_ot_university);
      const isCanadianCountry = education.osot_ot_country === Country.CANADA;

      if (isCanadian && !isCanadianCountry) {
        details.push(
          'Canadian universities should be paired with Canada as the country',
        );
      }
    }

    const isValid = details.length === 0;
    const summary = isValid
      ? 'All validation checks passed'
      : `${details.length} validation issue${details.length > 1 ? 's' : ''} found`;

    return {
      isValid,
      summary,
      details,
    };
  }

  /**
   * Quick validation for form fields during user input
   * @param fieldName Field being validated
   * @param value Field value
   * @param context Additional context for validation
   * @returns Immediate validation feedback
   */
  static validateField(
    fieldName: string,
    value: any,
    context?: Partial<OtEducationInternal>,
  ): {
    isValid: boolean;
    message?: string;
  } {
    switch (fieldName) {
      case 'osot_coto_registration':
        if (!value) {
          // Check if required based on status
          const status = context?.osot_coto_status;
          if (status && this.isCotoRegistrationRequired(status)) {
            return {
              isValid: false,
              message: 'COTO registration is required for your status',
            };
          }
          return { isValid: true };
        }

        if (!this.isValidCotoRegistration(String(value))) {
          const validator = new IsCotoRegistrationFormatConstraint();
          return {
            isValid: false,
            message: validator.defaultMessage(),
          };
        }
        return { isValid: true };

      case 'osot_ot_grad_year':
        if (value && !this.isValidGraduationYear(Number(value))) {
          const validator = new IsValidGraduationYearConstraint();
          return {
            isValid: false,
            message: validator.defaultMessage(),
          };
        }
        return { isValid: true };

      default:
        // Generic required field check
        if (!value && value !== 0) {
          return { isValid: false, message: 'This field is required' };
        }
        return { isValid: true };
    }
  }
}
