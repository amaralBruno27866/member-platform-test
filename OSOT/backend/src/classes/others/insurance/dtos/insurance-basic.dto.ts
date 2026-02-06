/**
 * Insurance Basic DTO
 *
 * Shared base fields for Insurance operations.
 * Extended by Create, Update, and Response DTOs.
 *
 * Architecture Notes:
 * - Contains only business fields (no system fields)
 * - Used as base class for inheritance
 * - Field names match Dataverse logical names (snake_case)
 * - Most fields are immutable snapshots (required at creation, cannot update)
 */

import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
  MaxLength,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessModifier, Privilege } from '../../../../common/enums';
import { InsuranceStatus } from '../enum/insurance-status.enum';

/**
 * Base DTO for Insurance entity
 * Contains all business fields shared across Create/Update/Response DTOs
 */
export class InsuranceBasicDto {
  // ========================================
  // SNAPSHOT FIELDS FROM ACCOUNT/ADDRESS (14 required - IMMUTABLE)
  // ========================================

  @ApiProperty({
    description:
      'Account group classification (copied from table_account). Immutable snapshot.',
    example: 'Individual',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Account group is required',
  })
  @MaxLength(100, {
    message: 'Account group cannot exceed 100 characters',
  })
  osot_account_group: string;

  @ApiProperty({
    description:
      'Professional category (copied from membership_category). Immutable snapshot.',
    example: 'OT',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Category is required',
  })
  @MaxLength(100, {
    message: 'Category cannot exceed 100 characters',
  })
  osot_category: string;

  @ApiProperty({
    description:
      'Membership type (copied from membership_category). Immutable snapshot.',
    example: 'Standard',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Membership is required',
  })
  @MaxLength(100, {
    message: 'Membership cannot exceed 100 characters',
  })
  osot_membership: string;

  @ApiProperty({
    description:
      'Membership year (academic year) when insurance was purchased (copied from membership_settings). Immutable snapshot.',
    example: '2025',
    maxLength: 4,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Membership year is required',
  })
  @MaxLength(4, {
    message: 'Membership year must be 4 characters (YYYY format)',
  })
  osot_membership_year: string;

  @ApiProperty({
    description:
      'Certificate ID (copied from table_account.account_id). Immutable snapshot.',
    example: 'osot-acc-0000123',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Certificate is required',
  })
  @MaxLength(100, {
    message: 'Certificate cannot exceed 100 characters',
  })
  osot_certificate: string;

