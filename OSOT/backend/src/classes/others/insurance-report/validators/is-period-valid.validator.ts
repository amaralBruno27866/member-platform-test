/**
 * Is Period Valid Validator
 *
 * Validates that report period is valid:
 * - Period end must be after period start
 * - Period must be exactly 24 hours (or close to it for testing)
 *
 * USAGE WITH CLASS:
 * ```typescript
 * @Validate(IsPeriodValidConstraint)
 * class CreateInsuranceReportDto {
 *   periodStart: string;
 *   periodEnd: string;
 * }
 * ```
 *
 * OR APPLY DIRECTLY TO CLASS:
 * ```typescript
 * @IsPeriodValid()
 * class CreateInsuranceReportDto {
 *   periodStart: string;
 *   periodEnd: string;
 * }
 * ```
 *
 * @file is-period-valid.validator.ts
 * @module InsuranceReportModule
 * @layer Validators
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { INSURANCE_REPORT_MESSAGES } from '../constants';

interface PeriodObject {
  periodStart?: unknown;
  periodEnd?: unknown;
}

@ValidatorConstraint({ name: 'isPeriodValid', async: false })
export class IsPeriodValidConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, _args: ValidationArguments): boolean {
    const object = _args.object as unknown as PeriodObject;
    const { periodStart, periodEnd } = object;

    // Check if both fields exist
    if (!periodStart || !periodEnd) {
      return true; // Let @IsNotEmpty handle this
    }

    try {
      const start = new Date(periodStart as string | number | Date);
      const end = new Date(periodEnd as string | number | Date);

      // Validate dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return false;
      }

      // Validate end is after start
      if (end <= start) {
        return false;
      }

      // Validate period is approximately 24 hours (allow 1 hour margin for timezones)
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Allow 23-25 hours for timezone variations
      if (diffHours < 23 || diffHours > 25) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(_args: ValidationArguments): string {
    const object = _args.object as unknown as PeriodObject;
    const { periodStart, periodEnd } = object;

    if (!periodStart || !periodEnd) {
      return 'Period start and end dates are required';
    }

    try {
      const start = new Date(periodStart as string | number | Date);
      const end = new Date(periodEnd as string | number | Date);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Period dates must be valid ISO 8601 dates';
      }

      if (end <= start) {
        return INSURANCE_REPORT_MESSAGES.PERIOD_INVALID_RANGE;
      }

      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 23 || diffHours > 25) {
        return INSURANCE_REPORT_MESSAGES.PERIOD_NOT_24_HOURS;
      }

      return 'Period validation failed';
    } catch {
      return 'Period validation failed';
    }
  }
}
