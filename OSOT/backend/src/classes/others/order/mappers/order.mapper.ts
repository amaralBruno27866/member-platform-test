/**
 * Order Mapper
 *
 * Handles transformations between different Order representations:
 * - Dataverse ↔ Internal (OData field names)
 * - Internal → Response DTO (adds computed fields, display names)
 * - Create/Update DTO → Internal (validation → business logic)
 * - Dataverse lookups → Display names
 *
 * Key transformation rules:
 * - Lookup GUIDs: _osot_table_organization_value → organizationGuid
 * - @odata.bind relationships: `/osot_table_organizations(guid)` ← organizationGuid
 * - Enum numbers → Enum values (OrderStatus, PaymentStatus)
 * - DateTime strings → Date objects (createdon)
 *
 * @file order.mapper.ts
 * @module OrderModule
 * @layer Mappers
 * @since 2026-01-22
 */

import { Injectable } from '@nestjs/common';
import { OrderInternal, OrderDataverse } from '../interfaces';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderResponseDto,
  OrderBasicDto,
  OrderProductResponseDto,
} from '../dtos';
import {
  OrderStatus,
  getOrderStatusDisplayName,
} from '../enum/order-status.enum';
import {
  PaymentStatus,
  getPaymentStatusDisplayName,
} from '../enum/payment-status.enum';
import {
  AccessModifier,
  getAccessModifierDisplayName,
  getPrivilegeDisplayName,
  Privilege,
} from '../../../../common/enums';

/**
 * Order Mapper Service
 */
@Injectable()
export class OrderMapper {
  // ========================================
  // DATAVERSE ↔ INTERNAL
  // ========================================

  /**
   * Map Dataverse OData response to Internal representation
   *
   * @param dataverse - Raw OData response from Dataverse
   * @returns OrderInternal
   */
  mapDataverseToInternal(dataverse: OrderDataverse): OrderInternal {
    return {
      // Identifiers
      osot_table_orderid: dataverse.osot_table_orderid,
      osot_orderid: dataverse.osot_orderid,

      // Relationships - Extract GUIDs from lookup values
      organizationGuid: dataverse._osot_table_organization_value,
      accountGuid: dataverse._osot_table_account_value,
      affiliateGuid: dataverse._osot_table_account_affiliate_value,

      // Status - Convert from OData number to enum
      osot_order_status: dataverse.osot_order_status as OrderStatus | undefined,
      osot_payment_status: dataverse.osot_payment_status as
        | PaymentStatus
        | undefined,

      // Access Control
      osot_privilege: this.toPrivilege(dataverse.osot_privilege),
      osot_access_modifiers: this.toAccessModifier(
        dataverse.osot_access_modifiers,
      ),

      // Financial
      osot_subtotal: dataverse.osot_subtotal,
      osot_coupon: dataverse.osot_coupon,
      osot_total: dataverse.osot_total,

      // System Fields - Convert ISO string to Date
      createdon: dataverse.createdon
        ? new Date(dataverse.createdon)
        : undefined,
      modifiedon: dataverse.modifiedon
        ? new Date(dataverse.modifiedon)
        : undefined,
      createdby: dataverse.createdby,
      modifiedby: dataverse.modifiedby,
      ownerid: dataverse.ownerid,
    };
  }

