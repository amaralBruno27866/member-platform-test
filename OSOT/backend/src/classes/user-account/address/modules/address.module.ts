import { Module } from '@nestjs/common';
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { AddressPublicController } from '../controllers/address-public.controller';
import { AddressPrivateController } from '../controllers/address-private.controller';
import { AddressCrudService } from '../services/address-crud.service';
import { AddressLookupService } from '../services/address-lookup.service';
import { AddressBusinessRulesService } from '../services/address-business-rules.service';
import { AddressEventsService } from '../events/address.events';
import { AddressMapper } from '../mappers/address.mapper';
import { AddressFormatter } from '../utils/address-formatter.util';
import { AddressDataSanitizer } from '../utils/address-sanitizer.util';
import {
  ADDRESS_REPOSITORY,
  DataverseAddressRepository,
} from '../repositories/address.repository';
// Remove DataverseService direct import since it comes from DataverseModule

/**
 * Address Module
 *
 * Provides complete address management functionality with modern architecture:
 *
 * PUBLIC CONTROLLERS (No Authentication):
 * - AddressPublicController: Validation utilities and geographic lookup services
 *
 * PRIVATE CONTROLLERS (JWT Required):
 * - AddressPrivateController: Authenticated user address management with role-based access
 *
 * SERVICES:
 * - AddressCrudService: CRUD operations with permission system and field filtering
 * - AddressLookupService: Geographic search, postal code validation, and business queries
 * - AddressBusinessRulesService: Address validation, standardization, and business rules
 * - AddressEventsService: Event-driven architecture for address lifecycle management
 *
 * REPOSITORIES:
 * - DataverseAddressRepository: Clean abstraction for Dataverse address data access
 *
 * ARCHITECTURE PATTERNS:
 * - Repository Pattern: Clean separation between business logic and data access
 * - Event-Driven: Lifecycle events for integration and auditing
 * - Permission System: Role-based access control (owner/admin/main) with field filtering
 * - Dependency Injection: Proper IoC container usage
 * - Data Transformation: Consistent mapping between layers
 * - Business Rules: Address validation, postal code formatting, and geographic standardization
 *
 * ADDRESS MANAGEMENT FEATURES:
 * - Geographic validation and postal code standardization
 * - Address type management (primary, secondary, billing, shipping)
 * - Integration with Contact and Account modules
 * - Advanced search by postal code, region, and account association
 * - Role-based field filtering for security and privacy
 * - Address standardization and normalization
 * - Geographic coordinate support for mapping integration
 */
@Module({
  imports: [DataverseModule],
  controllers: [AddressPublicController, AddressPrivateController],
  providers: [
    // Core Services
    AddressCrudService,
    AddressLookupService,
    AddressBusinessRulesService,
    AddressEventsService,

    // Data Transformation
    AddressMapper,

    // Utilities
    AddressFormatter,
    AddressDataSanitizer,

    // Repository Pattern Implementation
    {
      provide: ADDRESS_REPOSITORY,
      useClass: DataverseAddressRepository,
    },

    // DataverseService is provided by DataverseModule import
  ],
  exports: [
    // Export services for use in other modules
    AddressCrudService,
    AddressLookupService,
    AddressBusinessRulesService,
    AddressEventsService,
    ADDRESS_REPOSITORY,
  ],
})
export class AddressModule {}
