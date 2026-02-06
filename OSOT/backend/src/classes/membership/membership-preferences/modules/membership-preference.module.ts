/**
 * Membership Preferences Module
 *
 * This module provides:
 * - Complete CRUD operations for membership preferences
 * - Private API endpoints for self-service and administrative operations
 * - Business rules validation with category-based field availability
 * - Event-driven architecture for preference lifecycle tracking
 * - Repository pattern implementation with Dataverse integration
 * - Integration with membership-category for category lookup
 * - Integration with membership-settings for active year determination
 *
 * FEATURES:
 * - Self-service routes (/me) for users to manage their own preferences
 * - Administrative routes for ADMIN/MAIN to manage all preferences
 * - Automatic membership year determination from membership-settings
 * - Category-based field validation (5-tier search tools matrix)
 * - One preference per user per year enforcement
 * - Multi-select field support with validation
 * - Comprehensive event logging for audit trails
 *
 * DEPENDENCIES:
 * - DataverseModule: Core Dataverse integration
 * - MembershipCategoryModule: Category lookup and membership year service
 *
 * EXPORTS:
 * - Repository interface for external consumption
 * - Core services (CRUD, Lookup, Business Rules)
 * - Events service for external event handling
 * - Mapper for data transformation
 */

import { Module } from '@nestjs/common';

// Controllers
import { MembershipPreferencePrivateController } from '../controllers/membership-preference-private.controller';

// Services
import { MembershipPreferenceBusinessRulesService } from '../services/membership-preference-business-rules.service';
import { MembershipPreferenceCrudService } from '../services/membership-preference-crud.service';
import { MembershipPreferenceLookupService } from '../services/membership-preference-lookup.service';
import { MembershipCertificateService } from '../services/membership-certificate.service';

// Repository
import {
  DataverseMembershipPreferenceRepository,
  MEMBERSHIP_PREFERENCE_REPOSITORY,
} from '../repositories/membership-preference.repository';

// Events
import { MembershipPreferenceEventsService } from '../events/membership-preference.events';

// Mappers
import { MembershipPreferenceMapper } from '../mappers/membership-preference.mapper';

// Common modules
import { DataverseModule } from '../../../../integrations/dataverse.module';

// External dependencies
import { MembershipCategoryModule } from '../../membership-category/modules/membership-category.module';
import { AccountRepositoryService } from '../../../user-account/account/repositories/account.repository';
import { AffiliateRepositoryService } from '../../../user-account/affiliate/repositories/affiliate.repository';

// Utils
import { UserGuidResolverUtil } from '../utils/user-guid-resolver.util';

@Module({
  imports: [
    DataverseModule, // For Dataverse integration
    MembershipCategoryModule, // For category lookup and membership year service
  ],
  controllers: [MembershipPreferencePrivateController],
  providers: [
    // Services
    MembershipPreferenceBusinessRulesService,
    MembershipPreferenceCrudService,
    MembershipPreferenceLookupService,
    MembershipCertificateService,

    // Repository - Pattern Provider
    {
      provide: MEMBERSHIP_PREFERENCE_REPOSITORY,
      useClass: DataverseMembershipPreferenceRepository,
    },

    // Events
    MembershipPreferenceEventsService,

    // Mappers
    MembershipPreferenceMapper,

    // Utils
    UserGuidResolverUtil,

    // External repositories
    AccountRepositoryService,
    AffiliateRepositoryService,
  ],
  exports: [
    // Export repository interface for external consumption
    MEMBERSHIP_PREFERENCE_REPOSITORY,

    // Export core services for potential use by other modules
    MembershipPreferenceBusinessRulesService,
    MembershipPreferenceCrudService,
    MembershipPreferenceLookupService,
    MembershipCertificateService,

    // Export events service for external event handling
    MembershipPreferenceEventsService,

    // Export mapper for external data transformation
    MembershipPreferenceMapper,
  ],
})
export class MembershipPreferenceModule {}
