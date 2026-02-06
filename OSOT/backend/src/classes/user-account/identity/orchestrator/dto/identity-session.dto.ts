import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  IsDate,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Language,
  Gender,
  Race,
  IndigenousDetail,
  AccessModifier,
  Privilege,
} from '../../../../../common/enums';

/**
 * ORCHESTRATOR DTO SPECIFICATION: Identity Session Management
 *
 * These DTOs define the exact structure for Redis session storage and
 * API communication during the identity workflow.
 *
 * Used by: IdentityOrchestrator, RedisService, Public Controller
 */

/**
 * Options for identity staging operations
 */
export class IdentityStagingOptionsDto {
  @ApiPropertyOptional({
    description:
      'Skip initial User Business ID format validation during staging',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  skipInitialValidation?: boolean;

  @ApiPropertyOptional({
    description: 'Session time-to-live in seconds',
    default: 7200,
    minimum: 300,
    maximum: 86400,
  })
  @IsOptional()
  @IsNumber()
  sessionTtl?: number;

  @ApiPropertyOptional({
    description: 'Registration flow context',
    enum: ['web', 'mobile', 'api', 'import'],
    default: 'web',
  })
  @IsOptional()
  @IsString()
  flowContext?: 'web' | 'mobile' | 'api' | 'import';

  @ApiPropertyOptional({
    description: 'Enable cultural consistency analysis during staging',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enableCulturalAnalysis?: boolean;

  @ApiPropertyOptional({
    description: 'Auto-generate User Business ID if not provided',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoGenerateBusinessId?: boolean;

  @ApiPropertyOptional({
    description: 'Require minimum identity completeness percentage',
    minimum: 0,
    maximum: 100,
    default: 30,
  })
  @IsOptional()
  @IsNumber()
  minimumCompleteness?: number;
}

/**
 * Cultural consistency analysis results
 */
export class CulturalConsistencyAnalysisDto {
  @ApiProperty({
    description: 'Overall cultural consistency score (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  consistencyScore: number;

  @ApiProperty({
    description: 'Specific consistency issues found',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  issues: string[];

  @ApiProperty({
    description: 'Recommendations for improving cultural alignment',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @ApiProperty({
    description: 'Whether indigenous information is logically consistent',
  })
  @IsBoolean()
  indigenousConsistency: boolean;

  @ApiProperty({
    description: 'Language-culture alignment assessment',
  })
  @IsBoolean()
  languageCultureAlignment: boolean;
}

/**
 * Identity completeness assessment
 */
export class IdentityCompletenessDto {
  @ApiProperty({
    description: 'Overall completeness percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  completenessPercentage: number;

  @ApiProperty({
    description: 'Number of fields completed',
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
    description: 'List of missing optional fields',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  missingFields: string[];

  @ApiProperty({
    description: 'Recommendations for improving completeness',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @ApiProperty({
    description: 'Whether identity meets minimum requirements for registration',
  })
  @IsBoolean()
  meetsMinimumRequirements: boolean;
}

/**
 * Session metadata for tracking and debugging
 */
export class SessionMetadataDto {
  @ApiProperty({
    description: 'Session creation timestamp',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Last modification timestamp',
  })
  @IsDate()
  @Type(() => Date)
  lastModified: Date;

  @ApiProperty({
    description: 'Session expiration timestamp',
  })
  @IsDate()
  @Type(() => Date)
  expiresAt: Date;

  @ApiProperty({
    description: 'Source of the registration request',
  })
  @IsString()
  source: string;

  @ApiProperty({
    description: 'User agent or client information',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'IP address of the requesting client',
  })
  @IsOptional()
  @IsString()
  clientIp?: string;

  @ApiProperty({
    description: 'Number of validation attempts',
    minimum: 0,
  })
  @IsNumber()
  validationAttempts: number;
}

/**
 * Complete identity session stored in Redis during orchestration
 */
export class IdentitySessionDto {
  @ApiProperty({
    description: 'Unique session identifier',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Current session status',
    enum: [
      'staged',
      'validating',
      'cultural_analysis',
      'completeness_check',
      'ready_for_creation',
      'failed',
      'expired',
    ],
  })
  @IsEnum([
    'staged',
    'validating',
    'cultural_analysis',
    'completeness_check',
    'ready_for_creation',
    'failed',
    'expired',
  ])
  status:
    | 'staged'
    | 'validating'
    | 'cultural_analysis'
    | 'completeness_check'
    | 'ready_for_creation'
    | 'failed'
    | 'expired';

  // Core Identity Data (matching IdentityCreateDto structure)
  @ApiProperty({
    description: 'User business identifier (20 characters max)',
    maxLength: 20,
  })
  @IsString()
  @MaxLength(20)
  osot_user_business_id: string;

  @ApiPropertyOptional({
    description: 'Preferred or chosen name',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  osot_chosen_name?: string;

  @ApiProperty({
    description: 'Language preferences (at least one required)',
    type: [Number],
    enum: Language,
  })
  @IsArray()
  @IsEnum(Language, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  osot_language: Language[];

  @ApiPropertyOptional({
    description: 'Gender identity',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  osot_gender?: Gender;

  @ApiPropertyOptional({
    description: 'Racial identity',
    enum: Race,
  })
  @IsOptional()
  @IsEnum(Race)
  osot_race?: Race;

  @ApiPropertyOptional({
    description: 'Indigenous identity status',
  })
  @IsOptional()
  @IsBoolean()
  osot_indigenous?: boolean;

  @ApiPropertyOptional({
    description: 'Specific indigenous identity detail',
    enum: IndigenousDetail,
  })
  @IsOptional()
  @IsEnum(IndigenousDetail)
  osot_indigenous_detail?: IndigenousDetail;

  @ApiPropertyOptional({
    description: 'Other indigenous identity description',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  osot_indigenous_detail_other?: string;

  @ApiPropertyOptional({
    description: 'Disability status for accommodation purposes',
  })
  @IsOptional()
  @IsBoolean()
  osot_disability?: boolean;

  @ApiPropertyOptional({
    description: 'Privacy/visibility preferences',
    enum: AccessModifier,
  })
  @IsOptional()
  @IsEnum(AccessModifier)
  osot_access_modifiers?: AccessModifier;

  @ApiPropertyOptional({
    description: 'User privilege level',
    enum: Privilege,
  })
  @IsOptional()
  @IsEnum(Privilege)
  osot_privilege?: Privilege;

  // Orchestration-specific data
  @ApiProperty({
    description: 'Cultural consistency analysis results',
    type: CulturalConsistencyAnalysisDto,
  })
  @ValidateNested()
  @Type(() => CulturalConsistencyAnalysisDto)
  culturalAnalysis: CulturalConsistencyAnalysisDto;

  @ApiProperty({
    description: 'Identity completeness assessment',
    type: IdentityCompletenessDto,
  })
  @ValidateNested()
  @Type(() => IdentityCompletenessDto)
  completeness: IdentityCompletenessDto;

  @ApiProperty({
    description: 'Session tracking metadata',
    type: SessionMetadataDto,
  })
  @ValidateNested()
  @Type(() => SessionMetadataDto)
  metadata: SessionMetadataDto;

  @ApiProperty({
    description: 'Validation errors encountered',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  validationErrors: string[];

  @ApiProperty({
    description: 'Warnings that do not prevent creation',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  warnings: string[];

  @ApiProperty({
    description: 'Next recommended action for the workflow',
    enum: [
      'validate_business_id',
      'analyze_cultural_consistency',
      'assess_completeness',
      'create_identity',
      'retry_with_corrections',
      'abandon_session',
    ],
  })
  @IsEnum([
    'validate_business_id',
    'analyze_cultural_consistency',
    'assess_completeness',
    'create_identity',
    'retry_with_corrections',
    'abandon_session',
  ])
  nextAction:
    | 'validate_business_id'
    | 'analyze_cultural_consistency'
    | 'assess_completeness'
    | 'create_identity'
    | 'retry_with_corrections'
    | 'abandon_session';
}

/**
 * User Business ID validation results
 */
export class UserBusinessIdValidationDto {
  @ApiProperty({
    description: 'The User Business ID that was validated',
  })
  @IsString()
  userBusinessId: string;

  @ApiProperty({
    description: 'Whether the User Business ID is available',
  })
  @IsBoolean()
  isAvailable: boolean;

  @ApiProperty({
    description: 'Whether the format is valid (20 chars max, pattern match)',
  })
  @IsBoolean()
  formatValid: boolean;

  @ApiPropertyOptional({
    description: 'Suggested alternatives if not available',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  suggestions?: string[];

  @ApiPropertyOptional({
    description: 'Validation error message if any',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}

/**
 * Multi-language analysis results
 */
export class LanguageAnalysisDto {
  @ApiProperty({
    description: 'Selected language preferences',
    type: [Number],
    enum: Language,
  })
  @IsArray()
  @IsEnum(Language, { each: true })
  selectedLanguages: Language[];

  @ApiProperty({
    description: 'Whether minimum language requirement is met',
  })
  @IsBoolean()
  meetsRequirement: boolean;

  @ApiProperty({
    description: 'Suggested additional languages based on cultural identity',
    type: [Number],
    enum: Language,
  })
  @IsArray()
  @IsEnum(Language, { each: true })
  suggestedLanguages: Language[];

  @ApiProperty({
    description: 'Cultural alignment with selected languages',
  })
  @IsBoolean()
  culturalAlignment: boolean;

  @ApiPropertyOptional({
    description: 'Recommendations for language selection optimization',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];
}
