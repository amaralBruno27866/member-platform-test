/**
 * Audience Target Response DTO
 * Simplified response for user-facing endpoints
 *
 * FIELDS EXPOSED:
 * - System fields: ID, business ID, timestamps
 * - Product relationship: GUID and alternative value
 * - All 35 multiple choice fields (as number arrays)
 *
 * USAGE CONTEXT:
 * - GET /private/audience-target (list all targets)
 * - GET /private/audience-target/:id (get target by ID)
 * - GET /private/audience-target/product/:productId (get target by product)
 * - POST /private/audience-target (creation response)
 * - PATCH /private/audience-target/:id (update response)
 * - Returns complete target information for frontend consumption
 * - Excludes internal metadata and owner references
 *
 * NOTE: Enum values returned as numbers (Dataverse format)
 * - Frontend can map to human-readable labels using enum helper functions
 * - Internal format maintained for consistency with other entities
 */

import { ApiProperty } from '@nestjs/swagger';

export class AudienceTargetResponseDto {
  // ========================================
  // SYSTEM FIELDS (Read-only)
  // ========================================

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-123456789012',
    description: 'Primary key (GUID)',
    type: 'string',
  })
  osot_table_audience_targetid: string;

  @ApiProperty({
    example: 'osot-tgt-0000001',
    description: 'Business ID (autonumber)',
    type: 'string',
  })
  osot_target: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Creation timestamp',
    type: 'string',
  })
  createdon: string;

  @ApiProperty({
    example: '2024-01-20T14:45:00Z',
    description: 'Last modification timestamp',
    type: 'string',
  })
  modifiedon: string;

  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================

  @ApiProperty({
    example: 'p1r2o3d4-u5c6-7890-abcd-product123456',
    description: 'Product lookup (GUID)',
    type: 'string',
    required: false,
  })
  osot_table_product?: string;

  @ApiProperty({
    example: 'osot-prod-0000123',
    description: 'Product alternative value (business ID)',
    type: 'string',
    required: false,
  })
  _osot_table_product_value?: string;

  // ========================================
  // ACCOUNT GROUP (1 field)
  // ========================================

  @ApiProperty({
    example: [1, 2],
    description: 'Account groups to target (enum values)',
    type: [Number],
    required: false,
  })
  osot_account_group?: number[];

  // ========================================
  // AFFILIATE (3 fields)
  // ========================================

  @ApiProperty({
    example: [1, 5],
    description: 'Affiliate service areas (enum values)',
    type: [Number],
    required: false,
  })
  osot_affiliate_area?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Affiliate cities (enum values)',
    type: [Number],
    required: false,
  })
  osot_affiliate_city?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Affiliate provinces (enum values)',
    type: [Number],
    required: false,
  })
  osot_affiliate_province?: number[];

  // ========================================
  // ADDRESS (2 fields)
  // ========================================

  @ApiProperty({
    example: [1, 2],
    description: 'Member cities (enum values)',
    type: [Number],
    required: false,
  })
  osot_membership_city?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Member provinces (enum values)',
    type: [Number],
    required: false,
  })
  osot_province?: number[];

  // ========================================
  // IDENTITY (4 fields)
  // ========================================

  @ApiProperty({
    example: [1, 2],
    description: 'Gender identities (enum values)',
    type: [Number],
    required: false,
  })
  osot_gender?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Indigenous details (enum values)',
    type: [Number],
    required: false,
  })
  osot_indigenous_details?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Language preferences (enum values)',
    type: [Number],
    required: false,
  })
  osot_language?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Racial identities (enum values)',
    type: [Number],
    required: false,
  })
  osot_race?: number[];

  // ========================================
  // MEMBERSHIP CATEGORY (2 fields)
  // ========================================

  @ApiProperty({
    example: [1, 2],
    description: 'Affiliate eligibility (enum values)',
    type: [Number],
    required: false,
  })
  osot_eligibility_affiliate?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Membership categories (enum values)',
    type: [Number],
    required: false,
  })
  osot_membership_category?: number[];

  // ========================================
  // EMPLOYMENT (9 fields)
  // ========================================

  @ApiProperty({
    example: [1, 2],
    description: 'Hourly earnings ranges (enum values)',
    type: [Number],
    required: false,
  })
  osot_earnings?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Self-employed direct earnings (enum values)',
    type: [Number],
    required: false,
  })
  osot_earnings_selfdirect?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Self-employed indirect earnings (enum values)',
    type: [Number],
    required: false,
  })
  osot_earnings_selfindirect?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Employment benefits (enum values)',
    type: [Number],
    required: false,
  })
  osot_employment_benefits?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Employment status (enum values)',
    type: [Number],
    required: false,
  })
  osot_employment_status?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Position funding sources (enum values)',
    type: [Number],
    required: false,
  })
  osot_position_funding?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Years in practice (enum values)',
    type: [Number],
    required: false,
  })
  osot_practice_years?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Role descriptors (enum values)',
    type: [Number],
    required: false,
  })
  osot_role_description?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Work hours per week (enum values)',
    type: [Number],
    required: false,
  })
  osot_work_hours?: number[];

  // ========================================
  // PRACTICE (4 fields)
  // ========================================

  @ApiProperty({
    example: [1, 2],
    description: 'Client age groups served (enum values)',
    type: [Number],
    required: false,
  })
  osot_client_age?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Practice areas (enum values)',
    type: [Number],
    required: false,
  })
  osot_practice_area?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Practice services offered (enum values)',
    type: [Number],
    required: false,
  })
  osot_practice_services?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Practice settings/environments (enum values)',
    type: [Number],
    required: false,
  })
  osot_practice_settings?: number[];

  // ========================================
  // PREFERENCE (4 fields)
  // ========================================

  @ApiProperty({
    example: [1, 2],
    description: 'Search tool preferences (enum values)',
    type: [Number],
    required: false,
  })
  osot_membership_search_tools?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Practice promotion preferences (enum values)',
    type: [Number],
    required: false,
  })
  osot_practice_promotion?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Psychotherapy supervision types (enum values)',
    type: [Number],
    required: false,
  })
  osot_psychotherapy_supervision?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'Third-party interests (enum values)',
    type: [Number],
    required: false,
  })
  osot_third_parties?: number[];

  // ========================================
  // EDUCATION OT (3 fields)
  // ========================================

  @ApiProperty({
    example: [1, 2],
    description: 'COTO registration status (enum values)',
    type: [Number],
    required: false,
  })
  osot_coto_status?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'OT graduation years (enum values)',
    type: [Number],
    required: false,
  })
  osot_ot_grad_year?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'OT universities attended (enum values)',
    type: [Number],
    required: false,
  })
  osot_ot_university?: number[];

  // ========================================
  // EDUCATION OTA (2 fields)
  // ========================================

  @ApiProperty({
    example: [1, 2],
    description: 'OTA graduation years (enum values)',
    type: [Number],
    required: false,
  })
  osot_ota_grad_year?: number[];

  @ApiProperty({
    example: [1, 2],
    description: 'OTA colleges attended (enum values)',
    type: [Number],
    required: false,
  })
  osot_ota_college?: number[];
}
