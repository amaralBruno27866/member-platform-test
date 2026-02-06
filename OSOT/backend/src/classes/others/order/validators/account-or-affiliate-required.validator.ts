/**
 * Account Or Affiliate Required Validator
 *
 * Custom validator to ensure at least one buyer is specified.
 * Either accountGuid OR affiliateGuid must be present (or both).
 *
 * Business rule: Every order must have a buyer
 * - Account (person OT/OTA)
 * - Affiliate (company/organization)
 *
 * @file account-or-affiliate-required.validator.ts
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
  name: 'AccountOrAffiliateRequired',
  async: false,
})
export class AccountOrAffiliateRequiredConstraint
  implements ValidatorConstraintInterface
{
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as Record<string, unknown>;

    const accountGuid = object.accountGuid as string | undefined;
    const affiliateGuid = object.affiliateGuid as string | undefined;

    // At least one must be present
    return !!(accountGuid || affiliateGuid);
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'Order must have either an Account (person) or Affiliate (company) as buyer. At least one of accountGuid or affiliateGuid is required.';
  }
}

/**
 * Decorator to validate that at least one buyer is specified
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateOrderDto {
 *   @AccountOrAffiliateRequired()
 *   accountGuid?: string;
 *
 *   affiliateGuid?: string;
 * }
 * ```
 */
export function AccountOrAffiliateRequired(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: AccountOrAffiliateRequiredConstraint,
    });
  };
}
