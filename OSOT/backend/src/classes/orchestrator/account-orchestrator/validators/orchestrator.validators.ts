/**
 * Orchestrator Custom Validators
 *
 * Central export point for all orchestrator validators and
 * remaining business rule validation logic.
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
// RE-EXPORT SPECIALIZED VALIDATORS
// ========================================

// Education-related validators
export * from './education-consistency.validators';

// Identity-related validators
export * from './identity-consistency.validators';

// Geographic/regional validators
export * from './geographic.validators';

// Contact-related validators
export * from './contact-consistency.validators';

// ========================================
// GENERAL BUSINESS RULE VALIDATORS
// ========================================

/**
 * Validates that management flags are consistent with business rules
 */
@ValidatorConstraint({ name: 'managementFlagsConsistency', async: false })
@Injectable()
export class ManagementFlagsConsistencyConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const obj = args.object as CompleteUserRegistrationDto;

    // If no management data, validation passes
    if (!obj.management) {
      return true;
    }

    const management = obj.management;

    // Business rule: Cannot be both passed away and active in other capacities
    if (management.osot_passed_away) {
      const activeFlags = [
        management.osot_vendor,
        management.osot_advertising,
        management.osot_recruitment,
        management.osot_driver_rehab,
        management.osot_shadowing,
      ];

      // If passed away, no other active flags should be true
      const hasActiveFlags = activeFlags.some((flag) => flag === true);
      if (hasActiveFlags) {
        return false;
      }
    }

    // Business rule: Life member retired implies not actively working
    if (management.osot_life_member_retired) {
      const workingFlags = [
        management.osot_vendor,
        management.osot_advertising,
        management.osot_recruitment,
        management.osot_driver_rehab,
      ];

      // Retired life members shouldn't be in active work categories
      const hasWorkingFlags = workingFlags.some((flag) => flag === true);
      if (hasWorkingFlags) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(): string {
    return 'Management flags are inconsistent with business rules';
  }
}

export function IsManagementFlagsConsistent(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: ManagementFlagsConsistencyConstraint,
    });
  };
}
