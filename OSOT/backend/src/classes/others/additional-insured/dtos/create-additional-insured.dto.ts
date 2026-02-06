/**
 * Create Additional Insured DTO
 *
 * Data Transfer Object for creating a new Additional Insured record.
 *
 * Architecture Notes:
 * - Extends AdditionalInsuredBasicDto (inherits all business fields)
 * - Requires insuranceGuid (relationship to parent)
 * - All snapshot fields are required (immutable after creation)
 * - Custom validators provide early feedback:
 *   * @IsValidInsuranceForAdditionalInsured - Insurance GUID format + guidance
 *   * @IsUniqueCompanyNamePerInsurance - Company name format + uniqueness guidance
 * - Full validation happens in AdditionalInsuredBusinessRulesService (database access)
 *
 * Usage:
 * - Backend when managing additional insureds under Commercial insurance
 * - Admin portal to add companies to existing Commercial insurance
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { AdditionalInsuredBasicDto } from './additional-insured-basic.dto';
import {
  IsValidInsuranceForAdditionalInsured,
  IsUniqueCompanyNamePerInsurance,
} from '../validators';

/**
 * DTO for creating a new Additional Insured record
 *
 * Requires all fields from AdditionalInsuredBasicDto plus insurance relationship.
 * Custom validators provide business rule guidance before database validation.
 */
export class CreateAdditionalInsuredDto extends AdditionalInsuredBasicDto {
  // ========================================
  // CUSTOM VALIDATORS ON INHERITED FIELDS
  // ========================================

  /**
   * Company name validator applied to inherited field from BasicDto
   * Checks: Format is valid, provides uniqueness guidance
   * Inherited from AdditionalInsuredBasicDto but validated here
   */
  @IsUniqueCompanyNamePerInsurance({
    message:
      'Company name must be unique for this insurance and follow format rules (3-255 chars, letters/numbers/business chars)',
  })
  osot_company_name: string;

  /**
   * Insurance GUID validator applied below
   * Checks: GUID format is valid, provides insurance type/status guidance
   */

  // ========================================
  // REQUIRED RELATIONSHIPS
  // ========================================

  @ApiProperty({
    description:
      'Insurance record GUID (parent relationship). Must be type GENERAL (Commercial) and ACTIVE status.',
    example: 'abc-123-def-456-ghi',
    format: 'uuid',
  })
  @IsString({
    message: 'Insurance GUID must be provided',
  })
  @IsNotEmpty({
    message: 'Insurance GUID is required',
  })
  @IsUUID('4', {
    message: 'Insurance GUID must be a valid UUID',
  })
  @IsValidInsuranceForAdditionalInsured({
    message:
      'Insurance must be valid GENERAL (Commercial) type in ACTIVE status',
  })
  insuranceGuid: string;
}

/**
 * Create Additional Insured Request with metadata
 * Used internally for operation tracking
 */
export interface CreateAdditionalInsuredRequest
  extends CreateAdditionalInsuredDto {
  // Context metadata (added by controller/service)
  operationId?: string;
  organizationGuid?: string;
  userGuid?: string;
  privilege?: number;
}
