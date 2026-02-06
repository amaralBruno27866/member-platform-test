/**
 * Product OData Constants
 *
 * Centralized configuration for Product entity OData operations:
 * - Field names (Dataverse schema)
 * - Entity metadata
 * - Query expand configurations
 *
 * CRITICAL: Field names must match exactly with Dataverse schema
 * Any mismatch will cause OData query failures
 */

/**
 * Product entity metadata for Dataverse API
 */
export const PRODUCT_ENTITY = {
  /**
   * Logical name used in OData API endpoints
   * Example: /api/data/v9.2/osot_table_products
   */
  logicalName: 'osot_table_product',

  /**
   * Plural name for collection endpoints
   */
  collectionName: 'osot_table_products',

  /**
   * Primary key field name (GUID)
   */
  primaryKey: 'osot_table_productid',
} as const;

/**
 * Product field names exactly as they appear in Dataverse
 * Used for OData $select, $filter, $orderby operations
 *
 * IMPORTANT: These names are case-sensitive and must match Dataverse schema
 */
export const PRODUCT_ODATA = {
  // ========================================
  // IDENTIFIERS (3 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * System-generated unique identifier
   */
  TABLE_PRODUCT_ID: 'osot_table_productid',

  /**
   * Business ID (Autonumber)
   * Format: osot-prod-0000001
   * User-friendly unique identifier
   */
  PRODUCT_ID: 'osot_productid',

  /**
   * Product code (unique business identifier)
   * Format: String (max 25 chars)
   * Example: "MEMBERSHIP-2025", "TSHIRT-BLUE-L"
   * Used for inventory/SKU management
   */
  PRODUCT_CODE: 'osot_product_code',

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

  // ========================================
  // BASIC INFORMATION (4 fields)
  // ========================================

  /**
   * Product name
   * Required field
   */
  PRODUCT_NAME: 'osot_product_name',

  /**
   * Product description
   * Required field (max 255 chars)
   */
  PRODUCT_DESCRIPTION: 'osot_product_description',

  /**
   * Product category (single choice)
   * Required field
   * Maps to ProductCategory enum
   */
  PRODUCT_CATEGORY: 'osot_product_category',

  /**
   * Product picture URL
   * Optional field
   */
  PRODUCT_PICTURE: 'osot_product_picture',

  /**
   * Insurance Type (single choice)
   * Optional field (required only when ProductCategory = INSURANCE)
   * Maps to InsuranceType enum
   */
  INSURANCE_TYPE: 'osot_insurance_type',

  /**
   * Insurance Limit (currency)
   * Optional field (required only when ProductCategory = INSURANCE)
   * Defines the maximum coverage amount for insurance products
   * Currency range: 0 to 922,337,203,685,477
   */
  INSURANCE_LIMIT: 'osot_insurance_limit',

  // ========================================
  // CONTROL FIELDS (5 fields)
  // ========================================

  /**
   * Product status
   * Required field
   * Values: AVAILABLE (0), DISCONTINUED (1)
   */
  PRODUCT_STATUS: 'osot_product_status',

  /**
   * General Ledger account code
   * Required field
   * Maps to ProductGLCode enum
   */
  PRODUCT_GL_CODE: 'osot_product_gl_code',

  /**
   * Privilege level for access control
   * Optional field
   * Values: OWNER (0), ADMIN (2), MAIN (3)
   */
  PRIVILEGE: 'osot_privilege',

  /**
   * Access modifier for viewing control
   * Optional field
   * Values: PUBLIC (0), PROTECTED (1), PRIVATE (2)
   */
  ACCESS_MODIFIERS: 'osot_access_modifiers',

  /**
   * User type eligibility
   * Optional field (single choice)
   * Defines which user types (OT/OTA) can access/purchase this product
   * Maps to ProductUserType enum
   */
  USER_TYPE: 'osot_user_type',

  /**
   * Product Additional Information
   * Optional - Text Area (max 4000 characters)
   * Free-form text field for administrators to add supplementary information
   */
  PRODUCT_ADDITIONAL_INFO: 'osot_product_additional_info',

  // ========================================
  // PRICING FIELDS (16 fields)
  // ========================================

  /**
   * General/public price
   * Optional - Used when no specific category price is set
   */
  GENERAL_PRICE: 'osot_general_price',

  /**
   * Price for OT-STU category (OT Student)
   * Optional - Specific pricing for student members
   */
  OTSTU_PRICE: 'osot_otstu_price',

  /**
   * Price for OT-NG category (OT New Graduate)
   * Optional - Specific pricing for new graduate members
   */
  OTNG_PRICE: 'osot_otng_price',

  /**
   * Price for OT-PR category (OT Practicing)
   * Optional - Specific pricing for practicing members
   */
  OTPR_PRICE: 'osot_otpr_price',

  /**
   * Price for OT-NP category (OT Non-Practicing)
   * Optional - Specific pricing for non-practicing members
   */
  OTNP_PRICE: 'osot_otnp_price',

  /**
   * Price for OT-RET category (OT Retired)
   * Optional - Specific pricing for retired members
   */
  OTRET_PRICE: 'osot_otret_price',

  /**
   * Price for OT-LIFE category (OT Lifetime)
   * Optional - Specific pricing for lifetime members
   */
  OTLIFE_PRICE: 'osot_otlife_price',

  /**
   * Price for OTA-STU category (OTA Student)
   * Optional - Specific pricing for OTA student members
   */
  OTASTU_PRICE: 'osot_otastu_price',

  /**
   * Price for OTA-NG category (OTA New Graduate)
   * Optional - Specific pricing for OTA new graduate members
   */
  OTANG_PRICE: 'osot_otang_price',

  /**
   * Price for OTA-NP category (OTA Non-Practicing)
   * Optional - Specific pricing for OTA non-practicing members
   */
  OTANP_PRICE: 'osot_otanp_price',

  /**
   * Price for OTA-RET category (OTA Retired)
   * Optional - Specific pricing for OTA retired members
   */
  OTARET_PRICE: 'osot_otaret_price',

  /**
   * Price for OTA-PR category (OTA Practicing)
   * Optional - Specific pricing for OTA practicing members
   */
  OTAPR_PRICE: 'osot_otapr_price',

  /**
   * Price for OTA-LIFE category (OTA Lifetime)
   * Optional - Specific pricing for OTA lifetime members
   */
  OTALIFE_PRICE: 'osot_otalife_price',

  /**
   * Price for ASSOC category (Associate)
   * Optional - Specific pricing for associate members
   */
  ASSOC_PRICE: 'osot_assoc_price',

  /**
   * Price for AFF-PRIM category (Affiliate Primary)
   * Optional - Specific pricing for primary affiliate members
   */
  AFFPRIM_PRICE: 'osot_affprim_price',

  /**
   * Price for AFF-PREM category (Affiliate Premium)
   * Optional - Specific pricing for premium affiliate members
   */
  AFFPREM_PRICE: 'osot_affprem_price',

  // ========================================
  // OTHER FIELDS (3 fields)
  // ========================================

  /**
   * Inventory quantity
   * Optional - Whole number (0 to 2,147,483,647)
   */
  INVENTORY: 'osot_inventory',

  /**
   * Shipping cost
   * Optional - Currency field
   */
  SHIPPING: 'osot_shipping',

  /**
   * Tax percentage
   * Required - Decimal (2 decimal places)
   */
  TAXES: 'osot_taxes',

  // ========================================
  // DATE FIELDS (2 fields)
  // ========================================

  /**
   * Product start date
   * Optional - Date only (no time component)
   * Format: YYYY-MM-DD
   * Defines when the product becomes available/active
   */
  START_DATE: 'osot_start_date',

  /**
   * Product end date
   * Optional - Date only (no time component)
   * Format: YYYY-MM-DD
   * Defines when the product becomes unavailable/inactive
   */
  END_DATE: 'osot_end_date',

  // ========================================
  // NEW FIELDS (3 fields)
  // ========================================

  /**
   * Active Membership Only flag
   * Optional - Yes/No field (boolean)
   * When true, product is restricted to active members only
   * Backend validates user's osot_active_member field
   */
  ACTIVE_MEMBERSHIP_ONLY: 'osot_active_membership_only',

  /**
   * Post Purchase Information
   * Optional - Text Area (max 4000 characters)
   * Plain text content included in email receipts after purchase
   */
  POST_PURCHASE_INFO: 'osot_post_purchase_info',

  /**
   * Product Year
   * Required - Single Line Text (4 characters)
   * Format: YYYY (4-digit year)
   * Used for administrative filtering and reporting
   */
  PRODUCT_YEAR: 'osot_product_year',
} as const;

