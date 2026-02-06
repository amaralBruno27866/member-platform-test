import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsDateString,
  Validate,
  Allow,
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
  MembershipCategoryIdValidator,
  CategoryMembershipYearValidator,
  CategoryMembershipCategoryValidator,
  ExclusiveUserReferenceValidator,
  UserReferenceRequiredValidator,
  GuidFormatValidator,
  EligibilityConsistencyValidator,
  ParentalLeaveDateRangeValidator,
  RetirementDateRequiredValidator,
  IsoDateFormatValidator,
  NoFutureDatesValidator,
  CategoryUserTypeConsistencyValidator,
} from '../validators/membership-category.validators';

/**
 * Basic DTO for Membership Category operations
 * Contains core fields for internal operations and validations
 * Used for basic CRUD operations and internal business logic
 */
export class MembershipCategoryBasicDto {
  @ApiProperty({
    description: 'Business ID for internal control and pagination',
    example: 'osot-cat-0000001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Validate(MembershipCategoryIdValidator)
  osot_category_id?: string;

  @ApiProperty({
    description: 'System unique identifier for the membership category',
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_table_membership_categoryid?: string;

  @ApiProperty({
    description:
      'OData bind for Account. Example: "/osot_table_accounts(<GUID>)"',
    example: '/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  @IsOptional()
  @Allow()
  ['osot_Table_Account@odata.bind']?: string;

  @ApiProperty({
    description:
      'OData bind for Account Affiliate. Example: "/osot_table_account_affiliates(<GUID>)"',
    example:
      '/osot_table_account_affiliates/b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  @IsOptional()
  @Allow()
  ['osot_Table_Account_Affiliate@odata.bind']?: string;

  @ApiProperty({
    description: 'Account ID (GUID) - alternative to OData bind',
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Validate(GuidFormatValidator)
  osot_table_account?: string;

  @ApiProperty({
    description: 'Account Affiliate ID (GUID) - alternative to OData bind',
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Validate(GuidFormatValidator)
  osot_table_account_affiliate?: string;

  @ApiProperty({
    description: 'Membership year (e.g., "2025", "2026")',
    type: String,
    example: '2025',
    required: true,
  })
  @IsString()
  @Validate(CategoryMembershipYearValidator)
  osot_membership_year: string;

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

  // Cross-field validations
  @Validate(ExclusiveUserReferenceValidator)
  @Validate(UserReferenceRequiredValidator)
  @Validate(EligibilityConsistencyValidator)
  @Validate(ParentalLeaveDateRangeValidator)
  @Validate(RetirementDateRequiredValidator)
  @Validate(CategoryUserTypeConsistencyValidator)
  private _crossFieldValidations?: any;
}
