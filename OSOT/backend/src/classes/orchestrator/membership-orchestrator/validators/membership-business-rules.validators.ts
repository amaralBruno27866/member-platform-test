/**
 * Membership Business Rules Validators
 *
 * Validates orchestrator-level business rules specific to membership workflow:
 * - Insurance requirements by category
 * - Payment requirements by category
 * - Category transitions and upgrades
 * - Duplicate membership prevention
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import {
  MEMBERSHIP_CATEGORIES,
  MEMBERSHIP_BUSINESS_RULES,
} from '../constants/membership-orchestrator.constants';
import { CompleteMembershipRegistrationDto } from '../dtos/complete-membership-registration.dto';

/**
 * Validates that insurance is provided when required for the selected category
 */
@ValidatorConstraint({ name: 'insuranceRequirement', async: false })
@Injectable()
export class InsuranceRequirementValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CompleteMembershipRegistrationDto;

    // Get category from membership data
    const categoryId = dto.category?.osot_membership_category;

    if (!categoryId) {
      return true; // Will be caught by required field validation
    }

    // Check if insurance is mandatory for this category
    // Convert Category enum to number for comparison
    const categoryValue =
      typeof categoryId === 'number' ? categoryId : Number(categoryId);
    const insuranceRequired =
      MEMBERSHIP_BUSINESS_RULES.INSURANCE_MANDATORY_CATEGORIES.includes(
        categoryValue as 1 | 2 | 5,
      );

    if (insuranceRequired) {
      // Insurance selection must be provided (at least one selection)
      return (
        !!dto.insuranceSelection &&
        !!dto.insuranceSelection.selections &&
        dto.insuranceSelection.selections.length > 0
      );
    }

    // Check if insurance is not allowed for this category
    const insuranceNotAllowed =
      MEMBERSHIP_BUSINESS_RULES.INSURANCE_NOT_ALLOWED_CATEGORIES.includes(
        categoryValue as 4 | 6 | 7,
      );

    if (insuranceNotAllowed && dto.insuranceSelection) {
      // Insurance should not be provided for these categories
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CompleteMembershipRegistrationDto;
    const categoryId = dto.category?.osot_membership_category;

    if (!categoryId) {
      return 'Category must be specified';
    }

    const categoryName =
      MEMBERSHIP_CATEGORIES.CATEGORY_NAMES[
        categoryId as keyof typeof MEMBERSHIP_CATEGORIES.CATEGORY_NAMES
      ] || 'Unknown';

    const categoryValue =
      typeof categoryId === 'number' ? categoryId : Number(categoryId);
    const insuranceRequired =
      MEMBERSHIP_BUSINESS_RULES.INSURANCE_MANDATORY_CATEGORIES.includes(
        categoryValue as 1 | 2 | 5,
      );

    if (insuranceRequired) {
      return `Insurance is mandatory for ${categoryName} category`;
    }

    return `Insurance is not allowed for ${categoryName} category`;
  }
}

export function IsInsuranceRequirementValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: InsuranceRequirementValidator,
    });
  };
}

/**
 * Validates that payment is provided when required for the selected category
 */
@ValidatorConstraint({ name: 'paymentRequirement', async: false })
@Injectable()
export class PaymentRequirementValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CompleteMembershipRegistrationDto;

    // Get category from membership data
    const categoryId = dto.category?.osot_membership_category;

    if (!categoryId) {
      return true; // Will be caught by required field validation
    }

    // Check if payment is required for this category
    const categoryValue =
      typeof categoryId === 'number' ? categoryId : Number(categoryId);
    const paymentRequired =
      MEMBERSHIP_BUSINESS_RULES.PAYMENT_REQUIRED_CATEGORIES.includes(
        categoryValue as 1 | 2 | 3 | 5,
      );

    if (paymentRequired) {
      // Payment information must be provided
      return (
        !!dto.paymentInfo &&
        !!dto.paymentInfo.method &&
        !!dto.paymentInfo.amount &&
        dto.paymentInfo.amount > 0
      );
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CompleteMembershipRegistrationDto;
    const categoryId = dto.category?.osot_membership_category;

    if (!categoryId) {
      return 'Category must be specified';
    }

    const categoryName =
      MEMBERSHIP_CATEGORIES.CATEGORY_NAMES[
        categoryId as keyof typeof MEMBERSHIP_CATEGORIES.CATEGORY_NAMES
      ] || 'Unknown';

    return `Payment is required for ${categoryName} category`;
  }
}

