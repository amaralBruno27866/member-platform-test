/**
 * Create OT Education For Account DTO
 *
 * SPECIALIZED DTO FOR ACCOUNT INTEGRATION:
 * - Contains only fields necessary for account creation workflow
 * - Excludes system-controlled fields (osot_user_business_id, access modifiers)
 * - Optimized for user registration process
 * - Follows Contact service patterns for consistency
 *
 * FIELDS INCLUDED:
 * - COTO Status and Registration (professional validation)
 * - OT Degree Type, University, Graduation Year (academic credentials)
 * - Country, Additional Details (supplementary info)
 *
 * SYSTEM-CONTROLLED FIELDS (excluded):
 * - osot_user_business_id (auto-generated during account linking)
 * - osot_education_category (auto-determined based on graduation year and business rules)
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
} from '../../../../common/enums';
import {
  IsCotoRegistrationFormat,
  IsCotoStatusRegistrationValid,
  IsUniversityCountryAligned,
  IsValidGraduationYear,
  IsValidOtOther,
} from '../validators/ot-education.validators';

export class CreateOtEducationForAccountDto {
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

  @ApiProperty({
    description:
      'User business ID for account relationship. Will be set automatically by orchestrator.',
    example: 'osot-0000123',
    required: false,
  })
  @IsOptional()
  @IsString()
  osot_user_business_id?: string;

  // ========================================
  // ESSENTIAL EDUCATION FIELDS
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
