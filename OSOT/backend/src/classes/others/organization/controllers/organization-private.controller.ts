/**
 * Private Organization Controller
 *
 * AUTHENTICATED ACCESS - REQUIRES AUTHENTICATION & AUTHORIZATION
 *
 * ENDPOINTS:
 * - POST /private/organization - Create new organization (Main only)
 * - PATCH /private/organization/:id - Update organization (Main only)
 * - DELETE /private/organization/:id - Soft delete organization (Main only)
 * - DELETE /private/organization/:id/permanent - Hard delete organization (Main only)
 * - GET /private/organization - List all organizations (Authenticated)
 * - GET /private/organization/:id - Get organization details (Authenticated)
 * - GET /private/organization/search - Search organizations (Authenticated)
 * - GET /private/organization/statistics - Get statistics (Authenticated)
 * - GET /private/organization/slug/:slug/available - Check slug availability (Authenticated)
 *
 * SECURITY:
 * - Requires JWT authentication
 * - Role-based access control (Main privilege = 1)
 * - Audit logging for all operations
 *
 * PERMISSIONS:
 * - CREATE/UPDATE/DELETE: Main (privilege = 1)
 * - HARD DELETE: Main (privilege = 1) - irreversible, requires confirmation
 * - READ: All authenticated users (no privilege check)
 *
 * @file organization-private.controller.ts
 * @module OrganizationModule
 * @layer Controllers
 * @since 2026-01-07
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
  Logger,
  NotFoundException,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationCrudService } from '../services/organization-crud.service';
import { OrganizationLookupService } from '../services/organization-lookup.service';
import { OrganizationBusinessRulesService } from '../services/organization-business-rules.service';
import { CreateOrganizationDto } from '../dtos/organization-create.dto';
import { UpdateOrganizationDto } from '../dtos/organization-update.dto';
import { ListOrganizationsQueryDto } from '../dtos/list-organizations.query.dto';
import { OrganizationResponseDto } from '../dtos/organization-response.dto';
import { Privilege } from '../../../../common/enums';

/**
 * Request interface with user data from JWT
 */
interface AuthenticatedRequest extends Request {
  user: {
    userId: string; // Business ID (osot-account-0000123 or osot-affiliate-0000456)
    userGuid: string; // Dataverse GUID for lookups
    privilege: Privilege;
    userType: 'account' | 'affiliate';
  };
}

/**
 * Private Organization Controller
 * Handles all authenticated organization endpoints
 */
@Controller('private/organizations')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Private Organization Operations')
@ApiBearerAuth('JWT-auth')
export class OrganizationPrivateController {
  private readonly logger = new Logger(OrganizationPrivateController.name);

  constructor(
    private readonly organizationCrudService: OrganizationCrudService,
    private readonly organizationLookupService: OrganizationLookupService,
    private readonly organizationBusinessRulesService: OrganizationBusinessRulesService,
  ) {}

  // ========================================
  // CREATE
  // ========================================

