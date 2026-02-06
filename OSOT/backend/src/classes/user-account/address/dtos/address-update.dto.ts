/**
 * Update Address DTO
 * Independent DTO for address updates without account lookup requirement
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Contains all address fields without account relationship binding
 * - All fields optional for partial updates
 * - Maintains business rule enforcement for partial updates
 * - Integrates with DataverseService for OData PATCH operations
 *
 * DATAVERSE INTEGRATION:
 * - Supports partial entity updates via OData PATCH requests
 * - Maintains field-level validation for changed properties
 * - Preserves existing values for unspecified fields
 * - No account lookup needed (handled via JWT authentication)
 *
 * USAGE CONTEXT:
 * - Address updates via user self-service endpoints (/me routes)
 * - Partial configuration changes without admin privileges
 * - User profile management operations
 * - JWT-authenticated operations where account context is implicit
 *
 * BUSINESS RULES:
 * - All fields are optional, allowing granular updates
 * - Business rule validation applies to changed combinations
 * - System-generated fields (IDs, timestamps) are excluded from updates
 * - Geographic consistency maintained (province/postal code validation)
 * - Account relationship handled implicitly via authentication context
 *
 * VALIDATION BEHAVIOR:
 * - Field-level validators run only on provided fields
 * - Cross-field validation runs when multiple related fields are updated
 * - Maintains data integrity through service-layer business rule checks
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  Validate,
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
  AddressLine1Validator,
  AddressLine2Validator,
  OtherCityValidator,
  OtherProvinceStateValidator,
} from '../validators/address.validators';
import { PostalCodeValidator } from '../validators/postal-code.validator';

export class UpdateAddressDto {
  // ========================================
  // ESSENTIAL ADDRESS FIELDS
  // ========================================

  @ApiProperty({
    example: '123 Main Street',
    description: 'Address line 1 (Business Required)',
    maxLength: ADDRESS_FIELD_LIMITS.ADDRESS_1,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.ADDRESS_1)
  @Validate(AddressLine1Validator)
  osot_address_1?: string;

  @ApiProperty({
    example: 'Suite 100',
    description: 'Address line 2 (Optional)',
    maxLength: ADDRESS_FIELD_LIMITS.ADDRESS_2,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.ADDRESS_2)
  @Validate(AddressLine2Validator)
  osot_address_2?: string;

  // ========================================
  // GEOGRAPHIC INFORMATION
  // ========================================

  @ApiProperty({
    example: 380,
    description: 'City enum value (Business Required)',
    enum: City,
    required: false,
  })
  @IsOptional()
  @IsEnum(City)
  osot_city?: City;

  @ApiProperty({
    example: 1,
    description: 'Province enum value (Business Required)',
    enum: Province,
    required: false,
  })
  @IsOptional()
  @IsEnum(Province)
  osot_province?: Province;

  @ApiProperty({
    example: 'K1A 0A6',
    description: 'Postal code (Business Required, Canadian format)',
    maxLength: ADDRESS_FIELD_LIMITS.POSTAL_CODE,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.POSTAL_CODE)
  @Validate(PostalCodeValidator)
  osot_postal_code?: string;

  @ApiProperty({
    example: 1,
    description: 'Country enum value (Business Required)',
    enum: Country,
    required: false,
  })
  @IsOptional()
  @IsEnum(Country)
  osot_country?: Country;

  // ========================================
  // ADDRESS TYPE AND PREFERENCES
  // ========================================

  @ApiProperty({
    example: 1,
    description: 'Address type enum value (Business Required)',
    enum: AddressType,
    required: false,
  })
  @IsOptional()
  @IsEnum(AddressType)
  osot_address_type?: AddressType;

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
  osot_address_preference?: AddressPreference[];

  // ========================================
  // NEW BUSINESS FIELDS
  // ========================================

  @ApiProperty({
    example: 'Other City Name',
    description: 'Other city (Optional)',
    maxLength: ADDRESS_FIELD_LIMITS.OTHER_CITY,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.OTHER_CITY)
  @Validate(OtherCityValidator)
  osot_other_city?: string;

  @ApiProperty({
    example: 'Other Province/State',
    description: 'Other province or state (Optional)',
    maxLength: ADDRESS_FIELD_LIMITS.OTHER_PROVINCE_STATE,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ADDRESS_FIELD_LIMITS.OTHER_PROVINCE_STATE)
  @Validate(OtherProvinceStateValidator)
  osot_other_province_state?: string;
}
