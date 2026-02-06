/**
 * OTA Education Module - Complete Export Index
 *
 * This file provides a centralized export point for all OTA Education components,
 * following the established patterns of the OSOT project architecture.
 *
 * Structure:
 * - Constants: Configuration and shared values
 * - Interfaces: Type definitions and contracts
 * - Validators: Input validation and business rule validation
 * - DTOs: Data Transfer Objects for API communication
 * - Repositories: Data access layer
 * - Events: Event handling and audit trail
 * - Mappers: Data transformation utilities
 * - Services: Business logic and CRUD operations
 * - Controllers: Public and private API endpoints
 * - Orchestrator: Workflow coordination and session management
 * - Utils: Business logic utilities
 * - Module: NestJS module configuration
 *
 * @author OSOT Development Team
 * @version 1.1.0
 */

// ========================================
// CONSTANTS
// ========================================

// OTA Education Constants
export * from './constants/ota-education.constants';

// ========================================
// INTERFACES
// ========================================

// OTA Education Interfaces
export * from './interfaces/ota-education-dataverse.interface';
export * from './interfaces/ota-education-internal.interface';
export * from './interfaces/ota-education-repository.interface';

// ========================================
// VALIDATORS
// ========================================

// OTA Education Validators
export * from './validators/ota-education.validators';

// ========================================
// DATA TRANSFER OBJECTS (DTOs)
// ========================================

// OTA Education DTOs
export * from './dtos/ota-education-basic.dto';
export * from './dtos/create-ota-education.dto';
export * from './dtos/update-ota-education.dto';
export * from './dtos/ota-education-response.dto';
export * from './dtos/ota-education-registration.dto';
export * from './dtos/list-ota-education.query.dto';

// ========================================
// REPOSITORIES
// ========================================

// Essential Repository (data access layer)
export { OtaEducationRepositoryService } from './repositories/ota-education.repository';

// All Repository Exports
export * from './repositories/ota-education.repository';

// ========================================
// EVENTS
// ========================================

// OTA Education Events
export * from './events/ota-education.events';

// ========================================
// MAPPERS
// ========================================

// OTA Education Mappers
export * from './mappers/ota-education.mapper';

// ========================================
// SERVICES
// ========================================

// OTA Education Services (Core Business Logic)
export { OtaEducationBusinessRuleService } from './services/ota-education-business-rule.service';
export { OtaEducationCrudService } from './services/ota-education-crud.service';
export { OtaEducationLookupService } from './services/ota-education-lookup.service';

// ========================================
// CONTROLLERS
// ========================================

// OTA Education Controllers
export { OtaEducationPublicController } from './controllers/ota-education-public.controller';
export { OtaEducationPrivateController } from './controllers/ota-education-private.controller';

// ========================================
// ORCHESTRATOR
// ========================================

// Orchestrator Components
export * from './orchestrator';

// Orchestrator Services
export { OtaEducationSessionService } from './orchestrator/services/ota-education-session.service';

// ========================================
// BUSINESS LOGIC UTILITIES
// ========================================

// OTA Education Business Logic Utils
export { OtaEducationBusinessLogic } from './utils/ota-education-business-logic.util';

// ========================================
// MODULE
// ========================================

// OTA Education Module (NestJS)
export { OtaEducationModule } from './modules/ota-education.module';

// ========================================
// ORCHESTRATOR TYPE RE-EXPORTS
// ========================================

// Session Management Types
export type {
  OtaEducationRegistrationSession,
  OtaEducationStageRequest,
  OtaEducationStageResponse,
} from './orchestrator/dto/ota-education-session.dto';

// Workflow Types
export type {
  OtaEducationWorkflowResult,
  OtaEducationValidationResult,
  OtaEducationCreationResult,
  OtaEducationLinkingResult,
} from './orchestrator/dto/ota-education-workflow-results.dto';

// Orchestrator Interface
export type {
  OtaEducationOrchestrator,
  OtaEducationValidationService,
  OtaEducationSessionManager,
} from './orchestrator/interfaces/ota-education-orchestrator-contracts.interface';

// ========================================
// ENUM RE-EXPORTS
// ========================================

// Orchestrator Enums
export {
  OtaEducationRegistrationStatus,
  OtaEducationWorkflowStep,
  OtaEducationWorkflowAction,
} from './orchestrator';

// ========================================
// VERSION INFORMATION
// ========================================

/**
 * OTA Education Module Version Information
 */
export const OTA_EDUCATION_MODULE_VERSION = '1.1.0';

/**
 * OTA Education Module Metadata
 */
export const OTA_EDUCATION_MODULE_INFO = {
  name: 'OTA Education',
  version: OTA_EDUCATION_MODULE_VERSION,
  description:
    'Comprehensive OTA Education management with dual-controller architecture',
  features: [
    'Public validation and lookup endpoints',
    'Private CRUD operations with role-based access',
    'College-country alignment validation',
    'User Business ID uniqueness checking',
    'Orchestrator workflow coordination',
    'Event-driven architecture',
    'Repository pattern implementation',
    'Comprehensive error handling',
    'Swagger documentation integration',
  ],
  architecture: {
    controllers: [
      'OtaEducationPublicController',
      'OtaEducationPrivateController',
    ],
    services: [
      'OtaEducationCrudService',
      'OtaEducationLookupService',
      'OtaEducationBusinessRuleService',
    ],
    repositories: ['OtaEducationRepositoryService'],
    events: ['OtaEducationEventsService'],
    orchestrator: ['OtaEducationSessionService'],
  },
  compatibility: {
    nestjs: '^10.0.0',
    typescript: '^5.0.0',
    framework: 'OSOT Dataverse API',
  },
} as const;
