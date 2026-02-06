/**
 * Membership Orchestrator Module Index
 *
 * Centralized export for all Membership Orchestrator components.
 * This module provides a complete membership registration orchestrator
 * that coordinates multi-entity creation workflows including product/insurance
 * integration, pricing calculations, and payment processing.
 */
// ========================================
// CONSTANTS & CONFIGURATION
// ========================================
export * from './constants/membership-orchestrator.constants';

// ========================================
// ENUMS - State Management
// ========================================
export * from './enums/membership-state.enum';
// TODO: Export additional enums when implemented
// export * from './enums/membership-validation-error-type.enum';

// ========================================
// EVENTS - Event System
// ========================================
export * from './events/membership-orchestrator-event.interfaces';
export * from './events/membership-orchestrator-event.service';

// ========================================
// DTOs - Data Transfer Objects
// ========================================
// Main workflow DTOs
export * from './dtos/complete-membership-registration.dto';
export * from './dtos/membership-session.dto';
export * from './dtos/membership-progress.dto';

// Response DTOs
export * from './dtos/membership-orchestrator-response.dto';

// ========================================
// EVENTS - Workflow Observability
// ========================================
// TODO: Export events when implemented
// export * from './events/membership-orchestrator-event.interfaces';
// export * from './events/membership-orchestrator-event.service';

// ========================================
// INTERFACES - Type Contracts
// ========================================
export * from './interfaces/membership-orchestrator.interfaces';

// ========================================
// VALIDATORS - Custom Validation Logic
// ========================================
export * from './validators';

// ========================================
// MAPPERS - Data Transformation
// ========================================
export * from './mappers';

// ========================================
// REPOSITORIES - Data Access Layer
// ========================================
export * from './repositories';

// ========================================
// SERVICES - Business Logic
// ========================================
// TODO: Export services when implemented
// export * from './services/membership-orchestrator.service';
// export * from './services/membership-pricing.service';
// export * from './services/membership-validation.service';

// ========================================
// CONTROLLERS - API Endpoints
// ========================================
// TODO: Export controllers when implemented
// export * from './controllers/membership-orchestrator-public.controller';

// ========================================
// MODULES - NestJS Module Configuration
// ========================================
// TODO: Export modules when implemented
// export * from './modules/membership-orchestrator.module';

// ========================================
// SCHEDULERS - Background Tasks
// ========================================
// TODO: Export schedulers when implemented
// export * from './schedulers/membership-orchestrator.scheduler';
