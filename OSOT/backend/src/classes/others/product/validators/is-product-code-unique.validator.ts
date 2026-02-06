/**
 * Product Code Unique Validator
 *
 * Custom async validator to ensure product code uniqueness.
 * According to PRODUCT_CODE_UNIQUENESS_RULES:
 * - Product codes must be unique (case-insensitive)
 * - "MEMBERSHIP-2025" == "membership-2025"
 *
 * This validator requires ProductRepository injection,
 * so it must be used as a class-validator constraint.
 *
 * @file is-product-code-unique.validator.ts
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
import { Injectable, Inject } from '@nestjs/common';
import { PRODUCT_REPOSITORY } from '../interfaces';
import type { ProductRepository } from '../interfaces';

/**
 * Validator constraint implementation
 * Checks database for existing product codes (case-insensitive)
 */
@ValidatorConstraint({ name: 'IsProductCodeUnique', async: true })
@Injectable()
export class IsProductCodeUniqueConstraint
  implements ValidatorConstraintInterface
{
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  /**
   * Validate product code uniqueness
   * For CREATE: code must not exist
   * For UPDATE: code must not exist for other products
   */
  async validate(
    productCode: string,
    args: ValidationArguments,
  ): Promise<boolean> {
    if (!productCode) {
      return true; // Let @IsNotEmpty handle empty values
    }

    const object = args.object as { id?: string };
    const normalizedCode = productCode.toUpperCase();

    // Check if product code exists
    const existingProduct =
      await this.productRepository.findByProductCode(normalizedCode);

    // For CREATE operations (no ID)
    if (!object.id) {
      return !existingProduct; // Code must not exist
    }

    // For UPDATE operations
    if (!existingProduct) {
      return true; // Code doesn't exist, so it's unique
    }

    // Code exists, check if it belongs to the same product
    return existingProduct.osot_table_productid === object.id;
  }

  defaultMessage(args: ValidationArguments): string {
    const productCode = args.value as string;
    return `Product code '${productCode}' is already in use. Product codes must be unique (case-insensitive).`;
  }
}

/**
 * Decorator to validate product code uniqueness
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateProductDto {
 *   @IsProductCodeUnique()
 *   productCode: string;
 * }
 * ```
 */
export function IsProductCodeUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsProductCodeUniqueConstraint,
    });
  };
}
