import { Module } from '@nestjs/common';
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { MembershipSettingsModule } from '../../../membership/membership-settings/modules/membership-settings.module';
import { AccountModule } from '../../account/modules/account.module';

// Controllers
import { OtaEducationPublicController } from '../controllers/ota-education-public.controller';
import { OtaEducationPrivateController } from '../controllers/ota-education-private.controller';
import { OtaEducationCategorySchedulerController } from '../controllers/ota-education-scheduler.controller';

// Services
import { OtaEducationCrudService } from '../services/ota-education-crud.service';
import { OtaEducationLookupService } from '../services/ota-education-lookup.service';
import { OtaEducationBusinessRuleService } from '../services/ota-education-business-rule.service';

// Repositories
import { OtaEducationRepositoryService } from '../repositories/ota-education.repository';
import { OTA_EDUCATION_REPOSITORY } from '../interfaces/ota-education-repository.interface';

// Events
import { OtaEducationEventsService } from '../events/ota-education.events';

// Orchestrator
import { OtaEducationSessionService } from '../orchestrator/services/ota-education-session.service';

// Schedulers
import { OtaEducationCategoryScheduler } from '../schedulers/ota-education-category.scheduler';

/**
 * OTA Education Module
 *
 * Comprehensive module for OTA Education management providing:
 * - Public endpoints for validation and lookup operations (no authentication)
 * - Private endpoints for CRUD and administrative operations (JWT + role-based)
 * - Integration with Dataverse API for external data operations
 * - Business rule enforcement and validation
 * - Event-driven architecture for auditing and notifications
 *
 * Architecture:
 * - Controllers: Public (validation/lookup) and Private (CRUD/admin)
 * - Services: CRUD operations, business rules, and lookup utilities
 * - Repository: Data access layer abstraction
 * - Events: Auditing and business event handling
 * - Orchestrator: Session-based workflow coordination (demonstration)
 *
 * Features:
 * - College-country alignment validation
 * - User Business ID uniqueness checking
 * - Comprehensive CRUD operations with role-based access
 * - Statistical analytics and reporting
 * - Structured error handling and logging
 * - Swagger documentation for all endpoints
 * - Integration with common enums and utilities
 */
@Module({
  imports: [DataverseModule, MembershipSettingsModule, AccountModule],
  controllers: [
    OtaEducationPublicController,
    OtaEducationPrivateController,
    OtaEducationCategorySchedulerController,
  ],
  providers: [
    // Core Services
    OtaEducationCrudService,
    OtaEducationLookupService,
    OtaEducationBusinessRuleService,

    // Data Access - Repository Pattern Implementation
    {
      provide: OTA_EDUCATION_REPOSITORY,
      useClass: OtaEducationRepositoryService,
    },

    // Events
    OtaEducationEventsService,

    // Orchestrator (demonstration)
    OtaEducationSessionService,

    // Schedulers
    OtaEducationCategoryScheduler,
  ],
  exports: [
    // Export services for use in other modules
    OtaEducationCrudService,
    OtaEducationLookupService,
    OtaEducationBusinessRuleService,
    OTA_EDUCATION_REPOSITORY,
    OtaEducationEventsService,
    OtaEducationSessionService,

    // Export schedulers for testing and monitoring
    OtaEducationCategoryScheduler,
  ],
})
export class OtaEducationModule {}
