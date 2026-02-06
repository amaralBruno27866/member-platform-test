/**
 * Create Management For Account DTO
 *
 * Simplified DTO specifically designed for Account integration workflow.
 * This DTO contains only the essential boolean flags for management status.
 *
 * INTEGRATION PURPOSE:
 * - Management record creation during account registration
 * - Boolean flags for membership status and role tracking
 * - Internal use only - not for direct user access
 *
 * DESIGN PRINCIPLES:
 * - Only essential boolean flags
 * - Default values set to false for new accounts
 * - Simple validation
 * - Fast creation for high-volume account registration
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Allow } from 'class-validator';

export class CreateManagementForAccountDto {
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
  // MEMBERSHIP STATUS FLAGS
  // ========================================

  @ApiProperty({
    description: 'Life member retired status',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_life_member_retired?: boolean = false;

  @ApiProperty({
    description: 'Shadowing status',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_shadowing?: boolean = false;

  @ApiProperty({
    description: 'Passed away status',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_passed_away?: boolean = false;

  @ApiProperty({
    description: 'Vendor status',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_vendor?: boolean = false;

  @ApiProperty({
    description: 'Advertising status',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_advertising?: boolean = false;

  @ApiProperty({
    description: 'Recruitment status',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_recruitment?: boolean = false;

  @ApiProperty({
    description: 'Driver rehabilitation status',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_driver_rehab?: boolean = false;
}
