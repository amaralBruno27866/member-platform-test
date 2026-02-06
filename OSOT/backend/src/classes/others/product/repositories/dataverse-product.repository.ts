/**
 * Dataverse Product Repository Implementation
 *
 * Implements ProductRepository interface using Dataverse OData API.
 * Handles all database operations for Product entity.
 *
 * CACHING STRATEGY:
 * - READ operations: Try cache first (10min TTL) → Dataverse on miss → Store in cache
 * - WRITE operations: Update Dataverse → Invalidate affected cache keys
 * - List queries: Cache with shorter TTL (3min) to balance freshness vs performance
 * - Benefits: Critical for public endpoints - mitigates 100 req/s Dataverse rate limit
 *
 * @file dataverse-product.repository.ts
 * @module ProductModule
 * @layer Repositories
 * @since 2025-05-01
 */

import { Injectable, Logger } from '@nestjs/common';
import { DataverseService } from '../../../../integrations/dataverse.service';
import { RedisService } from '../../../../redis/redis.service';
import { ProductRepository } from '../interfaces';
import { ProductInternal, ProductDataverse } from '../interfaces';
import { ProductMapper } from '../mappers';
import {
  PRODUCT_ENTITY,
  PRODUCT_SELECT_DEFAULT,
  PRODUCT_SELECT_FULL,
  PRODUCT_ODATA,
  PRODUCT_ORDERBY_FIELD_MAP,
} from '../constants';
import { ProductCategory, ProductStatus } from '../enums';
import { getAppForOperation } from '../../../../utils/dataverse-app.helper';

/**
 * Dataverse Product Repository
 */
@Injectable()
export class DataverseProductRepository implements ProductRepository {
  private readonly logger = new Logger(DataverseProductRepository.name);
  private readonly CACHE_TTL_SINGLE = 600; // 10 minutes for single products
  private readonly CACHE_TTL_LIST = 180; // 3 minutes for list queries

  constructor(
    private readonly dataverseService: DataverseService,
    private readonly productMapper: ProductMapper,
    private readonly redisService: RedisService,
  ) {}

  // ========================================
  // CACHE KEY HELPERS
  // ========================================

  private getCacheKey(type: string, id: string): string {
    return `product:${type}:${id}`;
  }

