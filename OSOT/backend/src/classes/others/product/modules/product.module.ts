/**
 * Product Module
 *
 * This module provides the complete Product entity implementation including:
 * - Public endpoints for catalog browsing (no authentication)
 * - Private endpoints for Admin/Owner CRUD operations (JWT authentication)
 * - Integration with Microsoft Dataverse
 * - Support for 16 price fields (general + 15 membership categories)
 * - Event-driven architecture (when @nestjs/event-emitter is installed)
 *
 * @module ProductModule
 */

import { Module } from '@nestjs/common';

// Repository
import { PRODUCT_REPOSITORY } from '../interfaces';
import { DataverseProductRepository } from '../repositories/dataverse-product.repository';

// Services
import { ProductMapper } from '../mappers/product.mapper';
import { ProductCrudService } from '../services/product-crud.service';
import { ProductLookupService } from '../services/product-lookup.service';
import { ProductBusinessRulesService } from '../services/product-business-rules.service';

// Controllers
import { PublicProductController } from '../controllers/public-product.controller';
import { PrivateProductController } from '../controllers/private-product.controller';

// External dependencies
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { RedisService } from '../../../../redis/redis.service';
import { AudienceTargetModule } from '../../audience-target/modules/audience-target.module';

/**
 * Product Module
 *
 * Provides product management functionality with public and private access patterns:
 *
 * **Public Access (No Authentication)**:
 * - Catalog browsing (only AVAILABLE products visible)
 * - Product search and filtering
 * - Category filtering
 * - Basic statistics
 * - All public endpoints return general_price
 *
 * **Private Access (JWT Authentication)**:
 * - CRUD operations (Admin privilege required)
 * - Batch updates
 * - Soft delete (DISCONTINUED status)
 * - Hard delete (Owner privilege required)
 * - Full statistics
 * - All product statuses visible (DRAFT, AVAILABLE, DISCONTINUED, OUT_OF_STOCK)
 *
 * **Pricing Architecture**:
 * - `osot_general_price`: Visible to all users (authenticated or not)
 * - 15 category-specific prices: Only for active members with specific membership categories
 * - Price calculation logic in ProductBusinessRulesService
 * - Currently simplified (always returns general_price) - full implementation requires Account/Affiliate integration
 *
 * **Event System** (when @nestjs/event-emitter is installed):
 * - ProductCreatedEvent
 * - ProductUpdatedEvent
 * - ProductDeletedEvent
 * - ProductPriceChangedEvent
 * - ProductInventoryChangedEvent
 * - ProductLowStockEvent
 *
 * @example
 * // Import in other modules
 * @Module({
 *   imports: [ProductModule],
 *   // Use exported services
 * })
 * export class OtherModule {}
 */
@Module({
  imports: [
    // Dataverse integration for repository
    DataverseModule,
    // Audience Target module for automatic target creation
    AudienceTargetModule,
    // TODO: Uncomment when @nestjs/event-emitter is installed
    // EventEmitterModule.forRoot(),
  ],
  providers: [
    // Repository implementation
    {
      provide: PRODUCT_REPOSITORY,
      useClass: DataverseProductRepository,
    },
    // Redis for caching (mitigates Dataverse rate limiting - CRITICAL for public endpoints)
    RedisService,
    // Mapper
    ProductMapper,
    // Services
    ProductCrudService,
    ProductLookupService,
    ProductBusinessRulesService,
  ],
  controllers: [
    // Public endpoints (no auth)
    PublicProductController,
    // Private endpoints (JWT auth + privilege checks)
    PrivateProductController,
  ],
  exports: [
    // Export services for use in other modules
    ProductCrudService,
    ProductLookupService,
    ProductBusinessRulesService,
    // Export repository token for direct injection if needed
    PRODUCT_REPOSITORY,
  ],
})
export class ProductModule {}
