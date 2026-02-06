/**
 * Valid Coupon Format Validator
 *
 * Custom validator to ensure coupon code format is valid.
 * Validates coupon code pattern (alphanumeric with hyphens/underscores).
 *
 * Business rule: Coupon codes follow pattern
 * - Pattern: ^[A-Z0-9_-]+$ (case-insensitive matching)
 * - Examples: DISCOUNT15, SUMMER_2025, OSOT-MEMBER-5
 * - Min length: 1
 * - Max length: 100
 * - Note: Actual coupon validation (existence, expiration) happens in business rules
 *
 * @file valid-coupon-format.validator.ts
 * @module OrderModule
 * @layer Validators
 * @since 2026-01-22
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { COUPON_VALIDATION_RULES } from '../constants';

/**
 * Validator constraint implementation
 */
@ValidatorConstraint({
  name: 'ValidCouponFormat',
  async: false,
})
export class ValidCouponFormatConstraint
  implements ValidatorConstraintInterface
{
  validate(coupon: string | undefined, _args: ValidationArguments): boolean {
    // Coupon is optional, so undefined/null is valid
    if (!coupon) {
      return true;
    }

    // Check pattern
    return COUPON_VALIDATION_RULES.PATTERN.test(coupon);
  }

  defaultMessage(_args: ValidationArguments): string {
    return `Coupon code format is invalid. Must contain only uppercase letters, numbers, hyphens, and underscores (e.g., DISCOUNT15, SUMMER_2025).`;
  }
}

/**
 * Decorator to validate coupon code format
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateOrderDto {
 *   @ValidCouponFormat()
 *   coupon?: string;
 * }
 * ```
 */
export function ValidCouponFormat(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidCouponFormatConstraint,
    });
  };
}
