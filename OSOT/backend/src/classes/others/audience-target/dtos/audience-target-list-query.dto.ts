/**
 * List Audience Targets Query DTO
 * Provides filtering, sorting, and pagination options for audience target queries
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - validation: Optional field validation for query parameters
 * - pagination: Support for page-based and cursor-based pagination
 *
 * DATAVERSE INTEGRATION:
 * - OData query parameter support
 * - Filtering by product, target ID
 * - Sorting by creation date, modification date, business ID
 * - Pagination with configurable page size
 *
 * USAGE CONTEXT:
 * - Administrative dashboards for audience target management
 * - API endpoints for target listing (private)
 * - Product targeting configuration
 * - Bulk operations and reporting
 *
 * QUERY CAPABILITIES:
 * - Filter by product GUID
 * - Search by target business ID pattern
 * - Sort by creation date, modification date, or business fields
 * - Paginate results with configurable page sizes
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  IsString,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum AudienceTargetSortField {
  CREATED_ON = 'createdon',
  MODIFIED_ON = 'modifiedon',
  TARGET_ID = 'osot_target_id',
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class ListAudienceTargetsQueryDto {
  // ========================================
  // PRIMARY FILTERING OPTIONS
  // ========================================

  @ApiProperty({
    example: 'p1r2o3d4-u5c6-7890-abcd-product123456',
    description: 'Filter by product GUID (exact match)',
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Product ID must be a valid GUID string' })
  productId?: string;

  @ApiProperty({
    example: 'osot-tgt-0000001',
    description: 'Filter by target business ID (exact match)',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Target ID must be a string' })
  targetId?: string;

  @ApiProperty({
    example: 'osot-tgt-0000',
    description: 'Search by target business ID pattern (partial match)',
    type: String,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Target ID pattern must be a string' })
  targetIdPattern?: string;

  // ========================================
  // PAGINATION OPTIONS
  // ========================================

  @ApiProperty({
    example: 1,
    description: 'Page number for pagination (1-based, default: 1)',
    type: Number,
    default: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  @Transform(({ value }) => parseInt(String(value), 10) || 1)
  page?: number = 1;

  @ApiProperty({
    example: 20,
    description: 'Number of records per page (default: 20, min: 1, max: 100)',
    type: Number,
    default: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page size must be a number' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(100, { message: 'Page size cannot exceed 100' })
  @Transform(({ value }) => parseInt(String(value), 10) || 20)
  pageSize?: number = 20;

  // ========================================
  // SORTING OPTIONS
  // ========================================

  @ApiProperty({
    example: AudienceTargetSortField.CREATED_ON,
    description: 'Field to sort by',
    enum: AudienceTargetSortField,
    default: AudienceTargetSortField.CREATED_ON,
    required: false,
  })
  @IsOptional()
  @IsEnum(AudienceTargetSortField, {
    message: 'Sort field must be a valid AudienceTargetSortField enum value',
  })
  sortBy?: AudienceTargetSortField = AudienceTargetSortField.CREATED_ON;

  @ApiProperty({
    example: SortDirection.DESC,
    description: 'Sort direction (ascending or descending)',
    enum: SortDirection,
    default: SortDirection.DESC,
    required: false,
  })
  @IsOptional()
  @IsEnum(SortDirection, {
    message: 'Sort direction must be either "asc" or "desc"',
  })
  sortDirection?: SortDirection = SortDirection.DESC;

  // ========================================
  // ADVANCED FILTERING (For future expansion)
  // ========================================

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-123456789012',
    description: 'Filter by target GUID (exact match, for direct access)',
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Target GUID must be a valid GUID string' })
  targetGuid?: string;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Filter targets created after this date (ISO 8601 format)',
    type: String,
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Created after must be a string' })
  createdAfter?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Filter targets created before this date (ISO 8601 format)',
    type: String,
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Created before must be a string' })
  createdBefore?: string;

  @ApiProperty({
    example: '2024-01-01',
    description: 'Filter targets modified after this date (ISO 8601 format)',
    type: String,
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Modified after must be a string' })
  modifiedAfter?: string;

  @ApiProperty({
    example: '2024-12-31',
    description: 'Filter targets modified before this date (ISO 8601 format)',
    type: String,
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Modified before must be a string' })
  modifiedBefore?: string;
}
