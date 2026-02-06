/**
 * Update Membership Employment DTO
 * Allows partial update of employment data
 *
 * EXCLUDED FIELDS (Immutable after creation):
 * - osot_membership_year: IMMUTABLE - Cannot be changed after creation
 * - osot_Table_Account@odata.bind: Immutable user reference
 * - osot_Table_Account_Affiliate@odata.bind: Immutable user reference
 * - osot_privilege: System-managed
 * - osot_access_modifiers: System-managed
 *
 * USAGE CONTEXT:
 * - PATCH /private/membership-employments/me (self-service)
 * - PATCH /private/membership-employments/:id (admin)
 * - User can update employment data for current year
 * - System prevents membership_year modification
 *
 * BUSINESS RULES:
 * - All fields are optional (partial update)
 * - Multi-select fields are arrays
 * - Conditional "_Other" fields validated when enum contains OTHER
 * - Cannot change membership_year (enforced at service layer)
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsString,
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

export class UpdateMembershipEmploymentDto {
  // ========================================
  // EMPLOYMENT STATUS
  // ========================================

  @ApiProperty({
    example: EmploymentStatus.EMPLOYEE_SALARIED,
    description: 'Employment status type (single select, optional)',
    enum: EmploymentStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(EmploymentStatus, {
    message: 'Employment status must be a valid EmploymentStatus enum value',
  })
  osot_employment_status?: EmploymentStatus;

  // ========================================
  // WORK HOURS (MULTIPLE CHOICE)
  // ========================================

  @ApiProperty({
    example: [WorkHours.EXACTLY_35, WorkHours.MORE_THAN_37],
    description: 'Work hours per week (multi-select, optional)',
    enum: WorkHours,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Work hours must be an array' })
  @IsEnum(WorkHours, {
    each: true,
    message: 'Each work hour must be a valid WorkHours enum value',
  })
  osot_work_hours?: WorkHours[];

  // ========================================
  // ROLE DESCRIPTOR
  // ========================================

  @ApiProperty({
    example: RoleDescription.DIRECT_INDIRECT_CARE_PROVIDER,
    description: 'Role descriptor (single select, optional)',
    enum: RoleDescription,
    required: false,
  })
  @IsOptional()
  @IsEnum(RoleDescription, {
    message: 'Role descriptor must be a valid RoleDescription enum value',
  })
  osot_role_descriptor?: RoleDescription;

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
    description: 'Years of practice experience (single select, optional)',
    enum: PracticeYears,
    required: false,
  })
  @IsOptional()
  @IsEnum(PracticeYears, {
    message: 'Practice years must be a valid PracticeYears enum value',
  })
  osot_practice_years?: PracticeYears;

  // ========================================
  // POSITION FUNDING (MULTIPLE CHOICE)
  // ========================================

  @ApiProperty({
    example: [Funding.PROVINCIAL_GOVERMENT_HEALTH, Funding.FEDERAL_GOVERNMENT],
    description: 'Position funding sources (multi-select, optional)',
    enum: Funding,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Position funding must be an array' })
  @IsEnum(Funding, {
    each: true,
    message: 'Each funding source must be a valid Funding enum value',
  })
  osot_position_funding?: Funding[];

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
    description: 'Employment benefits (multi-select, optional)',
    enum: Benefits,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Employment benefits must be an array' })
  @IsEnum(Benefits, {
    each: true,
    message: 'Each benefit must be a valid Benefits enum value',
  })
  osot_employment_benefits?: Benefits[];

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
    description: 'Hourly earnings from employment (single select, optional)',
    enum: HourlyEarnings,
    required: false,
  })
  @IsOptional()
  @IsEnum(HourlyEarnings, {
    message: 'Earnings employment must be a valid HourlyEarnings enum value',
  })
  osot_earnings_employment?: HourlyEarnings;

  @ApiProperty({
    example: HourlyEarnings.BETWEEN_51_TO_60,
    description:
      'Hourly earnings from self-employment (direct client billing) (single select, optional)',
    enum: HourlyEarnings,
    required: false,
  })
  @IsOptional()
  @IsEnum(HourlyEarnings, {
    message: 'Earnings self direct must be a valid HourlyEarnings enum value',
  })
  osot_earnings_self_direct?: HourlyEarnings;

  @ApiProperty({
    example: HourlyEarnings.BETWEEN_31_TO_40,
    description:
      'Hourly earnings from self-employment (indirect/subcontracted) (single select, optional)',
    enum: HourlyEarnings,
    required: false,
  })
  @IsOptional()
  @IsEnum(HourlyEarnings, {
    message: 'Earnings self indirect must be a valid HourlyEarnings enum value',
  })
  osot_earnings_self_indirect?: HourlyEarnings;

  // ========================================
  // UNION NAME
  // ========================================

  @ApiProperty({
    example: 'Ontario Public Service Employees Union',
    description: 'Union name (optional, max 255 chars)',
    type: 'string',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Union name must be a string' })
  @MaxLength(255, { message: 'Union name must not exceed 255 characters' })
  osot_union_name?: string;

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
