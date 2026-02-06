/**
 * Is Declaration True Validator
 *
 * Custom validator to ensure insurance declaration is true on creation.
 * User must accept all terms and declare information is accurate.
 *
 * Business Rule: osot_insurance_declaration must be true to create insurance
 * - Applies to: CreateInsuranceDto only
 * - Does not apply to: UpdateInsuranceDto (read-only on updates)
 * - Message: "You must accept the insurance declaration to create a certificate"
 *
 * @file is-declaration-true.validator.ts
 * @module InsuranceModule
 * @layer Validators
 * @since 2026-01-27
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validator function to check if insurance declaration is true
 * Used only during insurance creation, not updates
 */
export function IsDeclarationTrue(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDeclarationTrue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, _args: ValidationArguments) {
          // Declaration must be explicitly true
          return value === true;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'You must accept the insurance declaration to create a certificate. All information must be true and complete.';
        },
      },
    });
  };
}
