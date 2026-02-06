import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  IsDate,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ORCHESTRATOR DTO SPECIFICATION: Contact Session Management
 *
 * These DTOs define the exact structure for Redis session storage and
 * API communication during the contact workflow.
 *
 * Used by: ContactOrchestrator, RedisService, Public Controller
 */

/**
 * Options for contact staging operations
 */
export class ContactStagingOptionsDto {
  @ApiPropertyOptional({
    description: 'Skip initial format validation during staging',
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
    enum: ['web', 'mobile', 'api'],
    default: 'web',
  })
  @IsOptional()
  @IsEnum(['web', 'mobile', 'api'])
  registrationFlow?: 'web' | 'mobile' | 'api';

  @ApiPropertyOptional({
    description: 'Skip business ID uniqueness check',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  skipBusinessIdCheck?: boolean;

  @ApiPropertyOptional({
    description: 'Skip social media URL normalization',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  skipSocialMediaNormalization?: boolean;
}

/**
 * Result of contact staging operation
 */
export class ContactStagingResultDto {
  @ApiProperty({
    description: 'Unique session identifier',
    example: 'sess_contact_1699123456789_abc123',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Current staging status',
    enum: ['staged', 'validation_pending', 'validation_failed'],
  })
  @IsEnum(['staged', 'validation_pending', 'validation_failed'])
  status: 'staged' | 'validation_pending' | 'validation_failed';

  @ApiProperty({
    description: 'Business ID extracted from contact data',
    example: 'john.doe.2024',
  })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiProperty({
    description: 'Social media profiles found in contact data',
  })
  @IsOptional()
  @IsObject()
  socialMediaProfiles?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
  };

  @ApiProperty({
    description: 'Next recommended workflow step',
    enum: ['validation', 'retry_staging'],
  })
  @IsEnum(['validation', 'retry_staging'])
  nextStep: 'validation' | 'retry_staging';

  @ApiProperty({
    description: 'Non-critical validation warnings',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  validationWarnings?: string[];

  @ApiProperty({
    description: 'Session expiration timestamp',
  })
  @IsDate()
  @Type(() => Date)
  expiresAt: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata about the staging process',
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    processingTimeMs?: number;
  };
}

/**
 * Contact validation options
 */
export class ContactValidationOptionsDto {
  @ApiPropertyOptional({
    description: 'Skip business ID uniqueness check',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  skipBusinessIdCheck?: boolean;

  @ApiPropertyOptional({
    description: 'Skip social media URL normalization',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  skipSocialMediaNormalization?: boolean;

  @ApiPropertyOptional({
    description: 'Generate professional networking insights',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  generateNetworkingInsights?: boolean;

  @ApiPropertyOptional({
    description: 'Perform job title analysis',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  performJobTitleAnalysis?: boolean;
}

/**
 * Contact validation result DTO
 */
export class ContactValidationResultDto {
  @ApiProperty({
    description: 'Session identifier',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Validation status',
    enum: ['validated', 'validation_failed', 'requires_manual_review'],
  })
  @IsEnum(['validated', 'validation_failed', 'requires_manual_review'])
  status: 'validated' | 'validation_failed' | 'requires_manual_review';

  @ApiProperty({
    description: 'Comprehensive validation results',
  })
  @IsObject()
  validationResults: {
    businessIdUnique: boolean;
    socialMediaNormalized: boolean;
    emailValid: boolean;
    phoneValid: boolean;
    businessRulesApplied: string[];
    professionalNetworking?: {
      jobTitleAnalyzed: boolean;
      industryDetected: boolean;
      experienceLevelEstimated: boolean;
    };
    warnings: string[];
    errors: string[];
  };

  @ApiProperty({
    description: 'Next recommended workflow step',
    enum: ['persistence', 'manual_review', 'retry_validation'],
  })
  @IsEnum(['persistence', 'manual_review', 'retry_validation'])
  nextStep: 'persistence' | 'manual_review' | 'retry_validation';

  @ApiProperty({
    description: 'Validation completion timestamp',
  })
  @IsDate()
  @Type(() => Date)
  validatedAt: Date;

  @ApiPropertyOptional({
    description: 'Professional networking insights if generated',
  })
  @IsOptional()
  @IsObject()
  networkingInsights?: {
    jobTitleCategory: string;
    experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' | 'unknown';
    industryTags: string[];
    networkingPotential: number;
  };
}

/**
 * Contact persistence options
 */
export class ContactPersistenceOptionsDto {
  @ApiPropertyOptional({
    description: 'Set as primary contact for the account',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  setPrimaryContact?: boolean;

  @ApiPropertyOptional({
    description: 'Generate business ID if not provided',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  generateBusinessId?: boolean;

  @ApiPropertyOptional({
    description: 'Trigger post-creation events',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  triggerEvents?: boolean;

  @ApiPropertyOptional({
    description: 'Update existing contact if business ID collision detected',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  updateOnCollision?: boolean;
}

/**
 * Contact persistence result DTO
 */
export class ContactPersistenceResultDto {
  @ApiProperty({
    description: 'Session identifier',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'Account GUID the contact belongs to',
  })
  @IsString()
  accountGuid: string;

  @ApiProperty({
    description: 'Created contact ID',
    example: 'ct-00001234',
  })
  @IsString()
  contactId: string;

  @ApiProperty({
    description: 'Business ID assigned to contact',
    example: 'john.doe.2024',
  })
  @IsOptional()
  @IsString()
  businessId?: string;

  @ApiProperty({
    description: 'Contact status after persistence',
    enum: ['active', 'persistence_failed'],
  })
  @IsEnum(['active', 'persistence_failed'])
  status: 'active' | 'persistence_failed';

  @ApiProperty({
    description: 'Social media profile summary',
  })
  @IsObject()
  socialMediaSummary: {
    totalProfiles: number;
    platforms: string[];
    normalizedUrls: Record<string, string>;
  };

  @ApiProperty({
    description: 'Communication preferences analysis',
  })
  @IsObject()
  communicationPreferences: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasWebsite: boolean;
    preferredMethod: 'email' | 'phone' | 'website' | 'social' | 'unknown';
  };

  @ApiProperty({
    description: 'Next recommended workflow step',
    enum: ['complete', 'retry_persistence'],
  })
  @IsEnum(['complete', 'retry_persistence'])
  nextStep: 'complete' | 'retry_persistence';

  @ApiProperty({
    description: 'Persistence completion timestamp',
  })
  @IsDate()
  @Type(() => Date)
  persistedAt: Date;

  @ApiPropertyOptional({
    description: 'Professional networking recommendations',
  })
  @IsOptional()
  @IsArray()
  networkingRecommendations?: Array<{
    type: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Session management DTOs
 */
export class SessionExtensionDto {
  @ApiPropertyOptional({
    description: 'Additional TTL in seconds',
    default: 3600,
    minimum: 300,
    maximum: 86400,
  })
  @IsOptional()
  @IsNumber()
  additionalTtl?: number;
}

export class SessionExtensionResultDto {
  @ApiProperty({
    description: 'New session expiration timestamp',
  })
  @IsDate()
  @Type(() => Date)
  expiresAt: Date;

  @ApiPropertyOptional({
    description: 'Total session extensions performed',
  })
  @IsOptional()
  @IsNumber()
  totalExtensions?: number;
}

export class SessionCancellationResultDto {
  @ApiProperty({
    description: 'Whether session was successfully cancelled',
  })
  @IsBoolean()
  cancelled: boolean;

  @ApiPropertyOptional({
    description: 'Reason for cancellation failure',
  })
  @IsOptional()
  @IsString()
  failureReason?: string;
}
