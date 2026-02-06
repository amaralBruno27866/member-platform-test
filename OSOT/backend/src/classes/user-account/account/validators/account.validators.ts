/**
 * Account Validators
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes and ErrorMessages for structured validation
 * - constants: Uses ACCOUNT_FIELD_LIMITS and ACCOUNT_VALIDATION_PATTERNS
 * - enums: Validates against centralized enums (AccountGroup, AccountStatus, etc.)
 *
 * BUSINESS RULES:
 * - Account-specific validation for personal information
 * - Contact information validation (email, phone)
 * - Account group and status validation
 * - Age validation based on date of birth
 * - Declaration acceptance validation
 * - Business ID format validation
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  ACCOUNT_FIELD_LIMITS,
  ACCOUNT_VALIDATION_PATTERNS,
  ACCOUNT_BUSINESS_RULES,
} from '../constants/account.constants';
import { ErrorMessages } from '../../../../common/errors/error-messages';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import {
  AccountGroup,
  AccountStatus,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';

// ========================================
// PERSONAL INFORMATION VALIDATORS
// ========================================

/**
 * Validator for Account First Name
 * Validates length and format requirements
 */
@ValidatorConstraint({ name: 'accountFirstName', async: false })
export class AccountFirstNameValidator implements ValidatorConstraintInterface {
  validate(firstName: string): boolean {
    if (!firstName || firstName.trim().length === 0) return false;

    const trimmed = firstName.trim();

    // Check length constraints
    if (trimmed.length > ACCOUNT_FIELD_LIMITS.FIRST_NAME) {
      return false;
    }

    // Basic name format validation (letters, spaces, hyphens, apostrophes)
    const namePattern = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    return namePattern.test(trimmed);
  }

  defaultMessage(): string {
    return 'First name must contain only letters, spaces, hyphens, and apostrophes';
  }
}

/**
 * Validator for Account Last Name
 * Validates length and format requirements
 */
@ValidatorConstraint({ name: 'accountLastName', async: false })
export class AccountLastNameValidator implements ValidatorConstraintInterface {
  validate(lastName: string): boolean {
    if (!lastName || lastName.trim().length === 0) return false;

    const trimmed = lastName.trim();

    // Check length constraints
    if (trimmed.length > ACCOUNT_FIELD_LIMITS.LAST_NAME) {
      return false;
    }

    // Basic name format validation (letters, spaces, hyphens, apostrophes)
    const namePattern = /^[a-zA-ZÀ-ÿ\s'-]+$/;
    return namePattern.test(trimmed);
  }

  defaultMessage(): string {
    return 'Last name must contain only letters, spaces, hyphens, and apostrophes';
  }
}

/**
 * Validator for Date of Birth
 * Validates age requirements and Canadian date format (YYYY-MM-DD)
 */
@ValidatorConstraint({ name: 'accountDateOfBirth', async: false })
export class AccountDateOfBirthValidator
  implements ValidatorConstraintInterface
{
  validate(dateOfBirth: string): boolean {
    if (!dateOfBirth) return false;

    // Check Canadian date format first: YYYY-MM-DD
    if (!ACCOUNT_VALIDATION_PATTERNS.DATE_OF_BIRTH.test(dateOfBirth)) {
      return false;
    }

    // Parse date
    const birthDate = new Date(dateOfBirth);
    const currentDate = new Date();

    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      return false;
    }

    // Check if date is not in the future
    if (birthDate > currentDate) {
      return false;
    }

    // Calculate age
    const age = this.calculateAge(birthDate, currentDate);

    // Check minimum age requirement
    if (age < ACCOUNT_BUSINESS_RULES.MIN_AGE) {
      return false;
    }

    // Check maximum age requirement (reasonable limit)
    if (age > ACCOUNT_BUSINESS_RULES.MAX_AGE) {
      return false;
    }

    return true;
  }

  private calculateAge(birthDate: Date, currentDate: Date): number {
    const ageInMilliseconds = currentDate.getTime() - birthDate.getTime();
    const ageInYears = Math.floor(
      ageInMilliseconds / (365.25 * 24 * 60 * 60 * 1000),
    );
    return ageInYears;
  }

