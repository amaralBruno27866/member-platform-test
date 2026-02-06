/**
 * Update Membership Settings DTO
 * Extends MembershipSettingsBasicDto for membership settings update operations
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Inherits all validation and transformation from MembershipSettingsBasicDto
 * - Includes comprehensive business rule validation for update workflow
 * - Maintains system field integrity during updates
 * - Integrates with DataverseService for OData entity updates
 *
 * DATAVERSE INTEGRATION:
 * - Preserves system-generated fields during updates
 * - Validates Settings ID for existing record identification
 * - Business rule validation during membership settings modification
 * - Comprehensive validation for membership fee adjustments
 *
 * USAGE CONTEXT:
 * - Membership settings updates via administrative endpoints
 * - Annual membership fee adjustments
 * - Category or status changes for existing settings
 * - API integration with membership management systems
 *
 * BUSINESS RULES:
 * - Settings ID is required for updates (identifies existing record)
 * - All business fields can be updated with proper validation
 * - Group-year combination must remain unique after update
 * - System fields (timestamps, owner) are managed automatically
 * - Year period dates must maintain valid date range (end > start)
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Validate } from 'class-validator';
import { MembershipSettingsBasicDto } from './membership-settings-basic.dto';
import { SettingsIdValidator } from '../validators/membership-settings.validators';

export class UpdateMembershipSettingsDto extends MembershipSettingsBasicDto {
  // ========================================
  // REQUIRED FIELDS FOR UPDATE OPERATIONS
  // ========================================

  @ApiProperty({
    example: 'osot-set-0000001',
    description: 'Settings identifier (required for updates)',
  })
  @IsNotEmpty({ message: 'Settings ID is required for updates' })
  @IsString({ message: 'Settings ID must be a string' })
  @Validate(SettingsIdValidator)
  osot_settingsid: string; // Override to make required for updates

  // Note: organizationGuid is INHERITED from MembershipSettingsBasicDto
  // but CANNOT be modified during update operations (immutable)
  // The service layer validates and preserves the existing organizationGuid
  //
  // System fields that will be auto-updated:
  // - modifiedon: Updated to current timestamp
  // - ownerid: Preserved from existing record
  // - createdon: Preserved from existing record
  // - osot_table_membership_settingid: Preserved (immutable)
  // - organizationGuid: Preserved (immutable - multi-tenant integrity)
}
