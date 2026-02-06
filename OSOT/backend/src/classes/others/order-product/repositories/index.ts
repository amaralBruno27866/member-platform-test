/**
 * Order Product Repositories - Central Export
 *
 * Exports repository implementations for Order Product entity:
 * - Dataverse repository (primary implementation)
 */

export { DataverseOrderProductRepository } from './dataverse-order-product.repository';
export type { OrderProductRepository } from '../interfaces';
