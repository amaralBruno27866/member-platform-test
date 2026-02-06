/**
 * OT Education Registration DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Input validation with proper error handling
 * - enums: Uses centralized enums for validation
 * - validators: Uses OT Education validators with focused registration validation
 * - integrations: Ready for registration orchestrator integration
 *
 * REGISTRATION CHARACTERISTICS:
 * - Streamlined for new user registration workflows
 * - Essential fields only (reduces complexity during onboarding)
 * - COTO registration business rules enforced
 * - University-country alignment validation
 * - Optimized for registration orchestrator patterns
 * - Excludes system-controlled fields (auto-generated during registration)
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  Validate,
} from 'class-validator';
import {
  CotoStatus,
  DegreeType,
  GraduationYear,
  OtUniversity,
  Country,
} from '../../../../common/enums';
import {
  IsCotoRegistrationFormat,
  IsCotoStatusRegistrationValid,
  IsUniversityCountryAligned,
  IsValidGraduationYear,
  IsValidOtOther,
} from '../validators/ot-education.validators';

/**
 * DTO for OT Education information during user registration
 *
 * Focuses on essential education credentials needed during registration:
 * - COTO professional status and registration
 * - Core education details (degree, university, graduation year, country)
 * - Optional additional details
 *
 * SYSTEM-CONTROLLED FIELDS (excluded):
 * - osot_user_business_id (auto-generated during account linking)
 * - Access modifiers and privileges (set to defaults during registration)
 */
export class OtEducationRegistrationDto {
  @ApiProperty({
    example: CotoStatus.GENERAL,
    description: 'COTO professional status (required for registration)',
    enum: CotoStatus,
  })
  @IsEnum(CotoStatus)
  @IsNotEmpty()
  @Validate(IsCotoStatusRegistrationValid)
  osot_coto_status: CotoStatus;

  @ApiPropertyOptional({
    example: 'AB123456',
    description:
      'COTO registration number (required if status is General or Provisional)',
    maxLength: 8,
  })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  @Validate(IsCotoRegistrationFormat)
  @Validate(IsCotoStatusRegistrationValid)
  osot_coto_registration?: string;

  @ApiProperty({
    example: DegreeType.MASTERS,
    description: 'Occupational Therapy degree type (required for registration)',
    enum: DegreeType,
  })
  @IsEnum(DegreeType)
  @IsNotEmpty()
  osot_ot_degree_type: DegreeType;

  @ApiProperty({
    example: OtUniversity.UNIVERSITY_OF_TORONTO,
    description:
      'University where OT degree was obtained (required for registration)',
    enum: OtUniversity,
  })
  @IsEnum(OtUniversity)
  @IsNotEmpty()
  @Validate(IsUniversityCountryAligned)
  osot_ot_university: OtUniversity;

  @ApiProperty({
    example: GraduationYear.YEAR_2020,
    description: 'Year of graduation (required for registration)',
    enum: GraduationYear,
  })
  @IsEnum(GraduationYear)
  @IsNotEmpty()
  @Validate(IsValidGraduationYear)
  osot_ot_grad_year: GraduationYear;

  @ApiProperty({
    example: Country.CANADA,
    description:
      'Country where education was obtained (required for registration)',
    enum: Country,
  })
  @IsEnum(Country)
  @IsNotEmpty()
  @Validate(IsUniversityCountryAligned)
  osot_ot_country: Country;

  @ApiPropertyOptional({
    example: 'Specialized in pediatric occupational therapy',
    description: 'Additional education details (optional during registration)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Validate(IsValidOtOther)
  osot_ot_other?: string;
}
