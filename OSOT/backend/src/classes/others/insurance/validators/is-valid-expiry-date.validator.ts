/**
 * Is Valid Expiry Date Validator
 *
 * Custom validator to ensure insurance expiry date is after effective date.
 * Insurance must have a valid coverage period.
 *
 * Business Rule:
 * - Expiry date must be > effective date (strictly greater)
 * - Typical coverage period: 12 months (365 days)
 * - Allows for non-standard periods (90 days, 6 months, etc.)
 * - Applies to: CreateInsuranceDto and UpdateInsuranceDto
 * - Tolerance: None (strict comparison)
 *
 * @file is-valid-expiry-date.validator.ts
 * @module InsuranceModule
 * @layer Validators
 * @since 2026-01-27
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validator function to check if expiry date is after effective date
 * Used to ensure insurance has a valid coverage period
 */
export function IsValidExpiryDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidExpiryDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          // If value is missing, skip this validator
          if (!value) {
            return true;
          }

          const obj = args.object as Record<string, unknown>;
          const effectiveDate = obj.osot_effective_date as string | undefined;

          // If effective date is missing, let other validators handle it
          if (!effectiveDate) {
            return true;
          }

          // Parse both dates
          const expiry = new Date(value as string);
          const effective = new Date(effectiveDate);

          // Check if both dates are valid
          if (isNaN(expiry.getTime()) || isNaN(effective.getTime())) {
            return false;
          }

          // Set both to midnight for comparison (date-only comparison)
          expiry.setUTCHours(0, 0, 0, 0);
          effective.setUTCHours(0, 0, 0, 0);

          // Expiry date must be > effective date (strictly greater, not equal)
          return expiry > effective;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Insurance expiry date must be after the effective date. Coverage period must be at least 1 day.';
        },
      },
    });
  };
}
