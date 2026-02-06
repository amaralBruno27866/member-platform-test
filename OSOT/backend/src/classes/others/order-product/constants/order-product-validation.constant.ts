/**
 * Order Product Validation Constants
 *
 * Validation rules, constraints, and limits for Order Product fields.
 *
 * Used by:
 * - DTOs (class-validator decorators)
 * - Business rules service (complex validations)
 * - Mappers (data normalization)
 */

// ========================================
// STRING FIELD LENGTHS
// ========================================

/**
 * Maximum lengths for text fields
 */
export const ORDER_PRODUCT_STRING_LENGTHS = {
  PRODUCT_ID: 255, // osot_product_id (e.g., 'osot-prod-0000048')
  PRODUCT_NAME: 255, // osot_product_name (snapshot)
  INSURANCE_TYPE: 100, // osot_insurance_type (text snapshot of display value)
  PRODUCT_ADDITIONAL_INFO: 4000, // osot_product_additional_info (notes)
} as const;

// ========================================
// NUMERIC RANGES
// ========================================

/**
 * Constraints for numeric fields
 */
export const ORDER_PRODUCT_NUMERIC_RANGES = {
  // Quantity
  QUANTITY_MIN: 1, // At least 1 item
  QUANTITY_MAX: 2147483647, // Dataverse Whole Number max (2^31 - 1)

  // Selected Price (CAD)
  SELECTED_PRICE_MIN: 0.0, // Free products allowed (e.g., trials)
  SELECTED_PRICE_MAX: 922337203685477.0, // Dataverse Currency max

  // Insurance Limit (CAD - snapshot of product insurance limit)
  INSURANCE_LIMIT_MIN: 0.0, // Minimum insurance coverage
  INSURANCE_LIMIT_MAX: 922337203685477.0, // Dataverse Currency max

  // Product Tax Rate (%)
  PRODUCT_TAX_MIN: 0, // Tax-exempt products (0%)
  PRODUCT_TAX_MAX: 100, // Maximum 100% (full price as tax - theoretical)

  // Tax Amount (CAD)
  TAX_AMOUNT_MIN: 0.0, // No tax for 0% rate
  TAX_AMOUNT_MAX: 922337203685477.0, // Dataverse Currency max

  // Item Subtotal (CAD)
  ITEM_SUBTOTAL_MIN: 0.0, // Free items
  ITEM_SUBTOTAL_MAX: 922337203685477.0, // Dataverse Currency max

  // Item Total (CAD)
  ITEM_TOTAL_MIN: 0.0, // Free items
  ITEM_TOTAL_MAX: 922337203685477.0, // Dataverse Currency max
} as const;

// ========================================
// CURRENCY PRECISION
// ========================================

/**
 * Decimal precision for currency fields (CAD)
 */
export const ORDER_PRODUCT_CURRENCY_PRECISION = {
  DECIMAL_PLACES: 2, // CAD uses 2 decimals ($79.99)
  ROUNDING_MODE: 'HALF_UP', // Standard rounding (0.5 → 1)
} as const;

// ========================================
// CALCULATION TOLERANCE
// ========================================

/**
 * Tolerance for floating-point calculation validation
 * (e.g., validating itemTotal = itemSubtotal + taxAmount)
 */
export const ORDER_PRODUCT_CALCULATION_TOLERANCE = 0.01; // ±1 cent

// ========================================
// VALIDATION MESSAGES
// ========================================

/**
 * Standard error messages for validation failures
 */
