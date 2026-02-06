/**
 * Order Product Response DTO
 *
 * Data Transfer Object for Order Product responses.
 * Returned by all endpoints (create, read, update, list).
 *
 * Architecture Notes:
 * - Includes all fields (system + business)
 * - No validation decorators (read-only response)
 * - Dates as ISO 8601 strings (frontend compatibility)
 * - Currency fields as numbers (2 decimal precision)
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessModifier, Privilege } from '../../../../common/enums';

/**
 * Response DTO for Order Product entity
 */
export class OrderProductResponseDto {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  @ApiProperty({
    description: 'Order Product GUID (primary key)',
    example: 'abc-123-def-456-ghi',
    format: 'uuid',
  })
  osot_table_order_productid: string;

  @ApiPropertyOptional({
    description:
      'Order Product autonumber ID (human-readable). Example: osot_ord_prod-0000001',
    example: 'osot_ord_prod-0000001',
  })
  osot_orderproductid?: string;

  @ApiPropertyOptional({
    description: 'Parent Order GUID (lookup reference)',
    example: 'order-guid-123',
    format: 'uuid',
  })
  orderGuid?: string;

  @ApiPropertyOptional({
    description: 'Record creation timestamp (ISO 8601)',
    example: '2026-01-23T10:30:00Z',
    format: 'date-time',
  })
  createdon?: string;

  @ApiPropertyOptional({
    description: 'Last modification timestamp (ISO 8601)',
    example: '2026-01-23T15:45:00Z',
    format: 'date-time',
  })
  modifiedon?: string;

  // ========================================
  // PRODUCT SNAPSHOT FIELDS (Immutable)
  // ========================================

  @ApiProperty({
    description:
      'Product ID reference (string, NOT lookup). Example: osot-prod-0000048',
    example: 'osot-prod-0000048',
  })
  osot_product_id: string;

  @ApiProperty({
    description:
      'Product name at purchase time (immutable snapshot). Example: 2025 Professional Liability - $ 5,000 millions',
    example: '2025 Professional Liability - $ 5,000 millions',
  })
  osot_product_name: string;

  @ApiProperty({
    description:
      'Product category at purchase time (immutable snapshot). 0=Membership, 1=Insurance, 2=Other Products. Used by event listeners to filter insurance items.',
    example: '1',
  })
  osot_product_category: string;

  @ApiPropertyOptional({
    description:
      'Insurance type display value at purchase time (text snapshot). Stored as plain text to preserve historical value.',
    example: 'Professional Liability',
  })
  osot_insurance_type?: string;

  @ApiPropertyOptional({
    description:
      'Insurance limit amount at purchase time in CAD (optional snapshot). Frozen at order creation to preserve coverage amount customer agreed to.',
    example: 50000.0,
  })
  osot_insurance_limit?: number;

  @ApiPropertyOptional({
    description:
      'Additional info/notes captured from product at purchase time (text snapshot).',
    example: 'Coverage starts immediately upon checkout.',
  })
  osot_product_additional_info?: string;

  // ========================================
  // QUANTITY & PRICING
  // ========================================

  @ApiProperty({
    description: 'Quantity purchased (immutable)',
    example: 2,
  })
  osot_quantity: number;

  @ApiProperty({
    description:
      'Price applied at checkout in CAD (immutable snapshot). Example: 79.00',
    example: 79.0,
  })
  osot_selectedprice: number;

  @ApiProperty({
    description:
      'Tax rate percentage applied (8, 13, 15, etc.). Immutable snapshot.',
    example: 13,
  })
  osot_producttax: number;

  // ========================================
  // CALCULATED AMOUNTS (Immutable)
  // ========================================

  @ApiProperty({
    description:
      'Calculated tax amount in CAD. Formula: itemSubtotal * (productTaxRate / 100)',
    example: 20.54,
  })
  osot_taxamount: number;

  @ApiProperty({
    description:
      'Item subtotal in CAD (before tax). Formula: selectedPrice * quantity',
    example: 158.0,
  })
  osot_itemsubtotal: number;

  @ApiProperty({
    description:
      'Item total in CAD (with tax). Formula: itemSubtotal + taxAmount',
    example: 178.54,
  })
  osot_itemtotal: number;

  // ========================================
  // ACCESS CONTROL
  // ========================================

  @ApiPropertyOptional({
    description:
      'Privilege level (visibility). Inherited from parent Order if not set.',
    enum: Privilege,
    example: Privilege.OWNER,
  })
  osot_privilege?: Privilege;

  @ApiPropertyOptional({
    description:
      'Access modifier (access rules). Inherited from parent Order if not set.',
    enum: AccessModifier,
    example: AccessModifier.PUBLIC,
  })
  osot_access_modifiers?: AccessModifier;
}
