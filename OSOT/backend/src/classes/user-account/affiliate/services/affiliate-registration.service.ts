/**
 * Affiliate Registration Service
 *
 * PURPOSE:
 * - Orchestrates the complete affiliate registration workflow
 * - Manages Redis sessions for temporary data storage
 * - Handles email verification and admin approval process
 * - Integrates with existing affiliate services (CRUD, Auth, BusinessRules)
 *
 * WORKFLOW (3-Stage Process):
 * 1. stageRegistration() - Store data in Redis, send verification email
 * 2. verifyEmail() - Validate token, create affiliate with PENDING status, notify admins
 * 3. processApproval() - Handle admin approval/rejection, update affiliate status
 *
 * DEPENDENCIES:
 * - RedisService (session management)
 * - EmailService (verification + admin notifications)
 * - AffiliateCrudService (final persistence)
 * - AffiliateBusinessRuleService (validation)
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateAffiliateDto } from '../dtos/create-affiliate.dto';
import { RedisService } from '../../../../redis/redis.service';
import { EmailService } from '../../../../emails/email.service';
import { AffiliateCrudService } from './affiliate-crud.service';
import { AffiliateBusinessRuleService } from './affiliate-business-rule.service';
import { AccountStatus } from '../../../../common/enums/account-status.enum';
import { Privilege, AccessModifier } from '../../../../common/enums';
import { randomBytes } from 'crypto';

// Import label constants for readable display
import {
  AFFILIATE_AREAS_LABELS,
  AFFILIATE_PROVINCES_LABELS,
  AFFILIATE_COUNTRIES_LABELS,
} from '../constants/affiliate.constants';
import { getCityDisplayName } from '../../../../common/enums/cities.enum';

// Registration Session Interface
export interface AffiliateRegistrationSession {
  sessionId: string;
  status:
    | 'staged'
    | 'email_verified'
    | 'affiliate_pending'
    | 'admin_approved'
    | 'admin_rejected'
    | 'completed'
    | 'expired';
  affiliateData: CreateAffiliateDto;

  // Email verification
  verificationToken: string;
  verificationAttempts: number;
  maxVerificationAttempts: number;
  emailVerifiedAt?: Date;

  // Affiliate persistence
  affiliateId?: string;
  affiliateCreatedAt?: Date;

  // Admin approval
  approvalToken?: string;
  rejectionToken?: string;
  adminNotificationSent?: boolean;
  userPendingNotificationSent?: boolean;
  approvedBy?: string;
  rejectedBy?: string;
  approvalReason?: string;
  approvedAt?: Date;
  rejectedAt?: Date;

  // Timestamps
  createdAt: Date;
  lastUpdatedAt: Date;
  expiresAt: Date;
}

// Response Interfaces
export interface AffiliateRegistrationStageResult {
  success: boolean;
  message: string;
  sessionId: string;
  status: string;
  nextStep: string;
  expiresAt?: Date;
  verificationEmailSent?: boolean;
  errors?: string[];
}

export interface AffiliateVerificationResult {
  success: boolean;
  message: string;
  sessionId: string;
  affiliateId?: string;
  status: string;
  nextStep: string;
  adminNotificationSent?: boolean;
  errors?: string[];
}

export interface AffiliateApprovalResult {
  success: boolean;
  message: string;
  sessionId: string;
  affiliateId?: string;
  status: string;
  action: 'approve' | 'reject';
  processedBy?: string;
  reason?: string;
  processedAt?: Date;
  errors?: string[];
}

@Injectable()
export class AffiliateRegistrationService {
  private readonly logger = new Logger(AffiliateRegistrationService.name);

  // Session configuration
  private readonly REDIS_KEY_PREFIX = 'affiliate_registration:';
  private readonly SESSION_EXPIRY_HOURS = 72; // 3 days for affiliate approval process
  private readonly MAX_VERIFICATION_ATTEMPTS = 3;
  private readonly VERIFICATION_TOKEN_LENGTH = 64;

  constructor(
    private readonly redisService: RedisService,
    private readonly emailService: EmailService,
    private readonly crudService: AffiliateCrudService,
    private readonly businessRuleService: AffiliateBusinessRuleService,
  ) {
    this.logger.log('Affiliate Registration Service initialized');
  }

  /**
   * Stage 1: Stage affiliate registration data in Redis
   * - Validate input data
   * - Check for duplicates (email, organization name)
   * - Store in Redis with verification token
   * - Send verification email
   */
  async stageRegistration(
    dto: CreateAffiliateDto,
  ): Promise<AffiliateRegistrationStageResult> {
    const operationId = `stage_affiliate_${Date.now()}`;
    this.logger.log(`Starting affiliate registration staging - ${operationId}`);

    try {
      // Business rule validation
      await this.businessRuleService.validateAffiliateCreation(
        dto,
        Privilege.OWNER,
      );

      // Check for existing affiliates (email and organization name uniqueness)
      const emailExists =
        await this.businessRuleService.validateEmailUniqueness(
          dto.osot_affiliate_email || '',
        );
      if (!emailExists) {
        throw new ConflictException(
          'Email address is already registered with another affiliate',
        );
      }

      // Check for existing active sessions for this email to prevent duplicates
      const existingSession = await this.findActiveSessionByEmail(
        dto.osot_affiliate_email || '',
      );
      if (existingSession) {
        this.logger.warn(
          `Active registration session already exists for email: ${dto.osot_affiliate_email}`,
        );
        this.logger.log(
          `Existing session status: ${existingSession.status}, sessionId: ${existingSession.sessionId}`,
        );

        // If session is in 'staged' status, resend verification email
        if (existingSession.status === 'staged') {
          this.logger.log(
            'Session is STAGED - Resending verification email for existing session',
          );
          await this.sendVerificationEmail(
            dto.osot_affiliate_email || '',
            dto.osot_representative_first_name || 'Representative',
            dto.osot_affiliate_name || '',
            existingSession.sessionId,
            existingSession.verificationToken,
          );

          return {
            success: true,
            message:
              'Verification email resent to existing registration session',
            sessionId: existingSession.sessionId,
            status: existingSession.status,
            nextStep: 'verify_email',
            expiresAt: existingSession.expiresAt,
            verificationEmailSent: true,
          };
        }

        // If session is pending approval, return existing session info
        if (existingSession.status === 'affiliate_pending') {
          this.logger.log(
            'Session is PENDING APPROVAL - Returning existing session info',
          );
          return {
            success: true,
            message:
              'Registration already in progress, awaiting admin approval',
            sessionId: existingSession.sessionId,
            status: existingSession.status,
            nextStep: 'admin_approval',
            expiresAt: existingSession.expiresAt,
          };
        }

        // If session has other status (email_verified, completed, etc)
        this.logger.log(
          `Session has status '${existingSession.status}' - Allowing new registration`,
        );
      }

      // Store affiliate data in Redis WITHOUT hashing password
      // Password will be hashed by AffiliateCrudService.createAffiliate()
      const secureAffiliateData = { ...dto };

      // Generate session ID and tokens
      const sessionId = this.generateSessionId();
      const verificationToken = this.generateSecureToken();
      const approvalToken = this.generateSecureToken();
      const rejectionToken = this.generateSecureToken();

      // Create registration session
      const session: AffiliateRegistrationSession = {
        sessionId,
        status: 'staged',
        affiliateData: secureAffiliateData,
        verificationToken,
        verificationAttempts: 0,
        maxVerificationAttempts: this.MAX_VERIFICATION_ATTEMPTS,
        approvalToken,
        rejectionToken,
        adminNotificationSent: false,
        userPendingNotificationSent: false,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        expiresAt: new Date(
          Date.now() + this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000,
        ),
      };

      // Store in Redis
      await this.storeSession(session);

      // Send verification email
      const verificationEmailSent = await this.sendVerificationEmail(
        dto.osot_affiliate_email || '',
        dto.osot_representative_first_name || 'Representative',
        dto.osot_affiliate_name || '',
        sessionId,
        verificationToken,
      );

      this.logger.log(
        `Affiliate registration staged successfully - ${operationId}`,
      );

      return {
        success: true,
        message: 'Affiliate registration data staged successfully',
        sessionId,
        status: 'staged',
        nextStep: 'verify_email',
        expiresAt: session.expiresAt,
        verificationEmailSent,
      };
    } catch (error) {
      this.logger.error(
        `Affiliate registration staging failed - ${operationId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          email: dto.osot_affiliate_email,
        },
      );

      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Failed to stage affiliate registration');
    }
  }

  /**
   * Stage 2: Verify email and create affiliate with PENDING status
   */
  async verifyEmail(
    sessionId: string,
    verificationToken: string,
  ): Promise<AffiliateVerificationResult> {
    const operationId = `verify_affiliate_email_${Date.now()}`;
    this.logger.log(`Starting affiliate email verification - ${operationId}`);

    try {
      // Get session from Redis
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new NotFoundException(
          'Registration session not found or expired',
        );
      }

      // Validate session status
      if (session.status !== 'staged') {
        throw new BadRequestException(
          `Email verification not available for status: ${session.status}`,
        );
      }

      // Check verification attempts
      if (session.verificationAttempts >= session.maxVerificationAttempts) {
        throw new BadRequestException('Maximum verification attempts exceeded');
      }

      // Validate verification token
      if (session.verificationToken !== verificationToken) {
        session.verificationAttempts += 1;
        await this.updateSession(session);
        throw new BadRequestException('Invalid verification token');
      }

      // Update session status
      session.status = 'email_verified';
      session.emailVerifiedAt = new Date();
      session.lastUpdatedAt = new Date();

      // Create affiliate with PENDING status and OWNER privilege
      const affiliateData = {
        ...session.affiliateData,
        // System-defined fields (not exposed in public API)
        osot_account_status: AccountStatus.PENDING,
        osot_Privilege: Privilege.OWNER, // Set default privilege to OWNER
        osot_Access_Modifiers: AccessModifier.PRIVATE, // Set default access to PRIVATE
        osot_Active_Member: false, // Default to inactive until approved
      };

      const affiliate = await this.crudService.createAffiliate(
        affiliateData,
        Privilege.ADMIN, // System privilege for registration
      );

      // Update session with affiliate ID
      session.affiliateId = affiliate.osot_table_account_affiliateid;
      session.affiliateCreatedAt = new Date();
      session.status = 'affiliate_pending';

      await this.updateSession(session);

      // Send admin notification
      const adminNotificationSent = await this.sendAdminNotificationEmail(
        session,
        affiliate,
      );

      session.adminNotificationSent = adminNotificationSent;

      // Send user pending notification
      const userPendingNotificationSent =
        await this.sendUserPendingNotificationEmail(session, affiliate);

      session.userPendingNotificationSent = userPendingNotificationSent;
      await this.updateSession(session);

      this.logger.log(`Affiliate email verified successfully - ${operationId}`);

      return {
        success: true,
        message:
          'Email verified successfully. Affiliate created with pending status.',
        sessionId,
        affiliateId: affiliate.osot_table_account_affiliateid,
        status: 'affiliate_pending',
        nextStep: 'admin_approval',
        adminNotificationSent,
      };
    } catch (error) {
      this.logger.error(
        `Affiliate email verification failed - ${operationId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          sessionId,
        },
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Email verification failed');
    }
  }

  /**
   * Stage 3: Process admin approval/rejection
   */
  async processApproval(
    token: string,
    action: 'approve' | 'reject',
    adminId: string,
    reason?: string,
  ): Promise<AffiliateApprovalResult> {
    const operationId = `process_affiliate_approval_${Date.now()}`;
    this.logger.log(`Starting affiliate approval processing - ${operationId}`);

    try {
      // Find session by approval/rejection token
      const session = await this.findSessionByToken(token, action);
      if (!session) {
        throw new NotFoundException('Invalid or expired approval token');
      }

      // Validate session status
      if (session.status !== 'affiliate_pending') {
        throw new BadRequestException(
          `Approval not available for status: ${session.status}`,
        );
      }

      // Check current affiliate status to prevent duplicate approvals
      if (session.affiliateId) {
        try {
          const currentAffiliate = await this.crudService.findAffiliateById(
            session.affiliateId,
            Privilege.ADMIN,
          );

          // If already approved/active, return success (idempotent)
          if (
            action === 'approve' &&
            currentAffiliate.osot_account_status === AccountStatus.ACTIVE
          ) {
            this.logger.warn(
              `Affiliate already approved, returning success (idempotent): ${session.affiliateId}`,
            );
            return {
              success: true,
              message: 'Affiliate already approved',
              sessionId: session.sessionId,
              affiliateId: session.affiliateId,
              status: 'admin_approved',
              action,
              processedBy: adminId,
              reason,
              processedAt: new Date(),
            };
          }

          // If already rejected/inactive, return success (idempotent)
          if (
            action === 'reject' &&
            currentAffiliate.osot_account_status === AccountStatus.INACTIVE
          ) {
            this.logger.warn(
              `Affiliate already rejected, returning success (idempotent): ${session.affiliateId}`,
            );
            return {
              success: true,
              message: 'Affiliate already rejected',
              sessionId: session.sessionId,
              affiliateId: session.affiliateId,
              status: 'admin_rejected',
              action,
              processedBy: adminId,
              reason,
              processedAt: new Date(),
            };
          }
        } catch (error) {
          this.logger.warn(
            `Could not check current affiliate status: ${error instanceof Error ? error.message : String(error)}`,
          );
          // Continue with update attempt
        }
      }

      // Update affiliate status in database
      const newStatus =
        action === 'approve' ? AccountStatus.ACTIVE : AccountStatus.INACTIVE;

      if (session.affiliateId) {
        await this.crudService.updateAffiliateSystemFields(
          session.affiliateId,
          { osot_account_status: newStatus },
          Privilege.ADMIN,
        );
      } else {
        throw new BadRequestException('Affiliate ID not found in session');
      }

      // Get affiliate record for email template data
      let affiliateRecord: Record<string, any> | null = null;
      if (session.affiliateId) {
        try {
          affiliateRecord = await this.crudService.findAffiliateById(
            session.affiliateId,
            Privilege.ADMIN,
          );
        } catch (error) {
          this.logger.warn(
            `Could not fetch affiliate record for email: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      // Update session
      session.status =
        action === 'approve' ? 'admin_approved' : 'admin_rejected';
      session.lastUpdatedAt = new Date();

      if (action === 'approve') {
        session.approvedBy = adminId;
        session.approvedAt = new Date();
        session.approvalReason = reason;
      } else {
        session.rejectedBy = adminId;
        session.rejectedAt = new Date();
        session.approvalReason = reason;
      }

      await this.updateSession(session);

      // Send notification to affiliate
      await this.sendApprovalNotificationEmail(
        session,
        action,
        reason,
        affiliateRecord,
      );

      // Mark as completed
      session.status = 'completed';
      await this.updateSession(session);

      this.logger.log(
        `Affiliate approval processed successfully - ${operationId}`,
      );

      return {
        success: true,
        message: `Affiliate registration ${action}d successfully`,
        sessionId: session.sessionId,
        affiliateId: session.affiliateId || '',
        status: 'completed',
        action,
        processedBy: adminId,
        reason,
        processedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Affiliate approval processing failed - ${operationId}`,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          token: token.substring(0, 8) + '...',
          action,
        },
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Approval processing failed');
    }
  }

  /**
   * Get registration status
   */
  async getRegistrationStatus(
    sessionId: string,
  ): Promise<AffiliateRegistrationSession | null> {
    return await this.getSession(sessionId);
  }

  // Private helper methods...
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = randomBytes(8).toString('hex');
    return `aff_${timestamp}_${random}`;
  }

  private generateSecureToken(): string {
    return randomBytes(this.VERIFICATION_TOKEN_LENGTH / 2).toString('hex');
  }

  private async storeSession(
    session: AffiliateRegistrationSession,
  ): Promise<void> {
    const key = `${this.REDIS_KEY_PREFIX}${session.sessionId}`;
    const expirySeconds = this.SESSION_EXPIRY_HOURS * 60 * 60;
    await this.redisService.set(key, JSON.stringify(session), {
      EX: expirySeconds,
    });
  }

  private async getSession(
    sessionId: string,
  ): Promise<AffiliateRegistrationSession | null> {
    const key = `${this.REDIS_KEY_PREFIX}${sessionId}`;
    const data = await this.redisService.get(key);
    return data ? (JSON.parse(data) as AffiliateRegistrationSession) : null;
  }

  private async updateSession(
    session: AffiliateRegistrationSession,
  ): Promise<void> {
    session.lastUpdatedAt = new Date();
    await this.storeSession(session);
  }

  /**
   * Find active registration session by email
   * Scans all Redis keys to find a session with matching email
   * Returns the most recent active session (staged or pending)
   */
  private async findActiveSessionByEmail(
    email: string,
  ): Promise<AffiliateRegistrationSession | null> {
    try {
      // Get all affiliate registration keys from Redis
      const pattern = `${this.REDIS_KEY_PREFIX}*`;
      const keys = await this.redisService.getKeys(pattern);

      if (!keys || keys.length === 0) {
        return null;
      }

      // Check each session for matching email and active status
      const activeSessions: AffiliateRegistrationSession[] = [];

      for (const key of keys) {
        const sessionData = await this.redisService.get(key);
        if (sessionData) {
          const session = JSON.parse(
            sessionData,
          ) as AffiliateRegistrationSession;

          // Check if email matches and session is active (staged or pending)
          if (
            session.affiliateData.osot_affiliate_email === email &&
            (session.status === 'staged' ||
              session.status === 'affiliate_pending' ||
              session.status === 'email_verified')
          ) {
            activeSessions.push(session);
          }
        }
      }

      // Return most recent active session
      if (activeSessions.length > 0) {
        activeSessions.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        return activeSessions[0];
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Error finding active session by email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  private async findSessionByToken(
    token: string,
    tokenType: 'approve' | 'reject',
  ): Promise<AffiliateRegistrationSession | null> {
    try {
      this.logger.log(
        `Looking for session with ${tokenType} token: ${token.substring(0, 8)}...`,
      );

      let sessionId: string;

      // Handle both token formats:
      // 1. Full token: "approve_aff_1234567890_abcdef123_1234567890"
      // 2. URL token: "aff_1234567890_abcdef123_1234567890" (without prefix)
      if (token.startsWith('approve_') || token.startsWith('reject_')) {
        // Full token format: {action}_{sessionId}_{timestamp}
        const tokenParts = token.split('_');
        if (tokenParts.length < 4) {
          this.logger.error(`Invalid full token format: ${token}`);
          return null;
        }
        // Reconstruct sessionId: aff_1234567890_abcdef123
        sessionId = `${tokenParts[1]}_${tokenParts[2]}_${tokenParts[3]}`;
      } else {
        // URL token format (without action prefix): sessionId_timestamp
        const tokenParts = token.split('_');
        if (tokenParts.length < 3) {
          this.logger.error(`Invalid URL token format: ${token}`);
          return null;
        }
        // Reconstruct sessionId: aff_1234567890_abcdef123 (remove timestamp)
        sessionId = `${tokenParts[0]}_${tokenParts[1]}_${tokenParts[2]}`;
      }

      this.logger.debug(`Extracted sessionId from token: ${sessionId}`);

      // Get session from Redis
      const session = await this.getSession(sessionId);
      if (!session) {
        this.logger.error(`Session not found for sessionId: ${sessionId}`);
        return null;
      }

      // Verify the token matches the session's stored tokens
      const expectedApprovalToken = session.approvalToken;
      const expectedRejectionToken = session.rejectionToken;

      // Check if token matches expected tokens (supporting both formats)
      const isValidApprovalToken =
        tokenType === 'approve' &&
        (token === expectedApprovalToken ||
          expectedApprovalToken?.endsWith(token));

      const isValidRejectionToken =
        tokenType === 'reject' &&
        (token === expectedRejectionToken ||
          expectedRejectionToken?.endsWith(token));

      if (isValidApprovalToken) {
        this.logger.debug(
          `Valid approval token found for session: ${sessionId}`,
        );
        return session;
      }

      if (isValidRejectionToken) {
        this.logger.debug(
          `Valid rejection token found for session: ${sessionId}`,
        );
        return session;
      }

      this.logger.error(
        `Token mismatch for session ${sessionId}. Expected: ${tokenType === 'approve' ? expectedApprovalToken : expectedRejectionToken}, Got: ${token}`,
      );
      return null;
    } catch (error) {
      this.logger.error(
        `Error finding session by token: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  // Email methods (implement based on email templates)
  private async sendVerificationEmail(
    email: string,
    name: string,
    organizationName: string,
    sessionId: string,
    token: string,
  ): Promise<boolean> {
    this.logger.log(
      `Sending verification email to ${email} for ${organizationName}`,
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    await this.emailService.sendEmail(
      email,
      'Verify your affiliate registration',
      'affiliate-verification',
      {
        name,
        organizationName,
        email,
        sessionId,
        verificationToken: token,
        frontendUrl,
        verificationUrl: `${frontendUrl}/verify-affiliate-email?sessionId=${sessionId}&token=${token}`,
      },
    );
    return true;
  }

  private async sendUserPendingNotificationEmail(
    session: AffiliateRegistrationSession,
    affiliate: Record<string, any>,
  ): Promise<boolean> {
    try {
      const representativeName = `${session.affiliateData.osot_representative_first_name} ${session.affiliateData.osot_representative_last_name}`;
      const organizationName = session.affiliateData.osot_affiliate_name;
      const organizationEmail = session.affiliateData.osot_affiliate_email;
      const affiliateArea = session.affiliateData.osot_affiliate_area;
      const affiliateId = String(
        affiliate.osot_affiliate_id || 'Not available',
      );

      // Convert enum values to human-readable labels
      const getAreaLabel = (area: unknown): string => {
        if (typeof area === 'number' || typeof area === 'string') {
          const areaKey = String(area);
          const labels = AFFILIATE_AREAS_LABELS as Record<string, string>;
          return labels[areaKey] || 'Unknown Area';
        }
        return 'Unknown Area';
      };

      const templateData = {
        representativeName,
        organizationName,
        organizationEmail,
        affiliateArea: getAreaLabel(affiliateArea),
        affiliateId,
        submissionDate: new Date().toLocaleDateString(),
      };

      await this.emailService.sendEmail(
        organizationEmail,
        'Affiliate Registration - Pending Approval',
        'affiliate-created-pending',
        templateData,
      );

      this.logger.log(
        `User pending notification sent to: ${organizationEmail} for organization: ${organizationName}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send user pending notification: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async sendAdminNotificationEmail(
    session: AffiliateRegistrationSession,
    affiliate: Record<string, any>,
  ): Promise<boolean> {
    try {
      const representativeName = `${session.affiliateData.osot_representative_first_name} ${session.affiliateData.osot_representative_last_name}`;
      const organizationName = session.affiliateData.osot_affiliate_name;
      const organizationEmail = session.affiliateData.osot_affiliate_email;
      const organizationPhone = session.affiliateData.osot_affiliate_phone;
      const organizationWebsite =
        session.affiliateData.osot_affiliate_website || 'Not provided';
      const representativeTitle =
        session.affiliateData.osot_representative_job_title;
      const affiliateArea = session.affiliateData.osot_affiliate_area;
      const affiliateId =
        (affiliate.osot_affiliate_id as string) || 'Not available';

      // Generate approval/rejection tokens (simple for now, should use proper token generation)
      const approveToken = `approve_${session.sessionId}_${Date.now()}`;
      const rejectToken = `reject_${session.sessionId}_${Date.now()}`;

      // Store tokens in session for later verification
      session.approvalToken = approveToken;
      session.rejectionToken = rejectToken;

      const organizationAddress1 =
        session.affiliateData.osot_affiliate_address_1;
      const organizationAddress2 =
        session.affiliateData.osot_affiliate_address_2;
      const organizationCity = session.affiliateData.osot_affiliate_city;
      const organizationProvince =
        session.affiliateData.osot_affiliate_province;
      const organizationPostalCode =
        session.affiliateData.osot_affiliate_postal_code;
      const organizationCountry = session.affiliateData.osot_affiliate_country;

      const organizationFacebook =
        session.affiliateData.osot_affiliate_facebook;
      const organizationInstagram =
        session.affiliateData.osot_affiliate_instagram;
      const organizationLinkedIn =
        session.affiliateData.osot_affiliate_linkedin;
      const organizationTikTok = session.affiliateData.osot_affiliate_tiktok;

      // Convert enum values to human-readable labels
      const getAreaLabel = (area: unknown): string => {
        if (typeof area === 'number' || typeof area === 'string') {
          const areaKey = String(area);
          const labels = AFFILIATE_AREAS_LABELS as Record<string, string>;
          return labels[areaKey] || 'Unknown Area';
        }
        return 'Unknown Area';
      };

      const getProvinceLabel = (province: unknown): string => {
        if (typeof province === 'number' || typeof province === 'string') {
          const provinceKey = String(province);
          const labels = AFFILIATE_PROVINCES_LABELS as Record<string, string>;
          return labels[provinceKey] || 'Unknown Province';
        }
        return 'Unknown Province';
      };

      const getCountryLabel = (country: unknown): string => {
        if (typeof country === 'number' || typeof country === 'string') {
          const countryKey = String(country);
          const labels = AFFILIATE_COUNTRIES_LABELS as Record<string, string>;
          return labels[countryKey] || 'Unknown Country';
        }
        return 'Unknown Country';
      };

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const templateData = {
        frontendUrl,
        organizationName,
        representativeName,
        representativeTitle,
        organizationEmail,
        organizationPhone,
        affiliateArea,
        affiliateAreaLabel: getAreaLabel(affiliateArea),
        organizationWebsite,
        registrationDate: new Date(session.createdAt).toLocaleDateString(),
        affiliateId,
        approveToken,
        rejectToken,
        organizationAddress1,
        organizationAddress2,
        organizationCity,
        organizationCityLabel: getCityDisplayName(organizationCity),
        organizationProvince,
        organizationProvinceLabel: getProvinceLabel(organizationProvince),
        organizationPostalCode,
        organizationCountry,
        organizationCountryLabel: getCountryLabel(organizationCountry),
        organizationFacebook,
        organizationInstagram,
        organizationLinkedIn,
        organizationTikTok,
      };

      // Get admin emails from environment variable (same as account)
      const adminEmailsString =
        process.env.REGISTRATION_ADMIN_EMAILS || 'admin@osot.ca';
      const adminEmails = adminEmailsString
        .split(',')
        .map((email) => email.trim());

      for (const adminEmail of adminEmails) {
        await this.emailService.sendEmail(
          adminEmail,
          'Admin Approval Required - Affiliate Registration',
          'affiliate-admin-approval',
          templateData,
        );
      }

      this.logger.log(
        `Admin notification sent for affiliate: ${organizationName} (${affiliateId})`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send admin notification: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private async sendApprovalNotificationEmail(
    session: AffiliateRegistrationSession,
    action: 'approve' | 'reject',
    reason?: string,
    affiliateRecord?: Record<string, any>,
  ): Promise<boolean> {
    try {
      const representativeName = `${session.affiliateData.osot_representative_first_name} ${session.affiliateData.osot_representative_last_name}`;
      const organizationName = session.affiliateData.osot_affiliate_name;
      const organizationEmail = session.affiliateData.osot_affiliate_email;
      const affiliateArea = session.affiliateData.osot_affiliate_area;

      // Use business ID from the created record, not session ID
      const affiliateId = String(
        affiliateRecord?.osot_affiliate_id || 'Not available',
      );

      // Convert enum values to human-readable labels
      const getAreaLabel = (area: unknown): string => {
        if (typeof area === 'number' || typeof area === 'string') {
          const areaKey = String(area);
          const labels = AFFILIATE_AREAS_LABELS as Record<string, string>;
          return labels[areaKey] || 'Unknown Area';
        }
        return 'Unknown Area';
      };

      const templateData = {
        representativeName,
        organizationName,
        organizationEmail,
        affiliateArea: getAreaLabel(affiliateArea),
        affiliateId,
        approvalDate: new Date().toLocaleDateString(),
        decisionDate: new Date().toLocaleDateString(),
        approvalReason: reason,
        reason: reason || 'No specific reason provided',
        approvedBy: 'OSOT Administration', // TODO: Get from admin context
        adminId: 'OSOT Administration', // TODO: Get from admin context
      };

      let subject: string;
      let templateName: string;

      if (action === 'approve') {
        subject = 'Affiliate Registration Approved - Welcome to OSOT';
        templateName = 'affiliate-approved-active';
      } else {
        subject = 'Affiliate Registration Decision - Application Not Approved';
        templateName = 'affiliate-rejected-inactive';
      }

      await this.emailService.sendEmail(
        organizationEmail,
        subject,
        templateName,
        templateData,
      );

      this.logger.log(
        `${action === 'approve' ? 'Approval' : 'Rejection'} notification sent to: ${organizationEmail} for organization: ${organizationName}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send ${action} notification: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }
}
