/**
 * Membership Orchestrator Response DTOs
 *
 * Standard response structures for membership orchestrator operations.
 * These DTOs provide consistent response formats across all orchestrator endpoints.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MembershipProgressDto } from './membership-progress.dto';
import { MembershipSessionDto } from './membership-session.dto';
import { PricingBreakdownDto } from './membership-progress.dto';
import { MembershipStateType } from '../constants/membership-orchestrator.constants';

/**
 * Standard orchestrator response DTO
 */
export class MembershipOrchestratorResponseDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message about the operation',
    example: 'Membership registration initiated successfully',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Session identifier',
    example: 'mbr_1a2b3c4d5e6f7g8h9i0j',
    required: false,
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    description: 'Current membership registration status',
    enum: [
      'initiated',
      'pricing_calculated',
      'product_selected',
      'payment_pending',
      'payment_processing',
      'payment_completed',
      'payment_failed',
      'entities_creating',
      'entities_completed',
      'pending_admin_approval',
      'pending_financial_verification',
      'approved',
      'rejected',
      'completed',
      'failed',
      'retry_pending',
      'expired',
      'cancelled',
    ],
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'initiated',
    'pricing_calculated',
    'product_selected',
    'payment_pending',
    'payment_processing',
    'payment_completed',
    'payment_failed',
    'entities_creating',
    'entities_completed',
    'pending_admin_approval',
    'pending_financial_verification',
    'approved',
    'rejected',
    'completed',
    'failed',
    'retry_pending',
    'expired',
    'cancelled',
  ])
  status?: MembershipStateType;

  @ApiProperty({
    description: 'Progress information',
    type: MembershipProgressDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MembershipProgressDto)
  progress?: MembershipProgressDto;

  @ApiProperty({
    description: 'Pricing breakdown',
    type: PricingBreakdownDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingBreakdownDto)
  pricing?: PricingBreakdownDto;

  @ApiProperty({
    description: 'Payment information',
    required: false,
  })
  @IsOptional()
  payment?: {
    status: string;
    amount: number;
    currency: string;
    paymentUrl?: string;
    transactionId?: string;
  };

  @ApiProperty({
    description: 'Timestamps',
    required: false,
  })
  @IsOptional()
  timestamps?: {
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    paymentDeadline?: string;
  };

  @ApiProperty({
    description: 'Next steps for the user',
    type: [String],
    example: [
      'Complete payment within 30 minutes',
      'Check email for payment instructions',
    ],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nextSteps?: string[];

  @ApiProperty({
    description: 'Error information if operation failed',
    required: false,
  })
  @IsOptional()
  error?: {
    code: string;
    message: string;
    timestamp: string;
    recoverable?: boolean;
    details?: any;
  };

  @ApiProperty({
    description: 'Additional data payload',
    required: false,
  })
  @IsOptional()
  data?: any;
}

/**
 * Membership initiation response
 */
export class MembershipInitiationResponseDto {
  @ApiProperty({
    description: 'Session identifier',
    example: 'mbr_1a2b3c4d5e6f7g8h9i0j',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Initial membership status',
    example: 'initiated',
  })
  @IsString()
  status: MembershipStateType;

  @ApiProperty({
    description: 'Calculated pricing breakdown',
    type: PricingBreakdownDto,
  })
  @ValidateNested()
  @Type(() => PricingBreakdownDto)
  pricing: PricingBreakdownDto;

  @ApiProperty({
    description: 'Session expiration timestamp',
    example: '2025-11-02T14:30:00.000Z',
  })
  @IsString()
  expiresAt: string;

  @ApiProperty({
    description: 'Human-readable message',
    example:
      'Membership registration initiated. Please proceed with payment within 30 minutes.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Next steps for the user',
    type: [String],
    example: [
      'Review pricing',
      'Proceed to payment',
      'Complete within 30 minutes',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  nextSteps: string[];

  @ApiProperty({
    description: 'Whether payment is required',
    example: true,
  })
  @IsBoolean()
  paymentRequired: boolean;

  @ApiProperty({
    description: 'Whether admin approval is required after payment',
    example: false,
  })
  @IsBoolean()
  approvalRequired: boolean;

  @ApiProperty({
    description: 'Payment URL (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentUrl?: string;
}

/**
 * Membership status response
 */
export class MembershipStatusResponseDto {
  @ApiProperty({
    description: 'Complete session information',
    type: MembershipSessionDto,
  })
  @ValidateNested()
  @Type(() => MembershipSessionDto)
  session: MembershipSessionDto;

  @ApiProperty({
    description: 'Current progress information',
    type: MembershipProgressDto,
  })
  @ValidateNested()
  @Type(() => MembershipProgressDto)
  progress: MembershipProgressDto;

  @ApiProperty({
    description: 'Human-readable status message',
    example: 'Payment completed. Creating membership entities...',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Next steps for the user',
    type: [String],
    example: [
      'Wait for entity creation to complete',
      'Check back in 5 minutes',
    ],
  })
  @IsArray()
  @IsString({ each: true })
  nextSteps: string[];

  @ApiProperty({
    description: 'Whether retry is available for failed operations',
    example: false,
  })
  @IsBoolean()
  canRetry: boolean;

  @ApiProperty({
    description: 'Whether user action is required',
    example: false,
  })
  @IsBoolean()
  requiresAction: boolean;
}

/**
 * Payment processing response
 */
export class PaymentProcessingResponseDto {
  @ApiProperty({
    description: 'Whether payment processing was initiated successfully',
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Payment status',
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'refunded',
      'cancelled',
    ],
  })
  @IsEnum([
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'cancelled',
  ])
  paymentStatus: string;

  @ApiProperty({
    description: 'Payment intent ID',
    example: 'pi_1234567890abcdef',
  })
  @IsString()
  paymentIntentId: string;

  @ApiProperty({
    description: 'Payment URL for redirect (if applicable)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentUrl?: string;

  @ApiProperty({
    description: 'Transaction ID (after completion)',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 671.5,
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'CAD',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Human-readable message',
    example: 'Payment processing initiated. Please complete payment.',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Next steps',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  nextSteps: string[];
}

/**
 * Validation error response
 */
export class MembershipValidationErrorDto {
  @ApiProperty({
    description: 'Whether data is valid',
    example: false,
  })
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({
    description: 'List of validation errors',
    type: [String],
    example: ['Insurance is required for Full Member category'],
  })
  @IsArray()
  @IsString({ each: true })
  errors: string[];

  @ApiProperty({
    description: 'List of warnings (non-blocking)',
    type: [String],
    example: ['Auto-renewal is recommended'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  warnings?: string[];

  @ApiProperty({
    description: 'Fields affected by errors',
    type: [String],
    example: ['insuranceSelection'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  affectedFields?: string[];

  @ApiProperty({
    description: 'Error type for programmatic handling',
    example: 'INSURANCE_REQUIRED',
    required: false,
  })
  @IsOptional()
  @IsString()
  errorType?: string;
}
