/**
 * Account Orchestrator Service
 *
 * Main service that coordinates the complete user registration workflow.
 * This service manages the sequential creation of entities and session lifecycle.
 */

import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { CompleteUserRegistrationDto } from '../dtos/complete-user-registration.dto';
import { RegistrationState } from '../enums/registration-state.enum';
import {
  IAccountOrchestrator,
  OrchestratorResponseDto,
} from '../interfaces/orchestrator.interfaces';
import { OrchestratorRequestDto } from '../dtos/orchestrator-request.dto';
import { SessionMapper } from '../mappers/session.mappers';
import { OrchestratorRepository } from '../repositories/orchestrator.repository';
import { OrchestratorValidationService } from '../validators/orchestrator-validation.service';
import { OrchestratorEmailWorkflowService } from './orchestrator-email-workflow.service';
import { OrchestratorEventService } from '../events/orchestrator-event.service';
import { ORCHESTRATOR_CONSTANTS } from '../constants/orchestrator.constants';

// Entity Services for Account Integration
import { AccountCrudService } from '../../../user-account/account/services/account-crud.service';
import { AddressCrudService } from '../../../user-account/address/services/address-crud.service';
import { ContactCrudService } from '../../../user-account/contact/services/contact-crud.service';
import { IdentityCrudService } from '../../../user-account/identity/services/identity-crud.service';
import { OtEducationCrudService } from '../../../user-account/ot-education/services/ot-education-crud.service';
import { OtaEducationCrudService } from '../../../user-account/ota-education/services/ota-education-crud.service';
import { ManagementCrudService } from '../../../user-account/management/services/management-crud.service';

// Organization Service for Multi-Tenant Support
import { OrganizationRepository } from '../../../others/organization/repositories/organization.repository';

// Entity DTOs for Account Integration
import { CreateAccountDto } from '../../../user-account/account/dtos/create-account.dto';
import { CreateAddressForAccountDto } from '../../../user-account/address/dtos/create-address-for-account.dto';
import { CreateContactForAccountDto } from '../../../user-account/contact/dtos/create-contact-for-account.dto';
import { CreateIdentityForAccountDto } from '../../../user-account/identity/dtos/create-identity-for-account.dto';
import { CreateOtEducationForAccountDto } from '../../../user-account/ot-education/dtos/create-ot-education-for-account.dto';
import { CreateOtaEducationForAccountDto } from '../../../user-account/ota-education/dtos/create-ota-education-for-account.dto';
import { CreateManagementForAccountDto } from '../../../user-account/management/dtos/create-management-for-account.dto';

// Entity Response DTOs
import { AccountResponseDto } from '../../../user-account/account/dtos/account-response.dto';

// Enums
import { AccountGroup } from '../../../../common/enums/account-group.enum';

@Injectable()
export class AccountOrchestratorService implements IAccountOrchestrator {
  private readonly logger = new Logger(AccountOrchestratorService.name);

  constructor(
    private readonly orchestratorRepository: OrchestratorRepository,
    private readonly validationService: OrchestratorValidationService,
    private readonly eventService: OrchestratorEventService,
    private readonly emailWorkflowService: OrchestratorEmailWorkflowService,
    // Entity Services for Sequential Creation
    private readonly accountCrudService: AccountCrudService,
    private readonly addressCrudService: AddressCrudService,
    private readonly contactCrudService: ContactCrudService,
    private readonly identityCrudService: IdentityCrudService,
    private readonly otEducationCrudService: OtEducationCrudService,
    private readonly otaEducationCrudService: OtaEducationCrudService,
    private readonly managementCrudService: ManagementCrudService,
    // Organization Repository for Multi-Tenant Support
    private readonly organizationRepository: OrganizationRepository,
  ) {}

