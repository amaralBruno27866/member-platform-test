/**
 * Valid Tax Amount Calculation Validator
 *
 * Custom class-validator decorator to validate that taxAmount
 * is correctly calculated as itemSubtotal * (productTaxRate / 100).
 *
 * Formula: taxAmount = itemSubtotal * (productTaxRate / 100)
 * Example: $158.00 * (13 / 100) = $20.54
 *
 * Architecture Notes:
 * - Used in CreateOrderProductDto to ensure snapshot integrity
 * - Allows tolerance of ±0.01 for floating-point precision
 * - Prevents incorrect tax calculations from being saved
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ORDER_PRODUCT_CALCULATION_TOLERANCE } from '../constants';

/**
 * Validates that taxAmount = itemSubtotal * (productTaxRate / 100) (within tolerance)
 *
 * @param validationOptions - Class-validator options
 */
export function IsValidTaxAmountCalculation(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidTaxAmountCalculation',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as {
            osot_itemsubtotal?: number;
            osot_producttax?: number;
          };

          // Extract required fields
          const itemSubtotal = dto.osot_itemsubtotal;
          const productTaxRate = dto.osot_producttax;
          const taxAmount = value as number;

          // Skip validation if any field is missing (handled by @IsNotEmpty)
          if (
            itemSubtotal === undefined ||
            productTaxRate === undefined ||
            taxAmount === undefined
          ) {
            return true;
          }

          // Calculate expected tax amount
          const expectedTaxAmount = itemSubtotal * (productTaxRate / 100);

          // Check if actual matches expected (within tolerance)
          const difference = Math.abs(taxAmount - expectedTaxAmount);
          return difference <= ORDER_PRODUCT_CALCULATION_TOLERANCE;
        },
        defaultMessage(args: ValidationArguments) {
          const dto = args.object as {
            osot_itemsubtotal?: number;
            osot_producttax?: number;
          };
          const itemSubtotal = dto.osot_itemsubtotal ?? 0;
          const productTaxRate = dto.osot_producttax ?? 0;
          const taxAmount = args.value as number;
          const expectedTaxAmount = itemSubtotal * (productTaxRate / 100);

          return `Tax amount calculation is incorrect. Expected ${expectedTaxAmount.toFixed(
            2,
          )} (${itemSubtotal} × ${productTaxRate}%), but got ${taxAmount}`;
        },
      },
    });
  };
}
