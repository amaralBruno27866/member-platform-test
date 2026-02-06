import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for public-facing Contact responses (UI/UX)
 * Contains only fields exposed to end users through public API routes.
 * System fields (GUIDs, timestamps, relationships, access control) are excluded.
 */
export class ContactPublicDto {
  @ApiProperty({
    example: 'secondary@example.com',
    description: 'Secondary email address',
    required: false,
  })
  osot_secondary_email?: string;

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
    example: 'Senior Developer',
    description: 'Job title',
    required: false,
  })
  osot_job_title?: string;

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
}
