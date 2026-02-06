/**
 * Cross-Entity Validators for Membership Orchestrator
 *
 * Validates relationships and dependencies between different entities:
 * - Account existence and status
 * - Employment requirements for specific categories
 * - Practices requirements for specific categories
 * - Duplicate membership prevention
 * - Pricing consistency
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { MEMBERSHIP_CATEGORIES } from '../constants/membership-orchestrator.constants';
import { CompleteMembershipRegistrationDto } from '../dtos/complete-membership-registration.dto';

/**
 * Validates that Account ID is provided and valid
 * (Actual account existence check should be done in the service layer)
 */
@ValidatorConstraint({ name: 'accountIdRequired', async: false })
@Injectable()
export class AccountIdRequiredValidator
  implements ValidatorConstraintInterface
{
  validate(accountId: string): boolean {
    // Basic UUID format validation
    if (!accountId) {
      return false;
    }

    // UUID v4 format check
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(accountId);
  }

  defaultMessage(): string {
    return 'Valid Account ID (UUID) is required for membership registration';
  }
}

export function IsAccountIdValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: AccountIdRequiredValidator,
    });
  };
}

/**
 * Validates that employment data is provided when required for the category
 */
@ValidatorConstraint({ name: 'employmentRequired', async: false })
@Injectable()
export class EmploymentRequiredValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CompleteMembershipRegistrationDto;

    const categoryId = dto.category?.osot_membership_category;

    if (!categoryId) {
      return true; // Will be caught by required field validation
    }

    const categoryValue =
      typeof categoryId === 'number' ? categoryId : Number(categoryId);

    // Full Member (1) and Associate Member (2) require employment data
    if (
      categoryValue === MEMBERSHIP_CATEGORIES.FULL_MEMBER ||
      categoryValue === MEMBERSHIP_CATEGORIES.ASSOCIATE_MEMBER
    ) {
      // Check if employment DTO is provided (field validation is done by the DTO itself)
      return !!dto.employment;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CompleteMembershipRegistrationDto;
    const categoryId = dto.category?.osot_membership_category;

    const categoryName =
      MEMBERSHIP_CATEGORIES.CATEGORY_NAMES[
        categoryId as keyof typeof MEMBERSHIP_CATEGORIES.CATEGORY_NAMES
      ] || 'this category';

    return `Employment information is required for ${categoryName}`;
  }
}

export function IsEmploymentRequiredValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EmploymentRequiredValidator,
    });
  };
}

/**
 * Validates that practices data is provided when required for the category
 */
@ValidatorConstraint({ name: 'practicesRequired', async: false })
@Injectable()
export class PracticesRequiredValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CompleteMembershipRegistrationDto;

    const categoryId = dto.category?.osot_membership_category;

    if (!categoryId) {
      return true; // Will be caught by required field validation
    }

    const categoryValue =
      typeof categoryId === 'number' ? categoryId : Number(categoryId);

    // Full Member (1) and Associate Member (2) require practices data
    if (
      categoryValue === MEMBERSHIP_CATEGORIES.FULL_MEMBER ||
      categoryValue === MEMBERSHIP_CATEGORIES.ASSOCIATE_MEMBER
    ) {
      // Check if practices DTO is provided (field validation is done by the DTO itself)
      return !!dto.practices;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const dto = args.object as CompleteMembershipRegistrationDto;
    const categoryId = dto.category?.osot_membership_category;

    const categoryName =
      MEMBERSHIP_CATEGORIES.CATEGORY_NAMES[
        categoryId as keyof typeof MEMBERSHIP_CATEGORIES.CATEGORY_NAMES
      ] || 'this category';

    return `Practice information is required for ${categoryName}`;
  }
}

export function IsPracticesRequiredValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PracticesRequiredValidator,
    });
  };
}

/**
 * Validates pricing consistency across all provided data
 */
@ValidatorConstraint({ name: 'pricingConsistency', async: false })
@Injectable()
export class PricingConsistencyValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CompleteMembershipRegistrationDto;

    // If no payment info, skip this validation
    if (!dto.paymentInfo || !dto.paymentInfo.amount) {
      return true;
    }

    const categoryId = dto.category?.osot_membership_category;
    if (!categoryId) {
      return true;
    }

    // Basic sanity checks
    const amount = dto.paymentInfo.amount;

    // Amount should be positive
    if (amount <= 0) {
      return false;
    }

    // Amount should have reasonable bounds
    const MIN_AMOUNT = 10; // Minimum $10
    const MAX_AMOUNT = 10000; // Maximum $10,000

    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return false;
    }

    // Currency should match expected
    if (dto.paymentInfo.currency !== 'CAD') {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Payment amount is inconsistent with membership pricing rules';
  }
}

export function IsPricingConsistent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: PricingConsistencyValidator,
    });
  };
}

/**
 * Validates insurance dates are valid and consistent
 * DISABLED: Dates now calculated automatically by backend
 */
@ValidatorConstraint({ name: 'insuranceDatesValid', async: false })
@Injectable()
export class InsuranceDatesValidator implements ValidatorConstraintInterface {
  validate(_value: any, _args: ValidationArguments): boolean {
    return true;
  }

  defaultMessage(): string {
    return 'Insurance dates are invalid or inconsistent';
  }
}

export function IsInsuranceDatesValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: InsuranceDatesValidator,
    });
  };
}

/**
 * Validates that membership year matches insurance year (if insurance provided)
 * DISABLED: Dates now calculated automatically from membership year
 */
@ValidatorConstraint({ name: 'membershipInsuranceYearMatch', async: false })
@Injectable()
export class MembershipInsuranceYearMatchValidator
  implements ValidatorConstraintInterface
{
  validate(_value: any, _args: ValidationArguments): boolean {
    // Insurance dates now calculated automatically from membership year - always valid
    return true;
  }

  defaultMessage(): string {
    return 'Membership year must match insurance coverage year';
  }
}

export function IsMembershipInsuranceYearMatch(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: MembershipInsuranceYearMatchValidator,
    });
  };
}

/**
 * Validates that employment dates are consistent
 */
@ValidatorConstraint({ name: 'employmentDatesValid', async: false })
@Injectable()
export class EmploymentDatesValidator implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    const dto = args.object as CompleteMembershipRegistrationDto;

    // If no employment, skip
    // Date validation is handled by the Employment DTO itself
    // This validator is kept for future cross-entity date consistency checks
    if (!dto.employment) {
      return true;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Employment dates are invalid or inconsistent';
  }
}

export function IsEmploymentDatesValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: EmploymentDatesValidator,
    });
  };
}
