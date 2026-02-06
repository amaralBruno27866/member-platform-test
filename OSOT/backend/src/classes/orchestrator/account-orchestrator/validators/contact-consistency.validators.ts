/**
 * Contact Consistency Validators
 *
 * Custom validation decorators and logic for contact-related
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
// EMAIL CONSISTENCY VALIDATOR
// ========================================

/**
 * Validates that email addresses are consistent across Account and Contact
 * Note: Contact uses secondary email, so we validate against that
 */
@ValidatorConstraint({ name: 'emailConsistency', async: false })
@Injectable()
export class EmailConsistencyConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const obj = args.object as CompleteUserRegistrationDto;

    // If either email is missing, let individual validators handle it
    if (!obj.account?.osot_email || !obj.contact?.osot_secondary_email) {
      return true;
    }

    // Check if emails match (account primary vs contact secondary)
    return obj.account.osot_email === obj.contact.osot_secondary_email;
  }

  defaultMessage(): string {
    return 'Account email and Contact secondary email should be identical for consistency';
  }
}

export function IsEmailConsistent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EmailConsistencyConstraint,
    });
  };
}
