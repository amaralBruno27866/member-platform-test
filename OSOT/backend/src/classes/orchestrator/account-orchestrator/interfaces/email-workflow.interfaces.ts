/**
 * Email Workflow Interfaces
 *
 * Defines contracts for email verification and admin approval workflows
 * within the orchestrator context. These interfaces provide clear separation
 * between email workflow responsibilities and main orchestrator coordination.
 */

import { RegistrationState } from '../enums/registration-state.enum';

// ========================================
// SERVICE CONTRACTS
// ========================================

/**
 * Main contract for email workflow operations
 *
 * This service handles all email-related aspects of the registration workflow:
 * - Email verification process
 * - Admin approval notifications
 * - Token generation and validation
 * - Session state transitions (email-specific)
 */
export interface IOrchestratorEmailWorkflowService {
  /**
   * Initiate email verification workflow
   *
   * @param sessionId Registration session ID
   * @returns Email verification initiation result
   *
   * Implementation should:
   * 1. Generate verification token
   * 2. Update session with verification data
   * 3. Send verification email
   * 4. Transition session to EMAIL_VERIFICATION_PENDING
   */
  initiateEmailVerification(
    sessionId: string,
  ): Promise<EmailVerificationInitiationResult>;

  /**
   * Process email verification token
   *
   * @param sessionId Registration session ID
   * @param verificationToken Token from email link
   * @returns Email verification result
   *
   * Implementation should:
   * 1. Validate token against session
   * 2. Check attempt limits
   * 3. Update session status to EMAIL_VERIFIED
   * 4. Prepare for admin approval workflow
   */
  verifyEmailToken(
    sessionId: string,
    verificationToken: string,
  ): Promise<EmailVerificationResult>;

  /**
   * Send admin approval request
   *
   * @param sessionId Registration session ID
   * @returns Admin notification result
   *
   * Implementation should:
   * 1. Generate approval/rejection tokens
   * 2. Send admin notification email
   * 3. Update session with approval tokens
   * 4. Transition session to PENDING_APPROVAL
   */
  sendAdminApprovalRequest(sessionId: string): Promise<AdminNotificationResult>;

  /**
   * Process admin approval/rejection
   *
   * @param sessionId Registration session ID
   * @param action Approve or reject action
   * @param adminId Administrator identifier
   * @param reason Optional reason for action
   * @returns Admin approval result
   *
   * Implementation should:
   * 1. Validate admin privileges
   * 2. Process approval/rejection tokens
   * 3. Send user notification
   * 4. Transition session to APPROVED/REJECTED
   */
  processAdminApproval(
    sessionId: string,
    action: EmailWorkflowAction,
    adminId: string,
    reason?: string,
  ): Promise<AdminApprovalResult>;

  /**
   * Resend verification email
   *
   * @param sessionId Registration session ID
   * @returns Resend result
   */
  resendVerificationEmail(sessionId: string): Promise<EmailResendResult>;

  /**
   * Get email workflow status
   *
   * @param sessionId Registration session ID
   * @returns Current email workflow status
   */
  getEmailWorkflowStatus(sessionId: string): Promise<EmailWorkflowStatusResult>;
}

// ========================================
// WORKFLOW TYPES
// ========================================

/**
 * Email workflow actions
 */
export type EmailWorkflowAction = 'approve' | 'reject';

/**
 * Email verification statuses
 */
export type EmailVerificationStatus =
  | 'pending'
  | 'verified'
  | 'failed'
  | 'expired'
  | 'max_attempts_exceeded';

/**
 * Admin approval statuses
 */
export type AdminApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'invalid_token';

// ========================================
// RESULT INTERFACES
// ========================================

/**
 * Base interface for all email workflow results
 */
export interface BaseEmailWorkflowResult {
  success: boolean;
  message: string;
  sessionId: string;
  timestamp: Date;
  errors?: string[];
}

/**
 * Result of email verification initiation
 */
export interface EmailVerificationInitiationResult
  extends BaseEmailWorkflowResult {
  verificationToken: string;
  expiresAt: Date;
  emailSent: boolean;
  nextStep: 'await_email_verification';
  verificationUrl?: string;
}

