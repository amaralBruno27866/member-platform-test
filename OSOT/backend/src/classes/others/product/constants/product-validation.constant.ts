/**
 * Product Validation Constants
 *
 * Business rules and validation constraints for Product entity:
 * - Field length limits
 * - Numeric ranges
 * - Required field rules
 * - Format patterns
 *
 * Based on Dataverse schema in Product.csv
 */

/**
 * Field length constraints
 */
export const PRODUCT_FIELD_LENGTH = {
  /**
   * Product Code max length
   * Dataverse: 255 characters (updated from 25)
   */
  PRODUCT_CODE_MAX: 255,

  /**
   * Product Code min length
   * Business rule: Minimum 3 characters for readability
   */
  PRODUCT_CODE_MIN: 3,

  /**
   * Product Name max length
   * Dataverse: Single line of text (default 100)
   */
  PRODUCT_NAME_MAX: 100,

  /**
   * Product Name min length
   * Business rule: Minimum 3 characters
   */
  PRODUCT_NAME_MIN: 3,

  /**
   * Product Description max length
   * Dataverse: Text area - 4000 characters
   */
  PRODUCT_DESCRIPTION_MAX: 4000,

  /**
   * Product Description min length
   * Business rule: Minimum 10 characters for meaningful description
   */
  PRODUCT_DESCRIPTION_MIN: 10,

  /**
   * Product Picture URL max length
   * Dataverse: Single line of text (850 characters - updated from 100)
   */
  PRODUCT_PICTURE_MAX: 850,

  /**
   * Post Purchase Info max length
   * Dataverse: Text Area (4000 characters)
   */
  POST_PURCHASE_INFO_MAX: 4000,

  /**
   * Product Year length (fixed)
   * Dataverse: Single line of text (4 characters - YYYY format)
   */
  PRODUCT_YEAR_LENGTH: 4,

  /**
   * Product Additional Info max length
   * Dataverse: Text Area (4000 characters)
   */
  PRODUCT_ADDITIONAL_INFO_MAX: 4000,
} as const;

/**
 * Numeric field constraints
 */
export const PRODUCT_NUMERIC_CONSTRAINTS = {
  /**
   * Price constraints
   * Dataverse Currency: -922,337,203,685,477 to 922,337,203,685,477
   * Business rule: Prices must be >= 0
   */
  PRICE_MIN: 0,
  PRICE_MAX: 999999999.99,

  /**
   * Insurance Limit constraints (for insurance products)
   * Dataverse Currency: -922,337,203,685,477 to 922,337,203,685,477
   * Business rule: Insurance limit must be >= 0 (zero or positive value)
   */
  INSURANCE_LIMIT_MIN: 0.0,
  INSURANCE_LIMIT_MAX: 999999999.99,

  /**
   * Inventory constraints
   * Dataverse Whole Number: 0 to 2,147,483,647
   */
  INVENTORY_MIN: 0,
  INVENTORY_MAX: 2147483647,

  /**
   * Shipping constraints
   * Dataverse Currency: Same as price
   */
  SHIPPING_MIN: 0,
  SHIPPING_MAX: 999999.99,

  /**
   * Tax percentage constraints
   * Dataverse Decimal: -100,000,000,000 to 100,000,000,000 (2 decimals)
   * Business rule: Tax percentage between 0% and 100%
   */
  TAX_MIN: 0,
  TAX_MAX: 100,
  TAX_DECIMALS: 2,
} as const;

/**
 * Product Code validation pattern
 * Alphanumeric with hyphens and underscores
 * Examples: "MEMBERSHIP-2025", "TSHIRT_BLUE_L", "CONF2025"
 */
export const PRODUCT_CODE_PATTERN = /^[A-Z0-9_-]+$/;

/**
 * Product Code format rules
 */
export const PRODUCT_CODE_RULES = {
  /**
   * Allowed characters: A-Z, 0-9, hyphen, underscore
   */
  PATTERN: PRODUCT_CODE_PATTERN,

  /**
   * Error message for invalid format
   */
  ERROR_MESSAGE:
    'Product code must contain only uppercase letters, numbers, hyphens, and underscores',

  /**
   * Examples of valid codes
   */
  EXAMPLES: ['MEMBERSHIP-2025', 'TSHIRT-BLUE-L', 'CONF_2025', 'COURSE-OT-101'],
} as const;

