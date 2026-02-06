import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

// Services
import { AccountOrchestratorService } from '../services/account-orchestrator.service';

// DTOs and Interfaces
import { CompleteUserRegistrationDto } from '../dtos/complete-user-registration.dto';
import { OrchestratorResponseDto } from '../interfaces/orchestrator.interfaces';

// Utilities
import { createDuplicateAccountMessage } from '../../../../utils/email-mask.util';

/**
 * Account Orchestrator Public Controller
 *
 * HANDLES PUBLIC ROUTES for complete user registration workflow.
 * This controller coordinates the multi-phase registration process:
 * 1. Data staging and validation
 * 2. Email verification workflow
 * 3. Admin approval process
 * 4. Entity creation execution
 *
 * PUBLIC ROUTES:
 * - POST /public/orchestrator/register → Initiate complete registration
 * - GET /public/orchestrator/status/:sessionId → Check registration status
 * - POST /public/orchestrator/verify-email → Process email verification
 * - POST /public/orchestrator/admin/approve/:sessionId → Admin approval
 * - POST /public/orchestrator/admin/reject/:sessionId → Admin rejection
 * - POST /public/orchestrator/execute/:sessionId → Execute entity creation
 * - GET /public/orchestrator/health → Service health check
 *
 * SECURITY ARCHITECTURE:
 * - No authentication required for registration workflow
 * - Input validation and sanitization on all endpoints
 * - Session-based tracking with Redis storage
 * - Rate limiting and abuse prevention measures
 * - Comprehensive logging for security monitoring
 * - Business rule validation through comprehensive validation service
 *
 * WORKFLOW INTEGRATION:
 * - Coordinates with all entity CRUD services
 * - Integrates with email workflow service
 * - Manages session lifecycle in Redis
 * - Provides real-time status tracking
 * - Supports partial failure recovery
 *
 * @follows REST API Standards, OpenAPI Specification
 * @integrates AccountOrchestratorService for complete workflow coordination
 * @author OSOT Development Team
 * @version 1.0.0 - Complete Registration Orchestrator
 */
@ApiTags('Public Account Orchestrator Operations')
@Controller('public/orchestrator')
export class AccountOrchestratorPublicController {
  private readonly logger = new Logger(
    AccountOrchestratorPublicController.name,
  );

  constructor(
    private readonly orchestratorService: AccountOrchestratorService,
  ) {
    this.logger.log(
      'Account Orchestrator Public Controller initialized successfully',
    );
  }

  // ========================================
  // REGISTRATION WORKFLOW ROUTES
  // ========================================

