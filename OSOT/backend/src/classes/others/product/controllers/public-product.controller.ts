/**
 * Public Product Controller
 *
 * PUBLIC ACCESS - NO AUTHENTICATION REQUIRED
 *
 * ENDPOINTS:
 * - GET /public/products - List all available products (catalog)
 * - GET /public/products/:id - Get product details by ID
 * - GET /public/products/code/:code - Get product by product code
 * - GET /public/products/search - Search products
 * - GET /public/products/category/:category - Products by category
 * - GET /public/products/stats - Product statistics (count)
 *
 * SECURITY:
 * - Only AVAILABLE products are visible
 * - Price calculation: general_price for unauthenticated users
 * - No sensitive data exposed
 *
 * USE CASE:
 * - E-commerce catalog browsing
 * - Landing page product display
 * - SEO-friendly product pages
 * - Public product search
 *
 * @file public-product.controller.ts
 * @module ProductModule
 * @layer Controllers
 * @since 2025-05-01
 */

import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductLookupService } from '../services/product-lookup.service';
import { ListProductsQueryDto } from '../dtos/list-products-query.dto';
import { ProductCategory } from '../enums/product-category.enum';

/**
 * Public Product Controller
 * Handles all public product endpoints (no authentication required)
 */
@Controller('public/products')
@ApiTags('Public Product Operations')
export class PublicProductController {
  private readonly logger = new Logger(PublicProductController.name);

  constructor(private readonly productLookupService: ProductLookupService) {}

  /**
   * GET /public/products
   * List all available products with pagination and filtering
   *
   * IMPORTANT: Returns only products that are:
   * 1. Status = AVAILABLE
   * 2. Active on current date (based on start_date and end_date)
   *
   * @param query - Query parameters (category, skip, top, orderBy)
   * @returns Array of available and currently active products with calculated prices
   */
  @Get()
  @ApiOperation({
    summary: 'List available and active products',
    description:
      'Returns a paginated list of AVAILABLE products that are currently active (based on date range). ' +
      "Supports filtering by category and sorting. Only products valid for today's date are shown.",
  })
  @ApiResponse({
    status: 200,
    description: 'Products retrieved successfully.',
  })
  async findAll(@Query() query: ListProductsQueryDto) {
    this.logger.log(
      `Public request: List active products with filters: ${JSON.stringify(query)}`,
    );

    // Use findActiveProducts to filter by current date automatically
    const products = await this.productLookupService.findActiveProducts(
      new Date(), // Current date
      undefined, // No userId for public access
      undefined, // No userType
      undefined, // No privilege (public access)
    );

    // Apply category filter if provided (client-side filtering)
    const filteredProducts = query.productCategory
      ? products.filter(
          (p) => p.productCategory === query.productCategory.toString(),
        )
      : products;

    // Apply pagination
    const skip = query.skip || 0;
    const take = query.take || 20;
    const paginatedProducts = filteredProducts.slice(skip, skip + take);

    return {
      data: paginatedProducts,
      meta: {
        count: paginatedProducts.length,
        total: filteredProducts.length,
        skip,
        take,
      },
    };
  }

  /**
   * GET /public/products/:id
   * Get product details by table ID
   *
   * @param id - Product table ID (GUID)
   * @returns Product with calculated price
   * @throws NotFoundException if product not found or not available
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Returns product details by Dataverse table ID if product is AVAILABLE.',
  })
  @ApiParam({ name: 'id', description: 'Product Dataverse ID (GUID)' })
  @ApiResponse({ status: 200, description: 'Product found.' })
  @ApiResponse({
    status: 404,
    description: 'Product not found or not available.',
  })
  async findById(@Param('id') id: string) {
    this.logger.log(`Public request: Get product by ID ${id}`);

    const product = await this.productLookupService.findById(
      id,
      undefined, // No userId
      undefined, // No userType
      undefined, // No privilege
    );

    if (!product) {
      throw new NotFoundException(`Product ${id} not found or not available`);
    }

    return {
      data: product,
    };
  }

  /**
   * GET /public/products/code/:code
   * Get product by product code
   *
   * @param code - Product code (unique identifier)
   * @returns Product with calculated price
   * @throws NotFoundException if product not found or not available
   */
  @Get('code/:code')
  @ApiOperation({
    summary: 'Get product by code',
    description: 'Returns product details by product code if AVAILABLE.',
  })
  @ApiParam({ name: 'code', description: 'Product code (e.g., PROD-001)' })
  @ApiResponse({ status: 200, description: 'Product found.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findByCode(@Param('code') code: string) {
    this.logger.log(`Public request: Get product by code ${code}`);

    const product = await this.productLookupService.findByProductCode(
      code,
      undefined,
      undefined,
      undefined,
    );

    if (!product) {
      throw new NotFoundException(
        `Product with code ${code} not found or not available`,
      );
    }

    return {
      data: product,
    };
  }

  /**
   * GET /public/products/category/:category
   * Get products by category
   *
   * @param category - Product category enum value
   * @returns Array of products in the category
   */
  @Get('category/:category')
  @ApiOperation({
    summary: 'Get products by category',
    description: 'Returns all AVAILABLE products in a specific category.',
  })
  @ApiParam({
    name: 'category',
    description: 'Product category',
    enum: ProductCategory,
  })
  @ApiResponse({ status: 200, description: 'Products retrieved.' })
  async findByCategory(@Param('category') category: ProductCategory) {
    this.logger.log(`Public request: Get products by category ${category}`);

    const products = await this.productLookupService.findByCategory(
      category,
      undefined,
      undefined,
      undefined,
    );

    return {
      data: products,
      meta: {
        count: products.length,
        category,
      },
    };
  }

  /**
   * GET /public/products/search?q=query
   * Search products by name, code, or description
   *
   * @param q - Search query string
   * @returns Array of matching products
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search products',
    description: 'Search AVAILABLE products by name, code, or description.',
  })
  @ApiQuery({ name: 'q', description: 'Search query string', required: true })
  @ApiResponse({ status: 200, description: 'Search results returned.' })
  async search(@Query('q') searchQuery: string) {
    this.logger.log(
      `Public request: Search products with query "${searchQuery}"`,
    );

    if (!searchQuery || searchQuery.trim().length === 0) {
      return {
        data: [],
        meta: {
          count: 0,
          query: searchQuery,
        },
      };
    }

    const products = await this.productLookupService.searchProducts(
      searchQuery,
      undefined,
      undefined,
      undefined,
    );

    return {
      data: products,
      meta: {
        count: products.length,
        query: searchQuery,
      },
    };
  }

  /**
   * GET /public/products/stats
   * Get public product statistics
   *
   * @returns Product counts
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get public product statistics',
    description: 'Returns basic statistics about available products.',
  })
  @ApiResponse({ status: 200, description: 'Statistics retrieved.' })
  async getStats() {
    this.logger.log('Public request: Get product statistics');

    const availableCount = await this.productLookupService.countAvailable();

    return {
      data: {
        availableProducts: availableCount,
      },
    };
  }
}
