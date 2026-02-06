/**
 * Order Basic DTO
 *
 * Simplified Data Transfer Object for order list views.
 * Contains only essential fields for displaying orders in lists.
 *
 * Features:
 * - Order identification (number, ID)
 * - Status information
 * - Financial summary
 * - Creation date
 *
 * Use cases:
 * - Order list endpoints
 * - Order history views
 * - Order selection dropdowns
 * - Mobile app list views
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Order Basic DTO
 * Lightweight version for list views
 */
export class OrderBasicDto {
  // ========================================
  // IDENTIFIERS
  // ========================================

  /**
   * Internal order ID (GUID)
   */
  @ApiProperty({
    description: 'Order GUID (osot_table_orderid)',
    example: 'a423cc4f-bfd2-f011-8544-002248b106dc',
  })
  id?: string;

  /**
   * Business order number (user-friendly)
   */
  @ApiProperty({
    description: 'Business order number (osot_orderid)',
    example: 'osot_ord-0000001',
  })
  orderNumber?: string;

  // ========================================
  // STATUS
  // ========================================

  /**
   * Order status display name
   */
  @ApiProperty({
    description: 'Order status (Draft, Submitted, Pending Approval, etc.)',
    example: 'Processing',
  })
  orderStatus?: string;

  /**
   * Payment status display name
   */
  @ApiProperty({
    description: 'Payment status (Unpaid, Pending, Paid, etc.)',
    example: 'Paid',
  })
  paymentStatus?: string;

  // ========================================
  // FINANCIAL
  // ========================================

  /**
   * Order subtotal (before coupon and taxes)
   */
  @ApiProperty({
    description: 'Order subtotal (before coupon and taxes)',
    example: 350.0,
  })
  subtotal?: number;

  /**
   * Order total (final amount)
   */
  @ApiProperty({
    description: 'Order total (final amount after coupon and taxes)',
    example: 380.5,
  })
  total?: number;

  // ========================================
  // BUYER INFORMATION
  // ========================================

  /**
   * Buyer name (account or affiliate name)
   */
  @ApiProperty({
    description: 'Buyer name (account or affiliate)',
    example: 'John Doe or ACME Corp',
  })
  buyerName?: string;

  // ========================================
  // DATES
  // ========================================

  /**
   * Order creation date
   */
  @ApiProperty({
    description: 'Order creation date',
    example: '2026-01-22T15:30:00Z',
  })
  createdOn?: string;
}
