/**
 * Membership Preferences Validators
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - class-validator: Uses ValidatorConstraint for custom validation logic
 * - constants: Uses MEMBERSHIP_PREFERENCES_FIELDS, limits, and patterns
 * - enums: Validates against local enums (ThirdParties, etc.) and global enums
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential validation only for OSOT membership preferences management
 * - CSV field constraint validation based on Dataverse specifications
 * - Enum validation for all Choice fields (4 local + 2 global)
 * - Business rule validation (lookup requirements, user-year uniqueness)
 * - Preference ID format validation (osot-pref-0000001)
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  MEMBERSHIP_YEAR_LENGTH,
  PREFERENCE_ID_PATTERN,
  MEMBERSHIP_PREFERENCES_ENUMS,
  MEMBERSHIP_PREFERENCES_BUSINESS_RULES,
} from '../constants/membership-preference.constants';
import { Privilege, AccessModifier } from '../../../../common/enums';
import { ThirdParties } from '../enums/third-parties.enum';
import { PracticePromotion } from '../enums/practice-promotion.enum';
import { SearchTools } from '../enums/search-tools.enum';
import { PsychotherapySupervision } from '../enums/psychotherapy-supervision.enum';

/**
 * Validator for Preference ID (Business ID)
 * Validates osot-pref-0000001 format based on CSV Autonumber specification
 */
@ValidatorConstraint({ name: 'preferenceId', async: false })
export class PreferenceIdValidator implements ValidatorConstraintInterface {
  validate(preferenceId: string): boolean {
    if (!preferenceId) return true; // Optional for creation, required for updates

    // Validate format: osot-pref-0000001 (7 digits)
    return PREFERENCE_ID_PATTERN.test(preferenceId);
  }

  defaultMessage(): string {
    return 'Preference ID must follow format: osot-pref-0000001 (osot-pref followed by 7 digits)';
  }
}

/**
 * Validator for Membership Year
 * Validates text field (4 chars) against year format and range
 */
@ValidatorConstraint({ name: 'membershipYearPreference', async: false })
export class MembershipYearPreferenceValidator
  implements ValidatorConstraintInterface
{
  validate(year: string): boolean {
    if (!year) return false; // Required field

    // Validate format: 4-digit year
    if (!MEMBERSHIP_YEAR_LENGTH.PATTERN.test(year)) return false;

    // Parse as number and validate range
    const yearNumber = parseInt(year, 10);
    if (isNaN(yearNumber)) return false;

    // Check if within valid range
    return (
      yearNumber >= MEMBERSHIP_PREFERENCES_BUSINESS_RULES.MIN_YEAR &&
      yearNumber <= MEMBERSHIP_PREFERENCES_BUSINESS_RULES.MAX_YEAR
    );
  }

  defaultMessage(): string {
    return `Membership year must be a 4-digit year between ${MEMBERSHIP_PREFERENCES_BUSINESS_RULES.MIN_YEAR} and ${MEMBERSHIP_PREFERENCES_BUSINESS_RULES.MAX_YEAR}`;
  }
}

/**
 * Interface for lookup validation arguments
 */
interface LookupValidationObject {
  osot_table_membership_category?: string;
  osot_table_account?: string;
  osot_table_account_affiliate?: string;
  ['osot_Table_Account@odata.bind']?: string;
  ['osot_Table_Account_Affiliate@odata.bind']?: string;
}

/**
 * Validator for Exclusive User Reference
 * Ensures only ONE of Account OR Affiliate is specified, never both
 * Category can coexist with either Account or Affiliate
 */
@ValidatorConstraint({ name: 'exclusiveUserReferencePreference', async: false })
export class ExclusiveUserReferencePreferenceValidator
  implements ValidatorConstraintInterface
{
  validate(value: any, args?: ValidationArguments): boolean {
    if (!args?.object) return false;

    const object = args.object as LookupValidationObject;

    // Check both regular fields and OData bind fields
    const accountBind = object['osot_Table_Account@odata.bind'];
    const affiliateBind = object['osot_Table_Account_Affiliate@odata.bind'];
    const accountId = object.osot_table_account;
    const affiliateId = object.osot_table_account_affiliate;

    // Check if account is present (either bind or direct)
    const hasAccount =
      (accountBind &&
        typeof accountBind === 'string' &&
        accountBind.trim().length > 0) ||
      (accountId &&
        typeof accountId === 'string' &&
        accountId.trim().length > 0);

    // Check if affiliate is present (either bind or direct)
    const hasAffiliate =
      (affiliateBind &&
        typeof affiliateBind === 'string' &&
        affiliateBind.trim().length > 0) ||
      (affiliateId &&
        typeof affiliateId === 'string' &&
        affiliateId.trim().length > 0);

    // XOR logic: Account and Affiliate are mutually exclusive
    // Both false (neither) is OK, both true is NOT OK
    // Category can coexist with either one
    return !(hasAccount && hasAffiliate);
  }

  defaultMessage(): string {
    return 'Cannot specify both Account and Affiliate - only one user reference is allowed';
  }
}