/**
 * Result of email verification process
 */
export interface EmailVerificationResult extends BaseEmailWorkflowResult {
  status: EmailVerificationStatus;
  nextStep: 'admin_approval' | 'retry_verification' | 'expired' | 'failed';
  verifiedAt?: Date;
  remainingAttempts?: number;
  adminNotificationSent?: boolean;
  isIdempotent?: boolean; // Indicates if this was a duplicate/idempotent request
}

/**
 * Result of admin notification sending
 */
export interface AdminNotificationResult extends BaseEmailWorkflowResult {
  approvalToken: string;
  rejectionToken: string;
  adminEmailsSent: string[];
  userNotificationSent: boolean;
  expiresAt: Date;
  nextStep: 'await_admin_approval';
  approvalUrl?: string;
  rejectionUrl?: string;
}

/**
 * Result of admin approval process
 */
export interface AdminApprovalResult extends BaseEmailWorkflowResult {
  action: EmailWorkflowAction;
  status: AdminApprovalStatus;
  nextStep: 'entity_creation' | 'registration_rejected' | 'failed';
  processedBy: string;
  processedAt: Date;
  reason?: string;
  userNotificationSent?: boolean;
  isIdempotent?: boolean; // Indicates if this was a duplicate/idempotent request
}

/**
 * Result of email resend operation
 */
export interface EmailResendResult extends BaseEmailWorkflowResult {
  newToken: string;
  expiresAt: Date;
  resendCount: number;
  maxResendsReached: boolean;
  nextStep: 'await_email_verification' | 'max_resends_exceeded';
}

/**
 * Current email workflow status
 */
export interface EmailWorkflowStatusResult extends BaseEmailWorkflowResult {
  currentState: RegistrationState;
  emailVerificationStatus?: EmailVerificationStatus;
  adminApprovalStatus?: AdminApprovalStatus;
  verificationAttempts?: number;
  maxVerificationAttempts?: number;
  resendCount?: number;
  maxResends?: number;
  tokensValid?: boolean;
  expiresAt?: Date;
  lastActivity?: Date;
}

// ========================================
// SESSION EXTENSION INTERFACES
// ========================================

/**
 * Email workflow data to be added to registration session
 */
export interface EmailWorkflowSessionData {
  // Email Verification
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
  verificationAttempts?: number;
  maxVerificationAttempts?: number;
  emailVerifiedAt?: Date;
  verificationEmailSent?: boolean;
  resendCount?: number;
  maxResends?: number;

  // Admin Approval
  approvalToken?: string;
  rejectionToken?: string;
  approvalTokensExpiresAt?: Date;
  adminNotificationSent?: boolean;
  adminEmailsSent?: string[];
  approvedBy?: string;
  rejectedBy?: string;
  approvalProcessedAt?: Date;
  approvalReason?: string;

  // User Notifications
  userPendingNotificationSent?: boolean;
  userStatusNotificationSent?: boolean;

  // Workflow State
  emailWorkflowStartedAt?: Date;
  emailWorkflowCompletedAt?: Date;
  emailWorkflowLastActivity?: Date;
}

// ========================================
// CONFIGURATION INTERFACES
// ========================================

/**
 * Email workflow configuration
 */
export interface EmailWorkflowConfig {
  // Verification settings
  verificationTokenTTL: number; // seconds
  maxVerificationAttempts: number;
  maxResends: number;

  // Approval settings
  approvalTokenTTL: number; // seconds
  adminEmails: string[];

  // Email templates
  templates: {
    verification: string;
    adminApproval: string;
    userPending: string;
    userApproved: string;
    userRejected: string;
  };

  // URLs
  verificationBaseUrl: string;
  approvalBaseUrl: string;
  userLoginUrl: string;
  frontendUrl: string;
}

/**
 * Email template data interface
 */
export interface EmailTemplateData {
  userName: string;
  userEmail: string;
  sessionId: string;
  token?: string;
  approvalUrl?: string;
  rejectionUrl?: string;
  reason?: string;
  adminName?: string;
  expiresAt?: Date;
  [key: string]: any;
}
