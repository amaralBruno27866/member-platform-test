/**
 * Order Product Mapper
 *
 * Bidirectional mapper for Order Product entity:
 * - DTO ↔ Internal (application model)
 * - Internal ↔ Dataverse (OData API model)
 * - Internal → Response DTO
 *
 * Architecture Notes:
 * - Handles @odata.bind for Order lookup (orderGuid)
 * - Converts Privilege/AccessModifier enums ↔ numbers
 * - Converts Date objects ↔ ISO 8601 strings
 * - Guards against undefined values to prevent eslint errors
 * - Product ID is a string reference (NOT lookup GUID)
 */

import { OrderProductInternal, OrderProductDataverse } from '../interfaces';
import {
  CreateOrderProductDto,
  UpdateOrderProductDto,
  OrderProductResponseDto,
} from '../dtos';
import { ORDER_PRODUCT_ODATA } from '../constants';
import { Privilege } from '../../../../common/enums/privilege.enum';
import { AccessModifier } from '../../../../common/enums/access-modifier.enum';

/**
 * Order Product Mapper
 */
export class OrderProductMapper {
  // ========================================
  // DTO → INTERNAL
  // ========================================

  /**
   * Map CreateOrderProductDto to Internal representation
   *
   * @param dto - Create Order Product DTO
   * @returns Order Product Internal
   */
  static mapCreateDtoToInternal(
    dto: CreateOrderProductDto,
  ): Partial<OrderProductInternal> {
    return {
      orderGuid: dto.orderGuid,
      osot_product_id: dto.osot_product_id,
      osot_product_name: dto.osot_product_name,
      osot_product_category: dto.osot_product_category,
      osot_insurance_type: dto.osot_insurance_type,
      osot_insurance_limit: dto.osot_insurance_limit,
      osot_product_additional_info: dto.osot_product_additional_info,
      osot_quantity: dto.osot_quantity,
      osot_selectedprice: dto.osot_selectedprice,
      osot_producttax: dto.osot_producttax,
      osot_taxamount: dto.osot_taxamount,
      osot_itemsubtotal: dto.osot_itemsubtotal,
      osot_itemtotal: dto.osot_itemtotal,
      osot_privilege: dto.osot_privilege,
      osot_access_modifiers: dto.osot_access_modifiers,
    };
  }

  /**
   * Map UpdateOrderProductDto to Internal representation (partial)
   *
   * @param dto - Update Order Product DTO
   * @returns Partial Order Product Internal (only updatable fields)
   */
  static mapUpdateDtoToInternal(
    dto: UpdateOrderProductDto,
  ): Partial<OrderProductInternal> {
    return {
      osot_privilege: dto.osot_privilege,
      osot_access_modifiers: dto.osot_access_modifiers,
    };
  }

  // ========================================
  // INTERNAL → DATAVERSE
  // ========================================

  /**
   * Map Internal to Dataverse format (for create/update)
   *
   * @param internal - Order Product Internal
   * @returns Dataverse payload
   */
  static mapInternalToDataverse(
    internal: Partial<OrderProductInternal>,
  ): Partial<OrderProductDataverse> {
    const dataverse: Partial<OrderProductDataverse> & {
      'osot_Order@odata.bind'?: string;
    } = {};

    // ========================================
    // RELATIONSHIP: Order Lookup
    // ========================================
    if (internal.orderGuid) {
      dataverse[ORDER_PRODUCT_ODATA.ORDER_BIND] =
        `/osot_table_orders(${internal.orderGuid})`;
    }

    // ========================================
    // PRODUCT SNAPSHOT FIELDS
    // ========================================
    if (internal.osot_product_id !== undefined) {
      dataverse.osot_product_id = internal.osot_product_id;
    }
    if (internal.osot_product_name !== undefined) {
      dataverse.osot_product_name = internal.osot_product_name;
    }
    if (internal.osot_product_category !== undefined) {
      dataverse.osot_product_category = internal.osot_product_category;
    }
    if (internal.osot_insurance_type !== undefined) {
      dataverse.osot_insurance_type = internal.osot_insurance_type;
    }
    if (internal.osot_insurance_limit !== undefined) {
      dataverse.osot_insurance_limit = internal.osot_insurance_limit;
    }
    if (internal.osot_product_additional_info !== undefined) {
      dataverse.osot_product_additional_info =
        internal.osot_product_additional_info;
    }

    // ========================================
    // QUANTITY & PRICING
    // ========================================
    if (internal.osot_quantity !== undefined) {
      dataverse.osot_quantity = internal.osot_quantity;
    }
    if (internal.osot_selectedprice !== undefined) {
      dataverse.osot_selectedprice = internal.osot_selectedprice;
    }
    if (internal.osot_producttax !== undefined) {
      dataverse.osot_producttax = internal.osot_producttax;
    }

    // ========================================
    // CALCULATED AMOUNTS
    // ========================================
    if (internal.osot_taxamount !== undefined) {
      dataverse.osot_taxamount = internal.osot_taxamount;
    }
    if (internal.osot_itemsubtotal !== undefined) {
      dataverse.osot_itemsubtotal = internal.osot_itemsubtotal;
    }
    if (internal.osot_itemtotal !== undefined) {
      dataverse.osot_itemtotal = internal.osot_itemtotal;
    }

    // ========================================
    // ACCESS CONTROL: Enum → Number
    // ========================================
    if (internal.osot_privilege !== undefined) {
      dataverse.osot_privilege = Number(internal.osot_privilege);
    }
    if (internal.osot_access_modifiers !== undefined) {
      dataverse.osot_access_modifiers = Number(internal.osot_access_modifiers);
    }

    return dataverse;
  }

