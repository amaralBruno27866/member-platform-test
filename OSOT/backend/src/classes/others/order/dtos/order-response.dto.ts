/**
 * Order Response DTO
 *
 * Data Transfer Object for order responses to clients.
 * Includes all order data plus formatted display values.
 *
 * Features:
 * - All order fields
 * - Formatted status labels
 * - Buyer details (name from account or affiliate)
 * - Complete financial breakdown
 * - System fields (created, modified, owner)
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Order Product Response DTO (with lookup details)
 */
export class OrderProductResponseDto {
  @ApiProperty({
    description: 'Order Product GUID',
    example: 'xyz-789-123',
  })
  id?: string;

  @ApiProperty({
    description: 'Product ID (business identifier)',
    example: 'osot-prod-0000048',
  })
  productId?: string;

  @ApiProperty({
    description: 'Product name (snapshot)',
    example: '2025 Professional Liability - $ 5,000 millions',
  })
  productName?: string;

  @ApiProperty({
    description: 'Quantity purchased',
    example: 1,
  })
  quantity?: number;

  @ApiProperty({
    description: 'Price at purchase',
    example: 79.0,
  })
  selectedPrice?: number;

  @ApiProperty({
    description: 'Tax rate percentage',
    example: 8,
  })
  productTaxRate?: number;

  @ApiProperty({
    description: 'Calculated tax amount',
    example: 6.32,
  })
  taxAmount?: number;

  @ApiProperty({
    description: 'Item subtotal',
    example: 79.0,
  })
  itemSubtotal?: number;

  @ApiProperty({
    description: 'Item total (subtotal + tax)',
    example: 85.32,
  })
  itemTotal?: number;
}

/**
 * Order Response DTO
 */
export class OrderResponseDto {
  // ========================================
  // IDENTIFIERS
  // ========================================

  @ApiProperty({
    description: 'Order GUID (osot_table_orderid)',
    example: 'a423cc4f-bfd2-f011-8544-002248b106dc',
  })
  id?: string;

  @ApiProperty({
    description: 'Business order number (user-friendly)',
    example: 'osot_ord-0000001',
  })
  orderNumber?: string;

  // ========================================
  // RELATIONSHIPS
  // ========================================

  @ApiProperty({
    description: 'Organization ID',
    example: 'a423cc4f-bfd2-f011-8544-002248b106dc',
  })
  organizationGuid?: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'OSOT',
  })
  organizationName?: string;

  @ApiProperty({
    description: 'Account ID (person buyer)',
    example: 'b534dd5f-cge3-g122-8655-003359c217ed',
  })
  accountGuid?: string;

  @ApiProperty({
    description: 'Account name (person buyer)',
    example: 'John Doe',
  })
  accountName?: string;

  @ApiProperty({
    description: 'Affiliate ID (company buyer)',
    example: 'c645ee6g-dhf4-h233-9766-004460d328fe',
  })
  affiliateGuid?: string;

  @ApiProperty({
    description: 'Affiliate name (company buyer)',
    example: 'ACME Corporation',
  })
  affiliateName?: string;

  // ========================================
  // STATUS
  // ========================================

  @ApiProperty({
    description: 'Order status (Display name)',
    example: 'Processing',
  })
  orderStatus?: string;

  @ApiProperty({
    description: 'Payment status (Display name)',
    example: 'Paid',
  })
  paymentStatus?: string;

  // ========================================
  // ACCESS CONTROL
  // ========================================

  @ApiProperty({
    description: 'Privilege level label',
    example: 'Admin',
    required: false,
  })
  privilege?: string;

  @ApiProperty({
    description: 'Access modifier label',
    example: 'Public',
    required: false,
  })
  accessModifiers?: string;

  // ========================================
  // PRODUCTS
  // ========================================

  @ApiProperty({
    description: 'Order line items (expanded)',
    type: [OrderProductResponseDto],
  })
  products?: OrderProductResponseDto[];

  // ========================================
  // FINANCIAL
  // ========================================

  @ApiProperty({
    description: 'Order subtotal (before coupon and taxes)',
    example: 350.0,
  })
  subtotal?: number;

  @ApiProperty({
    description: 'Coupon code applied (if any)',
    example: 'DISCOUNT15',
  })
  coupon?: string;

  @ApiProperty({
    description: 'Order total (final amount)',
    example: 380.5,
  })
  total?: number;

  // ========================================
  // SYSTEM FIELDS
  // ========================================

  @ApiProperty({
    description: 'Order creation date (ISO 8601)',
    example: '2026-01-22T15:30:00Z',
  })
  createdOn?: string;

  @ApiProperty({
    description: 'Order last modification date (ISO 8601)',
    example: '2026-01-22T16:45:30Z',
  })
  modifiedOn?: string;

  @ApiProperty({
    description: 'User GUID who created the order',
    example: 'a423cc4f-bfd2-f011-8544-002248b106dc',
  })
  createdBy?: string;

  @ApiProperty({
    description: 'User GUID who last modified the order',
    example: 'b534dd5f-cge3-g122-8655-003359c217ed',
  })
  modifiedBy?: string;

  @ApiProperty({
    description: 'Owner GUID (row-level security)',
    example: 'a423cc4f-bfd2-f011-8544-002248b106dc',
  })
  owner?: string;
}
