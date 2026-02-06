import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AddressType } from '../../../../../common/enums/address-type.enum';
import { AddressPreference } from '../../../../../common/enums/address-preference.enum';
import { AccessModifier } from '../../../../../common/enums/access-modifier.enum';
import { Privilege } from '../../../../../common/enums/privilege.enum';

/**
 * ORCHESTRATOR DTO SPECIFICATION: Address Session Management
 *
 * These DTOs define the exact structure for Redis session storage and
 * API communication during the address registration workflow.
 *
 * Used by: AddressOrchestrator, RedisService, Public Controller
 */

export enum AddressRegistrationStatus {
  PENDING = 'pending',
  STAGED = 'staged',
  VALIDATED = 'validated',
  GEOCODED = 'geocoded',
  ACCOUNT_LINKED = 'account_linked',
  ADDRESS_CREATED = 'address_created',
  CREATION_FAILED = 'creation_failed',
  WORKFLOW_COMPLETED = 'workflow_completed',
}

export class AddressProgressState {
  @ApiProperty({ description: 'Address data has been staged in Redis' })
  @IsBoolean()
  staged: boolean;

  @ApiProperty({ description: 'Address validation has been completed' })
  @IsBoolean()
  validated: boolean;

  @ApiProperty({ description: 'Geographic validation has been completed' })
  @IsBoolean()
  geocoded: boolean;

  @ApiProperty({ description: 'Account linking has been verified' })
  @IsBoolean()
  accountLinked: boolean;

  @ApiProperty({ description: 'Address has been persisted to Dataverse' })
  @IsBoolean()
  persisted: boolean;
}

export class AddressValidationMetadata {
  @ApiProperty({ description: 'Postal code validation status' })
  @IsBoolean()
  postalCodeValid: boolean;

  @ApiProperty({ description: 'Province/city combination valid' })
  @IsBoolean()
  provinceValid: boolean;

  @ApiProperty({ description: 'Address format standardized' })
  @IsBoolean()
  standardized: boolean;

  @ApiProperty({ description: 'Geographic coordinates found', required: false })
  @IsOptional()
  @IsBoolean()
  geocoded?: boolean;
}

export class AddressSessionData {
  @ApiProperty({ description: 'User business ID for association' })
  @IsString()
  userBusinessId: string;

  @ApiProperty({ description: 'Primary address line' })
  @IsString()
  address1: string;

  @ApiProperty({ description: 'Secondary address line', required: false })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty({ description: 'City name' })
  @IsString()
  city: string;

  @ApiProperty({ description: 'Province or state' })
  @IsString()
  province: string;

  @ApiProperty({ description: 'Postal or ZIP code' })
  @IsString()
  postalCode: string;

  @ApiProperty({ description: 'Country code', default: 'Canada' })
  @IsString()
  country: string;

  @ApiProperty({ description: 'Address type', enum: AddressType })
  @IsEnum(AddressType)
  addressType: AddressType;

  @ApiProperty({
    description: 'Address preference',
    enum: AddressPreference,
    required: false,
  })
  @IsOptional()
  @IsEnum(AddressPreference)
  addressPreference?: AddressPreference;

  @ApiProperty({
    description: 'Access modifier',
    enum: AccessModifier,
    default: AccessModifier.PRIVATE,
  })
  @IsEnum(AccessModifier)
  accessModifier: AccessModifier;

  @ApiProperty({
    description: 'User privilege level',
    enum: Privilege,
    default: Privilege.OWNER,
  })
  @IsEnum(Privilege)
  privilege: Privilege;

  @ApiProperty({ description: 'Account ID for linking', required: false })
  @IsOptional()
  @IsUUID()
  accountId?: string;
}

export class AddressRegistrationSession {
  @ApiProperty({ description: 'Unique session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Current workflow status',
    enum: AddressRegistrationStatus,
  })
  @IsEnum(AddressRegistrationStatus)
  status: AddressRegistrationStatus;

  @ApiProperty({ description: 'Address data for registration' })
  @ValidateNested()
  @Type(() => AddressSessionData)
  addressData: AddressSessionData;

  @ApiProperty({ description: 'Progress tracking' })
  @ValidateNested()
  @Type(() => AddressProgressState)
  progress: AddressProgressState;

  @ApiProperty({ description: 'Validation metadata' })
  @ValidateNested()
  @Type(() => AddressValidationMetadata)
  validation: AddressValidationMetadata;

  @ApiProperty({ description: 'Session creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ description: 'User who initiated the session' })
  @IsString()
  initiatedBy: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class AddressStageRequest {
  @ApiProperty({ description: 'Address data to stage' })
  @ValidateNested()
  @Type(() => AddressSessionData)
  addressData: AddressSessionData;

  @ApiProperty({ description: 'Session expiration in hours', default: 24 })
  @IsOptional()
  @IsString()
  expirationHours?: string;
}

export class AddressStageResponse {
  @ApiProperty({ description: 'Operation success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Session identifier for tracking' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Response message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Validation results' })
  @ValidateNested()
  @Type(() => AddressValidationMetadata)
  validation: AddressValidationMetadata;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;
}
