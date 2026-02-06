/**
 * Product Business Rules Constants
 *
 * Business logic rules and constraints for Product operations:
 * - Status transitions
 * - Access control rules
 * - Pricing logic
 * - Inventory management
 *
 * These rules define the business behavior of the Product entity
 */

import { ProductStatus } from '../enums/product-status.enum';
import { ProductCategory } from '../enums/product-category.enum';

/**
 * Valid product status transitions
 * Defines which status changes are allowed
 *
 * BUSINESS RULES:
 * - DRAFT → AVAILABLE/UNAVAILABLE: Allowed (publish draft)
 * - AVAILABLE ↔ UNAVAILABLE: Allowed (toggle availability)
 * - AVAILABLE/UNAVAILABLE → OUT_OF_STOCK: Allowed (inventory depleted)
 * - Any → DISCONTINUED: Allowed (retire product)
 * - DISCONTINUED → Any: NOT allowed (final state)
 * - OUT_OF_STOCK → AVAILABLE: Allowed (restocked)
 */
export const VALID_STATUS_TRANSITIONS: Record<ProductStatus, ProductStatus[]> =
  {
    /**
     * From UNAVAILABLE status:
     * Can make available, discontinue, or mark out of stock
     */
    [ProductStatus.UNAVAILABLE]: [
      ProductStatus.AVAILABLE,
      ProductStatus.DISCONTINUED,
      ProductStatus.OUT_OF_STOCK,
    ],

    /**
     * From AVAILABLE status:
     * Can make unavailable, discontinue, or mark out of stock
     */
    [ProductStatus.AVAILABLE]: [
      ProductStatus.UNAVAILABLE,
      ProductStatus.DISCONTINUED,
      ProductStatus.OUT_OF_STOCK,
    ],

    /**
     * From DISCONTINUED status:
     * CANNOT transition (final state)
     */
    [ProductStatus.DISCONTINUED]: [],

    /**
     * From DRAFT status:
     * Can publish to available/unavailable or discontinue
     */
    [ProductStatus.DRAFT]: [
      ProductStatus.AVAILABLE,
      ProductStatus.UNAVAILABLE,
      ProductStatus.DISCONTINUED,
    ],

    /**
     * From OUT_OF_STOCK status:
     * Can restock (available), discontinue, or mark unavailable
     */
    [ProductStatus.OUT_OF_STOCK]: [
      ProductStatus.AVAILABLE,
      ProductStatus.UNAVAILABLE,
      ProductStatus.DISCONTINUED,
    ],
  };

/**
 * Status transition error messages
 */
export const STATUS_TRANSITION_ERRORS = {
  INVALID_TRANSITION: 'Invalid status transition',
  DISCONTINUED_FINAL:
    'Product is DISCONTINUED and cannot be changed to AVAILABLE',
  SAME_STATUS: 'Product already has this status',
} as const;

/**
 * Product availability rules
 * Defines requirements for a product to be marked as AVAILABLE
 */
export const AVAILABILITY_RULES = {
  /**
   * At least one price must be set
   * (general price OR any category-specific price)
   */
  REQUIRES_PRICE: true,

  /**
   * Inventory can be 0 (unlimited/not tracked)
   * But if inventory tracking is enabled and inventory = 0, warning should be shown
   */
  ALLOWS_ZERO_INVENTORY: true,

  /**
   * All required fields must be filled
   */
  REQUIRES_COMPLETE_DATA: true,
} as const;

/**
 * Pricing strategy rules
 */
export const PRICING_RULES = {
  /**
   * Fallback pricing hierarchy
   * When a category-specific price is not set, use:
   * 1. Category-specific price (if exists)
   * 2. General price (fallback)
   * 3. Error (no price available)
   */
  FALLBACK_TO_GENERAL: true,

  /**
   * Allow $0 prices (free products)
   */
  ALLOW_FREE_PRODUCTS: true,

  /**
   * Require at least one price for AVAILABLE products
   */
  AVAILABLE_REQUIRES_PRICE: true,

  /**
   * Price update behavior
   * When updating prices, allow partial updates (update only specific categories)
   */
  ALLOW_PARTIAL_PRICE_UPDATE: true,
} as const;

