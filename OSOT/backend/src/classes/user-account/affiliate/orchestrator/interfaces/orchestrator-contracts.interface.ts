import { CreateAffiliateDto } from '../../dtos/create-affiliate.dto';
import { AffiliateInternal } from '../../interfaces/affiliate-internal.interface';
import { Privilege } from '../../../../../common/enums/privilege.enum';
import { ErrorCodes } from '../../../../../common/errors/error-codes';

/**
 * Affiliate Orchestrator Integration Contracts
 *
 * These interfaces define the contract between the Affiliate module and
 * the future Registration Orchestrator that will be built.
 *
 * The Affiliate module provides all necessary services (AffiliateBusinessRuleService,
 * AffiliateCrudService, AffiliateLookupService) but the orchestrator is responsible for:
 * - Session management in Redis
 * - Email verification workflows
 * - Admin approval processes
 * - Cross-module coordination
 * - Registration workflow orchestration
 */

// ========================================
// ORCHESTRATOR INTERFACE CONTRACT
// ========================================

/**
 * Interface that the future orchestrator must implement
 * for affiliate registration workflows
 */
export interface AffiliateOrchestrator {
  /**
   * Stage affiliate registration data in Redis
   *
   * @param dto Affiliate registration data
   * @returns Registration session information
   *
   * Implementation should:
   * 1. Validate using AffiliateBusinessRuleService.validateAffiliateCreation()
   * 2. Hash password using AffiliateBusinessRuleService.hashAffiliatePassword()
   * 3. Validate email uniqueness using AffiliateBusinessRuleService.validateEmailUniqueness()
   * 4. Store in Redis with key: affiliate_session:{sessionId}
   * 5. Set TTL (suggested: 24 hours)
   * 6. Emit AffiliateStageEvent via event system
   */
  stageRegistration(
    dto: CreateAffiliateDto,
  ): Promise<AffiliateRegistrationStageResult>;

  /**
   * Verify affiliate email and update session status
   *
   * @param sessionId Registration session ID
   * @param verificationToken Email verification token
   * @returns Verification result
   *
   * Implementation should:
   * 1. Retrieve session from Redis
   * 2. Validate verification token
   * 3. Update session status to EMAIL_VERIFIED
   * 4. Notify admins for approval
   * 5. Emit AffiliateEmailVerifiedEvent
   */
  verifyEmail(
    sessionId: string,
    verificationToken: string,
  ): Promise<AffiliateEmailVerificationResult>;

  /**
   * Process admin approval/rejection for affiliate registration
   *
   * @param sessionId Registration session ID
   * @param adminId ID of the admin making the decision
   * @param approved Whether the registration is approved
   * @param rejectionReason Optional reason for rejection
   * @returns Approval result
   *
   * Implementation should:
   * 1. Validate admin privileges (ADMIN or OWNER)
   * 2. Update session status to ADMIN_APPROVED or ADMIN_REJECTED
   * 3. If approved, trigger account creation
   * 4. If rejected, notify applicant
   * 5. Emit AffiliateApprovalEvent
   */
  processAdminApproval(
    sessionId: string,
    adminId: string,
    approved: boolean,
    rejectionReason?: string,
  ): Promise<AffiliateApprovalResult>;

  /**
   * Create affiliate account after approval
   *
   * @param sessionId Registration session ID
   * @returns Account creation result
   *
   * Implementation should:
   * 1. Retrieve approved session from Redis
   * 2. Create affiliate using AffiliateCrudService.createAffiliate()
   * 3. Update session status to ACCOUNT_CREATED
   * 4. Clean up Redis session
   * 5. Send welcome email
   * 6. Emit AffiliateCreatedEvent
   */
  createAffiliateAccount(
    sessionId: string,
  ): Promise<AffiliateAccountCreationResult>;

  /**
   * Get registration session status
   *
   * @param sessionId Registration session ID
   * @returns Current session status and progress
   */
  getRegistrationStatus(
    sessionId: string,
  ): Promise<AffiliateRegistrationStatus>;

  /**
   * Cancel registration workflow
   *
   * @param sessionId Registration session ID
   * @param reason Cancellation reason
   * @returns Cancellation result
   */
  cancelRegistration(
    sessionId: string,
    reason: string,
  ): Promise<AffiliateCancellationResult>;

  /**
   * Resend verification email
   *
   * @param sessionId Registration session ID
   * @returns Resend result
   */
  resendVerificationEmail(
    sessionId: string,
  ): Promise<AffiliateEmailResendResult>;

  /**
   * List pending affiliate registrations (admin only)
   *
   * @param adminPrivilege Admin privilege level
   * @param filters Optional filters for the list
   * @returns List of pending registrations
   */
  listPendingRegistrations(
    adminPrivilege: Privilege,
    filters?: AffiliateRegistrationFilters,
  ): Promise<AffiliatePendingRegistrationsList>;
}

// ========================================
// RESULT TYPE DEFINITIONS
// ========================================

