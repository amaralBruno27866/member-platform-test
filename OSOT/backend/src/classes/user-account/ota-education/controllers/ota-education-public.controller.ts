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

// Services
import { OtaEducationBusinessRuleService } from '../services/ota-education-business-rule.service';
import { OtaEducationCrudService } from '../services/ota-education-crud.service';

// DTOs and Validators
import { CreateOtaEducationForAccountDto } from '../dtos/create-ota-education-for-account.dto';

/**
 * OTA Education Public Controller
 *
 * Handles PUBLIC routes for OTA Education operations.
 * These routes are designed for education record creation with validation
 * and do NOT require authentication.
 *
 * OTA Education Flow:
 * 1. POST /public/ota-educations/create → Create education record with validation
 * 2. GET /public/ota-educations/health → Health check endpoint
 */
@Controller('public/ota-educations')
@ApiTags('Public OtaEducation Operations')
export class OtaEducationPublicController {
  private readonly logger = new Logger(OtaEducationPublicController.name);

  constructor(
    private readonly otaEducationBusinessRuleService: OtaEducationBusinessRuleService,
    private readonly otaEducationCrudService: OtaEducationCrudService,
  ) {}

  // ========================================
  // OTA EDUCATION CREATION ROUTES
  // ========================================

  /**
   * Create OTA Education record
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create OTA Education record',
    description:
      'Creates a new OTA Education record with comprehensive validation and business rule enforcement.',
  })
  @ApiBody({ type: CreateOtaEducationForAccountDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'OTA Education record created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: { type: 'object' },
        message: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid OTA Education data format or business rule violation.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate OTA Education record detected.',
  })
  async createOtaEducation(
    @Body() createOtaEducationDto: CreateOtaEducationForAccountDto,
  ) {
    const operationId = `create_ota_education_${Date.now()}`;

    this.logger.log(
      `Creating OTA Education record - Operation: ${operationId}`,
      {
        operation: 'createOtaEducation',
        operationId,
        workDeclaration: createOtaEducationDto.osot_work_declaration,
        college: createOtaEducationDto.osot_ota_college,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Create OTA Education record with comprehensive validation
      const createdOtaEducation =
        await this.otaEducationCrudService.createForAccountIntegration(
          createOtaEducationDto,
        );

      this.logger.log(
        `OTA Education created successfully - Operation: ${operationId}`,
        {
          operation: 'createOtaEducation',
          operationId,
          otaEducationId: createdOtaEducation?.osot_ota_education_id,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        data: createdOtaEducation,
        message: 'OTA Education record created successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `OTA Education creation failed - Operation: ${operationId}`,
        {
          operation: 'createOtaEducation',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw error; // Let the error propagate with proper context
    }
  }

  // ========================================
  // HEALTH CHECK ROUTE
  // ========================================

  /**
   * Health check for public OTA education routes
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check for public OTA education routes',
    description: 'Simple health check endpoint.',
  })
  healthCheck() {
    return {
      status: 'healthy',
      service: 'ota-education-public',
      timestamp: new Date().toISOString(),
    };
  }
}
