/**
 * Membership Progress DTO
 *
 * Tracks the progress of entity creation during the membership registration workflow.
 * This DTO maintains state about which membership entities have been created successfully,
 * which have failed, and stores critical references for entity linking.
 *
 * CRITICAL INFORMATION:
 * - Account GUID is required (from account orchestrator)
 * - Membership Category GUID stored after successful category creation
 * - All other entities use these GUIDs as lookup field values
 * - Failed entities can be retried without affecting successful ones
 * - Progress percentage calculated based on completed/total entities
 * - Includes payment and pricing tracking
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MembershipEntityType } from '../constants/membership-orchestrator.constants';

/**
 * Status of individual membership entity creation
 */
export class MembershipEntityCreationStatus {
  @ApiProperty({
    description: 'Membership entity type',
    enum: [
      'membership-category',
      'membership-employment',
      'membership-practices',
      'membership-preferences',
      'membership-settings',
      'product-insurance',
    ],
  })
  @IsEnum([
    'membership-category',
    'membership-employment',
    'membership-practices',
    'membership-preferences',
    'membership-settings',
    'product-insurance',
  ])
  entityType!: MembershipEntityType;

  @ApiProperty({
    description: 'Entity creation status',
    enum: ['pending', 'creating', 'completed', 'failed'],
  })
  @IsEnum(['pending', 'creating', 'completed', 'failed'])
  status!: 'pending' | 'creating' | 'completed' | 'failed';

  @ApiProperty({
    description: 'Created entity GUID if successful',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  entityGuid?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @IsString()
  createdAt?: string;

  @ApiProperty({ description: 'Error details if failed', required: false })
  @IsOptional()
  error?: {
    message: string;
    code: string;
    details?: any;
  };

  @ApiProperty({
    description: 'Number of retry attempts for this entity',
    default: 0,
  })
  @IsNumber()
  @Min(0)
  retryCount: number = 0;

  @ApiProperty({ description: 'Last retry timestamp', required: false })
  @IsOptional()
  @IsString()
  lastRetryAt?: string;
}

/**
 * Pricing breakdown for membership
 */
export class PricingBreakdownDto {
  @ApiProperty({
    description: 'Base membership price',
    example: 500.0,
  })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiProperty({
    description: 'Insurance price',
    example: 100.0,
  })
  @IsNumber()
  @Min(0)
  insurancePrice: number;

  @ApiProperty({
    description: 'Subtotal before taxes',
    example: 600.0,
  })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({
    description: 'Discounts applied',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'student' },
        amount: { type: 'number', example: 50.0 },
        reason: { type: 'string', example: 'Student discount 10%' },
      },
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  discounts: Array<{ type: string; amount: number; reason: string }>;

  @ApiProperty({
    description: 'Taxes applied',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'HST' },
        rate: { type: 'number', example: 0.13 },
        amount: { type: 'number', example: 71.5 },
      },
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  taxes: Array<{ type: string; rate: number; amount: number }>;

  @ApiProperty({
    description: 'Total amount to pay',
    example: 671.5,
  })
  @IsNumber()
  @Min(0)
  total: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'CAD',
  })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Pricing calculation timestamp',
    example: '2025-10-31T14:30:00.000Z',
  })
  @IsString()
  calculatedAt: string;
}

/**
 * Payment tracking information
 */
