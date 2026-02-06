/**
 * Insurance Report Payload DTO
 *
 * JSON structure sent to insurance provider.
 * Includes all insurance details and cryptographic signature for validation.
 *
 * @file insurance-report-payload.dto.ts
 * @module InsuranceModule
 * @layer DTOs
 */

import { ApiProperty } from '@nestjs/swagger';
import { InsuranceReportItemDto } from './insurance-report-item.dto';
import { InsuranceReportSummaryDto } from './insurance-report-summary.dto';

export class InsuranceReportPayloadDto {
  @ApiProperty({
    description: 'Unique report identifier',
    example: 'report-2026-01-29-abc123',
  })
  reportId: string;

  @ApiProperty({
    description: 'Organization GUID (multi-tenant identifier)',
    example: 'org-guid-123',
    format: 'uuid',
  })
  organizationGuid: string;

  @ApiProperty({
    description: 'Report generation timestamp (ISO 8601)',
    example: '2026-01-30T08:00:00Z',
    format: 'date-time',
  })
  generatedAt: string;

  @ApiProperty({
    description: '24-hour report summary and statistics',
    type: InsuranceReportSummaryDto,
  })
  summary: InsuranceReportSummaryDto;

  @ApiProperty({
    description: 'List of insurance records in report',
    type: [InsuranceReportItemDto],
  })
  insurances: InsuranceReportItemDto[];

  @ApiProperty({
    description: 'HMAC-SHA256 signature for payload validation',
    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
  })
  signature: string;

  @ApiProperty({
    description: 'Algorithm used for signature (always HMAC-SHA256)',
    example: 'HMAC-SHA256',
  })
  signatureAlgorithm: string;

  @ApiProperty({
    description: 'Timestamp when signature was generated (ISO 8601)',
    example: '2026-01-30T08:00:00Z',
    format: 'date-time',
  })
  signedAt: string;
}
