/**
 * Update Insurance Report DTO
 *
 * Data transfer object for updating existing insurance reports.
 * Used by CRUD service and controllers.
 *
 * UPDATABLE FIELDS:
 * - Report status (workflow transitions)
 * - Approval metadata (token, approver, timestamp)
 * - Rejection metadata (token, rejector, reason, timestamp)
 *
 * IMMUTABLE FIELDS (cannot be updated):
 * - Organization, period dates, totals
 * - System fields (created_on, modified_on)
 *
 * USAGE:
 * ```typescript
 * // Approve report
 * const dto: UpdateInsuranceReportDto = {
 *   reportStatus: InsuranceReportStatus.APPROVED,
 *   approvedBy: 'user-guid-123',
 *   approvedDate: '2026-01-30T08:00:00Z',
 * };
 *
 * // Reject report
 * const dto: UpdateInsuranceReportDto = {
 *   reportStatus: InsuranceReportStatus.REJECTED,
 *   rejectBy: 'user-guid-456',
 *   rejectedDate: '2026-01-30T08:05:00Z',
 *   rejectionReason: 'Data quality issues in 3 records',
 * };
 * ```
 *
 * @file update-insurance-report.dto.ts
 * @module InsuranceReportModule
 * @layer DTOs
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';
import { INSURANCE_REPORT_FIELD_LENGTHS } from '../constants';

export class UpdateInsuranceReportDto {
  // ========================================
  // STATUS FIELD
  // ========================================

  @ApiPropertyOptional({
    description: 'Update report status (validates transition rules)',
    example: InsuranceReportStatus.APPROVED,
    enum: InsuranceReportStatus,
  })
  @IsEnum(InsuranceReportStatus)
  @IsOptional()
  reportStatus?: InsuranceReportStatus;

  // ========================================
  // APPROVAL FIELDS
  // ========================================

  @ApiPropertyOptional({
    description: 'Update approval token (hashed UUID)',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6',
    maxLength: INSURANCE_REPORT_FIELD_LENGTHS.APPROVED_TOKEN,
  })
  @IsString()
  @IsOptional()
  @MaxLength(INSURANCE_REPORT_FIELD_LENGTHS.APPROVED_TOKEN)
  approvedToken?: string;

  @ApiPropertyOptional({
    description: 'User ID who approved the report',
    example: 'user-guid-123',
    maxLength: INSURANCE_REPORT_FIELD_LENGTHS.APPROVED_BY,
  })
  @IsString()
  @IsOptional()
  @MaxLength(INSURANCE_REPORT_FIELD_LENGTHS.APPROVED_BY)
  approvedBy?: string;

  @ApiPropertyOptional({
    description: 'Approval timestamp (ISO 8601)',
    example: '2026-01-30T08:00:00Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  approvedDate?: string;

  // ========================================
  // REJECTION FIELDS
  // ========================================

  @ApiPropertyOptional({
    description: 'Update rejection token (hashed UUID)',
    example: 'z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8',
    maxLength: INSURANCE_REPORT_FIELD_LENGTHS.REJECTION_TOKEN,
  })
  @IsString()
  @IsOptional()
  @MaxLength(INSURANCE_REPORT_FIELD_LENGTHS.REJECTION_TOKEN)
  rejectionToken?: string;

  @ApiPropertyOptional({
    description: 'User ID who rejected the report',
    example: 'user-guid-456',
    maxLength: INSURANCE_REPORT_FIELD_LENGTHS.REJECT_BY,
  })
  @IsString()
  @IsOptional()
  @MaxLength(INSURANCE_REPORT_FIELD_LENGTHS.REJECT_BY)
  rejectBy?: string;

  @ApiPropertyOptional({
    description: 'Rejection timestamp (ISO 8601)',
    example: '2026-01-30T08:05:00Z',
    format: 'date-time',
  })
  @IsDateString()
  @IsOptional()
  rejectedDate?: string;

  @ApiPropertyOptional({
    description: 'Reason for rejection (admin-provided text)',
    example: 'Data quality issues in 3 records',
    maxLength: INSURANCE_REPORT_FIELD_LENGTHS.REJECTION_REASON,
  })
  @IsString()
  @IsOptional()
  @MaxLength(INSURANCE_REPORT_FIELD_LENGTHS.REJECTION_REASON)
  rejectionReason?: string;
}
