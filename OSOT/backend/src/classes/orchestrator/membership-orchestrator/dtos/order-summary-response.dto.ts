/**
 * Order Summary Response DTO (Step 8)
 *
 * Complete order summary for display before payment confirmation.
 * This DTO aggregates data from multiple sources:
 * - Redis session (order ID, session ID)
 * - Dataverse account (user details)
 * - Dataverse organization (org details)
 * - Dataverse membership (category, period, status)
 * - Order DRAFT + OrderProducts (products, pricing, taxes)
 *
 * Used for Step 8: Order Review (before payment processing)
 *
 * DATA SOURCES MAPPING:
 * ├─ orderHeader
 * │  ├─ orderId: Order DRAFT ID (from Redis: ORDER_REFERENCE)
 * │  ├─ date: Current date (DateTime.now())
 * │  └─ sessionId: Membership session ID (from initiateMembership param)
 * │
 * ├─ userDetail
 * │  ├─ name: osot_first_name + osot_last_name (Account)
 * │  ├─ email: osot_email (Account)
 * │  ├─ phone: osot_phone_number (Account)
 * │  └─ address: Address entity (osot_address_1, osot_city, osot_province, osot_postal_code)
 * │
 * ├─ organizationDetail
 * │  ├─ name: osot_name (Organization)
 * │  └─ address: osot_address + osot_city + osot_province (Organization)
 * │
 * ├─ membershipDetail
 * │  ├─ category: MembershipCategory.osot_name (e.g., "OT - Practicing")
 * │  ├─ period: "From {startDate} until {endDate}"
 * │  │           (startDate = today, endDate from MembershipSettings.osot_expires_date)
 * │  ├─ status: "New member" | "Renewal" (from settings or logic)
 * │  └─ certificate: Account.osot_certificate or generated pattern
 * │
 * └─ products (OrderProduct list)
 *    ├─ id: OrderProduct.osot_table_order_productid
 *    ├─ productId: Product.osot_productid
 *    ├─ name: Product.osot_product_name
 *    ├─ description: Product.osot_description
 *    ├─ price: OrderProduct.osot_selectedprice | Product.osot_general_price
 *    ├─ tax: OrderProduct.osot_taxamount
 *    ├─ total: OrderProduct.osot_itemtotal (price + tax)
 *    └─ validFrom/validTo: Calculated based on product type
 *       ├─ MEMBERSHIP: From now until osot_expires_date
 *       ├─ INSURANCE: From now+grace_period until osot_expires_date
 *       └─ DONATION: null (no period)
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsISO8601,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Single Product in Order Summary
 */
export class OrderProductSummaryDto {
  @ApiProperty({
    description: 'Unique product order line ID in Order DRAFT',
    example: 'prod-line-12345',
  })
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Product GUID in Dataverse',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Product name (from Product.osot_product_name)',
    example: '2025 2026 Membership',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product description with coverage/details',
    example: '2025 Membership Fees - Expires on October 1st 2026',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Unit price CAD (before tax)',
    example: 200.25,
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Tax amount CAD (calculated based on osot_producttax rate)',
    example: 16.02,
  })
  @IsNotEmpty()
  @IsNumber()
  tax: number;

  @ApiProperty({
    description: 'Total price CAD (price + tax)',
    example: 216.27,
  })
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Product category (MEMBERSHIP, INSURANCE, DONATION)',
    example: 'MEMBERSHIP',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Valid from date (ISO 8601)',
    example: '2026-02-03',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiProperty({
    description: 'Valid until date (ISO 8601)',
    example: '2026-10-14',
    required: false,
  })
  @IsOptional()
  @IsISO8601()
  validUntil?: string;

  @ApiProperty({
    description: 'Coverage amount (for insurance products)',
    example: '$6,000,000',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverage?: string;

  @ApiProperty({
    description: 'Is tax deductible (for donation products)',
    example: false,
    required: false,
  })
  @IsOptional()
  isTaxDeductible?: boolean;
}

/**
 * User Detail Section
 */
export class UserDetailSummaryDto {
  @ApiProperty({
    description: 'Full user name (osot_first_name + osot_last_name)',
    example: 'Bruno Amaral',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'b.alencar.amaral@gmail.com',
  })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({
    description: 'User phone number',
    example: '437-313-0319',
  })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Full address (street + city, province, postal code)',
    example: '19 Kew Gdns, Richmond Hill - ON, L4B-1R6',
  })
  @IsNotEmpty()
  @IsString()
  address: string;
}

