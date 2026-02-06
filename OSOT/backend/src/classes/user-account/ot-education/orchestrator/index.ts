/**
 * OT Education Orchestrator Module
 *
 * This module provides orchestrator functionality for OT Education workflows,
 * including session management, validation coordination, and workflow execution.
 *
 * IMPORTANT: This module contains demonstration implementations showing patterns
 * and structure for the future OtEducationOrchestrator implementation.
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
export * from './interfaces/ot-education-orchestrator-contracts.interface';

// Data Transfer Objects
export * from './dto/ot-education-session.dto';
export {
  OtEducationValidationResult,
  OtEducationWorkflowResult,
  OtEducationWorkflowStep,
  OtEducationCreationResult,
  OtEducationLinkingResult,
} from './dto/ot-education-workflow-results.dto';

// Services
export * from './services/ot-education-session.service';
