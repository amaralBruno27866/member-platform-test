/**
 * Update Additional Insured DTO
 *
 * Data Transfer Object for updating an existing Additional Insured record.
 *
 * Architecture Notes:
 * - Most fields are immutable (snapshot frozen at creation)
 * - Only allows updating:
 *   - osot_company_name (with uniqueness constraint per insurance)
 *   - osot_address
 *   - osot_city (if parent insurance allows)
 *   - osot_province (if parent insurance allows)
 *   - osot_postal_code
 *   - osot_privilege (access control)
 *   - osot_access_modifiers (access control)
 * - Cannot update insurance relationship (parent immutable)
 * - All fields are optional (partial update pattern)
 *
 * Usage:
 * - Admin: Update company information, adjust access control
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Privilege, AccessModifier } from '../../../../common/enums';

/**
 * DTO for updating an existing Additional Insured record
 *
 * All fields are optional - only provided fields will be updated.
 */
export class UpdateAdditionalInsuredDto {
  // ========================================
  // MUTABLE FIELDS
  // ========================================

  @ApiPropertyOptional({
    description:
      'Company/entity name. Will be normalized to UPPERCASE. Must remain unique per insurance.',
    example: 'ABC CORPORATION UPDATED',
    minLength: 3,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({
    message: 'Company name must be a string',
  })
  @MinLength(3, {
    message: 'Company name must be at least 3 characters',
  })
  @MaxLength(255, {
    message: 'Company name cannot exceed 255 characters',
  })
  @Matches(/^[a-zA-Z0-9\s\-&.,()]+$/, {
    message:
      'Company name can only contain letters, numbers, spaces, and common business characters (-, &, ., ,, (, ))',
  })
  osot_company_name?: string;

  @ApiPropertyOptional({
    description: 'Street address. Will be trimmed on write.',
    example: '456 OAK AVENUE',
    minLength: 5,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({
    message: 'Address must be a string',
  })
  @MinLength(5, {
    message: 'Address must be at least 5 characters',
  })
  @MaxLength(255, {
    message: 'Address cannot exceed 255 characters',
  })
  @Matches(/^[a-zA-Z0-9\s\-.,()#]+$/, {
    message:
      'Address can only contain letters, numbers, spaces, and common address characters (-, ., ,, (, ), #)',
  })
  osot_address?: string;

  @ApiPropertyOptional({
    description: 'City display name.',
    example: 'TORONTO',
  })
  @IsOptional()
  @IsString({
    message: 'City must be a string',
  })
  osot_city?: string;

  @ApiPropertyOptional({
    description: 'Province display name.',
    example: 'ONTARIO',
  })
  @IsOptional()
  @IsString({
    message: 'Province must be a string',
  })
  osot_province?: string;

  @ApiPropertyOptional({
    description:
      'Postal code (Canadian format). Will be normalized to UPPERCASE and no spaces on write.',
    example: 'K1A0A6',
    pattern: '^([A-Za-z]\\d[A-Za-z])\\s?(\\d[A-Za-z]\\d)$',
  })
  @IsOptional()
  @IsString({
    message: 'Postal code must be a string',
  })
  @Matches(/^([A-Za-z]\d[A-Za-z])\s?(\d[A-Za-z]\d)$/, {
    message:
      'Postal code must be valid Canadian format (e.g., K1A0A6 or K1A 0A6)',
  })
  osot_postal_code?: string;

  @ApiPropertyOptional({
    description: 'Privilege level (access control).',
    enum: Privilege,
    example: Privilege.OWNER,
  })
  @IsOptional()
  @IsString()
  osot_privilege?: string;

  @ApiPropertyOptional({
    description: 'Access modifier (visibility control).',
    enum: AccessModifier,
    example: AccessModifier.PRIVATE,
  })
  @IsOptional()
  @IsString()
  osot_access_modifiers?: string;
}

/**
 * Update Additional Insured Request with metadata
 * Used internally for operation tracking
 */
export interface UpdateAdditionalInsuredRequest
  extends UpdateAdditionalInsuredDto {
  // Context metadata (added by controller/service)
  operationId?: string;
  recordId?: string;
  organizationGuid?: string;
  userGuid?: string;
  privilege?: number;
}
