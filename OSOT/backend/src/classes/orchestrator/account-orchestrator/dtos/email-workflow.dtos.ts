/**
 * Email Workflow DTOs
 *
 * Data Transfer Objects for email verification and admin approval workflows.
 * These DTOs provide structured data exchange between controllers, services,
 * and client applications for email workflow operations.
 */

import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDate,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  EmailWorkflowAction,
  EmailVerificationStatus,
  AdminApprovalStatus,
} from '../interfaces/email-workflow.interfaces.js';
import { RegistrationState } from '../enums/registration-state.enum';

// ========================================
// REQUEST DTOs
// ========================================

/**
 * Email verification request DTO
 */
export class EmailVerificationRequestDto {
  @ApiProperty({
    description: 'Registration session ID',
    example: 'reg_1234567890abcdef',
  })
  @IsString()
  @Length(1, 100)
  sessionId!: string;

  @ApiProperty({
    description: 'Email verification token from email link',
    example: 'verify_abc123def456',
  })
  @IsString()
  @Length(1, 200)
  verificationToken!: string;
}

/**
 * Admin approval request DTO
 */
export class AdminApprovalRequestDto {
  @ApiProperty({
    description: 'Registration session ID',
    example: 'reg_1234567890abcdef',
  })
  @IsString()
  @Length(1, 100)
  sessionId!: string;

  @ApiProperty({
    description: 'Approval action to perform',
    enum: ['approve', 'reject'],
    example: 'approve',
  })
  @IsEnum(['approve', 'reject'])
  action!: EmailWorkflowAction;

  @ApiProperty({
    description: 'Administrator identifier',
    example: 'admin_12345',
  })
  @IsString()
  @Length(1, 100)
  adminId!: string;

