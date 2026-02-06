/**
 * Order Business Rules Service
 *
 * Validates business logic and enforces rules for Order operations.
 * This service is the gatekeeper for all order-related business decisions.
 *
 * RESPONSIBILITIES:
 * - Permission validation (MAIN, ADMIN, OWNER)
 * - Order status transitions (state machine)
 * - Payment status transitions
 * - Field immutability enforcement
 * - Multi-tenant organization isolation
 * - Product quantity validation
 *
 * DESIGN PATTERN:
 * All validation methods return { isValid: boolean, errors: string[] }
 * Controllers should call validation BEFORE calling CrudService
 *
 * @file order-business-rules.service.ts
 * @module OrderModule
 * @layer Services
 * @since 2026-01-22
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { AccessModifier, Privilege } from '../../../../common/enums';
import { OrderRepository } from '../interfaces/order-repository.interface';
import { OrderInternal } from '../interfaces/order-internal.interface';
import { OrderStatus } from '../enum/order-status.enum';
import { PaymentStatus } from '../enum/payment-status.enum';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { UpdateOrderDto } from '../dtos/update-order.dto';

/**
 * Validation result structure
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Order Business Rules Service
 */
@Injectable()
export class OrderBusinessRulesService {
  private readonly logger = new Logger(OrderBusinessRulesService.name);

  constructor(
    @Inject('ORDER_REPOSITORY')
    private readonly orderRepository: OrderRepository,
  ) {}

  // ========================================
  // PERMISSION VALIDATION
  // ========================================

  /**
   * Validate if user can create order
   *
   * RULES:
   * - MAIN: Can create any order
   * - ADMIN: Can create orders within organization
   * - OWNER: Can create own order only (accountGuid = userId)
   *
   * @param userPrivilege - User privilege level
   * @param createDto - Order creation data
   * @param userId - User ID from JWT
   * @param organizationGuid - Organization from JWT
   * @returns Validation result
   */
  validateCreatePermission(
    userPrivilege: Privilege,
    createDto: CreateOrderDto,
    userId: string,
    _organizationGuid: string,
  ): ValidationResult {
    const errors: string[] = [];

    const requestedPrivilege =
      this.resolvePrivilege(createDto.privilege) ?? Privilege.OWNER;
    const requestedAccessModifier =
      this.resolveAccessModifier(createDto.accessModifiers) ??
      AccessModifier.PRIVATE;

    // Only MAIN/ADMIN can explicitly set privilege/access modifier different from defaults
    const isElevatingPrivilege =
      createDto.privilege !== undefined &&
      requestedPrivilege !== Privilege.OWNER;
    const isOpeningAccess =
      createDto.accessModifiers !== undefined &&
      requestedAccessModifier !== AccessModifier.PRIVATE;

    if (
      (isElevatingPrivilege || isOpeningAccess) &&
      userPrivilege < Privilege.ADMIN
    ) {
      errors.push(
        'Only ADMIN or MAIN can set privilege or access modifier when creating orders',
      );
    }

    // User cannot require higher privilege than they hold
    if (userPrivilege < requestedPrivilege) {
      errors.push('User privilege is lower than order required privilege');
    }

    // MAIN can create any order
    if (userPrivilege === Privilege.MAIN) {
      return { isValid: true, errors: [] };
    }

    // ADMIN can create orders within organization
    if (userPrivilege === Privilege.ADMIN) {
      return { isValid: true, errors: [] };
    }

    // OWNER can only create own order
    if (userPrivilege === Privilege.OWNER) {
      // Must provide accountGuid and it must match userId
      if (!createDto.accountGuid) {
        errors.push('Owner must provide accountGuid when creating order');
      } else if (createDto.accountGuid !== userId) {
        errors.push(
          'Owner can only create orders for themselves (accountGuid must match userId)',
        );
      }

      return { isValid: errors.length === 0, errors };
    }

    // Unknown privilege
    errors.push(`Invalid privilege level: ${String(userPrivilege)}`);
    return { isValid: false, errors };
  }

