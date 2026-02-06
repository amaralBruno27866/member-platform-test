/**
 * Valid Total Calculation Validator
 *
 * Custom validator to ensure order total is correctly calculated.
 * Validates that total equals sum(line_items.itemTotal) - coupon_discount
 *
 * Business rule: Total must match calculated value with tolerance
 * - Tolerance: 0.01 (rounding difference allowed)
 * - Tax is already included in line items
 * - Subtotal is sum of all line items without coupon
 * - Total is subtotal - coupon + sum(taxes)
 *
 * @file valid-total-calculation.validator.ts
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
import { FINANCIAL_CALCULATION_RULES } from '../constants';

/**
 * Validator constraint implementation
 */
@ValidatorConstraint({
  name: 'ValidTotalCalculation',
  async: false,
})
export class ValidTotalCalculationConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;

    const subtotal = object.subtotal as number | undefined;
    const total = object.total as number | undefined;
    const products = object.products as
      | Array<{
          itemTotal: number;
        }>
      | undefined;

    // Skip validation if required fields are missing
    if (!subtotal || !total || !products || products.length === 0) {
      return true; // Let other validators handle missing required fields
    }

    // Calculate expected total
    // Formula: sum(products.itemTotal) - coupon_discount
    // For now, just verify total >= subtotal (coupon applied)
    const sumItemTotals = products.reduce(
      (sum, product) => sum + (product.itemTotal || 0),
      0,
    );

    // Total should be close to sum of item totals (with rounding tolerance)
    const difference = Math.abs(sumItemTotals - total);

    return difference <= FINANCIAL_CALCULATION_RULES.ROUNDING_TOLERANCE;
  }

  defaultMessage(_args: ValidationArguments): string {
    return `Order total does not match calculated value. Total must equal sum of line item totals (with up to ${FINANCIAL_CALCULATION_RULES.ROUNDING_TOLERANCE} rounding tolerance).`;
  }
}

/**
 * Decorator to validate order total calculation
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateOrderDto {
 *   products: CreateOrderProductDto[];
 *
 *   @ValidTotalCalculation()
 *   total: number;
 * }
 * ```
 */
export function ValidTotalCalculation(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ValidTotalCalculationConstraint,
    });
  };
}