/**
 * Validator for Lookup Requirements
 * Ensures at least one lookup field is populated (business rule)
 * Account and Affiliate are mutually exclusive (validated separately)
 */
@ValidatorConstraint({ name: 'lookupRequired', async: false })
export class LookupRequiredValidator implements ValidatorConstraintInterface {
  validate(value: any, args?: ValidationArguments): boolean {
    if (!args?.object) return false;

    const validationObject = args.object as LookupValidationObject;
    const {
      osot_table_membership_category: categoryId,
      osot_table_account: accountId,
      osot_table_account_affiliate: affiliateId,
    } = validationObject;

    // Also check OData bind fields
    const accountBind = validationObject['osot_Table_Account@odata.bind'];
    const affiliateBind =
      validationObject['osot_Table_Account_Affiliate@odata.bind'];

    // At least one lookup must be present
    const lookupsPresent = [
      categoryId,
      accountId,
      affiliateId,
      accountBind,
      affiliateBind,
    ].filter((id) => id && id.trim().length > 0).length;

    return (
      lookupsPresent >=
      MEMBERSHIP_PREFERENCES_BUSINESS_RULES.REQUIRED_LOOKUP_COUNT
    );
  }

  defaultMessage(): string {
    return 'At least one lookup field must be provided (category, account, or affiliate)';
  }
}

/**
 * Validator for Third Parties Choice
 * Validates against ThirdParties enum - Multi-select
 */
@ValidatorConstraint({ name: 'thirdParties', async: false })
export class ThirdPartiesValidator implements ValidatorConstraintInterface {
  validate(thirdParties: number | number[]): boolean {
    if (thirdParties === null || thirdParties === undefined) return true; // Optional field

    // Handle array (multi-select)
    if (Array.isArray(thirdParties)) {
      if (thirdParties.length === 0) return true; // Empty array is valid

      // Check for duplicates
      const uniqueValues = new Set(thirdParties);
      if (uniqueValues.size !== thirdParties.length) return false;

      // Validate each value
      return thirdParties.every((value) =>
        MEMBERSHIP_PREFERENCES_ENUMS.VALID_THIRD_PARTIES.includes(
          value as ThirdParties,
        ),
      );
    }

    // Handle single value (backward compatibility)
    return MEMBERSHIP_PREFERENCES_ENUMS.VALID_THIRD_PARTIES.includes(
      thirdParties as ThirdParties,
    );
  }

  defaultMessage(): string {
    return 'Third parties must be an array of valid options with no duplicates';
  }
}

/**
 * Validator for Practice Promotion Choice
 * Validates against PracticePromotion enum - Multi-select
 */
@ValidatorConstraint({ name: 'practicePromotion', async: false })
export class PracticePromotionValidator
  implements ValidatorConstraintInterface
{
  validate(practicePromotion: number | number[]): boolean {
    if (practicePromotion === null || practicePromotion === undefined)
      return true; // Optional field

    // Handle array (multi-select)
    if (Array.isArray(practicePromotion)) {
      if (practicePromotion.length === 0) return true; // Empty array is valid

      // Check for duplicates
      const uniqueValues = new Set(practicePromotion);
      if (uniqueValues.size !== practicePromotion.length) return false;

      // Validate each value
      return practicePromotion.every((value) =>
        MEMBERSHIP_PREFERENCES_ENUMS.VALID_PRACTICE_PROMOTIONS.includes(
          value as PracticePromotion,
        ),
      );
    }

    // Handle single value (backward compatibility)
    return MEMBERSHIP_PREFERENCES_ENUMS.VALID_PRACTICE_PROMOTIONS.includes(
      practicePromotion as PracticePromotion,
    );
  }

  defaultMessage(): string {
    return 'Practice promotion must be an array of valid options with no duplicates';
  }
}

/**
 * Validator for Search Tools Choice
 * Validates against SearchTools enum - Multi-select
 */
@ValidatorConstraint({ name: 'searchTools', async: false })
export class SearchToolsValidator implements ValidatorConstraintInterface {
  validate(searchTools: number | number[]): boolean {
    if (searchTools === null || searchTools === undefined) return true; // Optional field

    // Handle array (multi-select)
    if (Array.isArray(searchTools)) {
      if (searchTools.length === 0) return true; // Empty array is valid

      // Check for duplicates
      const uniqueValues = new Set(searchTools);
      if (uniqueValues.size !== searchTools.length) return false;

      // Validate each value
      return searchTools.every((value) =>
        MEMBERSHIP_PREFERENCES_ENUMS.VALID_SEARCH_TOOLS.includes(
          value as SearchTools,
        ),
      );
    }

    // Handle single value (backward compatibility)
    return MEMBERSHIP_PREFERENCES_ENUMS.VALID_SEARCH_TOOLS.includes(
      searchTools as SearchTools,
    );
  }

