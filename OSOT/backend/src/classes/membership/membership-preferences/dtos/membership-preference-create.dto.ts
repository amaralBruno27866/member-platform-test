/**
 * Create Membership Preference DTO
 * Simplified version for preference creation (user provides only preference choices)
 *
 * EXCLUDED FIELDS (Auto-determined by system):
 * - osot_membership_year: Determined from active membership-settings
 * - osot_Table_Membership_Category@odata.bind: Looked up from user's membership-category
 * - osot_Table_Account@odata.bind: Extracted from JWT token
 * - osot_Table_Account_Affiliate@odata.bind: Extracted from JWT token
 *
 * USAGE CONTEXT:
 * - POST /private/membership-preferences/me (self-service)
 * - POST /private/membership-preferences (admin, with system fields added by controller)
 * - User only provides preference choices
 * - System automatically determines year, category, and user references
 *
 * BUSINESS RULES:
 * - Auto renewal is required (boolean)
 * - All enum fields must match their respective choice definitions
 * - Field availability validated based on user's category
 * - One preference per user per year (enforced at service layer)
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  Validate,
  IsNotEmpty,
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

export class CreateMembershipPreferenceDto {
  // ========================================
  // BUSINESS REQUIRED FIELDS
  // ========================================

  @ApiProperty({
    example: false,
    description:
      'Auto renewal preference for next membership year (boolean, required)',
    type: 'boolean',
  })
  @IsNotEmpty({ message: 'Auto renewal is required' })
  @IsBoolean({ message: 'Auto renewal must be a boolean' })
  @Validate(AutoRenewalValidator)
  osot_auto_renewal: boolean;

  @ApiProperty({
    example: true,
    description:
      'Membership declaration - User must accept membership terms and conditions (boolean, required, must be true to proceed)',
    type: 'boolean',
  })
  @IsNotEmpty({ message: 'Membership declaration is required' })
  @IsBoolean({ message: 'Membership declaration must be a boolean' })
  osot_membership_declaration: boolean;

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