export interface AffiliateRegistrationStageResult {
  success: boolean;
  sessionId: string;
  expiresAt: Date;
  verificationEmailSent: boolean;
  message: string;
  errorCode?: ErrorCodes;
}

export interface AffiliateEmailVerificationResult {
  success: boolean;
  sessionId: string;
  emailVerified: boolean;
  adminNotified: boolean;
  message: string;
  errorCode?: ErrorCodes;
}

export interface AffiliateApprovalResult {
  success: boolean;
  sessionId: string;
  approved: boolean;
  processedBy: string;
  processedAt: Date;
  rejectionReason?: string;
  accountCreationTriggered?: boolean;
  message: string;
  errorCode?: ErrorCodes;
}

export interface AffiliateAccountCreationResult {
  success: boolean;
  sessionId: string;
  affiliateId?: string;
  affiliate?: AffiliateInternal;
  welcomeEmailSent: boolean;
  sessionCleanedUp: boolean;
  message: string;
  errorCode?: ErrorCodes;
}

export interface AffiliateRegistrationStatus {
  sessionId: string;
  status: AffiliateRegistrationStatusEnum;
  progress: AffiliateProgressState;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  affiliateData: {
    organizationName: string;
    email: string;
    area: number;
    city?: string;
    province?: string;
    country?: string;
  };
  adminNotes?: string[];
  errorMessages?: string[];
}

export interface AffiliateCancellationResult {
  success: boolean;
  sessionId: string;
  reason: string;
  sessionCleanedUp: boolean;
  message: string;
}

export interface AffiliateEmailResendResult {
  success: boolean;
  sessionId: string;
  emailSent: boolean;
  attemptsRemaining: number;
  message: string;
  errorCode?: ErrorCodes;
}

export interface AffiliatePendingRegistrationsList {
  total: number;
  registrations: AffiliateRegistrationStatus[];
  filters: AffiliateRegistrationFilters;
}

// ========================================
// SUPPORTING TYPES
// ========================================

export enum AffiliateRegistrationStatusEnum {
  PENDING = 'pending',
  STAGED = 'staged',
  EMAIL_VERIFIED = 'email_verified',
  ADMIN_APPROVED = 'admin_approved',
  ADMIN_REJECTED = 'admin_rejected',
  ACCOUNT_CREATED = 'account_created',
  CREATION_FAILED = 'creation_failed',
  WORKFLOW_COMPLETED = 'workflow_completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface AffiliateProgressState {
  staged: boolean;
  emailVerified: boolean;
  adminApproval: boolean;
  accountCreated: boolean;
  workflowCompleted: boolean;
}

export interface AffiliateRegistrationFilters {
  status?: AffiliateRegistrationStatusEnum[];
  area?: number[];
  city?: string[];
  province?: string[];
  country?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// ========================================
// EVENT TYPE DEFINITIONS
// ========================================

export interface AffiliateStageEvent {
  sessionId: string;
  organizationName: string;
  email: string;
  area: number;
  timestamp: Date;
}

export interface AffiliateEmailVerifiedEvent {
  sessionId: string;
  organizationName: string;
  email: string;
  verifiedAt: Date;
  adminNotificationSent: boolean;
}

export interface AffiliateApprovalEvent {
  sessionId: string;
  organizationName: string;
  email: string;
  approved: boolean;
  processedBy: string;
  processedAt: Date;
  rejectionReason?: string;
}

export interface AffiliateCreatedEvent {
  sessionId: string;
  affiliateId: string;
  organizationName: string;
  email: string;
  area: number;
  createdAt: Date;
  welcomeEmailSent: boolean;
}

// ========================================
// SERVICE INTEGRATION HELPERS
// ========================================

/**
 * Helper interface for integrating with affiliate services
 * These are the services the orchestrator should inject and use
 */
export interface AffiliateServiceIntegration {
  businessRuleService: {
    validateAffiliateCreation: (
      dto: CreateAffiliateDto,
      userPrivilege: Privilege,
    ) => Promise<boolean>;
    validateEmailUniqueness: (email: string) => Promise<boolean>;
    hashAffiliatePassword: (password: string) => Promise<string>;
  };
  crudService: {
    createAffiliate: (
      data: CreateAffiliateDto,
      userPrivilege?: Privilege,
    ) => Promise<AffiliateInternal>;
  };
  lookupService: {
    findByEmail: (
      email: string,
      userPrivilege?: Privilege,
    ) => Promise<AffiliateInternal | null>;
  };
}

/**
 * Configuration interface for the orchestrator
 */
export interface AffiliateOrchestratorConfig {
  redis: {
    sessionKeyPrefix: string; // Default: 'affiliate_session:'
    sessionTtlHours: number; // Default: 24
  };
  email: {
    verificationTemplateId: string;
    welcomeTemplateId: string;
    adminNotificationTemplateId: string;
    maxResendAttempts: number; // Default: 3
  };
  workflow: {
    requireAdminApproval: boolean; // Default: true
    autoCreateOnApproval: boolean; // Default: true
    cleanupCompletedSessions: boolean; // Default: true
  };
}
