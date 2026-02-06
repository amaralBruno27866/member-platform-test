/**
 * Orchestrator Response DTOs
 *
 * Response DTOs for orchestrator operations with comprehensive error handling,
 * status reporting, and progress tracking.
 */

import { ApiProperty } from '@nestjs/swagger';
import { RegistrationState } from '../enums/registration-state.enum';
import { EntityType } from '../constants/orchestrator.constants';

/**
 * Response for registration initiation
 */
export class RegistrationInitiatedResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Session ID for tracking registration progress',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Current registration status',
    example: 'staged',
  })
  status: RegistrationState;

  @ApiProperty({
    description: 'Message describing the current state',
    example:
      'Registration data staged successfully. Please check your email for verification.',
  })
  message: string;

  @ApiProperty({
    description: 'Next steps for the user',
    example: ['Verify your email address', 'Wait for admin approval'],
  })
  nextSteps: string[];

  @ApiProperty({
    description: 'Session expiration time',
    example: '2025-11-01T14:30:00.000Z',
  })
  expiresAt: string;
}

/**
 * Response for registration status checks
 */
export class RegistrationStatusResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Session ID',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Current registration status',
    example: 'entities_creating',
  })
  status: RegistrationState;

  @ApiProperty({
    description: 'Progress information',
  })
  progress: {
    percentage: number;
    currentStep: EntityType;
    completedEntities: EntityType[];
    failedEntities: EntityType[];
    pendingEntities: EntityType[];
  };

  @ApiProperty({
    description: 'Timestamps',
  })
  timestamps: {
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  };

  @ApiProperty({
    description: 'Last error if any',
    required: false,
  })
  lastError?: {
    message: string;
    code: string;
    timestamp: string;
    entity?: EntityType;
  };

  @ApiProperty({
    description: 'Estimated completion time',
    required: false,
  })
  estimatedCompletion?: string;
}

/**
 * Response for email verification
 */
export class EmailVerificationResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Session ID',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Updated registration status',
    example: 'email_verified',
  })
  status: RegistrationState;

  @ApiProperty({
    description: 'Verification result message',
    example:
      'Email verified successfully. Your registration is now pending admin approval.',
  })
  message: string;

  @ApiProperty({
    description: 'Next steps after verification',
    example: ['Wait for admin approval', 'Check your email for updates'],
  })
  nextSteps: string[];
}

/**
 * Response for admin approval actions
 */
export class AdminApprovalResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Session ID',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Approval decision',
    example: 'approved',
  })
  decision: 'approved' | 'rejected';

  @ApiProperty({
    description: 'Updated registration status',
    example: 'approved',
  })
  status: RegistrationState;

  @ApiProperty({
    description: 'Admin decision message',
    example: 'Registration approved. Entity creation process initiated.',
  })
  message: string;

  @ApiProperty({
    description: 'Admin details',
  })
  admin: {
    email: string;
    timestamp: string;
    reason?: string;
    notes?: string;
  };

  @ApiProperty({
    description: 'Next steps after approval',
    example: [
      'Entity creation in progress',
      'You will be notified when complete',
    ],
  })
  nextSteps: string[];
}

/**
 * Response for completed registration
 */
export class RegistrationCompletedResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Session ID',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Final registration status',
    example: 'completed',
  })
  status: RegistrationState;

  @ApiProperty({
    description: 'Completion message',
    example: 'Registration completed successfully. All entities created.',
  })
  message: string;

  @ApiProperty({
    description: 'Created entities summary',
  })
  createdEntities: {
    account: {
      guid: string;
      businessId: string;
    };
    address: {
      guid: string;
    };
    contact: {
      guid: string;
    };
    identity: {
      guid: string;
    };
    education: {
      guid: string;
      type: 'ot' | 'ota';
    };
    management: {
      guid: string;
    };
  };

  @ApiProperty({
    description: 'User account information for login',
  })
  userAccount: {
    email: string;
    businessId: string;
    status: string;
  };

  @ApiProperty({
    description: 'Registration timestamps',
  })
  timestamps: {
    started: string;
    completed: string;
    duration: string;
  };
}

/**
 * Response for registration errors
 */
export class RegistrationErrorResponseDto {
  @ApiProperty({
    description: 'Success status (always false for errors)',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Session ID if available',
    example: 'reg_1a2b3c4d5e6f7g8h9i0j',
    required: false,
  })
  sessionId?: string;

  @ApiProperty({
    description: 'Error code',
    example: 'ENTITY_CREATION_FAILED',
  })
  code: string;

  @ApiProperty({
    description: 'Error message',
    example: 'Failed to create identity entity after 3 attempts',
  })
  message: string;

  @ApiProperty({
    description: 'Detailed error information',
  })
  details: {
    entity?: EntityType;
    operation?: string;
    timestamp: string;
    retryCount?: number;
    canRetry?: boolean;
  };

  @ApiProperty({
    description: 'Current registration status',
    example: 'failed',
    required: false,
  })
  status?: RegistrationState;

  @ApiProperty({
    description: 'Suggested next steps',
    example: ['Contact support', 'Try registration again'],
  })
  nextSteps: string[];
}
