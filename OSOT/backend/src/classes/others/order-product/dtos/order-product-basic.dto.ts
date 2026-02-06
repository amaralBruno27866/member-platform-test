/**
 * Order Product Basic DTO
 *
 * Shared base fields for Order Product operations.
 * Extended by Create, Update, and Response DTOs.
 *
 * Architecture Notes:
 * - Contains only business fields (no system fields)
 * - Used as base class for inheritance
 * - Field names match Dataverse logical names (snake_case)
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  Max,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessModifier, Privilege } from '../../../../common/enums';
import {
  ORDER_PRODUCT_STRING_LENGTHS,
  ORDER_PRODUCT_NUMERIC_RANGES,
  ORDER_PRODUCT_VALIDATION_MESSAGES,
} from '../constants';
import {
  IsValidItemSubtotalCalculation,
  IsValidTaxAmountCalculation,
  IsValidItemTotalCalculation,
  IsValidProductIdFormat,
} from '../validators';

/**
 * Base DTO for Order Product entity
 */
export class OrderProductBasicDto {
  // ========================================
  // PRODUCT SNAPSHOT FIELDS (Immutable)
  // ========================================

  @ApiProperty({
    description:
      'Product ID reference (string, NOT lookup GUID). Example: osot-prod-0000048',
    example: 'osot-prod-0000048',
    maxLength: ORDER_PRODUCT_STRING_LENGTHS.PRODUCT_ID,
  })
  @IsString()
  @IsNotEmpty({
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.PRODUCT_ID_REQUIRED,
  })
  @MaxLength(ORDER_PRODUCT_STRING_LENGTHS.PRODUCT_ID, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.PRODUCT_ID_TOO_LONG,
  })
  @IsValidProductIdFormat()
  osot_product_id: string;

  @ApiProperty({
    description:
      'Product name at purchase time (immutable snapshot). Example: 2025 Professional Liability - $ 5,000 millions',
    example: '2025 Professional Liability - $ 5,000 millions',
    maxLength: ORDER_PRODUCT_STRING_LENGTHS.PRODUCT_NAME,
  })
  @IsString()
  @IsNotEmpty({
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.PRODUCT_NAME_REQUIRED,
  })
  @MaxLength(ORDER_PRODUCT_STRING_LENGTHS.PRODUCT_NAME, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.PRODUCT_NAME_TOO_LONG,
  })
  osot_product_name: string;

  @ApiProperty({
    description:
      'Product category at purchase time (immutable snapshot). 0=Membership, 1=Insurance, 2=Other Products. Used by event listeners to filter insurance items.',
    example: '1',
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty({ message: 'Product category is required' })
  @MaxLength(2, { message: 'Product category must be 2 characters or less' })
  osot_product_category: string;

  @ApiPropertyOptional({
    description:
      'Insurance type display value at purchase time (text snapshot). Stored as plain text to preserve historical value.',
    example: 'Professional Liability',
    maxLength: ORDER_PRODUCT_STRING_LENGTHS.INSURANCE_TYPE,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ORDER_PRODUCT_STRING_LENGTHS.INSURANCE_TYPE, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.INSURANCE_TYPE_TOO_LONG,
  })
  osot_insurance_type?: string;

  @ApiPropertyOptional({
    description:
      'Insurance limit amount at purchase time in CAD (optional snapshot). Frozen at order creation to preserve coverage amount customer agreed to.',
    example: 50000.0,
    minimum: ORDER_PRODUCT_NUMERIC_RANGES.INSURANCE_LIMIT_MIN,
    maximum: ORDER_PRODUCT_NUMERIC_RANGES.INSURANCE_LIMIT_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(ORDER_PRODUCT_NUMERIC_RANGES.INSURANCE_LIMIT_MIN, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.INSURANCE_LIMIT_MIN,
  })
  @Max(ORDER_PRODUCT_NUMERIC_RANGES.INSURANCE_LIMIT_MAX, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.INSURANCE_LIMIT_MAX,
  })
  osot_insurance_limit?: number;

  @ApiPropertyOptional({
    description:
      'Additional info/notes captured from product at purchase time (text snapshot).',
    example: 'Coverage starts immediately upon checkout.',
    maxLength: ORDER_PRODUCT_STRING_LENGTHS.PRODUCT_ADDITIONAL_INFO,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ORDER_PRODUCT_STRING_LENGTHS.PRODUCT_ADDITIONAL_INFO, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.PRODUCT_ADDITIONAL_INFO_TOO_LONG,
  })
  osot_product_additional_info?: string;

  // ========================================
  // QUANTITY & PRICING
  // ========================================

  @ApiProperty({
    description: 'Quantity purchased (immutable after creation)',
    example: 2,
    minimum: ORDER_PRODUCT_NUMERIC_RANGES.QUANTITY_MIN,
    maximum: ORDER_PRODUCT_NUMERIC_RANGES.QUANTITY_MAX,
  })
  @IsInt()
  @IsPositive()
  @Min(ORDER_PRODUCT_NUMERIC_RANGES.QUANTITY_MIN, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.QUANTITY_MIN,
  })
  @Max(ORDER_PRODUCT_NUMERIC_RANGES.QUANTITY_MAX, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.QUANTITY_MAX,
  })
  osot_quantity: number;

  @ApiProperty({
    description:
      'Price applied at checkout in CAD (immutable snapshot). Example: 79.00',
    example: 79.0,
    minimum: ORDER_PRODUCT_NUMERIC_RANGES.SELECTED_PRICE_MIN,
    maximum: ORDER_PRODUCT_NUMERIC_RANGES.SELECTED_PRICE_MAX,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(ORDER_PRODUCT_NUMERIC_RANGES.SELECTED_PRICE_MIN, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.SELECTED_PRICE_MIN,
  })
  @Max(ORDER_PRODUCT_NUMERIC_RANGES.SELECTED_PRICE_MAX, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.SELECTED_PRICE_MAX,
  })
  osot_selectedprice: number;

  @ApiProperty({
    description:
      'Tax rate percentage applied (8, 13, 15, etc.). Immutable snapshot.',
    example: 13,
    minimum: ORDER_PRODUCT_NUMERIC_RANGES.PRODUCT_TAX_MIN,
    maximum: ORDER_PRODUCT_NUMERIC_RANGES.PRODUCT_TAX_MAX,
  })
  @IsInt()
  @Min(ORDER_PRODUCT_NUMERIC_RANGES.PRODUCT_TAX_MIN, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.PRODUCT_TAX_MIN,
  })
  @Max(ORDER_PRODUCT_NUMERIC_RANGES.PRODUCT_TAX_MAX, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.PRODUCT_TAX_MAX,
  })
  osot_producttax: number;

  // ========================================
  // CALCULATED AMOUNTS (Immutable)
  // ========================================

  @ApiProperty({
    description:
      'Calculated tax amount in CAD. Formula: itemSubtotal * (productTaxRate / 100)',
    example: 20.54,
    minimum: ORDER_PRODUCT_NUMERIC_RANGES.TAX_AMOUNT_MIN,
    maximum: ORDER_PRODUCT_NUMERIC_RANGES.TAX_AMOUNT_MAX,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(ORDER_PRODUCT_NUMERIC_RANGES.TAX_AMOUNT_MIN, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.TAX_AMOUNT_MIN,
  })
  @Max(ORDER_PRODUCT_NUMERIC_RANGES.TAX_AMOUNT_MAX, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.TAX_AMOUNT_MAX,
  })
  @IsValidTaxAmountCalculation()
  osot_taxamount: number;

  @ApiProperty({
    description:
      'Item subtotal in CAD (before tax). Formula: selectedPrice * quantity',
    example: 158.0,
    minimum: ORDER_PRODUCT_NUMERIC_RANGES.ITEM_SUBTOTAL_MIN,
    maximum: ORDER_PRODUCT_NUMERIC_RANGES.ITEM_SUBTOTAL_MAX,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(ORDER_PRODUCT_NUMERIC_RANGES.ITEM_SUBTOTAL_MIN, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.ITEM_SUBTOTAL_MIN,
  })
  @Max(ORDER_PRODUCT_NUMERIC_RANGES.ITEM_SUBTOTAL_MAX, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.ITEM_SUBTOTAL_MAX,
  })
  @IsValidItemSubtotalCalculation()
  osot_itemsubtotal: number;

  @ApiProperty({
    description:
      'Item total in CAD (with tax). Formula: itemSubtotal + taxAmount',
    example: 178.54,
    minimum: ORDER_PRODUCT_NUMERIC_RANGES.ITEM_TOTAL_MIN,
    maximum: ORDER_PRODUCT_NUMERIC_RANGES.ITEM_TOTAL_MAX,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(ORDER_PRODUCT_NUMERIC_RANGES.ITEM_TOTAL_MIN, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.ITEM_TOTAL_MIN,
  })
  @Max(ORDER_PRODUCT_NUMERIC_RANGES.ITEM_TOTAL_MAX, {
    message: ORDER_PRODUCT_VALIDATION_MESSAGES.ITEM_TOTAL_MAX,
  })
  @IsValidItemTotalCalculation()
  osot_itemtotal: number;

  // ========================================
  // ACCESS CONTROL (Optional)
  // ========================================

  @ApiPropertyOptional({
    description:
      'Privilege level (visibility). Inherited from parent Order if not set.',
    enum: Privilege,
    example: Privilege.OWNER,
  })
  @IsOptional()
  @IsEnum(Privilege)
  osot_privilege?: Privilege;

  @ApiPropertyOptional({
    description:
      'Access modifier (access rules). Inherited from parent Order if not set.',
    enum: AccessModifier,
    example: AccessModifier.PUBLIC,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  osot_access_modifiers?: AccessModifier;
}
