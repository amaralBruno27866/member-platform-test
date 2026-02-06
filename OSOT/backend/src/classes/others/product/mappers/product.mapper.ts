/**
 * Product Mapper
 *
 * Handles transformations between different Product representations:
 * - Dataverse ↔ Internal (OData field names)
 * - Internal → Response DTO (adds computed fields, display names)
 * - Create/Update DTO → Internal (validation → business logic)
 *
 * @file product.mapper.ts
 * @module ProductModule
 * @layer Mappers
 * @since 2025-05-01
 */

import { Injectable } from '@nestjs/common';
import { ProductInternal, ProductDataverse } from '../interfaces';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  ProductPricesDto,
  ProductBasicDto,
} from '../dtos';
import { CATEGORY_TO_PRICE_FIELD, INVENTORY_RULES } from '../constants';
import { ProductCategory, ProductStatus, ProductGLCode } from '../enums';
import { ProductUserType } from '../enums/product-user-type.enum';
import { InsuranceType } from '../enums/insurance-type.enum';
import {
  AccessModifier,
  getAccessModifierDisplayName,
  Privilege,
  getPrivilegeDisplayName,
} from '../../../../common/enums';

/**
 * Product Mapper Service
 */
@Injectable()
export class ProductMapper {
  // ========================================
  // DATAVERSE ↔ INTERNAL
  // ========================================

  /**
   * Map Dataverse OData response to Internal representation
   *
   * @param dataverse - Raw OData response from Dataverse
   * @returns ProductInternal
   */
  mapDataverseToInternal(dataverse: ProductDataverse): ProductInternal {
    return {
      // Identifiers
      osot_table_productid: dataverse.osot_table_productid,
      osot_productid: dataverse.osot_productid,
      osot_product_code: dataverse.osot_product_code,
      organizationGuid: dataverse._osot_table_organization_value,

      // Basic Information
      osot_product_name: dataverse.osot_product_name,
      osot_product_description: dataverse.osot_product_description,
      osot_product_category: dataverse.osot_product_category,
      osot_product_picture: dataverse.osot_product_picture,
      osot_insurance_type: dataverse.osot_insurance_type,
      osot_insurance_limit: dataverse.osot_insurance_limit,

      // Control Fields
      osot_product_status: dataverse.osot_product_status,
      osot_product_gl_code: dataverse.osot_product_gl_code,
      osot_privilege: dataverse.osot_privilege,
      osot_user_type: dataverse.osot_user_type,
      osot_access_modifiers: dataverse.osot_access_modifiers,
      osot_product_additional_info: dataverse.osot_product_additional_info,

      // Prices (16 fields - lowercase)
      osot_general_price: dataverse.osot_general_price,
      osot_otstu_price: dataverse.osot_otstu_price,
      osot_otng_price: dataverse.osot_otng_price,
      osot_otpr_price: dataverse.osot_otpr_price,
      osot_otnp_price: dataverse.osot_otnp_price,
      osot_otret_price: dataverse.osot_otret_price,
      osot_otlife_price: dataverse.osot_otlife_price,
      osot_otastu_price: dataverse.osot_otastu_price,
      osot_otang_price: dataverse.osot_otang_price,
      osot_otanp_price: dataverse.osot_otanp_price,
      osot_otaret_price: dataverse.osot_otaret_price,
      osot_otapr_price: dataverse.osot_otapr_price,
      osot_otalife_price: dataverse.osot_otalife_price,
      osot_assoc_price: dataverse.osot_assoc_price,
      osot_affprim_price: dataverse.osot_affprim_price,
      osot_affprem_price: dataverse.osot_affprem_price,

      // Other Fields
      osot_inventory: dataverse.osot_inventory,
      osot_shipping: dataverse.osot_shipping,
      osot_taxes: dataverse.osot_taxes,

      // Date Fields
      osot_start_date: dataverse.osot_start_date,
      osot_end_date: dataverse.osot_end_date,

      // New Fields
      osot_active_membership_only: dataverse.osot_active_membership_only,
      osot_post_purchase_info: dataverse.osot_post_purchase_info,
      osot_product_year: dataverse.osot_product_year,
    };
  }

