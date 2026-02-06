/**
 * OT Education Response DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for type safety
 * - swagger: API documentation with examples
 * - integrations: Compatible with DataverseService responses
 *
 * RESPONSE CHARACTERISTICS:
 * - All fields from Dataverse response including system fields
 * - Includes timestamps (CreatedOn, ModifiedOn)
 * - Includes ownership information (OwnerId)
 * - Includes relationship data (Account navigation)
 * - All fields are required as they come from existing records
 * - Clean API response structure for consumers
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OtEducationResponseDto {
  @ApiProperty({
    example: 'osot-oted-0000001',
    description: 'Auto-generated OT Education identifier',
  })
  osot_ot_education_id: string;

  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    description: 'Unique identifier for the OT Education record',
  })
  osot_table_ot_educationid: string;

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
    description: 'Owner of the OT Education record',
  })
  ownerid: string;

  @ApiPropertyOptional({
    example: 'account-guid',
    description: 'Related account identifier',
  })
  osot_table_account?: string;

  @ApiProperty({
    example: 'OTED001',
    description: 'User business identifier',
  })
  osot_user_business_id: string;

  @ApiProperty({
    example: 'General',
    description: 'COTO professional status',
    type: 'string',
  })
  osot_coto_status: string;

  @ApiPropertyOptional({
    example: 'AB123456',
    description: 'COTO registration number',
  })
  osot_coto_registration?: string;

  @ApiProperty({
    example: 'Masters',
    description: 'Occupational Therapy degree type',
    type: 'string',
  })
  osot_ot_degree_type: string;

  @ApiProperty({
    example: 'University of Toronto',
    description: 'University where OT degree was obtained',
    type: 'string',
  })
  osot_ot_university: string;

  @ApiProperty({
    example: '2020',
    description: 'Year of graduation',
    type: 'string',
  })
  osot_ot_grad_year: string;

  @ApiPropertyOptional({
    example: 'Graduated',
    description: 'Education category classification',
    type: 'string',
  })
  osot_education_category?: string;

  @ApiProperty({
    example: 'CANADA',
    description: 'Country where education was obtained',
    type: 'string',
  })
  osot_ot_country: string;

  @ApiPropertyOptional({
    example: 'Additional certification in Hand Therapy',
    description: 'Additional education details',
  })
  osot_ot_other?: string;

  @ApiPropertyOptional({
    example: 'Private',
    description: 'Access control modifier',
    type: 'string',
  })
  osot_access_modifiers?: string;

  @ApiPropertyOptional({
    example: 'Owner',
    description: 'Privilege level',
    type: 'string',
  })
  osot_privilege?: string;

  // Computed/Formatted Values (Optional - if mapper provides them)
  @ApiPropertyOptional({
    example: 'University of Toronto, Canada (2020)',
    description: 'Formatted education summary',
  })
  education_summary?: string;

  @ApiPropertyOptional({
    example: 'COTO General (AB123456)',
    description: 'Formatted COTO status with registration',
  })
  coto_summary?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether COTO registration is valid and active',
  })
  is_coto_active?: boolean;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether this is international education requiring validation',
  })
  is_international_education?: boolean;
}
