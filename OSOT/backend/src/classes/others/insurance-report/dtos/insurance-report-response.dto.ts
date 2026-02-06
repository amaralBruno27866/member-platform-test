/**
 * Insurance Report Response DTO
 *
 * Data transfer object for returning insurance report data to clients.
 * Used by controllers and API responses.
 *
 * FEATURES:
 * - Includes all report metadata
 * - Approval/rejection details
 * - System fields (created, modified timestamps)
 * - Omits sensitive data (hashed tokens)
 *
 * USAGE:
 * ```typescript
 * @Get(':id')
 * async getReport(@Param('id') id: string): Promise<InsuranceReportResponseDto> {
 *   const report = await this.service.findById(id);
 *   return InsuranceReportMapper.toResponseDto(report);
 * }
 * ```
 *
 * @file insurance-report-response.dto.ts
 * @module InsuranceReportModule
 * @layer DTOs
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InsuranceReportStatus } from '../../insurance/enum/insurance-report-status.enum';

export class InsuranceReportResponseDto {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  @ApiProperty({
    description: 'Primary key (GUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  osot_table_insurance_reportid: string;

  @ApiPropertyOptional({
    description: 'Created timestamp',
    example: '2026-01-30T06:00:00Z',
    format: 'date-time',
  })
  createdon?: string;

  @ApiPropertyOptional({
    description: 'Last modified timestamp',
    example: '2026-01-30T08:00:00Z',
    format: 'date-time',
  })
  modifiedon?: string;

  // ========================================
  // IDENTITY FIELDS
  // ========================================

  @ApiProperty({
    description: 'Report ID (autonumber)',
    example: 'osot-rep-0000123',
  })
  reportId: string;

  @ApiProperty({
    description: 'Organization GUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
    format: 'uuid',
  })
  organizationGuid: string;

  @ApiPropertyOptional({
    description: 'Organization name (from lookup)',
    example: 'OSOT',
  })
  organizationName?: string;

  // ========================================
  // PERIOD FIELDS (24-hour window)
  // ========================================

  @ApiProperty({
    description: 'Period start date',
    example: '2026-01-29',
    format: 'date',
  })
  periodStart: string;

  @ApiProperty({
    description: 'Period end date',
    example: '2026-01-30',
    format: 'date',
  })
  periodEnd: string;

  // ========================================
  // METRICS FIELDS
  // ========================================

  @ApiProperty({
    description: 'Total insurance records in report',
    example: 15,
  })
  totalRecords: number;

  @ApiProperty({
    description: 'Total value (sum of all insurance premiums)',
    example: 12500.0,
  })
  totalValue: number;

  // ========================================
  // STATUS FIELD
  // ========================================

  @ApiProperty({
    description: 'Report status',
    example: InsuranceReportStatus.APPROVED,
    enum: InsuranceReportStatus,
  })
  reportStatus: InsuranceReportStatus;

  // ========================================
  // APPROVAL FIELDS
  // ========================================

  @ApiPropertyOptional({
    description: 'User ID who approved the report',
    example: 'user-guid-123',
  })
  approvedBy?: string;

  @ApiPropertyOptional({
    description: 'Approval timestamp',
    example: '2026-01-30T08:00:00Z',
    format: 'date-time',
  })
  approvedDate?: string;

  // ========================================
  // REJECTION FIELDS
  // ========================================

  @ApiPropertyOptional({
    description: 'User ID who rejected the report',
    example: 'user-guid-456',
  })
  rejectBy?: string;

  @ApiPropertyOptional({
    description: 'Rejection timestamp',
    example: '2026-01-30T08:05:00Z',
    format: 'date-time',
  })
  rejectedDate?: string;

  @ApiPropertyOptional({
    description: 'Reason for rejection',
    example: 'Data quality issues in 3 records',
  })
  rejectionReason?: string;

  // ========================================
  // ACCESS CONTROL FIELDS
  // ========================================

  @ApiPropertyOptional({
    description: 'Privilege level',
    example: 'Main',
  })
  privilege?: string;

  @ApiPropertyOptional({
    description: 'Access modifier',
    example: 'Private',
  })
  accessModifier?: string;
}
