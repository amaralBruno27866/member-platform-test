/**
 * Private Product Controller
 *
 * AUTHENTICATED ACCESS - REQUIRES AUTHENTICATION & AUTHORIZATION
 *
 * ENDPOINTS:
 * - POST /private/products - Create new product (Admin only)
 * - PATCH /private/products/:id - Update product (Admin only)
 * - DELETE /private/products/:id - Soft delete product (Admin only)
 * - DELETE /private/products/:id/permanent - Hard delete product (Owner only)
 * - PATCH /private/products/batch - Batch update products (Admin only)
 * - GET /private/products - List all products (Admin - includes DRAFT, DISCONTINUED)
 * - GET /private/products/:id - Get product details (Admin)
 * - GET /private/products/stats/full - Full product statistics (Admin)
 *
 * SECURITY:
 * - Requires JWT authentication
 * - Role-based access control (Admin/Owner)
 * - Audit logging for all operations
 * - Price calculation based on user membership
 *
 * PERMISSIONS:
 * - CREATE/UPDATE/DELETE: Admin (privilege = 2)
 * - HARD DELETE: Owner (privilege = 3)
 * - READ: Admin can see all statuses
 *
 * @file private-product.controller.ts
 * @module ProductModule
 * @layer Controllers
 * @since 2025-05-01
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
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductCrudService } from '../services/product-crud.service';
import { ProductLookupService } from '../services/product-lookup.service';
import { AudienceTargetLookupService } from '../../audience-target/services/audience-target-lookup.service';
import { AudienceTargetResponseDto } from '../../audience-target/dtos/audience-target-response.dto';
import { CreateProductDto } from '../dtos/create-product.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { ListProductsQueryDto } from '../dtos/list-products-query.dto';
import { Privilege } from '../../../../common/enums';
import { decryptOrganizationId } from '../../../../utils/organization-crypto.util';

/**
 * Request interface with user data from JWT
 */
interface AuthenticatedRequest extends Request {
  user: {
    userId: string; // Business ID (osot-0000123)
    userGuid: string; // Dataverse GUID for lookups
    privilege: Privilege;
    userType: 'account' | 'affiliate';
    organizationId: string; // Encrypted organization GUID
  };
}

/**
 * Private Product Controller
 * Handles all admin product endpoints (requires authentication)
 */
@Controller('private/products')
@UseGuards(AuthGuard('jwt'))
@ApiTags('Private Product Operations')
@ApiBearerAuth('JWT-auth')
export class PrivateProductController {
  private readonly logger = new Logger(PrivateProductController.name);

  constructor(
    private readonly productCrudService: ProductCrudService,
    private readonly productLookupService: ProductLookupService,
    private readonly audienceTargetLookupService: AudienceTargetLookupService,
  ) {}

  // ========================================
  // CREATE
  // ========================================

