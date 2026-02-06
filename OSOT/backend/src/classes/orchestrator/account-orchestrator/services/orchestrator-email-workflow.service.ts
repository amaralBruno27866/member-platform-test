/**
 * Orchestrator Email Workflow Service
 *
 * Specialized service that handles all email-related aspects of the registration workflow.
 * This service is responsible for email verification, admin approval notifications,
 * and coordinating the email workflow state transitions within the orchestrator context.
 *
 * Responsibilities:
 * - Email verification token generation and validation
 * - Admin approval workflow coordination
 * - Email template preparation and sending
 * - Session state transitions (email-specific)
 * - Token lifecycle management
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  IOrchestratorEmailWorkflowService,
  EmailVerificationInitiationResult,
  EmailVerificationResult,
  AdminNotificationResult,
  AdminApprovalResult,
  EmailResendResult,
  EmailWorkflowStatusResult,
  EmailWorkflowAction,
  EmailVerificationStatus,
  AdminApprovalStatus,
  EmailWorkflowConfig,
  EmailWorkflowSessionData,
} from '../interfaces/email-workflow.interfaces.js';
import { RegistrationState } from '../enums/registration-state.enum';
import { OrchestratorRepository } from '../repositories/orchestrator.repository';
import { EmailService } from '../../../../emails/email.service';
import { RegistrationSessionDto } from '../dtos/registration-session.dto';
import { AccountCrudService } from '../../../user-account/account/services/account-crud.service';
import { AccountOrchestratorService } from './account-orchestrator.service';

@Injectable()
export class OrchestratorEmailWorkflowService
  implements IOrchestratorEmailWorkflowService
{
  private readonly logger = new Logger(OrchestratorEmailWorkflowService.name);

  // Email workflow configuration
  private readonly config: EmailWorkflowConfig = {
    verificationTokenTTL: 3600, // 1 hour
    maxVerificationAttempts: 3,
    maxResends: 3,
    approvalTokenTTL: 604800, // 7 days
    adminEmails: this.getAdminEmails(),
    templates: {
      verification: 'email-verification',
      adminApproval: 'admin-approval',
      userPending: 'account-created-pending',
      userApproved: 'account-approved-active',
      userRejected: 'account-rejected-inactive',
    },
    verificationBaseUrl:
      process.env.EMAIL_VERIFICATION_BASE_URL ||
      'https://app.osot.ca/verify-email',
    approvalBaseUrl:
      process.env.ADMIN_APPROVAL_BASE_URL || 'https://admin.osot.ca/approve',
    userLoginUrl: process.env.USER_LOGIN_URL || 'https://app.osot.ca/login',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  };

  constructor(
    private readonly orchestratorRepository: OrchestratorRepository,
    private readonly emailService: EmailService,
    private readonly accountCrudService: AccountCrudService,
    @Inject(forwardRef(() => AccountOrchestratorService))
    private readonly accountOrchestratorService: AccountOrchestratorService,
  ) {}

  // ========================================
  // PUBLIC WORKFLOW METHODS
  // ========================================

  /**
   * Initiate email verification workflow
   */
  async initiateEmailVerification(
    sessionId: string,
  ): Promise<EmailVerificationInitiationResult> {
    const operationId = this.generateOperationId();
    this.logger.log(
      `[${operationId}] Initiating email verification for session: ${sessionId}`,
    );

    try {
      // 1. Get and validate session
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        throw new NotFoundException(
          'Registration session not found or expired',
        );
      }

      // 2. Validate session state
      if (session.status !== RegistrationState.STAGED) {
        throw new ConflictException(
          `Cannot initiate email verification from state: ${session.status}. Expected: ${RegistrationState.STAGED}`,
        );
      }

      // 3. Generate verification token
      const verificationToken = this.generateSecureToken('verify');
      const expiresAt = new Date(
        Date.now() + this.config.verificationTokenTTL * 1000,
      );

      // 4. Update session with email verification data
      const emailWorkflowData: EmailWorkflowSessionData = {
        verificationToken,
        verificationTokenExpiresAt: expiresAt,
        verificationAttempts: 0,
        maxVerificationAttempts: this.config.maxVerificationAttempts,
        resendCount: 0,
        maxResends: this.config.maxResends,
        emailWorkflowStartedAt: new Date(),
        emailWorkflowLastActivity: new Date(),
      };

      // 5. Transition session state and add email data
      await this.updateSessionWithEmailData(
        sessionId,
        emailWorkflowData,
        RegistrationState.EMAIL_VERIFICATION_PENDING,
      );

      // 6. Send verification email
      const emailSent = await this.sendVerificationEmail(
        session,
        verificationToken,
      );

      // 7. Update session with email sent status
      if (emailSent) {
        await this.updateSessionEmailData(sessionId, {
          verificationEmailSent: true,
        });
      }

      this.logger.log(
        `[${operationId}] Email verification initiated successfully for session: ${sessionId}`,
      );

      return {
        success: true,
        message: 'Email verification initiated successfully',
        sessionId,
        timestamp: new Date(),
        verificationToken,
        expiresAt,
        emailSent,
        nextStep: 'await_email_verification',
        verificationUrl: this.buildVerificationUrl(verificationToken),
      };
    } catch (error) {
      this.logger.error(
        `[${operationId}] Failed to initiate email verification: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process email verification token
   */
  async verifyEmailToken(
    sessionId: string,
    verificationToken: string,
  ): Promise<EmailVerificationResult> {
    const operationId = this.generateOperationId();
    this.logger.log(
      `[${operationId}] Processing email verification for session: ${sessionId}`,
    );

    try {
      // 1. Get and validate session
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        throw new NotFoundException(
          'Registration session not found or expired',
        );
      }

      // 2. Validate session state (idempotent - allow if already verified)
      if (session.status === RegistrationState.EMAIL_VERIFIED) {
        // Email already verified - return success (idempotent operation)
        this.logger.log(
          `[${operationId}] Email already verified for session: ${sessionId} - returning success (idempotent)`,
        );
        return {
          success: true,
          message: 'Email already verified',
          sessionId,
          timestamp: new Date(),
          status: 'already_verified' as EmailVerificationStatus,
          nextStep: 'admin_approval',
          isIdempotent: true,
        };
      }

      if (session.status !== RegistrationState.EMAIL_VERIFICATION_PENDING) {
        throw new ConflictException(
          `Cannot verify email from state: ${session.status}. Expected: ${RegistrationState.EMAIL_VERIFICATION_PENDING}`,
        );
      }

      // 3. Validate email workflow data exists
      const emailData = this.getEmailWorkflowData(session);
      if (!emailData.verificationToken) {
        throw new ConflictException(
          'No verification token found for this session',
        );
      }

      // 4. Check token expiration
      if (
        emailData.verificationTokenExpiresAt &&
        new Date() > emailData.verificationTokenExpiresAt
      ) {
        await this.handleExpiredVerification(sessionId);
        return {
          success: false,
          message: 'Verification token has expired',
          sessionId,
          timestamp: new Date(),
          status: 'expired' as EmailVerificationStatus,
          nextStep: 'expired',
        };
      }

      // 5. Check verification attempts
      const attempts = emailData.verificationAttempts || 0;
      const maxAttempts =
        emailData.maxVerificationAttempts ||
        this.config.maxVerificationAttempts;

      if (attempts >= maxAttempts) {
        return {
          success: false,
          message: 'Maximum verification attempts exceeded',
          sessionId,
          timestamp: new Date(),
          status: 'max_attempts_exceeded' as EmailVerificationStatus,
          nextStep: 'failed',
        };
      }

      // 6. Validate token
      if (emailData.verificationToken !== verificationToken) {
        await this.incrementVerificationAttempts(sessionId);

        const remainingAttempts = maxAttempts - (attempts + 1);
        return {
          success: false,
          message: 'Invalid verification token',
          sessionId,
          timestamp: new Date(),
          status: 'failed' as EmailVerificationStatus,
          nextStep: remainingAttempts > 0 ? 'retry_verification' : 'failed',
          remainingAttempts,
        };
      }

      // 7. Email verification successful - update session
      const verifiedAt = new Date();
      await this.updateSessionWithEmailData(
        sessionId,
        {
          emailVerifiedAt: verifiedAt,
          emailWorkflowLastActivity: verifiedAt,
        },
        RegistrationState.EMAIL_VERIFIED,
      );

      // 8. Create entities in Dataverse with PENDING status
      this.logger.log(
        `[${operationId}] Creating entities in Dataverse with pending status for session: ${sessionId}`,
      );

      const entityCreationResult =
        await this.createEntitiesWithPendingStatus(sessionId);

      if (!entityCreationResult.success) {
        // If entity creation fails, we can't proceed
        this.logger.error(
          `[${operationId}] Failed to create entities for session: ${sessionId}`,
        );
        return {
          success: false,
          message: 'Failed to create account in system',
          sessionId,
          timestamp: new Date(),
          status: 'failed' as EmailVerificationStatus,
          nextStep: 'failed',
        };
      }

      // 9. Store account GUID for future updates
      if (entityCreationResult.accountGuid) {
        await this.orchestratorRepository.storeAccountGuid(
          sessionId,
          entityCreationResult.accountGuid,
        );
      }

      // 10. Mark session data as persisted (could clean up heavy data later)
      // TODO: Consider implementing partial cleanup - keep metadata, remove heavy user data
      this.logger.log(
        `[${operationId}] User data now safely persisted in Dataverse for session: ${sessionId}`,
      );

      // 11. Initiate admin approval workflow
      const adminNotificationResult =
        await this.sendAdminApprovalRequest(sessionId);

      this.logger.log(
        `[${operationId}] Email verification completed successfully for session: ${sessionId}`,
      );

      return {
        success: true,
        message: 'Email verification completed successfully',
        sessionId,
        timestamp: new Date(),
        status: 'verified' as EmailVerificationStatus,
        nextStep: 'admin_approval',
        verifiedAt,
        adminNotificationSent: adminNotificationResult.success,
      };
    } catch (error) {
      this.logger.error(
        `[${operationId}] Failed to verify email: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Send admin approval request
   */
  async sendAdminApprovalRequest(
    sessionId: string,
  ): Promise<AdminNotificationResult> {
    const operationId = this.generateOperationId();
    this.logger.log(
      `[${operationId}] Sending admin approval request for session: ${sessionId}`,
    );

    try {
      // 1. Get and validate session
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        throw new NotFoundException(
          'Registration session not found or expired',
        );
      }

      // 2. Validate session state
      if (session.status !== RegistrationState.EMAIL_VERIFIED) {
        throw new ConflictException(
          `Cannot send admin approval from state: ${session.status}. Expected: ${RegistrationState.EMAIL_VERIFIED}`,
        );
      }

      // 3. Generate approval tokens
      const approvalToken = this.generateSecureToken('approve');
      const rejectionToken = this.generateSecureToken('reject');
      const expiresAt = new Date(
        Date.now() + this.config.approvalTokenTTL * 1000,
      );

      // 4. Send admin notification emails
      const adminEmailsSent = await this.sendAdminNotificationEmails(
        session,
        approvalToken,
        rejectionToken,
      );

      // 4.5. Send user account created notification
      const userNotificationSent =
        await this.sendUserAccountCreatedNotification(session);

      // 5. Update session with approval data
      await this.updateSessionWithEmailData(
        sessionId,
        {
          approvalToken,
          rejectionToken,
          approvalTokensExpiresAt: expiresAt,
          adminNotificationSent: true,
          adminEmailsSent,
          userPendingNotificationSent: userNotificationSent,
          emailWorkflowLastActivity: new Date(),
        },
        RegistrationState.PENDING_APPROVAL,
      );

      this.logger.log(
        `[${operationId}] Admin approval request sent successfully for session: ${sessionId}`,
      );

      return {
        success: true,
        message: 'Admin approval request sent successfully',
        sessionId,
        timestamp: new Date(),
        approvalToken,
        rejectionToken,
        adminEmailsSent,
        userNotificationSent,
        expiresAt,
        nextStep: 'await_admin_approval',
        approvalUrl: this.buildApprovalUrl(approvalToken),
        rejectionUrl: this.buildRejectionUrl(rejectionToken),
      };
    } catch (error) {
      this.logger.error(
        `[${operationId}] Failed to send admin approval request: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process admin approval/rejection
   */
  async processAdminApproval(
    sessionId: string,
    action: EmailWorkflowAction,
    adminId: string,
    reason?: string,
  ): Promise<AdminApprovalResult> {
    const operationId = this.generateOperationId();
    this.logger.log(
      `[${operationId}] Processing admin ${action} for session: ${sessionId}`,
    );

    try {
      // 1. Get and validate session
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        throw new NotFoundException(
          'Registration session not found or expired',
        );
      }

      // 2. Validate session state (idempotent - allow if already processed)
      if (
        session.status === RegistrationState.APPROVED ||
        session.status === RegistrationState.REJECTED
      ) {
        // Already processed - return success (idempotent operation)
        const existingAction =
          session.status === RegistrationState.APPROVED ? 'approve' : 'reject';

        // Check if the requested action matches the existing state
        if (action !== existingAction) {
          throw new ConflictException(
            `Cannot ${action} registration that has already been ${existingAction}d`,
          );
        }

        this.logger.log(
          `[${operationId}] Registration already ${existingAction}d for session: ${sessionId} - returning success (idempotent)`,
        );

        const emailData = this.getEmailWorkflowData(session);
        return {
          success: true,
          message: `Registration already ${existingAction}d`,
          sessionId,
          timestamp: new Date(),
          action,
          status:
            action === 'approve'
              ? ('approved' as AdminApprovalStatus)
              : ('rejected' as AdminApprovalStatus),
          nextStep:
            action === 'approve' ? 'entity_creation' : 'registration_rejected',
          processedBy: emailData.approvedBy || emailData.rejectedBy || adminId,
          processedAt: emailData.approvalProcessedAt || new Date(),
          reason: emailData.approvalReason,
          userNotificationSent: true,
          isIdempotent: true,
        };
      }

      if (session.status !== RegistrationState.PENDING_APPROVAL) {
        throw new ConflictException(
          `Cannot process approval from state: ${session.status}. Expected: ${RegistrationState.PENDING_APPROVAL}`,
        );
      }

      // 3. Validate approval tokens exist
      const emailData = this.getEmailWorkflowData(session);
      if (!emailData.approvalToken || !emailData.rejectionToken) {
        throw new ConflictException(
          'No approval tokens found for this session',
        );
      }

      // 4. Check token expiration
      if (
        emailData.approvalTokensExpiresAt &&
        new Date() > emailData.approvalTokensExpiresAt
      ) {
        await this.handleExpiredApproval(sessionId);
        return {
          success: false,
          message: 'Approval tokens have expired',
          sessionId,
          timestamp: new Date(),
          action,
          status: 'expired' as AdminApprovalStatus,
          nextStep: 'failed',
          processedBy: adminId,
          processedAt: new Date(),
        };
      }

      // 5. Process approval/rejection
      const processedAt = new Date();
      const newState =
        action === 'approve'
          ? RegistrationState.APPROVED
          : RegistrationState.REJECTED;
      const status =
        action === 'approve'
          ? ('approved' as AdminApprovalStatus)
          : ('rejected' as AdminApprovalStatus);

      // 6. Update session with approval result
      const approvalData: EmailWorkflowSessionData = {
        [`${action === 'approve' ? 'approved' : 'rejected'}By`]: adminId,
        approvalProcessedAt: processedAt,
        approvalReason:
          reason ||
          `${action === 'approve' ? 'Approved' : 'Rejected'} by administrator`,
        emailWorkflowLastActivity: processedAt,
      };

      if (action === 'approve') {
        approvalData.emailWorkflowCompletedAt = processedAt;
      }

      await this.updateSessionWithEmailData(sessionId, approvalData, newState);

      // NOTE: User notification will be sent AFTER entity creation is confirmed

      this.logger.log(
        `[${operationId}] Admin ${action} processed successfully for session: ${sessionId}`,
      );

      return {
        success: true,
        message: `Registration ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
        sessionId,
        timestamp: new Date(),
        action,
        status,
        nextStep:
          action === 'approve' ? 'entity_creation' : 'registration_rejected',
        processedBy: adminId,
        processedAt,
        reason:
          reason ||
          `${action === 'approve' ? 'Approved' : 'Rejected'} by administrator`,
        userNotificationSent: false, // Will be sent after entity creation
      };
    } catch (error) {
      this.logger.error(
        `[${operationId}] Failed to process admin approval: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process admin approval/rejection using approval token
   */
  async processAdminApprovalByToken(
    approvalToken: string,
    action: EmailWorkflowAction,
  ): Promise<AdminApprovalResult> {
    const operationId = this.generateOperationId();
    this.logger.log(
      `[${operationId}] Processing admin ${action} with token: ${approvalToken}`,
    );

    try {
      // 1. Find session by approval token
      const session = await this.findSessionByApprovalToken(approvalToken);
      if (!session) {
        throw new NotFoundException(
          'Registration session not found or approval token expired',
        );
      }

      // 2. Validate token matches the requested action
      const emailData = this.getEmailWorkflowData(session);
      const isValidToken =
        action === 'approve'
          ? emailData.approvalToken === approvalToken
          : emailData.rejectionToken === approvalToken;

      if (!isValidToken) {
        throw new ConflictException(`Invalid ${action} token for this session`);
      }

      // 3. Process the approval using the existing method
      return await this.processAdminApproval(
        session.sessionId,
        action,
        'system_admin', // Default admin ID for token-based approvals
      );
    } catch (error) {
      this.logger.error(
        `[${operationId}] Failed to process admin approval by token: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(sessionId: string): Promise<EmailResendResult> {
    const operationId = this.generateOperationId();
    this.logger.log(
      `[${operationId}] Resending verification email for session: ${sessionId}`,
    );

    try {
      // 1. Get and validate session
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        throw new NotFoundException(
          'Registration session not found or expired',
        );
      }

      // 2. Validate session state
      if (session.status !== RegistrationState.EMAIL_VERIFICATION_PENDING) {
        throw new ConflictException(
          `Cannot resend email from state: ${session.status}. Expected: ${RegistrationState.EMAIL_VERIFICATION_PENDING}`,
        );
      }

      // 3. Check resend limits
      const emailData = this.getEmailWorkflowData(session);
      const resendCount = emailData.resendCount || 0;
      const maxResends = emailData.maxResends || this.config.maxResends;

      if (resendCount >= maxResends) {
        return {
          success: false,
          message: 'Maximum resend limit reached',
          sessionId,
          timestamp: new Date(),
          newToken: '',
          expiresAt: new Date(),
          resendCount,
          maxResendsReached: true,
          nextStep: 'max_resends_exceeded',
        };
      }

      // 4. Generate new token
      const newToken = this.generateSecureToken('verify');
      const expiresAt = new Date(
        Date.now() + this.config.verificationTokenTTL * 1000,
      );

      // 5. Update session with new token and increment resend count
      await this.updateSessionEmailData(sessionId, {
        verificationToken: newToken,
        verificationTokenExpiresAt: expiresAt,
        resendCount: resendCount + 1,
        verificationAttempts: 0, // Reset attempts for new token
        emailWorkflowLastActivity: new Date(),
      });

      // 6. Send new verification email
      await this.sendVerificationEmail(session, newToken);

      this.logger.log(
        `[${operationId}] Verification email resent successfully for session: ${sessionId}`,
      );

      return {
        success: true,
        message: 'Verification email resent successfully',
        sessionId,
        timestamp: new Date(),
        newToken,
        expiresAt,
        resendCount: resendCount + 1,
        maxResendsReached: false,
        nextStep: 'await_email_verification',
      };
    } catch (error) {
      this.logger.error(
        `[${operationId}] Failed to resend verification email: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get email workflow status
   */
  async getEmailWorkflowStatus(
    sessionId: string,
  ): Promise<EmailWorkflowStatusResult> {
    const operationId = this.generateOperationId();
    this.logger.log(
      `[${operationId}] Getting email workflow status for session: ${sessionId}`,
    );

    try {
      // 1. Get session
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        throw new NotFoundException(
          'Registration session not found or expired',
        );
      }

      // 2. Extract email workflow data
      const emailData = this.getEmailWorkflowData(session);

      // 3. Determine current statuses
      const emailVerificationStatus = this.determineEmailVerificationStatus(
        session.status,
        emailData,
      );
      const adminApprovalStatus = this.determineAdminApprovalStatus(
        session.status,
        emailData,
      );

      // 4. Check token validity
      const tokensValid = this.areTokensValid(emailData);

      return {
        success: true,
        message: 'Email workflow status retrieved successfully',
        sessionId,
        timestamp: new Date(),
        currentState: session.status,
        emailVerificationStatus,
        adminApprovalStatus,
        verificationAttempts: emailData.verificationAttempts,
        maxVerificationAttempts: emailData.maxVerificationAttempts,
        resendCount: emailData.resendCount,
        maxResends: emailData.maxResends,
        tokensValid,
        expiresAt: this.getRelevantExpirationDate(emailData),
        lastActivity: emailData.emailWorkflowLastActivity,
      };
    } catch (error) {
      this.logger.error(
        `[${operationId}] Failed to get email workflow status: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private generateSecureToken(prefix: string): string {
    const randomPart = randomBytes(32).toString('hex');
    return `${prefix}_${randomPart}`;
  }

  private generateOperationId(): string {
    return randomBytes(8).toString('hex');
  }

  private getAdminEmails(): string[] {
    const adminEmailsString =
      process.env.REGISTRATION_ADMIN_EMAILS || 'admin@osot.ca';
    return adminEmailsString.split(',').map((email) => email.trim());
  }

  private buildVerificationUrl(token: string): string {
    return `${this.config.verificationBaseUrl}?token=${token}`;
  }

  private buildApprovalUrl(token: string): string {
    // Check if approvalBaseUrl already contains '/approve' path (backend endpoint)
    // Backend format: http://localhost:3000/public/orchestrator/admin/approve
    // Frontend format: http://localhost:5173/admin/approve-account
    const isBackendUrl = this.config.approvalBaseUrl.includes(
      '/public/orchestrator',
    );

    if (isBackendUrl) {
      // Backend endpoint expects: /approve/:token (no query params)
      return `${this.config.approvalBaseUrl}/${token}`;
    } else {
      // Frontend expects: /approve-account?token=XXX&action=approve
      return `${this.config.approvalBaseUrl}?token=${token}&action=approve`;
    }
  }

  private buildRejectionUrl(token: string): string {
    const isBackendUrl = this.config.approvalBaseUrl.includes(
      '/public/orchestrator',
    );

    if (isBackendUrl) {
      // Backend has separate reject endpoint
      const baseUrl = this.config.approvalBaseUrl.replace(
        '/approve',
        '/reject',
      );
      return `${baseUrl}/${token}`;
    } else {
      return `${this.config.approvalBaseUrl}?token=${token}&action=reject`;
    }
  }

  // TODO: Implement these helper methods in next iteration
  private async updateSessionWithEmailData(
    sessionId: string,
    emailData: EmailWorkflowSessionData,
    newState: RegistrationState,
  ): Promise<any> {
    // Implementation will merge email data with existing session and update state
    const session = await this.orchestratorRepository.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Merge email data with existing session and ensure Date objects are converted to strings
    const processedEmailData = Object.fromEntries(
      Object.entries(emailData).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : value,
      ]),
    );

    const updatedSession = {
      ...session,
      ...processedEmailData,
      status: newState,
      updatedAt: new Date().toISOString(),
    };

    // Update session in repository
    return await this.orchestratorRepository.updateSession(
      sessionId,
      updatedSession,
    );
  }

  private async updateSessionEmailData(
    sessionId: string,
    emailData: Partial<EmailWorkflowSessionData>,
  ): Promise<void> {
    // Implementation will update only email workflow data
    const session = await this.orchestratorRepository.getSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Process Date objects to strings for DTO compatibility
    const processedEmailData = Object.fromEntries(
      Object.entries(emailData).map(([key, value]) => [
        key,
        value instanceof Date ? value.toISOString() : value,
      ]),
    );

    // Merge only email workflow data (partial update)
    const updatedSession = {
      ...session,
      ...processedEmailData,
      updatedAt: new Date().toISOString(),
    };

    await this.orchestratorRepository.updateSession(sessionId, updatedSession);
  }

  private getEmailWorkflowData(session: any): EmailWorkflowSessionData {
    // Implementation will extract email workflow data from session
    // Convert string dates back to Date objects for workflow logic
    // Note: Using any type here is acceptable as session data structure is dynamic
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    /* eslint-disable @typescript-eslint/no-unsafe-argument */
    const convertToDate = (
      dateString: string | Date | undefined,
    ): Date | undefined => {
      if (!dateString) return undefined;
      return dateString instanceof Date ? dateString : new Date(dateString);
    };

    return {
      // Email Verification
      verificationToken: session.verificationToken,
      verificationTokenExpiresAt: convertToDate(
        session.verificationTokenExpiresAt,
      ),
      verificationAttempts: session.verificationAttempts || 0,
      maxVerificationAttempts:
        session.maxVerificationAttempts || this.config.maxVerificationAttempts,
      emailVerifiedAt: convertToDate(session.emailVerifiedAt),
      verificationEmailSent: session.verificationEmailSent || false,
      resendCount: session.resendCount || 0,
      maxResends: session.maxResends || this.config.maxResends,

      // Admin Approval
      approvalToken: session.approvalToken,
      rejectionToken: session.rejectionToken,
      approvalTokensExpiresAt: convertToDate(session.approvalTokensExpiresAt),
      adminNotificationSent: session.adminNotificationSent || false,
      adminEmailsSent: session.adminEmailsSent || [],
      approvedBy: session.approvedBy,
      rejectedBy: session.rejectedBy,
      approvalProcessedAt: convertToDate(session.approvalProcessedAt),
      approvalReason: session.approvalReason,

      // User Notifications
      userPendingNotificationSent: session.userPendingNotificationSent || false,
      userStatusNotificationSent: session.userStatusNotificationSent || false,

      // Workflow State
      emailWorkflowStartedAt: convertToDate(session.emailWorkflowStartedAt),
      emailWorkflowCompletedAt: convertToDate(session.emailWorkflowCompletedAt),
      emailWorkflowLastActivity: convertToDate(
        session.emailWorkflowLastActivity,
      ),
    };
  }

  private async sendVerificationEmail(
    session: any,
    token: string,
  ): Promise<boolean> {
    // Implementation will prepare and send verification email
    try {
      // Extract user data from session
      const userData = session.userData || {};
      const userEmail = userData.account?.osot_email || userData.email;
      const userName =
        `${userData.account?.osot_first_name || userData.firstName || ''} ${userData.account?.osot_last_name || userData.lastName || ''}`.trim();

      if (!userEmail) {
        this.logger.error('No user email found in session for verification');
        return false;
      }

      // Build verification URL
      const verificationUrl = this.buildVerificationUrl(token);

      // Prepare template variables
      const templateVars = {
        userName: userName || 'User',
        userEmail,
        verificationUrl,
        sessionId: session.sessionId, // Para o template {{sessionId}}
        token: token, // Para o template {{token}}
        verificationToken: token, // Mantém compatibilidade
        expirationTime: '1 hour',
        supportEmail: 'support@osot.ca',
        loginUrl: this.config.userLoginUrl,
        frontendUrl: this.config.frontendUrl, // Frontend URL para os botões
      };

      // Send verification email using EmailService
      await this.emailService.sendEmail(
        userEmail,
        'Email Verification - OSOT Registration',
        this.config.templates.verification,
        templateVars,
      );

      this.logger.log(`Verification email sent successfully to: ${userEmail}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send verification email: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async sendAdminNotificationEmails(
    session: any,
    approvalToken: string,
    rejectionToken: string,
  ): Promise<string[]> {
    // Implementation will send admin notification emails
    const sentEmails: string[] = [];

    try {
      // Extract user data from session
      const userData = session.userData || {};
      const userEmail = userData.account?.osot_email || userData.email;
      const userName =
        `${userData.account?.osot_first_name || userData.firstName || ''} ${userData.account?.osot_last_name || userData.lastName || ''}`.trim();

      // Build approval URLs
      const approvalUrl = this.buildApprovalUrl(approvalToken);
      const rejectionUrl = this.buildRejectionUrl(rejectionToken);

      // Prepare template variables for admin notification
      const templateVars = {
        userName: userName || 'User',
        userEmail: userEmail || 'Unknown',
        sessionId: session.sessionId,
        registrationDate: new Date().toLocaleDateString(),
        approvalUrl,
        rejectionUrl,
        approvalToken,
        rejectionToken,
        expirationDays: Math.ceil(this.config.approvalTokenTTL / 86400), // Convert to days
        adminPortalUrl: this.config.approvalBaseUrl,
        frontendUrl: this.config.frontendUrl, // Frontend URL para os botões
        // Complete registration data
        accountData: userData.account
          ? {
              firstName: userData.account.osot_first_name,
              lastName: userData.account.osot_last_name,
              email: userData.account.osot_email,
              phone: userData.account.osot_mobile_phone,
              dateOfBirth: userData.account.osot_date_of_birth,
            }
          : null,
        addressData: userData.address
          ? {
              street: `${userData.address.osot_address_1 || ''} ${
                userData.address.osot_address_2 || ''
              }`.trim(),
              city: userData.address.osot_city,
              province: userData.address.osot_province,
              postalCode: userData.address.osot_postal_code,
              country: userData.address.osot_country,
              otherCity: userData.address.osot_other_city,
              otherProvince: userData.address.osot_other_province_state,
            }
          : null,
        contactData: userData.contact
          ? {
              email: userData.contact.osot_secondary_email,
              jobTitle: userData.contact.osot_job_title,
              homePhone: userData.contact.osot_home_phone,
              workPhone: userData.contact.osot_work_phone,
              website: userData.contact.osot_business_website,
              facebook: userData.contact.osot_facebook,
              instagram: userData.contact.osot_instagram,
              tiktok: userData.contact.osot_tiktok,
              linkedin: userData.contact.osot_linkedin,
            }
          : null,
        identityData: userData.identity
          ? {
              chosenName: userData.identity.osot_chosen_name,
              language: userData.identity.osot_language,
              gender: userData.identity.osot_gender,
              race: userData.identity.osot_race,
              indigenous: userData.identity.osot_indigenous,
              indigenousDetail: userData.identity.osot_indigenous_detail,
              indigenousDetailOther:
                userData.identity.osot_indigenous_detail_other,
              disability: userData.identity.osot_disability,
            }
          : null,
        educationData:
          userData.otEducation || userData.otaEducation
            ? {
                type: userData.otEducation ? 'OT' : 'OTA',
                cotoStatus: userData.otEducation?.osot_coto_status,
                cotoRegistration: userData.otEducation?.osot_coto_registration,
                degreeType:
                  userData.otEducation?.osot_ot_degree_type ||
                  userData.otaEducation?.osot_ota_degree_type,
                university: userData.otEducation?.osot_ot_university,
                college: userData.otaEducation?.osot_ota_college,
                gradYear:
                  userData.otEducation?.osot_ot_grad_year ||
                  userData.otaEducation?.osot_ota_grad_year,
                country:
                  userData.otEducation?.osot_ot_country ||
                  userData.otaEducation?.osot_ota_country,
                other:
                  userData.otEducation?.osot_ot_other ||
                  userData.otaEducation?.osot_ota_other,
                workDeclaration: userData.otaEducation?.osot_work_declaration,
              }
            : null,
      };

      // Send to each admin email
      for (const adminEmail of this.config.adminEmails) {
        try {
          await this.emailService.sendEmail(
            adminEmail,
            'New Registration Pending Approval - OSOT',
            this.config.templates.adminApproval,
            templateVars,
          );

          sentEmails.push(adminEmail);
          this.logger.log(`Admin notification sent to: ${adminEmail}`);
        } catch (emailError) {
          this.logger.error(
            `Failed to send admin notification to ${adminEmail}: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
          );
        }
      }

      return sentEmails;
    } catch (error) {
      this.logger.error(
        `Failed to send admin notifications: ${error instanceof Error ? error.message : String(error)}`,
      );
      return sentEmails;
    }
  }

  private async sendUserStatusNotification(
    session: any,
    action: EmailWorkflowAction,
    reason?: string,
  ): Promise<boolean> {
    // Implementation will send user status notification
    try {
      // Extract user data from session
      const userData = session.userData || {};
      const userEmail = userData.account?.osot_email || userData.email;
      const userName =
        `${userData.account?.osot_first_name || userData.firstName || ''} ${userData.account?.osot_last_name || userData.lastName || ''}`.trim();

      if (!userEmail) {
        this.logger.error(
          'No user email found in session for status notification',
        );
        return false;
      }

      // Determine template and subject based on action
      const isApproved = action === 'approve';
      const templateName = isApproved
        ? this.config.templates.userApproved
        : this.config.templates.userRejected;

      const subject = isApproved
        ? 'Registration Approved - Welcome to OSOT!'
        : 'Registration Status Update - OSOT';

      // Prepare template variables
      const templateVars = {
        userName: userName || 'User',
        userEmail,
        action: isApproved ? 'approved' : 'rejected',
        actionPastTense: isApproved ? 'approved' : 'rejected',
        reason:
          reason ||
          (isApproved
            ? 'Your registration has been approved by our administrators.'
            : 'Your registration has been reviewed by our administrators.'),
        loginUrl: isApproved ? this.config.userLoginUrl : undefined,
        supportEmail: 'support@osot.ca',
        frontendUrl: this.config.frontendUrl, // Frontend URL para os botões
        nextSteps: isApproved
          ? 'You can now log into your account and access all member features.'
          : 'If you have questions about this decision, please contact our support team.',
        // Add complete registration data for transparency
        accountData: userData.account
          ? {
              firstName: userData.account.osot_first_name || userData.firstName,
              lastName: userData.account.osot_last_name || userData.lastName,
              email: userData.account.osot_email || userData.email,
              phone: userData.account.osot_phone || userData.phone,
              preferredLanguage: userData.account.osot_preferred_language,
            }
          : null,
        addressData: userData.address
          ? {
              street: userData.address.osot_street_address,
              city: userData.address.osot_city,
              province: userData.address.osot_province,
              postalCode: userData.address.osot_postal_code,
              country: userData.address.osot_country,
            }
          : null,
        contactData: userData.contact
          ? {
              email: userData.contact.osot_email_address,
              phone: userData.contact.osot_phone_number,
              alternatePhone: userData.contact.osot_alternate_phone,
              linkedIn: userData.contact.osot_linkedin_profile,
            }
          : null,
        identityData: userData.identity
          ? {
              firstName: userData.identity.osot_first_name,
              lastName: userData.identity.osot_last_name,
              birthDate: userData.identity.osot_birth_date,
              documentType: userData.identity.osot_identification_type,
              documentNumber: userData.identity.osot_identification_number,
              gender: userData.identity.osot_gender,
            }
          : null,
        educationData: userData.education
          ? {
              level: userData.education.osot_education_level,
              institution: userData.education.osot_education_institution,
              course: userData.education.osot_course_program,
              graduationYear: userData.education.osot_graduation_year,
              degree: userData.education.osot_degree_certification,
              registrationNumber: userData.education.osot_registration_number,
            }
          : null,
      };

      // Send status notification email
      await this.emailService.sendEmail(
        userEmail,
        subject,
        templateName,
        templateVars,
      );

      this.logger.log(
        `User ${action} notification sent successfully to: ${userEmail}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send user status notification: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async incrementVerificationAttempts(
    sessionId: string,
  ): Promise<void> {
    // Implementation will increment verification attempts counter
    try {
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const currentAttempts = session.verificationAttempts || 0;
      await this.updateSessionEmailData(sessionId, {
        verificationAttempts: currentAttempts + 1,
        emailWorkflowLastActivity: new Date(),
      });

      this.logger.debug(
        `Incremented verification attempts for session ${sessionId}: ${currentAttempts + 1}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment verification attempts: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async sendUserAccountCreatedNotification(
    session: any,
  ): Promise<boolean> {
    try {
      // Extract user data from session
      const userData = session.userData || {};
      const userEmail = userData.account?.osot_email || userData.email;
      const userName =
        `${userData.account?.osot_first_name || userData.firstName || ''} ${userData.account?.osot_last_name || userData.lastName || ''}`.trim();

      if (!userEmail) {
        this.logger.error(
          'No user email found in session for account created notification',
        );
        return false;
      }

      // Prepare template variables for account created notification
      const templateVars = {
        userName: userName || 'User',
        userEmail,
        accountId: session.sessionId, // Using sessionId as account identifier
        creationDate: new Date().toLocaleDateString(),
        frontendUrl: this.config.frontendUrl, // Frontend URL para os botões
        // Complete registration data for user transparency
        accountData: userData.account
          ? {
              firstName: userData.account.osot_first_name,
              lastName: userData.account.osot_last_name,
              email: userData.account.osot_email,
              phone: userData.account.osot_mobile_phone,
              dateOfBirth: userData.account.osot_date_of_birth,
            }
          : null,
        addressData: userData.address
          ? {
              street: `${userData.address.osot_address_1 || ''} ${
                userData.address.osot_address_2 || ''
              }`.trim(),
              city: userData.address.osot_city,
              province: userData.address.osot_province,
              postalCode: userData.address.osot_postal_code,
              country: userData.address.osot_country,
              otherCity: userData.address.osot_other_city,
              otherProvince: userData.address.osot_other_province_state,
            }
          : null,
        contactData: userData.contact
          ? {
              email: userData.contact.osot_secondary_email,
              jobTitle: userData.contact.osot_job_title,
              homePhone: userData.contact.osot_home_phone,
              workPhone: userData.contact.osot_work_phone,
              website: userData.contact.osot_business_website,
              facebook: userData.contact.osot_facebook,
              instagram: userData.contact.osot_instagram,
              tiktok: userData.contact.osot_tiktok,
              linkedin: userData.contact.osot_linkedin,
            }
          : null,
        identityData: userData.identity
          ? {
              chosenName: userData.identity.osot_chosen_name,
              language: userData.identity.osot_language,
              gender: userData.identity.osot_gender,
              race: userData.identity.osot_race,
              indigenous: userData.identity.osot_indigenous,
              indigenousDetail: userData.identity.osot_indigenous_detail,
              indigenousDetailOther:
                userData.identity.osot_indigenous_detail_other,
              disability: userData.identity.osot_disability,
            }
          : null,
        educationData:
          userData.otEducation || userData.otaEducation
            ? {
                type: userData.otEducation ? 'OT' : 'OTA',
                cotoStatus: userData.otEducation?.osot_coto_status,
                cotoRegistration: userData.otEducation?.osot_coto_registration,
                degreeType:
                  userData.otEducation?.osot_ot_degree_type ||
                  userData.otaEducation?.osot_ota_degree_type,
                university: userData.otEducation?.osot_ot_university,
                college: userData.otaEducation?.osot_ota_college,
                gradYear:
                  userData.otEducation?.osot_ot_grad_year ||
                  userData.otaEducation?.osot_ota_grad_year,
                country:
                  userData.otEducation?.osot_ot_country ||
                  userData.otaEducation?.osot_ota_country,
                other:
                  userData.otEducation?.osot_ot_other ||
                  userData.otaEducation?.osot_ota_other,
                workDeclaration: userData.otaEducation?.osot_work_declaration,
              }
            : null,
      };

      // Send account created notification email
      await this.emailService.sendEmail(
        userEmail,
        'Account Created - OSOT Registration',
        this.config.templates.userPending,
        templateVars,
      );

      this.logger.log(
        `Account created notification sent successfully to: ${userEmail}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send account created notification: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async handleExpiredVerification(sessionId: string): Promise<void> {
    // Implementation will handle expired verification tokens
    try {
      await this.updateSessionEmailData(sessionId, {
        emailWorkflowLastActivity: new Date(),
      });

      this.logger.warn(`Verification token expired for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle expired verification: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async handleExpiredApproval(sessionId: string): Promise<void> {
    // Implementation will handle expired approval tokens
    try {
      await this.updateSessionEmailData(sessionId, {
        emailWorkflowLastActivity: new Date(),
      });

      this.logger.warn(`Approval tokens expired for session: ${sessionId}`);
    } catch (error) {
      this.logger.error(
        `Failed to handle expired approval: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private determineEmailVerificationStatus(
    state: RegistrationState,
    emailData: EmailWorkflowSessionData,
  ): EmailVerificationStatus | undefined {
    // Implementation will determine current email verification status
    switch (state) {
      case RegistrationState.EMAIL_VERIFICATION_PENDING: {
        // Check if token is expired
        if (
          emailData.verificationTokenExpiresAt &&
          new Date() > emailData.verificationTokenExpiresAt
        ) {
          return 'expired';
        }

        // Check if max attempts exceeded
        const attempts = emailData.verificationAttempts || 0;
        const maxAttempts =
          emailData.maxVerificationAttempts ||
          this.config.maxVerificationAttempts;
        if (attempts >= maxAttempts) {
          return 'max_attempts_exceeded';
        }

        return 'pending';
      }

      case RegistrationState.EMAIL_VERIFIED:
      case RegistrationState.PENDING_APPROVAL:
      case RegistrationState.APPROVED:
      case RegistrationState.COMPLETED:
        return 'verified';

      case RegistrationState.REJECTED:
      case RegistrationState.FAILED:
        return 'failed';

      default:
        return undefined;
    }
  }

  private determineAdminApprovalStatus(
    state: RegistrationState,
    emailData: EmailWorkflowSessionData,
  ): AdminApprovalStatus | undefined {
    // Implementation will determine current admin approval status
    switch (state) {
      case RegistrationState.PENDING_APPROVAL: {
        // Check if approval tokens are expired
        if (
          emailData.approvalTokensExpiresAt &&
          new Date() > emailData.approvalTokensExpiresAt
        ) {
          return 'expired';
        }
        return 'pending';
      }

      case RegistrationState.APPROVED:
      case RegistrationState.COMPLETED:
        return 'approved';

      case RegistrationState.REJECTED:
        return 'rejected';

      case RegistrationState.FAILED:
        return 'invalid_token';

      default:
        return undefined;
    }
  }

  private areTokensValid(emailData: EmailWorkflowSessionData): boolean {
    // Implementation will check if current tokens are valid
    const now = new Date();

    // Check verification token validity
    if (emailData.verificationToken && emailData.verificationTokenExpiresAt) {
      if (now <= emailData.verificationTokenExpiresAt) {
        return true;
      }
    }

    // Check approval tokens validity
    if (
      (emailData.approvalToken || emailData.rejectionToken) &&
      emailData.approvalTokensExpiresAt
    ) {
      if (now <= emailData.approvalTokensExpiresAt) {
        return true;
      }
    }

    // No valid tokens found
    return false;
  }

  private getRelevantExpirationDate(
    emailData: EmailWorkflowSessionData,
  ): Date | undefined {
    // Implementation will return the most relevant expiration date
    const now = new Date();

    // If we have an active verification token, return its expiration
    if (
      emailData.verificationToken &&
      emailData.verificationTokenExpiresAt &&
      emailData.verificationTokenExpiresAt > now
    ) {
      return emailData.verificationTokenExpiresAt;
    }

    // If we have active approval tokens, return their expiration
    if (
      (emailData.approvalToken || emailData.rejectionToken) &&
      emailData.approvalTokensExpiresAt &&
      emailData.approvalTokensExpiresAt > now
    ) {
      return emailData.approvalTokensExpiresAt;
    }

    // No active tokens, return undefined
    return undefined;
  }

  /**
   * Send user notification after entity creation is confirmed
   */
  async sendPostEntityCreationNotification(
    sessionId: string,
    action: EmailWorkflowAction,
    reason?: string,
  ): Promise<{ success: boolean; message: string }> {
    const operationId = this.generateOperationId();
    this.logger.log(
      `[${operationId}] Sending post-entity-creation notification for session: ${sessionId}`,
    );

    try {
      // Get session data
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        throw new NotFoundException('Session not found');
      }

      // Send user notification
      const userNotificationSent = await this.sendUserStatusNotification(
        session,
        action,
        reason,
      );

      if (userNotificationSent) {
        await this.updateSessionEmailData(sessionId, {
          userStatusNotificationSent: true,
        });
      }

      return {
        success: userNotificationSent,
        message: userNotificationSent
          ? 'User notification sent successfully'
          : 'Failed to send user notification',
      };
    } catch (error) {
      this.logger.error(
        `[${operationId}] Failed to send post-entity-creation notification: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        message: `Failed to send notification: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Create entities in Dataverse with PENDING status
   */
  private async createEntitiesWithPendingStatus(sessionId: string): Promise<{
    success: boolean;
    accountGuid?: string;
    accountId?: string;
    error?: string;
  }> {
    try {
      this.logger.log(
        `Creating ALL entities with PENDING status for session: ${sessionId}`,
      );

      // Get session data
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        return {
          success: false,
          error: 'Session not found',
        };
      }

      // NOTE: Account status will be set to PENDING by the orchestrator
      // System fields are managed internally by business rules

      // Use the existing comprehensive entity creation method
      const result =
        await this.accountOrchestratorService.createBasicAccountEntity(
          session.userData,
          sessionId,
        );

      // Convert the result format - only success if ALL entities created without failures
      const hasFailedEntities =
        result.failedEntities && result.failedEntities.length > 0;

      if (result.success && !hasFailedEntities) {
        this.logger.log(
          `✅ ALL entities created successfully with PENDING status. Account ID: ${result.accountId}`,
        );
        this.logger.log(
          `📋 Created entities: ${result.createdEntities?.join(', ')}`,
        );

        return {
          success: true,
          accountGuid: result.accountGuid,
          accountId: result.accountId,
        };
      } else {
        // Log the reason for failure
        if (hasFailedEntities) {
          this.logger.error(
            `❌ Entity creation incomplete - some entities failed: ${result.failedEntities?.join(', ')}`,
          );
          this.logger.log(
            `📋 Successfully created entities: ${result.createdEntities?.join(', ') || 'none'}`,
          );
        }

        return {
          success: false,
          error: hasFailedEntities
            ? `Failed to create some entities: ${result.failedEntities?.join(', ')}`
            : result.error || 'Failed to create entities in Dataverse',
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to create entities with pending status for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Find session by approval token
   */
  private async findSessionByApprovalToken(
    approvalToken: string,
  ): Promise<RegistrationSessionDto | null> {
    this.logger.log(
      `Searching for session with approval token: ${approvalToken}`,
    );

    try {
      // Get all active sessions and search for the one with matching token
      const sessions =
        await this.orchestratorRepository.getActiveSessions(1000);

      for (const session of sessions) {
        const emailData = this.getEmailWorkflowData(session);

        // Check if this session has the matching approval or rejection token
        if (
          emailData.approvalToken === approvalToken ||
          emailData.rejectionToken === approvalToken
        ) {
          // Verify token hasn't expired
          if (
            emailData.approvalTokensExpiresAt &&
            new Date() > emailData.approvalTokensExpiresAt
          ) {
            this.logger.warn(
              `Found session ${session.sessionId} but token is expired`,
            );
            return null;
          }

          this.logger.log(
            `Found session ${session.sessionId} for approval token`,
          );
          return session;
        }
      }

      this.logger.warn(`No session found for approval token: ${approvalToken}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error searching for session by approval token: ${error}`,
      );
      return null;
    }
  }
}
