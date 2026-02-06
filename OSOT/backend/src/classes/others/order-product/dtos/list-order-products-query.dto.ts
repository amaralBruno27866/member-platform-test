/**
 * List Order Products Query DTO
 *
 * Query parameters for listing/filtering Order Products.
 *
 * Architecture Notes:
 * - Supports filtering by parent order, product, privilege, etc.
 * - Pagination via $top and $skip (OData style)
 * - Sorting via orderBy field
 * - Owner role automatically filtered to own orders
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AccessModifier, Privilege } from '../../../../common/enums';

/**
 * Query DTO for listing Order Products
 */
export class ListOrderProductsQueryDto {
  // ========================================
  // FILTERING
  // ========================================

  @ApiPropertyOptional({
    description:
      'Filter by parent Order GUID. Returns all line items for this order.',
    example: 'abc-123-def-456-ghi',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  @IsUUID('4')
  orderGuid?: string;

  @ApiPropertyOptional({
    description:
      'Filter by Product ID (string reference). Returns all orders containing this product.',
    example: 'osot-prod-0000048',
  })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Filter by privilege level (visibility)',
    enum: Privilege,
    example: Privilege.ADMIN,
  })
  @IsOptional()
  @IsEnum(Privilege)
  privilege?: Privilege;

  @ApiPropertyOptional({
    description: 'Filter by access modifier',
    enum: AccessModifier,
    example: AccessModifier.PRIVATE,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  accessModifier?: AccessModifier;

  @ApiPropertyOptional({
    description: 'Filter by Product Name (partial match, case-insensitive)',
    example: 'Professional Liability',
  })
  @IsOptional()
  @IsString()
  productName?: string;

  // ========================================
  // PAGINATION
  // ========================================

  @ApiPropertyOptional({
    description: 'Number of records to return (max 1000)',
    example: 50,
    minimum: 1,
    maximum: 1000,
    default: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  top?: number = 50;

  @ApiPropertyOptional({
    description: 'Number of records to skip (for pagination)',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  skip?: number = 0;

  // ========================================
  // SORTING
  // ========================================

  @ApiPropertyOptional({
    description: 'Field to sort by (default: createdon desc)',
    example: 'createdon',
    enum: [
      'createdon',
      'modifiedon',
      'osot_itemtotal',
      'osot_quantity',
      'osot_product_name',
    ],
    default: 'createdon',
  })
  @IsOptional()
  @IsString()
  orderBy?: string = 'createdon';

  @ApiPropertyOptional({
    description: 'Sort direction (asc or desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortDirection?: 'asc' | 'desc' = 'desc';
}
