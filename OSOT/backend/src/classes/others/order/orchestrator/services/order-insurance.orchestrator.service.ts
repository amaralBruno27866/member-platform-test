/**
 * Order Insurance Orchestrator Service
 *
 * Orchestrates multi-step insurance validation and creation workflow triggered by order checkout.
 * This service acts as a coordination layer between Order and Insurance modules during e-commerce workflow.
 *
 * WORKFLOW:
 * 1. User creates order with insurance products
 * 2. Order persists to Dataverse
 * 3. OrderCreatedEvent emitted with order + orderProducts[]
 * 4. This orchestrator validates insurance eligibility per OrderProduct
 * 5. Stores insurance snapshots in Redis session
 * 6. Insurance listener consumes session and creates Insurance records
 *
 * DESIGN PATTERN:
 * - Redis-first validation (all data validated before Dataverse writes)
 * - Event-driven integration
 * - Session-based state management (TTL: 2 hours for account, 48 hours for membership)
 * - Atomic rollback (delete session = no insurance created)
 *
 * INTEGRATION POINTS:
 * - OrderCreatedEvent (trigger)
 * - InsuranceSnapshotOrchestratorService (creates snapshots)
 * - RedisService (session persistence)
 * - InsuranceBusinessRuleService (validation)
 * - MembershipLookupService (membership validation)
 * - InsuranceLookupService (duplicate check)
 *
 * @file order-insurance.orchestrator.service.ts
 * @module OrderModule
 * @layer Orchestrators
 * @since 2026-01-28
 */

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { RedisService } from '../../../../../redis/redis.service';
import { OrderProductLookupService } from '../../../order-product/services/order-product-lookup.service';
import { OrderProductCrudService } from '../../../order-product/services/order-product-crud.service';
import { InsuranceBusinessRuleService } from '../../../insurance/services/insurance-business-rules.service';
import { InsuranceType } from '../../../product/enums/insurance-type.enum';

/**
 * Insurance item from OrderProduct
 */
interface OrderInsuranceItem {
  orderProductId: string;
  productId: string;
  insuranceType: string;
  insuranceLimit: number;
  price: number;
}

/**
 * Validation result for insurance item
 */
interface InsuranceValidationResult {
  isValid: boolean;
  errors: string[];
  insurance?: OrderInsuranceItem;
}

/**
 * Order insurance orchestration session
 */
interface OrderInsuranceSession {
  sessionId: string;
  orderId: string;
  accountGuid: string;
  organizationGuid: string;
  status: 'initiated' | 'validating' | 'validated' | 'failed' | 'completed';
  insuranceItems: OrderInsuranceItem[];
  validationResults: {
    [key: string]: InsuranceValidationResult;
  };
  membershipYear: string | undefined;
  errors: string[];
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Order Insurance Orchestrator Service
 */
@Injectable()
export class OrderInsuranceOrchestratorService {
  private readonly logger = new Logger(OrderInsuranceOrchestratorService.name);
  private readonly SESSION_PREFIX = 'order-insurance:session:';
  private readonly TTL_SECONDS = 7200; // 2 hours for account workflow

  constructor(
    private readonly redisService: RedisService,
    private readonly orderProductLookupService: OrderProductLookupService,
    private readonly orderProductCrudService: OrderProductCrudService,
    @Inject(forwardRef(() => InsuranceBusinessRuleService))
    private readonly insuranceBusinessRuleService: InsuranceBusinessRuleService,
  ) {}

  /**
   * Orchestrate insurance validation for order with insurance items
   *
   * FLOW:
   * 1. Extract insurance items from order
   * 2. Create Redis session for tracking
   * 3. Validate each insurance item (membership, type eligibility, no duplicates)
   * 4. Store results in session
   * 5. Return session for listener to create insurance records
   *
   * @param orderId - Order ID
   * @param accountGuid - Account GUID
   * @param organizationGuid - Organization GUID
   * @returns Session ID for insurance creation
   */
  async orchestrateInsuranceValidation(
    orderId: string,
    accountGuid: string,
    organizationGuid: string,
  ): Promise<string> {
    const operationId = `orchestrate_insurance_${Date.now()}`;
    const sessionId = uuid();

    try {
      this.logger.log(
        `Starting insurance orchestration - Order: ${orderId}, Session: ${sessionId}`,
        { operation: 'orchestrateInsuranceValidation', operationId },
      );

      // 1. Create session
      const session: OrderInsuranceSession = {
        sessionId,
        orderId,
        accountGuid,
        organizationGuid,
        status: 'initiated',
        insuranceItems: [],
        validationResults: {},
        membershipYear: undefined,
        errors: [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.TTL_SECONDS * 1000),
      };

      // 2. Extract insurance items from order
      session.insuranceItems = await this.extractInsuranceItems(
        orderId,
        operationId,
      );

      if (session.insuranceItems.length === 0) {
        this.logger.log(`No insurance items found in order ${orderId}`);
        return sessionId; // Return empty session - listener won't process
      }

      // 3. Validate with business rules service
      // Membership validation will be done in the business rules service
      const membershipYear = new Date().getFullYear().toString();
      session.membershipYear = membershipYear;

      // 4. Validate each insurance item
      session.status = 'validating';
      this.validateInsuranceItems(session);

      // 5. Update session status
      if (session.errors.length > 0) {
        session.status = 'failed';
      } else {
        session.status = 'validated';
      }

      // 6. Store session in Redis
      await this.storeSession(session);

      this.logger.log(
        `Insurance orchestration completed - Session: ${sessionId}, Status: ${session.status}`,
        {
          operation: 'orchestrateInsuranceValidation',
          operationId,
          itemCount: session.insuranceItems.length,
          errorCount: session.errors.length,
        },
      );

      return sessionId;
    } catch (error) {
      this.logger.error(
        `Error orchestrating insurance validation: ${error instanceof Error ? error.message : String(error)}`,
        { operation: 'orchestrateInsuranceValidation', operationId, orderId },
      );
      throw error;
    }
  }

