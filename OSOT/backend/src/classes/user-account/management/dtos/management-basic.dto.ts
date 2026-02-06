/**
 * Management Basic DTO
 * Integrated with essential modules: errors, utils, enums, constants, validators
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums (AccessModifier, Privilege)
 * - constants: References MANAGEMENT_FIELD_LIMITS for validation consistency
 * - validators: Uses management validators for comprehensive business rule compliance
 *
 * DATAVERSE INTEGRATION:
 * - Field names align with Table Account Management.csv schema (osot_ prefix)
 * - Validation rules match Dataverse field constraints
 * - Enum values synchronized with Dataverse global choices
 * - Business required fields properly marked per CSV specification
 * - Management flags and privilege settings properly validated
 *
 * This DTO represents the comprehensive management information structure
 * aligned with Table Account Management.csv business requirements and
 * designed for seamless Dataverse integration via DataverseService.
 *
 * Coverage: User business identity, lifecycle management flags, service flags,
 * access control settings, and account management configuration.
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
  IsBoolean,
  MaxLength,
  Validate,
  IsUUID,
  Allow,
} from 'class-validator';

// Essential modules integration
import { AccessModifier, Privilege } from '../../../../common/enums';
import { MANAGEMENT_VALIDATION } from '../constants/management.constants';

// Management validators integration
import {
  IsManagementUserBusinessId,
  IsVendorRecruitmentValid,
  IsLifecycleFlagValid,
  IsActiveServiceValid,
  IsValidAccessModifier,
  IsValidPrivilege,
} from '../validators/management.validators';

export class ManagementBasicDto {
  // ========================================
  // SYSTEM GENERATED FIELDS
  // ========================================

  @ApiProperty({
    example: 'mgmt-0000001',
    description: 'Auto-generated management identifier with string prefix',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsString()
  readonly osot_account_management_id?: string;

  @ApiProperty({
    example: 'b3e1c1a2-1234-4f56-8a9b-abcdef123456',
    description: 'Unique identifier for management entity instances',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsUUID()
  readonly osot_table_account_managementid?: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Date and time when the management record was created',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsDateString()
  readonly createdon?: string;

  @ApiProperty({
    example: '2024-01-20T14:45:00Z',
    description: 'Date and time when the management record was last modified',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsDateString()
  readonly modifiedon?: string;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Owner identifier for the management record',
    required: false,
    readOnly: true,
  })
  @IsOptional()
  @IsUUID()
  readonly ownerid?: string;

  // ========================================
  // BUSINESS IDENTITY FIELDS
  // ========================================

  @ApiProperty({
    description:
      'OData bind for Account. Example: "/osot_table_accounts(<GUID>)"',
    example: '/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  @IsOptional()
  @Allow()
  ['osot_Table_Account@odata.bind']?: string;

  @ApiProperty({
    example: 'USR-BUSINESS-001-2024',
    description:
      'Unique user business identifier following OSOT format standards (Business Required)',
    maxLength: MANAGEMENT_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(MANAGEMENT_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH)
  @Validate(IsManagementUserBusinessId)
  osot_user_business_id: string;

  // ========================================
  // LIFECYCLE MANAGEMENT FLAGS
  // ========================================

  @ApiProperty({
    example: false,
    description:
      'Indicates if the member is a retired life member (Business Optional)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Validate(IsLifecycleFlagValid, ['life_member_retired'])
  osot_life_member_retired?: boolean;

  @ApiProperty({
    example: false,
    description:
      'Indicates if the member is in shadowing status (Business Optional)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Validate(IsLifecycleFlagValid, ['shadowing'])
  osot_shadowing?: boolean;

  @ApiProperty({
    example: false,
    description: 'Indicates if the member has passed away (Business Optional)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Validate(IsLifecycleFlagValid, ['passed_away'])
  osot_passed_away?: boolean;

  // ========================================
  // SERVICE TYPE FLAGS
  // ========================================

  @ApiProperty({
    example: false,
    description:
      'Indicates if the account provides vendor services (Business Optional)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Validate(IsActiveServiceValid, ['vendor'])
  osot_vendor?: boolean;

  @ApiProperty({
    example: false,
    description:
      'Indicates if the account provides advertising services (Business Optional)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Validate(IsActiveServiceValid, ['advertising'])
  osot_advertising?: boolean;

  @ApiProperty({
    example: false,
    description:
      'Indicates if the account provides recruitment services (Business Optional)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Validate(IsVendorRecruitmentValid)
  osot_recruitment?: boolean;

  @ApiProperty({
    example: false,
    description:
      'Indicates if the account provides driver rehabilitation services (Business Optional)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Validate(IsActiveServiceValid, ['driver_rehab'])
  osot_driver_rehab?: boolean;

  // ========================================
  // ACCESS CONTROL SETTINGS
  // ========================================

  @ApiProperty({
    example: AccessModifier.PROTECTED,
    description:
      'Access modifier setting for account visibility (Business Optional)',
    enum: AccessModifier,
    enumName: 'AccessModifier',
    required: false,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  @Validate(IsValidAccessModifier)
  osot_access_modifiers?: AccessModifier;

  @ApiProperty({
    example: Privilege.MAIN,
    description: 'Privilege level for account permissions (Business Optional)',
    enum: Privilege,
    enumName: 'Privilege',
    required: false,
  })
  @IsOptional()
  @IsEnum(Privilege)
  @Validate(IsValidPrivilege)
  osot_privilege?: Privilege;
}
