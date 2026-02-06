/**
 * Create Contact For Account DTO
 *
 * Simplified DTO specifically designed for Account integration workflow.
 * This DTO contains only the essential fields for contact creation during account registration.
 *
 * INTEGRATION PURPOSE:
 * - Contact record creation during account registration
 * - Essential contact fields only
 * - Internal use only - not for direct user access
 *
 * DESIGN PRINCIPLES:
 * - Only essential contact fields
 * - Simple validation
 * - Fast creation for high-volume account registration
 * - Compatible with Dataverse lookups to Account entity
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  Allow,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { formatPhoneNumber } from '../../../../utils/phone-formatter.utils';

export class CreateContactForAccountDto {
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
  // ESSENTIAL CONTACT FIELDS
  // ========================================

  @ApiProperty({
    description: 'Secondary email address',
    example: 'secondary@example.com',
    required: false,
  })
  @IsOptional()
  @ValidateIf(
    (o: CreateContactForAccountDto) =>
      o.osot_secondary_email !== '' && o.osot_secondary_email !== null,
  )
  @IsEmail()
  osot_secondary_email?: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Senior Developer',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_job_title?: string;

  @ApiProperty({
    description: 'Home phone number - Canadian format',
    example: '4165551234',
    required: false,
  })
  @Transform(({ value }): string | undefined => {
    if (typeof value === 'string') {
      return formatPhoneNumber(value);
    }
    return undefined;
  })
  @IsOptional()
  @IsString()
  osot_home_phone?: string;

  @ApiProperty({
    description: 'Work phone number - Canadian format',
    example: '4165559876',
    required: false,
  })
  @Transform(({ value }): string | undefined => {
    if (typeof value === 'string') {
      return formatPhoneNumber(value);
    }
    return undefined;
  })
  @IsOptional()
  @IsString()
  osot_work_phone?: string;

  @ApiProperty({
    description: 'Business website URL',
    example: 'https://example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_business_website?: string;

  @ApiProperty({
    description: 'Facebook profile URL',
    example: 'https://facebook.com/johndoe',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_facebook?: string;

  @ApiProperty({
    description: 'Instagram profile URL',
    example: 'https://instagram.com/johndoe',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_instagram?: string;

  @ApiProperty({
    description: 'TikTok profile URL',
    example: 'https://tiktok.com/@johndoe',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_tiktok?: string;

  @ApiProperty({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_linkedin?: string;

  // ========================================
  // SYSTEM CONTROLLED FIELDS (NOT INCLUDED)
  // ========================================
  // Note: Access control fields (osot_access_modifiers, osot_privilege)
  // are managed by the system and not included in user creation requests
}
