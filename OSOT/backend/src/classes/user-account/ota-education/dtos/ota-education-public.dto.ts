import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for public-facing OTA Education responses (UI/UX)
 * Contains only fields exposed to end users through public API routes.
 * System fields (GUIDs, timestamps, relationships, access control) are excluded.
 *
 * VIEW FIELDS (7 fields - for GET requests):
 * - osot_ota_degree_type
 * - osot_ota_college
 * - osot_ota_grad_year
 * - osot_education_category
 * - osot_ota_country
 * - osot_ota_other
 * - osot_work_declaration
 *
 * UPDATE FIELDS (4 fields - for PATCH requests):
 * - osot_ota_degree_type
 * - osot_ota_college
 * - osot_ota_country
 * - osot_ota_other
 *
 * EXCLUDED FIELDS (not visible in UI/UX):
 * - osot_table_ota_educationid (system GUID)
 * - osot_ota_education_id (business ID)
 * - osot_user_business_id (business reference)
 * - osot_table_account (relationship GUID)
 * - createdon, modifiedon (timestamps)
 * - ownerid (ownership)
 * - osot_access_modifiers (access control)
 * - osot_privilege (permissions)
 */
export class OtaEducationPublicDto {
  @ApiProperty({
    example: 'Diploma/Credential',
    description: 'OTA degree type',
    nullable: true,
  })
  osot_ota_degree_type: string | null;

  @ApiProperty({
    example: 'Algonquin College',
    description: 'OTA college',
    nullable: true,
  })
  osot_ota_college: string | null;

  @ApiProperty({
    example: '2020',
    description: 'OTA graduation year',
    nullable: true,
  })
  osot_ota_grad_year: string | null;

  @ApiProperty({
    example: 'Graduate',
    description: 'Education category classification',
    nullable: true,
  })
  osot_education_category: string | null;

  @ApiProperty({
    example: 'Canada',
    description: 'Country where education was obtained',
    nullable: true,
  })
  osot_ota_country: string | null;

  @ApiProperty({
    example: 'Additional OTA certification in Mental Health',
    description: 'Additional OTA education information',
    required: false,
    nullable: true,
  })
  osot_ota_other: string | null;

  @ApiProperty({
    example: true,
    description: 'Work declaration required by OTA business rules',
    nullable: true,
  })
  osot_work_declaration: boolean | null;
}
