/**
 * Management Domain Validators
 *
 * Custom validation decorators and helper functions for Account Management.
 * Includes User Business ID validation, management flag business rules,
 * mutual exclusivity validation, and lifecycle management constraints.
 */

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { AccessModifier, Privilege } from '../../../../common/enums';
import {
  MANAGEMENT_VALIDATION,
  MANAGEMENT_BUSINESS_RULES,
  MANAGEMENT_ACCESS,
} from '../constants/management.constants';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Interface for validation objects containing Management fields
 */
interface ManagementValidationObject {
  osot_user_business_id?: string;
  osot_life_member_retired?: boolean;
  osot_shadowing?: boolean;
  osot_passed_away?: boolean;
  osot_vendor?: boolean;
  osot_advertising?: boolean;
  osot_recruitment?: boolean;
  osot_driver_rehab?: boolean;
  osot_access_modifiers?: AccessModifier;
  osot_privilege?: Privilege;
  [key: string]: any;
}

// =============================================================================
// BASIC FIELD VALIDATORS
// =============================================================================

/**
 * Validates Management User Business ID format and length
 */
@ValidatorConstraint({ name: 'isManagementUserBusinessId', async: false })
export class IsManagementUserBusinessIdConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    if (!value) return false; // Business required field (CSV: Business requires)

    // Check length constraints (1-20 characters based on CSV)
    if (
      value.length < MANAGEMENT_VALIDATION.USER_BUSINESS_ID.MIN_LENGTH ||
      value.length > MANAGEMENT_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH
    ) {
      return false;
    }

    // Check pattern (alphanumeric with dash/underscore)
    return MANAGEMENT_VALIDATION.USER_BUSINESS_ID.PATTERN.test(value.trim());
  }

  defaultMessage(): string {
    return MANAGEMENT_VALIDATION.USER_BUSINESS_ID.ERROR_MESSAGE;
  }
}

/**
 * Custom decorator for Management User Business ID validation
 */
export function IsManagementUserBusinessId(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsManagementUserBusinessIdConstraint,
    });
  };
}

/**
 * Validates Account Management ID format (osot-am-0000001)
 */
@ValidatorConstraint({ name: 'isAccountManagementIdFormat', async: false })
export class IsAccountManagementIdFormatConstraint
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean {
    if (!value) return true; // Optional field (auto-generated)

    return MANAGEMENT_VALIDATION.ACCOUNT_MANAGEMENT_ID.PATTERN.test(value);
  }

  defaultMessage(): string {
    return `Account Management ID must follow the format: ${MANAGEMENT_VALIDATION.ACCOUNT_MANAGEMENT_ID.EXAMPLE}`;
  }
}

/**
 * Custom decorator for Account Management ID format validation
 */
export function IsAccountManagementIdFormat(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAccountManagementIdFormatConstraint,
    });
  };
}

// =============================================================================
// BUSINESS RULE VALIDATORS
// =============================================================================

/**
 * Validates mutual exclusivity between vendor and recruitment flags
 * Business Rule: Vendors cannot have recruitment permissions
 */
@ValidatorConstraint({ name: 'isVendorRecruitmentValid', async: false })
export class IsVendorRecruitmentValidConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as ManagementValidationObject;
    const isVendor = object.osot_vendor;
    const hasRecruitment = object.osot_recruitment;

    // If vendor is true, recruitment must be false or undefined
    if (isVendor && hasRecruitment) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Vendors cannot have recruitment permissions';
  }
}

/**
 * Custom decorator for vendor-recruitment mutual exclusivity validation
 */
export function IsVendorRecruitmentValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsVendorRecruitmentValidConstraint,
    });
  };
}

/**
 * Validates lifecycle flag combinations
 * Business Rule: Cannot be both active and passed away
 */
