import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Logger,
  Inject,
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
import { OtEducationCrudService } from '../services/ot-education-crud.service';
import { OtEducationLookupService } from '../services/ot-education-lookup.service';

// DTOs
import { UpdateOtEducationDto } from '../dtos/update-ot-education.dto';
import { OtEducationPublicDto } from '../dtos/ot-education-public.dto';

// Mappers
import {
  mapResponseDtoToPublicDto,
  OtEducationResponseDto,
} from '../mappers/ot-education.mapper';

// Guards and Decorators
import { User } from '../../../../utils/user.decorator';

// Repository
import {
  OtEducationRepository,
  OT_EDUCATION_REPOSITORY,
} from '../interfaces/ot-education-repository.interface';

/**
 * OT Education Private Controller
 *
 * Handles AUTHENTICATED routes for OT Education record management.
 * All routes require JWT authentication and proper user context.
 *
 * User Operations:
 * - GET /private/ot-educations/me → Get my OT education record
 * - PATCH /private/ot-educations/me → Update my OT education record
 *
 * Admin Operations:
 * - GET /private/ot-educations → List OT education records
 * - GET /private/ot-educations/{id} → Get specific OT education record
 * - PATCH /private/ot-educations/business/{businessId} → Update by Business ID
 */
@Controller('private/ot-educations')
@ApiTags('Private OtEducation Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class OtEducationPrivateController {
  private readonly logger = new Logger(OtEducationPrivateController.name);

  constructor(
    private readonly otEducationCrudService: OtEducationCrudService,
    private readonly otEducationLookupService: OtEducationLookupService,
    @Inject(OT_EDUCATION_REPOSITORY)
    private readonly otEducationRepository: OtEducationRepository,
  ) {}

  // ========================================
  // USER SELF-MANAGEMENT ROUTES
  // ========================================

  /**
   * Get my OT Education record
   */
  @Get('me')
  @ApiOperation({
    summary: 'Get my OT Education record',
    description: 'Returns the OT Education record for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'OT Education record found.',
    type: OtEducationPublicDto,
  })
  async getMyOtEducation(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    // Getting OT Education

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    const otEducation = await this.otEducationCrudService.findByAccount(
      userId,
      userRole,
    );

    // Map to public DTO (filter out system fields)
    const publicData = otEducation.map((record: OtEducationResponseDto) =>
      mapResponseDtoToPublicDto(record),
    );

    return {
      success: true,
      data: publicData,
      message: 'OT Education record retrieved successfully',
    };
  }

  /**
   * Update my OT Education record
   */
  @Patch('me')
  @ApiOperation({
    summary: 'Update my OT Education record',
    description:
      'Updates the OT Education record for the authenticated user with partial update support.',
  })
  @ApiBody({ type: UpdateOtEducationDto })
  @ApiResponse({
    status: 200,
    description: 'OT Education record updated successfully.',
    type: OtEducationPublicDto,
  })
  async updateMyOtEducation(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: UpdateOtEducationDto,
  ) {
    this.logger.log(`Updating OT Education record for user: ${userId}`);

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    // Find the user's OT Education record first
    const existingOtEducation = await this.otEducationCrudService.findByAccount(
      userId,
      userRole,
    );

    if (!existingOtEducation || existingOtEducation.length === 0) {
      return {
        success: false,
        message: 'OT Education record not found for this user',
      };
    }

    // Update using the first record found
    const result = await this.otEducationCrudService.update(
      existingOtEducation[0].osot_table_ot_educationid || '',
      dto,
      userRole,
    );

    // Map to public DTO (filter out system fields)
    const publicData = mapResponseDtoToPublicDto(result);

    return {
      success: true,
      data: publicData,
      message: 'OT Education record updated successfully',
    };
  }

  // ========================================
  // ADMIN OPERATIONS
  // ========================================

  /**
   * List OT Education records
   */
  @Get()
  @ApiOperation({
    summary: 'List OT Education records',
    description: 'Returns a list of OT Education records (admin only).',
  })
  async listOtEducation() {
    this.logger.log(`Listing OT Education records`);

    // Get all records using findByAccount with admin privileges
    const result = await this.otEducationCrudService.findByAccount('');

    return {
      success: true,
      data: result,
      message: 'OT Education records retrieved successfully',
    };
  }

  /**
   * Get OT Education record by ID
   */
  @Get(':id')
  @ApiParam({ name: 'id', description: 'OT Education record ID' })
  @ApiOperation({
    summary: 'Get OT Education record by ID',
    description: 'Returns a specific OT Education record.',
  })
  async getOtEducation(@Param('id') otEducationId: string) {
    this.logger.log(`Getting OT Education record: ${otEducationId}`);

    const otEducation =
      await this.otEducationCrudService.findOne(otEducationId);

    return {
      success: true,
      data: otEducation,
      message: 'OT Education record retrieved successfully',
    };
  }

  /**
   * Update OT Education by business ID
   */
  @Patch('business/:businessId')
  @ApiParam({
    name: 'businessId',
    description: 'OT Education business ID (e.g., OTED-000001)',
  })
  @ApiOperation({
    summary: 'Update OT Education by business ID (Admin only)',
    description:
      'Updates specific OT Education by business ID. Requires admin privileges.',
  })
  @ApiBody({ type: UpdateOtEducationDto })
  @ApiResponse({
    status: 200,
    description: 'OT Education updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'OT Education not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  async updateOtEducationByBusinessId(
    @Param('businessId') businessId: string,
    @Body() dto: UpdateOtEducationDto,
  ) {
    this.logger.log(`Updating OT Education ${businessId}`);

    // Find OT Education by business ID using repository
    const otEducation =
      await this.otEducationRepository.findByBusinessId(businessId);

    if (!otEducation) {
      return {
        success: false,
        message: 'OT Education not found',
      };
    }

    // Update OT Education using the record ID
    const updatedOtEducation = await this.otEducationCrudService.update(
      otEducation.osot_table_ot_educationid || '',
      dto,
    );

    this.logger.log(`Successfully updated OT Education ${businessId}`);

    return {
      success: true,
      data: updatedOtEducation,
      message: 'OT Education updated successfully',
    };
  }
}
