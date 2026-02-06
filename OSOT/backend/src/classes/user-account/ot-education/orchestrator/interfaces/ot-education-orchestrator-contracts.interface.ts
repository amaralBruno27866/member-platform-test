import { CreateOtEducationDto } from '../../dtos/create-ot-education.dto';
import { OtEducationResponseDto } from '../../dtos/ot-education-response.dto';
import { Privilege } from '../../../../../common/enums/privilege.enum';

// Import types from local orchestrator DTOs
import type {
  OtEducationStageRequest,
  OtEducationStageResponse,
} from '../dto/ot-education-session.dto';
import type {
  OtEducationWorkflowResult,
  OtEducationValidationResult,
  OtEducationLinkingResult,
  OtEducationCreationResult,
  OtEducationSessionResponse,
  OtEducationBulkOperationResult,
} from '../dto/ot-education-workflow-results.dto';

/**
 * OT Education Orchestrator Integration Contracts
 *
 * These interfaces define the contract between the OT Education module and
 * the future Registration Orchestrator that will be built.
 *
 * The OT Education module provides all necessary services (OtEducationCrudService,
 * OtEducationBusinessRuleService, etc.) but the orchestrator is responsible for:
 * - Session management in Redis
 * - Education validation workflows
 * - COTO registration validation processes
 * - Account linking coordination
 * - Graduation category determination
 */

// ========================================
// ORCHESTRATOR INTERFACE CONTRACT
// ========================================

/**
 * Interface that the future orchestrator must implement
 * for OT education registration workflows
 */
export interface OtEducationOrchestrator {
  /**
   * Stage OT education registration data in Redis
   *
   * @param request Education staging request with data and options
   * @returns Education registration session information
   *
   * Implementation should:
   * 1. Validate using OtEducationBusinessRuleService.validateEducationRecord()
   * 2. Perform COTO registration validation
   * 3. Validate university-country alignment
   * 4. Store in Redis with key: ot_education_session:{sessionId}
   * 5. Set TTL (suggested: 24 hours)
   * 6. Emit OtEducationStageEvent via OtEducationEventsService
   */
  stageEducationRegistration(
    request: OtEducationStageRequest,
  ): Promise<OtEducationStageResponse>;

  /**
   * Validate education data and business rules
   *
   * @param sessionId Education session ID
   * @returns Validation result with business rule compliance
   *
   * Implementation should:
   * 1. Use OtEducationBusinessRuleService for comprehensive validation
   * 2. Validate COTO registration format and alignment
   * 3. Check university-country pairing
   * 4. Validate graduation year constraints
   * 5. Check User Business ID uniqueness
   * 6. Update session with validation results
   * 7. Handle validation errors with structured responses
   */
  validateEducationData(
    sessionId: string,
  ): Promise<OtEducationValidationResult>;

  /**
   * Determine education category based on graduation year and membership
   *
   * @param sessionId Education session ID
   * @returns Category determination result
   *
   * Implementation should:
   * 1. Use OtEducationBusinessRuleService.determineEducationCategory()
   * 2. Consider graduation year and membership expires date
   * 3. Apply COTO status to category determination
   * 4. Update session with determined category
   * 5. Handle edge cases and validation errors
   */
  determineEducationCategory(
    sessionId: string,
  ): Promise<OtEducationValidationResult>;

  /**
   * Link education record to account with validation
   *
   * @param sessionId Education session ID
   * @param accountId Account to link to
   * @param userPrivilege User's privilege level for validation
   * @returns Account linking result
   *
   * Implementation should:
   * 1. Validate account exists and user has access
   * 2. Check user business ID consistency
   * 3. Validate privilege level for operation
   * 4. Ensure one education record per account
   * 5. Update session with linking information
   * 6. Use structured error handling for validation failures
   */
  linkToAccount(
    sessionId: string,
    accountId: string,
    userPrivilege: Privilege,
  ): Promise<OtEducationLinkingResult>;

  /**
   * Create education record from staged session data
   *
   * @param sessionId Education session ID
   * @param userPrivilege User's privilege level
   * @returns Creation result with education record
   *
   * Implementation should:
   * 1. Validate session is ready for creation
   * 2. Use OtEducationCrudService.create() with validation
   * 3. Apply automatic education category determination
   * 4. Emit creation events via OtEducationEventsService
   * 5. Clean up Redis session after successful creation
   * 6. Handle creation failures with rollback
   */
  createEducationRecord(
    sessionId: string,
    userPrivilege: Privilege,
  ): Promise<OtEducationCreationResult>;

  /**
   * Complete education registration workflow
   *
   * @param sessionId Education session ID
   * @param userPrivilege User's privilege level
   * @returns Complete workflow result
   *
   * Implementation should:
   * 1. Perform final validation checks
   * 2. Create education record via createEducationRecord()
   * 3. Emit workflow completion events
   * 4. Clean up all session data
   * 5. Return comprehensive result summary
   * 6. Handle any cleanup failures gracefully
   */
  completeWorkflow(
    sessionId: string,
    userPrivilege: Privilege,
  ): Promise<OtEducationWorkflowResult>;

  /**
   * Retrieve education session state
   *
   * @param sessionId Education session ID
   * @returns Current session state and progress
   *
   * Implementation should:
   * 1. Fetch session data from Redis
   * 2. Include validation status and progress indicators
   * 3. Return metadata about workflow state
   * 4. Handle missing or expired sessions
   */
  getSessionState(sessionId: string): Promise<OtEducationSessionResponse>;

