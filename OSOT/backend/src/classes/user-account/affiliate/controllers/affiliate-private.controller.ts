import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
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
import { AffiliateCrudService } from '../services/affiliate-crud.service';
import { AffiliateLookupService } from '../services/affiliate-lookup.service';
import { AffiliateBusinessRuleService } from '../services/affiliate-business-rule.service';
import { filterAffiliateFields } from '../utils/affiliate-security-filter.util';
import { UpdateAffiliateDto } from '../dtos/update-affiliate.dto';
import { ListAffiliatesQueryDto } from '../dtos/list-affiliates.query.dto';
import { mapResponseDtoToPublicDto } from '../mappers/affiliate.mapper';
import { AffiliatePublicDto } from '../dtos/affiliate-public.dto';

/**
 * Private Affiliate Controller
 *
 * Handles AUTHENTICATED routes for affiliate management with privilege-based access control.
 * All routes require JWT authentication and proper user context.
 * Follows the same pattern as AccountPrivateController for consistency.
 *
 * SECURITY FEATURES:
 * - JWT-based authentication with privilege extraction
 * - Role-based access control using Privilege enum
 * - SecurityLevel-based response filtering
 * - Input validation and sanitization
 *
 * User Self-Management Operations:
 * - GET /private/affiliates/me → Get my affiliate data
 * - PATCH /private/affiliates/me → Update my affiliate data
 *
 * Admin Operations:
 * - GET /private/affiliates → List all affiliates (filtered by privilege)
 * - GET /private/affiliates/{businessId} → Get specific affiliate
 * - PATCH /private/affiliates/{businessId} → Update specific affiliate
 * - GET /private/affiliates/search/email/{email} → Search by email
 *
 * ARCHITECTURAL NOTES:
 * - Affiliates can only be CREATED via public registration workflow
 * - No DELETE operations exposed (only admin can deactivate via support)
 * - Uses PATCH instead of PUT for Dataverse compatibility
 * - Response filtering based on user privileges and security levels
 */
@Controller('private/affiliates')
@ApiTags('Private Affiliate Operations')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'))
export class AffiliatePrivateController {
  private readonly logger = new Logger(AffiliatePrivateController.name);

