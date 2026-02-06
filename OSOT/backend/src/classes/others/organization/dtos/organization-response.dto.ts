/**
 * Organization Response DTO
 * Simplified response for public/private endpoints
 *
 * ESSENTIAL USER-FACING FIELDS ONLY:
 * - Excludes sensitive system fields (ownerid, GUID, timestamps)
 * - Excludes access control fields (privilege, access_modifier)
 * - Returns only business-relevant information
 * - Safe for both authenticated and public endpoints
 *
 * FIELDS EXPOSED:
 * - osot_organizationid: Business identifier (osot-org-0000001)
 * - osot_organization_name: Organization name
 * - osot_legal_name: Legal name
 * - osot_acronym: Acronym (optional)
 * - osot_slug: URL-friendly identifier
 * - osot_organization_status: Status (human-readable label)
 * - osot_organization_logo: Logo URL
 * - osot_organization_website: Website URL
 * - osot_representative: Legal representative
 * - osot_organization_email: Contact email
 * - osot_organization_phone: Contact phone
 *
 * USAGE CONTEXT:
 * - Private endpoints: Full organization details for authenticated users
 * - Public endpoints: Organization branding for white-label login
 * - API responses for organization management
 * - Dashboard displays and admin panels
 */

import { ApiProperty } from '@nestjs/swagger';

export class OrganizationResponseDto {
  @ApiProperty({
    example: 'osot-org-0000001',
    description: 'Auto-generated organization business identifier',
  })
  osot_organizationid: string;

  @ApiProperty({
    example: 'Ontario Society of Occupational Therapists',
    description: 'Organization name',
  })
  osot_organization_name: string;

  @ApiProperty({
    example: 'Ontario Society of Occupational Therapists Inc.',
    description: 'Legal name / Razão social',
  })
  osot_legal_name: string;

  @ApiProperty({
    example: 'OSOT',
    description: 'Acronym / Sigla (optional)',
    required: false,
  })
  osot_acronym?: string;

  @ApiProperty({
    example: 'osot',
    description: 'URL-friendly unique identifier (slug)',
  })
  osot_slug: string;

  @ApiProperty({
    example: 'Active',
    description: 'Organization status (human-readable label)',
  })
  osot_organization_status: string;

  @ApiProperty({
    example: 'https://cdn.osot.on.ca/logo.png',
    description: 'Organization logo URL',
  })
  osot_organization_logo: string;

  @ApiProperty({
    example: 'https://www.osot.on.ca',
    description: 'Organization website URL',
  })
  osot_organization_website: string;

  @ApiProperty({
    example: 'John Doe, Executive Director',
    description: 'Legal representative',
  })
  osot_representative: string;

  @ApiProperty({
    example: 'info@osot.on.ca',
    description: 'Organization email',
  })
  osot_organization_email: string;

  @ApiProperty({
    example: '+1-416-555-0100',
    description: 'Organization phone',
  })
  osot_organization_phone: string;
}

/**
 * Organization Public Response DTO
 * Minimal response for public endpoints (used in white-label login)
 *
 * FIELDS EXPOSED (public-safe only):
 * - osot_organizationid: Business identifier
 * - osot_organization_name: Organization name
 * - osot_acronym: Acronym (optional)
 * - osot_slug: URL-friendly identifier
 * - osot_organization_logo: Logo URL (for branding)
 * - osot_organization_website: Website URL
 *
 * USAGE CONTEXT:
 * - GET /api/public/organization/:slug (no authentication required)
 * - White-label login page branding
 * - Landing pages with organization-specific branding
 */
export class OrganizationPublicResponseDto {
  @ApiProperty({
    example: 'osot-org-0000001',
    description: 'Organization business identifier',
  })
  osot_organizationid: string;

  @ApiProperty({
    example: 'Ontario Society of Occupational Therapists',
    description: 'Organization name',
  })
  osot_organization_name: string;

  @ApiProperty({
    example: 'OSOT',
    description: 'Acronym (optional)',
    required: false,
  })
  osot_acronym?: string;

  @ApiProperty({
    example: 'osot',
    description: 'URL-friendly unique identifier',
  })
  osot_slug: string;

  @ApiProperty({
    example: 'https://cdn.osot.on.ca/logo.png',
    description: 'Organization logo URL',
  })
  osot_organization_logo: string;

  @ApiProperty({
    example: 'https://www.osot.on.ca',
    description: 'Organization website URL',
  })
  osot_organization_website: string;
}
