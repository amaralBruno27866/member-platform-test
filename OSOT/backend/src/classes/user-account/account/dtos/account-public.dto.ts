/**
 * Account Public DTO
 *
 * Data Transfer Object for public API responses (UI/UX).
 * Contains only fields that should be visible to end users.
 * Excludes internal system fields like GUIDs, timestamps, and access control fields.
 *
 * SECURITY:
 * - Password field excluded
 * - Internal GUID (osot_table_accountid) excluded
 * - Audit fields (createdon, modifiedon, ownerid) excluded
 * - Access control fields (osot_access_modifiers) excluded
 * - Privilege level (osot_privilege) included for user context
 *
 * DATA FORMAT:
 * - account_group: Numeric (0-4) for frontend comparisons
 * - privilege: Numeric (1-3) for consistent JWT compatibility
 *
 * USE CASES:
 * - GET /private/accounts/me
 * - GET /api/accounts/me
 * - PATCH /private/accounts/me (response)
 * - User profile display in UI
 *
 * @version 1.1.0 - Standardized numeric types for enums
 * @since 2025-11-19
 */

import { ApiProperty } from '@nestjs/swagger';

export class AccountPublicDto {
  // ========================================
  // BUSINESS IDENTIFIER
  // ========================================

  @ApiProperty({
    example: 'osot-0000001',
    description: 'Auto-generated account identifier (business ID)',
  })
  osot_account_id: string;

  // ========================================
  // PERSONAL INFORMATION
  // ========================================

  @ApiProperty({
    example: 'Smith',
    description: 'Last name of the account holder',
  })
  osot_last_name: string;

  @ApiProperty({
    example: 'John',
    description: 'First name of the account holder',
  })
  osot_first_name: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Date of birth (Date only)',
    type: 'string',
    format: 'date',
  })
  osot_date_of_birth: string;

  // ========================================
  // CONTACT INFORMATION
  // ========================================

  @ApiProperty({
    example: '+1-416-555-0123',
    description: 'Mobile phone number',
  })
  osot_mobile_phone: string;

  @ApiProperty({
    example: 'john.smith@example.com',
    description: 'Email address for the account',
  })
  osot_email: string;

  // ========================================
  // ACCOUNT CONFIGURATION
  // ========================================

  @ApiProperty({
    example: 1,
    description:
      'Account group classification (0=Other, 1=OT, 2=OTA, 3=Vendor, 4=Staff)',
    type: 'number',
  })
  osot_account_group: number;

  @ApiProperty({
    example: true,
    description: 'Account declaration acceptance status',
  })
  osot_account_declaration: boolean;

  // ========================================
  // ACCOUNT STATUS (Read-only)
  // ========================================

  @ApiProperty({
    example: 'Active',
    description: 'Current account status (human-readable label)',
    type: 'string',
  })
  osot_account_status: string;

  @ApiProperty({
    example: true,
    description: 'Whether the account is an active member',
  })
  osot_active_member: boolean;

  // ========================================
  // ACCESS CONTROL (Read-only)
  // ========================================

  @ApiProperty({
    example: 1,
    description: 'Privilege level for the account (1=Owner, 2=Admin, 3=Main)',
    type: 'number',
  })
  osot_privilege: number;
}
