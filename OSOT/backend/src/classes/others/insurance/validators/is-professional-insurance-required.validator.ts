/**
 * Is Professional Insurance Required Validator
 *
 * Custom validator to ensure Professional Insurance is selected when trying to purchase other insurance types.
 * Enforces business rule: Non-professional insurances (Extended, Liability, etc.) require Professional to be ACTIVE.
 *
 * Business Rule:
 * - Professional Insurance: Always allowed (first purchase or renewal)
 * - Other Types (Extended, Liability, etc.): Requires Professional to be ACTIVE
 * - This validator runs during CreateInsuranceDto validation
 * - But cannot check database (class-validator limitation)
 * - Full validation happens in InsuranceBusinessRulesService.validateInsuranceTypeEligibility()
 *
 * Architecture Note:
 * - Simple format validation only (decorator pattern)
 * - Complex database validation deferred to business rules service
 * - Both must pass for insurance creation to proceed
 *
 * @file is-professional-insurance-required.validator.ts
 * @module InsuranceModule
 * @layer Validators
 * @since 2026-01-28
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { InsuranceType } from '../../product/enums/insurance-type.enum';

/**
 * Validator function to check if insurance type requires Professional prerequisite.
 *
 * This is a simple marker validator - the actual database check happens in:
 * InsuranceBusinessRulesService.validateInsuranceTypeEligibility()
 *
 * Purpose: Provide early feedback on insurance type selection
 * Message: Guides user to select Professional Insurance first
 */
export function IsProfessionalInsuranceRequired(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isProfessionalInsuranceRequired',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(_value: unknown, _args: ValidationArguments) {
          // Validation is always true at DTO level
          // Full validation happens in business rules service
          // This decorator only documents the requirement
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const insuranceType = args.value as string | number | undefined;
          const parsedType =
            typeof insuranceType === 'string'
              ? Number(insuranceType)
              : (insuranceType ?? NaN);
          const typeId = Number.isNaN(parsedType)
            ? undefined
            : (parsedType as InsuranceType);

          const isProfessional = typeId === InsuranceType.PROFESSIONAL; // 1
          const isProperty = typeId === InsuranceType.PROPERTY; // 4

          if (isProfessional || !insuranceType) {
            return 'Insurance type is valid';
          }

          if (isProperty) {
            return (
              'Commercial insurance must be selected before Property coverage. ' +
              'Professional Liability is also required before any additional coverage.'
            );
          }

          return (
            'Professional Liability insurance must be selected first to purchase additional coverage. ' +
            'You can only add extended coverage after activating Professional Insurance.'
          );
        },
      },
    });
  };
}
