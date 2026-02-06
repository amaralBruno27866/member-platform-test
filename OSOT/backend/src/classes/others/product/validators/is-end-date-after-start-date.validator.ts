/**
 * Custom Validator: IsEndDateAfterStartDate
 *
 * Validates that end date is greater than or equal to start date
 * Used in CreateProductDto and UpdateProductDto
 *
 * Business Rule:
 * - If both startDate and endDate are provided, endDate must be >= startDate
 * - If only one date is provided, validation passes
 * - If neither date is provided, validation passes
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Validator function to check if end date is after or equal to start date
 */
export function IsEndDateAfterStartDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isEndDateAfterStartDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const obj = args.object as Record<string, unknown>;
          const startDate = obj.startDate as string | undefined;
          const endDate = value as string | undefined;

          // If either date is missing, skip validation
          if (!startDate || !endDate) {
            return true;
          }

          // Parse dates
          const start = new Date(startDate);
          const end = new Date(endDate);

          // Validate that both are valid dates
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return false;
          }

          // End date must be >= start date
          return end >= start;
        },
        defaultMessage(_args: ValidationArguments) {
          return 'End date must be greater than or equal to start date';
        },
      },
    });
  };
}
