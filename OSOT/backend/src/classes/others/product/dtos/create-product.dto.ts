/**
 * Create Product DTO
 *
 * Data Transfer Object for creating a new product.
 * Validates all input data before product creation.
 *
 * Required fields:
 * - productName
 * - productCode (unique)
 * - productDescription
 * - productCategory
 * - productStatus
 * - productGlCode
 * - taxes
 * - productYear
 * - userType
 *
 * At least ONE price field must be provided.
 */

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUrl,
  MinLength,
  MaxLength,
  Min,
  Max,
  Matches,
  IsInt,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ProductCategory } from '../enums/product-category.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductGLCode } from '../enums/product-gl-code.enum';
import { InsuranceType } from '../enums/insurance-type.enum';
import { ProductUserType } from '../enums/product-user-type.enum';
import { Privilege, AccessModifier } from '../../../../common/enums';
import {
  PRODUCT_FIELD_LENGTH,
  PRODUCT_NUMERIC_CONSTRAINTS,
  PRODUCT_CODE_PATTERN,
} from '../constants';
import { IsEndDateAfterStartDate } from '../validators/is-end-date-after-start-date.validator';
import { AtLeastOnePrice } from '../validators/at-least-one-price.validator';
import { IsInsuranceTypeRequired } from '../validators/is-insurance-type-required.validator';
import { IsInsuranceLimitRequired } from '../validators/is-insurance-limit-required.validator';

export class CreateProductDto {
  // ========================================
  // BASIC INFORMATION (Required)
  // ========================================

