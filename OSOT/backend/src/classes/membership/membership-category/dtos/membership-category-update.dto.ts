import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsDateString,
  IsString,
  Validate,
} from 'class-validator';
import {
  Category,
  MembershipEligilibility,
  AffiliateEligibility,
  AccessModifier,
  Privilege,
  UserGroup,
} from '../../../../common/enums';
import { ParentalLeaveExpected } from '../enums/parental-leave-expected.enum';
import {
  CategoryMembershipYearValidator,
  CategoryMembershipCategoryValidator,
  EligibilityConsistencyValidator,
  ParentalLeaveDateRangeValidator,
  RetirementDateRequiredValidator,
  IsoDateFormatValidator,
  NoFutureDatesValidator,
  CategoryUserTypeConsistencyValidator,
} from '../validators/membership-category.validators';

/**
 * Update DTO for Membership Category
 * Used for updating existing membership categories
 * All fields are optional, includes specific update validations
 * Note: User references (Account/Affiliate) typically cannot be changed after creation
 */
export class MembershipCategoryUpdateDto {
  @ApiProperty({
    description: 'Membership year - Can be updated for renewals',
    type: String,
    example: '2025',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Validate(CategoryMembershipYearValidator)
  osot_membership_year?: string;

  @ApiProperty({
    description: 'Member eligibility status for accounts',
    enum: MembershipEligilibility,
    example: MembershipEligilibility.QUESTION_1,
    required: false,
  })
  @IsOptional()
  @IsEnum(MembershipEligilibility)
  osot_eligibility?: MembershipEligilibility;

  @ApiProperty({
    description: 'Affiliate eligibility status for affiliates',
    enum: AffiliateEligibility,
    example: AffiliateEligibility.PRIMARY,
    required: false,
  })
  @IsOptional()
  @IsEnum(AffiliateEligibility)
  osot_eligibility_affiliate?: AffiliateEligibility;

  @ApiProperty({
    description: 'Membership category classification',
    enum: Category,
    example: Category.OT_PR,
    required: false,
  })
  @IsOptional()
  @IsEnum(Category)
  @Validate(CategoryMembershipCategoryValidator)
  osot_membership_category?: Category;

  @ApiProperty({
    description: 'Users Group classification (internal process)',
    enum: UserGroup,
    example: UserGroup.OT,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserGroup)
  osot_users_group?: UserGroup;

  @ApiProperty({
    description: 'Parental leave start date (ISO format)',
    example: '2025-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsoDateFormatValidator)
  @Validate(NoFutureDatesValidator)
  osot_parental_leave_from?: string;

  @ApiProperty({
    description: 'Parental leave end date (ISO format)',
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
    description: 'Retirement start date (ISO format)',
    example: '2025-06-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Validate(IsoDateFormatValidator)
  @Validate(NoFutureDatesValidator)
  osot_retirement_start?: string;

  @ApiProperty({
    description: 'Access modifier for the membership category',
    enum: AccessModifier,
    example: AccessModifier.PRIVATE,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  osot_access_modifiers?: AccessModifier;

  @ApiProperty({
    description: 'Privilege level for the membership category',
    enum: Privilege,
    example: Privilege.OWNER,
    required: false,
  })
  @IsOptional()
  @IsEnum(Privilege)
  osot_privilege?: Privilege;

  // Update-specific validations (less strict than creation)
  @Validate(EligibilityConsistencyValidator, {
    message: 'Eligibility type must match user type when updating',
  })
  @Validate(ParentalLeaveDateRangeValidator, {
    message: 'Parental leave dates must be valid when updating',
  })
  @Validate(RetirementDateRequiredValidator, {
    message: 'Retirement date required when updating to retirement category',
  })
  @Validate(CategoryUserTypeConsistencyValidator, {
    message: 'Category must match user type when updating',
  })
  private _updateValidations?: any;
}
