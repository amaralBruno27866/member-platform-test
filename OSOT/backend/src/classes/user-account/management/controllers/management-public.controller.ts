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
import { ManagementCrudService } from '../services/management-crud.service';
import { CreateManagementForAccountDto } from '../dtos/create-management-for-account.dto';

/**
 * Public Management Controller
 *
 * Handles PUBLIC routes for management record creation.
 * These routes are designed to be used by the Registration Orchestrator
 * and do NOT require authentication.
 *
 * Management Flow:
 * 1. Account is created with GUID
 * 2. POST /public/managements/create → Create management record linked to account
 * 3. Management record serves as internal control
 */
@Controller('public/managements')
@ApiTags('Public Management Operations')
export class ManagementPublicController {
  private readonly logger = new Logger(ManagementPublicController.name);

  constructor(private readonly managementCrudService: ManagementCrudService) {}

  // ========================================
  // MANAGEMENT CREATION ROUTES
  // ========================================

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create management record for account',
    description:
      'Creates a management record linked to an existing account. Used by Registration Orchestrator.',
  })
  @ApiBody({ type: CreateManagementForAccountDto })
  @ApiResponse({
    status: 201,
    description: 'Management record created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid management data format.',
  })
  async createManagement(@Body() dto: CreateManagementForAccountDto) {
    this.logger.log(`Creating management record for account`);

    return await this.managementCrudService.createForAccountIntegration(dto);
  }

  // ========================================
  // HEALTH CHECK ROUTE
  // ========================================

  @Get('health')
  @ApiOperation({
    summary: 'Health check for public management routes',
    description: 'Simple health check endpoint.',
  })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'management-public',
      timestamp: new Date().toISOString(),
    };
  }
}
