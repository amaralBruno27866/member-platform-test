/**
 * OTA Education Response DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Standardized error handling in responses
 * - enums: Uses centralized enums for consistent data
 * - integrations: Maps Dataverse responses to internal models
 * - utils: Uses system utilities for data transformation
 *
 * RESPONSE FEATURES:
 * - Complete OTA Education entity representation
 * - System metadata included (creation/modification dates)
 * - Account relationship information
 * - Comprehensive Swagger documentation
 * - Type-safe enum values
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for OTA Education entity operations
 *
 * Contains all entity fields plus system metadata
 * Used for:
 * - Single record responses (GET, POST, PUT)
 * - List operation items
 * - Nested responses in related entities
 */
export class OtaEducationResponseDto {
  @ApiProperty({
    example: 'osot-ota-ed-0000001',
    description: 'Business identifier for OTA Education record',
  })
  osot_ota_education_id: string;

  @ApiProperty({
    example: 'b3e1c1a2-1234-4f56-8a9b-abcdef123456',
    description: 'Primary key GUID for OTA Education record',
  })
  osot_table_ota_educationid: string;

  @ApiPropertyOptional({
    example: 'system-user-guid',
    description: 'Owner ID for record permissions',
  })
  ownerid?: string;

  @ApiProperty({
    description: 'User Business ID with validation rules',
    example: 'USR-2024-001234',
  })
  osot_user_business_id: string;

  @ApiProperty({
    description: 'Work declaration required by OTA business rules',
    example: true,
  })
  osot_work_declaration: boolean;

  @ApiPropertyOptional({
    description: 'OTA degree type',
    example: 'Diploma/Credential',
  })
  osot_ota_degree_type?: string;

  @ApiPropertyOptional({
    description: 'OTA college name',
    example: 'Algonquin College',
  })
  osot_ota_college?: string;

  @ApiPropertyOptional({
    description: 'OTA graduation year',
    example: '2020',
  })
  osot_ota_grad_year?: string;

  @ApiPropertyOptional({
    description: 'Education category',
    example: 'Graduate',
  })
  osot_education_category?: string;

  @ApiPropertyOptional({
    description: 'OTA country where college is located',
    example: 'CA',
  })
  osot_ota_country?: string;

  @ApiPropertyOptional({
    description: 'Additional OTA education information',
    example: 'Specialized in pediatric rehabilitation',
  })
  osot_ota_other?: string;

  // System Metadata
  @ApiPropertyOptional({
    description: 'Record creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdon?: string;

  @ApiPropertyOptional({
    description: 'Record last modification timestamp',
    example: '2024-01-20T14:45:00Z',
  })
  modifiedon?: string;

  @ApiPropertyOptional({
    description: 'User who created the record',
    example: 'system@osot.on.ca',
  })
  createdby?: string;

  @ApiPropertyOptional({
    description: 'User who last modified the record',
    example: 'admin@osot.on.ca',
  })
  modifiedby?: string;

  // Account Relationship
  @ApiPropertyOptional({
    description: 'Associated Account ID',
    example: 'a1b2c3d4-5678-9012-3456-789012345678',
  })
  '_osot_table_account_value'?: string;

  @ApiPropertyOptional({
    description: 'Associated Account display name',
    example: 'John Doe - OTA Professional',
  })
  '_osot_table_account_value@OData.Community.Display.V1.FormattedValue'?: string;

  @ApiPropertyOptional({
    description: 'Account lookup value',
    example: 'osot_table_accounts(a1b2c3d4-5678-9012-3456-789012345678)',
  })
  '_osot_table_account_value@Microsoft.Dynamics.CRM.lookuplogicalname'?: string;
}
