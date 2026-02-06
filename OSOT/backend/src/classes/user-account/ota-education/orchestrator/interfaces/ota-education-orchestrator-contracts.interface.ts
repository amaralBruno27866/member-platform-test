import { CreateOtaEducationDto } from '../../dtos/create-ota-education.dto';
import { OtaEducationResponseDto } from '../../dtos/ota-education-response.dto';

// Import types from local orchestrator DTOs
import type {
  OtaEducationStageRequest,
  OtaEducationStageResponse,
} from '../dto/ota-education-session.dto';
import type {
  OtaEducationWorkflowResult,
  OtaEducationValidationResult,
  OtaEducationLinkingResult,
  OtaEducationCreationResult,
  OtaEducationSessionResponse,
  OtaEducationBulkOperationResult,
} from '../dto/ota-education-workflow-results.dto';

/**
 * OTA Education Orchestrator Integration Contracts
 *
 * These interfaces define the contract between the OTA Education module and
 * the future Registration Orchestrator that will be built.
 *
 * The OTA Education module provides all necessary services (OtaEducationCrudService,
 * OtaEducationBusinessRuleService, etc.) but the orchestrator is responsible for:
 * - Session management in Redis
 * - Education validation workflows
 * - College-country alignment validation processes
 * - Account linking coordination
 * - Graduation category determination
 */

// ========================================
// ORCHESTRATOR INTERFACE CONTRACT
// ========================================

/**
 * Interface that the future orchestrator must implement
 * for OTA education registration workflows
 */
export interface OtaEducationOrchestrator {
  /**
   * Stage OTA education registration data in Redis
   *
   * @param request Education staging request with data and options
   * @returns Education registration session information
   *
   * Implementation should:
   * 1. Validate using OtaEducationBusinessRuleService.validateEducationRecord()
   * 2. Store session in Redis with expiration
   * 3. Initialize progress tracking
   * 4. Return session details
   */
  stageEducationRegistration(
    request: OtaEducationStageRequest,
  ): Promise<OtaEducationStageResponse>;

  /**
   * Validate staged OTA education data
   *
   * @param sessionId Redis session identifier
   * @returns Comprehensive validation results
   *
   * Implementation should:
   * 1. Retrieve session from Redis
   * 2. Perform college-country alignment validation
   * 3. Validate user business ID uniqueness
   * 4. Update session validation state
   * 5. Return detailed validation results
   */
  validateEducationData(
    sessionId: string,
  ): Promise<OtaEducationValidationResult>;

  /**
   * Link OTA education session to user account
   *
   * @param sessionId Redis session identifier
   * @param accountId User account to link
   * @returns Account linking results
   *
   * Implementation should:
   * 1. Verify account exists and is accessible
   * 2. Check privilege levels
   * 3. Update session with account information
   * 4. Return linking status
   */
  linkEducationToAccount(
    sessionId: string,
    accountId: string,
  ): Promise<OtaEducationLinkingResult>;

  /**
   * Create OTA education record from session
   *
   * @param sessionId Redis session identifier
   * @returns Education creation results
   *
   * Implementation should:
   * 1. Validate session is ready for creation
   * 2. Use OtaEducationCrudService.create() with session data
   * 3. Handle category determination
   * 4. Update session with created record ID
   * 5. Return creation results
   */
  createEducationRecord(sessionId: string): Promise<OtaEducationCreationResult>;

  /**
   * Complete the OTA education workflow
   *
   * @param sessionId Redis session identifier
   * @returns Final workflow results
   *
   * Implementation should:
   * 1. Finalize all workflow steps
   * 2. Clean up temporary data
   * 3. Archive session
   * 4. Return comprehensive results
   */
  completeWorkflow(sessionId: string): Promise<OtaEducationWorkflowResult>;

  /**
   * Retrieve session status and progress
   *
   * @param sessionId Redis session identifier
   * @returns Current session state
   */
  getSessionStatus(sessionId: string): Promise<OtaEducationSessionResponse>;

  /**
   * List sessions by criteria
   *
   * @param userBusinessId Filter by user business ID
   * @param status Filter by registration status
   * @returns List of matching sessions
   */
  listSessions(
    userBusinessId?: string,
    status?: string,
  ): Promise<OtaEducationSessionResponse[]>;

  /**
   * Abort a workflow session
   *
   * @param sessionId Redis session identifier
   * @param reason Reason for abortion
   * @returns Abortion results
   */
  abortWorkflow(
    sessionId: string,
    reason: string,
  ): Promise<OtaEducationWorkflowResult>;
}

// ========================================
// SERVICE INTEGRATION INTERFACES
// ========================================

/**
 * Interface for OTA education business rule validation
 * Implemented by OtaEducationBusinessRuleService
 */
export interface OtaEducationValidationService {
  /**
   * Validate college-country alignment
   */
  validateCollegeCountryAlignment(
    college: string,
    country: number,
  ): Promise<{
    isValid: boolean;
    confidence: number;
    suggestions?: string[];
  }>;

