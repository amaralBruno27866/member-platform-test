import { Module } from '@nestjs/common';
import { ManagementCrudService } from '../services/management-crud.service';
import { ManagementLookupService } from '../services/management-lookup.service';
import { ManagementBusinessRuleService } from '../services/management-business-rule.service';
import { ManagementAuditService } from '../services/management-audit.service';
import { ManagementEventService } from '../events/management.events';
import { ManagementRepositoryService } from '../repositories/management.repository';
import { MANAGEMENT_REPOSITORY } from '../interfaces/management-repository.interface';
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { ManagementPrivateController } from '../controllers/management-private.controller';
import { ManagementPublicController } from '../controllers/management-public.controller';

/**
 * Management Module
 *
 * Provides complete management functionality with modern enterprise architecture:
 *
 * SERVICES:
 * - ManagementCrudService: Complete CRUD operations using repository pattern
 *   - Full management lifecycle with business rule validation
 *   - Repository Pattern integration for modern data access
 *   - Role-based permission checking and security logging
 *   - Comprehensive error handling and audit trails
 *
 * - ManagementLookupService: Advanced queries, statistics, and analytics
 *   - Multi-criteria search and filtering operations
 *   - Account-based management lookups with security controls
 *   - Performance-optimized queries with minimal data transfer
 *   - Hybrid architecture for gradual migration support
 *
 * - ManagementBusinessRuleService: Business rule validation and enforcement
 *   - Data integrity validation and business constraint enforcement
 *   - Account relationship validation and security checks
 *   - Immutable field protection and update restrictions
 *   - Comprehensive validation with detailed error reporting
 *
 * - ManagementAuditService: Comprehensive audit trails and compliance
 *   - Complete lifecycle tracking for management entities
 *   - Security event tracking and threat intelligence
 *   - Compliance reporting and regulatory audit support
 *   - PII protection with automatic data redaction
 *
 * - ManagementEventService: Business workflow events and system integration
 *   - Business workflow triggers and real-time notifications
 *   - Event sourcing for business state reconstruction
 *   - System integration and external workflow triggers
 *   - Real-time permission synchronization and analytics
 *
 * ARCHITECTURE FEATURES:
 * - Repository Pattern: Clean data access abstraction
 * - Enterprise Logging: Operation tracking with unique IDs
 * - Security-First Design: Role-based access control and audit trails
 * - Hybrid Architecture: Modern + Legacy paths for migration
 * - Error Management: Centralized error handling with detailed context
 * - Type Safety: Full TypeScript integration with strong typing
 *
 * ENTERPRISE COMPLIANCE:
 * - Complete audit trails for all management operations
 * - Security-aware logging with PII redaction
 * - Business rule enforcement with validation frameworks
 * - Permission-based access control with comprehensive tracking
 * - Data integrity validation and relationship management
 * - Compliance reporting and regulatory audit support
 */
@Module({
  imports: [
    // Import DataverseModule to get DataverseService with its dependencies
    DataverseModule,
  ],
  controllers: [
    // Management Controllers
    ManagementPublicController,
    ManagementPrivateController,
  ],
  providers: [
    // Core Services
    ManagementCrudService,
    ManagementLookupService,
    ManagementBusinessRuleService,
    ManagementAuditService,
    ManagementEventService,

    // Repository Pattern Implementation
    {
      provide: MANAGEMENT_REPOSITORY,
      useClass: ManagementRepositoryService,
    },
  ],
  exports: [
    // Export services for use in other modules (orchestrators, other domains)
    ManagementCrudService,
    ManagementLookupService,
    ManagementBusinessRuleService,
    ManagementAuditService,
    ManagementEventService,
    MANAGEMENT_REPOSITORY,
  ],
})
export class ManagementModule {}
