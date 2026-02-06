import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { OtEducationResponseDto } from '../../dtos/ot-education-response.dto';
import { EducationCategory } from '../../../../../common/enums';
import {
  OtEducationRegistrationStatus,
  OtEducationProgressState,
  OtEducationValidationMetadata,
} from './ot-education-session.dto';

/**
 * ORCHESTRATOR DTO SPECIFICATION: OT Education Workflow Results
 *
 * These DTOs define the structure for workflow operation results,
 * validation outcomes, and orchestrator response data.
 *
 * Used by: OtEducationOrchestrator, Controllers, Error Handling
 */

// ========================================
// WORKFLOW STEP RESULTS
// ========================================

export enum OtEducationWorkflowStep {
  STAGING = 'staging',
  VALIDATION = 'validation',
  CATEGORY_DETERMINATION = 'category_determination',
  ACCOUNT_LINKING = 'account_linking',
  RECORD_CREATION = 'record_creation',
  WORKFLOW_COMPLETION = 'workflow_completion',
}

export enum OtEducationWorkflowAction {
  STAGE_DATA = 'stage_data',
  VALIDATE_EDUCATION = 'validate_education',
  DETERMINE_CATEGORY = 'determine_category',
  LINK_ACCOUNT = 'link_account',
  CREATE_RECORD = 'create_record',
  COMPLETE_WORKFLOW = 'complete_workflow',
  CANCEL_SESSION = 'cancel_session',
}

export class OtEducationStageResult {
  @ApiProperty({ description: 'Staging operation successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Generated session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Data staging timestamp' })
  @IsDateString()
  stagedAt: string;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({ description: 'Initial validation results' })
  @ValidateNested()
  @Type(() => OtEducationValidationMetadata)
  validation: OtEducationValidationMetadata;

  @ApiProperty({ description: 'Any staging errors', required: false })
  @IsOptional()
  @IsArray()
  errors?: string[];

  @ApiProperty({ description: 'Any staging warnings', required: false })
  @IsOptional()
  @IsArray()
  warnings?: string[];
}

