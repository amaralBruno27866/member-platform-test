import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

// Services
import { AccountBusinessRulesService } from '../services/account-business-rules.service';
import { OrganizationRepository } from '../../../others/organization/repositories/organization.repository';

// DTOs
import { CreateAccountDto } from '../dtos/create-account.dto';

// Utils and Helpers
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Account Public Controller
 *
 * HANDLES PUBLIC ROUTES for account operations without authentication.
 * These routes are designed for the Registration Orchestrator workflow.
 *
 * PUBLIC ROUTES:
 * 1. POST /public/accounts/create → Create account record
 * 2. GET /public/accounts/health → Service health check
 *
 * SECURITY ARCHITECTURE:
 * - No authentication required for registration workflow
 * - Input validation and sanitization on all endpoints
 * - Business rule validation through AccountBusinessRulesService
 * - Comprehensive logging for security monitoring
 * - Integration with Registration Orchestrator
 *
 * BUSINESS RULE VALIDATION:
 * - Email uniqueness validation across the system
 * - Person uniqueness validation (firstName + lastName + dateOfBirth)
 * - Password complexity enforcement
 * - Canadian standards compliance (phone formats, date formats)
 * - Account group validation and business logic enforcement
 *
 * @follows REST API Standards, OpenAPI Specification
 * @integrates AccountBusinessRulesService for comprehensive validation
 * @author OSOT Development Team
 * @version 1.0.0 - Simplified for Orchestrator Integration
 */
@ApiTags('Public Account Operations')
@Controller('public/accounts')
export class AccountPublicController {
  private readonly logger = new Logger(AccountPublicController.name);

  constructor(
    private readonly accountBusinessRulesService: AccountBusinessRulesService,
    private readonly organizationRepository: OrganizationRepository,
  ) {
    this.logger.log('Account Public Controller initialized successfully');
  }

  // ========================================
  // ACCOUNT CREATION ROUTES
  // ========================================

  /**
   * Create account record
   *
   * @param createAccountDto - Complete account data for creation
   * @returns Promise<AccountResponseDto | null>
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create account record',
    description:
      'Creates an account record with comprehensive business rule validation. Used by Registration Orchestrator.',
  })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({
    status: 201,
    description: 'Account record created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid account data format or business rule violation.',
  })
  @ApiResponse({
    status: 409,
    description: 'Duplicate account detected (email or person already exists).',
  })
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @Headers('x-organization-slug') organizationSlug?: string,
  ) {
    const operationId = `create_account_${Date.now()}`;

    this.logger.log(`Creating account record - Operation: ${operationId}`, {
      operation: 'createAccount',
      operationId,
      emailDomain: createAccountDto.osot_email?.split('@')[1] || 'unknown',
      accountGroup: createAccountDto.osot_account_group,
      organizationSlug,
      timestamp: new Date().toISOString(),
    });

    try {
      // Resolve organization by slug (from subdomain or header)
      let organizationGuid: string | undefined;

      if (organizationSlug) {
        const organization =
          await this.organizationRepository.findBySlug(organizationSlug);

        if (!organization) {
          throw createAppError(ErrorCodes.NOT_FOUND, {
            message: 'Organization not found or inactive',
            operationId,
            organizationSlug,
          });
        }

        // Use the GUID (osot_table_organizationid), NOT the business ID
        organizationGuid = organization.osot_table_organizationid;

        this.logger.debug(`Organization resolved - Operation: ${operationId}`, {
          operation: 'createAccount',
          operationId,
          organizationSlug,
          hasOrganization: true,
          timestamp: new Date().toISOString(),
        });
      }

      // Create account with comprehensive validation
      const createdAccount =
        await this.accountBusinessRulesService.createAccountWithValidation(
          createAccountDto,
          organizationGuid, // Pass organization context
          'owner', // Public registration uses owner context for security
        );

      this.logger.log(
        `Account created successfully - Operation: ${operationId}`,
        {
          operation: 'createAccount',
          operationId,
          accountId: createdAccount?.osot_table_accountid,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        data: createdAccount,
        message: 'Account created successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Account creation failed - Operation: ${operationId}`, {
        operation: 'createAccount',
        operationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create account',
        operationId,
        operation: 'createAccount',
        originalError: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ========================================
  // UTILITY ROUTES
  // ========================================

  /**
   * Health check endpoint
   *
   * @returns {status: string, service: string, timestamp: string}
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check for public account routes',
    description: 'Simple health check endpoint for monitoring.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy.',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        service: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  healthCheck() {
    this.logger.log('Health check requested');

    return {
      status: 'healthy',
      service: 'account-public',
      timestamp: new Date().toISOString(),
    };
  }
}
