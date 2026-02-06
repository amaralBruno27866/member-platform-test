/**
 * Bulk Create Membership Settings DTO
 * Allows creating multiple membership settings in a single API call
 *
 * USAGE CONTEXT:
 * - Annual membership configuration setup
 * - Bulk membership settings import operations
 * - Initial system setup with multiple categories
 * - CSV-based data import workflows
 *
 * BUSINESS RULES:
 * - Maximum 50 settings per bulk operation (performance limit)
 * - Each setting follows same validation as single create
 * - Group-year combinations must be unique across the batch
 * - All-or-nothing transaction approach
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMembershipSettingsDto } from './membership-settings-create.dto';

export class BulkCreateMembershipSettingsDto {
  @ApiProperty({
    description: 'Array of membership settings to create',
    type: [CreateMembershipSettingsDto],
    example: [
      {
        osot_membership_year: '2025',
        osot_membership_year_status: 1,
        osot_membership_group: 1,
        osot_year_starts: '2025-01-01',
        osot_year_ends: '2025-12-31',
      },
      {
        osot_membership_year: '2025',
        osot_membership_year_status: 1,
        osot_membership_group: 2,
        osot_year_starts: '2025-01-01',
        osot_year_ends: '2025-12-31',
      },
    ],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray({ message: 'Settings must be an array' })
  @ArrayMinSize(1, { message: 'At least one membership setting is required' })
  @ArrayMaxSize(50, {
    message: 'Maximum 50 membership settings per bulk operation',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateMembershipSettingsDto)
  settings: CreateMembershipSettingsDto[];
}
