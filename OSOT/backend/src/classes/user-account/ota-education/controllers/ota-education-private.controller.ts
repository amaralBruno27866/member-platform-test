import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

// Services
import { OtaEducationCrudService } from '../services/ota-education-crud.service';
import { OtaEducationLookupService } from '../services/ota-education-lookup.service';

// DTOs
import { UpdateOtaEducationDto } from '../dtos/update-ota-education.dto';
import { OtaEducationPublicDto } from '../dtos/ota-education-public.dto';

// Mappers
import {
  mapResponseDtoToPublicDto,
  OtaEducationResponseDto,
} from '../mappers/ota-education.mapper';

// Guards and Decorators
import { User } from '../../../../utils/user.decorator';

/**
 * OTA Education Private Controller
 *
 * Handles AUTHENTICATED routes for OTA Education record management.
 * All routes require JWT authentication and proper user context.
 *
 * User Operations:
 * - GET /private/ota-educations/me → Get my OTA education record
 * - PATCH /private/ota-educations/me → Update my OTA education record
 *
 * Admin Operations:
 * - GET /private/ota-educations → List OTA education records
 * - GET /private/ota-educations/{id} → Get specific OTA education record
 * - PATCH /private/ota-educations/business/{businessId} → Update by Business ID
 */
@Controller('private/ota-educations')
@ApiTags('Private OtaEducation Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class OtaEducationPrivateController {
  private readonly logger = new Logger(OtaEducationPrivateController.name);

  constructor(
    private readonly otaEducationCrudService: OtaEducationCrudService,
    private readonly otaEducationLookupService: OtaEducationLookupService,
  ) {}

  // ========================================
  // USER SELF-MANAGEMENT ROUTES
  // ========================================

  /**
   * Get my OTA Education record
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get my OTA Education record',
    description: 'Returns the OTA Education record for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTA Education record found.',
    type: OtaEducationPublicDto,
  })
  async getMyOtaEducation(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    this.logger.log(`Getting OTA Education record for user: ${userId}`);

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    const otaEducation = await this.otaEducationCrudService.findByAccount(
      userId,
      userRole,
    );

    // Map to public DTO (filter out system fields)
    const publicData = otaEducation.map((record: OtaEducationResponseDto) =>
      mapResponseDtoToPublicDto(record),
    );

    return {
      success: true,
      data: publicData,
      message: 'OTA Education record retrieved successfully',
    };
  }

  /**
   * Update my OTA Education record
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Update my OTA Education record',
    description:
      'Updates the OTA Education record for the authenticated user with partial update support.',
  })
  @ApiBody({ type: UpdateOtaEducationDto })
  @ApiResponse({
    status: 200,
    description: 'OTA Education record updated successfully.',
    type: OtaEducationPublicDto,
  })
  async updateMyOtaEducation(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: UpdateOtaEducationDto,
  ) {
    this.logger.log(`Updating OTA Education record for user: ${userId}`);

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    // Find the user's OTA Education record first
    const existingOtaEducation =
      await this.otaEducationCrudService.findByAccount(userId, userRole);

    if (!existingOtaEducation || existingOtaEducation.length === 0) {
      return {
        success: false,
        message: 'OTA Education record not found for this user',
      };
    }

    // Update using the first record found
    const result = await this.otaEducationCrudService.update(
      existingOtaEducation[0].osot_table_ota_educationid || '',
      dto,
      userRole,
    );

    // Map to public DTO (filter out system fields)
    const publicData = mapResponseDtoToPublicDto(result);

    return {
      success: true,
      data: publicData,
      message: 'OTA Education record updated successfully',
    };
  }

  // ========================================
  // ADMIN OPERATIONS
  // ========================================

  /**
   * List OTA Education records
   */
  @Get()
  @ApiOperation({
    summary: 'List OTA Education records',
    description: 'Returns a list of OTA Education records (admin only).',
  })
  async listOtaEducation() {
    this.logger.log(`Listing OTA Education records`);

    // Get all records using findByAccount with admin privileges
    const result = await this.otaEducationCrudService.findByAccount('');

    return {
      success: true,
      data: result,
      message: 'OTA Education records retrieved successfully',
    };
  }

  /**
   * Get OTA Education record by ID
   */
  @Get(':id')
  @ApiParam({ name: 'id', description: 'OTA Education record ID' })
  @ApiOperation({
    summary: 'Get OTA Education record by ID',
    description: 'Returns a specific OTA Education record.',
  })
  async getOtaEducation(@Param('id') otaEducationId: string) {
    this.logger.log(`Getting OTA Education record: ${otaEducationId}`);

    const otaEducation =
      await this.otaEducationCrudService.findOne(otaEducationId);

    return {
      success: true,
      data: otaEducation,
      message: 'OTA Education record retrieved successfully',
    };
  }

  /**
   * Update OTA Education by business ID
   */
  @Patch('business/:businessId')
  @ApiParam({
    name: 'businessId',
    description: 'OTA Education business ID (e.g., OTAE-000001)',
  })
  @ApiOperation({
    summary: 'Update OTA Education by business ID (Admin only)',
    description:
      'Updates specific OTA Education by business ID. Requires admin privileges.',
  })
  @ApiBody({ type: UpdateOtaEducationDto })
  @ApiResponse({
    status: 200,
    description: 'OTA Education updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'OTA Education not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  async updateOtaEducationByBusinessId(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateOtaEducationDto,
  ) {
    this.logger.log(`Updating OTA Education ${businessId}`);

    // Find OTA Education by business ID
    const otaEducation =
      await this.otaEducationLookupService.findByUserBusinessId(businessId);

    if (!otaEducation) {
      return {
        success: false,
        message: 'OTA Education not found',
      };
    }

    // Update OTA Education using the record ID
    const updatedOtaEducation = await this.otaEducationCrudService.update(
      otaEducation.osot_table_ota_educationid || '',
      dto,
    );

    this.logger.log(`Successfully updated OTA Education ${businessId}`);

    return {
      success: true,
      data: updatedOtaEducation,
      message: 'OTA Education updated successfully',
    };
  }
}
