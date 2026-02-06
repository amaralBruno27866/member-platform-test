/**
 * Update Management DTO
 * Independent DTO for management updates without account lookup requirement
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Contains all management fields without account relationship binding
 * - All fields optional for partial updates
 * - Maintains business rule enforcement for partial updates
 * - Integrates with DataverseService for OData PATCH operations
 *
 * DATAVERSE INTEGRATION:
 * - Supports partial entity updates via OData PATCH requests
 * - Maintains field-level validation for changed properties
 * - Preserves existing values for unspecified fields
 * - No account lookup needed (handled via JWT authentication)
 *
 * USAGE CONTEXT:
 * - Management updates via user self-service endpoints (/me routes)
 * - Partial configuration changes without admin privileges
 * - User management settings operations
 * - JWT-authenticated operations where account context is implicit
 *
 * BUSINESS RULES:
 * - All fields are optional, allowing granular updates
 * - Business rule validation applies to changed combinations
 * - System-generated fields (IDs, timestamps) are excluded from updates
 * - Account relationship handled implicitly via authentication context
 *
 * VALIDATION BEHAVIOR:
 * - Field-level validators run only on provided fields
 * - Cross-field validation runs when multiple related fields are updated
 * - Maintains data integrity through service-layer business rule checks
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  MaxLength,
  Validate,
} from 'class-validator';

// Essential modules integration
import { AccessModifier, Privilege } from '../../../../common/enums';
import { MANAGEMENT_VALIDATION } from '../constants/management.constants';

// Management validators integration
import {
  IsManagementUserBusinessId,
  IsLifecycleFlagValid,
  IsActiveServiceValid,
  IsValidAccessModifier,
  IsValidPrivilege,
} from '../validators/management.validators';

export class UpdateManagementDto {
  // ========================================
  // ESSENTIAL MANAGEMENT FIELDS
  // ========================================

  @ApiProperty({
    example: 'USR-BUSINESS-001-2024',
    description:
      'Unique user business identifier following OSOT format standards (Business Required)',
    maxLength: MANAGEMENT_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(MANAGEMENT_VALIDATION.USER_BUSINESS_ID.MAX_LENGTH)
  @Validate(IsManagementUserBusinessId)
  osot_user_business_id?: string;

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
  @Validate(IsActiveServiceValid, ['recruitment'])
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
  // ACCESS CONTROL FIELDS
  // ========================================

  @ApiProperty({
    example: AccessModifier.PRIVATE,
    description: 'Access level for entity visibility (Business Required)',
    enum: AccessModifier,
    required: false,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  @Validate(IsValidAccessModifier)
  osot_access_modifiers?: AccessModifier;

  @ApiProperty({
    example: Privilege.MAIN,
    description: 'User privilege level (Business Required)',
    enum: Privilege,
    required: false,
  })
  @IsOptional()
  @IsEnum(Privilege)
  @Validate(IsValidPrivilege)
  osot_privilege?: Privilege;

  /**
   * Usage notes:
   * - All fields from ManagementBasicDto are now optional for partial updates
   * - No account lookup field needed (handled via JWT authentication)
   * - Lifecycle flags can be updated independently with business rule validation
   * - Service type flags maintain validation for business logic compliance
   * - Access control fields require proper authorization for changes
   * - Account relationship handled implicitly via authentication context
   */
}
