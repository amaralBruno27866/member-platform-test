/**
 * Create OTA Education For Account DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - enums: Uses centralized enums for validation
 * - validators: Uses OTA Education custom validators
 * - integrations: Ready for DataverseService integration
 *
 * ACCOUNT INTEGRATION FIELDS:
 * - User Business ID (provided by account integration)
 * - Work Declaration (business required for OTA)
 * - OTA Degree Type, College, Graduation Year (business required)
 * - Education Category, Country, Additional Details (optional)
 *
 * VALIDATION RULES:
 * - Work Declaration: Must be explicit true/false
 * - College-Country Alignment: College must match country
 * - Graduation Year: Business validation rules
 * - Additional Details: Max 100 characters
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

export class CreateOtaEducationForAccountDto {
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
    example: true,
    description:
      'Work declaration (business required for OTA, must be explicit true/false)',
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
