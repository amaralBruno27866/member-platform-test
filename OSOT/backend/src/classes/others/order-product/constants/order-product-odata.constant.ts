/**
 * Order Product OData Constants
 *
 * Dataverse entity name, field names, and OData query configurations
 * for the Order Product entity (line items/order snapshots).
 *
 * Architecture Notes:
 * - Order Product is an IMMUTABLE SNAPSHOT of product details at purchase
 * - osot_Product_ID is a string reference (NOT a lookup) to preserve immutability
 * - Only one @odata.bind: osot_Order (required lookup to parent order)
 * - Privilege/Access_Modifiers use same enums as Order entity
 */

// ========================================
// ENTITY NAME
// ========================================

/**
 * Dataverse entity logical name
 */
export const ORDER_PRODUCT_ENTITY = 'osot_table_order_products';

// ========================================
// FIELD NAMES
// ========================================

/**
 * Order Product field names (Dataverse logical names)
 */
export const ORDER_PRODUCT_FIELDS = {
  // ========================================
  // SYSTEM FIELDS
  // ========================================
  TABLE_ORDER_PRODUCT_ID: 'osot_table_order_productid', // GUID (primary key)
  ORDER_PRODUCT_ID: 'osot_orderproductid', // Autonumber (osot_ord_prod-0000001)
  CREATED_ON: 'createdon',
  MODIFIED_ON: 'modifiedon',
  OWNER_ID: 'ownerid',
  STATECODE: 'statecode',
  STATUSCODE: 'statuscode',

  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================
  ORDER: 'osot_Order', // Lookup to osot_table_order (REQUIRED)
  ORDER_VALUE: '_osot_order_value', // Lookup GUID (read-only)

  // ========================================
  // PRODUCT SNAPSHOT FIELDS (Immutable)
  // ========================================
  PRODUCT_ID: 'osot_product_id', // String reference to original product (NOT lookup)
  PRODUCT_NAME: 'osot_product_name', // Snapshot of product name at purchase
  PRODUCT_CATEGORY: 'osot_product_category', // Snapshot of product category at purchase (0=Membership, 1=Insurance, etc.)
  INSURANCE_TYPE: 'osot_insurance_type', // Snapshot of product insurance type (display text)
  INSURANCE_LIMIT: 'osot_insurance_limit', // Snapshot of insurance limit at purchase (currency)
  PRODUCT_ADDITIONAL_INFO: 'osot_product_additional_info', // Snapshot of additional info/notes

  // ========================================
  // QUANTITY & PRICING
  // ========================================
  QUANTITY: 'osot_quantity', // Whole number (1, 2, 3, etc.)
  SELECTED_PRICE: 'osot_selectedprice', // Currency - price applied at checkout
  PRODUCT_TAX: 'osot_producttax', // Whole number - tax rate % (8, 13, etc.)

  // ========================================
  // CALCULATED AMOUNTS
  // ========================================
  TAX_AMOUNT: 'osot_taxamount', // Currency - calculated tax (itemSubtotal * taxRate/100)
  ITEM_SUBTOTAL: 'osot_itemsubtotal', // Currency - selectedPrice * quantity
  ITEM_TOTAL: 'osot_itemtotal', // Currency - itemSubtotal + taxAmount

  // ========================================
  // ACCESS CONTROL
  // ========================================
  PRIVILEGE: 'osot_privilege', // Choice - visibility level (Public, Internal, etc.)
  ACCESS_MODIFIERS: 'osot_access_modifiers', // Choice - access rules (Owner, Organization, etc.)
} as const;

// ========================================
// ODATA QUERIES
// ========================================

/**
 * OData query configurations for Order Product
 */
