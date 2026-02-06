/**
 * List Orders Query DTO
 *
 * Data Transfer Object for filtering and paginating order list queries.
 * Used in GET /orders endpoint with optional filters.
 *
 * Query parameters:
 * - status: Filter by order status
 * - paymentStatus: Filter by payment status
 * - buyerId: Filter by account or affiliate (person or company)
 * - dateFrom: Filter orders created after this date
 * - dateTo: Filter orders created before this date
 * - skip: Pagination offset (default 0)
 * - top: Pagination limit (default 50, max 200)
 * - orderBy: Sort field (default: createdOn desc)
 */

import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';

/**
 * List Orders Query DTO
 */
export class ListOrdersQueryDto {
  // ========================================
  // FILTERING
  // ========================================

  @ApiProperty({
    description: 'Filter by order status',
    enum: OrderStatus,
    required: false,
    example: OrderStatus.PROCESSING,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  orderStatus?: OrderStatus;

  @ApiProperty({
    description: 'Filter by payment status',
    enum: PaymentStatus,
    required: false,
    example: PaymentStatus.PAID,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    description: 'Filter by buyer (account or affiliate GUID)',
    example: 'a423cc4f-bfd2-f011-8544-002248b106dc',
    required: false,
  })
  @IsString()
  @IsOptional()
  buyerId?: string;

  @ApiProperty({
    description: 'Filter orders created after this date (ISO 8601)',
    example: '2026-01-01T00:00:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiProperty({
    description: 'Filter orders created before this date (ISO 8601)',
    example: '2026-12-31T23:59:59Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  // ========================================
  // PAGINATION
  // ========================================

  @ApiProperty({
    description: 'Pagination offset (skip how many records)',
    example: 0,
    minimum: 0,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  skip?: number = 0;

  @ApiProperty({
    description: 'Pagination limit (max records to return)',
    example: 50,
    minimum: 1,
    maximum: 200,
    required: false,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  @IsOptional()
  top?: number = 50;

  // ========================================
  // SORTING
  // ========================================

  @ApiProperty({
    description: 'Sort field (createdOn, orderNumber, total)',
    example: 'createdOn',
    required: false,
    enum: ['createdOn', 'orderNumber', 'total', 'orderStatus', 'paymentStatus'],
  })
  @IsString()
  @IsIn(['createdOn', 'orderNumber', 'total', 'orderStatus', 'paymentStatus'])
  @IsOptional()
  orderBy?: string = 'createdOn';

  @ApiProperty({
    description: 'Sort direction (asc or desc)',
    example: 'desc',
    required: false,
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sortDirection?: string = 'desc';
}
