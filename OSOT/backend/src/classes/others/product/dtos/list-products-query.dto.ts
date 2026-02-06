/**
 * List Products Query DTO
 *
 * Data Transfer Object for querying/filtering products list.
 * Supports filtering, searching, pagination, and sorting.
 *
 * Features:
 * - Filter by category, status, price range
 * - Filter by date range (active products)
 * - Search by name, code, description
 * - Stock filtering (in stock, low stock)
 * - Pagination (skip/take)
 * - Sorting (orderBy field)
 */

import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  IsIn,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductCategory } from '../enums/product-category.enum';
import { ProductStatus } from '../enums/product-status.enum';

/**
 * List Products Query DTO
 */
export class ListProductsQueryDto {
  // ========================================
  // FILTERING
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Filter by product category',
    enum: ProductCategory,
    example: ProductCategory.INSURANCE,
  })
  @IsOptional()
  @IsEnum(ProductCategory, {
    message: 'Product category must be a valid ProductCategory enum value',
  })
  @Type(() => Number)
  productCategory?: ProductCategory;

  @ApiProperty({
    required: false,
    description: 'Filter by product status',
    enum: ProductStatus,
    example: ProductStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'Product status must be a valid ProductStatus enum value',
  })
  @Type(() => Number)
  productStatus?: ProductStatus;

  @ApiProperty({
    required: false,
    description: 'Minimum price filter',
    example: 0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Minimum price must be a number' })
  @Min(0, { message: 'Minimum price cannot be negative' })
  @Type(() => Number)
  minPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Maximum price filter',
    example: 1000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Maximum price must be a number' })
  @Min(0, { message: 'Maximum price cannot be negative' })
  @Type(() => Number)
  maxPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Filter by in-stock products only',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'In stock filter must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  inStock?: boolean;

  @ApiProperty({
    required: false,
    description: 'Filter by low-stock products only',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Low stock filter must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  lowStock?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Filter by reference date (returns products active on this date). Format: YYYY-MM-DD',
    example: '2025-12-08',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Reference date must be a valid date string in ISO 8601 format (YYYY-MM-DD)',
    },
  )
  referenceDate?: string;

  @ApiProperty({
    required: false,
    description: 'Filter by active products only (based on start/end dates)',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Active only filter must be a boolean' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  activeOnly?: boolean;

  @ApiProperty({
    required: false,
    description: 'Filter by product year (format: YYYY)',
    example: '2025',
    pattern: '^\\d{4}$',
  })
  @IsOptional()
  @IsString({ message: 'Product year must be a string' })
  @Matches(/^\d{4}$/, {
    message: 'Product year must be a 4-digit year in YYYY format',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  productYear?: string;

  // ========================================
  // SEARCHING
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Search query (searches in name, code, description)',
    example: 'membership',
  })
  @IsOptional()
  @IsString({ message: 'Search query must be a string' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  searchQuery?: string;

  // ========================================
  // PAGINATION
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Number of records to skip',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Skip must be a number' })
  @Min(0, { message: 'Skip cannot be negative' })
  @Type(() => Number)
  skip?: number = 0;

  @ApiProperty({
    required: false,
    description: 'Number of records to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Take must be a number' })
  @Min(1, { message: 'Take must be at least 1' })
  @Max(100, { message: 'Take cannot exceed 100' })
  @Type(() => Number)
  take?: number = 20;

  // ========================================
  // SORTING
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Field to order results by',
    example: 'productName',
    enum: [
      'productName',
      'productCode',
      'productCategory',
      'productStatus',
      'generalPrice',
      'inventory',
      'createdon',
      'modifiedon',
      'startDate',
      'endDate',
      'productYear',
    ],
    default: 'productName',
  })
  @IsOptional()
  @IsString({ message: 'Order by must be a string' })
  @IsIn(
    [
      'productName',
      'productCode',
      'productCategory',
      'productStatus',
      'generalPrice',
      'inventory',
      'createdon',
      'modifiedon',
      'startDate',
      'endDate',
      'productYear',
    ],
    {
      message:
        'Order by must be one of: productName, productCode, productCategory, productStatus, generalPrice, inventory, createdon, modifiedon, startDate, endDate, productYear',
    },
  )
  orderBy?: string = 'productName';

  @ApiProperty({
    required: false,
    description: 'Sort direction',
    example: 'asc',
    enum: ['asc', 'desc'],
    default: 'asc',
  })
  @IsOptional()
  @IsString({ message: 'Order direction must be a string' })
  @IsIn(['asc', 'desc'], {
    message: 'Order direction must be either "asc" or "desc"',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase() : (value as 'asc' | 'desc'),
  )
  orderDirection?: 'asc' | 'desc' = 'asc';
}
