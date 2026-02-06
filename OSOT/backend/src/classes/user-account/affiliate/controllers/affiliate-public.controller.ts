import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';

// Services
import { AffiliateRegistrationService } from '../services/affiliate-registration.service';

// DTOs and Interfaces
import { AffiliateRegistrationDto } from '../dtos/affiliate-registration.dto';
import { AffiliateEmailVerificationDto } from '../dtos/affiliate-email-verification.dto';
import { AffiliateAdminApprovalDto } from '../dtos/affiliate-admin-approval.dto';

/**
 * Affiliate Public Controller
 *
 * Handles PUBLIC routes for affiliate registration workflow.
 * These routes are designed to be used by the Registration Orchestrator
 * and do NOT require authentication.
 *
 * Registration Flow (3-Stage Process):
 * 1. POST /public/affiliates/register → Stage data in Redis
 * 2. POST /public/affiliates/verify-email → Email verification
 * 3. POST /public/affiliates/approve/{token} → Admin approval/rejection
 * 4. GET /public/affiliates/status/{sessionId} → Check registration progress
 * 5. GET /public/affiliates/health → Health check endpoint
 *
 * SECURITY ARCHITECTURE:
 * - No authentication required for registration workflow
 * - Input validation and sanitization on all endpoints
 * - Rate limiting and abuse prevention measures
 * - No sensitive data exposure in public routes
 *
 * @follows REST API Standards, OpenAPI Specification
 * @integrates AffiliateRegistrationService
 * @author OSOT Development Team
 * @version 2.0.0 - Aligned with Account Controller Pattern
 */
@ApiTags('Public Affiliate Operations')
@Controller('public/affiliates')
export class AffiliatePublicController {
  private readonly logger = new Logger(AffiliatePublicController.name);

  constructor(
    private readonly registrationService: AffiliateRegistrationService,
  ) {
    this.logger.log('Affiliate Public Controller initialized successfully');
  }

  // ========================================
  // REGISTRATION WORKFLOW ROUTES
  // ========================================

  /**
   * Stage affiliate registration data
   *
   * @param affiliateRegistrationDto - Affiliate registration data
   * @returns Promise<{success: boolean, sessionId: string, message: string}>
   */
  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Stage affiliate registration data',
    description:
      'Stages affiliate data in Redis for orchestrator workflow. Does not create permanent record.',
  })
  @ApiBody({ type: AffiliateRegistrationDto })
  @ApiResponse({
    status: 202,
    description:
      'Registration data staged successfully. Returns session ID for tracking.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid registration data format.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Duplicate affiliate detected (email or organization name already exists).',
  })
  async stageRegistration(@Body() dto: AffiliateRegistrationDto) {
    this.logger.log(
      `Staging affiliate registration for email: ${dto.osot_affiliate_email}`,
    );

    // Delegate to registration service
    return await this.registrationService.stageRegistration(dto);
  }

  /**
   * Verify affiliate email confirmation
   *
   * @param verificationDto - Email verification data
   * @returns Promise<{success: boolean, message: string}>
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email confirmation',
    description:
      'Confirms affiliate email verification and updates registration status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully.',
  })
  async verifyEmail(@Body() dto: AffiliateEmailVerificationDto) {
    this.logger.log(
      `Email verification for affiliate session: ${dto.sessionId}`,
    );

    // Delegate to registration service
    return await this.registrationService.verifyEmail(
      dto.sessionId,
      dto.verificationToken,
    );
  }

  /**
   * Admin approval/rejection action
   *
   * @param token - Admin approval token
   * @param approvalDto - Approval action details
   * @returns Promise<{success: boolean, message: string}>
   */
  @Post('approve/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Admin approval/rejection action',
    description:
      'Processes admin approval or rejection using token from email. Use approveToken for approval or rejectToken for rejection.',
  })
  @ApiParam({
    name: 'token',
    description:
      'Admin approval token from email (approveToken for approval, rejectToken for rejection)',
  })
  @ApiBody({
    description: 'Approval action details',
    type: AffiliateAdminApprovalDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Approval action processed successfully.',
  })
  async approveRegistration(
    @Param('token') token: string,
    @Body() dto: AffiliateAdminApprovalDto,
  ) {
    this.logger.log(
      `Manager ${dto.action} for affiliate token: ${token.substring(0, 8)}...`,
    );

    // TODO: Get admin ID from authentication context
    const adminId = 'temp-admin-id'; // This should come from JWT or session

    // Delegate to registration service
    return await this.registrationService.processApproval(
      token,
      dto.action,
      adminId,
      dto.reason,
    );
  }

  /**
   * Get affiliate registration status
   *
   * @param sessionId - Registration session ID
   * @returns Promise<{status: string, message: string}>
   */
  @Get('status/:sessionId')
  @ApiParam({
    name: 'sessionId',
    description: 'Affiliate registration session ID',
  })
  @ApiOperation({
    summary: 'Get affiliate registration status',
    description: 'Returns current status of affiliate registration workflow.',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration status retrieved.',
  })
  async getRegistrationStatus(@Param('sessionId') sessionId: string) {
    this.logger.log(`Checking affiliate status for session: ${sessionId}`);

    // Delegate to registration service
    return await this.registrationService.getRegistrationStatus(sessionId);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check for public affiliate routes',
    description: 'Simple health check endpoint.',
  })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'affiliate-public',
      timestamp: new Date().toISOString(),
    };
  }
}
