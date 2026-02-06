/**
 * Product Lookup Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Repository Pattern: Clean data access abstraction with ProductRepository
 * - Business Rules: Price calculation based on membership
 * - Public Access: No authentication required for read operations
 * - Security-First Design: Only AVAILABLE products visible publicly
 * - Data Transformation: Mappers for Internal ↔ Response conversions
 *
 * PERMISSION SYSTEM (Product Lookup):
 * - PUBLIC ACCESS: Read access to AVAILABLE products only
 * - AUTHENTICATED: Price calculation based on membership status
 * - ADMIN (privilege = 2): Full read access to all products (including DRAFT, DISCONTINUED)
 * - MAIN (privilege = 3): Full read access to all products
 *
 * PUBLIC API FEATURES:
 * - Public catalog listing (AVAILABLE products only)
 * - Product details with dynamic pricing
 * - Search and filtering
 * - Category-based browsing
 * - Availability checking
 *
 * PRICE CALCULATION:
 * - Uses ProductBusinessRulesService.calculatePriceForUser()
 * - Returns general_price for unauthenticated users
 * - Returns category-specific price for active members
 * - Falls back to general_price if category price is null
 *
 * @file product-lookup.service.ts
 * @module ProductModule
 * @layer Services
 * @since 2025-05-01
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';
import { Privilege } from '../../../../common/enums';
import { CacheService } from '../../../../cache/cache.service';
import {
  ProductRepository,
  PRODUCT_REPOSITORY,
} from '../interfaces/product-repository.interface';
import { ProductInternal } from '../interfaces/product-internal.interface';
import { ProductMapper } from '../mappers/product.mapper';
import { ProductResponseDto } from '../dtos/product-response.dto';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductCategory } from '../enums/product-category.enum';
import { ProductUserType } from '../enums/product-user-type.enum';
import {
  ProductBusinessRulesService,
  UserType,
} from './product-business-rules.service';
import { AudienceTargetLookupService } from '../../audience-target/services/audience-target-lookup.service';
import { AudienceTargetMatchingService } from '../../audience-target/services/audience-target-matching.service';
import { UserProfileBuilderService } from '../../audience-target/services/user-profile-builder.service';
import { AudienceTargetInternal } from '../../audience-target/interfaces/audience-target-internal.interface';

/**
 * Product query options for listing
 */
export interface ProductQueryOptions {
  category?: ProductCategory;
  status?: ProductStatus;
  productYear?: string;
  skip?: number;
  top?: number;
  orderBy?: string;
  page?: number; // Pagination: page number (1-based)
  limit?: number; // Pagination: items per page (default: 12)
  organizationGuid?: string;
}

/**
 * Paginated product response (e-commerce style)
 */
export interface PaginatedProductResponse {
  products: ProductWithPrice[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Product with calculated price
 */
export interface ProductWithPrice extends ProductResponseDto {
  displayPrice: number | null;
  priceField: string;
  isGeneralPrice: boolean;
  canPurchase: boolean;
  // Internal field for filtering (not exposed in DTO)
  osot_user_type?: ProductUserType;
}

@Injectable()
export class ProductLookupService {
  private readonly logger = new Logger(ProductLookupService.name);
  // Cache TTL: 60 seconds (PRESENTATION MODE)
  // In production, adjust based on data volatility:
  // - Frequently updated: 60-300s
  // - Semi-static: 300-900s
  // - Rarely updated: 3600+s
  private readonly PRODUCT_CACHE_TTL = 60;

  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    private readonly productMapper: ProductMapper,
    private readonly productBusinessRules: ProductBusinessRulesService,
    private readonly cacheService: CacheService,
    private readonly audienceTargetLookupService: AudienceTargetLookupService,
    private readonly audienceTargetMatchingService: AudienceTargetMatchingService,
    private readonly userProfileBuilderService: UserProfileBuilderService,
  ) {
    // Type guard to ensure repository is properly typed
    if (!this.productRepository) {
      throw new Error('ProductRepository not properly injected');
    }
  }

  // ========================================
  // FIND SINGLE
  // ========================================

  /**
   * Resolve product identifier to GUID
   * Accepts either GUID (osot_table_productid) or productId (osot-prod-0000003)
   *
   * @param identifier - GUID or productId
   * @returns GUID or null if not found
   */
  private async resolveProductIdentifier(
    identifier: string,
    organizationGuid?: string,
  ): Promise<string | null> {
    // Check if it's a GUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const guidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (guidRegex.test(identifier)) {
      this.logger.debug(`Identifier ${identifier} is already a GUID`);
      return identifier; // Already a GUID
    }

    // Otherwise, treat as productId (osot-prod-0000003)
    this.logger.debug(`Resolving productId ${identifier} to GUID`);
    const product = await this.productRepository.findByProductId(
      identifier,
      organizationGuid,
    );

    if (product?.osot_table_productid) {
      this.logger.debug(
        `Resolved productId ${identifier} to GUID ${product.osot_table_productid}`,
      );
    } else {
      this.logger.warn(`Could not resolve productId ${identifier} to GUID`);
    }

    return product?.osot_table_productid || null;
  }

