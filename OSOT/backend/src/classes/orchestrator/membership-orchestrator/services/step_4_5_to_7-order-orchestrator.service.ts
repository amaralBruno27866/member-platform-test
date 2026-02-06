import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../../redis/redis.service';
import { createAppError } from '../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../common/errors/error-codes';

/**
 * Membership Order Orchestrator Service
 *
 * Handles Steps 4.5-7:
 * - Step 4.5: Create/reuse Order DRAFT
 * - Step 4.6: Add membership product to order
 * - Step 6: Process optional insurance selections
 * - Step 7: Process optional donation selection
 */
@Injectable()
export class MembershipOrderOrchestratorService {
  private readonly logger = new Logger(MembershipOrderOrchestratorService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Create or reuse Order DRAFT and store reference in Redis
   */
  async createOrReuseOrderDraft(
    sessionId: string,
    _userId: string,
    _organizationId: string,
  ): Promise<string> {
    const operationId = `membership_order_draft_${Date.now()}`;

    try {
      // TODO: Implement order draft creation logic
      // For now, generate a temporary order ID
      const orderId = `order_${Date.now()}`;

      await this.redisService.set(
        `membership-orchestrator:order-reference:${sessionId}`,
        orderId,
        { EX: 172800 },
      );

      this.logger.log(
        `✅ Order DRAFT stored in Redis - Order: ${orderId} (Operation: ${operationId})`,
      );

      return orderId;
    } catch (error) {
      this.logger.error(
        `❌ Failed to create/reuse order draft`,
        error instanceof Error ? error.stack : String(error),
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to create or reuse order draft',
        operationId,
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Add membership product to Order DRAFT as line item
   */
  async addMembershipToOrder(
    sessionId: string,
    orderId: string,
    productName: string,
    selectedPrice: number,
    taxRate: number,
    product: Record<string, any>,
  ): Promise<void> {
    const operationId = `add_membership_to_order_${Date.now()}`;

    try {
      this.logger.log(
        `Adding membership to Order ${orderId} - Price: CAD $${selectedPrice} (Operation: ${operationId})`,
      );

      // Calculate amounts
      const itemSubtotal = selectedPrice;
      const taxAmount = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + taxAmount;

      // TODO: Implement order product creation logic
      // Store in Redis for now
      await this.redisService.set(
        `membership-orchestrator:order-product:${sessionId}`,
        JSON.stringify({
          orderId,
          productName,
          selectedPrice,
          taxRate,
          itemSubtotal,
          taxAmount,
          itemTotal,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          productId: product.osot_productid,
        }),
        { EX: 172800 },
      );

      this.logger.log(
        `✅ Membership added to Order - Amount: CAD $${itemTotal.toFixed(2)} (Operation: ${operationId})`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error adding membership to order`,
        error instanceof Error ? error.stack : String(error),
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to add membership to order',
        operationId,
        sessionId,
        orderId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Process optional insurance selections
   */
  async processInsuranceSelections(
    sessionId: string,
    orderId: string,
    insuranceSelections: Array<Record<string, any>>,
  ): Promise<string[]> {
    const operationId = `process_insurances_${Date.now()}`;
    const insuranceGuids: string[] = [];

    try {
      if (!insuranceSelections || insuranceSelections.length === 0) {
        this.logger.log(`No insurance selections to process`);
        return insuranceGuids;
      }

      this.logger.log(
        `Processing ${insuranceSelections.length} insurance selection(s) - Session: ${sessionId}`,
      );

      // Validate uniqueness (no duplicate types)
      const selectedTypes: number[] = [];

      for (const item of insuranceSelections) {
        const insuranceType = item.osot_insurance_type as number;
        selectedTypes.push(insuranceType);
      }

      const uniqueTypes = new Set(selectedTypes);

      if (selectedTypes.length !== uniqueTypes.size) {
        throw createAppError(ErrorCodes.VALIDATION_ERROR, {
          message: 'Duplicate insurance types selected',
          operationId,
          sessionId,
        });
      }

      // TODO: Process each insurance selection
      // Store insurance GUIDs in Redis
      await this.redisService.set(
        `membership-orchestrator:insurance-guids:${sessionId}`,
        JSON.stringify(insuranceGuids),
        { EX: 172800 },
      );

      this.logger.log(
        `✅ ${insuranceGuids.length} insurance(s) processed - Session: ${sessionId}`,
      );
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `❌ Error processing insurance selections`,
        error instanceof Error ? error.stack : String(error),
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to process insurance selections',
        operationId,
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }

    return insuranceGuids;
  }

  /**
   * Process donation selection
   */
  async processDonationSelection(
    sessionId: string,
    orderId: string,
    donationSelection: Record<string, any>,
  ): Promise<void> {
    const operationId = `process_donation_${Date.now()}`;

    try {
      if (!donationSelection || !donationSelection.productGuid) {
        this.logger.log(`No donation selection to process`);
        return;
      }

      this.logger.log(
        `Processing donation selection - Session: ${sessionId}, Product: ${donationSelection.productGuid}`,
      );

      // TODO: Implement donation logic
      // Store in Redis for now
      await this.redisService.set(
        `membership-orchestrator:donation:${sessionId}`,
        JSON.stringify(donationSelection),
        { EX: 172800 },
      );

      this.logger.log(`✅ Donation processed - Session: ${sessionId}`);
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }

      this.logger.error(
        `❌ Error processing donation`,
        error instanceof Error ? error.stack : String(error),
      );

      throw createAppError(ErrorCodes.DATAVERSE_SERVICE_ERROR, {
        message: 'Failed to process donation',
        operationId,
        sessionId,
        originalError: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
