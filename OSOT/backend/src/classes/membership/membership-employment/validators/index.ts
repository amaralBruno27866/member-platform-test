/**
 * Membership Employment Validators Index
 * Barrel file for all custom validators
 */

// Employment ID validation
export { EmploymentIdValidator } from './membership-employment.validators';

// Membership Year validation
export {
  MembershipYearEmploymentValidator,
  MembershipYearImmutableValidator,
} from './membership-employment.validators';

// User Reference validation (Account vs Affiliate)
export {
  ExclusiveUserReferenceEmploymentValidator,
  UserLookupRequiredValidator,
} from './membership-employment.validators';

// Conditional "Other" field validators
export {
  RoleDescriptorOtherValidator,
  PositionFundingOtherValidator,
  EmploymentBenefitsOtherValidator,
} from './membership-employment.validators';

// Multi-select field validators
export {
  WorkHoursValidator,
  PositionFundingValidator,
  EmploymentBenefitsValidator,
} from './membership-employment.validators';

// Single choice field validators
export {
  EmploymentStatusValidator,
  RoleDescriptorValidator,
  PracticeYearsValidator,
  HourlyEarningsValidator,
} from './membership-employment.validators';

// System field validators
export {
  PrivilegeEmploymentValidator,
  AccessModifiersEmploymentValidator,
} from './membership-employment.validators';

// Business rule validators
export { UserYearUniqueEmploymentValidator } from './membership-employment.validators';