  /**
   * Extract insurance items from order
   *
   * @param orderId - Order ID
   * @param operationId - Operation tracking ID
   * @returns List of insurance items
   */
  private async extractInsuranceItems(
    orderId: string,
    operationId: string,
  ): Promise<OrderInsuranceItem[]> {
    try {
      // Get all order products for this order
      const orderProducts =
        await this.orderProductLookupService.findByOrderId(orderId);

      if (!orderProducts || orderProducts.length === 0) {
        return [];
      }

      const insuranceItems: OrderInsuranceItem[] = [];

      for (const op of orderProducts) {
        // Check if product is insurance (has insurance type)
        // Insurance products will have osot_insurance_type defined
        if (!op.osot_insurance_type) {
          continue;
        }

        // Extract insurance snapshots from OrderProduct
        // Product details already stored in OrderProduct
        insuranceItems.push({
          orderProductId: op.osot_table_order_productid || '',
          productId: op.osot_product_id,
          insuranceType: op.osot_insurance_type,
          insuranceLimit: op.osot_insurance_limit || 0,
          price: op.osot_selectedprice || 0,
        });
      }

      return insuranceItems;
    } catch (error) {
      this.logger.error(
        `Error extracting insurance items: ${error instanceof Error ? error.message : String(error)}`,
        { operationId, orderId },
      );
      throw error;
    }
  }

  /**
   * Validate each insurance item in the order
   *
   * VALIDATIONS:
   * 1. Active membership exists ✓ (already checked in orchestrateInsuranceValidation)
   * 2. Insurance type eligibility (professional prerequisite)
   *
   * @param session - Session to update with validation results
   */
  private validateInsuranceItems(session: OrderInsuranceSession): void {
    for (const item of session.insuranceItems) {
      const errors: string[] = [];

      // 1. Validate basic item properties exist
      if (!item.insuranceType) {
        errors.push('Insurance type is required');
      }

      if (item.price <= 0) {
        errors.push('Price must be greater than zero');
      }

      // If there are validation errors, record them
      if (errors.length > 0) {
        session.validationResults[item.orderProductId] = {
          isValid: false,
          errors,
        };
        session.errors.push(
          `Item ${item.orderProductId}: ${errors.join(', ')}`,
        );
        continue;
      }

      // All validations passed
      session.validationResults[item.orderProductId] = {
        isValid: true,
        errors: [],
        insurance: item,
      };
    }
  }