  /**
   * Initiate the complete user registration process
   *
   * This is the main entry point for user registration. It:
   * 1. Resolves organization from slug (multi-tenant support)
   * 2. Validates the complete registration data
   * 3. Creates a session in Redis
   * 4. Returns session information for tracking
   *
   * NOTE: Email verification and admin approval will be added later
   */
  async initiateRegistration(
    data: CompleteUserRegistrationDto,
  ): Promise<OrchestratorResponseDto> {
    const startTime = Date.now();
    let sessionId: string | undefined;

    try {
      this.logger.log('🚀 Initiating user registration process...');

      // 1. Generate unique session ID
      sessionId = this.generateSessionId();
      this.logger.debug(`Generated session ID: ${sessionId}`);

      // 2. Resolve organization from slug (Multi-Tenant)
      const organizationSlug = data.organizationSlug || 'osot'; // Default to OSOT
      this.logger.debug(`Resolving organization for slug: ${organizationSlug}`);

      const organization =
        await this.organizationRepository.findBySlug(organizationSlug);

      if (!organization) {
        this.logger.error(
          `Organization not found for slug: ${organizationSlug}`,
        );
        throw new Error(
          `Organization "${organizationSlug}" not found or inactive`,
        );
      }

      // Use GUID (osot_table_organizationid) for @odata.bind relationships
      const organizationGuid: string = organization.osot_table_organizationid;
      this.logger.log(
        `✅ Organization resolved: ${organization.osot_organization_name} (${organization.osot_organizationid})`,
      );

      // Emit registration initiated event
      this.eventService.emitRegistrationInitiated({
        sessionId,
        timestamp: new Date(),
        email: data.account?.osot_email || 'unknown',
        firstName: data.account?.osot_first_name || 'unknown',
        lastName: data.account?.osot_last_name || 'unknown',
        educationType: data.educationType,
        expiresAt: new Date(
          Date.now() +
            ORCHESTRATOR_CONSTANTS.TIMEOUTS.REGISTRATION_SESSION_TTL * 1000,
        ),
      });

      // 3. Validate complete registration data
      const validationStartTime = Date.now();
      await this.validateRegistrationData(data, sessionId);
      const validationDuration = Date.now() - validationStartTime;

      // Emit validation success event
      this.eventService.emitRegistrationValidated({
        sessionId,
        timestamp: new Date(),
        isValid: true,
        validationDuration,
      });

      this.logger.debug('✅ Registration data validation passed');

      // 4. Create session with expiration and organization context
      const expiresAt = new Date(
        Date.now() +
          ORCHESTRATOR_CONSTANTS.TIMEOUTS.REGISTRATION_SESSION_TTL * 1000,
      );

      const session = SessionMapper.toInitialSession(
        sessionId,
        data,
        expiresAt,
      );

      // Add organization GUID to session for entity creation
      session.organizationGuid = organizationGuid;

      // 5. Store session in Redis
      const createdSession =
        await this.orchestratorRepository.createSession(session);
      this.logger.log(
        `✅ Session created successfully: ${sessionId} (Organization: ${organizationSlug})`,
      );

      // Emit registration staged event
      this.eventService.emitRegistrationStaged({
        sessionId,
        timestamp: new Date(),
        email: data.account?.osot_email || 'unknown',
        status: createdSession.status,
        progressPercentage: createdSession.progress.progressPercentage,
        expiresAt: new Date(createdSession.expiresAt),
      });

      // 5. Prepare response
      const response: OrchestratorResponseDto = {
        success: true,
        message: 'Registration initiated successfully. Session created.',
        sessionId: createdSession.sessionId,
        status: createdSession.status,
        progress: {
          percentage: createdSession.progress.progressPercentage,
          currentStep: createdSession.progress.currentStep,
          completedEntities: createdSession.progress.completedEntities,
          failedEntities: createdSession.progress.failedEntities,
          pendingEntities: createdSession.progress.pendingEntities,
        },
        timestamps: {
          createdAt: createdSession.createdAt,
          updatedAt: createdSession.updatedAt,
          expiresAt: createdSession.expiresAt,
        },
        nextSteps: this.getNextSteps(createdSession.status),
      };

      this.logger.log(
        `🎯 Registration initiation completed for session: ${sessionId}`,
      );
      return response;
    } catch (error: any) {
      this.logger.error('❌ Failed to initiate registration:', error);

      // Emit validation failed event if we have a sessionId
      if (sessionId) {
        this.eventService.emitRegistrationValidated({
          sessionId,
          timestamp: new Date(),
          isValid: false,
          errors: [String(error)],
          validationDuration: Date.now() - startTime,
        });

        // Emit registration failed event
        this.eventService.emitRegistrationFailed({
          sessionId,
          timestamp: new Date(),
          email: data.account?.osot_email || 'unknown',
          error: String(error),
          errorCode: 'REGISTRATION_INITIATION_FAILED',
          stage: 'initiation',
          totalDuration: Date.now() - startTime,
        });
      }

      // Re-throw the error so the controller can handle HTTP status codes
      throw error;
    }
  }