  /**
   * POST /private/organization
   * Create a new organization
   *
   * @param createDto - Organization creation data
   * @param req - Authenticated request with user data
   * @returns Created organization
   * @requires Main privilege (privilege = 1)
   */
  @Post()
  @ApiOperation({
    summary: 'Create new organization',
    description: `
Creates a new organization with Main privilege validation.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 1)

**SLUG VALIDATION:**
- Format: lowercase, alphanumeric, hyphens only (/^[a-z0-9-]+$/)
- Reserved: Cannot use system keywords (admin, api, login, etc.)
- Uniqueness: Must be unique across all organizations
- Immutability: Cannot be changed after creation

**AUTO-APPLIED DEFAULTS:**
- organization_status: ACTIVE (1)
- privilege: OWNER (1)
- access_modifier: PROTECTED (2)

**BOOTSTRAP PROBLEM:**
Note: This endpoint requires a Main user, but creating the first organization
requires a bootstrap process (seed script or special endpoint) since users
need an organization to exist first.
    `,
  })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully.',
    type: OrganizationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data (validation errors).',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Main privilege required.',
  })
  async create(
    @Body() createDto: CreateOrganizationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<OrganizationResponseDto> {
    const { userId, privilege } = req.user;
    const operationId = `create-org-${Date.now()}`;

    this.logger.log(
      `User ${userId} (privilege ${privilege}) creating organization: ${createDto.osot_slug}`,
    );

    const result = await this.organizationCrudService.create(
      createDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log(
      `Organization created successfully: ${result.osot_organizationid} (${result.osot_slug})`,
    );

    return result;
  }

  // ========================================
  // READ
  // ========================================

  /**
   * GET /private/organization
   * List all organizations with pagination and filtering
   *
   * @param query - Query parameters (page, pageSize, status, search, sorting)
   * @returns Paginated list of organizations
   * @requires Authenticated user (no privilege restriction)
   */
  @Get()
  @ApiOperation({
    summary: 'List all organizations (paginated)',
    description: `
Returns a paginated list of organizations with optional filtering and sorting.

**FILTERS:**
- status: Filter by AccountStatus (1=ACTIVE, 2=INACTIVE, 3=PENDING)
- search: Search in organization_name and legal_name (case-insensitive)
- slug: Filter by specific slug

**PAGINATION:**
- page: Page number (default: 1)
- pageSize: Items per page (default: 20)

**SORTING:**
- orderBy: Field name (e.g., "organization_name", "createdon")
- sortOrder: "asc" or "desc" (default: "asc")

**RESPONSE METADATA:**
- total: Total number of organizations matching filters
- page: Current page number
- pageSize: Items per page
- totalPages: Total number of pages
- hasNextPage: Boolean indicating if there's a next page
- hasPreviousPage: Boolean indicating if there's a previous page
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Organizations retrieved successfully.',
  })
  async findAll(@Query() query: ListOrganizationsQueryDto) {
    this.logger.log(
      `List organizations with filters: ${JSON.stringify(query)}`,
    );

    const result = await this.organizationLookupService.findAll(query);

    this.logger.log(
      `Retrieved ${result.organizations.length} organizations (page ${result.pagination.currentPage}/${result.pagination.totalPages})`,
    );

    return result;
  }

  /**
   * GET /private/organization/search
   * Search organizations by name or legal name
   *
   * @param searchTerm - Search term for name/legal_name
   * @param query - Optional pagination parameters
   * @returns Array of matching organizations
   * @requires Authenticated user (no privilege restriction)
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search organizations',
    description:
      'Searches organizations by organization_name and legal_name (case-insensitive). ' +
      'Supports pagination.',
  })
  @ApiQuery({
    name: 'searchTerm',
    description: 'Search term for name or legal name',
    example: 'Ontario',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved.',
  })
  async search(
    @Query('searchTerm') searchTerm: string,
    @Query() query: ListOrganizationsQueryDto,
  ) {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new BadRequestException('Search term is required');
    }

    this.logger.log(`Search organizations with term: "${searchTerm}"`);

    const result = await this.organizationLookupService.search(
      searchTerm,
      query,
    );

    this.logger.log(`Search found ${result.length} organizations`);

    return result;
  }

  /**
   * GET /private/organization/statistics
   * Get organization statistics
   *
   * @returns Statistics object with counts by status
   * @requires Authenticated user (no privilege restriction)
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get organization statistics',
    description:
      'Returns organization statistics including total count and breakdown by status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully.',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 150 },
        active: { type: 'number', example: 120 },
        inactive: { type: 'number', example: 20 },
        pending: { type: 'number', example: 10 },
      },
    },
  })
  async getStatistics() {
    this.logger.log('Get organization statistics');

    const stats = await this.organizationLookupService.getStatistics();

    this.logger.log(`Statistics: ${JSON.stringify(stats)}`);

    return stats;
  }

  /**
   * GET /private/organization/slug/:slug/available
   * Check if slug is available
   *
   * @param slug - Slug to check
   * @returns Availability result
   * @requires Authenticated user (no privilege restriction)
   */
  @Get('slug/:slug/available')
  @ApiOperation({
    summary: 'Check slug availability',
    description:
      'Checks if a slug is available for use (format, reserved, uniqueness). ' +
      'Useful for frontend validation during organization creation.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Slug to check',
    example: 'my-organization',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability check completed.',
    schema: {
      type: 'object',
      properties: {
        available: { type: 'boolean', example: true },
        slug: { type: 'string', example: 'my-organization' },
      },
    },
  })
  async checkSlugAvailability(@Param('slug') slug: string) {
    this.logger.log(`Check slug availability: "${slug}"`);

    const available =
      await this.organizationLookupService.isSlugAvailable(slug);

    return {
      available,
      slug,
    };
  }

  /**
   * GET /private/organization/:id
   * Get organization details by ID
   *
   * @param id - Organization identifier (GUID or business ID)
   * @returns Organization details
   * @requires Authenticated user (no privilege restriction)
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get organization by ID',
    description:
      'Returns organization details by Dataverse GUID or business ID (osot-org-0000001). ' +
      'Accepts both identifier formats.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Organization identifier (GUID or business ID like "osot-org-0000001")',
    example: 'osot-org-0000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization found.',
    type: OrganizationResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found.',
  })
  async findOne(@Param('id') id: string): Promise<OrganizationResponseDto> {
    this.logger.log(`Get organization by ID: ${id}`);

    const organization = await this.organizationLookupService.findOne(id);

    if (!organization) {
      this.logger.warn(`Organization ${id} not found`);
      throw new NotFoundException(`Organization ${id} not found`);
    }

    return organization;
  }

  // ========================================
  // UPDATE
  // ========================================

  /**
   * PATCH /private/organization/:id
   * Update organization
   *
   * @param id - Organization identifier (GUID or business ID)
   * @param updateDto - Organization update data
   * @param req - Authenticated request with user data
   * @returns Updated organization
   * @requires Main privilege (privilege = 1)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update organization',
    description: `
Updates an existing organization with Main privilege validation.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 1)

**IMPORTANT - SLUG IMMUTABILITY:**
- Slug field is EXCLUDED from updates (cannot be changed after creation)
- All other fields are updatable

**PARTIAL UPDATES:**
- Only provided fields are updated
- Omitted fields remain unchanged
- Empty strings are treated as actual updates (not skipped)

**SYSTEM FIELDS:**
- Auto-generated fields (GUID, business ID, timestamps) are excluded
- modifiedon is automatically updated by Dataverse
    `,
  })
  @ApiParam({
    name: 'id',
    description:
      'Organization identifier (GUID or business ID like "osot-org-0000001")',
    example: 'osot-org-0000001',
  })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully.',
    type: OrganizationResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data (validation errors).',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrganizationDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<OrganizationResponseDto> {
    const { userId, privilege } = req.user;
    const operationId = `update-org-${Date.now()}`;

    this.logger.log(
      `User ${userId} (privilege ${privilege}) updating organization ${id}`,
    );

    const result = await this.organizationCrudService.update(
      id,
      updateDto,
      privilege,
      userId,
      operationId,
    );

    this.logger.log(
      `Organization ${id} updated successfully: ${result.osot_slug}`,
    );

    return result;
  }

  // ========================================
  // DELETE
  // ========================================

  /**
   * DELETE /private/organization/:id
   * Soft delete organization (set status to INACTIVE)
   *
   * @param id - Organization identifier (GUID or business ID)
   * @param req - Authenticated request with user data
   * @returns Success message
   * @requires Main privilege (privilege = 1)
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete organization',
    description: `
Soft deletes an organization by setting status to INACTIVE (2).

**PERMISSION REQUIRED:**
- Main privilege (privilege = 1)

**SOFT DELETE BEHAVIOR:**
- Sets organization_status to INACTIVE (2)
- Organization data is preserved in database
- Can be reactivated by setting status back to ACTIVE
- Checks for active dependencies (accounts, affiliates)

**DEPENDENCY CHECKS:**
- Cannot delete if organization has active accounts
- Cannot delete if organization has active affiliates
- Must deactivate all dependencies first

**NOTE:** This is a reversible operation. Use DELETE /:id/permanent for permanent deletion.
    `,
  })
  @ApiParam({
    name: 'id',
    description:
      'Organization identifier (GUID or business ID like "osot-org-0000001")',
    example: 'osot-org-0000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization soft deleted successfully.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Organization soft deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete - has active dependencies.',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found.',
  })
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const { userId, privilege } = req.user;
    const operationId = `delete-org-${Date.now()}`;

    this.logger.log(
      `User ${userId} (privilege ${privilege}) soft deleting organization ${id}`,
    );

    await this.organizationCrudService.delete(
      id,
      privilege,
      userId,
      operationId,
    );

    this.logger.log(`Organization ${id} soft deleted successfully`);

    return {
      success: true,
      message: 'Organization soft deleted successfully',
    };
  }

  /**
   * DELETE /private/organization/:id/permanent
   * Hard delete organization (permanent removal)
   *
   * @param id - Organization identifier (GUID or business ID)
   * @param req - Authenticated request with user data
   * @returns Success message
   * @requires Main privilege (privilege = 1)
   */
  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Hard delete organization (PERMANENT)',
    description: `
Permanently deletes an organization from the database.

**⚠️ WARNING: IRREVERSIBLE OPERATION ⚠️**
This action cannot be undone. All organization data will be permanently removed.

**PERMISSION REQUIRED:**
- Main privilege (privilege = 1)

**HARD DELETE BEHAVIOR:**
- Permanently removes organization record from database
- All organization data is lost forever
- Cannot be recovered or reactivated
- Checks for ANY dependencies (active or inactive)

**DEPENDENCY CHECKS:**
- Cannot delete if organization has ANY accounts (active or inactive)
- Cannot delete if organization has ANY affiliates (active or inactive)
- Must completely remove all dependencies first

**USE CASE:**
- Complete cleanup of test/demo organizations
- Compliance with data deletion requests
- Removing organizations that were created in error

**RECOMMENDATION:**
- Use soft delete (DELETE /:id) in most cases
- Only use hard delete when absolutely necessary
- Always backup data before hard delete
- Confirm with user before executing
    `,
  })
  @ApiParam({
    name: 'id',
    description:
      'Organization identifier (GUID or business ID like "osot-org-0000001")',
    example: 'osot-org-0000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Organization permanently deleted.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Organization permanently deleted',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete - has dependencies (accounts/affiliates).',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Main privilege required.',
  })
  @ApiResponse({
    status: 404,
    description: 'Organization not found.',
  })
  async hardDelete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const { userId, privilege } = req.user;
    const operationId = `hard-delete-org-${Date.now()}`;

    this.logger.warn(
      `User ${userId} (privilege ${privilege}) PERMANENTLY deleting organization ${id}`,
    );

    await this.organizationCrudService.hardDelete(
      id,
      privilege,
      userId,
      operationId,
    );

    this.logger.warn(`Organization ${id} PERMANENTLY deleted`);

    return {
      success: true,
      message: 'Organization permanently deleted',
    };
  }
}
