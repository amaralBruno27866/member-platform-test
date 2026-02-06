/**
 * Identity Orchestrator Interface
 *
 * Defines the contract for Identity workflow orchestration services.
 * This interface coordinates the complete identity lifecycle:
 * - Staging: Temporary storage with cultural sensitivity analysis during registration
 * - Validation: Business rules, cultural consistency, multi-language preferences, User Business ID validation
 * - Persistence: Creating permanent identity records with cultural and demographic tracking
 * - Bulk Operations: Efficient batch processing for multiple identities with demographic analytics
 * - Session Management: Redis-based workflow state tracking with cultural analysis
 * - Cultural Analytics: Indigenous identity tracking, gender/race distribution analysis
 *
 * Design Philosophy:
 * - Decouple workflow coordination from business logic
 * - Enable testable and mockable orchestrator implementations
 * - Support both single and bulk identity operations with cultural sensitivity
 * - Provide comprehensive status tracking and error handling with cultural context
 * - Enable multi-language workflow management
 * - Respect indigenous identity and cultural sensitivity requirements
 *
 * Integration Points:
 * - IdentityCrudService: Core CRUD operations
 * - IdentityBusinessRuleService: Validation and cultural consistency analysis
 * - IdentityLookupService: Cultural analytics and demographic insights
 * - Redis: Session state management with cultural analysis
 * - User Business ID Validator: Identity uniqueness validation
 */

import { IdentityCreateDto } from '../../dtos/identity-create.dto';
import {
  CulturalConsistencyAnalysisDto,
  IdentityCompletenessDto,
} from '../dto/identity-session.dto';

/**
 * Identity staging result containing session ID and cultural validation status
 */
export interface IdentityStagingResult {
  sessionId: string;
  status: 'staged' | 'cultural_analysis_pending' | 'cultural_validation_failed';
  identityData: IdentityCreateDto;
  userBusinessId?: string;
  culturalAnalysis: {
    indigenousIdentityDetected: boolean;
    culturalSensitivityFlags: string[];
    requiredLanguagePreferences: string[];
    culturalConsistencyScore: number; // 0-100
  };
  nextStep: 'cultural_validation' | 'retry_staging';
  culturalWarnings?: string[];
  expiresAt: Date;
}

/**
 * Cultural validation result with consistency and sensitivity checks
 */
export interface CulturalValidationResult {
  sessionId: string;
  status:
    | 'culturally_validated'
    | 'cultural_validation_failed'
    | 'requires_cultural_review';
  originalData: IdentityCreateDto;
  culturallyValidatedData?: IdentityCreateDto;
  validationResults: {
    userBusinessIdUnique: boolean;
    culturalConsistencyValidated: boolean;
    indigenousIdentityValidated: boolean;
    languagePreferencesValidated: boolean;
    genderRaceConsistency: boolean;
    businessRulesApplied: string[];
    culturalSensitivity: {
      indigenousProtocolsRespected: boolean;
      culturalTerminologyValidated: boolean;
      traditionalNamesRecognized: boolean;
      culturalContextPreserved: boolean;
    };
    warnings: string[];
    errors: string[];
  };
  nextStep: 'persistence' | 'cultural_review' | 'retry_validation';
  validatedAt: Date;
}

/**
 * Identity persistence result after creating permanent record with cultural context
 */
export interface IdentityPersistenceResult {
  sessionId: string;
  accountGuid: string;
  identityId: string;
  userBusinessId?: string;
  status: 'active' | 'persistence_failed';
  culturalSummary: {
    indigenousIdentity: boolean;
    primaryLanguage: string;
    secondaryLanguages: string[];
    culturalFlags: string[];
    completenessScore: number;
  };
  demographicProfile: {
    hasGenderIdentity: boolean;
    hasRaceEthnicity: boolean;
    hasIndigenousMarkers: boolean;
    hasDisabilityMarkers: boolean;
    hasLanguagePreferences: boolean;
    completenessLevel: 'minimal' | 'basic' | 'comprehensive' | 'complete';
  };
  nextStep: 'complete' | 'retry_persistence';
  persistedAt: Date;
  dataverseResponse?: any;
}

/**
 * Bulk identity operation progress tracking with demographic analytics
 */
export interface BulkIdentityProgress {
  batchId: string;
  accountGuid: string;
  totalIdentities: number;
  progress: {
    staged: number;
    culturallyValidated: number;
    persisted: number;
    failed: number;
  };
  completedIdentities: string[];
  failedIdentities: Array<{
    sessionId: string;
    error: string;
    culturalIssue?: boolean;
    retryable: boolean;
  }>;
  userBusinessIdCollisions: Array<{
    sessionId: string;
    userBusinessId: string;
    existingIdentityId: string;
  }>;
  demographicSummary: {
    languageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    raceDistribution: Record<string, number>;
    indigenousCount: number;
    disabilityCount: number;
    averageCompleteness: number;
    averageConsistencyScore: number;
  };
  batchStatus: 'in_progress' | 'completed' | 'partial_failure' | 'failed';
  startedAt: Date;
  estimatedCompletionAt?: Date;
}