  /**
   * Map Internal representation to Dataverse OData format
   *
   * @param internal - Internal Order representation
   * @returns Partial OrderDataverse for create/update operations
   */
  mapInternalToDataverse(
    internal: Partial<OrderInternal>,
  ): Partial<OrderDataverse> {
    const dataverse: Partial<OrderDataverse> = {};

    // Only map fields that are present (exclude undefined)

    // Identifiers (osot_table_orderid is auto-generated on create)
    if (internal.osot_orderid !== undefined)
      dataverse.osot_orderid = internal.osot_orderid;

    // Relationships - Create @odata.bind format
    if (internal.organizationGuid !== undefined) {
      dataverse['osot_Table_Organization@odata.bind'] =
        `/osot_table_organizations(${internal.organizationGuid})`;
    }

    if (internal.accountGuid !== undefined) {
      dataverse['osot_Table_Account@odata.bind'] =
        `/osot_table_accounts(${internal.accountGuid})`;
    }

    if (internal.affiliateGuid !== undefined) {
      dataverse['osot_Table_Account_Affiliate@odata.bind'] =
        `/osot_table_account_affiliates(${internal.affiliateGuid})`;
    }

    // Status - Keep as enum (Dataverse will convert to OData number)
    if (internal.osot_order_status !== undefined)
      dataverse.osot_order_status = internal.osot_order_status as number;

    if (internal.osot_payment_status !== undefined)
      dataverse.osot_payment_status = internal.osot_payment_status as number;

    // Access Control
    if (internal.osot_privilege !== undefined)
      dataverse.osot_privilege = internal.osot_privilege as number;

    if (internal.osot_access_modifiers !== undefined)
      dataverse.osot_access_modifiers = internal.osot_access_modifiers;

    // Financial
    if (internal.osot_subtotal !== undefined)
      dataverse.osot_subtotal = internal.osot_subtotal;
    if (internal.osot_coupon !== undefined)
      dataverse.osot_coupon = internal.osot_coupon;
    if (internal.osot_total !== undefined)
      dataverse.osot_total = internal.osot_total;

    return dataverse;
  }

  // ========================================
  // DTO → INTERNAL
  // ========================================

  /**
   * Map CreateOrderDto to OrderInternal
   *
   * @param dto - Create order DTO from API request
   * @returns OrderInternal with defaults
   */
  mapCreateDtoToInternal(dto: CreateOrderDto): OrderInternal {
    return {
      // Relationships
      organizationGuid: dto.organizationGuid,
      accountGuid: dto.accountGuid,
      affiliateGuid: dto.affiliateGuid,

      // Status - Apply defaults
      osot_order_status: dto.orderStatus ?? OrderStatus.DRAFT,
      osot_payment_status: dto.paymentStatus ?? PaymentStatus.UNPAID,

      // Access Control
      osot_privilege: dto.privilege,
      osot_access_modifiers: dto.accessModifiers,

      // Financial
      osot_subtotal: dto.subtotal,
      osot_coupon: dto.coupon,
      osot_total: dto.total,
    };
  }

  /**
   * Map UpdateOrderDto to OrderInternal (partial)
   *
   * @param dto - Update order DTO from API request
   * @returns Partial OrderInternal
   */
  mapUpdateDtoToInternal(dto: UpdateOrderDto): Partial<OrderInternal> {
    const internal: Partial<OrderInternal> = {};

    // Only map fields that are present
    if (dto.orderStatus !== undefined)
      internal.osot_order_status = dto.orderStatus;

    if (dto.paymentStatus !== undefined)
      internal.osot_payment_status = dto.paymentStatus;

    if (dto.privilege !== undefined) internal.osot_privilege = dto.privilege;

    if (dto.accessModifiers !== undefined)
      internal.osot_access_modifiers = dto.accessModifiers;

    if (dto.coupon !== undefined) internal.osot_coupon = dto.coupon;

    return internal;
  }

  // ========================================
  // INTERNAL → RESPONSE DTOs
  // ========================================

  /**
   * Map OrderInternal to OrderResponseDto (full)
   *
   * @param internal - Internal order representation
   * @param organizationName - Display name of organization (optional, from expand)
   * @param accountName - Display name of account (optional, from expand)
   * @param affiliateName - Display name of affiliate (optional, from expand)
   * @param products - Order products (optional, from expand)
   * @returns OrderResponseDto
   */
  mapInternalToResponseDto(
    internal: OrderInternal,
    organizationName?: string,
    accountName?: string,
    affiliateName?: string,
    products?: OrderProductResponseDto[],
  ): OrderResponseDto {
    return {
      // Identifiers
      id: internal.osot_table_orderid,
      orderNumber: internal.osot_orderid,

      // Relationships
      organizationGuid: internal.organizationGuid,
      organizationName,
      accountGuid: internal.accountGuid,
      accountName,
      affiliateGuid: internal.affiliateGuid,
      affiliateName,

      // Status - Convert to display names
      orderStatus: internal.osot_order_status
        ? getOrderStatusDisplayName(internal.osot_order_status)
        : undefined,
      paymentStatus: internal.osot_payment_status
        ? getPaymentStatusDisplayName(internal.osot_payment_status)
        : undefined,
      privilege: this.getPrivilegeName(internal.osot_privilege),
      accessModifiers: this.getAccessModifiersName(
        internal.osot_access_modifiers,
      ),

      // Products
      products,

      // Financial
      subtotal: internal.osot_subtotal,
      coupon: internal.osot_coupon,
      total: internal.osot_total,

      // System Fields
      createdOn: internal.createdon?.toISOString(),
      modifiedOn: internal.modifiedon?.toISOString(),
      createdBy: internal.createdby,
      modifiedBy: internal.modifiedby,
      owner: internal.ownerid,
    };
  }

