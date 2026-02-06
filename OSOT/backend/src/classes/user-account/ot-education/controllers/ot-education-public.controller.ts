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
import { OtEducationCrudService } from '../services/ot-education-crud.service';

// DTOs and Validators
import { CreateOtEducationForAccountDto } from '../dtos/create-ot-education-for-account.dto';

/**
 * OT Education Public Controller
 *
 * Handles PUBLIC routes for OT Education record creation.
 * These routes are designed to be used by the Registration Orchestrator
 * and do NOT require authentication.
 *
 * OT Education Flow:
 * 1. Account is created with GUID
 * 2. POST /public/ot-educations/create → Create OT education record linked to account
 * 3. GET /public/ot-educations/health → Health check endpoint
 */
@Controller('public/ot-educations')
@ApiTags('Public OT Education Operations')
export class OtEducationPublicController {
  private readonly logger = new Logger(OtEducationPublicController.name);

  constructor(
    private readonly otEducationCrudService: OtEducationCrudService,
  ) {}

  // ========================================
  // OT EDUCATION CREATION ROUTES
  // ========================================

  /**
   * Create OT Education record
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create OT Education record',
    description:
      'Creates an OT Education record with comprehensive business rule validation. Used by Registration Orchestrator.',
  })
  @ApiBody({ type: CreateOtEducationForAccountDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'OT Education record created successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid OT Education data format or business rule violation.',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Duplicate OT Education record detected.',
  })
  async createOtEducation(
    @Body() createOtEducationDto: CreateOtEducationForAccountDto,
  ) {
    const operationId = `create_ot_education_${Date.now()}`;

    this.logger.log(
      `Creating OT Education record - Operation: ${operationId}`,
      {
        operation: 'createOtEducation',
        operationId,
        cotoStatus: createOtEducationDto.osot_coto_status,
        university: createOtEducationDto.osot_ot_university,
        timestamp: new Date().toISOString(),
      },
    );

    try {
      // Create OT Education record with comprehensive validation
      const createdOtEducation =
        await this.otEducationCrudService.createForAccountIntegration(
          createOtEducationDto,
        );

      this.logger.log(
        `OT Education created successfully - Operation: ${operationId}`,
        {
          operation: 'createOtEducation',
          operationId,
          otEducationId: createdOtEducation?.osot_ot_education_id,
          timestamp: new Date().toISOString(),
        },
      );

      return {
        success: true,
        data: createdOtEducation,
        message: 'OT Education record created successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `OT Education creation failed - Operation: ${operationId}`,
        {
          operation: 'createOtEducation',
          operationId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      );

      throw error; // Let the error propagate with proper context
    }
  }

  // ========================================
  // UTILITY ROUTES
  // ========================================

  /**
   * Health check for public OT education routes
   */
  @Get('health')
  @ApiOperation({
    summary: 'Health check for public OT education routes',
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
      service: 'ot-education-public',
      timestamp: new Date().toISOString(),
    };
  }
}
