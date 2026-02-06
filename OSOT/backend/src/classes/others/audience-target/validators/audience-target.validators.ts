/**
 * Audience Target Validators
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - class-validator: Uses ValidatorConstraint for custom validation logic
 * - constants: Uses AUDIENCE_TARGET fields, limits, and patterns
 * - enums: Validates against 15 common enums and 15 membership-specific enums
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Essential validation only for product audience targeting
 * - Multiple choice field validation (35 fields, 0-50 selections each)
 * - Enum validation for all Choice fields
 * - Business rule validation (product relationship, array constraints)
 * - Target ID format validation (osot-tgt-0000001)
 */

import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  AUDIENCE_TARGET_AUTONUMBER,
  AUDIENCE_TARGET_LIMITS,
} from '../constants/audience-target.constants';

// Common enums (15)
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';
import { AccountGroup } from '../../../../common/enums/account-group.enum';
import { AffiliateArea } from '../../../../common/enums/affiliate-area.enum';
import { AffiliateEligibility } from '../../../../common/enums/affiliate-eligibility-enum';
import { Category } from '../../../../common/enums/categories-enum';
import { City } from '../../../../common/enums/cities.enum';
import { CotoStatus } from '../../../../common/enums/coto-status.enum';
import { Gender } from '../../../../common/enums/gender-choice.enum';
import { GraduationYear } from '../../../../common/enums/graduation-year.enum';
import { IndigenousDetail } from '../../../../common/enums/indigenous-detail.enum';
import { Language } from '../../../../common/enums/language-choice.enum';
import { OtaCollege } from '../../../../common/enums/ota-college.enum';
import { OtUniversity } from '../../../../common/enums/ot-university.enum';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { Province } from '../../../../common/enums/provinces.enum';
import { Race } from '../../../../common/enums/race-choice.enum';

// Membership-specific enums (15)
import { Benefits } from '../../../membership/membership-employment/enums/benefits.enum';
import { ClientsAge } from '../../../membership/membership-practices/enums/clients-age.enum';
import { EmploymentStatus } from '../../../membership/membership-employment/enums/employment-status.enum';
import { Funding } from '../../../membership/membership-employment/enums/funding.enum';
import { HourlyEarnings } from '../../../membership/membership-employment/enums/hourly-earnings.enum';
import { PracticeArea } from '../../../membership/membership-practices/enums/practice-area.enum';
import { PracticePromotion } from '../../../membership/membership-preferences/enums/practice-promotion.enum';
import { PracticeServices } from '../../../membership/membership-practices/enums/practice-services.enum';
import { PracticeSettings } from '../../../membership/membership-practices/enums/practice-settings.enum';
import { PracticeYears } from '../../../membership/membership-employment/enums/practice-years.enum';
import { PsychotherapySupervision } from '../../../membership/membership-preferences/enums/psychotherapy-supervision.enum';
import { RoleDescription } from '../../../membership/membership-employment/enums/role-descriptor.enum';
import { SearchTools } from '../../../membership/membership-preferences/enums/search-tools.enum';
import { ThirdParties } from '../../../membership/membership-preferences/enums/third-parties.enum';
import { WorkHours } from '../../../membership/membership-employment/enums/work-hours.enum';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all valid values from an enum
 */
function getEnumValues<T extends Record<string, number | string>>(
  enumObj: T,
): number[] {
  return Object.values(enumObj).filter(
    (v) => typeof v === 'number',
  ) as number[];
}

/**
 * Validate multiple choice array field
 * - Must be array
 * - Length: 0-50
 * - No duplicates
 * - All values must be valid enum values
 */
function validateMultipleChoiceArray(
  value: any,
  validValues: number[],
): boolean {
  // Must be array
  if (!Array.isArray(value)) return false;

  // Length validation (0-50)
  if (
    value.length < AUDIENCE_TARGET_LIMITS.MIN_SELECTIONS_PER_FIELD ||
    value.length > AUDIENCE_TARGET_LIMITS.MAX_SELECTIONS_PER_FIELD
  ) {
    return false;
  }

  // If empty array, it's valid (all fields are optional)
  if (value.length === 0) return true;

  // Check for duplicates
  const uniqueValues = new Set(value);
  if (uniqueValues.size !== value.length) return false;

  // Validate each value against enum
  return value.every((v) => validValues.includes(Number(v)));
}

