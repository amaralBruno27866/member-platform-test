/**
 * Price Required When Available Validator
 *
 * Custom validator to ensure at least one price is set when status is AVAILABLE.
 * Business rule: Products with AVAILABLE status must have pricing information.
 *
 * @file is-price-required-when-available.validator.ts
 * @module ProductModule
 * @layer Validators
 * @since 2025-05-01
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ProductStatus } from '../enums';
import { PRODUCT_PRICE_FIELDS } from '../constants';

/**
 * Validator constraint implementation
 */
@ValidatorConstraint({ name: 'IsPriceRequiredWhenAvailable', async: false })
export class IsPriceRequiredWhenAvailableConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    const object = args.object as {
      productStatus?: ProductStatus;
      [key: string]: unknown;
    };

    // Only validate when status is AVAILABLE
    if (object.productStatus !== ProductStatus.AVAILABLE) {
      return true; // Not applicable
    }

    // Check if at least one price field has a valid value
    const hasPriceField = PRODUCT_PRICE_FIELDS.some((field) => {
      const fieldValue = object[this.toCamelCase(field)];
      return (
        typeof fieldValue === 'number' && !isNaN(fieldValue) && fieldValue >= 0
      );
    });

    return hasPriceField;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'At least one price must be set when product status is AVAILABLE';
  }

  /**
   * Convert SCREAMING_SNAKE_CASE to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .toLowerCase()
      .replace(/_([a-z])/g, (_: string, letter: string) =>
        letter.toUpperCase(),
      );
  }
}

/**
 * Decorator to validate price requirement when status is AVAILABLE
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateProductDto {
 *   @IsPriceRequiredWhenAvailable()
 *   generalPrice?: number;
 *
 *   productStatus: ProductStatus;
 * }
 * ```
 */
export function IsPriceRequiredWhenAvailable(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPriceRequiredWhenAvailableConstraint,
    });
  };
}
