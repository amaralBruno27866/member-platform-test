/**
 * Product Orchestrator Session States
 *
 * State machine for product creation workflow:
 * initiated → product-added → target-configured → committed → completed
 */
export enum ProductState {
  /** Session created, waiting for product data */
  INITIATED = 'initiated',

  /** Product data received and validated */
  PRODUCT_ADDED = 'product-added',

  /** Audience target configuration received and validated */
  TARGET_CONFIGURED = 'target-configured',

  /** Data committed to Dataverse (product + target created) */
  COMMITTED = 'committed',

  /** Session completed successfully, ready for cleanup */
  COMPLETED = 'completed',

  /** Session failed, rollback performed */
  FAILED = 'failed',

  /** Session expired (TTL reached) */
  EXPIRED = 'expired',
}

/**
 * Valid state transitions for product orchestrator
 */
export const PRODUCT_STATE_TRANSITIONS: Record<ProductState, ProductState[]> = {
  [ProductState.INITIATED]: [
    ProductState.PRODUCT_ADDED,
    ProductState.FAILED,
    ProductState.EXPIRED,
  ],
  [ProductState.PRODUCT_ADDED]: [
    ProductState.TARGET_CONFIGURED,
    ProductState.COMMITTED, // Allow commit with default target (all null)
    ProductState.FAILED,
    ProductState.EXPIRED,
  ],
  [ProductState.TARGET_CONFIGURED]: [
    ProductState.COMMITTED,
    ProductState.FAILED,
    ProductState.EXPIRED,
  ],
  [ProductState.COMMITTED]: [ProductState.COMPLETED, ProductState.FAILED],
  [ProductState.COMPLETED]: [], // Terminal state
  [ProductState.FAILED]: [], // Terminal state
  [ProductState.EXPIRED]: [], // Terminal state
};

/**
 * Check if state transition is valid
 */
export function isValidTransition(
  from: ProductState,
  to: ProductState,
): boolean {
  return PRODUCT_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}