@ValidatorConstraint({ name: 'isLifecycleFlagValid', async: false })
export class IsLifecycleFlagValidConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as ManagementValidationObject;
    const isPassedAway = object.osot_passed_away;
    const isLifeMemberRetired = object.osot_life_member_retired;

    // Cannot be both passed away and life member retired
    if (isPassedAway && isLifeMemberRetired) {
      return false;
    }

    return true;
  }

  defaultMessage(): string {
    return 'Cannot be both passed away and life member retired';
  }
}

/**
 * Custom decorator for lifecycle flag validation
 */
export function IsLifecycleFlagValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsLifecycleFlagValidConstraint,
    });
  };
}

/**
 * Validates that active services are not enabled for deceased members
 * Business Rule: Passed away members cannot have active services
 */
@ValidatorConstraint({ name: 'isActiveServiceValid', async: false })
export class IsActiveServiceValidConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as ManagementValidationObject;
    const isPassedAway = object.osot_passed_away;

    // If passed away, no active services should be enabled
    if (isPassedAway) {
      const activeServices =
        MANAGEMENT_BUSINESS_RULES.LIFECYCLE_RULES.REQUIRE_ACTIVE_ACCOUNT;

      for (const service of activeServices) {
        const serviceKey =
          `osot_${service}` as keyof ManagementValidationObject;
        if (object[serviceKey] === true) {
          return false;
        }
      }
    }

    return true;
  }

  defaultMessage(): string {
    return 'Deceased members cannot have active services (shadowing, vendor, advertising, recruitment, driver rehab)';
  }
}

/**
 * Custom decorator for active service validation
 */
export function IsActiveServiceValid(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsActiveServiceValidConstraint,
    });
  };
}

// =============================================================================
// ACCESS CONTROL VALIDATORS
// =============================================================================

/**
 * Validates Access Modifier enum values
 */
@ValidatorConstraint({ name: 'isValidAccessModifier', async: false })
export class IsValidAccessModifierConstraint
  implements ValidatorConstraintInterface
{
  validate(value: AccessModifier): boolean {
    if (value === undefined || value === null) return true; // Optional field

    return Object.values(AccessModifier).includes(value);
  }

  defaultMessage(): string {
    const validValues = Object.values(AccessModifier).join(', ');
    return `Access Modifier must be one of: ${validValues}`;
  }
}

/**
 * Custom decorator for Access Modifier validation
 */
export function IsValidAccessModifier(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidAccessModifierConstraint,
    });
  };
}

/**
 * Validates Privilege enum values
 */
@ValidatorConstraint({ name: 'isValidPrivilege', async: false })
export class IsValidPrivilegeConstraint
  implements ValidatorConstraintInterface
{
  validate(value: Privilege): boolean {
    if (value === undefined || value === null) return true; // Optional field

    return Object.values(Privilege).includes(value);
  }

  defaultMessage(): string {
    const validValues = Object.values(Privilege).join(', ');
    return `Privilege must be one of: ${validValues}`;
  }
}

/**
 * Custom decorator for Privilege validation
 */
export function IsValidPrivilege(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidPrivilegeConstraint,
    });
  };
}

// =============================================================================
// COMPREHENSIVE BUSINESS RULES VALIDATOR
// =============================================================================

/**
 * Validates all management business rules in one comprehensive check
 * Use this for complex cross-field validation scenarios
 */