/**
 * Access Modifier values for product visibility control
 */
export const ProductAccessModifiers = {
  /**
   * PUBLIC (0) - Anyone can view if product is AVAILABLE
   * Used for: Landing page products, general merchandise
   */
  PUBLIC: 0,

  /**
   * PROTECTED (1) - Requires user to be logged in (OWNER privilege)
   * Some products may also require active membership (hasMembership=true)
   * Used for: Member-only products, conferences, specialized courses
   */
  PROTECTED: 1,

  /**
   * PRIVATE (2) - Only Admin/Main can view
   * Used for: Internal tools, testing products, admin resources
   */
  PRIVATE: 2,
} as const;

/**
 * Type-safe Access Modifier values
 */
export type ProductAccessModifier =
  (typeof ProductAccessModifiers)[keyof typeof ProductAccessModifiers];

/**
 * Default OData select fields for basic product queries
 * Includes all essential fields for product display
 */
export const PRODUCT_SELECT_DEFAULT = [
  PRODUCT_ODATA.INSURANCE_TYPE,
  PRODUCT_ODATA.INSURANCE_LIMIT,
  PRODUCT_ODATA.PRODUCT_PICTURE,
  PRODUCT_ODATA.PRODUCT_STATUS,
  PRODUCT_ODATA.PRODUCT_GL_CODE,
  PRODUCT_ODATA.ACCESS_MODIFIERS,
  PRODUCT_ODATA.PRODUCT_ADDITIONAL_INFO,
  PRODUCT_ODATA.PRODUCT_NAME,
  PRODUCT_ODATA.PRODUCT_DESCRIPTION,
  PRODUCT_ODATA.PRODUCT_CATEGORY,
  PRODUCT_ODATA.PRODUCT_PICTURE,
  PRODUCT_ODATA.PRODUCT_STATUS,
  PRODUCT_ODATA.PRODUCT_GL_CODE,
  PRODUCT_ODATA.ACCESS_MODIFIERS,
  PRODUCT_ODATA.GENERAL_PRICE,
  PRODUCT_ODATA.INVENTORY,
  PRODUCT_ODATA.TAXES,
  PRODUCT_ODATA.START_DATE,
  PRODUCT_ODATA.END_DATE,
  PRODUCT_ODATA.ACTIVE_MEMBERSHIP_ONLY,
  PRODUCT_ODATA.POST_PURCHASE_INFO,
  PRODUCT_ODATA.PRODUCT_YEAR,
].join(',');