  /**
   * Validate if user can read order
   *
   * RULES:
   * - MAIN: Can read any order
   * - ADMIN: Can read orders within organization
   * - OWNER: Can read only own orders (accountGuid = userId OR affiliateGuid = userAffiliateId)
   *
   * @param userPrivilege - User privilege level
   * @param order - Order to read
   * @param userId - User ID from JWT
   * @returns Validation result
   */
  validateReadPermission(
    userPrivilege: Privilege,
    order: OrderInternal,
    userId: string,
  ): ValidationResult {
    const errors: string[] = [];

    const requiredPrivilege =
      this.resolvePrivilege(order.osot_privilege) ?? Privilege.OWNER;
    const accessModifier =
      this.resolveAccessModifier(order.osot_access_modifiers) ??
      AccessModifier.PRIVATE;

    const isOwner =
      order.accountGuid === userId || order.affiliateGuid === userId;

    // Must satisfy order's required privilege level
    if (userPrivilege < requiredPrivilege) {
      errors.push('Insufficient privilege to read this order');
      return { isValid: false, errors };
    }

    // MAIN and ADMIN can read any order (organization filtering done at repository)
    if (userPrivilege === Privilege.MAIN || userPrivilege === Privilege.ADMIN) {
      return { isValid: true, errors: [] };
    }

    // OWNER can only read own orders
    if (userPrivilege === Privilege.OWNER) {
      if (!isOwner) {
        errors.push('Owner can only read their own orders');
      }

      return { isValid: errors.length === 0, errors };
    }

    // Access modifier enforcement
    if (accessModifier === AccessModifier.PRIVATE) {
      if (userPrivilege < Privilege.ADMIN && !isOwner) {
        errors.push(
          'Private orders are only visible to the owner or ADMIN/MAIN',
        );
      }
    }

    if (accessModifier === AccessModifier.PROTECTED) {
      if (userPrivilege === Privilege.OWNER && !isOwner) {
        errors.push(
          'Protected orders are only visible to the owner or ADMIN/MAIN',
        );
      }
    }

    errors.push(`Invalid privilege level: ${String(userPrivilege)}`);
    return { isValid: false, errors };
  }

  /**
   * Validate if user can update order
   *
   * RULES:
   * - MAIN: Can update any order
   * - ADMIN: Can update orders within organization (manual adjustments)
   * - OWNER: CANNOT update orders directly (must use dedicated endpoints like /cancel)
   *
   * @param userPrivilege - User privilege level
   * @param order - Order to update
   * @returns Validation result
   */
  validateUpdatePermission(
    userPrivilege: Privilege,
    _order: OrderInternal,
  ): ValidationResult {
    const errors: string[] = [];

    // MAIN and ADMIN can update orders
    if (userPrivilege === Privilege.MAIN || userPrivilege === Privilege.ADMIN) {
      return { isValid: true, errors: [] };
    }

    // OWNER cannot update directly
    if (userPrivilege === Privilege.OWNER) {
      errors.push(
        'Owner cannot update orders directly. Use dedicated endpoints like POST /orders/{id}/cancel',
      );
      return { isValid: false, errors };
    }

    errors.push(`Invalid privilege level: ${String(userPrivilege)}`);
    return { isValid: false, errors };
  }

  /**
   * Validate if user can delete order
   *
   * RULES:
   * - MAIN: Can soft delete any order
   * - ADMIN: CANNOT delete (compliance - audit trail must persist)
   * - OWNER: CANNOT delete (compliance)
   *
   * @param userPrivilege - User privilege level
   * @returns Validation result
   */
  validateDeletePermission(userPrivilege: Privilege): ValidationResult {
    const errors: string[] = [];

    // Only MAIN can delete
    if (userPrivilege === Privilege.MAIN) {
      return { isValid: true, errors: [] };
    }

    // Everyone else cannot delete
    errors.push(
      'Only MAIN app can delete orders. ADMIN and OWNER cannot delete for compliance reasons.',
    );
    return { isValid: false, errors };
  }

  // ========================================
  // ORDER STATUS TRANSITIONS (STATE MACHINE)
  // ========================================

