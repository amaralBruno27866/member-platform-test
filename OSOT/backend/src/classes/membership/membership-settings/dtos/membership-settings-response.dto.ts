/**
 * Membership Settings Response DTO
 *
 * ESSENTIAL USER-FACING FIELDS ONLY:
 * - Simplified response for public/private endpoints
 * - Excludes sensitive system fields (ownerid, timestamps)
 * - Excludes access control fields (privilege, access_modifiers)
 * - Returns only business-relevant information
 *
 * FIELDS EXPOSED:
 * - osot_settingsid: Business identifier
 * - osot_membership_year: Membership year
 * - osot_membership_group: Group type (Individual/Business, human-readable label)
 * - osot_year_starts: Year period start date
 * - osot_year_ends: Year period end date
 * - osot_membership_year_status: Status (human-readable label)
 */

import { ApiProperty } from '@nestjs/swagger';

export class MembershipSettingsResponseDto {
  @ApiProperty({
    example: 'b1a2c3d4-e5f6-7890-abcd-ef1234567890',
    description:
      'Organization GUID - Identifies the organization that owns this membership settings record',
  })
  organizationGuid: string;

  @ApiProperty({
    example: 'osot-set-0000001',
    description: 'Auto-generated settings identifier',
  })
  osot_settingsid: string;

  @ApiProperty({
    example: '2025',
    description: 'Membership year as text',
    type: 'string',
  })
  osot_membership_year: string;

  @ApiProperty({
    example: 'Individual',
    description: 'Membership group (human-readable label)',
  })
  osot_membership_group: string;

  @ApiProperty({
    example: '2025-01-01',
    description: 'Membership year start date',
    format: 'date',
  })
  osot_year_starts: string;

  @ApiProperty({
    example: '2025-12-31',
    description: 'Membership year end date',
    format: 'date',
  })
  osot_year_ends: string;

  @ApiProperty({
    example: 'Active',
    description: 'Membership year status (human-readable label)',
  })
  osot_membership_year_status: string;
}
