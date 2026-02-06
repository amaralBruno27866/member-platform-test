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
 * ORCHESTRATOR DTO SPECIFICATION: Contact Workflow Results
 *
 * These DTOs define the structure for workflow completion results,
 * bulk operations, and analytics data.
 *
 * Used by: ContactOrchestrator, Analytics Service, Bulk Operations
 */

/**
 * Complete workflow result DTO
 */
export class ContactWorkflowCompletionDto {
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
    description: 'Whether workflow completed successfully',
  })
  @IsBoolean()
  workflowCompleted: boolean;

  @ApiProperty({
    description: 'Recommended next actions for the user',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  nextActions: string[];

  @ApiPropertyOptional({
    description: 'Professional networking opportunities',
  })
  @IsOptional()
  @IsArray()
  networkingOpportunities?: Array<{
    type: string;
    description: string;
    contactId?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Workflow completion metadata',
  })
  @IsOptional()
  @IsObject()
  metadata?: {
    totalProcessingTimeMs: number;
    stepsCompleted: string[];
    automatedInsights: string[];
  };
}

/**
 * Bulk contact processing options
 */
export class BulkContactProcessingOptionsDto {
  @ApiPropertyOptional({
    description: 'Number of contacts to process in each batch',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  batchSize?: number;

  @ApiPropertyOptional({
    description: 'Continue processing if individual contact fails',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  continueOnError?: boolean;

  @ApiPropertyOptional({
    description: 'Validate business ID uniqueness across the batch',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  validateBusinessIdUniqueness?: boolean;

  @ApiPropertyOptional({
    description: 'Generate professional networking insights for all contacts',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  generateNetworkingInsights?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum processing time in seconds',
    default: 1800,
    minimum: 60,
    maximum: 3600,
  })
  @IsOptional()
  @IsNumber()
  maxProcessingTime?: number;
}

/**
 * Bulk contact processing progress DTO
 */
export class BulkContactProgressDto {
  @ApiProperty({
    description: 'Unique batch identifier',
    example: 'batch_contact_1699123456789_xyz789',
  })
  @IsString()
  batchId: string;

  @ApiProperty({
    description: 'Account GUID for the bulk operation',
  })
  @IsString()
  accountGuid: string;

  @ApiProperty({
    description: 'Total number of contacts in the batch',
  })
  @IsNumber()
  totalContacts: number;

  @ApiProperty({
    description: 'Processing progress breakdown',
  })
  @IsObject()
  progress: {
    staged: number;
    validated: number;
    persisted: number;
    failed: number;
  };

  @ApiProperty({
    description: 'Successfully completed contact IDs',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  completedContacts: string[];

  @ApiProperty({
    description: 'Failed contact processing details',
  })
  @IsArray()
  failedContacts: Array<{
    sessionId: string;
    error: string;
    retryable: boolean;
  }>;

  @ApiProperty({
    description: 'Business ID conflicts detected during processing',
  })
  @IsArray()
  businessIdCollisions: Array<{
    sessionId: string;
    businessId: string;
    existingContactId: string;
  }>;

  @ApiProperty({
    description: 'Overall batch processing status',
    enum: ['in_progress', 'completed', 'partial_failure', 'failed'],
  })
  @IsEnum(['in_progress', 'completed', 'partial_failure', 'failed'])
  batchStatus: 'in_progress' | 'completed' | 'partial_failure' | 'failed';

  @ApiProperty({
    description: 'Batch processing start timestamp',
  })
  @IsDate()
  @Type(() => Date)
  startedAt: Date;

  @ApiPropertyOptional({
    description: 'Estimated completion timestamp',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  estimatedCompletionAt?: Date;

  @ApiPropertyOptional({
    description: 'Processing performance metrics',
  })
  @IsOptional()
  @IsObject()
  performanceMetrics?: {
    averageProcessingTimePerContact: number;
    currentThroughput: number;
    estimatedTimeRemaining?: number;
  };
}

/**
 * Social media analysis result DTO
 */
export class SocialMediaAnalysisDto {
  @ApiProperty({
    description: 'Number of valid social media profiles found',
  })
  @IsNumber()
  profilesFound: number;

  @ApiProperty({
    description: 'Social media platforms detected',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  platforms: string[];

  @ApiProperty({
    description: 'Normalized social media URLs',
  })
  @IsObject()
  normalizedUrls: Record<string, string>;

  @ApiProperty({
    description: 'Quality assessment of each profile',
  })
  @IsObject()
  profileQuality: {
    facebook?: 'valid' | 'invalid' | 'suspicious';
    instagram?: 'valid' | 'invalid' | 'suspicious';
    tiktok?: 'valid' | 'invalid' | 'suspicious';
    linkedin?: 'valid' | 'invalid' | 'suspicious';
  };

  @ApiProperty({
    description: 'Business networking potential analysis',
  })
  @IsObject()
  businessNetworking: {
    hasLinkedIn: boolean;
    hasBusinessWebsite: boolean;
    professionalScore: number;
  };

  @ApiProperty({
    description: 'Automated recommendations for profile improvement',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];

  @ApiPropertyOptional({
    description: 'Additional insights and metadata',
  })
  @IsOptional()
  @IsObject()
  insights?: {
    socialMediaTrends: string[];
    industryBenchmarks?: {
      averageProfilesPerContact: number;
      linkedInAdoptionRate: number;
    };
  };
}

/**
 * Professional networking insights DTO
 */
export class ProfessionalNetworkingInsightsDto {
  @ApiProperty({
    description: 'Categorized job title',
    example: 'Software Development',
  })
  @IsString()
  jobTitleCategory: string;

  @ApiProperty({
    description: 'Estimated experience level',
    enum: ['entry', 'mid', 'senior', 'executive', 'unknown'],
  })
  @IsEnum(['entry', 'mid', 'senior', 'executive', 'unknown'])
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' | 'unknown';

  @ApiProperty({
    description: 'Industry classification tags',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  industryTags: string[];

  @ApiProperty({
    description: 'Networking potential score (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  networkingPotential: number;

  @ApiProperty({
    description: 'Suggested professional connections',
  })
  @IsArray()
  suggestedConnections: Array<{
    contactId: string;
    reason: string;
    confidence: number;
  }>;

  @ApiProperty({
    description: 'Career stage indicators analysis',
  })
  @IsObject()
  careerStageIndicators: {
    hasBusinessEmail: boolean;
    hasLinkedInProfile: boolean;
    hasBusinessWebsite: boolean;
    professionalPhoneNumber: boolean;
  };

  @ApiPropertyOptional({
    description: 'Industry-specific insights',
  })
  @IsOptional()
  @IsObject()
  industryInsights?: {
    commonJobProgression: string[];
    skillRecommendations: string[];
    networkingEvents?: string[];
  };
}

/**
 * Contact workflow analytics DTO
 */
export class ContactWorkflowAnalyticsDto {
  @ApiProperty({
    description: 'Total contacts processed',
  })
  @IsNumber()
  totalProcessed: number;

  @ApiProperty({
    description: 'Success rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  successRate: number;

  @ApiProperty({
    description: 'Average processing time in milliseconds',
  })
  @IsNumber()
  averageProcessingTime: number;

  @ApiProperty({
    description: 'Most common failure reasons',
  })
  @IsArray()
  commonFailureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;

  @ApiProperty({
    description: 'Social media adoption rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  socialMediaAdoptionRate: number;

  @ApiProperty({
    description: 'Business ID generation rate percentage (0-100)',
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  businessIdGenerationRate: number;

  @ApiPropertyOptional({
    description: 'Time-based analytics',
  })
  @IsOptional()
  @IsObject()
  timeBasedAnalytics?: {
    dailyProcessingVolume: Record<string, number>;
    peakProcessingHours: number[];
    seasonalTrends?: Record<string, number>;
  };

  @ApiPropertyOptional({
    description: 'Quality metrics',
  })
  @IsOptional()
  @IsObject()
  qualityMetrics?: {
    validationAccuracy: number;
    dataCompletenessScore: number;
    userSatisfactionScore?: number;
  };
}

/**
 * Professional networking analytics DTO
 */
export class ProfessionalNetworkingAnalyticsDto {
  @ApiProperty({
    description: 'Total contacts in the system',
  })
  @IsNumber()
  totalContacts: number;

  @ApiProperty({
    description: 'Number of contacts with LinkedIn profiles',
  })
  @IsNumber()
  withLinkedInProfiles: number;

  @ApiProperty({
    description: 'Number of contacts with business email addresses',
  })
  @IsNumber()
  withBusinessEmails: number;

  @ApiProperty({
    description: 'Distribution of job titles',
  })
  @IsObject()
  jobTitleDistribution: Record<string, number>;

  @ApiProperty({
    description: 'Distribution across industries',
  })
  @IsObject()
  industryDistribution: Record<string, number>;

  @ApiProperty({
    description: 'Total networking opportunities identified',
  })
  @IsNumber()
  networkingOpportunities: number;

  @ApiPropertyOptional({
    description: 'Professional development insights',
  })
  @IsOptional()
  @IsObject()
  professionalInsights?: {
    topGrowingIndustries: string[];
    emergingJobTitles: string[];
    skillDemandTrends: Record<string, number>;
    networkingEffectiveness: number;
  };

  @ApiPropertyOptional({
    description: 'Benchmarking data',
  })
  @IsOptional()
  @IsObject()
  benchmarks?: {
    industryAverageNetworkSize: number;
    linkedInPenetrationRate: number;
    professionalGrowthRate: number;
  };
}