// =============================================================================
// SYSTEM FIELD VALIDATORS
// =============================================================================

/**
 * Validator for Target ID (Business ID)
 * Validates osot-tgt-0000001 format based on Autonumber specification
 *
 * NOTE: This field is auto-generated by Dataverse for normal operations.
 * This validator is primarily used for:
 * - Data migration from legacy systems
 * - Data integrity validation during bulk imports
 * - Testing scenarios with pre-defined IDs
 */
@ValidatorConstraint({ name: 'targetId', async: false })
export class TargetIdValidator implements ValidatorConstraintInterface {
  validate(targetId: string): boolean {
    if (!targetId) return true; // Optional for creation, required for updates

    // Validate format: osot-tgt-0000001 (7 digits)
    return AUDIENCE_TARGET_AUTONUMBER.PATTERN.test(targetId);
  }

  defaultMessage(): string {
    return 'Target ID must follow format: osot-tgt-0000001 (osot-tgt followed by 7 digits)';
  }
}

/**
 * Validator for Product Lookup (OData bind format)
 * Required field - every target must be associated with a product
 * Validates GUID format in OData binding: /osot_table_products(guid)
 */
@ValidatorConstraint({ name: 'productLookup', async: false })
export class ProductLookupValidator implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value || typeof value !== 'string') return false;

    // Must start with /osot_table_products(
    if (!value.startsWith('/osot_table_products(')) return false;

    // Must end with )
    if (!value.endsWith(')')) return false;

    // Extract GUID
    const guid = value.slice(21, -1); // Remove prefix and suffix

    // Validate GUID format (8-4-4-4-12)
    const guidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return guidPattern.test(guid);
  }

  defaultMessage(): string {
    return 'Product lookup must be a valid OData bind format: /osot_table_products(guid)';
  }
}

/**
 * Validator for Privilege
 * Validates against Privilege enum (Owner, Admin, Main)
 */
@ValidatorConstraint({ name: 'privilegeAudienceTarget', async: false })
export class PrivilegeAudienceTargetValidator
  implements ValidatorConstraintInterface
{
  validate(privilege: number): boolean {
    if (privilege === null || privilege === undefined) return true; // Optional field

    const validPrivileges = getEnumValues(Privilege);
    return validPrivileges.includes(privilege);
  }

  defaultMessage(): string {
    return 'Privilege must be a valid privilege level from the available options';
  }
}

/**
 * Validator for Access Modifiers
 * Validates against AccessModifier enum (Private, Public, etc.)
 */
@ValidatorConstraint({ name: 'accessModifiersAudienceTarget', async: false })
export class AccessModifiersAudienceTargetValidator
  implements ValidatorConstraintInterface
{
  validate(accessModifier: number): boolean {
    if (accessModifier === null || accessModifier === undefined) return true; // Optional field

    const validAccessModifiers = getEnumValues(AccessModifier);
    return validAccessModifiers.includes(accessModifier);
  }

  defaultMessage(): string {
    return 'Access modifiers must be a valid access modifier from the available options';
  }
}

// =============================================================================
// ACCOUNT GROUP VALIDATOR (1 field)
// =============================================================================

@ValidatorConstraint({ name: 'accountGroup', async: false })
export class AccountGroupValidator implements ValidatorConstraintInterface {
  validate(accountGroup: number[]): boolean {
    return validateMultipleChoiceArray(
      accountGroup,
      getEnumValues(AccountGroup),
    );
  }

  defaultMessage(): string {
    return 'Account group must be a valid array (0-50 selections, no duplicates)';
  }
}

// =============================================================================
// AFFILIATE VALIDATORS (3 fields)
// =============================================================================

@ValidatorConstraint({ name: 'affiliateArea', async: false })
export class AffiliateAreaValidator implements ValidatorConstraintInterface {
  validate(affiliateArea: number[]): boolean {
    return validateMultipleChoiceArray(
      affiliateArea,
      getEnumValues(AffiliateArea),
    );
  }

