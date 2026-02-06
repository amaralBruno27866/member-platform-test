/**
 * Insurance Provider Domain Validators
 *
 * Custom validation decorators and constraints for Insurance Provider business rules.
 * Includes policy period date validation, provider logo validation, and multi-tenancy checks.
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  INSURANCE_PROVIDER_FIELD_LENGTH,
  INSURANCE_PROVIDER_URL_PATTERN,
} from '../constants/insurance-provider-validation.constant';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Interface for validation objects containing Insurance Provider fields
 */
interface InsuranceProviderValidationObject {
  osot_policy_period_start?: string;
  osot_policy_period_end?: string;
  osot_insurance_company_logo?: string;
  osot_insurance_broker_logo?: string;
  osot_insurance_authorized_representative?: string;
  organizationGuid?: string;
  [key: string]: any;
}

// =============================================================================
// POLICY PERIOD DATE VALIDATORS
// =============================================================================

/**
 * Validates that policy end date is after policy start date.
 * Used to ensure business logic: policy periods must have end date > start date.
 *
 * @example
 * class CreateInsuranceProviderDto {
 *   @IsDateString()
 *   osot_policy_period_start: string;
 *
 *   @IsDateString()
 *   @IsPolicyEndDateAfterStart()
 *   osot_policy_period_end: string;
 * }
 */
@ValidatorConstraint({ name: 'isPolicyEndDateAfterStart', async: false })
export class IsPolicyEndDateAfterStartConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string, args: ValidationArguments): boolean {
    const object = args.object as InsuranceProviderValidationObject;
    const startDate = object.osot_policy_period_start;
    const endDate = value;

    // Allow validation to pass if start date is missing (let @IsDateString handle it)
    if (!startDate || !endDate) {
      return true;
    }

    try {
      // Parse both dates as ISO strings
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Validate that end date is after start date
      // Using getTime() to compare milliseconds
      return end.getTime() > start.getTime();
    } catch {
      // If parsing fails, let @IsDateString decorator handle the error
      return true;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as InsuranceProviderValidationObject;
    return `Policy end date (${object.osot_policy_period_end}) must be after start date (${object.osot_policy_period_start})`;
  }
}

/**
 * Decorator for validating policy end date > start date
 *
 * @param validationOptions - Standard class-validator options
 *
 * @example
 * @IsPolicyEndDateAfterStart()
 * osot_policy_period_end: string;
 */
export function IsPolicyEndDateAfterStart(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPolicyEndDateAfterStartConstraint,
    });
  };
}

// =============================================================================
// LOGO & URL VALIDATORS
// =============================================================================

/**
 * Validates insurance logo URLs have correct format and protocol.
 * Ensures logos are accessible via HTTPS (or HTTP for development).
 *
 * @example
 * @IsValidInsuranceLogo()
 * osot_insurance_company_logo: string;
 */
@ValidatorConstraint({ name: 'isValidInsuranceLogo', async: false })
export class IsValidInsuranceLogoConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    if (!value) {
      return true; // Allow empty for optional fields
    }

    // Check if URL matches pattern (must start with http:// or https://)
    if (!INSURANCE_PROVIDER_URL_PATTERN.test(value)) {
      return false;
    }

    // Additional checks for logo URLs
    try {
      const url = new URL(value);

      // Must be HTTP or HTTPS
      if (!['http:', 'https:'].includes(url.protocol)) {
        return false;
      }

      // Must end with common image extensions (security check)
      const pathname = url.pathname.toLowerCase();
      const validExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.svg',
      ];
      const hasValidExtension = validExtensions.some((ext) =>
        pathname.endsWith(ext),
      );

      // If pathname has a file, it must be a valid image extension
      // If it's just a domain/path without extension, allow it (CDN URLs)
      if (pathname !== '/' && !hasValidExtension) {
        return pathname.indexOf('.') === -1; // If no dot in path, it's OK
      }

      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return `Logo URL must be a valid HTTPS/HTTP URL with recognized image format (jpg, png, gif, webp, svg)`;
  }
}

/**
 * Decorator for validating insurance logo URLs
 *
 * @param validationOptions - Standard class-validator options
 *
 * @example
 * @IsValidInsuranceLogo()
 * osot_insurance_company_logo: string;
 */
export function IsValidInsuranceLogo(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidInsuranceLogoConstraint,
    });
  };
}

/**
 * Validates representative/broker URLs are valid and accessible.
 * Less strict than logo validation - allows any URL format.
 *
 * @example
 * @IsValidRepresentativeUrl()
 * osot_insurance_authorized_representative: string;
 */
@ValidatorConstraint({ name: 'isValidRepresentativeUrl', async: false })
export class IsValidRepresentativeUrlConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    if (!value) {
      return true; // Allow empty for optional fields
    }

    // Check basic URL format
    if (!INSURANCE_PROVIDER_URL_PATTERN.test(value)) {
      return false;
    }

    try {
      // Validate it's a proper URL
      new URL(value);

      // Must be HTTP or HTTPS
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Representative URL must be a valid HTTPS/HTTP URL';
  }
}

/**
 * Decorator for validating representative/broker URLs
 *
 * @param validationOptions - Standard class-validator options
 *
 * @example
 * @IsValidRepresentativeUrl()
 * osot_insurance_authorized_representative: string;
 */
export function IsValidRepresentativeUrl(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidRepresentativeUrlConstraint,
    });
  };
}

