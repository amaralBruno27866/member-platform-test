/**
 * Account Basic DTO
 * Integrated with essential modules: errors, utils, enums, constants, validators
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (AccountGroup, AccountStatus, AccessModifier, Privilege)
 * - constants: References ACCOUNT_FIELD_LIMITS for validation consistency
 * - validators: Uses account validators for comprehensive business rule compliance
 *
 * DATAVERSE INTEGRATION:
 * - Field names align with Table Account.csv schema (osot_ prefix)
 * - Validation rules match Dataverse field constraints
 * - Enum values synchronized with Dataverse global choices
 * - Business required fields properly marked per CSV specification
 * - Account groups and statuses properly validated
 *
 * This DTO represents the comprehensive account information structure
 * aligned with Table Account.csv business requirements and
 * designed for seamless Dataverse integration via DataverseService.
 *
 * Coverage: Essential account fields, personal information, contact details,
 * account configuration, and access control settings.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  MaxLength,
  MinLength,
  Matches,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  AccountGroup,
  AccountStatus,
  AccessModifier,
  Privilege,
} from '../../../../common/enums';
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

/**
 * Basic Account DTO containing all essential account information
 * Used as base for other account DTOs
 */
export class AccountBasicDto {
  // ========================================
  // PERSONAL INFORMATION (Business Required)
  // ========================================

  @ApiProperty({
    description: 'Last name of the account holder',
    example: 'Smith',
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

  // ========================================
  // CONTACT INFORMATION (Business Required)
  // ========================================

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
      'Account password with comprehensive security validation (minimum 8 characters, uppercase, lowercase, numbers, no personal info)',
    example: 'SecurePass123',
    maxLength: ACCOUNT_FIELD_LIMITS.PASSWORD,
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

  // ========================================
  // ACCOUNT CONFIGURATION (Business Required)
  // ========================================

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
      'Account declaration acceptance (must be explicitly true to create account)',
    example: true,
  })
  @IsBoolean({
    message: 'Account declaration must be a boolean value',
  })
  @IsNotEmpty()
  osot_account_declaration: boolean;

  // ========================================
  // ACCOUNT STATUS (Optional with defaults)
  // ========================================

  @ApiProperty({
    description: 'Account status (Active, Inactive, or Pending)',
    example: AccountStatus.PENDING,
    enum: AccountStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccountStatus, {
    message: 'Account status must be Active, Inactive, or Pending',
  })
  osot_account_status?: AccountStatus;

  @ApiProperty({
    description: 'Whether the account is an active member',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_active_member?: boolean;

  // ========================================
  // ACCESS CONTROL (Optional with defaults)
  // ========================================

  @ApiProperty({
    description:
      'Access modifier for account visibility (Public, Protected, or Private)',
    example: AccessModifier.PRIVATE,
    enum: AccessModifier,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccessModifier, {
    message: 'Access modifier must be Public, Protected, or Private',
  })
  osot_access_modifiers?: AccessModifier;

  @ApiProperty({
    description: 'Privilege level for the account (Owner, Admin, or Main)',
    example: Privilege.OWNER,
    enum: Privilege,
    required: false,
  })
  @IsOptional()
  @IsEnum(Privilege, {
    message: 'Privilege must be Owner, Admin, or Main',
  })
  osot_privilege?: Privilege;
}
