/**
 * Order OData Constants
 *
 * Centralized configuration for Order entity OData operations:
 * - Field names (Dataverse schema)
 * - Entity metadata
 * - Query select configurations
 *
 * CRITICAL: Field names must match exactly with Dataverse schema
 * Any mismatch will cause OData query failures
 */

/**
 * Order entity metadata for Dataverse API
 */
export const ORDER_ENTITY = {
  /**
   * Logical name used in OData API endpoints
   * Example: /api/data/v9.2/osot_table_orders
   */
  logicalName: 'osot_table_order',

  /**
   * Plural name for collection endpoints
   */
  collectionName: 'osot_table_orders',

  /**
   * Primary key field name (GUID)
   */
  primaryKey: 'osot_table_orderid',
} as const;

/**
 * Order field names exactly as they appear in Dataverse
 * Used for OData $select, $filter, $orderby operations
 *
 * IMPORTANT: These names are case-sensitive and must match Dataverse schema
 */
export const ORDER_ODATA = {
  // ========================================
  // IDENTIFIERS (2 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * System-generated unique identifier
   */
  TABLE_ORDER_ID: 'osot_table_orderid',

  /**
   * Business ID (Autonumber)
   * Format: osot_ord-0000001
   * User-friendly unique identifier for customer communication
   */
  ORDER_NUMBER: 'osot_orderid',

  // ========================================
  // RELATIONSHIPS/LOOKUPS (3 fields)
  // ========================================

  /**
   * Organization lookup (parent)
   * Required for multi-tenant isolation
   */
  ORGANIZATION: 'osot_table_organization',

  /**
   * Organization lookup value field returned by Dataverse
   * Example: _osot_table_organization_value: 'guid'
   */
  ORGANIZATION_LOOKUP_VALUE: '_osot_table_organization_value',

  /**
   * Organization @odata.bind field name
   */
  ORGANIZATION_BIND: 'osot_Table_Organization@odata.bind',

  /**
   * Account lookup (owner of order - person)
   * Optional - required if affiliate is null
   */
  ACCOUNT: 'osot_table_account',

  /**
   * Account lookup value field returned by Dataverse
   */
  ACCOUNT_LOOKUP_VALUE: '_osot_table_account_value',

  /**
   * Account @odata.bind field name
   */
  ACCOUNT_BIND: 'osot_Table_Account@odata.bind',

  /**
   * Account Affiliate lookup (company/organization)
   * Optional - required if account is null
   */
  AFFILIATE: 'osot_table_account_affiliate',

  /**
   * Affiliate lookup value field returned by Dataverse
   */
  AFFILIATE_LOOKUP_VALUE: '_osot_table_account_affiliate_value',

  /**
   * Affiliate @odata.bind field name
   */
  AFFILIATE_BIND: 'osot_Table_Account_Affiliate@odata.bind',

  // ========================================
  // STATUS FIELDS (2 fields)
  // ========================================

  /**
   * Order status (choice)
   * Workflow: DRAFT → SUBMITTED → PENDING_APPROVAL → APPROVED → PROCESSING → COMPLETED/CANCELLED/REFUNDED
   */
  ORDER_STATUS: 'osot_order_status',

  /**
   * Payment status (choice)
   * Workflow: UNPAID → PENDING → PAID (or PARTIALLY_REFUNDED → FULLY_REFUNDED)
   */
  PAYMENT_STATUS: 'osot_payment_status',

  // ========================================
  // ACCESS CONTROL FIELDS (2 fields)
  // ========================================

  /**
   * Privilege level (OptionSet)
   * Controls which app roles can manage this order
   */
  PRIVILEGE: 'osot_privilege',

  /**
   * Access modifier (OptionSet)
   * Controls visibility of the order (public/protected/private)
   */
  ACCESS_MODIFIERS: 'osot_access_modifiers',

  // ========================================
  // FINANCIAL FIELDS (3 fields)
  // ========================================

  /**
   * Order subtotal (Currency)
   * Sum of all product prices before coupon discount
   * Required field
   */
  SUBTOTAL: 'osot_subtotal',

  /**
   * Coupon code (Text)
   * Reference code for discount coupon
   * Optional - if null, no coupon applied
   */
  COUPON: 'osot_coupon',

  /**
   * Order total (Currency)
   * Final amount: subtotal - coupon_discount + taxes
   * Required field
   */
  TOTAL: 'osot_total',

  // ========================================
  // SYSTEM FIELDS (Auto-managed by Dataverse)
  // ========================================

  /**
   * Created on (DateTime)
   * System-managed - set automatically by Dataverse
   * Cannot be modified
   */
  CREATED_ON: 'createdon',

  /**
   * Modified on (DateTime)
   * System-managed - updated automatically by Dataverse
   * Cannot be modified directly
   */
  MODIFIED_ON: 'modifiedon',

  /**
   * Created by (Owner)
   * System-managed - user who created the record
   */
  CREATED_BY: 'createdby',

  /**
   * Modified by (Owner)
   * System-managed - user who last modified the record
   */
  MODIFIED_BY: 'modifiedby',

  /**
   * Owner (Owner)
   * User or team that owns the record
   * Used for row-level security
   */
  OWNER: 'ownerid',
} as const;