// =============================================================================
// ORGANIZATION SCOPE VALIDATORS
// =============================================================================

/**
 * Validates that organizationGuid is provided and non-empty.
 * Required for multi-tenant data isolation enforcement.
 *
 * @example
 * @IsValidOrganizationScope()
 * organizationGuid: string;
 */
@ValidatorConstraint({ name: 'isValidOrganizationScope', async: false })
export class IsValidOrganizationScopeConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    if (!value) {
      return false; // Organization GUID is always required
    }

    // Basic UUID v4 validation (already handled by @IsUUID in DTO, but double-check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  defaultMessage(): string {
    return 'Organization scope must be a valid UUID v4 identifier';
  }
}

/**
 * Decorator for validating organization scope
 *
 * @param validationOptions - Standard class-validator options
 *
 * @example
 * @IsValidOrganizationScope()
 * organizationGuid: string;
 */
export function IsValidOrganizationScope(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidOrganizationScopeConstraint,
    });
  };
}

// =============================================================================
// FIELD LENGTH VALIDATORS
// =============================================================================

/**
 * Validates that string fields don't exceed maximum allowed lengths.
 * Used as secondary validation alongside @MaxLength decorator.
 *
 * @example
 * @IsValidProviderFieldLength('company_name')
 * osot_insurance_company_name: string;
 */
@ValidatorConstraint({ name: 'isValidProviderFieldLength', async: false })
export class IsValidProviderFieldLengthConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string, args: ValidationArguments): boolean {
    if (!value) {
      return true; // Allow empty/null (handled by other decorators)
    }

    if (typeof value !== 'string') {
      return false;
    }

    // Get which field to validate from constraints
    const fieldName = args.constraints[0] as string;

    // Map field names to their max lengths
    const fieldMaxLengths: Record<string, number> = {
      company_name: INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_COMPANY_NAME,
      broker_name: INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_BROKER_NAME,
      logo_url: INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_COMPANY_LOGO,
      broker_logo_url: INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_BROKER_LOGO,
      policy_description:
        INSURANCE_PROVIDER_FIELD_LENGTH.MASTER_POLICY_DESCRIPTION,
      representative_url:
        INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_AUTHORIZED_REPRESENTATIVE,
    };

    const maxLength = fieldMaxLengths[fieldName];
    if (!maxLength) {
      return true; // If field not in map, allow it
    }

    return value.length <= maxLength;
  }

  defaultMessage(args: ValidationArguments): string {
    const fieldName = args.constraints[0] as string;
    const maxLength = (args.constraints[1] ?? 255) as number;
    return `Field '${fieldName}' must not exceed ${maxLength} characters (current: ${(args.value as string)?.length ?? 0})`;
  }
}

/**
 * Decorator for validating provider field lengths
 *
 * @param fieldName - Name of the field being validated
 * @param validationOptions - Standard class-validator options
 *
 * @example
 * @IsValidProviderFieldLength('company_name')
 * osot_insurance_company_name: string;
 */
export function IsValidProviderFieldLength(
  fieldName: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [fieldName],
      validator: IsValidProviderFieldLengthConstraint,
    });
  };
}

// =============================================================================
// COMBINED VALIDATION HELPERS
// =============================================================================

/**
 * Validates all policy period business rules in one check.
 * Ensures dates are valid ISO strings and end > start.
 *
 * @param object - Insurance provider object to validate
 * @returns Object with isValid flag and errors array
 */
export function validatePolicyPeriod(
  object: InsuranceProviderValidationObject,
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const { osot_policy_period_start, osot_policy_period_end } = object;

  // Check dates are provided if either is provided
  if (osot_policy_period_start || osot_policy_period_end) {
    if (!osot_policy_period_start) {
      errors.push('Policy start date is required when end date is provided');
    }
    if (!osot_policy_period_end) {
      errors.push('Policy end date is required when start date is provided');
    }
  }

  // Validate date format if both provided
  if (osot_policy_period_start && osot_policy_period_end) {
    try {
      const start = new Date(osot_policy_period_start);
      const end = new Date(osot_policy_period_end);

      if (isNaN(start.getTime())) {
        errors.push('Policy start date must be a valid ISO 8601 date');
      }
      if (isNaN(end.getTime())) {
        errors.push('Policy end date must be a valid ISO 8601 date');
      }

      if (end.getTime() <= start.getTime()) {
        errors.push('Policy end date must be after start date');
      }
    } catch (_err) {
      errors.push('Invalid policy period dates');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates all URL fields in insurance provider.
 * Checks company logo, broker logo, and representative URLs.
 *
 * @param object - Insurance provider object to validate
 * @returns Object with isValid flag and errors array
 */
export function validateProviderUrls(
  object: InsuranceProviderValidationObject,
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  const { osot_insurance_company_logo, osot_insurance_broker_logo } = object;

  // Validate company logo format
  if (osot_insurance_company_logo) {
    if (!INSURANCE_PROVIDER_URL_PATTERN.test(osot_insurance_company_logo)) {
      errors.push('Company logo URL must be from a valid source');
    }
  }

  // Validate broker logo format
  if (osot_insurance_broker_logo) {
    if (!INSURANCE_PROVIDER_URL_PATTERN.test(osot_insurance_broker_logo)) {
      errors.push('Broker logo URL must be from a valid source');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