export class PaymentTrackingDto {
  @ApiProperty({
    description: 'Payment status',
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'refunded',
      'cancelled',
    ],
  })
  @IsEnum([
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'cancelled',
  ])
  status!:
    | 'pending'
    | 'processing'
    | 'completed'
    | 'failed'
    | 'refunded'
    | 'cancelled';

  @ApiProperty({
    description: 'Payment method',
    enum: ['credit_card', 'debit_card', 'bank_transfer'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['credit_card', 'debit_card', 'bank_transfer'])
  method?: 'credit_card' | 'debit_card' | 'bank_transfer';

  @ApiProperty({
    description: 'Transaction ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    description: 'Payment intent ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiProperty({
    description: 'Payment completion timestamp',
    required: false,
  })
  @IsOptional()
  @IsString()
  paidAt?: string;

  @ApiProperty({
    description: 'Payment error details',
    required: false,
  })
  @IsOptional()
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Complete progress tracking for membership registration workflow
 */
export class MembershipProgressDto {
  // ========================================
  // CRITICAL REFERENCES (for entity linking)
  // ========================================
  @ApiProperty({
    description: 'Account GUID (from account orchestrator)',
    example: '1a154db6-a8ae-f011-bbd3-002248b106dc',
  })
  @IsUUID()
  accountGuid: string;

  @ApiProperty({
    description:
      'Membership Category GUID (obtained after successful category creation)',
    example: '2b265ec7-b9bf-f022-cce4-113359c217ed',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  membershipCategoryGuid?: string;

  // ========================================
  // CURRENT PROGRESS STATE
  // ========================================
  @ApiProperty({
    description: 'Current entity being processed',
    enum: [
      'membership-category',
      'membership-employment',
      'membership-practices',
      'membership-preferences',
      'membership-settings',
      'product-insurance',
    ],
    example: 'membership-category',
  })
  @IsEnum([
    'membership-category',
    'membership-employment',
    'membership-practices',
    'membership-preferences',
    'membership-settings',
    'product-insurance',
  ])
  currentStep!: MembershipEntityType;

  @ApiProperty({
    description: 'Overall progress percentage (0-100)',
    example: 33,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage!: number;

  // ========================================
  // ENTITY LISTS (Quick reference)
  // ========================================
  @ApiProperty({
    description: 'List of completed entity types',
    type: [String],
    example: ['membership-category', 'membership-employment'],
  })
  @IsArray()
  completedEntities!: MembershipEntityType[];

  @ApiProperty({
    description: 'List of failed entity types',
    type: [String],
    example: [],
  })
  @IsArray()
  failedEntities!: MembershipEntityType[];

  @ApiProperty({
    description: 'List of pending entity types',
    type: [String],
    example: ['membership-practices', 'membership-preferences'],
  })
  @IsArray()
  pendingEntities!: MembershipEntityType[];

  // ========================================
  // DETAILED ENTITY STATUS (with metadata)
  // ========================================
  @ApiProperty({
    description: 'Detailed status for each entity',
    additionalProperties: true,
    example: {
      'membership-category': {
        status: 'completed',
        entityGuid: '2b265ec7-b9bf-f022-cce4-113359c217ed',
        createdAt: '2025-10-31T14:35:00.000Z',
        retryCount: 0,
      },
      'membership-employment': {
        status: 'creating',
        retryCount: 0,
      },
      'membership-practices': {
        status: 'pending',
        retryCount: 0,
      },
    },
  })
  entityDetails!: Record<MembershipEntityType, MembershipEntityCreationStatus>;

  // ========================================
  // PRICING INFORMATION
  // ========================================
  @ApiProperty({
    description: 'Pricing breakdown (if calculated)',
    type: PricingBreakdownDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingBreakdownDto)
  pricing?: PricingBreakdownDto;

  // ========================================
  // PAYMENT TRACKING
  // ========================================
  @ApiProperty({
    description: 'Payment tracking information',
    type: PaymentTrackingDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentTrackingDto)
  payment?: PaymentTrackingDto;

  // ========================================
  // TIMESTAMPS
  // ========================================
  @ApiProperty({
    description: 'Progress tracking start timestamp',
    example: '2025-10-31T14:30:00.000Z',
  })
  @IsString()
  startedAt!: string;

  @ApiProperty({
    description: 'Progress tracking last update timestamp',
    example: '2025-10-31T14:35:00.000Z',
  })
  @IsString()
  updatedAt!: string;

  @ApiProperty({
    description: 'Progress completion timestamp',
    required: false,
  })
  @IsOptional()
  @IsString()
  completedAt?: string;
}
