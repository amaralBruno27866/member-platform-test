/**
 * Complete Membership Registration DTO
 *
 * Main input DTO that aggregates all entity DTOs for complete membership registration.
 * This DTO combines data from all required entities: Category, Employment, Practices,
 * and optional entities: Preferences, Settings, Insurance/Product selection.
 *
 * DESIGN PRINCIPLES:
 * - Reuses existing entity DTOs for consistency
 * - Maintains all validation rules from individual entities
 * - Supports insurance/product selection
 * - Includes payment information
 * - Optional preferences and settings
 *
 * WORKFLOW INTEGRATION:
 * - Used as input for membership registration staging
 * - Stored in Redis during membership process
 * - Decomposed into individual entity calls during creation
 * - Pricing calculated based on category and insurance selection
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  ValidateNested,
  IsUUID,
  IsEnum,
  IsNumber,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

// Import existing DTOs from membership entity modules
import { MembershipCategoryCreateDto } from '../../../membership/membership-category/dtos/membership-category-create.dto';
import { CreateMembershipEmploymentDto } from '../../../membership/membership-employment/dtos/membership-employment-create.dto';
import { CreateMembershipPracticesDto } from '../../../membership/membership-practices/dtos/membership-practices-create.dto';
import { CreateMembershipPreferenceDto } from '../../../membership/membership-preferences/dtos/membership-preference-create.dto';
import { CreateMembershipSettingsDto } from '../../../membership/membership-settings/dtos/membership-settings-create.dto';

// Import types from constants
import { PaymentMethodType } from '../constants/membership-orchestrator.constants';

export class CompleteMembershipRegistrationDto {
  // ========================================
  // ACCOUNT REFERENCE (Required - from Account Orchestrator)
  // ========================================
  @ApiProperty({
    description:
      'Account GUID from previous account registration (obtained from account orchestrator)',
    example: '1a154db6-a8ae-f011-bbd3-002248b106dc',
  })
  @IsNotEmpty({ message: 'Account ID is required' })
  @IsUUID('4', { message: 'Account ID must be a valid UUID' })
  accountId: string;

  @ApiProperty({
    description:
      'Organization GUID (extracted from JWT - required for multi-tenant isolation)',
    example: 'f7e9c8b5-a1d2-4f3e-b6c7-8d9e0a1b2c3d',
  })
  @IsNotEmpty({ message: 'Organization ID is required' })
  @IsUUID('4', { message: 'Organization ID must be a valid UUID' })
  organizationId: string;

  @ApiProperty({
    description: 'Membership year for this registration (e.g., "2025")',
    example: '2025',
    maxLength: 4,
  })
  @IsNotEmpty({ message: 'Membership year is required' })
  @IsString({ message: 'Membership year must be a string' })
  membershipYear: string;

  // ========================================
  // MEMBERSHIP CATEGORY DATA (Required - Primary entity)
  // ========================================
  @ApiProperty({
    description: 'Membership category data',
    type: MembershipCategoryCreateDto,
    example: {
      'osot_Table_Account@odata.bind':
        '/osot_table_accounts(1a154db6-a8ae-f011-bbd3-002248b106dc)',
      osot_membership_year: '2025',
      osot_eligibility: 1,
      osot_membership_category: 1,
      osot_membership_declaration: true,
    },
  })
  @ValidateNested()
  @Type(() => MembershipCategoryCreateDto)
  @IsNotEmpty({ message: 'Membership category data is required' })
  category: MembershipCategoryCreateDto;

  // ========================================
  // MEMBERSHIP EMPLOYMENT DATA (Required)
  // ========================================
  @ApiProperty({
    description: 'Membership employment data',
    type: CreateMembershipEmploymentDto,
    example: {
      osot_employment_status: 1,
      osot_work_hours: [1, 2],
      osot_role_descriptor: 1,
      osot_practice_years: 3,
      osot_position_funding: [1],
      osot_employment_benefits: [1, 2],
      osot_earnings_employment: 5,
      osot_earnings_self_direct: 0,
      osot_earnings_self_indirect: 0,
      osot_union_name: 'OPSEU',
    },
  })
  @ValidateNested()
  @Type(() => CreateMembershipEmploymentDto)
  @IsNotEmpty({ message: 'Membership employment data is required' })
  employment: CreateMembershipEmploymentDto;

  // ========================================
  // MEMBERSHIP PRACTICES DATA (Required)
  // ========================================
  @ApiProperty({
    description: 'Membership practices data',
    type: CreateMembershipPracticesDto,
    example: {
      osot_preceptor_declaration: false,
      osot_clients_age: [1, 2],
      osot_practice_area: [1, 3],
      osot_practice_settings: [2, 4],
      osot_practice_services: [1, 5],
    },
  })
  @ValidateNested()
  @Type(() => CreateMembershipPracticesDto)
  @IsNotEmpty({ message: 'Membership practices data is required' })
  practices: CreateMembershipPracticesDto;

  // ========================================
  // MEMBERSHIP PREFERENCES DATA (Optional)
  // ========================================
  @ApiProperty({
    description: 'Membership preferences data (optional)',
    type: CreateMembershipPreferenceDto,
    required: false,
    example: {
      osot_auto_renewal: false,
      osot_third_parties: [1, 2],
      osot_practice_promotion: [1],
      osot_members_search_tools: [1, 2],
      osot_shadowing: false,
      osot_psychotherapy_supervision: [1],
    },
  })
  @ValidateNested()
  @Type(() => CreateMembershipPreferenceDto)
  @IsOptional()
  preferences?: CreateMembershipPreferenceDto;

  // ========================================
  // MEMBERSHIP SETTINGS DATA (Optional - Admin controlled)
  // ========================================
  @ApiProperty({
    description:
      'Membership settings data (optional - typically admin controlled)',
    type: CreateMembershipSettingsDto,
    required: false,
    example: {
      osot_membership_year: '2025',
      osot_membership_year_status: 1,
      osot_membership_category: 1,
      osot_expires_date: '2025-12-31',
      osot_membership_fee: 500.0,
      osot_membership_fee_start: '2025-01-01',
      osot_membership_fee_end: '2025-12-31',
    },
  })
  @ValidateNested()
  @Type(() => CreateMembershipSettingsDto)
  @IsOptional()
  settings?: CreateMembershipSettingsDto;

  // ========================================
  // INSURANCE SELECTION (Optional - Category dependent)
  // ========================================
  @ApiProperty({
    description:
      'Insurance/Product selection (required for certain membership categories)',
    required: false,
    example: {
      insuranceType: 'professional_liability',
      productId: 'prod_123456',
      coverageAmount: 1000000,
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceSelectionDto)
  insuranceSelection?: InsuranceSelectionDto;

  // ========================================
  // DONATION SELECTION (Optional - Single donation at a time)
  // ========================================
  @ApiProperty({
    description:
      'Donation selection (optional - single donation per session, can do more later via interface)',
    required: false,
    example: {
      productGuid: 'd1234567-89ab-cdef-0123-456789abcdef',
      amount: 25,
      isCustomAmount: false,
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DonationSelectionDto)
  donationSelection?: DonationSelectionDto;

  // ========================================
  // PAYMENT INFORMATION (Optional - Required for paid categories)
  // ========================================
  @ApiProperty({
    description:
      'Payment information (required for categories that require payment)',
    required: false,
    example: {
      method: 'credit_card',
      amount: 650.0,
      currency: 'CAD',
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentInformationDto)
  paymentInfo?: PaymentInformationDto;
}

/**
 * Insurance Selection DTO (Multiple selections allowed)
 * Used within CompleteMembershipRegistrationDto
 *
 * Business Rules:
 * - User can select multiple insurance types (Professional + General + Property)
 * - Cannot duplicate same type (no 2x Professional)
 * - Professional requires high-risk questions + declaration
 * - Other types only require declaration
 * - Uses integer enum values for insurance type (performance)
 */