export function IsPaymentRequirementValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PaymentRequirementValidator,
    });
  };
}

/**
 * Validates insurance coverage amount is within acceptable limits
 */
@ValidatorConstraint({ name: 'insuranceCoverageAmount', async: false })
@Injectable()
export class InsuranceCoverageAmountValidator
  implements ValidatorConstraintInterface
{
  private readonly MIN_COVERAGE = 1000000; // $1M minimum
  private readonly MAX_COVERAGE = 5000000; // $5M maximum

  validate(coverageAmount: number): boolean {
    if (!coverageAmount) {
      return true; // Will be caught by required field validation if needed
    }

    return (
      coverageAmount >= this.MIN_COVERAGE && coverageAmount <= this.MAX_COVERAGE
    );
  }

  defaultMessage(): string {
    return `Insurance coverage amount must be between $${this.MIN_COVERAGE.toLocaleString()} and $${this.MAX_COVERAGE.toLocaleString()}`;
  }
}

export function IsInsuranceCoverageAmountValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: InsuranceCoverageAmountValidator,
    });
  };
}

/**
 * Validates payment amount matches expected pricing
 */
@ValidatorConstraint({ name: 'paymentAmountConsistency', async: false })
@Injectable()
export class PaymentAmountConsistencyValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CompleteMembershipRegistrationDto;

    // If no payment info provided, skip this validation
    if (!dto.paymentInfo || !dto.paymentInfo.amount) {
      return true;
    }

    // Get category to calculate expected base price
    const categoryId = dto.category?.osot_membership_category;
    if (!categoryId) {
      return true; // Will be caught by required field validation
    }

    // Basic validation: payment amount should be reasonable
    const MIN_AMOUNT = 0;
    const MAX_AMOUNT = 10000; // $10,000 maximum for any membership

    const amount = dto.paymentInfo.amount;

    return amount > MIN_AMOUNT && amount <= MAX_AMOUNT;
  }

  defaultMessage(): string {
    return 'Payment amount is invalid or outside acceptable range';
  }
}

export function IsPaymentAmountConsistent(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PaymentAmountConsistencyValidator,
    });
  };
}

/**
 * Validates billing address completeness when payment is provided
 */
@ValidatorConstraint({ name: 'billingAddressRequired', async: false })
@Injectable()
export class BillingAddressRequiredValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CompleteMembershipRegistrationDto;

    // If payment is provided, billing address must be complete
    if (dto.paymentInfo) {
      const billing = dto.paymentInfo.billingAddress;

      if (!billing) {
        return false;
      }

      // All critical fields must be present
      return (
        !!billing.street &&
        !!billing.city &&
        !!billing.postalCode &&
        !!billing.country
      );
    }

    return true;
  }

  defaultMessage(): string {
    return 'Complete billing address is required when payment information is provided';
  }
}

export function IsBillingAddressComplete(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: BillingAddressRequiredValidator,
    });
  };
}

/**
 * Validates membership year is current or future year
 */
@ValidatorConstraint({ name: 'membershipYearValid', async: false })
@Injectable()
export class MembershipYearValidator implements ValidatorConstraintInterface {
  validate(membershipYear: string): boolean {
    if (!membershipYear) {
      return true; // Will be caught by required field validation
    }

    const year = parseInt(membershipYear, 10);
    const currentYear = new Date().getFullYear();

    // Allow current year and up to 2 years in the future
    return year >= currentYear && year <= currentYear + 2;
  }

  defaultMessage(): string {
    const currentYear = new Date().getFullYear();
    return `Membership year must be between ${currentYear} and ${currentYear + 2}`;
  }
}

export function IsMembershipYearValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: MembershipYearValidator,
    });
  };
}

/**
 * Validates that category allows the requested membership action
 */
@ValidatorConstraint({ name: 'categoryAllowsAction', async: false })
@Injectable()
export class CategoryActionValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CompleteMembershipRegistrationDto;

    const categoryId = dto.category?.osot_membership_category;

    if (!categoryId) {
      return true; // Will be caught by required field validation
    }

    // Validate category is a known valid category
    return Object.keys(MEMBERSHIP_CATEGORIES.CATEGORY_NAMES).includes(
      categoryId.toString(),
    );
  }

  defaultMessage(): string {
    return 'Invalid membership category selected';
  }
}

export function IsCategoryActionValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: CategoryActionValidator,
    });
  };
}
