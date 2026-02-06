import { Injectable, Logger } from '@nestjs/common';
import { createAppError } from '../../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../../common/errors/error-codes';
import {
  OtaEducationRegistrationSession,
  OtaEducationRegistrationStatus,
  OtaEducationStageRequest,
  OtaEducationStageResponse,
} from '../dto/ota-education-session.dto';
import {
  OtaEducationValidationResult,
  OtaEducationWorkflowResult,
  OtaEducationWorkflowStep,
  OtaEducationWorkflowAction,
  OtaEducationCreationResult,
  OtaEducationLinkingResult,
} from '../dto/ota-education-workflow-results.dto';

/**
 * DEMO SERVICE: OTA Education Session Management for Orchestrator
 *
 * This service demonstrates how the future OtaEducationOrchestrator should manage
 * Redis sessions, handle state transitions, and coordinate with OTA Education services.
 *
 * ⚠️  IMPORTANT: This is an EXAMPLE implementation showing patterns and structure.
 *    The real orchestrator will be built later using this as a reference.
 *
 * KEY PATTERNS DEMONSTRATED:
 * - Redis session lifecycle management
 * - Education validation state transitions
 * - College-country alignment validation coordination
 * - University-country alignment validation
 * - Education category determination workflow
 * - Error handling with proper logging
 * - Event emission for audit trails
 * - Account linking validation
 * - User Business ID uniqueness checking
 *
 * FUTURE INTEGRATION POINTS:
 * - OtaEducationCrudService: For final record creation
 * - OtaEducationBusinessRuleService: For validation logic
 * - OtaEducationLookupService: For reference data queries
 * - RedisService: For session persistence
 * - OtaEducationEventsService: For audit events
 * - External validation APIs: For college verification
 */
@Injectable()
export class OtaEducationSessionService {
  private readonly logger = new Logger(OtaEducationSessionService.name);
  private mockSessionStorage = new Map<
    string,
    OtaEducationRegistrationSession
  >();

  constructor() {
    this.logger.log('OTA Education Session Service initialized (DEMO MODE)');
  }

  // ========================================
  // SESSION LIFECYCLE MANAGEMENT
  // ========================================

  /**
   * Stage OTA education data in Redis session
   */
  stageEducationRegistration(
    request: OtaEducationStageRequest,
  ): Promise<OtaEducationStageResponse> {
    const sessionId = this.generateSessionId();

    this.logger.log(
      `Staging OTA education registration for user: ${request.userBusinessId}`,
    );

    try {
      const session: OtaEducationRegistrationSession = {
        sessionId,
        userBusinessId: request.userBusinessId,
        status: OtaEducationRegistrationStatus.STAGED,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        expiresAt: this.calculateExpirationTime(
          request.options?.expirationHours || 24,
        ),
        educationData: request.educationData,
        progress: {
          staged: true,
          validated: false,
          categoryDetermined: false,
          accountLinked: false,
          persisted: false,
        },
        validation: {
          userBusinessIdValid: false,
          collegeCountryValid: false,
          universityCountryValid: false,
          graduationYearValid: false,
        },
      };

      this.mockStoreSession(sessionId, session);

      return Promise.resolve({
        sessionId,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        status: OtaEducationRegistrationStatus.STAGED,
        success: true,
        message: 'OTA education data staged successfully',
      });
    } catch {
      this.logger.error('Failed to stage OTA education registration');
      throw createAppError(ErrorCodes.VALIDATION_ERROR, {
        message: 'Failed to stage OTA education data',
      });
    }
  }

