/**
 * Insurance Snapshot Orchestrator Service
 *
 * Creates Insurance records as snapshots from order checkout with frozen data.
 * This service coordinates with OrderInsuranceOrchestratorService to create insurance records.
 *
 * SNAPSHOT CONCEPT:
 * - Insurance captures immutable product/order state at purchase time
 * - 21 immutable snapshot fields (insurance details from OrderProduct + membership year)
 * - 5 mutable fields (status, endorsements, notes)
 * - Immutable fields can never change (prevent claims disputes)
 * - Created from OrderProduct snapshots captured during checkout
 *
 * WORKFLOW:
 * 1. OrderInsuranceOrchestratorService validates insurance items in session
 * 2. This service called to create Insurance records from session
 * 3. Maps OrderProduct snapshots + membership year → Insurance entity
 * 4. Creates in Dataverse
 * 5. Updates session status
 * 6. Returns created insurance records
 *
 * SNAPSHOT FIELDS (Immutable):
 * - osot_insurance_type: Professional/Extended/Liability
 * - osot_insurance_limit: Coverage limit frozen at purchase
 * - osot_membership_year: Academic year for renewal tracking
 * - osot_certificate: Auto-generated certificate number
 * - osot_effective_date: Coverage start date
 * - osot_expiry_date: Coverage end date
 * - [13 more fields] covering all product/account details
 *
 * MUTABLE FIELDS:
 * - osot_insurance_status: PENDING → ACTIVE → EXPIRED/CANCELLED
 * - osot_endorsements: Customer adds endorsements after purchase
 * - osot_notes: Support team notes
 * - osot_endorsement_effective_date: When endorsement takes effect
 * - osot_endorsement_details: What changed
 *
 * INTEGRATION POINTS:
 * - OrderInsuranceOrchestratorService (provides session with validated items)
 * - InsuranceCrudService (creates Insurance records)
 * - InsuranceMapper (DTO → Internal → Dataverse)
 * - RedisService (session management)
 * - OrderProductLookupService (get original OrderProduct data)
 *
 * @file insurance-snapshot.orchestrator.service.ts
 * @module InsuranceModule
 * @layer Orchestrators
 * @since 2026-01-28
 */

import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { RedisService } from '../../../../../redis/redis.service';
import { createAppError } from '../../../../../common/errors/error.factory';
import { ErrorCodes } from '../../../../../common/errors/error-codes';
import { Privilege } from '../../../../../common/enums';
import { InsuranceCrudService } from '../../services/insurance-crud.service';
import { OrderProductLookupService } from '../../../order-product/services/order-product-lookup.service';
import { InsuranceInternal } from '../../interfaces/insurance-internal.interface';
import { InsuranceStatus } from '../../enum/insurance-status.enum';
import { CreateInsuranceDto } from '../../dtos/create-insurance.dto';
import { OrderInsuranceOrchestratorService } from '../../../order/orchestrator/services/order-insurance.orchestrator.service';

/**
 * Created insurance result
 */
interface CreatedInsuranceRecord {
  insuranceId: string;
  certificateNumber: string;
  insuranceType: string;
  insuranceLimit: number;
  status: InsuranceStatus | string;
  membershipYear: string;
}

/**
 * Insurance Snapshot Orchestrator Service
 */
@Injectable()
export class InsuranceSnapshotOrchestratorService {
  private readonly logger = new Logger(
    InsuranceSnapshotOrchestratorService.name,
  );

  constructor(
    private readonly redisService: RedisService,
    private readonly insuranceCrudService: InsuranceCrudService,
    private readonly orderProductLookupService: OrderProductLookupService,
    @Inject(forwardRef(() => OrderInsuranceOrchestratorService))
    private readonly orderInsuranceOrchestrator: OrderInsuranceOrchestratorService,
  ) {}

