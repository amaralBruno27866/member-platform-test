/**
 * Update Account DTO
 *
 * Data Transfer Object for updating existing Account entities with comprehensive validation.
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
 * DTO for updating existing Account entities
 *
 * Features:
 * - All fields are optional for partial updates
 * - Canadian phone format: (XXX) XXX-XXXX
 * - Canadian date format: YYYY-MM-DD
 * - Comprehensive validation with meaningful error messages
 * - Business rule enforcement
 * - OpenAPI documentation
 */
export class UpdateAccountDto {
  @ApiProperty({
    description: 'Last name of the account holder',
    example: 'Smith',
    maxLength: ACCOUNT_FIELD_LIMITS.LAST_NAME,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FIELD_LIMITS.LAST_NAME)
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'Last name must contain only letters, spaces, hyphens, and apostrophes',
  })
  @Validate(AccountLastNameValidator)
  osot_last_name?: string;

  @ApiProperty({
    description: 'First name of the account holder',
    example: 'John',
    maxLength: ACCOUNT_FIELD_LIMITS.FIRST_NAME,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FIELD_LIMITS.FIRST_NAME)
  @Matches(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
    message:
      'First name must contain only letters, spaces, hyphens, and apostrophes',
  })
  @Validate(AccountFirstNameValidator)
  osot_first_name?: string;

  @ApiProperty({
    description:
      'Date of birth in Canadian format (YYYY-MM-DD). Example: 1990-12-25',
    example: '1990-12-25',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      // Normalize date format: convert "1990-5-2" to "1990-05-02"
      const dateRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
      const match = value.match(dateRegex);
      if (match) {
        const [, year, month, day] = match;
        const normalizedDate = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        console.log(`[DATE_TRANSFORM] "${value}" → "${normalizedDate}"`);
        return normalizedDate;
      }
    }
    return value as string;
  })
  @Matches(ACCOUNT_VALIDATION_PATTERNS.DATE_OF_BIRTH, {
    message: 'Date of birth must be in YYYY-MM-DD format',
  })
  @Validate(AccountDateOfBirthValidator)
  osot_date_of_birth?: string;

  @ApiProperty({
    description: 'Mobile phone number in Canadian format: (XXX) XXX-XXXX',
    example: '(555) 123-4567',
    maxLength: ACCOUNT_FIELD_LIMITS.MOBILE_PHONE,
    pattern: '^\\(\\d{3}\\) \\d{3}-\\d{4}$',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FIELD_LIMITS.MOBILE_PHONE)
  @Matches(ACCOUNT_VALIDATION_PATTERNS.PHONE, {
    message: 'Mobile phone must be in Canadian format: (XXX) XXX-XXXX',
  })
  @Validate(AccountMobilePhoneValidator)
  osot_mobile_phone?: string;

  @ApiProperty({
    description:
      'Email address for account access. Must be unique in the system.',
    example: 'john.smith@example.com',
    maxLength: ACCOUNT_FIELD_LIMITS.EMAIL,
    format: 'email',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(ACCOUNT_FIELD_LIMITS.EMAIL)
  @Validate(AccountEmailValidator)
  osot_email?: string;

  @ApiProperty({
    description:
      'Secure password for account access. Must contain uppercase, lowercase, and numbers.',
    example: 'SecurePassword123',
    minLength: 8,
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(ACCOUNT_FIELD_LIMITS.PASSWORD)
  @Matches(ACCOUNT_VALIDATION_PATTERNS.PASSWORD, {
    message:
      'Password must contain at least 8 characters including uppercase, lowercase, and number',
  })
  @Validate(AccountPasswordStrengthValidator)
  osot_password?: string;

  @ApiProperty({
    description:
      'Account group classification (Occupational Therapist, Occupational Therapist Assistant, Vendor/Advertiser, or Other)',
    example: AccountGroup.OCCUPATIONAL_THERAPIST,
    enum: AccountGroup,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccountGroup, {
    message:
      'Account group must be a valid option (Occupational Therapist, Occupational Therapist Assistant, Vendor/Advertiser, or Other)',
  })
  @IsNotEmpty()
  osot_account_group?: AccountGroup;

  @ApiProperty({
    description:
      'Account declaration indicating acceptance of terms and conditions',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({
    message: 'Account declaration must be a boolean value',
  })
  @IsNotEmpty()
  osot_account_declaration?: boolean;

  // NOTE: System fields are NOT exposed in update DTO for security reasons:
  // - osot_account_status: Modified through dedicated business logic workflows only
  // - osot_active_member: Updated by membership validation processes only
  // - osot_access_modifiers: Updated by admin/security workflows only
  // - osot_privilege: Updated by admin role management workflows only
}
