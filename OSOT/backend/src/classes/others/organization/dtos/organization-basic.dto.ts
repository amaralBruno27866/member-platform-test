/**
 * Organization Basic DTO
 * Base DTO with common fields for Organization entity operations
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (AccountStatus, Privilege, AccessModifier)
 * - constants: References ORGANIZATION_FIELD_LENGTH for validation consistency
 * - validators: Uses organization validators for comprehensive business rule compliance
 *
 * DATAVERSE INTEGRATION:
 * - Field names align with Table Organization.csv schema (osot_ prefix)
 * - Validation rules match Dataverse field constraints
 * - Enum values synchronized with Dataverse global choices (Choices_Status, etc.)
 * - Business required fields properly marked per CSV specification
 *
 * This DTO represents the base organization information structure
 * aligned with Table Organization.csv business requirements and
 * designed for seamless Dataverse integration via DataverseService.
 *
 * Coverage: Organization identity, branding, contact info, and access control.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUrl,
  IsEnum,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

// Essential modules integration
import {
  AccountStatus,
  Privilege,
  AccessModifier,
} from '../../../../common/enums';

// Constants integration
import {
  ORGANIZATION_FIELD_LENGTH,
  CANADIAN_PHONE_PATTERN,
} from '../constants/organization-validation.constant';

export class OrganizationBasicDto {
  // ========================================
  // BASIC INFORMATION (5 fields)
  // ========================================

  @ApiProperty({
    example: 'Ontario Society of Occupational Therapists',
    description: 'Organization name (business required)',
    maxLength: ORGANIZATION_FIELD_LENGTH.ORGANIZATION_NAME_MAX,
    minLength: ORGANIZATION_FIELD_LENGTH.ORGANIZATION_NAME_MIN,
  })
  @IsNotEmpty({ message: 'Organization name is required' })
  @IsString({ message: 'Organization name must be a string' })
  @MinLength(ORGANIZATION_FIELD_LENGTH.ORGANIZATION_NAME_MIN, {
    message: `Organization name must be at least ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_NAME_MIN} characters`,
  })
  @MaxLength(ORGANIZATION_FIELD_LENGTH.ORGANIZATION_NAME_MAX, {
    message: `Organization name must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_NAME_MAX} characters`,
  })
  osot_organization_name: string;

  @ApiProperty({
    example: 'Ontario Society of Occupational Therapists Inc.',
    description: 'Legal name / Razão social (business required)',
    maxLength: ORGANIZATION_FIELD_LENGTH.LEGAL_NAME_MAX,
    minLength: ORGANIZATION_FIELD_LENGTH.LEGAL_NAME_MIN,
  })
  @IsNotEmpty({ message: 'Legal name is required' })
  @IsString({ message: 'Legal name must be a string' })
  @MinLength(ORGANIZATION_FIELD_LENGTH.LEGAL_NAME_MIN, {
    message: `Legal name must be at least ${ORGANIZATION_FIELD_LENGTH.LEGAL_NAME_MIN} characters`,
  })
  @MaxLength(ORGANIZATION_FIELD_LENGTH.LEGAL_NAME_MAX, {
    message: `Legal name must not exceed ${ORGANIZATION_FIELD_LENGTH.LEGAL_NAME_MAX} characters`,
  })
  osot_legal_name: string;

  @ApiProperty({
    example: 'OSOT',
    description: 'Acronym / Sigla (optional)',
    maxLength: ORGANIZATION_FIELD_LENGTH.ACRONYM_MAX,
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Acronym must be a string' })
  @MinLength(ORGANIZATION_FIELD_LENGTH.ACRONYM_MIN, {
    message: `Acronym must be at least ${ORGANIZATION_FIELD_LENGTH.ACRONYM_MIN} characters`,
  })
  @MaxLength(ORGANIZATION_FIELD_LENGTH.ACRONYM_MAX, {
    message: `Acronym must not exceed ${ORGANIZATION_FIELD_LENGTH.ACRONYM_MAX} characters`,
  })
  osot_acronym?: string;

  @ApiProperty({
    example: AccountStatus.ACTIVE,
    description:
      'Organization status from Choices_Status (Active=1, Inactive=2, Pending=3)',
    enum: AccountStatus,
    required: false,
    default: AccountStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(AccountStatus, { message: 'Must be a valid account status' })
  osot_organization_status?: AccountStatus;

  // ========================================
  // BRANDING (3 fields)
  // ========================================

  @ApiProperty({
    example: 'https://cdn.osot.on.ca/logo.png',
    description: 'Organization logo URL (business required)',
    maxLength: ORGANIZATION_FIELD_LENGTH.ORGANIZATION_LOGO_MAX,
  })
  @IsNotEmpty({ message: 'Organization logo is required' })
  @IsUrl({}, { message: 'Organization logo must be a valid URL' })
  @MaxLength(ORGANIZATION_FIELD_LENGTH.ORGANIZATION_LOGO_MAX, {
    message: `Organization logo URL must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_LOGO_MAX} characters`,
  })
  osot_organization_logo: string;

  @ApiProperty({
    example: 'https://www.osot.on.ca',
    description: 'Organization website URL (business required)',
    maxLength: ORGANIZATION_FIELD_LENGTH.ORGANIZATION_WEBSITE_MAX,
  })
  @IsNotEmpty({ message: 'Organization website is required' })
  @IsUrl({}, { message: 'Organization website must be a valid URL' })
  @MaxLength(ORGANIZATION_FIELD_LENGTH.ORGANIZATION_WEBSITE_MAX, {
    message: `Organization website URL must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_WEBSITE_MAX} characters`,
  })
  osot_organization_website: string;

  @ApiProperty({
    example: 'John Doe, Executive Director',
    description: 'Legal representative (business required)',
    maxLength: ORGANIZATION_FIELD_LENGTH.REPRESENTATIVE_MAX,
    minLength: ORGANIZATION_FIELD_LENGTH.REPRESENTATIVE_MIN,
  })
  @IsNotEmpty({ message: 'Representative is required' })
  @IsString({ message: 'Representative must be a string' })
  @MinLength(ORGANIZATION_FIELD_LENGTH.REPRESENTATIVE_MIN, {
    message: `Representative must be at least ${ORGANIZATION_FIELD_LENGTH.REPRESENTATIVE_MIN} characters`,
  })
  @MaxLength(ORGANIZATION_FIELD_LENGTH.REPRESENTATIVE_MAX, {
    message: `Representative must not exceed ${ORGANIZATION_FIELD_LENGTH.REPRESENTATIVE_MAX} characters`,
  })
  osot_representative: string;

  // ========================================
  // CONTACT (2 fields)
  // ========================================

  @ApiProperty({
    example: 'info@osot.on.ca',
    description: 'Organization email (business required)',
    maxLength: ORGANIZATION_FIELD_LENGTH.ORGANIZATION_EMAIL_MAX,
  })
  @IsNotEmpty({ message: 'Organization email is required' })
  @IsEmail({}, { message: 'Organization email must be a valid email address' })
  @MaxLength(ORGANIZATION_FIELD_LENGTH.ORGANIZATION_EMAIL_MAX, {
    message: `Organization email must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_EMAIL_MAX} characters`,
  })
  osot_organization_email: string;

  @ApiProperty({
    example: '+1-416-555-0100',
    description: 'Organization phone - Canadian format (business required)',
    maxLength: ORGANIZATION_FIELD_LENGTH.ORGANIZATION_PHONE_MAX,
  })
  @IsNotEmpty({ message: 'Organization phone is required' })
  @IsString({ message: 'Organization phone must be a string' })
  @Matches(CANADIAN_PHONE_PATTERN, {
    message: 'Organization phone must be a valid Canadian phone number',
  })
  @MaxLength(ORGANIZATION_FIELD_LENGTH.ORGANIZATION_PHONE_MAX, {
    message: `Organization phone must not exceed ${ORGANIZATION_FIELD_LENGTH.ORGANIZATION_PHONE_MAX} characters`,
  })
  osot_organization_phone: string;

  // ========================================
  // ACCESS CONTROL (2 fields)
  // ========================================

  @ApiProperty({
    example: Privilege.MAIN,
    description: 'Privilege level from Choices_Privilege (optional)',
    enum: Privilege,
    required: false,
    default: Privilege.MAIN,
  })
  @IsOptional()
  @IsEnum(Privilege, { message: 'Must be a valid privilege level' })
  osot_privilege?: Privilege;

  @ApiProperty({
    example: AccessModifier.PRIVATE,
    description: 'Access modifier from Choices_Access_Modifiers (optional)',
    enum: AccessModifier,
    required: false,
    default: AccessModifier.PRIVATE,
  })
  @IsOptional()
  @IsEnum(AccessModifier, { message: 'Must be a valid access modifier' })
  osot_access_modifier?: AccessModifier;
}
