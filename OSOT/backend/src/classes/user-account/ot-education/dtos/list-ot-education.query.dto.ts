/**
 * List OT Education Query DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - swagger: API documentation for query parameters
 * - class-validator: Input validation for query parameters
 * - class-transformer: Type transformation for pagination
 *
 * QUERY CHARACTERISTICS:
 * - Flexible filtering by key OT Education fields
 * - Free text search across searchable fields
 * - Pagination support with defaults
 * - No enum restrictions (allows partial matching for search)
 * - Compatible with Dataverse OData query patterns
 *
 * NOTE: This DTO doesn't use enums for filter values as it's designed
 * for flexible search queries where enum restrictions would be too limiting.
 * The actual OT Education records returned will have proper enum typing.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListOtEducationQueryDto {
  @ApiPropertyOptional({
    description:
      'Free text search (user business ID, COTO registration, university, additional details)',
    example: 'toronto university',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description: 'Filter by user business ID',
    example: 'OTED001',
  })
  @IsOptional()
  @IsString()
  osot_user_business_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by COTO status (numeric value)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  osot_coto_status?: string;

  @ApiPropertyOptional({
    description: 'Filter by COTO registration number',
    example: 'AB123456',
  })
  @IsOptional()
  @IsString()
  osot_coto_registration?: string;

  @ApiPropertyOptional({
    description: 'Filter by OT degree type (numeric value)',
    example: '2',
  })
  @IsOptional()
  @IsString()
  osot_ot_degree_type?: string;

  @ApiPropertyOptional({
    description: 'Filter by OT university (numeric value)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  osot_ot_university?: string;

  @ApiPropertyOptional({
    description: 'Filter by graduation year (numeric value)',
    example: '2020',
  })
  @IsOptional()
  @IsString()
  osot_ot_grad_year?: string;

  @ApiPropertyOptional({
    description: 'Filter by education category (numeric value)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  osot_education_category?: string;

  @ApiPropertyOptional({
    description: 'Filter by country (numeric value)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  osot_ot_country?: string;

  @ApiPropertyOptional({
    description: 'Filter by additional education details (partial match)',
    example: 'hand therapy',
  })
  @IsOptional()
  @IsString()
  osot_ot_other?: string;

  @ApiPropertyOptional({
    description: 'Filter by access modifier (numeric value)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  osot_access_modifiers?: string;

  @ApiPropertyOptional({
    description: 'Filter by privilege level (numeric value)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  osot_privilege?: string;

  @ApiPropertyOptional({
    description: 'Filter by related account GUID',
    example: 'b3e1c1a2-1234-4f56-8a9b-abcdef123456',
  })
  @IsOptional()
  @IsString()
  osot_table_account?: string;

  @ApiPropertyOptional({
    description: 'Filter by owner ID',
    example: 'systemuser-guid',
  })
  @IsOptional()
  @IsString()
  owner_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by created date (ISO format)',
    example: '2024-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Filter by created date (ISO format)',
    example: '2024-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsString()
  created_before?: string;

  @ApiPropertyOptional({
    description: 'Page number (default: 1)',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size (default: 25, max: 100)',
    example: 25,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 25;

  @ApiPropertyOptional({
    description: 'Sort field (default: CreatedOn)',
    example: 'CreatedOn',
  })
  @IsOptional()
  @IsString()
  sort_by?: string = 'CreatedOn';

  @ApiPropertyOptional({
    description: 'Sort direction (default: desc)',
    example: 'desc',
  })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}
