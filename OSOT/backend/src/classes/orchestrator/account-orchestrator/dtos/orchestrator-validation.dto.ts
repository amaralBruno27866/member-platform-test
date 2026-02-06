/**
 * Orchestrator Validation DTOs
 *
 * DTOs for orchestrator validation operations, including comprehensive validation
 * responses and validation state tracking across the registration workflow.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsString,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsEmail,
} from 'class-validator';
import { RegistrationState } from '../enums/registration-state.enum';
import { EntityType } from '../constants/orchestrator.constants';

/**
 * DTO for email verification token validation
 */
export class EmailVerificationDto {
  @ApiProperty({
    description: 'Session ID from registration initiation',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Email verification token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Email address for verification',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;
}

/**
 * DTO for admin approval operations
 */
export class AdminApprovalDto {
  @ApiProperty({
    description: 'Session ID to approve or reject',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Approval decision',
    example: 'approved',
  })
  @IsEnum(['approved', 'rejected'])
  decision: 'approved' | 'rejected';

  @ApiProperty({
    description: 'Admin email or identifier',
    example: 'admin@osot.org',
  })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({
    description: 'Reason for the decision',
    example: 'All documentation verified and approved',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({
    description: 'Additional admin notes',
    example: 'Expedited approval due to urgent need',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for retry operations
 */
export class RetryEntityCreationDto {
  @ApiProperty({
    description: 'Session ID to retry',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description:
      'Specific entity to retry (optional - retries all failed entities if not specified)',
    example: 'identity',
    required: false,
  })
  @IsOptional()
  @IsEnum([
    'account',
    'address',
    'contact',
    'identity',
    'education',
    'management',
  ])
  entityType?: EntityType;

  @ApiProperty({
    description: 'Force retry even if max attempts reached',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  forceRetry?: boolean;
}

/**
 * DTO for session management operations
 */
export class SessionManagementDto {
  @ApiProperty({
    description: 'Session ID to manage',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Management operation',
    example: 'extend',
  })
  @IsEnum(['extend', 'cancel', 'archive', 'restore'])
  operation: 'extend' | 'cancel' | 'archive' | 'restore';

  @ApiProperty({
    description: 'Additional operation parameters',
    required: false,
  })
  @IsOptional()
  parameters?: {
    extensionHours?: number;
    reason?: string;
    adminOverride?: boolean;
  };
}

/**
 * DTO for batch session queries
 */
export class SessionQueryDto {
  @ApiProperty({
    description: 'Filter by registration state',
    example: 'email_verified',
    required: false,
  })
  @IsOptional()
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
  status?: RegistrationState;

  @ApiProperty({
    description: 'Filter by email pattern',
    example: '@osot.org',
    required: false,
  })
  @IsOptional()
  @IsString()
  emailPattern?: string;

  @ApiProperty({
    description: 'Filter by creation date range (start)',
    example: '2025-01-01T00:00:00.000Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdAfter?: string;

  @ApiProperty({
    description: 'Filter by creation date range (end)',
    example: '2025-12-31T23:59:59.999Z',
    required: false,
  })
  @IsOptional()
  @IsString()
  createdBefore?: string;

  @ApiProperty({
    description: 'Include expired sessions',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeExpired?: boolean;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
    required: false,
  })
  @IsOptional()
  limit?: number;
}

/**
 * DTO for configuration updates
 */
export class OrchestratorConfigDto {
  @ApiProperty({
    description: 'Session timeout in hours',
    example: 72,
    required: false,
  })
  @IsOptional()
  sessionTimeoutHours?: number;

  @ApiProperty({
    description: 'Entity creation timeout in minutes',
    example: 30,
    required: false,
  })
  @IsOptional()
  entityTimeoutMinutes?: number;

  @ApiProperty({
    description: 'Maximum retry attempts per entity',
    example: 3,
    required: false,
  })
  @IsOptional()
  maxRetryAttempts?: number;

  @ApiProperty({
    description: 'Email verification timeout in hours',
    example: 24,
    required: false,
  })
  @IsOptional()
  emailVerificationTimeoutHours?: number;

  @ApiProperty({
    description: 'Enable automatic cleanup of expired sessions',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  enableAutoCleanup?: boolean;

  @ApiProperty({
    description: 'Enable retry queues for failed entities',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  enableRetryQueues?: boolean;
}

/**
 * DTO for manual entity creation (admin override)
 */
export class ManualEntityCreationDto {
  @ApiProperty({
    description: 'Session ID for manual entity creation',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Entity type to create manually',
    example: 'management',
  })
  @IsEnum([
    'account',
    'address',
    'contact',
    'identity',
    'education',
    'management',
  ])
  entityType: EntityType;

  @ApiProperty({
    description: 'Admin performing the manual creation',
    example: 'admin@osot.org',
  })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({
    description: 'Reason for manual creation',
    example: 'Automated creation failed due to API timeout',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({
    description: 'Skip validation checks',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  skipValidation?: boolean;

  @ApiProperty({
    description: 'Override entity data if needed',
    required: false,
  })
  @IsOptional()
  overrideData?: Record<string, any>;
}

/**
 * DTO for orchestrator health checks
 */
export class HealthCheckDto {
  @ApiProperty({
    description: 'Include detailed Redis status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeRedis?: boolean;

  @ApiProperty({
    description: 'Include Dataverse connectivity status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeDataverse?: boolean;

  @ApiProperty({
    description: 'Include active sessions count',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeSessions?: boolean;

  @ApiProperty({
    description: 'Include entity creation statistics',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  includeStats?: boolean;
}
