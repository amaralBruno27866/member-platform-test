/**
 * Create Insurance Report DTO
 *
 * Data transfer object for creating new insurance reports.
 * Used by CRUD service and controllers.
 *
 * VALIDATION:
 * - Organization GUID required
 * - Period dates required (start < end)
 * - Total records >= 1
 * - Total value >= 0
 * - Report status defaults to PENDING_APPROVAL
 *
 * USAGE:
 * ```typescript
 * const dto: CreateInsuranceReportDto = {
 *   organizationGuid: 'org-guid-xyz',
 *   periodStart: '2026-01-29',
 *   periodEnd: '2026-01-30',
 *   totalRecords: 15,
 *   totalValue: 12500.00,
 * };
 * ```
 *
 * @file create-insurance-report.dto.ts
 * @module InsuranceReportModule
 * @layer DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsOptional,
  Length,
} from 'class-validator';
import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';
import { INSURANCE_REPORT_RULES } from '../constants';

export class CreateInsuranceReportDto {
  // ========================================
  // IDENTITY FIELDS
  // ========================================

  @ApiProperty({
    description: 'Organization GUID (multi-tenant identifier)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  organizationGuid: string;

  // ========================================
  // PERIOD FIELDS (24-hour window)
  // ========================================

  @ApiProperty({
    description: 'Period start date (ISO 8601 date)',
    example: '2026-01-29',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  periodStart: string;

  @ApiProperty({
    description: 'Period end date (ISO 8601 date, must be after start)',
    example: '2026-01-30',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty()
  periodEnd: string;

  // ========================================
  // METRICS FIELDS
  // ========================================

  @ApiProperty({
    description: 'Total insurance records in report',
    example: 15,
    minimum: INSURANCE_REPORT_RULES.MIN_TOTAL_RECORDS,
    maximum: INSURANCE_REPORT_RULES.MAX_TOTAL_RECORDS,
  })
  @IsNumber()
  @Min(INSURANCE_REPORT_RULES.MIN_TOTAL_RECORDS)
  @Max(INSURANCE_REPORT_RULES.MAX_TOTAL_RECORDS)
  totalRecords: number;

  @ApiProperty({
    description: 'Total value (sum of all insurance premiums)',
    example: 12500.0,
    minimum: INSURANCE_REPORT_RULES.MIN_TOTAL_VALUE,
    maximum: INSURANCE_REPORT_RULES.MAX_TOTAL_VALUE,
  })
  @IsNumber()
  @Min(INSURANCE_REPORT_RULES.MIN_TOTAL_VALUE)
  @Max(INSURANCE_REPORT_RULES.MAX_TOTAL_VALUE)
  totalValue: number;

  // ========================================
  // STATUS FIELD
  // ========================================

  @ApiPropertyOptional({
    description: 'Report status (defaults to PENDING_APPROVAL)',
    example: InsuranceReportStatus.PENDING_APPROVAL,
    enum: InsuranceReportStatus,
    default: InsuranceReportStatus.PENDING_APPROVAL,
  })
  @IsEnum(InsuranceReportStatus)
  @IsOptional()
  reportStatus?: InsuranceReportStatus;

  // ========================================
  // TOKEN FIELDS (Optional - generated if not provided)
  // ========================================

  @ApiPropertyOptional({
    description: 'Approval token (hashed UUID, auto-generated if not provided)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  approvedToken?: string;

  @ApiPropertyOptional({
    description:
      'Rejection token (hashed UUID, auto-generated if not provided)',
    example: 'z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8',
    maxLength: 1000,
  })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  rejectionToken?: string;

  // ========================================
  // ACCESS CONTROL FIELDS (Optional)
  // ========================================

  @ApiPropertyOptional({
    description: 'Privilege level (Main, Admin, Owner)',
    example: 'Main',
  })
  @IsString()
  @IsOptional()
  privilege?: string;

  @ApiPropertyOptional({
    description: 'Access modifier (Public, Private, Protected)',
    example: 'Private',
  })
  @IsString()
  @IsOptional()
  accessModifier?: string;
}