  defaultMessage(): string {
    return `Date of birth must be in YYYY-MM-DD format and age must be between ${ACCOUNT_BUSINESS_RULES.MIN_AGE} and ${ACCOUNT_BUSINESS_RULES.MAX_AGE} years`;
  }
}

// ========================================
// CONTACT INFORMATION VALIDATORS
// ========================================

/**
 * Validator for Account Email
 * Enhanced email validation beyond basic format
 */
@ValidatorConstraint({ name: 'accountEmail', async: false })
export class AccountEmailValidator implements ValidatorConstraintInterface {
  validate(email: string): boolean {
    if (!email || email.trim().length === 0) return false;

    const trimmed = email.trim().toLowerCase();

    // Check length constraints
    if (trimmed.length > ACCOUNT_FIELD_LIMITS.EMAIL) {
      return false;
    }

    // Use pattern from constants
    if (!ACCOUNT_VALIDATION_PATTERNS.EMAIL.test(trimmed)) {
      return false;
    }

    // Additional business rules for email
    // Reject common temporary email domains if needed
    const tempDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
    ];
    const domain = trimmed.split('@')[1];
    if (tempDomains.includes(domain)) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return ErrorMessages[ErrorCodes.INVALID_EMAIL_FORMAT].publicMessage;
  }
}

/**
 * Validator for Account Mobile Phone
 * Validates Canadian phone format: (XXX) XXX-XXXX
 */
@ValidatorConstraint({ name: 'accountMobilePhone', async: false })
export class AccountMobilePhoneValidator
  implements ValidatorConstraintInterface
{
  validate(phone: string): boolean {
    if (!phone || phone.trim().length === 0) return false;

    const trimmed = phone.trim();

    // Check exact length for Canadian format: (XXX) XXX-XXXX
    if (trimmed.length !== ACCOUNT_FIELD_LIMITS.MOBILE_PHONE) {
      return false;
    }

    // Use pattern from constants for Canadian format validation
    return ACCOUNT_VALIDATION_PATTERNS.PHONE.test(trimmed);
  }

  defaultMessage(): string {
    return 'Mobile phone must be in Canadian format: (XXX) XXX-XXXX';
  }
}

// ========================================
// ACCOUNT CONFIGURATION VALIDATORS
// ========================================

/**
 * Validator for Account Group
 * Validates against allowed account groups
 */
@ValidatorConstraint({ name: 'accountGroup', async: false })
export class AccountGroupValidator implements ValidatorConstraintInterface {
  validate(accountGroup: any): boolean {
    if (accountGroup === undefined || accountGroup === null) return false;

    // Check if it's a valid AccountGroup enum value
    return Object.values(AccountGroup).includes(accountGroup as AccountGroup);
  }

  defaultMessage(): string {
    return 'Account group must be a valid option (Occupational Therapist, Occupational Therapist Assistant, Vendor/Advertiser, or Other)';
  }
}

/**
 * Validator for Account Declaration
 * Validates that declaration is explicitly accepted
 */
@ValidatorConstraint({ name: 'accountDeclaration', async: false })
export class AccountDeclarationValidator
  implements ValidatorConstraintInterface
{
  validate(declaration: any): boolean {
    // Declaration must be explicitly true for account creation
    return declaration === true;
  }

  defaultMessage(): string {
    return 'Account declaration must be accepted to create an account';
  }
}

// ========================================
// OPTIONAL FIELD VALIDATORS
// ========================================

/**
 * Validator for Account Status
 * Validates against allowed account statuses
 */
@ValidatorConstraint({ name: 'accountStatus', async: false })
export class AccountStatusValidator implements ValidatorConstraintInterface {
  validate(accountStatus: any): boolean {
    if (accountStatus === undefined || accountStatus === null) return true; // Optional field

    // Check if it's a valid AccountStatus enum value
    return Object.values(AccountStatus).includes(
      accountStatus as AccountStatus,
    );
  }

  defaultMessage(): string {
    return 'Account status must be Active, Inactive, or Pending';
  }
}

/**
 * Validator for Access Modifier
 * Validates against allowed access modifiers
 */
