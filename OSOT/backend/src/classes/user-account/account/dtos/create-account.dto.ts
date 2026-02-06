/**
 * Create Account DTO
 *
 * Data Transfer Object for creating new Account entities with comprehensive validation.
 * Includes Canadian format standards for phone numbers and dates.
 *
 * @version 1.0.0
 * @since 2024
 * @author OSOT
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsOptional,
  MaxLength,
  MinLength,
  Matches,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  ACCOUNT_FIELD_LIMITS,
  ACCOUNT_VALIDATION_PATTERNS,
} from '../constants/account.constants';
import {
  AccountFirstNameValidator,
  AccountLastNameValidator,
  AccountEmailValidator,
  AccountMobilePhoneValidator,
  AccountDateOfBirthValidator,
} from '../validators/account.validators';
import { AccountPasswordStrengthValidator } from '../validators/password.validator';
import { AccountGroup } from '../../../../common/enums/account-group.enum';

/**
 * DTO for creating new Account entities
 *
 * Features:
 * - Canadian phone format: (XXX) XXX-XXXX
 * - Canadian date format: YYYY-MM-DD
 * - Comprehensive validation with meaningful error messages
 * - Business rule enforcement
 * - OpenAPI documentation
 */
export class CreateAccountDto {
  @ApiProperty({
    description: 'Last name of the account holder',
    example: 'Doe',
    maxLength: ACCOUNT_FIELD_LIMITS.LAST_NAME,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FIELD_LIMITS.LAST_NAME)
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Last name must contain only letters, spaces, hyphens, and apostrophes',
  })
  @Validate(AccountLastNameValidator)
  osot_last_name: string;

  @ApiProperty({
    description: 'First name of the account holder',
    example: 'John',
    maxLength: ACCOUNT_FIELD_LIMITS.FIRST_NAME,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FIELD_LIMITS.FIRST_NAME)
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'First name must contain only letters, spaces, hyphens, and apostrophes',
  })
  @Validate(AccountFirstNameValidator)
  osot_first_name: string;

  @ApiProperty({
    description:
      'Date of birth in Canadian format (YYYY-MM-DD). Example: 1990-12-25',
    example: '1990-12-25',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    // Normalize date format: convert "1990-5-2" to "1990-05-02"
    if (typeof value === 'string' && /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
      const parts = value.split('-');
      if (parts.length === 3) {
        const year = parts[0].padStart(4, '0');
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }
    return value as string;
  })
  @Matches(ACCOUNT_VALIDATION_PATTERNS.DATE_OF_BIRTH, {
    message: 'Date of birth must be in YYYY-MM-DD format',
  })
  @Validate(AccountDateOfBirthValidator)
  osot_date_of_birth: string;

  @ApiProperty({
    description: 'Mobile phone number in Canadian format: (XXX) XXX-XXXX',
    example: '(555) 123-4567',
    maxLength: ACCOUNT_FIELD_LIMITS.MOBILE_PHONE,
    pattern: '^\\(\\d{3}\\) \\d{3}-\\d{4}$',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FIELD_LIMITS.MOBILE_PHONE)
  @Matches(ACCOUNT_VALIDATION_PATTERNS.PHONE, {
    message: 'Mobile phone must be in Canadian format: (XXX) XXX-XXXX',
  })
  @Validate(AccountMobilePhoneValidator)
  osot_mobile_phone: string;

  @ApiProperty({
    description:
      'Email address for account access. Must be unique in the system.',
    example: 'user@example.com',
    maxLength: ACCOUNT_FIELD_LIMITS.EMAIL,
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FIELD_LIMITS.EMAIL)
  @Validate(AccountEmailValidator)
  osot_email: string;

  @ApiProperty({
    description:
      'Secure password for account access. Must contain uppercase, lowercase, and numbers.',
    example: 'P@ssw0rd!',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(ACCOUNT_FIELD_LIMITS.PASSWORD)
  @Matches(ACCOUNT_VALIDATION_PATTERNS.PASSWORD, {
    message:
      'Password must contain at least 8 characters including uppercase, lowercase, and number',
  })
  @Validate(AccountPasswordStrengthValidator)
  osot_password: string;

  @ApiProperty({
    description:
      'Account group classification (Occupational Therapist, Occupational Therapist Assistant, Vendor/Advertiser, or Other)',
    example: AccountGroup.OCCUPATIONAL_THERAPIST,
    enum: AccountGroup,
  })
  @IsEnum(AccountGroup, {
    message:
      'Account group must be a valid option (Occupational Therapist, Occupational Therapist Assistant, Vendor/Advertiser, or Other)',
  })
  @IsNotEmpty()
  osot_account_group: AccountGroup;

  @ApiProperty({
    description:
      'Account declaration indicating acceptance of terms and conditions',
    example: true,
  })
  @IsBoolean({
    message: 'Account declaration must be a boolean value',
  })
  @IsNotEmpty()
  osot_account_declaration: boolean;

  @ApiProperty({
    description:
      'Organization slug for multi-tenant account creation. Determines which organization the account belongs to. Extracted from subdomain or provided explicitly.',
    example: 'osot',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationSlug?: string;

  // NOTE: System fields are NOT exposed in create DTO for security reasons:
  // - osot_account_status: Set by business rules based on validation workflow
  // - osot_active_member: Set by business rules based on membership validation
  // - osot_access_modifiers: Set by business rules based on account type
  // - osot_privilege: Set by business rules based on user role and permissions
}
