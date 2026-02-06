/**
 * Reject Insurance Report DTO
 *
 * Data transfer object for rejecting insurance reports.
 * Used by controller to pass rejection reason to service.
 *
 * VALIDATION:
 * - Reason required (non-empty string)
 * - Maximum length: 4000 characters
 *
 * USAGE:
 * ```typescript
 * const dto: RejectInsuranceReportDto = {
 *   reason: 'Report contains incomplete member information'
 * };
 * ```
 *
 * @file reject-insurance-report.dto.ts
 * @module InsuranceReportModule
 * @layer DTOs
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { INSURANCE_REPORT_RULES } from '../constants';

export class RejectInsuranceReportDto {
  @ApiProperty({
    description: 'Reason for rejecting the insurance report',
    example: 'Report contains incomplete member information',
    minLength: 1,
    maxLength: INSURANCE_REPORT_RULES.MAX_REJECTION_REASON_LENGTH,
  })
  @IsString({
    message: 'Rejection reason must be a string',
  })
  @IsNotEmpty({
    message: 'Rejection reason is required',
  })
  @MaxLength(INSURANCE_REPORT_RULES.MAX_REJECTION_REASON_LENGTH, {
    message: `Rejection reason cannot exceed ${INSURANCE_REPORT_RULES.MAX_REJECTION_REASON_LENGTH} characters`,
  })
  reason: string;
}
