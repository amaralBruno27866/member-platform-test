/**
 * Create Address For Account DTO
 *
 * Simplified DTO specifically designed for Account integration workflow.
 * This DTO contains only the essential fields for address creation during account registration.
 *
 * INTEGRATION PURPOSE:
 * - Address record creation during account registration
 * - Essential address fields only
 * - Internal use only - not for direct user access
 *
 * DESIGN PRINCIPLES:
 * - Only essential address fields
 * - Simple validation
 * - Fast creation for high-volume account registration
 * - Compatible with Dataverse lookups to Account entity
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  Allow,
} from 'class-validator';
import {
  City,
  Province,
  Country,
  AddressType,
  AddressPreference,
} from '../../../../common/enums';

export class CreateAddressForAccountDto {
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
    description:
      'User business ID for account relationship. Will be set automatically by orchestrator.',
    example: 'osot-0000123',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_user_business_id?: string;

  // ========================================
  // ESSENTIAL ADDRESS FIELDS
  // ========================================

  @ApiProperty({
    description: 'Street address (required)',
    example: '123 Main Street',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  osot_address_1: string;

  @ApiProperty({
    description: 'Unit/Apartment number',
    example: 'Suite 100',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_address_2?: string;

  @ApiProperty({
    description: 'City (required)',
    example: City.TORONTO,
    enum: City,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(City)
  osot_city: City;

  @ApiProperty({
    description: 'Province (required)',
    example: Province.ONTARIO,
    enum: Province,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(Province)
  osot_province: Province;

  @ApiProperty({
    description: 'Postal code (required)',
    example: 'K1A 0A6',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  osot_postal_code: string;

  @ApiProperty({
    description: 'Country (required)',
    example: Country.CANADA,
    enum: Country,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(Country)
  osot_country: Country;

  @ApiProperty({
    description: 'Address type (required)',
    example: AddressType.HOME,
    enum: AddressType,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(AddressType)
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
  osot_address_preference?: AddressPreference[];

  // ========================================
  // NEW BUSINESS FIELDS
  // ========================================

  @ApiProperty({
    example: 'Other City Name',
    description: 'Other city (Optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_other_city?: string;

  @ApiProperty({
    example: 'Other Province/State',
    description: 'Other province or state (Optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_other_province_state?: string;
}
