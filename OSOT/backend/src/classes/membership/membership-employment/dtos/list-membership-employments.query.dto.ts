/**
 * List Membership Employments Query DTO
 * Provides filtering, sorting, and pagination options for membership employment queries
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized and local enums for filtering options
 * - constants: References query configurations from constants
 * - validation: Optional field validation for query parameters
 *
 * DATAVERSE INTEGRATION:
 * - OData query parameter support
 * - Filtering by year, account, affiliate, employment fields
 * - Sorting by multiple fields
 * - Pagination with configurable page size
 *
 * USAGE CONTEXT:
 * - Administrative dashboards for employment data management
 * - API endpoints for employment listing (private and admin)
 * - Reporting and analytics queries
 * - Annual employment review and bulk operations
 *
 * QUERY CAPABILITIES:
 * - Filter by membership year, user (account/affiliate)
 * - Filter by employment status, work hours, role descriptor
 * - Filter by practice years, funding sources, benefits
 * - Search by employment ID or business identifier patterns
 * - Sort by creation date, modification date, or business fields
 * - Paginate results with configurable page sizes
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

// Global enums
import { Privilege, AccessModifier } from '../../../../common/enums';

// Local enums
import { EmploymentStatus } from '../enums/employment-status.enum';
import { WorkHours } from '../enums/work-hours.enum';
import { RoleDescription } from '../enums/role-descriptor.enum';
import { PracticeYears } from '../enums/practice-years.enum';
import { Funding } from '../enums/funding.enum';
import { Benefits } from '../enums/benefits.enum';
import { HourlyEarnings } from '../enums/hourly-earnings.enum';

export class ListMembershipEmploymentsQueryDto {
  // ========================================
  // PRIMARY FILTERING OPTIONS
  // ========================================

  @ApiProperty({
    example: 2025,
    description: 'Filter by membership year (e.g., 2024, 2025, 2026)',
    type: Number,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsInt({ message: 'Membership year must be an integer' })
  membershipYear?: number;

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    description: 'Filter by account GUID',
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Account ID must be a valid UUID' })
  accountId?: string;

  @ApiProperty({
    example: 'c1a2b3d4-e5f6-7890-abcd-123456789012',
    description: 'Filter by affiliate GUID',
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Affiliate ID must be a valid UUID' })
  affiliateId?: string;

  // ========================================
  // EMPLOYMENT STATUS FILTERING
  // ========================================

  @ApiProperty({
    example: EmploymentStatus.EMPLOYEE_SALARIED,
    description: 'Filter by employment status',
    enum: EmploymentStatus,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(EmploymentStatus, {
    message: 'Employment status must be a valid EmploymentStatus enum value',
  })
  employmentStatus?: EmploymentStatus;

  // ========================================
  // WORK HOURS FILTERING
  // ========================================

  @ApiProperty({
    example: WorkHours.EXACTLY_35,
    description: 'Filter by work hours (single value from multi-select)',
    enum: WorkHours,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(WorkHours, {
    message: 'Work hours must be a valid WorkHours enum value',
  })
  workHours?: WorkHours;

  // ========================================
  // ROLE DESCRIPTOR FILTERING
  // ========================================

  @ApiProperty({
    example: RoleDescription.DIRECT_INDIRECT_CARE_PROVIDER,
    description: 'Filter by role descriptor',
    enum: RoleDescription,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(RoleDescription, {
    message: 'Role descriptor must be a valid RoleDescription enum value',
  })
  roleDescriptor?: RoleDescription;

  // ========================================
  // PRACTICE YEARS FILTERING
  // ========================================

  @ApiProperty({
    example: PracticeYears.BETWEEN_6_AND_10_YEARS,
    description: 'Filter by practice years range',
    enum: PracticeYears,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(PracticeYears, {
    message: 'Practice years must be a valid PracticeYears enum value',
  })
  practiceYears?: PracticeYears;

  // ========================================
  // FUNDING FILTERING
  // ========================================

  @ApiProperty({
    example: Funding.PROVINCIAL_GOVERMENT_HEALTH,
    description: 'Filter by funding source (single value from multi-select)',
    enum: Funding,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(Funding, {
    message: 'Funding must be a valid Funding enum value',
  })
  funding?: Funding;

  // ========================================
  // BENEFITS FILTERING
  // ========================================

  @ApiProperty({
    example: Benefits.EXTENDED_HEALTH_DENTAL_CARE,
    description: 'Filter by benefit (single value from multi-select)',
    enum: Benefits,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(Benefits, {
    message: 'Benefit must be a valid Benefits enum value',
  })
  benefit?: Benefits;

  // ========================================
  // EARNINGS FILTERING
  // ========================================

  @ApiProperty({
    example: HourlyEarnings.BETWEEN_41_TO_50,
    description: 'Filter by employment earnings range',
    enum: HourlyEarnings,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(HourlyEarnings, {
    message: 'Earnings employment must be a valid HourlyEarnings enum value',
  })
  earningsEmployment?: HourlyEarnings;

  @ApiProperty({
    example: HourlyEarnings.BETWEEN_51_TO_60,
    description: 'Filter by self-employment (direct) earnings range',
    enum: HourlyEarnings,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(HourlyEarnings, {
    message: 'Earnings self direct must be a valid HourlyEarnings enum value',
  })
  earningsSelfDirect?: HourlyEarnings;

  @ApiProperty({
    example: HourlyEarnings.BETWEEN_31_TO_40,
    description: 'Filter by self-employment (indirect) earnings range',
    enum: HourlyEarnings,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(HourlyEarnings, {
    message: 'Earnings self indirect must be a valid HourlyEarnings enum value',
  })
  earningsSelfIndirect?: HourlyEarnings;

  // ========================================
  // UNION FILTERING
  // ========================================

  @ApiProperty({
    example: 'Ontario Public Service Employees Union',
    description: 'Filter by union name (partial match)',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Union name must be a string' })
  unionName?: string;

  // ========================================
  // ANOTHER EMPLOYMENT FILTERING
  // ========================================

  @ApiProperty({
    example: true,
    description: 'Filter by whether user has another employment position',
    type: Boolean,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'Another employment must be a boolean' })
  anotherEmployment?: boolean;

  // ========================================
  // PRIVILEGE AND ACCESS FILTERING
  // ========================================

  @ApiProperty({
    example: Privilege.MAIN,
    description: 'Filter by privilege level',
    enum: Privilege,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(Privilege, {
    message: 'Privilege must be a valid Privilege enum value',
  })
  privilege?: Privilege;

  @ApiProperty({
    example: AccessModifier.PRIVATE,
    description: 'Filter by access modifier',
    enum: AccessModifier,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsEnum(AccessModifier, {
    message: 'Access modifier must be a valid AccessModifier enum value',
  })
  accessModifier?: AccessModifier;

  // ========================================
  // SEARCH OPTIONS
  // ========================================

  @ApiProperty({
    example: 'osot-emp-0000001',
    description: 'Search by employment identifier (partial match)',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Employment identifier must be a string' })
  employmentIdentifier?: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Search by employment UUID',
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Employment ID must be a valid UUID' })
  employmentId?: string;

  // ========================================
  // SORTING OPTIONS
  // ========================================

  @ApiProperty({
    example: 'createdon',
    description:
      'Sort field (createdon, modifiedon, osot_membership_year, osot_employment_status)',
    type: String,
    required: false,
    default: 'createdon',
  })
  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  sortBy?: string;

  @ApiProperty({
    example: 'desc',
    description: 'Sort order (asc or desc)',
    type: String,
    required: false,
    default: 'desc',
  })
  @IsOptional()
  @IsString({ message: 'Sort order must be a string' })
  sortOrder?: 'asc' | 'desc';

  // ========================================
  // PAGINATION OPTIONS
  // ========================================

  @ApiProperty({
    example: 1,
    description: 'Page number (starts at 1)',
    type: Number,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @ApiProperty({
    example: 50,
    description: 'Number of results per page (max 100)',
    type: Number,
    required: false,
    default: 50,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Page size must be a number' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(100, { message: 'Page size must not exceed 100' })
  pageSize?: number;
}
