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
import { OtaEducationResponseDto } from '../../dtos/ota-education-response.dto';
import { EducationCategory } from '../../../../../common/enums';
import {
  OtaEducationRegistrationStatus,
  OtaEducationProgressState,
  OtaEducationValidationMetadata,
} from './ota-education-session.dto';

/**
 * ORCHESTRATOR DTO SPECIFICATION: OTA Education Workflow Results
 *
 * These DTOs define the structure for workflow operation results,
 * validation outcomes, and orchestrator response data.
 *
 * Used by: OtaEducationOrchestrator, Controllers, Error Handling
 */

// ========================================
// WORKFLOW STEP RESULTS
// ========================================

export enum OtaEducationWorkflowStep {
  STAGING = 'staging',
  VALIDATION = 'validation',
  CATEGORY_DETERMINATION = 'category_determination',
  ACCOUNT_LINKING = 'account_linking',
  RECORD_CREATION = 'record_creation',
  WORKFLOW_COMPLETION = 'workflow_completion',
}

export enum OtaEducationWorkflowAction {
  STAGE_DATA = 'stage_data',
  VALIDATE_EDUCATION = 'validate_education',
  DETERMINE_CATEGORY = 'determine_category',
  LINK_ACCOUNT = 'link_account',
  CREATE_RECORD = 'create_record',
  COMPLETE_WORKFLOW = 'complete_workflow',
  ABORT_WORKFLOW = 'abort_workflow',
  RESUME_WORKFLOW = 'resume_workflow',
}

