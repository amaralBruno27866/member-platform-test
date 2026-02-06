/**
 * Update OT Education DTO
 * Independent DTO for OT education updates without account lookup requirement
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Contains all OT education fields without account relationship binding
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
 * - OT education updates via user self-service endpoints (/me routes)
 * - Partial profile updates without admin privileges
 * - User education management operations
 * - JWT-authenticated operations where account context is implicit
 *
 * BUSINESS RULES:
 * - All fields are optional, allowing granular updates
 * - COTO registration business rules still apply when provided
 * - University-country alignment validation when relevant fields updated
 * - Account relationship handled implicitly via authentication context
 *
 * VALIDATION BEHAVIOR:
 * - Field-level validators run only on provided fields
 * - Cross-field validation runs when multiple related fields are updated
 * - Maintains data integrity through service-layer business rule checks
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  Validate,
} from 'class-validator';

// Essential modules integration
import {
  CotoStatus,
  DegreeType,
  OtUniversity,
  Country,
} from '../../../../common/enums';

// OT Education validators integration
import {
  IsCotoRegistrationFormat,
  IsCotoStatusRegistrationValid,
  IsUniversityCountryAligned,
  IsValidOtOther,
} from '../validators/ot-education.validators';

export class UpdateOtEducationDto {
  // ========================================
  // ESSENTIAL EDUCATION FIELDS
  // ========================================

  @ApiProperty({
    example: CotoStatus.GENERAL,
    description: 'COTO professional status (business required)',
    enum: CotoStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(CotoStatus)
  @Validate(IsCotoStatusRegistrationValid)
  osot_coto_status?: CotoStatus;

  @ApiPropertyOptional({
    example: 'AB123456',
    description:
      'COTO registration number (8 chars max, required for General/Provisional status)',
    maxLength: 8,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  @Validate(IsCotoRegistrationFormat)
  @Validate(IsCotoStatusRegistrationValid)
  osot_coto_registration?: string;

  @ApiProperty({
    example: DegreeType.MASTERS,
    description: 'Occupational Therapy degree type (business required)',
    enum: DegreeType,
    required: false,
  })
  @IsOptional()
  @IsEnum(DegreeType)
  osot_ot_degree_type?: DegreeType;

  @ApiProperty({
    example: OtUniversity.UNIVERSITY_OF_TORONTO,
    description: 'University where OT degree was obtained (business required)',
    enum: OtUniversity,
    required: false,
  })
  @IsOptional()
  @IsEnum(OtUniversity)
  @Validate(IsUniversityCountryAligned)
  osot_ot_university?: OtUniversity;

  @ApiProperty({
    example: Country.CANADA,
    description: 'Country where education was obtained (business required)',
    enum: Country,
    required: false,
  })
  @IsOptional()
  @IsEnum(Country)
  @Validate(IsUniversityCountryAligned)
  osot_ot_country?: Country;

  @ApiPropertyOptional({
    example: 'Additional certification in Hand Therapy',
    description: 'Additional education details (100 chars max)',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Validate(IsValidOtOther)
  osot_ot_other?: string;

  /**
   * Usage notes:
   * - All fields from OtEducationBasicDto are now optional for partial updates
   * - No account lookup field needed (handled via JWT authentication)
   * - COTO status/registration alignment still enforced when provided
   * - University-country alignment validation applies when fields are updated
   * - OT degree details maintain professional validation when provided
   * - Account relationship handled implicitly via authentication context
   *
   * READ-ONLY FIELDS (not updatable via this DTO):
   * - osot_ot_grad_year: Year of graduation (set during creation only)
   * - osot_education_category: Education category classification (system-managed)
   *
   * UPDATABLE FIELDS (6 fields):
   * - osot_coto_status
   * - osot_coto_registration
   * - osot_ot_degree_type
   * - osot_ot_university
   * - osot_ot_country
   * - osot_ot_other
   */
}
