import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// Affiliate Services (these would be injected in real implementation)
import { AffiliateBusinessRuleService } from '../../services/affiliate-business-rule.service';
import { AffiliateLookupService } from '../../services/affiliate-lookup.service';

// DTOs and Interfaces
import {
  AffiliateRegistrationSessionDto,
  StageAffiliateRegistrationDto,
  AffiliateRegistrationStatus,
} from '../dto/registration-session.dto';
import { AffiliateRegistrationStageResultDto } from '../dto/workflow-results.dto';

// Common imports
import { createAppError } from '../../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../../common/errors/error-codes';

/**
 * DEMO SERVICE: Affiliate Session Management Patterns
 *
 * This service demonstrates the patterns and best practices for
 * implementing affiliate registration session management.
 *
 * ⚠️ IMPORTANT: This is a DEMONSTRATION service showing how to integrate
 * with affiliate services, not the actual orchestrator implementation!
 *
 * The real orchestrator should:
 * - Implement the AffiliateOrchestrator interface
 * - Use actual Redis for session storage
 * - Integrate with email services
 * - Handle event emission
 * - Provide comprehensive error handling
 *
 * This demo shows:
 * - How to use AffiliateBusinessRuleService for validation
 * - How to structure registration sessions
 * - How to handle password hashing
 * - How to implement workflow state management
 * - How to integrate with affiliate services
 */
@Injectable()
export class AffiliateSessionService {
  private readonly logger = new Logger(AffiliateSessionService.name);

  // In-memory storage for demo purposes (real implementation should use Redis)
  private readonly sessions = new Map<
    string,
    AffiliateRegistrationSessionDto
  >();

  constructor(
    private readonly businessRuleService: AffiliateBusinessRuleService,
    private readonly lookupService: AffiliateLookupService,
  ) {
    this.logger.log('AffiliateSessionService initialized (DEMO MODE)');
  }

  /**
   * DEMO: Stage affiliate registration with basic validation
   *
   * Shows how to integrate with AffiliateBusinessRuleService for:
   * - Email uniqueness validation
   * - Password hashing
   * - Session management patterns
   */
  async stageRegistrationDemo(
    dto: StageAffiliateRegistrationDto,
  ): Promise<AffiliateRegistrationStageResultDto> {
    const operationId = `stage_registration_${Date.now()}`;

    this.logger.log(
      `DEMO: Starting registration staging - Operation: ${operationId}`,
    );

    try {
      // 1. Validate email uniqueness using business rule service
      const isEmailUnique =
        await this.businessRuleService.validateEmailUniqueness(dto.email);
      if (!isEmailUnique) {
        throw createAppError(ErrorCodes.ACCOUNT_DUPLICATE, {
          field: 'email',
          value: dto.email,
        });
      }

      // 2. Hash password using business rule service
      const hashedPassword =
        await this.businessRuleService.hashAffiliatePassword(dto.password);

      // 3. Create session
      const sessionId = uuidv4();
      const verificationToken = this.generateVerificationToken();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

      const session: AffiliateRegistrationSessionDto = {
        sessionId,
        status: AffiliateRegistrationStatus.STAGED,
        progress: {
          staged: true,
          emailVerified: false,
          adminApproval: false,
          accountCreated: false,
          workflowCompleted: false,
        },
        affiliateData: {
          organizationName: dto.organizationName,
          email: dto.email,
          area: dto.area,
          city: dto.city,
          province: dto.province,
          country: dto.country,
          representativeName: dto.representativeName,
          representativeJobTitle: dto.representativeJobTitle,
        },
        hashedPassword,
        verificationToken,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        emailResendAttempts: 0,
      };

      // 4. Store session (in Redis in real implementation)
      this.sessions.set(sessionId, session);

      // 5. Send verification email (demo simulation)
      const emailSent = await this.sendVerificationEmailDemo(
        dto.email,
        verificationToken,
      );

      this.logger.log(
        `DEMO: Registration staging completed - Operation: ${operationId}`,
      );

      return {
        success: true,
        message:
          'Registration staged successfully. Please check your email for verification.',
        timestamp: new Date().toISOString(),
        sessionId,
        expiresAt: expiresAt.toISOString(),
        verificationEmailSent: emailSent,
        affiliateData: session.affiliateData,
      };
    } catch (error) {
      this.logger.error(
        `DEMO: Registration staging failed - Operation: ${operationId}`,
      );
      throw error;
    }
  }

  /**
   * DEMO: Get session status
   */
  getSessionStatusDemo(
    sessionId: string,
  ): Promise<AffiliateRegistrationSessionDto | null> {
    const session = this.sessions.get(sessionId) || null;
    return Promise.resolve(session);
  }

  /**
   * DEMO: Integration patterns showcase
   */
  async showIntegrationPatternsDemo(): Promise<void> {
    this.logger.log('DEMO: Showcasing integration patterns');

    // Pattern 1: Email validation
    const isUnique =
      await this.businessRuleService.validateEmailUniqueness(
        'test@example.com',
      );
    this.logger.log(`Pattern 1 - Email validation: ${isUnique}`);

    // Pattern 2: Password hashing
    const hashedPassword =
      await this.businessRuleService.hashAffiliatePassword('testpassword');
    this.logger.log(
      `Pattern 2 - Password hashed: ${hashedPassword.substring(0, 20)}...`,
    );

    // Pattern 3: Lookup by email
    const existingAffiliate =
      await this.lookupService.findByEmail('test@example.com');
    this.logger.log(
      `Pattern 3 - Lookup result: ${existingAffiliate ? 'Found' : 'Not found'}`,
    );

    this.logger.log('DEMO: Integration patterns showcase completed');
  }

  // Private helper methods for demo

  private generateVerificationToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private async sendVerificationEmailDemo(
    email: string,
    token: string,
  ): Promise<boolean> {
    // Demo email sending simulation
    this.logger.log(
      `DEMO: Sending verification email to ${email} with token: ${token}`,
    );

    // Simulate email service delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Simulate 95% success rate
    return Math.random() > 0.05;
  }
}
