/**
 * Insurance Activation Service
 *
 * Dedicated service for activating insurance certificates.
 * Encapsulates business logic for insurance activation during membership registration
 * or other workflows where insurance needs to be activated.
 *
 * Responsibilities:
 * - Validate insurance can be activated (status, data completeness)
 * - Update insurance status to ACTIVE
 * - Emit activation events for audit trails
 * - Handle activation errors gracefully
 *
 * @file insurance-activation.service.ts
 * @module InsuranceModule
 * @layer Services
 */

import { Injectable, Logger, Inject } from '@nestjs/common';
import { Privilege } from '../../../../common/enums';
import {
  InsuranceRepository,
  INSURANCE_REPOSITORY,
} from '../interfaces/insurance-repository.interface';
import { InsuranceBusinessRuleService } from './insurance-business-rules.service';
import { InsuranceStatus } from '../enum/insurance-status.enum';
import { InsuranceEventsService } from '../events/insurance-events.service';

/**
 * Result of insurance activation attempt
 */
export interface InsuranceActivationResult {
  success: boolean;
  insuranceGuid?: string;
  message: string;
  status?: InsuranceStatus;
}

@Injectable()
export class InsuranceActivationService {
  private readonly logger = new Logger(InsuranceActivationService.name);

  constructor(
    @Inject(INSURANCE_REPOSITORY)
    private readonly insuranceRepository: InsuranceRepository,
    private readonly businessRules: InsuranceBusinessRuleService,
    private readonly eventsService: InsuranceEventsService,
  ) {}

  /**
   * Activate insurance certificate by setting status to ACTIVE
   *
   * Business Rules:
   * - Insurance must exist and belong to the organization
   * - Insurance must be in PENDING or DRAFT status (cannot activate EXPIRED/CANCELLED)
   * - All required fields must be populated
   * - User must have appropriate privileges
   *
   * @param insuranceGuid - Insurance certificate GUID to activate
   * @param userPrivilege - User privilege from JWT (MAIN, OWNER, ADMIN)
   * @param organizationGuid - Organization GUID from JWT (required for isolation)
   * @param operationId - Optional operation tracking ID
   * @returns InsuranceActivationResult with success status and message
   *
   * @throws Does NOT throw errors - returns failure result instead for graceful handling
   */
  async activateInsurance(
    insuranceGuid: string,
    userPrivilege: Privilege,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceActivationResult> {
    const opId = operationId || `activate_insurance_${Date.now()}`;

    try {
      this.logger.log(
        `Activating insurance ${insuranceGuid} - Operation: ${opId}`,
      );

      // 1. Validate inputs
      if (!organizationGuid) {
        const message =
          'Organization context is required for insurance activation';
        this.logger.warn(`${message} - Operation: ${opId}`);
        return { success: false, message };
      }

      // 2. Fetch current insurance state
      const current = await this.insuranceRepository.findById(
        insuranceGuid,
        organizationGuid,
        opId,
      );

      if (!current) {
        const message = 'Insurance certificate not found';
        this.logger.warn(`${message} (${insuranceGuid}) - Operation: ${opId}`);
        return { success: false, insuranceGuid, message };
      }

      // 3. Validate current status allows activation
      const currentStatus = current.osot_insurance_status;
      if (
        currentStatus === InsuranceStatus.EXPIRED ||
        currentStatus === InsuranceStatus.CANCELLED
      ) {
        const message = `Cannot activate insurance in ${InsuranceStatus[currentStatus]} status`;
        this.logger.warn(`${message} (${insuranceGuid}) - Operation: ${opId}`);
        return {
          success: false,
          insuranceGuid,
          message,
          status: currentStatus,
        };
      }

      // 4. Check if already active
      if (currentStatus === InsuranceStatus.ACTIVE) {
        const message = 'Insurance is already active';
        this.logger.log(`${message} (${insuranceGuid}) - Operation: ${opId}`);
        return {
          success: true,
          insuranceGuid,
          message,
          status: InsuranceStatus.ACTIVE,
        };
      }

      // 5. Validate business rules for activation
      const validation = this.businessRules.validateInsuranceForUpdate(
        current,
        { osot_insurance_status: InsuranceStatus.ACTIVE },
        userPrivilege,
      );

      if (!validation.isValid) {
        const message = `Insurance activation failed validation: ${validation.errors.join(', ')}`;
        this.logger.warn(`${message} - Operation: ${opId}`);
        return { success: false, insuranceGuid, message };
      }

      // 6. Update status to ACTIVE
      const _updated = await this.insuranceRepository.update(
        insuranceGuid,
        { osot_insurance_status: InsuranceStatus.ACTIVE },
        organizationGuid,
        opId,
      );

      // 7. Emit activation event for audit trail
      this.eventsService.publishInsuranceUpdated({
        insuranceId: insuranceGuid,
        accountGuid: '', // Not available in this context
        organizationGuid,
        changes: {
          new: { osot_insurance_status: InsuranceStatus.ACTIVE },
          old: { osot_insurance_status: currentStatus },
        },
        changedFields: ['osot_insurance_status'],
        timestamp: new Date(),
      });

      this.logger.log(
        `✅ Insurance activated successfully (${insuranceGuid}) - Operation: ${opId}`,
      );

      return {
        success: true,
        insuranceGuid,
        message: 'Insurance activated successfully',
        status: InsuranceStatus.ACTIVE,
      };
    } catch (error) {
      // Graceful error handling - don't throw, return failure result
      const message = `Failed to activate insurance: ${error instanceof Error ? error.message : String(error)}`;
      this.logger.error(
        `❌ ${message} (${insuranceGuid}) - Operation: ${opId}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        success: false,
        insuranceGuid,
        message,
      };
    }
  }

  /**
   * Batch activate multiple insurance certificates
   * Useful for bulk operations or admin workflows
   *
   * @param insuranceGuids - Array of insurance GUIDs to activate
   * @param userPrivilege - User privilege from JWT
   * @param organizationGuid - Organization GUID from JWT
   * @param operationId - Optional operation tracking ID
   * @returns Array of InsuranceActivationResult for each insurance
   */
  async batchActivateInsurances(
    insuranceGuids: string[],
    userPrivilege: Privilege,
    organizationGuid: string,
    operationId?: string,
  ): Promise<InsuranceActivationResult[]> {
    const opId = operationId || `batch_activate_insurance_${Date.now()}`;

    this.logger.log(
      `Batch activating ${insuranceGuids.length} insurances - Operation: ${opId}`,
    );

    const results = await Promise.all(
      insuranceGuids.map((guid) =>
        this.activateInsurance(guid, userPrivilege, organizationGuid, opId),
      ),
    );

    const successCount = results.filter((r) => r.success).length;
    this.logger.log(
      `Batch activation completed: ${successCount}/${insuranceGuids.length} successful - Operation: ${opId}`,
    );

    return results;
  }
}