/**
 * Complete OData select including all price fields
 * Used for admin views and detailed product management
 */
export const PRODUCT_SELECT_FULL = [
  ...PRODUCT_SELECT_DEFAULT.split(','),
  PRODUCT_ODATA.INSURANCE_LIMIT,
  PRODUCT_ODATA.OTSTU_PRICE,
  PRODUCT_ODATA.OTNG_PRICE,
  PRODUCT_ODATA.OTPR_PRICE,
  PRODUCT_ODATA.OTNP_PRICE,
  PRODUCT_ODATA.OTRET_PRICE,
  PRODUCT_ODATA.OTLIFE_PRICE,
  PRODUCT_ODATA.OTASTU_PRICE,
  PRODUCT_ODATA.OTANG_PRICE,
  PRODUCT_ODATA.OTANP_PRICE,
  PRODUCT_ODATA.OTARET_PRICE,
  PRODUCT_ODATA.OTAPR_PRICE,
  PRODUCT_ODATA.OTALIFE_PRICE,
  PRODUCT_ODATA.ASSOC_PRICE,
  PRODUCT_ODATA.AFFPRIM_PRICE,
  PRODUCT_ODATA.AFFPREM_PRICE,
  PRODUCT_ODATA.USER_TYPE,
  PRODUCT_ODATA.SHIPPING,
  PRODUCT_ODATA.PRIVILEGE,
].join(',');

/**
 * Price fields only - for price-specific queries
 */
