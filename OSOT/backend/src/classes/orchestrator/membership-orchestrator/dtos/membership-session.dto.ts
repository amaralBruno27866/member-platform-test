/**
 * Membership Session DTO
 *
 * Manages the complete state of a membership registration session stored in Redis.
 * This DTO tracks the entire workflow from initial membership registration through
 * pricing calculation, payment processing, entity creation, and final approval.
 *
 * REDIS STORAGE:
 * - Stored with key pattern: membership-orchestrator:session:{sessionId}
 * - TTL based on MEMBERSHIP_ORCHESTRATOR_TIMEOUTS.MEMBERSHIP_SESSION_TTL
 * - Contains all membership data, pricing, payment status, and progress tracking
 *
 * WORKFLOW STATES:
 * - initiated: Initial membership data received
 * - pricing_calculated: Pricing calculated based on category and insurance
 * - product_selected: Insurance/product selected
 * - payment_pending: Awaiting payment
 * - payment_processing: Payment being processed
 * - payment_completed: Payment successful
 * - payment_failed: Payment failed (can retry)
 * - entities_creating: Creating membership entities
 * - entities_completed: All entities created
 * - pending_admin_approval: Awaiting admin approval
 * - pending_financial_verification: Awaiting financial verification
 * - approved/rejected: Admin decision made
 * - completed: Membership fully active
 * - failed: Registration failed (may have partial data)
 * - expired: Session expired
 * - cancelled: User or admin cancelled
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsUUID,
  IsEnum,
  ValidateNested,
  IsNumber,
  Min,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompleteMembershipRegistrationDto } from './complete-membership-registration.dto';
import { MembershipProgressDto } from './membership-progress.dto';
import { MembershipStateType } from '../constants/membership-orchestrator.constants';

export class MembershipSessionDto {
  // ========================================
  // SESSION IDENTIFICATION
  // ========================================
  @ApiProperty({
    description: 'Unique membership session identifier',
    example: 'mbr_1a2b3c4d5e6f7g8h9i0j',
  })
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  // ========================================
  // MEMBERSHIP STATE
  // ========================================
  @ApiProperty({
    description: 'Current state of the membership registration process',
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
    example: 'initiated',
  })
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
  status: MembershipStateType;

  // ========================================
  // ACCOUNT REFERENCE
  // ========================================
  @ApiProperty({
    description: 'Account GUID (from account orchestrator)',
    example: '1a154db6-a8ae-f011-bbd3-002248b106dc',
  })
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({
    description: 'Organization GUID (from JWT - for multi-tenant isolation)',
    example: 'f7e9c8b5-a1d2-4f3e-b6c7-8d9e0a1b2c3d',
  })
  @IsNotEmpty()
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    description: 'Membership year',
    example: '2025',
  })
  @IsNotEmpty()
  @IsString()
  membershipYear: string;

  // ========================================
  // MEMBERSHIP DATA (Complete registration info)
  // ========================================
  @ApiProperty({
    description: 'Complete membership registration data',
    type: CompleteMembershipRegistrationDto,
  })
  @ValidateNested()
  @Type(() => CompleteMembershipRegistrationDto)
  membershipData: CompleteMembershipRegistrationDto;

  // ========================================
  // PROGRESS TRACKING
  // ========================================
  @ApiProperty({
    description: 'Membership registration progress and entity creation status',
    type: MembershipProgressDto,
  })
  @ValidateNested()
  @Type(() => MembershipProgressDto)
  progress: MembershipProgressDto;

  // ========================================
  // TIMESTAMPS
  // ========================================
  @ApiProperty({
    description: 'Session creation timestamp',
    example: '2025-10-31T14:30:00.000Z',
  })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-10-31T15:45:00.000Z',
  })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({
    description: 'Session expiration timestamp',
    example: '2025-11-02T14:30:00.000Z',
  })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({
    description: 'Payment deadline timestamp',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  paymentDeadline?: string;

  // ========================================
  // METADATA & TRACKING
  // ========================================
  @ApiProperty({
    description: 'Total number of retry attempts',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  retryCount: number = 0;

  @ApiProperty({
    description: 'Last error encountered',
    required: false,
  })
  @IsOptional()
  lastError?: {
    message: string;
    code: string;
    timestamp: string;
    recoverable: boolean;
    details?: any;
  };

  @ApiProperty({
    description: 'Whether admin approval is required',
    default: false,
  })
  @IsBoolean()
  adminApprovalRequired: boolean = false;

  @ApiProperty({
    description: 'Whether financial verification is required',
    default: false,
  })
  @IsBoolean()
  financialVerificationRequired: boolean = false;

  // ========================================
  // APPROVAL WORKFLOW
  // ========================================
  @ApiProperty({
    description: 'Admin approval details',
    required: false,
  })
  @IsOptional()
  adminApproval?: {
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    reason?: string;
    comments?: string;
  };

  @ApiProperty({
    description: 'Financial verification details',
    required: false,
  })
  @IsOptional()
  financialVerification?: {
    verifiedBy?: string;
    verifiedAt?: string;
    paymentReference?: string;
    verificationNotes?: string;
  };

  // ========================================
  // CANCELLATION TRACKING
  // ========================================
  @ApiProperty({
    description: 'Cancellation details',
    required: false,
  })
  @IsOptional()
  cancellation?: {
    cancelledBy: 'user' | 'admin' | 'system';
    cancelledAt: string;
    reason: string;
    refundRequested: boolean;
    refundProcessed: boolean;
  };

  // ========================================
  // AUDIT & COMPLIANCE
  // ========================================
  @ApiProperty({
    description: 'Source of registration (web, mobile, admin)',
    example: 'web',
  })
  @IsOptional()
  @IsString()
  registrationSource?: string;

  @ApiProperty({
    description: 'IP address of user during registration',
    required: false,
  })
  @IsOptional()
  @IsString()
  userIpAddress?: string;

  @ApiProperty({
    description: 'User agent string',
    required: false,
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'Additional metadata for tracking and debugging',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;

  // ========================================
  // NOTIFICATION TRACKING
  // ========================================
  @ApiProperty({
    description: 'Emails sent during this session',
    type: 'array',
    required: false,
  })
  @IsOptional()
  emailsSent?: Array<{
    type: string;
    sentAt: string;
    recipient: string;
    status: 'sent' | 'failed' | 'bounced';
  }>;

  // ========================================
  // PAYMENT REFERENCE (Quick access)
  // ========================================
  @ApiProperty({
    description: 'Payment transaction ID (quick reference)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentTransactionId?: string;

  @ApiProperty({
    description: 'Payment intent ID (quick reference)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  // ========================================
  // INSURANCE REFERENCE (Quick access)
  // ========================================
  @ApiProperty({
    description: 'Selected insurance product ID (quick reference)',
    required: false,
  })
  @IsOptional()
  @IsString()
  insuranceProductId?: string;

  @ApiProperty({
    description: 'Insurance policy number (after approval)',
    required: false,
  })
  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;
}