  defaultMessage(): string {
    return 'Search tools must be an array of valid options with no duplicates';
  }
}

/**
 * Validator for Psychotherapy Supervision Choice
 * Validates against PsychotherapySupervision enum - Multi-select
 */
@ValidatorConstraint({ name: 'psychotherapySupervision', async: false })
export class PsychotherapySupervisionValidator
  implements ValidatorConstraintInterface
{
  validate(psychotherapySupervision: number | number[]): boolean {
    if (
      psychotherapySupervision === null ||
      psychotherapySupervision === undefined
    )
      return true; // Optional field

    // Handle array (multi-select)
    if (Array.isArray(psychotherapySupervision)) {
      if (psychotherapySupervision.length === 0) return true; // Empty array is valid

      // Check for duplicates
      const uniqueValues = new Set(psychotherapySupervision);
      if (uniqueValues.size !== psychotherapySupervision.length) return false;

      // Validate each value
      return psychotherapySupervision.every((value) =>
        MEMBERSHIP_PREFERENCES_ENUMS.VALID_PSYCHOTHERAPY_SUPERVISIONS.includes(
          value as PsychotherapySupervision,
        ),
      );
    }

    // Handle single value (backward compatibility)
    return MEMBERSHIP_PREFERENCES_ENUMS.VALID_PSYCHOTHERAPY_SUPERVISIONS.includes(
      psychotherapySupervision as PsychotherapySupervision,
    );
  }

  defaultMessage(): string {
    return 'Psychotherapy supervision must be an array of valid options with no duplicates';
  }
}

/**
 * Validator for Shadowing (Boolean)
 * Validates boolean field (Yes/No in CSV)
 */
@ValidatorConstraint({ name: 'shadowing', async: false })
export class ShadowingValidator implements ValidatorConstraintInterface {
  validate(shadowing: boolean): boolean {
    if (shadowing === null || shadowing === undefined) return true; // Optional field

    // Must be a boolean
    return typeof shadowing === 'boolean';
  }

  defaultMessage(): string {
    return 'Shadowing must be a boolean value (true or false)';
  }
}

/**
 * Validator for Auto Renewal (Boolean)
 * Validates boolean field (Yes/No in CSV) - Business required
 */
@ValidatorConstraint({ name: 'autoRenewal', async: false })
export class AutoRenewalValidator implements ValidatorConstraintInterface {
  validate(autoRenewal: boolean): boolean {
    if (autoRenewal === null || autoRenewal === undefined) return false; // Required field

    // Must be a boolean
    return typeof autoRenewal === 'boolean';
  }

  defaultMessage(): string {
    return 'Auto renewal must be a boolean value (true or false) and is required';
  }
}

/**
 * Validator for Privilege
 * Validates against Privilege enum (Owner, etc.)
 */
@ValidatorConstraint({ name: 'privilegePreference', async: false })
export class PrivilegePreferenceValidator
  implements ValidatorConstraintInterface
{
  validate(privilege: number): boolean {
    if (privilege === null || privilege === undefined) return true; // Optional field

    // Check if it's a valid enum value
    return MEMBERSHIP_PREFERENCES_ENUMS.VALID_PRIVILEGES.includes(
      privilege as Privilege,
    );
  }

  defaultMessage(): string {
    return 'Privilege must be a valid privilege level from the available options';
  }
}

/**
 * Validator for Access Modifiers
 * Validates against AccessModifier enum (Private, etc.)
 */
@ValidatorConstraint({ name: 'accessModifiersPreference', async: false })
export class AccessModifiersPreferenceValidator
  implements ValidatorConstraintInterface
{
  validate(accessModifier: number): boolean {
    if (accessModifier === null || accessModifier === undefined) return true; // Optional field

    // Check if it's a valid enum value
    return MEMBERSHIP_PREFERENCES_ENUMS.VALID_ACCESS_MODIFIERS.includes(
      accessModifier as AccessModifier,
    );
  }

  defaultMessage(): string {
    return 'Access modifiers must be a valid access modifier from the available options';
  }
}

/**
 * Validator for User-Year Uniqueness (Business Rule)
 * This would typically be used in service layer for create/update operations
 */
@ValidatorConstraint({ name: 'userYearUnique', async: true })
export class UserYearUniqueValidator implements ValidatorConstraintInterface {
  validate(): Promise<boolean> {
    // This validator would need repository access to check uniqueness
    // Implementation would be completed when repository layer is available
    // For now, return true (actual validation will be in service layer)
    return Promise.resolve(true);
  }

  defaultMessage(): string {
    return 'A membership preference already exists for this user and year combination';
  }
}
