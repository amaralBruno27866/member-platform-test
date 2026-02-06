/**
 * Contact Orchestrator Interface
 *
 * Defines the contract for Contact workflow orchestration services.
 * This interface coordinates the complete contact lifecycle:
 * - Staging: Temporary storage with validation during registration
 * - Validation: Business rules, social media normalization, business ID uniqueness
 * - Persistence: Creating permanent contact records linked to accounts
 * - Bulk Operations: Efficient batch processing for multiple contacts
 * - Session Management: Redis-based workflow state tracking
 * - Professional Networking: Contact relationship analysis and job title analytics
 *
 * Design Philosophy:
 * - Decouple workflow coordination from business logic
 * - Enable testable and mockable orchestrator implementations
 * - Support both single and bulk contact operations
 * - Provide comprehensive status tracking and error handling
 * - Enable social media profile management workflows
 *
 * Integration Points:
 * - ContactCrudService: Core CRUD operations
 * - ContactBusinessRuleService: Validation and social media normalization
 * - ContactLookupService: Professional networking and analytics
 * - Redis: Session state management
 * - Business ID Validator: Uniqueness validation
 */

import { CreateContactDto } from '../../dtos/create-contact.dto';

/**
 * Contact staging result containing session ID and validation status
 */
export interface ContactStagingResult {
  sessionId: string;
  status: 'staged' | 'validation_pending' | 'validation_failed';
  contactData: CreateContactDto;
  businessId?: string;
  socialMediaProfiles?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
  };
  nextStep: 'validation' | 'retry_staging';
  validationWarnings?: string[];
  expiresAt: Date;
}

/**
 * Contact validation result with normalization and business rule checks
 */
export interface ContactValidationResult {
  sessionId: string;
  status: 'validated' | 'validation_failed' | 'requires_manual_review';
  originalData: CreateContactDto;
  normalizedData?: CreateContactDto;
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
  nextStep: 'persistence' | 'manual_review' | 'retry_validation';
  validatedAt: Date;
}

/**
 * Contact persistence result after creating permanent record
 */
export interface ContactPersistenceResult {
  sessionId: string;
  accountGuid: string;
  contactId: string;
  businessId?: string;
  status: 'active' | 'persistence_failed';
  socialMediaSummary: {
    totalProfiles: number;
    platforms: string[];
    normalizedUrls: Record<string, string>;
  };
  communicationPreferences: {
    hasEmail: boolean;
    hasPhone: boolean;
    hasWebsite: boolean;
    preferredMethod: 'email' | 'phone' | 'website' | 'social' | 'unknown';
  };
  nextStep: 'complete' | 'retry_persistence';
  persistedAt: Date;
  dataverseResponse?: any;
}

/**
 * Bulk contact operation progress tracking
 */
export interface BulkContactProgress {
  batchId: string;
  accountGuid: string;
  totalContacts: number;
  progress: {
    staged: number;
    validated: number;
    persisted: number;
    failed: number;
  };
  completedContacts: string[];
  failedContacts: Array<{
    sessionId: string;
    error: string;
    retryable: boolean;
  }>;
  businessIdCollisions: Array<{
    sessionId: string;
    businessId: string;
    existingContactId: string;
  }>;
  batchStatus: 'in_progress' | 'completed' | 'partial_failure' | 'failed';
  startedAt: Date;
  estimatedCompletionAt?: Date;
}

/**
 * Contact session state for Redis storage
 */
export interface ContactSessionState {
  sessionId: string;
  accountGuid: string;
  businessId?: string;
  currentStep:
    | 'staging'
    | 'validation'
    | 'persistence'
    | 'completed'
    | 'failed';
  contactData: CreateContactDto;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    registrationFlow: 'web' | 'mobile' | 'api' | 'bulk';
    startedAt: Date;
    lastUpdatedAt: Date;
  };
  validationHistory: Array<{
    step: string;
    status: string;
    timestamp: Date;
    details?: any;
  }>;
  expiresAt: Date;
}

/**
 * Social media profile analysis result
 */
export interface SocialMediaAnalysisResult {
  profilesFound: number;
  platforms: string[];
  normalizedUrls: Record<string, string>;
  profileQuality: {
    facebook?: 'valid' | 'invalid' | 'suspicious';
    instagram?: 'valid' | 'invalid' | 'suspicious';
    tiktok?: 'valid' | 'invalid' | 'suspicious';
    linkedin?: 'valid' | 'invalid' | 'suspicious';
  };
  businessNetworking: {
    hasLinkedIn: boolean;
    hasBusinessWebsite: boolean;
    professionalScore: number; // 0-100
  };
  recommendations: string[];
}

