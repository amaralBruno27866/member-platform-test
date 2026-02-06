import { ApiProperty } from '@nestjs/swagger';
import {
  AffiliateArea,
  AccountStatus,
  Province,
  Country,
  City,
} from '../../../../common/enums';

/**
 * DTO for public-facing Affiliate responses (UI/UX)
 * Contains only fields exposed to end users through public API routes.
 * System fields (GUIDs, timestamps, passwords, access control) are excluded.
 *
 * VIEW FIELDS (21 fields - for GET requests):
 * - osot_affiliate_id (business ID)
 * - osot_affiliate_name
 * - osot_affiliate_area
 * - osot_affiliate_email
 * - osot_affiliate_phone
 * - osot_affiliate_website
 * - osot_representative_first_name
 * - osot_representative_last_name
 * - osot_representative_job_title
 * - osot_affiliate_address_1
 * - osot_affiliate_address_2
 * - osot_affiliate_city
 * - osot_affiliate_province
 * - osot_affiliate_country
 * - osot_affiliate_postal_code
 * - osot_affiliate_facebook
 * - osot_affiliate_instagram
 * - osot_affiliate_tiktok
 * - osot_affiliate_linkedin
 * - osot_account_declaration
 * - osot_account_status
 *
 * UPDATE FIELDS (18 fields - for PATCH requests):
 * - osot_affiliate_name
 * - osot_affiliate_area
 * - osot_affiliate_email
 * - osot_affiliate_phone
 * - osot_affiliate_website
 * - osot_representative_first_name
 * - osot_representative_last_name
 * - osot_representative_job_title
 * - osot_affiliate_address_1
 * - osot_affiliate_address_2
 * - osot_affiliate_city
 * - osot_affiliate_province
 * - osot_affiliate_country
 * - osot_affiliate_postal_code
 * - osot_affiliate_facebook
 * - osot_affiliate_instagram
 * - osot_affiliate_tiktok
 * - osot_affiliate_linkedin
 *
 * READ-ONLY FIELDS (visible in GET, not editable in PATCH):
 * - osot_affiliate_id (business ID - set at creation)
 * - osot_account_declaration (set at creation, immutable)
 * - osot_account_status (system-managed)
 *
 * EXCLUDED FIELDS (not visible in UI/UX):
 * - osot_table_account_affiliateid (system GUID)
 * - osot_password (security - never exposed)
 * - createdon, modifiedon (timestamps)
 * - ownerid (ownership)
 * - osot_access_modifiers (access control)
 * - osot_privilege (permissions)
 * - osot_email_verified, osot_email_verification_token (internal verification state)
 * - osot_admin_approved, osot_admin_approval_date (internal approval workflow)
 */
export class AffiliatePublicDto {
  @ApiProperty({
    example: 'affi-0000001',
    description: 'Auto-generated affiliate identifier',
    nullable: true,
  })
  osot_affiliate_id: string | null;

  @ApiProperty({
    example: 'Tech Solutions Inc.',
    description: 'Official organization/business name',
    nullable: true,
  })
  osot_affiliate_name: string | null;

  @ApiProperty({
    example: 'Healthcare and Life Sciences',
    description: 'Business area/industry classification',
    nullable: true,
  })
  osot_affiliate_area: AffiliateArea | string | null;

  @ApiProperty({
    example: 'contact@techsolutions.com',
    description: 'Primary business email address',
    nullable: true,
  })
  osot_affiliate_email: string | null;

  @ApiProperty({
    example: '+1-416-555-0123',
    description: 'Primary business phone number',
    nullable: true,
  })
  osot_affiliate_phone: string | null;

  @ApiProperty({
    example: 'https://www.techsolutions.com',
    description: 'Official business website URL',
    nullable: true,
  })
  osot_affiliate_website: string | null;

  @ApiProperty({
    example: 'John',
    description: 'Representative contact person first name',
    nullable: true,
  })
  osot_representative_first_name: string | null;

  @ApiProperty({
    example: 'Doe',
    description: 'Representative contact person last name',
    nullable: true,
  })
  osot_representative_last_name: string | null;

  @ApiProperty({
    example: 'Chief Executive Officer',
    description: 'Representative job title/position',
    nullable: true,
  })
  osot_representative_job_title: string | null;

  @ApiProperty({
    example: '123 Business Street',
    description: 'Primary business address line 1',
    nullable: true,
  })
  osot_affiliate_address_1: string | null;

  @ApiProperty({
    example: 'Suite 100',
    description: 'Secondary business address line 2',
    nullable: true,
  })
  osot_affiliate_address_2: string | null;

  @ApiProperty({
    example: 'Toronto',
    description: 'Business location city',
    nullable: true,
  })
  osot_affiliate_city: City | string | null;

  @ApiProperty({
    example: 'Ontario',
    description: 'Business location province/state',
    nullable: true,
  })
  osot_affiliate_province: Province | string | null;

  @ApiProperty({
    example: 'CANADA',
    description: 'Business location country',
    nullable: true,
  })
  osot_affiliate_country: Country | string | null;

  @ApiProperty({
    example: 'K1A0A6',
    description: 'Business location postal/zip code',
    nullable: true,
  })
  osot_affiliate_postal_code: string | null;

  @ApiProperty({
    example: 'https://www.facebook.com/techsolutions',
    description: 'Facebook business page URL',
    nullable: true,
  })
  osot_affiliate_facebook: string | null;

  @ApiProperty({
    example: 'https://www.instagram.com/techsolutions',
    description: 'Instagram business profile URL',
    nullable: true,
  })
  osot_affiliate_instagram: string | null;

  @ApiProperty({
    example: 'https://www.tiktok.com/@techsolutions',
    description: 'TikTok business profile URL',
    nullable: true,
  })
  osot_affiliate_tiktok: string | null;

  @ApiProperty({
    example: 'https://www.linkedin.com/company/techsolutions',
    description: 'LinkedIn company page URL',
    nullable: true,
  })
  osot_affiliate_linkedin: string | null;

  @ApiProperty({
    example: true,
    description: 'Account declaration acceptance status (read-only)',
    nullable: true,
  })
  osot_account_declaration: boolean | null;

  @ApiProperty({
    example: 'Active',
    description: 'Current account status (read-only, system-managed)',
    nullable: true,
  })
  osot_account_status: AccountStatus | string | null;
}
