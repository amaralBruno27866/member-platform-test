/**
 * Session Mappers
 *
 * Data transformation utilities for session management in the Account Orchestrator.
 * Handles session creation, status updates, and workflow state transitions.
 */

import {
  CompleteUserRegistrationDto,
  RegistrationSessionDto,
  RegistrationState,
} from '../index';
import { ProgressMapper } from './progress.mappers';

// ========================================
// SESSION MAPPING
// ========================================

/**
 * Maps registration data to session objects and handles session lifecycle
 */
export class SessionMapper {
  /**
   * Create initial session from registration data
   */
  static toInitialSession(
    sessionId: string,
    registrationData: CompleteUserRegistrationDto,
    expiresAt: Date,
  ): RegistrationSessionDto {
    const now = new Date().toISOString();

    return {
      sessionId,
      status: 'staged' as RegistrationState,
      userData: registrationData,
      progress: ProgressMapper.toInitialProgress(),
      createdAt: now,
      updatedAt: now,
      expiresAt: expiresAt.toISOString(),
      retryCount: 0,
    };
  }

  /**
   * Update session status
   */
  static updateStatus(
    session: RegistrationSessionDto,
    newStatus: RegistrationState,
    additionalData?: Partial<RegistrationSessionDto>,
  ): RegistrationSessionDto {
    return {
      ...session,
      ...additionalData,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add email verification data
   */
  static withEmailVerification(
    session: RegistrationSessionDto,
    token: string,
  ): RegistrationSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      emailVerificationToken: token,
      emailVerificationSentAt: now,
      updatedAt: now,
    };
  }

  /**
   * Mark email as verified
   */
  static markEmailVerified(
    session: RegistrationSessionDto,
  ): RegistrationSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      status: 'email_verified' as RegistrationState,
      emailVerifiedAt: now,
      updatedAt: now,
    };
  }

  /**
   * Add admin approval data
   */
  static withAdminApproval(
    session: RegistrationSessionDto,
    token: string,
  ): RegistrationSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      status: 'pending_approval' as RegistrationState,
      approvalToken: token,
      adminApprovalRequestedAt: now,
      updatedAt: now,
    };
  }

  /**
   * Process admin decision
   */
  static withAdminDecision(
    session: RegistrationSessionDto,
    approved: boolean,
    adminEmail: string,
    reason?: string,
  ): RegistrationSessionDto {
    const now = new Date().toISOString();
    return {
      ...session,
      status: approved
        ? ('approved' as RegistrationState)
        : ('rejected' as RegistrationState),
      approvalProcessedAt: now,
      approvedBy: approved ? adminEmail : undefined,
      rejectedBy: !approved ? adminEmail : undefined,
      approvalReason: reason,
      updatedAt: now,
    };
  }

  /**
   * Add error to session
   */
  static withError(
    session: RegistrationSessionDto,
    error: {
      message: string;
      code: string;
      entity?: string;
      details?: any;
    },
  ): RegistrationSessionDto {
    return {
      ...session,
      status: 'failed' as RegistrationState,
      lastError: {
        ...error,
        timestamp: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
  }
}
