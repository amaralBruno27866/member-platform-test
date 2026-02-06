/**
 * Management Response DTO
 * Extends ManagementBasicDto with computed fields and formatted display values
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Inherits all fields from ManagementBasicDto for complete data representation
 * - Adds computed fields for enhanced API response formatting
 * - Integrates with enum display name helpers for user-friendly values
 * - Uses class-transformer for automatic field computation and exposure
 *
 * DATAVERSE INTEGRATION:
 * - Transforms raw Dataverse response data into user-friendly format
 * - Provides formatted display values for enum fields
 * - Includes computed fields for business logic summary
 * - Maintains original field values alongside formatted alternatives
 *
 * USAGE CONTEXT:
 * - API response formatting for management account data
 * - Administrative dashboard data representation
 * - Report generation and data export operations
 * - External system integration with enhanced readability
 *
 * COMPUTED FIELDS:
 * - Display names for Access Modifier and Privilege enums
 * - Business status summary based on management flags
 * - Service capabilities list based on active flags
 * - Account lifecycle status representation
 */

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';
import { ManagementBasicDto } from './management-basic.dto';
import { AccessModifier, Privilege } from '../../../../common/enums';
import { getAccessModifierDisplayName } from '../../../../common/enums/access-modifier.enum';
import { getPrivilegeDisplayName } from '../../../../common/enums/privilege.enum';

export class ManagementResponseDto extends PartialType(ManagementBasicDto) {
  // ========================================
  // FORMATTED ENUM FIELDS (Computed)
  // ========================================

  @ApiProperty({
    example: 'Protected',
    description: 'Human-readable access modifier display name',
    readOnly: true,
  })
  @Expose()
  get accessModifierDisplayName(): string {
    return this.osot_access_modifiers
      ? getAccessModifierDisplayName(this.osot_access_modifiers)
      : 'Not Set';
  }

  @ApiProperty({
    example: 'Main',
    description: 'Human-readable privilege level display name',
    readOnly: true,
  })
  @Expose()
  get privilegeDisplayName(): string {
    return this.osot_privilege
      ? getPrivilegeDisplayName(this.osot_privilege)
      : 'Not Set';
  }

  // ========================================
  // BUSINESS STATUS COMPUTED FIELDS
  // ========================================

  @ApiProperty({
    example: 'Active',
    description: 'Account lifecycle status summary',
    readOnly: true,
  })
  @Expose()
  get lifecycleStatus(): string {
    if (this.osot_passed_away) {
      return 'Deceased';
    }
    if (this.osot_life_member_retired) {
      return 'Life Member (Retired)';
    }
    if (this.osot_shadowing) {
      return 'Shadowing';
    }
    return 'Active';
  }

  @ApiProperty({
    example: ['Vendor Services', 'Advertising'],
    description: 'List of active business services',
    readOnly: true,
    type: [String],
  })
  @Expose()
  get activeServices(): string[] {
    const services: string[] = [];

    if (this.osot_vendor) services.push('Vendor Services');
    if (this.osot_advertising) services.push('Advertising');
    if (this.osot_recruitment) services.push('Recruitment');
    if (this.osot_driver_rehab) services.push('Driver Rehabilitation');

    return services;
  }

  @ApiProperty({
    example: 'Business Account with 2 active services',
    description: 'Summary of account business capabilities',
    readOnly: true,
  })
  @Expose()
  get businessSummary(): string {
    const activeCount = this.activeServices.length;
    const lifecycleStatus = this.lifecycleStatus;

    if (lifecycleStatus === 'Deceased') {
      return 'Deceased Account (All services inactive)';
    }

    if (activeCount === 0) {
      return 'Standard Account (No business services)';
    }

    const serviceText = activeCount === 1 ? 'service' : 'services';
    return `Business Account with ${activeCount} active ${serviceText}`;
  }

  // ========================================
  // ACCESS CONTROL COMPUTED FIELDS
  // ========================================

  @ApiProperty({
    example: true,
    description: 'Whether the account has administrative privileges',
    readOnly: true,
  })
  @Expose()
  get hasAdminPrivileges(): boolean {
    return (
      this.osot_privilege === Privilege.OWNER ||
      this.osot_privilege === Privilege.ADMIN
    );
  }

  @ApiProperty({
    example: 'High',
    description: 'Account security and access level classification',
    readOnly: true,
  })
  @Expose()
  get securityLevel(): string {
    if (this.osot_privilege === Privilege.OWNER) {
      return 'Maximum';
    }
    if (this.osot_privilege === Privilege.ADMIN) {
      return 'High';
    }
    if (this.osot_access_modifiers === AccessModifier.PRIVATE) {
      return 'Protected';
    }
    if (this.osot_access_modifiers === AccessModifier.PROTECTED) {
      return 'Standard';
    }
    return 'Basic';
  }

  // ========================================
  // METADATA COMPUTED FIELDS
  // ========================================

  @ApiProperty({
    example: '2024-01-15 10:30 AM',
    description: 'Formatted creation date for display',
    readOnly: true,
  })
  @Expose()
  get formattedCreatedDate(): string {
    if (!this.createdon) return 'Unknown';
    try {
      return new Date(this.createdon).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Invalid Date';
    }
  }

  @ApiProperty({
    example: '2024-01-20 2:45 PM',
    description: 'Formatted last modified date for display',
    readOnly: true,
  })
  @Expose()
  get formattedModifiedDate(): string {
    if (!this.modifiedon) return 'Never';
    try {
      return new Date(this.modifiedon).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return 'Invalid Date';
    }
  }
}
