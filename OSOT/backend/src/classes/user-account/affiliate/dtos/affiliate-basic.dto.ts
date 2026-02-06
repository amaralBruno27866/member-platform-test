/**
 * Affiliate Basic DTO
 * Integrated with essential modules: errors, utils, enums, constants, validators
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (AffiliateArea, AccountStatus, Province, Country, etc.)
 * - utils: Leverages phone-formatter and URL sanitizer for data transformation
 * - constants: References AFFILIATE_FIELD_LIMITS for validation consistency
 * - validators: Uses affiliate validators for comprehensive business rule compliance
 *
 * DATAVERSE INTEGRATION:
 * - Field names align with Table Account Affiliate.csv schema (osot_ prefix)
 * - Validation rules match Dataverse field constraints
 * - Enum values synchronized with Dataverse global choices
 * - Business required fields properly marked per CSV specification
 * - Social media URLs properly validated with platform-specific rules
 *
 * This DTO represents the comprehensive affiliate information structure
 * aligned with Table Account Affiliate.csv business requirements and
 * designed for seamless Dataverse integration via DataverseService.
 *
 * Coverage: Organization profile, representative identity, contact information,
 * address details, social media presence, and account management fields.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsUrl,
  MaxLength,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Essential modules integration
import { formatPhoneNumber } from '../../../../utils/phone-formatter.utils';
import { AFFILIATE_FIELD_LIMITS } from '../constants/affiliate.constants';
import {
  AffiliateArea,
  AccountStatus,
  Province,
  Country,
  City,
} from '../../../../common/enums';

// Affiliate validators integration
import {
  AffiliateNameValidator,
  AffiliateAreaValidator,
  RepresentativeFirstNameValidator,
  RepresentativeLastNameValidator,
  RepresentativeJobTitleValidator,
  AffiliateEmailValidator,
  AffiliatePhoneValidator,
  AffiliateWebsiteValidator,
  AffiliateAddress1Validator,
  AffiliateAddress2Validator,
  AffiliateProvinceValidator,
  AffiliateCountryValidator,
  AffiliatePostalCodeValidator,
  AffiliateOtherCityValidator,
  AffiliateOtherProvinceStateValidator,
  FacebookUrlValidator,
  InstagramUrlValidator,
  TiktokUrlValidator,
  LinkedinUrlValidator,
  AccountDeclarationValidator,
} from '../validators/affiliate.validators';

export class AffiliateBasicDto {
  // ========================================
  // SYSTEM GENERATED FIELDS
  // ========================================

  @ApiProperty({
    example: 'affi-0000001',
    description: 'Auto-generated affiliate identifier with string prefix',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  readonly osot_affiliate_id?: string;

  @ApiProperty({
    example: 'b3e1c1a2-1234-4f56-8a9b-abcdef123456',
    description: 'Unique identifier for affiliate entity instances',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  readonly osot_table_account_affiliateid?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Date and time when the affiliate record was created',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsDateString()
  readonly createdon?: string;

  @ApiProperty({
    example: '2024-01-20T14:45:00Z',
    description: 'Date and time when the affiliate record was last modified',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsDateString()
  readonly modifiedon?: string;

  // ========================================
  // ORGANIZATION PROFILE (Business Required)
  // ========================================

  @ApiProperty({
    example: 'Tech Solutions Inc.',
    description: 'Official organization/business name (business required)',
    maxLength: AFFILIATE_FIELD_LIMITS.NAME,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(AFFILIATE_FIELD_LIMITS.NAME)
  @Validate(AffiliateNameValidator)
  osot_affiliate_name: string;

  @ApiProperty({
    example: 1,
    description: 'Business area/industry classification (business required)',
    enum: AffiliateArea,
    enumName: 'AffiliateArea',
  })
  @IsEnum(AffiliateArea)
  @IsNotEmpty()
  @Validate(AffiliateAreaValidator)
  osot_affiliate_area: AffiliateArea;

  // ========================================
  // REPRESENTATIVE IDENTITY (Business Required)
  // ========================================

  @ApiProperty({
    example: 'John',
    description: 'Representative contact person first name (business required)',
    maxLength: AFFILIATE_FIELD_LIMITS.FIRST_NAME,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(AFFILIATE_FIELD_LIMITS.FIRST_NAME)
  @Validate(RepresentativeFirstNameValidator)
  osot_representative_first_name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Representative contact person last name (business required)',
    maxLength: AFFILIATE_FIELD_LIMITS.LAST_NAME,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(AFFILIATE_FIELD_LIMITS.LAST_NAME)
  @Validate(RepresentativeLastNameValidator)
  osot_representative_last_name: string;

  @ApiProperty({
    example: 'Chief Executive Officer',
    description: 'Representative job title/position (business required)',
    maxLength: AFFILIATE_FIELD_LIMITS.JOB_TITLE,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(AFFILIATE_FIELD_LIMITS.JOB_TITLE)
  @Validate(RepresentativeJobTitleValidator)
  osot_representative_job_title: string;

  // ========================================
  // CONTACT INFORMATION (Business Required)
  // ========================================

  @ApiProperty({
    example: 'contact@techsolutions.com',
    description: 'Primary business email address (business required)',
    maxLength: AFFILIATE_FIELD_LIMITS.EMAIL,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(AFFILIATE_FIELD_LIMITS.EMAIL)
  @Validate(AffiliateEmailValidator)
  osot_affiliate_email: string;

  @ApiProperty({
    example: '+1-416-555-0123',
    description: 'Primary business phone number (business required)',
    maxLength: AFFILIATE_FIELD_LIMITS.PHONE,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(AFFILIATE_FIELD_LIMITS.PHONE)
  @Validate(AffiliatePhoneValidator)
  @Transform(({ value }) => formatPhoneNumber(value as string))
  osot_affiliate_phone: string;

  // ========================================
  // ADDRESS INFORMATION (Business Required)
  // ========================================

  @ApiProperty({
    example: '123 Business Street Suite 100',
    description: 'Primary business address line (business required)',
    maxLength: AFFILIATE_FIELD_LIMITS.ADDRESS_1,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(AFFILIATE_FIELD_LIMITS.ADDRESS_1)
  @Validate(AffiliateAddress1Validator)
  osot_affiliate_address_1: string;

  @ApiProperty({
    example: 'Unit 5B',
    description: 'Secondary address line (optional)',
    maxLength: AFFILIATE_FIELD_LIMITS.ADDRESS_2,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.ADDRESS_2)
  @Validate(AffiliateAddress2Validator)
  osot_affiliate_address_2?: string;

  @ApiProperty({
    example: 1,
    description: 'City selection from global choices (business required)',
    enum: City,
    enumName: 'City',
  })
  @IsEnum(City)
  @IsNotEmpty()
  osot_affiliate_city: City;

  @ApiProperty({
    example: 'Other City Name',
    description:
      'Custom city name when city not in enum (255 characters max, Optional)',
    maxLength: AFFILIATE_FIELD_LIMITS.OTHER_CITY,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.OTHER_CITY)
  @Validate(AffiliateOtherCityValidator)
  osot_other_city?: string;

  @ApiProperty({
    example: 1,
    description: 'Province selection from global choices (business required)',
    enum: Province,
    enumName: 'Province',
  })
  @IsEnum(Province)
  @IsNotEmpty()
  @Validate(AffiliateProvinceValidator)
  osot_affiliate_province: Province;

  @ApiProperty({
    example: 'Other Province/State Name',
    description:
      'Custom province/state name when province/state not in enum (255 characters max, Optional)',
    maxLength: AFFILIATE_FIELD_LIMITS.OTHER_PROVINCE_STATE,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.OTHER_PROVINCE_STATE)
  @Validate(AffiliateOtherProvinceStateValidator)
  osot_other_province_state?: string;

  @ApiProperty({
    example: 'K1A 0A6',
    description:
      'Postal code with country-specific validation (business required)',
    maxLength: AFFILIATE_FIELD_LIMITS.POSTAL_CODE,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(AFFILIATE_FIELD_LIMITS.POSTAL_CODE)
  @Validate(AffiliatePostalCodeValidator)
  osot_affiliate_postal_code: string;

  @ApiProperty({
    example: 1,
    description: 'Country selection from global choices (business required)',
    enum: Country,
    enumName: 'Country',
  })
  @IsEnum(Country)
  @IsNotEmpty()
  @Validate(AffiliateCountryValidator)
  osot_affiliate_country: Country;

  // ========================================
  // SOCIAL MEDIA & WEB PRESENCE (Optional)
  // ========================================

  @ApiProperty({
    example: 'https://www.techsolutions.com',
    description: 'Official business website URL (optional)',
    maxLength: AFFILIATE_FIELD_LIMITS.WEBSITE,
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(AFFILIATE_FIELD_LIMITS.WEBSITE)
  @Validate(AffiliateWebsiteValidator)
  osot_affiliate_website?: string;

  @ApiProperty({
    example: 'https://facebook.com/techsolutions',
    description: 'Facebook business page URL (optional)',
    maxLength: AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL,
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL)
  @Validate(FacebookUrlValidator)
  osot_affiliate_facebook?: string;

  @ApiProperty({
    example: 'https://instagram.com/techsolutions',
    description: 'Instagram business profile URL (optional)',
    maxLength: AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL,
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL)
  @Validate(InstagramUrlValidator)
  osot_affiliate_instagram?: string;

  @ApiProperty({
    example: 'https://tiktok.com/@techsolutions',
    description: 'TikTok business profile URL (optional)',
    maxLength: AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL,
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL)
  @Validate(TiktokUrlValidator)
  osot_affiliate_tiktok?: string;

  @ApiProperty({
    example: 'https://linkedin.com/company/techsolutions',
    description: 'LinkedIn company page URL (optional)',
    maxLength: AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL,
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL)
  @Validate(LinkedinUrlValidator)
  osot_affiliate_linkedin?: string;

  // ========================================
  // ACCOUNT MANAGEMENT (Optional/System)
  // ========================================

  @ApiProperty({
    example: true,
    description:
      'Account declaration acceptance status (business required for registration)',
    default: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  @Validate(AccountDeclarationValidator)
  osot_account_declaration: boolean;

  @ApiProperty({
    example: AccountStatus.ACTIVE,
    description: 'Current account status (system-managed, read-only)',
    enum: AccountStatus,
    enumName: 'AccountStatus',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsEnum(AccountStatus)
  osot_account_status?: AccountStatus;

  // ========================================
  // SYSTEM FIELDS (Optional/Read-Only)
  // ========================================

  @ApiProperty({
    example: 'system-user-guid',
    description: 'System owner identifier (system required)',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  readonly ownerid?: string;
}
