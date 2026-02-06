/**
 * Insurance Report Summary DTO
 *
 * Aggregated statistics for a 24-hour insurance report.
 * Includes totals and breakdowns by status.
 *
 * @file insurance-report-summary.dto.ts
 * @module InsuranceModule
 * @layer DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InsuranceReportSummaryDto {
  @ApiProperty({
    description: 'Report period start (ISO 8601)',
    example: '2026-01-29T00:00:00Z',
    format: 'date-time',
  })
  periodStart: string;

  @ApiProperty({
    description: 'Report period end (ISO 8601)',
    example: '2026-01-30T00:00:00Z',
    format: 'date-time',
  })
  periodEnd: string;

  @ApiProperty({
    description: 'Total insurance records in period',
    example: 15,
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Total premium value (sum of osot_insurance_price)',
    example: 1185.0,
    type: 'number',
  })
  totalPremium: number;

  @ApiProperty({
    description: 'Total amount including taxes (sum of osot_total)',
    example: 1340.5,
    type: 'number',
  })
  totalAmount: number;

  @ApiProperty({
    description: 'Count of ACTIVE insurances',
    example: 12,
  })
  countActive: number;

  @ApiProperty({
    description: 'Count of PENDING insurances',
    example: 2,
  })
  countPending: number;

  @ApiProperty({
    description: 'Count of DRAFT insurances',
    example: 1,
  })
  countDraft: number;

  @ApiProperty({
    description: 'Count of EXPIRED insurances',
    example: 0,
  })
  countExpired: number;

  @ApiProperty({
    description: 'Count of CANCELLED insurances',
    example: 0,
  })
  countCancelled: number;

  @ApiPropertyOptional({
    description: 'Breakdown by insurance type',
    example: {
      'Professional Liability': { count: 8, total: 632.0 },
      'General Liability': { count: 7, total: 708.5 },
    },
  })
  byInsuranceType?: Record<string, { count: number; total: number }>;

  @ApiPropertyOptional({
    description: 'Breakdown by status',
    example: {
      ACTIVE: { count: 12, total: 1200.0 },
      PENDING: { count: 2, total: 140.5 },
      DRAFT: { count: 1, total: 0.0 },
    },
  })
  byStatus?: Record<string, { count: number; total: number }>;
}