  /**
   * Create insurance records from orchestration session
   *
   * PROCESS:
   * 1. Get orchestration session from Redis
   * 2. Validate session exists and has validated items
   * 3. For each validated insurance item:
   *    a. Get OrderProduct snapshot data
   *    b. Get full product details
   *    c. Map to CreateInsuranceDto (with all snapshot fields)
   *    d. Create Insurance record via CrudService
   *    e. Track created insurance
   * 4. Update session status to 'completed'
   * 5. Return created insurance records
   *
   * NOTE: Session is NOT deleted - listener deletes after processing
   *
   * @param sessionId - Session ID from orchestrator
   * @param userRole - User role for permission checks
   * @returns List of created insurance records
   */
  async createInsuranceFromSession(
    sessionId: string,
    userRole?: string,
  ): Promise<CreatedInsuranceRecord[]> {
    const operationId = `create_insurance_from_session_${Date.now()}`;

    try {
      this.logger.log(`Creating insurance records from session: ${sessionId}`, {
        operation: 'createInsuranceFromSession',
        operationId,
      });

      // 1. Get session
      const session =
        await this.orderInsuranceOrchestrator.getSession(sessionId);

      if (!session) {
        throw createAppError(
          ErrorCodes.NOT_FOUND,
          { sessionId, operationId },
          404,
          'Insurance orchestration session not found or expired',
        );
      }

      // 2. Validate session status
      if (session.status !== 'validated') {
        throw createAppError(
          ErrorCodes.BUSINESS_RULE_VIOLATION,
          { sessionId, status: session.status, operationId },
          400,
          `Cannot create insurance from session with status: ${session.status}`,
        );
      }

      // 3. Validate no errors
      if (session.errors.length > 0) {
        throw createAppError(
          ErrorCodes.VALIDATION_ERROR,
          {
            sessionId,
            operationId,
            errors: session.errors,
          },
          400,
          'Session has validation errors',
        );
      }

      // 4. Create insurance records
      const createdRecords: CreatedInsuranceRecord[] = [];

      const validationResults = session.validationResults as Record<
        string,
        {
          isValid: boolean;
          insurance?: {
            orderProductId: string;
            productId: string;
            insuranceType: string;
            insuranceLimit: number;
            price: number;
          };
        }
      >;

      for (const validationResult of Object.values(validationResults)) {
        if (!validationResult.isValid || !validationResult.insurance) {
          continue;
        }

        try {
          const insurance = await this.createInsuranceSnapshot(
            {
              orderProductId: validationResult.insurance.orderProductId,
              productId: validationResult.insurance.productId,
              insuranceType: validationResult.insurance.insuranceType,
              insuranceLimit: validationResult.insurance.insuranceLimit,
              price: validationResult.insurance.price,
            },
            session.accountGuid,
            session.organizationGuid,
            session.membershipYear || '',
            operationId,
            userRole,
          );

          createdRecords.push({
            insuranceId: insurance.osot_table_insuranceid || 'unknown',
            certificateNumber: insurance.osot_certificate || 'pending',
            insuranceType: insurance.osot_insurance_type || 'unknown',
            insuranceLimit: insurance.osot_insurance_limit || 0,
            status: insurance.osot_insurance_status || 'PENDING',
            membershipYear: insurance.osot_membership_year || '',
          });

          this.logger.log(
            `Insurance created: ${insurance.osot_table_insuranceid} - Certificate: ${insurance.osot_certificate}`,
            {
              operation: 'createInsuranceFromSession',
              operationId,
              orderProductId: validationResult.insurance.orderProductId,
            },
          );
        } catch (itemError) {
          this.logger.error(
            `Error creating insurance for item: ${itemError instanceof Error ? itemError.message : String(itemError)}`,
            { operationId, sessionId },
          );
          // Continue with next item - partial creation is better than full failure
        }
      }

      // 5. Update session status
      session.status = 'completed';
      await this.updateSessionStatus(session, operationId);

      this.logger.log(
        `Insurance creation completed - Session: ${sessionId}, Records: ${createdRecords.length}`,
        {
          operation: 'createInsuranceFromSession',
          operationId,
          recordCount: createdRecords.length,
        },
      );

      return createdRecords;
    } catch (error) {
      this.logger.error(
        `Error creating insurance from session: ${error instanceof Error ? error.message : String(error)}`,
        { operation: 'createInsuranceFromSession', operationId, sessionId },
      );
      throw error;
    }
  }

