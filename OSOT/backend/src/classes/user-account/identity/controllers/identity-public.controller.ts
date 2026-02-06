import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { IdentityCrudService } from '../services/identity-crud.service';
import { CreateIdentityForAccountDto } from '../dtos/create-identity-for-account.dto';

/**
 * Public Identity Controller
 *
 * Handles PUBLIC routes for identity record creation.
 * These routes are designed to be used by the Registration Orchestrator
 * and do NOT require authentication.
 *
 * Identity Flow:
 * 1. Account is created with GUID
 * 2. POST /public/identities/create → Create identity record linked to account
 * 3. Identity record serves as cultural and personal identity information
 */
@Controller('public/identities')
@ApiTags('Public Identity Operations')
export class IdentityPublicController {
  private readonly logger = new Logger(IdentityPublicController.name);

  constructor(private readonly identityCrudService: IdentityCrudService) {}

  // ========================================
  // IDENTITY CREATION ROUTES
  // ========================================

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create identity record for account',
    description:
      'Creates an identity record linked to an existing account. Used by Registration Orchestrator.',
  })
  @ApiBody({ type: CreateIdentityForAccountDto })
  @ApiResponse({
    status: 201,
    description: 'Identity record created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid identity data format.',
  })
  async createIdentity(@Body() dto: CreateIdentityForAccountDto) {
    this.logger.log(`Creating identity record for account`);

    return await this.identityCrudService.createForAccountIntegration(dto);
  }

  // ========================================
  // HEALTH CHECK ROUTE
  // ========================================

  @Get('health')
  @ApiOperation({
    summary: 'Health check for public identity routes',
    description: 'Simple health check endpoint.',
  })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'identity-public',
      timestamp: new Date().toISOString(),
    };
  }
}
