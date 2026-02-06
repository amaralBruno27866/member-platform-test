/**
 * Audience Target Module
 *
 * This module provides the complete Audience Target entity implementation including:
 * - Private endpoints for Admin/Main CRUD operations (JWT authentication only)
 * - Integration with Microsoft Dataverse
 * - Support for 32 targeting criteria fields across 8 categories
 * - One-to-one relationship with Product entity
 * - Event-driven architecture (when @nestjs/event-emitter is installed)
 *
 * @module AudienceTargetModule
 */

import { Module, Provider, Type } from '@nestjs/common';

// Repository
import { AUDIENCE_TARGET_REPOSITORY } from '../interfaces';
import { DataverseAudienceTargetRepository } from '../repositories/audience-target.repository';

// Services
import { AudienceTargetMapper } from '../mappers/audience-target.mapper';
import { AudienceTargetCrudService } from '../services/audience-target-crud.service';
import { AudienceTargetLookupService } from '../services/audience-target-lookup.service';
import { AudienceTargetBusinessRulesService } from '../services/audience-target-business-rules.service';
import { AudienceTargetMatchingService } from '../services/audience-target-matching.service';
import { UserProfileBuilderService } from '../services/user-profile-builder.service';

// Controllers
import { AudienceTargetPrivateController } from '../controllers/audience-target-private.controller';

// External dependencies
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { RedisService } from '../../../../redis/redis.service';

/**
 * Repository provider configuration
 * Typed explicitly to avoid ESLint unsafe assignment warnings
 */
const audienceTargetRepositoryProvider: Provider = {
  provide: AUDIENCE_TARGET_REPOSITORY as string,
  useClass: DataverseAudienceTargetRepository,
};

/**
 * Audience Target Module
 *
 * Provides audience targeting functionality for product access control:
 *
 * **Access Control (Private Only)**:
 * - NO PUBLIC ACCESS - Admin/Main privilege required for all operations
 * - All endpoints require JWT authentication
 * - Only Admin (privilege=2) and Main (privilege=3) users can access
 *
 * **CRUD Operations**:
 * - Create new target (one per product - one-to-one relationship)
 * - Update targeting criteria (product reference is immutable)
 * - Delete target (hard delete - releases product for new target)
 * - List/search targets with pagination
 * - Validate product-target relationship
 *
 * **Targeting Criteria (32 fields across 8 categories)**:
 * - Account Group (1): Account type (OT, OTA, etc.)
 * - Affiliate (3): Service area, city, province
 * - Address (2): Member city, province
 * - Identity (4): Gender, indigenous details, language, race
 * - Membership Category (2): Eligibility, category
 * - Employment (9): Earnings, benefits, status, funding, years, role, hours
 * - Practice (4): Client age, area, services, settings
 * - Preference (4): Search tools, promotion, supervision, third parties
 * - Education OT (3): COTO status, graduation year, university
 * - Education OTA (2): Graduation year, college
 *
 * **Business Rules**:
 * - One-to-One Product Relationship: Only one target per product
 * - Immutable Product Reference: Cannot change product after creation
 * - Open-to-All Validation: Empty criteria = accessible to all users (warning logged)
 * - Admin/Main-Only: All operations require Admin/Main privilege
 *
 * **Event System** (when @nestjs/event-emitter is installed):
 * - AudienceTargetCreatedEvent
 * - AudienceTargetUpdatedEvent
 * - AudienceTargetDeletedEvent
 * - AudienceTargetOpenToAllEvent
 * - AudienceTargetProductLinkedEvent
 * - AudienceTargetCriteriaChangedEvent
 *
 * **Integration with Product Entity**:
 * - One target per product (one-to-one relationship via osot_table_product lookup)
 * - Deleting a target releases the product for a new target
 * - Product must exist before creating target
 * - Empty target (all 32 fields empty) = product accessible to all users
 *
 * @example
 * // Import in other modules
 * @Module({
 *   imports: [AudienceTargetModule],
 *   // Use exported services for access control logic
 * })
 * export class AccessControlModule {}
 */
@Module({
  imports: [
    // Dataverse integration for repository
    DataverseModule,
    // TODO: Uncomment when @nestjs/event-emitter is installed
    // EventEmitterModule.forRoot(),
  ],
  providers: [
    // Repository implementation
    audienceTargetRepositoryProvider,
    // Mapper
    AudienceTargetMapper,
    // Services
    AudienceTargetCrudService,
    AudienceTargetLookupService,
    AudienceTargetBusinessRulesService,
    AudienceTargetMatchingService,
    UserProfileBuilderService,
    // Redis for caching (mitigates Dataverse rate limiting)
    RedisService,
  ] as Provider[],
  controllers: [
    // Private endpoints only (JWT auth + Admin/Main privilege)
    AudienceTargetPrivateController,
  ],
  exports: [
    // Export services for use in other modules (e.g., access control, product orchestrator)
    AudienceTargetCrudService,
    AudienceTargetLookupService,
    AudienceTargetBusinessRulesService,
    AudienceTargetMatchingService,
    UserProfileBuilderService,
    // Export repository token for direct injection if needed
    AUDIENCE_TARGET_REPOSITORY,
  ] as Array<Type<any> | string>,
})
export class AudienceTargetModule {}