  /**
   * Get registration status and progress
   */
  async getRegistrationStatus(
    sessionId: string,
  ): Promise<OrchestratorResponseDto> {
    try {
      this.logger.log(
        `📊 Getting registration status for session: ${sessionId}`,
      );

      const session = await this.orchestratorRepository.getSession(sessionId);

      if (!session) {
        return {
          success: false,
          message: 'Session not found or expired',
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'The registration session was not found or has expired',
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        success: true,
        message: 'Session status retrieved successfully',
        sessionId: session.sessionId,
        status: session.status,
        progress: {
          percentage: session.progress.progressPercentage,
          currentStep: session.progress.currentStep,
          completedEntities: session.progress.completedEntities,
          failedEntities: session.progress.failedEntities,
          pendingEntities: session.progress.pendingEntities,
        },
        timestamps: {
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          expiresAt: session.expiresAt,
        },
        lastError: session.lastError,
        nextSteps: this.getNextSteps(session.status),
      };
    } catch (error: any) {
      this.logger.error(
        `❌ Failed to get status for session ${sessionId}:`,
        error,
      );

      return {
        success: false,
        message: `Failed to retrieve session status: ${String(error)}`,
        error: {
          code: 'STATUS_RETRIEVAL_FAILED',
          message: String(error),
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = uuidv4().replace(/-/g, '').slice(0, 8);
    return `reg_${timestamp}_${randomPart}`;
  }

  /**
   * Validate registration data using comprehensive validation service
   */
  private async validateRegistrationData(
    data: CompleteUserRegistrationDto,
    sessionId: string,
  ): Promise<void> {
    // Disable unsafe assignment warnings for DTO mapping
    // This is necessary because we're mapping between different DTO structures
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */

    // Helper function to safely get property
    const safeGet = (obj: any, key: string): any => {
      return obj && typeof obj === 'object' && key in obj
        ? obj[key]
        : undefined;
    };

    // Convert CompleteUserRegistrationDto to OrchestratorRequestDto format
    const requestData: OrchestratorRequestDto = {
      accountData: data.account
        ? {
            email: safeGet(data.account, 'osot_email'),
            firstName: safeGet(data.account, 'osot_first_name'),
            lastName: safeGet(data.account, 'osot_last_name'),
            ...data.account,
          }
        : undefined,
      addressData: data.address
        ? {
            country: safeGet(data.address, 'osot_country'),
            city: safeGet(data.address, 'osot_city'),
            postalCode: safeGet(data.address, 'osot_postal_code'),
            street: safeGet(data.address, 'osot_street_address'),
            ...data.address,
          }
        : undefined,
      contactData: data.contact
        ? {
            email: safeGet(data.contact, 'osot_email'),
            phone: safeGet(data.contact, 'osot_phone'),
            ...data.contact,
          }
        : undefined,
      identityData: data.identity
        ? {
            firstName: safeGet(data.identity, 'osot_first_name'),
            lastName: safeGet(data.identity, 'osot_last_name'),
            documentType: safeGet(data.identity, 'osot_id_type'),
            documentNumber: safeGet(data.identity, 'osot_id_number'),
            birthDate: safeGet(data.identity, 'osot_date_of_birth'),
            ...data.identity,
          }
        : undefined,
      educationData:
        data.educationType === 'ot' && data.otEducation
          ? {
              level: 'OT',
              institution: safeGet(data.otEducation, 'osot_school_name'),
              course: 'Occupational Therapy',
              ...data.otEducation,
            }
          : data.educationType === 'ota' && data.otaEducation
            ? {
                level: 'OTA',
                institution: safeGet(data.otaEducation, 'osot_school_name'),
                course: 'Occupational Therapy Assistant',
                ...data.otaEducation,
              }
            : undefined,
      managementData: data.management
        ? {
            position: 'Member',
            department: 'General',
            startDate: new Date().toISOString(),
            ...data.management,
          }
        : undefined,
    };

    // Run comprehensive validation
    const validationResult =
      await this.validationService.validateCompleteRegistration(requestData);

    // Check if validation passed
    if (!validationResult.isValid) {
      const errorMessage = validationResult.errors.join('; ');
      this.logger.error(
        `❌ Validation failed for session ${sessionId}: ${errorMessage}`,
      );

      // Create error with existingEmail metadata if available
      const error: any = new Error(`Validation failed: ${errorMessage}`);
      if (validationResult.existingAccountEmail) {
        error.existingAccountEmail = validationResult.existingAccountEmail;
      }
      throw error;
    }

    // Log warnings if any
    if (validationResult.warnings.length > 0) {
      const warningMessage = validationResult.warnings.join('; ');
      this.logger.warn(
        `⚠️ Validation warnings for session ${sessionId}: ${warningMessage}`,
      );
    }

    this.logger.debug(
      `✅ Comprehensive validation passed for session ${sessionId}`,
    );
  }

  /**
   * Get next steps based on current registration status
   */
  private getNextSteps(status: RegistrationState): string[] {
    switch (status) {
      case RegistrationState.STAGED:
        return [
          'Data validation completed',
          'Session created in system',
          'Ready for next phase of processing',
        ];
      case RegistrationState.PENDING_APPROVAL:
        return [
          'Administrator review in progress',
          'Approval notification will be sent via email',
          'Processing may take 1-2 business days',
        ];
      case RegistrationState.APPROVED:
        return [
          'Registration approved by administrator',
          'Account creation process will begin',
          'Entity creation in progress',
        ];
      case RegistrationState.COMPLETED:
        return [
          'Registration completed successfully',
          'All account entities created',
          'You can now access the system',
        ];
      case RegistrationState.FAILED:
        return [
          'Registration encountered an error',
          'Check error details for more information',
          'Contact support if the issue persists',
        ];
      case RegistrationState.REJECTED:
        return [
          'Registration was rejected by administrator',
          'Check email for rejection reason',
          'Contact support for assistance',
        ];
      default:
        return ['Processing registration...'];
    }
  }

  // ========================================
  // EMAIL WORKFLOW INTEGRATION METHODS
  // ========================================

  /**
   * Initiate email verification workflow
   *
   * @param sessionId Registration session ID
   * @returns Email verification initiation result
   */
  async initiateEmailVerification(sessionId: string) {
    this.logger.log(
      `Initiating email verification workflow for session: ${sessionId}`,
    );

    try {
      // Delegate to email workflow service
      const result =
        await this.emailWorkflowService.initiateEmailVerification(sessionId);

      this.logger.log(
        `Email verification initiated successfully for session: ${sessionId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to initiate email verification for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process email verification token (Interface Compatibility)
   *
   * @param sessionId Registration session ID
   * @param verificationToken Token from email link
   * @returns Orchestrator response DTO
   */
  async verifyEmail(
    sessionId: string,
    verificationToken: string,
  ): Promise<OrchestratorResponseDto> {
    this.logger.log(`Processing email verification for session: ${sessionId}`);

    try {
      // Delegate to email workflow service
      const emailResult = await this.emailWorkflowService.verifyEmailToken(
        sessionId,
        verificationToken,
      );

      // Convert to OrchestratorResponseDto format
      const orchestratorResponse: OrchestratorResponseDto = {
        success: emailResult.success,
        message: emailResult.message,
        sessionId: emailResult.sessionId,
        status:
          emailResult.nextStep === 'admin_approval'
            ? RegistrationState.EMAIL_VERIFIED
            : RegistrationState.FAILED,
        timestamps: {
          createdAt: emailResult.timestamp.toISOString(),
          updatedAt: emailResult.timestamp.toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(), // 24h from now
        },
        nextSteps: [emailResult.nextStep],
      };

      if (!emailResult.success && emailResult.errors) {
        orchestratorResponse.error = {
          code: 'EMAIL_VERIFICATION_FAILED',
          message: emailResult.errors.join('; '),
          timestamp: emailResult.timestamp.toISOString(),
        };
      }

      this.logger.log(
        `Email verification processed for session: ${sessionId}, success: ${emailResult.success}`,
      );
      return orchestratorResponse;
    } catch (error) {
      this.logger.error(
        `Failed to verify email for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process admin approval/rejection
   *
   * @param sessionId Registration session ID
   * @param action Approve or reject action
   * @param adminId Administrator identifier
   * @param reason Optional reason for action
   * @returns Admin approval result
   */
  async processAdminApproval(
    sessionId: string,
    action: 'approve' | 'reject',
    adminId: string,
    reason?: string,
  ) {
    this.logger.log(`Processing admin ${action} for session: ${sessionId}`);

    try {
      // Delegate to email workflow service
      const result = await this.emailWorkflowService.processAdminApproval(
        sessionId,
        action,
        adminId,
        reason,
      );

      // If approved, update account status to ACTIVE
      if (result.success && action === 'approve') {
        this.logger.log(
          `Registration approved for session: ${sessionId}. Updating account status to ACTIVE.`,
        );

        // Update account status in Dataverse
        try {
          this.logger.log(
            `Updating account status to ACTIVE for session: ${sessionId}`,
          );
          const statusUpdateResult = await this.updateAccountStatus(
            sessionId,
            1, // ACTIVE status
          );

          // Only send user notification if status update was successful
          if (statusUpdateResult.success) {
            this.logger.log(
              `Account status updated successfully for session: ${sessionId}. Sending user notification.`,
            );

            try {
              await this.emailWorkflowService.sendPostEntityCreationNotification(
                sessionId,
                action,
                reason,
              );
            } catch (notificationError) {
              this.logger.error(
                `Failed to send user notification for session ${sessionId}: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`,
              );
              // Don't throw - status update was successful, notification failure is secondary
            }
          } else {
            this.logger.warn(
              `Account status update failed for session: ${sessionId}. User notification will not be sent.`,
            );
          }
        } catch (statusUpdateError) {
          this.logger.error(
            `Failed to update account status for session ${sessionId}: ${statusUpdateError instanceof Error ? statusUpdateError.message : String(statusUpdateError)}`,
          );
          // Don't throw here - approval was successful, status update is separate
        }
      }

      // If rejected, update account status to INACTIVE
      if (result.success && action === 'reject') {
        this.logger.log(
          `Registration rejected for session: ${sessionId}. Updating account status to INACTIVE.`,
        );

        try {
          await this.updateAccountStatus(sessionId, 2); // INACTIVE status

          // Send rejection notification
          try {
            await this.emailWorkflowService.sendPostEntityCreationNotification(
              sessionId,
              action,
              reason,
            );
          } catch (notificationError) {
            this.logger.error(
              `Failed to send rejection notification for session ${sessionId}: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`,
            );
          }
        } catch (statusUpdateError) {
          this.logger.error(
            `Failed to update account status to INACTIVE for session ${sessionId}: ${statusUpdateError instanceof Error ? statusUpdateError.message : String(statusUpdateError)}`,
          );
        }
      }

      this.logger.log(
        `Admin ${action} processed for session: ${sessionId}, success: ${result.success}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process admin approval for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process admin approval using approval token
   * @param approvalToken Approval token from email
   * @param action Approve or reject action
   * @returns Admin approval result
   */
  async processAdminApprovalByToken(
    approvalToken: string,
    action: 'approve' | 'reject',
  ) {
    this.logger.log(`Processing admin ${action} with token: ${approvalToken}`);

    try {
      // Delegate to email workflow service with token-based method
      const result =
        await this.emailWorkflowService.processAdminApprovalByToken(
          approvalToken,
          action,
        );

      // If approved, update account status to ACTIVE
      if (result.success && action === 'approve') {
        this.logger.log(
          `Registration approved with token: ${approvalToken}. Updating account status to ACTIVE.`,
        );

        // Update account status in Dataverse
        try {
          this.logger.log(
            `Updating account status to ACTIVE for session: ${result.sessionId}`,
          );
          const statusUpdateResult = await this.updateAccountStatus(
            result.sessionId,
            1, // ACTIVE status
          );

          // Only send user notification if status update was successful
          if (statusUpdateResult.success) {
            this.logger.log(
              `Account status updated successfully for session: ${result.sessionId}. Sending user notification.`,
            );

            try {
              await this.emailWorkflowService.sendPostEntityCreationNotification(
                result.sessionId,
                action,
                result.reason,
              );
            } catch (notificationError) {
              this.logger.error(
                `Failed to send user notification for session ${result.sessionId}: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`,
              );
              // Don't throw - status update was successful, notification failure is secondary
            }
          } else {
            this.logger.warn(
              `Account status update failed for session: ${result.sessionId}. User notification will not be sent.`,
            );
          }
        } catch (statusUpdateError) {
          this.logger.error(
            `Failed to update account status for session ${result.sessionId}: ${statusUpdateError instanceof Error ? statusUpdateError.message : String(statusUpdateError)}`,
          );
          // Don't throw here - approval was successful, status update is separate
        }
      }

      // If rejected, update account status to INACTIVE
      if (result.success && action === 'reject') {
        this.logger.log(
          `Registration rejected with token: ${approvalToken}. Updating account status to INACTIVE.`,
        );

        try {
          await this.updateAccountStatus(result.sessionId, 2); // INACTIVE status

          // Send rejection notification
          try {
            await this.emailWorkflowService.sendPostEntityCreationNotification(
              result.sessionId,
              action,
              result.reason,
            );
          } catch (notificationError) {
            this.logger.error(
              `Failed to send rejection notification for session ${result.sessionId}: ${notificationError instanceof Error ? notificationError.message : String(notificationError)}`,
            );
          }
        } catch (statusUpdateError) {
          this.logger.error(
            `Failed to update account status to INACTIVE for session ${result.sessionId}: ${statusUpdateError instanceof Error ? statusUpdateError.message : String(statusUpdateError)}`,
          );
        }
      }

      this.logger.log(
        `Admin ${action} processed with token: ${approvalToken}, success: ${result.success}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to process admin approval with token ${approvalToken}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Resend verification email
   *
   * @param sessionId Registration session ID
   * @returns Email resend result
   */
  async resendVerificationEmail(sessionId: string) {
    this.logger.log(`Resending verification email for session: ${sessionId}`);

    try {
      // Delegate to email workflow service
      const result =
        await this.emailWorkflowService.resendVerificationEmail(sessionId);

      this.logger.log(
        `Verification email resend for session: ${sessionId}, success: ${result.success}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Get email workflow status
   *
   * @param sessionId Registration session ID
   * @returns Current email workflow status
   */
  async getEmailWorkflowStatus(sessionId: string) {
    this.logger.log(`Getting email workflow status for session: ${sessionId}`);

    try {
      // Delegate to email workflow service
      const result =
        await this.emailWorkflowService.getEmailWorkflowStatus(sessionId);

      this.logger.log(
        `Email workflow status retrieved for session: ${sessionId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to get email workflow status for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Enhanced initiate registration with email workflow option
   *
   * @param data Complete registration data
   * @param skipEmailVerification Whether to skip email verification
   * @returns Registration response with email workflow status
   */
  async initiateRegistrationWithEmailWorkflow(
    data: CompleteUserRegistrationDto,
    skipEmailVerification = false,
  ): Promise<OrchestratorResponseDto> {
    this.logger.log('🚀 Initiating registration with email workflow...');

    try {
      // 1. First, complete the standard registration initiation
      const standardResult = await this.initiateRegistration(data);

      // 2. If email verification is not skipped, initiate email workflow
      if (!skipEmailVerification && standardResult.sessionId) {
        try {
          await this.initiateEmailVerification(standardResult.sessionId);

          // Enhance response with email workflow information
          return {
            ...standardResult,
            message:
              'Registration initiated successfully. Email verification sent.',
            nextSteps: [
              'Check your email for verification link',
              'Click the verification link to proceed',
              'Wait for admin approval after email verification',
            ],
          };
        } catch (emailError) {
          this.logger.warn(
            `Email workflow initiation failed, but registration was staged: ${emailError instanceof Error ? emailError.message : String(emailError)}`,
          );

          // Return standard result with warning about email
          return {
            ...standardResult,
            message:
              'Registration initiated successfully, but email verification could not be sent.',
            nextSteps: [
              'Registration data has been staged',
              'Contact support for assistance with email verification',
            ],
          };
        }
      }

      // 3. Return standard result if email verification was skipped
      return standardResult;
    } catch (error) {
      this.logger.error(
        `Failed to initiate registration with email workflow: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ========================================
  // ENTITY CREATION WORKFLOW (PHASE 3)
  // ========================================

  /**
   * Execute the complete entity creation workflow
   *
   * PHASE 3: Entity Creation based on CSV field analysis
   * 1. Create Account first (to get osot_account_id, osot_table_accountid, osot_account_group)
   * 2. Use Account data to create dependent entities with proper relationships
   *
   * Basic implementation focusing on core Account creation workflow.
   */
  async executeEntityCreation(
    sessionId: string,
  ): Promise<OrchestratorResponseDto> {
    const startTime = Date.now();
    // Entity creation tracking - will be implemented with actual entity creation
    const _createdEntities: string[] = [];
    const _failedEntities: string[] = [];

    try {
      this.logger.log(
        `🏗️ Starting entity creation workflow for session: ${sessionId}`,
      );

      // 1. Get session data
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (!session) {
        return {
          success: false,
          message: 'Session not found or expired',
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'The registration session was not found or has expired',
            timestamp: new Date().toISOString(),
          },
        };
      }

      // 2. Validate session is in correct state
      if (session.status !== RegistrationState.APPROVED) {
        return {
          success: false,
          message: 'Session is not in approved state for entity creation',
          error: {
            code: 'INVALID_SESSION_STATE',
            message: `Session must be approved before entity creation. Current state: ${session.status}`,
            timestamp: new Date().toISOString(),
          },
        };
      }

      // 3. Update session to processing state
      await this.updateSessionStatus(sessionId, RegistrationState.PROCESSING);

      // 4. Execute basic entity creation (Account only for now)
      const creationResult = await this.createBasicAccountEntity(
        session.userData,
        sessionId,
      );

      if (creationResult.success) {
        // 5. Update session to completed
        await this.updateSessionStatus(sessionId, RegistrationState.COMPLETED);

        this.logger.log(
          `✅ Basic entity creation completed for session: ${sessionId}`,
          {
            totalDuration: Date.now() - startTime,
            accountId: creationResult.accountId,
          },
        );

        return {
          success: true,
          message: 'Account entity created successfully',
          sessionId,
          status: RegistrationState.COMPLETED,
          progress: {
            percentage: 100,
            currentStep: 'account',
            completedEntities: ['Account'],
            failedEntities: [],
            pendingEntities: [],
          },
          timestamps: {
            createdAt: session.createdAt,
            updatedAt: new Date().toISOString(),
            expiresAt: session.expiresAt,
          },
          nextSteps: [
            'Registration completed successfully',
            'Account entity created',
            'You can now access the system',
            `Account ID: ${creationResult.accountId}`,
          ],
        };
      } else {
        // 6. Update session to failed
        await this.updateSessionStatus(sessionId, RegistrationState.FAILED);

        return {
          success: false,
          message: 'Entity creation failed',
          sessionId,
          status: RegistrationState.FAILED,
          error: {
            code: 'ENTITY_CREATION_FAILED',
            message:
              creationResult.error || 'Unknown error during entity creation',
            timestamp: new Date().toISOString(),
          },
        };
      }
    } catch (error) {
      this.logger.error(
        `💥 Critical error in entity creation for session ${sessionId}:`,
        error,
      );

      // Update session to failed
      await this.updateSessionStatus(sessionId, RegistrationState.FAILED);

      return {
        success: false,
        message: `Critical error during entity creation: ${error instanceof Error ? error.message : String(error)}`,
        sessionId,
        status: RegistrationState.FAILED,
        error: {
          code: 'CRITICAL_ENTITY_CREATION_ERROR',
          message: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Create Account entity and all dependent entities (COMPLETE IMPLEMENTATION)
   *
   * PHASE 3: Complete Entity Creation Workflow
   * 1. Create Account first (to get osot_account_id, osot_table_accountid, osot_account_group)
   * 2. Use Account data to create Address, Contact, Identity, Management
   * 3. Create Education entity based on osot_account_group (OT vs OTA)
   *
   * All dependent entities use Account IDs for proper relationships.
   * Made public to be used by EmailWorkflowService for PENDING account creation.
   */
  async createBasicAccountEntity(
    registrationData: CompleteUserRegistrationDto,
    sessionId: string,
  ): Promise<{
    success: boolean;
    accountId?: string;
    accountGuid?: string;
    accountGroup?: AccountGroup;
    createdEntities?: string[];
    failedEntities?: string[];
    error?: string;
  }> {
    const createdEntities: string[] = [];
    const failedEntities: string[] = [];
    let accountResult: AccountResponseDto | null = null;

    try {
      this.logger.log(
        `🏗️ Starting complete entity creation for session: ${sessionId}`,
      );

      // ==========================================
      // STEP 1: CREATE ACCOUNT (Foundation Entity)
      // ==========================================
      // NOTE: Account uses standard create() method instead of createForAccountIntegration()
      // because it's the foundation entity that doesn't depend on other entities.
      // All subsequent entities will use createForAccountIntegration() with odata.bind
      // relationships to the Account created here.
      this.logger.debug(`Creating Account entity for session: ${sessionId}`);

      const accountDto: CreateAccountDto = {
        // Use REAL data from registration (spread operator pattern)
        ...registrationData.account,

        // Apply safe defaults for required fields if missing
        osot_first_name: registrationData.account?.osot_first_name || '',
        osot_last_name: registrationData.account?.osot_last_name || '',
        osot_email: registrationData.account?.osot_email || '',
        osot_mobile_phone: registrationData.account?.osot_mobile_phone || '',
        osot_date_of_birth: registrationData.account?.osot_date_of_birth || '',
        osot_password: registrationData.account?.osot_password || '',
        osot_account_group:
          registrationData.account?.osot_account_group !== undefined
            ? registrationData.account.osot_account_group
            : AccountGroup.OCCUPATIONAL_THERAPIST,
        osot_account_declaration:
          registrationData.account?.osot_account_declaration !== undefined
            ? registrationData.account.osot_account_declaration
            : true,
      };

      // Get session to retrieve organization GUID (resolved during initiation)
      const session = await this.orchestratorRepository.getSession(sessionId);
      const organizationGuid: string | undefined =
        session?.organizationGuid ?? undefined;

      // Create Account with organization context (multi-tenant)
      accountResult = await this.accountCrudService.create(
        accountDto,
        organizationGuid, // ✅ Pass organization GUID
        'owner',
      );
      createdEntities.push('Account');

      this.logger.log(
        `✅ Account created: ID=${accountResult.osot_account_id}, GUID=${accountResult.osot_table_accountid}, Group=${accountResult.osot_account_group}`,
      );

      // ==========================================
      // STEP 2: CREATE ADDRESS (Dependent Entity)
      // ==========================================
      if (registrationData.address) {
        try {
          this.logger.debug(
            `Creating Address entity for Account: ${accountResult.osot_account_id}`,
          );

          // Use REAL data from registration + Account relationship (following persistToDataverse pattern)
          const addressDto: CreateAddressForAccountDto = {
            // ALL fields from registration data
            ...registrationData.address,

            // INJECT Account relationship fields (like persistToDataverse does)
            osot_user_business_id: accountResult.osot_account_id,
            'osot_Table_Account@odata.bind': `/osot_table_accounts(${accountResult.osot_table_accountid})`,
          };

          // Re-add the correct relationship (like OT-Education pattern)
          addressDto['osot_Table_Account@odata.bind'] =
            `/osot_table_accounts(${accountResult.osot_table_accountid})`;

          await this.addressCrudService.createForAccountIntegration(addressDto);
          createdEntities.push('Address');
          this.logger.log(
            `✅ Address created for Account: ${accountResult.osot_account_id}`,
          );
        } catch (addressError) {
          failedEntities.push('Address');
          this.logger.error(
            `❌ Failed to create Address: ${addressError instanceof Error ? addressError.message : String(addressError)}`,
          );
        }
      }

      // ==========================================
      // STEP 3: CREATE CONTACT (Dependent Entity)
      // ==========================================
      if (registrationData.contact) {
        try {
          this.logger.debug(
            `Creating Contact entity for Account: ${accountResult.osot_account_id}`,
          );

          // Use REAL data from registration + Account relationship (following persistToDataverse pattern)
          const contactDto: CreateContactForAccountDto = {
            // ALL fields from registration data
            ...registrationData.contact,

            // INJECT Account relationship fields (like persistToDataverse does)
            osot_user_business_id: accountResult.osot_account_id,
            'osot_Table_Account@odata.bind': `/osot_table_accounts(${accountResult.osot_table_accountid})`,
          };

          // Re-add the correct relationship (like OT-Education pattern)
          contactDto['osot_Table_Account@odata.bind'] =
            `/osot_table_accounts(${accountResult.osot_table_accountid})`;

          await this.contactCrudService.createForAccountIntegration(contactDto);
          createdEntities.push('Contact');
          this.logger.log(
            `✅ Contact created for Account: ${accountResult.osot_account_id}`,
          );
        } catch (contactError) {
          failedEntities.push('Contact');
          this.logger.error(
            `❌ Failed to create Contact: ${contactError instanceof Error ? contactError.message : String(contactError)}`,
          );
        }
      }

      // ==========================================
      // STEP 4: CREATE IDENTITY (Dependent Entity)
      // ==========================================
      if (registrationData.identity) {
        try {
          this.logger.debug(
            `Creating Identity entity for Account: ${accountResult.osot_account_id}`,
          );

          // Use REAL data from registration + Account relationship (following persistToDataverse pattern)
          const identityDto: CreateIdentityForAccountDto = {
            // ALL fields from registration data
            ...registrationData.identity,

            // INJECT Account relationship fields (like persistToDataverse does)
            osot_user_business_id: accountResult.osot_account_id,
            'osot_Table_Account@odata.bind': `/osot_table_accounts(${accountResult.osot_table_accountid})`,
          };

          // Re-add the correct relationship (like OT-Education pattern)
          identityDto['osot_Table_Account@odata.bind'] =
            `/osot_table_accounts(${accountResult.osot_table_accountid})`;

          await this.identityCrudService.createForAccountIntegration(
            identityDto,
          );
          createdEntities.push('Identity');
          this.logger.log(
            `✅ Identity created for Account: ${accountResult.osot_account_id}`,
          );
        } catch (identityError) {
          failedEntities.push('Identity');
          this.logger.error(
            `❌ Failed to create Identity: ${identityError instanceof Error ? identityError.message : String(identityError)}`,
          );
        }
      }

      // ==========================================
      // STEP 5: CREATE EDUCATION (Conditional based on Account Group)
      // ==========================================
      // Use numeric account_group value directly for comparison
      const accountGroup = accountResult.osot_account_group;

      if (
        Number(accountGroup) === Number(AccountGroup.OCCUPATIONAL_THERAPIST)
      ) {
        // OT EDUCATION PATH
        if (registrationData.otEducation) {
          try {
            this.logger.debug(
              `Creating OT Education entity for Account: ${accountResult.osot_account_id} (Account Group: OT)`,
            );

            // Use REAL data from registration + Account relationship (following persistToDataverse pattern)
            const otEducationDto: CreateOtEducationForAccountDto = {
              // ALL fields from registration data
              ...registrationData.otEducation,

              // INJECT Account relationship fields (like persistToDataverse does)
              osot_user_business_id: accountResult.osot_account_id,
              'osot_Table_Account@odata.bind': `/osot_table_accounts(${accountResult.osot_table_accountid})`,
            };

            // Re-add the correct relationship
            otEducationDto['osot_Table_Account@odata.bind'] =
              `/osot_table_accounts(${accountResult.osot_table_accountid})`;

            await this.otEducationCrudService.createForAccountIntegration(
              otEducationDto,
            );
            createdEntities.push('OT Education');
            this.logger.log(
              `✅ OT Education created for Account: ${accountResult.osot_account_id}`,
            );
          } catch (otEducationError) {
            failedEntities.push('OT Education');
            this.logger.error(
              `❌ Failed to create OT Education: ${otEducationError instanceof Error ? otEducationError.message : String(otEducationError)}`,
            );
          }
        } else {
          this.logger.warn(
            `⚠️ Account Group is OT but no otEducation data provided - skipping OT Education creation`,
          );
        }
      } else if (
        Number(accountGroup) ===
        Number(AccountGroup.OCCUPATIONAL_THERAPIST_ASSISTANT)
      ) {
        // OTA EDUCATION PATH
        if (registrationData.otaEducation) {
          try {
            this.logger.debug(
              `Creating OTA Education entity for Account: ${accountResult.osot_account_id} (Account Group: OTA)`,
            );

            // Use REAL data from registration + Account relationship (following persistToDataverse pattern)
            const otaEducationDto: CreateOtaEducationForAccountDto = {
              // ALL fields from registration data
              ...registrationData.otaEducation,

              // INJECT Account relationship fields (like persistToDataverse does)
              osot_user_business_id: accountResult.osot_account_id,
              'osot_Table_Account@odata.bind': `/osot_table_accounts(${accountResult.osot_table_accountid})`,
            };

            // Re-add the correct relationship (like OT-Education pattern)
            otaEducationDto['osot_Table_Account@odata.bind'] =
              `/osot_table_accounts(${accountResult.osot_table_accountid})`;

            await this.otaEducationCrudService.createForAccountIntegration(
              otaEducationDto,
            );
            createdEntities.push('OTA Education');
            this.logger.log(
              `✅ OTA Education created for Account: ${accountResult.osot_account_id}`,
            );
          } catch (otaEducationError) {
            failedEntities.push('OTA Education');
            this.logger.error(
              `❌ Failed to create OTA Education: ${otaEducationError instanceof Error ? otaEducationError.message : String(otaEducationError)}`,
            );
          }
        } else {
          this.logger.warn(
            `⚠️ Account Group is OTA but no otaEducation data provided - skipping OTA Education creation`,
          );
        }
      } else {
        // UNKNOWN OR OTHER ACCOUNT GROUP - SKIP EDUCATION
        this.logger.log(
          `ℹ️ Account Group '${accountGroup}' does not require education entity - skipping Education creation`,
        );
      }

      // ==========================================
      // STEP 6: CREATE MANAGEMENT (Dependent Entity)
      // ==========================================
      if (registrationData.management) {
        try {
          this.logger.debug(
            `Creating Management entity for Account: ${accountResult.osot_account_id}`,
          );

          // Use REAL data from registration + Account relationship (following persistToDataverse pattern)
          const managementDto: CreateManagementForAccountDto = {
            // ALL fields from registration data
            ...registrationData.management,

            // INJECT Account relationship fields (like persistToDataverse does)
            osot_user_business_id: accountResult.osot_account_id,
            'osot_Table_Account@odata.bind': `/osot_table_accounts(${accountResult.osot_table_accountid})`,
          };

          // Re-add the correct relationship (like OT-Education pattern)
          managementDto['osot_Table_Account@odata.bind'] =
            `/osot_table_accounts(${accountResult.osot_table_accountid})`;

          await this.managementCrudService.createForAccountIntegration(
            managementDto,
          );
          createdEntities.push('Management');
          this.logger.log(
            `✅ Management created for Account: ${accountResult.osot_account_id}`,
          );
        } catch (managementError) {
          failedEntities.push('Management');
          this.logger.error(
            `❌ Failed to create Management: ${managementError instanceof Error ? managementError.message : String(managementError)}`,
          );
        }
      }

      this.logger.log(
        `🎯 Complete entity creation workflow implemented successfully`,
      );
      this.logger.log(
        `📋 All entities: Account → Address → Contact → Identity → Education (conditional) → Management`,
      );

      // ==========================================
      // FINAL RESULT
      // ==========================================
      const totalEntities = createdEntities.length + failedEntities.length;
      const successRate =
        totalEntities > 0
          ? (createdEntities.length / totalEntities) * 100
          : 100;

      this.logger.log(
        `🎯 Entity creation completed for session: ${sessionId}`,
        {
          created: createdEntities,
          failed: failedEntities,
          successRate: `${successRate.toFixed(1)}%`,
          accountId: accountResult.osot_account_id,
        },
      );

      // Consider success if Account was created and most entities succeeded
      const isSuccess =
        createdEntities.includes('Account') &&
        failedEntities.length <= createdEntities.length;

      return {
        success: isSuccess,
        accountId: accountResult.osot_account_id,
        accountGuid: accountResult.osot_table_accountid,
        accountGroup, // Use the parsed enum, not the string label
        createdEntities,
        failedEntities,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `💥 Critical error in entity creation: ${errorMessage}`,
      );

      // If we have partial success, note what was created before failure
      if (createdEntities.length > 0) {
        this.logger.warn(
          `⚠️ Partial entities were created before failure: ${createdEntities.join(', ')}`,
        );
      }

      return {
        success: false,
        error: errorMessage,
        createdEntities,
        failedEntities,
        accountId: accountResult?.osot_account_id,
        accountGuid: accountResult?.osot_table_accountid,
        accountGroup: accountResult?.osot_account_group,
      };
    }
  }

  /**
   * Update session status in Redis
   */
  private async updateSessionStatus(
    sessionId: string,
    status: RegistrationState,
  ): Promise<void> {
    try {
      const session = await this.orchestratorRepository.getSession(sessionId);
      if (session) {
        session.status = status;
        session.updatedAt = new Date().toISOString();

        // Update progress based on status
        if (status === RegistrationState.PROCESSING) {
          session.progress.currentStep = 'account';
          session.progress.progressPercentage = 80;
        } else if (status === RegistrationState.COMPLETED) {
          session.progress.currentStep = 'account';
          session.progress.progressPercentage = 100;
        }

        await this.orchestratorRepository.updateSession(sessionId, session);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to update session status: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Update account status in Dataverse
   * @param sessionId Session ID to get account GUID
   * @param status New status (1=ACTIVE, 2=INACTIVE, 3=PENDING)
   */
  private async updateAccountStatus(
    sessionId: string,
    status: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get account GUID from session
      const accountGuid =
        await this.orchestratorRepository.getAccountGuid(sessionId);
      if (!accountGuid) {
        return {
          success: false,
          error: 'Account GUID not found for session',
        };
      }

      this.logger.log(
        `Updating account status to ${status} for account GUID: ${accountGuid}`,
      );

      // Update account status using AccountCrudService system method
      // Pass undefined for userRole so repository uses 'main' app directly for system operations
      const updateResult = await this.accountCrudService.updateSystemFields(
        accountGuid,
        {
          osot_account_status: status,
        },
        undefined, // Let repository handle app selection for system operations
      );

      if (updateResult) {
        this.logger.log(
          `Account status updated successfully to ${status} for GUID: ${accountGuid}`,
        );
        return { success: true };
      } else {
        return {
          success: false,
          error: 'Failed to update account status in Dataverse',
        };
      }
    } catch (error) {
      this.logger.error(
        `Failed to update account status for session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
