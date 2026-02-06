/**
 * Class: UpdateAffiliateDto
 * Objective: Define and validate the structure for updating an existing affiliate entity.
 * Functionality: Contains only editable fields for PATCH operations. Read-only fields are excluded.
 * Expected Result: Only valid, editable data is accepted for updating an affiliate in the system.
 *
 * EDITABLE FIELDS (18 fields):
 * - osot_affiliate_name
 * - osot_affiliate_area
 * - osot_affiliate_email
 * - osot_affiliate_phone
 * - osot_affiliate_website
 * - osot_representative_first_name
 * - osot_representative_last_name
 * - osot_representative_job_title
 * - osot_affiliate_address_1
 * - osot_affiliate_address_2
 * - osot_affiliate_city
 * - osot_affiliate_province
 * - osot_affiliate_country
 * - osot_affiliate_postal_code
 * - osot_affiliate_facebook
 * - osot_affiliate_instagram
 * - osot_affiliate_tiktok
 * - osot_affiliate_linkedin
 *
 * READ-ONLY FIELDS (excluded from updates):
 * - osot_affiliate_id (business ID - set at creation)
 * - osot_account_declaration (set at registration, immutable)
 * - osot_account_status (system-managed)
 * - osot_password (use dedicated password change endpoint)
 * - System fields (GUIDs, timestamps, ownership, access control)
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsUrl,
  MaxLength,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { formatPhoneNumber } from '../../../../utils/phone-formatter.utils';
import { AFFILIATE_FIELD_LIMITS } from '../constants/affiliate.constants';
import {
  AffiliateArea,
  Province,
  Country,
  City,
} from '../../../../common/enums';
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
  FacebookUrlValidator,
  InstagramUrlValidator,
  TiktokUrlValidator,
  LinkedinUrlValidator,
} from '../validators/affiliate.validators';

export class UpdateAffiliateDto {
  @ApiProperty({
    example: 'Tech Solutions Inc.',
    description: 'Official organization/business name',
    maxLength: AFFILIATE_FIELD_LIMITS.NAME,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.NAME)
  @Validate(AffiliateNameValidator)
  osot_affiliate_name?: string;

  @ApiProperty({
    example: AffiliateArea.HEALTHCARE_AND_LIFE_SCIENCES,
    description: 'Business area/industry classification',
    enum: AffiliateArea,
    required: false,
  })
  @IsOptional()
  @IsEnum(AffiliateArea)
  @Validate(AffiliateAreaValidator)
  osot_affiliate_area?: AffiliateArea;

  @ApiProperty({
    example: 'contact@techsolutions.com',
    description: 'Primary business email address',
    maxLength: AFFILIATE_FIELD_LIMITS.EMAIL,
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(AFFILIATE_FIELD_LIMITS.EMAIL)
  @Validate(AffiliateEmailValidator)
  osot_affiliate_email?: string;

  @ApiProperty({
    example: '+1-416-555-0123',
    description: 'Primary business phone number',
    maxLength: AFFILIATE_FIELD_LIMITS.PHONE,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.PHONE)
  @Validate(AffiliatePhoneValidator)
  @Transform(({ value }) => formatPhoneNumber(value as string))
  osot_affiliate_phone?: string;

  @ApiProperty({
    example: 'https://www.techsolutions.com',
    description: 'Official business website URL',
    maxLength: AFFILIATE_FIELD_LIMITS.WEBSITE,
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(AFFILIATE_FIELD_LIMITS.WEBSITE)
  @Validate(AffiliateWebsiteValidator)
  osot_affiliate_website?: string;

  @ApiProperty({
    example: 'John',
    description: 'Representative contact person first name',
    maxLength: AFFILIATE_FIELD_LIMITS.FIRST_NAME,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.FIRST_NAME)
  @Validate(RepresentativeFirstNameValidator)
  osot_representative_first_name?: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Representative contact person last name',
    maxLength: AFFILIATE_FIELD_LIMITS.LAST_NAME,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.LAST_NAME)
  @Validate(RepresentativeLastNameValidator)
  osot_representative_last_name?: string;

  @ApiProperty({
    example: 'Chief Executive Officer',
    description: 'Representative job title/position',
    maxLength: AFFILIATE_FIELD_LIMITS.JOB_TITLE,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.JOB_TITLE)
  @Validate(RepresentativeJobTitleValidator)
  osot_representative_job_title?: string;

  @ApiProperty({
    example: '123 Business Street Suite 100',
    description: 'Primary business address line',
    maxLength: AFFILIATE_FIELD_LIMITS.ADDRESS_1,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.ADDRESS_1)
  @Validate(AffiliateAddress1Validator)
  osot_affiliate_address_1?: string;

  @ApiProperty({
    example: 'Unit 5B',
    description: 'Secondary address line',
    maxLength: AFFILIATE_FIELD_LIMITS.ADDRESS_2,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.ADDRESS_2)
  @Validate(AffiliateAddress2Validator)
  osot_affiliate_address_2?: string;

  @ApiProperty({
    example: City.TORONTO,
    description: 'City selection',
    enum: City,
    required: false,
  })
  @IsOptional()
  @IsEnum(City)
  osot_affiliate_city?: City;

  @ApiProperty({
    example: Province.ONTARIO,
    description: 'Province selection',
    enum: Province,
    required: false,
  })
  @IsOptional()
  @IsEnum(Province)
  @Validate(AffiliateProvinceValidator)
  osot_affiliate_province?: Province;

  @ApiProperty({
    example: Country.CANADA,
    description: 'Country selection',
    enum: Country,
    required: false,
  })
  @IsOptional()
  @IsEnum(Country)
  @Validate(AffiliateCountryValidator)
  osot_affiliate_country?: Country;

  @ApiProperty({
    example: 'K1A 0A6',
    description: 'Postal code with country-specific validation',
    maxLength: AFFILIATE_FIELD_LIMITS.POSTAL_CODE,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(AFFILIATE_FIELD_LIMITS.POSTAL_CODE)
  @Validate(AffiliatePostalCodeValidator)
  osot_affiliate_postal_code?: string;

  @ApiProperty({
    example: 'https://facebook.com/techsolutions',
    description: 'Facebook business page URL',
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
    description: 'Instagram business profile URL',
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
    description: 'TikTok business profile URL',
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
    description: 'LinkedIn company page URL',
    maxLength: AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL,
    required: false,
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(AFFILIATE_FIELD_LIMITS.SOCIAL_MEDIA_URL)
  @Validate(LinkedinUrlValidator)
  osot_affiliate_linkedin?: string;
}
