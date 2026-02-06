/**
 * OTA Education Domain Validators
 *
 * Custom validation decorators and helper functions for Occupational Therapy Assistant Education.
 * Includes college-country alignment, graduation year logic, work declaration validation,
 * and other domain-specific business rule validations for OTA programs.
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { OtaCollege, Country } from '../../../../common/enums';
import {
  OTA_EDUCATION_VALIDATION,
  OTA_EDUCATION_BUSINESS_RULES,
} from '../constants/ota-education.constants';
import type { OtaEducationInternal } from '../interfaces/ota-education-internal.interface';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Interface for validation objects containing OTA Education fields
 */
interface OtaEducationValidationObject {
  osot_ota_degree_type?: number;
  osot_ota_college?: number;
  osot_ota_country?: number;
  osot_ota_grad_year?: number;
  osot_work_declaration?: boolean;
  osot_education_category?: number;
  [key: string]: any;
}

// =============================================================================
// USER BUSINESS ID VALIDATORS
// =============================================================================

/**
 * Validates User Business ID format for OTA Education
 */
@ValidatorConstraint({ name: 'isOtaEducationUserBusinessId', async: false })
class IsOtaEducationUserBusinessIdConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    if (!value) return false; // Required field

    return (
      typeof value === 'string' &&
      value.length <= OTA_EDUCATION_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH &&
      OTA_EDUCATION_VALIDATION.USER_BUSINESS_ID.PATTERN.test(value)
    );
  }

  defaultMessage(): string {
    return 'User Business ID must be 20 characters or less and contain only alphanumeric characters, underscores, or dashes';
  }
}

/**
 * Custom decorator for OTA Education User Business ID validation
 */
export function IsOtaEducationUserBusinessId(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOtaEducationUserBusinessIdConstraint,
    });
  };
}

// =============================================================================
// WORK DECLARATION VALIDATORS
// =============================================================================

/**
 * Validates work declaration is explicitly set (true or false, not null/undefined)
 */
@ValidatorConstraint({ name: 'isWorkDeclarationExplicit', async: false })
class IsWorkDeclarationExplicitConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any): boolean {
    // Must be explicitly true or false (not null, undefined, or other values)
    return value === true || value === false;
  }

  defaultMessage(): string {
    return 'Work declaration must be explicitly set to true or false';
  }
}

/**
 * Custom decorator for work declaration explicit validation
 */
export function IsWorkDeclarationExplicit(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsWorkDeclarationExplicitConstraint,
    });
  };
}

// =============================================================================
// DEGREE TYPE VALIDATORS
// =============================================================================

/**
 * Validates OTA degree type is appropriate for OTA programs
 */
@ValidatorConstraint({ name: 'isOtaDegreeTypeValid', async: false })
class IsOtaDegreeTypeValidConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (value === null || value === undefined) return true; // Optional field

    const allowedTypes = OTA_EDUCATION_BUSINESS_RULES.DEGREE_TYPE.ALLOWED_TYPES;
    return allowedTypes.some((type) => type === value);
  }

  defaultMessage(): string {
    const allowedTypes = OTA_EDUCATION_BUSINESS_RULES.DEGREE_TYPE.ALLOWED_TYPES;
    return `OTA degree type must be one of: ${allowedTypes.join(', ')}`;
  }
}

/**
 * Custom decorator for OTA degree type validation
 */
export function IsOtaDegreeTypeValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOtaDegreeTypeValidConstraint,
    });
  };
}

// =============================================================================
// COLLEGE-COUNTRY ALIGNMENT VALIDATORS
// =============================================================================

/**
 * Validates that selected college is from the specified country
 */
@ValidatorConstraint({ name: 'isCollegeCountryAligned', async: false })
class IsCollegeCountryAlignedConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as OtaEducationValidationObject;
    const college = object.osot_ota_college;
    const country = object.osot_ota_country;

    // If either is not provided, skip validation
    if (!college || !country) return true;

    // If country is Canada, validate Canadian colleges
    if (Number(country) === Number(Country.CANADA)) {
      return this.isCanadianCollege(college);
    }

    // For other countries, allow any college (or implement specific validation)
    return true;
  }

  private isCanadianCollege(college: number): boolean {
    // All OTA colleges in our enum are Canadian except OTHER
    return Number(college) !== Number(OtaCollege.OTHER);
  }

  defaultMessage(): string {
    return 'Selected college must be from the specified country';
  }
}

/**
 * Custom decorator for college-country alignment validation
 */
export function IsCollegeCountryAligned(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCollegeCountryAlignedConstraint,
    });
  };
}

// =============================================================================
// OTHER FIELD VALIDATORS
// =============================================================================

/**
 * Validates OTA Other field length
 */
@ValidatorConstraint({ name: 'isOtaOtherLengthValid', async: false })
class IsOtaOtherLengthValidConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return true; // Optional field

    return (
      typeof value === 'string' &&
      value.length <= OTA_EDUCATION_VALIDATION.OTA_OTHER.MAX_LENGTH
    );
  }

  defaultMessage(): string {
    return `OTA Other field cannot exceed ${OTA_EDUCATION_VALIDATION.OTA_OTHER.MAX_LENGTH} characters`;
  }
}

/**
 * Custom decorator for OTA Other field length validation
 */
export function IsOtaOtherLengthValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsOtaOtherLengthValidConstraint,
    });
  };
}

// =============================================================================
// UTILITY VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates if a value is a valid OTA college
 */
export function isValidOtaCollege(college: any): boolean {
  if (typeof college !== 'number') return false;
  return Object.values(OtaCollege).some(
    (enumValue) => Number(enumValue) === college,
  );
}

/**
 * Validates if a value is a valid OTA degree type
 */
export function isValidOtaDegreeType(degreeType: any): boolean {
  if (typeof degreeType !== 'number') return false;
  const allowedTypes = OTA_EDUCATION_BUSINESS_RULES.DEGREE_TYPE.ALLOWED_TYPES;
  return allowedTypes.some((type) => Number(type) === degreeType);
}

/**
 * Validates if work declaration is properly set
 */
export function isWorkDeclarationValid(workDeclaration: any): boolean {
  return workDeclaration === true || workDeclaration === false;
}

/**
 * Validates OTA education object against all business rules
 */
export function validateOtaEducationBusinessRules(
  education: Partial<OtaEducationInternal>,
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check user business ID
  if (!education.osot_user_business_id) {
    errors.push('User Business ID is required');
  } else if (
    !OTA_EDUCATION_VALIDATION.USER_BUSINESS_ID.PATTERN.test(
      education.osot_user_business_id,
    )
  ) {
    errors.push('User Business ID format is invalid');
  }

  // Check work declaration
  if (
    education.osot_work_declaration === undefined ||
    education.osot_work_declaration === null
  ) {
    errors.push('Work declaration must be explicitly set');
  }

  // Check degree type if provided
  if (
    education.osot_ota_degree_type &&
    !isValidOtaDegreeType(education.osot_ota_degree_type)
  ) {
    errors.push('Invalid OTA degree type');
  }

  // Check college if provided
  if (
    education.osot_ota_college &&
    !isValidOtaCollege(education.osot_ota_college)
  ) {
    errors.push('Invalid OTA college');
  }

  // Check OTA Other length
  if (
    education.osot_ota_other &&
    education.osot_ota_other.length >
      OTA_EDUCATION_VALIDATION.OTA_OTHER.MAX_LENGTH
  ) {
    errors.push(
      `OTA Other field exceeds maximum length of ${OTA_EDUCATION_VALIDATION.OTA_OTHER.MAX_LENGTH} characters`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
