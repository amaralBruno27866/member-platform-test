/**
 * Product Orchestrator Constants
 * Configuration for product creation workflow
 */

/**
 * Session TTL: 2 hours (simpler workflow than membership)
 * Admin should complete product creation quickly
 */
export const PRODUCT_SESSION_TTL_SECONDS = 2 * 60 * 60; // 2 hours

/**
 * Redis key prefix for product orchestrator
 */
export const PRODUCT_ORCHESTRATOR_PREFIX = 'product-orchestrator';

/**
 * Maximum retry attempts for Dataverse operations
 */
export const MAX_COMMIT_RETRIES = 3;

/**
 * Delay between retries (milliseconds)
 */
export const RETRY_DELAY_MS = 1000;

/**
 * Validation rules
 */
export const PRODUCT_ORCHESTRATOR_RULES = {
  /** Product code format: Uppercase letters, numbers, hyphens, underscores */
  PRODUCT_CODE_PATTERN: /^[A-Z0-9_-]+$/,

  /** Product code prefix (informational only - not enforced) */
  PRODUCT_CODE_PREFIX: 'osot-prd-',

  /** Minimum price value */
  MIN_PRICE: 0,

  /** Maximum price value (reasonable limit) */
  MAX_PRICE: 999999.99,

  /** Required product fields */
  REQUIRED_PRODUCT_FIELDS: [
    'osot_product_code',
    'osot_product_name',
    'osot_product_description',
    'osot_product_category',
    'osot_product_status',
    'osot_product_gl_code', // Fixed: was 'osot_gl_code'
  ],

  /** At least one price field required (16 membership category prices) */
  REQUIRED_PRICE_FIELDS: [
    'osot_general_price',
    'osot_otstu_price', // Fixed: no underline between ot and stu
    'osot_otng_price',
    'osot_otpr_price',
    'osot_otnp_price',
    'osot_otret_price',
    'osot_otlife_price',
    'osot_otastu_price',
    'osot_otang_price',
    'osot_otanp_price',
    'osot_otaret_price',
    'osot_otapr_price',
    'osot_otalife_price',
    'osot_assoc_price',
    'osot_affprim_price',
    'osot_affprem_price',
  ],
} as const;

/**
 * Error messages
 */
export const PRODUCT_ORCHESTRATOR_ERRORS = {
  SESSION_NOT_FOUND: 'Product orchestrator session not found',
  SESSION_EXPIRED: 'Product orchestrator session has expired',
  INVALID_STATE_TRANSITION: 'Invalid state transition for product orchestrator',
  PRODUCT_ALREADY_EXISTS: 'Product code already exists in Dataverse',
  MISSING_PRODUCT_DATA: 'Product data not provided',
  MISSING_REQUIRED_FIELDS: 'Missing required product fields',
  INVALID_PRODUCT_CODE: 'Invalid product code format',
  NO_PRICE_SPECIFIED: 'At least one price field must be specified',
  COMMIT_FAILED: 'Failed to commit product and target to Dataverse',
  ROLLBACK_FAILED: 'Failed to rollback product creation',
  PERMISSION_DENIED: 'Only Admin users can create products',
} as const;

/**
 * Event names for product orchestrator
 */
export const PRODUCT_ORCHESTRATOR_EVENTS = {
  SESSION_CREATED: 'product-orchestrator.session.created',
  PRODUCT_ADDED: 'product-orchestrator.product.added',
  TARGET_CONFIGURED: 'product-orchestrator.target.configured',
  COMMIT_STARTED: 'product-orchestrator.commit.started',
  COMMIT_SUCCESS: 'product-orchestrator.commit.success',
  COMMIT_FAILED: 'product-orchestrator.commit.failed',
  SESSION_EXPIRED: 'product-orchestrator.session.expired',
} as const;
