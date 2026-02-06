/**
 * Insurance Report Query DTO
 *
 * Data transfer object for querying/filtering insurance reports.
 * Used by lookup service and controller endpoints.
 *
 * FEATURES:
 * - Filter by organization, status, dates
 * - Support for pagination
 * - Date range filtering
 *
 * USAGE:
 * ```typescript
 * @Get()
 * async listReports(@Query() query: InsuranceReportQueryDto) {
 *   return this.service.findWithFilters(query);
 * }
 *
 * // Example: GET /private/insurance-reports?organizationId=guid&status=APPROVED&page=1&pageSize=20
 * ```
 *
 * @file insurance-report-query.dto.ts
 * @module InsuranceReportModule
 * @layer DTOs
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';

export class InsuranceReportQueryDto {
  // ========================================
  // FILTER FIELDS
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by organization GUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsString()
  @IsOptional()
  organizationId?: string;

  @ApiPropertyOptional({
    description: 'Filter by report status',
    example: InsuranceReportStatus.APPROVED,
    enum: InsuranceReportStatus,
  })
  @IsEnum(InsuranceReportStatus)
  @IsOptional()
  reportStatus?: InsuranceReportStatus;

  @ApiPropertyOptional({
    description: 'Filter by report ID (autonumber)',
    example: 'osot-rep-0000123',
  })
  @IsString()
  @IsOptional()
  reportId?: string;

  @ApiPropertyOptional({
    description: 'Filter by period start date (exact match)',
    example: '2026-01-29',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  periodStart?: string;

  @ApiPropertyOptional({
    description: 'Filter by period end date (exact match)',
    example: '2026-01-30',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  periodEnd?: string;

  // ========================================
  // DATE RANGE FILTERS
  // ========================================

  @ApiPropertyOptional({
    description: 'Filter by created date (from)',
    example: '2026-01-01',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filter by created date (to)',
    example: '2026-01-31',
    format: 'date',
  })
  @IsDateString()
  @IsOptional()
  createdTo?: string;

  // ========================================
  // PAGINATION FIELDS
  // ========================================

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number;
}
