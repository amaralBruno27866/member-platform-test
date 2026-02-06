/**
 * Product Internal Interface
 *
 * Internal representation of Product entity used throughout the application.
 * This interface represents the clean, TypeScript-native structure used in:
 * - Services (business logic)
 * - DTOs (data transfer)
 * - Mappers (transformation)
 *
 * All fields use TypeScript types and enums for type safety.
 * Optional fields (?) match Dataverse schema (Optional vs Required).
 *
 * Based on: Product.csv schema (30 fields)
 */

import { ProductCategory } from '../enums/product-category.enum';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductGLCode } from '../enums/product-gl-code.enum';
import { ProductUserType } from '../enums/product-user-type.enum';
import { InsuranceType } from '../enums/insurance-type.enum';
import { Privilege } from '../../../../common/enums';

/**
 * Product entity internal representation
 */
export interface ProductInternal {
  // ========================================
  // IDENTIFIERS (3 fields)
  // ========================================

  /**
   * Primary key (GUID)
   * System-generated, immutable
   * Example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
   */
  osot_table_productid?: string;

  /**
   * Business ID (Autonumber)
   * Format: osot-prod-0000001
   * User-friendly identifier, auto-generated
   */
  osot_productid?: string;

  /**
   * Product code (unique business identifier)
   * Required for creation
   * Max length: 25 characters
   * Pattern: Uppercase letters, numbers, hyphens, underscores
   * Example: "MEMBERSHIP-2025", "TSHIRT-BLUE-L"
   */
  osot_product_code: string;

  /**
   * Parent organization GUID
   * Required for multi-tenant isolation (immutable after creation)
   */
  organizationGuid?: string;

  // ========================================
  // BASIC INFORMATION (4 fields)
  // ========================================

  /**
   * Product name
   * Required
   * Max length: 100 characters
   */
  osot_product_name: string;

  /**
   * Product description
   * Required
   * Max length: 255 characters
   */
  osot_product_description: string;

  /**
   * Product category (single choice)
   * Required
   * Defines the product type/category
   */
  osot_product_category: ProductCategory;

  /**
   * Product picture URL
   * Optional
   * Max length: 2048 characters
   * Format: Valid HTTP/HTTPS URL
   */
  osot_product_picture?: string;

  /**
   * Insurance Type (single choice)
   * Optional field (required only when ProductCategory = INSURANCE)
   * Maps to InsuranceType enum
   * Values: PROFESSIONAL (1), GENERAL (2), CORPORATIVE (3), PROPERTY (4)
   * Conditional requirement: Mandatory if osot_product_category = ProductCategory.INSURANCE
   * Business rule: @see INSURANCE_TYPE_RULES in product-business-rules.constant.ts
   */
  osot_insurance_type?: InsuranceType;

  /**
   * Insurance Limit (Currency)
   * Optional field (required only when ProductCategory = INSURANCE)
   * Defines the maximum coverage amount for insurance products
   * Range: 0.00 to 999,999,999.99
   * Conditional requirement: Mandatory if osot_product_category = ProductCategory.INSURANCE
   * Business rule: @see INSURANCE_LIMIT_RULES in product-business-rules.constant.ts
   * Examples: 50000, 100000, 250000, 500000, 1000000
   */
  osot_insurance_limit?: number;

  // ========================================
  // CONTROL FIELDS (4 fields)
  // ========================================

  /**
   * Product status
   * Required
   * Controls product lifecycle and availability
   */
  osot_product_status: ProductStatus;

  /**
   * General Ledger account code
   * Required
   * Used for accounting/financial tracking
   */
  osot_product_gl_code: ProductGLCode;

  /**
   * Privilege level for management operations
   * Optional
   * Defines who can manage (CRUD) this product
   */
  osot_privilege?: Privilege;

  /**
   * Target user type for product filtering
   * Required (defaults to BOTH=3 in Dataverse)
   * Defines which user types can see this product
   * - OT_OTA (1): Only for Account users (OT/OTA members)
   * - AFFILIATE (2): Only for Affiliate users
   * - BOTH (3): Available to all user types
   * Used as first-layer filter before audience target matching
   */
  osot_user_type?: ProductUserType;

  /**
   * Access modifier for viewing control
   * Optional
   * Defines who can view/purchase this product
   * 0 = PUBLIC, 1 = PROTECTED, 2 = PRIVATE
   */
  osot_access_modifiers?: number;

  /**
   * Product Additional Information (Text Area)
   * Optional - Max 4000 characters
   * Free-form text field for administrators to add supplementary information
   * Examples: Special instructions, compatibility notes, warnings, disclaimers
   * Note: Separate from osot_post_purchase_info (which is sent after purchase)
   */
  osot_product_additional_info?: string;

  // ========================================
  // PRICING FIELDS (16 fields)
  // ========================================

  /**
   * General/public price
   * Optional
   * Fallback price when no category-specific price is set
   */
  osot_general_price?: number;

  /**
   * Price for OT-STU category (OT Student)
   * Optional
   */
  osot_otstu_price?: number;

