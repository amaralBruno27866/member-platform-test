/**
 * Update Membership Practices DTO
 * Allows partial update of practice data
 *
 * EXCLUDED FIELDS (Immutable after creation):
 * - osot_membership_year: IMMUTABLE - Cannot be changed after creation
 * - osot_Table_Account@odata.bind: Immutable user reference
 * - osot_privilege: System-managed
 * - osot_access_modifiers: System-managed
 *
 * USAGE CONTEXT:
 * - PATCH /private/membership-practices/me (self-service)
 * - PATCH /private/membership-practices/:id (admin)
 * - User can update practice data for current year
 * - System prevents membership_year modification
 *
 * BUSINESS RULES:
 * - All fields are optional (partial update)
 * - osot_clients_age if provided must have at least one value
 * - Multi-select fields are arrays
 * - Conditional "_Other" fields validated when enum contains OTHER
 * - Cannot change membership_year (enforced at service layer)
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsString,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';

// Local enums integration
import { ClientsAge } from '../enums/clients-age.enum';
import { PracticeArea } from '../enums/practice-area.enum';
import { PracticeSettings } from '../enums/practice-settings.enum';
import { PracticeServices } from '../enums/practice-services.enum';

export class UpdateMembershipPracticesDto {
  // ========================================
  // PRECEPTOR DECLARATION (OPTIONAL)
  // ========================================

  @ApiProperty({
    example: true,
    description: 'Preceptor declaration (optional)',
    type: 'boolean',
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Preceptor declaration must be a boolean' })
  osot_preceptor_declaration?: boolean;

  // ========================================
  // CLIENTS AGE (MULTIPLE CHOICE - REQUIRED IF PROVIDED)
  // ========================================

  @ApiProperty({
    example: [ClientsAge.CHILD, ClientsAge.YOUTH, ClientsAge.ADULT],
    description:
      'Client age groups served (multi-select, optional - if provided must have at least 1 value)',
    enum: ClientsAge,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'Clients age must be an array' })
  @ArrayMinSize(1, {
    message: 'Clients age must have at least one value if provided',
  })
  @IsEnum(ClientsAge, {
    each: true,
    message: 'Each client age must be a valid ClientsAge enum value',
  })
  osot_clients_age?: ClientsAge[];

  // ========================================
  // PRACTICE AREA (MULTIPLE CHOICE - OPTIONAL)
  // ========================================

  @ApiProperty({
    example: [PracticeArea.STROKE, PracticeArea.BURNS],
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
    example: [
      PracticeSettings.OUTPATIENT_CLINIC,
      PracticeSettings.REHABILITATION_CENTRE,
    ],
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
    example: 'Community health center',
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
    example: [PracticeServices.PAIN_MANAGEMENT, PracticeServices.ERGONOMICS],
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
    example: 'Telehealth consultations',
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
