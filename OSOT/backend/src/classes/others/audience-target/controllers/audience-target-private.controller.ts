/**
 * Private Audience Target Controller
 *
 * AUTHENTICATED ACCESS - REQUIRES AUTHENTICATION & AUTHORIZATION
 *
 * ENDPOINTS:
 * - POST /private/audience-targets - Create new target (Admin/Main only)
 * - PATCH /private/audience-targets/:id - Update target (Admin/Main only)
 * - DELETE /private/audience-targets/:id - Delete target (Admin/Main only)
 * - GET /private/audience-targets - List all targets (Admin/Main only)
 * - GET /private/audience-targets/:id - Get target details (Admin/Main only)
 * - GET /private/audience-targets/product/:productId - Get target by product (Admin/Main only)
 * - GET /private/audience-targets/validate/:productId - Check if product can have target (Admin/Main only)
 * - POST /private/audience-targets/match - Find matching products for user profile (Admin/Main only)
 *
 * SECURITY:
 * - Requires JWT authentication
 * - Role-based access control (Admin/Main only - privilege >= 2)
 * - Audit logging for all operations
 * - Operation ID tracking for compliance
 *
 * PERMISSIONS:
 * - ALL OPERATIONS: Admin (privilege = 2) OR Main (privilege = 3)
 * - NO PUBLIC ACCESS - This is an admin-only entity
 *
 * BUSINESS RULES:
 * - One target per product (one-to-one relationship)
 * - Product lookup required for creation
 * - Product reference is immutable after creation
 * - Empty criteria = product accessible to all users
 *
 * @file audience-target-private.controller.ts
 * @module AudienceTargetModule
 * @layer Controllers
 * @since 2025-12-22
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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AudienceTargetCrudService } from '../services/audience-target-crud.service';
import { AudienceTargetLookupService } from '../services/audience-target-lookup.service';
import { AudienceTargetBusinessRulesService } from '../services/audience-target-business-rules.service';
import { CreateAudienceTargetDto } from '../dtos/audience-target-create.dto';
import { UpdateAudienceTargetDto } from '../dtos/audience-target-update.dto';
import { ListAudienceTargetsQueryDto } from '../dtos/audience-target-list-query.dto';
import { Privilege } from '../../../../common/enums';

/**
 * Request interface with user data from JWT
 */
interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    privilege: Privilege;
    userType: 'account' | 'affiliate';
  };
}

/**
 * Private Audience Target Controller
 * Handles all admin audience target endpoints (requires Admin/Main authentication)
 */
@Controller('private/audience-targets')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Private Audience Target Operations')
@ApiBearerAuth('JWT-auth')
export class AudienceTargetPrivateController {
  private readonly logger = new Logger(AudienceTargetPrivateController.name);

  constructor(
    private readonly crudService: AudienceTargetCrudService,
    private readonly lookupService: AudienceTargetLookupService,
    private readonly businessRulesService: AudienceTargetBusinessRulesService,
  ) {}

  // ========================================
  // CREATE
  // ========================================

