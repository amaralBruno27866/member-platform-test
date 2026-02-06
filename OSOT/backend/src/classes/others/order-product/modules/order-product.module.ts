/**
 * Order Product Module
 *
 * NestJS module for Order Product entity.
 * Exports services for use by controllers and orchestrators.
 *
 * Dependency Structure:
 * - Repository → accessed by all services
 * - LookupService → read-only, used by CRUD
 * - BusinessRuleService → validation, used by CRUD and Orchestrator
 * - CrudService → CRUD operations (direct DB persistence)
 * - OrchestratorService → Redis staging + batch commit
 * - DraftService → Helper for e-commerce workflow
 *
 * Services are exported for use in:
 * - Controllers (HTTP endpoints)
 * - Other modules (cross-domain operations)
 *
 * @file order-product.module.ts
 * @module OrderProductModule
 */

import { Module, forwardRef } from '@nestjs/common';
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { RedisService } from '../../../../redis/redis.service';
import { DataverseOrderProductRepository } from '../repositories';
import { OrderProductLookupService } from '../services/order-product-lookup.service';
import { OrderProductBusinessRuleService } from '../services/order-product-business-rules.service';
import { OrderProductCrudService } from '../services/order-product-crud.service';
import { OrderProductOrchestratorService } from '../services/order-product-orchestrator.service';
import { OrderDraftService } from '../services/order-draft.service';
import { OrderProductEventsService } from '../events/order-product-events.service';
import { ProductModule } from '../../product/modules/product.module';
import { OrderModule } from '../../order/modules/order.module';

@Module({
  imports: [DataverseModule, ProductModule, forwardRef(() => OrderModule)],
  providers: [
    RedisService, // Required by OrchestratorService for session management
    DataverseOrderProductRepository,
    OrderProductLookupService,
    OrderProductBusinessRuleService,
    OrderProductCrudService,
    OrderProductOrchestratorService,
    OrderDraftService,
    OrderProductEventsService,
  ],
  exports: [
    // Export services for controllers
    OrderProductCrudService,
    OrderProductOrchestratorService,
    OrderProductLookupService,
    OrderProductBusinessRuleService,
    OrderDraftService,
    OrderProductEventsService,

    // Export for other modules
    DataverseOrderProductRepository,
  ],
})
export class OrderProductModule {}
