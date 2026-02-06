/**
 * Subtotal Not Greater Than Total Validator
 *
 * Custom validator to ensure subtotal is not greater than total.
 * This would indicate a negative coupon discount which is invalid.
 *
 * Business rule: Coupon discount cannot exceed subtotal
 * - Formula: total = subtotal - coupon_discount + sum(taxes)
 * - Invalid if: subtotal > total (after accounting for taxes)
 * - Valid ranges: subtotal >= total (coupon applied) OR subtotal < total (tax added)
 *
 * @file subtotal-not-greater-than-total.validator.ts
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

/**
 * Validator constraint implementation
 */
@ValidatorConstraint({
  name: 'SubtotalNotGreaterThanTotal',
  async: false,
})
export class SubtotalNotGreaterThanTotalConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;

    const subtotal = object.subtotal as number | undefined;
    const total = object.total as number | undefined;

    // Skip validation if required fields are missing
    if (subtotal === undefined || total === undefined) {
      return true; // Let other validators handle missing required fields
    }

    // Subtotal should never be greater than total
    // (since coupon can only reduce, taxes are in product items)
    return subtotal <= total + 0.01; // Allow small rounding difference
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Order subtotal cannot be greater than total. Check coupon discount (cannot exceed subtotal).';
  }
}

/**
 * Decorator to validate subtotal vs total
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateOrderDto {
 *   subtotal: number;
 *
 *   @SubtotalNotGreaterThanTotal()
 *   total: number;
 * }
 * ```
 */
export function SubtotalNotGreaterThanTotal(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: SubtotalNotGreaterThanTotalConstraint,
    });
  };
}
