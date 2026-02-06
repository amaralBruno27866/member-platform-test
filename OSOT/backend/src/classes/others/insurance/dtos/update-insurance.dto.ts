/**
 * Update Insurance DTO
 *
 * Data Transfer Object for updating an existing Insurance certificate.
 *
 * Architecture Notes:
 * - Most fields are immutable (snapshot frozen at creation)
 * - Only allows updating:
 *   - osot_insurance_status (lifecycle management)
 *   - osot_endorsement_description (admin-only amendments)
 *   - osot_endorsement_effective_date (admin-only amendments)
 *   - osot_privilege (access control)
 *   - osot_access_modifiers (access control)
 * - Cannot update snapshot fields (account, address, insurance details, questions, dates)
 * - Status transitions must follow business rules (DRAFT → PENDING → ACTIVE → EXPIRED/CANCELLED)
 * - Endorsements can only be added when status = ACTIVE or PENDING
 * - Custom validators enforce:
 *   * Question explanations required when endorsements include questions
 *   * Endorsement dates must be valid (after previous effective date)
 *
 * Usage:
 * - Admin: Update status, add endorsements
 * - System: Auto-expire when expiry_date passes
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { InsuranceStatus } from '../enum/insurance-status.enum';
import { AccessModifier, Privilege } from '../../../../common/enums';
import {
  IsQuestionExplanationRequired,
  IsValidExpiryDate,
} from '../validators';

/**
 * DTO for updating an existing Insurance certificate
 *
 * Applies custom validators to enforce business rules for amendments:
 * - Endorsement date validation: Must be valid and after previous dates
 * - Question explanation validation: Yes answers to amendment questions require explanations
 */
export class UpdateInsuranceDto {
  // ========================================
  // MUTABLE FIELDS
  // ========================================

  @ApiPropertyOptional({
    description:
      'Insurance status. Can transition based on business rules: DRAFT → PENDING → ACTIVE → EXPIRED/CANCELLED.',
    enum: InsuranceStatus,
    example: InsuranceStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(InsuranceStatus, {
    message: 'Insurance status must be a valid InsuranceStatus enum value',
  })
  osot_insurance_status?: InsuranceStatus;

  @ApiPropertyOptional({
    description:
      'Endorsement description (admin-only policy amendment). Can only be added when status = ACTIVE or PENDING. Max 4000 characters.',
    example: 'Coverage extended to include additional premises.',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000, {
    message: 'Endorsement description cannot exceed 4000 characters',
  })
  @IsQuestionExplanationRequired({
    message:
      'If endorsement questions are answered "Yes", explanations are required',
  })
  osot_endorsement_description?: string;

  @ApiPropertyOptional({
    description:
      'Endorsement effective date when amendment takes effect (ISO 8601 date). Admin-only. Can only be set when adding endorsement.',
    example: '2026-06-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  @IsValidExpiryDate({
    message: 'Endorsement effective date must be valid for this policy',
  })
  osot_endorsement_effective_date?: string;

  @ApiPropertyOptional({
    description:
      'Privilege level (visibility). Admin can modify access control.',
    enum: Privilege,
    example: Privilege.OWNER,
  })
  @IsOptional()
  @IsEnum(Privilege)
  osot_privilege?: Privilege;

  @ApiPropertyOptional({
    description:
      'Access modifier (access rules). Admin can modify access control.',
    enum: AccessModifier,
    example: AccessModifier.PRIVATE,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  osot_access_modifiers?: AccessModifier;
}
