import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  IsDate,
  ValidateNested,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IdentityResponseDto } from '../../dtos/identity-response.dto';

/**
 * ORCHESTRATOR DTO SPECIFICATION: Workflow Results
 *
 * Standardized response types for Identity Orchestrator operations.
 * These DTOs ensure consistent API responses across all workflow stages.
 *
 * Used by: IdentityOrchestrator, Public Controller, Private Controller
 */

/**
 * Base result interface for all orchestrator operations
 */
export class BaseWorkflowResultDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Human-readable message describing the result',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Operation timestamp',
  })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiPropertyOptional({
    description: 'Error code if operation failed',
  })
  @IsOptional()
  @IsString()
  errorCode?: string;

  @ApiPropertyOptional({
    description: 'Detailed error information',
  })
  @IsOptional()
  @IsString()
  errorDetails?: string;
}

/**
 * Result from identity staging operations
 */
export class IdentityStagingResultDto extends BaseWorkflowResultDto {
  @ApiPropertyOptional({
    description: 'Session ID for tracking the staged identity',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({
    description: 'Current session status',
    enum: [
      'staged',
      'validating',
      'cultural_analysis',
      'completeness_check',
      'ready_for_creation',
      'failed',
    ],
  })
  @IsEnum([
    'staged',
    'validating',
    'cultural_analysis',
    'completeness_check',
    'ready_for_creation',
    'failed',
  ])
  status:
    | 'staged'
    | 'validating'
    | 'cultural_analysis'
    | 'completeness_check'
    | 'ready_for_creation'
    | 'failed';

  @ApiPropertyOptional({
    description: 'User Business ID that was staged',
  })
  @IsOptional()
  @IsString()
  userBusinessId?: string;

  @ApiProperty({
    description: 'Next recommended action',
    enum: [
      'validate_business_id',
      'analyze_cultural_consistency',
      'assess_completeness',
      'create_identity',
      'retry_with_corrections',
    ],
  })
  @IsEnum([
    'validate_business_id',
    'analyze_cultural_consistency',
    'assess_completeness',
    'create_identity',
    'retry_with_corrections',
  ])
  nextAction:
    | 'validate_business_id'
    | 'analyze_cultural_consistency'
    | 'assess_completeness'
    | 'create_identity'
    | 'retry_with_corrections';

  @ApiPropertyOptional({
    description: 'Session expiration time',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiProperty({
    description: 'Validation warnings (non-blocking)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  warnings: string[];

  @ApiPropertyOptional({
    description: 'Initial completeness assessment percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  initialCompleteness?: number;
}

/**
 * Result from cultural consistency validation
 */
export class CulturalValidationResultDto extends BaseWorkflowResultDto {
  @ApiProperty({
    description: 'Session ID being validated',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Overall consistency score (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  consistencyScore: number;

  @ApiProperty({
    description: 'Whether validation passed minimum thresholds',
  })
  @IsBoolean()
  validationPassed: boolean;

  @ApiProperty({
    description: 'Specific consistency issues found',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  issues: string[];

  @ApiProperty({
    description: 'Recommendations for improvement',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @ApiProperty({
    description: 'Indigenous identity consistency check',
  })
  @IsBoolean()
  indigenousConsistency: boolean;

  @ApiProperty({
    description: 'Language-culture alignment assessment',
  })
  @IsBoolean()
  languageCultureAlignment: boolean;

  @ApiProperty({
    description: 'Next recommended action based on validation',
    enum: [
      'proceed_to_completeness',
      'address_consistency_issues',
      'request_clarification',
      'abandon_workflow',
    ],
  })
  @IsEnum([
    'proceed_to_completeness',
    'address_consistency_issues',
    'request_clarification',
    'abandon_workflow',
  ])
  nextAction:
    | 'proceed_to_completeness'
    | 'address_consistency_issues'
    | 'request_clarification'
    | 'abandon_workflow';
}

/**
 * Result from identity completeness assessment
 */
export class IdentityCompletenessResultDto extends BaseWorkflowResultDto {
  @ApiProperty({
    description: 'Session ID being assessed',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Overall completeness percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  completenessPercentage: number;

  @ApiProperty({
    description: 'Number of completed fields',
    minimum: 0,
  })
  @IsNumber()
  completedFields: number;

  @ApiProperty({
    description: 'Total number of possible fields',
    minimum: 0,
  })
  @IsNumber()
  totalFields: number;

  @ApiProperty({
    description: 'Whether minimum completeness threshold is met',
  })
  @IsBoolean()
  meetsMinimumRequirements: boolean;

  @ApiProperty({
    description: 'Missing fields that could improve completeness',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  missingFields: string[];

  @ApiProperty({
    description: 'Specific recommendations for improvement',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @ApiProperty({
    description: 'Priority level for each missing field',
    type: 'object',
    additionalProperties: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
    },
  })
  fieldPriorities: Record<string, 'high' | 'medium' | 'low'>;

  @ApiProperty({
    description: 'Next recommended action based on completeness',
    enum: [
      'proceed_to_creation',
      'improve_completeness',
      'request_additional_info',
      'create_with_warnings',
    ],
  })
  @IsEnum([
    'proceed_to_creation',
    'improve_completeness',
    'request_additional_info',
    'create_with_warnings',
  ])
  nextAction:
    | 'proceed_to_creation'
    | 'improve_completeness'
    | 'request_additional_info'
    | 'create_with_warnings';
}

/**
 * Result from final identity creation
 */
export class IdentityCreationResultDto extends BaseWorkflowResultDto {
  @ApiProperty({
    description: 'Session ID that was finalized',
  })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({
    description: 'Created identity ID (UUID)',
  })
  @IsOptional()
  @IsUUID()
  identityId?: string;

  @ApiPropertyOptional({
    description: 'Complete created identity data',
    type: IdentityResponseDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => IdentityResponseDto)
  identityData?: IdentityResponseDto;

  @ApiPropertyOptional({
    description: 'User Business ID of created identity',
  })
  @IsOptional()
  @IsString()
  userBusinessId?: string;

  @ApiProperty({
    description: 'Final completeness percentage achieved',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  finalCompleteness: number;

  @ApiProperty({
    description: 'Final cultural consistency score',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  finalConsistencyScore: number;

  @ApiProperty({
    description: 'Languages registered for this identity',
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  registeredLanguages: number[];

  @ApiProperty({
    description: 'Cultural identity flags set',
  })
  culturalIdentityFlags: {
    hasGender: boolean;
    hasRace: boolean;
    hasIndigenousStatus: boolean;
    hasDisabilityStatus: boolean;
  };

  @ApiProperty({
    description: 'Event IDs generated during creation',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  generatedEvents: string[];
}

/**
 * Result from bulk identity operations
 */
export class BulkIdentityResultDto extends BaseWorkflowResultDto {
  @ApiProperty({
    description: 'Total number of identities processed',
    minimum: 0,
  })
  @IsNumber()
  totalProcessed: number;

  @ApiProperty({
    description: 'Number of identities successfully created',
    minimum: 0,
  })
  @IsNumber()
  successCount: number;

  @ApiProperty({
    description: 'Number of identities that failed processing',
    minimum: 0,
  })
  @IsNumber()
  failureCount: number;

  @ApiProperty({
    description: 'Number of identities with warnings',
    minimum: 0,
  })
  @IsNumber()
  warningCount: number;

  @ApiProperty({
    description: 'Results for individual identities',
    type: [IdentityCreationResultDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IdentityCreationResultDto)
  individualResults: IdentityCreationResultDto[];

  @ApiProperty({
    description: 'Aggregated demographic statistics from processed identities',
    type: 'object',
    additionalProperties: true,
  })
  demographicSummary: {
    languageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    raceDistribution: Record<string, number>;
    indigenousCount: number;
    disabilityCount: number;
    averageCompleteness: number;
    averageConsistencyScore: number;
  };

  @ApiProperty({
    description: 'Performance metrics for the bulk operation',
    type: 'object',
    additionalProperties: true,
  })
  performanceMetrics: {
    processedCount: number;
    successCount: number;
    errorCount: number;
    totalProcessingTimeMs: number;
    averageProcessingTimeMs: number;
    memoryUsageMB: number;
  };
}

/**
 * Result from session cleanup operations
 */
export class SessionCleanupResultDto extends BaseWorkflowResultDto {
  @ApiProperty({
    description: 'Number of expired sessions cleaned up',
    minimum: 0,
  })
  @IsNumber()
  cleanedSessionCount: number;

  @ApiProperty({
    description: 'Number of active sessions remaining',
    minimum: 0,
  })
  @IsNumber()
  activeSessionCount: number;

  @ApiProperty({
    description: 'Storage space freed (in bytes)',
    minimum: 0,
  })
  @IsNumber()
  freedSpaceBytes: number;

  @ApiProperty({
    description: 'Session IDs that were cleaned up',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  cleanedSessionIds: string[];
}