  constructor(
    private readonly affiliateCrudService: AffiliateCrudService,
    private readonly affiliateLookupService: AffiliateLookupService,
    private readonly businessRuleService: AffiliateBusinessRuleService,
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
    summary: 'Get my affiliate information',
    description:
      'Returns authenticated user affiliate data with internal fields filtered by role.',
  })
  @ApiResponse({
    status: 200,
    description: 'Affiliate data retrieved successfully.',
    type: AffiliatePublicDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Affiliate not found.',
  })
  async getMyAffiliate(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
  ): Promise<AffiliatePublicDto> {
    if (!userId) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { reason: 'missing_user_id' },
        401,
      );
    }

    // Extract user privilege
    const userPrivilege = this.getUserPrivilege(user);

    this.logger.log(
      `Getting affiliate data for user: ${userId} with privilege: ${userPrivilege}`,
    );

    // Use AffiliateLookupService for data access with user privilege level
    // Use business ID (userId) instead of email to ensure consistency even after email updates
    const affiliate = await this.affiliateLookupService.findByBusinessId(
      userId,
      userPrivilege,
    );

    if (!affiliate) {
      throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, { userId }, 404);
    }

    this.logger.log(`Successfully retrieved affiliate for user: ${userId}`);

    // EnhancedAffiliateResponse already returns labels (strings) for enum fields
    // Just map the fields to PublicDto format (already in correct format)
    return {
      osot_affiliate_id: affiliate.osot_affiliate_id ?? null,
      osot_affiliate_name: affiliate.osot_affiliate_name ?? null,
      osot_affiliate_area: affiliate.osot_affiliate_area ?? null,
      osot_affiliate_email: affiliate.osot_affiliate_email ?? null,
      osot_affiliate_phone: affiliate.osot_affiliate_phone ?? null,
      osot_affiliate_website: affiliate.osot_affiliate_website ?? null,
      osot_representative_first_name:
        affiliate.osot_representative_first_name ?? null,
      osot_representative_last_name:
        affiliate.osot_representative_last_name ?? null,
      osot_representative_job_title:
        affiliate.osot_representative_job_title ?? null,
      osot_affiliate_address_1: affiliate.osot_affiliate_address_1 ?? null,
      osot_affiliate_address_2: affiliate.osot_affiliate_address_2 ?? null,
      osot_affiliate_city: affiliate.osot_affiliate_city ?? null,
      osot_affiliate_province: affiliate.osot_affiliate_province ?? null,
      osot_affiliate_country: affiliate.osot_affiliate_country ?? null,
      osot_affiliate_postal_code: affiliate.osot_affiliate_postal_code ?? null,
      osot_affiliate_facebook: affiliate.osot_affiliate_facebook ?? null,
      osot_affiliate_instagram: affiliate.osot_affiliate_instagram ?? null,
      osot_affiliate_tiktok: affiliate.osot_affiliate_tiktok ?? null,
      osot_affiliate_linkedin: affiliate.osot_affiliate_linkedin ?? null,
      osot_account_declaration: affiliate.osot_account_declaration ?? null,
      osot_account_status: affiliate.osot_account_status ?? null,
    };
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update my affiliate information',
    description:
      'Updates authenticated user affiliate with role-based field filtering.',
  })
  @ApiBody({ type: UpdateAffiliateDto })
  @ApiResponse({
    status: 200,
    description: 'Affiliate updated successfully.',
    type: AffiliatePublicDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Affiliate not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation errors or invalid field access.',
  })
  async updateMyAffiliate(
    @User('userId') userId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: UpdateAffiliateDto,
  ): Promise<AffiliatePublicDto> {
    if (!userId) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { reason: 'missing_user_id' },
        401,
      );
    }

    // Extract user privilege for access control
    const userPrivilege = this.getUserPrivilege(user);

    this.logger.log(
      `Updating affiliate for user: ${userId} with privilege: ${userPrivilege}`,
    );

    // First, find the affiliate by business ID to get the internal GUID
    const affiliate = await this.affiliateLookupService.findByBusinessId(
      userId,
      userPrivilege,
    );

    if (!affiliate) {
      throw createAppError(
        ErrorCodes.ACCOUNT_NOT_FOUND,
        { businessId: userId },
        404,
      );
    }

    // Use the internal GUID for the update operation
    const internalId = affiliate.osot_table_account_affiliateid;
    if (!internalId) {
      throw createAppError(
        ErrorCodes.VALIDATION_ERROR,
        { reason: 'missing_internal_id', businessId: userId },
        500,
      );
    }

    // Update affiliate with privilege validation using internal GUID
    const updatedAffiliate = await this.affiliateCrudService.updateAffiliate(
      internalId,
      dto,
      userPrivilege,
    );

    this.logger.log(`Successfully updated affiliate for user: ${userId}`);

    // Map response DTO to public DTO (excludes password and system fields)
    return mapResponseDtoToPublicDto(updatedAffiliate);
  }

  // ========================================
  // ADMIN ROUTES (Role-based access)
  // ========================================

  @Get()
  @ApiOperation({
    summary: 'List affiliates with filtering (Admin only)',
    description:
      'Returns paginated list of affiliates with optional filtering. Requires admin privileges.',
  })
  @ApiQuery({ type: ListAffiliatesQueryDto })
  @ApiResponse({
    status: 200,
    description: 'Affiliates list retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  listAffiliates(
    @Query() query: ListAffiliatesQueryDto,
    @User() user: Record<string, unknown>,
  ) {
    // Extract user privilege for access control
    const userPrivilege = this.getUserPrivilege(user);

    // Check if user has sufficient privileges (MAIN or ADMIN only)
    if (userPrivilege === Privilege.OWNER) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { privilege: userPrivilege },
        403,
        'Insufficient privileges to list affiliates',
      );
    }

    this.logger.log(
      `Listing affiliates request from privilege: ${userPrivilege}`,
    );

    // TODO: Implement with AffiliateLookupService for advanced filtering and pagination
    // For now, return placeholder structure

    return {
      message: 'Affiliate listing not yet fully implemented',
      query,
      userPrivilege,
      // Mock response structure
      affiliates: [],
      pagination: {
        limit: 25,
        offset: 0,
        total: 0,
      },
    };
  }

  @Get(':businessId')
  @ApiParam({
    name: 'businessId',
    description: 'Affiliate business ID (e.g., osot-aff-0000001)',
  })
  @ApiOperation({
    summary: 'Get affiliate by business ID (Admin/Main only)',
    description:
      'Returns specific affiliate data by business ID. Requires MAIN or ADMIN privileges.',
  })
  @ApiResponse({
    status: 200,
    description: 'Affiliate data retrieved successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Affiliate not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  async getAffiliateByBusinessId(
    @Param('businessId') businessId: string,
    @User() user: Record<string, unknown>,
  ) {
    // Extract user privilege for access control
    const userPrivilege = this.getUserPrivilege(user);

    // Check if user has sufficient privileges (MAIN or ADMIN only)
    if (userPrivilege === Privilege.OWNER) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { businessId, privilege: userPrivilege },
        403,
        `Insufficient privileges to access affiliate ${businessId}`,
      );
    }

    this.logger.log(
      `Getting affiliate ${businessId} with privilege: ${userPrivilege}`,
    );

    // Use AffiliateCrudService to find affiliate by business ID
    const affiliate = await this.affiliateCrudService.findAffiliateById(
      businessId,
      userPrivilege,
    );

    if (!affiliate) {
      throw createAppError(ErrorCodes.ACCOUNT_NOT_FOUND, { businessId }, 404);
    }

    // Apply filtering based on user context
    const filteredAffiliate = filterAffiliateFields(
      affiliate as unknown as Record<string, unknown>,
      userPrivilege,
      {
        isOwner: false, // Admin accessing other affiliate
      },
    );

    return filteredAffiliate;
  }

  @Patch(':businessId')
  @ApiParam({
    name: 'businessId',
    description: 'Affiliate business ID (e.g., osot-aff-0000001)',
  })
  @ApiOperation({
    summary: 'Update affiliate by business ID (Admin only)',
    description:
      'Updates specific affiliate by business ID. Requires admin privileges.',
  })
  @ApiBody({ type: UpdateAffiliateDto })
  @ApiResponse({
    status: 200,
    description: 'Affiliate updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Affiliate not found.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges.',
  })
  async updateAffiliateByBusinessId(
    @Param('businessId') businessId: string,
    @User() user: Record<string, unknown>,
    @Body() dto: UpdateAffiliateDto,
  ) {
    // Extract user privilege for access control
    const userPrivilege = this.getUserPrivilege(user);

    // Check if user has sufficient privileges (MAIN or ADMIN only)
    if (userPrivilege === Privilege.OWNER) {
      throw createAppError(
        ErrorCodes.PERMISSION_DENIED,
        { businessId, privilege: userPrivilege },
        403,
        `Insufficient privileges to update affiliate ${businessId}`,
      );
    }

    this.logger.log(
      `Updating affiliate ${businessId} with privilege: ${userPrivilege}`,
    );

    // Update affiliate with privilege validation
    const updatedAffiliate = await this.affiliateCrudService.updateAffiliate(
      businessId,
      dto,
      userPrivilege,
    );

    // Apply response filtering based on user privilege
    const filteredAffiliate = filterAffiliateFields(
      updatedAffiliate as unknown as Record<string, unknown>,
      userPrivilege,
      {
        isOwner: false, // Admin updating other affiliate
      },
    );

    this.logger.log(`Successfully updated affiliate ${businessId}`);
    return filteredAffiliate;
  }
}
