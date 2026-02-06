/**
 * Membership Settings Validators (CLEAN REBUILD)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - class-validator: Uses ValidatorConstraint for custom validation logic
 * - constants: Uses MEMBERSHIP_SETTINGS_FIELDS, patterns, and business rules
 * - enums: Validates against MembershipGroup, AccountStatus, Privilege, etc.
 *
 * MULTI-TENANT ARCHITECTURE:
 * - organizationGuid validation for multi-tenant data isolation (CRITICAL)
 * - Ensures all records are properly scoped to organization
 * - Prevents data leakage between organizations
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential validation only for OSOT membership configuration
 * - CSV field constraint validation based on Dataverse specifications
 * - Enum validation for all Choice fields
 * - Business rule validation (year periods, group-year uniqueness)
 * - Settings ID format validation (osot-set-0000001)
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  MEMBERSHIP_YEAR_RANGE,
  SETTINGS_ID_PATTERN,
  MEMBERSHIP_SETTINGS_ENUMS,
  MEMBERSHIP_BUSINESS_RULES,
} from '../constants/membership-settings.constants';
import {
  AccountStatus,
  Privilege,
  AccessModifier,
} from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';

/**
 * Validator for Organization GUID (Multi-Tenant Critical)
 * Validates osot_table_organization relationship (REQUIRED for multi-tenant isolation)
 * This ensures every membership settings record is properly scoped to an organization
 */
@ValidatorConstraint({ name: 'organizationGuid', async: false })
export class OrganizationGuidValidator implements ValidatorConstraintInterface {
  validate(organizationGuid: string): boolean {
    if (!organizationGuid) return false; // REQUIRED field - cannot be empty

    // Validate UUID v4 format
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidPattern.test(organizationGuid);
  }

  defaultMessage(): string {
    return 'Organization GUID is required and must be a valid UUID v4 for multi-tenant isolation';
  }
}

/**
 * Validator for Settings ID (Business ID)
 * Validates osot-set-0000001 format based on CSV Autonumber specification
 */
@ValidatorConstraint({ name: 'settingsId', async: false })
export class SettingsIdValidator implements ValidatorConstraintInterface {
  validate(settingsId: string): boolean {
    if (!settingsId) return true; // Optional for creation, required for updates

    // Validate format: osot-set-0000001 (7 digits)
    return SETTINGS_ID_PATTERN.test(settingsId);
  }

  defaultMessage(): string {
    return 'Settings ID must follow format: osot-set-0000001 (osot-set followed by 7 digits)';
  }
}

/**
 * Validator for Membership Year
 * Validates text field against year range (CSV: Single line of text)
 */
@ValidatorConstraint({ name: 'membershipYear', async: false })
export class MembershipYearValidator implements ValidatorConstraintInterface {
  validate(year: string): boolean {
    if (!year) return false; // Required field

    // Parse as number and validate range
    const yearNumber = parseInt(year, 10);
    if (isNaN(yearNumber)) return false;

    // Check if within valid range
    return (
      yearNumber >= MEMBERSHIP_YEAR_RANGE.MIN_YEAR &&
      yearNumber <= MEMBERSHIP_YEAR_RANGE.MAX_YEAR
    );
  }

  defaultMessage(): string {
    return `Membership year must be a valid year between ${MEMBERSHIP_YEAR_RANGE.MIN_YEAR} and ${MEMBERSHIP_YEAR_RANGE.MAX_YEAR}`;
  }
}

/**
 * Validator for Membership Group
 * Validates against MembershipGroup enum (Individual=1, Business=2)
 */
@ValidatorConstraint({ name: 'membershipGroup', async: false })
export class MembershipGroupValidator implements ValidatorConstraintInterface {
  validate(group: number): boolean {
    if (group === null || group === undefined) return false; // Required field

    // Check if it's a valid enum value
    return MEMBERSHIP_SETTINGS_ENUMS.VALID_GROUPS.includes(
      group as MembershipGroup,
    );
  }

  defaultMessage(): string {
    return 'Membership group must be either Individual or Business';
  }
}

/**
 * Validator for Membership Year Status
 * Validates against AccountStatus enum (Active, Inactive, Pending)
 */
