import { ApiProperty } from '@nestjs/swagger';
// Note: Enum types removed from imports as we now use string labels in responses

/**
 * DTO for public-facing Identity responses (UI/UX)
 * Contains only fields exposed to end users through public API routes.
 * System fields (GUIDs, timestamps, relationships, access control) are excluded.
 * All optional fields use null instead of undefined to ensure JSON serialization includes them.
 */
export class IdentityPublicDto {
  @ApiProperty({
    example: 'Alex',
    description: 'Preferred or chosen name',
    required: false,
    nullable: true,
  })
  osot_chosen_name?: string | null;

  @ApiProperty({
    example: ['English', 'French'],
    description: 'Language preferences (human-readable labels)',
    type: [String],
  })
  osot_language: string[];

  @ApiProperty({
    example: 'Mandarin',
    description: 'Other language not in predefined list',
    required: false,
    nullable: true,
  })
  osot_other_language?: string | null;

  @ApiProperty({
    example: 'Prefer not to disclose',
    description: 'Gender identity (human-readable label)',
    type: 'string',
    required: false,
    nullable: true,
  })
  osot_gender?: string | null;

  @ApiProperty({
    example: 'Other',
    description: 'Racial identity (human-readable label)',
    type: 'string',
    required: false,
    nullable: true,
  })
  osot_race?: string | null;

  @ApiProperty({
    example: false,
    description: 'Indigenous identity status',
    required: false,
    nullable: true,
  })
  osot_indigenous?: boolean | null;

  @ApiProperty({
    example: 'First Nations',
    description: 'Specific Indigenous identity (human-readable label)',
    type: 'string',
    required: false,
    nullable: true,
  })
  osot_indigenous_detail?: string | null;

  @ApiProperty({
    example: 'Mohawk Nation',
    description: 'Other Indigenous identity description',
    required: false,
    nullable: true,
  })
  osot_indigenous_detail_other?: string | null;

  @ApiProperty({
    example: false,
    description: 'Disability status for accommodation purposes',
    required: false,
    nullable: true,
  })
  osot_disability?: boolean | null;
}