export class OtEducationValidationResult {
  @ApiProperty({ description: 'Overall validation status' })
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({ description: 'Session identifier being validated' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Validation completion timestamp' })
  @IsDateString()
  validatedAt: string;

  @ApiProperty({ description: 'Detailed validation metadata' })
  @ValidateNested()
  @Type(() => OtEducationValidationMetadata)
  validation: OtEducationValidationMetadata;

  @ApiProperty({
    description: 'Determined education category',
    required: false,
  })
  @IsOptional()
  @IsEnum(EducationCategory)
  determinedCategory?: EducationCategory;

  @ApiProperty({
    description: 'Category determination rationale',
    required: false,
  })
  @IsOptional()
  @IsString()
  categoryRationale?: string;

  @ApiProperty({ description: 'Validation errors', required: false })
  @IsOptional()
  @IsArray()
  errors?: string[];

  @ApiProperty({ description: 'Validation warnings', required: false })
  @IsOptional()
  @IsArray()
  warnings?: string[];

  @ApiProperty({ description: 'Business rule violations', required: false })
  @IsOptional()
  @IsArray()
  ruleViolations?: string[];

  @ApiProperty({
    description: 'Next recommended workflow step',
    required: false,
  })
  @IsOptional()
  @IsEnum(OtEducationWorkflowStep)
  nextStep?: OtEducationWorkflowStep;
}

export class OtEducationLinkingResult {
  @ApiProperty({ description: 'Account linking successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Linked account identifier' })
  @IsUUID()
  accountId: string;

  @ApiProperty({ description: 'Account linking timestamp' })
  @IsDateString()
  linkedAt: string;

  @ApiProperty({ description: 'User business ID consistency validated' })
  @IsBoolean()
  userBusinessIdConsistent: boolean;

  @ApiProperty({ description: 'Account accessibility validated' })
  @IsBoolean()
  accountAccessible: boolean;

  @ApiProperty({ description: 'Privilege level sufficient for operation' })
  @IsBoolean()
  privilegeSufficient: boolean;

  @ApiProperty({ description: 'Account linking errors', required: false })
  @IsOptional()
  @IsArray()
  errors?: string[];

  @ApiProperty({ description: 'Account linking warnings', required: false })
  @IsOptional()
  @IsArray()
  warnings?: string[];
}

export class OtEducationCreationResult {
  @ApiProperty({ description: 'Education record creation successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Created education record', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => OtEducationResponseDto)
  educationRecord?: OtEducationResponseDto;

  @ApiProperty({ description: 'Record creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Final education category assigned' })
  @IsEnum(EducationCategory)
  finalCategory: EducationCategory;

  @ApiProperty({ description: 'Business rules applied during creation' })
  @IsArray()
  appliedRules: string[];

  @ApiProperty({ description: 'Events emitted during creation' })
  @IsArray()
  emittedEvents: string[];

  @ApiProperty({ description: 'Creation errors', required: false })
  @IsOptional()
  @IsArray()
  errors?: string[];

  @ApiProperty({ description: 'Creation warnings', required: false })
  @IsOptional()
  @IsArray()
  warnings?: string[];

  @ApiProperty({ description: 'Session cleanup status' })
  @IsBoolean()
  sessionCleaned: boolean;
}

export class OtEducationWorkflowResult {
  @ApiProperty({ description: 'Complete workflow successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Final workflow status' })
  @IsEnum(OtEducationRegistrationStatus)
  finalStatus: OtEducationRegistrationStatus;

  @ApiProperty({ description: 'Workflow completion timestamp' })
  @IsDateString()
  completedAt: string;

  @ApiProperty({ description: 'Total workflow duration in milliseconds' })
  @IsNumber()
  durationMs: number;

  @ApiProperty({ description: 'Created education record', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => OtEducationResponseDto)
  educationRecord?: OtEducationResponseDto;

  @ApiProperty({ description: 'Final progress state' })
  @ValidateNested()
  @Type(() => OtEducationProgressState)
  finalProgress: OtEducationProgressState;

  @ApiProperty({ description: 'Final validation results' })
  @ValidateNested()
  @Type(() => OtEducationValidationMetadata)
  finalValidation: OtEducationValidationMetadata;

  @ApiProperty({ description: 'Workflow step results' })
  @IsArray()
  stepResults: {
    step: OtEducationWorkflowStep;
    success: boolean;
    timestamp: string;
    duration: number;
    errors?: string[];
  }[];

  @ApiProperty({ description: 'All workflow errors', required: false })
  @IsOptional()
  @IsArray()
  errors?: string[];

  @ApiProperty({ description: 'All workflow warnings', required: false })
  @IsOptional()
  @IsArray()
  warnings?: string[];

  @ApiProperty({ description: 'Performance metrics', required: false })
  @IsOptional()
  performanceMetrics?: {
    validationTime: number;
    categoryDeterminationTime: number;
    accountLinkingTime: number;
    creationTime: number;
    totalTime: number;
  };
}

// ========================================
// BULK OPERATION RESULTS
// ========================================

export class OtEducationBulkOperationResult {
  @ApiProperty({ description: 'Overall bulk operation successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Bulk operation completion timestamp' })
  @IsDateString()
  completedAt: string;

  @ApiProperty({ description: 'Total records processed' })
  @IsNumber()
  totalRecords: number;

  @ApiProperty({ description: 'Number of successful operations' })
  @IsNumber()
  successCount: number;

  @ApiProperty({ description: 'Number of failed operations' })
  @IsNumber()
  failureCount: number;

  @ApiProperty({ description: 'Number of operations with warnings' })
  @IsNumber()
  warningCount: number;

  @ApiProperty({ description: 'Individual operation results' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtEducationWorkflowResult)
  results: OtEducationWorkflowResult[];

  @ApiProperty({ description: 'Summary of all errors', required: false })
  @IsOptional()
  @IsArray()
  errorSummary?: string[];

  @ApiProperty({ description: 'Summary of all warnings', required: false })
  @IsOptional()
  @IsArray()
  warningSummary?: string[];

  @ApiProperty({
    description: 'Operation performance metrics',
    required: false,
  })
  @IsOptional()
  performanceMetrics?: {
    totalDuration: number;
    averageDuration: number;
    fastestOperation: number;
    slowestOperation: number;
    operationsPerSecond: number;
  };
}

// ========================================
// SESSION OPERATION RESULTS
// ========================================

export class OtEducationSessionResponse {
  @ApiProperty({ description: 'Session retrieval successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Session identifier' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Session found in storage' })
  @IsBoolean()
  found: boolean;

  @ApiProperty({ description: 'Session is active and not expired' })
  @IsBoolean()
  active: boolean;

  @ApiProperty({ description: 'Current session status' })
  @IsEnum(OtEducationRegistrationStatus)
  status: OtEducationRegistrationStatus;

  @ApiProperty({ description: 'Current progress state' })
  @ValidateNested()
  @Type(() => OtEducationProgressState)
  progress: OtEducationProgressState;

  @ApiProperty({ description: 'Current validation state' })
  @ValidateNested()
  @Type(() => OtEducationValidationMetadata)
  validation: OtEducationValidationMetadata;

  @ApiProperty({ description: 'Session creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  @IsDateString()
  updatedAt: string;

  @ApiProperty({ description: 'Session expiration timestamp' })
  @IsDateString()
  expiresAt: string;

  @ApiProperty({
    description: 'Time remaining until expiration in seconds',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  timeRemaining?: number;

  @ApiProperty({
    description: 'Workflow completion percentage (0-100)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  completionPercentage?: number;

  @ApiProperty({
    description: 'Available actions for current state',
    required: false,
  })
  @IsOptional()
  @IsArray()
  availableActions?: OtEducationWorkflowAction[];

  @ApiProperty({ description: 'Recommended next action', required: false })
  @IsOptional()
  @IsEnum(OtEducationWorkflowAction)
  recommendedAction?: OtEducationWorkflowAction;

  @ApiProperty({ description: 'Session access errors', required: false })
  @IsOptional()
  @IsArray()
  errors?: string[];
}

// ========================================
// ERROR AND STATUS TYPES
// ========================================

export enum OtEducationOrchestratorErrorType {
  SESSION_NOT_FOUND = 'session_not_found',
  SESSION_EXPIRED = 'session_expired',
  VALIDATION_FAILED = 'validation_failed',
  BUSINESS_RULE_VIOLATION = 'business_rule_violation',
  ACCOUNT_LINKING_FAILED = 'account_linking_failed',
  CREATION_FAILED = 'creation_failed',
  REDIS_ERROR = 'redis_error',
  SERVICE_ERROR = 'service_error',
  PRIVILEGE_INSUFFICIENT = 'privilege_insufficient',
  WORKFLOW_STATE_INVALID = 'workflow_state_invalid',
}

export class OtEducationOrchestratorError {
  @ApiProperty({ description: 'Error type classification' })
  @IsEnum(OtEducationOrchestratorErrorType)
  type: OtEducationOrchestratorErrorType;

  @ApiProperty({ description: 'Human-readable error message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Session identifier where error occurred' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'Workflow step where error occurred' })
  @IsEnum(OtEducationWorkflowStep)
  step: OtEducationWorkflowStep;

  @ApiProperty({ description: 'Error occurrence timestamp' })
  @IsDateString()
  timestamp: string;

  @ApiProperty({ description: 'Detailed error context', required: false })
  @IsOptional()
  context?: Record<string, any>;

  @ApiProperty({ description: 'Error recovery suggestions', required: false })
  @IsOptional()
  @IsArray()
  recoverySuggestions?: string[];

  @ApiProperty({ description: 'Whether error is recoverable' })
  @IsBoolean()
  recoverable: boolean;
}