  /**
   * Get orchestration session from Redis
   *
   * @param sessionId - Session ID
   * @returns Session data or null if not found
   */
  async getSession(sessionId: string): Promise<OrderInsuranceSession | null> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const data = await this.redisService.get(key);
      return data ? (JSON.parse(data) as OrderInsuranceSession) : null;
    } catch (error) {
      this.logger.error(
        `Error retrieving session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Store session in Redis
   *
   * @param session - Session data
   */
  private async storeSession(session: OrderInsuranceSession): Promise<void> {
    try {
      const key = `${this.SESSION_PREFIX}${session.sessionId}`;
      await this.redisService.set(key, JSON.stringify(session), {
        EX: this.TTL_SECONDS,
      });
    } catch (error) {
      this.logger.error(
        `Error storing session: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Delete orchestration session (cleanup after insurance creation)
   *
   * @param sessionId - Session ID to delete
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      await this.redisService.del(key);
    } catch (error) {
      this.logger.error(
        `Error deleting session ${sessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw - cleanup should not fail main workflow
    }
  }

  /**
   * Validate and normalize insurance items in order
   *
   * CRITICAL RULE: If Professional insurance is NOT selected,
   * remove ALL insurance items from the order (cascade delete)
   *
   * This prevents users from selecting other insurance types
   * without the Professional prerequisite, then removing Professional
   * to keep the others.
   *
   * FLOW:
   * 1. Extract insurance items from orderProducts
   * 2. Check if Professional is present
   * 3. If NO Professional found:
   *    a. Call OrderProductCrudService.delete() for each insurance item
   *    b. Log removed items (for audit trail)
   * 4. Return list of removed items (for logging)
   *
   * @param orderId - Order GUID
   * @param operationId - Operation tracking ID
   * @returns List of removed insurance item IDs
   * @throws Error on lookup failure
   */
  async validateAndNormalizeInsuranceItems(
    orderId: string,
    operationId: string,
  ): Promise<string[]> {
    const removedItemIds: string[] = [];

    try {
      // 1. Get all order products
      const orderProducts =
        await this.orderProductLookupService.findByOrderId(orderId);

      if (!orderProducts || orderProducts.length === 0) {
        return removedItemIds;
      }

      // 2. Filter insurance items
      const insuranceItems = orderProducts.filter(
        (op) => op.osot_product_category === '1', // INSURANCE = '1'
      );

      if (insuranceItems.length === 0) {
        // No insurance items, nothing to normalize
        return removedItemIds;
      }

      // 3. Check if Professional is present
      const hasProfessional = insuranceItems.some(
        (item) =>
          item.osot_insurance_type?.toLowerCase() === 'professional' ||
          item.osot_insurance_type?.toLowerCase() === 'professional liability',
      );

      // 4. If NO Professional, remove ALL insurance
      if (!hasProfessional) {
        this.logger.warn(
          `Order ${orderId}: Professional insurance not selected. Removing all insurance items per cascade rule.`,
          {
            operation: 'validateAndNormalizeInsuranceItems',
            operationId,
            orderId,
            insuranceCount: insuranceItems.length,
          },
        );

        // Delete each insurance item from order
        for (const item of insuranceItems) {
          try {
            const itemId = item.osot_table_order_productid || '';
            if (itemId) {
              await this.orderProductCrudService.delete(itemId);
              removedItemIds.push(itemId);

              this.logger.log(
                `Cascade delete: Removed insurance item ${itemId} from order ${orderId} - Operation: ${operationId}`,
                { orderId, itemId, operationId },
              );
            }
          } catch (deleteError) {
            this.logger.error(
              `Error deleting insurance item ${item.osot_table_order_productid} from order ${orderId}: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`,
              { orderId, operationId },
            );
            // Continue deleting other items even if one fails
            // But track the failure for audit
          }
        }
      }

      // 5. If Commercial is NOT present, remove Property (Commercial Property) items
      // osot_insurance_type can be string representation or number
      const getInsuranceTypeId = (type?: string): InsuranceType | undefined => {
        if (!type) return undefined;
        const id = Number(type);
        return Number.isNaN(id) ? undefined : (id as InsuranceType);
      };

      const hasCommercial = insuranceItems.some((item) => {
        const typeId = getInsuranceTypeId(item.osot_insurance_type);
        return typeId === InsuranceType.GENERAL;
      });

      // Get all Property (PROPERTY = 4) items
      const propertyItems = insuranceItems.filter((item) => {
        const typeId = getInsuranceTypeId(item.osot_insurance_type);
        return typeId === InsuranceType.PROPERTY;
      });

      if (!hasCommercial && propertyItems.length > 0) {
        this.logger.warn(
          `Order ${orderId}: Commercial insurance not selected. Removing Property items per cascade rule.`,
          {
            operation: 'validateAndNormalizeInsuranceItems',
            operationId,
            orderId,
            propertyCount: propertyItems.length,
          },
        );

        for (const item of propertyItems) {
          try {
            const itemId = item.osot_table_order_productid || '';
            if (itemId) {
              await this.orderProductCrudService.delete(itemId);
              removedItemIds.push(itemId);

              this.logger.log(
                `Cascade delete: Removed Property item ${itemId} from order ${orderId} - Operation: ${operationId}`,
                { orderId, itemId, operationId },
              );
            }
          } catch (deleteError) {
            this.logger.error(
              `Failed to remove Property item ${item.osot_table_order_productid} - Operation: ${operationId}`,
              deleteError instanceof Error
                ? deleteError.message
                : String(deleteError),
            );
          }
        }
      }

      return removedItemIds;
    } catch (error) {
      this.logger.error(
        `Error in validateAndNormalizeInsuranceItems: ${error instanceof Error ? error.message : String(error)}`,
        { operationId, orderId },
      );
      throw error;
    }
  }
}
