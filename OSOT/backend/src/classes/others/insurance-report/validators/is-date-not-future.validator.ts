/**
 * Is Date Not Future Validator
 *
 * Validates that report dates are not in the future.
 * Reports must be generated for historical periods only.
 *
 * USAGE:
 * ```typescript
 * @Validate(IsDateNotFutureConstraint)
 * class CreateInsuranceReportDto {
 *   periodStart: string;
 *   periodEnd: string;
 * }
 * ```
 *
 * @file is-date-not-future.validator.ts
 * @module InsuranceReportModule
 * @layer Validators
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { INSURANCE_REPORT_MESSAGES } from '../constants';

@ValidatorConstraint({ name: 'isDateNotFuture', async: false })
export class IsDateNotFutureConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    if (!value) {
      return true; // Let @IsNotEmpty handle this
    }

    try {
      const date = new Date(value as string | number | Date);

      // Validate date is valid
      if (isNaN(date.getTime())) {
        return false;
      }

      // Check if date is not in the future (with 1-hour buffer for timezone variations)
      const now = new Date();
      const hourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);

      return date <= hourFromNow;
    } catch {
      return false;
    }
  }

  defaultMessage(_args: ValidationArguments): string {
    return INSURANCE_REPORT_MESSAGES.PERIOD_IN_FUTURE;
  }
}
