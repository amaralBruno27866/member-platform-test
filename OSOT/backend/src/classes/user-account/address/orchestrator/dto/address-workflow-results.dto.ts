import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsUUID,
  IsArray,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  AddressRegistrationStatus,
  AddressProgressState,
} from './address-session.dto';
import { ErrorCodes } from '../../../../../common/errors/error-codes';

/**
 * ORCHESTRATOR DTO SPECIFICATION: Address Workflow Result Types
 *
 * These DTOs define the standardized responses for all address orchestrator operations
 * ensuring consistent API contracts across the address registration workflow.
 */

export enum AddressWorkflowStep {
  ADDRESS_VALIDATION = 'address_validation',
  GEOCODING = 'geocoding',
  ACCOUNT_LINKING = 'account_linking',
  ADDRESS_PERSISTENCE = 'address_persistence',
  WORKFLOW_COMPLETED = 'workflow_completed',
  WORKFLOW_TERMINATED = 'workflow_terminated',
}

export enum AddressWorkflowAction {
  VALIDATE_ADDRESS = 'validate_address',
  GEOCODE_ADDRESS = 'geocode_address',
  LINK_TO_ACCOUNT = 'link_to_account',
  CREATE_ADDRESS = 'create_address',
  CONTACT_SUPPORT = 'contact_support',
}

/**
 * Structured Error Information for Address Orchestrator Operations
 */
export class AddressOrchestrationError {
  @ApiProperty({
    description: 'Error code from centralized error system',
    enum: ErrorCodes,
  })
  @IsEnum(ErrorCodes)
  code: ErrorCodes;

  @ApiProperty({ description: 'Human-readable error message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Additional error context', required: false })
  @IsOptional()
  context?: Record<string, unknown>;

  @ApiProperty({ description: 'HTTP status code associated with error' })
  @IsNumber()
  statusCode: number;
}

/**
 * Address Validation Result with Geographic Information
 */
export class AddressValidationResult {
  @ApiProperty({ description: 'Validation success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Postal code validation status' })
  @IsBoolean()
  postalCodeValid: boolean;

  @ApiProperty({ description: 'Province validation status' })
  @IsBoolean()
  provinceValid: boolean;

  @ApiProperty({ description: 'City validation status' })
  @IsBoolean()
  cityValid: boolean;

  @ApiProperty({ description: 'Address standardization applied' })
  @IsBoolean()
  standardized: boolean;

  @ApiProperty({
    description: 'Standardized address components',
    required: false,
  })
  @IsOptional()
  standardizedAddress?: {
    address1: string;
    address2?: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };

  @ApiProperty({ description: 'Geographic coordinates', required: false })
  @IsOptional()
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @ApiProperty({ description: 'Validation warnings', required: false })
  @IsOptional()
  @IsArray()
  warnings?: string[];
}

export class AddressStageResult {
  @ApiProperty()
  @IsBoolean()
  success: boolean;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty({ enum: AddressRegistrationStatus })
  @IsEnum(AddressRegistrationStatus)
  status: AddressRegistrationStatus;

  @ApiProperty({ type: AddressValidationResult })
  validation: AddressValidationResult;

  @ApiProperty()
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  error?: AddressOrchestrationError;
}

export class AddressLinkingResult {
  @ApiProperty({ description: 'Account linking success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Linked account ID' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ description: 'User business ID for association' })
  @IsString()
  userBusinessId: string;

  @ApiProperty({ description: 'Link verification status' })
  @IsBoolean()
  verified: boolean;

  @ApiProperty({ description: 'Linking error details', required: false })
  @IsOptional()
  error?: AddressOrchestrationError;
}

export class AddressCreationResult {
  @ApiProperty({ description: 'Address creation success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Created address ID', required: false })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiProperty({ description: 'Address display name', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ description: 'Creation timestamp', required: false })
  @IsOptional()
  @IsDateString()
  createdAt?: string;

  @ApiProperty({ description: 'Creation error details', required: false })
  @IsOptional()
  error?: AddressOrchestrationError;
}

export class AddressWorkflowResult {
  @ApiProperty({ description: 'Overall workflow success' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Current workflow step',
    enum: AddressWorkflowStep,
  })
  @IsEnum(AddressWorkflowStep)
  currentStep: AddressWorkflowStep;

  @ApiProperty({
    description: 'Next recommended action',
    enum: AddressWorkflowAction,
  })
  @IsEnum(AddressWorkflowAction)
  nextAction: AddressWorkflowAction;

  @ApiProperty({ description: 'Session identifier' })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Workflow status',
    enum: AddressRegistrationStatus,
  })
  @IsEnum(AddressRegistrationStatus)
  status: AddressRegistrationStatus;

  @ApiProperty({ description: 'Progress state' })
  progress: AddressProgressState;

  @ApiProperty({ description: 'User-friendly status message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Validation results', required: false })
  @IsOptional()
  validation?: AddressValidationResult;

  @ApiProperty({ description: 'Account linking results', required: false })
  @IsOptional()
  linking?: AddressLinkingResult;

  @ApiProperty({ description: 'Address creation results', required: false })
  @IsOptional()
  creation?: AddressCreationResult;

  @ApiProperty({ description: 'Workflow errors', required: false })
  @IsOptional()
  @IsArray()
  errors?: AddressOrchestrationError[];

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class AddressSessionQuery {
  @ApiProperty({ description: 'Session ID to query' })
  @IsUUID()
  sessionId: string;
}

export class AddressSessionResponse {
  @ApiProperty({ description: 'Query success status' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Session found status' })
  @IsBoolean()
  found: boolean;

  @ApiProperty({ description: 'Session data', required: false })
  @IsOptional()
  session?: any; // Will be AddressRegistrationSession when imported

  @ApiProperty({ description: 'Current workflow result', required: false })
  @IsOptional()
  workflow?: AddressWorkflowResult;

  @ApiProperty({ description: 'Query error', required: false })
  @IsOptional()
  error?: AddressOrchestrationError;
}

export class AddressBulkOperationResult {
  @ApiProperty({ description: 'Total operations attempted' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Successful operations count' })
  @IsNumber()
  successful: number;

  @ApiProperty({ description: 'Failed operations count' })
  @IsNumber()
  failed: number;

  @ApiProperty({ description: 'Individual results' })
  @IsArray()
  results: AddressWorkflowResult[];

  @ApiProperty({ description: 'Bulk operation errors', required: false })
  @IsOptional()
  @IsArray()
  errors?: AddressOrchestrationError[];
}
