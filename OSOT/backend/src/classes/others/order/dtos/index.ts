/**
 * Order DTOs Index
 *
 * Central export point for all Order Data Transfer Objects.
 *
 * Layers:
 * - Input DTOs: CreateOrderDto, UpdateOrderDto
 * - Output DTOs: OrderResponseDto, OrderBasicDto
 * - Query DTOs: ListOrdersQueryDto
 *
 * @file index.ts
 * @module OrderModule
 * @layer DTOs
 * @since 2026-01-22
 */

// ========================================
// INPUT DTOs (Create/Update)
// ========================================
export { CreateOrderDto, CreateOrderProductDto } from './create-order.dto';
export { UpdateOrderDto } from './update-order.dto';

// ========================================
// OUTPUT DTOs (Response)
// ========================================
export {
  OrderResponseDto,
  OrderProductResponseDto,
} from './order-response.dto';
export { OrderBasicDto } from './order-basic.dto';

// ========================================
// QUERY DTOs (Filtering/Pagination)
// ========================================
export { ListOrdersQueryDto } from './list-orders-query.dto';
