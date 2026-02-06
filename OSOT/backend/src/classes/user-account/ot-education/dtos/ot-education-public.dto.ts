import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for public-facing OT Education responses (UI/UX)
 * Contains only fields exposed to end users through public API routes.
 * System fields (GUIDs, timestamps, relationships, access control) are excluded.
 *
 * VIEW FIELDS (8 fields - for GET requests):
 * - osot_coto_status
 * - osot_coto_registration
 * - osot_ot_degree_type
 * - osot_ot_university
 * - osot_ot_grad_year
 * - osot_education_category
 * - osot_ot_country
 * - osot_ot_other
 *
 * UPDATE FIELDS (6 fields - for PATCH requests):
 * - osot_coto_status
 * - osot_coto_registration
 * - osot_ot_degree_type
 * - osot_ot_university
 * - osot_ot_country
 * - osot_ot_other
 *
 * EXCLUDED FIELDS (not visible in UI/UX):
 * - osot_table_ot_educationid (system GUID)
 * - osot_ot_education_id (business ID)
 * - osot_user_business_id (business reference)
 * - osot_table_account (relationship GUID)
 * - createdon, modifiedon (timestamps)
 * - ownerid (ownership)
 * - osot_access_modifiers (access control)
 * - osot_privilege (permissions)
 * - Computed fields (education_summary, coto_summary, etc.)
 */
export class OtEducationPublicDto {
  @ApiProperty({
    example: 'General',
    description: 'COTO professional status',
    type: 'string',
    nullable: true,
  })
  osot_coto_status: string | null;

  @ApiProperty({
    example: 'AB123456',
    description: 'COTO registration number',
    required: false,
    nullable: true,
  })
  osot_coto_registration: string | null;

  @ApiProperty({
    example: 'Masters',
    description: 'Occupational Therapy degree type',
    type: 'string',
    nullable: true,
  })
  osot_ot_degree_type: string | null;

  @ApiProperty({
    example: 'University of Toronto',
    description: 'University where OT degree was obtained',
    type: 'string',
    nullable: true,
  })
  osot_ot_university: string | null;

  @ApiProperty({
    example: '2020',
    description: 'Year of graduation',
    type: 'string',
    nullable: true,
  })
  osot_ot_grad_year: string | null;

  @ApiProperty({
    example: 'Graduated',
    description: 'Education category classification',
    type: 'string',
    required: false,
    nullable: true,
  })
  osot_education_category: string | null;

  @ApiProperty({
    example: 'CANADA',
    description: 'Country where education was obtained',
    type: 'string',
    nullable: true,
  })
  osot_ot_country: string | null;

  @ApiProperty({
    example: 'Additional certification in Hand Therapy',
    description: 'Additional education details',
    required: false,
    nullable: true,
  })
  osot_ot_other: string | null;
}
