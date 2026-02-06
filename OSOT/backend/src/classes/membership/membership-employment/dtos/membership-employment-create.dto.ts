/**
 * Create Membership Employment DTO
 * Simplified version for employment creation (user provides only employment data)
 *
 * EXCLUDED FIELDS (Auto-determined by system):
 * - osot_membership_year: SYSTEM-DEFINED from active membership-settings
 * - osot_Table_Account@odata.bind: Extracted from JWT token
 * - osot_Table_Account_Affiliate@odata.bind: Extracted from JWT token
 * - osot_privilege: Auto-set to OWNER
 * - osot_access_modifiers: Auto-set to PRIVATE
 *
 * USAGE CONTEXT:
 * - POST /private/membership-employments/me (self-service)
 * - User only provides employment data
 * - System automatically determines year from membership-settings
 * - System automatically determines user reference from JWT
 *
 * BUSINESS RULES:
 * - All required fields must be provided
 * - Multi-select fields are arrays
 * - Conditional "_Other" fields validated when enum contains OTHER
 * - One employment record per user per year (enforced at service layer)
 * - User must have active membership-settings
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsString,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

// Local enums integration
import { EmploymentStatus } from '../enums/employment-status.enum';
import { WorkHours } from '../enums/work-hours.enum';
import { RoleDescription } from '../enums/role-descriptor.enum';
import { PracticeYears } from '../enums/practice-years.enum';
import { Funding } from '../enums/funding.enum';
import { Benefits } from '../enums/benefits.enum';
import { HourlyEarnings } from '../enums/hourly-earnings.enum';

export class CreateMembershipEmploymentDto {
  // ========================================
  // EMPLOYMENT STATUS
  // ========================================

  @ApiProperty({
    example: EmploymentStatus.EMPLOYEE_SALARIED,
    description: 'Employment status type (single select, required)',
    enum: EmploymentStatus,
  })
  @IsNotEmpty({ message: 'Employment status is required' })
  @IsEnum(EmploymentStatus, {
    message: 'Employment status must be a valid EmploymentStatus enum value',
  })
  osot_employment_status: EmploymentStatus;

  // ========================================
  // WORK HOURS (MULTIPLE CHOICE)
  // ========================================

  @ApiProperty({
    example: [WorkHours.EXACTLY_35, WorkHours.MORE_THAN_37],
    description: 'Work hours per week (multi-select, required)',
    enum: WorkHours,
    isArray: true,
  })
  @IsNotEmpty({ message: 'Work hours is required' })
  @IsArray({ message: 'Work hours must be an array' })
  @IsEnum(WorkHours, {
    each: true,
    message: 'Each work hour must be a valid WorkHours enum value',
  })
  osot_work_hours: WorkHours[];

  // ========================================
  // ROLE DESCRIPTOR
  // ========================================

  @ApiProperty({
    example: RoleDescription.DIRECT_INDIRECT_CARE_PROVIDER,
    description: 'Role descriptor (single select, required)',
    enum: RoleDescription,
  })
  @IsNotEmpty({ message: 'Role descriptor is required' })
  @IsEnum(RoleDescription, {
    message: 'Role descriptor must be a valid RoleDescription enum value',
  })
  osot_role_descriptor: RoleDescription;

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
    example: PracticeYears.BETWEEN_6_AND_10_YEARS,
    description: 'Years of practice experience (single select, required)',
    enum: PracticeYears,
  })
  @IsNotEmpty({ message: 'Practice years is required' })
  @IsEnum(PracticeYears, {
    message: 'Practice years must be a valid PracticeYears enum value',
  })
  osot_practice_years: PracticeYears;

  // ========================================
  // POSITION FUNDING (MULTIPLE CHOICE)
  // ========================================

  @ApiProperty({
    example: [Funding.PROVINCIAL_GOVERMENT_HEALTH, Funding.FEDERAL_GOVERNMENT],
    description: 'Position funding sources (multi-select, required)',
    enum: Funding,
    isArray: true,
  })
  @IsNotEmpty({ message: 'Position funding is required' })
  @IsArray({ message: 'Position funding must be an array' })
  @IsEnum(Funding, {
    each: true,
    message: 'Each funding source must be a valid Funding enum value',
  })
  osot_position_funding: Funding[];

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
    example: [
      Benefits.EXTENDED_HEALTH_DENTAL_CARE,
      Benefits.PAID_VACATION,
      Benefits.PENSION,
    ],
    description: 'Employment benefits (multi-select, required)',
    enum: Benefits,
    isArray: true,
  })
  @IsNotEmpty({ message: 'Employment benefits is required' })
  @IsArray({ message: 'Employment benefits must be an array' })
  @IsEnum(Benefits, {
    each: true,
    message: 'Each benefit must be a valid Benefits enum value',
  })
  osot_employment_benefits: Benefits[];

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
    example: HourlyEarnings.BETWEEN_41_TO_50,
    description: 'Hourly earnings from employment (single select, required)',
    enum: HourlyEarnings,
  })
  @IsNotEmpty({ message: 'Earnings employment is required' })
  @IsEnum(HourlyEarnings, {
    message: 'Earnings employment must be a valid HourlyEarnings enum value',
  })
  osot_earnings_employment: HourlyEarnings;

  @ApiProperty({
    example: HourlyEarnings.BETWEEN_51_TO_60,
    description:
      'Hourly earnings from self-employment (direct client billing) (single select, required)',
    enum: HourlyEarnings,
  })
  @IsNotEmpty({ message: 'Earnings self direct is required' })
  @IsEnum(HourlyEarnings, {
    message: 'Earnings self direct must be a valid HourlyEarnings enum value',
  })
  osot_earnings_self_direct: HourlyEarnings;

  @ApiProperty({
    example: HourlyEarnings.BETWEEN_31_TO_40,
    description:
      'Hourly earnings from self-employment (indirect/subcontracted) (single select, required)',
    enum: HourlyEarnings,
  })
  @IsNotEmpty({ message: 'Earnings self indirect is required' })
  @IsEnum(HourlyEarnings, {
    message: 'Earnings self indirect must be a valid HourlyEarnings enum value',
  })
  osot_earnings_self_indirect: HourlyEarnings;

  // ========================================
  // UNION NAME
  // ========================================

  @ApiProperty({
    example: 'Ontario Public Service Employees Union',
    description: 'Union name (required, max 255 chars)',
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
    description: 'Has another employment position (optional, boolean)',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Another employment must be a boolean' })
  osot_another_employment?: boolean;
}
