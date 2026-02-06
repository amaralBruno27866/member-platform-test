/**
 * Create Order Product DTO
 *
 * Data Transfer Object for creating a new Order Product (line item).
 *
 * Architecture Notes:
 * - Extends OrderProductBasicDto (inherits all product/pricing fields)
 * - Requires orderGuid (parent order lookup)
 * - All snapshot fields are required (immutable after creation)
 * - Owner role CANNOT use this endpoint (only Main/Admin apps)
 *
 * Usage:
 * - Backend orchestration when Order is created
 * - Manual order creation by Admin (exceptional cases)
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { OrderProductBasicDto } from './order-product-basic.dto';
import { ORDER_PRODUCT_VALIDATION_MESSAGES } from '../constants';

/**
 * DTO for creating a new Order Product
 */
export class CreateOrderProductDto extends OrderProductBasicDto {
  // ========================================
  // REQUIRED RELATIONSHIP
  // ========================================

  @ApiProperty({
    description:
      'Parent Order GUID (required). This line item belongs to this order.',
    example: 'abc-123-def-456-ghi',
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty({ message: ORDER_PRODUCT_VALIDATION_MESSAGES.ORDER_REQUIRED })
  @IsUUID('4', {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.INVALID_ORDER_GUID,
  })
  orderGuid: string;
}
