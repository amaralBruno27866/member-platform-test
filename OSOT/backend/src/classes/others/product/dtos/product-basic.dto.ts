/**
 * Product Basic DTO
 *
 * Simplified Data Transfer Object for product list views.
 * Contains only essential fields for displaying products in lists.
 *
 * Features:
 * - Minimal product information
 * - Applicable price for user's category
 * - Stock status flags
 * - Display names for enums
 *
 * Use cases:
 * - Product list endpoints
 * - Search results
 * - Product selection dropdowns
 * - Mobile app list views
 */

// No enum imports needed - we return string labels only

/**
 * Product Basic DTO
 * Lightweight version for list views
 */
export class ProductBasicDto {
  // ========================================
  // IDENTIFIERS
  // ========================================

  /**
   * Internal product ID (GUID)
   */
  id?: string;

  /**
   * Business product ID (osot-prod-XXXXXXX)
   */
  productId?: string;

  /**
   * Product code (unique, uppercase)
   */
  productCode!: string;

  // ========================================
  // BASIC INFORMATION
  // ========================================

  /**
   * Product name
   */
  productName!: string;

  /**
   * Product category display name (e.g., "Insurance")
   */
  productCategory!: string;

  /**
   * Product status display name (e.g., "Available")
   */
  productStatus!: string;

  /**
   * Product picture URL
   */
  productPicture?: string;

  /**
   * Insurance Type display label (only for Insurance category products)
   * Example: "Professional", "General", "Corporative", "Property"
   */
  insuranceType?: string;

  /**
   * Insurance Limit (only for Insurance category products)
   * Example: 100000, 250000, 500000, 1000000
   */
  insuranceLimit?: number;

  // ========================================
  // PRICING
  // ========================================

  /**
   * Applicable price for the current user (based on their category)
   * Falls back to general price if category-specific price not set
   */
  applicablePrice?: number;

  /**
   * General/public price (fallback price)
   */
  generalPrice?: number;

  // ========================================
  // STOCK INFORMATION
  // ========================================

  /**
   * Is product in stock (inventory > 0 or unlimited)
   */
  inStock?: boolean;

  /**
   * Is inventory low (below threshold of 10)
   */
  lowStock?: boolean;

  /**
   * Current inventory quantity
   */
  inventory?: number;

  // ========================================
  // ACCESS CONTROL
  // ========================================

  /**
   * Access modifier display name (e.g., "Public")
   */
  accessModifiers?: string;

  // ========================================
  // NEW FIELDS
  // ========================================

  /**
   * Whether product is restricted to active members only
   */
  activeMembershipOnly?: boolean;

  /**
   * Product year (format: YYYY)
   */
  productYear!: string;
}