  /**
   * Valid order status transitions
   * State machine: DRAFT → SUBMITTED → PENDING_APPROVAL → APPROVED → PROCESSING → COMPLETED
   * Terminal states: COMPLETED, CANCELLED, REFUNDED (cannot transition from these)
   */
  private readonly VALID_ORDER_STATUS_TRANSITIONS: Record<
    OrderStatus,
    OrderStatus[]
  > = {
    [OrderStatus.DRAFT]: [OrderStatus.SUBMITTED, OrderStatus.CANCELLED],
    [OrderStatus.SUBMITTED]: [
      OrderStatus.PENDING_APPROVAL,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.PENDING_APPROVAL]: [
      OrderStatus.APPROVED,
      OrderStatus.CANCELLED,
    ],
    [OrderStatus.APPROVED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [OrderStatus.REFUNDED], // Only can refund completed orders
    [OrderStatus.CANCELLED]: [], // Terminal state
    [OrderStatus.REFUNDED]: [], // Terminal state
  };

  /**
   * Validate order status transition
   *
   * @param currentStatus - Current order status
   * @param newStatus - Desired new status
   * @returns Validation result
   */
  validateOrderStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): ValidationResult {
    const errors: string[] = [];

    // Same status is valid (no-op)
    if (currentStatus === newStatus) {
      return { isValid: true, errors: [] };
    }

    const allowedTransitions =
      this.VALID_ORDER_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      errors.push(
        `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  // ========================================
  // PAYMENT STATUS TRANSITIONS
  // ========================================

  /**
   * Valid payment status transitions
   * State machine: UNPAID → PENDING → PAID → PARTIALLY_REFUNDED → FULLY_REFUNDED
   */
  private readonly VALID_PAYMENT_STATUS_TRANSITIONS: Record<
    PaymentStatus,
    PaymentStatus[]
  > = {
    [PaymentStatus.UNPAID]: [PaymentStatus.PENDING],
    [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.UNPAID], // Can fail and go back
    [PaymentStatus.PAID]: [
      PaymentStatus.PARTIALLY_REFUNDED,
      PaymentStatus.FULLY_REFUNDED,
    ],
    [PaymentStatus.PARTIALLY_REFUNDED]: [PaymentStatus.FULLY_REFUNDED],
    [PaymentStatus.FULLY_REFUNDED]: [], // Terminal state
  };

  /**
   * Validate payment status transition
   *
   * @param currentStatus - Current payment status
   * @param newStatus - Desired new status
   * @returns Validation result
   */
  validatePaymentStatusTransition(
    currentStatus: PaymentStatus,
    newStatus: PaymentStatus,
  ): ValidationResult {
    const errors: string[] = [];

    // Same status is valid (no-op)
    if (currentStatus === newStatus) {
      return { isValid: true, errors: [] };
    }

    const allowedTransitions =
      this.VALID_PAYMENT_STATUS_TRANSITIONS[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      errors.push(
        `Invalid payment status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowedTransitions.join(', ') || 'none (terminal state)'}`,
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  // ========================================
  // FIELD IMMUTABILITY
  // ========================================

  /**
   * Validate immutable fields are not being changed
   *
   * IMMUTABLE FIELDS AFTER CREATION:
   * - organizationGuid (multi-tenant, cannot move orders between orgs)
   * - accountGuid (buyer cannot change)
   * - affiliateGuid (buyer cannot change)
   * - products (use OrderProduct endpoints)
   * - subtotal (auto-calculated)
   * - total (auto-calculated)
   *
   * @param existingOrder - Current order state
   * @param updateDto - Update data
   * @returns Validation result
   */
  validateImmutableFields(
    existingOrder: OrderInternal,
    _updateDto: UpdateOrderDto,
  ): ValidationResult {
    const errors: string[] = [];

    // Note: organizationGuid, accountGuid, affiliateGuid, products, subtotal, total
    // are not in UpdateOrderDto, so they cannot be updated anyway
    // This method exists for future-proofing if DTOs change

    // Additional rule: Cannot update after payment is completed
    if (existingOrder.osot_payment_status === PaymentStatus.PAID) {
      errors.push(
        'Cannot update order after payment is completed (paymentStatus = PAID)',
      );
    }

    // Additional rule: Cannot update terminal order statuses
    const terminalStatuses = [
      OrderStatus.COMPLETED,
      OrderStatus.CANCELLED,
      OrderStatus.REFUNDED,
    ];
    if (terminalStatuses.includes(existingOrder.osot_order_status)) {
      errors.push(
        `Cannot update order in terminal state: ${existingOrder.osot_order_status}`,
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  // ========================================
  // ACCESS CONTROL VALIDATION
  // ========================================

  /**
   * Normalize privilege from unknown input
   */
  private resolvePrivilege(value: unknown): Privilege | undefined {
    if (typeof value !== 'number') return undefined;
    const allowed = Object.values(Privilege).filter(
      (v) => typeof v === 'number',
    ) as Privilege[];
    return allowed.includes(value as Privilege)
      ? (value as Privilege)
      : undefined;
  }

  /**
   * Normalize access modifier from unknown input
   */
  private resolveAccessModifier(value: unknown): AccessModifier | undefined {
    if (typeof value !== 'number') return undefined;
    const allowed = Object.values(AccessModifier).filter(
      (v) => typeof v === 'number',
    ) as AccessModifier[];
    return allowed.includes(value as AccessModifier)
      ? (value as AccessModifier)
      : undefined;
  }

  /**
   * Validate privilege/access modifier updates
   */
  private validateAccessControlUpdate(
    updateDto: UpdateOrderDto,
    userPrivilege: Privilege,
  ): ValidationResult {
    const errors: string[] = [];

    if (updateDto.privilege !== undefined) {
      const requested = this.resolvePrivilege(updateDto.privilege);

      if (requested === undefined) {
        errors.push('Invalid privilege value');
      } else {
        if (userPrivilege < Privilege.ADMIN) {
          errors.push('Only ADMIN or MAIN can change order privilege');
        }

        if (userPrivilege < requested) {
          errors.push('User privilege is lower than order required privilege');
        }
      }
    }

    if (updateDto.accessModifiers !== undefined) {
      const requestedAccess = this.resolveAccessModifier(
        updateDto.accessModifiers,
      );

      if (requestedAccess === undefined) {
        errors.push('Invalid access modifier value');
      } else if (userPrivilege < Privilege.ADMIN) {
        errors.push('Only ADMIN or MAIN can change access modifier');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  // ========================================
  // PRODUCT VALIDATION
  // ========================================

  /**
   * Validate order has minimum product quantity
   *
   * RULES:
   * - Must have at least 1 product
   * - Total quantity must be > 0
   *
   * @param createDto - Order creation data
   * @returns Validation result
   */
  validateProductQuantity(createDto: CreateOrderDto): ValidationResult {
    const errors: string[] = [];

    if (!createDto.products || createDto.products.length === 0) {
      errors.push('Order must have at least 1 product');
    }

    const totalQuantity = createDto.products.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );

    if (totalQuantity <= 0) {
      errors.push('Total product quantity must be greater than 0');
    }

    return { isValid: errors.length === 0, errors };
  }

  // ========================================
  // ORGANIZATION VALIDATION (MULTI-TENANT)
  // ========================================

  /**
   * Validate organization ownership
   *
   * RULES:
   * - User can only create/update/read orders in their organization
   * - Enforces multi-tenant isolation
   *
   * @param orderOrganizationGuid - Organization GUID from order
   * @param userOrganizationGuid - Organization GUID from JWT
   * @returns Validation result
   */
  validateOrganizationOwnership(
    orderOrganizationGuid: string,
    userOrganizationGuid: string,
  ): ValidationResult {
    const errors: string[] = [];

    if (
      orderOrganizationGuid.toLowerCase() !== userOrganizationGuid.toLowerCase()
    ) {
      errors.push(
        'Order does not belong to your organization (multi-tenant isolation)',
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  // ========================================
  // COMPOSITE VALIDATIONS (HIGH-LEVEL)
  // ========================================

  /**
   * Validate order creation (composite validation)
   *
   * Combines all creation validations:
   * - Permission check
   * - Product quantity
   * - Organization ownership
   *
   * @param createDto - Order creation data
   * @param userPrivilege - User privilege level
   * @param userId - User ID from JWT
   * @param organizationGuid - Organization from JWT
   * @param operationId - Operation tracking ID
   * @returns Validation result or throws AppError
   */
  validateOrderCreation(
    createDto: CreateOrderDto,
    userPrivilege: Privilege,
    userId: string,
    organizationGuid: string,
    operationId: string,
  ): ValidationResult {
    const allErrors: string[] = [];

    // 1. Permission validation
    const permissionCheck = this.validateCreatePermission(
      userPrivilege,
      createDto,
      userId,
      organizationGuid,
    );
    allErrors.push(...permissionCheck.errors);

    // 2. Product quantity validation
    const productCheck = this.validateProductQuantity(createDto);
    allErrors.push(...productCheck.errors);

    // 3. Buyer validation (at least one: accountGuid OR affiliateGuid)
    if (!createDto.accountGuid && !createDto.affiliateGuid) {
      allErrors.push(
        'Order must have at least one buyer (accountGuid or affiliateGuid)',
      );
    }

    if (allErrors.length > 0) {
      this.logger.warn(
        `Order creation validation failed for operation ${operationId}`,
        { errors: allErrors },
      );
      return { isValid: false, errors: allErrors };
    }

    this.logger.log(
      `Order creation validation passed for operation ${operationId}`,
    );
    return { isValid: true, errors: [] };
  }

  /**
   * Validate order update (composite validation)
   *
   * Combines all update validations:
   * - Permission check
   * - Order exists
   * - Organization ownership
   * - Immutable fields
   * - Status transitions (if applicable)
   *
   * @param orderId - Order ID to update
   * @param updateDto - Update data
   * @param userPrivilege - User privilege level
   * @param userId - User ID from JWT
   * @param organizationGuid - Organization from JWT
   * @param operationId - Operation tracking ID
   * @returns Validation result or throws AppError
   */
  async validateOrderUpdate(
    orderId: string,
    updateDto: UpdateOrderDto,
    userPrivilege: Privilege,
    userId: string,
    organizationGuid: string,
    operationId: string,
  ): Promise<ValidationResult> {
    const allErrors: string[] = [];

    // 1. Fetch existing order
    const existingOrder = await this.orderRepository.findById(
      orderId,
      organizationGuid,
      operationId,
    );

    if (!existingOrder) {
      allErrors.push(`Order ${orderId} not found`);
      return { isValid: false, errors: allErrors };
    }

    // 2. Permission validation
    const permissionCheck = this.validateUpdatePermission(
      userPrivilege,
      existingOrder,
    );
    allErrors.push(...permissionCheck.errors);

    // 3. Organization ownership validation
    if (existingOrder.organizationGuid) {
      const orgCheck = this.validateOrganizationOwnership(
        existingOrder.organizationGuid,
        organizationGuid,
      );
      allErrors.push(...orgCheck.errors);
    }

    // 4. Immutable fields validation
    const immutableCheck = this.validateImmutableFields(
      existingOrder,
      updateDto,
    );
    allErrors.push(...immutableCheck.errors);

    // 5. Order status transition validation (if updating status)
    if (updateDto.orderStatus) {
      const statusTransition = this.validateOrderStatusTransition(
        existingOrder.osot_order_status,
        updateDto.orderStatus,
      );
      allErrors.push(...statusTransition.errors);
    }

    // 6. Payment status transition validation (if updating payment status)
    if (updateDto.paymentStatus) {
      const paymentTransition = this.validatePaymentStatusTransition(
        existingOrder.osot_payment_status,
        updateDto.paymentStatus,
      );
      allErrors.push(...paymentTransition.errors);
    }

    // 7. Access control updates (privilege/access modifier)
    const accessControlCheck = this.validateAccessControlUpdate(
      updateDto,
      userPrivilege,
    );
    allErrors.push(...accessControlCheck.errors);

    if (allErrors.length > 0) {
      this.logger.warn(
        `Order update validation failed for operation ${operationId}`,
        { orderId, errors: allErrors },
      );
      return { isValid: false, errors: allErrors };
    }

    this.logger.log(
      `Order update validation passed for operation ${operationId}`,
    );
    return { isValid: true, errors: [] };
  }

  /**
   * Validate order deletion
   *
   * @param orderId - Order ID to delete
   * @param userPrivilege - User privilege level
   * @param organizationGuid - Organization from JWT
   * @param operationId - Operation tracking ID
   * @returns Validation result or throws AppError
   */
  async validateOrderDeletion(
    orderId: string,
    userPrivilege: Privilege,
    organizationGuid: string,
    operationId: string,
  ): Promise<ValidationResult> {
    const allErrors: string[] = [];

    // 1. Permission validation
    const permissionCheck = this.validateDeletePermission(userPrivilege);
    allErrors.push(...permissionCheck.errors);

    // 2. Fetch existing order
    const existingOrder = await this.orderRepository.findById(
      orderId,
      organizationGuid,
      operationId,
    );

    if (!existingOrder) {
      allErrors.push(`Order ${orderId} not found`);
      return { isValid: false, errors: allErrors };
    }

    // 3. Organization ownership validation
    if (existingOrder.organizationGuid) {
      const orgCheck = this.validateOrganizationOwnership(
        existingOrder.organizationGuid,
        organizationGuid,
      );
      allErrors.push(...orgCheck.errors);
    }

    if (allErrors.length > 0) {
      this.logger.warn(
        `Order deletion validation failed for operation ${operationId}`,
        { orderId, errors: allErrors },
      );
      return { isValid: false, errors: allErrors };
    }

    this.logger.log(
      `Order deletion validation passed for operation ${operationId}`,
    );
    return { isValid: true, errors: [] };
  }
}