  /**
   * Map Internal representation to Dataverse OData format
   *
   * @param internal - Internal Product representation
   * @returns Partial ProductDataverse for create/update operations
   */
  mapInternalToDataverse(
    internal: Partial<ProductInternal>,
  ): Partial<ProductDataverse> {
    const dataverse: Partial<ProductDataverse> = {};

    // Only map fields that are present (exclude undefined)
    if (internal.osot_product_code !== undefined)
      dataverse.osot_product_code = internal.osot_product_code;
    if (internal.osot_product_name !== undefined)
      dataverse.osot_product_name = internal.osot_product_name;
    if (internal.osot_product_description !== undefined)
      dataverse.osot_product_description = internal.osot_product_description;
    if (internal.osot_product_category !== undefined)
      dataverse.osot_product_category = internal.osot_product_category;
    if (internal.osot_product_picture !== undefined)
      dataverse.osot_product_picture = internal.osot_product_picture;
    if (internal.osot_insurance_type !== undefined)
      dataverse.osot_insurance_type = internal.osot_insurance_type;
    if (internal.osot_insurance_limit !== undefined)
      dataverse.osot_insurance_limit = internal.osot_insurance_limit;

    if (internal.osot_product_status !== undefined)
      dataverse.osot_product_status = internal.osot_product_status;
    if (internal.osot_product_gl_code !== undefined)
      dataverse.osot_product_gl_code = internal.osot_product_gl_code;
    if (internal.osot_privilege !== undefined)
      dataverse.osot_privilege = internal.osot_privilege;
    if (internal.osot_user_type !== undefined)
      dataverse.osot_user_type = internal.osot_user_type;
    if (internal.osot_access_modifiers !== undefined)
      dataverse.osot_access_modifiers = internal.osot_access_modifiers;
    if (internal.osot_product_additional_info !== undefined)
      dataverse.osot_product_additional_info =
        internal.osot_product_additional_info;

    // Prices (lowercase)
    if (internal.osot_general_price !== undefined)
      dataverse.osot_general_price = internal.osot_general_price;
    if (internal.osot_otstu_price !== undefined)
      dataverse.osot_otstu_price = internal.osot_otstu_price;
    if (internal.osot_otng_price !== undefined)
      dataverse.osot_otng_price = internal.osot_otng_price;
    if (internal.osot_otpr_price !== undefined)
      dataverse.osot_otpr_price = internal.osot_otpr_price;
    if (internal.osot_otnp_price !== undefined)
      dataverse.osot_otnp_price = internal.osot_otnp_price;
    if (internal.osot_otret_price !== undefined)
      dataverse.osot_otret_price = internal.osot_otret_price;
    if (internal.osot_otlife_price !== undefined)
      dataverse.osot_otlife_price = internal.osot_otlife_price;
    if (internal.osot_otastu_price !== undefined)
      dataverse.osot_otastu_price = internal.osot_otastu_price;
    if (internal.osot_otang_price !== undefined)
      dataverse.osot_otang_price = internal.osot_otang_price;
    if (internal.osot_otanp_price !== undefined)
      dataverse.osot_otanp_price = internal.osot_otanp_price;
    if (internal.osot_otaret_price !== undefined)
      dataverse.osot_otaret_price = internal.osot_otaret_price;
    if (internal.osot_otapr_price !== undefined)
      dataverse.osot_otapr_price = internal.osot_otapr_price;
    if (internal.osot_otalife_price !== undefined)
      dataverse.osot_otalife_price = internal.osot_otalife_price;
    if (internal.osot_assoc_price !== undefined)
      dataverse.osot_assoc_price = internal.osot_assoc_price;
    if (internal.osot_affprim_price !== undefined)
      dataverse.osot_affprim_price = internal.osot_affprim_price;
    if (internal.osot_affprem_price !== undefined)
      dataverse.osot_affprem_price = internal.osot_affprem_price;

    // Other Fields
    if (internal.osot_inventory !== undefined)
      dataverse.osot_inventory = internal.osot_inventory;
    if (internal.osot_shipping !== undefined)
      dataverse.osot_shipping = internal.osot_shipping;
    if (internal.osot_taxes !== undefined)
      dataverse.osot_taxes = internal.osot_taxes;

    // Date Fields
    if (internal.osot_start_date !== undefined)
      dataverse.osot_start_date = internal.osot_start_date;
    if (internal.osot_end_date !== undefined)
      dataverse.osot_end_date = internal.osot_end_date;

    // New Fields
    if (internal.osot_active_membership_only !== undefined)
      dataverse.osot_active_membership_only =
        internal.osot_active_membership_only;
    if (internal.osot_post_purchase_info !== undefined)
      dataverse.osot_post_purchase_info = internal.osot_post_purchase_info;
    if (internal.osot_product_year !== undefined)
      dataverse.osot_product_year = internal.osot_product_year;
    if (internal.organizationGuid)
      dataverse['osot_Table_Organization@odata.bind'] =
        `/osot_table_organizations(${internal.organizationGuid})`;

    return dataverse;
  }