export class InsuranceSelectionItemDto {
  @ApiProperty({
    description:
      'Insurance type (integer enum: 1=Professional, 2=General, 3=Corporative, 4=Property)',
    enum: [1, 2, 3, 4],
    example: 1,
  })
  @IsNotEmpty({ message: 'Insurance type is required' })
  @IsNumber()
  insuranceType: number; // InsuranceType enum value

  @ApiProperty({
    description: 'Product GUID from product catalog (insurance product)',
    example: 'abc-123-def-456-ghi',
  })
  @IsNotEmpty({ message: 'Product GUID is required' })
  @IsUUID('4', { message: 'Product GUID must be a valid UUID' })
  productGuid: string;

  @ApiProperty({
    description: 'Declaration accepted (must be true to create insurance)',
    example: true,
  })
  @IsNotEmpty({ message: 'Declaration is required' })
  declaration: boolean;

  @ApiProperty({
    description: 'High-risk questions (ONLY for Professional type)',
    required: false,
    example: {
      question1: {
        answered: true,
        explanation: 'Past negligence allegation explanation...',
      },
      question2: { answered: false },
      question3: { answered: false },
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => InsuranceQuestionsDto)
  questions?: InsuranceQuestionsDto;
}

/**
 * Insurance Questions DTO
 * High-risk assessment questions for Professional insurance type ONLY
 */
export class InsuranceQuestionsDto {
  @ApiProperty({
    description: 'Question 1: Allegations of negligence or malpractice?',
    required: false,
    example: { answered: true, explanation: 'Explanation...' },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionAnswerDto)
  question1?: QuestionAnswerDto;

  @ApiProperty({
    description: 'Question 2: Insurer denial/cancellation history?',
    required: false,
    example: { answered: false },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionAnswerDto)
  question2?: QuestionAnswerDto;

  @ApiProperty({
    description: 'Question 3: Potential claims awareness?',
    required: false,
    example: { answered: false },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QuestionAnswerDto)
  question3?: QuestionAnswerDto;
}

/**
 * Question Answer DTO
 */
export class QuestionAnswerDto {
  @ApiProperty({
    description: 'Answer to question (true=Yes, false=No)',
    example: true,
  })
  @IsNotEmpty({ message: 'Question answer is required' })
  answered: boolean;

  @ApiProperty({
    description: 'Explanation (required if answered=true, 1-4000 chars)',
    required: false,
    example: 'Detailed explanation of the circumstances...',
  })
  @IsOptional()
  @IsString()
  explanation?: string;
}

/**
 * Insurance Selection DTO (wrapper for multiple selections)
 */
export class InsuranceSelectionDto {
  @ApiProperty({
    description:
      'Array of insurance selections (multiple types allowed, no duplicates)',
    type: [InsuranceSelectionItemDto],
    example: [
      {
        insuranceType: 1, // Professional
        productGuid: 'abc-123',
        declaration: true,
        questions: {
          question1: { answered: true, explanation: 'Past allegation...' },
          question2: { answered: false },
          question3: { answered: false },
        },
      },
      {
        insuranceType: 2, // General
        productGuid: 'def-456',
        declaration: true,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InsuranceSelectionItemDto)
  selections: InsuranceSelectionItemDto[];
}

/**
 * Donation Selection DTO
 * Single donation per session (user can donate again via interface)
 *
 * Business Rules:
 * - Either select a fixed product (productGuid) OR provide custom amount
 * - If isCustomAmount=true: must use DONATION_FREE product, amount > 0
 * - If isCustomAmount=false: use amount from product's osot_general_price
 */
export class DonationSelectionDto {
  @ApiProperty({
    description:
      'Product GUID from donation products (fixed) or DONATION_FREE (custom)',
    example: 'd1234567-89ab-cdef-0123-456789abcdef',
  })
  @IsNotEmpty({ message: 'Donation product GUID is required' })
  @IsUUID('4', { message: 'Donation product GUID must be a valid UUID' })
  productGuid: string;

  @ApiProperty({
    description:
      'Donation amount in CAD. For fixed products: ignored (use product price). For custom: user-specified amount.',
    example: 25,
  })
  @IsNotEmpty({ message: 'Donation amount is required' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'Donation amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    description:
      'Whether amount is custom (true) or fixed from product (false)',
    example: false,
  })
  @IsNotEmpty()
  @IsBoolean()
  isCustomAmount: boolean;
}

/**
 * Payment Information DTO
 * Used within CompleteMembershipRegistrationDto
 */
export class PaymentInformationDto {
  @ApiProperty({
    description: 'Payment method',
    enum: ['credit_card', 'debit_card', 'bank_transfer'],
    example: 'credit_card',
  })
  @IsNotEmpty({ message: 'Payment method is required' })
  @IsEnum(['credit_card', 'debit_card', 'bank_transfer'], {
    message: 'Invalid payment method',
  })
  method: PaymentMethodType;

  @ApiProperty({
    description: 'Payment amount',
    example: 650.0,
  })
  @IsNotEmpty({ message: 'Payment amount is required' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Currency code (ISO 4217)',
    example: 'CAD',
    default: 'CAD',
  })
  @IsNotEmpty({ message: 'Currency is required' })
  @IsString()
  currency: string;

  @ApiProperty({
    description: 'Payment intent ID (from payment gateway)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiProperty({
    description: 'Transaction ID (after payment completion)',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({
    description: 'Billing address',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BillingAddressDto)
  billingAddress?: BillingAddressDto;
}

/**
 * Billing Address DTO
 * Used within PaymentInformationDto
 */
export class BillingAddressDto {
  @ApiProperty({ description: 'Street address', example: '123 Main St' })
  @IsNotEmpty()
  @IsString()
  street: string;

  @ApiProperty({ description: 'City', example: 'Toronto' })
  @IsNotEmpty()
  @IsString()
  city: string;

  @ApiProperty({ description: 'Province/State', example: 'ON' })
  @IsNotEmpty()
  @IsString()
  province: string;

  @ApiProperty({ description: 'Postal/ZIP code', example: 'M5H 2N2' })
  @IsNotEmpty()
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country', example: 'Canada' })
  @IsNotEmpty()
  @IsString()
  country: string;
}
