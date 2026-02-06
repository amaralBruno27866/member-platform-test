import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsDateString, Validate } from 'class-validator';
import {
  MembershipEligilibility,
  AffiliateEligibility,
} from '../../../../common/enums';
import { ParentalLeaveExpected } from '../enums/parental-leave-expected.enum';
import {
  EligibilityConsistencyValidator,
  ParentalLeaveDateRangeValidator,
  RetirementDateRequiredValidator,
  IsoDateFormatValidator,
  NoFutureDatesValidator,
} from '../validators/membership-category.validators';

/**
 * Registration DTO for Membership Category
 * Used for initial registration/creation with comprehensive validations
 * Includes all required fields and business rule validations
 */
export class MembershipCategoryRegistrationDto {
  // NOTE: User reference fields (Account/Affiliate) are automatically determined
  // from the authenticated user's JWT token and should not be provided by the user

  // NOTE: osot_membership_year is automatically determined by the backend
  // from active membership settings and should not be provided by the user

  @ApiProperty({
    description:
      'Member eligibility status for accounts - Required if Account is provided',
    enum: MembershipEligilibility,
    example: MembershipEligilibility.QUESTION_1,
    required: false,
  })
  @IsOptional()
  @IsEnum(MembershipEligilibility)
  osot_eligibility?: MembershipEligilibility;

  @ApiProperty({
    description:
      'Affiliate eligibility status for affiliates - Required if Affiliate is provided',
    enum: AffiliateEligibility,
    example: AffiliateEligibility.PRIMARY,
    required: false,
  })
  @IsOptional()
  @IsEnum(AffiliateEligibility)
  osot_eligibility_affiliate?: AffiliateEligibility;

  // NOTE: osot_membership_category is automatically determined by the backend
  // based on User Group + Eligibility logic and should not be provided by the user

  // NOTE: osot_users_group is automatically determined by the backend
  // based on Account Group + Education Category and should not be provided by the user

  @ApiProperty({
    description:
      'Parental leave start date (ISO format) - Optional for registration',
    example: '2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsoDateFormatValidator)
  @Validate(NoFutureDatesValidator)
  osot_parental_leave_from?: string;

  @ApiProperty({
    description:
      'Parental leave end date (ISO format) - Must be after start date if provided',
    example: '2025-12-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsoDateFormatValidator)
  osot_parental_leave_to?: string;

  @ApiProperty({
    description: 'Expected parental leave duration',
    enum: ParentalLeaveExpected,
    example: ParentalLeaveExpected.FULL_YEAR,
    required: false,
  })
  @IsOptional()
  @IsEnum(ParentalLeaveExpected)
  osot_parental_leave_expected?: ParentalLeaveExpected;

  @ApiProperty({
    description:
      'Retirement start date (ISO format) - Required for retirement categories',
    example: '2025-06-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsoDateFormatValidator)
  @Validate(NoFutureDatesValidator)
  osot_retirement_start?: string;

  // NOTE: osot_access_modifiers and osot_privilege are automatically set by Dataverse
  // based on system defaults and should not be provided by the user in registration

  // Critical business rule validations for registration
  // Note: User reference validation is handled by controller via JWT authentication
  @Validate(EligibilityConsistencyValidator, {
    message: 'Eligibility type must match user type (Account vs Affiliate)',
  })
  @Validate(ParentalLeaveDateRangeValidator, {
    message: 'Parental leave end date must be after start date',
  })
  @Validate(RetirementDateRequiredValidator, {
    message: 'Retirement date is required for retirement categories',
  })
  // NOTE: Category validation is handled automatically by backend logic
  private _registrationValidations?: any;
}
