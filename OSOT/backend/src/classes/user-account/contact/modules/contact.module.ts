import { Module } from '@nestjs/common';
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { ContactPublicController } from '../controllers/contact-public.controller';
import { ContactPrivateController } from '../controllers/contact-private.controller';
import { ContactCrudService } from '../services/contact-crud.service';
import { ContactLookupService } from '../services/contact-lookup.service';
import { ContactBusinessRuleService } from '../services/contact-business-rule.service';
import { ContactEventsService } from '../events/contact.events';
import { DataverseContactRepository } from '../repositories/contact.repository';
import { CONTACT_REPOSITORY } from '../interfaces/contact-repository.interface';
// DataverseService is provided by DataverseModule import

/**
 * Contact Module
 *
 * Provides complete contact management functionality with modern architecture:
 *
 * PUBLIC CONTROLLERS (No Authentication):
 * - ContactPublicController: Registration workflow routes for contact staging and validation
 *
 * PRIVATE CONTROLLERS (JWT Required):
 * - ContactPrivateController: Authenticated user contact management and admin operations
 *
 * SERVICES:
 * - ContactCrudService: CRUD operations using repository pattern and events
 * - ContactLookupService: Professional networking, social media, and business ID queries
 * - ContactBusinessRuleService: Business rule validation, social media normalization
 * - ContactEventsService: Event-driven architecture for contact lifecycle
 *
 * REPOSITORIES:
 * - DataverseContactRepository: Clean abstraction for Dataverse contact data access
 *
 * ARCHITECTURE PATTERNS:
 * - Repository Pattern: Clean separation between business logic and data access
 * - Event-Driven: Lifecycle events for integration and auditing
 * - Dependency Injection: Proper IoC container usage
 * - Data Transformation: Consistent mapping between layers
 * - Business Rules: Social media URL normalization and business ID uniqueness
 *
 * CONTACT MANAGEMENT FEATURES:
 * - Professional networking and job title analytics
 * - Social media profile management (Facebook, Instagram, TikTok, LinkedIn)
 * - Business ID uniqueness validation
 * - Communication preference management
 * - Contact staging for registration workflows
 * - Advanced search and filtering capabilities
 */
@Module({
  imports: [DataverseModule],
  controllers: [ContactPublicController, ContactPrivateController],
  providers: [
    // Core Services
    ContactCrudService,
    ContactLookupService,
    ContactBusinessRuleService,
    ContactEventsService,

    // Repository Pattern Implementation
    {
      provide: CONTACT_REPOSITORY,
      useClass: DataverseContactRepository,
    },

    // DataverseService is provided by DataverseModule import
  ],
  exports: [
    // Export services for use in other modules
    ContactCrudService,
    ContactLookupService,
    ContactBusinessRuleService,
    ContactEventsService,
    CONTACT_REPOSITORY,
  ],
})
export class ContactModule {}
