/**
 * List Membership Settings Query DTO
 * Provides filtering, sorting, and pagination options for membership settings queries
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for filtering options
 * - constants: References query configurations from constants
 * - validation: Optional field validation for query parameters
 *
 * DATAVERSE INTEGRATION:
 * - OData query parameter support
 * - Filtering by enum values (year, category, status)
 * - Sorting by multiple fields
 * - Pagination with configurable page size
 *
 * USAGE CONTEXT:
 * - Administrative dashboards for membership settings management
 * - API endpoints for membership settings listing
 * - Reporting and analytics queries
 * - Bulk operations and data exports
 *
 * QUERY CAPABILITIES:
 * - Filter by membership year, category, or status
 * - Search by settings ID or business identifier patterns
 * - Sort by creation date, modification date, or business fields
 * - Paginate results with configurable page sizes
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { AccountStatus } from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';

export class ListMembershipSettingsQueryDto {
  // ========================================
  // FILTERING OPTIONS
  // ========================================

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    description:
      'Filter by organization GUID (admin only - usually populated from JWT)',
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'Organization GUID must be a valid UUID' })
  organizationGuid?: string;

  @ApiProperty({
    example: '2025',
    description: 'Filter by membership year (e.g., "2024", "2025", "2026")',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Membership year must be a string' })
  membershipYear?: string;

  @ApiProperty({
    example: MembershipGroup.INDIVIDUAL,
    description: 'Filter by membership group',
    enum: MembershipGroup,
    required: false,
  })
  @IsOptional()
  @IsEnum(MembershipGroup, { message: 'Must be a valid membership group' })
  membershipGroup?: MembershipGroup;

  @ApiProperty({
    example: AccountStatus.ACTIVE,
    description: 'Filter by membership year status',
    enum: AccountStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccountStatus, { message: 'Must be a valid account status' })
  membershipYearStatus?: AccountStatus;

  @ApiProperty({
    example: 'osot-set',
    description: 'Search by settings ID pattern (partial match)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  searchTerm?: string;

  // ========================================
  // SORTING OPTIONS
  // ========================================

  @ApiProperty({
    example: 'osot_membership_year',
    description: 'Field to sort by',
    enum: [
      'osot_settingsid',
      'osot_membership_year',
      'osot_membership_group',
      'osot_membership_year_status',
      'osot_year_starts',
      'osot_year_ends',
      'createdon',
      'modifiedon',
    ],
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  sortBy?: string;

  @ApiProperty({
    example: 'DESC',
    description: 'Sort order (ASC or DESC)',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'Sort order must be ASC or DESC' })
  sortOrder?: 'ASC' | 'DESC';

  // ========================================
  // PAGINATION OPTIONS
  // ========================================

  @ApiProperty({
    example: 1,
    description: 'Page number (1-based)',
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @ApiProperty({
    example: 25,
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value as string, 10))
  @IsNumber({}, { message: 'Page size must be a number' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(100, { message: 'Page size cannot exceed 100' })
  pageSize?: number;

  // ========================================
  // DATE RANGE FILTERING
  // ========================================

  @ApiProperty({
    example: '2025-01-01',
    description: 'Filter by creation date (from)',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Date must be a string' })
  createdFrom?: string;

  @ApiProperty({
    example: '2025-12-31',
    description: 'Filter by creation date (to)',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Date must be a string' })
  createdTo?: string;
}
