/**
 * Geographic Validators
 *
 * Custom validation decorators and logic for geographic/regional
 * validation requirements (postal codes, phone numbers, etc.).
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';

// ========================================
// CANADIAN POSTAL CODE VALIDATOR
// ========================================

/**
 * Validates Canadian postal code format
 */
@ValidatorConstraint({ name: 'canadianPostalCode', async: false })
@Injectable()
export class CanadianPostalCodeConstraint
  implements ValidatorConstraintInterface
{
  validate(postalCode: any): boolean {
    if (typeof postalCode !== 'string') {
      return false;
    }

    // Canadian postal code pattern: A1A 1A1 or A1A1A1
    const canadianPostalCodeRegex = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
    return canadianPostalCodeRegex.test(postalCode);
  }

  defaultMessage(): string {
    return 'Postal code must be a valid Canadian postal code (e.g., M5V 3A8)';
  }
}

export function IsCanadianPostalCode(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: CanadianPostalCodeConstraint,
    });
  };
}

// ========================================
// NORTH AMERICAN PHONE VALIDATOR
// ========================================

/**
 * Validates North American phone number format
 */
@ValidatorConstraint({ name: 'northAmericanPhone', async: false })
@Injectable()
export class NorthAmericanPhoneConstraint
  implements ValidatorConstraintInterface
{
  validate(phone: any): boolean {
    if (typeof phone !== 'string') {
      return false;
    }

    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');

    // Check if it's a valid North American number (10 digits)
    if (digitsOnly.length !== 10) {
      return false;
    }

    // First digit of area code cannot be 0 or 1
    const areaCodeFirstDigit = digitsOnly[0];
    if (areaCodeFirstDigit === '0' || areaCodeFirstDigit === '1') {
      return false;
    }

    // First digit of exchange code cannot be 0 or 1
    const exchangeFirstDigit = digitsOnly[3];
    if (exchangeFirstDigit === '0' || exchangeFirstDigit === '1') {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Phone number must be a valid North American phone number (10 digits)';
  }
}

export function IsNorthAmericanPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: NorthAmericanPhoneConstraint,
    });
  };
}
