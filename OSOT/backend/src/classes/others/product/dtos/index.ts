/**
 * Product DTOs Index
 *
 * Central export point for all Product Data Transfer Objects.
 *
 * Layers:
 * - Input DTOs: CreateProductDto, UpdateProductDto
 * - Output DTOs: ProductResponseDto, ProductBasicDto, ProductPricesDto
 * - Query DTOs: ListProductsQueryDto
 *
 * @file index.ts
 * @module ProductModule
 * @layer DTOs
 * @since 2025-05-01
 */

// ========================================
// INPUT DTOs (Create/Update)
// ========================================
export { CreateProductDto } from './create-product.dto';
export { UpdateProductDto } from './update-product.dto';

// ========================================
// OUTPUT DTOs (Response)
// ========================================
export { ProductResponseDto, ProductPricesDto } from './product-response.dto';
export { ProductBasicDto } from './product-basic.dto';

// ========================================
// QUERY DTOs (Filtering/Pagination)
// ========================================
export { ListProductsQueryDto } from './list-products-query.dto';