/**
 * Professional networking insights
 */
export interface ProfessionalNetworkingInsights {
  jobTitleCategory: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'executive' | 'unknown';
  industryTags: string[];
  networkingPotential: number; // 0-100 score
  suggestedConnections: Array<{
    contactId: string;
    reason: string;
    confidence: number;
  }>;
  careerStageIndicators: {
    hasBusinessEmail: boolean;
    hasLinkedInProfile: boolean;
    hasBusinessWebsite: boolean;
    professionalPhoneNumber: boolean;
  };
}

/**
 * Main Contact Orchestrator Interface
 *
 * Defines all operations for contact workflow management
 */
export interface ContactOrchestrator {
  // ==========================================
  // STAGING OPERATIONS
  // ==========================================

  /**
   * Stage contact data for validation
   * Creates a temporary session in Redis with contact data
   */
  stageContact(
    contactData: CreateContactDto,
    accountGuid: string,
    options?: {
      skipInitialValidation?: boolean;
      sessionTtl?: number;
      registrationFlow?: 'web' | 'mobile' | 'api';
    },
  ): Promise<ContactStagingResult>;

  /**
   * Retrieve staged contact by session ID
   */
  getStagedContact(sessionId: string): Promise<ContactSessionState | null>;

  /**
   * Update staged contact data
   */
  updateStagedContact(
    sessionId: string,
    updates: Partial<CreateContactDto>,
  ): Promise<ContactStagingResult>;

  // ==========================================
  // VALIDATION OPERATIONS
  // ==========================================

  /**
   * Validate staged contact data
   * Applies business rules, normalizes social media URLs, checks business ID uniqueness
   */
  validateStagedContact(
    sessionId: string,
    options?: {
      skipBusinessIdCheck?: boolean;
      skipSocialMediaNormalization?: boolean;
    },
  ): Promise<ContactValidationResult>;

  /**
   * Analyze social media profiles
   */
  analyzeSocialMediaProfiles(
    sessionId: string,
  ): Promise<SocialMediaAnalysisResult>;

  /**
   * Generate professional networking insights
   */
  generateNetworkingInsights(
    sessionId: string,
  ): Promise<ProfessionalNetworkingInsights>;

  // ==========================================
  // PERSISTENCE OPERATIONS
  // ==========================================

  /**
   * Persist validated contact to Dataverse
   * Creates permanent contact record and cleans up session
   */
  persistValidatedContact(
    sessionId: string,
    options?: {
      setPrimaryContact?: boolean;
      generateBusinessId?: boolean;
    },
  ): Promise<ContactPersistenceResult>;

  /**
   * Complete contact workflow
   * Finalizes the process and triggers post-creation events
   */
  completeContactWorkflow(sessionId: string): Promise<{
    contactId: string;
    businessId?: string;
    workflowCompleted: boolean;
    nextActions: string[];
  }>;

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  /**
   * Process multiple contacts in batch
   */
  processBulkContacts(
    contacts: CreateContactDto[],
    accountGuid: string,
    options?: {
      batchSize?: number;
      continueOnError?: boolean;
      validateBusinessIdUniqueness?: boolean;
    },
  ): Promise<BulkContactProgress>;

  /**
   * Get bulk operation status
   */
  getBulkOperationStatus(batchId: string): Promise<BulkContactProgress>;

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
   * Cancel and cleanup session
   */
  cancelSession(sessionId: string): Promise<{ cancelled: boolean }>;

  /**
   * Get all active sessions for account
   */
  getActiveSessions(accountGuid: string): Promise<ContactSessionState[]>;

  // ==========================================
  // ANALYTICS AND INSIGHTS
  // ==========================================

  /**
   * Get contact workflow analytics
   */
  getWorkflowAnalytics(accountGuid: string): Promise<{
    totalProcessed: number;
    successRate: number;
    averageProcessingTime: number;
    commonFailureReasons: Array<{
      reason: string;
      count: number;
    }>;
    socialMediaAdoptionRate: number;
    businessIdGenerationRate: number;
  }>;

  /**
   * Get professional networking analytics
   */
  getProfessionalNetworkingAnalytics(accountGuid: string): Promise<{
    totalContacts: number;
    withLinkedInProfiles: number;
    withBusinessEmails: number;
    jobTitleDistribution: Record<string, number>;
    industryDistribution: Record<string, number>;
    networkingOpportunities: number;
  }>;
}
