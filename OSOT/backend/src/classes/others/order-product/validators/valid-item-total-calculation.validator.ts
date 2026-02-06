/**
 * Valid Item Total Calculation Validator
 *
 * Custom class-validator decorator to validate that itemTotal
 * is correctly calculated as itemSubtotal + taxAmount.
 *
 * Formula: itemTotal = itemSubtotal + taxAmount
 * Example: $158.00 + $20.54 = $178.54
 *
 * Architecture Notes:
 * - Used in CreateOrderProductDto to ensure snapshot integrity
 * - Allows tolerance of ±0.01 for floating-point precision
 * - Prevents incorrect total calculations from being saved
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ORDER_PRODUCT_CALCULATION_TOLERANCE } from '../constants';

/**
 * Validates that itemTotal = itemSubtotal + taxAmount (within tolerance)
 *
 * @param validationOptions - Class-validator options
 */
export function IsValidItemTotalCalculation(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidItemTotalCalculation',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as {
            osot_itemsubtotal?: number;
            osot_taxamount?: number;
          };

          // Extract required fields
          const itemSubtotal = dto.osot_itemsubtotal;
          const taxAmount = dto.osot_taxamount;
          const itemTotal = value as number;

          // Skip validation if any field is missing (handled by @IsNotEmpty)
          if (
            itemSubtotal === undefined ||
            taxAmount === undefined ||
            itemTotal === undefined
          ) {
            return true;
          }

          // Calculate expected total
          const expectedTotal = itemSubtotal + taxAmount;

          // Check if actual matches expected (within tolerance)
          const difference = Math.abs(itemTotal - expectedTotal);
          return difference <= ORDER_PRODUCT_CALCULATION_TOLERANCE;
        },
        defaultMessage(args: ValidationArguments) {
          const dto = args.object as {
            osot_itemsubtotal?: number;
            osot_taxamount?: number;
          };
          const itemSubtotal = dto.osot_itemsubtotal ?? 0;
          const taxAmount = dto.osot_taxamount ?? 0;
          const itemTotal = args.value as number;
          const expectedTotal = itemSubtotal + taxAmount;

          return `Item total calculation is incorrect. Expected ${expectedTotal.toFixed(
            2,
          )} (${itemSubtotal} + ${taxAmount}), but got ${itemTotal}`;
        },
      },
    });
  };
}
