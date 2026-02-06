/**
 * Membership Employment Module
 *
 * This module provides:
 * - Complete CRUD operations for membership employment
 * - Private API endpoints for self-service and administrative operations
 * - Business rules validation with XOR constraints and conditional "_Other" fields
 * - Event-driven architecture for employment lifecycle tracking
 * - Repository pattern implementation with Dataverse integration
 * - Integration with membership-settings for year validation
 * - Integration with membership-category for active year determination
 *
 * FEATURES:
 * - Self-service routes (/me) for users to manage their own employment
 * - Administrative routes for ADMIN/MAIN to manage all employment records
 * - Automatic membership year determination from membership-settings
 * - XOR validation: Account OR Affiliate (never both)
 * - Conditional "_Other" fields validation (7 enum types)
 * - One employment per user per year enforcement
 * - Hard delete capability (Admin/Main only)
 * - Comprehensive event logging for audit trails
 *
 * DEPENDENCIES:
 * - DataverseModule: Core Dataverse integration
 * - MembershipCategoryModule: Membership year service
 * - MembershipSettingsModule: Year validation and active status check
 *
 * EXPORTS:
 * - Repository interface for external consumption
 * - Core services (CRUD, Lookup, Business Rules)
 * - Events service for external event handling
 * - Mapper for data transformation
 */

import { Module } from '@nestjs/common';

// Controllers
import { MembershipEmploymentPrivateController } from '../controllers/membership-employment-private.controller';

// Services
import { MembershipEmploymentBusinessRulesService } from '../services/membership-employment-business-rules.service';
import { MembershipEmploymentCrudService } from '../services/membership-employment-crud.service';
import { MembershipEmploymentLookupService } from '../services/membership-employment-lookup.service';

// Repository
import {
  DataverseMembershipEmploymentRepository,
  MEMBERSHIP_EMPLOYMENT_REPOSITORY,
} from '../repositories/membership-employment.repository';

// Events
import { MembershipEmploymentEventsService } from '../events/membership-employment.events';

// Mappers
import { MembershipEmploymentMapper } from '../mappers/membership-employment.mapper';

// Utils
import { UserGuidResolverUtil } from '../utils/user-guid-resolver.util';

// Common modules
import { DataverseModule } from '../../../../integrations/dataverse.module';

// External dependencies
import { MembershipCategoryModule } from '../../membership-category/modules/membership-category.module';
import { MembershipSettingsModule } from '../../membership-settings/modules/membership-settings.module';
import { AccountModule } from '../../../user-account/account/modules/account.module';
import { AffiliateModule } from '../../../user-account/affiliate/modules/affiliate.module';

@Module({
  imports: [
    DataverseModule, // For Dataverse integration
    MembershipCategoryModule, // For membership year service
    MembershipSettingsModule, // For year validation and active status check
    AccountModule, // For account repository (GUID resolution)
    AffiliateModule, // For affiliate repository (GUID resolution)
  ],
  controllers: [MembershipEmploymentPrivateController],
  providers: [
    // Services
    MembershipEmploymentBusinessRulesService,
    MembershipEmploymentCrudService,
    MembershipEmploymentLookupService,

    // Repository - Pattern Provider
    {
      provide: MEMBERSHIP_EMPLOYMENT_REPOSITORY,
      useClass: DataverseMembershipEmploymentRepository,
    },

    // Events
    MembershipEmploymentEventsService,

    // Mappers
    MembershipEmploymentMapper,

    // Utils
    UserGuidResolverUtil,
  ],
  exports: [
    // Export repository interface for external consumption
    MEMBERSHIP_EMPLOYMENT_REPOSITORY,

    // Export core services for potential use by other modules
    MembershipEmploymentBusinessRulesService,
    MembershipEmploymentCrudService,
    MembershipEmploymentLookupService,

    // Export events service for external event handling
    MembershipEmploymentEventsService,

    // Export mapper for external data transformation
    MembershipEmploymentMapper,

    // Export utils for external use (e.g., MembershipPracticesModule)
    UserGuidResolverUtil,
  ],
})
export class MembershipEmploymentModule {}