  @ApiProperty({
    description: 'Product name',
    example: 'OSOT Membership 2025',
    minLength: PRODUCT_FIELD_LENGTH.PRODUCT_NAME_MIN,
    maxLength: PRODUCT_FIELD_LENGTH.PRODUCT_NAME_MAX,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(PRODUCT_FIELD_LENGTH.PRODUCT_NAME_MIN)
  @MaxLength(PRODUCT_FIELD_LENGTH.PRODUCT_NAME_MAX)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  productName: string;

  @ApiProperty({
    description:
      'Unique product code (uppercase, alphanumeric, hyphens, underscores)',
    example: 'MEMBERSHIP-2025',
    minLength: PRODUCT_FIELD_LENGTH.PRODUCT_CODE_MIN,
    maxLength: PRODUCT_FIELD_LENGTH.PRODUCT_CODE_MAX,
    pattern: PRODUCT_CODE_PATTERN.source,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(PRODUCT_FIELD_LENGTH.PRODUCT_CODE_MIN)
  @MaxLength(PRODUCT_FIELD_LENGTH.PRODUCT_CODE_MAX)
  @Matches(PRODUCT_CODE_PATTERN, {
    message:
      'Product code must contain only uppercase letters, numbers, hyphens, and underscores',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : (value as string),
  )
  productCode: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Annual membership for OT professionals',
    minLength: PRODUCT_FIELD_LENGTH.PRODUCT_DESCRIPTION_MIN,
    maxLength: PRODUCT_FIELD_LENGTH.PRODUCT_DESCRIPTION_MAX,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(PRODUCT_FIELD_LENGTH.PRODUCT_DESCRIPTION_MIN)
  @MaxLength(PRODUCT_FIELD_LENGTH.PRODUCT_DESCRIPTION_MAX)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  productDescription: string;

  @ApiProperty({
    required: false,
    description: 'Product picture URL',
    example: 'https://example.com/images/product.jpg',
    type: String,
    maxLength: PRODUCT_FIELD_LENGTH.PRODUCT_PICTURE_MAX,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Product picture must be a valid URL' })
  @MaxLength(PRODUCT_FIELD_LENGTH.PRODUCT_PICTURE_MAX)
  @Transform(({ value }: { value: string | null | undefined }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  productPicture?: string;

  @ApiProperty({
    description: 'Product category',
    enum: ProductCategory,
    example: ProductCategory.INSURANCE,
  })
  @IsEnum(ProductCategory)
  @IsNotEmpty()
  productCategory: ProductCategory;

  @ApiProperty({
    required: false,
    description:
      'Insurance Type (required only when productCategory = INSURANCE)',
    enum: InsuranceType,
    example: InsuranceType.PROFESSIONAL,
    type: Number,
  })
  @IsOptional()
  @IsEnum(InsuranceType, {
    message:
      'Insurance Type must be PROFESSIONAL (1), GENERAL (2), CORPORATIVE (3), or PROPERTY (4)',
  })
  @IsInsuranceTypeRequired({
    message: 'Insurance Type is required for Insurance products',
  })
  @Type(() => Number)
  insuranceType?: InsuranceType;

  @ApiProperty({
    required: false,
    description:
      'Additional product information (free-form text for administrators)',
    example: 'Special instructions for this product',
    maxLength: PRODUCT_FIELD_LENGTH.PRODUCT_ADDITIONAL_INFO_MAX,
  })
  @IsOptional()
  @IsString()
  @MaxLength(PRODUCT_FIELD_LENGTH.PRODUCT_ADDITIONAL_INFO_MAX)
  @Transform(({ value }: { value: string | null | undefined }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  productAdditionalInfo?: string;

  @ApiProperty({
    required: false,
    description:
      'Insurance Limit in currency (required only when productCategory = INSURANCE)',
    example: 100000,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.INSURANCE_LIMIT_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.INSURANCE_LIMIT_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.INSURANCE_LIMIT_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.INSURANCE_LIMIT_MAX)
  @IsInsuranceLimitRequired({
    message: 'Insurance Limit is required for Insurance products',
  })
  @Type(() => Number)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  insuranceLimit?: number;

  // ========================================
  // CONTROL FIELDS (Required)
  // ========================================

  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: ProductStatus.AVAILABLE,
    default: ProductStatus.AVAILABLE,
  })
  @IsEnum(ProductStatus)
  @IsNotEmpty()
  productStatus: ProductStatus;

  @ApiProperty({
    description: 'General Ledger account code',
    enum: ProductGLCode,
    example: ProductGLCode.MEMBERSHIP_FEE_4100,
  })
  @IsEnum(ProductGLCode)
  @IsNotEmpty()
  productGlCode: ProductGLCode;

  @ApiProperty({
    required: false,
    description: 'Privilege level for product management',
    enum: Privilege,
    example: Privilege.OWNER,
    default: Privilege.OWNER,
  })
  @IsOptional()
  @IsEnum(Privilege)
  privilege?: Privilege;

  @ApiProperty({
    required: true,
    description:
      'Target user type for product filtering (Layer 1 fast pre-filter)',
    enum: ProductUserType,
    enumName: 'ProductUserType',
    example: 3,
    default: 3,
    type: 'number',
    examples: {
      both: {
        summary: 'Both (All Users)',
        value: 3,
      },
      otOta: {
        summary: 'OT/OTA Only',
        value: 1,
      },
      affiliate: {
        summary: 'Affiliate Only',
        value: 2,
      },
    },
  })
  @IsNotEmpty()
  @IsEnum(ProductUserType, {
    message: 'User type must be OT_OTA (1), AFFILIATE (2), or BOTH (3)',
  })
  userType: ProductUserType;

  @ApiProperty({
    required: false,
    description: 'Access modifier for viewing control',
    enum: AccessModifier,
    example: AccessModifier.PUBLIC,
    default: AccessModifier.PUBLIC,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  accessModifiers?: AccessModifier;

  // ========================================
  // PRICING FIELDS (At least ONE required)
  // ========================================

  @ApiProperty({
    required: false,
    description:
      'General/public price (default price for non-members and members without category-specific pricing)',
    example: 100.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @AtLeastOnePrice()
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  generalPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OT-STU (OT Student) membership category',
    example: 50.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otStuPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OT-NG (OT New Graduate) membership category',
    example: 75.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otNgPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OT-PR (OT Practitioner) membership category',
    example: 100.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otPrPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OT-NP (OT Non-Practitioner) membership category',
    example: 80.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otNpPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OT-RET (OT Retired) membership category',
    example: 60.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otRetPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OT-LIFE (OT Lifetime Member) membership category',
    example: 0.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otLifePrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OTA-STU (OTA Student) membership category',
    example: 45.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otaStuPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OTA-NG (OTA New Graduate) membership category',
    example: 70.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otaNgPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OTA-NP (OTA Non-Practitioner) membership category',
    example: 75.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otaNpPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OTA-RET (OTA Retired) membership category',
    example: 55.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otaRetPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OTA-PR (OTA Practitioner) membership category',
    example: 90.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otaPrPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for OTA-LIFE (OTA Lifetime Member) membership category',
    example: 0.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  otaLifePrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for ASSOC (Associate Member) membership category',
    example: 120.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  assocPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for AFF-PRIM (Affiliate Primary) membership category',
    example: 85.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  affPrimPrice?: number;

  @ApiProperty({
    required: false,
    description: 'Price for AFF-PREM (Affiliate Premium) membership category',
    example: 95.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.PRICE_MAX)
  @Transform(({ value }: { value: string | number | null | undefined }) =>
    value === '' || value === null ? undefined : value,
  )
  affPremPrice?: number;

  // ========================================
  // OTHER FIELDS
  // ========================================

  @ApiProperty({
    required: false,
    description: 'Inventory quantity (0 = unlimited)',
    example: 100,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.INVENTORY_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.INVENTORY_MAX,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.INVENTORY_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.INVENTORY_MAX)
  inventory?: number;

  @ApiProperty({
    required: false,
    description: 'Shipping cost',
    example: 10.0,
    type: Number,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.SHIPPING_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.SHIPPING_MAX,
    default: 0,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.SHIPPING_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.SHIPPING_MAX)
  shipping?: number;

  @ApiProperty({
    description: 'Tax percentage',
    example: 13.0,
    minimum: PRODUCT_NUMERIC_CONSTRAINTS.TAX_MIN,
    maximum: PRODUCT_NUMERIC_CONSTRAINTS.TAX_MAX,
    default: 13.0,
  })
  @IsNumber({ maxDecimalPlaces: PRODUCT_NUMERIC_CONSTRAINTS.TAX_DECIMALS })
  @IsNotEmpty()
  @Min(PRODUCT_NUMERIC_CONSTRAINTS.TAX_MIN)
  @Max(PRODUCT_NUMERIC_CONSTRAINTS.TAX_MAX)
  taxes: number;

  // ========================================
  // DATE FIELDS (Time-limited products)
  // ========================================

  @ApiProperty({
    required: false,
    description:
      'Product start date (date-only) - Defines when the product becomes available. Format: YYYY-MM-DD',
    example: '2025-01-01',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Start date must be a valid date string in ISO 8601 format (YYYY-MM-DD)',
    },
  )
  startDate?: string;

  @ApiProperty({
    required: false,
    description:
      'Product end date (date-only) - Defines when the product becomes unavailable. Must be >= startDate. Format: YYYY-MM-DD',
    example: '2025-12-31',
    type: String,
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'End date must be a valid date string in ISO 8601 format (YYYY-MM-DD)',
    },
  )
  @IsEndDateAfterStartDate({
    message: 'End date must be greater than or equal to start date',
  })
  endDate?: string;

  // ========================================
  // NEW FIELDS
  // ========================================

  @ApiProperty({
    required: false,
    description:
      'Active Membership Only - Restricts purchase to active members only. Backend validates user osot_active_member field.',
    example: false,
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Active membership only must be a boolean value' })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  activeMembershipOnly?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Post Purchase Information - Plain text content included in email receipts after purchase.',
    example:
      'Thank you for your purchase! Your membership card will arrive within 7-10 business days.',
    type: String,
    maxLength: 4000,
  })
  @IsOptional()
  @IsString({ message: 'Post purchase info must be a string' })
  @MaxLength(4000, {
    message: 'Post purchase info cannot exceed 4000 characters',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  postPurchaseInfo?: string;

  @ApiProperty({
    description:
      'Product Year - 4-digit year for administrative filtering and reporting (format: YYYY).',
    example: '2025',
    type: String,
    pattern: '^\\d{4}$',
    minLength: 4,
    maxLength: 4,
  })
  @IsString({ message: 'Product year must be a string' })
  @IsNotEmpty({ message: 'Product year is required' })
  @Matches(/^\d{4}$/, {
    message: 'Product year must be a 4-digit year in YYYY format',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  productYear: string;
}
