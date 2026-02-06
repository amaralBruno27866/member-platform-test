/**
 * Audience Target Validators Index
 * Barrel file for all custom validators
 */

// System field validators
export { TargetIdValidator } from './audience-target.validators';
export { ProductLookupValidator } from './audience-target.validators';
export { PrivilegeAudienceTargetValidator } from './audience-target.validators';
export { AccessModifiersAudienceTargetValidator } from './audience-target.validators';

// Account group validator (1 field)
export { AccountGroupValidator } from './audience-target.validators';

// Affiliate validators (3 fields)
export { AffiliateAreaValidator } from './audience-target.validators';
export { AffiliateCityTargetValidator } from './audience-target.validators';
export { AffiliateProvinceTargetValidator } from './audience-target.validators';

// Address validators (2 fields)
export { MembershipCityTargetValidator } from './audience-target.validators';
export { ProvinceTargetValidator } from './audience-target.validators';

// Identity validators (4 fields)
export { GenderTargetValidator } from './audience-target.validators';
export { IndigenousDetailsTargetValidator } from './audience-target.validators';
export { LanguageTargetValidator } from './audience-target.validators';
export { RaceTargetValidator } from './audience-target.validators';

// Membership category validators (2 fields)
export { EligibilityAffiliateTargetValidator } from './audience-target.validators';
export { MembershipCategoryTargetValidator } from './audience-target.validators';

// Employment validators (9 fields)
export { EarningsTargetValidator } from './audience-target.validators';
export { EarningsSelfDirectTargetValidator } from './audience-target.validators';
export { EarningsSelfIndirectTargetValidator } from './audience-target.validators';
export { EmploymentBenefitsTargetValidator } from './audience-target.validators';
export { EmploymentStatusTargetValidator } from './audience-target.validators';
export { PositionFundingTargetValidator } from './audience-target.validators';
export { PracticeYearsTargetValidator } from './audience-target.validators';
export { RoleDescriptionTargetValidator } from './audience-target.validators';
export { WorkHoursTargetValidator } from './audience-target.validators';

// Practice validators (4 fields)
export { ClientAgeTargetValidator } from './audience-target.validators';
export { PracticeAreaTargetValidator } from './audience-target.validators';
export { PracticeServicesTargetValidator } from './audience-target.validators';
export { PracticeSettingsTargetValidator } from './audience-target.validators';

// Preference validators (4 fields)
export { MembershipSearchToolsTargetValidator } from './audience-target.validators';
export { PracticePromotionTargetValidator } from './audience-target.validators';
export { PsychotherapySupervisionTargetValidator } from './audience-target.validators';
export { ThirdPartiesTargetValidator } from './audience-target.validators';

// Education OT validators (3 fields)
export { COTOStatusTargetValidator } from './audience-target.validators';
export { OTGradYearTargetValidator } from './audience-target.validators';
export { OTUniversityTargetValidator } from './audience-target.validators';

// Education OTA validators (2 fields)
export { OTAGradYearTargetValidator } from './audience-target.validators';
export { OTACollegeTargetValidator } from './audience-target.validators';