  // ========================================
  // DTO → INTERNAL
  // ========================================

  /**
   * Map CreateProductDto to Internal representation
   *
   * @param dto - Create Product DTO from API
   * @returns ProductInternal (without IDs - generated by Dataverse)
   */
  mapCreateDtoToInternal(
    dto: CreateProductDto,
  ): Omit<ProductInternal, 'osot_table_productid' | 'osot_productid'> {
    return {
      // Basic Information
      osot_product_code: dto.productCode,
      osot_product_name: dto.productName,
      osot_product_description: dto.productDescription,
      osot_product_category: dto.productCategory,
      osot_product_picture: dto.productPicture,
      osot_insurance_type: dto.insuranceType,
      osot_insurance_limit: dto.insuranceLimit,

      // Control Fields
      osot_product_status: dto.productStatus,
      osot_product_gl_code: dto.productGlCode,
      osot_privilege: dto.privilege,
      osot_user_type: dto.userType,
      osot_access_modifiers: dto.accessModifiers,
      osot_product_additional_info: dto.productAdditionalInfo,

      // Prices (lowercase in internal, camelCase in DTO)
      osot_general_price: dto.generalPrice,
      osot_otstu_price: dto.otStuPrice,
      osot_otng_price: dto.otNgPrice,
      osot_otpr_price: dto.otPrPrice,
      osot_otnp_price: dto.otNpPrice,
      osot_otret_price: dto.otRetPrice,
      osot_otlife_price: dto.otLifePrice,
      osot_otastu_price: dto.otaStuPrice,
      osot_otang_price: dto.otaNgPrice,
      osot_otanp_price: dto.otaNpPrice,
      osot_otaret_price: dto.otaRetPrice,
      osot_otapr_price: dto.otaPrPrice,
      osot_otalife_price: dto.otaLifePrice,
      osot_assoc_price: dto.assocPrice,
      osot_affprim_price: dto.affPrimPrice,
      osot_affprem_price: dto.affPremPrice,

      // Other Fields
      osot_inventory: dto.inventory,
      osot_shipping: dto.shipping,
      osot_taxes: dto.taxes,

      // Date Fields
      osot_start_date: dto.startDate,
      osot_end_date: dto.endDate,

      // New Fields
      osot_active_membership_only: dto.activeMembershipOnly,
      osot_post_purchase_info: dto.postPurchaseInfo,
      osot_product_year: dto.productYear,
    };
  }

