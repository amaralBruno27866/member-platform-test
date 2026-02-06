import { ApiProperty } from '@nestjs/swagger';
// Note: Enum types removed from imports as we now use string labels in responses

/**
 * Identity Response DTO for returning identity data from API endpoints.
 * Contains all identity fields including internal metadata.
 * Used for GET operations and as response format for create/update operations.
 *
 * Key characteristics:
 * - Includes internal fields like ID, created/modified dates
 * - Provides complete identity information for API responses
 * - Contains computed/derived fields for client convenience
 * - Excludes sensitive internal processing data
 * - Formatted for optimal client consumption
 */
export class IdentityResponseDto {
  @ApiProperty({
    example: 'osot-id-0000001',
    description: 'Identity autonumber ID (string prefixed number)',
  })
  osot_identity_id: string;

  @ApiProperty({
    example: 'c3f4a5b6-7d8e-9f0a-1b2c-3d4e5f6a7b8c',
    description: 'Unique identifier for entity instances (UUID)',
  })
  osot_table_identityid: string;

  @ApiProperty({
    example: 'osot-id-0000001',
    description: 'User business identifier',
  })
  osot_user_business_id: string;

  @ApiProperty({
    example: 'Alex',
    description: 'Preferred or chosen name',
    required: false,
  })
  osot_chosen_name?: string;

  @ApiProperty({
    example: ['English', 'French'],
    description: 'Language preferences (human-readable labels)',
    type: [String],
  })
  osot_language: string[];

  @ApiProperty({
    example: 'Mandarin',
    description: 'Other language not in predefined list',
    required: false,
  })
  osot_other_language?: string;

  @ApiProperty({
    example: 'Prefer not to disclose',
    description: 'Gender identity (human-readable label)',
    type: 'string',
    required: false,
  })
  osot_gender?: string;

  @ApiProperty({
    example: 'Other',
    description: 'Racial identity (human-readable label)',
    type: 'string',
    required: false,
  })
  osot_race?: string;

  @ApiProperty({
    example: false,
    description: 'Indigenous identity status',
    required: false,
  })
  osot_indigenous?: boolean;

  @ApiProperty({
    example: 'First Nations',
    description: 'Specific Indigenous identity (human-readable label)',
    type: 'string',
    required: false,
  })
  osot_indigenous_detail?: string;

  @ApiProperty({
    example: 'Mohawk Nation',
    description: 'Other Indigenous identity description',
    required: false,
  })
  osot_indigenous_detail_other?: string;

  @ApiProperty({
    example: false,
    description: 'Disability status for accommodation purposes',
    required: false,
  })
  osot_disability?: boolean;

  @ApiProperty({
    example: 'Private',
    description: 'Privacy/visibility preferences (human-readable label)',
    type: 'string',
    required: false,
  })
  osot_access_modifiers?: string;

  @ApiProperty({
    example: 'Owner',
    description: 'User privilege level (human-readable label)',
    type: 'string',
    required: false,
  })
  osot_privilege?: string;

  @ApiProperty({
    example: 'c1f4a5b6-7d8e-9f0a-1b2c-3d4e5f6a7b8c',
    description: 'Related account identifier',
    required: false,
  })
  osot_table_account?: string;

  @ApiProperty({
    example: 'c5f4a5b6-7d8e-9f0a-1b2c-3d4e5f6a7b8c',
    description: 'Owner identifier (system required)',
  })
  ownerid: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Identity record creation timestamp',
  })
  createdon: string;

  @ApiProperty({
    example: '2024-01-20T14:45:00Z',
    description: 'Identity record last modification timestamp',
    required: false,
  })
  modifiedon?: string;
}

/**
 * Usage notes:
 * - This DTO represents the complete identity information returned by API
 * - Includes autonumber ID and entity UUID as per Table Identity.csv specification
 * - Owner field is system required for proper access control
 * - Includes privilege level and account relationship fields
 * - Includes metadata like creation/modification timestamps
 * - All enum fields include human-readable values
 * - Optional fields may be null/undefined based on user preferences
 * - Cultural identity fields respect user privacy choices
 * - Access modifiers control visibility of sensitive information
 * - Optimized for API performance by excluding unnecessary Dataverse metadata
 */
