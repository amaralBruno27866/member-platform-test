/**
 * Is Professional Required For Insurance Validator
 *
 * Custom validator to ensure if non-professional insurance is in order,
 * professional insurance must also be present.
 *
 * Business Rule (Cascading Removal):
 * - If user removes Professional Insurance but keeps other types → AUTO-REMOVE all non-professional
 * - This prevents orphaned insurance items in cart
 * - Triggered during Order creation/update validation
 *
 * Validation Logic:
 * 1. Check if order has insurance items (any category='insurance')
 * 2. If has insurance items:
 *    - If has Professional → VALID (can add other types)
 *    - If NO Professional + has other types → INVALID (cascade remove non-professional)
 * 3. If no insurance items → VALID
 *
 * Integration Point:
 * - Applied to CreateOrderDto.products field
 * - OrderBusinessRulesService validates and applies cascade removal
 * - OrderInsuranceOrchestratorService.validateAndNormalizeInsuranceItems() executes removal
 *
 * Error Message:
 * "Professional Liability Insurance is required when purchasing other insurance types.
 *  You must select Professional Liability to complete this order."
 *
 * @file is-professional-required-for-insurance.validator.ts
 * @module OrderModule
 * @layer Validators
 * @since 2026-01-28
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ProductCategory } from '../../product/enums/product-category.enum';

/**
 * Validator constraint: Check if non-professional insurance exists without professional
 */
@ValidatorConstraint({
  name: 'IsProfessionalRequiredForInsurance',
  async: false,
})
export class IsProfessionalRequiredForInsuranceConstraint
  implements ValidatorConstraintInterface
{
  validate(orderProducts: unknown, _args: ValidationArguments): boolean {
    // If not an array, skip validation
    if (!Array.isArray(orderProducts)) {
      return true;
    }

    // Type assertion for safety
    const products = orderProducts as Array<{
      osot_product_category?: number;
      productCategory?: number;
    }>;

    // Filter insurance items
    const insuranceItems = products.filter((product) => {
      const category = product.osot_product_category ?? product.productCategory;
      return category === (ProductCategory.INSURANCE as unknown as number); // INSURANCE = 1
    });

    // If no insurance items, validation passes
    if (insuranceItems.length === 0) {
      return true;
    }

    // At least one insurance item exists
    // Check if Professional (value 0 = professional type) is included
    // OR check for specific insurance type field if present
    const hasProfessional = insuranceItems.some((item) => {
      // Check for insurance_type field that indicates professional
      return (item as Record<string, unknown>).osot_insurance_type ===
        'professional'
        ? true
        : false;
    });

    // RULE: If has insurance items but NO professional, invalid
    // This allows orchestrator to cascade-remove non-professional items
    const hasNonProfessional = insuranceItems.some((item) => {
      return (item as Record<string, unknown>).osot_insurance_type !==
        'professional'
        ? true
        : false;
    });

    // Valid scenarios:
    // 1. No insurance items
    // 2. Has professional (can add others)
    // 3. Professional only (no non-professional)
    //
    // Invalid scenario:
    // Has non-professional but NO professional
    return !(hasNonProfessional && !hasProfessional);
  }

  defaultMessage(_args: ValidationArguments): string {
    return `Professional Liability Insurance is required when purchasing other insurance types. 
            You must select Professional Liability to complete this order. 
            If you remove Professional Insurance, all other insurance items will be removed automatically.`;
  }
}

/**
 * Decorator to validate professional insurance requirement in order
 *
 * Applied to: CreateOrderDto.products
 * Purpose: Ensure Professional is present if other insurance types selected
 * Action: If validation fails, orchestrator will cascade-remove non-professional items
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateOrderDto {
 *   @IsProfessionalRequiredForInsurance()
 *   products: CreateOrderProductDto[];
 * }
 * ```
 */
export function IsProfessionalRequiredForInsurance(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsProfessionalRequiredForInsuranceConstraint,
    });
  };
}
