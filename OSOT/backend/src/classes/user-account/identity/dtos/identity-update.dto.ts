/**
 * Identity Update DTO
 * Independent DTO for identity updates without account lookup requirement
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Contains all identity fields without account relationship binding
 * - All fields optional for partial updates
 * - Maintains business rule enforcement for partial updates
 * - Integrates with DataverseService for OData PATCH operations
 *
 * DATAVERSE INTEGRATION:
 * - Supports partial entity updates via OData PATCH requests
 * - Maintains field-level validation for changed properties
 * - Preserves existing values for unspecified fields
 * - No account lookup needed (handled via JWT authentication)
 *
 * USAGE CONTEXT:
 * - Identity updates via user self-service endpoints (/me routes)
 * - Partial profile updates without admin privileges
 * - User identity management operations
 * - JWT-authenticated operations where account context is implicit
 *
 * BUSINESS RULES:
 * - All fields are optional, allowing granular updates
 * - Business rule validation applies to changed combinations
 * - System-generated fields (IDs, timestamps) are excluded from updates
 * - Cultural consistency maintained (indigenous fields validation)
 * - Account relationship handled implicitly via authentication context
 *
 * VALIDATION BEHAVIOR:
 * - Field-level validators run only on provided fields
 * - Cross-field validation runs when multiple related fields are updated
 * - Maintains data integrity through service-layer business rule checks
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  Validate,
} from 'class-validator';

// Essential modules integration
import {
  Language,
  Gender,
  Race,
  IndigenousDetail,
} from '../../../../common/enums';

// Identity validators integration
import {
  IdentityChosenNameValidator,
  IdentityLanguagesValidator,
  IdentityIndigenousDetailOtherValidator,
} from '../validators/identity.validators';

export class IdentityUpdateDto {
  // ========================================
  // IDENTITY FIELDS
  // ========================================

  @ApiProperty({
    example: 'Alex',
    description: 'Preferred or chosen name (optional)',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Validate(IdentityChosenNameValidator)
  osot_chosen_name?: string;

  @ApiProperty({
    example: [Language.ENGLISH, Language.FRENCH],
    description: 'Language preferences (business required, multiple choice)',
    isArray: true,
    enum: Language,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Language, { each: true })
  @ArrayMinSize(1, { message: 'At least one language must be selected' })
  @ArrayMaxSize(10, { message: 'Maximum 10 languages allowed' })
  @Validate(IdentityLanguagesValidator)
  osot_language?: Language[];

  @ApiProperty({
    example: 'Mandarin',
    description:
      'Custom language specification when preferred language not in predefined list (optional)',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  osot_other_language?: string;

  @ApiProperty({
    example: Gender.PREFER_NOT_TO_DISCLOSE,
    description: 'Gender identity (optional)',
    enum: Gender,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  osot_gender?: Gender;

  @ApiProperty({
    example: Race.OTHER,
    description: 'Racial identity (optional)',
    enum: Race,
    required: false,
  })
  @IsOptional()
  @IsEnum(Race)
  osot_race?: Race;

  @ApiProperty({
    example: false,
    description: 'Indigenous identity status (optional)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_indigenous?: boolean;

  @ApiProperty({
    example: IndigenousDetail.FIRST_NATIONS,
    description:
      'Specific Indigenous identity (optional, requires indigenous=true)',
    enum: IndigenousDetail,
    required: false,
  })
  @IsOptional()
  @IsEnum(IndigenousDetail)
  osot_indigenous_detail?: IndigenousDetail;

  @ApiProperty({
    example: 'Mohawk Nation',
    description: 'Other Indigenous identity description (optional)',
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Validate(IdentityIndigenousDetailOtherValidator)
  osot_indigenous_detail_other?: string;

  @ApiProperty({
    example: false,
    description: 'Disability status for accommodation purposes (optional)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  osot_disability?: boolean;

  /**
   * Usage notes:
   * - All fields from IdentityBasicDto are now optional for partial updates
   * - No account lookup field needed (handled via JWT authentication)
   * - Language field supports multiple selections (1-10 languages) when provided
   * - Cultural identity fields (race, indigenous) are optional and respect user privacy
   * - Cultural consistency validation ensures Indigenous fields are properly related
   * - All optional fields can be omitted and will use appropriate defaults
   * - Account relationship handled implicitly via authentication context
   */
}
