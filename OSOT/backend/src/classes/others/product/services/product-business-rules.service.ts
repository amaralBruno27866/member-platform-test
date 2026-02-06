/**
 * Product Business Rules Service
 *
 * ESSENTIAL MODULES INTEGRATION:
 * - Membership Integration: Calculates prices based on membership category
 * - User Account Integration: Links Account/Affiliate to membership
 * - Business Validation: Status transitions, inventory, pricing rules
 * - Security: Purchase eligibility validation
 *
 * PRICE CALCULATION LOGIC:
 * 1. User NOT authenticated → osot_general_price
 * 2. User authenticated + Membership INACTIVE → osot_general_price
 * 3. User authenticated + Membership ACTIVE → Category-specific price (e.g., osot_otstu_price)
 *    - Falls back to osot_general_price if category price is null
 *
 * MEMBERSHIP VERIFICATION FLOW:
 * 1. Fetch user (Account or Affiliate)
 * 2. Check osot_active_member field
 * 3. If active, fetch MembershipCategory via lookup fields:
 *    - Account: osot_table_account
 *    - Affiliate: osot_table_account_affiliate
 * 4. Get osot_membership_category enum value
 * 5. Map to price field using CATEGORY_TO_PRICE_FIELD
 *
 * DEPENDENCIES:
 * - AccountLookupService: Find Account by ID
 * - AffiliateLookupService: Find Affiliate by ID
 * - MembershipCategoryLookupService: Find active membership category
 *
 * @file product-business-rules.service.ts
 * @module ProductModule
 * @layer Services
 * @since 2025-05-01
 */

import { Injectable, Logger } from '@nestjs/common';
import { ProductInternal } from '../interfaces/product-internal.interface';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductCategory } from '../enums/product-category.enum';
import { InsuranceType } from '../enums/insurance-type.enum';

/**
 * User type for price calculation
 */
export type UserType = 'account' | 'affiliate';

/**
 * User membership data from MembershipCategory
 */
export interface UserMembershipData {
  membershipCategory?: number; // 0-14 (Category enum)
  usersGroup?: number; // User group from membership
  membershipActive: boolean; // Whether membership is active for current year
}

/**
 * User account data (Account or Affiliate)
 */
export interface UserAccountData {
  accountStatus?: string | number; // Account status (can be string or number)
  activeMember: boolean;
  accountGroup?: string | number; // Only for Account, not Affiliate
  privilege?: string | number; // Privilege level
}

/**
 * Product exclusivity check result
 */
export interface ProductExclusivityResult {
  isExclusive: boolean;
  exclusiveCategory?: number; // Which category it's exclusive to (if any)
  exclusivePriceField?: string; // Which price field is the exclusive one
}

/**
 * Price calculation result
 */
export interface PriceCalculationResult {
  price: number | null;
  priceField: string;
  isGeneralPrice?: boolean;
  membershipActive?: boolean;
  userType?: UserType;
  userHasAccess: boolean; // Whether user can purchase this product
  isExclusive: boolean; // Whether product is exclusive to a category
  exclusiveCategory?: number; // Which category product is exclusive to
  exclusivePriceField?: string; // Which price field is exclusive
  userGroup?: string; // User's group (for future use)
  accountGroup?: string; // Account's group (for future use)
  membershipCategory?: number; // User's membership category (0-14)
}

/**
 * Product availability result
 */
export interface ProductAvailabilityResult {
  available: boolean;
  reason?: string;
  inventory?: number;
}

@Injectable()
export class ProductBusinessRulesService {
  private readonly logger = new Logger(ProductBusinessRulesService.name);

  constructor() {}

  // ========================================
  // PRICE CALCULATION
  // ========================================

  /**
   * Calculate price for user
   *
   * SIMPLIFIED: Always returns osot_general_price
   * Membership-based pricing removed temporarily
   *
   * @param product - Product with all price fields
   * @param userId - User business ID (Account or Affiliate)
   * @param userType - Type of user ('account' or 'affiliate')
   * @returns Price calculation result with general price
   */
  calculatePriceForUser(
    product: ProductInternal,
    userId?: string,
    userType?: UserType,
  ): PriceCalculationResult {
    // Check product exclusivity
    const exclusivity = this.checkProductExclusivity(product);

    // Always return general price for now
    // Authenticated users have access, unauthenticated don't
    const userHasAccess = !!userId;

    return {
      price: product.osot_general_price ?? null,
      priceField: 'osot_general_price',
      isGeneralPrice: true,
      membershipActive: false,
      userType,
      userHasAccess,
      isExclusive: exclusivity.isExclusive,
      exclusiveCategory: exclusivity.exclusiveCategory,
      exclusivePriceField: exclusivity.exclusivePriceField,
    };
  }

