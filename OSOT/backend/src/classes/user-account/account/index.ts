/**
 * Account Module Exports
 *
 * This file exports all the account-related constants, types, DTOs, interfaces,
 * services, controllers, events, and utilities for use throughout the application.
 *
 * ARCHITECTURE LAYERS EXPORTED:
 * - Controllers: Public and Private API endpoints
 * - Services: Business rules, CRUD operations, and lookup services
 * - Repository: Data access layer with DataverseService integration
 * - Events: Account lifecycle event management
 * - DTOs: Data transfer objects for API requests/responses
 * - Interfaces: Type definitions for Account data structures
 * - Validators: Input validation and business rule validation
 * - Mappers: Data transformation utilities
 * - Constants: Account-related constants and enums
 * - Rules: Business rules and validation logic
 * - Utilities: Helper functions and utilities
 * - Module: NestJS module configuration
 */

// ========================================
// CONTROLLERS - API Layer
// ========================================
export * from './controllers/account-public.controller';
export * from './controllers/account-private.controller';

// ========================================
// SERVICES - Business Logic Layer
// ========================================
export * from './services/account-business-rules.service';
export * from './services/account-crud.service';
export * from './services/account-lookup.service';

// ========================================
// REPOSITORY - Data Access Layer
// ========================================
export * from './repositories/account.repository';

// ========================================
// EVENTS - Event Management Layer
// ========================================
export * from './events/account.events';

// ========================================
// MODULE - NestJS Configuration
// ========================================
export * from './modules/account.module';

// ========================================
// DTOs - Data Transfer Objects
// ========================================
export * from './dtos/account-basic.dto';
export * from './dtos/create-account.dto';
export * from './dtos/update-account.dto';
export * from './dtos/account-response.dto';
export * from './dtos/account-registration.dto';
export * from './dtos/list-accounts.query.dto';

// ========================================
// INTERFACES - Type Definitions
// ========================================
export * from './interfaces/account-dataverse.interface';
export * from './interfaces/account-internal.interface';
export * from './interfaces/account-repository.interface';

// ========================================
// VALIDATORS - Input & Business Rule Validation
// ========================================
export * from './validators/account.validators';
export * from './validators/password.validator';

// ========================================
// MAPPERS - Data Transformation
// ========================================
export * from './mappers/account.mapper';

// ========================================
// CONSTANTS - Configuration & Enums
// ========================================
export * from './constants/account.constants';

// ========================================
// RULES - Business Rules & Logic
// ========================================
export * from './rules/account-business-rules';

// ========================================
// UTILITIES - Helper Functions
// ========================================
export * from './utils/account.helpers';