export const ORDER_PRODUCT_VALIDATION_MESSAGES = {
  // Required fields
  ORDER_REQUIRED: 'Order lookup is required (parent order)',
  PRODUCT_ID_REQUIRED: 'Product ID is required',
  PRODUCT_NAME_REQUIRED: 'Product name is required',
  QUANTITY_REQUIRED: 'Quantity is required',
  SELECTED_PRICE_REQUIRED: 'Selected price is required',
  PRODUCT_TAX_REQUIRED: 'Product tax rate is required',
  TAX_AMOUNT_REQUIRED: 'Tax amount is required',
  ITEM_SUBTOTAL_REQUIRED: 'Item subtotal is required',
  ITEM_TOTAL_REQUIRED: 'Item total is required',

  // String lengths
  PRODUCT_ID_TOO_LONG: `Product ID must not exceed ${ORDER_PRODUCT_STRING_LENGTHS.PRODUCT_ID} characters`,
  PRODUCT_NAME_TOO_LONG: `Product name must not exceed ${ORDER_PRODUCT_STRING_LENGTHS.PRODUCT_NAME} characters`,
  INSURANCE_TYPE_TOO_LONG: `Insurance type must not exceed ${ORDER_PRODUCT_STRING_LENGTHS.INSURANCE_TYPE} characters`,
  INSURANCE_LIMIT_MIN: `Insurance limit must be at least ${ORDER_PRODUCT_NUMERIC_RANGES.INSURANCE_LIMIT_MIN}`,
  INSURANCE_LIMIT_MAX: `Insurance limit must not exceed ${ORDER_PRODUCT_NUMERIC_RANGES.INSURANCE_LIMIT_MAX}`,
  PRODUCT_ADDITIONAL_INFO_TOO_LONG: `Product additional info must not exceed ${ORDER_PRODUCT_STRING_LENGTHS.PRODUCT_ADDITIONAL_INFO} characters`,

  // Numeric ranges
  QUANTITY_MIN: `Quantity must be at least ${ORDER_PRODUCT_NUMERIC_RANGES.QUANTITY_MIN}`,
  QUANTITY_MAX: `Quantity must not exceed ${ORDER_PRODUCT_NUMERIC_RANGES.QUANTITY_MAX}`,
  SELECTED_PRICE_MIN: `Selected price must be at least ${ORDER_PRODUCT_NUMERIC_RANGES.SELECTED_PRICE_MIN}`,
  SELECTED_PRICE_MAX: `Selected price must not exceed ${ORDER_PRODUCT_NUMERIC_RANGES.SELECTED_PRICE_MAX}`,
  PRODUCT_TAX_MIN: `Tax rate must be at least ${ORDER_PRODUCT_NUMERIC_RANGES.PRODUCT_TAX_MIN}%`,
  PRODUCT_TAX_MAX: `Tax rate must not exceed ${ORDER_PRODUCT_NUMERIC_RANGES.PRODUCT_TAX_MAX}%`,
  TAX_AMOUNT_MIN: `Tax amount must be at least ${ORDER_PRODUCT_NUMERIC_RANGES.TAX_AMOUNT_MIN}`,
  TAX_AMOUNT_MAX: `Tax amount must not exceed ${ORDER_PRODUCT_NUMERIC_RANGES.TAX_AMOUNT_MAX}`,
  ITEM_SUBTOTAL_MIN: `Item subtotal must be at least ${ORDER_PRODUCT_NUMERIC_RANGES.ITEM_SUBTOTAL_MIN}`,
  ITEM_SUBTOTAL_MAX: `Item subtotal must not exceed ${ORDER_PRODUCT_NUMERIC_RANGES.ITEM_SUBTOTAL_MAX}`,
  ITEM_TOTAL_MIN: `Item total must be at least ${ORDER_PRODUCT_NUMERIC_RANGES.ITEM_TOTAL_MIN}`,
  ITEM_TOTAL_MAX: `Item total must not exceed ${ORDER_PRODUCT_NUMERIC_RANGES.ITEM_TOTAL_MAX}`,

  // Business rules
  ITEM_SUBTOTAL_MISMATCH: 'Item subtotal must equal selectedPrice * quantity',
  TAX_AMOUNT_MISMATCH:
    'Tax amount must equal itemSubtotal * (productTaxRate / 100)',
  ITEM_TOTAL_MISMATCH: 'Item total must equal itemSubtotal + taxAmount',
  INVALID_ORDER_GUID: 'Invalid order GUID format',
  INVALID_PRODUCT_ID_FORMAT: 'Product ID must follow format: osot-prod-XXXXXXX',
} as const;

// ========================================
// REGEX PATTERNS
// ========================================

/**
 * Regular expressions for format validation
 */
export const ORDER_PRODUCT_REGEX = {
  /**
   * GUID format (UUID v4)
   * Example: abc-123-def-456-ghi
   */
  GUID: /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,

  /**
   * Product ID format (autonumber)
   * Example: osot-prod-0000048
   */
  PRODUCT_ID: /^osot-prod-\d{7}$/,

  /**
   * Order Product ID format (autonumber)
   * Example: osot_ord_prod-0000001
   */
  ORDER_PRODUCT_ID: /^osot_ord_prod-\d{7}$/,
} as const;

// ========================================
// SNAPSHOT IMMUTABILITY
// ========================================

/**
 * Fields that should NEVER be updated after creation (immutable snapshot)
 */
export const ORDER_PRODUCT_IMMUTABLE_FIELDS = [
  'osot_order_value', // Parent order cannot change
  'osot_product_id', // Product reference cannot change
  'osot_product_name', // Snapshot name frozen at purchase
  'osot_insurance_type', // Snapshot insurance type frozen at purchase
  'osot_insurance_limit', // Snapshot insurance limit frozen at purchase
  'osot_product_additional_info', // Snapshot additional info frozen at purchase
  'osot_selectedprice', // Price frozen at purchase
  'osot_producttax', // Tax rate frozen at purchase
  'osot_quantity', // Quantity frozen at purchase (no edits after creation)
  'osot_taxamount', // Calculated value frozen
  'osot_itemsubtotal', // Calculated value frozen
  'osot_itemtotal', // Calculated value frozen
] as const;

/**
 * Warning message for immutable fields
 */
export const IMMUTABLE_FIELD_WARNING =
  'Order Product is an immutable snapshot. This field cannot be updated after creation for audit/compliance reasons.';