  /**
   * Map OrderInternal to OrderBasicDto (lightweight)
   *
   * @param internal - Internal order representation
   * @param buyerName - Name of account or affiliate (optional)
   * @returns OrderBasicDto
   */
  mapInternalToBasicDto(
    internal: OrderInternal,
    buyerName?: string,
  ): OrderBasicDto {
    return {
      // Identifiers
      id: internal.osot_table_orderid,
      orderNumber: internal.osot_orderid,

      // Status - Convert to display names
      orderStatus: internal.osot_order_status
        ? getOrderStatusDisplayName(internal.osot_order_status)
        : undefined,
      paymentStatus: internal.osot_payment_status
        ? getPaymentStatusDisplayName(internal.osot_payment_status)
        : undefined,

      // Financial
      subtotal: internal.osot_subtotal,
      total: internal.osot_total,

      // Buyer
      buyerName,

      // Dates
      createdOn: internal.createdon?.toISOString(),
    };
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Extract GUID from @odata.bind string
   * Example: "/osot_table_organizations(abc-123)" → "abc-123"
   *
   * @param bindString - OData bind string
   * @returns Extracted GUID or null
   */
  private extractGuidFromBind(bindString: string | undefined): string | null {
    if (!bindString) return null;

    const match = bindString.match(/\(([a-f0-9-]+)\)/i);
    return match ? match[1] : null;
  }

  /**
   * Normalize privilege value coming from Dataverse
   */
  private toPrivilege(value: unknown): Privilege | undefined {
    if (typeof value !== 'number') return undefined;
    return Object.values(Privilege).includes(value as Privilege)
      ? (value as Privilege)
      : undefined;
  }

  /**
   * Normalize access modifier value coming from Dataverse
   */
  private toAccessModifier(value: unknown): number | undefined {
    if (typeof value !== 'number') return undefined;
    return Object.values(AccessModifier).includes(value as AccessModifier)
      ? value
      : undefined;
  }

  /**
   * Get display name for access modifiers
   */
  private getAccessModifiersName(modifier?: number): string | undefined {
    if (modifier === undefined || typeof modifier !== 'number') {
      return undefined;
    }
    if (!Object.values(AccessModifier).includes(modifier as AccessModifier)) {
      return undefined;
    }
    return getAccessModifierDisplayName(modifier as AccessModifier);
  }

  /**
   * Get display name for privilege
   */
  private getPrivilegeName(privilege?: Privilege): string | undefined {
    if (privilege === undefined) return undefined;
    if (!Object.values(Privilege).includes(privilege)) return undefined;
    return getPrivilegeDisplayName(privilege);
  }

  /**
   * Convert OrderStatus enum number to OrderStatus enum
   *
   * @param statusNumber - Enum value as number
   * @returns OrderStatus enum value
   */
  private numberToOrderStatus(
    statusNumber: number | undefined,
  ): OrderStatus | undefined {
    return statusNumber ? (statusNumber as OrderStatus) : undefined;
  }

  /**
   * Convert PaymentStatus enum number to PaymentStatus enum
   *
   * @param statusNumber - Enum value as number
   * @returns PaymentStatus enum value
   */
  private numberToPaymentStatus(
    statusNumber: number | undefined,
  ): PaymentStatus | undefined {
    return statusNumber ? (statusNumber as PaymentStatus) : undefined;
  }
}
