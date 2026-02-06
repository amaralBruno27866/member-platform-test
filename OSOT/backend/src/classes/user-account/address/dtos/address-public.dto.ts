import { ApiProperty } from '@nestjs/swagger';
// Note: Enum types removed from imports as we now use string labels in responses

/**
 * DTO for public-facing Address responses (UI/UX)
 * Contains only fields exposed to end users through public API routes.
 * System fields (GUIDs, timestamps, relationships, access control) are excluded.
 */
export class AddressPublicDto {
  @ApiProperty({
    example: '123 Main Street',
    description: 'Address line 1',
  })
  osot_address_1: string;

  @ApiProperty({
    example: 'Unit 456',
    description: 'Address line 2 (optional)',
    required: false,
  })
  osot_address_2?: string;

  @ApiProperty({
    example: 'Toronto',
    description: 'City (human-readable label)',
    type: 'string',
  })
  osot_city: string;

  @ApiProperty({
    example: 'Ontario',
    description: 'Province (human-readable label)',
    type: 'string',
  })
  osot_province: string;

  @ApiProperty({
    example: 'K1A 0A6',
    description: 'Postal code (Canadian format)',
  })
  osot_postal_code: string;

  @ApiProperty({
    example: 'Canada',
    description: 'Country (human-readable label)',
    type: 'string',
  })
  osot_country: string;

  @ApiProperty({
    example: 'Home',
    description: 'Address type (human-readable label)',
    type: 'string',
  })
  osot_address_type: string;

  @ApiProperty({
    description: 'Address preferences (human-readable labels)',
    type: [String],
    example: ['Mail', 'Shipping'],
    required: false,
  })
  osot_address_preference?: string[];

  @ApiProperty({
    example: 'Other City Name',
    description: 'Other city (optional)',
    required: false,
  })
  osot_other_city?: string;

  @ApiProperty({
    example: 'Other Province/State',
    description: 'Other province or state (optional)',
    required: false,
  })
  osot_other_province_state?: string;
}
