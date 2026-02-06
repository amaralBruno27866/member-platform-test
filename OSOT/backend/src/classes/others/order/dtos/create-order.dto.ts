/**
 * Create Order DTO
 *
 * Data Transfer Object for creating a new order.
 * Validates all input data before order creation.
 *
 * Required fields:
 * - organizationGuid: Multi-tenant context
 * - accountGuid OR affiliateGuid: At least one buyer identifier
 * - products: Array of OrderProduct data with productId, quantity, selectedPrice, productTaxRate
 * - subtotal: Auto-calculated or provided
 * - total: Auto-calculated or provided
 *
 * Optional fields:
 * - coupon: Discount code
 * - orderStatus: Defaults to DRAFT
 * - paymentStatus: Defaults to UNPAID
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  ArrayMinSize,
  Min,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';
import { AccessModifier, Privilege } from '../../../../common/enums';
import { ORDER_FIELD_LENGTH, ORDER_NUMERIC_CONSTRAINTS } from '../constants';

/**
 * Order Product Line Item DTO (for create)
 */
export class CreateOrderProductDto {
  @ApiProperty({
    description: 'Product ID (business identifier)',
    example: 'osot-prod-0000048',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Product name (snapshot at purchase)',
    example: '2025 Professional Liability - $ 5,000 millions',
  })
  @IsString()
  @IsNotEmpty()
  productName: string;

  @ApiProperty({
    description: 'Quantity of product',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Price applied at purchase (snapshot)',
    example: 79.0,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(ORDER_NUMERIC_CONSTRAINTS.SUBTOTAL_MIN)
  selectedPrice: number;

  @ApiProperty({
    description: 'Product tax rate percentage (8, 13, etc.)',
    example: 8,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  productTaxRate: number;

  @ApiProperty({
    description: 'Calculated tax amount',
    example: 6.32,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  taxAmount: number;

  @ApiProperty({
    description: 'Item subtotal (price * quantity)',
    example: 79.0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  itemSubtotal: number;

  @ApiProperty({
    description: 'Item total (subtotal + tax)',
    example: 85.32,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  itemTotal: number;
}

/**
 * Create Order DTO
 */
export class CreateOrderDto {
  // ========================================
  // ORGANIZATION (Required)
  // ========================================

  @ApiProperty({
    description: 'Organization GUID (multi-tenant context)',
    example: 'a423cc4f-bfd2-f011-8544-002248b106dc',
  })
  @IsUUID()
  @IsNotEmpty()
  organizationGuid: string;

  // ========================================
  // BUYERS (At least one required)
  // ========================================

  @ApiProperty({
    description: 'Account GUID (person buyer)',
    example: 'a423cc4f-bfd2-f011-8544-002248b106dc',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  accountGuid?: string;

  @ApiProperty({
    description: 'Affiliate GUID (company buyer)',
    example: 'b534dd5f-cge3-g122-8655-003359c217ed',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  affiliateGuid?: string;

  // ========================================
  // STATUS (Optional - defaults will be applied)
  // ========================================

  @ApiProperty({
    description: 'Order status (defaults to DRAFT)',
    enum: OrderStatus,
    required: false,
    example: OrderStatus.DRAFT,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  orderStatus?: OrderStatus;

  @ApiProperty({
    description: 'Payment status (defaults to UNPAID)',
    enum: PaymentStatus,
    required: false,
    example: PaymentStatus.UNPAID,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  // ========================================
  // ACCESS CONTROL (Optional)
  // ========================================

  @ApiProperty({
    description: 'Privilege level controlling who can manage this order',
    enum: Privilege,
    required: false,
    example: Privilege.ADMIN,
  })
  @IsEnum(Privilege)
  @IsOptional()
  privilege?: Privilege;

  @ApiProperty({
    description: 'Access modifier controlling order visibility',
    enum: AccessModifier,
    required: false,
    example: AccessModifier.PUBLIC,
  })
  @IsEnum(AccessModifier)
  @IsOptional()
  accessModifiers?: AccessModifier;

  // ========================================
  // PRODUCTS (Required)
  // ========================================

  @ApiProperty({
    description: 'Array of order products (line items)',
    type: [CreateOrderProductDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'Order must have at least one product',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderProductDto)
  products: CreateOrderProductDto[];

  // ========================================
  // FINANCIAL (Required)
  // ========================================

  @ApiProperty({
    description: 'Order subtotal (sum of product prices)',
    example: 350.0,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(ORDER_NUMERIC_CONSTRAINTS.SUBTOTAL_MIN)
  @Transform(({ value }) => parseFloat(String(value)))
  subtotal: number;

  @ApiProperty({
    description: 'Coupon code (optional discount)',
    example: 'DISCOUNT15',
    maxLength: ORDER_FIELD_LENGTH.COUPON_MAX,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value),
  )
  coupon?: string;

  @ApiProperty({
    description: 'Order total (final amount)',
    example: 380.5,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(ORDER_NUMERIC_CONSTRAINTS.TOTAL_MIN)
  @Transform(({ value }) => parseFloat(String(value)))
  total: number;
}
