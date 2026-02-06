/**
 * Address Registration DTO (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes/ErrorMessages for validation errors
 * - enums: Uses centralized enums for all enum fields
 * - validators: Uses Address validators for field validation
 * - integrations: OData binding for Account relationship
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Follows Contact registration pattern exactly
 * - Essential registration fields only
 * - OData Account binding required
 * - Clean API for address registration workflow
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Allow,
} from 'class-validator';
import { AddressBasicDto } from './address-basic.dto';

/**
 * DTO for Address registration workflow
 * Used when creating an address as part of account registration process
 */
export class AddressRegistrationDto extends AddressBasicDto {
  @ApiProperty({
    description:
      'OData bind for Account. Example: "/osot_table_accounts/<GUID>"',
    example: '/osot_table_accounts/b3e1c1a2-1234-4f56-8a9b-abcdef123456',
    required: false,
  })
  @IsOptional()
  @Allow()
  ['osot_Table_Account@odata.bind']?: string;

  @ApiProperty({
    example: 'Primary address for new account registration',
    description: 'Registration context or notes (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  registration_context?: string;

  @ApiProperty({
    example: true,
    description:
      'User has confirmed address details during registration (required)',
    required: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  address_confirmed: boolean;

  @ApiProperty({
    example: true,
    description: 'This is the primary address for the account (optional)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_primary_address?: boolean;
}