  @ApiPropertyOptional({
    description: 'Reason for approval/rejection',
    example: 'Application meets all requirements',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

/**
 * Email resend request DTO
 */
export class EmailResendRequestDto {
  @ApiProperty({
    description: 'Registration session ID',
    example: 'reg_1234567890abcdef',
  })
  @IsString()
  @Length(1, 100)
  sessionId!: string;
}

/**
 * Admin approval by token DTO (for email links)
 */
export class AdminApprovalByTokenDto {
  @ApiProperty({
    description: 'Approval or rejection token from email',
    example: 'approve_abc123def456',
  })
  @IsString()
  @Length(1, 200)
  token!: string;

  @ApiProperty({
    description: 'Approval action to perform',
    enum: ['approve', 'reject'],
    example: 'approve',
  })
  @IsEnum(['approve', 'reject'])
  action!: EmailWorkflowAction;

  @ApiProperty({
    description: 'Administrator identifier',
    example: 'admin_12345',
  })
  @IsString()
  @Length(1, 100)
  adminId!: string;

  @ApiPropertyOptional({
    description: 'Reason for approval/rejection',
    example: 'Application meets all requirements',
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}

// ========================================
// RESPONSE DTOs
// ========================================

/**
 * Base email workflow response DTO
 */
export class BaseEmailWorkflowResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  @IsBoolean()
  success!: boolean;

  @ApiProperty({
    description: 'Operation result message',
    example: 'Email verification initiated successfully',
  })
  @IsString()
  message!: string;

  @ApiProperty({
    description: 'Registration session ID',
    example: 'reg_1234567890abcdef',
  })
  @IsString()
  sessionId!: string;

  @ApiProperty({
    description: 'Operation timestamp',
    example: '2025-11-03T10:30:00Z',
  })
  @IsDate()
  @Type(() => Date)
  timestamp!: Date;

  @ApiPropertyOptional({
    description: 'Operation errors if any',
    example: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];
}

/**
 * Email verification initiation response DTO
 */
export class EmailVerificationInitiationResponseDto extends BaseEmailWorkflowResponseDto {
  @ApiProperty({
    description: 'Generated verification token',
    example: 'verify_abc123def456',
  })
  @IsString()
  verificationToken!: string;

  @ApiProperty({
    description: 'Token expiration date',
    example: '2025-11-03T11:30:00Z',
  })
  @IsDate()
  @Type(() => Date)
  expiresAt!: Date;

  @ApiProperty({
    description: 'Email successfully sent status',
    example: true,
  })
  @IsBoolean()
  emailSent!: boolean;

  @ApiProperty({
    description: 'Next step in workflow',
    example: 'await_email_verification',
  })
  @IsString()
  nextStep!: string;

  @ApiPropertyOptional({
    description: 'Verification URL for testing',
    example: 'https://app.osot.ca/verify-email?token=verify_abc123def456',
  })
  @IsOptional()
  @IsString()
  verificationUrl?: string;
}

/**
 * Email verification result response DTO
 */
export class EmailVerificationResponseDto extends BaseEmailWorkflowResponseDto {
  @ApiProperty({
    description: 'Email verification status',
    enum: ['pending', 'verified', 'failed', 'expired', 'max_attempts_exceeded'],
    example: 'verified',
  })
  @IsEnum(['pending', 'verified', 'failed', 'expired', 'max_attempts_exceeded'])
  status!: EmailVerificationStatus;

  @ApiProperty({
    description: 'Next step in workflow',
    example: 'admin_approval',
  })
  @IsString()
  nextStep!: string;

  @ApiPropertyOptional({
    description: 'Email verification timestamp',
    example: '2025-11-03T10:35:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  verifiedAt?: Date;

  @ApiPropertyOptional({
    description: 'Remaining verification attempts',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingAttempts?: number;

  @ApiPropertyOptional({
    description: 'Admin notification sent status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  adminNotificationSent?: boolean;
}

/**
 * Admin notification result response DTO
 */
export class AdminNotificationResponseDto extends BaseEmailWorkflowResponseDto {
  @ApiProperty({
    description: 'Generated approval token',
    example: 'approve_abc123def456',
  })
  @IsString()
  approvalToken!: string;

  @ApiProperty({
    description: 'Generated rejection token',
    example: 'reject_abc123def456',
  })
  @IsString()
  rejectionToken!: string;

  @ApiProperty({
    description: 'Admin emails that received notification',
    example: ['admin1@osot.ca', 'admin2@osot.ca'],
  })
  @IsArray()
  @IsEmail({}, { each: true })
  adminEmailsSent!: string[];

  @ApiProperty({
    description: 'Approval tokens expiration date',
    example: '2025-11-10T10:30:00Z',
  })
  @IsDate()
  @Type(() => Date)
  expiresAt!: Date;

  @ApiProperty({
    description: 'Next step in workflow',
    example: 'await_admin_approval',
  })
  @IsString()
  nextStep!: string;

  @ApiPropertyOptional({
    description: 'Approval URL for testing',
    example: 'https://admin.osot.ca/approve?token=approve_abc123def456',
  })
  @IsOptional()
  @IsString()
  approvalUrl?: string;

  @ApiPropertyOptional({
    description: 'Rejection URL for testing',
    example: 'https://admin.osot.ca/reject?token=reject_abc123def456',
  })
  @IsOptional()
  @IsString()
  rejectionUrl?: string;
}

/**
 * Admin approval result response DTO
 */
export class AdminApprovalResponseDto extends BaseEmailWorkflowResponseDto {
  @ApiProperty({
    description: 'Approval action performed',
    enum: ['approve', 'reject'],
    example: 'approve',
  })
  @IsEnum(['approve', 'reject'])
  action!: EmailWorkflowAction;

  @ApiProperty({
    description: 'Admin approval status',
    enum: ['pending', 'approved', 'rejected', 'expired', 'invalid_token'],
    example: 'approved',
  })
  @IsEnum(['pending', 'approved', 'rejected', 'expired', 'invalid_token'])
  status!: AdminApprovalStatus;

  @ApiProperty({
    description: 'Next step in workflow',
    example: 'entity_creation',
  })
  @IsString()
  nextStep!: string;

  @ApiProperty({
    description: 'Administrator who processed the request',
    example: 'admin_12345',
  })
  @IsString()
  processedBy!: string;

  @ApiProperty({
    description: 'Processing timestamp',
    example: '2025-11-03T10:40:00Z',
  })
  @IsDate()
  @Type(() => Date)
  processedAt!: Date;

  @ApiPropertyOptional({
    description: 'Reason for approval/rejection',
    example: 'Application meets all requirements',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({
    description: 'User notification sent status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  userNotificationSent?: boolean;
}

/**
 * Email resend result response DTO
 */
export class EmailResendResponseDto extends BaseEmailWorkflowResponseDto {
  @ApiProperty({
    description: 'New verification token',
    example: 'verify_new123def456',
  })
  @IsString()
  newToken!: string;

  @ApiProperty({
    description: 'New token expiration date',
    example: '2025-11-03T11:30:00Z',
  })
  @IsDate()
  @Type(() => Date)
  expiresAt!: Date;

  @ApiProperty({
    description: 'Total resend count for this session',
    example: 2,
  })
  @IsNumber()
  @Min(0)
  resendCount!: number;

  @ApiProperty({
    description: 'Maximum resends reached status',
    example: false,
  })
  @IsBoolean()
  maxResendsReached!: boolean;

  @ApiProperty({
    description: 'Next step in workflow',
    example: 'await_email_verification',
  })
  @IsString()
  nextStep!: string;
}

/**
 * Email workflow status response DTO
 */
export class EmailWorkflowStatusResponseDto extends BaseEmailWorkflowResponseDto {
  @ApiProperty({
    description: 'Current registration state',
    enum: Object.values(RegistrationState),
    example: 'email_verification_pending',
  })
  @IsEnum(RegistrationState)
  currentState!: RegistrationState;

  @ApiPropertyOptional({
    description: 'Email verification status',
    enum: ['pending', 'verified', 'failed', 'expired', 'max_attempts_exceeded'],
    example: 'pending',
  })
  @IsOptional()
  @IsEnum(['pending', 'verified', 'failed', 'expired', 'max_attempts_exceeded'])
  emailVerificationStatus?: EmailVerificationStatus;

  @ApiPropertyOptional({
    description: 'Admin approval status',
    enum: ['pending', 'approved', 'rejected', 'expired', 'invalid_token'],
    example: 'pending',
  })
  @IsOptional()
  @IsEnum(['pending', 'approved', 'rejected', 'expired', 'invalid_token'])
  adminApprovalStatus?: AdminApprovalStatus;

  @ApiPropertyOptional({
    description: 'Email verification attempts count',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  verificationAttempts?: number;

  @ApiPropertyOptional({
    description: 'Maximum verification attempts allowed',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxVerificationAttempts?: number;

  @ApiPropertyOptional({
    description: 'Email resend count',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  resendCount?: number;

  @ApiPropertyOptional({
    description: 'Maximum resends allowed',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxResends?: number;

  @ApiPropertyOptional({
    description: 'Current tokens validity status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  tokensValid?: boolean;

  @ApiPropertyOptional({
    description: 'Current workflow expiration date',
    example: '2025-11-03T11:30:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Last workflow activity timestamp',
    example: '2025-11-03T10:30:00Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastActivity?: Date;
}

// ========================================
// INTERNAL DTOs (for service communication)
// ========================================

/**
 * Internal email template preparation DTO
 */
export class EmailTemplatePreparationDto {
  @IsString()
  templateName!: string;

  @IsEmail()
  recipientEmail!: string;

  @IsString()
  subject!: string;

  @ValidateNested()
  @Type(() => Object)
  templateData!: Record<string, any>;
}

/**
 * Internal token generation DTO
 */
export class TokenGenerationDto {
  @IsString()
  sessionId!: string;

  @IsString()
  tokenType!: 'verification' | 'approval' | 'rejection';

  @IsNumber()
  @Min(1)
  ttlSeconds!: number;
}
