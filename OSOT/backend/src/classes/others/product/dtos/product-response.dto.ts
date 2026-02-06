/**
 * Product Response DTO
 *
 * Data Transfer Object for product responses to clients.
 * Includes all product data plus calculated/formatted fields.
 *
 * Features:
 * - All product fields
 * - Structured prices object
 * - Applicable price for user's category
 * - Formatted display values
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Structured prices object
 */
export class ProductPricesDto {
  @ApiProperty({ required: false, description: 'General public price' })
  general?: number;

  @ApiProperty({ required: false, description: 'OT Student price' })
  otStu?: number;

  @ApiProperty({ required: false, description: 'OT New Graduate price' })
  otNg?: number;

  @ApiProperty({ required: false, description: 'OT Practitioner price' })
  otPr?: number;

  @ApiProperty({ required: false, description: 'OT Non-Practising price' })
  otNp?: number;

  @ApiProperty({ required: false, description: 'OT Retired price' })
  otRet?: number;

  @ApiProperty({ required: false, description: 'OT Lifetime price' })
  otLife?: number;

  @ApiProperty({ required: false, description: 'OTA Student price' })
  otaStu?: number;

  @ApiProperty({ required: false, description: 'OTA New Graduate price' })
  otaNg?: number;

  @ApiProperty({ required: false, description: 'OTA Non-Practising price' })
  otaNp?: number;

  @ApiProperty({ required: false, description: 'OTA Retired price' })
  otaRet?: number;

  @ApiProperty({ required: false, description: 'OTA Practitioner price' })
  otaPr?: number;

  @ApiProperty({ required: false, description: 'OTA Lifetime price' })
  otaLife?: number;

  @ApiProperty({ required: false, description: 'Associate price' })
  assoc?: number;

  @ApiProperty({ required: false, description: 'Affiliate Primary price' })
  affPrim?: number;

  @ApiProperty({ required: false, description: 'Affiliate Premium price' })
  affPrem?: number;
}

/**
 * Product Response DTO
 */
export class ProductResponseDto {
  // ========================================
  // IDENTIFIERS
  // ========================================

  @ApiProperty({
    description: 'Product GUID (osot_table_productid)',
    example: 'a423cc4f-bfd2-f011-8544-002248b106dc',
  })
  id?: string;

  @ApiProperty({
    description: 'Product business ID (osot_productid)',
    example: 'osot-prod-0000005',
  })
  productId?: string;

  @ApiProperty({
    description: 'Unique product code',
    example: 'MEMBERSHIP-2025',
  })
  productCode!: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  @ApiProperty({
    description: 'Product name',
    example: 'OSOT Membership 2025',
  })
  productName!: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Annual membership for OT professionals',
  })
  productDescription!: string;

  @ApiProperty({
    description: 'Product category label',
    example: 'Insurance',
  })
  productCategory!: string;

  @ApiProperty({
    required: false,
    description: 'Product picture URL',
    example: 'https://example.com/product.jpg',
  })
  productPicture?: string;

  @ApiProperty({
    required: false,
    description: 'Insurance Type label (only for Insurance category products)',
    example: 'Professional',
  })
  insuranceType?: string;

  @ApiProperty({
    required: false,
    description: 'Additional product information for administrators',
    example: 'Special instructions or supplementary information',
  })
  productAdditionalInfo?: string;

  @ApiProperty({
    required: false,
    description:
      'Insurance Limit in currency (only for Insurance category products)',
    example: 100000,
    type: Number,
  })
  insuranceLimit?: number;

  // ========================================
  // CONTROL FIELDS
  // ========================================

  @ApiProperty({
    description: 'Product status label',
    example: 'Available',
  })
  productStatus!: string;

  @ApiProperty({
    description: 'General Ledger code label',
    example: 'Membership Fee 4100',
  })
  productGlCode!: string;

  @ApiProperty({
    required: false,
    description: 'Privilege level label',
    example: 'Admin',
  })
  privilege?: string;

  @ApiProperty({
    required: false,
    description: 'Target user type label',
    example: 'Both (All Users)',
  })
  userType?: string;

  @ApiProperty({
    required: false,
    description: 'Access modifier label',
    example: 'Public',
  })
  accessModifiers?: string;

  // ========================================
  // PRICING
  // ========================================

  @ApiProperty({
    description: 'All available prices for different membership categories',
    type: ProductPricesDto,
  })
  prices!: ProductPricesDto;

  @ApiProperty({
    required: false,
    description:
      'Price applicable to the current user based on their membership category',
    example: 100,
  })
  applicablePrice?: number;

  // ========================================
  // OTHER FIELDS
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Available inventory quantity',
    example: 100,
  })
  inventory?: number;

  @ApiProperty({
    required: false,
    description: 'Shipping cost',
    example: 10,
  })
  shipping?: number;

  @ApiProperty({
    description: 'Tax percentage',
    example: 13,
  })
  taxes!: number;

  // ========================================
  // DATE FIELDS
  // ========================================

  @ApiProperty({
    required: false,
    description:
      'Product start date (when it becomes available). Format: YYYY-MM-DD',
    example: '2025-01-01',
    type: String,
    format: 'date',
  })
  startDate?: string;

  @ApiProperty({
    required: false,
    description:
      'Product end date (when it becomes unavailable). Format: YYYY-MM-DD',
    example: '2025-12-31',
    type: String,
    format: 'date',
  })
  endDate?: string;

  // ========================================
  // COMPUTED FIELDS
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Whether product is in stock',
    example: true,
  })
  inStock?: boolean;

  @ApiProperty({
    required: false,
    description: 'Whether product inventory is low',
    example: false,
  })
  lowStock?: boolean;

  @ApiProperty({
    required: false,
    description: 'Total price including taxes and shipping',
    example: 123,
  })
  totalPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Whether product is currently active based on start/end dates',
    example: true,
  })
  isActive?: boolean;

  @ApiProperty({
    required: false,
    description: 'Price to display in UI (same as applicablePrice)',
    example: 100,
  })
  displayPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Field name where the price came from',
    example: 'osot_general_price',
  })
  priceField?: string;

  @ApiProperty({
    required: false,
    description: 'Whether the displayed price is the general public price',
    example: true,
  })
  isGeneralPrice?: boolean;

  @ApiProperty({
    required: false,
    description: 'Whether the current user can purchase this product',
    example: false,
  })
  canPurchase?: boolean;

  // ========================================
  // USER-SPECIFIC FIELDS (Membership Integration)
  // ========================================

  @ApiProperty({
    required: false,
    description:
      'Whether this product is exclusive to a specific membership category (has price in only ONE category)',
    example: false,
  })
  isExclusive?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Whether the current user has access to purchase (based on account status, membership, category)',
    example: true,
  })
  userHasAccess?: boolean;

  @ApiProperty({
    required: false,
    description: "User's group from MembershipCategory",
    example: 'OT',
  })
  userGroup?: string;

  @ApiProperty({
    required: false,
    description: "Account's group (only for Account users)",
    example: 'Member',
  })
  accountGroup?: string;

  @ApiProperty({
    required: false,
    description: "User's membership category (0-14)",
    example: 3,
  })
  membershipCategory?: number;

  // ========================================
  // NEW FIELDS
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Whether product is restricted to active members only',
    example: false,
  })
  activeMembershipOnly?: boolean;

  @ApiProperty({
    required: false,
    description: 'Post-purchase information included in email receipts',
    example: 'Thank you for your purchase!',
  })
  postPurchaseInfo?: string;

  @ApiProperty({
    description: 'Product year for administrative filtering (format: YYYY)',
    example: '2025',
  })
  productYear!: string;
}