  /**
   * Price for OT-NG category (OT New Graduate)
   * Optional
   */
  osot_otng_price?: number;

  /**
   * Price for OT-PR category (OT Practicing)
   * Optional
   */
  osot_otpr_price?: number;

  /**
   * Price for OT-NP category (OT Non-Practicing)
   * Optional
   */
  osot_otnp_price?: number;

  /**
   * Price for OT-RET category (OT Retired)
   * Optional
   */
  osot_otret_price?: number;

  /**
   * Price for OT-LIFE category (OT Lifetime)
   * Optional
   */
  osot_otlife_price?: number;

  /**
   * Price for OTA-STU category (OTA Student)
   * Optional
   */
  osot_otastu_price?: number;

  /**
   * Price for OTA-NG category (OTA New Graduate)
   * Optional
   */
  osot_otang_price?: number;

  /**
   * Price for OTA-NP category (OTA Non-Practicing)
   * Optional
   */
  osot_otanp_price?: number;

  /**
   * Price for OTA-RET category (OTA Retired)
   * Optional
   */
  osot_otaret_price?: number;

  /**
   * Price for OTA-PR category (OTA Practicing)
   * Optional
   */
  osot_otapr_price?: number;

  /**
   * Price for OTA-LIFE category (OTA Lifetime)
   * Optional
   */
  osot_otalife_price?: number;

  /**
   * Price for ASSOC category (Associate)
   * Optional
   */
  osot_assoc_price?: number;

  /**
   * Price for AFF-PRIM category (Affiliate Primary)
   * Optional
   */
  osot_affprim_price?: number;

  /**
   * Price for AFF-PREM category (Affiliate Premium)
   * Optional
   */
  osot_affprem_price?: number;

  // ========================================
  // OTHER FIELDS (3 fields)
  // ========================================

  /**
   * Inventory quantity
   * Optional
   * Range: 0 to 2,147,483,647
   * 0 = Unlimited/not tracked
   */
  osot_inventory?: number;

  /**
   * Shipping cost
   * Optional
   * Currency field
   */
  osot_shipping?: number;

  /**
   * Taxes percentage
   * Required
   * Decimal with 2 decimal places
   * Range: 0 to 100
   * Default: 13.0 (HST in Ontario)
   */
  osot_taxes: number;

  // ========================================
  // DATE FIELDS (2 fields)
  // ========================================

  /**
   * Product start date (date-only)
   * Optional
   * Defines when the product becomes available/active
   * If null, product has no start restriction
   * Used for time-limited promotions, seasonal products, or price variations
   */
  osot_start_date?: string;

  /**
   * Product end date (date-only)
   * Optional
   * Defines when the product becomes unavailable/inactive
   * If null, product has no end restriction
   * Used for time-limited promotions, seasonal products, or price variations
   * Business Rule: Must be >= osot_start_date if both are set
   */
  osot_end_date?: string;

  // ========================================
  // NEW FIELDS (3 fields)
  // ========================================

  /**
   * Active Membership Only flag
   * Optional (defaults to false)
   * When true, product can only be purchased by active members
   * Validation: Checks user's osot_active_member field in Account/Affiliate
   * Error: "Produto exclusivo para membros ativos"
   * Use case: Restrict products to active members only (frontend filter + backend validation)
   */
  osot_active_membership_only?: boolean;

  /**
   * Post Purchase Information
   * Optional
   * Max length: 4000 characters
   * Plain text content included in email receipts/confirmations
   * Use case: Additional information sent to customer after purchase
   * Examples: Instructions, thank you messages, next steps, delivery info
   */
  osot_post_purchase_info?: string;

  /**
   * Product Year
   * Required
   * Format: YYYY (4-digit year)
   * Pattern: ^\d{4}$
   * Use case: Administrative filtering and reporting by product year
   * Note: Independent from osot_start_date and osot_end_date
   * Examples: "2025", "2026"
   */
  osot_product_year: string;
}

/**
 * Helper type: All price field names
 * Useful for dynamic price access
 */
export type ProductPriceField =
  | 'osot_general_price'
  | 'osot_otstu_price'
  | 'osot_otng_price'
  | 'osot_otpr_price'
  | 'osot_otnp_price'
  | 'osot_otret_price'
  | 'osot_otlife_price'
  | 'osot_otastu_price'
  | 'osot_otang_price'
  | 'osot_otanp_price'
  | 'osot_otaret_price'
  | 'osot_otapr_price'
  | 'osot_otalife_price'
  | 'osot_assoc_price'
  | 'osot_affprim_price'
  | 'osot_affprem_price';

/**
 * Helper type: Product prices object
 * Structured representation of all prices
 */
export interface ProductPrices {
  general?: number;
  otStu?: number;
  otNg?: number;
  otPr?: number;
  otNp?: number;
  otRet?: number;
  otLife?: number;
  otaStu?: number;
  otaNg?: number;
  otaNp?: number;
  otaRet?: number;
  otaPr?: number;
  otaLife?: number;
  assoc?: number;
  affPrim?: number;
  affPrem?: number;
}
