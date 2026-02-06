import { Module } from '@nestjs/common';
import { IdentityPublicController } from '../controllers/identity-public.controller';
import { IdentityPrivateController } from '../controllers/identity-private.controller';
import { IdentityCrudService } from '../services/identity-crud.service';
import { IdentityLookupService } from '../services/identity-lookup.service';
import { IdentityBusinessRuleService } from '../services/identity-business-rule.service';
import { IdentityEventService } from '../events/identity.events';
import { DataverseIdentityRepository } from '../repositories/identity.repository';
import { IDENTITY_REPOSITORY } from '../interfaces/identity-repository.interface';
import { DataverseModule } from '../../../../integrations/dataverse.module';

/**
 * Identity Module
 *
 * Provides complete identity management functionality with modern architecture:
 *
 * PUBLIC CONTROLLERS (No Authentication):
 * - IdentityPublicController: Registration workflow routes for identity validation and analysis
 *   - User Business ID availability checking and format validation
 *   - Identity data pre-validation for registration workflows
 *   - Cultural consistency analysis and recommendations
 *   - Public demographic statistics and health checks
 *
 * PRIVATE CONTROLLERS (JWT Required):
 * - IdentityPrivateController: Authenticated user identity management and admin operations
 *   - Complete CRUD operations for identity records
 *   - Identity analytics and completeness assessment
 *   - Account-based identity filtering and language-based queries
 *   - User context validation and ownership verification
 *
 * SERVICES:
 * - IdentityCrudService: CRUD operations using repository pattern and events
 *   - Full identity lifecycle management with business rule validation
 *   - Data completeness assessment and recommendations
 *   - User Business ID uniqueness enforcement (20 character limit)
 *   - Language preference management and cultural consistency
 *
 * - IdentityLookupService: Advanced queries, statistics, and analytics
 *   - Multi-language identity queries and demographic analysis
 *   - Identity statistics generation for public and private use
 *   - Cultural identity pattern recognition and reporting
 *   - Performance-optimized search and filtering operations
 *
 * - IdentityBusinessRuleService: Business rule validation and enforcement
 *   - User Business ID format and uniqueness validation
 *   - Cultural consistency validation across identity fields
 *   - Language requirement enforcement (minimum one required)
 *   - Indigenous identity detail validation and logical consistency
 *   - Access modifier and privilege validation with defaults
 *
 * - IdentityEventService: Event-driven architecture for identity lifecycle
 *   - Identity creation, update, and deletion events
 *   - Cultural consistency change notifications
 *   - Language preference update events
 *   - Data completeness milestone events
 *
 * REPOSITORIES:
 * - DataverseIdentityRepository: Clean abstraction for Dataverse identity data access
 *   - CRUD operations with GUID-based primary key handling
 *   - User Business ID indexing and uniqueness checking
 *   - Language-based filtering and multi-field search
 *   - Cultural identity data normalization and storage
 *
 * ARCHITECTURE PATTERNS:
 * - Repository Pattern: Clean separation between business logic and data access
 * - Event-Driven: Lifecycle events for integration and auditing
 * - Dependency Injection: Proper IoC container usage with token-based repositories
 * - Data Transformation: Consistent mapping between DTOs and Dataverse entities
 * - Business Rules: Cultural consistency, language requirements, User Business ID uniqueness
 * - Domain Events: Identity lifecycle notifications for external system integration
 *
 * IDENTITY MANAGEMENT FEATURES:
 * - User Business ID management with 20-character limit and uniqueness enforcement
 * - Multi-language preference support with array-based storage
 * - Cultural identity tracking (gender, race, indigenous status, disability)
 * - Indigenous identity detail validation with logical consistency checks
 * - Chosen name support for personalization and cultural sensitivity
 * - Access modifier management for privacy control
 * - Data completeness scoring and improvement recommendations
 * - Cultural consistency analysis and reporting
 * - Registration workflow integration with pre-validation
 * - Public statistics generation for demographic analysis
 *
 * CSV COMPLIANCE:
 * - Full compliance with Table Identity.csv specifications
 * - All 14 identity fields properly implemented and validated
 * - Business required fields enforced (User Business ID, Language)
 * - Optional cultural identity fields with proper defaults
 * - Access modifiers default to Private for privacy protection
 * - Privilege levels default to Owner for user empowerment
 * - Data types and field lengths match CSV specifications exactly
 */
@Module({
  imports: [DataverseModule],
  controllers: [IdentityPublicController, IdentityPrivateController],
  providers: [
    // Core Services
    IdentityCrudService,
    IdentityLookupService,
    IdentityBusinessRuleService,
    IdentityEventService,

    // Repository Pattern Implementation
    {
      provide: IDENTITY_REPOSITORY,
      useClass: DataverseIdentityRepository,
    },
  ],
  exports: [
    // Export services for use in other modules (orchestrators, other domains)
    IdentityCrudService,
    IdentityLookupService,
    IdentityBusinessRuleService,
    IdentityEventService,
    IDENTITY_REPOSITORY,
  ],
})
export class IdentityModule {}
