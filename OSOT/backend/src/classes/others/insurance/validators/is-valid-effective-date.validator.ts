/**
 * Is Valid Effective Date Validator
 *
 * Custom validator to ensure insurance effective date is not in the future.
 * Coverage cannot start on a future date.
 *
 * Business Rule:
 * - Effective date must be <= today (today = current date at 00:00:00)
 * - Cannot create insurance with future effective date
 * - Applies to: CreateInsuranceDto and UpdateInsuranceDto (if allowed)
 * - Tolerance: None (strict comparison)
 *
 * @file is-valid-effective-date.validator.ts
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
 * Get today's date at 00:00:00 UTC
 */
function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

/**
 * Validator function to check if effective date is not in the future
 * Used to ensure insurance coverage starts today or earlier
 */
export function IsValidEffectiveDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidEffectiveDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          // If value is missing, skip this validator
          if (!value) {
            return true;
          }

          // Parse the effective date
          const effectiveDate = new Date(value as string);

          // Check if date is valid
          if (isNaN(effectiveDate.getTime())) {
            return false;
          }

          // Set effective date to midnight for comparison
          effectiveDate.setUTCHours(0, 0, 0, 0);

          // Get today at midnight
          const today = getTodayAtMidnight();

          // Effective date must be <= today
          return effectiveDate <= today;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'Insurance coverage cannot start in the future. Effective date must be today or earlier.';
        },
      },
    });
  };
}
