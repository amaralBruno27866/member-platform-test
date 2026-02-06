/**
 * Membership Practices Module
 *
 * This module provides:
 * - Complete CRUD operations for membership practices
 * - Private API endpoints for self-service and administrative operations
 * - Business rules validation with clients age required and conditional "_Other" fields
 * - Event-driven architecture for practices lifecycle tracking
 * - Repository pattern implementation with Dataverse integration
 * - Integration with membership-settings for year validation
 * - Integration with membership-category for active year determination
 *
 * FEATURES:
 * - Self-service routes (/me) for users to manage their own practices
 * - Administrative routes for ADMIN/MAIN to manage all practices records
 * - Automatic membership year determination from membership-settings
 * - Clients age required validation (business required, minimum 1 value)
 * - Conditional "_Other" fields validation (2 enum types)
 * - One practice per user per year enforcement
 * - Hard delete capability (Admin/Main only - DISABLED pending finalization)
 * - Comprehensive event logging for audit trails
 *
 * DEPENDENCIES:
 * - DataverseModule: Core Dataverse integration
 * - MembershipCategoryModule: Membership year service
 * - MembershipSettingsModule: Year validation and active status check
 * - MembershipEmploymentModule: UserGuidResolverUtil (shared utility)
 *
 * EXPORTS:
 * - Repository interface for external consumption
 * - Core services (CRUD, Lookup, Business Rules)
 * - Events service for external event handling
 * - Mapper for data transformation
 */

import { Module } from '@nestjs/common';

// Controllers
import { MembershipPracticesPrivateController } from '../controllers/membership-practices-private.controller';

// Services
import { MembershipPracticesBusinessRulesService } from '../services/membership-practices-business-rules.service';
import { MembershipPracticesCrudService } from '../services/membership-practices-crud.service';
import { MembershipPracticesLookupService } from '../services/membership-practices-lookup.service';

// Repository
import {
  DataverseMembershipPracticesRepository,
  MEMBERSHIP_PRACTICES_REPOSITORY,
} from '../repositories/membership-practices.repository';

// Events
import { MembershipPracticesEventsService } from '../events/membership-practices.events';

// Mappers
import { MembershipPracticesMapper } from '../mappers/membership-practices.mapper';

// Common modules
import { DataverseModule } from '../../../../integrations/dataverse.module';

// External dependencies
import { MembershipCategoryModule } from '../../membership-category/modules/membership-category.module';
import { MembershipSettingsModule } from '../../membership-settings/modules/membership-settings.module';
import { MembershipEmploymentModule } from '../../membership-employment/modules/membership-employment.module';

@Module({
  imports: [
    DataverseModule, // For Dataverse integration
    MembershipCategoryModule, // For membership year service
    MembershipSettingsModule, // For year validation and active status check
    MembershipEmploymentModule, // For UserGuidResolverUtil (shared utility)
  ],
  controllers: [MembershipPracticesPrivateController],
  providers: [
    // Services
    MembershipPracticesBusinessRulesService,
    MembershipPracticesCrudService,
    MembershipPracticesLookupService,

    // Repository - Pattern Provider
    {
      provide: MEMBERSHIP_PRACTICES_REPOSITORY,
      useClass: DataverseMembershipPracticesRepository,
    },

    // Events
    MembershipPracticesEventsService,

    // Mappers
    MembershipPracticesMapper,

    // Note: UserGuidResolverUtil is imported from MembershipEmploymentModule
    // It's injected in the controller but provided by the imported module
  ],
  exports: [
    // Export repository interface for external consumption
    MEMBERSHIP_PRACTICES_REPOSITORY,

    // Export core services for potential use by other modules
    MembershipPracticesBusinessRulesService,
    MembershipPracticesCrudService,
    MembershipPracticesLookupService,

    // Export events service for external event handling
    MembershipPracticesEventsService,

    // Export mapper for external data transformation
    MembershipPracticesMapper,
  ],
})
export class MembershipPracticesModule {}