  /**
   * Map UpdateProductDto to Internal representation
   *
   * @param dto - Update Product DTO from API
   * @returns Partial ProductInternal
   */
  mapUpdateDtoToInternal(dto: UpdateProductDto): Partial<ProductInternal> {
    const internal: Partial<ProductInternal> = {};

    // Only map fields that are present
    if (dto.productCode !== undefined)
      internal.osot_product_code = dto.productCode;
    if (dto.productName !== undefined)
      internal.osot_product_name = dto.productName;
    if (dto.productDescription !== undefined)
      internal.osot_product_description = dto.productDescription;
    if (dto.productCategory !== undefined)
      internal.osot_product_category = dto.productCategory;
    if (dto.productPicture !== undefined)
      internal.osot_product_picture = dto.productPicture;
    if (dto.insuranceType !== undefined)
      internal.osot_insurance_type = dto.insuranceType;
    if (dto.insuranceLimit !== undefined)
      internal.osot_insurance_limit = dto.insuranceLimit;

    if (dto.productStatus !== undefined)
      internal.osot_product_status = dto.productStatus;
    if (dto.productGlCode !== undefined)
      internal.osot_product_gl_code = dto.productGlCode;
    if (dto.privilege !== undefined) internal.osot_privilege = dto.privilege;
    if (dto.userType !== undefined) internal.osot_user_type = dto.userType;
    if (dto.accessModifiers !== undefined)
      internal.osot_access_modifiers = dto.accessModifiers;
    if (dto.productAdditionalInfo !== undefined)
      internal.osot_product_additional_info = dto.productAdditionalInfo;

    // Prices
    if (dto.generalPrice !== undefined)
      internal.osot_general_price = dto.generalPrice;
    if (dto.otStuPrice !== undefined)
      internal.osot_otstu_price = dto.otStuPrice;
    if (dto.otNgPrice !== undefined) internal.osot_otng_price = dto.otNgPrice;
    if (dto.otPrPrice !== undefined) internal.osot_otpr_price = dto.otPrPrice;
    if (dto.otNpPrice !== undefined) internal.osot_otnp_price = dto.otNpPrice;
    if (dto.otRetPrice !== undefined)
      internal.osot_otret_price = dto.otRetPrice;
    if (dto.otLifePrice !== undefined)
      internal.osot_otlife_price = dto.otLifePrice;
    if (dto.otaStuPrice !== undefined)
      internal.osot_otastu_price = dto.otaStuPrice;
    if (dto.otaNgPrice !== undefined)
      internal.osot_otang_price = dto.otaNgPrice;
    if (dto.otaNpPrice !== undefined)
      internal.osot_otanp_price = dto.otaNpPrice;
    if (dto.otaRetPrice !== undefined)
      internal.osot_otaret_price = dto.otaRetPrice;
    if (dto.otaPrPrice !== undefined)
      internal.osot_otapr_price = dto.otaPrPrice;
    if (dto.otaLifePrice !== undefined)
      internal.osot_otalife_price = dto.otaLifePrice;
    if (dto.assocPrice !== undefined)
      internal.osot_assoc_price = dto.assocPrice;
    if (dto.affPrimPrice !== undefined)
      internal.osot_affprim_price = dto.affPrimPrice;
    if (dto.affPremPrice !== undefined)
      internal.osot_affprem_price = dto.affPremPrice;

    // Other Fields
    if (dto.inventory !== undefined) internal.osot_inventory = dto.inventory;
    if (dto.shipping !== undefined) internal.osot_shipping = dto.shipping;
    if (dto.taxes !== undefined) internal.osot_taxes = dto.taxes;

    // Date Fields
    if (dto.startDate !== undefined) internal.osot_start_date = dto.startDate;
    if (dto.endDate !== undefined) internal.osot_end_date = dto.endDate;

    // New Fields
    if (dto.activeMembershipOnly !== undefined)
      internal.osot_active_membership_only = dto.activeMembershipOnly;
    if (dto.postPurchaseInfo !== undefined)
      internal.osot_post_purchase_info = dto.postPurchaseInfo;
    if (dto.productYear !== undefined)
      internal.osot_product_year = dto.productYear;

    return internal;
  }

  // ========================================
  // INTERNAL → RESPONSE DTOs
  // ========================================

  /**
   * Map Internal to ProductResponseDto
   *
   * @param internal - Internal Product representation
   * @param userCategory - Optional user category for applicable price calculation
   * @returns ProductResponseDto with computed fields
   */
  mapInternalToResponseDto(
    internal: ProductInternal,
    userCategory?: ProductCategory,
  ): ProductResponseDto {
    const prices = this.extractPricesObject(internal);
    const applicablePrice = userCategory
      ? this.getPriceForCategory(internal, userCategory)
      : internal.osot_general_price;

    const response = new ProductResponseDto();

    // Identifiers
    response.id = internal.osot_table_productid;
    response.productId = internal.osot_productid;
    response.productCode = internal.osot_product_code!;

    // Basic Information
    response.productName = internal.osot_product_name!;
    response.productDescription = internal.osot_product_description!;
    response.productCategory = this.getProductCategoryName(
      internal.osot_product_category,
    )!;
    response.productPicture = internal.osot_product_picture;
    response.insuranceType = this.getInsuranceTypeName(
      internal.osot_insurance_type,
    );
    response.insuranceLimit = internal.osot_insurance_limit;

    // Control Fields
    response.productStatus = this.getProductStatusName(
      internal.osot_product_status,
    )!;
    response.productGlCode = this.getProductGLCodeName(
      internal.osot_product_gl_code,
    )!;
    response.privilege = this.getPrivilegeName(internal.osot_privilege);
    response.userType = this.getUserTypeName(internal.osot_user_type);
    response.accessModifiers = this.getAccessModifiersName(
      internal.osot_access_modifiers,
    );
    response.productAdditionalInfo = internal.osot_product_additional_info;

    // Pricing
    response.prices = prices;
    response.applicablePrice = applicablePrice;

    // Other Fields
    response.inventory = internal.osot_inventory;
    response.shipping = internal.osot_shipping ?? 0; // Default to 0 if null
    response.taxes = internal.osot_taxes!;

    // Date Fields
    response.startDate = internal.osot_start_date;
    response.endDate = internal.osot_end_date;

    // New Fields
    response.activeMembershipOnly = internal.osot_active_membership_only;
    response.postPurchaseInfo = internal.osot_post_purchase_info;
    response.productYear = internal.osot_product_year!;

    // Computed Fields
    response.inStock = this.isInStock(internal);
    response.lowStock = this.isLowStock(internal);
    response.totalPrice = this.calculateTotalPrice(
      applicablePrice || 0,
      internal.osot_taxes || 0,
      internal.osot_shipping || 0,
    );
    response.isActive = this.isProductActive(internal);

    return response;
  }

