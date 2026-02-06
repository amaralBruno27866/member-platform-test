/**
 * OTA Education Basic DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Input validation with proper error handling
 * - enums: Uses centralized enums for validation
 * - validators: Uses OTA Education custom validators
 * - integrations: Ready for DataverseService integration
 *
 * USER-EDITABLE FIELDS ONLY:
 * - Work Declaration (business required for OTA)
 * - OTA Degree Type, College, Graduation Year (business required)
 * - Education Category, Country, Additional Details (optional/required)
 *
 * SYSTEM-CONTROLLED FIELDS (excluded from user input):
 * - osot_user_business_id (auto-generated during account linking)
 * - osot_ota_education_id (auto-generated autonumber)
 * - osot_access_modifiers (system defaults)
 * - osot_privilege (system defaults)
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  IsEnum,
  IsBoolean,
  Validate,
  Allow,
} from 'class-validator';
import {
  DegreeType,
  GraduationYear,
  OtaCollege,
  Country,
} from '../../../../common/enums';
import {
  IsWorkDeclarationExplicit,
  IsOtaDegreeTypeValid,
  IsCollegeCountryAligned,
  IsOtaOtherLengthValid,
} from '../validators/ota-education.validators';

export class OtaEducationBasicDto {
  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================

  @ApiProperty({
    description:
      'OData bind for Account. Example: "/osot_table_accounts(<GUID>)"',
    example: '',
    required: false,
  })
  @IsOptional()
  @Allow()
  ['osot_Table_Account@odata.bind']?: string;

  // ========================================
  // EDUCATION FIELDS
  // ========================================

  @ApiProperty({
    example: true,
    description:
      'Work declaration (business required, must be explicit true/false)',
  })
  @IsNotEmpty()
  @IsBoolean()
  @Validate(IsWorkDeclarationExplicit)
  osot_work_declaration: boolean;

  @ApiPropertyOptional({
    example: DegreeType.DIPLOMA_CREDENTIAL,
    description: 'OTA degree type (default: Diploma/Credential)',
    enum: DegreeType,
    enumName: 'DegreeType',
  })
  @IsOptional()
  @IsEnum(DegreeType)
  @Validate(IsOtaDegreeTypeValid)
  osot_ota_degree_type?: DegreeType;

  @ApiPropertyOptional({
    example: OtaCollege.ALGONQUIN_COLLEGE,
    description: 'OTA college (must align with country selection)',
    enum: OtaCollege,
    enumName: 'OtaCollege',
  })
  @IsOptional()
  @IsEnum(OtaCollege)
  @Validate(IsCollegeCountryAligned)
  osot_ota_college?: OtaCollege;

  @ApiPropertyOptional({
    example: GraduationYear.YEAR_2020,
    description: 'OTA graduation year',
    enum: GraduationYear,
    enumName: 'GraduationYear',
  })
  @IsOptional()
  @IsEnum(GraduationYear)
  osot_ota_grad_year?: GraduationYear;

  // NOTE: osot_education_category is SYSTEM CONTROLLED
  // This field is automatically determined by the backend based on:
  // - Graduation year (osot_ota_grad_year)
  // - Business rules for NEW_GRADUATED vs GRADUATED classification
  // - Current date calculations
  // Removed from DTO to prevent user manipulation and ensure data integrity

  @ApiPropertyOptional({
    example: Country.CANADA,
    description: 'Country where education was obtained (default: Canada)',
    enum: Country,
    enumName: 'Country',
  })
  @IsOptional()
  @IsEnum(Country)
  @Validate(IsCollegeCountryAligned)
  osot_ota_country?: Country;

  @ApiPropertyOptional({
    example: 'Additional OTA certification in Mental Health',
    description: 'Additional OTA education information (max 100 chars)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Validate(IsOtaOtherLengthValid)
  osot_ota_other?: string;
}
