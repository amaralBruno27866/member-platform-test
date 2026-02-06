/**
 * Registration Session DTO
 *
 * Manages the complete state of a user registration session stored in Redis.
 * This DTO tracks the entire workflow from initial registration through
 * entity creation and final approval.
 *
 * REDIS STORAGE:
 * - Stored with key pattern: orchestrator:session:{sessionId}
 * - TTL based on ORCHESTRATOR_TIMEOUTS.REGISTRATION_SESSION_TTL
 * - Contains all user data and progress tracking
 *
 * WORKFLOW STATES:
 * - staged: Initial registration data received
 * - email_verified: Email verification completed
 * - account_created: Account entity created successfully
 * - entities_creating: Creating related entities
 * - entities_completed: All entities created
 * - pending_approval: Waiting for admin approval
 * - approved/rejected: Admin decision made
 * - completed: Registration fully finished
 * - failed: Registration failed (may have partial data)
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
  IsArray,
  IsEmail,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompleteUserRegistrationDto } from './complete-user-registration.dto';
import { RegistrationProgressDto } from './registration-progress.dto';
import { RegistrationState } from '../enums/registration-state.enum';

export class RegistrationSessionDto {
  // ========================================
  // SESSION IDENTIFICATION
  // ========================================
  @ApiProperty({
    description: 'Unique session identifier',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  @IsNotEmpty()
  @IsUUID()
  sessionId: string;

  // ========================================
  // ORGANIZATION CONTEXT (Multi-Tenant)
  // ========================================
  @ApiProperty({
    description:
      'Organization GUID that this registration belongs to. Resolved from organizationSlug during initiation.',
    example: 'd1f77786-f1ef-f011-8407-7ced8d663da9',
    required: false,
  })
  @IsOptional()
  @IsString()
  organizationGuid?: string;

  // ========================================
  // REGISTRATION STATE
  // ========================================
  @ApiProperty({
    description: 'Current state of the registration process',
    enum: [
      'staged',
      'email_verified',
      'account_created',
      'entities_creating',
      'entities_completed',
      'pending_approval',
      'approved',
      'rejected',
      'completed',
      'failed',
      'retry_pending',
    ],
    example: 'staged',
  })
  @IsEnum([
    'staged',
    'email_verified',
    'account_created',
    'entities_creating',
    'entities_completed',
    'pending_approval',
    'approved',
    'rejected',
    'completed',
    'failed',
    'retry_pending',
  ])
  status: RegistrationState;

  // ========================================
  // USER DATA (Complete registration info)
  // ========================================
  @ApiProperty({
    description: 'Complete user registration data',
    type: CompleteUserRegistrationDto,
  })
  @ValidateNested()
  @Type(() => CompleteUserRegistrationDto)
  userData: CompleteUserRegistrationDto;

  // ========================================
  // PROGRESS TRACKING
  // ========================================
  @ApiProperty({
    description: 'Registration progress and entity creation status',
    type: RegistrationProgressDto,
  })
  @ValidateNested()
  @Type(() => RegistrationProgressDto)
  progress: RegistrationProgressDto;

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
    example: '2025-11-01T14:30:00.000Z',
  })
  @IsDateString()
  expiresAt: string;

  // ========================================
  // EMAIL VERIFICATION (Extended)
  // ========================================
  @ApiProperty({
    description: 'Email verification token',
    required: false,
  })
  @IsOptional()
  emailVerificationToken?: string;

  @ApiProperty({
    description: 'Email verification token expiration timestamp',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  verificationTokenExpiresAt?: string;

  @ApiProperty({
    description: 'Number of verification attempts made',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  verificationAttempts?: number;

  @ApiProperty({
    description: 'Maximum verification attempts allowed',
    example: 3,
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxVerificationAttempts?: number;

  @ApiProperty({
    description: 'Timestamp when email verification was sent',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  emailVerificationSentAt?: string;

  @ApiProperty({
    description: 'Timestamp when email was verified',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  emailVerifiedAt?: string;

  @ApiProperty({
    description: 'Whether verification email was successfully sent',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  verificationEmailSent?: boolean;

  @ApiProperty({
    description: 'Number of verification email resends',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  resendCount?: number;

  @ApiProperty({
    description: 'Maximum resends allowed',
    example: 3,
    default: 3,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxResends?: number;

  // ========================================
  // ADMIN APPROVAL (Extended)
  // ========================================
  @ApiProperty({
    description: 'Admin approval token for approve actions',
    required: false,
  })
  @IsOptional()
  approvalToken?: string;

  @ApiProperty({
    description: 'Admin rejection token for reject actions',
    required: false,
  })
  @IsOptional()
  rejectionToken?: string;

  @ApiProperty({
    description: 'Approval tokens expiration timestamp',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  approvalTokensExpiresAt?: string;

  @ApiProperty({
    description: 'Whether admin notification was sent',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  adminNotificationSent?: boolean;

  @ApiProperty({
    description: 'List of admin emails that received notification',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true })
  adminEmailsSent?: string[];

  @ApiProperty({
    description: 'Timestamp when admin approval was requested',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  adminApprovalRequestedAt?: string;

  @ApiProperty({
    description: 'Admin who approved the registration',
    required: false,
  })
  @IsOptional()
  @IsString()
  approvedBy?: string;

  @ApiProperty({
    description: 'Admin who rejected the registration',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectedBy?: string;

  @ApiProperty({
    description: 'Timestamp when admin decision was made',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  approvalProcessedAt?: string;

  @ApiProperty({
    description: 'Reason for approval or rejection',
    required: false,
  })
  @IsOptional()
  @IsString()
  approvalReason?: string;

  // ========================================
  // USER NOTIFICATIONS
  // ========================================
  @ApiProperty({
    description: 'Whether user pending notification was sent',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  userPendingNotificationSent?: boolean;

  @ApiProperty({
    description: 'Whether user status notification was sent',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  userStatusNotificationSent?: boolean;

  // ========================================
  // EMAIL WORKFLOW TRACKING
  // ========================================
  @ApiProperty({
    description: 'Timestamp when email workflow started',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  emailWorkflowStartedAt?: string;

  @ApiProperty({
    description: 'Timestamp when email workflow completed',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  emailWorkflowCompletedAt?: string;

  @ApiProperty({
    description: 'Timestamp of last email workflow activity',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  emailWorkflowLastActivity?: string;

  // ========================================
  // ERROR TRACKING
  // ========================================
  @ApiProperty({
    description: 'Last error encountered during registration',
    required: false,
  })
  @IsOptional()
  lastError?: {
    message: string;
    code: string;
    timestamp: string;
    entity?: string;
    details?: any;
  };

  // ========================================
  // RETRY INFORMATION
  // ========================================
  @ApiProperty({
    description: 'Total number of retry attempts made',
    example: 0,
    default: 0,
  })
  retryCount: number = 0;

  @ApiProperty({
    description: 'Timestamp of last retry attempt',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  lastRetryAt?: string;

  // ========================================
  // METADATA
  // ========================================
  @ApiProperty({
    description: 'Additional session metadata',
    required: false,
  })
  @IsOptional()
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
    registrationSource?: string;
    browserFingerprint?: string;
  };
}

/**
 * Simplified session DTO for status checks
 */
export class RegistrationSessionStatusDto {
  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Current registration status' })
  status: RegistrationState;

  @ApiProperty({ description: 'Progress summary' })
  progress: {
    currentStep: string;
    completedEntities: string[];
    failedEntities: string[];
    progressPercentage: number;
  };

  @ApiProperty({ description: 'Timestamps' })
  timestamps: {
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  };

  @ApiProperty({ description: 'Last error if any', required: false })
  lastError?: {
    message: string;
    timestamp: string;
  };
}
