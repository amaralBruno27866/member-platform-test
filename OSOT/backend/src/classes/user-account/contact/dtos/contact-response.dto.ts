/**
 * Contact Response DTO (SIMPLIFIED)
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

export class ContactResponseDto {
  @ApiProperty({
    example: 'osot-ct-0000001',
    description: 'Auto-generated contact identifier',
  })
  osot_Contact_ID: string;

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    description: 'Unique identifier for the contact record',
  })
  osot_table_contactid: string;

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
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    description: 'Owner of the contact record',
  })
  ownerid: string;

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    description: 'Related account identifier',
    required: false,
  })
  osot_table_account?: string;

  @ApiProperty({
    example: 'CONT001',
    description: 'User business identifier',
  })
  osot_user_business_id: string;

  @ApiProperty({
    example: 'secondary@example.com',
    description: 'Secondary email address',
    required: false,
  })
  osot_secondary_email?: string;

  @ApiProperty({
    example: 'Senior Developer',
    description: 'Job title',
    required: false,
  })
  osot_job_title?: string;

  @ApiProperty({
    example: '(416) 555-1234',
    description: 'Home phone number',
    required: false,
  })
  osot_home_phone?: string;

  @ApiProperty({
    example: '(416) 555-9876',
    description: 'Work phone number',
    required: false,
  })
  osot_work_phone?: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'Business website URL',
    required: false,
  })
  osot_business_website?: string;

  @ApiProperty({
    example: 'https://facebook.com/johndoe',
    description: 'Facebook profile URL',
    required: false,
  })
  osot_facebook?: string;

  @ApiProperty({
    example: 'https://instagram.com/johndoe',
    description: 'Instagram profile URL',
    required: false,
  })
  osot_instagram?: string;

  @ApiProperty({
    example: 'https://tiktok.com/@johndoe',
    description: 'TikTok profile URL',
    required: false,
  })
  osot_tiktok?: string;

  @ApiProperty({
    example: 'https://linkedin.com/in/johndoe',
    description: 'LinkedIn profile URL',
    required: false,
  })
  osot_linkedin?: string;

  @ApiProperty({
    example: 'Private',
    description: 'Access modifier setting (human-readable label)',
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
}
