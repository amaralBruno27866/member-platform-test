/**
 * Account Orchestrator Interfaces
 *
 * TypeScript interfaces defining contracts for the orchestrator system.
 * These interfaces establish the structure for services, workflows,
 * and validation components.
 */

import {
  CompleteUserRegistrationDto,
  RegistrationSessionDto,
  RegistrationProgressDto,
  RegistrationState,
  EntityType,
} from '../index';

import { OrchestratorValidationErrorType } from '../enums/orchestrator-validation-error-type.enum';

// ========================================
// VALIDATION INTERFACES
// ========================================

/**
 * Interface for validation results
 */
export interface IValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  errorType?: OrchestratorValidationErrorType;
  existingAccountEmail?: string; // Email of the existing account (for duplicate errors)
}

// ========================================
// RESPONSE DTOs & INTERFACES
// ========================================

/**
 * Standard orchestrator response interface
 */
export interface OrchestratorResponseDto {
  success: boolean;
  message: string;
  sessionId?: string;
  status?: RegistrationState;
  progress?: {
    percentage: number;
    currentStep: string;
    completedEntities: string[];
    failedEntities: string[];
    pendingEntities: string[];
  };
  timestamps?: {
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  };
  nextSteps?: string[];
  lastError?: any;
  error?: {
    code: string;
    message: string;
    timestamp: string;
  };
  data?: any;
}

/**
 * Registration initiation response
 */
export interface RegistrationInitiationResponse {
  sessionId: string;
  status: RegistrationState;
  expiresAt: string;
  message: string;
  nextSteps: string[];
}

/**
 * Registration status response
 */
export interface RegistrationStatusResponse {
  session: RegistrationSessionDto;
  progress: RegistrationProgressDto;
  message: string;
  nextSteps: string[];
}

// ========================================
// CORE ORCHESTRATOR INTERFACE
// ========================================

/**
 * Main orchestrator service interface
 * Coordinates the complete user registration workflow
 */
export interface IAccountOrchestrator {
  /**
   * Initiate a new user registration workflow
   * @param registrationData Complete user registration data
   * @returns Orchestrator response with session information
   */
  initiateRegistration(
    registrationData: CompleteUserRegistrationDto,
  ): Promise<OrchestratorResponseDto>;

  /**
   * Get current status of a registration session
   * @param sessionId Session identifier
   * @returns Current session status and progress
   */
  getRegistrationStatus(sessionId: string): Promise<OrchestratorResponseDto>;

  /**
   * Verify user email for registration (TO BE IMPLEMENTED)
   * @param sessionId Session identifier
   * @param token Email verification token
   * @returns Verification result
   */
  verifyEmail?(
    sessionId: string,
    token: string,
  ): Promise<OrchestratorResponseDto>;

  /**
   * Process admin decision for registration (TO BE IMPLEMENTED)
   * @param sessionId Session identifier
   * @param approved Whether registration is approved
   * @param adminEmail Admin who made the decision
   * @param reason Optional reason for the decision
   * @returns Decision processing result
   */
  processAdminDecision?(
    sessionId: string,
    approved: boolean,
    adminEmail: string,
    reason?: string,
  ): Promise<OrchestratorResponseDto>;

  /**
   * Retry failed entity creation (TO BE IMPLEMENTED)
   * @param sessionId Session identifier
   * @param entityType Entity type to retry
   * @returns Retry result
   */
  retryEntityCreation?(
    sessionId: string,
    entityType: EntityType,
  ): Promise<OrchestratorResponseDto>;

  /**
   * Cancel registration session (TO BE IMPLEMENTED)
   * @param sessionId Session identifier
   * @param reason Cancellation reason
   * @returns Cancellation result
   */
  cancelRegistration?(
    sessionId: string,
    reason: string,
  ): Promise<OrchestratorResponseDto>;
}

// ========================================
// WORKFLOW MANAGEMENT INTERFACE
// ========================================

/**
 * Workflow manager interface
 * Manages the step-by-step registration process
 */
export interface IWorkflowManager {
  /**
   * Execute the next step in registration workflow
   * @param sessionId Session identifier
   * @returns Step execution result
   */
  executeNextStep(sessionId: string): Promise<{
    success: boolean;
    completedStep: EntityType;
    nextStep?: EntityType;
    progress: RegistrationProgressDto;
  }>;

  /**
   * Get workflow execution plan
   * @param registrationData Registration data to analyze
   * @returns Execution plan with entity order
   */
  getExecutionPlan(registrationData: CompleteUserRegistrationDto): Promise<{
    entityOrder: EntityType[];
    estimatedDuration: number;
    dependencies: Record<EntityType, EntityType[]>;
  }>;

  /**
   * Validate workflow prerequisites
   * @param sessionId Session identifier
   * @param targetStep Step to validate for
   * @returns Validation result
   */
  validatePrerequisites(
    sessionId: string,
    targetStep: EntityType,
  ): Promise<{
    valid: boolean;
    missingRequirements: string[];
    canProceed: boolean;
  }>;

  /**
   * Handle workflow failure
   * @param sessionId Session identifier
   * @param failedStep Failed step
   * @param error Error details
   * @returns Failure handling result
   */
  handleFailure(
    sessionId: string,
    failedStep: EntityType,
    error: Error,
  ): Promise<{
    handled: boolean;
    canRetry: boolean;
    nextAction: 'retry' | 'skip' | 'abort';
  }>;
}

// ========================================
// VALIDATION INTERFACE
// ========================================

/**
 * Validation context for orchestrator operations
 */
export interface IValidationContext {
  sessionId: string;
  currentStep: EntityType;
  registrationData: CompleteUserRegistrationDto;
  existingProgress: RegistrationProgressDto;
  metadata?: Record<string, any>;
}

