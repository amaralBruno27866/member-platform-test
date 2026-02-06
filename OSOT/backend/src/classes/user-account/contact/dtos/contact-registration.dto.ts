/**
 * Contact Registration DTO (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Uses ErrorCodes/ErrorMessages for validation errors
 * - enums: Uses centralized enums for all enum fields
 * - validators: Uses Contact validators for field validation
 * - integrations: OData binding for Account relationship
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - Follows Address registration pattern exactly
 * - Essential registration fields only
 * - OData Account binding required
 * - Clean API for contact registration workflow
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Allow,
} from 'class-validator';
import { ContactBasicDto } from './contact-basic.dto';

/**
 * DTO for Contact registration workflow
 * Used when creating a contact as part of account registration process
 */
export class ContactRegistrationDto extends ContactBasicDto {
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
    example: 'Primary contact for new account registration',
    description: 'Registration context or notes (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  registration_context?: string;

  @ApiProperty({
    example: true,
    description:
      'User has confirmed contact details during registration (required)',
    required: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  contact_confirmed: boolean;

  @ApiProperty({
    example: true,
    description:
      'User has read and agreed to terms (required for registration)',
    required: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  terms_accepted: boolean;

  @ApiProperty({
    example: true,
    description: 'This is the primary contact for the account (optional)',
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_primary_contact?: boolean;
}
