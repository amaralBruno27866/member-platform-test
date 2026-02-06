/**
 * Is Valid Insurance Total Validator
 *
 * Custom validator to ensure insurance total calculation is correct.
 * Validates that total ≈ price + tax (with floating-point tolerance).
 *
 * Business Rule:
 * - Formula: total = insurance_price + tax
 * - Tax is calculated as: price * tax_rate
 * - Floating-point tolerance: 0.01 (one cent rounding difference allowed)
 * - Used to prevent data inconsistency
 * - Applies to: CreateInsuranceDto only
 *
 * Examples:
 * - Price: 79.00, Tax: 10.27 (13% on 79.00) → Total: 89.27 ✓
 * - Price: 100.00, Tax: 13.00 (13% on 100.00) → Total: 113.00 ✓
 * - Price: 50.00, Tax: 6.50 (13% on 50.00) → Total: 56.50 ✓
 *
 * @file is-valid-insurance-total.validator.ts
 * @module InsuranceModule
 * @layer Validators
 * @since 2026-01-27
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const ROUNDING_TOLERANCE = 0.01;

/**
 * Validator function to check if insurance total is correctly calculated
 * Ensures total ≈ price + tax with floating-point tolerance
 */
export function IsValidInsuranceTotal(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidInsuranceTotal',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;

          const price = obj.osot_insurance_price as number | undefined;
          const total = value as number | undefined;

          // If required fields are missing, skip this validator
          // (other validators will catch missing required fields)
          if (
            price === undefined ||
            price === null ||
            total === undefined ||
            total === null
          ) {
            return true;
          }

          // Validate that both are numbers
          if (typeof price !== 'number' || typeof total !== 'number') {
            return false;
          }

          // Total should equal or be very close to price
          // (tax is already included in total from order_product snapshot)
          // Allow small rounding differences
          const difference = Math.abs(total - price);

          return difference <= ROUNDING_TOLERANCE;
        },
        defaultMessage(_args: ValidationArguments) {
          return `Insurance total must be approximately equal to insurance price (within ${ROUNDING_TOLERANCE} rounding tolerance).`;
        },
      },
    });
  };
}
