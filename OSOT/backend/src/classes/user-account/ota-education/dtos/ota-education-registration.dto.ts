/**
 * OTA Education Registration DTO
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - errors: Registration validation with proper error handling
 * - enums: Uses centralized enums for validation
 * - validators: Uses OTA Education validators including business rule validation
 * - integrations: Ready for DataverseService integration
 *
 * REGISTRATION REQUIREMENTS:
 * - Extends CreateOtaEducationDto for comprehensive validation
 * - Additional registration-specific metadata
 * - Registration workflow context
 * - Terms acceptance validation
 * - Registration timestamp tracking
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsDateString, IsString } from 'class-validator';
import { CreateOtaEducationDto } from './create-ota-education.dto';

/**
 * DTO for OTA Education registration process
 *
 * Extends CreateOtaEducationDto which includes:
 * - All work declaration business rules validation
 * - College-country alignment validation
 * - Degree type validation
 * - Custom validators for data integrity
 * - Account binding for relationships
 *
 * Adds registration-specific fields:
 * - Terms acceptance tracking
 * - Registration workflow metadata
 * - Submission context
 */
export class OtaEducationRegistrationDto extends CreateOtaEducationDto {
  @ApiProperty({
    description:
      'Confirmation that user accepts terms and conditions for education registration',
    example: true,
  })
  @IsBoolean()
  terms_accepted: boolean;

  @ApiPropertyOptional({
    description: 'Registration submission timestamp (ISO 8601)',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  registration_submitted_at?: string;

  @ApiPropertyOptional({
    description: 'Registration context or source',
    example: 'web_portal',
  })
  @IsOptional()
  @IsString()
  registration_source?: string;

  @ApiPropertyOptional({
    description: 'Registration workflow step or status',
    example: 'education_verification',
  })
  @IsOptional()
  @IsString()
  registration_step?: string;

  @ApiPropertyOptional({
    description: 'User agent information for registration tracking',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  user_agent?: string;

  @ApiPropertyOptional({
    description: 'IP address for registration audit trail',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsString()
  ip_address?: string;

  @ApiPropertyOptional({
    description: 'Additional registration notes or comments',
    example: 'Initial registration during OTA membership application',
  })
  @IsOptional()
  @IsString()
  registration_notes?: string;

  @ApiPropertyOptional({
    description: 'Document verification status',
    example: 'pending_verification',
  })
  @IsOptional()
  @IsString()
  verification_status?: string;

  @ApiPropertyOptional({
    description: 'Registration completion flag',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  registration_complete?: boolean;
}