  defaultMessage(): string {
    return 'Affiliate area must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'affiliateCityTarget', async: false })
export class AffiliateCityTargetValidator
  implements ValidatorConstraintInterface
{
  validate(affiliateCity: number[]): boolean {
    return validateMultipleChoiceArray(affiliateCity, getEnumValues(City));
  }

  defaultMessage(): string {
    return 'Affiliate city must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'affiliateProvinceTarget', async: false })
export class AffiliateProvinceTargetValidator
  implements ValidatorConstraintInterface
{
  validate(affiliateProvince: number[]): boolean {
    return validateMultipleChoiceArray(
      affiliateProvince,
      getEnumValues(Province),
    );
  }

  defaultMessage(): string {
    return 'Affiliate province must be a valid array (0-50 selections, no duplicates)';
  }
}

// =============================================================================
// ADDRESS VALIDATORS (2 fields)
// =============================================================================

@ValidatorConstraint({ name: 'membershipCityTarget', async: false })
export class MembershipCityTargetValidator
  implements ValidatorConstraintInterface
{
  validate(membershipCity: number[]): boolean {
    return validateMultipleChoiceArray(membershipCity, getEnumValues(City));
  }

  defaultMessage(): string {
    return 'Membership city must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'provinceTarget', async: false })
export class ProvinceTargetValidator implements ValidatorConstraintInterface {
  validate(province: number[]): boolean {
    return validateMultipleChoiceArray(province, getEnumValues(Province));
  }

  defaultMessage(): string {
    return 'Province must be a valid array (0-50 selections, no duplicates)';
  }
}

// =============================================================================
// IDENTITY VALIDATORS (4 fields)
// =============================================================================

@ValidatorConstraint({ name: 'genderTarget', async: false })
export class GenderTargetValidator implements ValidatorConstraintInterface {
  validate(gender: number[]): boolean {
    return validateMultipleChoiceArray(gender, getEnumValues(Gender));
  }

  defaultMessage(): string {
    return 'Gender must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'indigenousDetailsTarget', async: false })
export class IndigenousDetailsTargetValidator
  implements ValidatorConstraintInterface
{
  validate(indigenousDetails: number[]): boolean {
    return validateMultipleChoiceArray(
      indigenousDetails,
      getEnumValues(IndigenousDetail),
    );
  }

  defaultMessage(): string {
    return 'Indigenous details must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'languageTarget', async: false })
export class LanguageTargetValidator implements ValidatorConstraintInterface {
  validate(language: number[]): boolean {
    return validateMultipleChoiceArray(language, getEnumValues(Language));
  }

  defaultMessage(): string {
    return 'Language must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'raceTarget', async: false })
export class RaceTargetValidator implements ValidatorConstraintInterface {
  validate(race: number[]): boolean {
    return validateMultipleChoiceArray(race, getEnumValues(Race));
  }

  defaultMessage(): string {
    return 'Race must be a valid array (0-50 selections, no duplicates)';
  }
}

// =============================================================================
// MEMBERSHIP CATEGORY VALIDATORS (2 fields)
// =============================================================================

@ValidatorConstraint({ name: 'eligibilityAffiliateTarget', async: false })
export class EligibilityAffiliateTargetValidator
  implements ValidatorConstraintInterface
{
  validate(eligibilityAffiliate: number[]): boolean {
    return validateMultipleChoiceArray(
      eligibilityAffiliate,
      getEnumValues(AffiliateEligibility),
    );
  }

  defaultMessage(): string {
    return 'Eligibility affiliate must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'membershipCategoryTarget', async: false })
export class MembershipCategoryTargetValidator
  implements ValidatorConstraintInterface
{
  validate(membershipCategory: number[]): boolean {
    return validateMultipleChoiceArray(
      membershipCategory,
      getEnumValues(Category),
    );
  }

  defaultMessage(): string {
    return 'Membership category must be a valid array (0-50 selections, no duplicates)';
  }
}

// =============================================================================
// EMPLOYMENT VALIDATORS (9 fields)
// =============================================================================

@ValidatorConstraint({ name: 'earningsTarget', async: false })
export class EarningsTargetValidator implements ValidatorConstraintInterface {
  validate(earnings: number[]): boolean {
    return validateMultipleChoiceArray(earnings, getEnumValues(HourlyEarnings));
  }

  defaultMessage(): string {
    return 'Earnings must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'earningsSelfDirectTarget', async: false })
export class EarningsSelfDirectTargetValidator
  implements ValidatorConstraintInterface
{
  validate(earningsSelfDirect: number[]): boolean {
    return validateMultipleChoiceArray(
      earningsSelfDirect,
      getEnumValues(HourlyEarnings),
    );
  }

  defaultMessage(): string {
    return 'Earnings self-direct must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'earningsSelfIndirectTarget', async: false })
export class EarningsSelfIndirectTargetValidator
  implements ValidatorConstraintInterface
{
  validate(earningsSelfIndirect: number[]): boolean {
    return validateMultipleChoiceArray(
      earningsSelfIndirect,
      getEnumValues(HourlyEarnings),
    );
  }

  defaultMessage(): string {
    return 'Earnings self-indirect must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'employmentBenefitsTarget', async: false })
export class EmploymentBenefitsTargetValidator
  implements ValidatorConstraintInterface
{
  validate(employmentBenefits: number[]): boolean {
    return validateMultipleChoiceArray(
      employmentBenefits,
      getEnumValues(Benefits),
    );
  }

  defaultMessage(): string {
    return 'Employment benefits must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'employmentStatusTarget', async: false })
export class EmploymentStatusTargetValidator
  implements ValidatorConstraintInterface
{
  validate(employmentStatus: number[]): boolean {
    return validateMultipleChoiceArray(
      employmentStatus,
      getEnumValues(EmploymentStatus),
    );
  }

  defaultMessage(): string {
    return 'Employment status must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'positionFundingTarget', async: false })
export class PositionFundingTargetValidator
  implements ValidatorConstraintInterface
{
  validate(positionFunding: number[]): boolean {
    return validateMultipleChoiceArray(positionFunding, getEnumValues(Funding));
  }

  defaultMessage(): string {
    return 'Position funding must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'practiceYearsTarget', async: false })
export class PracticeYearsTargetValidator
  implements ValidatorConstraintInterface
{
  validate(practiceYears: number[]): boolean {
    return validateMultipleChoiceArray(
      practiceYears,
      getEnumValues(PracticeYears),
    );
  }

  defaultMessage(): string {
    return 'Practice years must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'roleDescriptionTarget', async: false })
export class RoleDescriptionTargetValidator
  implements ValidatorConstraintInterface
{
  validate(roleDescription: number[]): boolean {
    return validateMultipleChoiceArray(
      roleDescription,
      getEnumValues(RoleDescription),
    );
  }

  defaultMessage(): string {
    return 'Role description must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'workHoursTarget', async: false })
export class WorkHoursTargetValidator implements ValidatorConstraintInterface {
  validate(workHours: number[]): boolean {
    return validateMultipleChoiceArray(workHours, getEnumValues(WorkHours));
  }

  defaultMessage(): string {
    return 'Work hours must be a valid array (0-50 selections, no duplicates)';
  }
}

// =============================================================================
// PRACTICE VALIDATORS (4 fields)
// =============================================================================

@ValidatorConstraint({ name: 'clientAgeTarget', async: false })
export class ClientAgeTargetValidator implements ValidatorConstraintInterface {
  validate(clientAge: number[]): boolean {
    return validateMultipleChoiceArray(clientAge, getEnumValues(ClientsAge));
  }

  defaultMessage(): string {
    return 'Client age must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'practiceAreaTarget', async: false })
export class PracticeAreaTargetValidator
  implements ValidatorConstraintInterface
{
  validate(practiceArea: number[]): boolean {
    return validateMultipleChoiceArray(
      practiceArea,
      getEnumValues(PracticeArea),
    );
  }

  defaultMessage(): string {
    return 'Practice area must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'practiceServicesTarget', async: false })
export class PracticeServicesTargetValidator
  implements ValidatorConstraintInterface
{
  validate(practiceServices: number[]): boolean {
    return validateMultipleChoiceArray(
      practiceServices,
      getEnumValues(PracticeServices),
    );
  }

  defaultMessage(): string {
    return 'Practice services must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'practiceSettingsTarget', async: false })
export class PracticeSettingsTargetValidator
  implements ValidatorConstraintInterface
{
  validate(practiceSettings: number[]): boolean {
    return validateMultipleChoiceArray(
      practiceSettings,
      getEnumValues(PracticeSettings),
    );
  }

  defaultMessage(): string {
    return 'Practice settings must be a valid array (0-50 selections, no duplicates)';
  }
}

// =============================================================================
// PREFERENCE VALIDATORS (4 fields)
// =============================================================================

@ValidatorConstraint({ name: 'membershipSearchToolsTarget', async: false })
export class MembershipSearchToolsTargetValidator
  implements ValidatorConstraintInterface
{
  validate(membershipSearchTools: number[]): boolean {
    return validateMultipleChoiceArray(
      membershipSearchTools,
      getEnumValues(SearchTools),
    );
  }

  defaultMessage(): string {
    return 'Membership search tools must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'practicePromotionTarget', async: false })
export class PracticePromotionTargetValidator
  implements ValidatorConstraintInterface
{
  validate(practicePromotion: number[]): boolean {
    return validateMultipleChoiceArray(
      practicePromotion,
      getEnumValues(PracticePromotion),
    );
  }

  defaultMessage(): string {
    return 'Practice promotion must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'psychotherapySupervisionTarget', async: false })
export class PsychotherapySupervisionTargetValidator
  implements ValidatorConstraintInterface
{
  validate(psychotherapySupervision: number[]): boolean {
    return validateMultipleChoiceArray(
      psychotherapySupervision,
      getEnumValues(PsychotherapySupervision),
    );
  }

  defaultMessage(): string {
    return 'Psychotherapy supervision must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'thirdPartiesTarget', async: false })
export class ThirdPartiesTargetValidator
  implements ValidatorConstraintInterface
{
  validate(thirdParties: number[]): boolean {
    return validateMultipleChoiceArray(
      thirdParties,
      getEnumValues(ThirdParties),
    );
  }

  defaultMessage(): string {
    return 'Third parties must be a valid array (0-50 selections, no duplicates)';
  }
}

// =============================================================================
// EDUCATION OT VALIDATORS (3 fields)
// =============================================================================

@ValidatorConstraint({ name: 'cotoStatusTarget', async: false })
export class COTOStatusTargetValidator implements ValidatorConstraintInterface {
  validate(cotoStatus: number[]): boolean {
    return validateMultipleChoiceArray(cotoStatus, getEnumValues(CotoStatus));
  }

  defaultMessage(): string {
    return 'COTO status must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'otGradYearTarget', async: false })
export class OTGradYearTargetValidator implements ValidatorConstraintInterface {
  validate(otGradYear: number[]): boolean {
    return validateMultipleChoiceArray(
      otGradYear,
      getEnumValues(GraduationYear),
    );
  }

  defaultMessage(): string {
    return 'OT grad year must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'otUniversityTarget', async: false })
export class OTUniversityTargetValidator
  implements ValidatorConstraintInterface
{
  validate(otUniversity: number[]): boolean {
    return validateMultipleChoiceArray(
      otUniversity,
      getEnumValues(OtUniversity),
    );
  }

  defaultMessage(): string {
    return 'OT university must be a valid array (0-50 selections, no duplicates)';
  }
}

// =============================================================================
// EDUCATION OTA VALIDATORS (2 fields)
// =============================================================================

@ValidatorConstraint({ name: 'otaGradYearTarget', async: false })
export class OTAGradYearTargetValidator
  implements ValidatorConstraintInterface
{
  validate(otaGradYear: number[]): boolean {
    return validateMultipleChoiceArray(
      otaGradYear,
      getEnumValues(GraduationYear),
    );
  }

  defaultMessage(): string {
    return 'OTA grad year must be a valid array (0-50 selections, no duplicates)';
  }
}

@ValidatorConstraint({ name: 'otaCollegeTarget', async: false })
export class OTACollegeTargetValidator implements ValidatorConstraintInterface {
  validate(otaCollege: number[]): boolean {
    return validateMultipleChoiceArray(otaCollege, getEnumValues(OtaCollege));
  }

  defaultMessage(): string {
    return 'OTA college must be a valid array (0-50 selections, no duplicates)';
  }
}