  /**
   * Map Internal to ProductBasicDto (lightweight version)
   *
   * @param internal - Internal Product representation
   * @param userCategory - Optional user category for applicable price
   * @returns ProductBasicDto
   */
  mapInternalToBasicDto(
    internal: ProductInternal,
    userCategory?: ProductCategory,
  ): ProductBasicDto {
    const basic = new ProductBasicDto();

    basic.id = internal.osot_table_productid;
    basic.productId = internal.osot_productid;
    basic.productCode = internal.osot_product_code!;
    basic.productName = internal.osot_product_name!;
    basic.productCategory = this.getProductCategoryName(
      internal.osot_product_category,
    );
    basic.productStatus = this.getProductStatusName(
      internal.osot_product_status,
    );
    basic.productPicture = internal.osot_product_picture;

    basic.applicablePrice = userCategory
      ? this.getPriceForCategory(internal, userCategory)
      : internal.osot_general_price;
    basic.generalPrice = internal.osot_general_price;

    basic.inStock = this.isInStock(internal);
    basic.lowStock = this.isLowStock(internal);
    basic.inventory = internal.osot_inventory;
    basic.accessModifiers = this.getAccessModifiersName(
      internal.osot_access_modifiers,
    );

    // New Fields
    basic.activeMembershipOnly = internal.osot_active_membership_only;
    basic.productYear = internal.osot_product_year!;

    return basic;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Extract prices into structured ProductPricesDto object
   * Includes all defined prices, including $0.00 (free products for certain categories)
   */
  private extractPricesObject(internal: ProductInternal): ProductPricesDto {
    const prices = new ProductPricesDto();

    // Add all prices that are defined (including 0 for free products)
    if (
      internal.osot_general_price != null &&
      internal.osot_general_price >= 0
    ) {
      prices.general = internal.osot_general_price;
    }
    if (internal.osot_otstu_price != null && internal.osot_otstu_price >= 0) {
      prices.otStu = internal.osot_otstu_price;
    }
    if (internal.osot_otng_price != null && internal.osot_otng_price >= 0) {
      prices.otNg = internal.osot_otng_price;
    }
    if (internal.osot_otpr_price != null && internal.osot_otpr_price >= 0) {
      prices.otPr = internal.osot_otpr_price;
    }
    if (internal.osot_otnp_price != null && internal.osot_otnp_price >= 0) {
      prices.otNp = internal.osot_otnp_price;
    }
    if (internal.osot_otret_price != null && internal.osot_otret_price >= 0) {
      prices.otRet = internal.osot_otret_price;
    }
    if (internal.osot_otlife_price != null && internal.osot_otlife_price >= 0) {
      prices.otLife = internal.osot_otlife_price;
    }
    if (internal.osot_otastu_price != null && internal.osot_otastu_price >= 0) {
      prices.otaStu = internal.osot_otastu_price;
    }
    if (internal.osot_otang_price != null && internal.osot_otang_price >= 0) {
      prices.otaNg = internal.osot_otang_price;
    }
    if (internal.osot_otanp_price != null && internal.osot_otanp_price >= 0) {
      prices.otaNp = internal.osot_otanp_price;
    }
    if (internal.osot_otaret_price != null && internal.osot_otaret_price >= 0) {
      prices.otaRet = internal.osot_otaret_price;
    }
    if (internal.osot_otapr_price != null && internal.osot_otapr_price >= 0) {
      prices.otaPr = internal.osot_otapr_price;
    }
    if (
      internal.osot_otalife_price != null &&
      internal.osot_otalife_price >= 0
    ) {
      prices.otaLife = internal.osot_otalife_price;
    }
    if (internal.osot_assoc_price != null && internal.osot_assoc_price >= 0) {
      prices.assoc = internal.osot_assoc_price;
    }
    if (
      internal.osot_affprim_price != null &&
      internal.osot_affprim_price >= 0
    ) {
      prices.affPrim = internal.osot_affprim_price;
    }
    if (
      internal.osot_affprem_price != null &&
      internal.osot_affprem_price >= 0
    ) {
      prices.affPrem = internal.osot_affprem_price;
    }

    return prices;
  }

  /**
   * Get price for specific category with fallback to general price
   *
   * @param product - Product with price fields
   * @param category - User's membership category
   * @returns Price for category or general price
   */
  getPriceForCategory(
    product: ProductInternal,
    category: ProductCategory,
  ): number | undefined {
    // Map category to price field name (constants use UPPERCASE)
    const priceFieldConstant = CATEGORY_TO_PRICE_FIELD[category];
    if (!priceFieldConstant) {
      return product.osot_general_price;
    }

    // Convert UPPERCASE constant to lowercase field name
    const priceField = priceFieldConstant.toLowerCase();
    const fieldKey = `osot_${priceField}` as keyof ProductInternal;

    const categoryPrice = product[fieldKey] as number | undefined;

    // Fallback to general price if category-specific price not set
    return categoryPrice ?? product.osot_general_price;
  }

  /**
   * Calculate total price including tax and shipping
   */
  private calculateTotalPrice(
    price: number,
    taxPercentage: number,
    shipping: number,
  ): number {
    const taxAmount = price * (taxPercentage / 100);
    return price + taxAmount + shipping;
  }

  /**
   * Check if product is in stock
   */
  private isInStock(product: ProductInternal): boolean {
    // If inventory is undefined or null, assume unlimited stock
    if (product.osot_inventory === undefined || product.osot_inventory === null)
      return true;

    return product.osot_inventory > 0;
  }

  /**
   * Check if inventory is low (below threshold)
   */
  private isLowStock(product: ProductInternal): boolean {
    if (product.osot_inventory === undefined || product.osot_inventory === null)
      return false;

    return (
      product.osot_inventory > 0 &&
      product.osot_inventory <= INVENTORY_RULES.LOW_STOCK_THRESHOLD
    );
  }

  /**
   * Check if product is currently active based on date range
   *
   * Logic:
   * - No dates set: always active
   * - Only start date: active if current date >= start date
   * - Only end date: active if current date <= end date
   * - Both dates: active if current date is within range [start, end]
   */
  private isProductActive(product: ProductInternal): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to start of day for date-only comparison

    const hasStartDate = !!product.osot_start_date;
    const hasEndDate = !!product.osot_end_date;

    // No date restrictions - always active
    if (!hasStartDate && !hasEndDate) {
      return true;
    }

    // Parse dates
    const startDate = hasStartDate ? new Date(product.osot_start_date) : null;
    const endDate = hasEndDate ? new Date(product.osot_end_date) : null;

    // Normalize parsed dates to start of day
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
  }