  /**
   * Check if product is exclusive to a specific membership category
   */
  private checkProductExclusivity(
    product: ProductInternal,
  ): ProductExclusivityResult {
    const priceFields = [
      { field: 'osot_category_0_price', category: 0 },
      { field: 'osot_category_1_price', category: 1 },
      { field: 'osot_category_2_price', category: 2 },
      { field: 'osot_category_3_price', category: 3 },
      { field: 'osot_category_4_price', category: 4 },
      { field: 'osot_category_5_price', category: 5 },
      { field: 'osot_category_6_price', category: 6 },
      { field: 'osot_category_7_price', category: 7 },
      { field: 'osot_category_8_price', category: 8 },
      { field: 'osot_category_9_price', category: 9 },
      { field: 'osot_category_10_price', category: 10 },
      { field: 'osot_category_11_price', category: 11 },
      { field: 'osot_category_12_price', category: 12 },
      { field: 'osot_category_13_price', category: 13 },
      { field: 'osot_category_14_price', category: 14 },
    ];

    const populatedPrices = priceFields.filter(
      (pf) => product[pf.field as keyof ProductInternal] != null,
    );

    if (populatedPrices.length === 1) {
      const exclusive = populatedPrices[0];
      return {
        isExclusive: true,
        exclusiveCategory: exclusive.category,
        exclusivePriceField: exclusive.field,
      };
    }

    return { isExclusive: false };
  }

  // ========================================
  // STATUS VALIDATION
  // ========================================