export const ORDER_PRODUCT_ODATA = {
  /**
   * @odata.bind format for Order lookup (required)
   * Example: /osot_table_orders(abc-123-def)
   */
  ORDER_BIND: 'osot_Order@odata.bind',

  /**
   * Standard SELECT fields (excludes system fields like statecode)
   */
  SELECT_FIELDS: [
    ORDER_PRODUCT_FIELDS.TABLE_ORDER_PRODUCT_ID,
    ORDER_PRODUCT_FIELDS.ORDER_PRODUCT_ID,
    ORDER_PRODUCT_FIELDS.ORDER_VALUE,
    ORDER_PRODUCT_FIELDS.PRODUCT_ID,
    ORDER_PRODUCT_FIELDS.PRODUCT_NAME,
    ORDER_PRODUCT_FIELDS.INSURANCE_TYPE,
    ORDER_PRODUCT_FIELDS.PRODUCT_ADDITIONAL_INFO,
    ORDER_PRODUCT_FIELDS.QUANTITY,
    ORDER_PRODUCT_FIELDS.SELECTED_PRICE,
    ORDER_PRODUCT_FIELDS.PRODUCT_TAX,
    ORDER_PRODUCT_FIELDS.TAX_AMOUNT,
    ORDER_PRODUCT_FIELDS.ITEM_SUBTOTAL,
    ORDER_PRODUCT_FIELDS.ITEM_TOTAL,
    ORDER_PRODUCT_FIELDS.PRIVILEGE,
    ORDER_PRODUCT_FIELDS.ACCESS_MODIFIERS,
    ORDER_PRODUCT_FIELDS.CREATED_ON,
    ORDER_PRODUCT_FIELDS.MODIFIED_ON,
  ].join(','),

  /**
   * Expanded SELECT with Order details
   * Usage: When fetching OrderProduct with parent Order context
   */
  SELECT_WITH_ORDER: [
    ORDER_PRODUCT_FIELDS.TABLE_ORDER_PRODUCT_ID,
    ORDER_PRODUCT_FIELDS.ORDER_PRODUCT_ID,
    ORDER_PRODUCT_FIELDS.PRODUCT_ID,
    ORDER_PRODUCT_FIELDS.PRODUCT_NAME,
    ORDER_PRODUCT_FIELDS.INSURANCE_TYPE,
    ORDER_PRODUCT_FIELDS.PRODUCT_ADDITIONAL_INFO,
    ORDER_PRODUCT_FIELDS.QUANTITY,
    ORDER_PRODUCT_FIELDS.SELECTED_PRICE,
    ORDER_PRODUCT_FIELDS.PRODUCT_TAX,
    ORDER_PRODUCT_FIELDS.TAX_AMOUNT,
    ORDER_PRODUCT_FIELDS.ITEM_SUBTOTAL,
    ORDER_PRODUCT_FIELDS.ITEM_TOTAL,
    ORDER_PRODUCT_FIELDS.PRIVILEGE,
    ORDER_PRODUCT_FIELDS.ACCESS_MODIFIERS,
  ].join(','),

  /**
   * EXPAND clause for Order relationship
   * Usage: $expand=osot_Order($select=osot_order_number,osot_status)
   */
  EXPAND_ORDER: `${ORDER_PRODUCT_FIELDS.ORDER}($select=osot_order_number,osot_status,osot_total)`,

  /**
   * Default ORDER BY (most recent first)
   */
  DEFAULT_ORDER_BY: `${ORDER_PRODUCT_FIELDS.CREATED_ON} desc`,

  /**
   * Common filter: Active records only
   */
  FILTER_ACTIVE: `${ORDER_PRODUCT_FIELDS.STATECODE} eq 0`,

  /**
   * Filter by parent Order GUID
   * Usage: ${ORDER_PRODUCT_ODATA.FILTER_BY_ORDER('abc-123')}
   */
  FILTER_BY_ORDER: (orderGuid: string) =>
    `${ORDER_PRODUCT_FIELDS.ORDER_VALUE} eq '${orderGuid}'`,

  /**
   * Filter by Product ID (string reference)
   * Usage: ${ORDER_PRODUCT_ODATA.FILTER_BY_PRODUCT('osot-prod-0000048')}
   */
  FILTER_BY_PRODUCT: (productId: string) =>
    `${ORDER_PRODUCT_FIELDS.PRODUCT_ID} eq '${productId}'`,
} as const;

// ========================================
// IDENTITY FIELDS
// ========================================

/**
 * Fields used to uniquely identify an Order Product
 */
export const ORDER_PRODUCT_IDENTITY_FIELDS = {
  TABLE_ORDER_PRODUCT_ID: ORDER_PRODUCT_FIELDS.TABLE_ORDER_PRODUCT_ID,
  ORDER_PRODUCT_ID: ORDER_PRODUCT_FIELDS.ORDER_PRODUCT_ID,
} as const;

// ========================================
// REQUIRED FIELDS FOR CREATION
// ========================================

/**
 * Fields required when creating a new Order Product (snapshot)
 */
export const ORDER_PRODUCT_REQUIRED_FIELDS = [
  ORDER_PRODUCT_FIELDS.ORDER, // Parent order (required lookup)
  ORDER_PRODUCT_FIELDS.PRODUCT_ID, // Product reference
  ORDER_PRODUCT_FIELDS.PRODUCT_NAME, // Snapshot name
  ORDER_PRODUCT_FIELDS.QUANTITY, // Quantity purchased
  ORDER_PRODUCT_FIELDS.SELECTED_PRICE, // Price applied
  ORDER_PRODUCT_FIELDS.PRODUCT_TAX, // Tax rate %
  ORDER_PRODUCT_FIELDS.TAX_AMOUNT, // Calculated tax
  ORDER_PRODUCT_FIELDS.ITEM_SUBTOTAL, // Subtotal
  ORDER_PRODUCT_FIELDS.ITEM_TOTAL, // Total
] as const;

// ========================================
// SYSTEM FIELDS (Never Updated by Users)
// ========================================

/**
 * System-managed fields that should never be updated manually
 */
export const ORDER_PRODUCT_SYSTEM_FIELDS = [
  ORDER_PRODUCT_FIELDS.TABLE_ORDER_PRODUCT_ID,
  ORDER_PRODUCT_FIELDS.ORDER_PRODUCT_ID,
  ORDER_PRODUCT_FIELDS.CREATED_ON,
  ORDER_PRODUCT_FIELDS.MODIFIED_ON,
  ORDER_PRODUCT_FIELDS.OWNER_ID,
  ORDER_PRODUCT_FIELDS.STATECODE,
  ORDER_PRODUCT_FIELDS.STATUSCODE,
] as const;
