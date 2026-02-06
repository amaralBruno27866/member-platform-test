/**
 * Account Response DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety
 * - swagger: API documentation with examples
 * - integrations: Compatible with DataverseService responses
 *
 * DATAVERSE INTEGRATION:
 * - All fields from Dataverse response including system fields
 * - Includes system fields (ID, timestamps, owner)
 * - Excludes sensitive fields (password) from response
 * - Clean API response structure for client consumption
 *
 * SECURITY CONSIDERATIONS:
 * - Password field is excluded from all responses
 * - Personal information included based on access permissions
 * - System fields included for audit and tracking purposes
 */

import { ApiProperty } from '@nestjs/swagger';
// Note: Enum types removed from imports as we now use string labels in responses

export class AccountResponseDto {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  @ApiProperty({
    example: 'osot-0000001',
    description: 'Auto-generated account identifier',
  })
  osot_account_id: string;

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    description: 'Unique identifier for the account record',
  })
  osot_table_accountid: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Date and time when the record was created',
  })
  createdon: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Date and time when the record was modified',
  })
  modifiedon: string;

  @ApiProperty({
    example: 'systemuser-guid',
    description: 'Owner of the account record',
  })
  ownerid: string;

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

  // Note: Password is intentionally excluded from response for security

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
  // ACCOUNT STATUS
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
  // ACCESS CONTROL
  // ========================================

  @ApiProperty({
    example: 'Private',
    description: 'Access modifier setting (human-readable label)',
    type: 'string',
  })
  osot_access_modifiers: string;

  @ApiProperty({
    example: 1,
    description: 'Privilege level for the account (1=Owner, 2=Admin, 3=Main)',
    type: 'number',
  })
  osot_privilege: number;
}