/**
 * Orchestrator validation interface
 * Handles business rule validation and cross-entity validation
 */
export interface IOrchestratorValidator {
  /**
   * Validate complete registration data
   * @param data Registration data to validate
   * @returns Validation result with detailed errors
   */
  validateRegistrationData(data: CompleteUserRegistrationDto): Promise<{
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  }>;

  /**
   * Validate business rules for specific entity
   * @param context Validation context
   * @param entityType Entity type to validate
   * @returns Business rule validation result
   */
  validateBusinessRules(
    context: IValidationContext,
    entityType: EntityType,
  ): Promise<{
    valid: boolean;
    violations: BusinessRuleViolation[];
  }>;

  /**
   * Validate cross-entity relationships
   * @param context Validation context
   * @returns Cross-validation result
   */
  validateCrossEntityRelationships(context: IValidationContext): Promise<{
    valid: boolean;
    inconsistencies: CrossEntityInconsistency[];
  }>;

  /**
   * Validate session state for operation
   * @param sessionId Session identifier
   * @param operation Operation to validate for
   * @returns Session validation result
   */
  validateSessionState(
    sessionId: string,
    operation: 'email_verify' | 'admin_approve' | 'entity_create' | 'retry',
  ): Promise<{
    valid: boolean;
    reason?: string;
    allowedOperations: string[];
  }>;
}

// ========================================
// ENTITY SERVICE INTERFACE
// ========================================

/**
 * Entity creation service interface
 * Abstracts individual entity creation operations
 */
export interface IEntityService {
  /**
   * Create entity using orchestrator context
   * @param context Creation context
   * @param entityData Data for entity creation
   * @returns Creation result with GUID
   */
  createEntity(
    context: IEntityCreationContext,
    entityData: any,
  ): Promise<{
    success: boolean;
    entityGuid?: string;
    error?: EntityCreationError;
  }>;

  /**
   * Validate entity can be created
   * @param context Creation context
   * @param entityData Data for entity creation
   * @returns Pre-creation validation result
   */
  validateEntityCreation(
    context: IEntityCreationContext,
    entityData: any,
  ): Promise<{
    valid: boolean;
    errors: string[];
  }>;

  /**
   * Get entity creation dependencies
   * @param entityType Entity type
   * @returns Required dependencies
   */
  getDependencies(entityType: EntityType): EntityType[];
}

/**
 * Entity creation context
 */
export interface IEntityCreationContext {
  sessionId: string;
  accountGuid?: string;
  parentEntities: Record<EntityType, string>;
  metadata: Record<string, any>;
  retryAttempt: number;
}

// ========================================
// SESSION MANAGEMENT INTERFACE
// ========================================

/**
 * Session manager interface
 * Handles Redis-based session operations
 */
export interface ISessionManager {
  /**
   * Create new registration session
   * @param sessionData Initial session data
   * @returns Created session
   */
  createSession(sessionData: Partial<RegistrationSessionDto>): Promise<{
    session: RegistrationSessionDto;
    sessionId: string;
  }>;

  /**
   * Get session by ID
   * @param sessionId Session identifier
   * @returns Session data or null if not found
   */
  getSession(sessionId: string): Promise<RegistrationSessionDto | null>;

  /**
   * Update session data
   * @param sessionId Session identifier
   * @param updates Partial updates to apply
   * @returns Updated session
   */
  updateSession(
    sessionId: string,
    updates: Partial<RegistrationSessionDto>,
  ): Promise<RegistrationSessionDto>;

  /**
   * Update session progress
   * @param sessionId Session identifier
   * @param progress Progress updates
   * @returns Updated progress
   */
  updateProgress(
    sessionId: string,
    progress: Partial<RegistrationProgressDto>,
  ): Promise<RegistrationProgressDto>;

  /**
   * Delete session and cleanup
   * @param sessionId Session identifier
   * @returns Cleanup result
   */
  deleteSession(sessionId: string): Promise<{
    deleted: boolean;
    cleanedUpKeys: string[];
  }>;

  /**
   * Extend session expiration
   * @param sessionId Session identifier
   * @param extensionHours Hours to extend
   * @returns Extension result
   */
  extendSession(
    sessionId: string,
    extensionHours: number,
  ): Promise<{
    extended: boolean;
    newExpiresAt: Date;
  }>;

  /**
   * Get sessions by status
   * @param status Registration status to filter by
   * @param limit Maximum number of sessions to return
   * @returns Sessions matching criteria
   */
  getSessionsByStatus(
    status: RegistrationState,
    limit?: number,
  ): Promise<RegistrationSessionDto[]>;
}

// ========================================
// ERROR AND VALIDATION TYPES
// ========================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface BusinessRuleViolation {
  rule: string;
  message: string;
  severity: 'error' | 'warning';
  entityType: EntityType;
  field?: string;
}

export interface CrossEntityInconsistency {
  entities: EntityType[];
  field: string;
  message: string;
  values: Record<EntityType, any>;
}

export interface EntityCreationError {
  code: string;
  message: string;
  details: any;
  retryable: boolean;
  entityType: EntityType;
}

// ========================================
// UTILITY TYPES
// ========================================

/**
 * Orchestrator operation result type
 */
export type OrchestratorResult<T = any> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: Record<string, any>;
};

/**
 * Workflow step result type
 */
export type WorkflowStepResult = {
  stepCompleted: boolean;
  entityCreated?: {
    type: EntityType;
    guid: string;
  };
  nextStep?: EntityType;
  error?: EntityCreationError;
  canRetry: boolean;
};
