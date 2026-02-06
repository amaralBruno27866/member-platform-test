/**
 * Create OT Education DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Input validation with proper error handling
 * - enums: Uses centralized enums for validation
 * - validators: Uses OT Education validators including OData binding validation
 * - integrations: Ready for DataverseService integration
 *
 * CREATION REQUIREMENTS:
 * - Extends OtEducationBasicDto for all field validation
 * - OData binding for Account relationship (required for creation)
 * - COTO registration business rules validation
 * - University-country alignment validation
 * - Optional system GUID for advanced scenarios
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Allow } from 'class-validator';
import { OtEducationBasicDto } from './ot-education-basic.dto';

/**
 * DTO for creating new OT Education records
 *
 * Extends OtEducationBasicDto which includes:
 * - All COTO business rules validation
 * - University-country alignment validation
 * - Graduation year validation
 * - Custom validators for data integrity
 *
 * Adds required Account binding for Dataverse relationships
 */
export class CreateOtEducationDto extends OtEducationBasicDto {
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
