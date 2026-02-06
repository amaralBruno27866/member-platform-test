/**
 * Order Module
 *
 * Provides full Order entity wiring: repository, services, controller, events, and orchestrators.
 * Private-only endpoints (JWT + privilege checks).
 */
import { Module, forwardRef } from '@nestjs/common';
import { DataverseModule } from '../../../../integrations/dataverse.module';
import { RedisService } from '../../../../redis/redis.service';
import { CacheService } from '../../../../cache/cache.service';

// Repository
import { DataverseOrderRepository } from '../repositories/dataverse-order.repository';

// Services
import { OrderMapper } from '../mappers/order.mapper';
import { OrderCrudService } from '../services/order-crud.service';
import { OrderLookupService } from '../services/order-lookup.service';
import { OrderBusinessRulesService } from '../services/order-business-rules.service';
import { OrderEventsService } from '../events/order.events';

// Orchestrator
import { OrderInsuranceOrchestratorService } from '../orchestrator/services/order-insurance.orchestrator.service';

// Controllers
import { PrivateOrderController } from '../controllers/private-order.controller';

// External modules
import { OrderProductModule } from '../../order-product/modules/order-product.module';
import { InsuranceModule } from '../../insurance/modules/insurance.module';

@Module({
  imports: [
    DataverseModule,
    OrderProductModule,
    forwardRef(() => InsuranceModule), // Circular dependency prevention
  ],
  providers: [
    // Repository binding
    { provide: 'ORDER_REPOSITORY', useClass: DataverseOrderRepository },
    // Cache + Redis
    RedisService,
    CacheService,
    // Core services
    OrderMapper,
    OrderCrudService,
    OrderLookupService,
    OrderBusinessRulesService,
    OrderEventsService,
    // Orchestrator
    OrderInsuranceOrchestratorService,
  ],
  controllers: [PrivateOrderController],
  exports: [
    'ORDER_REPOSITORY',
    OrderMapper,
    OrderCrudService,
    OrderLookupService,
    OrderBusinessRulesService,
    OrderEventsService,
    OrderInsuranceOrchestratorService, // Export for InsuranceModule listeners
  ],
})
export class OrderModule {}