  /**
   * Find product by ID with price calculation
   * Accepts either GUID or productId (osot-prod-0000003)
   *
   * PUBLIC ACCESS: Only AVAILABLE products
   * ADMIN ACCESS: All products
   *
   * @param identifier - Product GUID or productId (osot-prod-0000003)
   * @param userId - User ID for price calculation (optional)
   * @param userType - User type ('account' or 'affiliate')
   * @param userPrivilege - User privilege level (optional)
   * @param operationId - Operation tracking ID
   * @returns Product with calculated price or null
   */
  async findById(
    identifier: string,
    userId?: string,
    userType?: UserType,
    userPrivilege?: Privilege,
    operationId?: string,
    organizationGuid?: string,
  ): Promise<ProductWithPrice | null> {
    const opId = operationId || `find-product-${Date.now()}`;

    this.logger.log(`Finding product ${identifier} for operation ${opId}`);

    try {
      // Resolve identifier to GUID
      const id = await this.resolveProductIdentifier(
        identifier,
        organizationGuid,
      );
      if (!id) {
        this.logger.warn(`Product not found: ${identifier}`);
        return null;
      }

      // Check cache first
      const cacheKey = `products:details:${id}`;
      const cachedProduct =
        await this.cacheService.get<ProductInternal>(cacheKey);

      let product: ProductInternal | null;

      if (cachedProduct) {
        this.logger.log(`[PRODUCT CACHE] ✅ Cache HIT for product ${id}`);
        product = cachedProduct;
      } else {
        this.logger.log(`[PRODUCT CACHE] ❌ Cache MISS for product ${id}`);
        product = await this.productRepository.findById(
          id,
          organizationGuid,
          opId,
        );

        if (product) {
          this.logger.log(
            `[PRODUCT CACHE] 💾 Cached product ${id} for 5 minutes`,
          );
          // Cache for 5 minutes
          await this.cacheService.set(
            cacheKey,
            product,
            this.PRODUCT_CACHE_TTL,
          );
        }
      }

      if (!product) {
        return null;
      }

      if (
        organizationGuid &&
        product.organizationGuid &&
        product.organizationGuid.toLowerCase() !==
          organizationGuid.toLowerCase()
      ) {
        this.logger.warn(
          `Product ${id} not found in organization ${organizationGuid} for operation ${opId}`,
        );
        return null;
      }

      // Access control: Public can only see AVAILABLE products
      if (!this.canAccessProduct(product.osot_product_status, userPrivilege)) {
        this.logger.warn(
          `Access denied for product ${id}, status: ${product.osot_product_status}, privilege: ${userPrivilege}`,
        );
        return null;
      }

      // Calculate price and purchase eligibility
      return this.enrichProductWithPrice(product, userId, userType);
    } catch (error) {
      this.logger.error(
        `Error finding product ${identifier} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find product',
        operationId: opId,
        productId: identifier,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find product by product code
   *
   * @param productCode - Product code (unique identifier)
   * @param userId - User ID for price calculation (optional)
   * @param userType - User type ('account' or 'affiliate')
   * @param userPrivilege - User privilege level (optional)
   * @param operationId - Operation tracking ID
   * @returns Product with calculated price or null
   */
  async findByProductCode(
    productCode: string,
    userId?: string,
    userType?: UserType,
    userPrivilege?: Privilege,
    operationId?: string,
    organizationGuid?: string,
  ): Promise<ProductWithPrice | null> {
    const opId = operationId || `find-product-code-${Date.now()}`;

    this.logger.log(
      `Finding product by code ${productCode} for operation ${opId}`,
    );

    try {
      const product = await this.productRepository.findByProductCode(
        productCode,
        organizationGuid,
        opId,
      );

      if (!product) {
        return null;
      }

      if (
        organizationGuid &&
        product.organizationGuid &&
        product.organizationGuid.toLowerCase() !==
          organizationGuid.toLowerCase()
      ) {
        this.logger.warn(
          `Product ${productCode} not found in organization ${organizationGuid} for operation ${opId}`,
        );
        return null;
      }

      // Access control
      if (!this.canAccessProduct(product.osot_product_status, userPrivilege)) {
        return null;
      }

      return this.enrichProductWithPrice(product, userId, userType);
    } catch (error) {
      this.logger.error(
        `Error finding product by code ${productCode} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find product by code',
        operationId: opId,
        productCode,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // FIND MULTIPLE
  // ========================================

  /**
   * Find all products with caching and pagination (e-commerce style)
   *
   * CACHING STRATEGY:
   * - Cache key: products:catalog:{status} (shared by all users)
   * - TTL: 1 hour (3600s)
   * - Invalidates on product create/update/delete
   *
   * PAGINATION:
   * - Default: 12 products per page
   * - Returns metadata: totalItems, totalPages, hasNextPage
   *
   * PUBLIC ACCESS: Only AVAILABLE products
   * ADMIN ACCESS: All products with status filtering
   *
   * @param options - Query options (filters, pagination)
   * @param userId - User ID for price calculation (optional)
   * @param userType - User type ('account' or 'affiliate')
   * @param userPrivilege - User privilege level (optional)
   * @param operationId - Operation tracking ID
   * @returns Paginated products with metadata
   */
  async findAll(
    options?: ProductQueryOptions,
    userId?: string,
    userType?: UserType,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<PaginatedProductResponse> {
    const opId = operationId || `find-all-products-${Date.now()}`;
    const page = options?.page || 1;
    const limit = options?.limit || 12; // E-commerce standard

    this.logger.log(
      `Finding products - Page ${page}, Limit ${limit} - Operation: ${opId}`,
    );

    try {
      // Build cache key based on filters
      const status = options?.status || ProductStatus.AVAILABLE;
      const category = options?.category || 'all';
      const productYear = options?.productYear || 'all';
      const orgKey = options?.organizationGuid || 'all';
      const cacheKey = `products:catalog:${orgKey}:${status}:${category}:${productYear}`;

      // Try cache first
      const cached = await this.cacheService.get<ProductInternal[]>(cacheKey);

      let allProducts: ProductInternal[];

      if (cached) {
        this.logger.log(
          `[PRODUCT CACHE] ✅ Cache HIT for ${cacheKey} (${cached.length} products)`,
        );
        allProducts = cached;
      } else {
        this.logger.log(`[PRODUCT CACHE] ❌ Cache MISS for ${cacheKey}`);
        // Apply public access filter if not admin
        const filters = this.applyPublicFilter(options, userPrivilege);
        allProducts = await this.productRepository.findAll(filters, opId);
        this.logger.log(
          `[PRODUCT CACHE] 💾 Cached ${allProducts.length} products for 5 minutes`,
        );

        // Cache for 5 minutes
        await this.cacheService.set(
          cacheKey,
          allProducts,
          this.PRODUCT_CACHE_TTL,
        );
      }

      // Enrich all products with price first
      const enrichedAllProducts = await Promise.all(
        allProducts.map((product) =>
          this.enrichProductWithPrice(product, userId, userType),
        ),
      );

      // Filter by audience target if user is authenticated AND is OWNER
      // Admin (2) and Main (3) see ALL products without filtering
      let filteredProducts = enrichedAllProducts;
      if (userId && userPrivilege === Privilege.OWNER) {
        this.logger.debug(
          `Applying 2-layer filtering for OWNER user ${userId}`,
        );

        // LAYER 1: Filter by user type (fast pre-filter)
        if (userType) {
          filteredProducts = this.filterProductsByUserType(
            enrichedAllProducts,
            userType,
          );
        }

        // LAYER 1.5: Filter by membership status (membership-only products)
        // This runs BEFORE audience target filtering to reduce unnecessary profile queries
        filteredProducts = await this.filterProductsByMembershipStatus(
          filteredProducts,
          userId,
          opId,
        );

        // LAYER 2: Filter by audience target (detailed matching)
        filteredProducts = await this.filterProductsByAudienceTarget(
          filteredProducts,
          userId,
          opId,
        );

        this.logger.log(
          `Filtered from ${enrichedAllProducts.length} to ${filteredProducts.length} products for user ${userId}`,
        );
      } else if (
        userId &&
        (userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN)
      ) {
        this.logger.debug(
          `User ${userId} has ${userPrivilege === Privilege.ADMIN ? 'ADMIN' : 'MAIN'} privilege - showing ALL products`,
        );
      } else {
        // For unauthenticated users, only show public products (no target)
        this.logger.debug(
          'Unauthenticated user - showing public products only',
        );
      }

      // Calculate pagination on filtered results
      const totalItems = filteredProducts.length;
      const totalPages = Math.ceil(totalItems / limit);
      const skip = (page - 1) * limit;
      const paginatedProducts = filteredProducts.slice(skip, skip + limit);

      return {
        products: paginatedProducts,
        pagination: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error finding all products for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find products',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find products by category
   *
   * @param category - Product category
   * @param userId - User ID for price calculation (optional)
   * @param userType - User type ('account' or 'affiliate')
   * @param userPrivilege - User privilege level (optional)
   * @param operationId - Operation tracking ID
   * @returns Array of products in category
   */
  async findByCategory(
    category: ProductCategory,
    userId?: string,
    userType?: UserType,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<ProductWithPrice[]> {
    const opId = operationId || `find-category-${Date.now()}`;

    this.logger.log(
      `Finding products by category ${category} for operation ${opId}`,
    );

    try {
      const products = await this.productRepository.findByCategory(category);

      // Filter by access and enrich
      const accessibleProducts = products.filter((product) =>
        this.canAccessProduct(product.osot_product_status, userPrivilege),
      );

      const enrichedProducts = await Promise.all(
        accessibleProducts.map((product) =>
          this.enrichProductWithPrice(product, userId, userType),
        ),
      );

      // Apply 2-layer filtering if user is OWNER (not Admin/Main)
      if (userId && userPrivilege === Privilege.OWNER) {
        this.logger.debug(
          `Applying 2-layer filtering for category products for OWNER user ${userId}`,
        );

        // LAYER 1: Filter by user type (fast pre-filter)
        let filtered = enrichedProducts;
        if (userType) {
          filtered = this.filterProductsByUserType(enrichedProducts, userType);
        }

        // LAYER 1.5: Filter by membership status
        filtered = await this.filterProductsByMembershipStatus(
          filtered,
          userId,
          opId,
        );

        // LAYER 2: Filter by audience target (detailed matching)
        filtered = await this.filterProductsByAudienceTarget(
          filtered,
          userId,
          opId,
        );

        this.logger.log(
          `Filtered from ${enrichedProducts.length} to ${filtered.length} products`,
        );
        return filtered;
      }

      return enrichedProducts;
    } catch (error) {
      this.logger.error(
        `Error finding products by category ${category} for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find products by category',
        operationId: opId,
        category,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Find available products (PUBLIC)
   *
   * @param userId - User ID for price calculation (optional)
   * @param userType - User type ('account' or 'affiliate')
   * @param userPrivilege - User privilege level (optional)
   * @param operationId - Operation tracking ID
   * @returns Array of available products
   */
  async findAvailableProducts(
    userId?: string,
    userType?: UserType,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<ProductWithPrice[]> {
    const opId = operationId || `find-available-${Date.now()}`;

    this.logger.log(`Finding available products for operation ${opId}`);

    try {
      const products = await this.productRepository.findAvailableProducts();

      const enrichedProducts = await Promise.all(
        products.map((product) =>
          this.enrichProductWithPrice(product, userId, userType),
        ),
      );

      // Apply 2-layer filtering if user is OWNER (not Admin/Main)
      if (userId && userPrivilege === Privilege.OWNER) {
        this.logger.debug(
          `Applying 2-layer filtering for available products for OWNER user ${userId}`,
        );

        // LAYER 1: Filter by user type (fast pre-filter)
        let filtered = enrichedProducts;
        if (userType) {
          filtered = this.filterProductsByUserType(enrichedProducts, userType);
        }

        // LAYER 1.5: Filter by membership status
        filtered = await this.filterProductsByMembershipStatus(
          filtered,
          userId,
          opId,
        );

        // LAYER 2: Filter by audience target (detailed matching)
        filtered = await this.filterProductsByAudienceTarget(
          filtered,
          userId,
          opId,
        );

        this.logger.log(
          `Filtered from ${enrichedProducts.length} to ${filtered.length} products`,
        );
        return filtered;
      }

      return enrichedProducts;
    } catch (error) {
      this.logger.error(
        `Error finding available products for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find available products',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Search products by name, code, or description
   *
   * @param searchQuery - Search query string
   * @param userId - User ID for price calculation (optional)
   * @param userType - User type ('account' or 'affiliate')
   * @param userPrivilege - User privilege level (optional)
   * @param operationId - Operation tracking ID
   * @returns Array of matching products
   */
  async searchProducts(
    searchQuery: string,
    userId?: string,
    userType?: UserType,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<ProductWithPrice[]> {
    const opId = operationId || `search-products-${Date.now()}`;

    this.logger.log(
      `Searching products with query "${searchQuery}" for operation ${opId}`,
    );

    try {
      const products = await this.productRepository.searchProducts(searchQuery);

      // Filter by access and enrich
      const accessibleProducts = products.filter((product) =>
        this.canAccessProduct(product.osot_product_status, userPrivilege),
      );

      const enrichedProducts = await Promise.all(
        accessibleProducts.map((product) =>
          this.enrichProductWithPrice(product, userId, userType),
        ),
      );

      // Apply 2-layer filtering only if user is OWNER
      if (userId && userPrivilege === Privilege.OWNER) {
        this.logger.debug(
          `Applying 2-layer filtering for search results for OWNER user ${userId}`,
        );

        // LAYER 1: Filter by user type (fast pre-filter)
        let filtered = enrichedProducts;
        if (userType) {
          filtered = this.filterProductsByUserType(enrichedProducts, userType);
        }

        // LAYER 1.5: Filter by membership status
        filtered = await this.filterProductsByMembershipStatus(
          filtered,
          userId,
          opId,
        );

        // LAYER 2: Filter by audience target (detailed matching)
        filtered = await this.filterProductsByAudienceTarget(
          filtered,
          userId,
          opId,
        );

        this.logger.log(
          `Filtered search from ${enrichedProducts.length} to ${filtered.length} products`,
        );
        return filtered;
      } else if (
        userId &&
        (userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN)
      ) {
        this.logger.debug(
          `User ${userId} has ${userPrivilege === Privilege.ADMIN ? 'ADMIN' : 'MAIN'} privilege - showing ALL search results`,
        );
      }

      return enrichedProducts;
    } catch (error) {
      this.logger.error(
        `Error searching products for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to search products',
        operationId: opId,
        searchQuery,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // STATISTICS
  // ========================================

  /**
   * Count all products
   *
   * @param operationId - Operation tracking ID
   * @returns Total count
   */
  async count(operationId?: string): Promise<number> {
    const opId = operationId || `count-products-${Date.now()}`;

    try {
      return await this.productRepository.count();
    } catch (error) {
      this.logger.error(
        `Error counting products for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to count products',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Count available products
   *
   * @param operationId - Operation tracking ID
   * @returns Count of available products
   */
  async countAvailable(operationId?: string): Promise<number> {
    const opId = operationId || `count-available-${Date.now()}`;

    try {
      return await this.productRepository.countAvailable();
    } catch (error) {
      this.logger.error(
        `Error counting available products for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to count available products',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Enrich product with calculated price and purchase eligibility
   *
   * @param product - Product internal data
   * @param userId - User ID (optional)
   * @param userType - User type (optional)
   * @param userPrivilege - User privilege level (optional)
   * @returns Product with price and purchase info
   */
  private enrichProductWithPrice(
    product: ProductInternal,
    userId?: string,
    userType?: UserType,
  ): ProductWithPrice {
    // Calculate price based on user membership
    const priceCalc = this.productBusinessRules.calculatePriceForUser(
      product,
      userId,
      userType,
    );

    // Check purchase eligibility
    const purchaseCheck = this.productBusinessRules.canPurchase(
      product,
      userId,
    );

    // Map to response DTO
    const responseDto = this.productMapper.mapInternalToResponseDto(product);

    // Return enriched product
    return {
      ...responseDto,
      displayPrice: priceCalc.price,
      priceField: priceCalc.priceField,
      isGeneralPrice: priceCalc.isGeneralPrice,
      canPurchase: purchaseCheck.available,
      // Include internal user type for Layer 1 filtering
      osot_user_type: product.osot_user_type,
    };
  }

  /**
   * Check if user can access product based on status and privilege
   *
   * PUBLIC: Only AVAILABLE products
   * ADMIN/MAIN: All products
   *
   * @param status - Product status
   * @param userPrivilege - User privilege level
   * @returns true if user can access product
   */
  private canAccessProduct(
    status: ProductStatus,
    userPrivilege?: Privilege,
  ): boolean {
    // Admin and Main can access all products
    if (userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN) {
      return true;
    }

    // Public can only access AVAILABLE products
    return status === ProductStatus.AVAILABLE;
  }

  /**
   * Apply public filter to query options
   *
   * If user is not admin, force status = AVAILABLE
   *
   * @param options - Query options
   * @param userPrivilege - User privilege level
   * @returns Filtered options
   */
  private applyPublicFilter(
    options?: ProductQueryOptions,
    userPrivilege?: Privilege,
  ): ProductQueryOptions {
    // Admin can use any filters
    if (userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN) {
      return options || {};
    }

    // Public must filter by AVAILABLE status
    return {
      ...options,
      status: ProductStatus.AVAILABLE,
    };
  }

  // ========================================
  // DATE-BASED FILTERING
  // ========================================

  /**
   * Find products active on a specific date
   *
   * PUBLIC ACCESS: Only AVAILABLE products that are active on the date
   * ADMIN ACCESS: All products active on the date (any status)
   *
   * Use Case:
   * - E-commerce catalog showing current promotions
   * - Time-limited product variations
   * - Seasonal product filtering
   *
   * @param referenceDate - Date to check (defaults to today)
   * @param userId - User ID for price calculation (optional)
   * @param userType - User type ('account' or 'affiliate')
   * @param userPrivilege - User privilege level (optional)
   * @param operationId - Operation tracking ID
   * @returns Array of active products with calculated prices
   */
  async findActiveProducts(
    referenceDate?: Date,
    userId?: string,
    userType?: UserType,
    userPrivilege?: Privilege,
    operationId?: string,
  ): Promise<ProductWithPrice[]> {
    const opId = operationId || `find-active-products-${Date.now()}`;
    const date = referenceDate || new Date();

    this.logger.log(
      `Finding active products for date ${date.toISOString().split('T')[0]} (operation ${opId})`,
    );

    try {
      // Determine status filter based on privilege
      const status =
        userPrivilege === Privilege.ADMIN || userPrivilege === Privilege.MAIN
          ? undefined // Admin sees all statuses
          : ProductStatus.AVAILABLE; // Public sees only AVAILABLE

      // Fetch products active on the date
      const products = await this.productRepository.findActiveByDate(
        date,
        status,
      );

      // Enrich each product with price
      const enrichedProducts = await Promise.all(
        products.map((product) =>
          this.enrichProductWithPrice(product, userId, userType),
        ),
      );

      this.logger.log(
        `Found ${enrichedProducts.length} active products for operation ${opId}`,
      );

      return enrichedProducts;
    } catch (error) {
      this.logger.error(
        `Error finding active products for operation ${opId}:`,
        error,
      );
      throw createAppError(ErrorCodes.INTERNAL_ERROR, {
        message: 'Failed to find active products',
        operationId: opId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ========================================
  // AUDIENCE TARGET FILTERING
  // ========================================

  /**
   * Filter products by user type (LAYER 1 - Fast pre-filter)
   *
   * This is the first layer of filtering that runs BEFORE audience target matching.
   * It uses the product.osot_user_type field to quickly eliminate products
   * that are not relevant to the user's type (account vs affiliate).
   *
   * Logic:
   * - osot_user_type = OT_OTA (1): Only for account users (OT/OTA)
   * - osot_user_type = AFFILIATE (2): Only for affiliate users
   * - osot_user_type = BOTH (3): For all users (default)
   * - osot_user_type = undefined/null: Treated as BOTH (legacy products)
   *
   * Performance Impact:
   * - Reduces products before expensive audience target lookups
   * - Expected 60-70% reduction in unnecessary Dataverse queries
   *
   * @param products - Array of products to filter
   * @param userType - User type from JWT ('account' or 'affiliate')
   * @returns Filtered array of products matching user type
   */
  private filterProductsByUserType(
    products: ProductWithPrice[],
    userType: UserType,
  ): ProductWithPrice[] {
    this.logger.debug(
      `[LAYER 1 FILTER] Filtering ${products.length} products by user type: ${userType}`,
    );

    const filtered = products.filter((product) => {
      const productUserType: ProductUserType | undefined =
        product.osot_user_type;

      // Default to BOTH if not set (legacy products)
      const targetType: ProductUserType =
        productUserType ?? ProductUserType.BOTH;

      // BOTH always passes
      if (targetType === ProductUserType.BOTH) {
        return true;
      }

      // OT_OTA products only for 'account' users
      if (targetType === ProductUserType.OT_OTA && userType === 'account') {
        return true;
      }

      // AFFILIATE products only for 'affiliate' users
      if (
        targetType === ProductUserType.AFFILIATE &&
        userType === 'affiliate'
      ) {
        return true;
      }

      // Otherwise, filter out
      this.logger.debug(
        `Product ${product.productCode} filtered out (type=${targetType}, user=${userType})`,
      );
      return false;
    });

    this.logger.log(
      `[LAYER 1 FILTER] Filtered from ${products.length} to ${filtered.length} products for userType=${userType}`,
    );

    return filtered;
  }

  /**
   * Filter products by membership status (LAYER 1.5 - Membership check)
   *
   * This is a critical security filter that runs AFTER user type filtering
   * and BEFORE audience target matching. It ensures users without active
   * membership cannot see products marked as "membership-only".
   *
   * Logic:
   * - osot_active_membership_only = true: Only visible to users with osot_active_member = true
   * - osot_active_membership_only = false/undefined: Visible to all users
   *
   * Business Impact:
   * - Prevents non-members from accessing premium/members-only content
   * - Critical for revenue protection and membership value proposition
   *
   * @param products - Array of products to filter
   * @param userGuid - User's GUID for fetching membership status
   * @param operationId - Operation tracking ID
   * @returns Filtered array of products user is allowed to see
   */
  private async filterProductsByMembershipStatus(
    products: ProductWithPrice[],
    userGuid: string,
    operationId?: string,
  ): Promise<ProductWithPrice[]> {
    const opId = operationId || `filter-membership-${Date.now()}`;

    this.logger.debug(
      `[LAYER 1.5 FILTER] Filtering ${products.length} products by membership status for user ${userGuid}`,
    );

    try {
      // Build user profile to get osot_active_member status
      const userProfile =
        await this.userProfileBuilderService.buildUserProfile(userGuid);

      const userHasActiveMembership = userProfile.osot_active_member || false;

      this.logger.debug(
        `User ${userGuid} active membership status: ${userHasActiveMembership}`,
      );

      // Filter products
      const filtered = products.filter((product) => {
        const isMembershipOnly: boolean = product.activeMembershipOnly || false;

        // If product is NOT membership-only, always show it
        if (!isMembershipOnly) {
          return true;
        }

        // If product IS membership-only, only show if user has active membership
        if (isMembershipOnly && !userHasActiveMembership) {
          this.logger.debug(
            `Product ${product.productCode} filtered out (membership-only, user has no active membership)`,
          );
          return false;
        }

        // User has active membership, show the product
        return true;
      });

      this.logger.log(
        `[LAYER 1.5 FILTER] Filtered from ${products.length} to ${filtered.length} products based on membership status`,
      );

      return filtered;
    } catch (error) {
      this.logger.error(
        `Error filtering products by membership status (operation ${opId}):`,
        error,
      );
      // On error, return all products to avoid blocking access
      // (fail open, but log the error for investigation)
      return products;
    }
  }

  /**
   * Filter products by audience target (LAYER 2 - Detailed matching)
   *
   * This is the second layer of filtering that runs AFTER user type pre-filtering.
   * It performs detailed matching against the 34 audience target fields.
   *
   * MATCHING LOGIC:
   * - Empty target (all 35 fields empty) = PUBLIC product (user qualifies)
   * - OR logic: If ANY target field matches user profile, user qualifies
   * - No target = Product has no audience target = PUBLIC (user qualifies)
   *
   * PERFORMANCE:
   * - Builds user profile once (10 Dataverse queries in parallel)
   * - Fetches all targets in one query
   * - Filters in-memory (fast)
   *
   * @param products - Array of products to filter
   * @param userGuid - User's GUID for profile building
   * @param operationId - Operation tracking ID
   * @returns Filtered array of products user qualifies to see
   */
  async filterProductsByAudienceTarget(
    products: ProductWithPrice[],
    userGuid: string,
    operationId?: string,
  ): Promise<ProductWithPrice[]> {
    const opId = operationId || `filter-products-${Date.now()}`;

    this.logger.log(
      `Filtering ${products.length} products for user ${userGuid} (operation ${opId})`,
    );

    try {
      // Build user profile (fetches from 10 entities)
      const userProfile =
        await this.userProfileBuilderService.buildUserProfile(userGuid);

      // Fetch all targets for the products
      const productIds = products
        .map((p) => p.id)
        .filter((id): id is string => !!id);

      this.logger.debug(
        `Fetching audience targets for ${productIds.length} products`,
      );

      // Fetch targets in parallel
      const targetPromises = productIds.map(
        (productId) =>
          this.audienceTargetLookupService
            .findByProductId(productId, Privilege.MAIN, opId)
            .catch(() => null), // If target not found, product is public
      );

      const targets = (await Promise.all(
        targetPromises,
      )) as (AudienceTargetInternal | null)[];

      // Create map of productId -> target
      const targetMap = new Map<string, AudienceTargetInternal | null>();
      productIds.forEach((productId, index) => {
        if (targets[index]) {
          targetMap.set(productId, targets[index]);
        }
      });

      // Filter products based on target matching
      const filteredProducts = products.filter((product) => {
        if (!product.id) {
          this.logger.warn(
            `Product missing ID, skipping: ${product.productName}`,
          );
          return false;
        }

        const target = targetMap.get(product.id);

        // No target = public product
        if (!target) {
          this.logger.debug(
            `Product ${product.productCode} has no target - PUBLIC`,
          );
          return true;
        }

        // Check if user matches target
        const matches = this.audienceTargetMatchingService.matchesTarget(
          userProfile,
          target,
        );

        this.logger.debug(
          `Product ${product.productCode} ${matches ? 'MATCHES' : 'DOES NOT MATCH'} user profile`,
        );

        return matches;
      });

      this.logger.log(
        `Filtered to ${filteredProducts.length}/${products.length} products for user ${userProfile.userBusinessId} (operation ${opId})`,
      );

      return filteredProducts;
    } catch (error) {
      this.logger.error(
        `Error filtering products by audience target for operation ${opId}:`,
        error,
      );
      // On error, return all products (fail open for better UX)
      this.logger.warn(`Returning all products due to filtering error`);
      return products;
    }
  }
}