/**
 * Inventory management rules
 */
export const INVENTORY_RULES = {
  /**
   * Track inventory by default
   * If false, inventory field is optional/ignored
   */
  TRACK_INVENTORY: true,

  /**
   * Low stock threshold for warnings
   */
  LOW_STOCK_THRESHOLD: 10,

  /**
   * Allow negative inventory (backorders)
   * If false, inventory must always be >= 0
   */
  ALLOW_NEGATIVE_INVENTORY: false,

  /**
   * Auto-discontinue when out of stock
   * If true, product status changes to DISCONTINUED when inventory reaches 0
   */
  AUTO_DISCONTINUE_OUT_OF_STOCK: false,
} as const;

/**
 * Product code uniqueness rules
 */
export const PRODUCT_CODE_UNIQUENESS_RULES = {
  /**
   * Product codes must be unique (case-insensitive)
   */
  ENFORCE_UNIQUENESS: true,

  /**
   * Case-insensitive comparison
   * "MEMBERSHIP-2025" == "membership-2025"
   */
  CASE_INSENSITIVE: true,

  /**
   * Auto-generate code if not provided
   * If false, code must be provided on create
   */
  AUTO_GENERATE: false,
} as const;

/**
 * Access control rules
 */
export const ACCESS_CONTROL_RULES = {
  /**
   * Default access modifier for new products
   * PUBLIC (0) - visible to everyone
   */
  DEFAULT_ACCESS_MODIFIER: 0, // PUBLIC

  /**
   * Default privilege for new products
   * OWNER (0) - managed by owner app
   */
  DEFAULT_PRIVILEGE: 0, // OWNER

  /**
   * Public products (Access Modifier = PUBLIC) rules:
   * - Must be AVAILABLE to be visible
   * - Visible to everyone (no authentication required)
   */
  PUBLIC_REQUIRES_AVAILABLE: true,

  /**
   * Protected products (Access Modifier = PROTECTED) rules:
   * - Requires user to be logged in (OWNER privilege minimum)
   * - May require active membership (hasMembership=true)
   */
  PROTECTED_REQUIRES_LOGIN: true,

  /**
   * Private products (Access Modifier = PRIVATE) rules:
   * - Only Admin/Main can view
   * - Used for internal tools, testing
   */
  PRIVATE_ADMIN_ONLY: true,
} as const;

/**
 * Active membership rules
 * Controls access to products restricted to active members only
 */
export const ACTIVE_MEMBERSHIP_RULES = {
  /**
   * Enforce active membership check
   * When product has osot_active_membership_only = true,
   * validate user's osot_active_member field
   */
  ENFORCE_ACTIVE_MEMBERSHIP_CHECK: true,

  /**
   * Field to check in Account entity
   */
  ACCOUNT_FIELD: 'osot_active_member',

  /**
   * Field to check in Affiliate entity
   */
  AFFILIATE_FIELD: 'osot_active_member',

  /**
   * Error message when non-active member tries to purchase
   */
  ERROR_MESSAGE: 'Produto exclusivo para membros ativos',
} as const;

/**
 * Insurance Type validation rules
 * Controls when Insurance Type is required
 */
export const INSURANCE_TYPE_RULES = {
  /**
   * Insurance Type is REQUIRED when ProductCategory = INSURANCE (1)
   * Insurance Type is OPTIONAL for all other categories
   */
  REQUIRED_CATEGORIES: [ProductCategory.INSURANCE],

  /**
   * Error message when Insurance Type is missing for Insurance category
   */
  MISSING_ERROR: 'Insurance Type is required for Insurance products',
} as const;

/**
 * Insurance Limit validation rules
 * Controls when Insurance Limit is required
 */
