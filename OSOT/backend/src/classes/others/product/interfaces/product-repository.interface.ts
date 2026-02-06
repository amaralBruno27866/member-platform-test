/**
 * Product Repository Interface
 *
 * Contract for Product data access layer.
 * Defines all methods for interacting with Product entity in Dataverse.
 *
 * Responsibilities:
 * - CRUD operations (Create, Read, Update, Delete)
 * - Query operations (Find, Search, Filter)
 * - Existence checks
 * - Count operations
 *
 * All methods return ProductInternal objects (not Dataverse-specific).
 * Repository implementations handle the transformation from Dataverse to Internal.
 */

import { ProductInternal } from './product-internal.interface';
import { ProductCategory } from '../enums/product-category.enum';
import { ProductStatus } from '../enums/product-status.enum';

/**
 * Product Repository contract
 */
export interface ProductRepository {
  // ========================================
  // CRUD OPERATIONS
  // ========================================

  /**
   * Create a new product
   *
   * @param product - Product data (without IDs - auto-generated)
   * @param operationId - Operation tracking ID
   * @returns Created product with generated IDs
   */
  create(
    product: Omit<ProductInternal, 'osot_table_productid' | 'osot_productid'>,
    operationId?: string,
  ): Promise<ProductInternal>;

  /**
   * Update existing product
   *
   * @param id - Product GUID (osot_table_productid)
   * @param updates - Partial product data to update
   * @param operationId - Operation tracking ID
   * @returns Updated product
   */
  update(
    id: string,
    updates: Partial<ProductInternal>,
    operationId?: string,
  ): Promise<ProductInternal>;

  /**
   * Delete product (soft delete - mark as inactive)
   *
   * @param id - Product GUID (osot_table_productid)
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  delete(id: string, operationId?: string): Promise<boolean>;

  /**
   * Hard delete product (permanent removal)
   * Use with caution - irreversible operation
   *
   * @param id - Product GUID (osot_table_productid)
   * @param operationId - Operation tracking ID
   * @returns True if deleted successfully
   */
  hardDelete(id: string, operationId?: string): Promise<boolean>;

  // ========================================
  // FIND OPERATIONS (Single Record)
  // ========================================

