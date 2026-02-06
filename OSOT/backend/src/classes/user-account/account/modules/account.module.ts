import { Module, forwardRef } from '@nestjs/common';

// External Dependencies
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { AuthModule } from '../../../../auth/auth.module';
import { OrganizationModule } from '../../../others/organization/modules/organization.module';

// Repository
import { AccountRepositoryService } from '../repositories/account.repository';
import { ACCOUNT_REPOSITORY } from '../interfaces/account-repository.interface';

// Internal Services
import { AccountBusinessRulesService } from '../services/account-business-rules.service';
import { AccountCrudService } from '../services/account-crud.service';
import { AccountLookupService } from '../services/account-lookup.service';

// Event System
import { AccountEventsService } from '../events/account.events';

// Controllers
import { AccountPublicController } from '../controllers/account-public.controller';
import { AccountPrivateController } from '../controllers/account-private.controller';
import { AccountApiController } from '../controllers/account-api.controller';

/**
 * Account Module
 *
 * COMPREHENSIVE ACCOUNT ENTITY MANAGEMENT:
 * - Business rule validation with anti-fraud protection (email/person uniqueness)
 * - CRUD operations with privilege-based access control (MAIN/OWNER/ADMIN)
 * - Advanced search and lookup operations with duplicate detection
 * - Repository pattern implementation with DataverseService integration
 * - Comprehensive logging and operation tracking for audit compliance
 * - Canadian standards compliance for phone and date formats
 *
 * ARCHITECTURE FEATURES:
 * - Service orchestration with business rules enforcement
 * - Multi-app security routing with permission checking
 * - Error handling with centralized error factory
 * - Structured logging with security-aware PII redaction
 * - Enterprise-grade validation and anti-fraud protection
 * - Performance monitoring and analytics capabilities
 *
 * INTEGRATION CAPABILITIES:
 * - DataverseModule for data persistence and multi-app routing
 * - Common modules for shared utilities and error handling
 *
 * EXPORT STRATEGY:
 * - Repository interface token for dependency injection
 * - All core services for external module consumption
 * - Business rules service for validation across modules
 * - Lookup service for duplicate detection and search operations
 *
 * MODULE DEPENDENCIES:
 * - DataverseModule: Required for all data operations
 *
 * SECURITY CONSIDERATIONS:
 * - All services implement privilege-based access control
 * - PII redaction in logging and error messages
 * - Anti-fraud protection with comprehensive validation
 * - Audit trail compliance with operation tracking
 * - Business rule enforcement for data integrity
 *
 * @integrates DataverseModule for data persistence and multi-app security
 * @exports All account services for external module consumption
 * @implements Repository pattern for data access abstraction
 * @provides Comprehensive account lifecycle management
 */
@Module({
  imports: [DataverseModule, forwardRef(() => AuthModule), OrganizationModule],
  controllers: [
    AccountPublicController,
    AccountPrivateController,
    AccountApiController,
  ],
  providers: [
    // Repository Provider - direct class registration for injection
    AccountRepositoryService, // Direct provider for dependency injection

    // Repository Pattern Provider - enables dependency injection of repository interface
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: AccountRepositoryService,
    },

    // Core Account Services
    AccountBusinessRulesService, // Orchestrator service with comprehensive validation
    AccountCrudService, // Data operations with DataverseService integration
    AccountLookupService, // Search operations and duplicate detection
    AccountEventsService, // Event publishing and audit trail management
  ],
  exports: [
    // Repository Interface - enables other modules to inject account repository
    ACCOUNT_REPOSITORY,

    // Repository Service - direct class export for external modules
    AccountRepositoryService, // Direct repository class for external injection

    // Core Services Export - enables consumption by other modules
    AccountBusinessRulesService, // Business rules orchestrator with validation
    AccountCrudService, // Data persistence and CRUD operations
    AccountLookupService, // Search operations and advanced lookups
    AccountEventsService, // Event publishing for audit trail and compliance
  ],
})
export class AccountModule {
  // Future: Static methods for module configuration
  // static forRoot(config: AccountModuleConfig): DynamicModule
  // static forFeature(features: AccountFeature[]): DynamicModule
}
