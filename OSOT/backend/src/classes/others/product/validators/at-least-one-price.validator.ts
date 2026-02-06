/**
 * At Least One Price Validator
 *
 * Custom validator to ensure at least one price field is set.
 * According to PRICING_RULES, at least one price must be provided.
 *
 * @file at-least-one-price.validator.ts
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
import { PRODUCT_PRICE_FIELDS } from '../constants';

/**
 * Validator constraint implementation
 */
@ValidatorConstraint({ name: 'AtLeastOnePrice', async: false })
export class AtLeastOnePriceConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;

    // Check if at least one price field has a valid number value
    const hasPriceField = PRODUCT_PRICE_FIELDS.some((field) => {
      const fieldValue = object[this.toCamelCase(field)];
      return (
        typeof fieldValue === 'number' && !isNaN(fieldValue) && fieldValue >= 0
      );
    });

    return hasPriceField;
  }

  defaultMessage(_args: ValidationArguments): string {
    return `At least one price field must be set with a valid value. Available fields: ${PRODUCT_PRICE_FIELDS.map((f) => this.toCamelCase(f)).join(', ')}`;
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
 * Decorator to validate that at least one price field is set
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateProductDto {
 *   @AtLeastOnePrice()
 *   generalPrice?: number;
 * }
 * ```
 */
export function AtLeastOnePrice(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: AtLeastOnePriceConstraint,
    });
  };
}
