/**
 * Response Membership Practices DTO
 * Complete practice data response with system-provided fields
 *
 * INCLUDED FIELDS: 8 total
 * - 7 user-provided practice fields (all from CREATE/UPDATE)
 * - 1 system-defined field: osot_membership_year (READ-ONLY)
 *
 * EXCLUDED FIELDS (not exposed to users):
 * - osot_Table_Account@odata.bind: Internal lookup reference
 * - osot_privilege: System-managed permission field
 * - osot_access_modifiers: System-managed access control field
 * - osot_practice_id: Internal business ID
 * - osot_table_membership_practiceid: Internal GUID
 * - createdon, modifiedon, ownerid: System audit fields
 *
 * ENUM-TO-LABEL CONVERSION:
 * - All enum fields converted to human-readable string labels
 * - Multi-select arrays: ClientsAge[] → string[]
 * - Example: [ClientsAge.ADULT, ClientsAge.OLDER] → ["Adult", "Older (65+)"]
 *
 * USAGE CONTEXT:
 * - GET /private/membership-practices/me (self-service)
 * - GET /private/membership-practices/:id (admin)
 * - Returns complete practice data with system-resolved membership_year
 *
 * BUSINESS RULES:
 * - osot_membership_year is SYSTEM-DEFINED from membership-settings
 * - Multi-select fields are string arrays (converted from enum arrays)
 * - osot_clients_age is required in response (minimum 1 value)
 * - User references resolved from JWT context
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsBoolean,
  IsArray,
  IsString,
  MaxLength,
  IsOptional,
  Matches,
  ArrayMinSize,
} from 'class-validator';

export class ResponseMembershipPracticesDto {
  // ========================================
  // MEMBERSHIP YEAR (SYSTEM-DEFINED - READ-ONLY)
  // ========================================

  @ApiProperty({
    example: '2026',
    description:
      'Membership year (READ-ONLY, system-defined from membership-settings)',
    type: 'string',
    readOnly: true,
  })
  @IsNotEmpty({ message: 'Membership year is required in response' })
  @Matches(/^\d{4}$/, { message: 'Membership year must be in YYYY format' })
  osot_membership_year: string;

  // ========================================
  // PRECEPTOR DECLARATION
  // ========================================

  @ApiProperty({
    example: false,
    description: 'Preceptor declaration (optional, default: false)',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Preceptor declaration must be a boolean' })
  osot_preceptor_declaration?: boolean;

  // ========================================
  // CLIENTS AGE (MULTIPLE CHOICE - REQUIRED)
  // ========================================

  @ApiProperty({
    example: ['Adult', 'Older (65+)'],
    description:
      'Client age groups served (multi-select, human-readable labels, required)',
    type: [String],
  })
  @IsNotEmpty({ message: 'Clients age is required' })
  @IsArray({ message: 'Clients age must be an array' })
  @ArrayMinSize(1, { message: 'Clients age must have at least one value' })
  osot_clients_age: string[];

  // ========================================
  // PRACTICE AREA (MULTIPLE CHOICE - OPTIONAL)
  // ========================================

  @ApiProperty({
    example: ['Chronic Pain', 'Stroke', 'Hand Rehabilitation'],
    description: 'Practice areas (multi-select, human-readable labels)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Practice area must be an array' })
  osot_practice_area?: string[];

  // ========================================
  // PRACTICE SETTINGS (MULTIPLE CHOICE - OPTIONAL)
  // ========================================

  @ApiProperty({
    example: ["Client's Home", 'General Hospital', 'Outpatient Clinic'],
    description: 'Practice settings (multi-select, human-readable labels)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Practice settings must be an array' })
  osot_practice_settings?: string[];

  @ApiProperty({
    example: 'Mobile clinic',
    description: 'Other practice setting description (optional, max 255 chars)',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Practice settings other must be a string' })
  @MaxLength(255, {
    message: 'Practice settings other cannot exceed 255 characters',
  })
  osot_practice_settings_other?: string;

  // ========================================
  // PRACTICE SERVICES (MULTIPLE CHOICE - OPTIONAL)
  // ========================================

  @ApiProperty({
    example: [
      'Cognitive Behaviour Therapy',
      'Hand Rehabilitation',
      'Pain Management',
    ],
    description:
      'Practice services offered (multi-select, human-readable labels)',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Practice services must be an array' })
  osot_practice_services?: string[];

  @ApiProperty({
    example: 'Specialized pediatric assessment',
    description: 'Other practice service description (optional, max 255 chars)',
    type: 'string',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Practice services other must be a string' })
  @MaxLength(255, {
    message: 'Practice services other cannot exceed 255 characters',
  })
  osot_practice_services_other?: string;
}
