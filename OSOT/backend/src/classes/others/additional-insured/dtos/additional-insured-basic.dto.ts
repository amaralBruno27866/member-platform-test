/**
 * Additional Insured Basic DTO
 *
 * Shared base fields for Additional Insured operations.
 * Extended by Create and Response DTOs.
 *
 * Architecture Notes:
 * - Contains only business fields (no system fields)
 * - Used as base class for inheritance
 * - Field names match Dataverse logical names (snake_case)
 * - All fields use @ApiProperty for Swagger documentation
 * - Fields are immutable (required at creation, cannot update except via UpdateDto)
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Privilege, AccessModifier } from '../../../../common/enums';

/**
 * Base DTO for Additional Insured entity
 * Contains all business fields shared across Create/Response DTOs
 */
export class AdditionalInsuredBasicDto {
  // ========================================
  // BUSINESS FIELDS (IMMUTABLE - 5 required)
  // ========================================

  @ApiProperty({
    description:
      'Company/entity name to be added as additional insured. Will be normalized to UPPERCASE on write.',
    example: 'ABC CORPORATION',
    minLength: 3,
    maxLength: 255,
  })
  @IsString({
    message: 'Company name must be a string',
  })
  @IsNotEmpty({
    message: 'Company name is required',
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
  osot_company_name: string;

  @ApiProperty({
    description:
      'Street address of the additional insured company. Will be trimmed on write.',
    example: '123 MAIN STREET',
    minLength: 5,
    maxLength: 255,
  })
  @IsString({
    message: 'Address must be a string',
  })
  @IsNotEmpty({
    message: 'Address is required',
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
  osot_address: string;

  @ApiProperty({
    description:
      'City display name (copied snapshot from Insurance parent). Immutable after creation.',
    example: 'TORONTO',
  })
  @IsString({
    message: 'City must be a string',
  })
  @IsNotEmpty({
    message: 'City is required',
  })
  osot_city: string;

  @ApiProperty({
    description:
      'Province display name (copied snapshot from Insurance parent). Immutable after creation.',
    example: 'ONTARIO',
  })
  @IsString({
    message: 'Province must be a string',
  })
  @IsNotEmpty({
    message: 'Province is required',
  })
  osot_province: string;

  @ApiProperty({
    description:
      'Postal code (Canadian format). Will be normalized to UPPERCASE and no spaces on write (e.g., K1A0A6).',
    example: 'K1A0A6',
    pattern: '^([A-Za-z]\\d[A-Za-z])\\s?(\\d[A-Za-z]\\d)$',
  })
  @IsString({
    message: 'Postal code must be a string',
  })
  @IsNotEmpty({
    message: 'Postal code is required',
  })
  @Matches(/^([A-Za-z]\d[A-Za-z])\s?(\d[A-Za-z]\d)$/, {
    message:
      'Postal code must be valid Canadian format (e.g., K1A0A6 or K1A 0A6)',
  })
  osot_postal_code: string;

  // ========================================
  // ACCESS CONTROL FIELDS (OPTIONAL)
  // ========================================

  @ApiPropertyOptional({
    description:
      'Privilege level. Immutable snapshot from creation. Defaults to Owner.',
    enum: Privilege,
    example: Privilege.OWNER,
  })
  @IsOptional()
  @IsString()
  osot_privilege?: string;

  @ApiPropertyOptional({
    description:
      'Access modifier. Immutable snapshot from creation. Defaults to Private.',
    enum: AccessModifier,
    example: AccessModifier.PRIVATE,
  })
  @IsOptional()
  @IsString()
  osot_access_modifiers?: string;
}
