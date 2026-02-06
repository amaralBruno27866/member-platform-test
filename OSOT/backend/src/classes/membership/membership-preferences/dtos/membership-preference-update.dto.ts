/**
 * Update Membership Preference DTO
 * Simplified DTO for user preference updates - only editable preference fields
 *
 * PHILOSOPHY:
 * - Users can only update their preference choices, not system fields
 * - Same fields as CreateDto (auto_renewal + preference choices)
 * - All fields are optional for partial updates
 * - System fields (year, lookups, privilege) are NOT editable by users
 *
 * USAGE CONTEXT:
 * - PATCH /private/membership-preferences/me (user self-service)
 * - PATCH /private/membership-preferences/:id (admin updates)
 * - Supports partial updates (only provided fields are updated)
 *
 * BUSINESS RULES:
 * - All fields are optional (partial update support)
 * - Field availability validated based on user's category at service layer
 * - Cannot change system fields (year, category, account/affiliate references)
 * - All enum fields must match their respective choice definitions
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  Validate,
} from 'class-validator';

// Local enums integration
import { ThirdParties } from '../enums/third-parties.enum';
import { PracticePromotion } from '../enums/practice-promotion.enum';
import { SearchTools } from '../enums/search-tools.enum';
import { PsychotherapySupervision } from '../enums/psychotherapy-supervision.enum';

// Validators integration
import {
  ThirdPartiesValidator,
  PracticePromotionValidator,
  SearchToolsValidator,
  PsychotherapySupervisionValidator,
  ShadowingValidator,
  AutoRenewalValidator,
} from '../validators/membership-preference.validators';

/**
 * Update DTO - Only editable preference fields
 * Mirrors CreateDto but all fields are optional
 */
export class UpdateMembershipPreferenceDto {
  // ========================================
  // AUTO RENEWAL FIELD
  // ========================================

  @ApiProperty({
    example: false,
    description:
      'Auto renewal preference for next membership year (boolean, optional)',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Auto renewal must be a boolean' })
  @Validate(AutoRenewalValidator)
  osot_auto_renewal?: boolean;

  @ApiProperty({
    example: true,
    description:
      'Membership declaration - User acceptance of membership terms and conditions (boolean, optional for updates)',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Membership declaration must be a boolean' })
  osot_membership_declaration?: boolean;

  // ========================================
  // PREFERENCE CHOICE FIELDS (all optional)
  // ========================================

  @ApiProperty({
    example: [ThirdParties.RECRUITMENT, ThirdParties.PRODUCT],
    description:
      'Third parties preferences - Share contact with recruitment agencies, product companies, etc. (multi-select, optional)',
    enum: ThirdParties,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Third parties must be an array' })
  @IsEnum(ThirdParties, {
    each: true,
    message: 'Each value must be a valid third parties option',
  })
  @Validate(ThirdPartiesValidator)
  osot_third_parties?: ThirdParties[];

  @ApiProperty({
    example: [PracticePromotion.SELF, PracticePromotion.EMPLOYER],
    description:
      'Practice promotion preferences - How to promote OT practice (multi-select, optional, category-dependent: OT_LIFE, OT_NG, OT_PR)',
    enum: PracticePromotion,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Practice promotion must be an array' })
  @IsEnum(PracticePromotion, {
    each: true,
    message: 'Each value must be a valid practice promotion option',
  })
  @Validate(PracticePromotionValidator)
  osot_practice_promotion?: PracticePromotion[];

  @ApiProperty({
    example: [SearchTools.PROFESSIONAL_NETWORKS, SearchTools.EXAM_MENTORING],
    description:
      'Search tools preferences - Visibility in member directories and search tools (multi-select, optional, category-dependent: 5-tier matrix)',
    enum: SearchTools,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Search tools must be an array' })
  @IsEnum(SearchTools, {
    each: true,
    message: 'Each value must be a valid search tools option',
  })
  @Validate(SearchToolsValidator)
  osot_search_tools?: SearchTools[];

  @ApiProperty({
    example: [
      PsychotherapySupervision.COGNITIVE_BEHAVIOURAL,
      PsychotherapySupervision.MINDFULNESS,
    ],
    description:
      'Psychotherapy supervision preferences - Types of supervision offered (multi-select, optional, category-dependent: OT_LIFE, OT_PR)',
    enum: PsychotherapySupervision,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Psychotherapy supervision must be an array' })
  @IsEnum(PsychotherapySupervision, {
    each: true,
    message: 'Each value must be a valid psychotherapy supervision option',
  })
  @Validate(PsychotherapySupervisionValidator)
  osot_psychotherapy_supervision?: PsychotherapySupervision[];

  @ApiProperty({
    example: true,
    description:
      'Shadowing preference - Willing to accept shadowing requests (boolean, optional, category-dependent: OT categories only)',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Shadowing must be a boolean' })
  @Validate(ShadowingValidator)
  osot_shadowing?: boolean;
}
