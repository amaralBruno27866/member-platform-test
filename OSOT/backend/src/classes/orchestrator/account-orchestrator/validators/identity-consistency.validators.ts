/**
 * Identity Consistency Validators
 *
 * Custom validation decorators and logic for identity-related
 * cross-entity validation requirements and cultural sensitivity.
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { CompleteUserRegistrationDto } from '../dtos/complete-user-registration.dto';

// ========================================
// CHOSEN NAME CONSISTENCY VALIDATOR
// ========================================

/**
 * Validates that chosen name is provided in Identity when different from Account name
 */
@ValidatorConstraint({ name: 'chosenNameConsistency', async: false })
@Injectable()
export class ChosenNameConsistencyConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const obj = args.object as CompleteUserRegistrationDto;

    // If no chosen name provided, validation passes
    if (!obj.identity?.osot_chosen_name) {
      return true;
    }

    // Chosen name should be different from account names to be meaningful
    const chosenName = obj.identity.osot_chosen_name.toLowerCase().trim();
    const firstName = obj.account?.osot_first_name?.toLowerCase().trim();
    const lastName = obj.account?.osot_last_name?.toLowerCase().trim();

    // If chosen name is same as first or last name, it's not adding value
    if (chosenName === firstName || chosenName === lastName) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Chosen name should be different from first or last name if provided';
  }
}

export function IsChosenNameConsistent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ChosenNameConsistencyConstraint,
    });
  };
}

// ========================================
// DATE RANGE VALIDATOR
// ========================================

/**
 * Validates that a date is within a reasonable range
 */
@ValidatorConstraint({ name: 'reasonableDateRange', async: false })
@Injectable()
export class ReasonableDateRangeConstraint
  implements ValidatorConstraintInterface
{
  validate(dateValue: any): boolean {
    if (!dateValue) {
      return true; // Let other validators handle required validation
    }

    const date = new Date(dateValue as string);
    if (isNaN(date.getTime())) {
      return false; // Invalid date
    }

    const now = new Date();
    const hundredYearsAgo = new Date(
      now.getFullYear() - 100,
      now.getMonth(),
      now.getDate(),
    );
    const tenYearsFromNow = new Date(
      now.getFullYear() + 10,
      now.getMonth(),
      now.getDate(),
    );

    return date >= hundredYearsAgo && date <= tenYearsFromNow;
  }

  defaultMessage(): string {
    return 'Date must be within the last 100 years and not more than 10 years in the future';
  }
}

export function IsReasonableDateRange(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ReasonableDateRangeConstraint,
    });
  };
}
