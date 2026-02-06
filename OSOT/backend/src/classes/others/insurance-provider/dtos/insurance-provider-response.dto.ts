/**
 * Insurance Provider Response DTO
 *
 * Data Transfer Object for Insurance Provider responses.
 * Returned by create, read, update, and list endpoints.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccessModifier, Privilege } from '../../../../common/enums';

export class InsuranceProviderResponseDto {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  @ApiProperty({
    description: 'Insurance Provider GUID (primary key)',
    example: 'abc-123-def-456-ghi',
    format: 'uuid',
  })
  osot_table_insurance_providerid: string;

  @ApiPropertyOptional({
    description:
      'Insurance Provider autonumber ID (human-readable). Example: osot-prov-0000001',
    example: 'osot-prov-0000001',
  })
  osot_provider_id?: string;

  @ApiPropertyOptional({
    description: 'Organization GUID (multi-tenant isolation)',
    example: 'org-guid-123',
    format: 'uuid',
  })
  organizationGuid?: string;

  @ApiPropertyOptional({
    description: 'Record creation timestamp (ISO 8601)',
    example: '2026-01-23T10:30:00Z',
    format: 'date-time',
  })
  createdon?: string;

  @ApiPropertyOptional({
    description: 'Last modification timestamp (ISO 8601)',
    example: '2026-01-23T15:45:00Z',
    format: 'date-time',
  })
  modifiedon?: string;

  // ========================================
  // PROVIDER INFORMATION
  // ========================================

  @ApiProperty({
    description: 'Insurance company name',
    example: 'Example Insurance Company',
  })
  osot_insurance_company_name: string;

  @ApiProperty({
    description: 'Insurance broker name',
    example: 'Example Insurance Broker',
  })
  osot_insurance_broker_name: string;

  @ApiProperty({
    description: 'Insurance company logo URL',
    example: 'https://cdn.example.com/logo-company.png',
  })
  osot_insurance_company_logo: string;

  @ApiPropertyOptional({
    description: 'Insurance broker logo URL',
    example: 'https://cdn.example.com/logo-broker.png',
  })
  osot_insurance_broker_logo?: string;

  @ApiProperty({
    description: 'Policy period start date (YYYY-MM-DD)',
    example: '2026-01-01',
    format: 'date',
  })
  osot_policy_period_start: string;

  @ApiProperty({
    description: 'Policy period end date (YYYY-MM-DD)',
    example: '2026-12-31',
    format: 'date',
  })
  osot_policy_period_end: string;

  @ApiProperty({
    description: 'Master policy description (text area)',
    example: 'Coverage includes professional liability for OT/OTA members.',
  })
  osot_master_policy_description: string;

  @ApiProperty({
    description: 'Insurance authorized representative (URL)',
    example: 'https://cdn.example.com/signature.png',
  })
  osot_insurance_authorized_representative: string;

  @ApiPropertyOptional({
    description: 'Certificate observations (text area)',
    example: 'All coverage is subject to standard policy conditions.',
  })
  osot_certificate_observations?: string;

  @ApiPropertyOptional({
    description: 'Broker general information (text area)',
    example: 'Broker contact hours: 9AM-5PM EST.',
  })
  osot_broker_general_information?: string;

  // ========================================
  // ACCESS CONTROL
  // ========================================

  @ApiPropertyOptional({
    description: 'Privilege level',
    enum: Privilege,
    example: Privilege.MAIN,
  })
  osot_privilege?: Privilege;

  @ApiPropertyOptional({
    description: 'Access modifier',
    enum: AccessModifier,
    example: AccessModifier.PROTECTED,
  })
  osot_access_modifier?: AccessModifier;
}
