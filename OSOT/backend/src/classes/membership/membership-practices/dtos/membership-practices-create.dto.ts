/**
 * Create Membership Practices DTO
 * Simplified version for practice creation (user provides only practice data)
 *
 * EXCLUDED FIELDS (Auto-determined by system):
 * - osot_membership_year: SYSTEM-DEFINED from active membership-settings
 * - osot_Table_Account@odata.bind: Extracted from JWT token (optional)
 * - osot_privilege: Auto-set to OWNER
 * - osot_access_modifiers: Auto-set to PRIVATE
 *
 * USAGE CONTEXT:
 * - POST /private/membership-practices/me (self-service)
 * - User only provides practice data
 * - System automatically determines year from membership-settings
 * - System automatically determines user reference from JWT (optional)
 *
 * BUSINESS RULES:
 * - osot_clients_age is required (must have at least one value)
 * - Multi-select fields are arrays
 * - Conditional "_Other" fields validated when enum contains OTHER
 * - One practice record per user per year (enforced at service layer)
 * - User must have active membership-settings
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsString,
  IsNotEmpty,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

// Local enums integration
import { ClientsAge } from '../enums/clients-age.enum';
import { PracticeArea } from '../enums/practice-area.enum';
import { PracticeSettings } from '../enums/practice-settings.enum';
import { PracticeServices } from '../enums/practice-services.enum';

export class CreateMembershipPracticesDto {
  // ========================================
  // PRECEPTOR DECLARATION (OPTIONAL)
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
    example: [ClientsAge.ADULT, ClientsAge.OLDER],
    description:
      'Client age groups served (multi-select, required - minimum 1 value)',
    enum: ClientsAge,
    isArray: true,
  })
  @IsNotEmpty({ message: 'Clients age is required' })
  @IsArray({ message: 'Clients age must be an array' })
  @ArrayMinSize(1, { message: 'Clients age must have at least one value' })
  @IsEnum(ClientsAge, {
    each: true,
    message: 'Each client age must be a valid ClientsAge enum value',
  })
  osot_clients_age: ClientsAge[];

  // ========================================
  // PRACTICE AREA (MULTIPLE CHOICE - OPTIONAL)
  // ========================================

  @ApiProperty({
    example: [PracticeArea.CHRONIC_PAIN, PracticeArea.ONCOLOGY],
    description: 'Practice areas (multi-select, optional)',
    enum: PracticeArea,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Practice area must be an array' })
  @IsEnum(PracticeArea, {
    each: true,
    message: 'Each practice area must be a valid PracticeArea enum value',
  })
  osot_practice_area?: PracticeArea[];

  // ========================================
  // PRACTICE SETTINGS (MULTIPLE CHOICE - OPTIONAL)
  // ========================================

  @ApiProperty({
    example: [PracticeSettings.CLIENTS_HOME, PracticeSettings.GENERAL_HOSPITAL],
    description: 'Practice settings (multi-select, optional)',
    enum: PracticeSettings,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Practice settings must be an array' })
  @IsEnum(PracticeSettings, {
    each: true,
    message:
      'Each practice setting must be a valid PracticeSettings enum value',
  })
  osot_practice_settings?: PracticeSettings[];

  @ApiProperty({
    example: 'Mobile clinic',
    description:
      'Other practice setting description (optional, required when practice_settings contains OTHER, max 255 chars)',
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
      PracticeServices.COGNITIVE_BEHAVIOUR_THERAPY,
      PracticeServices.HAND_REHABILITATION,
    ],
    description: 'Practice services offered (multi-select, optional)',
    enum: PracticeServices,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Practice services must be an array' })
  @IsEnum(PracticeServices, {
    each: true,
    message:
      'Each practice service must be a valid PracticeServices enum value',
  })
  osot_practice_services?: PracticeServices[];

  @ApiProperty({
    example: 'Specialized pediatric assessment',
    description:
      'Other practice service description (optional, required when practice_services contains OTHER, max 255 chars)',
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
