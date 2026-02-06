/**
 * Product Dataverse Interface
 *
 * Raw representation of Product entity as it comes from Dataverse OData API.
 * This interface matches the exact structure returned by Dataverse, including:
 * - Formatted values (@OData.Community.Display.V1.FormattedValue)
 * - Lookup navigation properties
 * - System fields (createdon, modifiedon, etc.)
 *
 * All fields use primitive types (string, number, boolean) as returned by OData.
 * Field names match exactly with PRODUCT_ODATA constants.
 *
 * Based on: Product.csv schema + Dataverse OData response structure
 */

/**
 * Product entity as returned from Dataverse OData API
 */
export interface ProductDataverse {
  // ========================================
  // IDENTIFIERS (3 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  osot_table_productid?: string;

  /**
   * Business ID (Autonumber)
   * Example: "osot-prod-0000001"
   */
  osot_productid?: string;

  /**
   * Organization lookup GUID (_osot_table_organization_value)
   */
  _osot_table_organization_value?: string;
  '_osot_table_organization_value@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Product code (unique)
   * Example: "MEMBERSHIP-2025"
   */
  osot_product_code?: string;

  // ========================================
  // BASIC INFORMATION (4 fields)
  // ========================================

  /**
   * Product name
   */
  osot_product_name?: string;

  /**
   * Product description
   */
  osot_product_description?: string;

  /**
   * Product category (OptionSet value)
   * Returns integer (0-14)
   */
  osot_product_category?: number;

  /**
   * Product category formatted value
   * Example: "OT-STU", "OT-NG", etc.
   */
  'osot_product_category@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Product picture URL
   */
  osot_product_picture?: string;

  /**
   * Insurance Type (OptionSet value)
   * Optional field (required only when ProductCategory = INSURANCE)
   * Returns integer mapping to InsuranceType enum
   * 1 = PROFESSIONAL, 2 = GENERAL, 3 = CORPORATIVE, 4 = PROPERTY
   */
  osot_insurance_type?: number;

  /**
   * Insurance Type formatted value
   * Example: "Professional", "General", "Corporative", "Property"
   */
  'osot_insurance_type@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Insurance Limit (Currency)
   * Optional field (required only when ProductCategory = INSURANCE)
   * Defines the maximum coverage amount for insurance products
   * Range: 0 to 922,337,203,685,477
   * Dataverse returns as number
   */
  osot_insurance_limit?: number;

  /**
   * Insurance Limit formatted value
   * Example: "$100,000.00"
   */
  'osot_insurance_limit@OData.Community.Display.V1.FormattedValue'?: string;

  // ========================================
  // CONTROL FIELDS (5 fields)
  // ========================================

  /**
   * Product status (OptionSet value)
   * 0 = UNAVAILABLE, 1 = AVAILABLE, 2 = DISCONTINUED, 3 = DRAFT, 4 = OUT_OF_STOCK
   */
  osot_product_status?: number;

  /**
   * Product status formatted value
   * Example: "Available", "Discontinued"
   */
  'osot_product_status@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * GL Code (OptionSet value)
   * Returns integer
   */
  osot_product_gl_code?: number;

  /**
   * GL Code formatted value
   */
  'osot_product_gl_code@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Privilege (OptionSet value)
   * 0 = OWNER, 2 = ADMIN, 3 = MAIN
   */
  osot_privilege?: number;

  /**
   * Privilege formatted value
   * Example: "Owner", "Admin", "Main"
   */
  'osot_privilege@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Target user type (OptionSet value)
   * 1 = OT_OTA, 2 = AFFILIATE, 3 = BOTH
   */
  osot_user_type?: number;

  /**
   * Target user type formatted value
   * Example: "OT/OTA", "Affiliate", "Both (All Users)"
   */
  'osot_user_type@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Access modifier (OptionSet value)
   * 0 = PUBLIC, 1 = PROTECTED, 2 = PRIVATE
   */
  osot_access_modifiers?: number;