  /**
   * Initiate complete user registration
   *
   * @param registrationData - Complete user registration data
   * @param skipEmailVerification - Optional: Skip email verification for testing
   * @returns Promise<OrchestratorResponseDto>
   */
  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Initiate complete user registration workflow',
    description:
      'Stages complete registration data, validates it, and initiates the registration workflow with optional email verification.',
  })
  @ApiBody({ type: CompleteUserRegistrationDto })
  @ApiQuery({
    name: 'skipEmailVerification',
    required: false,
    type: Boolean,
    description: 'Skip email verification step (for testing purposes)',
  })
  @ApiResponse({
    status: 202,
    description:
      'Registration initiated successfully. Returns session ID for tracking.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data format or validation errors.',
  })
  @ApiResponse({
    status: 409,
    description: 'Business rule violations (email/person uniqueness).',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during registration initiation.',
  })
  async initiateRegistration(
    @Body() registrationData: CompleteUserRegistrationDto,
    @Query('skipEmailVerification') skipEmailVerification?: boolean,
  ): Promise<OrchestratorResponseDto> {
    this.logger.log(
      `Initiating complete user registration for email: ${registrationData.account?.osot_email}`,
    );

    try {
      // Use enhanced registration method with email workflow option
      const result =
        await this.orchestratorService.initiateRegistrationWithEmailWorkflow(
          registrationData,
          skipEmailVerification || false,
        );

      this.logger.log(
        `Registration initiated successfully with session: ${result.sessionId}`,
      );
      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Registration initiation failed: ${errorMessage}`);

      // Detect duplicate validation errors
      const isDuplicateEmail =
        errorMessage.toLowerCase().includes('email') &&
        errorMessage.toLowerCase().includes('already exists');
      const isDuplicatePerson =
        errorMessage.toLowerCase().includes('name') &&
        errorMessage.toLowerCase().includes('date of birth') &&
        errorMessage.toLowerCase().includes('already exists');

      // If it's a duplicate error, return user-friendly message with masked email
      if (isDuplicateEmail || isDuplicatePerson) {
        // Use existingAccountEmail from validation, or fallback to submitted email
        const existingEmail: string =
          (error as { existingAccountEmail?: string }).existingAccountEmail ||
          registrationData.account?.osot_email ||
          'unknown';

        const duplicateType = isDuplicateEmail ? 'email' : 'person';
        const { maskedEmail, message, suggestion } =
          createDuplicateAccountMessage(existingEmail, duplicateType);

        throw new HttpException(
          {
            statusCode: HttpStatus.CONFLICT,
            error: 'Duplicate Account',
            message,
            suggestion,
            maskedEmail,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.CONFLICT,
        );
      }

      // For other errors, throw generic error
      throw error;
    }
  }

  /**
   * Get registration status and progress
   *
   * @param sessionId - Registration session ID
   * @returns Promise<OrchestratorResponseDto>
   */
  @Get('status/:sessionId')
  @ApiParam({
    name: 'sessionId',
    description: 'Registration session ID',
    example: 'reg_1a2b3c4d_5e6f7g8h',
  })
  @ApiOperation({
    summary: 'Get registration status and progress',
    description:
      'Returns current status, progress, and next steps for a registration session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration status retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or expired.',
  })
  async getRegistrationStatus(
    @Param('sessionId') sessionId: string,
  ): Promise<OrchestratorResponseDto> {
    this.logger.log(`Getting registration status for session: ${sessionId}`);

    try {
      const status =
        await this.orchestratorService.getRegistrationStatus(sessionId);

      this.logger.log(
        `Registration status retrieved for session: ${sessionId}, status: ${status.status}`,
      );
      return status;
    } catch (error) {
      this.logger.error(
        `Failed to get registration status: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ========================================
  // EMAIL VERIFICATION WORKFLOW
  // ========================================

  /**
   * Process email verification
   *
   * @param sessionId - Registration session ID
   * @param verificationToken - Email verification token
   * @returns Promise<OrchestratorResponseDto>
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process email verification',
    description:
      'Verifies email token and advances registration to admin approval phase.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        sessionId: {
          type: 'string',
          description: 'Registration session ID',
          example: 'reg_1a2b3c4d_5e6f7g8h',
        },
        verificationToken: {
          type: 'string',
          description: 'Email verification token from email link',
          example: 'verify_abc123xyz789',
        },
      },
      required: ['sessionId', 'verificationToken'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Email verification successful.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid verification token or session.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or expired.',
  })
  async verifyEmail(
    @Body() verificationData: { sessionId: string; verificationToken: string },
  ): Promise<OrchestratorResponseDto> {
    this.logger.log(
      `Processing email verification for session: ${verificationData.sessionId}`,
    );

    try {
      const result = await this.orchestratorService.verifyEmail(
        verificationData.sessionId,
        verificationData.verificationToken,
      );

      this.logger.log(
        `Email verification completed for session: ${verificationData.sessionId}, success: ${result.success}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Email verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Resend verification email
   *
   * @param sessionId - Registration session ID
   * @returns Promise<{success: boolean, message: string}>
   */
  @Post('resend-verification/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'sessionId',
    description: 'Registration session ID',
    example: 'reg_1a2b3c4d_5e6f7g8h',
  })
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Resends the email verification link to the user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email resent successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or expired.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many resend attempts.',
  })
  async resendVerificationEmail(@Param('sessionId') sessionId: string) {
    this.logger.log(`Resending verification email for session: ${sessionId}`);

    try {
      const result =
        await this.orchestratorService.resendVerificationEmail(sessionId);

      this.logger.log(
        `Verification email resend completed for session: ${sessionId}, success: ${result.success}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ========================================
  // ADMIN APPROVAL WORKFLOW
  // ========================================

  /**
   * Process admin approval using approval token (GET for email links)
   *
   * @param approvalToken - Approval token from email
   * @returns HTML confirmation page or JSON (based on Accept header)
   */
  @Get('admin/approve/:approvalToken')
  @ApiParam({
    name: 'approvalToken',
    description: 'Approval token from admin notification email',
    example: 'approve_761f0e97ec80427e038deb1979a28',
  })
  @ApiOperation({
    summary: 'Process admin approval (GET for email links)',
    description:
      'Approves a registration using the approval token from email notification. Returns HTML page for browser or JSON for API.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration approved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or token expired.',
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid session state for approval.',
  })
  async approveRegistration(@Param('approvalToken') approvalToken: string) {
    this.logger.log(`Processing admin approval with token: ${approvalToken}`);

    try {
      const result = await this.orchestratorService.processAdminApprovalByToken(
        approvalToken,
        'approve',
      );

      this.logger.log(
        `Admin approval completed with token: ${approvalToken}, success: ${result.success}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Admin approval failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Process admin rejection (GET for email links)
   *
   * @param rejectionToken - Rejection token from admin notification email
   * @returns HTML confirmation page or JSON (based on Accept header)
   */
  @Get('admin/reject/:rejectionToken')
  @ApiParam({
    name: 'rejectionToken',
    description: 'Rejection token from admin notification email',
    example: 'reject_761f0e97ec80427e038deb1979a28',
  })
  @ApiOperation({
    summary: 'Process admin rejection (GET for email links)',
    description:
      'Rejects a registration using the rejection token from email notification. Returns HTML page for browser or JSON for API.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration rejected successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or token expired.',
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid session state for rejection.',
  })
  async rejectRegistration(@Param('rejectionToken') rejectionToken: string) {
    this.logger.log(`Processing admin rejection with token: ${rejectionToken}`);

    try {
      const result = await this.orchestratorService.processAdminApprovalByToken(
        rejectionToken,
        'reject',
      );

      this.logger.log(
        `Admin rejection completed with token: ${rejectionToken}, success: ${result.success}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Admin rejection failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ========================================
  // ENTITY CREATION EXECUTION
  // ========================================

  /**
   * Execute entity creation workflow
   *
   * @param sessionId - Registration session ID
   * @returns Promise<OrchestratorResponseDto>
   */
  @Post('execute/:sessionId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'sessionId',
    description: 'Registration session ID',
    example: 'reg_1a2b3c4d_5e6f7g8h',
  })
  @ApiOperation({
    summary: 'Execute entity creation workflow',
    description:
      'Creates all entities (Account, Address, Contact, Identity, Education, Management) for an approved registration.',
  })
  @ApiResponse({
    status: 200,
    description: 'Entity creation completed successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or expired.',
  })
  @ApiResponse({
    status: 409,
    description: 'Invalid session state for entity creation (not approved).',
  })
  @ApiResponse({
    status: 500,
    description: 'Entity creation failed.',
  })
  async executeEntityCreation(
    @Param('sessionId') sessionId: string,
  ): Promise<OrchestratorResponseDto> {
    this.logger.log(`Executing entity creation for session: ${sessionId}`);

    try {
      const result =
        await this.orchestratorService.executeEntityCreation(sessionId);

      this.logger.log(
        `Entity creation completed for session: ${sessionId}, success: ${result.success}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Entity creation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ========================================
  // WORKFLOW STATUS AND HEALTH ROUTES
  // ========================================

  /**
   * Get email workflow status
   *
   * @param sessionId - Registration session ID
   * @returns Promise<{status: string, details: object}>
   */
  @Get('email-status/:sessionId')
  @ApiParam({
    name: 'sessionId',
    description: 'Registration session ID',
    example: 'reg_1a2b3c4d_5e6f7g8h',
  })
  @ApiOperation({
    summary: 'Get email workflow status',
    description:
      'Returns detailed email workflow status including verification attempts and timestamps.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email workflow status retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found or expired.',
  })
  async getEmailWorkflowStatus(@Param('sessionId') sessionId: string) {
    this.logger.log(`Getting email workflow status for session: ${sessionId}`);

    try {
      const status =
        await this.orchestratorService.getEmailWorkflowStatus(sessionId);

      this.logger.log(
        `Email workflow status retrieved for session: ${sessionId}`,
      );
      return status;
    } catch (error) {
      this.logger.error(
        `Failed to get email workflow status: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Service health check
   *
   * @returns Health status object
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check for orchestrator service',
    description: 'Returns service health status and dependencies check.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy.',
  })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'account-orchestrator-public',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      features: {
        registration: true,
        emailVerification: true,
        adminApproval: true,
        entityCreation: true,
        statusTracking: true,
      },
    };
  }
}