/**
 * Identity session state for Redis storage with cultural analysis
 */
export interface IdentitySessionState {
  sessionId: string;
  accountGuid: string;
  userBusinessId?: string;
  currentStep:
    | 'staging'
    | 'cultural_validation'
    | 'persistence'
    | 'completed'
    | 'failed';
  identityData: IdentityCreateDto;
  culturalAnalysis: CulturalConsistencyAnalysisDto;
  completenessAssessment: IdentityCompletenessDto;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    preferredLanguage?: string;
    culturalContext?: string;
    registrationFlow: 'web' | 'mobile' | 'api' | 'bulk';
    startedAt: Date;
    lastUpdatedAt: Date;
  };
  validationHistory: Array<{
    step: string;
    status: string;
    culturalFlags?: string[];
    timestamp: Date;
    details?: any;
  }>;
  expiresAt: Date;
}

/**
 * Cultural consistency analysis result
 */
export interface CulturalConsistencyAnalysisResult {
  consistencyScore: number; // 0-100
  culturalFlags: string[];
  indigenousIdentityMarkers: {
    detected: boolean;
    confidence: number;
    traditionalNames: string[];
    culturalTerminology: string[];
  };
  languageConsistency: {
    primaryLanguage: string;
    secondaryLanguages: string[];
    languageFamily: string;
    consistentWithCulturalMarkers: boolean;
  };
  demographicCoherence: {
    genderRaceAlignment: boolean;
    culturalBackgroundConsistency: boolean;
    geographicConsistency: boolean;
  };
  recommendations: string[];
  sensitivityWarnings: string[];
}

/**
 * Multi-language preference analysis
 */
export interface MultiLanguagePreferenceAnalysis {
  detectedLanguages: string[];
  primaryLanguageConfidence: number; // 0-100
  multilingualIndicators: {
    hasMultipleLanguages: boolean;
    linguisticDiversity: number;
    culturalLinguisticAlignment: boolean;
  };
  communicationPreferences: {
    preferredLanguage: string;
    fallbackLanguages: string[];
    writingSystemPreferences: string[];
  };
  culturalLinguisticContext: {
    indigenousLanguagePresent: boolean;
    heritageLanguageMaintenance: boolean;
    languageRevitalizationRelevant: boolean;
  };
}

/**
 * User Business ID validation insights
 */
export interface UserBusinessIdValidationInsights {
  validationStatus: 'unique' | 'duplicate' | 'similar' | 'invalid_format';
  existingMatches: Array<{
    identityId: string;
    userBusinessId: string;
    similarity: number;
    accountGuid: string;
  }>;
  formatValidation: {
    isValid: boolean;
    format: string;
    generatedAlternatives?: string[];
  };
  businessContext: {
    hasBusinessIdentity: boolean;
    professionalMarkers: string[];
    organizationalAffiliations: string[];
  };
}

/**
 * Main Identity Orchestrator Interface
 *
 * Defines all operations for identity workflow management with cultural sensitivity
 */
export interface IdentityOrchestrator {
  // ==========================================
  // STAGING OPERATIONS
  // ==========================================

  /**
   * Stage identity data for cultural validation
   * Creates a temporary session in Redis with identity data and cultural analysis
   */
  stageIdentity(
    identityData: IdentityCreateDto,
    accountGuid: string,
    options?: {
      skipInitialCulturalAnalysis?: boolean;
      sessionTtl?: number;
      registrationFlow?: 'web' | 'mobile' | 'api';
      preferredLanguage?: string;
      culturalContext?: string;
    },
  ): Promise<IdentityStagingResult>;

  /**
   * Retrieve staged identity by session ID
   */
  getStagedIdentity(sessionId: string): Promise<IdentitySessionState | null>;

  /**
   * Update staged identity data with cultural re-analysis
   */
  updateStagedIdentity(
    sessionId: string,
    updates: Partial<IdentityCreateDto>,
    options?: {
      rerunCulturalAnalysis?: boolean;
    },
  ): Promise<IdentityStagingResult>;

  // ==========================================
  // CULTURAL VALIDATION OPERATIONS
  // ==========================================

  /**
   * Validate staged identity data with cultural sensitivity
   * Applies business rules, analyzes cultural consistency, validates User Business ID uniqueness
   */
  validateStagedIdentity(
    sessionId: string,
    options?: {
      skipUserBusinessIdCheck?: boolean;
      skipCulturalConsistencyAnalysis?: boolean;
      respectIndigenousProtocols?: boolean;
    },
  ): Promise<CulturalValidationResult>;

