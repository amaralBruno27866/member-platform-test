/**
 * Is Unique Company Name Per Insurance Validator
 *
 * Custom validator to provide early feedback that company names must be unique per insurance.
 *
 * Business Rule:
 * - Company names must be unique within an insurance record
 * - Cannot create two additional insureds with the same company name under the same insurance
 * - Different insurances can have the same additional insured company name
 *
 * This validator runs during CreateAdditionalInsuredDto validation.
 * Cannot check database (class-validator limitation).
 * Full validation happens in AdditionalInsuredBusinessRulesService.validateForCreation()
 *
 * Architecture Note:
 * - Simple format validation only (decorator pattern)
 * - Complex database uniqueness check deferred to business rules service
 * - Both must pass for additional insured creation to proceed
 *
 * @file is-unique-company-name-per-insurance.validator.ts
 * @module AdditionalInsuredModule
 * @layer Validators
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validator function to check company name format and provide uniqueness guidance.
 *
 * This is a simple format validator - the actual database uniqueness check happens in:
 * AdditionalInsuredBusinessRulesService.validateForCreation()
 *
 * Purpose: Provide early feedback on company name validity
 * Message: Guides user that company names must be unique per insurance
 */
export function IsUniqueCompanyNamePerInsurance(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isUniqueCompanyNamePerInsurance',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          // Validation is always true at DTO level
          // Full uniqueness validation happens in business rules service
          // This decorator only checks format
          if (!value) {
            return false;
          }

          if (typeof value !== 'string') {
            return false;
          }

          const companyName = value.trim();

          // Must be at least 3 characters
          if (companyName.length < 3) {
            return false;
          }

          // Must be at most 255 characters
          if (companyName.length > 255) {
            return false;
          }

          // Must match allowed characters
          const namePattern = /^[a-zA-Z0-9\s\-&.,()]+$/;
          return namePattern.test(companyName);
        },
        defaultMessage(_args: ValidationArguments) {
          return (
            'Company name must be unique for this insurance. ' +
            'Each company can only be added once as an additional insured per policy. ' +
            'Company name must be 3-255 characters with letters, numbers, and common business characters (-, &, ., ,, (, )).'
          );
        },
      },
    });
  };
}
