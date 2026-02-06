import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../../../utils/user.decorator';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { ManagementCrudService } from '../services/management-crud.service';
import { ManagementLookupService } from '../services/management-lookup.service';
import {
  ManagementRepository,
  MANAGEMENT_REPOSITORY,
} from '../interfaces/management-repository.interface';
import { CreateManagementForAccountDto } from '../dtos/create-management-for-account.dto';
import { UpdateManagementDto } from '../dtos/update-management.dto';
import { ListManagementQueryDto } from '../dtos/list-management.query.dto';

/**
 * Private Management Controller
 *
 * Handles AUTHENTICATED routes for management record management.
 * All routes require JWT authentication and proper user context.
 *
 * User Operations:
 * - GET /private/managements/me → Get my management record
 * - PATCH /private/managements/me → Update my management record
 *
 * Admin Operations:
 * - GET /private/managements → List management records
 * - GET /private/managements/{id} → Get specific management record
 */
@Controller('private/managements')
@ApiTags('Private Management Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class ManagementPrivateController {
  private readonly logger = new Logger(ManagementPrivateController.name);

  constructor(
    private readonly managementCrudService: ManagementCrudService,
    private readonly managementLookupService: ManagementLookupService,
    @Inject(MANAGEMENT_REPOSITORY)
    private readonly managementRepository: ManagementRepository,
  ) {}

  /**
   * Extract privilege from user object (from JWT payload)
   */
  private getUserPrivilege(user: Record<string, unknown>): Privilege {
    // Extract privilege from JWT payload
    const privilege =
      (user?.privilege as number) || (user?.osot_privilege as number);

    return typeof privilege === 'number'
      ? (privilege as Privilege)
      : Privilege.OWNER; // Default to OWNER (lowest privilege) for security
  }

  // ========================================
  // USER SELF-MANAGEMENT ROUTES
  // ========================================

  @Get('me')
  @ApiOperation({
    summary: 'Get my management record',
    description: 'Returns the management record for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Management record found.',
  })
  async getMyManagement(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    this.logger.log(`Getting management record for user: ${userId}`);

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    const management = await this.managementLookupService.findByAccount(
      userId,
      undefined,
      userRole,
    );

    return {
      success: true,
      data: management,
      message: 'Management record retrieved successfully',
    };
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update my management record',
    description:
      'Updates the management record for the authenticated user without requiring account lookup.',
  })
  @ApiBody({ type: UpdateManagementDto })
  @ApiResponse({
    status: 200,
    description: 'Management record updated successfully.',
  })
  async updateMyManagement(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: UpdateManagementDto,
  ) {
    this.logger.log(`Updating management record for user: ${userId}`);

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    // Find the user's management record first
    const existingManagement = await this.managementLookupService.findByAccount(
      userId,
      undefined,
      userRole,
    );

    if (!existingManagement || existingManagement.length === 0) {
      return {
        success: false,
        message: 'Management record not found for this user',
      };
    }

    // Use the DTO directly since it has the same structure as update requirements
    const result = await this.managementCrudService.update(
      existingManagement[0].osot_table_account_managementid || '',
      dto,
      userRole,
    );

    return {
      success: true,
      data: result,
      message: 'Management record updated successfully',
    };
  }

  // ========================================
  // ADMIN OPERATIONS
  // ========================================

  /**
   * List management records
   */
  @Get()
  @ApiOperation({
    summary: 'List management records',
    description: 'Returns a list of management records (admin only).',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Number of records to skip',
  })
  @ApiQuery({
    name: 'top',
    required: false,
    type: Number,
    description: 'Number of records to return',
  })
  async listManagement(@Query() query: ListManagementQueryDto) {
    this.logger.log('Listing management records');

    const results = await this.managementLookupService.searchManagement(
      {},
      {
        limit: query.top || 50,
        offset: query.skip || 0,
      },
    );

    return {
      success: true,
      data: results,
      message: 'Management records retrieved successfully',
    };
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Management record ID' })
  @ApiOperation({
    summary: 'Get management record by ID',
    description: 'Returns a specific management record.',
  })
  async getManagement(@Param('id') managementId: string) {
    this.logger.log(`Getting management record: ${managementId}`);

    const management =
      await this.managementLookupService.findOneByGuid(managementId);

    return {
      success: true,
      data: management,
      message: 'Management record retrieved successfully',
    };
  }

  @Patch('business/:businessId')
  @ApiParam({
    name: 'businessId',
    description: 'Management business ID (e.g., MGMT-000001)',
  })
  @ApiOperation({
    summary: 'Update management by business ID (Admin only)',
    description:
      'Updates specific management by business ID. Requires admin privileges.',
  })
  @ApiBody({ type: CreateManagementForAccountDto })
  @ApiResponse({
    status: 200,
    description: 'Management updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Management not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  async updateManagementByBusinessId(
    @Param('businessId') businessId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: CreateManagementForAccountDto,
  ) {
    // Extract user privilege for access control
    const userPrivilege = this.getUserPrivilege(user);

    // Check if user has sufficient privileges (MAIN or ADMIN only)
    if (userPrivilege === Privilege.OWNER) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { businessId, privilege: userPrivilege },
        403,
        `Insufficient privileges to update management ${businessId}`,
      );
    }

    this.logger.log(
      `Updating management ${businessId} with privilege: ${userPrivilege}`,
    );

    // Find management by business ID using ManagementRepository
    const management =
      await this.managementRepository.findByBusinessId(businessId);

    if (!management) {
      throw createAppError(ErrorCodes.NOT_FOUND, { businessId }, 404);
    }

    // Update management using the management ID
    const updatedManagement = await this.managementCrudService.update(
      (management.osot_table_account_managementid as string) || '',
      dto,
    );

    this.logger.log(`Successfully updated management ${businessId}`);

    return {
      success: true,
      data: updatedManagement,
      message: 'Management updated successfully',
    };
  }
}
