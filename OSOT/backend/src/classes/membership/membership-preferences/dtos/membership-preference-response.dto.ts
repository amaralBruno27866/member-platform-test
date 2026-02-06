/**
 * Membership Preference Response DTO
 * Simplified response for user-facing endpoints
 *
 * FIELDS EXPOSED:
 * - osot_membership_year: Current membership year
 * - osot_auto_renewal: Auto renewal preference
 * - osot_third_parties: Third parties communication preferences (human-readable labels)
 * - osot_practice_promotion: Practice promotion preferences (human-readable labels)
 * - osot_search_tools: Search tools visibility preferences (human-readable labels)
 * - osot_psychotherapy_supervision: Psychotherapy supervision types (human-readable labels)
 * - osot_shadowing: Shadowing acceptance preference
 *
 * USAGE CONTEXT:
 * - GET /private/membership-preferences/me (self-service endpoint)
 * - POST /private/membership-preferences/me (creation response)
 * - PATCH /private/membership-preferences/me (update response)
 * - Returns only user-relevant preference fields
 * - Excludes system fields, lookups, and metadata
 * - Clean response for frontend consumption
 *
 * NOTE: Enum values converted to human-readable strings in Response DTO
 * - Internal types maintain enums for business logic
 * - Response DTO returns strings for API consumption
 */

import { ApiProperty } from '@nestjs/swagger';

export class MembershipPreferenceResponseDto {
  // ========================================
  // IDENTIFICATION
  // ========================================

  @ApiProperty({
    example: 'osot-pref-0000001',
    description: 'Business ID for the preference record',
    type: 'string',
    required: false,
  })
  osot_preference_id?: string;

  // ========================================
  // MEMBERSHIP YEAR
  // ========================================

  @ApiProperty({
    example: '2025',
    description: 'Membership year (4-digit year)',
    type: 'string',
  })
  osot_membership_year: string;

  // ========================================
  // AUTO RENEWAL
  // ========================================

  @ApiProperty({
    example: false,
    description: 'Auto renewal preference for next membership year',
    type: 'boolean',
  })
  osot_auto_renewal: boolean;

  @ApiProperty({
    example: true,
    description:
      'Membership declaration - User acceptance of membership terms and conditions',
    type: 'boolean',
  })
  osot_membership_declaration: boolean;

  // ========================================
  // PREFERENCE FIELDS
  // ========================================

  @ApiProperty({
    example: ['Recruitment', 'Product'],
    description:
      'Third parties communication preferences (human-readable labels)',
    type: [String],
    required: false,
  })
  osot_third_parties?: string[];

  @ApiProperty({
    example: ['Self', 'Employer'],
    description:
      'Practice promotion preferences (human-readable labels, category-dependent)',
    type: [String],
    required: false,
  })
  osot_practice_promotion?: string[];

  @ApiProperty({
    example: ['Professional Networks', 'Exam Mentoring'],
    description:
      'Search tools visibility preferences (human-readable labels, category-dependent)',
    type: [String],
    required: false,
  })
  osot_search_tools?: string[];

  @ApiProperty({
    example: ['Cognitive Behavioural', 'Mindfulness'],
    description:
      'Psychotherapy supervision types offered (human-readable labels, category-dependent)',
    type: [String],
    required: false,
  })
  osot_psychotherapy_supervision?: string[];

  @ApiProperty({
    example: true,
    description:
      'Shadowing acceptance preference (category-dependent: OT categories only)',
    type: 'boolean',
    required: false,
  })
  osot_shadowing?: boolean;
}
