import { Module } from '@nestjs/common';

// Controllers
import { OtEducationPublicController } from '../controllers/ot-education-public.controller';
import { OtEducationPrivateController } from '../controllers/ot-education-private.controller';
import { OtEducationCategorySchedulerController } from '../controllers/ot-education-scheduler.controller';

// Services
import { OtEducationCrudService } from '../services/ot-education-crud.service';
import { OtEducationLookupService } from '../services/ot-education-lookup.service';
import { OtEducationBusinessRuleService } from '../services/ot-education-business-rule.service';

// Repository
import { OtEducationRepositoryService } from '../repositories/ot-education.repository';
import { OT_EDUCATION_REPOSITORY } from '../interfaces/ot-education-repository.interface';

// Events
import { OtEducationEventsService } from '../events/ot-education.events';

// Orchestrator
import { OtEducationSessionService } from '../orchestrator/services/ot-education-session.service';

// Scheduler
import { OtEducationCategoryScheduler } from '../schedulers/ot-education-category.scheduler';

// External Dependencies
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { CommonServicesModule } from '../../../../common/modules/common-services.module';
import { AccountModule } from '../../account/modules/account.module';

/**
 * OT Education Module
 *
 * Provides comprehensive OT Education functionality including:
 * - Public API routes for validation and lookup operations
 * - Private API routes for authenticated CRUD operations
 * - Admin API routes for scheduler management
 * - Business rule validation and education category determination
 * - Automated education category lifecycle management
 * - Repository pattern for data access
 * - Event handling for education record changes
 * - Orchestrator pattern for complex workflow management
 * - Integration with Dataverse for data persistence
 *
 * Architecture:
 * - Public Controller: Unauthenticated routes for validation and lookups
 * - Private Controller: Authenticated routes with role-based access control
 * - Scheduler Controller: Admin routes for automated category updates
 * - Service Layer: Business logic, validation, and data operations
 * - Repository Layer: Data access abstraction over Dataverse
 * - Events: Auditing and business event handling
 * - Scheduler: Automated category progression management
 * - Orchestrator: Session-based workflow coordination (demonstration)
 */
@Module({
  imports: [DataverseModule, CommonServicesModule, AccountModule],
  controllers: [
    OtEducationPublicController,
    OtEducationPrivateController,
    OtEducationCategorySchedulerController,
  ],
  providers: [
    // Core Services
    OtEducationCrudService,
    OtEducationLookupService,
    OtEducationBusinessRuleService,

    // Data Access - Repository Pattern Implementation
    {
      provide: OT_EDUCATION_REPOSITORY,
      useClass: OtEducationRepositoryService,
    },

    // Events
    OtEducationEventsService,

    // Orchestrator (demonstration)
    OtEducationSessionService,

    // Scheduler
    OtEducationCategoryScheduler,
  ],
  exports: [
    // Export services for use in other modules
    OtEducationCrudService,
    OtEducationLookupService,
    OtEducationBusinessRuleService,
    OT_EDUCATION_REPOSITORY,
    OtEducationEventsService,
    OtEducationSessionService,
    OtEducationCategoryScheduler,
  ],
})
export class OtEducationModule {}