/**
 * Organization Detail Section
 */
export class OrganizationDetailSummaryDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'Ontario Society of Occupational Therapists',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Organization full address',
    example: '110 Sheppard Ave E Suite 810, North York, ON M2N 6Y8',
  })
  @IsNotEmpty()
  @IsString()
  address: string;
}

/**
 * Membership Detail Section
 */
export class MembershipDetailSummaryDto {
  @ApiProperty({
    description: 'Membership category name',
    example: 'OT - Practicing',
  })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Membership period (formatted string)',
    example: 'From February 03, 2026 until October 14, 2026',
  })
  @IsNotEmpty()
  @IsString()
  period: string;

  @ApiProperty({
    description: 'Membership status',
    enum: ['New member', 'Renewal', 'Upgrade', 'Reinstatement'],
    example: 'New member',
  })
  @IsNotEmpty()
  @IsString()
  status: string;

  @ApiProperty({
    description: 'Certificate ID (auto-generated or from account)',
    example: 'osot-0003519',
  })
  @IsNotEmpty()
  @IsString()
  certificate: string;
}

/**
 * Financial Summary Section
 */
export class FinancialSummaryDto {
  @ApiProperty({
    description: 'Subtotal of all products (before tax)',
    example: 557.5,
  })
  @IsNotEmpty()
  @IsNumber()
  subtotal: number;

  @ApiProperty({
    description: 'Total tax amount (HST/PST/GST based on province)',
    example: 59.21,
  })
  @IsNotEmpty()
  @IsNumber()
  tax: number;

  @ApiProperty({
    description: 'Discount amount (if coupon applied)',
    example: 0.0,
  })
  @IsNotEmpty()
  @IsNumber()
  discount: number;

  @ApiProperty({
    description: 'Total amount to be charged (subtotal + tax - discount)',
    example: 616.71,
  })
  @IsNotEmpty()
  @IsNumber()
  total: number;

  @ApiProperty({
    description: 'Payment method',
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal'],
    example: 'credit_card',
  })
  @IsNotEmpty()
  @IsString()
  paymentMethod: string;

  @ApiProperty({
    description: 'Payment processor',
    example: 'PayPal',
  })
  @IsNotEmpty()
  @IsString()
  processor: string;
}

/**
 * Order Summary Response DTO
 * Main DTO for Step 8: Order Review
 */
export class OrderSummaryResponseDto {
  @ApiProperty({
    description: 'Order header information',
    type: () => ({
      orderId: { type: 'string', example: 'osot_ord_0004321' },
      date: { type: 'string', example: '2026-02-03' },
      sessionId: {
        type: 'string',
        example: '12345-abscu-78de4-a45e-88f70-0100q1',
      },
    }),
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => Object)
  orderHeader: {
    orderId: string; // From ORDER_REFERENCE Redis key
    date: string; // ISO 8601 date
    sessionId: string; // From session parameter
  };

  @ApiProperty({
    description: 'User detailed information',
    type: UserDetailSummaryDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UserDetailSummaryDto)
  userDetail: UserDetailSummaryDto;

  @ApiProperty({
    description: 'Organization detailed information',
    type: OrganizationDetailSummaryDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => OrganizationDetailSummaryDto)
  organizationDetail: OrganizationDetailSummaryDto;

  @ApiProperty({
    description: 'Membership detailed information',
    type: MembershipDetailSummaryDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MembershipDetailSummaryDto)
  membershipDetail: MembershipDetailSummaryDto;

  @ApiProperty({
    description: 'List of products in order (membership, insurance, donations)',
    type: [OrderProductSummaryDto],
  })
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductSummaryDto)
  products: OrderProductSummaryDto[];

  @ApiProperty({
    description: 'Financial summary and totals',
    type: FinancialSummaryDto,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => FinancialSummaryDto)
  financialSummary: FinancialSummaryDto;
}
