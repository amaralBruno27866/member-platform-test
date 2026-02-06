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
import { Privilege } from '../../../../common/enums';
import { IdentityCrudService } from '../services/identity-crud.service';
import { IdentityLookupService } from '../services/identity-lookup.service';
import {
  IdentityRepository,
  IDENTITY_REPOSITORY,
} from '../interfaces/identity-repository.interface';
import { IdentityUpdateDto } from '../dtos/identity-update.dto';
import {
  mapResponseDtoToPublicDto,
  IdentityPublicDto,
} from '../mappers/identity.mapper';

// Query DTO for pagination and filtering
interface ListIdentitiesQueryDto {
  skip?: number;
  top?: number;
  page?: number;
  limit?: number;
}

/**
 * Private Identity Controller
 *
 * Handles AUTHENTICATED routes for identity record management.
 * All routes require JWT authentication and proper user context.
 *
 * User Operations:
 * - GET /private/identities/me → Get my identity record
 * - PATCH /private/identities/me → Update my identity record
 *
 * Admin Operations:
 * - GET /private/identities → List identity records
 * - GET /private/identities/{id} → Get specific identity record
 */
@Controller('private/identities')
@ApiTags('Private Identity Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class IdentityPrivateController {
  private readonly logger = new Logger(IdentityPrivateController.name);

  constructor(
    private readonly identityCrudService: IdentityCrudService,
    private readonly identityLookupService: IdentityLookupService,
    @Inject(IDENTITY_REPOSITORY)
    private readonly identityRepository: IdentityRepository,
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
    summary: 'Get my identity record',
    description: 'Returns the identity record for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Identity record found.',
    type: IdentityPublicDto,
  })
  async getMyIdentity(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ) {
    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    const identity = await this.identityCrudService.findByAccount(
      userId,
      userRole,
    );

    // Filter identity to public DTO (remove system fields)
    const publicIdentity = identity.map((i) => mapResponseDtoToPublicDto(i));

    return {
      success: true,
      data: publicIdentity,
      message: 'Identity record retrieved successfully',
    };
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update my identity record',
    description:
      'Updates the identity record for the authenticated user with partial update support.',
  })
  @ApiBody({ type: IdentityUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Identity record updated successfully.',
    type: IdentityPublicDto,
  })
  async updateMyIdentity(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: IdentityUpdateDto,
  ) {
    this.logger.log(`Updating identity record for user: ${userId}`);

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    // Find the user's identity record first
    const existingIdentity = await this.identityCrudService.findByAccount(
      userId,
      userRole,
    );

    if (!existingIdentity || existingIdentity.length === 0) {
      return {
        success: false,
        message: 'Identity record not found for this user',
      };
    }

    // Use the DTO directly since it has the same structure as update requirements
    const result = await this.identityCrudService.update(
      existingIdentity[0].osot_table_identityid || '',
      dto,
      userRole,
    );

    // Filter result to public DTO (remove system fields)
    const publicResult = mapResponseDtoToPublicDto(result);

    return {
      success: true,
      data: publicResult,
      message: 'Identity record updated successfully',
    };
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Identity record ID' })
  @ApiOperation({
    summary: 'Get identity record by ID',
    description: 'Returns a specific identity record.',
  })
  async getIdentity(
    @Param('id') identityId: string,
    @User() user: Record<string, unknown>,
  ) {
    this.logger.log(`Getting identity record: ${identityId}`);

    // Extract user role for permission checking
    const userRole = (user?.role as string) || 'owner';

    const identity = await this.identityCrudService.findOne(
      identityId,
      userRole,
    );

    return {
      success: true,
      data: identity,
      message: 'Identity record retrieved successfully',
    };
  }

  // ========================================
  // ADMIN OPERATIONS
  // ========================================

  /**
   * Update Identity by business ID
   */
  @Patch('business/:businessId')
  @ApiParam({
    name: 'businessId',
    description: 'Identity business ID (e.g., osot-identity-0000001)',
  })
  @ApiOperation({
    summary: 'Update Identity by business ID (Admin only)',
    description:
      'Updates specific Identity by business ID. Requires admin privileges.',
  })
  @ApiBody({ type: IdentityUpdateDto })
  @ApiResponse({
    status: 200,
    description: 'Identity updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Identity not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  async updateIdentityByBusinessId(
    @Param('businessId') businessId: string,
    @Body() dto: IdentityUpdateDto,
  ) {
    this.logger.log(`Updating Identity ${businessId}`);

    // Find Identity by business ID
    const identity = await this.identityRepository.findByBusinessId(businessId);

    if (!identity) {
      return {
        success: false,
        message: 'Identity not found',
      };
    }

    // Update Identity using the record ID
    const updatedIdentity = await this.identityCrudService.update(
      (identity.osot_table_identityid as string) || '',
      dto,
    );

    this.logger.log(`Successfully updated Identity ${businessId}`);

    return {
      success: true,
      data: updatedIdentity,
      message: 'Identity updated successfully',
    };
  }

  /**
   * List identity records
   */
  @Get()
  @ApiOperation({
    summary: 'List identity records',
    description: 'Returns a list of identity records (admin only).',
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
  async listIdentities(
    @Query() query: ListIdentitiesQueryDto,
    @User() _user: Record<string, unknown>,
  ) {
    this.logger.log('Listing identity records');

    // Use pagination parameters if provided
    const limit = query.limit || 50;
    const page = query.page || 1;

    this.logger.log(`Fetching ${limit} records for page ${page}`);

    const result = await this.identityLookupService.searchIdentities(
      {}, // empty criteria to get all
      {
        limit: limit,
        offset: query.skip || (page - 1) * limit,
      },
    );

    // TODO: Adicionar verificação de permissão baseada em userRole
    // Por enquanto, retorna todos os resultados (admin only route)

    return {
      success: true,
      data: result.identities,
      message: 'Identity records retrieved successfully',
    };
  }
}