  /**
   * Analyze cultural consistency and sensitivity
   */
  analyzeCulturalConsistency(
    sessionId: string,
  ): Promise<CulturalConsistencyAnalysisResult>;

  /**
   * Analyze multi-language preferences and cultural linguistic context
   */
  analyzeMultiLanguagePreferences(
    sessionId: string,
  ): Promise<MultiLanguagePreferenceAnalysis>;

  /**
   * Validate User Business ID uniqueness and format
   */
  validateUserBusinessId(
    sessionId: string,
  ): Promise<UserBusinessIdValidationInsights>;

  // ==========================================
  // PERSISTENCE OPERATIONS
  // ==========================================

  /**
   * Persist culturally validated identity to Dataverse
   * Creates permanent identity record with cultural context and cleans up session
   */
  persistValidatedIdentity(
    sessionId: string,
    options?: {
      setPrimaryIdentity?: boolean;
      generateUserBusinessId?: boolean;
      preserveCulturalContext?: boolean;
    },
  ): Promise<IdentityPersistenceResult>;

  /**
   * Complete identity workflow with cultural sensitivity protocols
   * Finalizes the process and triggers post-creation events with cultural context
   */
  completeIdentityWorkflow(sessionId: string): Promise<{
    identityId: string;
    userBusinessId?: string;
    culturalFlags: string[];
    workflowCompleted: boolean;
    nextActions: string[];
  }>;

  // ==========================================
  // BULK OPERATIONS WITH DEMOGRAPHIC ANALYTICS
  // ==========================================

  /**
   * Process multiple identities in batch with demographic tracking
   */
  processBulkIdentities(
    identities: IdentityCreateDto[],
    accountGuid: string,
    options?: {
      batchSize?: number;
      continueOnError?: boolean;
      validateUserBusinessIdUniqueness?: boolean;
      respectCulturalSensitivity?: boolean;
      generateDemographicReport?: boolean;
    },
  ): Promise<BulkIdentityProgress>;

  /**
   * Get bulk operation status with demographic insights
   */
  getBulkOperationStatus(batchId: string): Promise<BulkIdentityProgress>;

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /**
   * Extend session expiration
   */
  extendSession(
    sessionId: string,
    additionalTtl?: number,
  ): Promise<{ expiresAt: Date }>;

  /**
   * Cancel and cleanup session with cultural context preservation option
   */
  cancelSession(
    sessionId: string,
    options?: {
      preserveCulturalAnalysis?: boolean;
    },
  ): Promise<{ cancelled: boolean }>;

  /**
   * Get all active sessions for account with cultural context
   */
  getActiveSessions(accountGuid: string): Promise<IdentitySessionState[]>;

  /**
   * Cleanup expired sessions and orphaned cultural analysis data
   */
  cleanupExpiredSessions(): Promise<{
    cleanedSessionCount: number;
    activeSessionCount: number;
    freedSpaceBytes: number;
    cleanedSessionIds: string[];
  }>;

  // ==========================================
  // CULTURAL ANALYTICS AND DEMOGRAPHIC INSIGHTS
  // ==========================================

  /**
   * Get identity workflow analytics with cultural context
   */
  getWorkflowAnalytics(accountGuid: string): Promise<{
    totalProcessed: number;
    successRate: number;
    culturalValidationSuccessRate: number;
    averageProcessingTime: number;
    averageCulturalAnalysisTime: number;
    commonFailureReasons: Array<{
      reason: string;
      count: number;
      culturalRelated: boolean;
    }>;
    indigenousIdentityRate: number;
    multiLanguageRate: number;
    userBusinessIdGenerationRate: number;
  }>;

  /**
   * Get demographic and cultural distribution analytics
   */
  getDemographicAnalytics(accountGuid: string): Promise<{
    totalIdentities: number;
    languageDistribution: Record<string, number>;
    genderDistribution: Record<string, number>;
    raceEthnicityDistribution: Record<string, number>;
    indigenousIdentityCount: number;
    disabilityMarkerCount: number;
    averageCompletenessScore: number;
    averageCulturalConsistencyScore: number;
    multiLanguageSupport: {
      totalMultilingualIdentities: number;
      languagePairs: Record<string, number>;
      heritageLanguageMaintenance: number;
    };
    culturalSensitivityMetrics: {
      respectfulTerminologyUsage: number;
      traditionalNameRecognition: number;
      culturalProtocolAdherence: number;
    };
  }>;

  /**
   * Get User Business ID analytics and uniqueness insights
   */
  getUserBusinessIdAnalytics(accountGuid: string): Promise<{
    totalWithUserBusinessId: number;
    generatedVsProvided: {
      generated: number;
      provided: number;
    };
    formatDistribution: Record<string, number>;
    uniquenessViolations: number;
    businessContextAnalysis: {
      professionalIdentities: number;
      organizationalAffiliations: number;
      businessNetworkingOpportunities: number;
    };
  }>;
}