  private getListCacheKey(params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => {
        const value = params[key];
        // Serialize value properly for cache key
        if (value === null || value === undefined) {
          return `${key}=null`;
        }
        if (typeof value === 'string') {
          return `${key}=${value}`;
        }
        if (typeof value === 'number' || typeof value === 'boolean') {
          return `${key}=${value.toString()}`;
        }
        // Objects and arrays
        return `${key}=${JSON.stringify(value)}`;
      })
      .join('&');
    return `product:list:${sortedParams}`;
  }

  private async invalidateCache(
    productId?: string,
    productCode?: string,
    guid?: string,
  ): Promise<void> {
    try {
      if (productId) {
        await this.redisService.del(this.getCacheKey('id', productId));
      }
      if (productCode) {
        await this.redisService.del(
          this.getCacheKey('code', productCode.toUpperCase()),
        );
      }
      if (guid) {
        await this.redisService.del(this.getCacheKey('guid', guid));
      }
      // Invalidate all list caches
      const listKeys = await this.redisService.getKeys('product:list:*');
      if (listKeys && listKeys.length > 0) {
        await Promise.all(listKeys.map((key) => this.redisService.del(key)));
      }
    } catch (error) {
      this.logger.warn(
        `Cache invalidation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw - cache invalidation failure shouldn't break operations
    }
  }

  // ========================================
  // CREATE
  // ========================================

  /**
   * Create a new product
   *
   * @param product - Product data (without IDs)
   * @returns Created product with generated IDs
   */
  async create(
    product: Omit<ProductInternal, 'osot_table_productid' | 'osot_productid'>,
  ): Promise<ProductInternal> {
    try {
      this.logger.debug(
        `🔵 Repository.create() called for product: ${product.osot_product_code}`,
      );

      const app = getAppForOperation('create', 'main');
      this.logger.debug(`App selected: ${app}`);

      const credentials = this.dataverseService.getCredentialsByApp(app);
      this.logger.debug(`Credentials obtained for app: ${app}`);

      this.logger.debug(`Mapping internal product to Dataverse format...`);
      const payload = this.productMapper.mapInternalToDataverse(product);
      this.logger.debug(`Payload mapped successfully`);

      this.logger.log(
        `📤 Sending product creation request to Dataverse for: ${product.osot_product_code}`,
      );
      this.logger.debug(`Payload being sent: ${JSON.stringify(payload)}`);

      this.logger.debug(`Calling dataverseService.request()...`);
      const response = await this.dataverseService.request(
        'POST',
        PRODUCT_ENTITY.collectionName,
        payload,
        credentials,
        app,
      );
      this.logger.debug(`Dataverse request completed successfully`);
      this.logger.debug(`Response: ${JSON.stringify(response)}`);

      this.logger.debug(`Mapping Dataverse response to internal format...`);
      const createdProduct = this.productMapper.mapDataverseToInternal(
        response as ProductDataverse,
      );
      this.logger.debug(`Mapped to internal successfully`);

      // Invalidate cache after creation
      this.logger.debug(`Invalidating cache...`);
      await this.invalidateCache(
        createdProduct.osot_productid,
        createdProduct.osot_product_code,
        createdProduct.osot_table_productid,
      );

      this.logger.log(
        `✅ Product created successfully: ${createdProduct.osot_product_code}`,
      );

      return createdProduct;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack =
        error instanceof Error ? error.stack : 'No stack trace';

      this.logger.error(
        `❌ Dataverse create error for product ${product.osot_product_code}`,
      );
      this.logger.error(`Message: ${errorMessage}`);
      this.logger.error(`Stack: ${errorStack}`);

      // Log error details if available
      try {
        if (typeof error === 'object' && error !== null) {
          const errorObj = error as Record<string, unknown>;
          if ('response' in errorObj) {
            this.logger.error(
              `Error Response: ${JSON.stringify(errorObj.response)}`,

              `Error Response: ${JSON.stringify(errorObj.response)}`,
            );
          }
        }
      } catch {
        // Ignore any errors during error logging
      }

      throw error;
    }
  }

  // ========================================
  // READ (Single)
  // ========================================

  /**
   * Find product by table ID (GUID)
   *
   * @param id - Table product ID (osot_table_productid)
   * @returns Product or null if not found
   */
  async findById(
    id: string,
    organizationGuid?: string,
    _operationId?: string,
  ): Promise<ProductInternal | null> {
    try {
      // Try cache first
      const cacheKey = this.getCacheKey('guid', id);
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for product GUID: ${id}`);
        return JSON.parse(cached) as ProductInternal;
      }

      this.logger.debug(`Cache MISS for product GUID: ${id}`);

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$select=${PRODUCT_SELECT_FULL}`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}(${id})?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      if (!response) return null;

      const product = this.productMapper.mapDataverseToInternal(
        response as ProductDataverse,
      );

      if (
        organizationGuid &&
        product.organizationGuid &&
        product.organizationGuid.toLowerCase() !==
          organizationGuid.toLowerCase()
      ) {
        return null;
      }

      // Store in cache
      await this.redisService.set(cacheKey, JSON.stringify(product), {
        EX: this.CACHE_TTL_SINGLE,
      });

      // Also cache by product ID and code
      if (product.osot_productid) {
        await this.redisService.set(
          this.getCacheKey('id', product.osot_productid),
          JSON.stringify(product),
          { EX: this.CACHE_TTL_SINGLE },
        );
      }
      if (product.osot_product_code) {
        await this.redisService.set(
          this.getCacheKey('code', product.osot_product_code.toUpperCase()),
          JSON.stringify(product),
          { EX: this.CACHE_TTL_SINGLE },
        );
      }

      return product;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      this.logger.error(
        `Failed to find product by ID ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Find product by business ID (osot_productid)
   *
   * @param productId - Business product ID
   * @returns Product or null if not found
   */
  async findByProductId(
    productId: string,
    organizationGuid?: string,
    _operationId?: string,
  ): Promise<ProductInternal | null> {
    try {
      // Try cache first
      const cacheKey = this.getCacheKey('id', productId);
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for product ID: ${productId}`);
        return JSON.parse(cached) as ProductInternal;
      }

      this.logger.debug(`Cache MISS for product ID: ${productId}`);

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const orgFilter = organizationGuid
        ? ` and ${PRODUCT_ODATA.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`
        : '';
      const oDataQuery = `$filter=${PRODUCT_ODATA.PRODUCT_ID} eq '${productId}'${orgFilter}&$select=${PRODUCT_SELECT_FULL}&$top=1`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: ProductDataverse[] };
      const productData = responseData?.value?.[0];

      if (!productData) return null;

      const product = this.productMapper.mapDataverseToInternal(productData);
      if (
        organizationGuid &&
        product.organizationGuid &&
        product.organizationGuid.toLowerCase() !==
          organizationGuid.toLowerCase()
      ) {
        return null;
      }

      // Store in cache
      await this.redisService.set(cacheKey, JSON.stringify(product), {
        EX: this.CACHE_TTL_SINGLE,
      });

      // Also cache by GUID and code
      if (product.osot_table_productid) {
        await this.redisService.set(
          this.getCacheKey('guid', product.osot_table_productid),
          JSON.stringify(product),
          { EX: this.CACHE_TTL_SINGLE },
        );
      }
      if (product.osot_product_code) {
        await this.redisService.set(
          this.getCacheKey('code', product.osot_product_code.toUpperCase()),
          JSON.stringify(product),
          { EX: this.CACHE_TTL_SINGLE },
        );
      }

      return product;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      this.logger.error(
        `Failed to find product by ID ${productId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Find product by product code (unique, case-insensitive)
   *
   * @param productCode - Product code (normalized to uppercase)
   * @returns Product or null if not found
   */
  async findByProductCode(
    productCode: string,
    organizationGuid?: string,
    _operationId?: string,
  ): Promise<ProductInternal | null> {
    try {
      const normalizedCode = productCode.toUpperCase();

      // Try cache first
      const cacheKey = this.getCacheKey('code', normalizedCode);
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for product code: ${normalizedCode}`);
        return JSON.parse(cached) as ProductInternal;
      }

      this.logger.debug(`Cache MISS for product code: ${normalizedCode}`);

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const orgFilter = organizationGuid
        ? ` and ${PRODUCT_ODATA.ORGANIZATION_LOOKUP_VALUE} eq '${organizationGuid}'`
        : '';
      const oDataQuery = `$filter=${PRODUCT_ODATA.PRODUCT_CODE} eq '${normalizedCode}'${orgFilter}&$select=${PRODUCT_SELECT_FULL}&$top=1`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: ProductDataverse[] };
      const productData = responseData?.value?.[0];

      if (!productData) return null;

      const product = this.productMapper.mapDataverseToInternal(productData);
      if (
        organizationGuid &&
        product.organizationGuid &&
        product.organizationGuid.toLowerCase() !==
          organizationGuid.toLowerCase()
      ) {
        return null;
      }

      // Store in cache
      await this.redisService.set(cacheKey, JSON.stringify(product), {
        EX: this.CACHE_TTL_SINGLE,
      });

      // Also cache by GUID and product ID
      if (product.osot_table_productid) {
        await this.redisService.set(
          this.getCacheKey('guid', product.osot_table_productid),
          JSON.stringify(product),
          { EX: this.CACHE_TTL_SINGLE },
        );
      }
      if (product.osot_productid) {
        await this.redisService.set(
          this.getCacheKey('id', product.osot_productid),
          JSON.stringify(product),
          { EX: this.CACHE_TTL_SINGLE },
        );
      }

      return product;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      this.logger.error(
        `Failed to find product by code ${productCode}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  // ========================================
  // READ (Multiple)
  // ========================================

  /**
   * Find all products with optional filters and pagination
   *
   * @param filters - Optional filters object
   * @param operationId - Operation tracking ID
   * @returns Array of products
   */
  async findAll(
    filters?: {
      category?: ProductCategory;
      status?: ProductStatus;
      productYear?: string;
      skip?: number;
      top?: number;
      orderBy?: string;
      organizationGuid?: string;
    },
    _operationId?: string,
  ): Promise<ProductInternal[]> {
    try {
      // Try cache for list queries (shorter TTL)
      const cacheKey = this.getListCacheKey(filters || {});
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for product list query`);
        return JSON.parse(cached) as ProductInternal[];
      }

      this.logger.debug(`Cache MISS for product list query`);

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      // Build filter string
      const filterParts: string[] = [];
      if (filters?.category !== undefined) {
        filterParts.push(
          `${PRODUCT_ODATA.PRODUCT_CATEGORY} eq ${filters.category}`,
        );
      }
      if (filters?.status !== undefined) {
        filterParts.push(
          `${PRODUCT_ODATA.PRODUCT_STATUS} eq ${filters.status}`,
        );
      }
      if (filters?.productYear !== undefined) {
        filterParts.push(
          `${PRODUCT_ODATA.PRODUCT_YEAR} eq '${filters.productYear}'`,
        );
      }
      if (filters?.organizationGuid) {
        filterParts.push(
          `${PRODUCT_ODATA.ORGANIZATION_LOOKUP_VALUE} eq '${filters.organizationGuid}'`,
        );
      }

      const queryParams: string[] = [`$select=${PRODUCT_SELECT_FULL}`];
      if (filterParts.length > 0) {
        queryParams.push(`$filter=${filterParts.join(' and ')}`);
      }
      if (filters?.top) {
        queryParams.push(`$top=${filters.top}`);
      }
      if (filters?.skip) {
        queryParams.push(`$skip=${filters.skip}`);
      }
      if (filters?.orderBy) {
        // Map DTO field name to OData field name
        const odataField =
          PRODUCT_ORDERBY_FIELD_MAP[filters.orderBy] || filters.orderBy;
        queryParams.push(`$orderby=${odataField} asc`);
      }

      const oDataQuery = queryParams.join('&');
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: ProductDataverse[] };
      const products = responseData?.value || [];
      const mappedProducts = products.map((item) =>
        this.productMapper.mapDataverseToInternal(item),
      );

      // Store in cache with shorter TTL for list queries
      await this.redisService.set(cacheKey, JSON.stringify(mappedProducts), {
        EX: this.CACHE_TTL_LIST,
      });

      return mappedProducts;
    } catch (error) {
      this.logger.error(
        `Failed to find all products: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Find products by category
   *
   * @param category - Product category
   * @returns Array of products
   */
  async findByCategory(category: ProductCategory): Promise<ProductInternal[]> {
    try {
      // Try cache first
      const cacheKey = this.getListCacheKey({ category });
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for category: ${category}`);
        return JSON.parse(cached) as ProductInternal[];
      }

      this.logger.debug(`Cache MISS for category: ${category}`);

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${PRODUCT_ODATA.PRODUCT_CATEGORY} eq ${category}&$select=${PRODUCT_SELECT_DEFAULT}`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: ProductDataverse[] };
      const products = responseData?.value || [];
      const mappedProducts = products.map((item) =>
        this.productMapper.mapDataverseToInternal(item),
      );

      // Store in cache
      await this.redisService.set(cacheKey, JSON.stringify(mappedProducts), {
        EX: this.CACHE_TTL_LIST,
      });

      return mappedProducts;
    } catch (error) {
      this.logger.error(
        `Failed to find products by category ${category}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Find products by status
   *
   * @param status - Product status
   * @returns Array of products
   */
  async findByStatus(status: ProductStatus): Promise<ProductInternal[]> {
    try {
      // Try cache first
      const cacheKey = this.getListCacheKey({ status });
      const cached = await this.redisService.get(cacheKey);

      if (cached) {
        this.logger.debug(`Cache HIT for status: ${status}`);
        return JSON.parse(cached) as ProductInternal[];
      }

      this.logger.debug(`Cache MISS for status: ${status}`);

      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${PRODUCT_ODATA.PRODUCT_STATUS} eq ${status}&$select=${PRODUCT_SELECT_DEFAULT}`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: ProductDataverse[] };
      const products = responseData?.value || [];
      const mappedProducts = products.map((item) =>
        this.productMapper.mapDataverseToInternal(item),
      );

      // Store in cache
      await this.redisService.set(cacheKey, JSON.stringify(mappedProducts), {
        EX: this.CACHE_TTL_LIST,
      });

      return mappedProducts;
    } catch (error) {
      this.logger.error(
        `Failed to find products by status ${status}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Find available products (status = AVAILABLE)
   *
   * @returns Array of available products
   */
  async findAvailableProducts(): Promise<ProductInternal[]> {
    return this.findByStatus(ProductStatus.AVAILABLE);
  }

  /**
   * Find products active on a specific date
   *
   * A product is active if:
   * - (start_date is null OR start_date <= referenceDate) AND
   * - (end_date is null OR end_date >= referenceDate)
   *
   * @param referenceDate - Date to check (defaults to today)
   * @param status - Optional status filter (defaults to AVAILABLE)
   * @returns Array of active products
   */
  async findActiveByDate(
    referenceDate?: Date,
    status?: ProductStatus,
  ): Promise<ProductInternal[]> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const date = referenceDate || new Date();
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

      // Build date filter
      const dateFilter =
        `(${PRODUCT_ODATA.START_DATE} eq null or ${PRODUCT_ODATA.START_DATE} le ${dateStr}) and ` +
        `(${PRODUCT_ODATA.END_DATE} eq null or ${PRODUCT_ODATA.END_DATE} ge ${dateStr})`;

      // Add status filter if provided
      const statusFilter =
        status !== undefined
          ? ` and ${PRODUCT_ODATA.PRODUCT_STATUS} eq ${status}`
          : '';

      const oDataQuery = `$filter=${dateFilter}${statusFilter}&$select=${PRODUCT_SELECT_FULL}`;

      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: ProductDataverse[] };
      const products = responseData?.value || [];
      return products.map((item) =>
        this.productMapper.mapDataverseToInternal(item),
      );
    } catch (error) {
      this.logger.error(
        `Failed to find products active by date: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Find products with low stock
   *
   * @param threshold - Stock threshold (default: 10)
   * @returns Array of low stock products
   */
  async findLowStockProducts(
    threshold: number = 10,
  ): Promise<ProductInternal[]> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${PRODUCT_ODATA.INVENTORY} le ${threshold} and ${PRODUCT_ODATA.INVENTORY} gt 0&$select=${PRODUCT_SELECT_DEFAULT}`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: ProductDataverse[] };
      const products = responseData?.value || [];
      return products.map((item) =>
        this.productMapper.mapDataverseToInternal(item),
      );
    } catch (error) {
      this.logger.error(
        `Failed to find low stock products: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Search products by name, code, or description
   *
   * @param searchQuery - Search query
   * @returns Array of matching products
   */
  async searchProducts(searchQuery: string): Promise<ProductInternal[]> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=contains(${PRODUCT_ODATA.PRODUCT_NAME}, '${searchQuery}') or contains(${PRODUCT_ODATA.PRODUCT_CODE}, '${searchQuery}') or contains(${PRODUCT_ODATA.PRODUCT_DESCRIPTION}, '${searchQuery}')&$select=${PRODUCT_SELECT_DEFAULT}`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: ProductDataverse[] };
      const products = responseData?.value || [];
      return products.map((item) =>
        this.productMapper.mapDataverseToInternal(item),
      );
    } catch (error) {
      this.logger.error(
        `Failed to search products: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  /**
   * Find multiple products by IDs
   *
   * @param ids - Array of product IDs
   * @returns Array of products
   */
  async findByIds(ids: string[]): Promise<ProductInternal[]> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const filter = ids
        .map((id) => `${PRODUCT_ENTITY.primaryKey} eq ${id}`)
        .join(' or ');

      const oDataQuery = `$filter=${filter}&$select=${PRODUCT_SELECT_FULL}`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { value?: ProductDataverse[] };
      const products = responseData?.value || [];
      return products.map((item) =>
        this.productMapper.mapDataverseToInternal(item),
      );
    } catch (error) {
      this.logger.error(
        `Failed to find products by IDs: ${error instanceof Error ? error.message : String(error)}`,
      );
      return [];
    }
  }

  // ========================================
  // UPDATE
  // ========================================

  /**
   * Update product
   *
   * @param id - Product ID
   * @param updates - Partial product updates
   * @returns Updated product
   */
  async update(
    id: string,
    updates: Partial<ProductInternal>,
  ): Promise<ProductInternal> {
    try {
      const app = getAppForOperation('write', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const payload = this.productMapper.mapInternalToDataverse(updates);

      // DEBUG: Log what we're sending to Dataverse
      this.logger.debug(`[UPDATE] Payload being sent to Dataverse:`, {
        id,
        payload,
        hasStartDate: 'osot_start_date' in payload,
        hasEndDate: 'osot_end_date' in payload,
        startDate: payload.osot_start_date,
        endDate: payload.osot_end_date,
      });

      await this.dataverseService.request(
        'PATCH',
        `${PRODUCT_ENTITY.collectionName}(${id})`,
        payload,
        credentials,
        app,
      );

      // Fetch updated product
      const updatedProduct = await this.findById(id);

      // DEBUG: Log what we got back from Dataverse
      this.logger.debug(`[UPDATE] Product retrieved after update:`, {
        id,
        hasStartDate: updatedProduct?.osot_start_date !== undefined,
        hasEndDate: updatedProduct?.osot_end_date !== undefined,
        startDate: updatedProduct?.osot_start_date,
        endDate: updatedProduct?.osot_end_date,
      });

      if (!updatedProduct) {
        throw new Error('Failed to retrieve updated product');
      }

      // Invalidate cache after update
      await this.invalidateCache(
        updatedProduct.osot_productid,
        updatedProduct.osot_product_code,
        id,
      );

      return updatedProduct;
    } catch (error) {
      this.logger.error(
        `Failed to update product ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Batch update multiple products
   *
   * @param ids - Array of product GUIDs to update
   * @param updates - Partial product updates
   * @param operationId - Operation tracking ID
   * @returns Array of updated products
   */
  async batchUpdate(
    ids: string[],
    updates: Partial<ProductInternal>,
    _operationId?: string,
  ): Promise<ProductInternal[]> {
    try {
      const updatePromises = ids.map((id) => this.update(id, updates));
      return await Promise.all(updatePromises);
    } catch (error) {
      this.logger.error(
        `Failed to batch update products: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  // ========================================
  // DELETE
  // ========================================

  /**
   * Soft delete product (set status to DISCONTINUED)
   *
   * @param id - Product ID
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  async delete(id: string, _operationId?: string): Promise<boolean> {
    try {
      // Get product before delete for cache invalidation
      const product = await this.findById(id);

      await this.update(id, {
        osot_product_status: ProductStatus.DISCONTINUED,
      });

      // Invalidate cache (update() already does this, but being explicit)
      if (product) {
        await this.invalidateCache(
          product.osot_productid,
          product.osot_product_code,
          id,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to delete product ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Hard delete product (permanent removal)
   *
   * @param id - Product ID
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  async hardDelete(id: string, _operationId?: string): Promise<boolean> {
    try {
      // Get product before delete for cache invalidation
      const product = await this.findById(id);

      const app = getAppForOperation('delete', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      await this.dataverseService.request(
        'DELETE',
        `${PRODUCT_ENTITY.collectionName}(${id})`,
        undefined,
        credentials,
        app,
      );

      // Invalidate cache
      if (product) {
        await this.invalidateCache(
          product.osot_productid,
          product.osot_product_code,
          id,
        );
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to hard delete product ${id}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  // ========================================
  // EXISTENCE CHECKS
  // ========================================

  /**
   * Check if product code exists
   *
   * @param productCode - Product code
   * @returns true if exists
   */
  async existsByProductCode(productCode: string): Promise<boolean> {
    const product = await this.findByProductCode(productCode);
    return product !== null;
  }

  /**
   * Check if product exists by ID
   *
   * @param id - Product ID
   * @returns true if exists
   */
  async existsById(id: string): Promise<boolean> {
    const product = await this.findById(id);
    return product !== null;
  }

  // ========================================
  // COUNT
  // ========================================

  /**
   * Count all products
   *
   * @returns Total count
   */
  async count(): Promise<number> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$select=${PRODUCT_ENTITY.primaryKey}&$count=true`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { '@odata.count'?: number };
      return responseData['@odata.count'] || 0;
    } catch (error) {
      this.logger.error(
        `Failed to count products: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  /**
   * Count available products
   *
   * @returns Count of available products
   */
  async countAvailable(): Promise<number> {
    try {
      const app = getAppForOperation('read', 'main');
      const credentials = this.dataverseService.getCredentialsByApp(app);

      const oDataQuery = `$filter=${PRODUCT_ODATA.PRODUCT_STATUS} eq ${ProductStatus.AVAILABLE}&$select=${PRODUCT_ENTITY.primaryKey}&$count=true`;
      const response = await this.dataverseService.request(
        'GET',
        `${PRODUCT_ENTITY.collectionName}?${oDataQuery}`,
        undefined,
        credentials,
        app,
      );

      const responseData = response as { '@odata.count'?: number };
      return responseData['@odata.count'] || 0;
    } catch (error) {
      this.logger.error(
        `Failed to count available products: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }
}
