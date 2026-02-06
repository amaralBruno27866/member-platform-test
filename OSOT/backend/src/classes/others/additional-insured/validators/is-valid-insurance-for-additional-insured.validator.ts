/**
 * Is Valid Insurance For Additional Insured Validator
 *
 * Custom validator to ensure the insurance GUID provided is valid for creating additional insureds.
 *
 * Business Rules Enforced:
 * - Insurance record must exist
 * - Insurance must be type GENERAL (Commercial)
 * - Insurance must be in ACTIVE status
 *
 * This validator runs during CreateAdditionalInsuredDto validation.
 * Cannot check database (class-validator limitation).
 * Full validation happens in AdditionalInsuredBusinessRulesService.validateForCreation()
 *
 * Architecture Note:
 * - Simple presence/format validation only (decorator pattern)
 * - Complex database validation deferred to business rules service
 * - Both must pass for additional insured creation to proceed
 *
 * @file is-valid-insurance-for-additional-insured.validator.ts
 * @module AdditionalInsuredModule
 * @layer Validators
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validator function to check if insurance GUID is valid for additional insured.
 *
 * This is a simple format/presence validator - the actual database check happens in:
 * AdditionalInsuredBusinessRulesService.validateForCreation()
 *
 * Purpose: Provide early feedback on insurance selection
 * Message: Guides user to select a valid insurance (GENERAL type, ACTIVE status)
 */
export function IsValidInsuranceForAdditionalInsured(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidInsuranceForAdditionalInsured',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          // Validation is always true at DTO level
          // Full validation happens in business rules service
          // This decorator only checks format
          if (!value) {
            return false;
          }

          if (typeof value !== 'string') {
            return false;
          }

          // Check if it looks like a GUID (basic format)
          const guidPattern =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return guidPattern.test(value);
        },
        defaultMessage(_args: ValidationArguments) {
          return (
            'Insurance must be a valid GUID. ' +
            'The insurance must be type GENERAL (Commercial) and in ACTIVE status. ' +
            'Additional insureds can only be added to Commercial insurance policies.'
          );
        },
      },
    });
  };
}