  /**
   * Get display name for InsuranceType enum
   */
  private getInsuranceTypeName(
    insuranceType?: InsuranceType,
  ): string | undefined {
    if (insuranceType === undefined) return undefined;

    const names: Record<InsuranceType, string> = {
      [InsuranceType.PROFESSIONAL]: 'Professional',
      [InsuranceType.GENERAL]: 'General',
      [InsuranceType.CORPORATIVE]: 'Corporative',
      [InsuranceType.PROPERTY]: 'Property',
    };
    return names[insuranceType] || 'Unknown';
  }

  /**
   * Get display name for ProductCategory enum
   */
  private getProductCategoryName(category?: ProductCategory): string {
    if (category === undefined) return 'Unknown';

    const names: Record<ProductCategory, string> = {
      [ProductCategory.MEMBERSHIP]: 'Membership',
      [ProductCategory.INSURANCE]: 'Insurance',
      [ProductCategory.PROMOTIONAL]: 'Promotional',
      [ProductCategory.ADVERTISING]: 'Advertising',
      [ProductCategory.EVENT]: 'Event',
      [ProductCategory.CONFERENCE]: 'Conference',
      [ProductCategory.ARCHIVED_WEBINAR]: 'Archived Webinar',
      [ProductCategory.CAREERS]: 'Careers',
      [ProductCategory.GENERAL]: 'General',
      [ProductCategory.MEMBERS_BENEFITS]: 'Members Benefits',
      [ProductCategory.DONATIONS]: 'Donations',
    };
    return names[category] || 'Unknown';
  }