  /**
   * Validate status transition
   *
   * ALLOWED TRANSITIONS:
   * - DRAFT → AVAILABLE
   * - DRAFT → DISCONTINUED
   * - AVAILABLE → DISCONTINUED
   * - DISCONTINUED → AVAILABLE (reactivation)
   * - Any status → DRAFT (reset)
   *
   * @param currentStatus - Current product status
   * @param newStatus - Desired new status
   * @returns true if transition is valid
   */
  validateStatusTransition(
    currentStatus: ProductStatus,
    newStatus: ProductStatus,
  ): boolean {
    // Same status is always valid
    if (currentStatus === newStatus) {
      return true;
    }

    const validTransitions: Record<ProductStatus, ProductStatus[]> = {
      [ProductStatus.UNAVAILABLE]: [
        ProductStatus.AVAILABLE,
        ProductStatus.DRAFT,
      ],
      [ProductStatus.DRAFT]: [
        ProductStatus.AVAILABLE,
        ProductStatus.DISCONTINUED,
      ],
      [ProductStatus.AVAILABLE]: [
        ProductStatus.OUT_OF_STOCK,
        ProductStatus.DISCONTINUED,
        ProductStatus.DRAFT,
      ],
      [ProductStatus.DISCONTINUED]: [
        ProductStatus.AVAILABLE,
        ProductStatus.DRAFT,
      ],
      [ProductStatus.OUT_OF_STOCK]: [
        ProductStatus.AVAILABLE,
        ProductStatus.DISCONTINUED,
        ProductStatus.DRAFT,
      ],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  // ========================================
  // INSURANCE VALIDATION
  // ========================================

  /**
   * Validate insurance-specific fields for Insurance products
   *
   * BUSINESS RULE:
   * - If productCategory = INSURANCE (2), then:
   *   - insuranceType MUST be set (PROFESSIONAL=1, GENERAL=2, CORPORATIVE=3, PROPERTY=4)
   *   - insuranceLimit MUST be set and > 0
   * - If productCategory ≠ INSURANCE:
   *   - insuranceType and insuranceLimit are optional (ignored)
   *
   * @param product - Product to validate
   * @returns Object with isValid flag and error messages
   */
  validateInsuranceFields(product: Partial<ProductInternal>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Only validate if product category is INSURANCE
    if (product.osot_product_category !== ProductCategory.INSURANCE) {
      return { isValid: true, errors: [] };
    }

    // Insurance Type validation
    if (
      product.osot_insurance_type === undefined ||
      product.osot_insurance_type === null
    ) {
      errors.push(
        'Insurance Type is required for Insurance products. Must be PROFESSIONAL (1), GENERAL (2), CORPORATIVE (3), or PROPERTY (4)',
      );
    } else {
      // Validate it's a valid InsuranceType enum value
      const validTypes = Object.values(InsuranceType).filter(
        (v) => typeof v === 'number',
      );
      if (!validTypes.includes(product.osot_insurance_type as number)) {
        errors.push(
          `Invalid Insurance Type: ${product.osot_insurance_type}. Must be PROFESSIONAL (1), GENERAL (2), CORPORATIVE (3), or PROPERTY (4)`,
        );
      }
    }

    // Insurance Limit validation
    if (
      product.osot_insurance_limit === undefined ||
      product.osot_insurance_limit === null
    ) {
      errors.push(
        'Insurance Limit is required for Insurance products. Must be a number >= 0.00',
      );
    } else if (typeof product.osot_insurance_limit !== 'number') {
      errors.push('Insurance Limit must be a number');
    } else if (product.osot_insurance_limit < 0) {
      errors.push('Insurance Limit must be >= 0.00');
    } else if (product.osot_insurance_limit > 999999999.99) {
      errors.push('Insurance Limit must be <= 999,999,999.99');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // ========================================
  // INVENTORY VALIDATION
  // ========================================

  /**
   * Validate inventory for status
   *
   * RULES:
   * - AVAILABLE: inventory must be > 0
   * - OUT_OF_STOCK: inventory must be 0
   * - Other statuses: no inventory requirement
   *
   * @param status - Product status
   * @param inventory - Inventory count
   * @returns true if inventory is valid for status
   */
  validateInventoryForStatus(
    status: ProductStatus,
    inventory: number,
  ): boolean {
    if (status === ProductStatus.AVAILABLE && inventory <= 0) {
      return false;
    }

    if (status === ProductStatus.OUT_OF_STOCK && inventory > 0) {
      return false;
    }

    return true;
  }

  /**
   * Check if product has low stock
   *
   * @param inventory - Current inventory
   * @param threshold - Low stock threshold (default: 10)
   * @returns true if inventory is below threshold
   */
  isLowStock(inventory: number, threshold: number = 10): boolean {
    return inventory > 0 && inventory <= threshold;
  }

  // ========================================
  // PURCHASE ELIGIBILITY
  // ========================================

  /**
   * Check if user can purchase product
   *
   * REQUIREMENTS:
   * 1. User must be authenticated (userId provided)
   * 2. Product status must be AVAILABLE
   * 3. Product inventory must be > 0
   * 4. If product requires active membership, user must be active member
   *
   * @param product - Product to check
   * @param userId - User ID (null if not authenticated)
   * @param isActiveMember - Whether user is an active member (optional)
   * @returns Availability result with reason
   */
  canPurchase(
    product: ProductInternal,
    userId?: string,
    isActiveMember?: boolean,
  ): ProductAvailabilityResult {
    // Check 1: User authentication
    if (!userId) {
      return {
        available: false,
        reason: 'User must be authenticated to purchase products',
      };
    }

    // Check 2: Product status
    if (product.osot_product_status !== ProductStatus.AVAILABLE) {
      return {
        available: false,
        reason: `Product is ${product.osot_product_status}, not available for purchase`,
      };
    }

    // Check 3: Inventory
    if (product.osot_inventory <= 0) {
      return {
        available: false,
        reason: 'Product is out of stock',
        inventory: product.osot_inventory,
      };
    }

    // Check 4: Active membership requirement
    if (product.osot_active_membership_only === true) {
      if (isActiveMember === undefined) {
        // Cannot validate - caller should fetch user's active member status
        return {
          available: false,
          reason:
            'Cannot validate active membership requirement - please provide isActiveMember parameter',
        };
      }

      if (!isActiveMember) {
        return {
          available: false,
          reason: 'Produto exclusivo para membros ativos',
        };
      }
    }

    // All checks passed
    return {
      available: true,
      inventory: product.osot_inventory,
    };
  }

  /**
   * Check product availability (public - no user required)
   *
   * @param product - Product to check
   * @returns Availability result
   */
  checkAvailability(product: ProductInternal): ProductAvailabilityResult {
    if (product.osot_product_status !== ProductStatus.AVAILABLE) {
      return {
        available: false,
        reason: `Product is ${product.osot_product_status}`,
      };
    }

    if (product.osot_inventory <= 0) {
      return {
        available: false,
        reason: 'Product is out of stock',
        inventory: product.osot_inventory,
      };
    }

    return {
      available: true,
      inventory: product.osot_inventory,
    };
  }

  // ========================================
  // PRICE VALIDATION
  // ========================================

  /**
   * Validate that at least one price is set
   *
   * @param product - Product to validate
   * @returns true if at least one price field is set
   */
  hasAtLeastOnePrice(product: Partial<ProductInternal>): boolean {
    const priceFields = [
      'osot_general_price',
      'osot_otstu_price',
      'osot_otng_price',
      'osot_otpr_price',
      'osot_otnp_price',
      'osot_otret_price',
      'osot_otlife_price',
      'osot_otastu_price',
      'osot_otang_price',
      'osot_otanp_price',
      'osot_otaret_price',
      'osot_otapr_price',
      'osot_otalife_price',
      'osot_assoc_price',
      'osot_affprim_price',
      'osot_affprem_price',
    ];

    return priceFields.some((field) => {
      const value = product[field as keyof ProductInternal];
      return (
        value !== null &&
        value !== undefined &&
        typeof value === 'number' &&
        value >= 0
      );
    });
  }

  /**
   * Validate that general price is set when status is AVAILABLE
   *
   * @param status - Product status
   * @param generalPrice - General price value
   * @returns true if validation passes
   */
  validatePriceForAvailableStatus(
    status: ProductStatus,
    generalPrice?: number | null,
  ): boolean {
    if (status === ProductStatus.AVAILABLE) {
      return (
        generalPrice !== null && generalPrice !== undefined && generalPrice >= 0
      );
    }
    return true;
  }

  // ========================================
  // DATE VALIDATION
  // ========================================

  /**
   * Validate date range consistency
   *
   * Business Rule: If both dates are provided, end date must be >= start date
   *
   * @param startDate - Product start date (ISO string YYYY-MM-DD)
   * @param endDate - Product end date (ISO string YYYY-MM-DD)
   * @returns true if validation passes
   */
  validateDateRange(startDate?: string, endDate?: string): boolean {
    // If either date is missing, no validation needed
    if (!startDate || !endDate) {
      return true;
    }

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        this.logger.warn('Invalid date format in date range validation');
        return false;
      }

      // Normalize to date-only comparison (ignore time)
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      // End date must be >= start date
      return end >= start;
    } catch (error) {
      this.logger.error('Error validating date range:', error);
      return false;
    }
  }

  /**
   * Check if product is currently active based on date range
   *
   * Logic:
   * - No dates: always active
   * - Only start date: active if current date >= start date
   * - Only end date: active if current date <= end date
   * - Both dates: active if current date is within [start, end]
   *
   * @param product - Product to check
   * @param referenceDate - Optional reference date (defaults to today)
   * @returns true if product is active on the reference date
   */
  isProductActiveByDate(
    product: ProductInternal,
    referenceDate?: Date,
  ): boolean {
    const now = referenceDate || new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day

    const hasStartDate = !!product.osot_start_date;
    const hasEndDate = !!product.osot_end_date;

    // No date restrictions - always active
    if (!hasStartDate && !hasEndDate) {
      return true;
    }

    try {
      // Parse dates
      const startDate = hasStartDate ? new Date(product.osot_start_date) : null;
      const endDate = hasEndDate ? new Date(product.osot_end_date) : null;

      // Normalize parsed dates
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(0, 0, 0, 0);

      // Only start date - active from start date onwards
      if (hasStartDate && !hasEndDate && startDate) {
        return now >= startDate;
      }

      // Only end date - active until end date
      if (!hasStartDate && hasEndDate && endDate) {
        return now <= endDate;
      }

      // Both dates - active within range
      if (startDate && endDate) {
        return now >= startDate && now <= endDate;
      }

      return false;
    } catch (error) {
      this.logger.error('Error checking product active status by date:', error);
      // On error, consider product active (fail-open for availability)
      return true;
    }
  }

  /**
   * Build OData filter string for products active on a specific date
   *
   * OData Logic:
   * (osot_start_date eq null or osot_start_date le {date}) and
   * (osot_end_date eq null or osot_end_date ge {date})
   *
   * @param referenceDate - Date to check (defaults to today)
   * @returns OData filter string
   */
  buildActiveDateFilter(referenceDate?: Date): string {
    const date = referenceDate || new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    // Products are active if:
    // 1. No start date OR start date <= reference date
    // 2. AND no end date OR end date >= reference date
    return (
      `(osot_start_date eq null or osot_start_date le ${dateStr}) and ` +
      `(osot_end_date eq null or osot_end_date ge ${dateStr})`
    );
  }
}
