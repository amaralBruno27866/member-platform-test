/**
 * Response Membership Employment DTO
 * Complete employment data response with system-provided fields
 *
 * INCLUDED FIELDS: 15 total
 * - 14 user-provided employment fields (all from CREATE/UPDATE)
 * - 1 system-defined field: osot_membership_year (READ-ONLY)
 *
 * EXCLUDED FIELDS (not exposed to users):
 * - osot_Table_Account@odata.bind: Internal lookup reference
 * - osot_Table_Account_Affiliate@odata.bind: Internal lookup reference
 * - osot_privilege: System-managed permission field
 * - osot_access_modifiers: System-managed access control field
 *
 * USAGE CONTEXT:
 * - GET /private/membership-employments/me (self-service)
 * - GET /private/membership-employments/:id (admin)
 * - Returns complete employment data with system-resolved membership_year
 *
 * BUSINESS RULES:
 * - osot_membership_year is SYSTEM-DEFINED from membership-settings
 * - Multi-select fields are arrays (converted from Dataverse strings)
 * - All fields are required in response (no optionals)
 * - User references resolved from JWT context
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsString,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class ResponseMembershipEmploymentDto {
  // ========================================
  // MEMBERSHIP YEAR (SYSTEM-DEFINED - READ-ONLY)
  // ========================================

  @ApiProperty({
    example: '2025',
    description:
      'Membership year (READ-ONLY, system-defined from membership-settings)',
    type: 'string',
    readOnly: true,
  })
  @IsNotEmpty({ message: 'Membership year is required in response' })
  @Matches(/^\d{4}$/, { message: 'Membership year must be in YYYY format' })
  osot_membership_year: string;

  // ========================================
  // EMPLOYMENT STATUS
  // ========================================

  @ApiProperty({
    example: 'Employee – Salaried Position',
    description: 'Employment status type (human-readable label)',
    type: 'string',
  })
  @IsNotEmpty({ message: 'Employment status is required' })
  @IsString({ message: 'Employment status must be a string label' })
  osot_employment_status: string;

  // ========================================
  // WORK HOURS (MULTIPLE CHOICE)
  // ========================================

  @ApiProperty({
    example: ['Exactly 35 hours per week', 'More than 37 hours per week'],
    description: 'Work hours per week (multi-select, human-readable labels)',
    type: [String],
  })
  @IsNotEmpty({ message: 'Work hours are required' })
  @IsArray({ message: 'Work hours must be an array' })
  osot_work_hours: string[];

  // ========================================
  // ROLE DESCRIPTOR
  // ========================================

  @ApiProperty({
    example: 'Psychotherapist',
    description: 'Role descriptor type (human-readable label)',
    type: 'string',
  })
  @IsNotEmpty({ message: 'Role descriptor is required' })
  @IsString({ message: 'Role descriptor must be a string label' })
  osot_role_descriptor: string;

  @ApiProperty({
    example: 'Clinical Supervisor',
    description:
      'Other role descriptor (optional, required when role_descriptor = OTHER, max 255 chars)',
    type: 'string',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Role descriptor other must be a string' })
  @MaxLength(255, {
    message: 'Role descriptor other must not exceed 255 characters',
  })
  osot_role_descriptor_other?: string;

  // ========================================
  // PRACTICE YEARS
  // ========================================

  @ApiProperty({
    example: 'Between 6 and 10 years',
    description: 'Years of practice experience (human-readable label)',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Practice years must be a string label' })
  osot_practice_years?: string;

  // ========================================
  // POSITION FUNDING (MULTIPLE CHOICE)
  // ========================================

  @ApiProperty({
    example: ['Provincial Government - Health', 'Federal Government'],
    description:
      'Position funding sources (multi-select, human-readable labels)',
    type: [String],
  })
  @IsNotEmpty({ message: 'Position funding is required' })
  @IsArray({ message: 'Position funding must be an array' })
  osot_position_funding: string[];

  @ApiProperty({
    example: 'Private Foundation Grant',
    description:
      'Other position funding (optional, required when position_funding contains OTHER, max 255 chars)',
    type: 'string',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Position funding other must be a string' })
  @MaxLength(255, {
    message: 'Position funding other must not exceed 255 characters',
  })
  osot_position_funding_other?: string;

  // ========================================
  // EMPLOYMENT BENEFITS (MULTIPLE CHOICE)
  // ========================================

  @ApiProperty({
    example: ['Extended Health and Dental Care', 'Paid Vacation', 'Pension'],
    description: 'Employment benefits (multi-select, human-readable labels)',
    type: [String],
  })
  @IsNotEmpty({ message: 'Employment benefits are required' })
  @IsArray({ message: 'Employment benefits must be an array' })
  osot_employment_benefits: string[];

  @ApiProperty({
    example: 'Gym Membership',
    description:
      'Other employment benefits (optional, required when employment_benefits contains OTHER, max 255 chars)',
    type: 'string',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Employment benefits other must be a string' })
  @MaxLength(255, {
    message: 'Employment benefits other must not exceed 255 characters',
  })
  osot_employment_benefits_other?: string;

  // ========================================
  // EARNINGS (3 FIELDS)
  // ========================================

  @ApiProperty({
    example: 'Between $41 to $50',
    description: 'Hourly earnings from employment (human-readable label)',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Earnings employment must be a string label' })
  osot_earnings_employment?: string;

  @ApiProperty({
    example: 'Between $51 to $60',
    description:
      'Hourly earnings from self-employment (direct client billing) (human-readable label)',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Earnings self direct must be a string label' })
  osot_earnings_self_direct?: string;

  @ApiProperty({
    example: 'Between $31 to $40',
    description:
      'Hourly earnings from self-employment (indirect/subcontracted) (human-readable label)',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Earnings self indirect must be a string label' })
  osot_earnings_self_indirect?: string;

  // ========================================
  // UNION NAME
  // ========================================

  @ApiProperty({
    example: 'Ontario Public Service Employees Union',
    description: 'Union name (max 255 chars)',
    type: 'string',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Union name is required' })
  @IsString({ message: 'Union name must be a string' })
  @MaxLength(255, { message: 'Union name must not exceed 255 characters' })
  osot_union_name: string;

  // ========================================
  // ANOTHER EMPLOYMENT
  // ========================================

  @ApiProperty({
    example: false,
    description: 'Has another employment position (boolean)',
    type: 'boolean',
  })
  @IsOptional()
  @IsBoolean({ message: 'Another employment must be a boolean' })
  osot_another_employment?: boolean;
}