  // ========================================
  // DATAVERSE → INTERNAL
  // ========================================

  /**
   * Map Dataverse to Internal representation
   *
   * @param dataverse - Dataverse entity
   * @returns Order Product Internal
   */
  static mapDataverseToInternal(
    dataverse: OrderProductDataverse,
  ): OrderProductInternal {
    return {
      // ========================================
      // SYSTEM FIELDS
      // ========================================
      osot_table_order_productid: dataverse.osot_table_order_productid ?? '',
      osot_orderproductid: dataverse.osot_orderproductid,
      createdon: dataverse.createdon
        ? new Date(dataverse.createdon)
        : undefined,
      modifiedon: dataverse.modifiedon
        ? new Date(dataverse.modifiedon)
        : undefined,
      ownerid: dataverse.ownerid,
      statecode: dataverse.statecode,
      statuscode: dataverse.statuscode,

      // ========================================
      // RELATIONSHIP: Extract Order GUID from lookup
      // ========================================
      orderGuid: dataverse._osot_order_value ?? '',

      // ========================================
      // PRODUCT SNAPSHOT FIELDS
      // ========================================
      osot_product_id: dataverse.osot_product_id ?? '',
      osot_product_name: dataverse.osot_product_name ?? '',
      osot_product_category: dataverse.osot_product_category ?? '0',
      osot_insurance_type: dataverse.osot_insurance_type,
      osot_insurance_limit: dataverse.osot_insurance_limit,
      osot_product_additional_info: dataverse.osot_product_additional_info,

      // ========================================
      // QUANTITY & PRICING
      // ========================================
      osot_quantity: dataverse.osot_quantity ?? 0,
      osot_selectedprice: dataverse.osot_selectedprice ?? 0,
      osot_producttax: dataverse.osot_producttax ?? 0,

      // ========================================
      // CALCULATED AMOUNTS
      // ========================================
      osot_taxamount: dataverse.osot_taxamount ?? 0,
      osot_itemsubtotal: dataverse.osot_itemsubtotal ?? 0,
      osot_itemtotal: dataverse.osot_itemtotal ?? 0,

      // ========================================
      // ACCESS CONTROL: Number → Enum
      // ========================================
      osot_privilege:
        dataverse.osot_privilege !== undefined
          ? (dataverse.osot_privilege as Privilege)
          : undefined,
      osot_access_modifiers:
        dataverse.osot_access_modifiers !== undefined
          ? (dataverse.osot_access_modifiers as AccessModifier)
          : undefined,
    };
  }

  // ========================================
  // INTERNAL → RESPONSE DTO
  // ========================================

  /**
   * Map Internal to Response DTO
   *
   * @param internal - Order Product Internal
   * @returns Order Product Response DTO
   */
  static mapInternalToResponseDto(
    internal: OrderProductInternal,
  ): OrderProductResponseDto {
    return {
      // ========================================
      // SYSTEM FIELDS
      // ========================================
      osot_table_order_productid: internal.osot_table_order_productid ?? '',
      osot_orderproductid: internal.osot_orderproductid,
      orderGuid: internal.orderGuid,
      createdon: internal.createdon?.toISOString(),
      modifiedon: internal.modifiedon?.toISOString(),

      // ========================================
      // PRODUCT SNAPSHOT FIELDS
      // ========================================
      osot_product_id: internal.osot_product_id,
      osot_product_name: internal.osot_product_name,
      osot_product_category: internal.osot_product_category,
      osot_insurance_type: internal.osot_insurance_type,
      osot_insurance_limit: internal.osot_insurance_limit,
      osot_product_additional_info: internal.osot_product_additional_info,

      // ========================================
      // QUANTITY & PRICING
      // ========================================
      osot_quantity: internal.osot_quantity,
      osot_selectedprice: internal.osot_selectedprice,
      osot_producttax: internal.osot_producttax,

      // ========================================
      // CALCULATED AMOUNTS
      // ========================================
      osot_taxamount: internal.osot_taxamount,
      osot_itemsubtotal: internal.osot_itemsubtotal,
      osot_itemtotal: internal.osot_itemtotal,

      // ========================================
      // ACCESS CONTROL
      // ========================================
      osot_privilege: internal.osot_privilege,
      osot_access_modifiers: internal.osot_access_modifiers,
    };
  }

  // ========================================
  // BATCH MAPPING HELPERS
  // ========================================

  /**
   * Map array of Dataverse entities to Internal array
   *
   * @param dataverseArray - Array of Dataverse entities
   * @returns Array of Order Product Internal
   */
  static mapDataverseArrayToInternal(
    dataverseArray: OrderProductDataverse[],
  ): OrderProductInternal[] {
    return dataverseArray.map((dataverse) =>
      this.mapDataverseToInternal(dataverse),
    );
  }

  /**
   * Map array of Internal to Response DTO array
   *
   * @param internalArray - Array of Order Product Internal
   * @returns Array of Order Product Response DTOs
   */
  static mapInternalArrayToResponseDto(
    internalArray: OrderProductInternal[],
  ): OrderProductResponseDto[] {
    return internalArray.map((internal) =>
      this.mapInternalToResponseDto(internal),
    );
  }
}
