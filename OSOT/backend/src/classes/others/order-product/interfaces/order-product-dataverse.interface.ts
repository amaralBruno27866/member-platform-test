/**
 * Order Product Dataverse Interface
 *
 * Dataverse API representation of Order Product entity (OData format).
 * Matches the exact field names and types returned by Dataverse API.
 *
 * Architecture Notes:
 * - snake_case naming (Dataverse convention)
 * - All fields optional (partial updates supported)
 * - Dates are ISO 8601 strings (not Date objects)
 * - Currency fields are numbers (Dataverse precision: 2 decimals)
 * - _osot_order_value is the lookup GUID (read-only)
 * - osot_Order@odata.bind is used for writes (not in this interface)
 */

/**
 * Order Product entity - Dataverse API representation
 */
export interface OrderProductDataverse {
  // ========================================
  // SYSTEM FIELDS
  // ========================================

  /**
   * Primary key (GUID)
   */
  osot_table_order_productid?: string;

  /**
   * Autonumber ID (human-readable)
   * Read-only
   */
  osot_orderproductid?: string;

  /**
   * Creation timestamp (ISO 8601 string)
   * Example: '2026-01-23T10:30:00Z'
   */
  createdon?: string;

  /**
   * Modification timestamp (ISO 8601 string)
   */
  modifiedon?: string;

  /**
   * Owner ID (GUID)
   */
  ownerid?: string;

  /**
   * State code (0 = Active, 1 = Inactive)
   */
  statecode?: number;

  /**
   * Status code (detailed status)
   */
  statuscode?: number;

  // ========================================
  // RELATIONSHIP FIELDS
  // ========================================

  /**
   * Parent Order GUID (read-only lookup value)
   * Retrieved via $select=_osot_order_value
   * For writes, use osot_Order@odata.bind in payload
   */
  _osot_order_value?: string;

  // ========================================
  // PRODUCT SNAPSHOT FIELDS (Immutable)
  // ========================================

  /**
   * Product ID reference (text field, NOT lookup)
   * Example: 'osot-prod-0000048'
   */
  osot_product_id?: string;

  /**
   * Product name at purchase time
   * Example: '2025 Professional Liability - $ 5,000 millions'
   */
  osot_product_name?: string;

  /**
   * Product category at purchase time (text field)
   * Values: '0'=Membership, '1'=Insurance, '2'=Other Products
   * Immutable snapshot frozen at checkout
   * Used by event listeners to identify insurance items
   * Dataverse type: Single line of text (max 100 chars)
   */
  osot_product_category?: string;

  /**
   * Insurance type display value at purchase time
   * Stored as text snapshot (not a choice/enum in order-product)
   */
  osot_insurance_type?: string;

  /**
   * Insurance limit amount at purchase time (currency)
   * Snapshot of product insurance limit frozen at order creation
   * Range: 0.00 to 922,337,203,685,477.00 (Dataverse Currency max)
   */
  osot_insurance_limit?: number;

  /**
   * Additional info/notes captured from product at purchase time
   */
  osot_product_additional_info?: string;

  // ========================================
  // QUANTITY & PRICING
  // ========================================

  /**
   * Quantity purchased (whole number)
   */
  osot_quantity?: number;

  /**
   * Price applied at checkout (currency)
   * Dataverse stores with 2 decimal precision
   */
  osot_selectedprice?: number;

  /**
   * Tax rate percentage (whole number)
   * Example: 8, 13, 15
   */
  osot_producttax?: number;

  // ========================================
  // CALCULATED AMOUNTS (Currency)
  // ========================================

  /**
   * Calculated tax amount (currency)
   * Formula: itemSubtotal * (productTaxRate / 100)
   */
  osot_taxamount?: number;

  /**
   * Item subtotal (currency) - price before tax
   * Formula: selectedPrice * quantity
   */
  osot_itemsubtotal?: number;

  /**
   * Item total (currency) - final price with tax
   * Formula: itemSubtotal + taxAmount
   */
  osot_itemtotal?: number;

  // ========================================
  // ACCESS CONTROL (Choice Fields)
  // ========================================

  /**
   * Privilege level (Dataverse choice value)
   * Values: 0 (Public), 1 (Internal), 2 (Protected), 3 (Private)
   */
  osot_privilege?: number;

  /**
   * Access modifier (Dataverse choice value)
   * Values: 0 (Owner), 1 (Organization), 2 (Department), 3 (Team), 4 (Custom)
   */
  osot_access_modifiers?: number;

  // ========================================
  // ODATA METADATA (Read-only)
  // ========================================

  /**
   * OData context (API metadata)
   */
  '@odata.context'?: string;

  /**
   * OData etag (concurrency control)
   */
  '@odata.etag'?: string;
}