  /**
   * Validate user business ID uniqueness
   */
  validateUserBusinessIdUniqueness(userBusinessId: string): Promise<{
    isUnique: boolean;
    existingRecords?: any[];
  }>;

  /**
   * Validate graduation year constraints
   */
  validateGraduationYear(
    graduationYear: number,
    currentYear?: number,
  ): Promise<{
    isValid: boolean;
    reasons?: string[];
  }>;

  /**
   * Comprehensive education record validation
   */
  validateEducationRecord(educationData: CreateOtaEducationDto): Promise<{
    isValid: boolean;
    errors: Array<{
      field: string;
      message: string;
      severity: 'warning' | 'error' | 'critical';
    }>;
    score: number;
  }>;
}

/**
 * Interface for OTA education session management
 * Implemented by future Redis-based session service
 */
export interface OtaEducationSessionManager {
  /**
   * Create new education registration session
   */
  createSession(
    userBusinessId: string,
    educationData: any,
    options?: {
      expirationHours?: number;
      priority?: string;
    },
  ): Promise<{
    sessionId: string;
    expiresAt: string;
  }>;

  /**
   * Retrieve session by ID
   */
  getSession(sessionId: string): Promise<Record<string, any> | null>;

  /**
   * Update session data
   */
  updateSession(sessionId: string, updates: Partial<any>): Promise<boolean>;

  /**
   * Delete session
   */
  deleteSession(sessionId: string): Promise<boolean>;

  /**
   * List sessions by criteria
   */
  listSessions(criteria: {
    userBusinessId?: string;
    status?: string;
    includeExpired?: boolean;
  }): Promise<any[]>;

  /**
   * Extend session expiration
   */
  extendSession(sessionId: string, additionalHours: number): Promise<string>;
}

// ========================================
// WORKFLOW COORDINATION INTERFACES
// ========================================

/**
 * Interface for workflow step execution
 */
export interface OtaEducationWorkflowExecutor {
  /**
   * Execute a specific workflow step
   */
  executeStep(
    step: string,
    sessionId: string,
    context?: any,
  ): Promise<OtaEducationWorkflowResult>;

  /**
   * Validate workflow can proceed to next step
   */
  canProceedToStep(
    currentStep: string,
    nextStep: string,
    sessionId: string,
  ): Promise<boolean>;

  /**
   * Get available next steps
   */
  getAvailableNextSteps(
    currentStep: string,
    sessionId: string,
  ): Promise<string[]>;

  /**
   * Rollback to previous step
   */
  rollbackToPreviousStep(
    sessionId: string,
  ): Promise<OtaEducationWorkflowResult>;
}

/**
 * Interface for batch/bulk operations
 */
export interface OtaEducationBulkProcessor {
  /**
   * Process multiple education registrations
   */
  processBulkRegistrations(
    requests: OtaEducationStageRequest[],
  ): Promise<OtaEducationBulkOperationResult>;

  /**
   * Validate multiple education records
   */
  validateBulkEducations(
    sessionIds: string[],
  ): Promise<OtaEducationValidationResult[]>;

  /**
   * Create multiple education records
   */
  createBulkEducations(
    sessionIds: string[],
  ): Promise<OtaEducationCreationResult[]>;

  /**
   * Get bulk operation status
   */
  getBulkOperationStatus(
    operationId: string,
  ): Promise<OtaEducationBulkOperationResult>;
}

// ========================================
// INTEGRATION HELPER INTERFACES
// ========================================

/**
 * Interface for external system integration
 */
export interface OtaEducationExternalIntegration {
  /**
   * Validate education with external university database
   */
  validateWithUniversityDatabase(
    university: number,
    graduationYear: number,
    additionalData?: any,
  ): Promise<{
    verified: boolean;
    confidence: number;
    externalReference?: string;
  }>;

  /**
   * Sync education data with external systems
   */
  syncWithExternalSystems(educationRecord: OtaEducationResponseDto): Promise<{
    success: boolean;
    syncedSystems: string[];
    errors?: string[];
  }>;
}

/**
 * Interface for audit and logging
 */
export interface OtaEducationAuditLogger {
  /**
   * Log workflow step execution
   */
  logWorkflowStep(
    sessionId: string,
    step: string,
    result: OtaEducationWorkflowResult,
  ): Promise<void>;

  /**
   * Log validation attempt
   */
  logValidationAttempt(
    sessionId: string,
    validationType: string,
    result: any,
  ): Promise<void>;

  /**
   * Log education record creation
   */
  logEducationCreation(
    sessionId: string,
    educationId: string,
    result: OtaEducationCreationResult,
  ): Promise<void>;

  /**
   * Generate audit report
   */
  generateAuditReport(criteria: {
    startDate: string;
    endDate: string;
    userBusinessId?: string;
    includeErrors?: boolean;
  }): Promise<{
    totalOperations: number;
    successRate: number;
    errorBreakdown: Record<string, number>;
    timeMetrics: any;
  }>;
}