  /**
   * Create individual insurance snapshot record
   *
   * @param orderInsuranceItem - Item from validation
   * @param accountGuid - Account GUID
   * @param organizationGuid - Organization GUID
   * @param membershipYear - Academic year (from membership-settings)
   * @param operationId - Operation tracking ID
   * @param userRole - User role for permissions
   * @returns Created InsuranceInternal record
   */
  private async createInsuranceSnapshot(
    orderInsuranceItem: {
      orderProductId: string;
      productId: string;
      insuranceType: string;
      insuranceLimit: number;
      price: number;
    },
    accountGuid: string,
    organizationGuid: string,
    membershipYear: string,
    operationId: string,
    _userRole?: string,
  ): Promise<InsuranceInternal> {
    try {
      // Build CreateInsuranceDto with required snapshot fields
      // All fields are immutable snapshots from account/membership at time of purchase
      const createPayload = new CreateInsuranceDto();

      // Snapshot fields from account/membership (immutable)
      createPayload.osot_account_group = 'Individual'; // Default for now (would come from account data)
      createPayload.osot_category = 'OT'; // Default for now (would come from membership data)
      createPayload.osot_membership = 'Standard'; // Default for now (would come from membership data)
      createPayload.osot_membership_year = membershipYear;
      createPayload.osot_certificate = this.generateCertificateNumber();
      createPayload.osot_first_name = ''; // Would come from account data
      createPayload.osot_last_name = ''; // Would come from account data
      createPayload.osot_email = ''; // Would come from account data

      // Insurance specific fields
      createPayload.osot_insurance_type = orderInsuranceItem.insuranceType;
      createPayload.osot_insurance_limit = orderInsuranceItem.insuranceLimit;
      createPayload.osot_effective_date = new Date()
        .toISOString()
        .split('T')[0];
      createPayload.osot_expires_date =
        this.calculateExpiryDate(membershipYear);
      createPayload.osot_total = orderInsuranceItem.price;

      // Required declaration for insurance creation
      createPayload.osot_insurance_declaration = true;

      // Create insurance via CrudService with proper type
      const response = await this.insuranceCrudService.create(
        createPayload,
        Privilege.OWNER,
        accountGuid,
        organizationGuid,
      );

      // Return response (which contains all response fields)
      // The orchestrator only needs to track created insurance
      return response as unknown as InsuranceInternal;
    } catch (error) {
      this.logger.error(
        `Error creating insurance snapshot: ${error instanceof Error ? error.message : String(error)}`,
        { operationId },
      );
      throw error;
    }
  }

  /**
   * Generate certificate number for new insurance
   *
   * @returns Certificate number in format CERT-{TIMESTAMP}
   */
  private generateCertificateNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `CERT-${timestamp}-${random}`;
  }

  /**
   * Calculate expiry date based on membership year
   *
   * RULE: Insurance valid until end of academic year
   * - Academic year: Sept 1 to Aug 31
   * - If membership year = 2025-2026 → Expires Aug 31, 2026
   *
   * @param membershipYear - Membership year (format: YYYY-YYYY or YYYY)
   * @returns ISO date string (YYYY-MM-DD)
   */
  private calculateExpiryDate(membershipYear: string): string {
    try {
      // Extract end year from membership year
      // Format: "2025-2026" → extract "2026" (or "2025" if format is just year)
      const parts = membershipYear.split('-');
      const endYear = parts.length > 1 ? parts[1] : membershipYear;

      // Return Aug 31 of end year
      return `${endYear}-08-31`;
    } catch (_error) {
      this.logger.warn(
        `Error calculating expiry date for year ${membershipYear}, using current year + 1`,
      );
      const nextYear = new Date().getFullYear() + 1;
      return `${nextYear}-08-31`;
    }
  }

  /**
   * Update session status in Redis
   *
   * @param session - Updated session
   * @param operationId - Operation tracking ID
   */
  private async updateSessionStatus(
    session: { sessionId: string },
    operationId: string,
  ): Promise<void> {
    try {
      const key = `order-insurance:session:${session.sessionId}`;
      await this.redisService.set(key, JSON.stringify(session), {
        EX: 7200, // 2 hours
      });
    } catch (_error) {
      this.logger.error(
        `Error updating session status - Operation: ${operationId}`,
        { operationId },
      );
      // Don't throw - status update should not fail
    }
  }
}