/**
 * URL validation pattern for product pictures
 * Accepts http, https protocols
 */
export const PRODUCT_PICTURE_PATTERN =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

/**
 * Product Year validation pattern
 * Format: YYYY (4-digit year)
 * Examples: "2025", "2026"
 */
export const PRODUCT_YEAR_PATTERN = /^\d{4}$/;

/**
 * Product Year format rules
 */
export const PRODUCT_YEAR_RULES = {
  /**
   * Pattern: 4-digit year
   */
  PATTERN: PRODUCT_YEAR_PATTERN,

  /**
   * Error message for invalid format
   */
  ERROR_MESSAGE: 'Product year must be a 4-digit year in YYYY format',

  /**
   * Examples of valid years
   */
  EXAMPLES: ['2025', '2026', '2027'],
} as const;

/**
 * Required fields for product creation
 * All these fields must be provided when creating a product
 */
export const REQUIRED_FIELDS_CREATE = [
  'productName',
  'productCode',
  'productDescription',
  'productCategory',
  'productStatus',
  'productGlCode',
  'taxes',
  'productYear',
] as const;

/**
 * Required fields for product update
 * Only fields being updated need to be provided
 * But if provided, they must pass validation
 */
export const REQUIRED_FIELDS_UPDATE = [] as const; // All fields optional on update

/**
 * Fields that cannot be updated after creation
 * These fields are set once and cannot be changed
 */
export const IMMUTABLE_FIELDS = [
  'osot_table_productid', // Primary key
  'osot_productid', // Business ID (autonumber)
] as const;

/**
 * Price field validation
 * At least one price must be set for a product to be AVAILABLE
 */
export const PRICE_VALIDATION_RULES = {
  /**
   * Minimum number of prices that must be set
   * Business rule: At least general price OR one category price
   */
  MIN_PRICES_REQUIRED: 1,

  /**
   * Error message when no prices are set
   */
  NO_PRICE_ERROR:
    'At least one price (general or category-specific) must be set',

  /**
   * Warning when product is AVAILABLE but has no prices
   */
  AVAILABLE_NO_PRICE_WARNING:
    'Product marked as AVAILABLE but has no prices configured',
} as const;

/**
 * Inventory validation rules
 */
export const INVENTORY_VALIDATION_RULES = {
  /**
   * Low stock threshold
   * Warning when inventory falls below this value
   */
  LOW_STOCK_THRESHOLD: 10,

  /**
   * Out of stock value
   */
  OUT_OF_STOCK: 0,

  /**
   * Warning message for low stock
   */
  LOW_STOCK_WARNING: 'Product inventory is running low',

  /**
   * Error message for out of stock
   */
  OUT_OF_STOCK_ERROR: 'Product is out of stock',
} as const;

/**
 * Product status validation rules
 */
export const STATUS_VALIDATION_RULES = {
  /**
   * Products marked as AVAILABLE must have:
   * - At least one price set
   * - Inventory > 0 (if inventory tracking is enabled)
   */
  AVAILABLE_REQUIREMENTS: {
    MIN_PRICE: 1,
    MIN_INVENTORY: 0, // 0 means unlimited/not tracked
  },

  /**
   * DISCONTINUED is a final state
   * Once discontinued, product cannot be made available again
   */
  DISCONTINUED_IS_FINAL: true,
} as const;

/**
 * Tax validation rules
 */
export const TAX_VALIDATION_RULES = {
  /**
   * Default tax rate (percentage)
   * Used when no specific tax is provided
   */
  DEFAULT_TAX_RATE: 13.0, // 13% HST in Ontario

  /**
   * Tax rate must be between 0 and 100
   */
  MIN_TAX_RATE: 0,
  MAX_TAX_RATE: 100,

  /**
   * Tax precision (decimal places)
   */
  TAX_DECIMALS: 2,
} as const;
