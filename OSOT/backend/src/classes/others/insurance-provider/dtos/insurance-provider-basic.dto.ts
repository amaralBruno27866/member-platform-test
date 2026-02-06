/**
 * Insurance Provider Basic DTO
 *
 * Shared base fields for Insurance Provider operations.
 * Extended by Create, Update, and Response DTOs.
 *
 * Architecture Notes:
 * - Contains only business fields (no system fields)
 * - Field names match Dataverse logical names (snake_case)
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MaxLength,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { AccessModifier, Privilege } from '../../../../common/enums';
import { INSURANCE_PROVIDER_FIELD_LENGTH } from '../constants';

export class InsuranceProviderBasicDto {
  // ========================================
  // PROVIDER INFORMATION (9 fields)
  // ========================================

  @ApiProperty({
    description: 'Insurance company name',
    example: 'Example Insurance Company',
    maxLength: INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_COMPANY_NAME_MAX,
  })
  @IsString()
  @IsNotEmpty({ message: 'Insurance company name is required' })
  @MaxLength(INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_COMPANY_NAME_MAX, {
    message: 'Insurance company name cannot exceed 255 characters',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  osot_insurance_company_name: string;

  @ApiProperty({
    description: 'Insurance broker name',
    example: 'Example Insurance Broker',
    maxLength: INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_BROKER_NAME_MAX,
  })
  @IsString()
  @IsNotEmpty({ message: 'Insurance broker name is required' })
  @MaxLength(INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_BROKER_NAME_MAX, {
    message: 'Insurance broker name cannot exceed 255 characters',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  osot_insurance_broker_name: string;

  @ApiProperty({
    description: 'Insurance company logo URL',
    example: 'https://cdn.example.com/logo-company.png',
    maxLength: INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_COMPANY_LOGO_MAX,
  })
  @IsString()
  @IsNotEmpty({ message: 'Insurance company logo URL is required' })
  @IsUrl({}, { message: 'Insurance company logo must be a valid URL' })
  @MaxLength(INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_COMPANY_LOGO_MAX, {
    message: 'Insurance company logo URL cannot exceed 1000 characters',
  })
  @Transform(({ value }: { value: string | null | undefined }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  osot_insurance_company_logo: string;

  @ApiPropertyOptional({
    description: 'Insurance broker logo URL',
    example: 'https://cdn.example.com/logo-broker.png',
    maxLength: INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_BROKER_LOGO_MAX,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Insurance broker logo must be a valid URL' })
  @MaxLength(INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_BROKER_LOGO_MAX, {
    message: 'Insurance broker logo URL cannot exceed 1000 characters',
  })
  @Transform(({ value }: { value: string | null | undefined }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  osot_insurance_broker_logo?: string;

  @ApiProperty({
    description: 'Policy period start date (YYYY-MM-DD)',
    example: '2026-01-01',
    format: 'date',
  })
  @IsDateString({}, { message: 'Policy period start must be a valid date' })
  @IsNotEmpty({ message: 'Policy period start is required' })
  osot_policy_period_start: string;

  @ApiProperty({
    description: 'Policy period end date (YYYY-MM-DD)',
    example: '2026-12-31',
    format: 'date',
  })
  @IsDateString({}, { message: 'Policy period end must be a valid date' })
  @IsNotEmpty({ message: 'Policy period end is required' })
  osot_policy_period_end: string;

  @ApiProperty({
    description: 'Master policy description (text area)',
    example: 'Coverage includes professional liability for OT/OTA members.',
    maxLength: INSURANCE_PROVIDER_FIELD_LENGTH.MASTER_POLICY_DESCRIPTION_MAX,
  })
  @IsString()
  @IsNotEmpty({ message: 'Master policy description is required' })
  @MaxLength(INSURANCE_PROVIDER_FIELD_LENGTH.MASTER_POLICY_DESCRIPTION_MAX, {
    message: 'Master policy description cannot exceed 4000 characters',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : (value as string),
  )
  osot_master_policy_description: string;

  @ApiProperty({
    description: 'Insurance authorized representative (URL)',
    example: 'https://cdn.example.com/signature.png',
    maxLength:
      INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_AUTHORIZED_REPRESENTATIVE_MAX,
  })
  @IsString()
  @IsNotEmpty({
    message: 'Insurance authorized representative URL is required',
  })
  @IsUrl({}, { message: 'Authorized representative must be a valid URL' })
  @MaxLength(
    INSURANCE_PROVIDER_FIELD_LENGTH.INSURANCE_AUTHORIZED_REPRESENTATIVE_MAX,
    {
      message: 'Authorized representative URL cannot exceed 1000 characters',
    },
  )
  @Transform(({ value }: { value: string | null | undefined }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  osot_insurance_authorized_representative: string;

  @ApiPropertyOptional({
    description: 'Certificate observations (text area)',
    example: 'All coverage is subject to standard policy conditions.',
    maxLength: INSURANCE_PROVIDER_FIELD_LENGTH.CERTIFICATE_OBSERVATIONS_MAX,
  })
  @IsOptional()
  @IsString()
  @MaxLength(INSURANCE_PROVIDER_FIELD_LENGTH.CERTIFICATE_OBSERVATIONS_MAX, {
    message: 'Certificate observations cannot exceed 4000 characters',
  })
  @Transform(({ value }: { value: string | null | undefined }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  osot_certificate_observations?: string;

  @ApiPropertyOptional({
    description: 'Broker general information (text area)',
    example: 'Broker contact hours: 9AM-5PM EST.',
    maxLength: INSURANCE_PROVIDER_FIELD_LENGTH.BROKER_GENERAL_INFORMATION_MAX,
  })
  @IsOptional()
  @IsString()
  @MaxLength(INSURANCE_PROVIDER_FIELD_LENGTH.BROKER_GENERAL_INFORMATION_MAX, {
    message: 'Broker general information cannot exceed 4000 characters',
  })
  @Transform(({ value }: { value: string | null | undefined }) =>
    value === '' || value === null || value === undefined ? undefined : value,
  )
  osot_broker_general_information?: string;

  // ========================================
  // ACCESS CONTROL (2 optional fields)
  // ========================================

  @ApiPropertyOptional({
    description: 'Privilege level (optional)',
    enum: Privilege,
    example: Privilege.MAIN,
  })
  @IsOptional()
  @IsEnum(Privilege)
  osot_privilege?: Privilege;

  @ApiPropertyOptional({
    description: 'Access modifier (optional)',
    enum: AccessModifier,
    example: AccessModifier.PROTECTED,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  osot_access_modifier?: AccessModifier;
}
