/**
 * Create OTA Education DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Input validation with proper error handling
 * - enums: Uses centralized enums for validation
 * - validators: Uses OTA Education validators including business rule validation
 * - integrations: Ready for DataverseService integration
 *
 * CREATION REQUIREMENTS:
 * - Extends OtaEducationBasicDto for all field validation
 * - Work declaration business rules validation
 * - College-country alignment validation
 * - All fields are user-editable (no system fields)
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Allow } from 'class-validator';
import { OtaEducationBasicDto } from './ota-education-basic.dto';

/**
 * DTO for creating new OTA Education records
 *
 * Extends OtaEducationBasicDto which includes:
 * - All work declaration business rules validation
 * - College-country alignment validation
 * - Degree type validation
 * - Custom validators for data integrity
 *
 * Adds required Account binding for Dataverse relationships
 */
export class CreateOtaEducationDto extends OtaEducationBasicDto {
  @ApiProperty({
    description:
      'OData bind for Account. Will be set automatically by orchestrator.',
    example: '',
    required: false,
  })
  @IsOptional()
  @Allow()
  ['osot_Table_Account@odata.bind']?: string;
}