@ValidatorConstraint({ name: 'isManagementBusinessRulesValid', async: false })
export class IsManagementBusinessRulesValidConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as ManagementValidationObject;

    // Check vendor-recruitment exclusivity
    if (object.osot_vendor && object.osot_recruitment) {
      return false;
    }

    // Check lifecycle flags
    if (object.osot_passed_away && object.osot_life_member_retired) {
      return false;
    }

    // Check active services for deceased members
    if (object.osot_passed_away) {
      const activeServices =
        MANAGEMENT_BUSINESS_RULES.LIFECYCLE_RULES.REQUIRE_ACTIVE_ACCOUNT;

      for (const service of activeServices) {
        const serviceKey =
          `osot_${service}` as keyof ManagementValidationObject;
        if (object[serviceKey] === true) {
          return false;
        }
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const object = args.object as ManagementValidationObject;

    // Provide specific error message based on violation
    if (object.osot_vendor && object.osot_recruitment) {
      return 'Vendors cannot have recruitment permissions';
    }

    if (object.osot_passed_away && object.osot_life_member_retired) {
      return 'Cannot be both passed away and life member retired';
    }

    if (object.osot_passed_away) {
      const activeServices =
        MANAGEMENT_BUSINESS_RULES.LIFECYCLE_RULES.REQUIRE_ACTIVE_ACCOUNT;

      for (const service of activeServices) {
        const serviceKey =
          `osot_${service}` as keyof ManagementValidationObject;
        if (object[serviceKey] === true) {
          return `Deceased members cannot have active ${service} service`;
        }
      }
    }

    return 'Management configuration violates business rules';
  }
}

/**
 * Custom decorator for comprehensive management business rules validation
 */
export function IsManagementBusinessRulesValid(
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsManagementBusinessRulesValidConstraint,
    });
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Utility function to validate management data programmatically
 * Useful for service layer validation
 */
export function validateManagementBusinessRules(
  managementData: Partial<ManagementValidationObject>,
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check vendor-recruitment exclusivity
  if (managementData.osot_vendor && managementData.osot_recruitment) {
    errors.push('Vendors cannot have recruitment permissions');
  }

  // Check lifecycle flags
  if (
    managementData.osot_passed_away &&
    managementData.osot_life_member_retired
  ) {
    errors.push('Cannot be both passed away and life member retired');
  }

  // Check active services for deceased members
  if (managementData.osot_passed_away) {
    const activeServices =
      MANAGEMENT_BUSINESS_RULES.LIFECYCLE_RULES.REQUIRE_ACTIVE_ACCOUNT;

    for (const service of activeServices) {
      const serviceKey = `osot_${service}` as keyof ManagementValidationObject;
      if (managementData[serviceKey] === true) {
        errors.push(`Deceased members cannot have active ${service} service`);
      }
    }
  }

  // Check for sensitive operations that require audit
  const auditRequiredFields =
    MANAGEMENT_BUSINESS_RULES.AUDIT_REQUIREMENTS.REQUIRE_AUDIT;
  const approvalRequiredFields =
    MANAGEMENT_BUSINESS_RULES.AUDIT_REQUIREMENTS.REQUIRE_APPROVAL;

  for (const field of auditRequiredFields) {
    const fieldKey = `osot_${field}` as keyof ManagementValidationObject;
    if (managementData[fieldKey] !== undefined) {
      warnings.push(`Changes to ${field} require audit logging`);
    }
  }

  for (const field of approvalRequiredFields) {
    const fieldKey = `osot_${field}` as keyof ManagementValidationObject;
    if (managementData[fieldKey] !== undefined) {
      warnings.push(`Changes to ${field} require administrative approval`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Utility function to check if a user has sufficient privileges for an operation
 */
export function validatePrivilegeLevel(
  userPrivilege: Privilege,
  requiredOperation: keyof typeof MANAGEMENT_ACCESS.REQUIRED_PRIVILEGES,
): boolean {
  const requiredPrivileges =
    MANAGEMENT_ACCESS.REQUIRED_PRIVILEGES[requiredOperation];

  // Convert enum to string for comparison
  let privilegeName: string;
  switch (userPrivilege) {
    case Privilege.OWNER:
      privilegeName = 'OWNER';
      break;
    case Privilege.ADMIN:
      privilegeName = 'ADMIN';
      break;
    case Privilege.MAIN:
      privilegeName = 'MAIN';
      break;
    default:
      return false;
  }

  return requiredPrivileges.includes(privilegeName as 'OWNER');
}