/**
 * OData $select configurations
 * Define which fields to retrieve in different scenarios
 */
export const ORDER_ODATA_SELECT = {
  /**
   * Basic fields for list views
   * Lightweight query for list displays
   */
  BASIC: [
    ORDER_ODATA.TABLE_ORDER_ID,
    ORDER_ODATA.ORDER_NUMBER,
    ORDER_ODATA.ORDER_STATUS,
    ORDER_ODATA.PAYMENT_STATUS,
    ORDER_ODATA.PRIVILEGE,
    ORDER_ODATA.ACCESS_MODIFIERS,
    ORDER_ODATA.SUBTOTAL,
    ORDER_ODATA.TOTAL,
    ORDER_ODATA.CREATED_ON,
  ].join(','),

  /**
   * Full fields with lookups
   * Complete order details including relationship IDs
   */
  FULL: [
    ORDER_ODATA.TABLE_ORDER_ID,
    ORDER_ODATA.ORDER_NUMBER,
    ORDER_ODATA.ORGANIZATION_LOOKUP_VALUE,
    ORDER_ODATA.ACCOUNT_LOOKUP_VALUE,
    ORDER_ODATA.AFFILIATE_LOOKUP_VALUE,
    ORDER_ODATA.ORDER_STATUS,
    ORDER_ODATA.PAYMENT_STATUS,
    ORDER_ODATA.PRIVILEGE,
    ORDER_ODATA.ACCESS_MODIFIERS,
    ORDER_ODATA.SUBTOTAL,
    ORDER_ODATA.COUPON,
    ORDER_ODATA.TOTAL,
    ORDER_ODATA.CREATED_ON,
    ORDER_ODATA.MODIFIED_ON,
    ORDER_ODATA.OWNER,
  ].join(','),

  /**
   * With OrderProduct expansion
   * Full order details + all line items
   */
  WITH_PRODUCTS: [
    ORDER_ODATA.TABLE_ORDER_ID,
    ORDER_ODATA.ORDER_NUMBER,
    ORDER_ODATA.ORGANIZATION_LOOKUP_VALUE,
    ORDER_ODATA.ACCOUNT_LOOKUP_VALUE,
    ORDER_ODATA.AFFILIATE_LOOKUP_VALUE,
    ORDER_ODATA.ORDER_STATUS,
    ORDER_ODATA.PAYMENT_STATUS,
    ORDER_ODATA.PRIVILEGE,
    ORDER_ODATA.ACCESS_MODIFIERS,
    ORDER_ODATA.SUBTOTAL,
    ORDER_ODATA.COUPON,
    ORDER_ODATA.TOTAL,
    ORDER_ODATA.CREATED_ON,
    ORDER_ODATA.MODIFIED_ON,
  ].join(','),
} as const;

/**
 * OData $expand configurations
 * Define related entities to expand in queries
 */
export const ORDER_ODATA_EXPAND = {
  /**
   * Expand OrderProduct line items
   */
  ORDER_PRODUCTS: 'osot_order_orderproducts',

  /**
   * Expand organization details
   */
  ORGANIZATION: 'osot_table_organization',

  /**
   * Expand account (owner person) details
   */
  ACCOUNT: 'osot_table_account',

  /**
   * Expand affiliate (company) details
   */
  AFFILIATE: 'osot_table_account_affiliate',
} as const;
