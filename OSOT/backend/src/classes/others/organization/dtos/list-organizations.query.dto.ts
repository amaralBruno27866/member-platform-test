/**
 * List Organizations Query DTO
 * Provides filtering, sorting, and pagination options for organization queries
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for filtering options
 * - constants: References ORGANIZATION_QUERY_LIMITS for pagination defaults
 * - validation: Optional field validation for query parameters
 *
 * DATAVERSE INTEGRATION:
 * - OData query parameter support
 * - Filtering by enum values (status)
 * - Sorting by multiple fields
 * - Pagination with configurable page size
 * - Search across multiple text fields
 *
 * USAGE CONTEXT:
 * - Administrative dashboards for organization management
 * - API endpoints for organization listing
 * - Multi-tenancy management interfaces
 * - Reporting and analytics queries
 * - Organization selection dropdowns
 *
 * QUERY CAPABILITIES:
 * - Filter by organization status (Active/Inactive/Pending)
 * - Search by name, legal name, acronym, or slug
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
  IsIn,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AccountStatus } from '../../../../common/enums';
import { ORGANIZATION_QUERY_LIMITS } from '../constants/organization.constants';

export class ListOrganizationsQueryDto {
  // ========================================
  // FILTERING OPTIONS
  // ========================================

  @ApiProperty({
    example: AccountStatus.ACTIVE,
    description:
      'Filter by organization status (1=Active, 2=Inactive, 3=Pending)',
    enum: AccountStatus,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsEnum(AccountStatus, { message: 'Must be a valid organization status' })
  status?: AccountStatus;

  @ApiProperty({
    example: 'occupational therapists',
    description:
      'Search term (searches in: name, legal_name, acronym, slug). Case-insensitive partial match.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  search?: string;

  @ApiProperty({
    example: 'osot',
    description: 'Filter by exact slug match (case-insensitive)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Slug must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : undefined,
  )
  slug?: string;

  // ========================================
  // SORTING OPTIONS
  // ========================================

  @ApiProperty({
    example: 'osot_organization_name',
    description: 'Field to sort by',
    enum: [
      'osot_organization_name',
      'osot_legal_name',
      'osot_slug',
      'osot_organization_status',
      'createdon',
      'modifiedon',
    ],
    required: false,
    default: 'osot_organization_name',
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  @IsIn(
    [
      'osot_organization_name',
      'osot_legal_name',
      'osot_slug',
      'osot_organization_status',
      'createdon',
      'modifiedon',
    ],
    {
      message:
        'Sort field must be one of: osot_organization_name, osot_legal_name, osot_slug, osot_organization_status, createdon, modifiedon',
    },
  )
  sortBy?: string;

  @ApiProperty({
    example: 'asc',
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    required: false,
    default: 'asc',
  })
  @IsOptional()
  @IsString({ message: 'Sort direction must be a string' })
  @IsIn(['asc', 'desc'], {
    message: 'Sort direction must be either "asc" or "desc"',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : undefined,
  )
  sortDirection?: 'asc' | 'desc';

  // ========================================
  // PAGINATION OPTIONS
  // ========================================

  @ApiProperty({
    example: 1,
    description: 'Page number (1-based)',
    minimum: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number;

  @ApiProperty({
    example: ORGANIZATION_QUERY_LIMITS.DEFAULT_PAGE_SIZE,
    description: `Items per page (max: ${ORGANIZATION_QUERY_LIMITS.MAX_PAGE_SIZE})`,
    minimum: 1,
    maximum: ORGANIZATION_QUERY_LIMITS.MAX_PAGE_SIZE,
    required: false,
    default: ORGANIZATION_QUERY_LIMITS.DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page size must be a number' })
  @Min(1, { message: 'Page size must be at least 1' })
  @Max(ORGANIZATION_QUERY_LIMITS.MAX_PAGE_SIZE, {
    message: `Page size must not exceed ${ORGANIZATION_QUERY_LIMITS.MAX_PAGE_SIZE}`,
  })
  pageSize?: number;

  // ========================================
  // COMPUTED PROPERTIES (used internally)
  // ========================================

  /**
   * Get skip value for OData $skip query parameter
   * Calculated from page and pageSize
   */
  getSkip(): number {
    const currentPage = this.page || 1;
    const currentPageSize =
      this.pageSize || ORGANIZATION_QUERY_LIMITS.DEFAULT_PAGE_SIZE;
    return (currentPage - 1) * currentPageSize;
  }

  /**
   * Get top value for OData $top query parameter
   */
  getTop(): number {
    return this.pageSize || ORGANIZATION_QUERY_LIMITS.DEFAULT_PAGE_SIZE;
  }

  /**
   * Get orderBy clause for OData $orderby query parameter
   */
  getOrderBy(): string {
    const field = this.sortBy || 'osot_organization_name';
    const direction = this.sortDirection || 'asc';
    return `${field} ${direction}`;
  }
}
