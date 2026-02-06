/**
 * Address Basic DTO
 * Integrated with essential modules: errors, utils, enums, constants, validators
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (City, Province, Country, AddressType, AddressPreference)
 * - constants: References ADDRESS_FIELD_LIMITS for validation consistency
 * - validators: Uses address validators for comprehensive business rule compliance
 *
 * DATAVERSE INTEGRATION:
 * - Field names align with Table Address.csv schema (osot_ prefix)
 * - Validation rules match Dataverse field constraints
 * - Enum values synchronized with Dataverse global choices
 * - Business required fields properly marked per CSV specification
 * - Address types and preferences properly validated
 *
 * This DTO represents the comprehensive address information structure
 * aligned with Table Address.csv business requirements and
 * designed for seamless Dataverse integration via DataverseService.
 *
 * Coverage: Essential address fields, geographic information, address types,
 * and access control settings.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  MaxLength,
  Validate,
  IsUUID,
  Allow,
} from 'class-validator';

// Essential modules integration
import {
  City,
  Province,
  Country,
  AddressType,
  AddressPreference,
} from '../../../../common/enums';
import { ADDRESS_FIELD_LIMITS } from '../constants/address.constants';

// Address validators integration
import {
  AddressUserBusinessIdValidator,
  AddressLine1Validator,
  AddressLine2Validator,
  CityEnumValidator,
  ProvinceEnumValidator,
  CountryEnumValidator,
  AddressTypeEnumValidator,
  AddressPreferenceEnumValidator,
  OtherCityValidator,
  OtherProvinceStateValidator,
} from '../validators/address.validators';
import { PostalCodeValidator } from '../validators/postal-code.validator';

export class AddressBasicDto {
  // ========================================
  // SYSTEM GENERATED FIELDS
  // ========================================

  @ApiProperty({
    example: 'osot-ad-0000001',
    description: 'Auto-generated address identifier with string prefix',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  readonly osot_address_id?: string;

  @ApiProperty({
    example: 'b3e1c1a2-1234-4f56-8a9b-abcdef123456',
    description: 'Unique identifier for address entity instances',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsUUID()
  readonly osot_table_addressid?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Date and time when the address record was created',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsDateString()
  readonly createdon?: string;

  @ApiProperty({
    example: '2024-01-20T14:45:00Z',
    description: 'Date and time when the address record was last modified',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsDateString()
  readonly modifiedon?: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Owner identifier for the address record',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsUUID()
  readonly ownerid?: string;

  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================

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
    example: 'USR-BUS-001-2024',
    description: 'User business identifier (20 characters max, Optional)',
    maxLength: ADDRESS_FIELD_LIMITS.USER_BUSINESS_ID,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.USER_BUSINESS_ID)
  @Validate(AddressUserBusinessIdValidator)
  osot_user_business_id?: string;

  // ========================================
  // ESSENTIAL ADDRESS FIELDS
  // ========================================

  @ApiProperty({
    example: '123 Main Street',
    description: 'Address line 1 (Business Required)',
    maxLength: ADDRESS_FIELD_LIMITS.ADDRESS_1,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.ADDRESS_1)
  @Validate(AddressLine1Validator)
  osot_address_1: string;

  @ApiProperty({
    example: 'Apt 4B',
    description: 'Address line 2 (Business Optional)',
    maxLength: ADDRESS_FIELD_LIMITS.ADDRESS_2,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.ADDRESS_2)
  @Validate(AddressLine2Validator)
  osot_address_2?: string;

  @ApiProperty({
    example: City.TORONTO,
    description: 'City from centralized enum (Business Required)',
    enum: City,
  })
  @IsEnum(City)
  @Validate(CityEnumValidator)
  osot_city: City;

  @ApiProperty({
    example: 'Other City Name',
    description:
      'Custom city name when city not in enum (255 characters max, Optional)',
    maxLength: ADDRESS_FIELD_LIMITS.OTHER_CITY,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.OTHER_CITY)
  @Validate(OtherCityValidator)
  osot_other_city?: string;

  @ApiProperty({
    example: Province.ONTARIO,
    description: 'Province from centralized enum (Business Required)',
    enum: Province,
  })
  @IsEnum(Province)
  @Validate(ProvinceEnumValidator)
  osot_province: Province;

  @ApiProperty({
    example: 'Other Province/State Name',
    description:
      'Custom province/state name when province/state not in enum (255 characters max, Optional)',
    maxLength: ADDRESS_FIELD_LIMITS.OTHER_PROVINCE_STATE,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.OTHER_PROVINCE_STATE)
  @Validate(OtherProvinceStateValidator)
  osot_other_province_state?: string;

  @ApiProperty({
    example: 'K1A 0A6',
    description: 'Canadian postal code (A1A 1A1 format) (Business Required)',
    maxLength: 7,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(7)
  @Validate(PostalCodeValidator)
  osot_postal_code: string;

  @ApiProperty({
    example: Country.CANADA,
    description:
      'Country from centralized enum (Business Required, defaults to Canada)',
    enum: Country,
    default: Country.CANADA,
  })
  @IsEnum(Country)
  @Validate(CountryEnumValidator)
  osot_country: Country = Country.CANADA;

  @ApiProperty({
    example: AddressType.HOME,
    description: 'Address type from centralized enum (Business Required)',
    enum: AddressType,
  })
  @IsEnum(AddressType)
  @Validate(AddressTypeEnumValidator)
  osot_address_type: AddressType;

  @ApiProperty({
    description: 'Address Preference IDs (array of enum values). Optional.',
    enum: AddressPreference,
    isArray: true,
    example: [AddressPreference.MAIL, AddressPreference.SHIPPING],
    required: false,
  })
  @IsArray()
  @IsOptional()
  @IsEnum(AddressPreference, { each: true })
  @Validate(AddressPreferenceEnumValidator)
  osot_address_preference?: AddressPreference[];
}
