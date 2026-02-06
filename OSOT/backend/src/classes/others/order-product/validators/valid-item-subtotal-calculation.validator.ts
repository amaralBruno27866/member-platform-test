/**
 * Valid Item Subtotal Calculation Validator
 *
 * Custom class-validator decorator to validate that itemSubtotal
 * is correctly calculated as selectedPrice * quantity.
 *
 * Formula: itemSubtotal = selectedPrice * quantity
 *
 * Architecture Notes:
 * - Used in CreateOrderProductDto to ensure snapshot integrity
 * - Allows tolerance of ±0.01 for floating-point precision
 * - Prevents incorrect calculations from being saved to Dataverse
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ORDER_PRODUCT_CALCULATION_TOLERANCE } from '../constants';

/**
 * Validates that itemSubtotal = selectedPrice * quantity (within tolerance)
 *
 * @param validationOptions - Class-validator options
 */
export function IsValidItemSubtotalCalculation(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidItemSubtotalCalculation',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as {
            osot_selectedprice?: number;
            osot_quantity?: number;
          };

          // Extract required fields
          const selectedPrice = dto.osot_selectedprice;
          const quantity = dto.osot_quantity;
          const itemSubtotal = value as number;

          // Skip validation if any field is missing (handled by @IsNotEmpty)
          if (
            selectedPrice === undefined ||
            quantity === undefined ||
            itemSubtotal === undefined
          ) {
            return true;
          }

          // Calculate expected subtotal
          const expectedSubtotal = selectedPrice * quantity;

          // Check if actual matches expected (within tolerance)
          const difference = Math.abs(itemSubtotal - expectedSubtotal);
          return difference <= ORDER_PRODUCT_CALCULATION_TOLERANCE;
        },
        defaultMessage(args: ValidationArguments) {
          const dto = args.object as {
            osot_selectedprice?: number;
            osot_quantity?: number;
          };
          const selectedPrice = dto.osot_selectedprice ?? 0;
          const quantity = dto.osot_quantity ?? 0;
          const itemSubtotal = args.value as number;
          const expectedSubtotal = selectedPrice * quantity;

          return `Item subtotal calculation is incorrect. Expected ${expectedSubtotal.toFixed(
            2,
          )} (${selectedPrice} × ${quantity}), but got ${itemSubtotal}`;
        },
      },
    });
  };
}
