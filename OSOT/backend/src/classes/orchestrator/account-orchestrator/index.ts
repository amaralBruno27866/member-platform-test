/**
 * Account Orchestrator Module Index
 *
 * Centralized export for all Account Orchestrator components.
 * This module provides a complete user registration orchestrator
 * that coordinates multi-entity creation workflows.
 */
// ========================================
// CONSTANTS & CONFIGURATION
// ========================================
export * from './constants/orchestrator.constants';

// ========================================
// ENUMS - State Management
// ========================================
export * from './enums/registration-state.enum';
export * from './enums/orchestrator-validation-error-type.enum';

// ========================================
// DTOs - Data Transfer Objects
// ========================================
// Main workflow DTOs
export * from './dtos/complete-user-registration.dto';
export * from './dtos/registration-session.dto';
export * from './dtos/registration-progress.dto';

// Response DTOs
export * from './dtos/orchestrator-response.dto';

// Validation and operation DTOs
export * from './dtos/orchestrator-validation.dto';

// ========================================
// EVENTS - Workflow Observability
// ========================================
export * from './events/orchestrator-event.interfaces';
export * from './events/orchestrator-event.service';

// ========================================
// SERVICES - Business Logic
// ========================================
export * from './services/account-orchestrator.service';
// TODO: Export additional services when implemented
// export * from './services/orchestrator-workflow.service';
// export * from './services/orchestrator-validation.service';

// ========================================
// CONTROLLERS - API Endpoints
// ========================================
export * from './controllers/account-orchestrator-public.controller';

// ========================================
// MODULES - NestJS Module Configuration
// ========================================
// TODO: Export modules when implemented
// export * from './modules/account-orchestrator.module';

// ========================================
// INTERFACES - Type Definitions
// ========================================
export * from './interfaces/orchestrator.interfaces';

// ========================================
// VALIDATORS - Custom Validation Logic
// ========================================
export * from './validators/orchestrator.validators';

// ========================================
// UTILS - Helper Functions
// ========================================
export * from './mappers/orchestrator.mappers';

// ========================================
// REPOSITORIES - Data Access Layer
// ========================================
export * from './repositories/orchestrator.repository';

// ========================================
// SCHEDULERS - Background Tasks
// ========================================
// TODO: Export schedulers when implemented
// export * from './schedulers/orchestrator.scheduler';
