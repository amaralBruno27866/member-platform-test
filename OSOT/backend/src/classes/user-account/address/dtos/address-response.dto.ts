/**
 * Address Response DTO (SIMPLIFIED)
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety
 * - swagger: API documentation with examples
 * - integrations: Compatible with DataverseService responses
 *
 * SIMPLIFICATION PHILOSOPHY:
 * - All fields from Dataverse response
 * - Includes system fields (ID, timestamps, owner)
 * - Includes relationship data (Account navigation)
 * - Clean API response structure
 */

import { ApiProperty } from '@nestjs/swagger';
// Note: Enum types removed from imports as we now use string labels in responses

export class AddressResponseDto {
  @ApiProperty({
    example: 'osot-ad-0000001',
    description: 'Auto-generated address identifier',
  })
  osot_Address_ID: string;

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    description: 'Unique identifier for the address record',
  })
  osot_Table_AddressId: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Date and time when the record was created',
  })
  CreatedOn: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Date and time when the record was modified',
  })
  ModifiedOn: string;

  @ApiProperty({
    example: 'systemuser-guid',
    description: 'Owner of the address record',
  })
  OwnerId: string;

  @ApiProperty({
    example: 'account-guid',
    description: 'Related account identifier',
    required: false,
  })
  osot_Table_Account?: string;

  @ApiProperty({
    example: 'ADDR001',
    description: 'User business identifier',
    required: false,
  })
  osot_user_business_id?: string;

  @ApiProperty({
    example: 'Other City Name',
    description: 'Other city',
    required: false,
  })
  osot_other_city?: string;

  @ApiProperty({
    example: 'Other Province/State',
    description: 'Other province or state',
    required: false,
  })
  osot_other_province_state?: string;

  @ApiProperty({
    example: '123 Main Street',
    description: 'Address line 1',
  })
  osot_address_1: string;

  @ApiProperty({
    example: 'Apt 4B',
    description: 'Address line 2',
    required: false,
  })
  osot_address_2?: string;

  @ApiProperty({
    example: 'Toronto',
    description: 'City (human-readable label)',
    type: 'string',
  })
  osot_city: string;

  @ApiProperty({
    example: 'Ontario',
    description: 'Province (human-readable label)',
    type: 'string',
  })
  osot_province: string;

  @ApiProperty({
    example: 'K1A 0A6',
    description: 'Canadian postal code',
  })
  osot_postal_code: string;

  @ApiProperty({
    example: 'Canada',
    description: 'Country (human-readable label)',
    type: 'string',
  })
  osot_country: string;

  @ApiProperty({
    example: 'Home',
    description: 'Address type (human-readable label)',
    type: 'string',
  })
  osot_address_type: string;

  @ApiProperty({
    description: 'Address preferences (human-readable labels)',
    type: [String],
    example: ['Mail', 'Shipping'],
    required: false,
  })
  osot_address_preference?: string[];

  @ApiProperty({
    example: 'Private',
    description: 'Access modifier (human-readable label)',
    type: 'string',
    required: false,
  })
  osot_access_modifiers?: string;

  @ApiProperty({
    example: 'Owner',
    description: 'Privilege level (human-readable label)',
    type: 'string',
    required: false,
  })
  osot_privilege?: string;

  // Navigation properties (expanded when requested)
  @ApiProperty({
    description: 'Related account data (when expanded)',
    required: false,
  })
  osot_table_account?: {
    osot_Account_ID: string;
    osot_Table_AccountId: string;
    osot_user_business_id: string;
    // Add other account fields as needed
  };
}
