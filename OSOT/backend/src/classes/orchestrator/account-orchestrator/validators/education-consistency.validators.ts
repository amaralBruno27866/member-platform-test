/**
 * Education Consistency Validators
 *
 * Custom validation decorators and logic for education-related
 * cross-entity validation requirements.
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
// EDUCATION TYPE CONSISTENCY VALIDATOR
// ========================================

/**
 * Validates that education data matches the selected education type
 */
@ValidatorConstraint({ name: 'educationTypeConsistency', async: false })
@Injectable()
export class EducationTypeConsistencyConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const obj = args.object as CompleteUserRegistrationDto;

    // If no education type is specified, validation passes
    if (!obj.educationType) {
      return true;
    }

    // Check OT education consistency
    if (obj.educationType === 'ot') {
      return !!obj.otEducation && !obj.otaEducation;
    }

    // Check OTA education consistency
    if (obj.educationType === 'ota') {
      return !!obj.otaEducation && !obj.otEducation;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    const obj = args.object as CompleteUserRegistrationDto;
    return `Education data must match educationType '${obj.educationType}'. Provide ${obj.educationType}Education and omit the other.`;
  }
}

export function IsEducationTypeConsistent(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EducationTypeConsistencyConstraint,
    });
  };
}

// ========================================
// GRADUATION YEAR VALIDATOR
// ========================================

/**
 * Validates graduation year is reasonable
 */
@ValidatorConstraint({ name: 'reasonableGraduationYear', async: false })
@Injectable()
export class ReasonableGraduationYearConstraint
  implements ValidatorConstraintInterface
{
  validate(year: any): boolean {
    if (typeof year !== 'number') {
      return false;
    }

    const currentYear = new Date().getFullYear();
    const minYear = 1950; // Reasonable minimum for professional programs
    const maxYear = currentYear + 10; // Allow future graduations

    return year >= minYear && year <= maxYear;
  }

  defaultMessage(): string {
    const currentYear = new Date().getFullYear();
    return `Graduation year must be between 1950 and ${currentYear + 10}`;
  }
}

export function IsReasonableGraduationYear(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ReasonableGraduationYearConstraint,
    });
  };
}
