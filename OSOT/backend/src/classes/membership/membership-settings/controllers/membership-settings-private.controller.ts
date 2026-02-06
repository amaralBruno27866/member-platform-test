/**
 * @fileoverview Membership Settings Private Controller
 * @description Handles AUTHENTICATED routes for membership settings administration
 * @author Bruno Amaral
 * @since 2024
 *
 * Private Routes (JWT Required):
 * - POST /private/membership-settings → Create new settings (Main privilege)
 * - GET /private/membership-settings → List all settings with filtering (Admin/Main)
 * - GET /private/membership-settings/:id → Get specific settings (Admin/Main)
 * - PATCH /private/membership-settings/:id → Update settings (Admin/Main)
 * - DELETE /private/membership-settings/:id → Delete settings (Main privilege)
 *
 * Query Filters:
 * - ?group=1&year=2025&status=active
 * - ?page=1&limit=10&sortBy=osot_membership_year&sortOrder=desc
 *
 * Privilege Control:
 * - Main (3): Full CRUD access
 * - Admin (2): Read and Update only
 * - Others: Access denied
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  ForbiddenException,
  Request,
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
import { decryptOrganizationId } from '../../../../utils/organization-crypto.util';
import { Privilege, AccountStatus } from '../../../../common/enums';
import { MembershipSettingsBusinessRulesService } from '../services/membership-settings-business-rules.service';
import { MembershipSettingsCrudService } from '../services/membership-settings-crud.service';
import { MembershipSettingsLookupService } from '../services/membership-settings-lookup.service';
import { CreateMembershipSettingsDto } from '../dtos/membership-settings-create.dto';
import { BulkCreateMembershipSettingsDto } from '../dtos/bulk-create-membership-settings.dto';
import { UpdateMembershipSettingsDto } from '../dtos/membership-settings-update.dto';
import { MembershipSettingsResponseDto } from '../dtos/membership-settings-response.dto';
import { ListMembershipSettingsQueryDto } from '../dtos/list-membership-settings.query.dto';

/**
 * Authenticated user context with organization context
 */
interface AuthenticatedUserWithOrg {
  userId: string;
  privilege?: Privilege;
  organizationId: string;
  email?: string;
  role?: string;
}

