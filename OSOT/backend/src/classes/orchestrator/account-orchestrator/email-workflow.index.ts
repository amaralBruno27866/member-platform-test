/**
 * Email Workflow Module Exports
 *
 * Central export point for email workflow functionality within the orchestrator.
 * This module provides email verification and admin approval capabilities
 * that can be integrated with the main orchestrator workflow.
 */

// ========================================
// SERVICE EXPORTS
// ========================================
export { OrchestratorEmailWorkflowService } from './services/orchestrator-email-workflow.service';

// ========================================
// INTERFACE EXPORTS
// ========================================
export type {
  IOrchestratorEmailWorkflowService,
  EmailWorkflowAction,
  EmailVerificationStatus,
  AdminApprovalStatus,
  EmailVerificationInitiationResult,
  EmailVerificationResult,
  AdminNotificationResult,
  AdminApprovalResult,
  EmailResendResult,
  EmailWorkflowStatusResult,
  EmailWorkflowConfig,
  EmailWorkflowSessionData,
  EmailTemplateData,
} from './interfaces/email-workflow.interfaces';

// ========================================
// DTO EXPORTS
// ========================================
export {
  EmailVerificationRequestDto,
  AdminApprovalRequestDto,
  EmailResendRequestDto,
  AdminApprovalByTokenDto,
  BaseEmailWorkflowResponseDto,
  EmailVerificationInitiationResponseDto,
  EmailVerificationResponseDto,
  AdminNotificationResponseDto,
  AdminApprovalResponseDto,
  EmailResendResponseDto,
  EmailWorkflowStatusResponseDto,
  EmailTemplatePreparationDto,
  TokenGenerationDto,
} from './dtos/email-workflow.dtos';

// Import types for use in helpers
import type { EmailWorkflowConfig } from './interfaces/email-workflow.interfaces';
import { randomBytes } from 'crypto';

// ========================================
// UTILITY EXPORTS
// ========================================

/**
 * User data interface for email template formatting
 */
export interface UserDataForTemplates {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Email workflow constants
 */
export const EMAIL_WORKFLOW_CONSTANTS = {
  DEFAULT_VERIFICATION_TTL: 3600, // 1 hour in seconds
  DEFAULT_APPROVAL_TTL: 604800, // 7 days in seconds
  DEFAULT_MAX_VERIFICATION_ATTEMPTS: 3,
  DEFAULT_MAX_RESENDS: 3,
  TOKEN_PREFIXES: {
    VERIFICATION: 'verify',
    APPROVAL: 'approve',
    REJECTION: 'reject',
  },
  EMAIL_TEMPLATES: {
    VERIFICATION: 'email-verification',
    ADMIN_APPROVAL: 'admin-approval',
    USER_PENDING: 'account-created-pending',
    USER_APPROVED: 'account-approved-active',
    USER_REJECTED: 'account-rejected-inactive',
  },
} as const;

/**
 * Email workflow helper functions
 */
export class EmailWorkflowHelpers {
  /**
   * Generate secure token with prefix
   */
  static generateToken(prefix: string, length = 32): string {
    return `${prefix}_${randomBytes(length).toString('hex')}`;
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Calculate time remaining for token
   */
  static getTimeRemaining(expiresAt: Date): number {
    const now = new Date().getTime();
    const expiry = expiresAt.getTime();
    return Math.max(0, expiry - now);
  }

  /**
   * Format email template data
   */
  static formatTemplateData(
    sessionId: string,
    userData: UserDataForTemplates,
    additionalData: Record<string, any> = {},
  ): Record<string, any> {
    return {
      sessionId,
      userName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      userEmail: userData.email || '',
      registrationDate: new Date().toLocaleDateString(),
      ...additionalData,
    };
  }

  /**
   * Validate email workflow configuration
   */
  static validateConfig(config: Partial<EmailWorkflowConfig>): boolean {
    const required = [
      'verificationTokenTTL',
      'approvalTokenTTL',
      'maxVerificationAttempts',
      'maxResends',
      'adminEmails',
    ];

    return required.every(
      (field) => config[field as keyof EmailWorkflowConfig] !== undefined,
    );
  }
}