  /**
   * Validate staged OTA education data
   */
  async validateEducationData(
    sessionId: string,
  ): Promise<OtaEducationValidationResult> {
    this.logger.log(`Validating OTA education data for session: ${sessionId}`);

    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: `Session ${sessionId} not found`,
        });
      }

      const validationResult =
        await this.performComprehensiveValidation(session);

      session.status = validationResult.isValid
        ? OtaEducationRegistrationStatus.VALIDATED
        : OtaEducationRegistrationStatus.PENDING;
      session.progress.validated = validationResult.isValid;
      session.validation = validationResult.validation;
      session.lastUpdatedAt = new Date().toISOString();

      this.mockStoreSession(sessionId, session);

      return validationResult;
    } catch (error) {
      this.logger.error(`Validation failed for session ${sessionId}`);
      throw error;
    }
  }

  /**
   * Link education session to user account
   */
  async linkEducationToAccount(
    sessionId: string,
    accountId: string,
  ): Promise<OtaEducationLinkingResult> {
    this.logger.log(
      `Linking education session ${sessionId} to account ${accountId}`,
    );

    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: `Session ${sessionId} not found`,
        });
      }

      const accountVerified = await this.verifyAccountExists(accountId);

      if (accountVerified) {
        session.linkedAccountId = accountId;
        session.status = OtaEducationRegistrationStatus.ACCOUNT_LINKED;
        session.progress.accountLinked = true;
        session.lastUpdatedAt = new Date().toISOString();

        this.mockStoreSession(sessionId, session);
      }

      return {
        sessionId,
        step: OtaEducationWorkflowStep.ACCOUNT_LINKING,
        action: OtaEducationWorkflowAction.LINK_ACCOUNT,
        success: accountVerified,
        executedAt: new Date().toISOString(),
        errors: accountVerified
          ? []
          : [
              {
                code: 'ACCOUNT_NOT_FOUND',
                message: 'Account verification failed',
                severity: 'error' as const,
              },
            ],
        warnings: [],
        nextStep: accountVerified
          ? OtaEducationWorkflowStep.RECORD_CREATION
          : undefined,
        linked: accountVerified,
        linkedAccountId: accountVerified ? accountId : undefined,
        linkedAt: new Date().toISOString(),
        accountVerified,
      };
    } catch (error) {
      this.logger.error('Account linking failed');
      throw error;
    }
  }

  /**
   * Create final OTA education record
   */
  async createEducationRecord(
    sessionId: string,
  ): Promise<OtaEducationCreationResult> {
    this.logger.log(`Creating OTA education record for session: ${sessionId}`);

    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: `Session ${sessionId} not found`,
        });
      }

      const educationId = this.generateEducationId();

      session.createdEducationId = educationId;
      session.status = OtaEducationRegistrationStatus.EDUCATION_CREATED;
      session.progress.persisted = true;
      session.lastUpdatedAt = new Date().toISOString();

      this.mockStoreSession(sessionId, session);

      return {
        sessionId,
        step: OtaEducationWorkflowStep.RECORD_CREATION,
        action: OtaEducationWorkflowAction.CREATE_RECORD,
        success: true,
        executedAt: new Date().toISOString(),
        errors: [],
        warnings: [],
        nextStep: OtaEducationWorkflowStep.WORKFLOW_COMPLETION,
        created: true,
        createdEducationId: educationId,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Record creation failed');
      throw error;
    }
  }

  /**
   * Complete the workflow
   */
  async completeWorkflow(
    sessionId: string,
  ): Promise<OtaEducationWorkflowResult> {
    this.logger.log(`Completing workflow for session: ${sessionId}`);

    try {
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, {
          message: `Session ${sessionId} not found`,
        });
      }

      session.status = OtaEducationRegistrationStatus.WORKFLOW_COMPLETED;
      session.lastUpdatedAt = new Date().toISOString();

      this.mockStoreSession(sessionId, session);

      return {
        sessionId,
        step: OtaEducationWorkflowStep.WORKFLOW_COMPLETION,
        action: OtaEducationWorkflowAction.COMPLETE_WORKFLOW,
        success: true,
        executedAt: new Date().toISOString(),
        errors: [],
        warnings: [],
        metadata: {
          completedEducationId: session.createdEducationId,
          finalStatus: session.status,
        },
      };
    } catch (error) {
      this.logger.error('Workflow completion failed');
      throw error;
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  private generateSessionId(): string {
    return `ota-session-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  private generateEducationId(): string {
    return `ota-education-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  private calculateExpirationTime(hours: number): string {
    const expiration = new Date();
    expiration.setHours(expiration.getHours() + hours);
    return expiration.toISOString();
  }

  private mockStoreSession(
    sessionId: string,
    session: OtaEducationRegistrationSession,
  ): void {
    this.mockSessionStorage.set(sessionId, session);
  }

  private getSessionById(
    sessionId: string,
  ): Promise<OtaEducationRegistrationSession | null> {
    return Promise.resolve(this.mockSessionStorage.get(sessionId) || null);
  }

  private async performComprehensiveValidation(
    session: OtaEducationRegistrationSession,
  ): Promise<OtaEducationValidationResult> {
    return Promise.resolve({
      sessionId: session.sessionId,
      step: OtaEducationWorkflowStep.VALIDATION,
      action: OtaEducationWorkflowAction.VALIDATE_EDUCATION,
      success: true,
      executedAt: new Date().toISOString(),
      errors: [],
      warnings: [],
      nextStep: OtaEducationWorkflowStep.CATEGORY_DETERMINATION,
      isValid: true,
      validatedAt: new Date().toISOString(),
      validation: {
        userBusinessIdValid: true,
        collegeCountryValid: true,
        universityCountryValid: true,
        graduationYearValid: true,
      },
      validationScore: 95,
      criticalFailures: [],
    });
  }

  private verifyAccountExists(_accountId: string): Promise<boolean> {
    // Mock account verification - would use actual account service
    return Promise.resolve(true);
  }
}
