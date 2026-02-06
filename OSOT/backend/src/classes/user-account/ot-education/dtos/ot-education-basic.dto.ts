/**
 * OT Education Basic DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Input validation with proper error handling
 * - enums: Uses centralized enums for validation
 * - validators: Uses OT Education custom validators
 * - integrations: Ready for DataverseService integration
 *
 * USER-EDITABLE FIELDS ONLY:
 * - COTO Status and Registration (business rules)
 * - OT Degree Type, University, Graduation Year (business required)
 * - Education Category, Country, Additional Details (optional/required)
 *
 * SYSTEM-CONTROLLED FIELDS (excluded from user input):
 * - osot_user_business_id (auto-generated during account linking)
 * - osot_access_modifiers (system defaults)
 * - osot_privilege (system defaults)
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  Validate,
  IsEnum,
  Allow,
} from 'class-validator';
import {
  CotoStatus,
  DegreeType,
  GraduationYear,
  OtUniversity,
  Country,
  EducationCategory,
} from '../../../../common/enums';
import {
  IsCotoRegistrationFormat,
  IsCotoStatusRegistrationValid,
  IsUniversityCountryAligned,
  IsValidGraduationYear,
  IsValidOtOther,
} from '../validators/ot-education.validators';

export class OtEducationBasicDto {
  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================

  @ApiProperty({
    description:
      'OData bind for Account. Example: "/osot_table_accounts(<GUID>)"',
    example: '/osot_table_accounts/b1a2c3d4-e5f6-7890-abcd-1234567890ef',
    required: false,
  })
  @IsOptional()
  @Allow()
  ['osot_Table_Account@odata.bind']?: string;

  // ========================================
  // EDUCATION FIELDS
  // ========================================

  @ApiProperty({
    example: CotoStatus.GENERAL,
    description: 'COTO professional status (business required)',
    enum: CotoStatus,
  })
  @IsEnum(CotoStatus)
  @IsNotEmpty()
  @Validate(IsCotoStatusRegistrationValid)
  osot_coto_status: CotoStatus;

  @ApiPropertyOptional({
    example: 'AB123456',
    description:
      'COTO registration number (8 chars max, required for General/Provisional status)',
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
    description: 'Occupational Therapy degree type (business required)',
    enum: DegreeType,
  })
  @IsEnum(DegreeType)
  @IsNotEmpty()
  osot_ot_degree_type: DegreeType;

  @ApiProperty({
    example: OtUniversity.UNIVERSITY_OF_TORONTO,
    description: 'University where OT degree was obtained (business required)',
    enum: OtUniversity,
  })
  @IsEnum(OtUniversity)
  @IsNotEmpty()
  @Validate(IsUniversityCountryAligned)
  osot_ot_university: OtUniversity;

  @ApiProperty({
    example: GraduationYear.YEAR_2020,
    description: 'Year of graduation (business required)',
    enum: GraduationYear,
  })
  @IsEnum(GraduationYear)
  @IsNotEmpty()
  @Validate(IsValidGraduationYear)
  osot_ot_grad_year: GraduationYear;

  @ApiPropertyOptional({
    example: EducationCategory.GRADUATED,
    description: 'Education category classification',
    enum: EducationCategory,
  })
  @IsOptional()
  @IsEnum(EducationCategory)
  osot_education_category?: EducationCategory;

  @ApiProperty({
    example: Country.CANADA,
    description: 'Country where education was obtained (business required)',
    enum: Country,
  })
  @IsEnum(Country)
  @IsNotEmpty()
  @Validate(IsUniversityCountryAligned)
  osot_ot_country: Country;

  @ApiPropertyOptional({
    example: 'Additional certification in Hand Therapy',
    description: 'Additional education details (100 chars max)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Validate(IsValidOtOther)
  osot_ot_other?: string;
}