  /**
   * Cancel education registration session
   *
   * @param sessionId Education session ID
   * @returns Cancellation result
   *
   * Implementation should:
   * 1. Clean up Redis session data
   * 2. Emit cancellation events
   * 3. Handle cleanup errors gracefully
   * 4. Return confirmation of cancellation
   */
  cancelSession(
    sessionId: string,
  ): Promise<{ cancelled: boolean; sessionId: string }>;
}

// ========================================
// BULK OPERATIONS INTERFACE
// ========================================

/**
 * Interface for bulk education operations via orchestrator
 */
export interface OtEducationBulkOrchestrator {
  /**
   * Process multiple education registrations
   *
   * @param requests Array of education registration requests
   * @param userPrivilege User's privilege level
   * @returns Bulk operation results
   *
   * Implementation should:
   * 1. Stage all registrations with validation
   * 2. Process in batches to avoid resource exhaustion
   * 3. Handle partial failures gracefully
   * 4. Provide detailed success/failure reporting
   * 5. Emit bulk operation events
   */
  processBulkRegistrations(
    requests: OtEducationStageRequest[],
    userPrivilege: Privilege,
  ): Promise<OtEducationBulkOperationResult>;

  /**
   * Validate multiple education records
   *
   * @param sessionIds Array of session IDs to validate
   * @returns Bulk validation results
   *
   * Implementation should:
   * 1. Validate all sessions in parallel where possible
   * 2. Aggregate validation results
   * 3. Handle individual validation failures
   * 4. Provide summary statistics
   */
  validateBulkEducationData(
    sessionIds: string[],
  ): Promise<OtEducationBulkOperationResult>;
}

// ========================================
// SESSION MANAGEMENT INTERFACE
// ========================================

/**
 * Interface for Redis session management operations
 */
export interface OtEducationSessionManager {
  /**
   * Store education data in Redis session
   *
   * @param sessionId Unique session identifier
   * @param data Education data to store
   * @param ttlSeconds Time to live in seconds
   * @returns Storage confirmation
   */
  storeSession(
    sessionId: string,
    data: object,
    ttlSeconds?: number,
  ): Promise<{ stored: boolean; sessionId: string; expiresAt: Date }>;

  /**
   * Retrieve education session data
   *
   * @param sessionId Session identifier
   * @returns Session data or null if not found
   */
  getSession(sessionId: string): Promise<object | null>;

  /**
   * Update education session data
   *
   * @param sessionId Session identifier
   * @param data Partial data to update
   * @returns Update confirmation
   */
  updateSession(
    sessionId: string,
    data: Partial<object>,
  ): Promise<{ updated: boolean; sessionId: string }>;

  /**
   * Delete education session
   *
   * @param sessionId Session identifier
   * @returns Deletion confirmation
   */
  deleteSession(
    sessionId: string,
  ): Promise<{ deleted: boolean; sessionId: string }>;

  /**
   * Extend session TTL
   *
   * @param sessionId Session identifier
   * @param ttlSeconds New TTL in seconds
   * @returns Extension confirmation
   */
  extendSession(
    sessionId: string,
    ttlSeconds: number,
  ): Promise<{ extended: boolean; sessionId: string; expiresAt: Date }>;

  /**
   * List active sessions for user
   *
   * @param userBusinessId User business identifier
   * @returns Array of active session IDs
   */
  listUserSessions(userBusinessId: string): Promise<string[]>;

  /**
   * Clean up expired sessions
   *
   * @returns Number of sessions cleaned up
   */
  cleanupExpiredSessions(): Promise<{ cleanedUp: number; errors: string[] }>;
}

// ========================================
// EVENT INTEGRATION INTERFACE
// ========================================

/**
 * Interface for orchestrator event integration
 */
export interface OtEducationOrchestratorEvents {
  /**
   * Emit education staging event
   *
   * @param sessionId Session identifier
   * @param data Staged education data
   * @param metadata Event metadata
   */
  emitEducationStaged(
    sessionId: string,
    data: CreateOtEducationDto,
    metadata: object,
  ): Promise<void>;

  /**
   * Emit validation completion event
   *
   * @param sessionId Session identifier
   * @param validationResult Validation results
   * @param metadata Event metadata
   */
  emitValidationCompleted(
    sessionId: string,
    validationResult: OtEducationValidationResult,
    metadata: object,
  ): Promise<void>;

  /**
   * Emit education creation event
   *
   * @param sessionId Session identifier
   * @param educationRecord Created education record
   * @param metadata Event metadata
   */
  emitEducationCreated(
    sessionId: string,
    educationRecord: OtEducationResponseDto,
    metadata: object,
  ): Promise<void>;

  /**
   * Emit workflow completion event
   *
   * @param sessionId Session identifier
   * @param workflowResult Complete workflow results
   * @param metadata Event metadata
   */
  emitWorkflowCompleted(
    sessionId: string,
    workflowResult: OtEducationWorkflowResult,
    metadata: object,
  ): Promise<void>;

  /**
   * Emit error event
   *
   * @param sessionId Session identifier
   * @param error Error information
   * @param metadata Event metadata
   */
  emitOrchestratorError(
    sessionId: string,
    error: Error,
    metadata: object,
  ): Promise<void>;
}
