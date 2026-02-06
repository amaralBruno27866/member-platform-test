/**
 * Insurance Limit Required Validator
 *
 * Custom validator to ensure insuranceLimit is set when productCategory is INSURANCE.
 * Business rule: Insurance products MUST specify an insurance limit.
 *
 * According to INSURANCE_LIMIT_RULES:
 * - Required when productCategory = INSURANCE (1)
 * - Optional for all other categories
 * - Must be >= INSURANCE_LIMIT_MIN (0.00)
 * - Must be <= INSURANCE_LIMIT_MAX (999,999,999.99)
 *
 * @file is-insurance-limit-required.validator.ts
 * @module ProductModule
 * @layer Validators
 * @since 2025-12-08
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ProductCategory } from '../enums/product-category.enum';
import { INSURANCE_LIMIT_RULES } from '../constants/product-business-rules.constant';

/**
 * Validator constraint implementation
 */
@ValidatorConstraint({ name: 'IsInsuranceLimitRequired', async: false })
export class IsInsuranceLimitRequiredConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    const object = args.object as {
      productCategory?: ProductCategory;
      insuranceLimit?: number;
    };

    const category = object.productCategory;
    const insuranceLimit = object.insuranceLimit;

    // If category is not INSURANCE, insuranceLimit is optional (always valid)
    if (category !== ProductCategory.INSURANCE) {
      return true;
    }

    // If category IS INSURANCE, insuranceLimit must be set and valid
    if (category === ProductCategory.INSURANCE) {
      // Check if insuranceLimit is set, is a valid number, and meets minimum requirement
      return (
        insuranceLimit !== undefined &&
        insuranceLimit !== null &&
        typeof insuranceLimit === 'number' &&
        !isNaN(insuranceLimit) &&
        insuranceLimit >= INSURANCE_LIMIT_RULES.MIN_VALUE &&
        insuranceLimit <= INSURANCE_LIMIT_RULES.MAX_VALUE
      );
    }

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return `Insurance Limit is required for Insurance products. Must be a number between ${INSURANCE_LIMIT_RULES.MIN_VALUE} and ${INSURANCE_LIMIT_RULES.MAX_VALUE}. ${INSURANCE_LIMIT_RULES.MISSING_ERROR}`;
  }
}

/**
 * Decorator to validate insurance limit requirement
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateProductDto {
 *   productCategory: ProductCategory;
 *
 *   @IsInsuranceLimitRequired()
 *   insuranceLimit?: number;
 * }
 * ```
 */
export function IsInsuranceLimitRequired(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsInsuranceLimitRequiredConstraint,
    });
  };
}
