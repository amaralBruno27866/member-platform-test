/**
 * Order Product Business Rules Constants
 *
 * Business logic constants for Order Product entity operations.
 *
 * Architecture Notes:
 * - Order Product is an IMMUTABLE SNAPSHOT (created once, rarely updated)
 * - Updates should only happen for exceptional corrections (audit logged)
 * - Owner role can ONLY READ (prevents fraud/tampering)
 */

// ========================================
// PERMISSION LEVELS
// ========================================

/**
 * Role-based CRUD permissions for Order Product
 */
export const ORDER_PRODUCT_PERMISSIONS = {
  MAIN: {
    CREATE: true, // Backend orchestration creates snapshots
    READ: true,
    UPDATE: true, // Administrative corrections only
    DELETE: true, // Soft/hard delete for testing
  },
  ADMIN: {
    CREATE: true, // Exceptional cases (manual orders)
    READ: true,
    UPDATE: true, // Corrections (rare, logged)
    DELETE: false, // NO DELETE - audit trail must persist
  },
  OWNER: {
    CREATE: false, // Owner cannot create line items directly (only via Order creation)
    READ: true, // View own order line items
    UPDATE: false, // NO UPDATE - prevents price/tax tampering
    DELETE: false, // NO DELETE - audit/compliance
  },
} as const;

// ========================================
// CALCULATION FORMULAS
// ========================================

/**
 * Business formulas for calculated fields
 * (Used for validation, NOT recalculation - snapshots are immutable)
 */
export const ORDER_PRODUCT_FORMULAS = {
  /**
   * Item Subtotal = Selected Price × Quantity
   * Example: $79.00 × 2 = $158.00
   */
  ITEM_SUBTOTAL: (selectedPrice: number, quantity: number): number => {
    return selectedPrice * quantity;
  },

  /**
   * Tax Amount = Item Subtotal × (Tax Rate ÷ 100)
   * Example: $158.00 × (13 ÷ 100) = $20.54
   */
  TAX_AMOUNT: (itemSubtotal: number, taxRate: number): number => {
    return itemSubtotal * (taxRate / 100);
  },

  /**
   * Item Total = Item Subtotal + Tax Amount
   * Example: $158.00 + $20.54 = $178.54
   */
  ITEM_TOTAL: (itemSubtotal: number, taxAmount: number): number => {
    return itemSubtotal + taxAmount;
  },
} as const;

// ========================================
// SNAPSHOT IMMUTABILITY
// ========================================

/**
 * Reasons why Order Product fields are immutable
 */
export const ORDER_PRODUCT_IMMUTABILITY_REASONS = {
  AUDIT_COMPLIANCE:
    'Required for tax reporting and invoice generation (prove exact charges)',
  FRAUD_PREVENTION:
    'Owner cannot manipulate prices, taxes, or quantities after checkout',
  HISTORICAL_ACCURACY:
    'Snapshots preserve what was sold at what price, even if product changes later',
  DISPUTE_RESOLUTION: 'Show what customer agreed to pay at purchase time',
} as const;

/**
 * Exceptional cases where updates ARE allowed (rare)
 */
export const ORDER_PRODUCT_UPDATE_EXCEPTIONS = [
  'Price correction due to system error (logged)',
  'Tax rate adjustment per regulatory change (logged)',
  'Quantity correction for refunds/cancellations (logged)',
  'Privilege/Access Modifier updates (visibility changes)',
] as const;

// ========================================
// VALIDATION RULES
// ========================================

/**
 * Business validation thresholds
 */
export const ORDER_PRODUCT_BUSINESS_THRESHOLDS = {
  /**
   * Maximum quantity per line item (fraud prevention)
   */
  MAX_SAFE_QUANTITY: 100,

  /**
   * Minimum price (warn if price is 0 for non-free products)
   */
  MIN_PAID_PRICE: 0.01,

  /**
   * Common tax rates in Canada (for validation)
   */
  COMMON_TAX_RATES: [0, 5, 8, 13, 15], // 0% (exempt), 5% (GST), 8% (ON PST), 13% (HST ON), 15% (HST Atlantic)
} as const;

// ========================================
// OPERATION TRACKING
// ========================================

/**
 * Operation ID prefixes for logging/tracking
 */
export const ORDER_PRODUCT_OPERATION_PREFIXES = {
  CREATE: 'create_order_product',
  READ: 'read_order_product',
  UPDATE: 'update_order_product',
  DELETE: 'delete_order_product',
  LIST: 'list_order_products',
  VALIDATE: 'validate_order_product',
} as const;

/**
 * Generate operation ID for tracking
 */
export const generateOrderProductOperationId = (
  operation: keyof typeof ORDER_PRODUCT_OPERATION_PREFIXES,
): string => {
  const prefix = ORDER_PRODUCT_OPERATION_PREFIXES[operation];
  return `${prefix}_${Date.now()}`;
};

// ========================================
// ERROR CONTEXTS
// ========================================

/**
 * Common error contexts for business rule violations
 */
export const ORDER_PRODUCT_ERROR_CONTEXTS = {
  CALCULATION_MISMATCH: 'Calculated field does not match expected formula',
  IMMUTABLE_FIELD_UPDATE: 'Attempted to update immutable snapshot field',
  UNAUTHORIZED_CREATION: 'Owner role cannot create Order Products directly',
  UNAUTHORIZED_UPDATE: 'Owner role cannot update Order Products',
  UNAUTHORIZED_DELETE: 'Role does not have delete permission',
  INVALID_PARENT_ORDER: 'Parent Order does not exist or is inaccessible',
  INVALID_TAX_RATE: 'Tax rate is not a recognized Canadian rate',
  EXCESSIVE_QUANTITY: 'Quantity exceeds maximum safe threshold',
} as const;

// ========================================
// SNAPSHOT FIELD GROUPS
// ========================================

/**
 * Fields that are snapshotted from Product entity
 */
export const ORDER_PRODUCT_SNAPSHOT_FIELDS = [
  'osot_product_id', // Product reference
  'osot_product_name', // Product name at purchase
  'osot_insurance_type', // Insurance type display value at purchase
  'osot_insurance_limit', // Insurance limit at purchase
  'osot_product_additional_info', // Additional info snapshot
  'osot_selectedprice', // Price applied at checkout
  'osot_producttax', // Tax rate % at purchase
] as const;

/**
 * Fields calculated at purchase time (immutable)
 */
export const ORDER_PRODUCT_CALCULATED_FIELDS = [
  'osot_taxamount', // itemSubtotal * (taxRate / 100)
  'osot_itemsubtotal', // selectedPrice * quantity
  'osot_itemtotal', // itemSubtotal + taxAmount
] as const;