export const PRODUCT_PRICE_FIELDS = [
  PRODUCT_ODATA.GENERAL_PRICE,
  PRODUCT_ODATA.OTSTU_PRICE,
  PRODUCT_ODATA.OTNG_PRICE,
  PRODUCT_ODATA.OTPR_PRICE,
  PRODUCT_ODATA.OTNP_PRICE,
  PRODUCT_ODATA.OTRET_PRICE,
  PRODUCT_ODATA.OTLIFE_PRICE,
  PRODUCT_ODATA.OTASTU_PRICE,
  PRODUCT_ODATA.OTANG_PRICE,
  PRODUCT_ODATA.OTANP_PRICE,
  PRODUCT_ODATA.OTARET_PRICE,
  PRODUCT_ODATA.OTAPR_PRICE,
  PRODUCT_ODATA.OTALIFE_PRICE,
  PRODUCT_ODATA.ASSOC_PRICE,
  PRODUCT_ODATA.AFFPRIM_PRICE,
  PRODUCT_ODATA.AFFPREM_PRICE,
] as const;

/**
 * Map ProductCategory enum to price field names
 * Used to dynamically get the correct price field for a user's category
 */
export const CATEGORY_TO_PRICE_FIELD: Record<
  number,
  keyof typeof PRODUCT_ODATA
> = {
  0: 'OTSTU_PRICE', // OT-STU
  1: 'OTNG_PRICE', // OT-NG
  2: 'OTPR_PRICE', // OT-PR
  3: 'OTNP_PRICE', // OT-NP
  4: 'OTRET_PRICE', // OT-RET
  5: 'OTLIFE_PRICE', // OT-LIFE
  6: 'OTASTU_PRICE', // OTA-STU
  7: 'OTANG_PRICE', // OTA-NG
  8: 'OTANP_PRICE', // OTA-NP
  9: 'OTARET_PRICE', // OTA-RET
  10: 'OTAPR_PRICE', // OTA-PR
  11: 'OTALIFE_PRICE', // OTA-LIFE
  12: 'ASSOC_PRICE', // ASSOC
  13: 'AFFPRIM_PRICE', // AFF-PRIM
  14: 'AFFPREM_PRICE', // AFF-PREM
} as const;

/**
 * Mapping from DTO field names (camelCase) to OData field names
 * Used for $orderby, $filter operations when receiving DTO field names
 */
export const PRODUCT_ORDERBY_FIELD_MAP: Record<string, string> = {
  // Identifiers
  id: PRODUCT_ODATA.TABLE_PRODUCT_ID,
  productId: PRODUCT_ODATA.PRODUCT_ID,
  productCode: PRODUCT_ODATA.PRODUCT_CODE,

  // Basic Information
  productName: PRODUCT_ODATA.PRODUCT_NAME,
  productDescription: PRODUCT_ODATA.PRODUCT_DESCRIPTION,
  productCategory: PRODUCT_ODATA.PRODUCT_CATEGORY,
  productPicture: PRODUCT_ODATA.PRODUCT_PICTURE,

  // Control Fields
  productStatus: PRODUCT_ODATA.PRODUCT_STATUS,
  productGlCode: PRODUCT_ODATA.PRODUCT_GL_CODE,
  privilege: PRODUCT_ODATA.PRIVILEGE,
  accessModifiers: PRODUCT_ODATA.ACCESS_MODIFIERS,

  // Pricing
  generalPrice: PRODUCT_ODATA.GENERAL_PRICE,

  // Other Fields
  inventory: PRODUCT_ODATA.INVENTORY,
  shipping: PRODUCT_ODATA.SHIPPING,
  taxes: PRODUCT_ODATA.TAXES,

  // Date Fields
  startDate: PRODUCT_ODATA.START_DATE,
  endDate: PRODUCT_ODATA.END_DATE,

  // New Fields
  activeMembershipOnly: PRODUCT_ODATA.ACTIVE_MEMBERSHIP_ONLY,
  postPurchaseInfo: PRODUCT_ODATA.POST_PURCHASE_INFO,
  insuranceType: PRODUCT_ODATA.INSURANCE_TYPE,
  productAdditionalInfo: PRODUCT_ODATA.PRODUCT_ADDITIONAL_INFO,
  productYear: PRODUCT_ODATA.PRODUCT_YEAR,
} as const;
