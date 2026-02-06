/**
 * Order Dataverse Interface
 *
 * Raw representation of Order entity as it comes from Dataverse OData API.
 * This interface matches the exact structure returned by Dataverse, including:
 * - Formatted values (@OData.Community.Display.V1.FormattedValue)
 * - Lookup navigation properties
 * - System fields (createdon, modifiedon, etc.)
 *
 * All fields use primitive types (string, number, boolean) as returned by OData.
 * Field names match exactly with ORDER_ODATA constants.
 *
 * Based on: Table_Order.csv schema + Dataverse OData response structure
 */

/**
 * Order entity as returned from Dataverse OData API
 */
export interface OrderDataverse {
  // ========================================
  // IDENTIFIERS (2 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  osot_table_orderid?: string;

  /**
   * Business ID (Autonumber)
   * Example: "osot_ord-0000001"
   */
  osot_orderid?: string;

  // ========================================
  // RELATIONSHIPS/LOOKUPS (3 fields)
  // ========================================

  /**
   * Organization lookup GUID (_osot_table_organization_value)
   * Primary key of parent organization
   */
  _osot_table_organization_value?: string;

  /**
   * Organization lookup formatted value
   * Display name of the organization
   */
  '_osot_table_organization_value@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Organization @odata.bind field name
   * Used for creating/updating relationships
   * Format: "/osot_table_organizations(guid)"
   */
  'osot_Table_Organization@odata.bind'?: string;

  /**
   * Account lookup GUID (_osot_table_account_value)
   * Primary key of account (person buyer)
   * Optional
   */
  _osot_table_account_value?: string;

  /**
   * Account lookup formatted value
   * Display name of the account
   */
  '_osot_table_account_value@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Account @odata.bind field name
   * Used for creating/updating relationships
   * Format: "/osot_table_accounts(guid)"
   */
  'osot_Table_Account@odata.bind'?: string;

  /**
   * Account Affiliate lookup GUID (_osot_table_account_affiliate_value)
   * Primary key of affiliate (company buyer)
   * Optional
   */
  _osot_table_account_affiliate_value?: string;

  /**
   * Account Affiliate lookup formatted value
   * Display name of the affiliate
   */
  '_osot_table_account_affiliate_value@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Account Affiliate @odata.bind field name
   * Used for creating/updating relationships
   * Format: "/osot_table_account_affiliates(guid)"
   */
  'osot_Table_Account_Affiliate@odata.bind'?: string;

  // ========================================
  // STATUS FIELDS (2 fields)
  // ========================================

  /**
   * Order status (OptionSet value)
   * 1 = DRAFT, 2 = SUBMITTED, 3 = PENDING_APPROVAL, 4 = APPROVED,
   * 5 = PROCESSING, 6 = COMPLETED, 7 = CANCELLED, 8 = REFUNDED
   */
  osot_order_status?: number;

  /**
   * Order status formatted value
   * Example: "Draft", "Submitted", "Pending Approval", etc.
   */
  'osot_order_status@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Payment status (OptionSet value)
   * 1 = UNPAID, 2 = PENDING, 3 = PAID, 4 = PARTIALLY_REFUNDED, 5 = FULLY_REFUNDED
   */
  osot_payment_status?: number;

  /**
   * Payment status formatted value
   * Example: "Unpaid", "Pending", "Paid", "Partially Refunded", "Fully Refunded"
   */
  'osot_payment_status@OData.Community.Display.V1.FormattedValue'?: string;

  // ========================================
  // ACCESS CONTROL FIELDS (2 fields)
  // ========================================

  /**
   * Privilege level (OptionSet value)
   * Aligns with global choice Choices_Privilege
   */
  osot_privilege?: number;

  /**
   * Privilege formatted value
   * Example: "Owner", "Admin", "Main"
   */
  'osot_privilege@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Access modifier (OptionSet value)
   * 1 = Public, 2 = Protected, 3 = Private
   */
  osot_access_modifiers?: number;

  /**
   * Access modifier formatted value
   * Example: "Public", "Protected", "Private"
   */
  'osot_access_modifiers@OData.Community.Display.V1.FormattedValue'?: string;

  // ========================================
  // FINANCIAL FIELDS (3 fields)
  // ========================================

  /**
   * Order subtotal (Currency)
   * Sum of all product prices before coupon discount
   * Example: 1234.56
   */
  osot_subtotal?: number;

  /**
   * Coupon code (Text)
   * Reference code for discount coupon
   * Example: "DISCOUNT15"
   */
  osot_coupon?: string;

  /**
   * Order total (Currency)
   * Final amount: subtotal - coupon_discount + taxes
   * Example: 1250.00
   */
  osot_total?: number;

  // ========================================
  // SYSTEM FIELDS (Auto-managed by Dataverse)
  // ========================================

  /**
   * Created on (DateTime)
   * ISO 8601 format
   * Example: "2026-01-22T15:30:00Z"
   */
  createdon?: string;

  /**
   * Modified on (DateTime)
   * ISO 8601 format
   */
  modifiedon?: string;

  /**
   * Created by (Owner)
   * GUID of user who created record
   */
  createdby?: string;

  /**
   * Modified by (Owner)
   * GUID of user who last modified record
   */
  modifiedby?: string;

  /**
   * Owner (Owner)
   * GUID of user/team that owns the record
   */
  ownerid?: string;
}
