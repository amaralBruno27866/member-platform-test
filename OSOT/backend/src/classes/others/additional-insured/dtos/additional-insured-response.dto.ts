/**
 * Additional Insured Response DTO
 *
 * Data Transfer Object for Additional Insured responses.
 * Returned by all endpoints (create, read, update, list).
 *
 * Architecture Notes:
 * - Includes all fields (system + business)
 * - No validation decorators (read-only response)
 * - Dates as ISO 8601 strings (frontend compatibility)
 * - All fields use @ApiProperty for Swagger documentation
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Privilege, AccessModifier } from '../../../../common/enums';

/**
 * Response DTO for Additional Insured entity
 */
export class AdditionalInsuredResponseDto {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  @ApiProperty({
    description: 'Additional Insured GUID (primary key)',
    example: 'abc-123-def-456-ghi',
    format: 'uuid',
  })
  osot_table_additional_insuredid: string;

  @ApiPropertyOptional({
    description:
      'Additional Insured autonumber ID (human-readable). Example: osot-add-ins-0000001',
    example: 'osot-add-ins-0000001',
  })
  osot_additionalinsuredid?: string;

  @ApiPropertyOptional({
    description: 'Organization GUID (multi-tenant isolation)',
    example: 'org-guid-123',
    format: 'uuid',
  })
  organizationGuid?: string;

  @ApiPropertyOptional({
    description: 'Insurance GUID (parent insurance that triggered creation)',
    example: 'insurance-guid-456',
    format: 'uuid',
  })
  insuranceGuid?: string;

  @ApiPropertyOptional({
    description: 'Record creation timestamp (ISO 8601)',
    example: '2026-01-29T10:30:00Z',
    format: 'date-time',
  })
  createdon?: string;

  @ApiPropertyOptional({
    description: 'Last modification timestamp (ISO 8601)',
    example: '2026-01-29T15:45:00Z',
    format: 'date-time',
  })
  modifiedon?: string;

  @ApiPropertyOptional({
    description: 'Creator user name (for audit trail)',
    example: 'john.doe@example.com',
  })
  createdby?: string;

  @ApiPropertyOptional({
    description: 'Last modifier user name (for audit trail)',
    example: 'admin@example.com',
  })
  modifiedby?: string;

  // ========================================
  // BUSINESS FIELDS
  // ========================================

  @ApiProperty({
    description:
      'Company/entity name (normalized to UPPERCASE). Unique per insurance.',
    example: 'ABC CORPORATION',
  })
  osot_company_name: string;

  @ApiProperty({
    description: 'Street address.',
    example: '123 MAIN STREET',
  })
  osot_address: string;

  @ApiProperty({
    description:
      'City display name (snapshot from Insurance parent). Immutable.',
    example: 'TORONTO',
  })
  osot_city: string;

  @ApiProperty({
    description:
      'Province display name (snapshot from Insurance parent). Immutable.',
    example: 'ONTARIO',
  })
  osot_province: string;

  @ApiProperty({
    description:
      'Postal code (formatted with space for display, e.g., K1A 0A6).',
    example: 'K1A 0A6',
  })
  osot_postal_code: string;

  // ========================================
  // ACCESS CONTROL FIELDS
  // ========================================

  @ApiPropertyOptional({
    description:
      'Privilege level (snapshot from creation). Immutable after creation.',
    enum: Privilege,
    example: Privilege.OWNER,
  })
  osot_privilege?: string;

  @ApiPropertyOptional({
    description:
      'Access modifier (snapshot from creation). Immutable after creation.',
    enum: AccessModifier,
    example: AccessModifier.PRIVATE,
  })
  osot_access_modifiers?: string;
}

/**
 * Paginated list response wrapper
 */
export interface AdditionalInsuredListResponse {
  success: boolean;
  data: AdditionalInsuredResponseDto[];
  total: number;
  message: string;
  timestamp: string;
}

/**
 * Single record response wrapper
 */
export interface AdditionalInsuredDetailResponse {
  success: boolean;
  data: AdditionalInsuredResponseDto;
  message: string;
  timestamp: string;
}

/**
 * Create response (includes operation metadata)
 */
export interface AdditionalInsuredCreateResponse
  extends AdditionalInsuredDetailResponse {
  operationId?: string;
}