  @ApiProperty({
    description:
      'First name of insured person (copied from table_account). Immutable snapshot.',
    example: 'John',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({
    message: 'First name is required',
  })
  @MaxLength(100, {
    message: 'First name cannot exceed 100 characters',
  })
  osot_first_name: string;

  @ApiProperty({
    description:
      'Last name of insured person (copied from table_account). Immutable snapshot.',
    example: 'Smith',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Last name is required',
  })
  @MaxLength(100, {
    message: 'Last name cannot exceed 100 characters',
  })
  osot_last_name: string;

  @ApiPropertyOptional({
    description:
      'Business/corporation name if applicable (optional). Immutable snapshot.',
    example: 'John Smith Occupational Therapy Inc.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'Personal corporation cannot exceed 255 characters',
  })
  osot_personal_corporation?: string;

  @ApiProperty({
    description:
      'Address line 1 (copied from table_address). Immutable snapshot.',
    example: '123 Main Street',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Address line 1 is required',
  })
  @MaxLength(255, {
    message: 'Address line 1 cannot exceed 255 characters',
  })
  osot_address_1: string;

  @ApiPropertyOptional({
    description: 'Address line 2 (optional). Immutable snapshot.',
    example: 'Suite 450',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: 'Address line 2 cannot exceed 255 characters',
  })
  osot_address_2?: string;

  @ApiProperty({
    description: 'City (copied from table_address). Immutable snapshot.',
    example: 'Ottawa',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({
    message: 'City is required',
  })
  @MaxLength(255, {
    message: 'City cannot exceed 255 characters',
  })
  osot_city: string;

  @ApiProperty({
    description:
      'Province code (copied from table_address). Immutable snapshot.',
    example: 'ON',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Province is required',
  })
  @MaxLength(100, {
    message: 'Province cannot exceed 100 characters',
  })
  osot_province: string;

  @ApiProperty({
    description:
      'Postal code without formatting (copied from table_address). Immutable snapshot.',
    example: 'K1A0A6',
    maxLength: 7,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Postal code is required',
  })
  @MaxLength(7, {
    message: 'Postal code cannot exceed 7 characters',
  })
  osot_postal_code: string;

  @ApiProperty({
    description:
      'Contact phone number (copied from table_account). Immutable snapshot.',
    example: '6135551234',
    maxLength: 14,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Phone number is required',
  })
  @MaxLength(14, {
    message: 'Phone number cannot exceed 14 characters',
  })
  osot_phone_number: string;

  @ApiProperty({
    description:
      'Contact email address (copied from table_account). Immutable snapshot.',
    example: 'john.smith@example.com',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Email is required',
  })
  @MaxLength(255, {
    message: 'Email cannot exceed 255 characters',
  })
  osot_email: string;

  // ========================================
  // INSURANCE DETAILS (6 required - IMMUTABLE EXCEPT STATUS)
  // ========================================

  @ApiProperty({
    description:
      'Insurance type/product name (copied from product). Immutable snapshot.',
    example: 'Professional Liability',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Insurance type is required',
  })
  @MaxLength(255, {
    message: 'Insurance type cannot exceed 255 characters',
  })
  osot_insurance_type: string;

  @ApiProperty({
    description:
      'Insurance coverage limit in CAD (copied from product). Immutable snapshot.',
    example: 50000.0,
    minimum: 0,
    maximum: 922337203685477,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty({
    message: 'Insurance limit is required',
  })
  @Min(0, {
    message: 'Insurance limit must be at least 0',
  })
  @Max(922337203685477, {
    message: 'Insurance limit cannot exceed 922337203685477',
  })
  osot_insurance_limit: number;

  @ApiProperty({
    description:
      'Insurance premium/price in CAD (copied from product). Immutable snapshot.',
    example: 79.0,
    minimum: 0,
    maximum: 922337203685477,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty({
    message: 'Insurance price is required',
  })
  @Min(0, {
    message: 'Insurance price must be at least 0',
  })
  @Max(922337203685477, {
    message: 'Insurance price cannot exceed 922337203685477',
  })
  osot_insurance_price: number;

  @ApiProperty({
    description:
      'Total amount including tax in CAD (copied from order_product). Immutable snapshot.',
    example: 89.27,
    minimum: 0,
    maximum: 922337203685477,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsNotEmpty({
    message: 'Total is required',
  })
  @Min(0, {
    message: 'Total must be at least 0',
  })
  @Max(922337203685477, {
    message: 'Total cannot exceed 922337203685477',
  })
  osot_total: number;

  @ApiProperty({
    description:
      'Insurance status. DRAFT (1), PENDING (2), ACTIVE (3), EXPIRED (4), CANCELLED (5). Mutable for lifecycle management.',
    enum: InsuranceStatus,
    example: InsuranceStatus.PENDING,
  })
  @IsEnum(InsuranceStatus, {
    message: 'Insurance status must be a valid InsuranceStatus enum value',
  })
  @IsNotEmpty({
    message: 'Insurance status is required',
  })
  osot_insurance_status: InsuranceStatus;

  @ApiProperty({
    description:
      'Insurance declaration. User declares all information is true and complete. Must be true to create insurance.',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty({
    message: 'Insurance declaration is required',
  })
  osot_insurance_declaration: boolean;

  // ========================================
  // DATE FIELDS (2 required, 1 optional - IMMUTABLE)
  // ========================================

  @ApiProperty({
    description:
      'Effective date when coverage starts (ISO 8601 date). Immutable snapshot.',
    example: '2026-01-23',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty({
    message: 'Effective date is required',
  })
  osot_effective_date: string;

  @ApiProperty({
    description:
      'Expiry date when coverage ends (ISO 8601 date). Immutable snapshot.',
    example: '2026-12-31',
    format: 'date',
  })
  @IsDateString()
  @IsNotEmpty({
    message: 'Expiry date is required',
  })
  osot_expires_date: string;

  @ApiPropertyOptional({
    description:
      'Endorsement effective date when amendment takes effect (ISO 8601 date). Optional. Immutable after set.',
    example: '2026-06-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString()
  osot_endorsement_effective_date?: string;

  // ========================================
  // QUESTIONS & ENDORSEMENTS (6 optional - IMMUTABLE)
  // ========================================

  @ApiPropertyOptional({
    description:
      'Question 1: Allegations of professional negligence. High-risk question.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_insurance_question_1?: boolean;

  @ApiPropertyOptional({
    description:
      'Explanation for question 1 (required if question_1 = true). Max 4000 characters.',
    example: 'No allegations have been made.',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000, {
    message: 'Question explanation cannot exceed 4000 characters',
  })
  osot_insurance_question_1_explain?: string;

  @ApiPropertyOptional({
    description:
      'Question 2: Insurer cancellation/denial history. High-risk question.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_insurance_question_2?: boolean;

  @ApiPropertyOptional({
    description:
      'Explanation for question 2 (required if question_2 = true). Max 4000 characters.',
    example: 'No prior cancellations.',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000, {
    message: 'Question explanation cannot exceed 4000 characters',
  })
  osot_insurance_question_2_explain?: string;

  @ApiPropertyOptional({
    description:
      'Question 3: Awareness of potential claims. High-risk question.',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_insurance_question_3?: boolean;

  @ApiPropertyOptional({
    description:
      'Explanation for question 3 (required if question_3 = true). Max 4000 characters.',
    example: 'Not aware of any potential claims.',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000, {
    message: 'Question explanation cannot exceed 4000 characters',
  })
  osot_insurance_question_3_explain?: string;

  @ApiPropertyOptional({
    description:
      'Endorsement description (admin-only policy amendment). Max 4000 characters. Immutable after effective date.',
    example: 'Coverage extended to include additional premises.',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000, {
    message: 'Endorsement description cannot exceed 4000 characters',
  })
  osot_endorsement_description?: string;

  // ========================================
  // ACCESS CONTROL (2 optional)
  // ========================================

  @ApiPropertyOptional({
    description: 'Privilege level (visibility). Defaults to Owner.',
    enum: Privilege,
    example: Privilege.OWNER,
  })
  @IsOptional()
  @IsEnum(Privilege)
  osot_privilege?: Privilege;

  @ApiPropertyOptional({
    description: 'Access modifier (access rules). Defaults to Private.',
    enum: AccessModifier,
    example: AccessModifier.PRIVATE,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  osot_access_modifiers?: AccessModifier;
}
