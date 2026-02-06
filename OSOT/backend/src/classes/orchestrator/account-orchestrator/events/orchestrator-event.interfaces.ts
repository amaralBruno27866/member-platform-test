/**
 * Orchestrator Event Interfaces
 *
 * Defines all event types emitted during the user registration workflow.
 * These events provide observability and enable reactive programming patterns.
 */

import { RegistrationState } from '../enums/registration-state.enum';
import { OrchestratorValidationErrorType } from '../enums/orchestrator-validation-error-type.enum';

/**
 * Base interface for all orchestrator events
 */
export interface BaseOrchestratorEvent {
  sessionId: string;
  timestamp: Date;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    source?: string;
    [key: string]: any;
  };
}

/**
 * Event emitted when registration process is initiated
 */
export interface RegistrationInitiatedEvent extends BaseOrchestratorEvent {
  email: string;
  firstName: string;
  lastName: string;
  educationType: 'ot' | 'ota';
  expiresAt: Date;
}

/**
 * Event emitted when validation is completed (success or failure)
 */
export interface RegistrationValidatedEvent extends BaseOrchestratorEvent {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
  errorType?: OrchestratorValidationErrorType;
  validationDuration?: number; // in milliseconds
}

/**
 * Event emitted when registration data is staged in Redis
 */
export interface RegistrationStagedEvent extends BaseOrchestratorEvent {
  email: string;
  status: RegistrationState;
  progressPercentage: number;
  expiresAt: Date;
}

/**
 * Event emitted when registration status changes
 */
export interface RegistrationStatusChangedEvent extends BaseOrchestratorEvent {
  email: string;
  previousStatus: RegistrationState;
  newStatus: RegistrationState;
  changedBy?: string;
  reason?: string;
}

/**
 * Event emitted when admin approves registration
 */
export interface RegistrationApprovedEvent extends BaseOrchestratorEvent {
  email: string;
  approvedBy: string;
  approvalNotes?: string;
}

/**
 * Event emitted when admin rejects registration
 */
export interface RegistrationRejectedEvent extends BaseOrchestratorEvent {
  email: string;
  rejectedBy: string;
  rejectionReason: string;
  rejectionNotes?: string;
}

/**
 * Event emitted when a registration stage is completed
 */
export interface RegistrationStageCompletedEvent extends BaseOrchestratorEvent {
  email: string;
  stageName: string;
  entityType:
    | 'account'
    | 'address'
    | 'contact'
    | 'identity'
    | 'education'
    | 'management';
  entityId?: string;
  progressPercentage: number;
  duration?: number; // in milliseconds
}

/**
 * Event emitted when a registration stage fails
 */
export interface RegistrationStageFailedEvent extends BaseOrchestratorEvent {
  email: string;
  stageName: string;
  entityType:
    | 'account'
    | 'address'
    | 'contact'
    | 'identity'
    | 'education'
    | 'management';
  error: string;
  errorCode?: string;
  retryable: boolean;
}

/**
 * Event emitted when complete registration workflow is finished successfully
 */
export interface RegistrationCompletedEvent extends BaseOrchestratorEvent {
  email: string;
  accountId: string;
  createdEntities: {
    account?: string;
    address?: string;
    contact?: string;
    identity?: string;
    education?: string;
    management?: string;
  };
  totalDuration?: number; // in milliseconds
  finalStatus: RegistrationState;
}

/**
 * Event emitted when registration workflow fails completely
 */
export interface RegistrationFailedEvent extends BaseOrchestratorEvent {
  email: string;
  error: string;
  errorCode?: string;
  stage?: string;
  partialEntities?: {
    account?: string;
    address?: string;
    contact?: string;
    identity?: string;
    education?: string;
    management?: string;
  };
  totalDuration?: number; // in milliseconds
}

/**
 * Event emitted when registration session expires
 */
export interface RegistrationExpiredEvent extends BaseOrchestratorEvent {
  email: string;
  originalStatus: RegistrationState;
  expirationReason: 'timeout' | 'manual' | 'cleanup';
}

/**
 * Event emitted for email verification status
 */
export interface EmailVerificationEvent extends BaseOrchestratorEvent {
  email: string;
  verified: boolean;
  verificationMethod?: 'link' | 'code' | 'manual';
  verificationToken?: string;
  expiresAt?: Date;
}

/**
 * Union type of all orchestrator events
 */
export type OrchestratorEvent =
  | RegistrationInitiatedEvent
  | RegistrationValidatedEvent
  | RegistrationStagedEvent
  | RegistrationStatusChangedEvent
  | RegistrationApprovedEvent
  | RegistrationRejectedEvent
  | RegistrationStageCompletedEvent
  | RegistrationStageFailedEvent
  | RegistrationCompletedEvent
  | RegistrationFailedEvent
  | RegistrationExpiredEvent
  | EmailVerificationEvent;

/**
 * Event type names for easy reference
 */
export const ORCHESTRATOR_EVENT_TYPES = {
  REGISTRATION_INITIATED: 'registration.initiated',
  REGISTRATION_VALIDATED: 'registration.validated',
  REGISTRATION_STAGED: 'registration.staged',
  REGISTRATION_STATUS_CHANGED: 'registration.status.changed',
  REGISTRATION_APPROVED: 'registration.approved',
  REGISTRATION_REJECTED: 'registration.rejected',
  REGISTRATION_STAGE_COMPLETED: 'registration.stage.completed',
  REGISTRATION_STAGE_FAILED: 'registration.stage.failed',
  REGISTRATION_COMPLETED: 'registration.completed',
  REGISTRATION_FAILED: 'registration.failed',
  REGISTRATION_EXPIRED: 'registration.expired',
  EMAIL_VERIFICATION: 'email.verification',
} as const;

export type OrchestratorEventType =
  (typeof ORCHESTRATOR_EVENT_TYPES)[keyof typeof ORCHESTRATOR_EVENT_TYPES];