export class OtaEducationWorkflowError {
  @ApiProperty({ description: 'Error code identifier' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Human-readable error message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Error severity level' })
  @IsEnum(['warning', 'error', 'critical'])
  severity: 'warning' | 'error' | 'critical';

  @ApiProperty({ description: 'Field that caused the error', required: false })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiProperty({ description: 'Additional error context', required: false })
  @IsOptional()
  context?: Record<string, any>;
}

export class OtaEducationWorkflowResult {
  @ApiProperty({ description: 'Session ID for this workflow operation' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({
    description: 'Workflow step that was executed',
    enum: OtaEducationWorkflowStep,
  })
  @IsEnum(OtaEducationWorkflowStep)
  step: OtaEducationWorkflowStep;

  @ApiProperty({
    description: 'Action performed in this step',
    enum: OtaEducationWorkflowAction,
  })
  @IsEnum(OtaEducationWorkflowAction)
  action: OtaEducationWorkflowAction;

  @ApiProperty({ description: 'Whether the step was successful' })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ description: 'Step execution timestamp' })
  @IsDateString()
  executedAt: string;

  @ApiProperty({
    description: 'Errors encountered during step execution',
    type: [OtaEducationWorkflowError],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtaEducationWorkflowError)
  errors: OtaEducationWorkflowError[];

  @ApiProperty({
    description: 'Warnings generated during step execution',
    type: [OtaEducationWorkflowError],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtaEducationWorkflowError)
  warnings: OtaEducationWorkflowError[];

  @ApiProperty({
    description: 'Next recommended step',
    enum: OtaEducationWorkflowStep,
    required: false,
  })
  @IsOptional()
  @IsEnum(OtaEducationWorkflowStep)
  nextStep?: OtaEducationWorkflowStep;

  @ApiProperty({
    description: 'Additional result data',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

// ========================================
// VALIDATION RESULTS
// ========================================

export class OtaEducationValidationResult extends OtaEducationWorkflowResult {
  @ApiProperty({ description: 'Overall validation status' })
  @IsBoolean()
  isValid: boolean;

  @ApiProperty({ description: 'Validation completion timestamp' })
  @IsDateString()
  validatedAt: string;

  @ApiProperty({
    description: 'Detailed validation metadata',
    type: OtaEducationValidationMetadata,
  })
  @ValidateNested()
  @Type(() => OtaEducationValidationMetadata)
  validation: OtaEducationValidationMetadata;

  @ApiProperty({
    description: 'Validation score (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  validationScore: number;

  @ApiProperty({
    description: 'Critical validation failures that prevent progression',
    type: [OtaEducationWorkflowError],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtaEducationWorkflowError)
  criticalFailures: OtaEducationWorkflowError[];
}

// ========================================
// ACCOUNT LINKING RESULTS
// ========================================

export class OtaEducationLinkingResult extends OtaEducationWorkflowResult {
  @ApiProperty({ description: 'Whether account linking was successful' })
  @IsBoolean()
  linked: boolean;

  @ApiProperty({ description: 'Linked account ID', required: false })
  @IsOptional()
  @IsUUID()
  linkedAccountId?: string;

  @ApiProperty({ description: 'Account linking timestamp' })
  @IsDateString()
  linkedAt: string;

  @ApiProperty({
    description: 'Account verification status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  accountVerified?: boolean;

  @ApiProperty({
    description: 'Account privilege level after linking',
    required: false,
  })
  @IsOptional()
  @IsString()
  accountPrivilege?: string;
}

// ========================================
// RECORD CREATION RESULTS
// ========================================

export class OtaEducationCreationResult extends OtaEducationWorkflowResult {
  @ApiProperty({ description: 'Whether record creation was successful' })
  @IsBoolean()
  created: boolean;

  @ApiProperty({ description: 'Created education record ID', required: false })
  @IsOptional()
  @IsUUID()
  createdEducationId?: string;

  @ApiProperty({ description: 'Record creation timestamp' })
  @IsDateString()
  createdAt: string;

  @ApiProperty({
    description: 'Created education record data',
    type: OtaEducationResponseDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OtaEducationResponseDto)
  educationRecord?: OtaEducationResponseDto;

  @ApiProperty({
    description: 'Determined education category',
    enum: EducationCategory,
    required: false,
  })
  @IsOptional()
  @IsEnum(EducationCategory)
  determinedCategory?: EducationCategory;
}

// ========================================
// SESSION RESPONSE AGGREGATES
// ========================================

export class OtaEducationSessionResponse {
  @ApiProperty({ description: 'Session ID' })
  @IsUUID()
  sessionId: string;

  @ApiProperty({ description: 'User business ID' })
  @IsString()
  userBusinessId: string;

  @ApiProperty({
    description: 'Current registration status',
    enum: OtaEducationRegistrationStatus,
  })
  @IsEnum(OtaEducationRegistrationStatus)
  status: OtaEducationRegistrationStatus;

  @ApiProperty({
    description: 'Progress state',
    type: OtaEducationProgressState,
  })
  @ValidateNested()
  @Type(() => OtaEducationProgressState)
  progress: OtaEducationProgressState;

  @ApiProperty({
    description: 'Latest workflow results',
    type: [OtaEducationWorkflowResult],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtaEducationWorkflowResult)
  workflowResults: OtaEducationWorkflowResult[];

  @ApiProperty({ description: 'Session last updated timestamp' })
  @IsDateString()
  lastUpdatedAt: string;

  @ApiProperty({
    description: 'Created education record ID if completed',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  createdEducationId?: string;

  @ApiProperty({
    description: 'Final education record if available',
    type: OtaEducationResponseDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OtaEducationResponseDto)
  finalEducationRecord?: OtaEducationResponseDto;
}

// ========================================
// BULK OPERATION RESULTS
// ========================================

export class OtaEducationBulkOperationResult {
  @ApiProperty({ description: 'Bulk operation identifier' })
  @IsUUID()
  operationId: string;

  @ApiProperty({ description: 'Operation execution timestamp' })
  @IsDateString()
  executedAt: string;

  @ApiProperty({ description: 'Total number of sessions processed' })
  @IsNumber()
  totalProcessed: number;

  @ApiProperty({ description: 'Number of successful operations' })
  @IsNumber()
  successCount: number;

  @ApiProperty({ description: 'Number of failed operations' })
  @IsNumber()
  failureCount: number;

  @ApiProperty({
    description: 'Individual session results',
    type: [OtaEducationSessionResponse],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtaEducationSessionResponse)
  sessionResults: OtaEducationSessionResponse[];

  @ApiProperty({
    description: 'Bulk operation errors',
    type: [OtaEducationWorkflowError],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtaEducationWorkflowError)
  errors: OtaEducationWorkflowError[];

  @ApiProperty({ description: 'Overall operation success rate (0-100)' })
  @IsNumber()
  successRate: number;
}

// ========================================
// ORCHESTRATOR STATISTICS
// ========================================

export class OtaEducationOrchestratorStats {
  @ApiProperty({ description: 'Statistics generation timestamp' })
  @IsDateString()
  generatedAt: string;

  @ApiProperty({ description: 'Total active sessions' })
  @IsNumber()
  totalActiveSessions: number;

  @ApiProperty({ description: 'Sessions by status breakdown' })
  statusBreakdown: Record<OtaEducationRegistrationStatus, number>;

  @ApiProperty({ description: 'Average session completion time (minutes)' })
  @IsNumber()
  averageCompletionTime: number;

  @ApiProperty({ description: 'Success rate percentage (0-100)' })
  @IsNumber()
  successRate: number;

  @ApiProperty({ description: 'Most common error codes' })
  commonErrors: Array<{
    code: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({ description: 'Daily workflow metrics' })
  dailyMetrics: {
    sessionsCreated: number;
    sessionsCompleted: number;
    sessionsAborted: number;
    averageValidationScore: number;
  };
}
