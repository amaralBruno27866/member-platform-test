/**
 * Update OTA Education DTO
 * Independent DTO for OTA education updates without account lookup requirement
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Contains all OTA education fields without account relationship binding
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
 * - OTA education updates via user self-service endpoints (/me routes)
 * - Partial profile updates without admin privileges
 * - User education management operations
 * - JWT-authenticated operations where account context is implicit
 *
 * BUSINESS RULES:
 * - All fields are optional, allowing granular updates
 * - Work declaration business rules still apply when provided
 * - College-country alignment validation when relevant fields updated
 * - Account relationship handled implicitly via authentication context
 *
 * VALIDATION BEHAVIOR:
 * - Field-level validators run only on provided fields
 * - Cross-field validation runs when multiple related fields are updated
 * - Maintains data integrity through service-layer business rule checks
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  MaxLength,
  Validate,
} from 'class-validator';

// Essential modules integration
import { DegreeType, OtaCollege, Country } from '../../../../common/enums';

// OTA Education validators integration
import {
  IsOtaDegreeTypeValid,
  IsCollegeCountryAligned,
  IsOtaOtherLengthValid,
} from '../validators/ota-education.validators';

export class UpdateOtaEducationDto {
  // ========================================
  // ESSENTIAL EDUCATION FIELDS
  // ========================================

  @ApiPropertyOptional({
    example: DegreeType.DIPLOMA_CREDENTIAL,
    description: 'OTA degree type (default: Diploma/Credential)',
    enum: DegreeType,
    enumName: 'DegreeType',
    required: false,
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
    required: false,
  })
  @IsOptional()
  @IsEnum(OtaCollege)
  @Validate(IsCollegeCountryAligned)
  osot_ota_college?: OtaCollege;

  @ApiPropertyOptional({
    example: Country.CANADA,
    description: 'Country where education was obtained (default: Canada)',
    enum: Country,
    enumName: 'Country',
    required: false,
  })
  @IsOptional()
  @IsEnum(Country)
  @Validate(IsCollegeCountryAligned)
  osot_ota_country?: Country;

  @ApiPropertyOptional({
    example: 'Additional OTA certification in Mental Health',
    description: 'Additional OTA education information (max 100 chars)',
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Validate(IsOtaOtherLengthValid)
  osot_ota_other?: string;

  /**
   * Usage notes:
   * - All fields from OtaEducationBasicDto are now optional for partial updates
   * - No account lookup field needed (handled via JWT authentication)
   * - College-country alignment validation applies when fields are updated
   * - OTA degree details maintain professional validation when provided
   * - Account relationship handled implicitly via authentication context
   *
   * READ-ONLY FIELDS (not updatable via this DTO):
   * - osot_work_declaration: Work declaration (set during creation only)
   * - osot_ota_grad_year: Graduation year (set during creation only)
   * - osot_education_category: Education category classification (system-managed)
   *
   * UPDATABLE FIELDS (4 fields):
   * - osot_ota_degree_type
   * - osot_ota_college
   * - osot_ota_country
   * - osot_ota_other
   */
}