@ValidatorConstraint({ name: 'accessModifier', async: false })
export class AccessModifierValidator implements ValidatorConstraintInterface {
  validate(accessModifier: any): boolean {
    if (accessModifier === undefined || accessModifier === null) return true; // Optional field

    // Check if it's a valid AccessModifier enum value
    return Object.values(AccessModifier).includes(
      accessModifier as AccessModifier,
    );
  }

  defaultMessage(): string {
    return 'Access modifier must be Public, Protected, or Private';
  }
}

/**
 * Validator for Privilege
 * Validates against allowed privilege levels
 */
@ValidatorConstraint({ name: 'privilege', async: false })
export class PrivilegeValidator implements ValidatorConstraintInterface {
  validate(privilege: any): boolean {
    if (privilege === undefined || privilege === null) return true; // Optional field

    // Check if it's a valid Privilege enum value
    return Object.values(Privilege).includes(privilege as Privilege);
  }

  defaultMessage(): string {
    return 'Privilege must be Owner, Admin, or Main';
  }
}

// ========================================
// BUSINESS ID VALIDATORS
// ========================================

/**
 * Validator for Account Business ID format
 * Validates the osot-0000001 format
 */
@ValidatorConstraint({ name: 'accountBusinessId', async: false })
export class AccountBusinessIdValidator
  implements ValidatorConstraintInterface
{
  validate(businessId: string): boolean {
    if (!businessId) return true; // System generates this, validation is for existing data

    // Use pattern from constants
    return ACCOUNT_VALIDATION_PATTERNS.ACCOUNT_ID.test(businessId);
  }

  defaultMessage(): string {
    return 'Account business ID must follow the format: osot-0000001';
  }
}

// ========================================
// EXPORT VALIDATORS FOR DECORATORS
// ========================================

/**
 * Decorator function for First Name validation
 */
export function IsValidAccountFirstName() {
  return function (_object: any, _propertyName: string) {
    const _validatorOptions = {
      validator: AccountFirstNameValidator,
      message:
        'First name must contain only letters, spaces, hyphens, and apostrophes',
    };
    // This would be used with registerDecorator in a real implementation
  };
}

/**
 * Decorator function for Last Name validation
 */
export function IsValidAccountLastName() {
  return function (_object: any, _propertyName: string) {
    const _validatorOptions = {
      validator: AccountLastNameValidator,
      message:
        'Last name must contain only letters, spaces, hyphens, and apostrophes',
    };
    // This would be used with registerDecorator in a real implementation
  };
}

/**
 * Decorator function for Date of Birth validation
 */
export function IsValidAccountDateOfBirth() {
  return function (_object: any, _propertyName: string) {
    const _validatorOptions = {
      validator: AccountDateOfBirthValidator,
      message: `Date of birth must be in YYYY-MM-DD format and age must be between ${ACCOUNT_BUSINESS_RULES.MIN_AGE} and ${ACCOUNT_BUSINESS_RULES.MAX_AGE} years`,
    };
    // This would be used with registerDecorator in a real implementation
  };
}

/**
 * Decorator function for Email validation
 */
export function IsValidAccountEmail() {
  return function (_object: any, _propertyName: string) {
    const _validatorOptions = {
      validator: AccountEmailValidator,
      message: 'Email must be a valid email address',
    };
    // This would be used with registerDecorator in a real implementation
  };
}

/**
 * Decorator function for Mobile Phone validation
 */
export function IsValidAccountMobilePhone() {
  return function (_object: any, _propertyName: string) {
    const _validatorOptions = {
      validator: AccountMobilePhoneValidator,
      message: 'Mobile phone must be in Canadian format: (XXX) XXX-XXXX',
    };
    // This would be used with registerDecorator in a real implementation
  };
}

/**
 * Decorator function for Account Declaration validation
 */
export function IsValidAccountDeclaration() {
  return function (_object: any, _propertyName: string) {
    const _validatorOptions = {
      validator: AccountDeclarationValidator,
      message: 'Account declaration must be accepted',
    };
    // This would be used with registerDecorator in a real implementation
  };
}