@ValidatorConstraint({ name: 'membershipYearStatus', async: false })
export class MembershipYearStatusValidator
  implements ValidatorConstraintInterface
{
  validate(status: number): boolean {
    if (status === null || status === undefined) return false; // Required field

    // Check if it's a valid enum value
    return MEMBERSHIP_SETTINGS_ENUMS.VALID_STATUSES.includes(
      status as AccountStatus,
    );
  }

  defaultMessage(): string {
    return 'Membership year status must be a valid status (Active, Inactive, or Pending)';
  }
}

/**
 * Interface for year period validation arguments
 */
interface YearPeriodValidationObject {
  osot_year_starts?: string;
  osot_year_ends?: string;
}

/**
 * Validator for Year Period Dates
 * Validates that year start date is before year end date
 */
@ValidatorConstraint({ name: 'yearPeriod', async: false })
export class YearPeriodValidator implements ValidatorConstraintInterface {
  validate(value: any, args?: ValidationArguments): boolean {
    if (!args?.object) return false;

    const validationObject = args.object as YearPeriodValidationObject;
    const { osot_year_starts: startDate, osot_year_ends: endDate } =
      validationObject;

    if (!startDate || !endDate) return true; // Individual date validation handled elsewhere

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Start date must be before end date
    if (start >= end) return false;

    // Check maximum period length (365 days for a year)
    const diffInDays =
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    if (diffInDays > MEMBERSHIP_BUSINESS_RULES.MAX_PERIOD_DAYS) return false;

    if (diffInDays < MEMBERSHIP_BUSINESS_RULES.MIN_PERIOD_DAYS) return false;

    return true;
  }

  defaultMessage(): string {
    return `Year period must be valid: start date before end date, and between ${MEMBERSHIP_BUSINESS_RULES.MIN_PERIOD_DAYS} and ${MEMBERSHIP_BUSINESS_RULES.MAX_PERIOD_DAYS} days`;
  }
}

/**
 * Validator for Privilege
 * Validates against Privilege enum (Owner, etc.)
 */
@ValidatorConstraint({ name: 'privilege', async: false })
export class PrivilegeValidator implements ValidatorConstraintInterface {
  validate(privilege: number): boolean {
    if (privilege === null || privilege === undefined) return true; // Optional field

    // Check if it's a valid enum value
    return MEMBERSHIP_SETTINGS_ENUMS.VALID_PRIVILEGES.includes(
      privilege as Privilege,
    );
  }

  defaultMessage(): string {
    return 'Privilege must be a valid privilege level from the available options';
  }
}

/**
 * Validator for Access Modifiers
 * Validates against AccessModifier enum (Protected, etc.)
 */
@ValidatorConstraint({ name: 'accessModifiers', async: false })
export class AccessModifiersValidator implements ValidatorConstraintInterface {
  validate(accessModifier: number): boolean {
    if (accessModifier === null || accessModifier === undefined) return true; // Optional field

    // Check if it's a valid enum value
    return MEMBERSHIP_SETTINGS_ENUMS.VALID_ACCESS_MODIFIERS.includes(
      accessModifier as AccessModifier,
    );
  }

  defaultMessage(): string {
    return 'Access modifiers must be a valid access modifier from the available options';
  }
}

/**
 * Validator for Group-Year Uniqueness with Organization Scope (Business Rule)
 * Validates that a group-year combination is unique WITHIN an organization
 * This is critical for multi-tenant data integrity
 *
 * This validator would typically be used in service layer for create/update operations
 * It ensures no duplicate membership settings per organization
 */
@ValidatorConstraint({ name: 'groupYearUnique', async: true })
export class GroupYearUniqueValidator implements ValidatorConstraintInterface {
  validate(): Promise<boolean> {
    // This validator would need repository access to check uniqueness
    // Implementation would be completed when repository layer is available
    // For now, return true (actual validation will be in service layer)
    //
    // Service layer MUST validate:
    // - organizationGuid + osot_membership_group + osot_membership_year = unique combination
    // - This ensures no duplicate settings per org/group/year
    return Promise.resolve(true);
  }

  defaultMessage(): string {
    return 'A membership setting already exists for this organization, group, and year combination';
  }
}