@Controller('private/membership-settings')
@ApiTags('Private Membership Settings Administration')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class MembershipSettingsPrivateController {
  private readonly logger = new Logger(
    MembershipSettingsPrivateController.name,
  );

  constructor(
    private readonly businessRulesService: MembershipSettingsBusinessRulesService,
    private readonly crudService: MembershipSettingsCrudService,
    private readonly lookupService: MembershipSettingsLookupService,
  ) {}

  // ========================================
  // USER-SPECIFIC OPERATIONS (Authenticated)
  // ========================================

  @Get('my-expiration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get my membership expiration date',
    description:
      'Returns membership expiration information for the authenticated user. Calculates days remaining until renewal.',
  })
  @ApiResponse({
    status: 200,
    description: 'Membership expiration data retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        expiresDate: {
          type: 'string',
          format: 'date',
          example: '2025-12-31',
          description: 'Membership expiration date (YYYY-MM-DD)',
        },
        daysRemaining: {
          type: 'number',
          example: 45,
          description: 'Days remaining until expiration',
        },
        membershipYear: {
          type: 'string',
          example: '2025',
          description: 'Current membership year',
        },
        status: {
          type: 'string',
          example: 'active',
          description: 'Membership status',
        },
        requiresRenewal: {
          type: 'boolean',
          example: false,
          description: 'True if expiring within 30 days',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No active membership found for user.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async getMyExpiration(
    @User()
    user: {
      userId: string;
      userGuid?: string;
      email: string;
      role: string;
      privilege?: number;
      userType?: string;
    },
  ): Promise<{
    expiresDate: string;
    daysRemaining: number;
    membershipYear: string;
    category: string;
    status: string;
    requiresRenewal: boolean;
  }> {
    const { userId, userGuid, userType } = user;

    try {
      if (!userGuid) {
        // userGuid missing
        throw new BadRequestException(
          'User GUID not found in JWT. Please log in again.',
        );
      }

      // Determine if user is affiliate based on userType in JWT
      const isAffiliate = userType === 'affiliate';

      const expirationData = await this.lookupService.getMyExpiration(
        userGuid,
        isAffiliate,
      );

      return expirationData;
    } catch (error) {
      this.logger.error(
        `Failed to fetch membership expiration for ${userType || 'account'}: ${userId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // CREATE OPERATIONS (Main privilege only)
  // ========================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new membership settings',
    description:
      'Creates new membership settings. Requires Main privilege (3). Validates business rules including group-year uniqueness.',
  })
  @ApiBody({ type: CreateMembershipSettingsDto })
  @ApiResponse({
    status: 201,
    description: 'Membership settings created successfully.',
    type: MembershipSettingsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or business rule violation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges. Main privilege required.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async create(
    @Body() createDto: CreateMembershipSettingsDto,
    @User() user: AuthenticatedUserWithOrg,
  ): Promise<MembershipSettingsResponseDto> {
    const operationId = `create-${Date.now()}`;
    this.logger.log(`Creating membership settings - Operation: ${operationId}`);

    try {
      // Validate business rules first
      const validation = this.businessRulesService.validateCreate(
        createDto,
        user.privilege,
        operationId,
      );

      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Business rule validation failed',
          errors: validation.errors,
          operationId,
        });
      }

      // Extract organizationGuid from JWT for multi-tenant context
      const organizationGuid = decryptOrganizationId(user.organizationId);

      // Create settings
      const result = await this.crudService.create(
        createDto,
        organizationGuid,
        user.privilege,
        operationId,
      );

      this.logger.log(
        `Membership settings created successfully - Operation: ${operationId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to create membership settings - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create multiple membership settings',
    description:
      'Creates multiple membership settings in a single operation. Requires Main privilege (3). Maximum 50 settings per request. All settings are validated before any are created.',
  })
  @ApiBody({ type: BulkCreateMembershipSettingsDto })
  @ApiResponse({
    status: 201,
    description: 'Membership settings created successfully.',
    schema: {
      type: 'object',
      properties: {
        created: { type: 'number' },
        settings: {
          type: 'array',
          items: { $ref: '#/components/schemas/MembershipSettingsResponseDto' },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or business rule violation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges. Main privilege required.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async bulkCreate(
    @Body() bulkCreateDto: BulkCreateMembershipSettingsDto,
    @User() user: AuthenticatedUserWithOrg,
  ): Promise<{
    created: number;
    settings: MembershipSettingsResponseDto[];
  }> {
    const operationId = `bulk-create-${Date.now()}`;
    this.logger.log(
      `Creating ${bulkCreateDto.settings.length} membership settings - Operation: ${operationId}`,
    );

    try {
      // Validate all business rules first
      const allValidationErrors: string[] = [];

      for (let i = 0; i < bulkCreateDto.settings.length; i++) {
        const validation = this.businessRulesService.validateCreate(
          bulkCreateDto.settings[i],
          user.privilege,
          `${operationId}-${i}`,
        );

        if (!validation.isValid) {
          allValidationErrors.push(
            ...validation.errors.map((error) => `Setting ${i + 1}: ${error}`),
          );
        }
      }

      if (allValidationErrors.length > 0) {
        throw new BadRequestException({
          message: 'Bulk business rule validation failed',
          errors: allValidationErrors,
          operationId,
        });
      }

      // Extract organizationGuid from JWT for multi-tenant context
      const organizationGuid = decryptOrganizationId(user.organizationId);

      // Create all settings
      const createdSettings: MembershipSettingsResponseDto[] = [];

      for (let i = 0; i < bulkCreateDto.settings.length; i++) {
        const setting = await this.crudService.create(
          bulkCreateDto.settings[i],
          organizationGuid,
          user.privilege,
          `${operationId}-${i}`,
        );
        createdSettings.push(setting);
      }

      this.logger.log(
        `${createdSettings.length} membership settings created successfully - Operation: ${operationId}`,
      );

      return {
        created: createdSettings.length,
        settings: createdSettings,
      };
    } catch (error) {
      this.logger.error(
        `Failed to bulk create membership settings - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // READ OPERATIONS (Admin/Main privileges)
  // ========================================

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List membership settings with filtering',
    description:
      'Returns paginated list of membership settings with optional filtering. Admin users see all, Main users see all, others get access denied.',
  })
  @ApiQuery({
    name: 'group',
    required: false,
    type: Number,
    description: 'Filter by membership group (1=Individual, 2=Business)',
    example: 1,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: String,
    description: 'Filter by membership year (e.g., "2024", "2025", "2026")',
    example: '2025',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AccountStatus,
    description: 'Filter by status (ACTIVE/INACTIVE)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field (default: osot_membership_year)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: desc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Membership settings list retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/MembershipSettingsResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        pageSize: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges. Admin or Main privilege required.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async list(
    @Query() queryDto: ListMembershipSettingsQueryDto,
    @User() user: AuthenticatedUserWithOrg,
  ): Promise<{
    data: MembershipSettingsResponseDto[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }> {
    this.logger.log('Listing membership settings with filters', {
      queryDto,
      userPrivilege: user.privilege,
    });

    try {
      // Check permissions - Admin and Main can list all
      if (!this.canAccessAllSettings(user.privilege)) {
        throw new ForbiddenException(
          'Insufficient privileges. Admin or Main privilege required to list all settings.',
        );
      }

      // Extract organizationGuid from JWT for multi-tenant context
      const organizationGuid = decryptOrganizationId(user.organizationId);

      const results = await this.lookupService.list(
        organizationGuid,
        queryDto,
        user.privilege,
      );

      this.logger.log(`Found ${results.data.length} membership settings`);
      return results;
    } catch (error) {
      this.logger.error('Failed to list membership settings', error);
      throw error;
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get membership settings by ID',
    description:
      'Returns specific membership settings by ID. Requires Admin or Main privilege.',
  })
  @ApiParam({
    name: 'id',
    description: 'Membership settings ID',
    example: 'osot-set-0000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Membership settings retrieved successfully.',
    type: MembershipSettingsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges. Admin or Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Membership settings not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async findById(
    @Param('id') id: string,
    @User() user: AuthenticatedUserWithOrg,
  ): Promise<MembershipSettingsResponseDto> {
    this.logger.log(`Fetching membership settings by ID: ${id}`);

    try {
      // Check permissions
      if (!this.canAccessAllSettings(user.privilege)) {
        throw new ForbiddenException(
          'Insufficient privileges. Admin or Main privilege required.',
        );
      }

      // Extract organizationGuid from JWT for multi-tenant context
      const organizationGuid = decryptOrganizationId(user.organizationId);

      const result = await this.lookupService.findBySettingsId(
        organizationGuid,
        id,
        user.privilege,
      );

      this.logger.log(`Membership settings retrieved successfully: ${id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch membership settings: ${id}`, error);
      throw error;
    }
  }

  // ========================================
  // UPDATE OPERATIONS (Admin/Main privileges)
  // ========================================

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update membership settings',
    description:
      'Updates existing membership settings. Requires Admin or Main privilege. Validates business rules.',
  })
  @ApiParam({
    name: 'id',
    description: 'Membership settings ID',
    example: 'osot-set-0000001',
  })
  @ApiBody({ type: UpdateMembershipSettingsDto })
  @ApiResponse({
    status: 200,
    description: 'Membership settings updated successfully.',
    type: MembershipSettingsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or business rule violation.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges. Admin or Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Membership settings not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMembershipSettingsDto,
    @User() user: AuthenticatedUserWithOrg,
  ): Promise<MembershipSettingsResponseDto> {
    const operationId = `update-${Date.now()}`;
    this.logger.log(
      `Updating membership settings ${id} - Operation: ${operationId}`,
    );

    try {
      // Validate business rules first
      const validation = this.businessRulesService.validateUpdate(
        id,
        updateDto,
        user.privilege,
        operationId,
      );

      if (!validation.isValid) {
        throw new BadRequestException({
          message: 'Business rule validation failed',
          errors: validation.errors,
          operationId,
        });
      }

      // Extract organizationGuid from JWT for multi-tenant context
      const organizationGuid = decryptOrganizationId(user.organizationId);

      // Update settings
      const result = await this.crudService.update(
        id,
        updateDto,
        organizationGuid,
        user.privilege,
        operationId,
      );

      this.logger.log(
        `Membership settings updated successfully ${id} - Operation: ${operationId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to update membership settings ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // DELETE OPERATIONS (Main privilege only)
  // ========================================

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete membership settings',
    description:
      'Soft deletes membership settings (sets status to INACTIVE). Requires Main privilege only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Membership settings ID',
    example: 'osot-set-0000001',
  })
  @ApiResponse({
    status: 204,
    description: 'Membership settings deleted successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges. Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Membership settings not found.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error.',
  })
  async delete(
    @Param('id') id: string,
    @User() user: AuthenticatedUserWithOrg,
  ): Promise<void> {
    const operationId = `delete-${Date.now()}`;
    this.logger.log(
      `Deleting membership settings ${id} - Operation: ${operationId}`,
    );

    try {
      // Extract organizationGuid from JWT for multi-tenant context
      const organizationGuid = decryptOrganizationId(user.organizationId);

      await this.crudService.delete(
        id,
        organizationGuid,
        user.privilege,
        operationId,
      );

      this.logger.log(
        `Membership settings deleted successfully ${id} - Operation: ${operationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete membership settings ${id} - Operation: ${operationId}`,
        error,
      );
      throw error;
    }
  }

  // ========================================
  // PRIVATE HELPER METHODS
  // ========================================

  /**
   * Check if user can access all settings (including inactive)
   */
  private canAccessAllSettings(userPrivilege?: Privilege): boolean {
    return (
      userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
    );
  }
}