  /**
   * POST /private/products
   * Create a new product
   *
   * @param createDto - Product creation data
   * @param req - Authenticated request with user data
   * @returns Created product
   * @requires Admin privilege
   */
  @Post()
  @ApiOperation({
    summary: 'Create new product (automatically creates audience target)',
    description: `
Creates a new product with Admin privilege validation.

**AUTOMATIC BEHAVIOR:**
- ✅ Creates audience target automatically (linked to product)
- ✅ Target defaults to "open-to-all" (all 32 targeting fields = null)
- ✅ Uses retry logic (3 attempts with exponential backoff: 1s, 2s, 4s)
- ⚠️ Rollback: If target creation fails after 3 attempts, product is deleted

**NEW: User Type Filtering (2-Layer System)**
- \`userType\` field enables fast pre-filtering before audience target matching:
  - \`1\` (OT_OTA): Only visible to Account users (OT/OTA members)
  - \`2\` (AFFILIATE): Only visible to Affiliate users
  - \`3\` (BOTH): Visible to all user types (default)
- Optional field - defaults to 3 (BOTH) if not provided
- Layer 1: Filter by userType (60-70% faster)
- Layer 2: Filter by audience target (detailed matching)

**IMPORTANT - Product-Target Relationship:**
- Each product automatically gets ONE audience target upon creation
- Target is created with open-to-all configuration (accessible by all users)
- Target ID can be retrieved using: GET /private/audience-targets?productId={productCode}

**Next Steps for Frontend:**
1. ✅ Product created successfully (returns ProductResponseDto)
2. 🔍 Retrieve auto-created target: GET /private/audience-targets?productId={productCode}
3. ✏️ Configure targeting criteria: PATCH /private/audience-targets/{targetId}

**Note:** Do NOT manually create target via POST /private/audience-targets - it will fail with one-to-one constraint error.
    `,
  })
  @ApiBody({
    type: CreateProductDto,
    examples: {
      membershipProduct: {
        summary: 'Membership Product Example',
        value: {
          productName: 'OSOT Membership 2025',
          productCode: 'MEMBERSHIP-2025',
          productDescription: 'Annual membership for OT professionals',
          productPicture: 'https://example.com/images/membership-2025.jpg',
          productCategory: 0, // 0 = MEMBERSHIP
          productStatus: 1, // 1 = AVAILABLE
          productGlCode: 9, // 9 = MEMBERSHIP_FEE_4100
          privilege: 1, // 1 = OWNER
          userType: 3, // 3 = BOTH (default - all users)
          accessModifiers: 0, // 0 = PUBLIC
          generalPrice: 100,
          otStuPrice: 50,
          otNgPrice: 75,
          otPrPrice: 100,
          otNpPrice: 80,
          otRetPrice: 60,
          otLifePrice: 0,
          otaStuPrice: 45,
          otaNgPrice: 70,
          otaNpPrice: 75,
          otaRetPrice: 55,
          otaPrPrice: 90,
          otaLifePrice: 0,
          assocPrice: 120,
          affPrimPrice: 85,
          affPremPrice: 95,
          inventory: 100,
          shipping: 10,
          taxes: 13,
          activeMembershipOnly: true,
          postPurchaseInfo:
            'Thank you for your membership! Your card will arrive within 7-10 business days.',
          productYear: '2025',
        },
      },
      eventProduct: {
        summary: 'Event Product Example (Single Price)',
        value: {
          productName: 'Annual Conference 2025',
          productCode: 'CONF-2025',
          productDescription:
            'Annual OT Conference with workshops and networking',
          productPicture: 'https://example.com/images/conference-2025.jpg',
          productCategory: 5, // 5 = CONFERENCE
          productStatus: 1, // 1 = AVAILABLE
          productGlCode: 12, // 12 = CONFERENCE_4450
          privilege: 1, // 1 = OWNER
          userType: 1, // 1 = OT_OTA (only account users)
          accessModifiers: 0, // 0 = PUBLIC
          generalPrice: 250,
          inventory: 500,
          shipping: 0,
          taxes: 13,
          activeMembershipOnly: false,
          postPurchaseInfo:
            'Conference confirmation email with venue details will be sent 48 hours before the event.',
          productYear: '2025',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully (audience target auto-created).',
    schema: {
      example: {
        data: {
          productId: 'PROD-001',
          productCode: 'PROD-001',
          productName: 'OSOT Membership 2025',
          // ... other product fields
        },
        message: 'Product created successfully',
        targetId: 'osot-tgt-0000123',
        _links: {
          target: '/private/audience-targets/osot-tgt-0000123',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data or validation failed.',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges (Admin required).',
  })
  @ApiResponse({
    status: 409,
    description: 'Product code already exists.',
    schema: {
      example: {
        statusCode: 409,
        message: 'Product code PROD-001 already exists',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description:
      'Failed to create audience target. Product creation rolled back.',
    schema: {
      example: {
        statusCode: 500,
        message:
          'Failed to create audience target for product. Product creation rolled back.',
        error: 'Internal Server Error',
        productCode: 'PROD-001',
        hint: 'Please try again. If the issue persists, contact support.',
      },
    },
  })
  async create(
    @Body() createDto: CreateProductDto,
    @Request() req: AuthenticatedRequest,
  ) {
    this.logger.log(
      `Admin request: Create product ${createDto.productCode} by user ${req.user.userId}`,
    );

    const organizationGuid = decryptOrganizationId(req.user.organizationId);

    const product = await this.productCrudService.create(
      createDto,
      req.user.privilege,
      req.user.userId,
      organizationGuid,
    );

    // Fetch the auto-created target to provide its ID
    let targetId: string | undefined;
    try {
      const target = await this.audienceTargetLookupService.findByProductId(
        product.id, // Use GUID, not business ID
        req.user.privilege,
        req.user.userId,
      );
      targetId = target?.osot_target;
    } catch (error) {
      // Log but don't fail if target lookup fails
      this.logger.warn(
        `Could not fetch target for newly created product ${product.productCode}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    return {
      data: product,
      message: 'Product created successfully',
      targetId, // Include target ID for convenience
      _links: {
        target: targetId
          ? `/private/audience-targets/${targetId}`
          : `/private/products/${product.productId}/target`,
      },
    };
  }

  // ========================================
  // UPDATE
  // ========================================

  /**
   * PATCH /private/products/:id
   * Update an existing product
   *
   * @param id - Product GUID or productId (e.g., osot-prod-0000003)
   * @param updateDto - Product update data
   * @param req - Authenticated request
   * @returns Updated product
   * @requires Admin privilege
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update product',
    description: `
Updates an existing product. Accepts GUID or productId (osot-prod-0000003). Requires Admin privilege.

**User Type Filtering (Optional Update):**
- Update \`userType\` field to change product visibility:
  - \`1\` (OT_OTA): Only for Account users (OT/OTA members)
  - \`2\` (AFFILIATE): Only for Affiliate users
  - \`3\` (BOTH): For all user types
- If not provided, existing value is preserved
- Changes take effect immediately for all API lookups
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Product GUID or productId (e.g., osot-prod-0000003)',
    example: 'osot-prod-0000003',
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Insufficient privileges.' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto,
    @Request() req: AuthenticatedRequest,
  ) {
    this.logger.log(
      `Admin request: Update product ${id} by user ${req.user.userId}`,
    );

    const organizationGuid = decryptOrganizationId(req.user.organizationId);

    const product = await this.productCrudService.update(
      id,
      updateDto,
      req.user.privilege,
      req.user.userId,
      organizationGuid,
    );

    return {
      data: product,
      message: 'Product updated successfully',
    };
  }

  /**
   * PATCH /private/products/batch
   * Batch update multiple products
   *
   * @param body - Array of product IDs and update data
   * @param req - Authenticated request
   * @returns Array of updated products
   * @requires Admin privilege
   */
  @Patch('batch')
  @ApiOperation({
    summary: 'Batch update products',
    description: 'Updates multiple products at once. Requires Admin privilege.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        updates: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Products updated successfully.' })
  @ApiResponse({ status: 403, description: 'Insufficient privileges.' })
  async batchUpdate(
    @Body() body: { ids: string[]; updates: UpdateProductDto },
    @Request() req: AuthenticatedRequest,
  ) {
    this.logger.log(
      `Admin request: Batch update ${body.ids.length} products by user ${req.user.userId}`,
    );

    const products = await this.productCrudService.batchUpdate(
      body.ids,
      body.updates,
      req.user.privilege,
      req.user.userId,
    );

    return {
      data: products,
      message: `${products.length} products updated successfully`,
    };
  }

  // ========================================
  // DELETE
  // ========================================

  /**
   * DELETE /private/products/:id
   * Soft delete a product (set status to DISCONTINUED)
   *
   * @param id - Product ID
   * @param req - Authenticated request
   * @returns Success message
   * @requires Admin privilege
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Soft delete product',
    description:
      'Sets product status to DISCONTINUED. Requires Admin privilege.',
  })
  @ApiParam({ name: 'id', description: 'Product ID (GUID)' })
  @ApiResponse({ status: 200, description: 'Product deleted (soft).' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Insufficient privileges.' })
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    this.logger.log(
      `Admin request: Soft delete product ${id} by user ${req.user.userId}`,
    );

    const organizationGuid = decryptOrganizationId(req.user.organizationId);

    await this.productCrudService.delete(
      id,
      req.user.privilege,
      req.user.userId,
      organizationGuid,
    );

    return {
      message: 'Product deleted successfully (soft delete)',
    };
  }

  /**
   * DELETE /private/products/:id/permanent
   * Hard delete a product (permanent removal)
   *
   * @param id - Product ID
   * @param req - Authenticated request
   * @returns Success message
   * @requires Owner privilege
   */
  @Delete(':id/permanent')
  @ApiOperation({
    summary: 'Hard delete product (permanent)',
    description:
      'Permanently removes product from database. Requires Owner privilege.',
  })
  @ApiParam({ name: 'id', description: 'Product ID (GUID)' })
  @ApiResponse({ status: 200, description: 'Product permanently deleted.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({ status: 403, description: 'Owner privilege required.' })
  async hardDelete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.logger.log(
      `Admin request: Hard delete product ${id} by user ${req.user.userId}`,
    );

    const organizationGuid = decryptOrganizationId(req.user.organizationId);

    await this.productCrudService.hardDelete(
      id,
      req.user.privilege,
      req.user.userId,
      organizationGuid,
    );

    return {
      message: 'Product permanently deleted',
    };
  }

  // ========================================
  // READ (ADMIN)
  // ========================================

  /**
   * GET /private/products
   * List all products (includes DRAFT, DISCONTINUED)
   *
   * @param query - Query parameters
   * @param req - Authenticated request
   * @returns Array of products with calculated prices
   * @requires Admin privilege
   */
  @Get()
  @ApiOperation({
    summary: 'List all products (Admin)',
    description:
      'Returns all products including DRAFT and DISCONTINUED. Requires Admin.',
  })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully.' })
  async findAll(
    @Query() query: ListProductsQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    this.logger.log(
      `Admin request: List all products by user ${req.user.userId}`,
    );

    const organizationGuid = decryptOrganizationId(req.user.organizationId);

    // Calculate page from skip/take
    const limit = query.take || 12;
    const skip = query.skip || 0;
    const page = Math.floor(skip / limit) + 1;

    const result = await this.productLookupService.findAll(
      {
        category: query.productCategory,
        status: query.productStatus,
        productYear: query.productYear,
        page,
        limit,
        orderBy: query.orderBy,
        organizationGuid,
      },
      req.user.userGuid, // Use GUID for Dataverse lookups
      req.user.userType,
      req.user.privilege,
    );

    return {
      data: result.products,
      meta: {
        ...result.pagination,
        skip,
        take: limit,
      },
    };
  }

  /**
   * GET /admin/products/:id
   * Get product details by ID
   *
   * @param id - Product ID
   * @param req - Authenticated request
   * @returns Product with calculated price
   * @requires Admin privilege
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    this.logger.log(
      `Admin request: Get product ${id} by user ${req.user.userId}`,
    );

    const product = await this.productLookupService.findById(
      id,
      req.user.userId,
      req.user.userType,
      req.user.privilege,
    );

    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }

    return {
      data: product,
    };
  }

  /**
   * GET /admin/products/stats/full
   * Get full product statistics
   *
   * @param req - Authenticated request
   * @returns Complete statistics
   * @requires Admin privilege
   */
  @Get('stats/full')
  async getFullStats(@Request() req: AuthenticatedRequest) {
    this.logger.log(
      `Admin request: Get full product stats by user ${req.user.userId}`,
    );

    const totalCount = await this.productLookupService.count();
    const availableCount = await this.productLookupService.countAvailable();

    return {
      data: {
        totalProducts: totalCount,
        availableProducts: availableCount,
        unavailableProducts: totalCount - availableCount,
      },
    };
  }

  // ========================================
  // AUDIENCE TARGET HELPER
  // ========================================

  /**
   * GET /private/products/:id/target
   * Get audience target for a specific product
   *
   * Convenience endpoint that combines product lookup + target retrieval
   * Useful for frontend to get target with a single request
   *
   * @param id - Product GUID or productId (e.g., PROD-001)
   * @param req - Authenticated request
   * @returns Audience target linked to the product
   * @requires Admin privilege
   */
  @Get(':id/target')
  @ApiOperation({
    summary: 'Get audience target for product',
    description: `
Retrieves the audience target linked to a specific product.

**Convenience Endpoint:**
- Combines product lookup + target retrieval in one request
- Accepts both product GUID or productId (e.g., PROD-001)
- Returns the auto-created target or null if product has no target

**Use Cases:**
- Get target immediately after creating product
- Retrieve target configuration for editing
- Check if legacy product has a target

**Note:** All products created via POST /private/products have an auto-created target.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'Product GUID or productId (e.g., PROD-001)',
    example: 'PROD-001',
  })
  @ApiResponse({
    status: 200,
    description: 'Target found and returned',
    type: AudienceTargetResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Product not found or product has no target',
    schema: {
      example: {
        statusCode: 404,
        message: 'Audience target not found for product PROD-001',
        error: 'Not Found',
        hint: 'Product may not have a target yet. Legacy products created before auto-target feature may need manual target creation.',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient privileges (requires Admin/Main).',
  })
  async getProductTarget(
    @Param('id') identifier: string,
    @Request() req: AuthenticatedRequest,
  ): Promise<{ data: AudienceTargetResponseDto }> {
    this.logger.log(
      `Admin request: Get target for product ${identifier} by user ${req.user.userId}`,
    );

    // First, resolve product identifier to get product data
    const product = await this.productLookupService.findById(
      identifier,
      req.user.userId,
      req.user.userType,
      req.user.privilege,
    );

    if (!product) {
      throw new NotFoundException(`Product ${identifier} not found`);
    }

    // Get target by product GUID
    const target = await this.audienceTargetLookupService.findByProductId(
      product.productId, // Use business ID (osot_productid)
      req.user.privilege,
      req.user.userId,
    );

    if (!target) {
      throw new NotFoundException({
        statusCode: 404,
        message: `Audience target not found for product ${product.productCode}`,
        error: 'Not Found',
        hint: 'Product may not have a target yet. Legacy products created before auto-target feature may need manual target creation.',
      });
    }

    return {
      data: target,
    };
  }
}
