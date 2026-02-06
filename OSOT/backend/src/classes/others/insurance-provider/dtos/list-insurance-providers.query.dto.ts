/**
 * List Insurance Providers Query DTO
 *
 * Data Transfer Object for querying/filtering insurance providers list.
 * Supports filtering, searching, pagination, and sorting.
 */

import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListInsuranceProvidersQueryDto {
  // ========================================
  // FILTERING
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Filter by organization GUID',
    example: 'org-guid-123',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'Organization GUID must be a valid UUID v4' })
  organizationGuid?: string;

  @ApiProperty({
    required: false,
    description:
      'Search term (searches in company name and broker name). Case-insensitive partial match.',
    example: 'insurance',
  })
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : undefined,
  )
  search?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by active records only (statecode = 0)',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Active only filter must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  activeOnly?: boolean;

  // ========================================
  // SORTING
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Field to sort by',
    enum: [
      'osot_insurance_company_name',
      'osot_insurance_broker_name',
      'osot_policy_period_start',
      'osot_policy_period_end',
      'createdon',
      'modifiedon',
    ],
    default: 'osot_insurance_company_name',
  })
  @IsOptional()
  @IsString({ message: 'Sort field must be a string' })
  @IsIn(
    [
      'osot_insurance_company_name',
      'osot_insurance_broker_name',
      'osot_policy_period_start',
      'osot_policy_period_end',
      'createdon',
      'modifiedon',
    ],
    {
      message:
        'Sort field must be one of: osot_insurance_company_name, osot_insurance_broker_name, osot_policy_period_start, osot_policy_period_end, createdon, modifiedon',
    },
  )
  sortBy?: string;

  @ApiProperty({
    required: false,
    description: 'Sort direction',
    enum: ['asc', 'desc'],
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
  // PAGINATION
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Number of records to skip',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Skip must be a number' })
  @Min(0, { message: 'Skip cannot be negative' })
  @Type(() => Number)
  skip?: number = 0;

  @ApiProperty({
    required: false,
    description: 'Number of records to return',
    example: 50,
    minimum: 1,
    maximum: 100,
    default: 50,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Top must be a number' })
  @Min(1, { message: 'Top must be at least 1' })
  @Max(100, { message: 'Top must not exceed 100' })
  @Type(() => Number)
  top?: number = 50;
}