  /**
   * Access modifier formatted value
   * Example: "Public", "Protected", "Private"
   */
  'osot_access_modifiers@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Product Additional Information (Text Area)
   * Optional - Max 4000 characters
   * Free-form text field for administrators to add supplementary information
   * Examples: Special instructions, compatibility notes, warnings, disclaimers
   */
  osot_product_additional_info?: string;

  // ========================================
  // PRICING FIELDS (16 fields)
  // ========================================

  /**
   * General/public price (Currency)
   * Dataverse returns as number
   */
  osot_general_price?: number;

  /**
   * General price formatted value
   * Example: "$50.00"
   */
  'osot_general_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OT-STU price
   */
  osot_otstu_price?: number;
  'osot_otstu_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OT-NG price
   */
  osot_otng_price?: number;
  'osot_otng_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OT-PR price
   */
  osot_otpr_price?: number;
  'osot_otpr_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OT-NP price
   */
  osot_otnp_price?: number;
  'osot_otnp_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OT-RET price
   */
  osot_otret_price?: number;
  'osot_otret_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OT-LIFE price
   */
  osot_otlife_price?: number;
  'osot_otlife_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OTA-STU price
   */
  osot_otastu_price?: number;
  'osot_otastu_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OTA-NG price
   */
  osot_otang_price?: number;
  'osot_otang_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OTA-NP price
   */
  osot_otanp_price?: number;
  'osot_otanp_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OTA-RET price
   */
  osot_otaret_price?: number;
  'osot_otaret_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OTA-PR price
   */
  osot_otapr_price?: number;
  'osot_otapr_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OTA-LIFE price
   */
  osot_otalife_price?: number;
  'osot_otalife_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * ASSOC price
   */
  osot_assoc_price?: number;
  'osot_assoc_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * AFF-PRIM price
   */
  osot_affprim_price?: number;
  'osot_affprim_price@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * AFF-PREM price
   */
  osot_affprem_price?: number;
  'osot_affprem_price@OData.Community.Display.V1.FormattedValue'?: string;

  // ========================================
  // OTHER FIELDS (3 fields)
  // ========================================

  /**
   * Inventory quantity (Whole Number)
   */
  osot_inventory?: number;

  /**
   * Shipping cost (Currency)
   */
  osot_shipping?: number;
  'osot_shipping@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Taxes (Decimal)
   */
  osot_taxes?: number;

  // ========================================
  // DATE FIELDS (2 fields)
  // ========================================

  /**
   * Product start date (Date only)
   * Format: "YYYY-MM-DD" (ISO 8601 date string)
   * Example: "2025-01-01"
   */
  osot_start_date?: string;

  /**
   * Product end date (Date only)
   * Format: "YYYY-MM-DD" (ISO 8601 date string)
   * Example: "2025-12-31"
   */
  osot_end_date?: string;

  // ========================================
  // NEW FIELDS (3 fields)
  // ========================================

  /**
   * Active Membership Only flag (Yes/No field)
   * Dataverse returns as boolean
   * Optional (defaults to false)
   */
  osot_active_membership_only?: boolean;

  /**
   * Active Membership Only formatted value
   * Example: "Yes", "No"
   */
  'osot_active_membership_only@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Post Purchase Information (Text Area)
   * Optional
   * Max length: 4000 characters
   */
  osot_post_purchase_info?: string;

  /**
   * Product Year (Single Line Text)
   * Format: YYYY (4-digit year string)
   * Example: "2025"
   */
  osot_product_year?: string;

  // ========================================
  // SYSTEM FIELDS (Dataverse metadata)
  // ========================================

  /**
   * Record creation date
   */
  createdon?: string;

  /**
   * Record last modified date
   */
  modifiedon?: string;

  /**
   * Created by user lookup
   */
  _createdby_value?: string;
  '_createdby_value@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Modified by user lookup
   */
  _modifiedby_value?: string;
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Version number (for optimistic concurrency)
   */
  versionnumber?: number;

  /**
   * Record state
   * 0 = Active, 1 = Inactive
   */
  statecode?: number;
  'statecode@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * Record status
   */
  statuscode?: number;
  'statuscode@OData.Community.Display.V1.FormattedValue'?: string;

  /**
   * OData metadata
   */
  '@odata.etag'?: string;
  '@odata.context'?: string;
}
