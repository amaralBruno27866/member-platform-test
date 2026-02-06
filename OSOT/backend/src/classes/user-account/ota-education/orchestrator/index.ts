/**
 * OTA Education Orchestrator Module
 *
 * This module provides orchestrator functionality for OTA Education workflows,
 * including session management, validation coordination, and workflow execution.
 *
 * IMPORTANT: This module contains demonstration implementations showing patterns
 * and structure for the future OtaEducationOrchestrator implementation.
 *
 * Components:
 * - Orchestrator Interface Contracts
 * - Session Management DTOs
 * - Workflow Result DTOs
 * - Session Service (demonstration)
 *
 * @author OSOT Development Team
 * @version 1.0.0
 */

// Interface Contracts
export * from './interfaces/ota-education-orchestrator-contracts.interface';

// Session DTOs
export * from './dto/ota-education-session.dto';
export * from './dto/ota-education-workflow-results.dto';

// Services
export * from './services/ota-education-session.service';

// Re-export key types for convenience
export type {
  OtaEducationOrchestrator,
  OtaEducationValidationService,
  OtaEducationSessionManager,
  OtaEducationWorkflowExecutor,
  OtaEducationBulkProcessor,
  OtaEducationExternalIntegration,
  OtaEducationAuditLogger,
} from './interfaces/ota-education-orchestrator-contracts.interface';

export type {
  OtaEducationRegistrationSession,
  OtaEducationStageRequest,
  OtaEducationStageResponse,
  OtaEducationSessionQuery,
  OtaEducationSessionListResponse,
} from './dto/ota-education-session.dto';

export type {
  OtaEducationWorkflowResult,
  OtaEducationValidationResult,
  OtaEducationLinkingResult,
  OtaEducationCreationResult,
  OtaEducationSessionResponse,
  OtaEducationBulkOperationResult,
  OtaEducationOrchestratorStats,
} from './dto/ota-education-workflow-results.dto';

// Enums for external use
export { OtaEducationRegistrationStatus } from './dto/ota-education-session.dto';

export {
  OtaEducationWorkflowStep,
  OtaEducationWorkflowAction,
} from './dto/ota-education-workflow-results.dto';
