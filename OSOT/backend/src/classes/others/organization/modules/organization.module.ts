/**
 * Organization Module
 *
 * This module provides the complete Organization entity implementation including:
 * - Public endpoints for slug lookup (no authentication, for white-label login)
 * - Private endpoints for CRUD operations (JWT authentication, Main privilege)
 * - Integration with Microsoft Dataverse
 * - Business rules validation (slug, status, dependencies)
 * - Repository pattern with caching
 *
 * @module OrganizationModule
 */

import { Module } from '@nestjs/common';

// Repository
import { ORGANIZATION_REPOSITORY } from '../constants/organization.constants';
import { OrganizationRepository } from '../repositories/organization.repository';

// Services
import { OrganizationCrudService } from '../services/organization-crud.service';
import { OrganizationLookupService } from '../services/organization-lookup.service';
import { OrganizationBusinessRulesService } from '../services/organization-business-rules.service';

// Controllers
import { OrganizationPublicController } from '../controllers/organization-public.controller';
import { OrganizationPrivateController } from '../controllers/organization-private.controller';

// Validators
import {
  ReservedSlugValidator,
  UniqueSlugValidator,
  OrganizationIdValidator,
} from '../validators';

// External dependencies
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { RedisService } from '../../../../redis/redis.service';
import { AddressModule } from '../../../user-account/address';

/**
 * Organization Module
 *
 * Provides organization management functionality with public and private access patterns:
 *
 * **Public Access (No Authentication)**:
 * - Slug lookup for white-label login: GET /public/organization/:slug
 * - Returns only safe public fields (name, logo, website, status)
 * - Used by frontend to customize login page based on organization
 * - Cached for 10 minutes (repository layer)
 *
 * **Private Access (JWT Authentication)**:
 * - CREATE: Main privilege required (privilege = 1)
 * - UPDATE: Main privilege required (privilege = 1)
 * - DELETE (soft): Main privilege required (privilege = 1)
 * - DELETE (hard): Main privilege required (privilege = 1) - IRREVERSIBLE
 * - READ: All authenticated users (no privilege restriction)
 *
 * **Slug Validation**:
 * - Format: /^[a-z0-9-]+$/ (lowercase, alphanumeric, hyphens)
 * - Reserved: 33 system keywords blocked (admin, api, login, etc.)
 * - Uniqueness: Must be unique across all organizations
 * - Immutability: Cannot be changed after creation
 *
 * **Bootstrap Problem**:
 * Note: Creating the first organization requires a bootstrap process (seed script
 * or special endpoint) since Main users need an organization to exist first.
 *
 * **Caching Strategy**:
 * - Single organization: 5 minutes
 * - Slug lookup (public): 10 minutes
 * - List queries: 2 minutes
 * - Invalidation: After create/update/delete operations
 *
 * **Future Dependencies** (when Account/Affiliate modules are integrated):
 * - Deletion checks: Cannot delete organization with active accounts/affiliates
 * - Business rules: Validate organization relationships
 *
 * @example
 * // Import in other modules
 * @Module({
 *   imports: [OrganizationModule],
 *   // Use exported services
 * })
 * export class AccountModule {}
 */
@Module({
  imports: [
    // Dataverse integration for repository
    DataverseModule,
    // Address module - for cascade delete on organization deletion
    AddressModule,
  ],
  providers: [
    // Repository implementation
    OrganizationRepository, // Direct class registration for injection
    {
      provide: ORGANIZATION_REPOSITORY,
      useClass: OrganizationRepository,
    },

    // Redis for caching (mitigates Dataverse rate limiting)
    RedisService,

    // Services
    OrganizationCrudService,
    OrganizationLookupService,
    OrganizationBusinessRulesService,

    // Validators (for class-validator DI)
    ReservedSlugValidator,
    UniqueSlugValidator,
    OrganizationIdValidator,
  ],
  controllers: [
    // Public endpoints (no authentication)
    OrganizationPublicController,

    // Private endpoints (JWT authentication)
    OrganizationPrivateController,
  ],
  exports: [
    // Repository - both interface token and direct class
    ORGANIZATION_REPOSITORY,
    OrganizationRepository, // Direct class export for external injection

    // Services - enables consumption by other modules (Account, Affiliate, etc.)
    OrganizationCrudService,
    OrganizationLookupService,
    OrganizationBusinessRulesService,

    // Validators - enables other modules to use validators
    ReservedSlugValidator,
    UniqueSlugValidator,
    OrganizationIdValidator,
  ],
})
export class OrganizationModule {}