  /**
   * POST /private/audience-targets
   * Create a new audience target
   *
   * @param createDto - Target creation data
   * @param req - Authenticated request with user data
   * @returns Created target
   * @requires Admin/Main privilege
   */
  @Post()
  @ApiOperation({
    summary: 'Create new audience target',
    description: `
Creates a new audience target for a product.

⚠️ **IMPORTANT - ONE-TO-ONE CONSTRAINT:**
- Each product can have ONLY ONE target
- Products created via POST /private/products automatically have a target
- This endpoint will FAIL if product already has a target (409 Conflict)

**When to use this endpoint:**
- ❌ DON'T: Create target for newly created products (already done automatically)
- ✅ DO: Create target for legacy products without targets (created before auto-target feature)

**Recommended flow for new products:**
1. Create product: POST /private/products (target auto-created with open-to-all)
2. Get auto-created target: GET /private/audience-targets?productId={productCode}
3. Update targeting criteria: PATCH /private/audience-targets/{targetId}

**Use this endpoint only for:**
- Migrating legacy products that don't have targets yet
- Recreating targets after deletion (product becomes available again)

Requires Admin/Main privilege (privilege >= 2).
    `,
  })
  @ApiBody({
    type: CreateAudienceTargetDto,
    examples: {
      restrictedTarget: {
        summary: 'Restricted Target Example',
        description:
          'Target with specific criteria - only matching users can access product',
        value: {
          'osot_Table_Product@odata.bind':
            '/osot_table_products/p1r2o3d4-u5c6-7890-abcd-product123456',
          osot_account_group: [1, 2], // OT and OTA
          osot_province: [1, 3], // Ontario and BC
          osot_membership_category: [1], // Active Professional
          osot_practice_years: [3, 4, 5], // 5-15 years experience
        },
      },
      openToAllTarget: {
        summary: 'Open-to-All Target Example',
        description:
          'Target with no criteria - ALL users can access product (will trigger warning)',
        value: {
          'osot_Table_Product@odata.bind':
            '/osot_table_products/p1r2o3d4-u5c6-7890-abcd-product123456',
          // All 32 targeting fields are empty = accessible to all users
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Target created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid target data or validation failed.',
  })
  @ApiResponse({
    status: 403,
    description:
      'Insufficient privileges (requires Admin/Main - privilege >= 2).',
  })
  @ApiResponse({
    status: 409,
    description:
      'Product already has a target (one-to-one constraint violated).',
    schema: {
      example: {
        statusCode: 409,
        message:
          'Product already has a target. Only one target per product is allowed.',
        error: 'Validation Error',
        productId: 'PROD-001',
        existingTargetId: 'osot-tgt-0000123',
        hint: 'Use PATCH /private/audience-targets/{targetId} to update the existing target, or DELETE to remove it first.',
      },
    },
  })
  async create(
    @Body() createDto: CreateAudienceTargetDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const opId = `create-target-${Date.now()}`;
    this.logger.log(
      `Admin request: Create audience target for product by user ${req.user.userId} [${opId}]`,
    );

    const target = await this.businessRulesService.createWithValidation(
      createDto,
      req.user.privilege,
      req.user.userId,
      opId,
    );

    return {
      data: target,
      message: 'Audience target created successfully',
      operationId: opId,
    };
  }

  // ========================================
  // UPDATE
  // ========================================

  /**
   * PATCH /private/audience-targets/:id
   * Update an existing audience target
   *
   * @param id - Target business ID or GUID
   * @param updateDto - Target update data
   * @param req - Authenticated request with user data
   * @returns Updated target
   * @requires Admin/Main privilege
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update audience target',
    description:
      'Updates an existing audience target. Requires Admin/Main privilege. Product reference is immutable.',
  })
  @ApiParam({
    name: 'id',
    description: 'Target business ID (osot-tgt-0000001) or GUID',
    example: 'osot-tgt-0000001',
  })
  @ApiBody({
    type: UpdateAudienceTargetDto,
    examples: {
      addCriteria: {
        summary: 'Add Targeting Criteria',
        description: 'Add new targeting criteria to narrow audience',
        value: {
          osot_gender: [1, 2], // Add gender criteria
          osot_language: [1], // Add language criteria
        },
      },
      removeCriteria: {
        summary: 'Remove Targeting Criteria',
        description:
          'Remove criteria by setting to empty array (broadens audience)',
        value: {
          osot_practice_years: [], // Remove practice years restriction
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Target updated successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid update data or attempting to change product.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges (requires Admin/Main).',
  })
  @ApiResponse({
    status: 404,
    description: 'Target not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAudienceTargetDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const opId = `update-target-${Date.now()}`;
    this.logger.log(
      `Admin request: Update audience target ${id} by user ${req.user.userId} [${opId}]`,
    );

    // DEBUG: Log raw DTO received from frontend
    this.logger.debug(
      `[CONTROLLER DEBUG] DTO keys: ${JSON.stringify(Object.keys(updateDto))}`,
    );
    this.logger.debug(
      `[CONTROLLER DEBUG] DTO values: ${JSON.stringify(updateDto)}`,
    );

    const target = await this.businessRulesService.updateWithValidation(
      id,
      updateDto,
      req.user.privilege,
      req.user.userId,
      opId,
    );

    return {
      data: target,
      message: 'Audience target updated successfully',
      operationId: opId,
    };
  }

  // ========================================
  // DELETE
  // ========================================

  /**
   * DELETE /private/audience-targets/:id
   * Delete an audience target (hard delete)
   *
   * @param id - Target business ID or GUID
   * @param req - Authenticated request with user data
   * @returns Deletion confirmation
   * @requires Admin/Main privilege
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete audience target',
    description:
      'Deletes an audience target (hard delete). Requires Admin/Main privilege. Releases product for new target.',
  })
  @ApiParam({
    name: 'id',
    description: 'Target business ID (osot-tgt-0000001) or GUID',
    example: 'osot-tgt-0000001',
  })
  @ApiResponse({
    status: 200,
    description:
      'Target deleted successfully. Product now available for new target.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges (requires Admin/Main).',
  })
  @ApiResponse({
    status: 404,
    description: 'Target not found.',
  })
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    const opId = `delete-target-${Date.now()}`;
    this.logger.log(
      `Admin request: Delete audience target ${id} by user ${req.user.userId} [${opId}]`,
    );

    const deleted = await this.businessRulesService.deleteWithValidation(
      id,
      req.user.privilege,
      req.user.userId,
      opId,
    );

    return {
      success: deleted,
      message:
        'Audience target deleted successfully. Product is now available for new target.',
      operationId: opId,
    };
  }

  // ========================================
  // READ - LIST
  // ========================================

  /**
   * GET /private/audience-targets
   * List all audience targets with pagination and filters
   *
   * @param query - Query parameters for filtering/pagination
   * @param req - Authenticated request with user data
   * @returns Paginated list of targets
   * @requires Admin/Main privilege
   */
  @Get()
  @ApiOperation({
    summary: 'List audience targets',
    description:
      'Lists all audience targets with pagination and filters. Requires Admin/Main privilege.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (1-based)',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (1-100)',
    example: 20,
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    type: String,
    description:
      'Filter by product business ID (e.g., PROD-001) or GUID - returns the target linked to this product',
    example: 'PROD-001',
  })
  @ApiQuery({
    name: 'targetId',
    required: false,
    type: String,
    description: 'Filter by target business ID (exact match)',
    example: 'osot-tgt-0000001',
  })
  @ApiQuery({
    name: 'targetIdPattern',
    required: false,
    type: String,
    description: 'Filter by target business ID (partial match)',
    example: 'osot-tgt-000',
  })
  @ApiResponse({
    status: 200,
    description: 'List of targets retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges (requires Admin/Main).',
  })
  async list(
    @Query() query: ListAudienceTargetsQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const opId = `list-targets-${Date.now()}`;
    this.logger.log(
      `Admin request: List audience targets by user ${req.user.userId} [${opId}]`,
    );

    const result = await this.lookupService.list(
      query,
      req.user.privilege,
      opId,
    );

    return {
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        totalItems: result.total,
        totalPages: result.totalPages,
      },
      message: 'Audience targets retrieved successfully',
      operationId: opId,
    };
  }

  // ========================================
  // READ - BY ID
  // ========================================

  /**
   * GET /private/audience-targets/:id
   * Get audience target by ID
   *
   * @param id - Target business ID or GUID
   * @param req - Authenticated request with user data
   * @returns Target details
   * @requires Admin/Main privilege
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get audience target by ID',
    description:
      'Retrieves an audience target by business ID or GUID. Requires Admin/Main privilege.',
  })
  @ApiParam({
    name: 'id',
    description: 'Target business ID (osot-tgt-0000001) or GUID',
    example: 'osot-tgt-0000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Target retrieved successfully.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges (requires Admin/Main).',
  })
  @ApiResponse({
    status: 404,
    description: 'Target not found.',
  })
  async findById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const opId = `get-target-${Date.now()}`;
    this.logger.log(
      `Admin request: Get audience target ${id} by user ${req.user.userId} [${opId}]`,
    );

    const target = await this.lookupService.findById(
      id,
      req.user.privilege,
      opId,
    );

    if (!target) {
      throw new NotFoundException(`Audience target ${id} not found`);
    }

    return {
      data: target,
      message: 'Audience target retrieved successfully',
      operationId: opId,
    };
  }

  // ========================================
  // READ - BY PRODUCT
  // ========================================

  /**
   * GET /private/audience-targets/product/:productId
   * Get audience target by product ID
   *
   * @param productId - Product GUID
   * @param req - Authenticated request with user data
   * @returns Target details or null
   * @requires Admin/Main privilege
   */
  @Get('product/:productId')
  @ApiOperation({
    summary: 'Get audience target by product',
    description:
      'Retrieves the audience target for a specific product. Requires Admin/Main privilege.',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product GUID',
    example: 'p1r2o3d4-u5c6-7890-abcd-product123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Target retrieved successfully or not found (returns null).',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges (requires Admin/Main).',
  })
  async findByProduct(
    @Param('productId') productId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const opId = `get-target-by-product-${Date.now()}`;
    this.logger.log(
      `Admin request: Get audience target for product ${productId} by user ${req.user.userId} [${opId}]`,
    );

    const target = await this.businessRulesService.getTargetForProduct(
      productId,
      req.user.privilege,
      opId,
    );

    return {
      data: target,
      message: target
        ? 'Audience target retrieved successfully'
        : 'No audience target found for this product',
      operationId: opId,
    };
  }

  // ========================================
  // VALIDATION - CAN CREATE TARGET
  // ========================================

  /**
   * GET /private/audience-targets/validate/:productId
   * Check if product can have a target (one-to-one validation)
   *
   * @param productId - Product GUID
   * @param req - Authenticated request with user data
   * @returns Validation result
   * @requires Admin/Main privilege
   */
  @Get('validate/:productId')
  @ApiOperation({
    summary: 'Validate if product can have target',
    description:
      'Checks if a product can have an audience target (one-to-one constraint). Requires Admin/Main privilege.',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product GUID',
    example: 'p1r2o3d4-u5c6-7890-abcd-product123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Validation result returned.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges (requires Admin/Main).',
  })
  async validateProduct(
    @Param('productId') productId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    const opId = `validate-product-${Date.now()}`;
    this.logger.log(
      `Admin request: Validate product ${productId} for target by user ${req.user.userId} [${opId}]`,
    );

    const canCreate = await this.businessRulesService.canCreateTargetForProduct(
      productId,
      req.user.privilege,
      opId,
    );

    return {
      canCreateTarget: canCreate,
      message: canCreate
        ? 'Product is available for audience target'
        : 'Product already has an audience target',
      operationId: opId,
    };
  }
}
