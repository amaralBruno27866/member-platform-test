/**
 * Create Insurance DTO
 *
 * Data Transfer Object for creating a new Insurance certificate.
 *
 * Architecture Notes:
 * - Extends InsuranceBasicDto (inherits all fields)
 * - Requires organizationGuid, orderGuid, accountGuid (relationships)
 * - All snapshot fields are required (immutable after creation)
 * - Insurance declaration must be true to create
 * - Questions are optional but if answered Yes, explanation is required
 * - Owner role CANNOT use this endpoint (only Main/Admin apps)
 * - Custom validators enforce complex business rules:
 *   * Declaration must be explicitly true
 *   * Yes answers to high-risk questions require explanations
 *   * Effective date cannot be in future
 *   * Expiry date must be after effective date
 *   * Total calculation must be accurate (within $0.01)
 *
 * Usage:
 * - Backend orchestration when Order is created with insurance product
 * - Manual insurance creation by Admin (exceptional cases)
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { InsuranceBasicDto } from './insurance-basic.dto';
import {
  IsDeclarationTrue,
  IsQuestionExplanationRequired,
  IsValidEffectiveDate,
  IsValidExpiryDate,
  IsValidInsuranceTotal,
} from '../validators';

/**
 * DTO for creating a new Insurance certificate
 *
 * Applies custom validators to enforce business rules:
 * - Declaration validation: osot_insurance_declaration must be true
 * - Question explanation validation: Yes answers require explanations
 * - Date validation: Effective/Expiry dates must be valid
 * - Total validation: Total must match price calculation
 */
export class CreateInsuranceDto extends InsuranceBasicDto {
  // ========================================
  // CUSTOM VALIDATORS (applied to inherited fields via decoration)
  // ========================================

  /**
   * Declaration validator applied to osot_insurance_declaration field
   * Inherited from InsuranceBasicDto but validated here
   */
  @IsDeclarationTrue({
    message:
      'Declaration must be accepted (true) to create an insurance certificate',
  })
  osot_insurance_declaration: boolean;

  /**
   * Question explanation validator applied to all question fields
   * Inherited from InsuranceBasicDto but validated here
   */
  @IsQuestionExplanationRequired({
    message:
      'All high-risk questions answered "Yes" must have explanations (1-4000 characters)',
  })
  osot_insurance_question_1_explain?: string;

  /**
   * Effective date validator applied to osot_effective_date field
   * Inherited from InsuranceBasicDto but validated here
   */
  @IsValidEffectiveDate({
    message: 'Effective date cannot be in the future',
  })
  osot_effective_date: string;

  /**
   * Expiry date validator applied to osot_expires_date field
   * Inherited from InsuranceBasicDto but validated here
   */
  @IsValidExpiryDate({
    message: 'Expiry date must be after effective date',
  })
  osot_expires_date: string;

  /**
   * Total calculation validator applied to osot_total field
   * Inherited from InsuranceBasicDto but validated here
   */
  @IsValidInsuranceTotal({
    message:
      'Total must approximately equal the price (within $0.01 tolerance)',
  })
  osot_total: number;

  // ========================================
  // REQUIRED RELATIONSHIPS
  // ========================================

  @ApiProperty({
    description:
      'Organization GUID (required). Multi-tenant isolation - insurance belongs to this organization.',
    example: 'org-guid-123',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty({ message: 'Organization GUID is required' })
  @IsUUID('4', {
    message: 'Organization GUID must be a valid UUID v4',
  })
  organizationGuid: string;

  @ApiProperty({
    description:
      'Order GUID (required). Reference to the parent order that triggered this insurance.',
    example: 'order-guid-456',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty({ message: 'Order GUID is required' })
  @IsUUID('4', {
    message: 'Order GUID must be a valid UUID v4',
  })
  orderGuid: string;

  @ApiProperty({
    description:
      'Account/User GUID (required). Reference to the insured person.',
    example: 'account-guid-789',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty({ message: 'Account GUID is required' })
  @IsUUID('4', {
    message: 'Account GUID must be a valid UUID v4',
  })
  accountGuid: string;
}