  /**
   * Get display name for ProductStatus enum
   */
  private getProductStatusName(status?: ProductStatus): string {
    if (status === undefined) return 'Unknown';

    const names: Record<ProductStatus, string> = {
      [ProductStatus.UNAVAILABLE]: 'Unavailable',
      [ProductStatus.AVAILABLE]: 'Available',
      [ProductStatus.DISCONTINUED]: 'Discontinued',
      [ProductStatus.DRAFT]: 'Draft',
      [ProductStatus.OUT_OF_STOCK]: 'Out of Stock',
    };
    return names[status] || 'Unknown';
  }

  /**
   * Get display name for ProductGLCode enum
   */
  private getProductGLCodeName(code?: ProductGLCode): string {
    if (code === undefined) return 'Unknown';

    const names: Record<ProductGLCode, string> = {
      [ProductGLCode.BANK_ACCOUNT_1030]: 'Bank Account 1030',
      [ProductGLCode.HST_COLLECTED_ON_SALES_2036]:
        'HST Collected on Sales 2036',
      [ProductGLCode.PROFESSIONAL_INSURANCE_2050]:
        'Professional Insurance 2050',
      [ProductGLCode.PRE_PAID_MEMBERSHIP_FEES_2081]:
        'Pre-paid Membership Fees 2081',
      [ProductGLCode.PRE_PAID_IN_PERSON_EVENT_2082]:
        'Pre-paid In Person Event 2082',
      [ProductGLCode.PRE_PAID_PROFESSIONAL_INSURANCE_2085]:
        'Pre-paid Professional Insurance 2085',
      [ProductGLCode.PRE_PAID_CONFERENCE_2086]: 'Pre-paid Conference 2086',
      [ProductGLCode.PRE_PAID_WORKSHOPS_AND_WEBINARS_2091]:
        'Pre-paid Workshops and Webinars 2091',
      [ProductGLCode.OSOTRF_DONATIONS_2800]: 'OSOTRF Donations 2800',
      [ProductGLCode.MEMBERSHIP_FEE_4100]: 'Membership Fee 4100',
      [ProductGLCode.ADVERTISING_INCOME_4200]: 'Advertising Income 4200',
      [ProductGLCode.IN_PERSON_EVENT_4440]: 'In Person Event 4440',
      [ProductGLCode.CONFERENCE_4450]: 'Conference 4450',
      [ProductGLCode.GROUP_ACCIDENT_INSURANCE_4550]:
        'Group Accident Insurance 4550',
      [ProductGLCode.WORKSHOPS_AND_WEBINARS_4475]:
        'Workshops and Webinars 4475',
      [ProductGLCode.ARCHIVED_WEBINARS_4480]: 'Archived Webinars 4480',
      [ProductGLCode.PR_GENERAL_4900]: 'PR General 4900',
      [ProductGLCode.MOCA_5946]: 'MOCA 5946',
    };
    return names[code] || 'Unknown';
  }

  /**
   * Get display name for access modifiers
   */
  private getAccessModifiersName(modifier?: number): string | undefined {
    if (modifier === undefined) return undefined;
    return getAccessModifierDisplayName(modifier as AccessModifier);
  }

  /**
   * Get display name for privilege
   */
  private getPrivilegeName(privilege?: Privilege): string | undefined {
    if (privilege === undefined) return undefined;
    return getPrivilegeDisplayName(privilege);
  }

  /**
   * Get display name for user type
   */
  private getUserTypeName(userType?: ProductUserType): string | undefined {
    if (userType === undefined) return undefined;

    switch (userType) {
      case ProductUserType.OT_OTA:
        return 'OT/OTA';
      case ProductUserType.AFFILIATE:
        return 'Affiliate';
      case ProductUserType.BOTH:
        return 'Both (All Users)';
      default:
        return 'Unknown User Type';
    }
  }
}
