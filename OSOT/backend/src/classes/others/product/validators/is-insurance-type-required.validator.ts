/**
 * Insurance Type Required Validator
 *
 * Custom validator to ensure insuranceType is set when productCategory is INSURANCE.
 * Business rule: Insurance products MUST specify an insurance type.
 *
 * According to INSURANCE_TYPE_RULES:
 * - Required when productCategory = INSURANCE (1)
 * - Optional for all other categories
 *
 * @file is-insurance-type-required.validator.ts
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
import { InsuranceType } from '../enums/insurance-type.enum';

/**
 * Validator constraint implementation
 */
@ValidatorConstraint({ name: 'IsInsuranceTypeRequired', async: false })
export class IsInsuranceTypeRequiredConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    const object = args.object as {
      productCategory?: ProductCategory;
      insuranceType?: InsuranceType;
    };

    const category = object.productCategory;
    const insuranceType = object.insuranceType;

    // If category is not INSURANCE, insuranceType is optional (always valid)
    if (category !== ProductCategory.INSURANCE) {
      return true;
    }

    // If category IS INSURANCE, insuranceType must be set and valid
    if (category === ProductCategory.INSURANCE) {
      // Check if insuranceType is set and is a valid enum value
      return (
        insuranceType !== undefined &&
        insuranceType !== null &&
        Object.values(InsuranceType).includes(insuranceType)
      );
    }

    return true;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Insurance Type is required for Insurance products. Must be PROFESSIONAL (1), GENERAL (2), CORPORATIVE (3), or PROPERTY (4)';
  }
}

/**
 * Decorator to validate insurance type requirement
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateProductDto {
 *   productCategory: ProductCategory;
 *
 *   @IsInsuranceTypeRequired()
 *   insuranceType?: InsuranceType;
 * }
 * ```
 */
export function IsInsuranceTypeRequired(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsInsuranceTypeRequiredConstraint,
    });
  };
}
