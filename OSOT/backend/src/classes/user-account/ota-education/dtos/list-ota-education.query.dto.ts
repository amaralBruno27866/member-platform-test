/**
 * List OTA Education Query DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Query validation with proper error handling
 * - enums: Uses centralized enums for filtering
 * - validators: Query parameter validation
 * - integrations: Ready for OData query translation
 *
 * QUERY FEATURES:
 * - OData-style filtering and pagination
 * - Enum-based filtering for type safety
 * - Account relationship filtering
 * - Flexible search capabilities
 * - Sorting and pagination controls
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsNumberString,
  IsIn,
  IsDateString,
} from 'class-validator';
import { EducationCategory } from '../../../../common/enums/education-category.enum';
import { DegreeType } from '../../../../common/enums/degree-type.enum';

/**
 * Query DTO for listing and filtering OTA Education records
 *
 * Supports OData-style queries with:
 * - Field-specific filtering
 * - Enum-based filtering for type safety
 * - Account relationship filtering
 * - Full-text search capabilities
 * - Pagination and sorting
 */
export class ListOtaEducationQueryDto {
  // Account Filtering
  @ApiPropertyOptional({
    description: 'Filter by Account ID',
    example: 'a1b2c3d4-5678-9012-3456-789012345678',
  })
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by User Business ID',
    example: 'USR-2024-001234',
  })
  @IsOptional()
  @IsString()
  osot_user_business_id?: string;

  // Education Filtering
  @ApiPropertyOptional({
    description: 'Filter by OTA college name (partial match)',
    example: 'George Brown College',
  })
  @IsOptional()
  @IsString()
  osot_ota_college?: string;

  @ApiPropertyOptional({
    description: 'Filter by OTA country code',
    example: 'CA',
  })
  @IsOptional()
  @IsString()
  osot_ota_country?: string;

  @ApiPropertyOptional({
    description: 'Filter by OTA graduation year',
    example: '2020',
  })
  @IsOptional()
  @IsString()
  osot_ota_grad_year?: string;

  @ApiPropertyOptional({
    description: 'Filter by education category',
    enum: EducationCategory,
    example: EducationCategory.GRADUATED,
  })
  @IsOptional()
  @IsIn(Object.values(EducationCategory))
  osot_education_category?: EducationCategory;

  @ApiPropertyOptional({
    description: 'Filter by OTA degree type',
    enum: DegreeType,
    example: DegreeType.BACHELORS,
  })
  @IsOptional()
  @IsIn(Object.values(DegreeType))
  osot_ota_degree_type?: DegreeType;

  @ApiPropertyOptional({
    description:
      'Filter by additional OTA education information (partial match)',
    example: 'pediatric',
  })
  @IsOptional()
  @IsString()
  osot_ota_other?: string;

  // Date Range Filtering
  @ApiPropertyOptional({
    description: 'Filter records created after this date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Filter records created before this date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  created_before?: string;

  @ApiPropertyOptional({
    description: 'Filter records modified after this date (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  modified_after?: string;

  @ApiPropertyOptional({
    description: 'Filter records modified before this date (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  modified_before?: string;

  // Full-text Search
  @ApiPropertyOptional({
    description:
      'Search across college, program, area_of_study, and description fields',
    example: 'pediatric therapy',
  })
  @IsOptional()
  @IsString()
  search?: string;

  // Pagination
  @ApiPropertyOptional({
    description: 'Number of records to return (default: 25, max: 100)',
    example: '25',
    default: '25',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Number of records to skip for pagination',
    example: '0',
    default: '0',
  })
  @IsOptional()
  @IsNumberString()
  offset?: string;

  // Sorting
  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'year',
    enum: [
      'createdon',
      'modifiedon',
      'year',
      'college',
      'program',
      'education_category',
      'degree_type',
      'user_business_id',
    ],
  })
  @IsOptional()
  @IsIn([
    'createdon',
    'modifiedon',
    'year',
    'college',
    'program',
    'education_category',
    'degree_type',
    'user_business_id',
  ])
  sort_by?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort_direction?: 'asc' | 'desc';

  // OData Query Support
  @ApiPropertyOptional({
    description: 'OData $filter query string (advanced)',
    example: "year eq '2020' and education_category eq 'GRADUATED'",
  })
  @IsOptional()
  @IsString()
  $filter?: string;

  @ApiPropertyOptional({
    description: 'OData $orderby query string (advanced)',
    example: 'year desc, college asc',
  })
  @IsOptional()
  @IsString()
  $orderby?: string;

  @ApiPropertyOptional({
    description: 'OData $top query parameter (advanced)',
    example: '50',
  })
  @IsOptional()
  @IsNumberString()
  $top?: string;

  @ApiPropertyOptional({
    description: 'OData $skip query parameter (advanced)',
    example: '25',
  })
  @IsOptional()
  @IsNumberString()
  $skip?: string;
}
