/**
 * Order Services Layer - Barrel Export
 *
 * Exports all order services for dependency injection and module configuration.
 * Provides unified access to CRUD, business rules, and lookup functionality.
 *
 * @see REDIS_STRATEGY.md - Redis caching strategy for orders
 */

export { OrderCrudService } from './order-crud.service';
export { OrderBusinessRulesService } from './order-business-rules.service';
export { OrderLookupService } from './order-lookup.service';

// Export interfaces from services
export type {
  OrderQueryOptions,
  PaginatedOrderResponse,
  OrderStatistics,
} from './order-lookup.service';

// Re-export enums for convenience
export { OrderStatus } from '../enum/order-status.enum';
export { PaymentStatus } from '../enum/payment-status.enum';

/**
 * Service Dependencies:
 *
 * OrderCrudService:
 * - Depends on: OrderRepository, OrderMapper, CacheService
 * - Provides: Pure CRUD operations (create, update, delete, hardDelete)
 * - Responsibility: Persistence + Mapping + Cache invalidation
 *
 * OrderBusinessRulesService:
 * - Depends on: (none - stateless validation)
 * - Provides: Permission validation, state machine transitions, business rule enforcement
 * - Responsibility: Complex validation logic before/after mutations
 *
 * OrderLookupService:
 * - Depends on: OrderRepository, OrderMapper, OrderBusinessRulesService, CacheService
 * - Provides: Specialized read operations with filtering, pagination, statistics
 * - Responsibility: Optimized queries + permission checks + caching
 *
 * Integration Pattern:
 * 1. Controller receives request
 * 2. Call BusinessRulesService.validate*() → ValidationResult
 * 3. If valid: call CrudService.create/update/delete()
 * 4. If read: call LookupService.findBy*() → with cache
 * 5. LookupService validates read permissions
 *
 * @see ../order.module.ts - Module configuration with DI setup
 */