export const INSURANCE_LIMIT_RULES = {
  /**
   * Insurance Limit is REQUIRED when ProductCategory = INSURANCE (1)
   * Insurance Limit is OPTIONAL for all other categories
   */
  REQUIRED_CATEGORIES: [ProductCategory.INSURANCE],

  /**
   * Error message when Insurance Limit is missing for Insurance category
   */
  MISSING_ERROR: 'Insurance Limit is required for Insurance products',

  /**
   * Minimum insurance limit value (in currency)
   * Business rule: Must be zero or positive value
   */
  MIN_VALUE: 0.0,

  /**
   * Maximum insurance limit value
   * Business rule: Reasonable upper limit for insurance products
   */
  MAX_VALUE: 999999999.99,

  /**
   * Typical/common insurance limits (for UI suggestions or templates)
   * Used by frontend to provide quick-select options
   */
  COMMON_LIMITS: [50000, 100000, 250000, 500000, 1000000, 2000000, 5000000],

  /**
   * Error message when Insurance Limit is below minimum
   */
  BELOW_MINIMUM_ERROR: 'Insurance Limit cannot be negative',

  /**
   * Error message when Insurance Limit exceeds maximum
   */
  EXCEEDS_MAXIMUM_ERROR: 'Insurance Limit cannot exceed $999,999,999.99',

  /**
   * Warning message when Insurance Limit appears unusually high
   */
  UNUSUALLY_HIGH_WARNING:
    'Insurance Limit exceeds typical values. Please verify the amount is correct.',
} as const;

/**
 * Data validation rules for business logic
 */
export const BUSINESS_VALIDATION_RULES = {
  /**
   * Validate price-category alignment
   * If product category is OT-STU, ensure osot_OTSTU_Price is set
   */
  VALIDATE_CATEGORY_PRICE_ALIGNMENT: false, // Optional - not enforced

  /**
   * Validate GL Code based on product category
   * Different categories may require different GL codes
   */
  VALIDATE_GL_CODE_BY_CATEGORY: false, // Optional - not enforced

  /**
   * Require product picture for AVAILABLE products
   */
  REQUIRE_PICTURE_FOR_AVAILABLE: false, // Optional

  /**
   * Maximum number of products per category
   * 0 = unlimited
   */
  MAX_PRODUCTS_PER_CATEGORY: 0, // Unlimited
} as const;

/**
 * Product creation defaults
 * Values used when not provided during creation
 */
export const PRODUCT_DEFAULTS = {
  /**
   * Default product status
   */
  STATUS: ProductStatus.AVAILABLE,

  /**
   * Default access modifier
   */
  ACCESS_MODIFIER: 0, // PUBLIC

  /**
   * Default privilege
   */
  PRIVILEGE: 0, // OWNER

  /**
   * Default tax rate (percentage)
   */
  TAX_RATE: 13.0, // 13% HST

  /**
   * Default inventory (0 = unlimited/not tracked)
   */
  INVENTORY: 0,

  /**
   * Default shipping cost
   */
  SHIPPING: 0,
} as const;

/**
 * Error messages for business rule violations
 */
export const BUSINESS_RULE_ERRORS = {
  NO_PRICE_SET: 'At least one price must be set for AVAILABLE products',
  INVALID_STATUS_TRANSITION: 'Invalid product status transition',
  DISCONTINUED_CANNOT_UPDATE:
    'Cannot update DISCONTINUED products (final state)',
  DUPLICATE_PRODUCT_CODE: 'Product code already exists (case-insensitive)',
  NEGATIVE_INVENTORY: 'Inventory cannot be negative',
  INVALID_PRICE: 'Price must be a positive number',
  INVALID_TAX: 'Tax rate must be between 0 and 100',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
  INVALID_GL_CODE_FOR_CATEGORY: 'GL Code does not match product category',
  NOT_ACTIVE_MEMBER: 'Produto exclusivo para membros ativos',
  INVALID_PRODUCT_YEAR: 'Product year must be a 4-digit year in YYYY format',
} as const;

/**
 * Warning messages for business logic
 */
export const BUSINESS_RULE_WARNINGS = {
  LOW_STOCK: 'Product inventory is running low',
  NO_INVENTORY_TRACKING: 'Inventory is not being tracked for this product',
  NO_CATEGORY_PRICE: 'Product has no specific price for this category',
  USING_GENERAL_PRICE: 'Using general price as fallback',
  PRODUCT_OUT_OF_STOCK: 'Product is out of stock but still AVAILABLE',
  NO_PICTURE: 'Product has no picture URL set',
} as const;
