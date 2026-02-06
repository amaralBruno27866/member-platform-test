/**
 * Inventory Valid For Status Validator
 *
 * Custom validator to ensure inventory is valid for product status.
 * Business rules:
 * - OUT_OF_STOCK status requires inventory to be 0 or undefined
 * - AVAILABLE status with inventory=0 should warn (but allow for unlimited inventory)
 *
 * @file is-inventory-valid-for-status.validator.ts
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

/**
 * Validator constraint implementation
 */
@ValidatorConstraint({ name: 'IsInventoryValidForStatus', async: false })
export class IsInventoryValidForStatusConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown, args: ValidationArguments): boolean {
    const object = args.object as {
      productStatus?: ProductStatus;
      inventory?: number;
    };

    const status = object.productStatus;
    const inventory = object.inventory;

    // If no status or inventory, skip validation
    if (status === undefined || inventory === undefined) {
      return true;
    }

    // If status is OUT_OF_STOCK, inventory must be 0 or undefined
    if (status === ProductStatus.OUT_OF_STOCK) {
      return inventory === 0;
    }

    // For all other statuses, any inventory value is valid
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as {
      productStatus?: ProductStatus;
      inventory?: number;
    };

    if (object.productStatus === ProductStatus.OUT_OF_STOCK) {
      return `Inventory must be 0 when product status is OUT_OF_STOCK. Current inventory: ${object.inventory}`;
    }

    return 'Invalid inventory value for the given product status';
  }
}

/**
 * Decorator to validate inventory based on status
 *
 * @param validationOptions - Validation options
 *
 * @example
 * ```typescript
 * class CreateProductDto {
 *   @IsInventoryValidForStatus()
 *   inventory?: number;
 *
 *   productStatus: ProductStatus;
 * }
 * ```
 */
export function IsInventoryValidForStatus(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsInventoryValidForStatusConstraint,
    });
  };
}
