/**
 * Update Order DTO
 *
 * Data Transfer Object for updating existing orders.
 * All fields are optional - only provided fields will be updated.
 *
 * Restricted updates:
 * - organizationGuid: CANNOT be updated (immutable)
 * - accountGuid: CANNOT be updated (immutable)
 * - affiliateGuid: CANNOT be updated (immutable)
 * - products: Should be updated via OrderProduct endpoints
 * - subtotal: Auto-calculated (do not update directly)
 * - total: Auto-calculated (do not update directly)
 *
 * Allowed updates:
 * - orderStatus: Based on workflow rules
 * - paymentStatus: Based on payment result
 * - coupon: Applied/removed (before completion)
 */

import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';
import { AccessModifier, Privilege } from '../../../../common/enums';
import { ORDER_FIELD_LENGTH } from '../constants';

/**
 * Update Order DTO
 * All fields optional - partial updates
 */
export class UpdateOrderDto {
  // ========================================
  // STATUS (Updatable)
  // ========================================

  @ApiProperty({
    description: 'Update order status (follows workflow rules)',
    enum: OrderStatus,
    required: false,
    example: OrderStatus.SUBMITTED,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  orderStatus?: OrderStatus;

  @ApiProperty({
    description: 'Update payment status (set by payment gateway)',
    enum: PaymentStatus,
    required: false,
    example: PaymentStatus.PAID,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiProperty({
    description: 'Update privilege level for managing the order',
    enum: Privilege,
    required: false,
    example: Privilege.MAIN,
  })
  @IsEnum(Privilege)
  @IsOptional()
  privilege?: Privilege;

  @ApiProperty({
    description: 'Update access modifier for order visibility',
    enum: AccessModifier,
    required: false,
    example: AccessModifier.PROTECTED,
  })
  @IsEnum(AccessModifier)
  @IsOptional()
  accessModifiers?: AccessModifier;

  // ========================================
  // FINANCIAL (Limited Updates)
  // ========================================

  @ApiProperty({
    description: 'Update coupon code (before order completion)',
    example: 'NEWDISCOUNT20',
    maxLength: ORDER_FIELD_LENGTH.COUPON_MAX,
    required: false,
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : String(value),
  )
  coupon?: string;

  // ========================================
  // IMMUTABLE FIELDS (NOT UPDATABLE)
  // ========================================

  /**
   * NOTE: The following fields CANNOT be updated:
   * - organizationGuid: Set at creation (multi-tenant, immutable)
   * - accountGuid: Set at creation (immutable)
   * - affiliateGuid: Set at creation (immutable)
   * - products: Update via OrderProduct endpoints
   * - subtotal: Auto-calculated from products
   * - total: Auto-calculated from subtotal, coupon, and taxes
   *
   * These are intentionally excluded from this DTO to prevent accidental updates
   */
}
