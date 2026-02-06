/**
 * Valid Product ID Format Validator
 *
 * Custom class-validator decorator to validate that Product ID
 * follows the expected autonumber format: osot-prod-XXXXXXX
 *
 * Examples:
 * - Valid: 'osot-prod-0000048', 'osot-prod-0000001', 'osot-prod-9999999'
 * - Invalid: 'prod-0000048', 'osot-prod-48', 'random-string'
 *
 * Architecture Notes:
 * - Product ID is a string reference (NOT lookup GUID)
 * - Used in CreateOrderProductDto to ensure snapshot integrity
 * - Prevents saving invalid product references to Dataverse
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { ORDER_PRODUCT_REGEX } from '../constants';

/**
 * Validates that Product ID matches format: osot-prod-XXXXXXX
 *
 * @param validationOptions - Class-validator options
 */
export function IsValidProductIdFormat(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidProductIdFormat',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          // Skip validation if value is missing (handled by @IsNotEmpty)
          if (!value || typeof value !== 'string') {
            return true;
          }

          // Check if value matches expected format
          return ORDER_PRODUCT_REGEX.PRODUCT_ID.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `Product ID must follow format 'osot-prod-XXXXXXX' (7 digits). Got: ${args.value}`;
        },
      },
    });
  };
}