  /**
   * Find product by internal ID (GUID)
   *
   * @param id - Product GUID (osot_table_productid)
   * @param operationId - Operation tracking ID
   * @returns Product or null if not found
   */
  findById(
    id: string,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<ProductInternal | null>;

  /**
   * Find product by business ID (Autonumber)
   *
   * @param productId - Business product ID (osot_productid)
   * @param operationId - Operation tracking ID
   * @returns Product or null if not found
   */
  findByProductId(
    productId: string,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<ProductInternal | null>;

  /**
   * Find product by product code (unique)
   * Case-insensitive search
   *
   * @param productCode - Product code (osot_product_code)
   * @param operationId - Operation tracking ID
   * @returns Product or null if not found
   */
  findByProductCode(
    productCode: string,
    organizationGuid?: string,
    operationId?: string,
  ): Promise<ProductInternal | null>;

  // ========================================
  // QUERY OPERATIONS (Multiple Records)
  // ========================================

  /**
   * Find all products with optional filters
   *
   * @param filters - Optional filters (category, status, year, pagination)
   * @param operationId - Operation tracking ID
   * @returns Array of products
   */
  findAll(
    filters?: {
      category?: ProductCategory;
      status?: ProductStatus;
      productYear?: string;
      skip?: number;
      top?: number;
      orderBy?: string;
      organizationGuid?: string;
    },
    operationId?: string,
  ): Promise<ProductInternal[]>;

  /**
   * Find products by category
   *
   * @param category - Product category
   * @param operationId - Operation tracking ID
   * @returns Array of products in this category
   */
  findByCategory(
    category: ProductCategory,
    operationId?: string,
  ): Promise<ProductInternal[]>;

  /**
   * Find products by status
   *
   * @param status - Product status
   * @param operationId - Operation tracking ID
   * @returns Array of products with this status
   */
  findByStatus(
    status: ProductStatus,
    operationId?: string,
  ): Promise<ProductInternal[]>;

  /**
   * Find available products (status = AVAILABLE)
   * Used for public catalog/landing page
   *
   * @param operationId - Operation tracking ID
   * @returns Array of available products
   */
  findAvailableProducts(operationId?: string): Promise<ProductInternal[]>;

  /**
   * Find products active on a specific date
   *
   * A product is active if:
   * - (start_date is null OR start_date <= referenceDate) AND
   * - (end_date is null OR end_date >= referenceDate)
   *
   * @param referenceDate - Date to check (defaults to today)
   * @param status - Optional status filter (defaults to AVAILABLE)
   * @param operationId - Operation tracking ID
   * @returns Array of active products on the specified date
   */
  findActiveByDate(
    referenceDate?: Date,
    status?: ProductStatus,
    operationId?: string,
  ): Promise<ProductInternal[]>;

  /**
   * Find low stock products
   * Products with inventory below threshold
   *
   * @param threshold - Inventory threshold (default: 10)
   * @param operationId - Operation tracking ID
   * @returns Array of low stock products
   */
  findLowStockProducts(
    threshold?: number,
    operationId?: string,
  ): Promise<ProductInternal[]>;

  // ========================================
  // SEARCH OPERATIONS
  // ========================================

  /**
   * Search products by name or description
   * Full-text search across product catalog
   *
   * @param query - Search query string
   * @param operationId - Operation tracking ID
   * @returns Array of matching products
   */
  searchProducts(
    query: string,
    operationId?: string,
  ): Promise<ProductInternal[]>;

  // ========================================
  // EXISTENCE CHECKS
  // ========================================

  /**
   * Check if product code exists
   * Case-insensitive check
   * Used for duplicate validation
   *
   * @param productCode - Product code to check
   * @param excludeId - Optional product ID to exclude from check (for updates)
   * @param operationId - Operation tracking ID
   * @returns True if code exists, false otherwise
   */
  existsByProductCode(
    productCode: string,
    excludeId?: string,
    operationId?: string,
  ): Promise<boolean>;

  /**
   * Check if product exists by ID
   *
   * @param id - Product GUID
   * @param operationId - Operation tracking ID
   * @returns True if exists, false otherwise
   */
  existsById(id: string, operationId?: string): Promise<boolean>;

  // ========================================
  // COUNT OPERATIONS
  // ========================================

  /**
   * Count products with optional filters
   *
   * @param filters - Optional filters (category, status)
   * @param operationId - Operation tracking ID
   * @returns Total count
   */
  count(
    filters?: {
      category?: ProductCategory;
      status?: ProductStatus;
    },
    operationId?: string,
  ): Promise<number>;

  /**
   * Count available products
   *
   * @param operationId - Operation tracking ID
   * @returns Count of available products
   */
  countAvailable(operationId?: string): Promise<number>;

  // ========================================
  // BATCH OPERATIONS
  // ========================================

  /**
   * Find products by IDs (batch)
   * Efficiently retrieve multiple products
   *
   * @param ids - Array of product GUIDs
   * @param operationId - Operation tracking ID
   * @returns Array of products (may be fewer than requested if some not found)
   */
  findByIds(ids: string[], operationId?: string): Promise<ProductInternal[]>;

  /**
   * Update multiple products (batch)
   * Apply same updates to multiple products
   *
   * @param ids - Array of product GUIDs to update
   * @param updates - Updates to apply to all products
   * @param operationId - Operation tracking ID
   * @returns Array of updated products
   */
  batchUpdate(
    ids: string[],
    updates: Partial<ProductInternal>,
    operationId?: string,
  ): Promise<ProductInternal[]>;
}

/**
 * Product Repository injection token
 * Used for dependency injection in NestJS
 * Using string token for better TypeScript type inference
 */
export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY' as const;
