import { Module } from '@nestjs/common';
import { ProductOrchestratorService } from '../services/product-orchestrator.service';
import { ProductOrchestratorPrivateController } from '../controllers/product-orchestrator-private.controller';
import { ProductOrchestratorRepository } from '../repositories/product-orchestrator.repository';
import { ProductOrchestratorEventService } from '../events/product-orchestrator-event.service';
import { RedisService } from '../../../../redis/redis.service';
import { ProductModule } from '../../../others/product/modules/product.module';
import { AudienceTargetModule } from '../../../others/audience-target/modules/audience-target.module';

/**
 * Product Orchestrator Module
 * Manages product creation workflow with Redis-first validation
 */
@Module({
  imports: [
    ProductModule, // Provides ProductCrudService, ProductLookupService
    AudienceTargetModule, // Provides AudienceTargetCrudService
  ],
  providers: [
    ProductOrchestratorService,
    ProductOrchestratorRepository,
    ProductOrchestratorEventService,
    RedisService, // Required for session management
  ],
  controllers: [ProductOrchestratorPrivateController],
  exports: [ProductOrchestratorService], // For potential future use
})
export class ProductOrchestratorModule {}
