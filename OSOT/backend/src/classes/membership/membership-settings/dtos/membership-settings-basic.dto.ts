/**
 * Membership Settings Basic DTO
 * Integrated with essential modules: errors, utils, enums, constants, validators
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (MembershipYear, Category, AccountStatus, Privilege, AccessModifier)
 * - constants: References MEMBERSHIP_SETTINGS fields and limits for validation consistency
 * - validators: Uses membership settings validators for comprehensive business rule compliance
 *
 * DATAVERSE INTEGRATION:
 * - Field names align with Table Membership Setting.csv schema (osot_ prefix)
 * - Validation rules match Dataverse field constraints
 * - Enum values synchronized with Dataverse global choices
 * - Business required fields properly marked per CSV specification
 * - Choice fields properly validated against their respective enums
 *
 * This DTO represents the comprehensive membership settings information structure
 * aligned with Table Membership Setting.csv business requirements and
 * designed for seamless Dataverse integration via DataverseService.
 *
 * Coverage: Membership year configuration, membership group management (Individual/Business),
 * year period settings (start/end dates), and access control settings.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  Validate,
  IsUUID,
  Allow,
} from 'class-validator';

// Essential modules integration
import {
  AccountStatus,
  Privilege,
  AccessModifier,
} from '../../../../common/enums';
import { MembershipGroup } from '../enums/membership-group.enum';

// Membership settings validators integration
import {
  SettingsIdValidator,
  MembershipYearValidator,
  MembershipYearStatusValidator,
  PrivilegeValidator,
  AccessModifiersValidator,
} from '../validators/membership-settings.validators';

export class MembershipSettingsBasicDto {
  // ========================================
  // MULTI-TENANT RELATIONSHIP FIELDS (required)
  // ========================================

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    description:
      'Organization GUID - Identifies the organization that owns this membership settings record',
  })
  @IsNotEmpty({ message: 'Organization GUID is required' })
  @IsUUID(4, { message: 'Organization GUID must be a valid UUID' })
  organizationGuid: string;

  // ========================================
  // BUSINESS REQUIRED FIELDS (from CSV)
  // ========================================

  @ApiProperty({
    example: '2025',
    description:
      'Membership year as text (CSV: Single line of text, changed from Choice)',
    type: 'string',
    maxLength: 4,
  })
  @IsNotEmpty({ message: 'Membership year is required' })
  @IsString({ message: 'Membership year must be a string' })
  @Validate(MembershipYearValidator)
  osot_membership_year: string;

  @ApiProperty({
    example: 1, // ACTIVE
    description: 'Membership year status from Choices_Status',
    enum: AccountStatus,
  })
  @IsNotEmpty({ message: 'Membership year status is required' })
  @IsEnum(AccountStatus, { message: 'Must be a valid account status' })
  @Validate(MembershipYearStatusValidator)
  osot_membership_year_status: AccountStatus;

  @ApiProperty({
    example: 1, // INDIVIDUAL
    description:
      'Membership group from Choices_Membership_Group (Individual or Business)',
    enum: MembershipGroup,
  })
  @IsNotEmpty({ message: 'Membership group is required' })
  @IsEnum(MembershipGroup, { message: 'Must be a valid membership group' })
  osot_membership_group: MembershipGroup;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Membership year start date (Date only format)',
    format: 'date',
  })
  @IsNotEmpty({ message: 'Year start date is required' })
  @IsDateString({}, { message: 'Must be a valid date string' })
  osot_year_starts: string;

  @ApiProperty({
    example: '2025-12-31',
    description: 'Membership year end date (Date only format)',
    format: 'date',
  })
  @IsNotEmpty({ message: 'Year end date is required' })
  @IsDateString({}, { message: 'Must be a valid date string' })
  osot_year_ends: string;

  // ========================================
  // OPTIONAL FIELDS (from CSV)
  // ========================================

  @ApiProperty({
    example: 'osot-set-0000001',
    description:
      'Auto-generated settings identifier (optional for creation) - CSV: osot_settingsid',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Settings ID must be a string' })
  @Validate(SettingsIdValidator)
  osot_settingsid?: string;

  @ApiProperty({
    example: 1, // OWNER
    description: 'Privilege level from Choices_Privilege (default: Owner)',
    enum: Privilege,
    required: false,
  })
  @IsOptional()
  @IsEnum(Privilege, { message: 'Must be a valid privilege level' })
  @Validate(PrivilegeValidator)
  osot_privilege?: Privilege;

  @ApiProperty({
    example: 1, // PROTECTED
    description:
      'Access modifiers from Choices_Access_Modifiers (default: Protected)',
    enum: AccessModifier,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccessModifier, { message: 'Must be a valid access modifier' })
  @Validate(AccessModifiersValidator)
  osot_access_modifiers?: AccessModifier;

  // ========================================
  // SYSTEM FIELDS (read-only, excluded from input)
  // ========================================

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    description:
      'Unique identifier for the membership settings record (system generated)',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'Must be a valid UUID' })
  @Allow() // Allow for response DTOs but not validated on input
  osot_table_membership_settingid?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Date and time when the record was created (system generated)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Must be a valid date string' })
  @Allow() // Allow for response DTOs but not validated on input
  createdon?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description:
      'Date and time when the record was modified (system generated)',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Must be a valid date string' })
  @Allow() // Allow for response DTOs but not validated on input
  modifiedon?: string;

  @ApiProperty({
    example: 'systemuser-guid',
    description: 'Owner of the membership settings record (system managed)',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Owner ID must be a string' })
  @Allow() // Allow for response DTOs but not validated on input
  ownerid?: string;
}
